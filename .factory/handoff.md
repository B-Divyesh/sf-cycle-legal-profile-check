# Cycle Legal Check — independent verification 8 handoff

## Outcome

**FAIL** for candidate `fd5e13755cc0390d8d8d66f64d47c5559cfadb18`
at <https://cycle-legal-profile-check.sociobot.in>.

The deployment matches the candidate, and claims, core GPX analysis, privacy,
offline behavior, build gates, performance, and both API allowances pass.
Release is blocked by the mobile touch-target defect in the report. A focus
contrast defect, incomplete desktop first viewport, and late invalid-vehicle
validation are also recorded.

Full evidence and reproduction details are in
[`.factory/verification-8.md`](verification-8.md).

## Verification summary

- All 13 commands in `.factory/claims.json` passed after `npm ci`.
- `npm test`: 2 Vitest + 17 Rust tests passed.
- `npm run typecheck`, `npm run lint`, and `npm run build` passed.
- `npm run test:e2e`: 42/42 passed across desktop and 390 px.
- Release Rust build passed; startup with only `PORT` returned the candidate
  build identity.
- Live `/health` returned the exact candidate SHA. Five representative local
  and live asset hashes match.
- Real live checks covered a normal bicycle report, speed-pedelec uncertainty
  with OSM evidence, malformed input and recovery, input boundaries, paid
  region without a license, and invalid license recovery.
- Live endpoint allowances: each 60-request single-client check produced 40
  normal responses and 20×429, all with `Retry-After: 1`.
- Live Lighthouse mobile: 97 performance, 100 accessibility, 100 best
  practices, 100 SEO; LCP 1.8 s, TBT 180 ms, CLS 0.
- Demo request logging confirmed same-origin shell requests only. Offline
  reload and service-worker update checks passed.
- Docker is unavailable in this worker. The release binary and Dockerfile
  contract were checked instead.

## Defects

| Severity | ID | Finding |
| --- | --- | --- |
| High | F8-1 | On 390 px `/demo`, the core OSM evidence link is only 18 px high; a rule-source link is 42.8 px high. Both are below the required 44 px touch target. |
| Medium | F8-2 | The orange focus outline has 1.93:1 contrast against the moss paid section, below the required 3:1. |
| Medium | F8-3 | Unsupported vehicle input is validated after map retrieval; the live 422 took 11.21 s. |
| Medium | F8-4 | At 1440×900, the three required plain-fact lines begin at the viewport edge and are not readable without scrolling. |
| Critical | — | None. |

## Reproduce

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
EXPECTED_BUILD_SHA=fd5e13755cc0390d8d8d66f64d47c5559cfadb18 npm run verify:live:polish
EXPECTED_BUILD_SHA=fd5e13755cc0390d8d8d66f64d47c5559cfadb18 npm run verify:deployed
```

Then open `/demo` at 390×844 and measure every visible `a`, `button`, `input`,
`select`, and `summary`. Focus **Buy regional rule packs** and compare its
outline color with the paid-section background.

## Next step

Correct F8-1 and F8-2, keep the facts in the desktop first viewport, move
vehicle validation before the map request, add the regression checks listed in
the verification report, and run a fresh verification. Product code was not
modified during this work order.
