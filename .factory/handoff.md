# Cycle Legal Check — polish round 2 handoff

## Outcome

Every finding in `.factory/review-1.md` and `.factory/review-2.md` is closed.
The product remains a Rust/axum backend serving the Vite frontend from one
container, with SQLite under `/data` in the fleet deployment.

## What changed

- Added a keyboard-safe mobile primary menu on `/`, `/demo`, `/privacy`, and
  `/terms`. Escape closes it and returns focus to the menu button.
- Rewrote legal copy around testable boundaries. A privacy-page control now
  removes the saved license, verdict, and demo marker.
- Added claims and isolated tests for forwarded-IP non-persistence, the
  Overpass request payload, and browser-data removal.
- Narrowed free-feature copy to the tested Belgium check and checklist export.
- Split the overlong README rule example and updated the catalog description.
- Bumped the service-worker cache to `cycle-legal-shell-v7`.

Finding-by-finding evidence is in `.factory/polish-2.md`.

## Verification

Run from a clean checkout:

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

Every command listed in `.factory/claims.json` must also pass individually.
The manifest contains 20 unique claims. Local results were:

- Vitest: 3 passed.
- Rust: 23 passed.
- Playwright: 52 passed in desktop and 390 px projects.
- Build: 8.14 kB gzip JS and 4.02 kB gzip CSS in `dist/`.
- Lighthouse mobile: 98 performance, 100 accessibility, 100 best practices,
  and 100 SEO. LCP was 2.3 s, CLS 0, and TBT 70 ms.
- `/opt/fleet/lib/verify-url.sh`: title, `lang`, one `h1`, `main`, labels, and
  image alt checks passed. The Playwright axe integration found no serious or
  critical issue on all routes at both viewports.

Local evidence is under `.factory/evidence/polish-2/local/`.

## Deploy and live verification

Deploy through the work-order configuration:

```sh
WO_DATA_DIR=/data /opt/fleet/lib/deploy-container.sh cycle-legal-profile-check /work/repo Dockerfile 8080
EXPECTED_BUILD_SHA=$(git rev-parse HEAD) EVIDENCE_DIR=.factory/evidence/polish-2/live npm run verify:live:polish
EXPECTED_BUILD_SHA=$(git rev-parse HEAD) npm run verify:deployed
```

The container starts with only `PORT`; `/data` is the durable SQLite location.
The fleet keeps one replica. `/health` returns the build SHA. Both API routes
enforce the 40-request burst, return 429 with `Retry-After`, and key the limit
from the first forwarded client address.

## Known gaps and next steps

None for the reviewed scope. This tool remains a planning aid, not legal advice,
and the product states that map and rule coverage can be incomplete.
