# Verification 2 — FAIL

**Verifier work order:** `cycle-legal-profile-check-verify-2`
**Candidate:** `29c54e09007665bacc5632e7ce410edfae2a8cd8`
**Live URL:** https://cycle-legal-profile-check.sociobot.in
**Date:** 2026-08-28

## Decision

**FAIL — do not release this candidate unchanged.** The product is otherwise
substantially healthy, but it fails the repository's explicit, non-negotiable
44 × 44 CSS px touch-target requirement on the live 390 px layout.

## Release-blocking defect

### P1 — exposed navigation links are smaller than the required 44 px target

At a 390 × 844 mobile viewport, independent Playwright geometry measurement
found these visible interactive targets:

| Control | Measured size |
| --- | --- |
| `Cycle legal //01` wordmark | 133 × 20 px |
| `Check a route` header link | 114 × 39 px |
| `Privacy` footer link | 342 × 19 px |
| `Terms` footer link | 342 × 19 px |
| `© OpenStreetMap contributors` footer link | 342 × 19 px |

Desktop has the same issue for the wordmark and primary-nav links (for
example, `How it works` is 94 × 20 px). This violates the attached
accessibility acceptance contract: “Touch targets ≥ 44 px.” It is particularly
material for cyclists using the product on a phone. Give every exposed
navigation link a 44 px minimum block size (with adequate spacing) and rerun
mobile geometry and keyboard checks.

No critical or high-severity axe violation was found; this is a manual product
QA finding that axe does not test.

## Fresh deployment evidence

- `GET /health` returned HTTP 200 and
  `{"build":"29c54e09007665bacc5632e7ce410edfae2a8cd8","status":"ok"}`.
- The live `index-B_T6yCMH.js` SHA-256 is
  `62326def45e589604df884870a38d2775cfcc46bf47e7a3b2bbfa19dbbecb2fd`,
  exactly matching the clean candidate build. The live stylesheet digest also
  exactly matched (`0916e0b06b6361bc86d67a349bf3a199f6fdf211374efe4633a6130717a3cbfc`).
- A real Belgium bicycle GPX request returned HTTP 200, 100% mapped coverage,
  a dated `2026-08-01` Belgium rule pack, OSM/tag evidence state, and the
  explicit caveats required by the brief. It did not claim legal clearance.
- Live API negatives behaved safely: malformed XML 422, one-point GPX 422,
  unlicensed Netherlands request 402. Cross-origin `OPTIONS` returned 405
  with no allow-origin header.
- 100 concurrent live `/health` requests at concurrency 25 all returned 200
  in 5.805 s.

## Clean-checkout quality gates

The candidate was tested in a detached clean worktree at
`/tmp/cycle-legal-profile-check-qa-29c54e0` after `npm ci` (85 packages, zero
reported vulnerabilities).

| Check | Result |
| --- | --- |
| `npm test` | PASS — 2 Vitest + 9 Rust tests, including the former synthetic corpus guard |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS — rustfmt and clippy with warnings denied |
| `npm run build` | PASS — `dist/` produced |
| `npm run test:e2e` | PASS — 10/10 desktop and 390 px mobile Chromium tests |
| `BUILD_SHA=<candidate> cargo build --release` | PASS — 6.8 MB release binary |
| release binary with only `PORT=18080` application config | PASS — started, `/health` returned exact candidate SHA; `/privacy` and `/terms` returned 200 |

The first-load artifacts are within the stated static budgets: JS 16.07 kB
raw / 6.54 kB gzip, CSS 11.32 kB raw / 3.30 kB gzip, and the mobile hero is
59.8 kB. No web-font payload is shipped.

## Product and browser exercise

- Desktop and 390 px mobile: one `h1`, one `main`, title/language, no
  horizontal overflow; keyboard Tab reaches the skip link. The skip link is
  visibly revealed on focus. A mocked browser recovery sequence confirmed the
  empty-file message, server-error message, retry, and a rendered review
  result. The real live Belgium GPX check was exercised separately against
  Overpass.
- Reduced motion: the browser used `prefers-reduced-motion: reduce`; CSS
  suppresses animation/transition duration and smooth scrolling.
- Axe on each live viewport: **0 serious/critical findings**. There were no
  browser console errors or page errors.
- PWA: fresh live service worker controlled the page, created
  `cycle-legal-shell-v3`, then reloaded the shell offline with the explicit
  offline notice and no errors.
- Privacy/outbound: initial-page browser requests stayed same-origin. Source
  and CSP inspection found no analytics, third-party fonts, or third-party
  scripts. Deliberate external flows are the documented Sociobot billing
  verification/checkout endpoint and server-side public Overpass request.
  GPX is handled for the request; SQLite contains the aggregate counter table
  only. License and its verdict are browser-local as disclosed by `/privacy`.
- Response policy: HTML, legal pages, manifest, and `sw.js` are `no-cache`;
  hashed JS/CSS are `public, max-age=31536000, immutable`; stable hero image
  is `public, max-age=86400`; API and health are `no-store`. Live responses
  also supplied CSP, `nosniff`, `X-Frame-Options: DENY`, and strict-origin
  referrer policy.

## Tool limitation

I attempted a fresh mobile Lighthouse 12.8.2 run against the live URL using
the installed Playwright Chromium. Lighthouse's launcher first required an
explicit Chrome path and then the tab crashed before it produced a report.
This environment failure did not prevent the independent Playwright, axe,
asset-budget, header, PWA, and browser-error checks above; no fresh Lighthouse
score is claimed in this report.

## Required next step

Repair the P1 touch-target sizes, rerun the clean-checkout and live mobile QA,
then issue a new verification report. No product source was modified by this
verification.
