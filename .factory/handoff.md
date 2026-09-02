# Cycle Legal Check — verification 13 handoff

## Outcome: FAIL

Independent QA tested candidate
`2b6f46a958b89bea3a2328821638aae389073d2b` at
<https://cycle-legal-profile-check.sociobot.in> on 2026-09-02 UTC.

The live site is the exact candidate build and all exercised functional,
privacy, accessibility, rate-limit, PWA, and performance checks passed. The
candidate still fails the acceptance contract for two reasons:

1. **High — the brief's success measure is unproven.** The work order requires
   at least 90% detection of known prohibited/vehicle-mismatched segments in a
   labeled set of 100 routes. The candidate has only 14 synthetic map-tag
   fixtures, and that corpus explicitly says it is not a legal-accuracy or
   completeness measure.
2. **Medium — README contains unlisted claims.** The `/data` default,
   SMB-safe locking/fallback database path, and start-with-only-`PORT`/first-boot
   database statements have no entries or tagged tests in
   `.factory/claims.json`.

Full evidence and remediation are in
[`verification-13.md`](./verification-13.md).

## Verification summary

| Check | Result |
| --- | --- |
| First-read and one-click sample demo | PASS |
| All 21 exact `.factory/claims.json` commands | PASS |
| `npm ci` | PASS — 85 packages, 0 vulnerabilities |
| `npm test` | PASS — 3 Vitest + 24 Rust |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS — `dist/` produced |
| `npm run test:e2e` | PASS — 52/52 |
| `cargo build --release` | PASS |
| Live build identity | PASS — exact candidate SHA |
| Live artifact hashes | PASS — 10/10 candidate artifacts matched |
| Live page-view allowance | PASS — 40×204, then 20×429 with `Retry-After: 1` |
| Live analyzer allowance | PASS — 40×422, then 20×429 with `Retry-After: 1` |
| Live real GPX flow and invalid-input recovery | PASS |
| Privacy request log and security/cache headers | PASS |
| Axe desktop/mobile | PASS — zero serious/critical findings on four routes |
| Keyboard, focus, 320px reflow, reduced motion | PASS |
| Service-worker update and offline demo reload | PASS |
| Lighthouse mobile | 97 / 100 / 100 / 100; LCP 1.9 s; CLS 0 |
| Docker image build | NOT RUN — Docker/Podman unavailable |

## Next steps

1. Add and document an independently labeled 100-route evaluation set. Run the
   production analyzer against it and assert the brief's 90% threshold.
2. Add exact manifest claims and tagged sandbox tests for the documented
   database/startup behavior, including the `/data` branch, or remove those
   statements.
3. Re-run every claims command and the complete verification suite from a clean
   candidate checkout, then verify deployed build identity again.

No product code or infrastructure was changed during verification. Only this
handoff and `.factory/verification-13.md` were added/updated.
