# Verification 4 — FAIL

**Work order:** `cycle-legal-profile-check-verify-4`  
**Candidate / deployed build:** `494c4cdce10afea0bd5b78e577d4c0a8525b7acf`  
**Live URL:** https://cycle-legal-profile-check.sociobot.in  
**Date:** 2026-08-28

## Decision

**FAIL — do not release this candidate unchanged.** The prior deployment-only
issues are repaired: the live backend identifies the candidate and all sampled
shipped assets match the clean production build. However, the required backend
rate limit is absent on a public write endpoint.

## Release-blocking defect

### P1 — `/api/page-view` has no rate limiting or `Retry-After`

Using a fixed `X-Forwarded-For: 198.51.100.77`, a fresh live burst of **100
POST requests at concurrency 25** to `/api/page-view` returned **100 × 204**.
There were no 429 responses and no `Retry-After` headers, so no threshold was
observed. This endpoint increments the server-side aggregate counter and is
not a health-check exemption. It violates the mandatory contract that every
server endpoint be per-client rate limited and return 429 with `Retry-After`.

Implement a per-client limiter (using the first `X-Forwarded-For` hop at the
factory ingress) around both `/api/page-view` and `/api/analyze`, then add an
automated burst regression that asserts 429 and `Retry-After`.

## Clean-checkout gates

A detached clean clone at the candidate SHA was created in
`/tmp/cycle-legal-qa-4.42F9JP/repo`; `npm ci` installed 85 packages with zero
reported vulnerabilities.

| Check | Result |
| --- | --- |
| `npm test` | PASS — 2 Vitest and 11 Rust tests, including the 100-case accuracy/recall gate |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS — rustfmt and clippy warnings denied |
| `npm run build` | PASS — `dist/` produced |
| `npx playwright test --reporter=list` | PASS — 22/22 desktop and 390 × 844 tests |
| `BUILD_SHA=<candidate> cargo build --release` | PASS — 6.8 MB binary |
| release binary with only `PORT=18081` | PASS — `/health` returned exact SHA; `/api/page-view` 204 |

The PORT-only release run created only SQLite table `counters`, containing the
aggregate `page_views` row after one request. Startup emitted structured JSON
with the port and embedded SHA. Docker/Podman are not available in this worker,
so the Docker image itself could not be executed locally; the Vite build and
Rust release binary were built directly.

Production payload sizes are within the stated budgets: JS 16,060 B raw / 6.55
kB gzip, CSS 11,696 B raw / 3.38 kB gzip, mobile hero 59,794 B, desktop hero
143,378 B, and no web-font payload. Fresh Lighthouse 12.8.2 could not be run:
the installed Playwright Chromium was rejected first without `CHROME_PATH` and
then Lighthouse could not connect to it. No new Lighthouse score is claimed.

## Product and browser evidence

- A real Belgium speed-pedelec GPX check returned HTTP 200, 100% mapped
  coverage, dated `2026-08-01` sources, OSM way/tag links, an explicit
  vehicle-specific **review** state, and limitations rather than legal advice.
- API negative/boundary requests returned actionable 422 errors for malformed
  XML, one point, unsupported vehicle, and unsupported region. An unlicensed
  Netherlands request returned 402. In the live UI, empty submit, malformed
  upload, replacement with the Brussels sample, rendered report, and CSV
  export all worked. The CSV had the expected nine-column header and five data
  rows for the sample report.
- Independent desktop and 390 px Chromium scans found one title/lang/h1/main,
  no horizontal overflow, 44 px-or-larger exposed navigation targets, and a
  4 px visible focus outline on the keyboard skip link. Axe reported **zero
  serious/critical** findings on both viewports. Normal load had no console or
  page errors; the deliberately malformed request caused Chromium's expected
  failed-resource console entry for its 422 response, with no uncaught error.
- Under `prefers-reduced-motion: reduce`, scroll behavior was `auto` and
  animation/transition duration was `0.01ms`. The installed v3 worker
  controlled the page, reloaded the shell offline with its explicit Offline
  notice, and removed a seeded stale cache during a fresh-worker update.
- Initial page-load requests were same-origin only. Source and network review
  found no analytics, third-party fonts, or third-party scripts. GPX is not
  stored; only the aggregate page counter is persisted. License/token handling
  is browser-local and disclosed by `/privacy`. The production checkout is the
  Sociobot endpoint (HTTP 303 to hosted Dodo checkout); a synthetic verification
  token returned `{ valid: false, reason: "invalid" }`. There is no sign-in.

## Deployment identity and response policy

- Live `GET /health` returned HTTP 200 and
  `{"build":"494c4cdce10afea0bd5b78e577d4c0a8525b7acf","status":"ok"}`.
- SHA-256 exactly matched the clean build for hashed JS/CSS, both hero images,
  manifest, service worker, and favicon. Direct `/privacy` and `/terms` both
  return HTTP 200.
- HTML, legal pages, manifest, and service worker are `no-cache`; hashed
  JS/CSS are `public, max-age=31536000, immutable`; health/API are `no-store`.
  Live responses carry CSP, `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, and strict-origin referrer policy. A foreign-origin
  `OPTIONS /api/analyze` returned 405 with no permissive CORS header.

## Required next step

Add and test per-client API rate limiting with a `Retry-After` response, deploy
the repair, and rerun this verification. The candidate otherwise repaired the
previous build-identity, legal-route, caching, and touch-target failures.
