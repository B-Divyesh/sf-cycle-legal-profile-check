# Cycle Legal Check — verification 9 handoff

## Outcome

**FAIL.** Independent product QA was completed for candidate
`5b8a1136e0b8fc783f293add119e282e528fac5d` at
<https://cycle-legal-profile-check.sociobot.in> on 1 September 2026.

The live deployment matches the candidate. Functional browser checks, the warm
full suite, accessibility, privacy, performance, build identity, endpoint
allowances, and the production builds pass. Release acceptance remains blocked
by findings V9-1 through V9-3 in `.factory/verification-9.md`.

## Blocking findings

1. The required `@claim:demo-sample-report` command exceeded Playwright's
   120-second web-server startup limit from the clean, cold Rust build state.
   It passed only after compilation was warm.
2. Belgium, Netherlands, and Germany use the same classification logic. Region
   changes source metadata and one explanation, not severity or rule identity.
   The paid regional packs therefore do not satisfy the region-sensitive brief.
3. The 100-row fixture is a synthetic tag matrix using one repeated geometry,
   not an independently labeled set of 100 routes. The brief's 90%+ route-level
   success measure remains unconfirmed.
4. README's quantitative sampling and 35-metre matching statements are not
   listed as claims with dedicated tagged tests.

## Verification summary

- `npm ci`: pass; 85 packages and no audit findings.
- `npm test`: pass; 2 Vitest and 18 Rust tests.
- `npm run typecheck`: pass.
- `npm run lint`: pass.
- `npm run build`: pass; `dist/` produced.
- `npm run test:e2e`: pass warm; 48/48 desktop and 390px tests.
- `cargo build --release`: pass with the candidate build identity.
- Local release startup with only `PORT`: pass.
- Live `/health`: exact candidate SHA.
- Live real GPX analysis, invalid input, size boundary, and recovery: pass.
- Live axe: zero serious/critical findings on four routes at both viewports.
- Lighthouse mobile: 99 performance; 100 accessibility, best practices, SEO;
  LCP 1.7s, TBT 0ms, CLS 0.
- Live `/api/page-view`: 40 accepted, then 20×429 with `Retry-After: 1`.
- Live `/api/analyze`: 40 validation responses, then 20×429 with
  `Retry-After: 1`.
- Demo request isolation, offline reload, service-worker update state,
  keyboard use, focus, reduced motion, touch targets, and 200% scale: pass.

Docker is not installed in the verifier image, so image assembly was not run.
The exact frontend and Rust release stages passed, and the Dockerfile contract
was checked directly.

## Evidence and reproduction

Full report: `.factory/verification-9.md`

Evidence: `.factory/qa-artifacts/`

Run the local gates:

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
cargo build --release
```

Run the post-deploy identity and allowance check:

```sh
EXPECTED_BUILD_SHA=5b8a1136e0b8fc783f293add119e282e528fac5d npm run verify:deployed
```

No product code was modified. Pre-existing `graphify-out` working-tree changes
were preserved.
