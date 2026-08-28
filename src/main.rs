mod analyzer;
mod model;

use analyzer::{analyze, overpass_query, parse_gpx};
use axum::{
    extract::{DefaultBodyLimit, Request, State},
    http::{header, HeaderValue, StatusCode},
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use model::{AnalyzeRequest, OverpassResponse};
use serde::{Deserialize, Serialize};
use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
use std::{env, path::Path, sync::Arc, time::Duration};
use tokio::signal;
use tokio::sync::Semaphore;
use tower_http::{
    services::{ServeDir, ServeFile},
    set_header::SetResponseHeaderLayer,
    trace::TraceLayer,
};

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
    let database_url =
        env::var("DATABASE_URL").unwrap_or_else(|_| "sqlite://cycle-legal.sqlite?mode=rwc".into());
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
    tracing::info!(port, build = build_sha(), "server listening");
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown())
        .await
        .expect("serve");
}

fn build_router(state: Arc<AppState>, static_root: impl AsRef<Path>) -> Router {
    let root = static_root.as_ref();
    let index = root.join("index.html");
    let static_service = ServeDir::new(root).not_found_service(ServeFile::new(&index));
    Router::new()
        .route("/health", get(health))
        .route("/api/analyze", post(analyze_route))
        .route("/api/page-view", post(page_view))
        .route_service("/privacy", ServeFile::new(&index))
        .route_service("/terms", ServeFile::new(&index))
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
    let stem = filename.rsplit_once('.').map_or(filename, |(stem, _)| stem);
    let Some(hash) = stem.rsplit('-').next() else {
        return false;
    };
    hash.len() >= 8
        && hash
            .chars()
            .all(|character| character.is_ascii_alphanumeric())
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

struct ApiError(StatusCode, String);
impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        (self.0, Json(ErrorBody { error: self.1 })).into_response()
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

    fn test_state() -> Arc<AppState> {
        Arc::new(AppState {
            client: reqwest::Client::new(),
            db: SqlitePoolOptions::new()
                .connect_lazy("sqlite::memory:")
                .expect("in-memory sqlite URL"),
            overpass_url: "http://127.0.0.1/overpass".into(),
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
            directory.path().join("assets/index-Ab12Cd34.js"),
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
    async fn legal_routes_are_successful_direct_documents() {
        let fixture = static_fixture();
        let app = build_router(test_state(), fixture.path());
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
    async fn response_cache_policy_separates_updates_from_immutable_bundles() {
        let fixture = static_fixture();
        let app = build_router(test_state(), fixture.path());
        for (path, expected) in [
            ("/", "no-cache"),
            ("/sw.js", "no-cache"),
            ("/health", "no-store"),
            (
                "/assets/index-Ab12Cd34.js",
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
        let response = get(&build_router(test_state(), fixture.path()), "/health").await;
        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let payload: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(payload["status"], "ok");
        assert_ne!(payload["build"], "unknown");
        assert_eq!(payload["build"], build_sha());
    }
}
