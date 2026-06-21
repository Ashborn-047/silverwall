---
name: silverwall-spacetimedb
description: "TypeScript SpacetimeDB table schemas, custom server-side reducers, and database deployment commands."
---

# SilverWall SpacetimeDB Guide

## 1. Schema Configuration (`spacetimedb/src/index.ts`)
- SpacetimeDB is configured as a TypeScript module under `spacetimedb/`.
- Schema is defined in `spacetimedb/src/index.ts` using `spacetimedb/server` helpers.
- Tables:
  - `race`: Store race details (upcoming, live, ended).
  - `driver`: Store driver numbers, teams, and branding/colors.
  - `telemetry`: High-speed performance logs (speed, rpm, gear, throttle, brake, drs, coordinates x/y).
  - `track_point`: Store coordinates representing circuit geometry.
  - `config`: Environment flags (e.g., `current_season`).
  - `auth_mapping`: Link Clerk auth IDs to SpacetimeDB connection identities.
  - `driver_standings` & `constructor_standings`: Pre-calculated championship standing positions.
  - `race_result`: Championship round placements.
  - `commentary`: Live commentary logs.

## 2. Reducers (Server-side Functions)
- Reducers process state modifications and can be called by clients or workers.
- Important reducers:
  - `init`: Runs once on deployment to set base configuration variables.
  - `seed_race` & `upsert_driver`: Handle standard resource population.
  - `insert_telemetry`: Bulk inserts telemetry logs.
  - `seed_track` & `clear_track_geometry`: Setup track layouts.

## 3. Deploying & Publishing
- Build the database module:
  ```powershell
  npm run build
  ```
- Publish to the local or remote database instance (defaults to database `spacetimedb-uorks`):
  ```powershell
  node publish.js
  ```
  or run the batch utility:
  ```powershell
  .\deploy.bat
  ```
