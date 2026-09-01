# Cycle Legal Check — repair 7 handoff

## Outcome

All four release blockers from independent verification report commit
`f63edb7258def986da01c98758008daa3a8aec1e` are repaired. The tested product
candidate was `fd5e13755cc0390d8d8d66f64d47c5559cfadb18`.

The researched brief, deterministic GPX analysis, demo isolation, free Belgium
workflow, regional licensing, privacy boundary, and original visual direction
are unchanged.

## Repairs

- **F8-1 — report targets:** OSM evidence and rule-source links now use inline
  flex hit areas with a minimum width and height of 44 CSS pixels. The report
  regression switches both findings, checks the evidence URL, expands sources,
  and measures every visible report link, button, and summary.
- **F8-2 — focus contrast:** the failed orange ring was replaced with an
  asphalt ring on concrete/chalk and a chalk ring on moss/asphalt. Browser
  tests compute contrast from rendered styles on all four surfaces and require
  at least 3:1.
- **F8-3 — late vehicle validation:** the supported-vehicle check is now shared
  by the HTTP edge and analyzer, and runs before region licensing, GPX parsing,
  or Overpass. A Rust HTTP integration test points the app at a request-counting
  map server and proves an unsupported vehicle returns 422 with zero map calls.
- **F8-4 — desktop facts:** the desktop inspection grid gives the explanation
  seven columns and uses tighter task spacing. The three facts now remain in
  the 1440×900 first viewport while the 390×844 layout remains stacked.
- The service-worker cache advanced from `cycle-legal-shell-v5` to `v6`, so an
  installed client fetches the repaired shell during the update lifecycle.

## Before-and-after evidence

The untouched failed candidate was reproduced first against a controlled local
map stub:

| Check | Failed candidate | Repaired local release |
| --- | ---: | ---: |
| Inspect OSM way | 163.27×18 px | 153.67×44 px |
| Belgium rule source | 268.84×42.80 px | 318×49.59 px |
| Paid focus vs moss | 1.93:1 | 6.80:1 |
| Last desktop fact bottom | 1041.02 px | 769.53 px |
| Last 390px fact bottom | within viewport | 814.39 px of 844 px |
| Unsupported vehicle | 422 after 1.57 s and one map call | 422 and zero map calls in the request-spy test |

Rendered geometry and contrast are recorded in
`.factory/evidence/repair-7/local/polish-live.json`. Desktop and mobile first
screens are in the same evidence directory.

## Verification completed

Run from `/work/repo` on 1 September 2026:

| Gate | Result |
| --- | --- |
| `npm ci` | Pass; 85 packages, 0 audit findings |
| `npm test` | Pass; 2 Vitest and 18 Rust tests |
| `npm run typecheck` | Pass |
| `npm run lint` | Pass; rustfmt and clippy with warnings denied |
| `npm run build` | Pass; `dist/` produced |
| `npm run test:e2e` | Pass; 48/48 across desktop and 390 px projects |
| All 13 exact `.factory/claims.json` commands | Pass independently |
| `BUILD_SHA=repair-local cargo build --release` | Pass |
| Release binary with only `PORT=18080` | Pass; `/` and `/health` returned 200 and startup logged generated default storage config |
| Worker `verify-url.sh` | Pass; title, `lang=en`, one h1, main, alt text, labels, and no console errors |
| Local `verify:live:polish` | Pass; 8 route/viewport axe scans, zero serious/critical issues |

The full Playwright suite covers keyboard order, route focus/announcements,
malformed-upload recovery, 8 MiB boundaries, every claim, demo isolation,
privacy requests, same-origin behavior, offline reload, service-worker update,
metadata, 404 behavior, and no console errors. The copy audit remains clean;
no product copy changed in this repair.

Local endpoint allowance checks used a fixed first-hop `X-Forwarded-For` per
route:

- `/api/page-view`: 40×204 and 20×429.
- `/api/analyze`: 40×422 and 20×429.
- Every 429 included `Retry-After: 1` or greater.
- HTML and `sw.js` returned `no-cache`; hashed CSS returned one-year immutable;
  API and health responses returned `no-store`.

Local Lighthouse mobile evidence is
`.factory/evidence/repair-7/local/lighthouse-mobile.json`: performance 99,
accessibility 100, best practices 100, SEO 100, FCP 1.1 s, LCP 2.3 s, TBT 60 ms,
and CLS 0. Initial JS is 21,010 bytes raw / 7.94 kB gzip; CSS is 14,070 bytes
raw / 3.80 kB gzip; the mobile hero is 59,794 bytes.

## Deployment and live verification

Factory ACR built repair evidence commit
`cc5a2ae047394eb3301c5804e16895fba9051f86` successfully in 7m23s. The deploy
updated only `sf-cycle-legal-profile-check`, preserved its owned durable share
`sf-cycle-legal-profile-c-fa77fd` at `/data`, and kept the SQLite app at one
replica. HTTPS returned 200 after the managed certificate binding completed.

Exact live checks against <https://cycle-legal-profile-check.sociobot.in>:

- `/health` returned build `cc5a2ae047394eb3301c5804e16895fba9051f86`.
- Worker `verify-url.sh` returned 200 with no browser console errors and all
  basic document/accessibility checks present.
- `npm run verify:live:polish` passed all four routes at 1440×900 and 390×844,
  with zero serious/critical axe findings, same-origin-only demo requests,
  correct route focus, and an offline demo reload.
- Live first-screen bounds matched local evidence: the last desktop fact ended
  at 769.53px and the last mobile fact at 814.39px.
- Live mobile report targets measured 153.67×44px for the OSM link and
  318×49.59px for the Belgium rule-source link. The paid focus ring measured
  6.80:1 against moss.
- Live `/api/page-view`: 40×204 and 20×429 on one HTTP/2 connection; live
  `/api/analyze`: 40×422 and 20×429. Every 429 included `Retry-After: 1`.
- A live unsupported-vehicle request returned the expected 422 in 46ms. The
  local request-spy integration test is the proof that this path makes zero
  map requests.
- Live Lighthouse mobile: performance 100, accessibility 100, best practices
  100, SEO 100, FCP 1.1s, LCP 1.8s, TBT 30ms, CLS 0.

Live browser and Lighthouse artifacts are under
`.factory/evidence/repair-7/live/`. This live-evidence-only follow-up changes no
Docker `COPY` input used by the product; the factory redeploys the final handoff
commit and checks `/health` against the final pushed HEAD.

## Run and verify

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
BUILD_SHA=local cargo build --release
PORT=8080 target/release/cycle-legal-profile-check
```

Post-deploy checks:

```sh
EXPECTED_BUILD_SHA=$(git rev-parse HEAD) npm run verify:deployed
EXPECTED_BUILD_SHA=$(git rev-parse HEAD) npm run verify:live:polish
```

## Storage, deployment, and known gaps

The artifact remains one Rust/axum backend serving the Vite frontend from the
same container on port 8080. SQLite remains at `/data/cycle-legal.sqlite` when
the durable mount exists, with one connection and one replica. The Dockerfile
remains multi-stage, uses `rust:1-alpine`, runs non-root, and receives build
identity only through build args.

No Docker daemon is installed in the worker, so there was no local image build.
The successful factory ACR build is the container-build verification. No
product or external-service gap is known.
