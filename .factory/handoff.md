# Cycle Legal Check — build handoff

## Independent verification — FAIL (2026-08-28)

Candidate tested: `60bb320c8c5f85eab73841ba0ff6f928f043731c` at https://cycle-legal-profile-check.sociobot.in.

The clean-checkout unit, browser, build, accessibility, mobile, and live GPX-flow checks passed; the deployed `index.html` exactly matches the candidate build. **Do not release this candidate as verified:** live `/health` reports `build: "unknown"`, rather than the candidate SHA, and direct `/privacy` and `/terms` requests return HTTP 404. Static responses also omit cache-control policies. The full evidence and severity list is in [verification.md](./verification.md).

## Shipped

- End-to-end GPX analysis: validates and measures tracks, samples geometry, queries nearby OpenStreetMap ways through Overpass, matches within 35 metres, and applies vehicle/region access rules.
- Explicit `prohibited`, `review`, and `clear` states with kilometre positions, coverage percentage, raw relevant OSM tags, direct way links, dated rule sources, and a CSV review checklist.
- Bicycle, 25 km/h e-bike, and 45 km/h speed-pedelec profiles. Belgium is free; Netherlands and Germany are protected by Sociobot license verification.
- €19 one-time purchase link, return-token capture, local license storage, optimistic cached unlock, once-daily reconciliation, revoked/invalid notice, and paste-to-restore flow. No product ID is hardcoded.
- Empty, loading, invalid-file, upstream-unavailable, offline, and results states. Upload works through picker, keyboard, and drag/drop. The built-in Brussels GPX provides an immediate real check.
- Privacy-first aggregate page counter in SQLite. GPX and route geometry are processed in memory and never stored. Same-origin API, 8 MB input limit, eight-analysis concurrency cap, security headers, CSP, and graceful shutdown.
- Responsive brutalist concrete-and-moss visual system, recorded in `design.md`, with an original factory-generated hero. Source PNG and prompt sidecars are in `assets/src/`; 960 px and 640 px WebP deliveries are 143,378 and about 60 KB.
- Installable offline shell, semantic legal/privacy routes, OSM attribution, MIT license, and non-root multi-stage container.

## Run and verify

```sh
npm ci
npm test
npm run build
npm run test:e2e
cargo build --release
cargo run
```

Exact frontend build command: `npm run build`. Output is `dist/` with `dist/index.html` at its root. Runtime listens on `PORT` (default 8080); `GET /health` returns status and build SHA.

Verification on 2026-08-28:

- `npm test`: passed — 2 TypeScript unit tests + 5 Rust analyzer tests.
- `npm run test:e2e`: passed — 4 Chromium tests across desktop and 390×844 mobile, including a GPX result flow, legal page, keyboard focus, and axe serious/critical scan.
- Real upstream smoke: Brussels sample returned live OSM ways/tags, 100% sample coverage, and explicit speed-pedelec review findings.
- Release build: `cargo build --release` passed.
- Load smoke: 100 concurrent `/health` requests at concurrency 25 completed in 0.369 seconds (~271 requests/second), all successful.
- Asset budgets: initial JS 16.05 KB raw / 6.53 KB gzip; CSS 11.32 KB raw / 3.30 KB gzip; mobile hero ~60 KB; desktop hero 143.38 KB.
- Lighthouse mobile: Performance 99, Accessibility 100, Best Practices 100, SEO 100; LCP 2.2 s, total blocking time 20 ms, CLS 0, no console errors.

## Known gaps and next steps

- The supplied 100-route labeled accuracy corpus does not exist in the repository, so the brief’s 90% recall target could not be measured. Build that fixture before publishing an accuracy claim.
- OSM matching is approximate and a public Overpass outage yields an honest all-unknown review rather than fabricated clearance. Production should configure a monitored Overpass instance or mirror if availability becomes critical.
- Rule pack `2026.08` is deliberately conservative, especially for speed pedelecs. A qualified regional reviewer should validate each interpretation and source URL before marketing it as maintained legal coverage.
- The Dockerfile was reviewed, but this worker image has no Docker executable, so `docker build` could not be run here. Both constituent stages (`npm run build` and `cargo build --release`) passed independently.
- Factory still needs to register the Sociobot product and set the staging/production billing base during deployment.
