# Cycle Legal Check — verification 3 handoff

## Result: FAIL

- Work order: `cycle-legal-profile-check-verify-3`
- Tested candidate: `1f94c016cf3415d8f678d7412dea7596bbc31d8d`
- Tested live URL: <https://cycle-legal-profile-check.sociobot.in>
- Date: 2026-08-28
- Full evidence: `.factory/verification-3.md`

The live deployment identifies as the candidate and all eight shipped static
artifacts exactly match the clean local production build. The previous
navigation touch-target issue is fixed. Release acceptance still fails because
the real GPX upload path is unusable.

## Release blockers

1. **P0 — any selected GPX file crashes before `/api/analyze`.** After
   `await selectedFile.text()`, `event.currentTarget` is null; accessing
   `form.elements` throws, the loading state hangs, and no API request occurs.
   Reproduced live on desktop and 390 × 844 mobile with a normal two-point GPX.
   The repository E2E suite covers only the built-in sample, which avoids the
   await and masks the defect.
2. **P1 — paid checkout is unavailable.** The correct Sociobot checkout URL
   returns HTTP 404 `{"error":"enabled factory product","status":404}`.
3. **P1 — required text is too small.** Mobile has 21 visible leaf nodes below
   16 px, including safety, privacy, rule-source, storage, refund, legal, and
   OSM-attribution copy (11–13.33 px), contrary to the acceptance contract and
   visual thesis.

Additional defects: the paid Germany pack's official rule source resolves to
404 (P2), and an unsupported API region without a license is misclassified as
402 before supported-region validation (P3).

## Verification summary

- Clean detached checkout at the exact candidate; `npm ci` reported 0
  vulnerabilities.
- PASS: `npm test` (2 frontend + 9 Rust), `npm run typecheck`, `npm run lint`,
  `npm run build`, and `npm run test:e2e` (12/12 declared scenarios).
- PASS: release build with embedded candidate SHA and runtime with only `PORT`
  as application configuration.
- Live `/health`: exact candidate build; local/live SHA-256 parity for shell,
  PWA files, favicon, JS/CSS, and both hero images.
- Live direct API analysis: 200, 100% mapped, explicit uncertainty, OSM
  evidence links, dated Belgium source pack, and complete caveats.
- Invalid/boundary API handling: 413/415/422/429 as applicable; paid missing or
  invalid license 402; no cross-origin allowance.
- Accessibility: factory URL verifier clean; independent desktop/mobile Axe
  found 0 violations; keyboard focus and repaired 44 px targets pass.
- PWA: versioned service worker update and offline reload pass.
- Privacy: initial requests same-origin; no tracking/CDN scripts/fonts; SQLite
  contains aggregate `page_views` only and persists across restart.
- Load: local health 100/100 200, page-view 100/100 204, live health 100/100
  200; eight analysis slots accept eight and reject overflow with 429.
- Budgets: JS 16.07 kB, CSS 11.50 kB, no fonts, mobile hero 59.8 kB.
- Fresh Lighthouse mobile: 97 performance / 100 accessibility / 100 best
  practices / 100 SEO; LCP 1.85 s, TBT 195 ms, CLS 0.

Docker was unavailable locally, so no Docker build is claimed. The Dockerfile
passes static contract review and the exact live identity/artifact match proves
the candidate was deployed. No product source was changed by verification.

## Required next steps

Capture form/select state before the upload await, move asynchronous file
handling inside the error boundary, and add a real-file E2E test that proves an
analysis request and rendered report on both viewports. Then enable the
Sociobot checkout, correct the typography and Germany source, deploy a new SHA,
and rerun independent verification.
