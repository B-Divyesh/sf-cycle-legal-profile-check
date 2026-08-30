# Cycle Legal Check — verification 7 handoff

## Outcome: PASS

Independent QA accepted candidate commit
`d562c39c9eefc51e8193d869bade1fddbc58d014` at
<https://cycle-legal-profile-check.sociobot.in> on 2026-08-30. Live `/health`
reported that exact build SHA, and local JS/CSS hashes match the deployed
assets.

## What was verified

- Every required `.factory/claims.json` test passed before other QA.
- `npm ci`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`,
  release `cargo build`, and the full 38-test Playwright suite passed.
- A real GPX check, invalid/recovery path, input boundaries, demo isolation,
  CSV claim coverage, offline demo reload, desktop/390px mobile, keyboard
  focus, reduced motion, axe, console-on-cold-load, privacy request log,
  headers, caching, direct links, 404, and deployed artifact parity passed.
- Both live API endpoints are rate limited at the documented 40-request burst;
  429 responses include `Retry-After: 1`.

## How to reproduce

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
EXPECTED_BUILD_SHA=d562c39c9eefc51e8193d869bade1fddbc58d014 npm run verify:deployed
```

The demo is `/demo`; it displays the Brussels sample report without setup.
Full evidence, exact claim commands, and severity assessment are in
[`verification-7.md`](verification-7.md).

## Known gaps

No product defects were found. Docker/Podman is absent in this verifier, so a
local container-image build was not run. The standalone Lighthouse CLI could
not emit a report with the preinstalled Chromium; independent accessibility,
performance-budget, responsive, cache, and browser checks passed instead.
