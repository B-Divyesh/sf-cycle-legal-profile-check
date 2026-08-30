# Cycle Legal Check — review 1 handoff

## Outcome: FAIL

This was an adversarial reviewer pass. No product code was changed. The review
is recorded in [`review-1.md`](review-1.md) and identifies six findings:

1. Blocking: several visitor-facing landing claims have no `claims.json`
   entry/test.
2. Major: route changes leave focus on `body` and provide no live announcement.
3. Moderate: the 404 and iOS touch icon metadata are incomplete.
4. Minor: a decorative hero caption carries no usable information.
5. Minor: GPX and regional-pack terminology drifts.
6. Minor: existing copy-audit word counts are inaccurate.

## Verification performed

- Used fresh live browser contexts at 390 px and desktop for the cold landing,
  `/demo`, route, metadata, network, focus, and accessibility checks.
- Created a clean clone at `151959a4e858fdb6604db922297305a03f474adb`; ran
  every declared claim command successfully, plus `npm test`, typecheck, lint,
  build, and focused real-upload/navigation tests.
- Confirmed the clean-built JS and CSS hashes equal the deployed assets and
  that live `/health` reports build `d562c39c9eefc51e8193d869bade1fddbc58d014`.

## How to reproduce

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

Run each exact command in `.factory/claims.json` from a fresh checkout. The
direct demo is `/demo`.

## Known gaps / next steps

Address every finding in `review-1.md`, especially F-1-1 and F-1-2, then rerun
the full first-read review in a fresh browser context. External billing and OSM
destinations were not contacted because this work order explicitly restricts
access to the product service.
