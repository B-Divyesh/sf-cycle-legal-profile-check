# Independent verification 7 — PASS

**Candidate:** `d562c39c9eefc51e8193d869bade1fddbc58d014`  
**Live URL:** <https://cycle-legal-profile-check.sociobot.in>  
**Verified:** 2026-08-30, independently from `/work/repo`

## Decision

**PASS.** The live `/health` endpoint returned exactly `{"build":"d562c39c9eefc51e8193d869bade1fddbc58d014","status":"ok"}`. Local production assets match the live candidate:

| Asset | SHA-256 (local and live) |
| --- | --- |
| `index-CDzw5Ccc.js` | `9cb8b652a5c25710065244cb6882e4eea3db22d227a504498d6e1b5ed8743205` |
| `style-jQaVo1Bz.css` | `34a81448b9d86918de90220fbd533e019651becb2c5477cdd3a88f74a2f2fef0` |

## Required first checks

All commands in `.factory/claims.json` passed from the checked-out candidate before other product QA:

| Claim | Exact test | Result |
| --- | --- | --- |
| `demo-sample-report` | `npm run test:e2e -- --grep @claim:demo-sample-report` | Pass in desktop and 390px projects |
| `demo-isolation` | `npm run test:e2e -- --grep @claim:demo-isolation` | Pass in both projects |
| `csv-export` | `npm run test:e2e -- --grep @claim:csv-export` | Pass in both projects |
| `offline-reload` | `npm run test:e2e -- --grep @claim:offline-reload` | Pass in both projects |
| `report-evidence` | `npm run test:e2e -- --grep @claim:report-evidence` | Pass in both projects |
| `regional-pricing` | `npm run test:e2e -- --grep @claim:regional-pricing` | Pass in both projects |
| `license-browser-local` | `npm run test:e2e -- --grep @claim:license-browser-local` | Pass in both projects |
| `gpx-not-retained` | `cargo test gpx_analysis_never_persists_route_data` | Pass |
| `aggregate-page-view` | `cargo test page_views_persist_only_an_aggregate_counter` | Pass |

Cold first read of the live desktop page: “Check route access before you ride.” It says it is for “cyclists with a GPX,” explains that it finds mapped access conflicts before the ride, and gives a visible one-click **Try it with sample data** action with the result (“Opens a sample report”) stated beside it. This passes the plain-words and demo-sandbox release test.

## Local build and automated coverage

- `npm ci` completed: 85 packages installed; audit reported 0 vulnerabilities.
- `npm test` passed: 2 Vitest tests and 17 Rust tests.
- `npm run typecheck` passed.
- `npm run lint` passed: rustfmt and clippy with warnings denied.
- `npm run build` passed. Initial JS is 20,076 bytes raw / 7.65 kB gzip; CSS is 13,466 bytes raw / 3.70 kB gzip, within the stated 200 kB/50 kB budgets.
- `BUILD_SHA=d562c39c9eefc51e8193d869bade1fddbc58d014 cargo build --release` passed.
- `npm run test:e2e` passed all 38 tests in the desktop Chromium and 390px mobile projects.
- Docker/Podman is unavailable in this worker, so the Docker image itself was not built here. The multi-stage Dockerfile was reviewed: it uses `rust:1`, non-root runtime, `/data` SQLite storage, `PORT`, and build arguments.

## Live product checks

- A real Brussels sample GPX check returned HTTP 200 and rendered a report in both desktop and 390px contexts. A malformed upload returned HTTP 422 with “The GPX is not valid XML. Try again or use a smaller GPX.”
- Boundary/API checks: invalid vehicle 422; unsupported region 422; unpaid Netherlands pack 402; 8 MB-plus GPX 413. All API responses used `no-store`.
- Demo in fresh desktop and mobile contexts showed the complete dated Brussels report and banner. Its outgoing requests were limited to the same-origin HTML, image, JS and CSS shell; no API, analytics, billing, or third-party request occurred. Its only localStorage key was `demo:cycle-legal-profile-check:active`.
- A fresh demo service-worker install reloaded `/demo` while offline, retained the sample report, and showed the Offline notice.
- Axe Playwright scans on live landing and demo had 0 serious/critical violations in desktop and 390px mobile contexts. Keyboard focus first lands on the visible skip link; mobile had 390px scroll width equal to client width; reduced motion changed scroll behavior to `auto`; cold loads had no console or page errors.
- The response headers include CSP with `frame-ancestors 'none'`, `nosniff`, `X-Frame-Options: DENY`, and strict-origin referrer policy. HTML and `sw.js` use `no-cache`; `/health` and API use `no-store`; hashed JS/CSS use one-year immutable caching. `/privacy`, `/terms`, crawler files, manifest, service worker, and direct 404 behavior were all successful.
- All same-origin links found across product routes returned 200 (aside from the intentional unknown-route 404). The actual visual system was inspected at desktop and mobile and matches the documented concrete/moss field-audit design rather than a generic template.

## Rate-limit verification

The documented allowance is a **40-request burst per client, replenishing at 20 requests/second**. It was enforced live for every non-health server endpoint:

| Endpoint | Method / burst | Observed |
| --- | --- | --- |
| `/api/page-view` | one HTTP/2 session, 60 POSTs | 40×204, 20×429; every 429 had `Retry-After: 1` |
| `/api/analyze` | one HTTP/2 session, 60 malformed-GPX POSTs | 40×422, 20×429; every 429 had `Retry-After: 1` |

`/health` is correctly exempt.

## Defects

| Severity | Finding |
| --- | --- |
| Critical | None |
| High | None |
| Medium | None |
| Low | None |

## Verification limitation

The standalone Lighthouse CLI could not write a report in this disposable worker when pointed at the preinstalled Playwright Chromium (the first attempt could not find Chrome; the supplied executable run ended without a JSON report). This is an environment-tool limitation, not a product failure. The independent browser, axe, responsive, offline, header, cache, and bundle-budget checks above passed; no Lighthouse score is claimed in this report.
