# Cycle Legal Check — repair 10 handoff

## Outcome

Release blockers V13-1 and V13-2 from verifier commit
`57ebcc208d3874aac9ec00a19dd72eacb2bb5147` are repaired. Existing product
behavior, visual design, demo isolation, privacy boundaries, and deployment
class are unchanged.

## Repairs

### Independently labeled 100-route evaluation

- Added
  `tests/fixtures/route-evaluation-100.json`: 100 unique, static OpenStreetMap
  way snapshots (34 Belgium, 33 Netherlands, 33 Germany).
- The set covers bicycle, 25 km/h e-bike, and speed-pedelec profiles.
- Each independent positive label comes from a stored contributor-supplied
  `bicycle=no|private` or `speed_pedelec=no|private` tag.
- Each record retains its OSM way URL, snapshot timestamp, ODbL notice,
  vehicle, region, tags, route points, and source geometry. Exact Overpass
  selection queries are stored in the corpus metadata.
- The regression runs the production GPX parser, map matcher, and analyzer.
  It audits corpus provenance and uniqueness, calculates detection, and
  requires at least 90%. Current result: **100/100 (100.0%)**.
- The README qualifies the result: this stored explicit-tag evaluation is not
  a legal-accuracy estimate, map-completeness measure, or whole-route
  clearance.

Exact command:

```sh
cargo test labeled_hundred_route_evaluation_detects_at_least_ninety_percent -- --nocapture
```

### SQLite and startup claims

- Extracted the production database selection and initialization paths for
  direct behavioral tests without changing runtime defaults.
- Added a retained-data test that opens the mounted-data branch, writes the
  aggregate counter, closes SQLite, reopens it, and reads the retained value.
- Added a lock/fallback test for the exact `unix-dotfile` mounted-data URL and
  the working local fallback.
- Added an integration test that launches the compiled production binary in a
  fresh directory with an empty environment except `PORT`. It checks
  `/health`, the created SQLite file header, and the generated-config startup
  log.
- Registered these three README statements and the route threshold in
  `.factory/claims.json`. The manifest now has 25 unique IDs and 25 unique
  test commands.

## Verification evidence

Run on 2026-09-02 UTC:

The install, unit/integration, type, lint, build, browser, and release-build
gates were repeated from a fresh clone of the committed candidate.

| Gate | Result |
| --- | --- |
| Original failure reproduction | 14 routes instead of 100; 3 missing runtime claim IDs |
| `npm ci` | PASS — 85 packages, 0 vulnerabilities |
| Every command in `.factory/claims.json` | PASS — 25/25, each run separately |
| `npm test` | PASS — 3 Vitest, 27 Rust unit tests, 1 Rust process integration test |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS — rustfmt and Clippy with warnings denied |
| `npm run build` | PASS — `dist/` produced |
| Frontend payload | JS 21,914 B raw / 8.14 kB gzip; CSS 15,068 B raw / 4.02 kB gzip |
| Hero payload | 59,794 B mobile; 143,378 B desktop |
| `cargo build --release --locked` | PASS — 7,220,056-byte binary |
| `npm run test:e2e` | PASS — 52/52 across desktop and 390×844 mobile |
| Route evaluation | PASS — 100/100 detected; required threshold 90% |
| Local `verify-url.sh` | PASS on `/`, `/demo`, `/privacy`, and `/terms`; no console errors |
| Axe via Playwright | PASS — zero serious/critical findings on all product routes in both projects |
| Keyboard/reduced motion/offline/update | PASS in the browser suite |
| Mobile Lighthouse | 98 / 100 / 100 / 100; FCP 1.1 s, LCP 2.3 s, TBT 40 ms, CLS 0 |
| Desktop Lighthouse | 100 / 100 / 100 / 100; LCP 0.4 s, CLS 0 |
| 100-request local burst | 47×204 and 53×429 while the 20 req/s refill remained active |
| Deterministic rate test | First 40 allowed, next 429 with `Retry-After: 1`, one token restored after 50 ms |

The browser suite also rechecks demo isolation, real-flow request shape,
privacy storage/removal, CSV export, direct legal routes, the designed 404,
cache/security headers, license behavior, focus order, touch targets, 320 px
reflow, and service-worker offline reload.

## Deployment and live verification

The final commit containing this handoff is built with all three source
identity arguments and deployed by:

```sh
WO_DATA_DIR=/data /opt/fleet/lib/deploy-container.sh \
  cycle-legal-profile-check /work/repo Dockerfile 8080
EXPECTED_BUILD_SHA=$(git rev-parse HEAD) npm run verify:deployed
```

The fleet-owned `sf-cycle-legal-profile-check*` app and durable
`sf-cycle-legal-profile-check*` data share are the only cloud resources in
scope. Post-deploy checks cover the live build identity, artifacts, response
policy, rate limits, desktop/mobile pages, accessibility, and sample flow.

## Known limits

- The 100-route corpus measures recognition of frozen, explicit OSM access
  tags. It deliberately does not claim field legal accuracy or map
  completeness.
- New route checks still need Overpass. The installed shell and sample report
  remain available offline.
- Docker is unavailable in the worker. The same Dockerfile is validated by
  the Azure Container Registry build during deployment.

No additional product or infrastructure work is known to be required.
