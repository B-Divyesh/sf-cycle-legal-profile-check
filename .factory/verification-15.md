# Independent verification 15

## Result: PASS

Candidate `d3de646246b56355cc29247565efe0ceee14dcdc` was independently
verified on 2026-09-02 against
<https://cycle-legal-profile-check.sociobot.in>. Product code and
infrastructure were not changed.

No Critical, High, Medium, or Low defects were found.

## First-read gate

A fresh Chromium profile opened the live landing page at 1440 × 900. The
first screen answers the required questions without scrolling:

- What it does: “Check GPX track access before you ride.”
- Who it is for: cyclists with a planned GPX track who want mapped access
  conflicts before departure.
- What to click first: “Try it with sample data,” followed by “Opens a sample
  report. Nothing is saved to your real data.”

The action opens `/demo` in one click. The direct `/demo` and `?demo=1` paths
show the dated Brussels speed-pedelec report immediately, with the persistent
demo banner, reset action, start-for-real action, one explicit
`speed_pedelec=no` conflict, and one unmapped uncertainty finding.

The same first-screen content fits within the 390 × 844 mobile viewport. Its
last required fact ends at 814 CSS pixels.

## Claim manifest gate

`.factory/claims.json` exists and contains 25 unique claims. After the clean
lockfile install (`npm ci`: 85 packages, 0 vulnerabilities), every command was
run individually and passed:

| Claim | Result |
| --- | --- |
| `demo-sample-report` | PASS |
| `mapped-access-conflicts` | PASS |
| `demo-isolation` | PASS |
| `csv-export` | PASS |
| `offline-reload` | PASS |
| `report-evidence` | PASS |
| `vehicle-rule-profile` | PASS |
| `regional-cycleway-decisions` | PASS |
| `fixture-analyzer-contract` | PASS |
| `gpx-size-limit` | PASS |
| `sampling-density` | PASS |
| `matching-radius` | PASS |
| `regional-pricing` | PASS |
| `billing-refunds` | PASS |
| `license-browser-local` | PASS |
| `gpx-not-retained` | PASS |
| `aggregate-page-view` | PASS |
| `ip-not-persisted` | PASS |
| `overpass-data-disclosure` | PASS |
| `browser-storage-removal` | PASS |
| `api-rate-limit` | PASS |
| `hundred-route-detection` | PASS |
| `retained-data-database` | PASS |
| `database-locking-fallback` | PASS |
| `port-only-startup` | PASS |

The landing page, legal pages, report, README, and copy audit were also
cross-checked against the manifest. No unlisted product claim was found.

## Local clean-build gates

| Gate | Evidence | Result |
| --- | --- | --- |
| Install | `npm ci`; 85 packages, 0 vulnerabilities | PASS |
| Unit/integration | `npm test`; 3 Vitest, 27 Rust unit, 1 runtime process test | PASS |
| Types | `npm run typecheck` | PASS |
| Format/lint | `npm run lint`; rustfmt and Clippy with warnings denied | PASS |
| Frontend production build | `npm run build`; `dist/` produced | PASS |
| Backend production build | `cargo build --release --locked` | PASS |
| Full browser suite | `npm run test:e2e`; 54/54 | PASS |

The production frontend payload is 21,861 bytes raw / 8.12 kB gzip JS and
15,068 bytes raw / 4.02 kB gzip CSS. The responsive hero images are 59,794
bytes mobile and 143,378 bytes desktop. These are within the product budgets.
Docker and Podman are not installed in this verifier container, so a local
container-image build was not available. The locked release binary and exact
frontend production build were both exercised.

## End-to-end behavior

The live application was exercised without request interception:

- An 8 MiB + 1 byte GPX was rejected in the browser before `/api/analyze`.
- Malformed XML reached the backend, returned 422, and displayed: “The GPX is
  not valid XML. Try again or use a smaller GPX.”
- Replacing it with the built-in Brussels GPX recovered without reload. The
  live analyzer returned 200, 100% mapped coverage, one finding, and the
  conservative “No tagged conflicts found” result with its legal-clearance
  warning.
- The separate demo continued to show the deterministic prohibited and
  uncertain sections, OSM evidence, dated rule source, and working CSV export.
- Belgium remained usable without a license. The €19 one-time Netherlands and
  Germany pack, Sociobot checkout URL, restore flow, cached verdict, and
  revoked-license behavior passed the recorded billing tests. The product
  does not require sign-in, so the Entra requirement is not applicable.

No application exception occurred. Cold loads and the successful flow had no
console errors. Chromium logged its standard failed-resource diagnostic for
the deliberately requested 422 response; the application caught that response
and presented the expected recovery message.

## Privacy, security, and backend boundaries

- The live demo made four requests: its own HTML, JS, CSS, and hero image. It
  made no analyzer, page-view, billing, or third-party request.
- The live real flow requested only the product origin: shell assets,
  `/api/page-view`, and `/api/analyze`. The browser sent no request directly to
  Overpass. The backend privacy boundary is covered by passing tests that
  assert only sampled coordinates leave for Overpass, GPX content is never
  persisted, IPs are not persisted, and SQLite contains only the aggregate
  page-view counter.
- `/`, `/demo`, `/privacy`, `/terms`, the 404 response, assets, service worker,
  and crawler files returned the declared CSP, `X-Content-Type-Options:
  nosniff`, `X-Frame-Options: DENY`, and strict-origin referrer policy.
- HTML, the service worker, manifest, and crawler files use `no-cache`.
  Content-hashed JS and CSS use `public, max-age=31536000, immutable`.
- `/health` uses `no-store` and returned
  `{"build":"d3de646246b56355cc29247565efe0ceee14dcdc","status":"ok"}`.
- A 100-request concurrent `/health` smoke returned 100 × 200.
- One HTTP/2 client sent 60 `/api/page-view` requests: 40 returned 204 and 20
  returned 429 with `Retry-After: 1`.
- The same independent check against `/api/analyze`, using malformed input to
  avoid Overpass work, returned 40 × 422 followed by 20 × 429. Every 429 had
  `Retry-After: 1`. Observed allowance: burst 40 per client, replenishing at
  20 requests per second. `/health` is intentionally exempt.
- Persistence, `/data` selection, SQLite locking, local fallback, and
  PORT-only startup were exercised by the passing runtime contract tests.

## Deployment identity

The live health identity exactly matches the candidate. Every one of the 15
files in fresh local `dist/` was downloaded from the live deployment and
compared by SHA-256; all 15 matched byte-for-byte, including HTML, JS, CSS,
service worker, metadata, 404, and image assets.

## Accessibility, responsive behavior, and PWA

- Fresh live checks covered `/`, `/demo`, `/privacy`, and `/terms` at 1440 ×
  900 and 390 × 844. Each had one H1, one main landmark, no horizontal
  overflow, no page/console error, and zero serious or critical Axe findings.
- Keyboard checks covered the skip link, every primary navigation target,
  mobile-menu Enter activation, Escape dismissal with focus restoration,
  route-change focus, report selection, and visible focus rings. Tested report
  and navigation targets meet 44 px sizing; measured paid-section focus
  contrast was 6.80:1.
- A reduced-motion browser matched the media query and exposed no running
  document animations. The CSS reduces animation and transition duration and
  removes the hover transform.
- The service worker registered and activated from `/sw.js`; an explicit
  `registration.update()` succeeded. Cache `cycle-legal-shell-v7` was present.
  After switching offline, `/demo` reloaded with its sample report and visible
  offline notice.
- The designed 404 returns HTTP 404 and provides routes back to the checker
  and demo.

## Fresh live performance

Lighthouse 12.8.2 mobile run:

| Category/metric | Result |
| --- | --- |
| Performance | 97 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| First Contentful Paint | 1.1 s |
| Largest Contentful Paint | 1.8 s |
| Total Blocking Time | 170 ms |
| Cumulative Layout Shift | 0 |
| Total transferred | 244,189 bytes |

## Defects by severity

| Severity | Count | Defects |
| --- | ---: | --- |
| Critical | 0 | None |
| High | 0 | None |
| Medium | 0 | None |
| Low | 0 | None |

Final disposition: **PASS**.
