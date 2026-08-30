# Cycle Legal Check — verification 5 handoff

## Current independent verification outcome

**FAIL — do not release candidate `2dfcb1df95813a5ee521df3df816f6c79dbeb5f9` unchanged.**

Independent verification on 2026-08-30 used a clean clone at the exact commit
and the live deployment at <https://cycle-legal-profile-check.sociobot.in>.
The deployment is genuinely this candidate (`/health` reports the exact SHA and
the live JS/CSS/hero hashes match a fresh build). Local unit/type/lint/build/
release and Playwright gates pass; live analysis, accessibility smoke checks,
PWA offline/update, privacy request logging, response headers, cache policy,
and the 40-burst/20-rps API limiter all pass.

The candidate is nevertheless release-blocked because `.factory/claims.json`
does not exist and there are therefore no mandatory demo-entry claim tests.
It also has no one-click isolated demo: the hero only scrolls to the form,
“Use Brussels sample route” is a second action, `?demo=1` is the ordinary app,
and no demo banner/reset/separate `demo:` storage exists. Required
`.factory/demo.md`, `.factory/copy-audit.md`, robots, sitemap, and designed 404
route are also absent. Full evidence and reproduction details are in
`.factory/verification-5.md`.

No product code was changed by this verifier. This current outcome supersedes
the historical builder handoff below.

---

# Historical builder handoff — release repair 4

## Outcome

PASS. The release-blocking finding in `.factory/verification-4.md` for candidate
`494c4cdce10afea0bd5b78e577d4c0a8525b7acf` was reproduced, repaired, covered,
pushed, and deployed. The deployed repair is
`6945f9aa2ce4dc49dc0426dfb0c99e3b0fa6bb77` at
<https://cycle-legal-profile-check.sociobot.in>.

## Reproduction and root cause

Before any product change, a local release-equivalent server received 100 POSTs
to `/api/page-view` at concurrency 25 with fixed
`X-Forwarded-For: 198.51.100.77`. All 100 returned 204. A follow-up response had
no `Retry-After` header. This matched the independent verifier exactly.

The server had only an eight-slot analysis semaphore. That controlled concurrent
Overpass work but did not limit requests per client. `/api/page-view` had no
limiter at all, and `/api/analyze` had no client-keyed request quota.

## Repairs

1. Added `tower_governor` around the complete `/api` router. Both public API
   endpoints now allow a 40-request burst per client and replenish at 20
   requests per second. `/health` remains exempt.
2. The limiter uses `SmartIpKeyExtractor`, whose first source is the first valid
   `X-Forwarded-For` hop supplied by factory ingress. Direct local requests fall
   back to connection peer IP through Axum `ConnectInfo`.
3. Throttled requests return HTTP 429 as JSON with a positive `Retry-After` and
   rate-limit headers. The message tells the user when to retry, and the existing
   analysis UI can parse it through its normal JSON error path.
4. Expired in-memory client keys are cleaned every 60 seconds. The privacy page
   now discloses this brief in-memory IP use and confirms IPs are not stored in
   SQLite.
5. Changed the Docker builder from a pinned Rust minor to `rust:1-alpine`, as
   required for factory ACR builds. The multi-stage, non-root, PORT-only
   deployment class is unchanged.

The researched scope, rule packs, free tier, payment contract, CSV export,
evidence/caveat behavior, PWA behavior, and visual system are unchanged.

## Exact regression coverage

`tests::fixed_first_forwarded_ip_bursts_are_limited_on_every_api_route` in
`src/main.rs` sends 100 requests at concurrency 25 to each API route. Every
request keeps the first forwarded IP fixed while varying the downstream proxy
hop. It asserts:

- the initial burst is accepted;
- later requests return 429 on both `/api/page-view` and `/api/analyze`;
- every 429 includes a positive `Retry-After`;
- every 429 is JSON with the exact actionable error;
- no response falls outside the expected accepted or throttled statuses.

Existing route, classifier, GPX, source-link, legal-page, caching, build-identity,
upload, recovery, export, keyboard, touch, responsive, Axe, payment-state, and
offline regressions remain green.

## Clean local verification

Run from the repository root:

```sh
cargo clean
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
BUILD_SHA=<commit> cargo build --release
```

Results on 2026-08-30:

- `npm ci`: 85 packages installed, zero vulnerabilities.
- `npm test`: 2/2 Vitest tests and 12/12 Rust tests passed, including the exact
  100-request dual-endpoint regression and the 100-case classifier gate.
- TypeScript typecheck passed. Rustfmt and clippy with warnings denied passed.
- Vite production build passed: JS 16,169 B raw / 6.60 kB gzip; CSS 11,696 B
  raw / 3.38 kB gzip; mobile hero 59,794 B; desktop hero 143,378 B.
- Playwright 1.58.2: 22/22 tests passed across desktop Chromium and 390 × 844
  mobile, including keyboard, touch targets, Axe, offline reload, cache policy,
  real `File` upload, malformed-upload recovery, and legal routes.
- A release binary started with an empty environment except `PORT`, created its
  SQLite store, served the product, and reported its embedded build identity.
- Local fixed-IP bursts produced exactly 40 accepted and 60 throttled responses
  on both API routes; each throttle had `Retry-After: 1` and JSON content.
- Factory `verify-url.sh`: HTTP 200, 600 ms load, no console/page errors,
  title/lang/one h1/main/alt/button checks passed.
- Local Lighthouse 12.8.2: Performance 97, Accessibility 100, Best Practices
  100, SEO 100; FCP 1.1 s, LCP 2.3 s, TBT 130 ms, CLS 0.

Package/consumer checks do not apply to this `web-with-backend` container
artifact. Docker and Podman are unavailable in the worker, so no local image-run
result is claimed.

## Deployment and live verification

Pushed commits `b2345920d799f7c4394713a7eb728436e9d3da60` and
`6945f9aa2ce4dc49dc0426dfb0c99e3b0fa6bb77` to `origin/main`. Then ran:

```sh
/opt/fleet/lib/deploy-container.sh cycle-legal-profile-check /work/repo Dockerfile 8080
```

Azure ACR build `ch1cc` succeeded in 6m37s. The factory deployed image tag
`sf-cycle-legal-profile-check:6945f9aa2ce4`. Live evidence:

- `/health` returns HTTP 200 and exact build
  `6945f9aa2ce4dc49dc0426dfb0c99e3b0fa6bb77`.
- The verifier-equivalent live `/api/page-view` burst returned 44 × 204 and
  56 × 429. The live `/api/analyze` burst returned 41 × expected 422 and
  59 × 429. Replenishment during the run accounts for the accepted count above
  the burst capacity. Both returned `Retry-After: 1`, JSON content, and the
  actionable error body on throttles.
- Factory `verify-url.sh`: HTTP 200, 580 ms load, no console/page errors, correct
  title/lang, one h1, main landmark, complete alt text, and labeled buttons.
- Independent live desktop and 390 px Chromium flows loaded the Brussels sample
  and rendered honest review reports. Both had no horizontal overflow, no
  console/page errors, same-origin-only initial requests, correct skip-link
  keyboard focus, and zero serious/critical Axe findings on landing, report,
  privacy, and terms states.
- Service-worker update removed a seeded stale cache, retained only
  `cycle-legal-shell-v3` with seven shell entries, controlled the page, and
  reloaded with the explicit Offline notice while the browser was offline.
- SHA-256 matched the clean build for hashed JS/CSS, service worker, manifest,
  favicon, and both responsive hero images.
- HTTP redirects permanently to HTTPS. `/privacy` and `/terms` return 200.
  HTML/service-worker responses are `no-cache`, hashed assets are one-year
  immutable, and health/API responses are `no-store`. CSP, `nosniff`, frame
  denial, and strict-origin referrer policy are present. A foreign-origin API
  preflight returns 405 with no permissive CORS header.
- Live negative requests return the intended 422 malformed-GPX and unsupported-
  region messages; an unlicensed Netherlands request returns 402.
- Production checkout returns 303 to hosted Dodo checkout, the public verifier
  returns a structured invalid result for a synthetic token, and Germany's
  maintained official source returns 200.
- Live Lighthouse 12.8.2: Performance 100, Accessibility 100, Best Practices
  100, SEO 100; FCP 0.9 s, LCP 1.7 s, TBT 20 ms, CLS 0.

## Known limits

- No real purchase or refund was submitted because that would create a monetary
  transaction. The hosted checkout, exact client contract, restore, cache,
  revocation, and refund behavior remain covered without spending money.
- Public Overpass results vary with availability and map data. The two live
  viewport checks observed 100% and 0% mapped coverage respectively, and both
  returned the designed manual-review state instead of claiming legal clearance.
- The local worker has no Docker or Podman binary. The exact final Dockerfile was
  nevertheless built successfully by ACR and is the running production image.

No verifier finding, including minor findings, remains open.
