# Verification 3 — FAIL

**Work order:** `cycle-legal-profile-check-verify-3`

**Candidate:** `1f94c016cf3415d8f678d7412dea7596bbc31d8d`

**Live URL:** <https://cycle-legal-profile-check.sociobot.in>

**Date:** 2026-08-28

## Decision

**FAIL — do not release this candidate unchanged.** The live deployment is the
candidate and the previous touch-target defect is repaired, but the actual GPX
file-upload path crashes before it calls the analyzer. The built-in sample is
the only browser route covered by the repository test and masks this defect.
The paid checkout is also unavailable, and safety/legal/supporting copy violates
the product's explicit minimum body-text size.

## Defects

### P0 — selecting a real GPX file makes every check crash before analysis

Reproduced independently on the live deployment in desktop Chromium and at
390 × 844 px:

1. Select a valid, two-point `normal-route.gpx` in **Choose or drop a GPX file**.
2. Select any supported vehicle and Belgium.
3. Activate **Check this route**.

Observed in both viewports:

- the file name is shown and the status changes to “Matching route points to
  mapped ways…”;
- the page throws `Cannot read properties of null (reading 'elements')`;
- zero `/api/analyze` requests are emitted;
- no result or recoverable error is rendered, and the loading state remains.

The root is `frontend/src/main.ts:143-152`: `submitCheck` awaits
`selectedFile.text()` on line 146 and only afterward reads
`event.currentTarget` on line 150. DOM event `currentTarget` is reset after the
await, so `form` is `null` when line 151 accesses `form.elements`. The selected
file input is also re-rendered on change, but the retained `File` itself remains
readable; it is the late event access that throws.

The supplied `tests/e2e/app.spec.ts` uses only **Use Brussels sample route**.
That in-memory string short-circuits the await and therefore does not expose the
failure. The sample can still produce and export a report after the crash, but
that is a demo path and does not satisfy the brief's real upload job.

Required repair: capture the form/current values before the first await (or use
a stable form reference), keep all asynchronous file work inside the error
boundary, and add desktop/mobile E2E coverage that uploads a real valid GPX,
observes the API request, renders evidence, and exercises malformed-file
recovery.

### P1 — the advertised €19 unlock cannot be purchased

The live **Unlock regional packs** link correctly targets the contract URL,
but a fresh GET to
`https://api.sociobot.in/api/v1/products/cycle-legal-profile-check/checkout`
returns HTTP 404 with:

```json
{"error":"enabled factory product","status":404}
```

The verify endpoint exists and rejects a synthetic token normally, but no user
can enter the checkout flow. Netherlands and Germany remain disabled without a
license. This is a live external-registration/deployment defect rather than a
wrong link in the candidate, but acceptance is end-to-end and the paid product
is not operational.

Required repair: enable/register the product in the Sociobot billing engine,
then verify hosted checkout, return URL, token stripping/storage, successful
verification, unlock, once-daily cache, restore, revocation, and refund copy.

### P1 — mobile safety and legal copy is rendered below the 16 px contract

At 390 px, computed-style inspection found **21 visible leaf text nodes below
16 px**. Examples include:

| Copy | Computed size |
| --- | ---: |
| `Check a route` header action | 12 px |
| `Planning aid, not legal advice. Coverage is explicit…` | 12 px |
| GPX storage/limit note | 13.33 px |
| Vehicle and rule-source hints | 12 px |
| Merchant-of-record/refund copy | 12 px |
| Privacy, Terms, and OSM attribution links | 12 px |
| Hero field-study caption | 11 px |

This violates both the attached clarity requirement (“body ≥ 16px on web,
≥17pt on mobile”) and `.factory/design.md` (“Body is never below 16px”). It is
especially material because the undersized text includes the not-legal-advice,
coverage, privacy, rule-source, and payment limitations.

### P2 — the Germany rule pack ships a dead official source

The source URL embedded in `src/analyzer.rs` redirects from `bmdv.bund.de` to
`bmv.de` and finishes at HTTP 404 (“HTTP Status 404”). Belgium, Netherlands,
both OSM tag references, and the OSM attribution link returned 200. A maintained
paid pack must provide a usable dated rule source.

### P3 — an unsupported region is misreported as a payment failure

`region: "XX"` without a license returns 402 “A valid maintained-rule-pack
license is required” because payment verification runs before supported-region
validation. With a valid mocked license, the same input returns the correct 422.
This is not reachable through the current select control, but API validation
should reject unsupported input consistently before billing.

## Clean-checkout gates

All candidate work was run from detached clean worktree
`/tmp/cycle-legal-qa-1` at the exact SHA. `npm ci` installed 85 packages and
reported zero vulnerabilities.

| Command | Result |
| --- | --- |
| `npm test` | PASS — 2 Vitest tests and 9 Rust tests |
| 100-case classifier guard | PASS — repository gate reports required accuracy/recall |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS — rustfmt and clippy with warnings denied |
| `npm run build` | PASS — Vite production `dist/` produced in 213 ms |
| `npm run test:e2e` | PASS — 12/12 repository tests across desktop and mobile |
| `BUILD_SHA=<candidate> cargo build --release` | PASS — 7,125,944-byte binary |
| release runtime with only `PORT` as application config | PASS — root and `/health` served; default SQLite created |

The passing E2E suite is not sufficient evidence for the core workflow because
it never selects a file; the P0 live reproduction above supersedes it.

Docker was not available in the worker, so no local `docker build` is claimed.
Static review confirms a multi-stage `.git`-independent Dockerfile, declared
build args, non-root runtime user, port 8080, and `/data` SQLite configuration.
The exact live build identity and artifact parity provide deployment evidence.

## Live deployment and candidate parity

- `/health` returned HTTP 200 and
  `{"build":"1f94c016cf3415d8f678d7412dea7596bbc31d8d","status":"ok"}`.
- `origin/main` resolved to the same candidate during verification.
- SHA-256 matched between the clean build and live deployment for all eight
  shipped files: `index.html`, `sw.js`, the manifest, favicon, hashed JS,
  hashed CSS, and both hero WebPs.
- Representative hashes: JS
  `62326def45e589604df884870a38d2775cfcc46bf47e7a3b2bbfa19dbbecb2fd`;
  CSS `16e4d02615355eb68122619eaf5e75f027eeced4fe662047135e6faa16482e11`.
- HTTP redirects permanently to HTTPS. HTML/legal/manifest/service-worker
  responses are `no-cache`; hashed JS/CSS are one-year `immutable`; the stable
  hero is one-day cached; health/API are `no-store`.
- Responses include CSP, `nosniff`, `X-Frame-Options: DENY`, and a
  strict-origin referrer policy. Cross-origin preflight to `/api/analyze`
  returned 405 with no allow-origin header. HSTS was not present.

## Product and API exercise

- A direct live Brussels speed-pedelec analysis returned 200, 100% mapped
  coverage, five explicit review findings, OSM way/tag links, Belgium pack
  `2026.08`, source date `2026-08-01`, and the required uncertainty caveats.
- Controlled local Overpass/billing fixtures produced: prohibited bicycle and
  speed-pedelec findings (200), map-unavailable explicit review with 0%
  coverage (200), a valid mocked paid-pack result (200), missing/bad license
  (402), malformed XML (422), one point (422), invalid coordinates (422), and
  invalid vehicle (422).
- Boundary checks: 20,001 GPX points returned 422 with simplification guidance;
  GPX content over 8 MiB returned 413. Unsupported method returned 405 and
  wrong content type returned 415.
- The empty browser submit explains how to choose/load a route. The offline
  browser submit states that the file stayed on-device and tells the user to
  reconnect. The P0 prevents exercising malformed or successful *uploaded*
  files through the UI.
- The sample-result CSV download succeeded with the expected nine columns and
  a route-derived filename. Free export and safety warnings are not paywalled.
- Invalid-license return handling stored the token under the specified key,
  removed it from the URL, kept paid options locked, showed the inactive
  notice and buy link, and did not reverify on reload within one day.

## Accessibility, responsive behavior, and design

- Factory URL verifier: HTTP 200, title present, `lang=en`, one `h1`, one
  `main`, no missing image alt, no unlabeled buttons, no initial console errors.
- Independent Axe 4.10 Playwright runs on the live desktop and 390 px pages:
  **0 violations total**, including 0 serious/critical.
- Initial load on both viewports had no console errors/page errors and no
  horizontal overflow. The upload action itself introduces the P0 page error.
- Keyboard-only traversal reaches the revealed skip link, header actions,
  file control, sample action, vehicle/region selects, and submit action.
  Focus-visible computed as a 4 px survey-orange outline with 3 px offset.
- Repaired header/footer targets meet 44 × 44 px. At 390 px, measured examples
  were wordmark 128.9 × 44, header action 113.6 × 44, and each footer link
  342 × 44. Adjacent spacing passed the repository geometry test.
- Reduced-motion mode resolves loader animation/transition duration to 0.01 ms
  and one iteration. The full desktop/mobile visual inspection matched the
  concrete-and-moss thesis, used the original disclosed asset, and had no
  clipping. The subminimum type defect remains.

## PWA, privacy, backend, and performance

- A fresh service worker controlled the live page, updated successfully,
  created only `cycle-legal-shell-v3`, and cached the shell, manifest, favicon,
  both images, JS, and CSS. Offline reload rendered the application and its
  explicit offline state without errors.
- Initial browser requests were same-origin only: shell, responsive hero,
  hashed JS/CSS, and aggregate page view. Source inspection found no analytics,
  third-party font, CDN script, or hidden outbound request. Deliberate external
  flows are disclosed billing verification/checkout and server-side Overpass.
- SQLite inspection found one table only, `counters(key,value)`, and one row,
  `page_views`; route geometry and licenses were absent. The count survived a
  process restart and incremented from 106 to 107.
- Local 100-request load: health 100/100 HTTP 200 in 139 ms; aggregate page
  view 100/100 HTTP 204 in 970 ms. Live health returned 100/100 HTTP 200 in
  381 ms. Twelve simultaneous slow analyses yielded 8 accepted requests and
  4 explicit 429 busy responses, matching the eight-slot guard.
- Production assets: JS 16,069 B raw / 6.54 kB gzip; CSS 11,495 B raw /
  3.33 kB gzip; no web fonts; mobile hero 59,794 B; desktop hero 143,378 B.
  All stated asset budgets pass.
- Fresh Lighthouse 12.8.2 mobile run against the live URL: Performance 97,
  Accessibility 100, Best Practices 100, SEO 100; FCP 1.01 s, LCP 1.85 s,
  total blocking time 195 ms, CLS 0. No runtime error or warning.

## Required next verification

Repair and test the real file-upload path first, enable the live checkout,
raise all body/supporting text to the contract minimum without breaking the
390 px layout, and replace the dead Germany source. Then rerun this full report
against the new candidate and live build. No product code was modified during
this verification.
