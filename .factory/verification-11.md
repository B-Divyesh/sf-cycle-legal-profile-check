# Cycle Legal Check — independent verification 11

## Result: FAIL

- Candidate commit tested from a detached clean worktree: `aed1f0a9eb930dfcfe05ff0934b409868c99e348`
- Required URL: <https://cycle-legal-profile-check.sociobot.in>
- Verification date: 2026-09-01 UTC

The candidate's local quality and claim checks passed, but the live deployment does
**not** match the candidate. Fresh live `/health` evidence was:

```json
{"build":"ea75db0652a3c121dfea493de80e699e48ff96b8","status":"ok"}
```

The exact candidate identity assertion failed: expected
`aed1f0a9eb930dfcfe05ff0934b409868c99e348`, received
`ea75db0652a3c121dfea493de80e699e48ff96b8`. A candidate cannot be accepted
until its exact build SHA is serving at the required URL.

## First-read result

Cold desktop visit passed the plain-words and demo checks:

- Does: “Check GPX track access before you ride.”
- For: cyclists with a planned GPX track.
- First action: “Try it with sample data,” with the explanation “Opens a sample
  report. Nothing is saved to your real data.”

That action opens a populated `/demo` report in one click. The demo banner has
Reset demo and Start for real controls.

## Required claim manifest

`.factory/claims.json` exists and has 20 entries. After `npm ci` in the clean
candidate worktree, every listed command passed.

| Claims | Command | Evidence |
| --- | --- | --- |
| `demo-sample-report`, `mapped-access-conflicts`, `demo-isolation`, `csv-export`, `offline-reload`, `report-evidence`, `vehicle-rule-profile`, `gpx-size-limit`, `regional-pricing`, `billing-refunds`, `license-browser-local`, `browser-storage-removal` | `npm run test:e2e -- --grep @claim:<id>` | Each command passed in desktop and 390px projects. |
| `regional-cycleway-decisions` | `cargo test regional_cycleway_rules_are_distinct_and_cautious` | Passed. |
| `sampling-density` | `cargo test sampling_rule_uses_eighty_metres_or_one_sixtieth_of_route_length` | Passed. |
| `matching-radius` | `cargo test matching_radius_is_thirty_five_metres` | Passed. |
| `gpx-not-retained` | `cargo test gpx_analysis_never_persists_route_data` | Passed. |
| `aggregate-page-view` | `cargo test page_views_persist_only_an_aggregate_counter` | Passed. |
| `ip-not-persisted` | `cargo test client_ip_addresses_are_not_persisted` | Passed. |
| `overpass-data-disclosure` | `cargo test overpass_receives_sampled_coordinates_without_the_gpx_file_or_track_name` | Passed. |
| `api-rate-limit` | `cargo test api_rate_limit_allows_forty_then_replenishes_at_twenty_per_second` | Passed. |

## Candidate quality checks

- `npm ci`: passed; audit reported 0 vulnerabilities.
- `npm test`: passed (3 Vitest and 23 Rust tests).
- `npm run typecheck`: passed.
- `npm run lint`: passed (`cargo fmt --check`, Clippy with warnings denied).
- `npm run build`: passed and produced `dist/`.
- `npm run test:e2e`: passed across desktop and 390px mobile.
- `cargo build --release --locked`: passed; release binary produced.
- Build budgets: initial JavaScript 21,914 bytes raw / 8,118 bytes gzip;
  CSS 15,068 bytes raw / 4,025 bytes gzip; mobile hero 59,794 bytes.
- Docker image build was not run because neither `docker` nor `podman` is
  installed in this verifier container.

## Live evidence (current, non-candidate deployment)

The live release is otherwise functional, but these observations apply to
`ea75db0…`, not the requested candidate:

- The full live browser audit passed at desktop and 390px for `/`, `/demo`,
  `/privacy`, and `/terms`: 200 responses, expected titles, one `h1`, one
  `main`, no horizontal overflow, no console/page errors, and zero axe serious
  or critical findings.
- Keyboard route focus, visible paid-control focus (6.80:1), skip-link flow,
  mobile menu Escape/focus restoration, and reduced-motion handling passed.
- The demo's complete request log consisted only of same-origin document,
  hero image, JavaScript, and CSS requests; it made no API, analyzer,
  page-view, billing, or external request. `/demo` reloaded offline after its
  first online load.
- Headers include CSP with `frame-ancestors 'none'`, `X-Content-Type-Options:
  nosniff`, `X-Frame-Options: DENY`, and strict-origin referrer policy.
  `/health` is `no-store`; `/sw.js` is `no-cache`; hashed JavaScript is
  `public, max-age=31536000, immutable`.
- Live backend allowance was independently exercised over one HTTP/2 client:
  60 `POST /api/page-view` requests yielded 40 `204` responses and 20 `429`
  responses. Every 429 had `Retry-After: 1`, confirming the documented burst
  of 40 and 20-per-second refill.

## Defects by severity

- **High — release blocking:** the production URL serves
  `ea75db0652a3c121dfea493de80e699e48ff96b8`, not candidate
  `aed1f0a9eb930dfcfe05ff0934b409868c99e348`. Deploy the candidate and repeat
  the exact `/health` identity assertion before release acceptance.
- Critical: none observed in the currently deployed build.
- Medium: none observed.
- Low: none observed.

## Evidence locations

- Clean-worktree claim logs: `/tmp/claim-*.log`
- Cold first-read screenshot: `/tmp/live-cold-desktop.png`
- Live audit evidence: `/tmp/cycle-live-polish-11/`
- Live header captures: `/tmp/live-headers.txt`, `/tmp/live-health-headers.txt`
