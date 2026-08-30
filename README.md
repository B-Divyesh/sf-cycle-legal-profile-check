# Cycle Legal Check

Cycle Legal Check checks a planned GPX track for bicycle, e-bike, and speed-pedelec access conflicts before a ride. It compares sampled points with nearby OpenStreetMap ways and a dated regional rule pack. It is a planning aid, not legal advice.

## Try the sample

Open [the sample report](/demo). It opens a dated Brussels report immediately. The sample stays separate from real browser data and does not call the analyzer or page-view endpoint.

For a real check, open `/`, upload a GPX track, choose a vehicle and region, and select **Check this GPX track**. Reports show OSM tags, a dated source, and clear review limits. CSV checklist export is free.

Belgium checks are free. The Netherlands and Germany regional rule packs cost €19 once through Sociobot billing, backed by Dodo. A returned license stays in the browser and is verified at most once per day.

The server handles a real GPX track only for its requested report. It does not retain GPX track data in SQLite. SQLite stores one aggregate page-view counter.

## Run locally

Requirements: Node 22+, Rust 1.85+, and SQLite.

```sh
npm ci
npm run build
cargo run
```

Open <http://localhost:8080>. For split frontend and backend development, run `npm run dev`.

Configuration is optional:

- `PORT` — HTTP port; defaults to `8080`.
- `DATABASE_URL` — optional SQLite URL override. The default is `/data/cycle-legal.sqlite` when `/data` exists, otherwise `./cycle-legal.sqlite`.
- `OVERPASS_URL` — Overpass interpreter URL.
- `BILLING_API_BASE` — Sociobot billing API base.
- `BUILD_SHA` — build identifier returned by `/health`.

The container starts with only `PORT` set. It creates its SQLite database on first boot.

## Verify

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
docker build -t cycle-legal-check .
```

The browser claim commands are listed in [`.factory/claims.json`](.factory/claims.json). Run every listed command from a fresh checkout. The Vite build lands in `dist/`.

After deployment, verify the build identity and the 40-request allowance over
one HTTP/2 connection:

```sh
EXPECTED_BUILD_SHA=$(git rev-parse HEAD) npm run verify:deployed
```

Both API routes allow a burst of 40 requests per client and replenish at 20 requests per second. Limits use the first `X-Forwarded-For` address from factory ingress. Rejected requests return JSON `429` with `Retry-After`. `/health` is exempt.

## Data and limits

The checker samples a route at roughly 80 metres or one-sixtieth of its length. It looks for highway geometry within 35 metres. Parallel ways, incomplete tags, temporary orders, and signs can change an outcome. Unmatched and vehicle-ambiguous sections are marked for review.

OpenStreetMap data is © OpenStreetMap contributors and licensed under ODbL. Every report includes source links and source dates. See `/privacy` and `/terms` in the running app.

## License

MIT — see [LICENSE](./LICENSE).
