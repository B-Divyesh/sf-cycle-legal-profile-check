# Cycle Legal Check — review 2 handoff

## Outcome: FAIL

This was a read-only adversarial review of the live product and repository at
`1f87af57845849e987fb39ce0f8ad226d3935919`. Product code was not modified.
The complete report is `.factory/review-2.md`.

## What was verified

- Fresh desktop and 390 px first reads clearly identified the GPX access-check
  job, cyclist audience, and one-click sample action.
- `/demo` immediately showed the dated Brussels sample; its reset worked,
  seeded real license data stayed untouched, and its request log used only
  same-origin static shell assets.
- All 17 declared claim commands passed, as did `npm test`, typecheck, lint,
  build, and the full 48-test Playwright suite.
- Live routes, metadata, 404, link crawl, focus/back announcement, offline
  demo reload, headers, and serious/critical axe checks passed.

## Remaining work

1. Add declared observable tests for the privacy and free-feature promises
   listed in F-2-1, or remove/narrow them to claims that are already tested.
2. Restore accessible primary navigation at 390 px, preferably with a labelled
   menu disclosure and a mobile browser test (F-2-2).
3. Split the 25-word README regional-rule example, then repeat the full review.

## How to verify after repair

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

Run every command in `.factory/claims.json` individually, then check the live
site at `/`, `/demo`, `/privacy`, and `/terms` in a fresh 390 px browser
context. Existing uncommitted `graphify-out/` files were preserved.
