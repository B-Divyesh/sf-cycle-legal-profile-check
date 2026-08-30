# Verification 5 — FAIL

**Candidate / deployed build:** `2dfcb1df95813a5ee521df3df816f6c79dbeb5f9`  
**Live URL:** <https://cycle-legal-profile-check.sociobot.in>  
**Verified:** 2026-08-30  
**Method:** independent clean clone at the exact SHA; no product code changed.

## Decision

**FAIL — do not release this candidate unchanged.** The live deployment is the
tested candidate and its core analyzer works, but it fails two explicit,
release-blocking acceptance requirements before functional quality is even
considered:

1. **Critical — missing claims contract.** `.factory/claims.json` is absent in
   both the clean checkout and the candidate workspace. Consequently there are
   no required demo-entry claim tests to run. The factory claims contract makes
   a missing manifest release-blocking. This also leaves visible and README
   reliance claims (for example, GPX files are not retained, page views are
   aggregate-only, offline reload, CSV export, and license behavior) without
   their required observable sandbox tests.
2. **Critical — no one-click isolated demo.** A cold live visit has a hero link
   labelled **“Start a free check”** which merely scrolls to the form. The
   visitor must make a second click on **“Use Brussels sample route”** and then
   click **“Check this route.”** There is no first-screen **“Try it with sample
   data”** action. `/?demo=1` renders the ordinary app: it has no demo banner,
   no Reset demo control, no `demo:` storage namespace, and no isolated sample
   tenant. `.factory/demo.md` is also absent. This violates the mandatory
   first-read and demo-sandbox contract.

## First-read test (cold live page)

The first screen says “Your route has rules. Surface them.” and explains that
it audits a GPX against bicycle, e-bike, and speed-pedelec access tags. It is
aimed at people planning a ride, but it does not name cyclists/riders as plainly
as the work order requires. The only prominent action is “Start a free check,”
which scrolls rather than trying sample data. The real sample action is below
the fold and needs further actions. Therefore the first screen fails the
required one-click sample test regardless of the otherwise useful explanation.

## Clean-checkout gates

Clean clone: `/tmp/cycle-legal-profile-check-qa.fRks4I`, checked out at the
candidate SHA, with `npm ci` (85 packages; audit reported zero
vulnerabilities).

| Check | Result | Evidence |
|---|---|---|
| Every `.factory/claims.json` test via demo entry point | **BLOCKED / FAIL** | Manifest does not exist; there are zero declared tests to run. |
| `npm test` | PASS | 2 Vitest + 12 Rust tests passed, including the 100-case classifier guard and API limiter tests. |
| `npm run typecheck` | PASS | `tsc --noEmit` clean. |
| `npm run lint` | PASS | `cargo fmt --check` and clippy with warnings denied passed. |
| `npm run build` | PASS | `dist/` produced; JS 16,169 B raw / 6.60 kB gzip and CSS 11,696 B raw / 3.38 kB gzip. |
| `npx playwright test --reporter=list` | PASS | 22 Chromium desktop/390 px tests completed; the six checkout/license tests were additionally re-run and passed 6/6. |
| `BUILD_SHA=<candidate> cargo build --release` | PASS | Release binary built (6.9 MB). |
| Release runtime with only `PORT` | PASS | `env -i PORT=18081 ...` served `/health` with the exact SHA and returned 200 for `/privacy` and `/terms`. |
| Docker image | NOT RUN | No `docker` or Podman executable is present in this verifier environment. |

At the local release endpoint, a one-point GPX returned the intended HTTP 422
error (“needs at least two valid … points”), while an over-8-MB payload returned
413. The repository Playwright suite covers malformed-file replacement and
recovery. These are passing behaviors, not substitutes for the missing demo.

## Independent live product evidence

- `GET /health` returned HTTP 200, `Cache-Control: no-store`, and
  `{"build":"2dfcb1df95813a5ee521df3df816f6c79dbeb5f9","status":"ok"}`.
- SHA-256 of the live JS, CSS, and desktop hero image exactly matched the clean
  production build: `bc13d7…38cb`, `a11a9a…e121`, and `ccb23b…bd68`.
- On desktop and 390 x 844 mobile, the Brussels sample completed with HTTP 200
  and displayed a dated, caveated report. A malformed GPX displayed “The GPX
  is not valid XML. Try again or use a smaller GPX.” No horizontal overflow or
  page errors occurred. The expected HTTP-422 fetch appears as a browser
  resource-error console line during that negative test; the cold page itself
  had no console or page errors.
- Fresh-context request logs for cold load and the sample flow contained only
  same-origin browser requests (`/`, local assets, `/api/page-view`, and
  `/api/analyze`). The privacy page accurately discloses that the server then
  queries Overpass. This is positive privacy evidence, but it is not a required
  claim test because the claim manifest is missing.
- Live response headers include a restrictive CSP, `nosniff`, `DENY` framing,
  strict-origin referrer policy, `no-cache` for HTML/service worker, immutable
  one-year caching for hashed JS/CSS, and a one-day public-image cache.
- A fixed-client 100-request concurrent POST burst to `/api/page-view` observed
  46 x 204 and 54 x 429 (replenishment occurs during the run). Throttles carried
  `Retry-After: 1`; rate headers advertise a 40-request burst. The documented
  20 requests/second replenishment and 40 burst are therefore enforced live.
- Axe on the live landing page found zero serious/critical findings at desktop
  and 390 px. The skip link receives first keyboard focus; the mobile page has
  no horizontal overflow; the reduced-motion path reduces transitions to
  `.01ms`. The document has `lang=en`, one h1, a main landmark, and descriptive
  hero alt text.
- In a fresh live context, the PWA controlled the page, cached
  `cycle-legal-shell-v3`, survived an offline reload with the Offline notice,
  and removed a seeded stale cache after re-registration.

## Additional defects

### Major

- **Required site/discoverability assets are missing.** `/robots.txt`,
  `/sitemap.xml`, and `/404.html` all return HTTP 404 while serving the ordinary
  shell; there is no designed 404 route. The corresponding source assets and
  `staticwebapp.config.json` are absent. This violates the supplied site
  structure contract.
- **Required copy/demo documentation is missing.** `.factory/copy-audit.md`
  and `.factory/demo.md` are absent. The former is required to prove the
  plain-words audit; the latter must document the direct demo URL, sample,
  reset mechanism, and isolated storage namespace.

## Required resolution

1. Add `.factory/claims.json` and one clean-state, demo-entry observable test
   for every user-reliant claim in the page and README; run every listed command
   on every build.
2. Implement `/demo` or `?demo=1` as an isolated, one-click sample workspace:
   put **“Try it with sample data”** on the first screen, load the sample and
   its report immediately, show the persistent “Demo — sample data, nothing is
   saved” banner with Reset demo and Start for real, and use only a separate
   `demo:` storage namespace/ephemeral backend tenant.
3. Add `.factory/demo.md`, `.factory/copy-audit.md`, robots, sitemap, and a
   styled 404 route. Then repeat this independent verification against the new
   deployment.
