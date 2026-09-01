# Independent product verification 9

Date: 1 September 2026

Candidate: `5b8a1136e0b8fc783f293add119e282e528fac5d`

Live URL: <https://cycle-legal-profile-check.sociobot.in>

Work order: `cycle-legal-profile-check-verify-9`

## Decision

**FAIL.** The deployed product matches the candidate and most product-quality
checks pass. Release acceptance is blocked because one required claim command
failed from the clean, cold build state and because the selected regional rule
pack does not change the classification decision. The repository's 100-row
fixture does not independently establish the brief's route-level success
measure.

No product code was changed during this verification.

## Release-blocking findings

### High — V9-1: a required claim command times out from a clean build state

After `npm ci`, the first exact command from `.factory/claims.json` was:

```sh
npm run test:e2e -- --grep @claim:demo-sample-report
```

The Playwright web server ran `npm run build && cargo run`. Its 120-second
startup limit expired while the cold Rust dependency build was still running:

```text
Error: Timed out waiting 120000ms from config.webServer.
```

The configured limit is at `playwright.config.ts:7`. A warm rerun passed both
desktop and mobile projects in 12.4 seconds, but the required clean-state
command already failed. The claims contract states that any failing listed
command blocks release.

### High — V9-2: the regional rule packs do not provide regional decisions

`src/analyzer.rs:185`–`247` applies the same severity and rule identifier in
Belgium, the Netherlands, and Germany. The `region` input affects only the
wording of one cycleway explanation at lines 225–229. Lines 270–284 change the
displayed source label and URL, not the classification.

This conflicts with the brief's region-sensitive job and with the paid copy
that says the purchase adds Netherlands and Germany regional rule packs. A
customer receives different source metadata, but not a distinct regional
decision model.

An independent local endpoint check used the same speed-pedelec GPX and the
same `highway=cycleway` map response for all three selections. Belgium,
Netherlands, and Germany each returned status 200, verdict `review`, rule
`SP-CYCLEWAY-UNKNOWN`, and the same finding title. Only the first source label
and URL differed.

The success-measure test does not close this gap. `tests/fixtures/labeled_routes.csv`
contains 100 hand-authored tag/expected-result rows. The test at
`src/analyzer.rs:407` uses the same two-point geometry and one synthetic way for
every row, then checks the classifier against labels shaped around that same
classifier. It is not a labeled set of 100 real routes or known route segments,
so 90%+ route-level recall remains unconfirmed.

### Medium — V9-3: quantitative README claims are absent from the claim manifest

README states that the checker samples at “roughly 80 metres or one-sixtieth of
its length” and searches within 35 metres. Neither statement has an entry and
dedicated tagged test in `.factory/claims.json`. The claims contract requires
every visitor-facing quantitative statement to be listed and tested.

## Required first checks

### First-read check — pass

The cold live first screen answers all three required questions:

- What it does: **“Check GPX track access before you ride.”**
- Who it is for: cyclists with a planned GPX track.
- What to do first: **“Try it with sample data.”**

The action is visible above the fold and opens `/demo` in one click. It
immediately shows the dated Brussels report and the persistent
**“Demo — sample data, nothing is saved”** banner with **Reset demo** and
**Start for real**. Evidence:
`.factory/qa-artifacts/first-read-desktop.png` and
`.factory/qa-artifacts/live-polish/landing-mobile.png`.

### Claim manifest

`.factory/claims.json` exists with 13 entries. Every exact command was run.

| Claim | Required command result | Follow-up observable result |
| --- | --- | --- |
| `demo-sample-report` | **Fail — web server exceeded 120 seconds** | Pass, desktop and 390px |
| `mapped-access-conflicts` | Pass | Pass, both projects |
| `demo-isolation` | Pass | Pass, both projects |
| `csv-export` | Pass | Pass, both projects |
| `offline-reload` | Pass | Pass, both projects |
| `report-evidence` | Pass | Pass, both projects |
| `vehicle-rule-profile` | Pass | Pass, both projects |
| `gpx-size-limit` | Pass | Pass, both projects |
| `regional-pricing` | Pass | Pass, both projects |
| `billing-refunds` | Pass | Pass, both projects |
| `license-browser-local` | Pass | Pass, both projects |
| `gpx-not-retained` | Pass | Pass, 1 Rust test |
| `aggregate-page-view` | Pass | Pass, 1 Rust test |

Each browser claim has one tagged test definition and runs once in each of the
configured desktop and mobile projects.

## Candidate and deployment identity

- Local `HEAD` was the requested candidate.
- Live `/health` returned
  `{"build":"5b8a1136e0b8fc783f293add119e282e528fac5d","status":"ok"}`.
- Local and live SHA-256 values matched exactly:

| File | SHA-256 |
| --- | --- |
| `index.html` | `567abeea2e2df1151bfb48ef17f0d82eb5c36e959abf41db9812c7946655fe66` |
| `assets/index-DQRFMSbQ.js` | `9d4de55a630b1000603f9f75950199a960210391c5642e7d603990cd191d4673` |
| `assets/style-BVNDbpEQ.css` | `60fc0c7ec08aa72b03567cdfc94b46f891380bb1b8b86c063c80f44cd2c70e73` |

The workspace arrived with unrelated modified and untracked `graphify-out`
files. They were preserved and did not overlap product source or test inputs.

## Local quality gates

| Check | Result |
| --- | --- |
| `npm ci` | Pass; 85 packages, 0 audit findings |
| `npm test` | Pass; 2 Vitest and 18 Rust tests |
| `npm run typecheck` | Pass |
| `npm run lint` | Pass; rustfmt and Clippy with warnings denied |
| `npm run build` | Pass; `dist/` produced |
| `npm run test:e2e` | Pass warm; 48/48 across desktop and 390px |
| `cargo build --release` with candidate build args | Pass |
| Release binary with only `PORT=18090` | Pass; `/` and `/health` returned 200 |

The runtime startup log reported build `5b8a1136…` and
`database_config:"generated default"` without printing a secret.

The verifier image has no `docker` executable, so container assembly could not
be run locally. The Dockerfile was checked directly: it is multi-stage, uses
`rust:1-alpine`, declares build identity arguments with defaults, runs as a
non-root user, creates `/data`, serves `PORT=8080`, and does not depend on
`.git`.

## End-to-end behavior

- A live Brussels sample GPX submitted as a speed pedelec returned 200, matched
  tagged OSM ways, and rendered five explicit review findings with OSM evidence.
- The demo showed the vehicle-specific `speed_pedelec=no` conflict, incomplete
  map evidence, dated rule source, and CSV review export.
- Submitting with no file produced a clear instruction to choose a track.
- An 8 MB plus one byte file was rejected in the browser before an analyzer
  request.
- Malformed XML returned 422 and the specific message “The GPX is not valid
  XML.” Loading the sample afterward recovered to a 200 report without reload.
- The full browser suite also checked report selection, paid-license states,
  refund/revocation handling, direct routes, history, 404 behavior, and
  metadata.

## Privacy, outgoing requests, headers, and links

- The cold landing requested only same-origin HTML, image, JS, CSS, and
  `/api/page-view`.
- The complete demo request log contained only its four same-origin shell
  resources. It made no analyzer, page-view, billing, analytics, font, or other
  third-party request.
- The real analysis browser flow added only same-origin `/api/analyze`. The
  privacy page clearly discloses the server-side OpenStreetMap Overpass lookup.
- Demo storage used only `demo:cycle-legal-profile-check:active`; a seeded real
  license remained separate.
- Rust tests confirmed GPX analysis does not persist route data and SQLite
  stores only the aggregate page-view row.
- Live HTML uses CSP with `frame-ancestors 'none'`, `nosniff`,
  `X-Frame-Options: DENY`, and `strict-origin-when-cross-origin`.
- HTML and `sw.js` use `no-cache`; API and health responses use `no-store`;
  hashed JS/CSS use `public, max-age=31536000, immutable`.
- Every same-origin link found on the core routes returned 200. `robots.txt`
  and `sitemap.xml` returned 200; an unknown route returned the designed 404.
- External destinations were identified but not requested because they are
  outside this product's resource boundary.

## Accessibility, responsive behavior, and PWA

- Live axe checks on `/`, `/demo`, `/privacy`, and `/terms` at desktop and
  390px found zero serious or critical findings.
- Each route has `lang=en`, a specific title, one `h1`, one `main`, ordered
  landmarks, image alternatives, and no console or page errors.
- Keyboard-only use reaches the skip link first, then the sample, vehicle, and
  submit controls. Enter and keyboard selection completed a real report.
- Focus rings are visible and measured at or above 3:1 on product surfaces;
  the paid-section ring measured 6.80:1.
- All checked report actions on 390px were at least 44px in both dimensions.
  There was no horizontal layout overflow. Page scale 200% retained all page
  content and controls at desktop and mobile widths.
- Reduced-motion mode set smooth scrolling to `auto` and transition duration to
  `0.01ms`.
- The service worker controlled the page, `registration.update()` completed,
  no worker was waiting, cache `cycle-legal-shell-v6` was current, and `/demo`
  reloaded offline with its report and Offline notice.

## Performance

- Initial JS: 21,010 bytes raw / 7.94 kB gzip.
- CSS: 14,070 bytes raw / 3.80 kB gzip.
- Mobile hero: 59,794 bytes; desktop hero: 143,378 bytes; no font payload.
- Live Lighthouse mobile: performance 99, accessibility 100, best practices
  100, SEO 100; FCP 1.7s, LCP 1.7s, TBT 0ms, CLS 0.
- Raw results:
  `.factory/qa-artifacts/lighthouse-mobile.json` and
  `.factory/qa-artifacts/lighthouse-quality.json`.

## Backend allowance, concurrency, persistence, and health

The documented allowance is a 40-request burst per client, replenishing at 20
requests per second. `/health` is exempt.

| Endpoint | Concurrent live check | Result |
| --- | --- | --- |
| `POST /api/page-view` | 60 requests on one HTTP/2 session | 40×204, 20×429; every 429 had `Retry-After: 1` |
| `POST /api/analyze` | 60 invalid requests on one HTTP/2 session | 40×422, 20×429; every 429 had `Retry-After: 1` |

The Rust suite also confirms first-hop `X-Forwarded-For` parsing, the
eight-analysis capacity response, the SQLite persistence boundary, and build
identity. The product does not require sign-in. It is not a library or CLI.

The external Sociobot checkout and verification service was not load-checked;
that service is outside this product's allowed resource boundary. Product tests
use recorded verification responses and confirm the correct product-specific
URLs.

## Documentation and visual system

README, MIT `LICENSE`, `/privacy`, `/terms`, `.factory/demo.md`, the claims
manifest, copy audit, and design document are present. The design document
records the product-specific concrete-and-moss palette, system type, spacing,
motion policy, and generated-image provenance. The live design matches that
thesis and does not present a generic framework layout.

The product states that it is not legal advice, identifies incomplete coverage,
attributes OpenStreetMap, and displays rule-source dates.

## Required next steps

1. Make the cold claims command reliable, such as by allowing the first Rust
   build enough time or separating build preparation from Playwright startup.
2. Implement and test genuinely distinct Belgium, Netherlands, and Germany
   classification rules before selling those packs.
3. Validate the 90% target against independently labeled real routes or known
   route segments, including regional and vehicle-specific cases.
4. Add claim-manifest entries and tagged tests for the documented 80-metre /
   one-sixtieth sampling and 35-metre matching statements, or remove those
   quantitative statements.
