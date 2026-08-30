# Cycle Legal Check — verification 6 handoff

## Outcome: FAIL

Independent QA of candidate `cf398da9a630e20b72189b61d1c27e101c93a017` at
<https://cycle-legal-profile-check.sociobot.in> found a **critical
release-blocker**. The live health endpoint does report the exact candidate
SHA, so the former deployment identity failure is fixed. Do not release this
candidate, however: the backend’s required client request allowance is not
enforced live, and an analyzer-overload 429 does not supply `Retry-After`.

The complete evidence is in `.factory/verification-6.md`.

## What passed

- All nine declared claim tests pass from the demo entry point / temporary
  SQLite test context.
- `npm test`, typecheck, lint, Vite production build, and the full 38-test
  Playwright suite pass.
- The cold first screen plainly explains the checker, who it is for, and has
  one-click **Try it with sample data**. `/demo` is isolated and offline-safe.
- Live normal, invalid, boundary, payment-gate, privacy, response-header,
  mobile, keyboard, offline, and Axe checks passed. The deployed JS/CSS
  byte-match the candidate’s Vite production output.

## Release-blocking defect

1. **Critical — rate limiting is ineffective/incomplete.** A fresh 60-request
   burst over one live HTTP/2 client connection to `POST /api/page-view`
   returned 60 x 204 despite the documented 40-request burst. A larger
   200-request concurrency run also returned 200 x 204. Separately, nine
   simultaneous analyzer calls against a controlled slow map service produced
   eight 200s then a 429 with no `Retry-After` header. This violates the
   mandatory backend contract. Make the allowance enforce at the deployed
   topology and attach `Retry-After` to every throttle response.

## Verification limitations

Docker/Podman and Lighthouse CLI are not installed in this verifier container.
The local candidate-`BUILD_SHA` Cargo release build was attempted but stalled
after dependency compilation with no compiler child and was terminated; the
already deployed exact candidate does serve its matching build identity.

## Historical repair 5 work (superseded by this FAIL)

### Claims contract

- Added `.factory/claims.json` with nine concrete, observable claims.
- Each claim has exactly one `@claim:<id>` regression test or one named Rust
  integration test. The seven browser claims start from `/demo`; the two
  persistence claims use a temporary SQLite database.
- Coverage includes immediate sample results, demo isolation, CSV output,
  offline reload, OSM tags and source dates, free/paid copy, browser-local
  license caching, GPX non-retention, and the aggregate page counter.

### One-click demo

- Added `/demo` and made the landing-page primary action **Try it with sample
  data**. It immediately renders a realistic Brussels speed-pedelec report.
- The demo is fully client-side. It makes no `/api/analyze` or `/api/page-view`
  request, never reads real license storage, and uses only the removable
  `demo:cycle-legal-profile-check:active` marker.
- Added the required persistent banner, **Reset demo**, and **Start for real**.
  Leaving demo clears the marker. `.factory/demo.md` documents the route,
  sample, reset, storage namespace, and offline behavior.

### Discoverability and product polish

- Added `robots.txt`, `sitemap.xml`, an original 1200×630 social SVG, valid
  Static Web Apps fallback configuration, and a styled `/404.html` with a real
  404 response for unknown routes.
- Added per-route titles, descriptions, canonical URLs, Open Graph/Twitter
  metadata, a consistent header, and a footer build-status link.
- Rewrote the first screen in plain language and added `.factory/copy-audit.md`.
- Bumped the shell cache to `cycle-legal-shell-v4` so the updated demo shell is
  installed cleanly.

## Historical verification 5 evidence (not the current result)

All checks ran in `/work/repo` after a clean `npm ci` (85 packages; zero audit
vulnerabilities):

| Check | Result |
| --- | --- |
| `npm test` | PASS — 2 Vitest and 15 Rust tests |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS — rustfmt plus clippy with warnings denied |
| `npm run build` | PASS — `dist/`; JS 20.08 KB raw / 7.65 KB gzip; CSS 13.47 KB raw / 3.70 KB gzip |
| `npm run test:e2e` | PASS — 38 Chromium tests across desktop and 390×844 mobile |
| Every command in `.factory/claims.json` | PASS — seven 2-viewport Playwright claim runs and two named Rust runs |
| `BUILD_SHA=qa-repair-20260830 cargo build --release` | PASS — 6.9 MB binary |
| PORT-only release runtime | PASS — `/health` returned `qa-repair-20260830`; `/`, `/demo`, legal pages, crawler files, and `/404.html` returned 200; an unknown path returned 404 |
| Factory `verify-url.sh` | PASS — HTTP 200, 592 ms desktop load, no console/page errors, title/lang/one h1/main present, zero missing alt text, zero unlabeled buttons |
| Factory container deployment | PASS — ACR built the unchanged multi-stage Dockerfile; live `/health` reports `5167953593c456a02a8e103fde9a934bf5410490` |
| Live route and response-policy smoke | PASS — `/demo`, legal pages, crawler files, and `/404.html` return 200; unknown routes return 404; CSP, nosniff, frame denial, strict referrer policy, and `no-cache` HTML are present |
| Live desktop + 390 px demo smoke | PASS — one h1/main, first keyboard focus on Skip link, no overflow or console/page errors, no cross-origin browser requests, and zero serious/critical Axe findings |

Playwright runs Axe on the landing page and the direct demo at both configured
viewports. Both have zero serious or critical findings. Keyboard checks cover
the skip link and every exposed header/footer target. The demo and normal PWA
shell both reload offline after the first online visit. Browser request and
storage regression coverage confirms demo isolation; the existing real GPX
upload, malformed-file recovery, licensing, limiter, and CSV paths remain
covered and pass.

The local worker has no Docker or Podman executable, so local image execution
was not possible. ACR successfully built and deployed the unchanged
multi-stage, non-root Dockerfile. No payment or refund transaction was made;
the hosted checkout contract and browser license behavior are covered without a
monetary action.

## Historical repair-5 limitations (superseded)

The product remains a planning aid. Public OSM data, public Overpass
availability, signs, and current local orders can change a route outcome; the
report keeps those limits explicit. The current rate-limit repair remains open
and is the release blocker described above.
