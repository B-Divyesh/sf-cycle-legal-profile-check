# Copy audit — 2026-09-02

The audited route is `/` in its clean, signed-out state. Labels, proper names,
file names, and legal links are excluded. Sentence-equivalent lines are
included. Counts use Unicode letter or number runs as words, exclude
punctuation, keep `€19` as one number, and count slash-separated words
separately. No row exceeds 22 words or uses a banned marketing term.

| Copy | Words | Result |
| --- | ---: | --- |
| Check GPX track access before you ride. | 7 | Pass — `mapped-access-conflicts` |
| For cyclists with a planned GPX track, find mapped access conflicts before starting the ride. | 15 | Pass — `mapped-access-conflicts` |
| Opens a sample report. | 4 | Pass — `demo-sample-report` |
| Nothing is saved to your real data. | 7 | Pass — `demo-isolation` |
| Check your own GPX track. | 5 | Pass |
| Demo uses a separate sample workspace. | 6 | Pass — `demo-isolation` |
| After one online visit, the page reloads offline. | 8 | Pass — `offline-reload` |
| Belgium checks are free. | 4 | Pass — `regional-pricing` |
| Regional rule packs cost €19 once. | 6 | Pass — `regional-pricing` |
| Illustration: map evidence can be incomplete. | 6 | Pass — necessary limitation |
| Check a GPX track before you ride. | 7 | Pass |
| Upload a GPX track. | 4 | Pass |
| Choose the vehicle and regional rule pack used in its report. | 11 | Pass — `vehicle-rule-profile` |
| GPX track · up to 8 MB · never stored. | 8 | Pass — `gpx-size-limit`, `gpx-not-retained` |
| The report shows evidence for this vehicle. | 7 | Pass — `vehicle-rule-profile` |
| Sources are dated and linked in every report. | 8 | Pass — `report-evidence` |
| Review three parts of your GPX track. | 7 | Pass |
| Choose the GPX track you plan to ride. | 8 | Pass |
| Choose your vehicle and regional rule pack. | 7 | Pass — `vehicle-rule-profile` |
| Review mapped conflicts, uncertainty, and dated sources. | 7 | Pass — `report-evidence` |
| Belgium checks and checklist export stay free. | 7 | Pass — `regional-pricing` |
| The purchase adds the Netherlands and Germany rule packs. | 9 | Pass — `regional-pricing` |
| Checkout and refunds are handled by Sociobot and Dodo. | 9 | Pass — `billing-refunds` |
| “No conflict found” does not mean legal clearance. | 8 | Pass — necessary limitation |
| Cycle Legal Check is not legal advice. | 7 | Pass — necessary limitation |
| Coverage is incomplete. | 3 | Pass — necessary limitation |
| Hero image generated for this product with Azure AI. | 9 | Pass — asset provenance |

## Privacy and terms copy added in polish round 2

| Copy | Words | Result |
| --- | ---: | --- |
| The server does not retain GPX track data in SQLite. | 10 | Pass — `gpx-not-retained` |
| It stores one aggregate page count. | 6 | Pass — `aggregate-page-view` |
| Client IP addresses enforce request limits. | 6 | Pass — `api-rate-limit` |
| They are not written to SQLite. | 6 | Pass — `ip-not-persisted` |
| A saved license and its once-daily verdict stay in your browser. | 12 | Pass — `license-browser-local` |
| License verification uses Sociobot. | 4 | Pass — `license-browser-local` |
| A check sends sampled GPX track coordinates to OpenStreetMap’s Overpass service. | 12 | Pass — `overpass-data-disclosure` |
| It does not send the GPX file or track name. | 10 | Pass — `overpass-data-disclosure` |
| This removes the saved license and demo marker from this browser. | 11 | Pass — `browser-storage-removal` |
| Belgium checks and checklist export stay free. | 7 | Pass — `regional-pricing` |

## README rewrites from polish round 2

| Copy | Words | Result |
| --- | ---: | --- |
| The regional rule packs make separate, cautious speed-pedelec decisions. | 10 | Pass — `regional-cycleway-decisions` |
| An untagged `highway=cycleway` is a sign review in Belgium. | 10 | Pass — `regional-cycleway-decisions` |
| In the Netherlands and Germany, it is prohibited unless a mapped exception is present. | 14 | Pass — `regional-cycleway-decisions` |
| The default is `/data/cycle-legal.sqlite` when `/data` exists. | 10 | Pass |
| It uses SMB-safe locking there. | 6 | Pass |
| Otherwise, it uses `./cycle-legal.sqlite`. | 6 | Pass |
| Contains fourteen deterministic map-tag fixtures. | 6 | Pass — `fixture-analyzer-contract` |
| They exercise every supported vehicle and regional pack, mapped restrictions, and unmapped review output through the production analyzer. | 16 | Pass — `fixture-analyzer-contract` |
| This contract proves the documented behavior of this build. | 9 | Pass — `fixture-analyzer-contract` |
| It does not measure legal accuracy, map completeness, or whether a specific GPX track is lawful. | 15 | Pass — necessary limitation |

## Terminology

| Concept | Product term |
| --- | --- |
| Uploaded GPS file and planned path | GPX track |
| Country-specific interpretation | regional rule pack |
| Map-derived material | OSM tags / map evidence |
| Product output | report |
| Uncertain evidence | review |
| Built-in sandbox | demo / sample report |
| Customer purchase credential | license |
