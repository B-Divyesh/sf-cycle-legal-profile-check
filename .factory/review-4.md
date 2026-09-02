# Adversarial first-read review 4 — PASS

**Reviewed:** 2026-09-02 UTC  
**Repository commit:** `b3959922f792117300994b228bcdd6742dedd019`  
**Live URL:** <https://cycle-legal-profile-check.sociobot.in>  
**Live build:** `d3de646246b56355cc29247565efe0ceee14dcdc`

## Verdict

**PASS.** There are zero findings. The live product is understandable before
scrolling, the sample is immediate and isolated, declared claims passed their
clean-clone commands, and the earlier review findings remain fixed in both the
live product and source.

## Cold first read

Fresh, signed-out Chromium contexts at 390 × 844 and 1440 × 900 showed the
same first screen without errors or horizontal overflow.

| Question | Answer visible before scrolling |
| --- | --- |
| What does this do? | It checks a planned GPX track for mapped access conflicts before riding. |
| For whom? | Cyclists who already have a planned GPX track. |
| What should I click first? | **Try it with sample data**; the adjacent copy says it opens a sample report and does not save real data. |

The headline is “Check GPX track access before you ride.” The product-specific
concrete, moss, survey-orange, map-inspection treatment is distinct from a
generic SaaS template and remains legible at phone width.

## Copy audit

Word counts use Unicode letter/number runs; hyphenated compounds and terms
such as `e-bike` count as their visible word parts. No audited sentence exceeds
22 words. No banned marketing adjective, mood heading, ambiguous action button,
or inconsistent **GPX track** / **regional rule pack** term was found.

### Landing page

| Words | Sentence | Check |
| ---: | --- | --- |
| 7 | Check GPX track access before you ride. | Claimed: `mapped-access-conflicts` |
| 15 | For cyclists with a planned GPX track, find mapped access conflicts before starting the ride. | Claimed: `mapped-access-conflicts` |
| 4 | Opens a sample report. | Claimed: `demo-sample-report` |
| 7 | Nothing is saved to your real data. | Claimed: `demo-isolation` |
| 5 | Check your own GPX track. | Result-naming action |
| 6 | Demo uses a separate sample workspace. | Claimed: `demo-isolation` |
| 8 | After one online visit, the page reloads offline. | Claimed: `offline-reload` |
| 4 | Belgium checks are free. | Claimed: `regional-pricing` |
| 6 | Regional rule packs cost €19 once. | Claimed: `regional-pricing` |
| 6 | Illustration: map evidence can be incomplete. | Useful limitation/caption |
| 7 | Check a GPX track before you ride. | Section heading |
| 4 | Upload a GPX track. | Instruction |
| 11 | Choose the vehicle and regional rule pack used in its report. | Claimed: `vehicle-rule-profile` |
| 8 | GPX track · up to 8 MB · never stored. | Claimed: `gpx-size-limit`, `gpx-not-retained` |
| 7 | The report shows evidence for this vehicle. | Claimed: `vehicle-rule-profile` |
| 8 | Sources are dated and linked in every report. | Claimed: `report-evidence` |
| 7 | Review three parts of your GPX track. | Section heading |
| 8 | Choose the GPX track you plan to ride. | Instruction |
| 7 | Choose your vehicle and regional rule pack. | Instruction / claimed profile |
| 7 | Review mapped conflicts, uncertainty, and dated sources. | Claimed: `report-evidence` |
| 7 | Belgium checks and checklist export stay free. | Claimed: `regional-pricing` |
| 9 | The purchase adds the Netherlands and Germany rule packs. | Claimed: `regional-pricing` |
| 9 | Checkout and refunds are handled by Sociobot and Dodo. | Claimed: `billing-refunds` |
| 8 | “No conflict found” does not mean legal clearance. | Necessary limitation |
| 7 | Cycle Legal Check is not legal advice. | Necessary limitation |
| 3 | Coverage is incomplete. | Necessary limitation |

### README

The README inventory below includes prose and sentence-equivalent configuration
lines; commands, headings, URLs, and link labels are not sentences.

| Words | Sentence | Check |
| ---: | --- | --- |
| 20 | Cycle Legal Check checks a planned GPX track for bicycle, e-bike, and speed-pedelec access conflicts before a ride. | `mapped-access-conflicts` |
| 13 | It compares sampled points with nearby OpenStreetMap ways and a dated regional rule pack. | `vehicle-rule-profile`, `report-evidence` |
| 9 | It is a planning aid, not legal advice. | Necessary limitation |
| 8 | It opens a dated Brussels report immediately. | `demo-sample-report` |
| 17 | The sample stays separate from real browser data and does not call the analyzer or page-view endpoint. | `demo-isolation` |
| 20 | For a real check, open `/`, upload a GPX track, choose a vehicle and region, and select **Check this GPX track**. | Instruction / `vehicle-rule-profile` |
| 11 | Reports show OSM tags, a dated source, and clear review limits. | `report-evidence` |
| 5 | CSV checklist export is free. | `regional-pricing`, `csv-export` |
| 4 | Belgium checks are free. | `regional-pricing` |
| 16 | The Netherlands and Germany regional rule packs cost €19 once through Sociobot billing, backed by Dodo. | `regional-pricing`, `billing-refunds` |
| 8 | A returned license stays in the browser. | `license-browser-local` |
| 8 | Sociobot verifies it at most once per day. | `license-browser-local` |
| 10 | The regional rule packs make separate, cautious speed-pedelec decisions. | `regional-cycleway-decisions` |
| 10 | An untagged `highway=cycleway` is a sign review in Belgium. | `regional-cycleway-decisions` |
| 14 | In the Netherlands and Germany, it is prohibited unless a mapped exception is present. | `regional-cycleway-decisions` |
| 6 | Signs and local orders remain decisive. | Necessary limitation |
| 10 | The server does not retain GPX track data in SQLite. | `gpx-not-retained` |
| 14 | It sends sampled coordinates to Overpass without the GPX file or track name. | `overpass-data-disclosure` |
| 7 | SQLite stores one aggregate page-view counter. | `aggregate-page-view` |
| 8 | Client IP addresses are not written to SQLite. | `ip-not-persisted` |
| 6 | Requirements: Node 22+, Rust 1.85+, and SQLite. | Run requirement |
| 3 | Configuration is optional. | Run instruction |
| 5 | `PORT` — HTTP port; defaults to `8080`. | Configuration fact |
| 5 | `DATABASE_URL` — optional SQLite URL override. | Configuration fact |
| 16 | When `/data` is mounted, the default is `/data/cycle-legal.sqlite`, and the aggregate counter survives a database restart. | `retained-data-database` |
| 12 | This path selects SQLite’s `unix-dotfile` locking for the fleet’s SMB-backed mount. | `database-locking-fallback` |
| 7 | Without `/data`, the default is `./cycle-legal.sqlite`. | `database-locking-fallback` |
| 4 | `OVERPASS_URL` — Overpass interpreter URL. | Configuration fact |
| 7 | `BILLING_API_BASE` — Sociobot billing API base. | Configuration fact |
| 6 | `BUILD_SHA` — build identifier returned by `/health`. | Configuration fact |
| 7 | The container starts with only `PORT` set. | `port-only-startup` |
| 8 | It creates its SQLite database on first boot. | `port-only-startup` |
| 9 | The browser claim commands are listed in `.factory/claims.json`. | Documentation instruction |
| 8 | Run every listed command from a fresh checkout. | Documentation instruction |
| 6 | The Vite build lands in `dist/`. | Build fact |
| 15 | After deployment, verify the build identity and the 40-request allowance over one HTTP/2 connection. | Documentation instruction |
| 18 | Both API routes allow a burst of 40 requests per client and replenish at 20 requests per second. | `api-rate-limit` |
| 9 | Limits use the first `X-Forwarded-For` address from factory ingress. | `api-rate-limit` |
| 7 | Rejected requests return JSON `429` with `Retry-After`. | `api-rate-limit` |
| 3 | `/health` is exempt. | `api-rate-limit` |
| 16 | The checker samples a route at 80 metres or one-sixtieth of its length, whichever is farther apart. | `sampling-density` |
| 8 | It searches for highway geometry within 35 metres. | `matching-radius` |
| 12 | Parallel ways, incomplete tags, temporary orders, and signs can change an outcome. | Necessary limitation |
| 8 | Unmatched and vehicle-ambiguous sections are marked for review. | `report-evidence` |
| 9 | OpenStreetMap data is © OpenStreetMap contributors and licensed under ODbL. | Required attribution |
| 8 | Every report includes source links and source dates. | `report-evidence` |
| 8 | See `/privacy` and `/terms` in the running app. | Navigation instruction |
| 6 | Contains fourteen deterministic map-tag fixtures. | `fixture-analyzer-contract` |
| 16 | They exercise every supported vehicle and regional pack, mapped restrictions, and unmapped review output through the production analyzer. | `fixture-analyzer-contract` |
| 9 | This contract proves the documented behavior of this build. | `fixture-analyzer-contract` |
| 15 | It does not measure legal accuracy, map completeness, or whether a specific GPX track is lawful. | Necessary limitation |
| 7 | Contains 100 unique stored OSM way snapshots. | `hundred-route-detection` |
| 10 | Each label comes from an explicit contributor-supplied access tag. | `hundred-route-detection` |
| 13 | Every record includes the way URL, snapshot time, vehicle, region, tags, and geometry. | `hundred-route-detection` |
| 14 | The production analyzer must flag at least 90% of these independently labeled access conflicts. | `hundred-route-detection` |
| 11 | This is a repeatable detection check for the stored explicit-tag set. | `hundred-route-detection` |
| 18 | It is not a legal-accuracy estimate, a map-completeness measure, or proof that any whole route is lawful. | Necessary limitation |

All action controls name their outcome, including **Try it with sample data**,
**Check this GPX track**, **Export review checklist**, **Reset demo**, and
**Start for real**.

## Demo, sandbox, and privacy

- `/demo` and `/?demo=1` immediately showed the dated Brussels speed-pedelec
  report with a prohibited finding, an incomplete-evidence finding, OSM tags,
  and the dated source context.
- The persistent banner said **“Demo — sample data, nothing is saved”** and
  exposed **Reset demo** and **Start for real**. Reset restored the report.
- In a fresh context, direct `/demo` made only same-origin static requests.
  It made no analyzer, page-view, billing, analytics, Overpass, or third-party
  request.
- A seeded `sb_license:cycle-legal-profile-check` value survived Reset. Demo
  used only `demo:cycle-legal-profile-check:active`; Start for real removed
  that demo marker and preserved the real license.

## Claims and tests

`npm ci` was run in detached clean clone `/tmp/cycle-review-rEGjs9`. Each of
the 25 commands declared in `.factory/claims.json` completed successfully:

`demo-sample-report`, `mapped-access-conflicts`, `demo-isolation`,
`csv-export`, `offline-reload`, `report-evidence`, `vehicle-rule-profile`,
`regional-cycleway-decisions`, `fixture-analyzer-contract`, `gpx-size-limit`,
`sampling-density`, `matching-radius`, `regional-pricing`, `billing-refunds`,
`license-browser-local`, `gpx-not-retained`, `aggregate-page-view`,
`ip-not-persisted`, `overpass-data-disclosure`, `browser-storage-removal`,
`api-rate-limit`, `hundred-route-detection`, `retained-data-database`,
`database-locking-fallback`, and `port-only-startup`.

`npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` also
passed in that clone. A combined 54-test Playwright run suffered a Chromium
SIGSEGV while creating a later test context; its only reported failure was
the affected `billing-refunds` test failing to create a browser context, not a
product assertion. The exact declared `billing-refunds` command was rerun
immediately and passed 2/2. The individual declared-claim results above are
therefore the test evidence used for this review.

## Structure and regression check

- `/`, `/demo`, `/privacy`, `/terms`, `/404.html`, crawler files, favicon,
  touch icon, manifest, and service worker returned 200. An unknown route
  returned the designed HTML 404 with status 404.
- Every app route had its own correct title, description, canonical, one `h1`,
  and a `main`. The live page exposed language, OG/Twitter metadata, a
  product-original social image, and matching security headers.
- Internal product links and fragment links resolved successfully. The external
  Sociobot checkout, OpenStreetMap, and mail links were identified but not
  requested under this product-only work order.
- Live SPA navigation moved focus to the new `h1`, announced the route, and
  Back restored the landing route. The 390 px labelled Menu exposed primary
  navigation and restored focus on Escape.
- No cold-load console or page errors, serious/critical Axe issue, or mobile
  horizontal overflow was found in the independently exercised live routes.
- `F-1-1` through `F-1-6`, `F-2-1` through `F-2-3`, and `F-3-1` were checked
  against both live behavior and source. Their claim coverage, focus/announce
  path, metadata, touch icon, useful caption, terminology, counts, mobile
  menu, legal copy, README sentence split, and footer deletion all remain
  fixed. No regression was found.

The brief implies GPX import, vehicle/region selection, map evidence, and a
checklist export; all are present. It does not imply an AI-assisted task, so
the absence of a decorative AI feature is correct. No provider key was found
in the product.

## What would make this perfect

No product change is required. Keep the direct demo, its request-isolation
test, and every claim test in the release gate so this zero-finding state is
preserved.
