# Independent verification 8 — FAIL

**Candidate:** `fd5e13755cc0390d8d8d66f64d47c5559cfadb18`  
**Live URL:** <https://cycle-legal-profile-check.sociobot.in>  
**Verified:** 1 September 2026 from `/work/repo`

## Decision

**FAIL.** The live product matches the candidate and the functional, privacy,
performance, claims, and server checks pass. Manual accessibility checks do
not meet the attached non-negotiable baseline: report links are smaller than
44 CSS pixels on a 390 px viewport, and the focus outline has only `1.93:1`
contrast against the paid-section background. The touch-target defect affects
the core OSM evidence link. The desktop first viewport also omits all three
required plain-fact lines.

## Required first checks

### Cold first read

The first live screen says **“Check GPX track access before you ride.”** It
names cyclists with a planned GPX track, says it finds mapped access conflicts,
and shows **“Try it with sample data”** with the result explained beside it.
At 390×844, the headline, audience, action, consequence, and all three plain
facts are visible without scrolling. At 1440×900, the headline, audience,
action, and consequence remain visible, so the user-specified first-read gate
passes; the separate three-fact layout requirement does not, as F8-4 records.

The action opens `/demo` in one click. The dated Brussels speed-pedelec report
appears immediately with the persistent **“Demo — sample data, nothing is
saved”** banner, **Reset demo**, and **Start for real**.

Evidence: `qa-evidence/first-read-desktop.png`,
`qa-evidence/live/landing-mobile.png`, and
`qa-evidence/live/polish-live.json`.

### Claim manifest

`.factory/claims.json` exists and contains 13 entries. After the required
`npm ci` dependency preparation, every exact command passed from this clone:

| Claim | Exact test | Result |
| --- | --- | --- |
| `demo-sample-report` | `npm run test:e2e -- --grep @claim:demo-sample-report` | Pass, desktop and 390 px |
| `mapped-access-conflicts` | `npm run test:e2e -- --grep @claim:mapped-access-conflicts` | Pass, both projects |
| `demo-isolation` | `npm run test:e2e -- --grep @claim:demo-isolation` | Pass, both projects |
| `csv-export` | `npm run test:e2e -- --grep @claim:csv-export` | Pass, both projects |
| `offline-reload` | `npm run test:e2e -- --grep @claim:offline-reload` | Pass, both projects |
| `report-evidence` | `npm run test:e2e -- --grep @claim:report-evidence` | Pass, both projects |
| `vehicle-rule-profile` | `npm run test:e2e -- --grep @claim:vehicle-rule-profile` | Pass, both projects |
| `gpx-size-limit` | `npm run test:e2e -- --grep @claim:gpx-size-limit` | Pass, both projects |
| `regional-pricing` | `npm run test:e2e -- --grep @claim:regional-pricing` | Pass, both projects |
| `billing-refunds` | `npm run test:e2e -- --grep @claim:billing-refunds` | Pass, both projects |
| `license-browser-local` | `npm run test:e2e -- --grep @claim:license-browser-local` | Pass, both projects |
| `gpx-not-retained` | `cargo test gpx_analysis_never_persists_route_data` | Pass |
| `aggregate-page-view` | `cargo test page_views_persist_only_an_aggregate_counter` | Pass |

The live landing, demo, privacy, terms, and README claims map to these entries
or are necessary legal/coverage limitations. No unlisted reliance claim was
found.

## Candidate and deployment match

- `/health` returned
  `{"build":"fd5e13755cc0390d8d8d66f64d47c5559cfadb18","status":"ok"}`.
- Local and live SHA-256 values match exactly:

| File | SHA-256 |
| --- | --- |
| `index.html` | `06a7c29f491e85a8928d198944e28504d5659440b1492d29295209bd4123feba` |
| `assets/index-DQRFMSbQ.js` | `9d4de55a630b1000603f9f75950199a960210391c5642e7d603990cd191d4673` |
| `assets/style-BX4ZBn4G.css` | `47fbe30f882ba5c933e58d93c5c38a71e0a716cf53fad09d16fa3143bf7c1cdc` |
| `sw.js` | `35e08d0c070c4ca37dea7a1ca56787a75613d97f9f3915e85f4073d235e4dd52` |
| `404.html` | `04bc33753a2f87dd20a5038e846babbe7fa63d7d9c3518d1551473b1ba600488` |

The candidate commit changes only tracked `graphify-out` analysis files, but
the running build identity and served product files still match the candidate
checkout.

## Local gates

| Check | Result |
| --- | --- |
| `npm ci` | Pass; 85 packages, 0 audit findings |
| `npm test` | Pass; 2 Vitest and 17 Rust tests |
| `npm run typecheck` | Pass |
| `npm run lint` | Pass; rustfmt and clippy with warnings denied |
| `npm run build` | Pass; `dist/` produced |
| `npm run test:e2e` | Pass; 42/42 across desktop and 390 px projects |
| `BUILD_SHA=fd5e137… cargo build --release` | Pass |
| Release binary with only `PORT=18080` | Pass; `/health` and `/` returned 200 |

The runtime startup log identifies the supplied build and reports the database
configuration as a generated default without printing a secret. Docker is not
installed in this worker, so the image itself could not be built. Static review
confirmed a multi-stage build, `rust:1-alpine`, non-root runtime user, `/data`,
`PORT=8080`, build arguments, and no `.git` dependency.

## End-to-end product behavior

- A live Belgium bicycle GPX returned 200. A repeated normal route matched
  100% of sampled points and rendered a report.
- A live speed-pedelec check on the same Brussels route returned 200, two
  explicit review findings, current OSM tags, two OSM way links, and rule-source
  date `2026-08-01`.
- A temporary map-service response gap produced an explicit uncertainty report
  rather than a clear result.
- Invalid and recovery paths returned: malformed XML 422, one point 422,
  unsupported region 422, paid region without a license 402, unsupported
  vehicle 422, and invalid JSON 400.
- A malformed browser upload displayed the specific XML error. Replacing it
  with a valid GPX produced a 200 report without reloading the page.
- An exact 8 MiB GPX returned 200. An 8 MiB-plus-one-byte GPX returned JSON 413
  with “The GPX is over the 8 MB limit.”
- An invalid returned license was removed from the URL, left paid options
  disabled, and displayed “Your saved license is no longer active.” The
  verification request went only to the documented Sociobot endpoint and used
  `no-store`.
- Demo CSV export, reset, start-for-real, and real-license isolation pass in the
  claim suite.

## Privacy, requests, headers, and links

- The cold landing requested only its same-origin HTML, image, JS, CSS, and
  `/api/page-view`. The real flow added only same-origin `/api/analyze`.
- Direct demo requests were only the four same-origin shell resources. It made
  no analyzer, page-view, billing, analytics, font, or other third-party
  request.
- Demo storage used only `demo:cycle-legal-profile-check:active`; a seeded real
  license remained isolated.
- Rust tests confirmed GPX data is not persisted and SQLite contains only the
  aggregate page-view counter.
- Live HTML carries CSP with `frame-ancestors 'none'`, `nosniff`,
  `X-Frame-Options: DENY`, and `strict-origin-when-cross-origin`. API and health
  responses use `no-store`; HTML and `sw.js` use `no-cache`; hashed JS/CSS use
  one-year immutable caching.
- `/`, `/demo`, `/privacy`, `/terms`, `/404.html`, `/robots.txt`, and
  `/sitemap.xml` returned 200. An unknown route returned the designed 404.
  Every same-origin link found across the product routes returned 200.

## Accessibility, responsive behavior, and PWA

- Live axe checks on `/`, `/demo`, `/privacy`, and `/terms` at 1440×900 and
  390×844 found zero serious or critical issues.
- All checked pages have `lang=en`, a route-specific title, one `h1`, one
  `main`, ordered headings, image alternatives, and no cold-load console/page
  errors.
- Keyboard focus starts on the visible skip link, proceeds in logical order,
  and activates the one-click demo. History navigation restores the route,
  heading focus, and polite announcement.
- At 390 px, scroll width equals client width. The UI uses the intended stacked
  layout and keeps the entire first-screen explanation visible.
- Reduced-motion emulation matches, changes smooth scrolling to `auto`, and
  reduces animation/transition duration to `0.01ms`.
- The installed service worker is active at `/sw.js`; `registration.update()`
  completed, cache `cycle-legal-shell-v5` was current, and `/demo` reloaded
  offline with the report and Offline notice.
- Manual target and focus measurements found the release defects below.

## Performance

- Initial JS: 21.01 kB raw / 7.94 kB gzip.
- CSS: 13.89 kB raw / 3.80 kB gzip.
- Desktop hero: 143,378 bytes; mobile hero: 59,794 bytes; no font payload.
- Fresh live Lighthouse mobile: performance 97, accessibility 100, best
  practices 100, SEO 100; LCP 1.8 s, TBT 180 ms, CLS 0, FCP 1.1 s.
- Raw result: `qa-evidence/lighthouse-mobile.json`.

## Backend allowance, concurrency, and persistence

The documented allowance is a 40-request burst per client, replenishing at 20
requests per second. `/health` is exempt.

| Endpoint | One-client concurrent check | Result |
| --- | --- | --- |
| `POST /api/page-view` | 60 requests on one HTTP/2 session | 40×204, 20×429; every 429 had `Retry-After: 1` |
| `POST /api/analyze` | 60 malformed-GPX requests on one HTTP/2 session | 40×422, 20×429; every 429 had `Retry-After: 1` |

The Rust suite also confirms analyzer-capacity 429 responses include
`Retry-After`, first-hop `X-Forwarded-For` parsing, and the SQLite persistence
boundary.

## Documentation, design, and scope

- `.factory/design.md` records the product-specific concrete-and-moss palette,
  system type, 8 px spacing rhythm, interaction grammar, reduced-motion policy,
  and original generated-asset provenance. Desktop and mobile visual inspection
  match that thesis and do not use a generic framework treatment.
- README, MIT `LICENSE`, `/privacy`, `/terms`, `.factory/demo.md`, claims, copy
  audit, and this handoff are present.
- OSM attribution, dated rule sources, incomplete-coverage language, and the
  not-legal-advice limitation are visible.
- No runtime AI feature is warranted: deterministic GPX parsing, regional rule
  evaluation, map evidence, and checklist export complete the researched job.
  There is no missed model-assisted step in the smallest useful workflow.

## Defects by severity

### High — F8-1: Core report links do not meet the 44 px touch target baseline

At 390×844 on `/demo`, **Inspect OSM way** measures
`163.27 × 18 CSS px`. The expanded **Belgium road code and access guidance**
link measures `268.84 × 42.80 CSS px`. The attached accessibility and design
contracts require every touch target to be at least `44 × 44 CSS px`.

This affects the core evidence-review task on a phone and is release-blocking.
Evidence: `qa-evidence/live-demo-mobile.png` and the recorded DOM measurements.

### Medium — F8-2: Paid-section focus outline is below the required contrast

The focused **Buy regional rule packs** control uses a 4 px `#d15f16` outline
with 3 px offset against the section’s `#365d3a` background. Their contrast is
`1.93:1`, below the required `3:1`. The same global outline is used by other
controls on this green surface. The focus indicator is visible but does not
meet the supplied contrast threshold.

Evidence: `qa-evidence/paid-focus.png`; computed styles were outline
`rgb(209, 95, 22)` and section background `rgb(54, 93, 58)`.

### Medium — F8-3: Unsupported vehicle input is checked after map retrieval

The live unsupported-vehicle request correctly returned 422, but took 11.21 s
because vehicle validation occurs after the map request. This does not satisfy
the backend instruction to validate input at the edge and makes a simple input
error depend on an external response. Region and GPX-structure errors return
immediately.

### Medium — F8-4: Desktop first viewport omits the three required facts

At 1440×900, `.hero-facts` begins at `y=867.03` and ends at `y=1041.02`.
The first fact’s text begins at `y=897.03`, leaving effectively none of the
three facts readable within the 900 px viewport. At 390×844, all three fit.
The headline, audience, demo action, and stated click result remain visible,
so the explicit first-read fail condition passes, but the attached plain-words
first-screen shape does not.

### Critical

None.

## Required next steps

1. Give every inline evidence and source link a minimum 44×44 CSS-pixel hit
   area at mobile widths, then add a test covering all report interactions.
2. Use a focus color or two-color indicator that maintains at least 3:1
   contrast on concrete, chalk, asphalt, and moss surfaces; add a computed
   contrast assertion for each surface.
3. Validate the vehicle enum before license or map requests and add a timing or
   request-spy regression test proving no external lookup occurs.
4. Keep the three fact lines within a 1440×900 first viewport without hiding
   the action or its stated outcome.
5. Re-run all 13 claim commands, the full local gates, live responsive manual
   checks, and both endpoint allowance checks.
