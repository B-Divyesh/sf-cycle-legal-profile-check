# Cycle Legal Check — independent verification 10

## Result: PASS

- Candidate commit: `9f770854870be4d27c3ae0fba939f4985b67a228`
- Verified URL: <https://cycle-legal-profile-check.sociobot.in>
- Live `/health`: `{"build":"9f770854870be4d27c3ae0fba939f4985b67a228","status":"ok"}`
- Date: 2026-09-01 UTC

No release-blocking product defects were found.

## First-read check

Confirmed from a cold live desktop visit that the first screen answers the three required questions in plain words:

- What it does: “Check GPX track access before you ride.”
- Who it is for: “For cyclists with a planned GPX track...”
- What to do first: “Try it with sample data,” immediately followed by “Opens a sample report. Nothing is saved to your real data.”

Confirmed that this action opens `/demo` in one click. The report is already populated with a dated Brussels speed-pedelec result and the persistent demo banner provides Reset demo and Start for real.

## Required claim checks

Confirmed that every command named in `.factory/claims.json` passed from this clean checkout after `npm ci`:

| Claim IDs | Command family | Result |
| --- | --- | --- |
| `demo-sample-report`, `mapped-access-conflicts`, `demo-isolation`, `csv-export`, `offline-reload`, `report-evidence`, `vehicle-rule-profile`, `gpx-size-limit`, `regional-pricing`, `billing-refunds`, `license-browser-local` | `npm run test:e2e -- --grep @claim:<id>` | Each passed in desktop and 390px projects (2 tests per command). |
| `regional-cycleway-decisions` | `cargo test regional_cycleway_rules_are_distinct_and_cautious` | Passed. |
| `sampling-density` | `cargo test sampling_rule_uses_eighty_metres_or_one_sixtieth_of_route_length` | Passed. |
| `matching-radius` | `cargo test matching_radius_is_thirty_five_metres` | Passed. |
| `gpx-not-retained` | `cargo test gpx_analysis_never_persists_route_data` | Passed. |
| `aggregate-page-view` | `cargo test page_views_persist_only_an_aggregate_counter` | Passed. |
| `api-rate-limit` | `cargo test api_rate_limit_allows_forty_then_replenishes_at_twenty_per_second` | Passed. |

## Clean-checkout quality gates

Confirmed all available local checks passed:

- `npm ci`: 85 packages installed; audit reported 0 vulnerabilities.
- `npm test`: 3 Vitest and 21 Rust tests passed.
- `npm run typecheck`: passed.
- `npm run lint`: `cargo fmt --check` and Clippy with warnings denied passed.
- `npm run build`: passed and produced `dist/`.
- `npm run test:e2e`: 48/48 passed across desktop and 390×844 mobile.
- Production Vite assets: JS 21.01 kB raw / 7.94 kB gzip; CSS 14.07 kB raw / 3.80 kB gzip. This is within the stated first-load JS and CSS budgets.

The local environment has no `docker` executable, so a local container-image build could not be run. This is recorded as an environment limitation, not a product defect: the live production container serves the candidate SHA and passed all runtime checks below.

## Live product and deployment checks

Confirmed normal, boundary, and recovery behavior:

- A real two-point Brussels GPX, Belgium, and speed-pedelec selection returned HTTP 200 in 1.64 seconds. The report contained 100% matched coverage, OSM way links, relevant map tags, a dated `2026-09-01` regional source, and a cautious review state.
- An invalid XML GPX returned HTTP 422 and the page stated “The GPX is not valid XML. Try again or use a smaller GPX.” Replacing it with the built-in Brussels sample then returned HTTP 200 and a report.
- The 8 MB plus one byte client-side boundary is covered by its declared browser claim test, which confirms rejection before the analyzer request.
- `npm run verify:deployed` used one HTTP/2 session for 60 page-view requests: 40 received 204, 20 received 429, and every 429 had `Retry-After: 1`. This confirms the documented burst of 40 and 20-per-second refill policy.
- `/health` returned 200 with `Cache-Control: no-store`; HTML and `/sw.js` returned `Cache-Control: no-cache`; hashed bundle assets used `public, max-age=31536000, immutable` in the local full-suite check.
- The live service worker was active and controlling the page. An update check found no pending worker, and `/demo` reloaded offline using `cycle-legal-shell-v6` with its Offline notice.

## Privacy, headers, accessibility, and routing

Confirmed these observations on the live service:

- Cold-load requests were same-origin HTML, image, JS, CSS, and the documented aggregate `/api/page-view` endpoint. Demo reset produced no API or external request. Demo-isolation claim tests also confirm that `/demo` does not read or write real browser data.
- Response headers include `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and a CSP limiting scripts, styles, images, and connections to documented origins. No cookies were observed in the recorded responses.
- Live axe scans found zero serious or critical findings on `/`, `/demo`, `/privacy`, and `/terms` at desktop and 390px mobile. Each route had one `h1`, one `main`, its specified title, and no horizontal overflow.
- Live console and page-error listeners reported no errors during cold-route checks. The keyboard skip link received visible solid focus and moved focus to the page heading. The reduced-motion browser preference was recognized.
- Same-origin links on the landing, demo, privacy, terms, and 404 pages all returned 200. The unknown-route check returns the designed 404 document.
- Checked privacy and terms language confirms GPX data is held only for the requested report, SQLite contains the aggregate page count only, OSM and rule-source limits are disclosed, and the product is not legal advice.

## Evidence files

- `.factory/qa-evidence/verification-10-live-desktop.png`
- `.factory/qa-evidence/verification-10-live-desktop-demo.png`
- `.factory/qa-evidence/verification-10-live-mobile-demo.png`
- `.factory/qa-evidence/verification-10-live-headers.txt`
- `.factory/qa-evidence/verification-10-health-headers.txt`
- `.factory/qa-evidence/verification-10-live-analysis.json`

## Defects by severity

- Critical: none.
- High: none.
- Medium: none.
- Low: none.

## Known limits

- Results remain a conservative planning aid. Local signs, temporary changes, local orders, and incomplete or delayed OSM tags can change a route result.
- The required local container-image build could not be checked because Docker is not installed in this verification environment.
