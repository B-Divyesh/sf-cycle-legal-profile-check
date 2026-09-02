# Verification report — FAIL

**Work order:** `cycle-legal-profile-check-verify-1`  
**Candidate:** `60bb320c8c5f85eab73841ba0ff6f928f043731c` (`main`)  
**Live URL:** https://cycle-legal-profile-check.sociobot.in  
**Date:** 2026-08-28

## Verdict

**FAIL.** The product’s main GPX workflow is usable and the deployed frontend artifact matches this candidate, but the live backend cannot identify its build and direct legal-page URLs return HTTP 404. Those violate the backend build-identity contract and the requirement for `/privacy` and `/terms` pages.

## Reproduction and local gates

A new detached clean checkout was created at the stated SHA. `npm ci` completed with 0 reported dependency vulnerabilities.

| Check | Result | Evidence |
| --- | --- | --- |
| `npm test` | PASS | Vitest 2/2; Rust analyzer 5/5 |
| `npm run build` | PASS | `dist/` produced |
| `npx tsc --noEmit` | PASS | no diagnostics; there is no lint script or configuration |
| `npm run test:e2e` | PASS | 4/4 Chromium checks (desktop and 390×844 mobile) |
| `cargo build --release` | PASS | native release binary built |
| Docker production-image build | NOT RUN | Docker executable is absent in this worker; this is not reported as a source failure |

Built payloads: JS 16,045 B raw, CSS 11,318 B raw, mobile hero 59,794 B, desktop hero 143,378 B. All are within the stated budgets; no third-party fonts or scripts are loaded.

## End-to-end evidence

- On the live site at 390×844, loaded the Brussels GPX sample, selected **Speed pedelec**, and completed a real check: result **“Manual review needed”**, 5 findings, no console/page errors.
- Empty-submit recovery says “Choose a GPX file or load the sample route first”; loading the sample recovers to “Brussels sample route loaded.”
- Local API probes returned: invalid XML 422, one point 422, unsupported vehicle 422, and an unlicensed Netherlands check 402. The messages explain the corrective action/state.
- Existing browser tests additionally prove the result/evidence view, CSV export control, legal-page rendering, keyboard focus, and mocked prohibited evidence flow.
- Desktop and 390px mobile live smoke: one `h1`, one `main`, expected title, visible skip-link focus ring, no console/page errors. Axe found **0 serious/critical** violations in the live desktop and mobile-reduced-motion scans.
- Reduced-motion CSS removes transitions/continuous animation. The source service worker uses versioned cache `cycle-legal-shell-v2`, `skipWaiting`, `clients.claim`, and a cache fallback. In this worker’s headless Chromium, service-worker registrations were not observable even though `navigator.serviceWorker` is available, so an offline reload could not be conclusively re-executed here.

## Privacy, requests, and response policy

Source and network inspection found no analytics SDK, CDN font, or third-party script. Browser requests are same-origin except user-initiated OSM/legal and Sociobot billing links. The server sends only analysis samples to the configured Overpass endpoint and license tokens to the Sociobot verification endpoint; SQLite stores only the aggregate page counter. GPX is not written to the database.

Live `/` responses include `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Referrer-Policy: strict-origin-when-cross-origin`. Cross-origin OPTIONS to `/api/analyze` returned 405 without permissive CORS headers, as expected for the same-origin API.

The deployed `index.html` SHA-256 is `7b04f6c670ed21f2f5a5c36552384673cc036ad1d2b3413f9179a45b93123c13`, exactly matching this candidate’s production build. It references the same hashed JS/CSS assets.

## Defects

### High

1. **Live build identity is wrong.** `GET https://cycle-legal-profile-check.sociobot.in/health` returns `{"build":"unknown","status":"ok"}` rather than `60bb320c8c5f85eab73841ba0ff6f928f043731c`. The factory backend contract requires `/health` to return the build SHA. This makes an otherwise matching frontend deployment unverifiable and fails the required deployment identity check.

2. **Direct legal routes have 404 status.** `curl -I`/GET to both `https://cycle-legal-profile-check.sociobot.in/privacy` and `/terms` return **404** while serving the SPA document. Client-side rendering masks this after JavaScript loads, but direct links, crawlers, non-JS clients, and HTTP status checks see a missing legal page. These pages must be served with HTTP 200.

3. **A former external accuracy benchmark is unsupported.** The researched brief does not establish that benchmark. It must not be used as a product promise or release criterion; a later controller correction replaces it with a scoped fixture contract.

### Medium

1. **No cache policy on static assets.** Live `index.html`, hashed JS/CSS, images, and `sw.js` responses contain no `Cache-Control` header. This misses the stated long-lived immutable caching requirement for hashed assets and increases repeat-load/update cost. The service worker cache is helpful but is not an HTTP caching policy.

### Informational

- A native release build and all available tests passed. Docker could not be executed because the worker has no `docker` binary; source-level Docker compliance was not substituted for an image test.
- The backend’s 8-slot semaphore and SQLite aggregate-counter boundary were reviewed. No repository integration/load test exercises the production Overpass path or the stated 100-rps behavior.

## Required remediation before re-verification

1. Ensure the deploy build passes `BUILD_SHA=60bb320c8c5f85eab73841ba0ff6f928f043731c` into the Rust compile and verify `/health` on the deployed instance.
2. Configure SPA fallbacks so `/privacy` and `/terms` return 200 (or implement explicit server routes).
3. Set immutable caching for hashed `assets/*`; give HTML and `sw.js` an update-safe policy.
4. Keep the fixture contract scoped to deterministic analyzer behavior and do
   not claim an external legal-accuracy measure.
