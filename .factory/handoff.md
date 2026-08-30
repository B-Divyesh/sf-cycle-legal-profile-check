# Cycle Legal Check — repair 5 handoff

## Outcome

The verifier blockers in `.factory/verification-5.md` are repaired. The
implementation commit is `df1c848` (`fix: add isolated demo and claims
coverage`). This handoff records the release evidence for the final `main`
commit and its configured container deployment.

## Repairs

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

## Verification evidence

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

Playwright runs Axe on the landing page and the direct demo at both configured
viewports. Both have zero serious or critical findings. Keyboard checks cover
the skip link and every exposed header/footer target. The demo and normal PWA
shell both reload offline after the first online visit. Browser request and
storage regression coverage confirms demo isolation; the existing real GPX
upload, malformed-file recovery, licensing, limiter, and CSV paths remain
covered and pass.

The local worker has no Docker or Podman executable, so a local image execution
was not possible. The deployment uses the unchanged multi-stage, non-root
Dockerfile and ACR container build. No payment or refund transaction was made;
the hosted checkout contract and browser license behavior are covered without a
monetary action.

## Known limits and next steps

The product remains a planning aid. Public OSM data, public Overpass
availability, signs, and current local orders can change a route outcome; the
report keeps those limits explicit. No further repair work is open.
