# Polish round 3 — zero-finding closure

**Reports covered:** `.factory/review-1.md`, `.factory/review-2.md`,
`.factory/review-3.md`, `.factory/polish-1.md`, and `.factory/polish-2.md`.

**Repair commits:** `f1ef15b25bd8b11b49744cebacc183a529ab0976` and
`f7d1a047dbf5cfdcc6f8eb4599ef1b051cd9ac8c`.

**Live build:** `f7d1a047dbf5cfdcc6f8eb4599ef1b051cd9ac8c` at
<https://cycle-legal-profile-check.sociobot.in>.

Every prior closure was regression-tested in a fresh clone. F-3-1 was the
sole open finding at the start of this round. No finding remains open.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 — unlisted landing reliance claims | Retained the declared claims and focused observable tests for first-screen report, selected profile, evidence, pricing, refund, storage, and privacy copy. | All 25 `.factory/claims.json` commands passed individually from a fresh clone. `npm run test:e2e`: 54/54. Live [desktop](evidence/polish-3/live/landing-desktop.png), [mobile](evidence/polish-3/live/landing-mobile.png), and <https://cycle-legal-profile-check.sociobot.in/demo>. |
| F-1-2 — route focus and announcement | Preserved History API navigation, heading focus, and the polite route-status announcement. | Browser test `route links, back navigation, titles, focus, and announcements stay in sync`: PASS. Live report: `routeFocus: true`. |
| F-1-3 — 404 and touch metadata | Preserved the styled HTTP 404, unique metadata, favicon, social metadata, and 180 px touch icon. | Browser test `serves crawler files and a styled direct 404 document`: PASS. Live [404 screenshot](evidence/polish-3/live/404-desktop.png); the checked missing URL returned 404. |
| F-1-4 — decorative caption | Kept the useful caption “Illustration: map evidence can be incomplete.” | Live [desktop screenshot](evidence/polish-3/live/landing-desktop.png); browser suite PASS. |
| F-1-5 — inconsistent terminology | Kept **GPX track** and **regional rule pack** as the consistent product terms. | `.factory/copy-audit.md` terminology table and fresh-clone suite: PASS. |
| F-1-6 — inaccurate copy counts | Kept the documented Unicode word-token rule and removed the deleted footer sentence from the audit. | `.factory/copy-audit.md` has no sentence over 22 words. The catalog description is verb-first and 103 bytes. |
| F-2-1 — untested privacy/free promises | Preserved direct tests for retention, aggregate page view, IP non-persistence, license storage, Overpass payload, browser removal, and regional pricing. | Fresh-clone claims `gpx-not-retained`, `aggregate-page-view`, `ip-not-persisted`, `license-browser-local`, `overpass-data-disclosure`, `browser-storage-removal`, and `regional-pricing`: PASS. Live [privacy screenshot](evidence/polish-3/live/privacy-mobile.png), `legalClaims: true`. |
| F-2-2 — missing phone navigation | Preserved the labelled 44 px Menu disclosure, Escape behavior, and focus restoration. | Browser test `mobile primary menu works on every route and restores focus on Escape`: PASS. Live [mobile menu](evidence/polish-3/live/mobile-menu.png), `mobileNavigation: true`. |
| F-2-3 — overlong README rule example | Preserved the split Belgium/Netherlands/Germany sentences. | `.factory/copy-audit.md` records the 10-word and 14-word sentences; fresh-clone `regional-cycleway-decisions` claim: PASS. |
| F-3-1 — non-actionable unlisted footer provenance | Removed “Hero image generated for this product with Azure AI.” from the shared application footer, without replacement. Asset provenance remains in `.factory/design.md`. Added local and live regression checks for all product-route footers. | Browser test `shared footers keep the legal limitation and build link without non-actionable asset provenance`: PASS. Live verifier checked `/`, `/demo`, `/privacy`, and `/terms` at 1440×900 and 390×844 with `footerProvenanceClear: true` in [polish-live.json](evidence/polish-3/live/polish-live.json). |

## Verification

A fresh clone ran `npm ci`, then each of the 25 claim commands separately;
all passed. That clone also passed `npm test` (3 Vitest, 27 Rust unit, 1 Rust
runtime), `npm run typecheck`, `npm run lint`, `npm run build`, `cargo build
--release --locked`, and `npm run test:e2e` (54/54).

After deployment, `npm run verify:live:polish` passed against the cold live
site: zero serious/critical axe violations on all app routes at both viewports;
demo isolation, offline reload, mobile menu, legal storage, route focus, 44 px
targets, first-screen fit, and footer assertions all passed. `npm run
verify:deployed` observed the live build above and 40 allowed of 60 HTTP/2
requests; the remaining 20 were `429` with `Retry-After: 1`.
