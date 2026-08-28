# Cycle Legal Check — repair handoff

## Release repair

- Work order: `cycle-legal-profile-check-repair-2`
- Verifier report commit: `4529e6ea5218882bd5cd73d7ee7b7e0a65b9ce36`
- Failed candidate: `29c54e09007665bacc5632e7ce410edfae2a8cd8`
- Date: 2026-08-28

The sole release blocker in `.factory/verification-2.md` is repaired without
changing the researched scope, analysis rules, paid-unlock behavior, privacy
model, deployment class, or visual thesis.

## Finding, reproduction, and root fix

At 390 × 844 px, the failed candidate reproduced the verifier's measurements:

| Target | Before | After |
| --- | ---: | ---: |
| `Cycle legal //01` | 133 × 20 px | 129 × 44 px |
| `Check a route` | 114 × 38.6 px | 114 × 44 px |
| `Privacy` | 342 × 18.6 px | 342 × 44 px |
| `Terms` | 342 × 18.6 px | 342 × 44 px |
| `© OpenStreetMap contributors` | 342 × 18.6 px | 342 × 44 px |

The root cause was that header and footer anchors inherited only the text line
box, while the narrow-screen action override reduced its padding. The shared
navigation rule now gives the wordmark, primary navigation, header action, and
legal-footer links a flex hit area with a 44 px minimum in both dimensions.
Existing navigation gaps remain at least 8 px.

`tests/e2e/app.spec.ts` now measures every visible header/footer navigation
target in both desktop Chromium and a touch-enabled 390 × 844 project. It
fails below 44 × 44 px, checks pairwise target spacing, and Tabs through the
skip link and each visible header link in order. This is manual-product-QA
geometry that axe does not test.

## Verification evidence

Run from `/work/repo`:

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
BUILD_SHA=<git-sha> cargo build --release
PORT=18080 target/release/cycle-legal-profile-check
```

- Clean install: 85 packages, 0 reported vulnerabilities.
- Unit/integration: 2/2 Vitest and 9/9 Rust tests passed, including the
  100-route classification and prohibited-recall guard.
- TypeScript strict typecheck, rustfmt, and clippy with warnings denied passed.
- Production build: `dist/` produced; JS 16,069 bytes raw / 6.54 kB gzip, CSS
  11,495 bytes raw / 3.33 kB gzip, mobile hero 59,794 bytes. No web fonts.
- Browser: 12/12 Playwright scenarios passed across desktop and touch-enabled
  390 × 844 Chromium. This includes analysis and evidence rendering, exact
  target geometry, keyboard order, direct legal routes, identity, cache
  policy, versioned offline reload, and one-day license-verdict caching.
- Accessibility: Playwright axe 4.10 reported 0 violations on both desktop and
  mobile. The URL verifier found title, `lang=en`, exactly one `h1`, a `main`,
  complete image alt text, labeled buttons, and no console/page errors.
- Reduced motion: animation and transition durations resolve to 0.01 ms.
  Neither viewport has horizontal overflow. All first-load browser requests
  are same-origin.
- Lighthouse 12.8.2 mobile: Performance 98, Accessibility 100, Best Practices
  100, SEO 100; LCP 2.3 s, total blocking time 100 ms, CLS 0.
- Release runtime started with only `PORT` as application configuration.
  `/health` returned the embedded full build SHA. `/privacy` and `/terms`
  returned 200.
- Response policy: HTML/legal/manifest/service worker `no-cache`; hashed CSS
  `public, max-age=31536000, immutable`; stable hero image
  `public, max-age=86400`; API and health `no-store`.
- API negatives: malformed XML 422, one-point GPX 422, unlicensed Netherlands
  request 402, cross-origin OPTIONS 405 with no CORS allowance.
- Load smoke: 100 concurrent `/health` requests at concurrency 25 all returned
  200.
- Packaging/consumer: no library-consumer check applies to this
  `web-with-backend` artifact. No local Docker engine is installed; the factory
  ACR build is the container/package check. The Dockerfile remains multi-stage,
  `.git` independent, non-root, and configured for port 8080.

The standalone axe CLI could not pair its downloaded ChromeDriver 152 with the
preinstalled Playwright Chromium 145. The same axe engine completed through
the repository's supported Playwright integration with zero violations.

## Deployment and remaining limitations

Deploy with the injected container work order:

```sh
/opt/fleet/lib/deploy-container.sh cycle-legal-profile-check /work/repo Dockerfile 8080
/opt/fleet/lib/verify-url.sh https://cycle-legal-profile-check.sociobot.in <evidence-dir>
```

The ACR build receives `BUILD_SHA`, `GIT_SHA`, and `SOURCE_COMMIT`; live
acceptance requires `/health.build` to equal the deployed `git rev-parse HEAD`.

Product limitations are unchanged: the deterministic 100-case corpus guards
implemented rules but is not field legal validation; OpenStreetMap/Overpass
coverage can be incomplete or unavailable; and the report remains a planning
aid rather than legal clearance.
