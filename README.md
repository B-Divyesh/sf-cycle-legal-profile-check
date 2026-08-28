# Cycle Legal Check

Cycle Legal Check is a pre-ride GPX access audit for cyclists, e-bike riders, and speed-pedelec riders. It samples a planned track, matches it to nearby OpenStreetMap ways, applies a dated regional rule pack, and returns prohibited, review, or clear findings with the underlying tags. It is a planning aid, not legal advice.

The free Belgium pack and CSV review export are fully usable. A €19 one-time Sociobot license unlocks maintained Netherlands and Germany packs. GPX files and route geometry are not retained. Only an aggregate page count is stored.

## Run locally

Requirements: Node 22+, Rust 1.85+, and SQLite.

```sh
npm ci
npm run build
cargo run
```

Open <http://localhost:8080>. For split frontend/backend development, run `npm run dev`.

Configuration:

- `PORT` — HTTP port, default `8080`
- `DATABASE_URL` — SQLite URL, default `sqlite://cycle-legal.sqlite?mode=rwc`
- `OVERPASS_URL` — Overpass interpreter endpoint
- `BILLING_API_BASE` — Sociobot billing base, default production API
- `BUILD_SHA` — value returned by `/health`

## Verify

```sh
npm test
npm run build
npm run test:e2e
docker build -t cycle-legal-check .
```

The Vite build lands in `dist/`. The container builds both layers, runs as a non-root user, stores the aggregate counter in `/data`, and listens on port 8080. `/health` reports status and build SHA.

## Data and limits

OSM matching uses samples at roughly 80 metres or 1/60th of the route, whichever is larger, and looks for highway geometry within 35 metres. Parallel ways, incomplete tags, temporary orders, and signage can change the legal outcome, so unmatched and vehicle-ambiguous areas are deliberately reported as “review.” See `/privacy` and `/terms` in the running app.

OpenStreetMap data is © OpenStreetMap contributors and licensed under ODbL. Source links and dates appear in every report.

## License

MIT — see [LICENSE](./LICENSE).
