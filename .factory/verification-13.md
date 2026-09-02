# Cycle Legal Check — independent verification 13

## Result: FAIL

- Work order: `cycle-legal-profile-check-verify-13`
- Candidate: `2b6f46a958b89bea3a2328821638aae389073d2b`
- Live URL: <https://cycle-legal-profile-check.sociobot.in>
- Verification date: 2026-09-02 UTC
- Product code changed during verification: no

The live deployment is the exact candidate build. Its functional, privacy,
accessibility, rate-limit, PWA, and performance checks pass. The candidate is
not releasable against the researched brief and claims contract supplied in
this work order because two required acceptance items are missing.

## Release-blocking findings

### V13-1 — High — Required detection measure is not demonstrated

The researched brief in this work order defines success as flagging at least
90% of known prohibited or vehicle-mismatched segments in a labeled set of 100
routes. The candidate contains no such route set, result, or test.

The active `tests/fixtures/analyzer-contract.json` corpus has 14 synthetic
map-tag cases: 6 Belgium, 4 Germany, and 4 Netherlands cases. Its `purpose`
states that it is “not a legal-accuracy study or a completeness measure.” Its
claim and test prove deterministic branches and profile coverage, not
route-level detection or the 90% threshold. README repeats that limitation.
Repository-wide searches found no active 100-route corpus or 90% assertion.

The earlier verification 12/controller wording cannot replace the acceptance
contract explicitly supplied to this independent verification. Close this by
adding a provenance-backed, independently labeled 100-route evaluation set and
running the production analyzer against it. The gate must calculate and assert
at least 90% detection of known prohibited/vehicle-mismatched segments, while
keeping uncertainty explicit.

### V13-2 — Medium — README contains claims absent from `claims.json`

The claims contract says any claim-like README sentence without a manifest
entry fails review. These testable statements have no claim ID or tagged test:

- “The default is `/data/cycle-legal.sqlite` when `/data` exists.”
- “It uses SMB-safe locking there. Otherwise, it uses
  `./cycle-legal.sqlite`.”
- “The container starts with only `PORT` set. It creates its SQLite database
  on first boot.”

I manually reproduced the fallback startup behavior with an image-like release
directory and only `PORT` set. That ad hoc verifier check does not meet the
manifest requirement. Add exact claims and one tagged test per claim,
including the `/data` branch, or remove/reword the statements.

## First-read and demo gate: PASS

A cold 1440×900 live visit returned 200 with no console or page errors. The
first viewport states what it does (“Check GPX track access before you ride”),
who it serves (“For cyclists with a planned GPX track”), and what to click
(“Try it with sample data”). Adjacent text says the click opens a sample report
and saves nothing to real data.

The action opened `/demo` in one click. It immediately showed a dated Brussels
speed-pedelec report with a prohibited finding, an uncertainty finding, OSM
tags, CSV export, and the persistent demo banner with Reset demo and Start for
real. The required first-screen content also fit at 390×844.

## Required claims: all listed tests PASS

`.factory/claims.json` exists with 21 entries. Before other product tests, I
cloned the candidate into `/tmp/cycle-legal-qa-13`, ran `npm ci`, and executed
every listed `test` separately in manifest order. Logs are under
`/tmp/cycle-legal-qa-13-logs/claim-*.log` in the worker.

| Claims | Exact evidence | Result |
| --- | --- | --- |
| `demo-sample-report`, `mapped-access-conflicts`, `demo-isolation`, `csv-export`, `offline-reload`, `report-evidence`, `vehicle-rule-profile`, `gpx-size-limit`, `regional-pricing`, `billing-refunds`, `license-browser-local`, `browser-storage-removal` | Each exact Playwright grep command passed in desktop and 390px projects | PASS |
| `regional-cycleway-decisions`, `fixture-analyzer-contract`, `sampling-density`, `matching-radius`, `gpx-not-retained`, `aggregate-page-view`, `ip-not-persisted`, `overpass-data-disclosure`, `api-rate-limit` | Each exact focused Cargo command passed | PASS |

V13-2 concerns claims missing from the manifest; no listed claim test failed.

## Clean-candidate gates

| Check | Evidence | Result |
| --- | --- | --- |
| `npm ci` | 85 packages; npm audit found 0 vulnerabilities | PASS |
| `npm test` | 3 Vitest and 24 Rust tests | PASS |
| `npm run typecheck` | No diagnostics | PASS |
| `npm run lint` | rustfmt and Clippy with warnings denied | PASS |
| `npm run build` | Vite produced `dist/` | PASS |
| `npm run test:e2e` | 52/52 Playwright tests | PASS |
| `cargo build --release` | 7,219,512-byte optimized binary | PASS |
| Release with only `PORT=18094` | Image-like binary + `dist/` served `/` and `/health`; SQLite was created; startup logged generated default database configuration | PASS for fallback branch |
| Production container build | Docker and Podman unavailable | NOT RUN |

The frontend is 21,914 bytes raw / 8.14 kB gzip JavaScript and 15,068 bytes
raw / 4.02 kB gzip CSS. The mobile hero is 59,794 bytes, desktop hero 143,378
bytes, and there is no font payload.

## Deployment identity: PASS

`GET /health` returned HTTP 200, `Cache-Control: no-store`, and:

```json
{"build":"2b6f46a958b89bea3a2328821638aae389073d2b","status":"ok"}
```

Clean-build and live SHA-256 values matched byte-for-byte:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `f56f37b05bcc41b2d4c7e7202dc6f9a5a9789a16f40aafa5356de6b2af43b0c2` |
| `assets/index-CqdUYOH5.js` | `3fb7d47ef384b081405f06770f9da96f5c8c79335cea8fd9d4da84e038f01ed9` |
| `assets/style-DFdn5NcT.css` | `408abd4f7f032601bd7594e3b86ea68ab4d1e84188bf04ad470b1a6482a8e704` |
| `assets/route-inspection-hero.webp` | `ccb23b3886db05e55c14f363cd738c85e57f788bb84af16fbf96694b6c26bd68` |
| `sw.js` | `fb5c6e4f1628a3928454d561a64b308fad66aed11e016d892ca153655047d415` |
| `404.html` | `04bc33753a2f87dd20a5038e846babbe7fa63d7d9c3518d1551473b1ba600488` |
| `favicon.svg` | `7d1a72bb30d1b43cde8ab41089725d6a7c97fb0b15dfe1dc7a6873fec281cb80` |
| `manifest.webmanifest` | `919cd8e45b7e3450dfc1c4ffc6b9b24a1ea6278af0f39ba4a6863effa75e01f1` |
| `robots.txt` | `6de2002755ebfa74ebd092d18a69ae4f0962a27cb4c955180065787e3979c167` |
| `sitemap.xml` | `b003f0ed4d8bca6afc8c65caa38d1ee354652f8bedf914d4f00edf13c3b72f4f` |

This fresh evidence resolves the earlier deployment-only mismatch.

## End-to-end and boundary behavior: PASS

- A live Belgium speed-pedelec check using the Brussels GPX returned 200. It
  reported Manual review needed, 100% mapped coverage, five explicit
  uncertainty findings, OSM tags/links, and a dated rule pack.
- Missing-file guidance appeared immediately. Malformed XML returned 422 with
  a recovery instruction; replacing it with the sample succeeded without a
  reload.
- Unsupported vehicle/region values returned 422. An unlicensed paid region
  returned 402. API errors were `no-store`.
- The 8 MB plus one byte boundary was rejected before an analyzer request.
- CSV contents, license return/cache/revocation, browser-data removal, history,
  direct legal routes, and the designed 404 passed in the browser suite.

## Backend rate limit and persistence: PASS

The documented allowance is a burst of 40 requests per client, replenishing at
20 requests per second. Two independent concurrent 60-request bursts used one
HTTP/2 client each:

| Endpoint | Observed result |
| --- | --- |
| `POST /api/page-view` | 40×204, then 20×429 |
| `POST /api/analyze` with malformed GPX | 40×422, then 20×429 |

Every 429 had `Retry-After: 1`; analyzer responses were `no-store`. `/health`
is exempt. Integration tests for first-forwarded-IP, analyzer capacity, GPX/IP
non-persistence, aggregate count, and the captured Overpass payload passed. No
live database or fleet storage was inspected.

## Privacy, headers, and caching: PASS

- A direct demo visit requested only same-origin HTML, hero, JS, and CSS. It
  made no analyzer, page-view, billing, analytics, font, or external request.
- A cold real landing added only the disclosed same-origin `/api/page-view`;
  analysis added only same-origin `/api/analyze` in the browser.
- No cookie or localStorage entry appeared during the cold real flow.
- Root responses set CSP with `frame-ancestors 'none'`, nosniff,
  `X-Frame-Options: DENY`, and strict-origin-when-cross-origin referrers.
- HTML and `sw.js` were `no-cache`; health/API were `no-store`; hashed JS/CSS
  were one-year immutable; the hero used a one-day cache.
- Sign-in is not required, so the Entra authority check is not applicable.

## Accessibility, mobile, keyboard, and routing: PASS

- Independent axe scans on `/`, `/demo`, `/privacy`, and `/terms` found zero
  serious/critical findings at desktop and 390px.
- Every route had its own title, `lang=en`, one `h1`, one `main`, no overflow,
  and no console/page errors. `verify-url.sh` found no missing alt or unlabeled
  buttons.
- The first Tab target was the skip link with a 4px visible focus ring. Enter
  activated the demo and focused its heading. Space activated a report
  finding. The mobile menu restored focus on Escape.
- The demo reflowed at 320 CSS pixels. Reduced motion disabled smooth scrolling
  and suppressed active animations.
- Intended same-origin links returned 200; an unknown route returned the
  designed 404.

## PWA and performance: PASS

The service worker was activated, `registration.update()` completed with no
waiting/installing worker, and `cycle-legal-shell-v7` was cached. Offline
`/demo` reload retained its title, report, banner, and Offline notice.

Fresh throttled mobile Lighthouse:

| Metric | Result |
| --- | ---: |
| Performance / Accessibility / Best practices / SEO | 97 / 100 / 100 / 100 |
| FCP / LCP / TBT / CLS | 1.2 s / 1.9 s / 170 ms / 0 |
| Total transfer | 244,292 bytes |

## Product and documentation review

The core workflow exists: GPX upload, vehicle/region selection, mapped
conflicts and uncertainty, OSM evidence, dated sources, and CSV export. The UI
states that it is not legal advice, attributes OpenStreetMap, and does not
claim complete coverage.

README, MIT `LICENSE`, `/privacy`, `/terms`, `.factory/demo.md`, the design
thesis, copy audit, PWA metadata, 404, robots, and sitemap are present. The live
concrete-and-moss identity matches its recorded design and asset provenance.
Generative AI would not improve this deterministic rules-and-map evidence job.

Library/CLI and sign-in checks are not applicable. Hosted checkout was not
opened because it is outside the owned product-resource boundary; recorded
billing/license tests passed.

## Final disposition

- Critical: none.
- High: V13-1.
- Medium: V13-2.
- Low: none.

**FAIL.** Do not release candidate
`2b6f46a958b89bea3a2328821638aae389073d2b` until V13-1 and V13-2 are closed.
