# Cycle Legal Check — independent verification 12

## Result: FAIL

- Work order: `cycle-legal-profile-check-verify-12`
- Candidate: `ea75db0652a3c121dfea493de80e699e48ff96b8`
- Live URL: <https://cycle-legal-profile-check.sociobot.in>
- Verification date: 2026-09-02 UTC

The live deployment is the exact candidate build, and the functional, claims,
privacy, accessibility, rate-limit, PWA, and performance checks passed. Release
acceptance remains blocked because the researched brief requires at least 90%
detection on an independently labeled set of 100 routes. This repository has no
such route set or route-level recall result.

No product code was changed during verification.

## Exact deployed build identity

`GET /health` returned HTTP 200, `Cache-Control: no-store`, and:

```json
{"build":"ea75db0652a3c121dfea493de80e699e48ff96b8","status":"ok"}
```

The clean candidate build and live response bytes also matched exactly:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `f56f37b05bcc41b2d4c7e7202dc6f9a5a9789a16f40aafa5356de6b2af43b0c2` |
| `assets/index-CqdUYOH5.js` | `3fb7d47ef384b081405f06770f9da96f5c8c79335cea8fd9d4da84e038f01ed9` |
| `assets/style-DFdn5NcT.css` | `408abd4f7f032601bd7594e3b86ea68ab4d1e84188bf04ad470b1a6482a8e704` |
| `assets/route-inspection-hero.webp` | `ccb23b3886db05e55c14f363cd738c85e57f788bb84af16fbf96694b6c26bd68` |
| `sw.js` | `fb5c6e4f1628a3928454d561a64b308fad66aed11e016d892ca153655047d415` |
| `404.html` | `04bc33753a2f87dd20a5038e846babbe7fa63d7d9c3518d1551473b1ba600488` |
| `favicon.svg` | `7d1a72bb30d1b43cde8ab41089725d6a7c97fb0b15dfe1dc7a6873fec281cb80` |
| `manifest.webmanifest` | `919cd8e45b7e3450dfc1c4ffc6b9b24a1ea6278af0f39ba4a6863effa75e01f1` |
| `robots.txt` | `6de2002755ebfa74ebd092d18a69ae4f0962a27cb4c955180065787e3979c167` |
| `sitemap.xml` | `b003f0ed4d8bca6afc8c65caa38d1ee354652f8bedf914d4f00edf13c3b72f4f` |

This resolves the earlier deployment-only mismatch reported in verification 11.

## First-read and demo gate

A cold live desktop visit showed:

- What it does: “Check GPX track access before you ride.”
- Who it is for: “For cyclists with a planned GPX track...”
- First action: “Try it with sample data.” The adjacent explanation states
  that it opens a sample report and saves nothing to real data.

The action opens a populated Brussels speed-pedelec report in one click. The
persistent banner states “Demo — sample data, nothing is saved” and provides
Reset demo and Start for real. The same required first-screen content remained
inside the 390 × 844 viewport.

## Required claim checks

`.factory/claims.json` exists and contains 20 entries. After `npm ci` in a
detached clean worktree at the candidate SHA, every listed command passed.

| Claim group | Result |
| --- | --- |
| `demo-sample-report`, `mapped-access-conflicts`, `demo-isolation`, `csv-export`, `offline-reload`, `report-evidence`, `vehicle-rule-profile`, `gpx-size-limit`, `regional-pricing`, `billing-refunds`, `license-browser-local`, `browser-storage-removal` | PASS — each exact Playwright command passed in desktop and 390px projects |
| `regional-cycleway-decisions`, `sampling-density`, `matching-radius` | PASS — each exact focused Rust command passed |
| `gpx-not-retained`, `aggregate-page-view`, `ip-not-persisted`, `overpass-data-disclosure`, `api-rate-limit` | PASS — each exact focused Rust command passed |

The demo request log contained only the same-origin document, hero image,
JavaScript, and CSS. It made no analyzer, page-view, billing, analytics, font,
or other external request. Resetting the demo retained a seeded real-license
key and used only the `demo:cycle-legal-profile-check:active` marker.

## Clean-checkout quality gates

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 85 packages; npm audit reported 0 vulnerabilities |
| `npm test` | PASS — 3 Vitest tests and 23 Rust tests |
| `npm run typecheck` | PASS — no diagnostics |
| `npm run lint` | PASS — rustfmt check and Clippy with warnings denied |
| `npm run build` | PASS — `dist/` produced |
| `npm run test:e2e` | PASS — 52/52 across desktop and 390px projects |
| `cargo build --release` | PASS |
| Release binary with only `PORT=18092` | PASS — `/` and `/health` returned 200; startup logged generated default database configuration without a secret value |
| Production container build | NOT RUN — neither Docker nor Podman is installed in this worker |

The Vite report measured 21,914 bytes raw / 8.14 kB gzip JavaScript and 15,068
bytes raw / 4.02 kB gzip CSS. The mobile hero is 59,794 bytes and the desktop
hero is 143,378 bytes. There is no font payload.

## End-to-end and boundary behavior

- A live Brussels sample GPX using the Belgium speed-pedelec profile returned
  HTTP 200. The report showed “Manual review needed,” 100% matched coverage,
  five uncertainty findings, OSM tags, evidence links, and dated rule sources.
- Submitting without a file displayed “Choose a GPX track or load the sample
  GPX track first.” Loading the sample recovered without a reload.
- Malformed XML returned 422 and displayed “The GPX is not valid XML. Try again
  or use a smaller GPX.” The browser logs the expected failed-resource message
  for this deliberate 422; normal and demo flows had no console or page error.
- A one-point GPX returned 422 with the two-point requirement. Unsupported
  vehicle and region values returned 422. A paid region without a license
  returned 402. All API responses used `Cache-Control: no-store`.
- A file of 8 MB plus one byte was rejected in the browser with the documented
  recovery message and produced no analyzer request.
- The full browser suite also exercised malformed-file replacement, CSV
  download contents, license return/cache/revocation states, history, route
  announcements, direct legal routes, and the designed 404.

## Backend allowance, concurrency, and persistence

The documented allowance is a burst of 40 requests per client, replenishing at
20 requests per second. Two independent live bursts each used one HTTP/2
session:

| Endpoint | Requests | Observed result |
| --- | ---: | --- |
| `POST /api/page-view` | 60 | 40 × 204, 20 × 429; all 429 responses had `Retry-After: 1` |
| `POST /api/analyze` with invalid input | 60 | 40 × 422, 20 × 429; all 429 responses had `Retry-After: 1` |

`/health` is exempt. The Rust suite also passed the eight-analysis capacity
test, first-forwarded-IP tests, GPX non-persistence test, IP non-persistence
test, aggregate-counter test, and captured Overpass-payload test. No live
database or product storage was inspected.

## Privacy, headers, and caching

- A cold landing loaded only same-origin HTML, image, JS, CSS, and the disclosed
  aggregate `/api/page-view` request. A real analysis added only same-origin
  `/api/analyze` in the browser. Server-side Overpass sampling is disclosed on
  `/privacy` and covered by the captured-payload test.
- Live responses set CSP with `frame-ancestors 'none'`,
  `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and
  `Referrer-Policy: strict-origin-when-cross-origin`. No cookie was observed.
- HTML and `sw.js` used `Cache-Control: no-cache`; health and API responses used
  `no-store`; hashed JS/CSS used `public, max-age=31536000, immutable`; the
  stable hero image used a one-day cache.
- The product does not require sign-in. The checkout URL and other external
  destinations were inventoried but not requested because they are outside
  this work order's product-resource boundary.

## Accessibility, responsive behavior, and routing

- Live axe scans on `/`, `/demo`, `/privacy`, and `/terms` found zero serious
  or critical issues at 1440 × 900 and 390 × 844.
- Each route returned 200 with its expected title, `lang=en`, one `h1`, one
  `main`, image alternatives, and no horizontal overflow. An unknown route
  returned the designed 404 document.
- The first keyboard target was the visible skip link with a 4px solid focus
  ring. Keyboard-only navigation activated the sample action, moved route
  focus to the demo heading, reached both report findings, and activated the
  second finding with Space. The mobile menu opened with Enter and restored
  focus on Escape.
- Report controls on the 390px result screen measured at least 44px in both
  dimensions. The paid-section focus contrast measured 6.80:1.
- Reduced-motion mode was detected and changed smooth scrolling to `auto`.
  No normal or reduced-motion live flow produced a page error.
- All discovered same-origin links across the landing, demo, privacy, terms,
  and 404 pages returned 200.

## PWA and performance

The active service worker controlled `/demo`. `registration.update()`
completed with no waiting or installing worker, and cache
`cycle-legal-shell-v7` was present. After the context was taken offline,
`/demo` reloaded with the sample report, its route-specific title, and the
Offline notice.

Fresh live Lighthouse mobile results were:

| Metric | Result |
| --- | ---: |
| Performance | 98 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| First Contentful Paint | 1.2 s |
| Largest Contentful Paint | 1.9 s |
| Total Blocking Time | 130 ms |
| Cumulative Layout Shift | 0 |
| Total transfer size | 239 KiB |

The JS, CSS, font, hero, LCP, and CLS budgets pass. Lighthouse does not measure
field INP in a lab run; no interaction delay was observed in the exercised
flows.

## Product and documentation review

README, MIT `LICENSE`, `/privacy`, `/terms`, `.factory/demo.md`, the 20-entry
claims manifest, copy audit, and product-specific design document are present.
The live concrete-and-moss visual system matches the documented palette,
system typography, spacing, focus, and reduced-motion policy. Generated-image
provenance is recorded. The product states that it is not legal advice,
attributes OpenStreetMap, dates its rule packs, and does not claim complete
coverage.

The product supplies the brief's core workflow: GPX upload, vehicle and region
selection, mapped conflicts and uncertainty, OSM evidence, dated sources, and
CSV checklist export. No AI feature is needed for this deterministic rules and
map-evidence job.

## Defects by severity

### High — V12-1: the brief's route-level detection target is not established

The researched brief requires at least 90% of known prohibited or
vehicle-mismatched segments to be flagged in a labeled test set of 100 routes,
with an explicit uncertainty state. The current repository has no
`tests/fixtures/labeled_routes.csv`, no equivalent independently labeled route
corpus, and no route-level recall calculation. The analyzer tests cover focused
synthetic tag decisions, parsing, sampling, matching radius, and uncertainty;
they do not measure the required detection rate on 100 routes.

This is release-blocking because the supplied brief is the acceptance contract.
The UI's explicit uncertainty and incomplete-coverage language is appropriate,
but it does not establish the quantitative acceptance result.

- Critical: none observed.
- Medium: none observed.
- Low: none observed.

## Required next step

Add an independently labeled set of at least 100 representative routes or
known route segments spanning supported vehicles, regions, prohibited cases,
vehicle mismatches, and uncertainty. Run the production analyzer against it
and record a result of at least 90% recall before re-verification.
