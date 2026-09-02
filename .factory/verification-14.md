# Cycle Legal Check — independent verification 14

## Result: PASS

- Work order: `cycle-legal-profile-check-verify-14`
- Candidate and deployed build: `4272655a211a573ffb04a5b0f590369bb2351127`
- Live URL: <https://cycle-legal-profile-check.sociobot.in>
- Verification date: 2026-09-02 UTC
- Product code changed during verification: no

The candidate meets the researched brief and the supplied claims, demo,
privacy, accessibility, and backend acceptance contracts. No defects were
found. The prior V13 route-corpus and missing-claim findings are closed: this
candidate has a 100-route, 100/100 detection claim/test and all runtime claims
are registered in the manifest.

## First read and demo: PASS

A cold live desktop visit returned 200 with the title `Cycle Legal Check —
Check GPX track access`. Its first screen says what it does (“Check GPX track
access before you ride”), who it is for (“cyclists with a planned GPX track”),
and what to click first (“Try it with sample data”). The adjacent text says it
opens a sample report and does not save real data. The one-click `/demo`
report showed the dated Brussels speed-pedelec findings, evidence, CSV export,
and persistent Demo / Reset demo / Start for real controls. The same entry
point worked at 390×844.

## Required claims: PASS

From clean detached clone `/tmp/cycle-legal-verify-3xMTeE`, after `npm ci`
(85 packages, no audit vulnerabilities), every command in
`.factory/claims.json` was run separately before the wider QA:

| Claim group | Evidence | Result |
| --- | --- | --- |
| 12 browser claims: demo, mapped conflict, isolation, CSV, offline, evidence, real profile, 8 MB limit, pricing, billing/refunds, license storage, browser-data removal | each listed `npm run test:e2e -- --grep @claim:…` command passed in desktop and 390px projects | PASS |
| 13 Rust claims: regional decisions, fixture contract, sampling, matching, privacy/persistence, rate limit, 100-route detection, data-dir/startup | each listed focused `cargo test …` command passed | PASS |

The 100-route production-analyzer evaluation passed and asserts at least 90%
detection; its current fixture result is 100/100. The manifest contains 25
claims and 25 executable checks.

## Clean-candidate quality gates: PASS

| Check | Result |
| --- | --- |
| `npm test` | PASS — 3 Vitest, 27 Rust unit, and 1 runtime integration test |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS — rustfmt and Clippy warnings denied |
| `npm run build` | PASS — `dist/` produced |
| `npm run test:e2e` | PASS — 52/52 tests (`test-results/.last-run.json`) |
| `cargo build --release --locked` with candidate build identity | PASS — 7.2 MB optimized binary |
| Production frontend payload | PASS — JS 21,914 B raw / 8,118 B gzip; CSS 15,068 B raw / 4,025 B gzip; mobile hero 59,794 B |
| Docker build | NOT RUN — Docker/Podman are unavailable in this verifier container |

## Live identity, functionality, and backend: PASS

- `GET /health` returned 200, `Cache-Control: no-store`, and the exact
  candidate SHA.
- SHA-256 comparison of local clean-build and live `index.html`, `404.html`,
  `sw.js`, manifest, robots, sitemap, both bundles, and both hero assets
  matched byte-for-byte.
- A live malformed GPX returned 422 with `The GPX is not valid XML.` A valid
  Brussels bicycle track returned 200 with a 0.2 km report, 100% mapped
  coverage, map-rule evidence, dated `2026.09` source pack, and caveats.
- A single multiplexed HTTP/2 client sent a 50-request burst to
  `POST /api/page-view`: 40 returned 204 and subsequent requests returned
  429. The rejected response included `Retry-After: 1`,
  `X-RateLimit-Limit: 40`, and `Cache-Control: no-store`; the documented
  refill is 20 requests/second. No live data store was inspected.

## Privacy, PWA, accessibility, and browser QA: PASS

- Playwright request logging on real desktop and 390px visits found only
  same-origin document/assets plus the disclosed same-origin aggregate
  `/api/page-view`; `/demo` made no API, billing, analytics, font, or other
  third-party request. Console and page errors were empty.
- Root, health, and asset headers had CSP with `frame-ancestors 'none'`,
  nosniff, `X-Frame-Options: DENY`, and strict referrer policy. HTML and
  `sw.js` were `no-cache`, health/API no-store, and hashed JS/CSS one-year
  immutable.
- Independent axe WCAG scans on live desktop and 390px landing had zero
  serious/critical findings. Both had `lang=en`, one `h1`, one `main`, and a
  visible 4px skip-link focus indicator. Browser suite additionally covers
  keyboard, reduced motion, legal routes, mobile menu, forms, and recovery.
- The live service worker controlled `/demo`, activated
  `cycle-legal-shell-v7`, and an offline reload returned 200 with the sample
  report and Offline notice. `sw.js` is no-cache for updates.

## Disposition

Critical: none. High: none. Medium: none. Low: none.

**PASS — candidate `4272655a211a573ffb04a5b0f590369bb2351127` is releasable.**
