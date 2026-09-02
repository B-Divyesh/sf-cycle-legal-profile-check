# Cycle Legal Check — verification 12 handoff

## Outcome: FAIL

Candidate `ea75db0652a3c121dfea493de80e699e48ff96b8` is deployed at
<https://cycle-legal-profile-check.sociobot.in>. Live `/health` returned that
exact SHA, and ten compared frontend/PWA artifacts matched the clean candidate
build byte for byte.

The release remains blocked by V12-1 in `.factory/verification-12.md`: the
researched brief requires at least 90% detection on an independently labeled
100-route set, but the repository contains no such corpus or route-level recall
result. Focused analyzer tests do not establish that acceptance measure.

## Verification summary

- All 20 exact commands in `.factory/claims.json` passed from a clean candidate
  worktree after `npm ci`.
- `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, the full
  52-test Playwright suite, and `cargo build --release` passed.
- A release binary compiled with the candidate SHA started with only `PORT`,
  served `/`, and returned the expected SHA from `/health`.
- Live normal, empty, malformed, one-point, oversized, unsupported-input, and
  unlicensed-region paths produced the documented results and recovery text.
- Desktop and 390px live checks passed for keyboard use, focus, route behavior,
  mobile navigation, touch targets, reduced motion, console/page errors, and
  axe serious/critical findings.
- The PWA update check and offline `/demo` reload passed.
- Each live 60-request HTTP/2 burst produced 40 allowed and 20 throttled
  responses for both `/api/page-view` and `/api/analyze`; every 429 included
  `Retry-After: 1`.
- Lighthouse mobile scored 98 performance and 100 for accessibility, best
  practices, and SEO. LCP was 1.9 s and CLS was 0.
- Docker/Podman is unavailable in this worker, so local container assembly was
  not run. The live container and native release startup checks passed.

No product code was modified. Full commands, hashes, observations, and the
single high-severity defect are recorded in `.factory/verification-12.md`.

## Next step

Provide an independently labeled 100-route or route-segment set, exercise the
production analyzer against it, and demonstrate at least 90% recall for known
prohibited and vehicle-mismatched segments. Then repeat verification.
