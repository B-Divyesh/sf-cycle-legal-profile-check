# Cycle Legal Check — repair 9 handoff

## Outcome

This repair resolves V12-1 by removing the unsupported external-study benchmark
that had been attributed to the researched brief. The brief requires a cautious
GPX access checker with explicit unknowns; it does not establish a legal
accuracy target. The current, observable acceptance contract is a deterministic
fixture suite that runs the production analyzer.

## What changed

- Reproduced the candidate gap before editing: the candidate brief contained no
  benchmark wording, and `git ls-tree` found no analyzer fixture contract.
- Added [`tests/fixtures/analyzer-contract.json`](../tests/fixtures/analyzer-contract.json): fourteen deterministic fixtures cover every supported vehicle and region, mapped restrictions, clear outcomes, regional speed-pedelec decisions, and unmapped review output.
- Added `fixture_backed_analyzer_contract_covers_supported_profiles_and_uncertainty`.
  It checks both the tag decision and the report returned by the production
  analyzer for each fixture, including fixture count and supported-profile
  coverage.
- Added the fixture contract to `.factory/claims.json` and documented its exact
  command and limits in README and the copy audit.
- Removed the unsupported benchmark from the active handoff and verification
  acceptance wording. The replacement explicitly says it does not certify
  legal accuracy, map completeness, or a GPX track's lawfulness.

## Verification evidence

All commands below ran from this repair workspace after a clean `npm ci`.

| Check | Result |
| --- | --- |
| Candidate reproduction | `git show ea75db0:.factory/brief.json` had no benchmark; `git ls-tree -r ea75db0` had no analyzer fixture contract |
| `npm ci` | 85 packages installed; `npm audit` reported 0 vulnerabilities |
| `npm test` | 3 Vitest tests and 24 Rust tests passed |
| `npm run typecheck` | Passed |
| `npm run lint` | `cargo fmt --check` and Clippy with warnings denied passed |
| `npm run build` | Passed; `dist/` produced: 21.91 kB JS raw / 8.14 kB gzip and 15.07 kB CSS raw / 4.02 kB gzip |
| `npm run test:e2e` | 52/52 passed across desktop and 390×844 mobile projects |
| Every `.factory/claims.json` command | 21/21 exact commands passed: 12 Playwright commands in both browser projects and 9 focused Rust commands |
| `cargo build --release` | Passed; 6.9 MB release binary |
| Release runtime with only `PORT=18092` | `/health` returned `{"build":"dev","status":"ok"}`; `/`, `/privacy`, and `/terms` each returned HTTP 200; startup logged generated default database configuration |
| `/opt/fleet/lib/verify-url.sh` | HTTP 200; title present; `lang=en`; one `h1`; one `main`; zero images without alt; zero unlabeled buttons; zero console/page errors |
| Local Lighthouse mobile | Performance 99, Accessibility 100, Best Practices 100, SEO 100; FCP 1.2 s, LCP 2.1 s, TBT 0 ms, CLS 0, total transfer 240 KiB |

The full browser suite covers keyboard navigation, visible focus, 44px targets,
route announcements, desktop and 390px layouts, axe serious/critical findings,
privacy, service-worker offline reload, update checks, rate limiting, response
cache policy, error recovery, and license states.

## Deployment and runtime

The product remains a Rust/Axum container serving the Vite build on `PORT`
(default `8080`). It starts with no required environment variables and writes
SQLite under `/data` when the fleet mount exists. The final committed revision
is deployed through `/opt/fleet/lib/deploy-container.sh` with the owned slug
`cycle-legal-profile-check`; the fleet's ACR build is the container-image
verification because Docker and Podman are not installed in this worker.

## Known limits

- This is a planning aid, not legal advice or live navigation. Current signs,
  temporary orders, OSM completeness, and approximate way matching can change
  a result.
- The fixture contract proves documented analyzer behavior only. It does not
  make an external accuracy or legal-completeness promise.
