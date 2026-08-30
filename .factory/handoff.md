# Cycle Legal Check — repair 6 handoff

## Outcome

The verification-6 release blocker is repaired and deployed at
<https://cycle-legal-profile-check.sociobot.in>. The implementation was first
verified live as commit `c14a7063bf65f79d4a4bb7e594973e30eccefb4a`;
the final handoff commit was then deployed and checked against its own HEAD.

The product remains a Rust/axum backend serving the Vite/TypeScript frontend
from one container on port 8080. The researched brief, visual system, demo,
claims, payment behavior, and previously passing product paths are unchanged.

## Root cause and repair

The previous `SmartIpKeyExtractor` accepted only a bare IP in the first
`X-Forwarded-For` hop. Factory ingress may supply that hop as `IP:source-port`.
The parser then fell through to a changing proxy peer, so requests from one
browser connection could receive separate rate-limit buckets.

- Added `FirstForwardedIpKeyExtractor`. It normalizes bare IPv4/IPv6 and
  IPv4/bracketed-IPv6 socket addresses from the first forwarded hop.
- An invalid present ingress header fails closed. Direct local requests use
  axum `ConnectInfo` only when the header is absent.
- Kept the documented 40-request burst and 20 requests/second refill on both
  `/api/analyze` and `/api/page-view`.
- Every application-generated 429 now gets `Retry-After: 1`, including the
  eight-slot analyzer-capacity response.
- Added a one-session HTTP/2 deployed verifier at `npm run verify:deployed`.
- Pinned the Container App to one replica, so its in-memory per-client buckets
  and SQLite writer cannot be multiplied across replicas.

Exact regressions are in `src/main.rs`:

- `fixed_first_forwarded_ip_bursts_are_limited_on_every_api_route` varies the
  source port and proxy peer for 100 requests while holding one forwarded
  client IP. It asserts 429 JSON and a positive `Retry-After` on both API
  routes. The former extractor does not pass this topology.
- `forwarded_client_parser_accepts_ingress_address_forms` covers IPv4,
  IPv4-with-port, IPv6, bracketed IPv6-with-port, and invalid first hops.
- `analyzer_capacity_429_has_retry_after` occupies all eight analyzer permits,
  calls the real route, and asserts status 429, body text, and
  `Retry-After: 1`.

## Verification evidence

All checks ran on 2026-08-30 from `/work/repo`.

| Check | Result |
| --- | --- |
| Clean install | `npm ci`: 85 packages installed, 0 vulnerabilities. |
| Unit/integration | `npm test`: 2 Vitest and 17 Rust tests passed. |
| Type and lint | `npm run typecheck` passed; `npm run lint` passed rustfmt and clippy with warnings denied. |
| Production outputs | `npm run build` passed; JS 20.08 kB raw / 7.65 kB gzip, CSS 13.47 kB raw / 3.70 kB gzip. |
| Native release | `BUILD_SHA=local-repair-6 cargo build --release` passed in 2m39s. |
| Browser suite | `npm run test:e2e`: 38/38 passed in desktop Chromium and 390×844 mobile Chromium. |
| Claims | Every command in `.factory/claims.json` passed: seven browser claims passed in both viewports and two named Rust claims passed. |
| Local ingress regression | A 60-request concurrent network burst with one client IP, varied source ports, and varied proxy hops returned 46×204 and 14×429; every 429 had `Retry-After: 1`. |
| URL verifier | Factory `verify-url.sh` passed locally in 535 ms and live in 537 ms: no console/page errors, valid title/lang/main, one h1, no missing alt text, and no unnamed buttons. |
| Accessibility | Playwright axe scans found 0 serious/critical findings on landing and demo in both viewports. Live keyboard focus began on the skip link; both viewports had no overflow and no active motion under reduced-motion. |
| Lighthouse mobile | Performance 100, accessibility 100, best practices 100, SEO 100; LCP 1.2 s, CLS 0, TBT 10 ms. |
| Offline/update | Fresh live desktop and mobile contexts installed the service worker, reloaded `/demo` offline, retained the sample report, and showed the Offline notice. HTML and `sw.js` use `no-cache`; hashed bundles use one-year immutable caching. |
| Privacy | Live `/demo` made no API or cross-origin requests, kept only the demo namespace, and reported no console errors. Cross-origin API preflight returned 405 with no permissive CORS header. |
| API behavior | A live Brussels speed-pedelec check returned 200, review verdict, five findings, and source date `2026-08-01`. Invalid XML and region returned 422; unpaid Netherlands returned 402. All API responses used `no-store`. |
| Response policy | Live CSP, nosniff, frame denial, strict referrer policy, and cache policies passed. Product/legal/crawler/PWA routes returned 200; an unknown route returned 404. |
| Artifact parity | Live JS SHA-256 `9cb8b652a5c25710065244cb6882e4eea3db22d227a504498d6e1b5ed8743205` and CSS SHA-256 `34a81448b9d86918de90220fbd533e019651becb2c5477cdd3a88f74a2f2fef0` match local `dist/`. |
| Load smoke | One live HTTP/2 session completed 100 concurrent health requests with 100×200 in 43 ms (2,341.6 requests/second). Health is intentionally limiter-exempt. |

## Deployment evidence

- Factory ACR build run `ch1g3` completed successfully from repair commit
  `c14a7063bf65f79d4a4bb7e594973e30eccefb4a`.
- Active revision: `sf-cycle-legal-profile-check--0000013`, healthy, 100% of
  traffic, min/max replicas `1/1`.
- Live `/health` returned exactly
  `{"build":"c14a7063bf65f79d4a4bb7e594973e30eccefb4a","status":"ok"}`.
- `EXPECTED_BUILD_SHA=c14a7063bf65f79d4a4bb7e594973e30eccefb4a npm run verify:deployed`
  used one HTTP/2 session for 60 simultaneous page-view requests and returned
  exactly 40×204 plus 20×429; all throttled responses had `Retry-After: 1`.

## Known limits

- The checker remains a planning aid. OSM data, signs, and local orders can
  change route access; the interface keeps these caveats visible.
- Docker/Podman is not installed in this worker. The unchanged multi-stage,
  non-root Dockerfile was instead built successfully by the deployment ACR.
- No paid checkout was completed. The existing mocked license, revocation,
  browser-storage, pricing, and merchant-of-record coverage all passed.
- Package/consumer verification does not apply to this web-with-backend
  artifact. The product has no runtime AI feature, so no model identity or
  spend check applies.
