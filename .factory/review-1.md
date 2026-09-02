# Adversarial first-read review 1 — FAIL

**Reviewed:** 2026-08-30  
**Live URL:** <https://cycle-legal-profile-check.sociobot.in>  
**Reviewed commit:** `151959a4e858fdb6604db922297305a03f474adb`  
**Live build:** `d562c39c9eefc51e8193d869bade1fddbc58d014`

## Verdict

**FAIL.** The core first-read and one-click demo experience is clear and
tryable, and every declared claim test passes. The product still has six
findings, including an unlisted-claims contract failure and a route-change
screen-reader failure. A PASS requires zero findings.

## Cold first read

Fresh Chromium contexts at 390 × 844 and 1440 × 900 showed the same first
screen before scrolling.

- **What it does:** checks a planned GPX route for mapped access conflicts.
- **For whom:** cyclists who already have a GPX.
- **What to click first:** **Try it with sample data**; adjacent copy says it
  opens a sample report and does not save real data.

The first screen passes the three-question test. It has one visible primary
action, and the 390 px layout has no horizontal overflow. The live hero is a
distinct concrete/map/moss field-audit treatment, not a generic SaaS layout.

## Findings

### F-1-1 — BLOCKING: landing reliance claims have no declared claim tests

**Location and exact quotes:** landing hero/checker/how-it-works/pricing:

- “Check route access before you ride.”
- “For cyclists with a GPX, find mapped access conflicts before the ride.”
- “We compare nearby OpenStreetMap tags with your vehicle and regional rule pack.”
- “Vehicle class changes which access tags are treated as evidence.”
- “We sample your track and calculate its length on the server.”
- “Nearby OSM ways provide access and vehicle evidence.”
- “A dated regional pack marks conflicts and uncertainty.”
- “Unlock dated Netherlands and Germany interpretations with future pack updates.”
- “Sociobot/Dodo is the merchant of record. Refunds are handled there.”

**Why this fails:** `.factory/claims.json` has no claim entry for these
observable promises. Existing entries prove the sample report, isolation,
export, offline reload, report evidence, price, license cache, and storage
boundaries. They do not prove the advertised matching method, vehicle-profile
behaviour, future-update entitlement, or merchant/refund statement. A visitor
is asked to rely on these statements without the required sandbox proof.

**Concrete fix:** remove implementation promises that are not useful to a
visitor, or add one manifest entry and one `@claim:<id>` observable test per
promise. For example, add `vehicle-profile-evidence` using the bundled sample
to show a vehicle-specific access result; add `regional-pack-updates` only if
the purchased entitlement is observable in a fixture; and either test the
merchant/refund flow with a recorded fixture or replace it with the tested,
plain statement “Regional packs cost €19 once.” The headline and lede need a
claim entry that proves the demo shows a mapped conflict, or they need wording
limited to the existing tested report evidence.

### F-1-2 — Major: route changes leave keyboard and screen-reader users at the page body

**Location and evidence:** on the live landing page, activating the header
**Privacy** link opened `/privacy` with the visible `<h1>Privacy</h1>`, but
`document.activeElement` was `BODY`. There is no `[aria-live]` route
announcement. The same render path is in `frontend/src/main.ts`:
`render()` changes the route markup but never focuses the `h1` or announces the
new page.

**Why this fails:** a visitor using a screen reader receives no indication that
the page changed and must rediscover the content. This fails the required
deep-link/back-button route behaviour.

**Concrete fix:** after every route render and `popstate`, set focus to the new
`h1` (already `tabindex="-1"`) and update a persistent `aria-live="polite"`
route-status element. Add a browser test that activates Privacy, uses Back,
and asserts the focused heading and announcement both times.

### F-1-3 — Moderate: the 404 and touch-icon metadata are incomplete

**Location and evidence:** `frontend/public/404.html` has no meta description,
canonical link, Open Graph/Twitter fields, or apple-touch icon. The application
`frontend/index.html` also has no `apple-touch-icon` link, and
`frontend/public/manifest.webmanifest` has `"icons": []`.

**Why this fails:** the site-structure contract requires route metadata and an
SVG favicon plus 180 px apple-touch icon. The designed 404 is present and
returns HTTP 404 correctly, but its shared/discoverability metadata is absent
and an iOS home-screen install receives no product icon.

**Concrete fix:** add a project-original 180 × 180 touch icon, reference it on
the application and 404 documents, and provide the 404 with a plain
description, canonical URL, and matching OG/Twitter title, description, and
social image. Add a route metadata test for `/404.html`.

### F-1-4 — Minor: a visible caption is decorative rather than informative

**Location and exact quote:** hero-art caption, “FIELD STUDY / 50.85°N”.

**Why this fails:** it does not identify a section, explain the illustration,
or help a cyclist choose an action. It is a mood label that makes no sense
without product context, contrary to the plain-words heading/caption rule.

**Concrete fix:** remove it. If the coordinate is necessary, use a useful
caption such as “Illustration: map evidence can be incomplete.”

### F-1-5 — Minor: terminology for the same input is inconsistent

**Location and exact quotes:** landing checker says “Upload a **GPX track**.”
and `.factory/copy-audit.md` defines the product term as “GPX track”; README
opens with “a planned **GPX route**” and later says “upload a GPX.” Pricing
uses both “regional rule pack” and “regional packs.”

**Why this fails:** a first-time reader cannot tell whether a route, track, and
GPX are different inputs, or whether a regional pack is different from a
regional rule pack.

**Concrete fix:** use **GPX track** for the uploaded file and **regional rule
pack** for the country product everywhere. For example: “Cycle Legal Check
checks a planned GPX track for bicycle, e-bike, and speed-pedelec access
conflicts before a ride.”

### F-1-6 — Minor: the existing copy-audit word counts are not accurate

**Location and evidence:** `.factory/copy-audit.md` reports “Nothing is saved
to your real data.” as 8 words (it is 7), “After one online visit, the page
reloads offline.” as 9 (it is 8), “Check a GPX before you ride.” as 7 (it is
6), and “GPX track · up to 8 MB · never stored.” as 9 (it is 8). It also
counts the slash-separated “Sociobot/Dodo” as one word while its punctuation
is meant to be excluded.

**Why this fails:** the required audit is the proof that the plain-words cap
was checked. Incorrect counts make that proof unreliable.

**Concrete fix:** regenerate the audit with one documented word-count rule
(punctuation excluded; slash-separated words counted separately) and commit
the exact output.

## Copy audit

Counts exclude punctuation; slash-separated terms count as separate words.
There are no sentences above 22 words and no banned marketing adjectives.
Buttons use result-naming verbs; headings are reviewed separately below.

### Landing page sentences

| Words | Sentence | Result |
| ---: | --- | --- |
| 6 | Check route access before you ride. | F-1-1 unlisted claim |
| 12 | For cyclists with a GPX, find mapped access conflicts before the ride. | F-1-1 unlisted claim |
| 4 | Opens a sample report. | Claimed: `demo-sample-report` |
| 7 | Nothing is saved to your real data. | Claimed: `demo-isolation` |
| 6 | Demo uses a separate sample workspace. | Claimed: `demo-isolation` |
| 8 | After one online visit, the page reloads offline. | Claimed: `offline-reload` |
| 4 | Belgium checks are free. | Claimed: `regional-pricing` |
| 5 | Regional packs cost €19 once. | Claimed: `regional-pricing` |
| 6 | Check a GPX before you ride. | Pass |
| 4 | Upload a GPX track. | F-1-5 terminology baseline |
| 12 | We compare nearby OpenStreetMap tags with your vehicle and regional rule pack. | F-1-1 unlisted claim |
| 8 | GPX track · up to 8 MB · never stored. | Claimed: `gpx-not-retained` |
| 10 | Vehicle class changes which access tags are treated as evidence. | F-1-1 unlisted claim |
| 8 | Sources are dated and linked in every report. | Claimed: `report-evidence` |
| 6 | Check three kinds of route evidence. | Pass |
| 11 | We sample your track and calculate its length on the server. | F-1-1 unlisted claim |
| 8 | Nearby OSM ways provide access and vehicle evidence. | F-1-1 unlisted claim |
| 8 | A dated regional pack marks conflicts and uncertainty. | F-1-1 unlisted claim; F-1-5 terminology |
| 5 | Regional packs cost €19 once. | Claimed: `regional-pricing` |
| 7 | Belgium checks and checklist export stay free. | Claimed: `regional-pricing` |
| 10 | Unlock dated Netherlands and Germany interpretations with future pack updates. | F-1-1 unlisted claim |
| 7 | Sociobot/Dodo is the merchant of record. | F-1-1 unlisted claim |
| 4 | Refunds are handled there. | F-1-1 unlisted claim |
| 8 | “No conflict found” does not mean legal clearance. | Pass: necessary limitation |
| 7 | Cycle Legal Check is not legal advice. | Pass: necessary limitation |
| 3 | Coverage is incomplete. | Pass: necessary limitation |
| 9 | Hero image generated for this product with Azure AI. | Pass: asset provenance |

### README sentences

| Words | Sentence | Result |
| ---: | --- | --- |
| 18 | Cycle Legal Check checks a planned GPX route for bicycle, e-bike, and speed-pedelec access conflicts before a ride. | F-1-5: use GPX track |
| 14 | It compares sampled points with nearby OpenStreetMap ways and a dated regional rule pack. | Pass; technical audience is named |
| 8 | It is a planning aid, not legal advice. | Pass |
| 4 | Open the sample report. | Pass |
| 7 | It opens a dated Brussels report immediately. | Claimed: `demo-sample-report` |
| 17 | The sample stays separate from real browser data and does not call the analyzer or page-view endpoint. | Claimed: `demo-isolation`; “endpoint” is developer-facing jargon but the README is also run documentation |
| 18 | For a real check, open `/`, upload a GPX, choose a vehicle and region, and select **Check this route**. | F-1-5: use GPX track |
| 11 | Reports show OSM tags, a dated source, and clear review limits. | Claimed: `report-evidence` |
| 5 | CSV checklist export is free. | Claimed: `regional-pricing` |
| 4 | Belgium checks are free. | Claimed: `regional-pricing` |
| 11 | Maintained Netherlands and Germany packs cost €19 once through Sociobot/Dodo. | Claimed: `regional-pricing`; F-1-5 terminology |
| 15 | A returned license stays in the browser and is verified at most once per day. | Claimed: `license-browser-local` |
| 11 | The server handles a real GPX only for its requested report. | Claimed by the storage-boundary test in substance |
| 8 | It does not retain route data in SQLite. | Claimed: `gpx-not-retained` |
| 6 | SQLite stores one aggregate page-view counter. | Claimed: `aggregate-page-view` |
| 7 | Requirements: Node 22+, Rust 1.85+, and SQLite. | Pass |
| 4 | Open <http://localhost:8080>. | Pass |
| 10 | For split frontend and backend development, run `npm run dev`. | Pass |
| 3 | Configuration is optional. | Pass |
| 6 | PORT — HTTP port; defaults to `8080`. | Pass |
| 10 | DATABASE_URL — SQLite URL; defaults to `sqlite://cycle-legal.sqlite?mode=rwc`. | Pass |
| 5 | OVERPASS_URL — Overpass interpreter URL. | Pass |
| 7 | BILLING_API_BASE — Sociobot billing API base. | Pass |
| 7 | BUILD_SHA — build identifier returned by `/health`. | Pass |
| 7 | The container starts with only `PORT` set. | Pass |
| 8 | It creates its SQLite database on first boot. | Pass |
| 9 | The browser claim commands are listed in `.factory/claims.json`. | Pass |
| 8 | Run every listed command from a fresh checkout. | Pass |
| 6 | The Vite build lands in `dist/`. | Pass |
| 15 | After deployment, verify the build identity and the 40-request allowance over one HTTP/2 connection. | Pass |
| 18 | Both API routes allow a burst of 40 requests per client and replenish at 20 requests per second. | Pass |
| 9 | Limits use the first `X-Forwarded-For` address from factory ingress. | Pass |
| 7 | Rejected requests return JSON `429` with `Retry-After`. | Pass |
| 3 | `/health` is exempt. | Pass |
| 14 | The checker samples a route at roughly 80 metres or one-sixtieth of its length. | Pass |
| 8 | It looks for highway geometry within 35 metres. | Pass |
| 12 | Parallel ways, incomplete tags, temporary orders, and signs can change an outcome. | Pass |
| 8 | Unmatched and vehicle-ambiguous sections are marked for review. | Pass |
| 9 | OpenStreetMap data is © OpenStreetMap contributors and licensed under ODbL. | Pass |
| 8 | Every report includes source links and source dates. | Claimed: `report-evidence` |
| 8 | See `/privacy` and `/terms` in the running app. | Pass |
| 3 | MIT — see LICENSE. | Pass |

### Headings, labels, and actions

`Check route access before you ride.`, `Check a GPX before you ride.`, `Check
three kinds of route evidence.`, `Regional packs cost €19 once.`, `How it
works`, `Maintained rule packs / one-time`, and `What this tool does not do`
all name their content. **Try it with sample data**, **Check your own GPX**,
**Use Brussels sample route**, **Check this route**, **Export review
checklist**, **Reset demo**, and **Start for real** name their outcomes. The
only non-informational visible label is F-1-4’s `FIELD STUDY / 50.85°N`.

## Demo and privacy verification

- Fresh `/demo` contexts at 390 px and desktop immediately showed a dated
  Brussels speed-pedelec report with the prohibited and incomplete-evidence
  findings.
- The persistent banner reads **Demo — sample data, nothing is saved**;
  **Reset demo** restored the report. The sole demo marker was
  `demo:cycle-legal-profile-check:active`; seeded real license data remained
  separate.
- Direct-demo request logs contained only the product HTML, self-hosted image,
  JS, and CSS. There was no analyzer, page-view, analytics, billing, or
  third-party request while demo remained active.
- The offline, CSV, evidence, pricing, and storage claims were exercised by
  their declared clean-clone tests, not inferred from button presence.

## Claims and clean-clone evidence

All nine declared commands passed from a fresh clone at the reviewed commit:

| Claim id | Result |
| --- | --- |
| `demo-sample-report` | PASS — 2 browser projects |
| `demo-isolation` | PASS — 2 browser projects |
| `csv-export` | PASS — 2 browser projects |
| `offline-reload` | PASS — 2 browser projects |
| `report-evidence` | PASS — 2 browser projects |
| `regional-pricing` | PASS — 2 browser projects |
| `license-browser-local` | PASS — 2 browser projects |
| `gpx-not-retained` | PASS — 1 Rust test |
| `aggregate-page-view` | PASS — 1 Rust test |

`npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` also
passed in that clone. The production output is 20.08 kB raw / 7.65 kB gzip JS
and 13.47 kB raw / 3.70 kB gzip CSS. The clean-built JS/CSS SHA-256 hashes
match the deployed assets exactly.

## Structure, accessibility, and earlier-finding regression check

- `/`, `/demo`, `/privacy`, `/terms`, `/404.html`, `/robots.txt`,
  `/sitemap.xml`, `/manifest.webmanifest`, and `/sw.js` returned 200;
  an unknown route returned the designed 404 with HTTP 404. Internal product
  links resolve; external billing and OSM destinations were not crawled under
  this work order’s service-scope restriction.
- Main routes have correct titles, descriptions, canonicals, one `h1`, one
  `main`, language, no initial console errors, and no horizontal overflow at
  390 px or desktop. Axe found no serious or critical issue on `/`, `/demo`,
  `/privacy`, or `/terms` in either viewport. F-1-2 and F-1-3 remain.
- The earlier build-identity, direct legal-route, static-cache, real-upload,
  target-size, Germany-source, unsupported-region, demo, claims-manifest,
  crawler-file, 404, and deployed-limiter findings are fixed in the matched
  live build and current code. Evidence includes live `/health` returning
  `d562c39c…`, direct-route status checks, the clean-clone upload and
  44 px-navigation tests (4/4), the former fixture-corpus test, and the fixed-IP
  limiter Rust test. The external checkout endpoint itself was not contacted,
  as required by the service-scope restriction.
- The brief does not imply an AI step. GPX import and CSV export already cover
  the useful import/export leverage. No decorative AI feature or embedded
  provider key was found.

## What would make this perfect

Register and test every visitor-facing reliance claim, make route changes
announce and focus the new heading, complete the 404/iOS metadata, remove the
decorative caption, use one term for each product concept, and regenerate the
copy audit. Then rerun this whole review from a fresh browser context and clean
clone; the product would be a credible PASS candidate.
