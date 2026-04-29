# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project does

Fetches Spain electricity grid data from Red Eléctrica de España's public API (<https://apidatos.ree.es/>), stores it in SQLite, and serves a React dashboard with both a GraphQL API and a small REST API.

## Commands

### Client (in `client/`)

```bash
npm run dev       # Vite dev server (proxies /api to localhost:8080)
npm run build     # tsc + vite build → dist/
npm test          # Jest with ts-jest
```

### Server (in `server/`)

```bash
npm run dev       # nodemon src/index.js
npm start         # node src/index.js
```

### Docker / release (root)

```bash
make pipeline     # bump minor version + build Docker image
make build-docker # docker build only
```

Run a single Jest test:

```bash
cd client && npx jest --testPathPattern="<filename>"
```

## Architecture

### Data flow

1. **Ingestion** (`server/src/ingest.js`) — cron jobs call REE API via axios, parse responses, write to SQLite. Key schedules: every 15 min (instant), daily (daily/hourly PVPC), every 3 h (monthly), monthly (yearly aggregates + emissions/balances/installed).
2. **Storage** — SQLite (`energy.sqlite`). Tables: `instant`, `hourly`, `daily`, `monthly`, `yearly`, plus separate tables for `dailyBalance`, `monthlyBalance`, `yearlyBalance`, `yearlyInstalled`, `monthlyInstalled`, `dailyEmissions`, `monthlyEmissions`, `yearlyEmissions`, `hourlyPvpc`. `migration_01.sql` normalized balance/installed data out of the main tables.
3. **API** — Express (`server/src/index.js`) exposes:
   - GraphQL at `/graphql` and `/api/graphql` (schema at `server/src/schema.graphql`)
   - REST at `/api/instant`, `/api/latest`, `/api/daily`, `/api/monthly`, `/api/yearly`
   - Prometheus metrics via prom-client
4. **Frontend** (`client/src/`) — React 18 + React Query + Chart.js/Recharts. Vite dev server proxies `/api` to `:8080`. Components map roughly to page sections: Today, Averages, Production, Records, Emissions, Installed, Balances.

### Key files

| File | Role |
|---|---|
| `server/src/index.js` | Express setup, cron schedule, DB init |
| `server/src/ingest.js` | All REE API fetch + DB write logic |
| `server/src/schema.graphql` | GraphQL schema (source of truth for API shape) |
| `server/src/statements.js` | Parameterized SQL queries |
| `server/src/controllers/energy.js` | REST endpoint handlers |
| `client/src/index.tsx` | App root, React Query provider, routing |
| `client/vite.config.js` | API proxy config |

### Environment variables (server)

Copy `server/.env.example`:

- `DB_FILE` — path to SQLite file (default `./database.db`; dev uses `../energy.sqlite`)
- `PORT` — HTTP port (default 8080)
- `PUBLIC_PATH` — path to serve static files from (set to built client `dist/` in Docker)
