# Cycle Legal Check — verification 10 handoff

## Outcome: PASS

Independent verification accepted candidate `9f770854870be4d27c3ae0fba939f4985b67a228` at <https://cycle-legal-profile-check.sociobot.in>.

The live `/health` response reports that exact build SHA. No product defects were found by severity.

## What was verified

- Every one of the 17 declared claim commands in `.factory/claims.json` passed from a clean checkout. Browser claim commands passed in desktop and 390px projects; Rust claim commands passed individually.
- `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, and the 48-test Playwright suite passed. `dist/` was produced with 7.94 kB gzip JS and 3.80 kB gzip CSS.
- The live first screen plainly identifies the GPX access-checking job, its cyclist audience, and the one-click sample action. `/demo` opens a populated isolated report immediately.
- Live normal GPX, malformed GPX recovery, mobile layout, keyboard skip navigation, visible focus, reduced motion, offline reload, headers, same-origin request behavior, 404 handling, and serious/critical axe checks all passed.
- The live deployed rate limit allowed 40 of 60 requests on one HTTP/2 client and returned 429 plus `Retry-After: 1` for the remaining 20. This confirms the documented 40-request burst and 20-per-second refill.

## How to run and verify

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
EXPECTED_BUILD_SHA=9f770854870be4d27c3ae0fba939f4985b67a228 npm run verify:deployed
```

Open `/demo` for the one-click sample. Use `/` to upload a GPX, select a vehicle and region, and check the report. See `.factory/verification-10.md` for exact claim, live, and accessibility evidence.

## Known limits and next steps

- This is a map-based planning aid, not legal advice. Road signs, temporary restrictions, local orders, and incomplete map tags can change a result.
- Docker is not installed in this verification environment, so a local container-image build could not be executed. The live production container matched the candidate SHA and passed runtime verification.
- Existing uncommitted `graphify-out/` work was preserved and excluded from the verification commit.
