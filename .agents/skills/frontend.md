---
name: silverwall-frontend
description: "React/Vite dashboard client guide: Clerk authentication integration, SpacetimeDB React Context state updates, and real-time custom telemetry/status hooks."
---

# SilverWall Frontend Development Guide

## 1. Architecture & Entrypoint
- Main SPA directory: `Silverwall UIUX design system/`.
- Entrypoint is `src/main.tsx`, wrapping the application with `<ClerkProvider>` and `<SpacetimeProvider>`.
- Client communicates directly to the SpacetimeDB server database using WebSocket subscription streams and on-update events (`conn.db.<table_name>.onInsert`).

## 2. Spacetime Hooks
- **`useSpacetimeTelemetry`**:
  - Subscribes to `telemetry`, `race`, and `driver` tables.
  - Returns the latest telemetry frame of active cars matching the current `live` session key.
  - Sorts active driver listings by position and caches the latest timestamps.
- **`useSpacetimeStatus`**:
  - Monitors the state of races and configuration keys.
  - Formulates the app's overall lifecycle mode: `'live'`, `'waiting'` (with a real-time countdown to the next Grand Prix), or `'off_season'`.
  - Maps circuit keys to geographical descriptions using `CIRCUIT_METADATA`.

## 3. UI and State
- **Clerk Integration**: Manages session state and authentication. Reducer calls like `authenticate` map Clerk IDs to db identities.
- Run frontend locally:
  ```powershell
  cd "Silverwall UIUX design system"
  npm install
  npm run dev
  ```
