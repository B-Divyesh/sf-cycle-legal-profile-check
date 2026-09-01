# Polish round 2 — cumulative finding closure

**Reports covered:** `.factory/review-1.md` and `.factory/review-2.md`

**Live URL:** <https://cycle-legal-profile-check.sociobot.in>

All round 1 repairs were regression-tested. Round 2 closes every current
finding without changing the concrete-and-moss visual system.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 — untested landing claims | Retained the 17 existing claim entries and their observable tests. Added three focused privacy claims, bringing the manifest to 20 unique entries. | Every command in `.factory/claims.json`; full 52-test Playwright suite; `cargo test` (23 tests). |
| F-1-2 — route focus and announcement | Preserved History API navigation, focused route headings, and polite announcements. The new mobile menu uses the same navigation path. | Playwright: `route links, back navigation, titles, focus, and announcements stay in sync`; local and live `polish-live.json` set `routeFocus` to `true`. |
| F-1-3 — 404 and touch metadata | Preserved the designed HTTP 404, route metadata, manifest icon, favicon, and 180 px touch icon. | Playwright: `serves crawler files and a styled direct 404 document`; `.factory/evidence/polish-2/local/404-desktop.png`; live `/missing-polish-evidence` returns 404. |
| F-1-4 — decorative caption | Preserved the useful caption “Illustration: map evidence can be incomplete.” | `.factory/evidence/polish-2/local/landing-desktop.png`; live landing page. |
| F-1-5 — inconsistent terminology | Preserved **GPX track** and **regional rule pack** across product and documentation copy. Corrected the last README use of “regional packs.” | `.factory/copy-audit.md` terminology table; repository copy search. |
| F-1-6 — inaccurate word counts | Kept the documented Unicode token rule and added exact counts for round 2 legal and README rewrites. | `.factory/copy-audit.md`; no audited sentence exceeds 22 words. |
| F-2-1 — untested legal promises | Narrowed GPX retention to SQLite. Added observable tests for forwarded-IP non-persistence, the exact Overpass payload boundary, and browser-data removal. License verification now explicitly proves the Sociobot URL. Removed the untested accessibility and safety-warning price promise. | Claims `ip-not-persisted`, `overpass-data-disclosure`, `browser-storage-removal`, and updated `license-browser-local`; `.factory/evidence/polish-2/local/privacy-mobile.png`; live `/privacy`. |
| F-2-2 — no phone navigation | Added a 44 px **Menu** disclosure on every route. It exposes Demo, How it works, Rule packs, and Privacy; Escape closes it and restores focus. Navigation continues to focus and announce the destination heading. | Playwright: `mobile primary menu works on every route and restores focus on Escape`; `.factory/evidence/polish-2/local/mobile-menu.png`; local and live `polish-live.json` set `mobileNavigation` to `true`. |
| F-2-3 — 25-word README example | Split the country example into two sentences of 10 and 14 words. Also split the 24-word database configuration sentence. | `.factory/copy-audit.md`; claim `regional-cycleway-decisions`. |

## Verification evidence

- `npm test`: 3 Vitest and 23 Rust tests passed.
- `npm run typecheck`, `npm run lint`, and `npm run build`: passed.
- Production bundles: 8.14 kB gzip JavaScript and 4.02 kB gzip CSS.
- `npm run test:e2e`: 52 tests passed across desktop and 390 px projects.
- Local route audit: eight route/viewport combinations, zero serious or
  critical axe findings, no console errors, working offline demo, and 6.80:1
  paid-action focus contrast.
- Local Lighthouse mobile: performance 98, accessibility 100, best practices
  100, SEO 100; LCP 2.3 s, CLS 0, TBT 70 ms. Raw report:
  `.factory/evidence/polish-2/local/lighthouse-mobile.json`.
- The direct demo remains <https://cycle-legal-profile-check.sociobot.in/?demo=1>.
  Its request log contains only same-origin static shell assets.

No review finding remains open.
