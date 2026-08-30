# Polish round 1 — finding closure

**Reviewed report:** `.factory/review-1.md` at `d26a8846f94745e2001ca443c1e399e4f8d4f26d`

**Released repair:** `fff835f45c0e9e8e0ab2ab9d996c8241fc605c55`

**Live URL:** <https://cycle-legal-profile-check.sociobot.in>

Every finding in the only current or earlier `review-*.md` / `polish-*.md`
record is closed. There were no earlier polish reports.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 — untested reliance claims | Rewrote the first screen around the concrete GPX-track job. Removed unnecessary server-implementation and future-update promises. Added claim entries and observable tests for the mapped conflict, selected vehicle/rule pack, 8 MB boundary, paid rule packs, and refund/revocation behavior. Existing demo, privacy, export, offline, evidence, price, license, and storage claims remain. | All 13 commands in `.factory/claims.json` passed individually from a clean clone of `fff835f`. Browser tests: `@claim:mapped-access-conflicts`, `@claim:vehicle-rule-profile`, `@claim:gpx-size-limit`, `@claim:regional-pricing`, and `@claim:billing-refunds`. Live `polish-live.json` records only four same-origin static requests during `?demo=1`. |
| F-1-2 — route focus and announcement | Added History API navigation for product routes, a persistent polite live region, focused the new `h1` after navigation and `popstate`, and retained direct URLs plus back/forward behavior. | Browser test `route links, back navigation, titles, focus, and announcements stay in sync`; live `.factory/evidence/polish-1/live/polish-live.json` has `"routeFocus": true`. |
| F-1-3 — 404 and touch metadata | Added an original 180×180 PNG touch icon, manifest icons, application and 404 touch links, and complete 404 description/canonical/Open Graph/Twitter metadata. The real unknown route still returns HTTP 404. | Browser test `serves crawler files and a styled direct 404 document`; screenshots `.factory/evidence/polish-1/404-desktop.png` and `.factory/evidence/polish-1/live/404-desktop.png`; live icon and metadata assertions passed. |
| F-1-4 — decorative caption | Replaced “FIELD STUDY / 50.85°N” with “Illustration: map evidence can be incomplete.” | `.factory/evidence/polish-1/landing-desktop.png` and the corresponding live screenshot. |
| F-1-5 — inconsistent terminology | Standardized the uploaded input as **GPX track** and the country product as **regional rule pack** across the UI, metadata, README, legal pages, demo docs, and catalog copy. | `.factory/copy-audit.md` terminology table; repository search returned no old “GPX route”, “regional pack”, or “Sociobot/Dodo” product copy. |
| F-1-6 — inaccurate copy counts | Rebuilt the audit with a documented Unicode word-token rule. Punctuation is excluded, `€19` is one number, and slash-separated terms count separately. | A script recalculated every table row with zero mismatches; `.factory/copy-audit.md` has no sentence above 22 words and no banned marketing term. |

## Additional release evidence

- Direct demo: <https://cycle-legal-profile-check.sociobot.in/?demo=1> opens the complete sample report with its persistent banner, Reset demo, and Start for real controls.
- Live build: `/health` returned `fff835f45c0e9e8e0ab2ab9d996c8241fc605c55`.
- Live routes: `/`, `/demo`, `/privacy`, and `/terms` returned 200 with unique titles, one `h1`, one `main`, no horizontal overflow, no console errors, and zero serious/critical axe findings at 1440×900 and 390×844.
- Live 404: `/missing-polish-evidence` returned 404 with the designed page and complete metadata.
- Live offline: a fresh context loaded `/demo`, went offline, reloaded, and retained the sample report and Offline notice.
- Live limiter: one HTTP/2 connection sent 60 requests; 40 returned 204 and 20 returned 429 with `Retry-After: 1`.
- Local Lighthouse mobile: performance 99, accessibility 100, best practices 100, SEO 100; LCP 2255 ms, CLS 0, TBT 29 ms. Raw report: `.factory/evidence/polish-1/lighthouse-mobile.json`.
- The release uses one replica and SQLite at `/data` on the scoped `sf-cycle-legal-profile-check-d2` share. The `/data` default uses SQLite's `unix-dotfile` locking VFS for the Azure Files SMB mount.

No finding remains open.
