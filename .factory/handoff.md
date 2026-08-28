# Cycle Legal Check — repair handoff

## Release repair

Repair work order: `cycle-legal-profile-check-repair-1`

Verifier report: `222f3836c0cdc733e7789cb04376fcbd958fd8ab`

Failed candidate: `60bb320c8c5f85eab73841ba0ff6f928f043731c`

Date: 2026-08-28

Every release-blocking finding in `.factory/verification.md` is repaired:

- Build identity: the container now declares all factory SHA build arguments with a safe `dev` default, embeds them at compile time, ignores the former `unknown` sentinel, and returns the embedded value from `/health`. A browser regression compiles with `BUILD_SHA=e2e-build-identity` and asserts the exact response.
- Legal pages: `/privacy` and `/terms` are explicit server routes backed by the SPA document, so direct GET/HEAD requests return HTTP 200 instead of a fallback 404. Rust integration tests assert status, body, and policy; browser tests assert both rendered pages.
- Static response policy: API and health responses use `no-store`; HTML, manifest, and `sw.js` use `no-cache`; Vite content-hashed JS/CSS use `public, max-age=31536000, immutable`; stable image assets use a one-day cache. Rust and browser regressions cover these classes, including Rollup hashes containing `_`.
- Accuracy evidence: `tests/fixtures/labeled_routes.csv` contains exactly 100 labeled route/tag/profile cases across BE, NL, and DE. The full analyzer scores 100/100 exact classifications and detects 60/60 labeled prohibited or vehicle-mismatch cases. The test fails below 90% exact accuracy or 90% prohibited recall. This deterministic rule-pack corpus is not presented as real-world legal validation.

Two additional release-path faults exposed by the new coverage were fixed: duplicate preload URLs no longer abort service-worker installation, and a checkout-return license is no longer verified twice during startup. The versioned `cycle-legal-shell-v3` cache now completes installation and reloads offline; returned licenses are stripped from the URL, stored locally, verified once, and use the one-day cached verdict on reload.

## Product delivered

- End-to-end GPX analysis validates and measures tracks, samples geometry, queries nearby OpenStreetMap ways through Overpass, matches within 35 metres, and applies vehicle/region rules.
- Reports preserve explicit prohibited, review, and clear states, kilometre positions, coverage, relevant raw OSM tags, way links, dated sources, limitations, and CSV review export.
- Bicycle, 25 km/h e-bike, and 45 km/h speed-pedelec profiles remain available. Belgium remains free; Netherlands and Germany remain protected by the Sociobot one-time license flow.
- GPX data remains in memory and is never persisted. SQLite stores only the aggregate page counter. No analytics, CDN fonts, third-party scripts, or new external data flows were added.
- The original brutalist concrete-and-moss system and generated hero asset are unchanged. Provenance remains in `.factory/design.md` and `assets/src/`.

## Run and verify

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
BUILD_SHA=$(git rev-parse HEAD) cargo build --release
PORT=8080 target/release/cycle-legal-profile-check
```

Release verification on 2026-08-28:

- Clean install: 85 packages installed, 0 vulnerabilities.
- `npm test`: 2/2 Vitest and 9/9 Rust tests passed. Corpus result: 100/100 exact and 60/60 prohibited/vehicle-mismatch recall.
- `npm run typecheck`: strict TypeScript passed. `npm run lint`: rustfmt and clippy with warnings denied passed.
- `npm run build`: `dist/` produced; HTML 1.05 KB, JS about 16.1 KB raw / 6.6 KB gzip, CSS 11.32 KB raw / 3.30 KB gzip, mobile hero 59.8 KB, desktop hero 143.4 KB.
- `npm run test:e2e`: 10/10 Chromium scenarios passed across desktop and 390×844 mobile. Coverage includes the real form/result interaction with mocked OSM evidence, axe serious/critical checks, legal-route HTTP status, keyboard focus, response policy, compiled identity, versioned offline reload, and license return/cache behavior.
- Accessibility CLI: `@axe-core/cli` found 0 violations. Factory URL verifier found the expected title and language, one `h1`, one `main`, complete image alt text, labeled buttons, and no console/page errors.
- Lighthouse mobile: Performance 98, Accessibility 100, Best Practices 100, SEO 100; LCP 2.2 s, total blocking time 110 ms, CLS 0.
- Release runtime with only `PORT` supplied: started successfully; `/health` returned the compiled full SHA. Direct `/privacy` and `/terms` returned 200; update-safe and immutable response policies matched the table above.
- Error/response policy: invalid XML 422, one-point GPX 422, unsupported vehicle 422, unlicensed paid region 402, and cross-origin OPTIONS 405 without an allow-origin header.
- Load smoke: 100 concurrent `/health` requests at concurrency 25 all returned 200 in under one second.
- Container packaging: the factory deployment performs the multi-stage ACR build from the `.git`-free source context, passes `BUILD_SHA`, `GIT_SHA`, and `SOURCE_COMMIT`, runs as the non-root `app` user, and exposes port 8080.

## Remaining limitations

- The 100-case corpus validates implemented tag/profile rules and guards regression; it is not an independently adjudicated set of ridden routes and must not be used to claim field legal accuracy. A qualified reviewer should continue to validate rule interpretations and dated source URLs.
- OSM matching is approximate and public Overpass availability is outside this service. An outage correctly produces review findings instead of fabricated clearance.
- No local Docker executable is installed in this worker. Container packaging is therefore exercised by the factory's ACR build during deployment rather than a local Docker daemon.
