# Fix Live Pitshow Sync, Countdown Transition, and Branch Divergence

The user reported that the Live Pitshow was not activating: when the countdown timer for Practice 1 hit 00:00:00, instead of transitioning into the live pit wall, the timer immediately skipped to Practice 2 and started a new countdown. GitHub Copilot attempted to address this by introducing direct WebSocket telemetry, which introduced build errors, invalid SpacetimeDB HTTP calls, and non-existent endpoints.

## Root Cause Analysis

1. **Premature Session Expiry in UI (`useSpacetimeStatus.ts`)**:
   - `useSpacetimeStatus` looks for a live race with `races.find(r => r.status === 'live')`. If not found, it filters `upcomingRaces` using:
     ```ts
     r.status === 'upcoming' && new Date(r.date).getTime() > now
     ```
   - The second the countdown hits `00:00:00`, `date > now` becomes `false`.
   - Because Practice 1 was not yet flipped to `'status: live'` in SpacetimeDB, Practice 1 was dropped from `upcomingRaces`.
   - `upcomingRaces[0]` immediately became **Practice 2** (the next future event), so the UI restarted the countdown for Practice 2 rather than entering live mode.

2. **Ingestor Blind Spot (`ingestor/src/index.ts`)**:
   - The ingestor only recalculates `status = 'live'` inside `syncYearRaces`, which runs on a **10-minute periodic interval**.
   - The real-time loop (`setupLiveIngestion`, every 3s) only ingests telemetry if a race is already tagged `status === 'live'` in the database. When the countdown hits 0, there is up to a 10-minute delay before the ingestor updates the database.

3. **Copilot Branch Errors (`feature/direct-websocket-telemetry`)**:
   - `TelemetryLive.tsx` was edited to import `useBackendTelemetry`, but `useBackendTelemetry.ts` was committed to `main`, breaking the frontend TypeScript build with `TS2307`.
   - Copilot added `sync_to_spacetime` in `backend/websocket/live.py`, which posts to a fictitious URL (`/database/.../execute_reducer`), causing 41 failing HTTP calls every 0.5s.
   - Copilot pointed production to `wss://silverwall-ingestor.fly.dev/ws/live`, but `silverwall-ingestor` is a Node.js worker with no WebSocket server.

---

## Architectural Alignment

SilverWall's production architecture is:
**OpenF1 API** $\rightarrow$ **Fly.io Ingestor** $\rightarrow$ **SpacetimeDB Cloud** $\rightarrow$ **React Frontend (SpacetimeDB Subscriptions)**.

SpacetimeDB is the single source of truth for live race status and telemetry. `TelemetryLive.tsx` is structured to consume SpacetimeDB subscriptions with robust fallback handling.

---

## Implementation Details

### 1. Merge `origin/main` into `feature/direct-websocket-telemetry`
- Fast-forward / merge `origin/main` to bring in `useBackendTelemetry.ts` and ensure the git branch is unified and clean.

### 2. Frontend Status & Telemetry Hooks
- **`useSpacetimeStatus.ts`**:
  - Check if any race in SpacetimeDB is currently **in session**:
    - `r.status === 'live'`, OR
    - `r.status !== 'ended'` and `now >= startTime && now <= (endTime || startTime + 2.5 hours)`.
  - When in session, set `status: 'live'`, providing the active session details (`sessionName`, `circuit`, etc.).
  - Only fall back to `status: 'waiting'` for future sessions where `startTime > now`.
  - Prevent the countdown from discarding the currently starting session when the timer hits zero.
- **`useSpacetimeTelemetry.ts`**:
  - Update live race lookup to also match in-session races (`r.status === 'live'` or active in-window).
- **`TelemetryLive.tsx`**:
  - Use SpacetimeDB telemetry as the primary live telemetry source (with `useBackendTelemetry` support where available).
  - Ensure `CountdownOverlay` only displays when truly in a waiting/off-season state, and instantly transitions out when `raceStatus.status === 'live'`.
- **`useBackendTelemetry.ts`**:
  - Remove hardcoded `wss://silverwall-ingestor.fly.dev/ws/live` and use `VITE_WS_URL` from environment config.

### 3. Ingestor Real-Time Race Activation (`ingestor/src/index.ts`)
- In `setupLiveIngestion` (running every 3 seconds):
  - Detect when an upcoming race enters its active window (`now >= start && now <= end && r.status !== 'ended'`).
  - Automatically call `seedRace` with `status: 'live'` in SpacetimeDB so the database status updates in real time without waiting for the 10-minute cron.
  - Automatically call `seedRace` with `status: 'ended'` when `now > end`.

### 4. Backend Cleanup (`backend/websocket/live.py`)
- Remove the broken `sync_to_spacetime` function that spams fake HTTP calls to `/database/.../execute_reducer`.
- Keep `/ws/live` streaming clean OpenF1 telemetry to any connected local WebSocket clients.

### 5. Configuration Cleanup (`Silverwall UIUX design system/.env.production`)
- Remove dead Railway URLs (`silverwall-production.up.railway.app`).
