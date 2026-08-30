# Cycle Legal Check — polish round 1 handoff

## Outcome

All six findings in `.factory/review-1.md` are resolved. The polished backend
and frontend are live at <https://cycle-legal-profile-check.sociobot.in> on
build `fff835f45c0e9e8e0ab2ab9d996c8241fc605c55`.

The product now has claim-backed first-screen wording, a direct isolated
`?demo=1` and `/demo` sample path, SPA route focus and announcements, complete
route/404 metadata, an original touch icon, consistent terminology, accurate
copy counts, and a mobile first screen that shows all three facts at 390×844.
The concrete-and-moss field-inspection identity was preserved.

## Verification evidence

The released product commit was cloned into a new temporary directory. Every
one of the 13 commands in `.factory/claims.json` passed individually. The same
clean clone then passed:

```text
npm test          2 Vitest + 17 Rust tests passed
npm run typecheck passed
npm run lint      rustfmt + clippy -D warnings passed
npm run build     JS 21.01 kB raw / 7.94 kB gzip
                  CSS 13.89 kB raw / 3.80 kB gzip
npm run test:e2e  42/42 passed across desktop and 390 px mobile
```

Browser coverage includes real GPX upload payloads, invalid-file recovery,
the 8 MB boundary, claim fixtures, demo isolation and reset, offline reload in
its own context, export contents, license return/caching/revocation, route
focus/back navigation, titles/canonicals, 404 status/metadata, 44 px targets,
mobile overflow, console errors, and axe checks on every product route.

Local Lighthouse mobile results are 99 performance, 100 accessibility, 100
best practices, and 100 SEO. LCP was 2255 ms, CLS 0, and TBT 29 ms. The raw
report and screenshots are in `.factory/evidence/polish-1/`.

Post-deploy evidence:

- `/opt/fleet/lib/verify-url.sh` reported HTTPS 200, the correct title, `lang=en`, one `h1`, one `main`, complete image alt text, and no console errors.
- `npm run verify:live:polish` passed all route, responsive, axe, demo-network, reset, focus, 404, and offline assertions. Its report is `.factory/evidence/polish-1/live/polish-live.json`.
- `EXPECTED_BUILD_SHA=fff835f45c0e9e8e0ab2ab9d996c8241fc605c55 npm run verify:deployed` observed 40 accepted requests and 20 HTTP 429 responses, all with `Retry-After: 1`.
- The cloud container build succeeded. The verified release revision was `sf-cycle-legal-profile-check--0000021`, using one replica and the scoped `sf-cycle-legal-profile-check-d2` share mounted at `/data`.

## Run and verify

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
EXPECTED_BUILD_SHA=$(git rev-parse HEAD) npm run verify:live:polish
EXPECTED_BUILD_SHA=$(git rev-parse HEAD) npm run verify:deployed
```

For each claim, also run its exact `test` command from `.factory/claims.json`.
The demo entry point is `/demo` or `/?demo=1`.

## Known gaps and next steps

None for the reviewed scope. No AI feature was added because GPX analysis,
mapped evidence, and export complete the brief without model inference.
