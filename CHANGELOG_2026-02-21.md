# 🏁 SilverWall — Changelog: February 21, 2026

## UX Overhaul: Hardcoded → Dynamic + Status Indicator

**Summary:** Replaced 14 hardcoded/static values across the frontend with dynamic data sourced from the backend API and Supabase database. Fixed the backend-frontend data contract for off-season mode. Added a color-coded race status indicator to the landing page header.

**Why:** The UI had Abu Dhabi 2024-era values baked in — circuit names, lap counts, dates, and champion references that never updated. This overhaul ensures the app stays accurate automatically as the F1 calendar evolves.

---

## Changes Made (5 Phases, 5 Commits)

### Phase 1 · Backend — Enrich `off_season` API Response

**File:** `backend/routes/status.py`

The `/api/status` endpoint's `off_season` response previously only returned `{ year, message }`. The frontend components (`SeasonCountdown`, `CountdownOverlay`) expected 8 additional fields.

**What changed:**
- Query the next season's first race from the `races` table
- Added `first_race`, `location`, `country`, `circuit`, `circuit_length_km`, `laps`, `race_date`, and `countdown_seconds` to the `next_season` response object
- Safe additive change — existing frontend ignores unknown fields

---

### Phase 2 · Landing Page — Color-Coded Status Indicator

**File:** `Silverwall UIUX design system/src/pages/Landing.tsx`

The header status dot was always green with "System Operational" text, regardless of whether a race was live, upcoming, or off-season.

**What changed:**
- Status dot now changes color based on `raceStatus.status`:
  - 🟢 Green → Race is LIVE
  - 🔴 Red → Waiting for next race
  - 🟡 Yellow → Race ended / connecting
  - ⚫ Grey → Off-season
- Status text updates dynamically to match
- Replaced hardcoded "58" laps and "5.281 KM" circuit length with `"TBD"` fallbacks

---

### Phase 3 · Telemetry Page — Remove Abu Dhabi References

**File:** `Silverwall UIUX design system/src/pages/TelemetryLive.tsx`

The telemetry page had "Abu Dhabi GP", "Yas Marina Circuit", and hardcoded circuit IDs baked into the UI.

**What changed:**
- Circuit ID now sourced from `raceStatus.circuit` / `raceStatus.nextSeason?.circuit`
- Removed hardcoded "Abu Dhabi GP" fallback (now shows `'—'`)
- Removed hardcoded "Yas Marina Circuit" / "Abu Dhabi" track labels
- Season year label now dynamic (`raceStatus.nextSeason?.year`)
- Replaced static SVG track fallback with "NO TRACK DATA" message

---

### Phase 4 · Countdown Components — Remove Hardcoded Dates & Champions

**Files:**
- `Silverwall UIUX design system/src/components/CountdownOverlay.tsx`
- `Silverwall UIUX design system/src/components/SeasonCountdown.tsx`

These components had hardcoded "MARCH 15, 2026", "2025 Season Complete", "VER", and "4x CHAMPION" strings.

**What changed:**
- All dates now formatted dynamically from `nextSeason.race_date`
- Season year computed as `nextSeason.year - 1` instead of hardcoded "2025"
- Champion references replaced with dynamic data or neutral "DEFENDING" placeholder

---

### Phase 5 · useTrack Hook — Default Parameter Cleanup

**File:** `Silverwall UIUX design system/src/hooks/useTrack.ts`

The `useTrack` hook defaulted to `'abu_dhabi'` when no circuit was specified.

**What changed:**
- Default parameter changed from `'abu_dhabi'` to `'latest'`

---

## What Was Already Dynamic (Confirmed Working) ✅

| Feature | Source | Status |
|---|---|---|
| Race name in RaceCard | Supabase `races` table | ✅ |
| Circuit name | Supabase `races.circuit_name` | ✅ |
| Country / Location | Supabase `races.country` | ✅ |
| Race date | Supabase `races.race_date` | ✅ |
| Countdown timer (waiting mode) | Backend computed seconds diff | ✅ |
| Track map SVG | API `/api/track/{circuit}` | ✅ |
| Champions banner | API `/api/champions` + `/standings` | ✅ |
| Leaderboard | WebSocket frame `cars[]` | ✅ |
| Driver telemetry | WebSocket frame `cars[]` | ✅ |

---

## Deferred Items

| Item | Reason |
|---|---|
| `sessionTime` (always `--:--:--`) | Requires backend session elapsed time tracking — not trivial |
| `teamColors` / `teamNames` dictionaries | Reasonable client-side lookup; replacing requires new `/api/teams` endpoint |

---

> **Total: 7 files modified across backend and frontend.**
> **All changes are additive and backward-compatible.**
