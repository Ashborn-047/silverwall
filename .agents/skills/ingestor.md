---
name: silverwall-ingestor
description: "TypeScript telemetry and metadata ingestor worker guide: OpenF1 integrations, Jolpi standings fetching, track geometry syncing, and live telemetry streaming."
---

# SilverWall Ingestor Guide

## 1. Role & Architecture (`ingestor/src/index.ts`)
- The Ingestor is an Express-based daemon running on Koyeb/Cloud that pulls real-time and historical F1 data and pushes it to SpacetimeDB.
- Exposes a health endpoint `GET /` on port `8080` (or `PORT` environment variable).
- Employs a low-latency connection via SpacetimeDB `DbConnection` (`wss://maincloud.spacetimedb.com`).

## 2. Ingestion Lifecycles & Flows
1. **Startup Initialization**:
   - Fetches & syncs 2026 races, drivers, historical standings (2025), and 2026 standings/podiums.
   - Truncates existing standings table entries via CLI calls to prevent duplicate rows.
   - Synchronizes circuit track geometries (Shanghai, Bahrain, Canada) using high-fidelity points fetched from the Apex F1 API (`https://apex-f1-api.fly.dev`), falling back to downsampled OpenF1 driver location points when necessary.
2. **Live Telemetry Loop (Every 3s)**:
   - Queries SpacetimeDB for a race with status `live`.
   - Polling OpenF1 `/car_data` and `/location` endpoints over a small moving time window (`TIME_WINDOW_STEP_MS = 5000` to prevent 422 errors).
   - Maps driver telemetry telemetry timestamps to matching location points within 500ms and calls `conn.reducers.insertTelemetry(...)`.
3. **Periodic Maintenance (Every 10 mins)**:
   - Syncs the latest 2026 races, drivers, standings, and podium finishes.

## 3. Remote Ingestion Utilities (`ingestor/src/seed_*.ts`)
- Script entrypoints under `ingestor/src/` are used to seed historical telemetry and standings datasets.
- Start the ingestor locally:
  ```powershell
  cd ingestor
  npm install
  .\start_ingestor.bat
  ```
