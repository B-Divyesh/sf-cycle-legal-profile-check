# Cycle Legal Check — release repair handoff

## Outcome

PASS. All release-blocking findings in `.factory/verification-3.md` for candidate
`1f94c016cf3415d8f678d7412dea7596bbc31d8d` were reproduced and repaired.
The product-code repair is commit
`b5b0a4d87194e4f84ec5602780dc0f8841ac5a6f`; it was pushed to `origin/main`,
built by ACR, and deployed as the container artifact at
<https://cycle-legal-profile-check.sociobot.in>.

## Repairs

1. **Real GPX uploads no longer crash.** `submitCheck` now captures the stable
   form and selected profile before the first `await`, and file reading is
   inside the existing error boundary. A selected `File` reaches
   `/api/analyze`; malformed files produce a recoverable message.
2. **The €19 unlock is purchasable.** Registered the production, one-time,
   tax-inclusive EUR product `pdt_0NmM409DeV0tk3F1SzK5B` and enabled
   `cycle-legal-profile-check` in the Sociobot factory billing registry with
   the correct return URL. The public checkout now redirects to Dodo's hosted
   checkout instead of returning 404.
3. **No supporting copy is undersized.** The product-specific visual thesis now
   defines 16px as the minimum visible type step. Labels, safety/legal copy,
   storage/source hints, payment/refund copy, captions, attribution, and footer
   links all compute to at least 16px without desktop or 390px overflow.
4. **Germany has a maintained official source.** Replaced the dead redirect
   with the German Federal Ministry of Transport cycling page:
   <https://www.bmv.de/DE/Themen/Mobilitaet/Fahrradverkehr/fahrradverkehr.html>.
5. **Unsupported regions are validated before billing.** Unknown regions now
   return 422 with `That regional rule pack is not supported.` regardless of
   license state, rather than being misreported as a 402 payment failure.

The researched brief, Belgium free tier, CSV export, evidence/caveat behavior,
privacy model, visual direction, and deployment class are unchanged.

## Exact regression coverage

- `tests/e2e/app.spec.ts` uploads an actual in-memory `normal-route.gpx`, asserts
  the `/api/analyze` POST body/profile, waits for rendered evidence, and fails
  on page errors in both desktop Chromium and 390 × 844 mobile.
- The same suite uploads malformed XML, asserts the actionable 422 message,
  replaces the file, and proves a second successful analysis on both projects.
- A computed-style regression scans `/`, `/privacy`, `/terms`, and a rendered
  report for visible leaf text below 16px and horizontal overflow on both
  projects.
- Billing regressions cover the exact checkout URL, price/refund law copy,
  return-token storage and URL stripping, once-daily caching, successful
  restore, revoked-license relock/notice, and free-feature availability.
- Rust route coverage proves `XX` returns 422 before billing. Rust analyzer
  coverage pins the current official Germany label and URL.
- Existing touch-target, keyboard, Axe, legal-route, cache/update, offline,
  build-identity, CSV, and 100-case classifier guards remain green.

## Clean local verification

Run from the repository root:

```sh
cargo clean
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
BUILD_SHA=b5b0a4d87194e4f84ec5602780dc0f8841ac5a6f cargo build --release
```

Results on 2026-08-28:

- `npm ci`: 85 packages, 0 vulnerabilities.
- `npm test`: 2/2 Vitest and 11/11 Rust tests; the 100-case classifier guard
  passed.
- TypeScript typecheck passed; rustfmt and clippy with warnings denied passed.
- Vite production build passed: JS 16,060 B raw / 6,559 B gzip; CSS 11,696 B
  raw / 3,390 B gzip; mobile hero 59,794 B; no web fonts.
- Playwright 1.58.2: 22/22 across desktop and 390 × 844 mobile.
- Release binary: 7,130,296 B. With an empty environment except `PORT=8090`,
  it served `/` and `/health`; health reported the embedded repair SHA.
- Factory `verify-url.sh`: HTTP 200, title/lang/one h1/main/alt/button checks
  passed, 0 console or page errors. A 100-request, 20-concurrent local health
  smoke returned 100/100 HTTP 200.
- A controlled full-stack Overpass fixture exercised browser → Rust API → rule
  analyzer → rendered evidence with a real uploaded `File` on both viewports:
  HTTP 200, 100% coverage, expected prohibited verdict, 0 page errors.

Docker is not installed in the worker, so no local Docker result is claimed.
The required multi-stage Dockerfile was instead built successfully by Azure ACR
in 6m24s and deployed through `/opt/fleet/lib/deploy-container.sh`.

## Live verification

- `/health` returned HTTP 200 with build
  `b5b0a4d87194e4f84ec5602780dc0f8841ac5a6f`; live health load returned
  100/100 HTTP 200.
- Actual uploaded GPX files emitted `/api/analyze` and rendered a report on
  desktop and 390px mobile with 0 page errors. The map service returned an
  explicit 0%-coverage review on one request and 100%-coverage clear evidence
  on another, demonstrating honest unavailable/available states.
- Factory live URL verifier: load 673ms, 0 errors, correct title/lang, one h1,
  main present, no missing alt or unlabeled button.
- Independent Axe scans of `/`, `/privacy`, and `/terms` at both viewports:
  0 total violations. The same six scans found 0 undersized visible nodes and
  no horizontal overflow. Keyboard focus, 44px targets, reduced motion, and
  report-state checks pass in the Playwright matrix.
- Initial browser requests on all six scans were same-origin only. No route or
  license data is persisted server-side; the existing aggregate page-view-only
  privacy boundary is unchanged.
- Service worker update succeeded, controlled the page, kept only
  `cycle-legal-shell-v3` with seven shell entries, and rendered the explicit
  offline state after an offline reload.
- SHA-256 matched for all seven compared shipped files: service worker,
  manifest, favicon, both hero images, hashed JS, and hashed CSS.
- HTTP redirects permanently to HTTPS. HTML/PWA shell is `no-cache`; hashed
  JS/CSS is one-year immutable; health/API is `no-store`. CSP, `nosniff`, frame
  deny, and strict-origin referrer policy are present. Foreign-origin API
  preflight returns 405 with no allow-origin header.
- Germany's new official source returned HTTP 200. An unsupported-region live
  request returned 422 with the intended message.
- Billing checkout returned HTTP 303 to `checkout.dodopayments.com`; the hosted
  page returned 200 and named “Cycle Legal Check Regional Packs.” The public
  verify endpoint returned the documented structured invalid verdict for a
  synthetic token.
- Lighthouse 12.8.2 mobile: Performance 97, Accessibility 100, Best Practices
  100, SEO 100; FCP 1.00s, LCP 1.85s, TBT 194ms, CLS 0.

## Known gaps / next steps

- No real production payment or refund was placed because that would create a
  monetary transaction. Hosted checkout/product/return configuration is live;
  success, daily cache, restore, invalidation, revocation, and refund copy are
  covered against the exact billing contract in Playwright.
- Public Overpass availability varies. The product deliberately returns an
  explicit manual-review result when it is unavailable; both that state and a
  successful mapped state were observed live.
- No release-blocking product gap remains. The next action is independent
  verification of the final deployed commit.
