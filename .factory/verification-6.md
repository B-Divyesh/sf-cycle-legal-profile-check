# Verification 6 — FAIL

**Candidate:** `cf398da9a630e20b72189b61d1c27e101c93a017`
**Live URL:** <https://cycle-legal-profile-check.sociobot.in>
**Verified:** 2026-08-30
**Method:** independent clean-checkout QA. No product source was changed.

## Decision

**FAIL — do not release unchanged.** The previous deployment-identity problem is
resolved: live `GET /health` returns HTTP 200 and exactly
`{"build":"cf398da9a630e20b72189b61d1c27e101c93a017","status":"ok"}`.
The submitted frontend build also byte-matches the live JS and CSS. However,
the mandatory backend rate-limit contract fails in two independently observed
ways.

### Critical — backend request allowance is not enforceable as deployed

The documented allowance is a burst of **40 requests per client**, replenishing
at **20 requests/second**. On the live deployment, 60 simultaneous `POST
/api/page-view` requests sent over one HTTP/2 connection as one client all
returned **204**, with no `429` response. A separate 200-request, 100-way
concurrent burst likewise returned 200 x 204. This is not an exempt health
route. It means a single client can exceed the documented allowance without
the required enforcement.

Also, a local black-box overload test held the eight analyzer permits with a
deliberately slow local Overpass endpoint, using a distinct forwarded client
address per request so the general limiter could not interfere. The first
eight `POST /api/analyze` calls returned 200 and the ninth returned **429**, but
its response had **no `Retry-After` header**:

```text
[{status: 200, retry: null} × 8,
 {status: 429, retry: null,
  body: {"error":"The checker is busy. Wait a moment and try again."}}]
```

The backend-service contract requires every server endpoint to enforce the
allowance and requires every throttled response to have `Retry-After`. Either
observation is release-blocking; together they conclusively fail it.

## First-read test — PASS

Cold desktop load of the live page showed:

- **What it does:** “Check route access before you ride.”
- **For whom:** “For cyclists with a GPX, find mapped access conflicts before
  the ride.”
- **What to do first:** the visible first-screen link **“Try it with sample
  data →”**, with “Opens a sample report. Nothing is saved to your real data.”

It opens `/demo` in one click. The direct demo immediately contains “Sample
route report,” the dated Brussels evidence, and the persistent “Demo — sample
data, nothing is saved” banner. This satisfies the plain-words and demo
entry-point requirements.

## Claims contract — PASS

`.factory/claims.json` exists and all nine listed commands passed after a
clean `npm ci` (85 packages, zero audit vulnerabilities). Browser claim runs
each reported 2 passed (desktop and mobile); named Rust claims each reported 1
passed.

| Claim id | Declared command | Result |
| --- | --- | --- |
| `demo-sample-report` | `npm run test:e2e -- --grep @claim:demo-sample-report` | PASS |
| `demo-isolation` | `npm run test:e2e -- --grep @claim:demo-isolation` | PASS |
| `csv-export` | `npm run test:e2e -- --grep @claim:csv-export` | PASS |
| `offline-reload` | `npm run test:e2e -- --grep @claim:offline-reload` | PASS |
| `report-evidence` | `npm run test:e2e -- --grep @claim:report-evidence` | PASS |
| `regional-pricing` | `npm run test:e2e -- --grep @claim:regional-pricing` | PASS |
| `license-browser-local` | `npm run test:e2e -- --grep @claim:license-browser-local` | PASS |
| `gpx-not-retained` | `cargo test gpx_analysis_never_persists_route_data` | PASS |
| `aggregate-page-view` | `cargo test page_views_persist_only_an_aggregate_counter` | PASS |

## Local quality gates

| Check | Result | Evidence |
| --- | --- | --- |
| `npm test` | PASS | 2 Vitest + 15 Rust tests passed, including the 100-route labeled corpus. |
| `npm run typecheck` | PASS | `tsc --noEmit` clean. |
| `npm run lint` | PASS | rustfmt plus clippy with warnings denied. |
| `npm run build` | PASS | `dist/` produced; JS 20.08 kB raw / 7.65 kB gzip, CSS 13.47 kB raw / 3.70 kB gzip. |
| `npm run test:e2e` | PASS | 38/38 Chromium desktop and 390 px tests passed in 47.8 s. |
| Rust release build with candidate `BUILD_SHA` | INCONCLUSIVE | The local Cargo release process repeatedly stalled after dependency compilation with no compiler child; it was terminated rather than leave a hung process. The deployed exact candidate is running and returns its exact SHA. |
| Docker image | NOT RUN | Neither `docker` nor Podman is installed in this verifier container. |

## Product-path evidence

- Normal live flow: loaded the Brussels sample, selected speed pedelec, and
  submitted a real server analysis. It returned a caveated **Manual review
  needed** report. Browser requests were only same-origin `/api/page-view` and
  `/api/analyze`; Overpass is correctly disclosed as server-side.
- Invalid GPX: live `POST /api/analyze` with `<broken` returned HTTP 422,
  `{"error":"The GPX is not valid XML."}`. The full browser suite verifies
  malformed-upload replacement and recovery.
- Boundary/recovery UI: no file says “Choose a GPX file or load the sample
  route first.” A file of 8 MiB + 1 byte says “That file is over 8 MB. Export a
  simpler track and try again.” and makes zero analysis requests. An unpaid
  Netherlands request returns HTTP 402 with the valid-license explanation.
- `/demo` makes no API or cross-origin browser request, ignores seeded real
  license storage, and uses the `demo:cycle-legal-profile-check:active`
  namespace. It exports the checklist and survives offline reload with cache
  `cycle-legal-shell-v4` and the Offline notice.
- Live `/`, `/demo`, `/privacy`, `/terms`, `/404.html`, `/robots.txt`,
  `/sitemap.xml`, `/sw.js`, and `/manifest.webmanifest` return 200; an unknown
  route returns 404.

## Privacy, accessibility, and delivery evidence

- Live headers include restrictive CSP, `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `no-cache` HTML/service-worker, and immutable one-year cache headers for
  hashed JS/CSS. The hero is 143,378 bytes desktop and 59,794 bytes mobile;
  initial JS is well below the 200 kB static budget.
- Live browser request logging on `/demo` found no API or cross-origin
  requests. Cold landing has no console/page errors.
- Axe on live `/demo` found **zero serious or critical** violations. At 390 px
  there is no horizontal overflow. Tab first reaches the skip link with a
  visible orange 4 px focus outline. Reduced-motion transitions are reduced to
  `0.01ms`; the hidden native file input is 1 px but its visible labeled drop
  zone is the operable control.
- Lighthouse CLI and Docker are absent from this verifier image, so no local
  Lighthouse score or container execution could be recorded.

## Required fix

Make the limiter shared/effective at the deployed ingress topology (or enforce
it at ingress) so a single client receives 429 after the 40-request burst, and
ensure **all** 429 paths, including the eight-slot analyzer saturation path,
set a truthful `Retry-After` header. Add an end-to-end deployed limiter test
that holds one client identity and asserts the 429/header behavior. Then
rerun this verification against the new SHA.
