mod analyzer;
mod model;

use analyzer::{analyze, overpass_query, parse_gpx};
use axum::{
    extract::{ConnectInfo, DefaultBodyLimit, Request, State},
    http::{header, HeaderMap, HeaderValue, Request as HttpRequest, StatusCode},
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use model::{AnalyzeRequest, OverpassResponse};
use serde::{Deserialize, Serialize};
use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
use std::{
    env,
    net::{IpAddr, SocketAddr},
    path::Path,
    sync::Arc,
    time::Duration,
};
use tokio::signal;
use tokio::sync::Semaphore;
use tower_governor::{
    governor::GovernorConfigBuilder, key_extractor::KeyExtractor, GovernorError, GovernorLayer,
};
use tower_http::{
    services::{ServeDir, ServeFile},
    set_header::SetResponseHeaderLayer,
    trace::TraceLayer,
};

const API_RATE_LIMIT_BURST: u32 = 40;
const API_RATE_LIMIT_PERIOD_MS: u64 = 50;
const ANALYSIS_BUSY_RETRY_SECONDS: u64 = 1;

/// Extract the original client address supplied by the factory ingress.
///
/// Azure Container Apps can include the source port in the first
/// `X-Forwarded-For` hop. `SmartIpKeyExtractor` accepts a bare IP only, then
/// silently falls back to the changing ingress peer address. That makes one
/// caller appear as many clients. If the trusted ingress header is present we
/// therefore require and normalize its first hop; direct local connections
/// fall back to `ConnectInfo`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct FirstForwardedIpKeyExtractor;

impl KeyExtractor for FirstForwardedIpKeyExtractor {
    type Key = IpAddr;

    fn extract<T>(&self, request: &HttpRequest<T>) -> Result<Self::Key, GovernorError> {
        if let Some(value) = request.headers().get("x-forwarded-for") {
            return value
                .to_str()
                .ok()
                .and_then(first_forwarded_ip)
                .ok_or(GovernorError::UnableToExtractKey);
        }

        request
            .extensions()
            .get::<ConnectInfo<SocketAddr>>()
            .map(|ConnectInfo(address)| address.ip())
            .ok_or(GovernorError::UnableToExtractKey)
    }
}

fn first_forwarded_ip(value: &str) -> Option<IpAddr> {
    let first_hop = value.split(',').next()?.trim().trim_matches('"');
    first_hop
        .parse::<IpAddr>()
        .ok()
        .or_else(|| {
            first_hop
                .parse::<SocketAddr>()
                .ok()
                .map(|address| address.ip())
        })
        .or_else(|| {
            first_hop
                .strip_prefix('[')
                .and_then(|value| value.strip_suffix(']'))
                .and_then(|value| value.parse::<IpAddr>().ok())
        })
}

#[derive(Clone)]
struct AppState {
    client: reqwest::Client,
    db: SqlitePool,
    overpass_url: String,
    billing_base: String,
    analysis_slots: Arc<Semaphore>,
}

#[derive(Serialize)]
struct ErrorBody {
    error: String,
}

#[derive(Deserialize)]
struct VerifyResponse {
    valid: bool,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .json()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive("cycle_legal_profile_check=info".parse().unwrap()),
        )
        .init();
    let supplied_database_url = env::var("DATABASE_URL").ok();
    let database_url = supplied_database_url
        .clone()
        .unwrap_or_else(default_database_url);
    let db = SqlitePoolOptions::new()
        .max_connections(4)
        .connect(&database_url)
        .await
        .expect("connect sqlite");
    sqlx::query("CREATE TABLE IF NOT EXISTS counters (key TEXT PRIMARY KEY, value INTEGER NOT NULL DEFAULT 0)").execute(&db).await.expect("create counters");
    let state = Arc::new(AppState {
        client: reqwest::Client::builder()
            .timeout(Duration::from_secs(24))
            .user_agent("CycleLegalCheck/1.0 (+https://cycle-legal-profile-check.sociobot.in)")
            .build()
            .unwrap(),
        db,
        overpass_url: env::var("OVERPASS_URL")
            .unwrap_or_else(|_| "https://overpass-api.de/api/interpreter".into()),
        billing_base: env::var("BILLING_API_BASE")
            .unwrap_or_else(|_| "https://api.sociobot.in/api/v1".into()),
        analysis_slots: Arc::new(Semaphore::new(8)),
    });
    let app = build_router(state, "dist");
    let port = env::var("PORT")
        .ok()
        .and_then(|value| value.parse().ok())
        .unwrap_or(8080);
    let listener = tokio::net::TcpListener::bind(("0.0.0.0", port))
        .await
        .expect("bind server");
    tracing::info!(
        port,
        build = build_sha(),
        database_config = if supplied_database_url.is_some() {
            "supplied"
        } else {
            "generated default"
        },
        "server listening"
    );
    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .with_graceful_shutdown(shutdown())
    .await
    .expect("serve");
}

fn default_database_url() -> String {
    if Path::new("/data").is_dir() {
        "sqlite:///data/cycle-legal.sqlite?mode=rwc".into()
    } else {
        "sqlite://cycle-legal.sqlite?mode=rwc".into()
    }
}

fn build_router(state: Arc<AppState>, static_root: impl AsRef<Path>) -> Router {
    let root = static_root.as_ref();
    let index = root.join("index.html");
    let not_found = root.join("404.html");
    let static_service = ServeDir::new(root).not_found_service(ServeFile::new(not_found));
    let api_rate_limit = GovernorConfigBuilder::default()
        .per_millisecond(API_RATE_LIMIT_PERIOD_MS)
        .burst_size(API_RATE_LIMIT_BURST)
        .key_extractor(FirstForwardedIpKeyExtractor)
        .use_headers()
        .finish()
        .expect("valid API rate-limit configuration");
    let rate_limit_cleanup = api_rate_limit.limiter().clone();
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(60));
        loop {
            interval.tick().await;
            rate_limit_cleanup.retain_recent();
        }
    });
    let api = Router::new()
        .route("/analyze", post(analyze_route))
        .route("/page-view", post(page_view))
        .layer(GovernorLayer::new(api_rate_limit).error_handler(rate_limit_response));
    Router::new()
        .route("/health", get(health))
        .nest("/api", api)
        .route_service("/", ServeFile::new(&index))
        .route_service("/demo", ServeFile::new(&index))
        .route_service("/privacy", ServeFile::new(&index))
        .route_service("/terms", ServeFile::new(&index))
        .route_service("/404.html", ServeFile::new(root.join("404.html")))
        .fallback_service(static_service)
        .layer(DefaultBodyLimit::max(8 * 1024 * 1024 + 4096))
        .layer(SetResponseHeaderLayer::overriding(header::X_CONTENT_TYPE_OPTIONS, HeaderValue::from_static("nosniff")))
        .layer(SetResponseHeaderLayer::overriding(header::X_FRAME_OPTIONS, HeaderValue::from_static("DENY")))
        .layer(SetResponseHeaderLayer::overriding(header::REFERRER_POLICY, HeaderValue::from_static("strict-origin-when-cross-origin")))
        .layer(SetResponseHeaderLayer::overriding(header::CONTENT_SECURITY_POLICY, HeaderValue::from_static("default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self' https://api.sociobot.in; base-uri 'self'; form-action 'self' https://api.sociobot.in; frame-ancestors 'none'")))
        .layer(middleware::from_fn(response_policy))
        .layer(TraceLayer::new_for_http())
        .with_state(state)
}

fn rate_limit_response(error: GovernorError) -> Response {
    let (status, headers, message) = match error {
        GovernorError::TooManyRequests { wait_time, headers } => {
            let retry_seconds = wait_time.max(1);
            let unit = if retry_seconds == 1 {
                "second"
            } else {
                "seconds"
            };
            let mut headers = headers.unwrap_or_else(HeaderMap::new);
            let retry_value = HeaderValue::from(retry_seconds);
            headers.insert(header::RETRY_AFTER, retry_value.clone());
            headers.insert("x-ratelimit-after", retry_value);
            (
                StatusCode::TOO_MANY_REQUESTS,
                Some(headers),
                format!("Too many requests. Wait {retry_seconds} {unit} and try again."),
            )
        }
        GovernorError::UnableToExtractKey => (
            StatusCode::INTERNAL_SERVER_ERROR,
            None,
            "The client address could not be read. Try again.".into(),
        ),
        GovernorError::Other { code, msg, headers } => (
            code,
            headers,
            msg.unwrap_or_else(|| "The request could not be processed. Try again.".into()),
        ),
    };
    let mut response = (status, Json(ErrorBody { error: message })).into_response();
    if let Some(headers) = headers {
        response.headers_mut().extend(headers);
    }
    response
}

async fn health() -> Json<serde_json::Value> {
    Json(serde_json::json!({ "status": "ok", "build": build_sha() }))
}

fn build_sha() -> &'static str {
    for candidate in [
        option_env!("BUILD_SHA"),
        option_env!("GIT_SHA"),
        option_env!("SOURCE_COMMIT"),
    ]
    .into_iter()
    .flatten()
    {
        if !candidate.is_empty() && candidate != "unknown" && candidate != "dev" {
            return candidate;
        }
    }
    "dev"
}

async fn response_policy(request: Request, next: Next) -> Response {
    let policy = cache_policy(request.uri().path());
    let mut response = next.run(request).await;
    response
        .headers_mut()
        .insert(header::CACHE_CONTROL, HeaderValue::from_static(policy));
    response
}

fn cache_policy(path: &str) -> &'static str {
    if path == "/health" || path.starts_with("/api/") {
        "no-store"
    } else if is_hashed_asset(path) {
        "public, max-age=31536000, immutable"
    } else if path.starts_with("/assets/") || path == "/favicon.svg" {
        "public, max-age=86400"
    } else {
        // HTML, the manifest, and sw.js must always revalidate so updates are safe.
        "no-cache"
    }
}

fn is_hashed_asset(path: &str) -> bool {
    let Some(filename) = path.strip_prefix("/assets/") else {
        return false;
    };
    // Vite's generated JS/CSS names contain content hashes. Rollup uses a
    // URL-safe base64 alphabet, so hashes may contain `_` or `-` as well as
    // letters and digits. Public images keep stable names and use the shorter
    // revalidation policy below.
    (filename.ends_with(".js") || filename.ends_with(".css")) && filename.contains('-')
}

async fn page_view(State(state): State<Arc<AppState>>) -> StatusCode {
    let result = sqlx::query("INSERT INTO counters(key,value) VALUES('page_views',1) ON CONFLICT(key) DO UPDATE SET value=value+1").execute(&state.db).await;
    if result.is_ok() {
        StatusCode::NO_CONTENT
    } else {
        StatusCode::SERVICE_UNAVAILABLE
    }
}

async fn analyze_route(
    State(state): State<Arc<AppState>>,
    Json(input): Json<AnalyzeRequest>,
) -> Result<Json<model::Analysis>, ApiError> {
    let _permit = state.analysis_slots.try_acquire().map_err(|_| {
        ApiError(
            StatusCode::TOO_MANY_REQUESTS,
            "The checker is busy. Wait a moment and try again.".into(),
        )
    })?;
    if input.gpx.len() > 8 * 1024 * 1024 {
        return Err(ApiError(
            StatusCode::PAYLOAD_TOO_LARGE,
            "The GPX is over the 8 MB limit.".into(),
        ));
    }
    let region = input.region.to_uppercase();
    if !matches!(region.as_str(), "BE" | "NL" | "DE") {
        return Err(ApiError(
            StatusCode::UNPROCESSABLE_ENTITY,
            "That regional rule pack is not supported.".into(),
        ));
    }
    if region != "BE" && !verify_paid(&state, input.license.as_deref()).await {
        return Err(ApiError(
            StatusCode::PAYMENT_REQUIRED,
            "A valid maintained-rule-pack license is required for this region.".into(),
        ));
    }
    let (name, points) = parse_gpx(&input.gpx)
        .map_err(|error| ApiError(StatusCode::UNPROCESSABLE_ENTITY, error.to_string()))?;
    let query = overpass_query(&points);
    let map_result = state
        .client
        .post(&state.overpass_url)
        .header(header::CONTENT_TYPE, "application/x-www-form-urlencoded")
        .body(format!("data={}", urlencoding::encode(&query)))
        .send()
        .await;
    let (ways, map_available) = match map_result {
        Ok(response) if response.status().is_success() => {
            match response.json::<OverpassResponse>().await {
                Ok(body) => (body.elements, true),
                Err(error) => {
                    tracing::warn!(%error, "invalid overpass response");
                    (Vec::new(), false)
                }
            }
        }
        Ok(response) => {
            tracing::warn!(status=%response.status(), "overpass error");
            (Vec::new(), false)
        }
        Err(error) => {
            tracing::warn!(%error, "overpass unavailable");
            (Vec::new(), false)
        }
    };
    let report = analyze(name, &points, &ways, &input.vehicle, &region, map_available)
        .map_err(|error| ApiError(StatusCode::UNPROCESSABLE_ENTITY, error.to_string()))?;
    Ok(Json(report))
}

async fn verify_paid(state: &AppState, license: Option<&str>) -> bool {
    let Some(license) = license.filter(|value| !value.trim().is_empty() && value.len() < 4096)
    else {
        return false;
    };
    let url = format!(
        "{}/products/cycle-legal-profile-check/verify?license={}",
        state.billing_base.trim_end_matches('/'),
        urlencoding::encode(license)
    );
    match state.client.get(url).send().await {
        Ok(response) if response.status().is_success() => response
            .json::<VerifyResponse>()
            .await
            .map(|body| body.valid)
            .unwrap_or(false),
        _ => false,
    }
}

#[derive(Debug)]
struct ApiError(StatusCode, String);
impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let mut response = (self.0, Json(ErrorBody { error: self.1 })).into_response();
        if self.0 == StatusCode::TOO_MANY_REQUESTS {
            response.headers_mut().insert(
                header::RETRY_AFTER,
                HeaderValue::from(ANALYSIS_BUSY_RETRY_SECONDS),
            );
        }
        response
    }
}

async fn shutdown() {
    let ctrl_c = async { signal::ctrl_c().await.expect("install Ctrl+C handler") };
    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("install terminate handler")
            .recv()
            .await;
    };
    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();
    tokio::select! { _ = ctrl_c => {}, _ = terminate => {} }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{body::Body, http::Request};
    use tempfile::TempDir;
    use tower::ServiceExt;

    async fn test_state() -> Arc<AppState> {
        let db = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .expect("in-memory sqlite connection");
        sqlx::query(
            "CREATE TABLE counters (key TEXT PRIMARY KEY, value INTEGER NOT NULL DEFAULT 0)",
        )
        .execute(&db)
        .await
        .expect("counter table");
        Arc::new(AppState {
            client: reqwest::Client::new(),
            db,
            overpass_url: "http://127.0.0.1:9/overpass".into(),
            billing_base: "http://127.0.0.1/billing".into(),
            analysis_slots: Arc::new(Semaphore::new(8)),
        })
    }

    fn static_fixture() -> TempDir {
        let directory = tempfile::tempdir().expect("temporary static directory");
        std::fs::create_dir(directory.path().join("assets")).expect("assets directory");
        std::fs::write(
            directory.path().join("index.html"),
            "<main>legal shell</main>",
        )
        .expect("index fixture");
        std::fs::write(directory.path().join("sw.js"), "// service worker")
            .expect("service-worker fixture");
        std::fs::write(
            directory.path().join("404.html"),
            "<main>route not found</main>",
        )
        .expect("404 fixture");
        std::fs::write(
            directory.path().join("robots.txt"),
            "User-agent: *\nAllow: /\n",
        )
        .expect("robots fixture");
        std::fs::write(directory.path().join("sitemap.xml"), "<urlset></urlset>")
            .expect("sitemap fixture");
        std::fs::write(
            directory.path().join("assets/index-Ab12_C34.js"),
            "// bundle",
        )
        .expect("bundle fixture");
        std::fs::write(directory.path().join("assets/hero.webp"), "image").expect("image fixture");
        directory
    }

    async fn get(app: &Router, path: &str) -> Response {
        app.clone()
            .oneshot(Request::builder().uri(path).body(Body::empty()).unwrap())
            .await
            .unwrap()
    }

    #[tokio::test]
    async fn unsupported_region_is_rejected_before_billing() {
        let fixture = static_fixture();
        let app = build_router(test_state().await, fixture.path());
        let request = Request::builder()
            .method("POST")
            .uri("/api/analyze")
            .header(header::CONTENT_TYPE, "application/json")
            .header("x-forwarded-for", "198.51.100.10")
            .body(Body::from(
                serde_json::json!({
                    "gpx": "<gpx><trkpt lat='50' lon='4'/><trkpt lat='50.01' lon='4'/></gpx>",
                    "vehicle": "bicycle",
                    "region": "XX"
                })
                .to_string(),
            ))
            .unwrap();
        let response = app.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::UNPROCESSABLE_ENTITY);
        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        assert_eq!(
            serde_json::from_slice::<serde_json::Value>(&body).unwrap()["error"],
            "That regional rule pack is not supported."
        );
    }

    #[tokio::test]
    async fn gpx_analysis_never_persists_route_data() {
        let state = test_state().await;
        let report = analyze_route(
            State(Arc::clone(&state)),
            Json(AnalyzeRequest {
                gpx: "<gpx><trk><name>Private commute</name><trkseg><trkpt lat='50' lon='4'/><trkpt lat='50.01' lon='4.01'/></trkseg></trk></gpx>".into(),
                vehicle: "bicycle".into(),
                region: "BE".into(),
                license: None,
            }),
        )
        .await
        .expect("valid in-memory analysis");
        assert_eq!(report.0.route_name, "Private commute");
        let counter_rows: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM counters")
            .fetch_one(&state.db)
            .await
            .expect("counter query");
        assert_eq!(
            counter_rows, 0,
            "analysis must not write route data or counters"
        );
        let tables: Vec<String> =
            sqlx::query_scalar("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
                .fetch_all(&state.db)
                .await
                .expect("table query");
        assert_eq!(tables, vec!["counters"]);
    }

    #[tokio::test]
    async fn page_views_persist_only_an_aggregate_counter() {
        let state = test_state().await;
        assert_eq!(
            page_view(State(Arc::clone(&state))).await,
            StatusCode::NO_CONTENT
        );
        assert_eq!(
            page_view(State(Arc::clone(&state))).await,
            StatusCode::NO_CONTENT
        );
        let rows: Vec<(String, i64)> = sqlx::query_as("SELECT key, value FROM counters")
            .fetch_all(&state.db)
            .await
            .expect("counter query");
        assert_eq!(rows, vec![("page_views".into(), 2)]);
    }

    #[tokio::test]
    async fn legal_routes_are_successful_direct_documents() {
        let fixture = static_fixture();
        let app = build_router(test_state().await, fixture.path());
        for path in ["/privacy", "/terms"] {
            let response = get(&app, path).await;
            assert_eq!(response.status(), StatusCode::OK, "{path}");
            assert_eq!(response.headers()[header::CACHE_CONTROL], "no-cache");
            let body = axum::body::to_bytes(response.into_body(), usize::MAX)
                .await
                .unwrap();
            assert_eq!(&body[..], b"<main>legal shell</main>");
        }
    }

    #[tokio::test]
    async fn demo_and_discoverability_routes_are_direct_and_unknown_routes_use_404() {
        let fixture = static_fixture();
        let app = build_router(test_state().await, fixture.path());
        for path in ["/demo", "/robots.txt", "/sitemap.xml", "/404.html"] {
            let response = get(&app, path).await;
            assert_eq!(response.status(), StatusCode::OK, "{path}");
        }

        let response = get(&app, "/missing-route").await;
        assert_eq!(response.status(), StatusCode::NOT_FOUND);
        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        assert_eq!(&body[..], b"<main>route not found</main>");
    }

    #[tokio::test]
    async fn response_cache_policy_separates_updates_from_immutable_bundles() {
        let fixture = static_fixture();
        let app = build_router(test_state().await, fixture.path());
        for (path, expected) in [
            ("/", "no-cache"),
            ("/sw.js", "no-cache"),
            ("/health", "no-store"),
            (
                "/assets/index-Ab12_C34.js",
                "public, max-age=31536000, immutable",
            ),
            ("/assets/hero.webp", "public, max-age=86400"),
        ] {
            let response = get(&app, path).await;
            assert_eq!(response.status(), StatusCode::OK, "{path}");
            assert_eq!(
                response.headers()[header::CACHE_CONTROL],
                expected,
                "{path}"
            );
        }
    }

    #[tokio::test]
    async fn health_never_reports_the_old_unknown_sentinel() {
        let fixture = static_fixture();
        let response = get(&build_router(test_state().await, fixture.path()), "/health").await;
        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let payload: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(payload["status"], "ok");
        assert_ne!(payload["build"], "unknown");
        assert_eq!(payload["build"], build_sha());
    }

    async fn run_fixed_ip_burst(
        app: Router,
        path: &'static str,
        body: &'static str,
        first_hop: &'static str,
        ingress_style_addresses: bool,
    ) -> Vec<Response> {
        let concurrency = Arc::new(Semaphore::new(25));
        let mut tasks = tokio::task::JoinSet::new();
        for request_number in 0..100 {
            let app = app.clone();
            let concurrency = Arc::clone(&concurrency);
            tasks.spawn(async move {
                let _permit = concurrency.acquire_owned().await.expect("burst permit");
                let forwarded_for = if ingress_style_addresses {
                    format!(
                        "{first_hop}:{}, 203.0.113.{}",
                        40_000 + request_number,
                        request_number % 250 + 1
                    )
                } else {
                    format!("{first_hop}, 203.0.113.{}", request_number % 250 + 1)
                };
                let mut request = Request::builder()
                    .method("POST")
                    .uri(path)
                    .header(header::CONTENT_TYPE, "application/json")
                    .header("x-forwarded-for", forwarded_for)
                    .body(Body::from(body))
                    .unwrap();
                if ingress_style_addresses {
                    request.extensions_mut().insert(ConnectInfo(SocketAddr::new(
                        format!("10.0.0.{}", request_number % 250 + 1)
                            .parse()
                            .expect("proxy address"),
                        30_000 + request_number as u16,
                    )));
                }
                app.oneshot(request).await.unwrap()
            });
        }
        let mut responses = Vec::with_capacity(100);
        while let Some(response) = tasks.join_next().await {
            responses.push(response.expect("burst request task"));
        }
        responses
    }

    #[tokio::test]
    async fn fixed_first_forwarded_ip_bursts_are_limited_on_every_api_route() {
        let cases = [
            ("/api/page-view", "{}", StatusCode::NO_CONTENT),
            (
                "/api/analyze",
                r#"{"gpx":"unused","vehicle":"bicycle","region":"XX"}"#,
                StatusCode::UNPROCESSABLE_ENTITY,
            ),
        ];

        for (index, (path, body, accepted_status)) in cases.into_iter().enumerate() {
            let fixture = static_fixture();
            let app = build_router(test_state().await, fixture.path());
            let first_hop = if index == 0 {
                "198.51.100.77"
            } else {
                "198.51.100.78"
            };
            let responses = run_fixed_ip_burst(app, path, body, first_hop, true).await;
            let mut accepted = 0;
            let mut throttled = 0;

            for response in responses {
                if response.status() == accepted_status {
                    accepted += 1;
                    continue;
                }
                assert_eq!(response.status(), StatusCode::TOO_MANY_REQUESTS, "{path}");
                assert!(
                    response.headers().contains_key(header::RETRY_AFTER),
                    "{path}"
                );
                assert!(
                    response.headers()[header::RETRY_AFTER]
                        .to_str()
                        .unwrap()
                        .parse::<u64>()
                        .unwrap()
                        >= 1,
                    "{path} should provide an actionable retry delay"
                );
                assert_eq!(
                    response.headers()[header::CONTENT_TYPE],
                    "application/json",
                    "{path}"
                );
                let body = axum::body::to_bytes(response.into_body(), usize::MAX)
                    .await
                    .unwrap();
                assert!(
                    serde_json::from_slice::<serde_json::Value>(&body).unwrap()["error"]
                        == "Too many requests. Wait 1 second and try again.",
                    "{path}"
                );
                throttled += 1;
            }

            assert!(accepted > 0, "{path} should allow the initial burst");
            assert!(throttled > 0, "{path} should reject an abusive burst");
            assert_eq!(accepted + throttled, 100, "{path}");
        }
    }

    #[test]
    fn forwarded_client_parser_accepts_ingress_address_forms() {
        assert_eq!(
            first_forwarded_ip("198.51.100.77:43120, 10.0.0.4"),
            Some("198.51.100.77".parse().unwrap())
        );
        assert_eq!(
            first_forwarded_ip("[2001:db8::77]:43120, 10.0.0.4"),
            Some("2001:db8::77".parse().unwrap())
        );
        assert_eq!(
            first_forwarded_ip("2001:db8::77, 10.0.0.4"),
            Some("2001:db8::77".parse().unwrap())
        );
        assert_eq!(first_forwarded_ip("unknown, 10.0.0.4"), None);
    }

    #[tokio::test]
    async fn analyzer_capacity_429_has_retry_after() {
        let fixture = static_fixture();
        let state = test_state().await;
        let held_permits = state
            .analysis_slots
            .clone()
            .acquire_many_owned(8)
            .await
            .expect("hold every analyzer permit");
        let app = build_router(state, fixture.path());
        let request = Request::builder()
            .method("POST")
            .uri("/api/analyze")
            .header(header::CONTENT_TYPE, "application/json")
            .header("x-forwarded-for", "198.51.100.90:43120, 10.0.0.4")
            .body(Body::from(
                r#"{"gpx":"unused","vehicle":"bicycle","region":"BE"}"#,
            ))
            .unwrap();

        let response = app.oneshot(request).await.unwrap();
        drop(held_permits);

        assert_eq!(response.status(), StatusCode::TOO_MANY_REQUESTS);
        assert_eq!(response.headers()[header::RETRY_AFTER], "1");
        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        assert_eq!(
            serde_json::from_slice::<serde_json::Value>(&body).unwrap()["error"],
            "The checker is busy. Wait a moment and try again."
        );
    }
}
