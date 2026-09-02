# Cycle Legal Check — review 3 handoff

## Reviewer update — 2026-09-02 UTC

This work order performed an adversarial review only. Product source, assets,
and infrastructure were not changed.

- Wrote `.factory/review-3.md` and committed it.
- Used fresh 390 px and desktop live browser contexts, the direct demo route,
  request logging, storage-separation checks, route/focus checks, the prior
  review/polish records, and a clean local clone.
- Installed dependencies in the clean clone and ran all 25 distinct
  `.factory/claims.json` commands separately; all passed. `npm test`,
  typecheck, lint, build, and the full Playwright suite were also run.
- Result: **FAIL**, with one minor finding, `F-3-1`. The shared footer says
  “Hero image generated for this product with Azure AI.” The sentence is an
  unlisted provenance claim and does not provide a cyclist actionable product
  information. Remove it from the product footer; `.factory/design.md`
  already records the required asset provenance.

The pre-existing repair-10 evidence follows for history.

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

The repaired runtime was deployed on 2026-09-02 with all three source identity
arguments. ACR run `ch1ud` built source
`1b5edc266650f903a87dcfafbdae16daaa0cdb9d`; the fleet mounted
`sf-cycle-legal-profile-c-fa77fd` at `/data` and kept one replica.

Live evidence:

- `/health` returned the exact deployed SHA and `Cache-Control: no-store`.
- One HTTP/2 session sent 60 page-view requests: 40 returned 204 and 20
  returned 429. Every 429 included `Retry-After: 1`.
- Eleven checked frontend files matched the clean local build byte-for-byte.
- `/`, `/demo`, `/privacy`, and `/terms` returned 200 at desktop and
  390 px. Each had one H1, one main landmark, no overflow, no console error,
  and zero serious or critical Axe findings.
- Keyboard smoke confirmed the skip link, mobile-menu Enter activation, and
  Escape focus restoration.
- A live Belgium GPX check returned 200, 100% mapped coverage, five findings,
  and rule pack `2026.09` dated `2026-09-01`.
- The live demo requested only its own origin and no API endpoint. After a
  service-worker update, an offline reload retained the demo report and
  offline notice from `cycle-legal-shell-v7`.
- Live mobile Lighthouse scored 100 / 100 / 100 / 100. FCP was 1.1 s, LCP
  1.8 s, TBT 40 ms, CLS 0, and total transfer 244,260 bytes.

This evidence-only handoff commit changes no runtime source or frontend asset.
It is redeployed after commit so the final `/health` identity still equals
`git rev-parse HEAD`. The repeat commands are:

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

---

# Independent verification 14 — PASS

Verifier QA on 2026-09-02 tested candidate and live build
`4272655a211a573ffb04a5b0f590369bb2351127` at
<https://cycle-legal-profile-check.sociobot.in>. Product code was not
changed.

- Every one of the 25 `.factory/claims.json` commands passed from a clean
  detached clone before the wider suite.
- `npm test`, typecheck, lint, Vite build, and the full 52-test Playwright
  suite passed, as did `cargo build --release --locked`. JS is 8.1 kB gzip
  and CSS is 4.0 kB gzip.
- `/health` returned the exact candidate SHA; ten checked local assets matched
  the live deployment byte-for-byte.
- Cold-read/demo, live GPX success and invalid-input recovery, desktop and
  390px, request privacy, security/cache headers, keyboard focus, axe,
  service-worker offline reload, and the 40-request API burst limit all
  passed. The rate-limit response was 429 with `Retry-After: 1`.
- No Critical, High, Medium, or Low defects remain. Docker/Podman was not
  installed in this verifier container, so the container build itself could
  not be repeated here; the frontend production build and release Rust build
  were exercised locally.

See `.factory/verification-14.md` for exact evidence and the observed API
allowance. Final status: **PASS**.
