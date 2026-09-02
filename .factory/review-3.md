# Adversarial first-read review 3 — FAIL

**Reviewed:** 2026-09-02 UTC

**Repository commit:** `c178c1b3ac5708db3e554f49378dea639124a143`

**Live URL:** <https://cycle-legal-profile-check.sociobot.in>

**Live build reported by `/health`:** `4272655a211a573ffb04a5b0f590369bb2351127`

## Verdict

**FAIL.** The product is clear, tryable, and technically well covered, but it
does not meet the required zero-finding standard. F-3-1 is a shared-footer
sentence that is both an unlisted factual claim and non-essential visitor copy.

## Cold first read

Fresh Chromium contexts at 390 × 844 and 1440 × 900 were opened with empty
browser storage. Before scrolling, the visible copy answered all three
questions.

| Question | Answer available from the first screen |
| --- | --- |
| What does this do? | It checks a planned GPX track for mapped access conflicts before a ride. |
| For whom? | Cyclists with a planned GPX track. |
| What should I click first? | **Try it with sample data**; its adjacent copy says it opens a sample report and does not save real data. |

The phone view had no horizontal overflow or load-time page/console error. It
kept the primary action and all three factual lines above the fold. The
concrete, moss, survey-orange, route-inspection art is visibly product-specific
rather than a generic SaaS template.

## Finding

### F-3-1 — Minor: shared footer contains an unlisted, non-actionable provenance claim

**Location and exact quote:** every application route footer, including the
first landing-page screen: “Hero image generated for this product with Azure
AI.”

**Why this is a finding:** this is a factual claim without an entry in
`.factory/claims.json` or an observable sandbox test. It also does not help a
cyclist understand the route check, choose an action, price the service, or
understand a limitation. The recorded provenance in `.factory/design.md` is
the correct handoff location; repeating it as visitor-facing footer copy fails
the plain-words requirement that every sentence provide usable information.

**Concrete fix:** remove this sentence from `footer()` in
`frontend/src/main.ts` (and retain the existing provenance record in
`.factory/design.md`). Do not replace it with another provenance slogan. If
the owner explicitly requires it to remain public, add a uniquely identified
claim and a deterministic provenance-verification test; removal is the clearer
visitor experience.

## Copy audit

Counts use Unicode letter/number runs, exclude punctuation, count
slash-separated words separately, and count `€19` as one word. Buttons,
proper names, filenames, code identifiers, and the mechanical `//01` wordmark
are labelled below where they are not sentences. No audited sentence exceeds
22 words. Apart from F-3-1, the wording uses consistent terms, informative
headings, and result-naming actions.

### Landing page

| Words | Exact sentence or sentence-equivalent | Check |
| ---: | --- | --- |
| 7 | Check GPX track access before you ride. | `mapped-access-conflicts` |
| 15 | For cyclists with a planned GPX track, find mapped access conflicts before starting the ride. | `mapped-access-conflicts` |
| 4 | Opens a sample report. | `demo-sample-report` |
| 7 | Nothing is saved to your real data. | `demo-isolation` |
| 5 | Check your own GPX track. | Result-naming link |
| 6 | Demo uses a separate sample workspace. | `demo-isolation` |
| 8 | After one online visit, the page reloads offline. | `offline-reload` |
| 4 | Belgium checks are free. | `regional-pricing` |
| 6 | Regional rule packs cost €19 once. | `regional-pricing` |
| 6 | Illustration: map evidence can be incomplete. | Useful image limitation |
| 7 | Check a GPX track before you ride. | Informative section heading |
| 4 | Upload a GPX track. | Input instruction |
| 11 | Choose the vehicle and regional rule pack used in its report. | `vehicle-rule-profile` |
| 8 | GPX track · up to 8 MB · never stored. | `gpx-size-limit`, `gpx-not-retained` |
| 7 | The report shows evidence for this vehicle. | `vehicle-rule-profile` |
| 8 | Sources are dated and linked in every report. | `report-evidence` |
| 7 | Review three parts of your GPX track. | Informative section heading |
| 8 | Choose the GPX track you plan to ride. | How-it-works instruction |
| 7 | Choose your vehicle and regional rule pack. | `vehicle-rule-profile` |
| 7 | Review mapped conflicts, uncertainty, and dated sources. | `report-evidence` |
| 6 | Regional rule packs cost €19 once. | `regional-pricing` |
| 7 | Belgium checks and checklist export stay free. | `regional-pricing` |
| 9 | The purchase adds the Netherlands and Germany rule packs. | `regional-pricing` |
| 9 | Checkout and refunds are handled by Sociobot and Dodo. | `billing-refunds` |
| 8 | “No conflict found” does not mean legal clearance. | Necessary limitation |
| 7 | Cycle Legal Check is not legal advice. | Necessary limitation |
| 3 | Coverage is incomplete. | Necessary limitation |
| 9 | Hero image generated for this product with Azure AI. | **F-3-1: unlisted and non-actionable** |

The non-sentence landing labels were checked too: **GPX track access / before
departure**, **Pre-ride access check**, **How it works**, **Maintained rule
packs / one-time**, and **What this tool does not do** identify their content.
**Try it with sample data**, **Check this GPX track**, **Buy regional rule
packs**, **Export review checklist (.csv)**, and **Have a license? Restore
purchase** name a result or the next concrete action.

### README

| Words | Exact sentence or sentence-equivalent | Check |
| ---: | --- | --- |
| 20 | Cycle Legal Check checks a planned GPX track for bicycle, e-bike, and speed-pedelec access conflicts before a ride. | `mapped-access-conflicts` |
| 14 | It compares sampled points with nearby OpenStreetMap ways and a dated regional rule pack. | `vehicle-rule-profile`, `report-evidence` |
| 8 | It is a planning aid, not legal advice. | Necessary limitation |
| 4 | Open the sample report. | Instruction |
| 7 | It opens a dated Brussels report immediately. | `demo-sample-report` |
| 18 | The sample stays separate from real browser data and does not call the analyzer or page-view endpoint. | `demo-isolation` |
| 20 | For a real check, open `/`, upload a GPX track, choose a vehicle and region, and select Check this GPX track. | `vehicle-rule-profile` |
| 11 | Reports show OSM tags, a dated source, and clear review limits. | `report-evidence` |
| 5 | CSV checklist export is free. | `regional-pricing` |
| 4 | Belgium checks are free. | `regional-pricing` |
| 16 | The Netherlands and Germany regional rule packs cost €19 once through Sociobot billing, backed by Dodo. | `regional-pricing`, `billing-refunds` |
| 7 | A returned license stays in the browser. | `license-browser-local` |
| 8 | Sociobot verifies it at most once per day. | `license-browser-local` |
| 10 | The regional rule packs make separate, cautious speed-pedelec decisions. | `regional-cycleway-decisions` |
| 10 | An untagged `highway=cycleway` is a sign review in Belgium. | `regional-cycleway-decisions` |
| 14 | In the Netherlands and Germany, it is prohibited unless a mapped exception is present. | `regional-cycleway-decisions` |
| 6 | Signs and local orders remain decisive. | Necessary limitation |
| 10 | The server does not retain GPX track data in SQLite. | `gpx-not-retained` |
| 13 | It sends sampled coordinates to Overpass without the GPX file or track name. | `overpass-data-disclosure` |
| 7 | SQLite stores one aggregate page-view counter. | `aggregate-page-view` |
| 8 | Client IP addresses are not written to SQLite. | `ip-not-persisted` |
| 8 | Requirements: Node 22+, Rust 1.85+, and SQLite. | Run requirement |
| 4 | Open http://localhost:8080. | Run instruction |
| 10 | For split frontend and backend development, run `npm run dev`. | Run instruction |
| 3 | Configuration is optional. | Configuration instruction |
| 6 | PORT — HTTP port; defaults to `8080`. | Configuration reference |
| 6 | DATABASE_URL — optional SQLite URL override. | Configuration reference |
| 19 | When `/data` is mounted, the default is `/data/cycle-legal.sqlite`, and the aggregate counter survives a database restart. | `retained-data-database` |
| 15 | This path selects SQLite's `unix-dotfile` locking for the fleet's SMB-backed mount. | `database-locking-fallback` |
| 8 | Without `/data`, the default is `./cycle-legal.sqlite`. | `database-locking-fallback` |
| 5 | OVERPASS_URL — Overpass interpreter URL. | Configuration reference |
| 7 | BILLING_API_BASE — Sociobot billing API base. | Configuration reference |
| 7 | BUILD_SHA — build identifier returned by `/health`. | Configuration reference |
| 7 | The container starts with only `PORT` set. | `port-only-startup` |
| 8 | It creates its SQLite database on first boot. | `port-only-startup` |
| 10 | The browser claim commands are listed in `.factory/claims.json`. | Verification instruction |
| 8 | Run every listed command from a fresh checkout. | Verification instruction |
| 6 | The Vite build lands in `dist/`. | Build instruction |
| 16 | After deployment, verify the build identity and the 40-request allowance over one HTTP/2 connection. | Verification instruction |
| 18 | Both API routes allow a burst of 40 requests per client and replenish at 20 requests per second. | `api-rate-limit` |
| 11 | Limits use the first `X-Forwarded-For` address from factory ingress. | `api-rate-limit` |
| 8 | Rejected requests return JSON `429` with `Retry-After`. | `api-rate-limit` |
| 3 | `/health` is exempt. | `api-rate-limit` |
| 18 | The checker samples a route at 80 metres or one-sixtieth of its length, whichever is farther apart. | `sampling-density` |
| 8 | It searches for highway geometry within 35 metres. | `matching-radius` |
| 12 | Parallel ways, incomplete tags, temporary orders, and signs can change an outcome. | Necessary limitation |
| 9 | Unmatched and vehicle-ambiguous sections are marked for review. | `report-evidence` |
| 9 | OpenStreetMap data is © OpenStreetMap contributors and licensed under ODbL. | Required attribution |
| 8 | Every report includes source links and source dates. | `report-evidence` |
| 8 | See `/privacy` and `/terms` in the running app. | Documentation link |
| 6 | Contains fourteen deterministic map-tag fixtures. | `fixture-analyzer-contract` |
| 18 | They exercise every supported vehicle and regional pack, mapped restrictions, and unmapped review output through the production analyzer. | `fixture-analyzer-contract` |
| 9 | This contract proves the documented behavior of this build. | `fixture-analyzer-contract` |
| 16 | It does not measure legal accuracy, map completeness, or whether a specific GPX track is lawful. | Necessary limitation |
| 7 | Contains 100 unique stored OSM way snapshots. | `hundred-route-detection` |
| 17 | Each label comes from an explicit contributor-supplied `bicycle=no\|private` or `speed_pedelec=no\|private` tag. | `hundred-route-detection` |
| 13 | Every record includes the way URL, snapshot time, vehicle, region, tags, and geometry. | `hundred-route-detection` |
| 14 | The production analyzer must flag at least 90% of these independently labeled access conflicts. | `hundred-route-detection` |
| 12 | This is a repeatable detection check for the stored explicit-tag set. | `hundred-route-detection` |
| 19 | It is not a legal-accuracy estimate, a map-completeness measure, or proof that any whole route is lawful. | Necessary limitation |
| 3 | MIT — see LICENSE. | License reference |

No README sentence exceeded 22 words, used a banned marketing adjective, or
introduced a terminology conflict. The exact non-prose headings identify their
sections: **Try the sample**, **Run locally**, **Verify**, **Data and limits**,
**Analyzer fixture contract**, **Labeled route evaluation**, and **License**.

## Demo, sandbox, and privacy behavior

- A fresh `/demo` context immediately displayed the dated Brussels canal
  speed-pedelec report, 80% mapped coverage, an explicit
  `speed_pedelec=no` conflict, a map-evidence review, OSM tags, and the dated
  Belgium rule source. The first screen after the one-click action was already
  a working report, not a setup form.
- The persistent banner read **Demo — sample data, nothing is saved** and
  exposed **Reset demo** and **Start for real**. Reset restored the report.
- With a real `sb_license:cycle-legal-profile-check` seeded before visiting
  `/demo`, demo storage contained only
  `demo:cycle-legal-profile-check:active=1`; the real license was unchanged
  after Reset. **Start for real** removed only the demo marker.
- The observed demo requests were `/demo`, the self-hosted mobile WebP, JS,
  and CSS. There was no `/api/analyze`, `/api/page-view`, billing, analytics,
  Overpass, or third-party request.
- The declared offline claim was also exercised by its clean-clone Playwright
  command. It passed.

## Claims and local verification

The review used a new local clone of this checkout at
`/tmp/cycle-review-k5yNBI/clean`, ran `npm ci`, then ran every one of the 25
distinct commands declared in `.factory/claims.json` separately. All passed.
This includes every browser `@claim:` flow and every focused Rust command.

- `npm test` passed: 3 Vitest tests, 27 Rust unit tests, and 1 runtime
  integration test.
- `npm run typecheck`, `npm run lint`, and `npm run build` passed. The build
  produced `dist/`.
- `npm run test:e2e` ran the full 52-test Playwright suite after the focused
  claim runs; no failure artifact or retry result was produced.

## Earlier finding closure

Every earlier review and polish record was read. The following checks were
repeated on the live site and the current code rather than accepted from the
status tables in those records.

| Earlier id | Verification result |
| --- | --- |
| F-1-1 | Fixed. Landing and README reliance claims map to the 25 current claim entries; their focused commands passed. |
| F-1-2 | Fixed. At 390 px, Menu exposed Demo, How it works, Rule packs, and Privacy. Opening Privacy focused its H1 and announced “Privacy loaded”; Back focused the landing H1 and announced it. |
| F-1-3 | Fixed. The live unknown route returned the styled HTTP 404 with title, description, canonical, OG/Twitter tags, SVG favicon, and 180 px touch icon. |
| F-1-4 | Fixed. The former coordinate mood caption is now the informative “Illustration: map evidence can be incomplete.” |
| F-1-5 | Fixed. Current product and README copy use **GPX track** and **regional rule pack** consistently. |
| F-1-6 | Fixed. Current recorded counts match the stated word-token rule. |
| F-2-1 | Fixed. The privacy and price promises are represented by `gpx-not-retained`, `aggregate-page-view`, `ip-not-persisted`, `license-browser-local`, `overpass-data-disclosure`, `browser-storage-removal`, and `regional-pricing`; their commands passed. |
| F-2-2 | Fixed. The phone Menu is labelled, has 44 px controls, exposes all primary destinations, and the route behavior above works. |
| F-2-3 | Fixed. The README country example is split into 10-word and 14-word sentences. |

F-3-1 is new: it was not one of the prior captions or legal-copy findings and
remains present in the current live shared footer and source.

## Structure, routes, and visual checks

- `/`, `/demo`, `/privacy`, and `/terms` each returned 200 with a route title,
  description, canonical, one H1, `main`, consistent header/footer, and
  Privacy/Terms links. `/no-such-route` returned the designed HTTP 404.
- `/robots.txt`, `/sitemap.xml`, manifest, favicon, touch icon, and `404.html`
  all returned 200. The sitemap includes all four product routes. The live
  security response included CSP, `X-Content-Type-Options`, and
  `Referrer-Policy`.
- Internal product links resolved. The paid checkout endpoint returned its
  expected 303 checkout redirect; the OSM attribution returned 200 and the
  Belgium rule-source link redirected normally.
- Normal-route fresh loads reported no console/page errors. The browser
  reports the expected HTTP-404 network error when deliberately opening the
  missing route; this is the server’s required 404 status, not an application
  runtime error.
- No AI feature is missing. The job is a deterministic GPX/map-evidence
  review. It already includes the implied import (GPX), vehicle/region
  selection, a review report, source links, and CSV export. An AI action would
  be decorative and would not improve the stated job.

## What would make this perfect

Remove the footer’s image-generation sentence, rerun the exact claim commands
and cold `/` plus `/demo` checks, and confirm no new copy or claim finding is
introduced. With F-3-1 closed, this review’s other checks support a PASS.
