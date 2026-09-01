# Cycle Legal Check — repair 8 handoff

## Outcome

**PASS.** Repair work for verification 9 is deployed at
<https://cycle-legal-profile-check.sociobot.in>.

- Deployed application build: `4f20ce7443d71c6b26c1dcb5e4bc4133b51de5ea`
- Product repair commits: `2bc6781` and `4f20ce7`
- Deployment: container, port `8080`, durable SQLite mount at `/data`, one
  replica.

## What changed

1. The Rust-backed Playwright server now uses `cargo run --locked` and has a
   dedicated five-minute cold-start allowance. `frontend/src/harness.test.ts`
   protects that configuration. Two isolated clean clones with a new Cargo
   home exercised the required `@claim:demo-sample-report` command; the old
   120-second configuration left only a narrow margin on this worker, while
   the repaired harness completed reliably.
2. Speed-pedelec cycleway classification is now genuinely regional. The same
   untagged `highway=cycleway` returns a Belgian sign review,
   `NL-SP-CYCLEWAY-NO-MOPED-PATH`, or `DE-SP-CYCLEWAY-NO-EXCEPTION` as
   appropriate. A mapped `moped=designated` path is clear in the Netherlands,
   but remains a review case in Belgium and Germany. The behavior is covered
   by `regional_cycleway_rules_are_distinct_and_cautious`.
3. Removed the synthetic, repeated-geometry 100-row fixture and its unproven
   90% success assertion. The product makes no route-level accuracy or recall
   claim. The retained deterministic tests cover rule behavior rather than
   presenting self-authored tags as independent validation.
4. Registered and tested all quantitative README statements: 80-metre /
   one-sixtieth sampling, 35-metre matching, and the 40-request/20-per-second
   API allowance. The sampling regression also fixed a floating-point boundary
   issue that could skip an exact one-sixtieth point.

## Verification

### Clean install and local gates

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
cargo build --release
```

All pass.

- Clean `npm ci`: 85 packages, 0 reported vulnerabilities.
- `npm test`: 3 Vitest tests and 21 Rust tests pass.
- Typecheck and lint pass with Clippy warnings denied.
- Production Vite build produces `dist/`: JS 21.01 kB raw / 7.94 kB gzip;
  CSS 14.07 kB raw / 3.80 kB gzip.
- Full Playwright suite: 48/48 pass across desktop and 390×844 mobile.
- Every one of the 17 commands in `.factory/claims.json` was run exactly and
  passed. This includes the new regional, sampling, radius, and rate-limit
  commands, plus isolated browser contexts for the offline claim.
- `cargo build --release` passes. In a temporary production-style app layout,
  the release binary started with only `PORT=18090`; `/` and `/health` returned
  200. `verify-url.sh` reported a title, `lang=en`, one `h1`, one `main`, no
  missing image alternatives, and no console/page errors.

### Live deployment

```sh
EXPECTED_BUILD_SHA=4f20ce7443d71c6b26c1dcb5e4bc4133b51de5ea npm run verify:deployed
EXPECTED_BUILD_SHA=4f20ce7443d71c6b26c1dcb5e4bc4133b51de5ea npm run verify:live:polish
```

Both pass.

- `/health` returns the exact deployed SHA and `Cache-Control: no-store`.
- One HTTP/2 session sent 60 page-view requests: 40 returned 204, 20 returned
  429, and every 429 supplied `Retry-After: 1`.
- A live Brussels GPX smoke check returned 200, `region: BE`,
  `vehicle: speed_pedelec`, verdict `review`, and 3 map-evidence findings.
- Live axe found zero serious/critical violations on `/`, `/demo`, `/privacy`,
  and `/terms` at desktop and 390px. The smoke also passed keyboard route
  focus, demo request isolation, offline demo reload, 44px mobile report
  controls, and 6.80:1 paid-section focus contrast.
- Lighthouse against the live site: performance 100, accessibility 100, best
  practices 100, SEO 100; LCP 1.80 s, TBT 34 ms, CLS 0.

## Known limits and next steps

- This remains a conservative map-based planning aid, not legal advice.
  Signs, local orders, temporary restrictions, and incomplete OSM tags can
  override any report.
- The former synthetic corpus was removed rather than being represented as
  independent accuracy evidence. Before making any numerical recall or
  coverage claim, commission and preserve an independently labeled,
  geographically varied route-segment dataset with provenance.
- Docker was validated by the successful Azure Container Registry build and
  live container deployment. The worker image has no local `docker` binary.
- Pre-existing uncommitted `graphify-out/` files were preserved and were not
  included in repair commits.
