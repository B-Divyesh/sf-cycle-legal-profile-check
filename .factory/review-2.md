# Adversarial first-read review 2 — FAIL

**Reviewed:** 2026-09-01  
**Live URL:** <https://cycle-legal-profile-check.sociobot.in>  
**Repository commit:** `1f87af57845849e987fb39ce0f8ad226d3935919`

## Verdict

**FAIL.** The first screen is clear and the demo is genuinely usable, but three
findings remain. F-2-1 is blocking: the live privacy and terms pages make
visitor-reliance claims that have no matching entry and observable test in
`.factory/claims.json`. F-2-2 makes the required primary navigation disappear
at phone width. A PASS requires zero findings.

## Cold first read

Fresh Chromium contexts at **390 × 844** and **1440 × 900**, with no prior
storage, showed the same complete first-screen facts before scrolling.

| Question | Answer from the first screen |
| --- | --- |
| What does this do? | It checks a planned GPX track for mapped access conflicts before a ride. |
| For whom? | Cyclists who have a planned GPX track. |
| What should I click first? | **Try it with sample data**; adjacent text says it opens a sample report and does not save real data. |

The `<h1>` is “Check GPX track access before you ride.” The page has no mobile
horizontal overflow, no load-time console or page errors in a fresh context,
and the concrete, moss, orange, and route-inspection treatment is distinct
from a generic SaaS template.

## Findings

### F-2-1 — BLOCKING: privacy and free-feature promises are not listed as claims

**Location and exact quotes:** live `/privacy` and `/terms`.

- “The server holds the file in memory and does not retain it.”
- “Client IP addresses stay briefly in server memory to limit abusive bursts. They are not written to the database.”
- “License verification goes to Sociobot.”
- “The server sends sampled GPX track coordinates to OpenStreetMap’s Overpass service for public map tags.”
- “Clear this site’s storage to remove browser data.”
- “Accessibility, Belgium checks, safety warnings, and checklist export stay free.”

**Why this fails:** these are concrete promises about where sensitive route
data goes, what is retained, how browser data is removed, and what remains
free. None has a matching claim entry. `gpx-not-retained` proves only that a
test GPX is not persisted in SQLite; it does not prove memory-only handling or
the Overpass disclosure. `aggregate-page-view` does not prove that IPs are not
written. `regional-pricing` covers Belgium checks and CSV export, but not
accessibility or safety warnings. The claims contract requires a declared,
observable test for every statement a visitor can rely on.

**Concrete fix:** either remove or narrow the unproved text to the existing
tested statements, or add one claim and focused test for each promise. For
example, replace the first quote with “The server does not retain GPX track
data in SQLite.” Add an `overpass-data-disclosure` backend test that records
the upstream request and asserts it contains sampled coordinates only, an
`ip-not-persisted` SQLite test, and a `browser-storage-removal` browser test.
Replace the last quote with the already tested “Belgium checks and checklist
export stay free,” unless accessibility and warnings are explicitly tested as
free features.

### F-2-2 — Major: phone header has no primary navigation

**Location and evidence:** at 390 px, the live header exposes only the
wordmark and **Check a GPX track**. It does not expose **Demo**, **How it
works**, **Rule packs**, or **Privacy**. The shipped rule is
`@media(max-width:800px){.site-header nav{display:none}}` in
`frontend/src/style.css`.

**Why this fails:** the required site skeleton calls for a consistent header
with the product navigation and Privacy. On a phone, a visitor in the demo or
real checker must scroll to the footer to find Privacy, or manually change the
URL to reach the other sections. Hiding navigation rather than adapting it is
not a consistent mobile header.

**Concrete fix:** provide a 44 px labelled menu/disclosure at phone widths.
It must expose Demo, How it works, Rule packs, and Privacy; close with Escape;
retain focus correctly; and keep the links usable on `/`, `/demo`, `/privacy`,
and `/terms`. Add a 390 px browser test that opens the menu and follows
Privacy and Demo.

### F-2-3 — Minor: one README rule example exceeds the 22-word cap

**Location and exact quote:** README, regional-rule-pack explanation:
“An untagged `highway=cycleway` is a sign review in Belgium, but is prohibited
in the Netherlands and Germany unless the relevant mapped exception is
present.” (25 words under the documented Unicode word-token rule.)

**Why this fails:** it combines the Belgian decision, two country decisions,
and the exception in one dense technical sentence. A reader has to retain too
much before reaching the end; it also exceeds the stated hard cap.

**Concrete fix:** “An untagged `highway=cycleway` is a sign review in Belgium.
In the Netherlands and Germany, it is prohibited unless a mapped exception is
present.” Keep it covered by `regional-cycleway-decisions`.

## Copy audit

Counts use Unicode letter/number runs; punctuation is excluded, `€19` is one
number, and hyphenated/slash-separated terms are separate word runs. No
landing sentence exceeds 22 words; F-2-3 identifies the one overlong README
sentence. No banned marketing adjective,
metaphor heading, or non-result button was found. The product consistently
uses **GPX track**, **regional rule pack**, **map evidence**, **report**, and
**demo/sample report**.

### Landing page sentences

| Words | Sentence | Check |
| ---: | --- | --- |
| 7 | Check GPX track access before you ride. | `mapped-access-conflicts` |
| 15 | For cyclists with a planned GPX track, find mapped access conflicts before starting the ride. | `mapped-access-conflicts` |
| 4 | Opens a sample report. | `demo-sample-report` |
| 7 | Nothing is saved to your real data. | `demo-isolation` |
| 5 | Check your own GPX track. | Action label |
| 6 | Demo uses a separate sample workspace. | `demo-isolation` |
| 8 | After one online visit, the page reloads offline. | `offline-reload` |
| 4 | Belgium checks are free. | `regional-pricing` |
| 6 | Regional rule packs cost €19 once. | `regional-pricing` |
| 6 | Illustration: map evidence can be incomplete. | Useful limitation caption |
| 7 | Check a GPX track before you ride. | Section heading |
| 4 | Upload a GPX track. | Input instruction |
| 11 | Choose the vehicle and regional rule pack used in its report. | `vehicle-rule-profile` |
| 8 | GPX track · up to 8 MB · never stored. | `gpx-size-limit`; `gpx-not-retained` |
| 7 | The report shows evidence for this vehicle. | `vehicle-rule-profile` |
| 8 | Sources are dated and linked in every report. | `report-evidence` |
| 7 | Review three parts of your GPX track. | Section heading |
| 8 | Choose the GPX track you plan to ride. | How-it-works instruction |
| 7 | Choose your vehicle and regional rule pack. | `vehicle-rule-profile` |
| 7 | Review mapped conflicts, uncertainty, and dated sources. | `report-evidence` |
| 7 | Belgium checks and checklist export stay free. | `regional-pricing` |
| 9 | The purchase adds the Netherlands and Germany rule packs. | `regional-pricing` |
| 9 | Checkout and refunds are handled by Sociobot and Dodo. | `billing-refunds` |
| 8 | “No conflict found” does not mean legal clearance. | Necessary limitation |
| 7 | Cycle Legal Check is not legal advice. | Necessary limitation |
| 3 | Coverage is incomplete. | Necessary limitation |
| 9 | Hero image generated for this product with Azure AI. | Asset provenance |

The visible headings identify their sections: **Check a GPX track before you
ride**, **Review three parts of your GPX track**, **Regional rule packs cost
€19 once**, and **What this tool does not do**. Buttons name outcomes:
**Try it with sample data**, **Check this GPX track**, **Export review
checklist**, **Reset demo**, and **Start for real**.

### README sentences

| Words | Sentence | Check |
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
| 15 | A returned license stays in the browser and is verified at most once per day. | `license-browser-local` |
| 9 | The regional packs make separate, cautious speed-pedelec decisions. | `regional-cycleway-decisions` |
| 25 | An untagged `highway=cycleway` is a sign review in Belgium, but is prohibited in the Netherlands and Germany unless the relevant mapped exception is present. | **F-2-3** |
| 6 | Signs and local orders remain decisive. | Necessary limitation |
| 12 | The server handles a real GPX track only for its requested report. | `gpx-not-retained` |
| 9 | It does not retain GPX track data in SQLite. | `gpx-not-retained` |
| 7 | SQLite stores one aggregate page-view counter. | `aggregate-page-view` |
| 8 | Requirements: Node 22+, Rust 1.85+, and SQLite. | Run requirement |
| 4 | Open http://localhost:8080. | Run instruction |
| 10 | For split frontend and backend development, run `npm run dev`. | Run instruction |
| 3 | Configuration is optional. | Configuration instruction |
| 6 | PORT — HTTP port; defaults to `8080`. | Configuration reference |
| 24 | DATABASE_URL — optional SQLite URL override; the default is `/data/cycle-legal.sqlite` with SMB-safe locking when `/data` exists, otherwise `./cycle-legal.sqlite`. | Configuration reference |
| 5 | OVERPASS_URL — Overpass interpreter URL. | Configuration reference |
| 7 | BILLING_API_BASE — Sociobot billing API base. | Configuration reference |
| 7 | BUILD_SHA — build identifier returned by `/health`. | Configuration reference |
| 7 | The container starts with only `PORT` set. | Deployment reference |
| 8 | It creates its SQLite database on first boot. | Deployment reference |
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
| 3 | MIT — see LICENSE. | License reference |

F-2-3 supplies the required rewrite for the sole overlong sentence.

## Demo, sandbox, and real-job checks

- Fresh `/demo` and `/?demo=1` each opened an already populated Brussels
  speed-pedelec report, dated 1 August 2026, with an explicit
  `speed_pedelec=no` conflict and an incomplete-map-evidence finding.
- The persistent banner reads **Demo — sample data, nothing is saved**.
  **Reset demo** restored the report. A seeded
  `sb_license:cycle-legal-profile-check` value was unchanged; demo used only
  `demo:cycle-legal-profile-check:active`.
- The direct-demo request log contained only four same-origin shell requests:
  `/demo`, the self-hosted mobile hero WebP, the JavaScript bundle, and the
  stylesheet. It made no analyzer, page-view, billing, analytics, or
  third-party request.
- The real checker accepted a valid three-point Brussels GPX and posted the
  selected speed-pedelec profile to `/api/analyze`. The live API returned a
  cautious report; during this check the map-evidence service was unavailable,
  so the product correctly returned “Map evidence is missing” rather than a
  false clearance.
- After an online `/demo` visit, a fresh 390 px context went offline, reloaded,
  and retained the sample report plus its Offline notice.

## Claims and local verification

All 17 commands listed in `.factory/claims.json` passed from this checkout.

| Claim ids | Result |
| --- | --- |
| `demo-sample-report`, `mapped-access-conflicts`, `demo-isolation`, `csv-export`, `offline-reload`, `report-evidence`, `vehicle-rule-profile`, `gpx-size-limit`, `regional-pricing`, `billing-refunds`, `license-browser-local` | PASS — each declared Playwright grep command passed in desktop and 390 px projects |
| `regional-cycleway-decisions`, `sampling-density`, `matching-radius`, `gpx-not-retained`, `aggregate-page-view`, `api-rate-limit` | PASS — each declared focused Cargo command passed |

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, and the
full 48-test Playwright suite also passed. The production build is 7.94 kB
gzip JavaScript and 3.80 kB gzip CSS.

## Earlier finding closure

| Earlier id | Verified live and in code |
| --- | --- |
| F-1-1 | Landing and README reliance claims now map to declared claim IDs and the listed tests pass. The new F-2-1 quotes were not in the earlier landing finding. |
| F-1-2 | Header Privacy navigation and Back focus the new `<h1>`; `#route-status` announces “Privacy loaded” and then the landing heading on Back. |
| F-1-3 | Live unknown routes return the designed 404 with a unique title, description, canonical, OG/Twitter fields, favicon, and 180 px touch icon. |
| F-1-4 | The former decorative coordinate label is now “Illustration: map evidence can be incomplete.” |
| F-1-5 | Live UI and README use GPX track and regional rule pack consistently. |
| F-1-6 | The committed copy audit documents its word-token rule and its landing counts match the current landing copy. |

## Structure and accessibility

- `/`, `/demo`, `/privacy`, and `/terms` returned 200 with their own titles,
  descriptions, canonicals, exactly one `<h1>`, one `<main>`, header, and
  footer. The designed unknown route returned HTTP 404.
- The live link crawl returned 200 for all internal, checkout, and OSM links;
  the privacy contact is a valid `mailto:` link.
- Fresh route loads had no console/page errors. Axe found no serious or
  critical violations on each product route. Focus, route announcement, back
  navigation, and offline demo reload were verified live.
- The SVG social preview is an original 1200 × 630 product illustration; the
  favicon and touch icon load locally. Live CSP, `X-Content-Type-Options`, and
  `Referrer-Policy` headers are present.

## Missed leverage

No missed AI feature was found. The stated job is a rules-and-map-evidence
check, not a drafting or extraction task; adding decorative AI would reduce
honesty. The obvious product actions—GPX upload, regional profile, evidence
report, sample sandbox, and CSV review-checklist export—are present.

## What would make this perfect

Declare and test every remaining privacy/free-feature promise, or reduce the
copy to already proved statements. Then add a usable mobile primary-navigation
menu and split the one overlong README rule example. Re-run the same cold,
demo, claims, privacy-request, and route checks; only a zero-finding result is
a PASS.
