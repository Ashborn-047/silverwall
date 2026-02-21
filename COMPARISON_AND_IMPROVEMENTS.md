# SilverWall — Comparison & Improvement Roadmap

> **Date:** 2026-02-21  
> **Compared Against:** [IAmTomShaw/f1-race-replay](https://github.com/IAmTomShaw/f1-race-replay) (5,033 ⭐ · 681 forks · 34 contributors)

---

## 1. Project Overview

| | **SilverWall** | **f1-race-replay** |
|---|---|---|
| **Type** | Full-stack web app (live dashboard) | Desktop app (offline replay analyzer) |
| **Frontend** | React + Vite + Vercel | Arcade (game engine) + PySide6 (Qt) |
| **Backend** | FastAPI + Supabase + WebSocket | None — local Python process |
| **Data Source** | OpenF1 API (real-time) | FastF1 (offline historical) |
| **Deployment** | Live at [silverwall.vercel.app](https://silverwall.vercel.app) | Run locally only (`pip install` + `python main.py`) |
| **Language** | TypeScript + Python | Python only |
| **Repo Size** | 358 KB | 14 MB |
| **Stars** | 0 (early stage) | 5,033 |
| **Contributors** | 1 (solo) | 34 |

---

## 2. Feature-by-Feature Comparison

### 🟢 Where SilverWall Wins

| Feature | SilverWall ✅ | f1-race-replay ❌ |
|---|---|---|
| **Live Telemetry** | Real-time data during actual races via OpenF1 | Offline replay only |
| **Web Accessible** | Anyone opens a URL — no install needed | Requires Python 3.11+, venv, pip install |
| **Database Layer** | Supabase for standings, results, track geometry | No database — all in-memory/cached |
| **AI Commentary** | Gemini-powered race event detection | None |
| **REST API** | Proper API endpoints usable by any client | No API — everything is local |
| **Cloud Deployed** | Vercel (frontend) + API backend | Desktop only |
| **CORS Security** | Locked-down origins + env var support | N/A (no web server) |
| **Async Parallel Fetch** | `asyncio.gather` for concurrent API calls | Sequential data loading |
| **Multi-user** | Multiple users can connect simultaneously | Single-user desktop |
| **Track Auto-learning** | Saves new track geometry to DB automatically | Manual track data |
| **Demo Mode** | Simulated Monza replay via WebSocket | N/A |

### 🔴 Where f1-race-replay Wins

| Feature | f1-race-replay ✅ | SilverWall ❌ |
|---|---|---|
| **Deep Telemetry** | Speed, gear, throttle %, brake %, DRS per driver | Position + gap only |
| **Bayesian Tyre Model** | 25KB mathematical model — tyre degradation prediction | Basic compound display |
| **Playback Controls** | Pause, rewind, fast-forward, seek, 0.5x–4x speed, restart | Basic WebSocket play/pause |
| **DRS Zones** | Rendered on track from qualifying telemetry data | Not visualized |
| **Driver Selection** | Click leaderboard → detailed telemetry overlay | No driver detail panel |
| **Qualifying Support** | Full qualifying session replay | Race only |
| **"Pit Wall" Plugin System** | `PitWallWindow` base class for custom insight windows | No plugin architecture |
| **Telemetry Stream** | TCP on `localhost:9999`, JSON, pluggable | WebSocket exists but simpler |
| **Weather Data** | Air temp, humidity, rain, wind speed/direction | Not tracked |
| **Track Status Events** | Safety car, red flag, VSC rendered on timeline | Not tracked |
| **Track Rendering Quality** | High-res (thousands of points), inner/outer edges, finish line | Low-res (~250 points), centerline only |
| **CLI Mode** | `--year`, `--round`, `--qualifying` flags | No CLI |
| **Community Docs** | roadmap.md, contributors.md, telemetry.md, PitWall docs | Minimal docs |

### 🤝 Both Have

| Feature | Notes |
|---|---|
| Track map rendering | Both render circuit maps from coordinate data |
| Leaderboard | Both show sorted driver positions |
| Tyre compound display | Both show current tyre |
| Gap / interval display | Both show gaps between drivers |
| OpenF1 / FastF1 data | Both ultimately source from F1 telemetry |

---

## 3. Track Map Comparison (Deep Dive)

| Aspect | **SilverWall** | **f1-race-replay** |
|---|---|---|
| **Source** | OpenF1 `/location` endpoint | FastF1 `session.laps.pick_fastest().get_telemetry()` |
| **Resolution** | ~250 points (downsampled) | Thousands of points (full telemetry at ~25 FPS) |
| **Track Width** | Single centerline only | Inner + outer edges via tangent math |
| **DRS Zones** | ❌ Not rendered | ✅ Detected from DRS telemetry column |
| **Finish Line** | ❌ None | ✅ Checkered pattern at start point |
| **Outlier Handling** | Basic Z-score + zero-point filtering | Clean data via FastF1 processing |
| **GPS/Data Noise** | Noticeable — OpenF1 raw data has artifacts | Minimal — FastF1 pre-processes data |
| **Storage** | Supabase DB (auto-saved on first encounter) | In-memory only |
| **Fallback** | DB → OpenF1 → error response | No fallback needed (local data) |
| **Visual Quality** | Serviceable but coarse | Smooth, detailed, publication-quality |

---

## 4. All Identified Problems & Solutions

### A. Performance & Architecture

| # | Problem | Severity | Current State | Solution | Effort |
|---|---|---|---|---|---|
| P1 | **Redundant API calls per WebSocket client** | 🔴 High | Each connected client triggers independent OpenF1 calls | Shared data broadcaster — fetch once, push to all clients | Medium |
| P2 | **New `httpx.AsyncClient` per call** | 🟡 Medium | Every function creates a new client (TCP handshake overhead) | Create one shared client at app startup, reuse everywhere | Easy |
| P3 | **No REST endpoint caching** | 🟡 Medium | `/status`, `/leaderboard`, `/track/current` hit API on every request | Add short TTL caches (10-30s) for these endpoints | Easy |
| P4 | **Sequential API calls** *(FIXED)* | ✅ Done | Was sequential, now uses `asyncio.gather` | ✅ Applied in PR #2 | Done |
| P5 | **No driver data cache** *(FIXED)* | ✅ Done | Was fetching drivers on every call | ✅ 5-min TTL cache with max 50 entries | Done |

### B. Security

| # | Problem | Severity | Current State | Solution | Effort |
|---|---|---|---|---|---|
| S1 | **Wildcard CORS** *(FIXED)* | ✅ Done | Was `"*"` | ✅ Locked to production + localhost origins | Done |
| S2 | **No rate limiting on API** | 🟡 Medium | Anyone can hammer your endpoints | Add `slowapi` or custom rate limiter | Medium |
| S3 | **Gemini API key exposure risk** | 🟡 Medium | Key loaded from env — good, but no validation | Ensure `.env` is gitignored, add key presence check at startup | Easy |

### C. Track Maps & Visualization

| # | Problem | Severity | Current State | Solution | Effort |
|---|---|---|---|---|---|
| T1 | **Low-res track geometry** | 🔴 High | ~250 points, tracks look blocky | Increase to 500-800 points OR use FastF1 pipeline for clean data | Easy–Med |
| T2 | **No track width (inner/outer edges)** | 🟡 Medium | Single centerline rendered | Port tangent + offset math from TomShaw's `build_track_from_example_lap` | Medium |
| T3 | **No DRS zones** | 🟡 Medium | Not visualized at all | Pre-bake per-circuit DRS zone data as static JSON | Easy |
| T4 | **No finish line** | 🟢 Low | Not rendered | Draw at track[0] coordinate | Easy |
| T5 | **GPS noise in OpenF1 data** | 🟡 Medium | Basic filtering, but still noisy | Use FastF1 as an offline pipeline to generate clean geometry per circuit → Supabase | Medium |

### D. Telemetry & Data Depth

| # | Problem | Severity | Current State | Solution | Effort |
|---|---|---|---|---|---|
| D1 | **No per-driver deep telemetry** | 🔴 High | Only position + gap | Fetch from OpenF1 `/car_data` — gives speed, gear, DRS, throttle, brake | Medium |
| D2 | **No weather data** | 🟡 Medium | Not tracked | OpenF1 has `/weather` endpoint — fetch and display | Easy |
| D3 | **No track status events** | 🟡 Medium | No safety car / red flag indicators | OpenF1 has `/race_control` endpoint | Easy |
| D4 | **No driver click → detail** | 🟡 Medium | Leaderboard is view-only | Add React component: click car → show expanded telemetry card | Medium |
| D5 | **Gap == 0 displayed as "--"** *(FIXED)* | ✅ Done | Was using `elif gap:` | ✅ Changed to `elif gap is not None:` | Done |

### E. Code Quality & DevOps

| # | Problem | Severity | Current State | Solution | Effort |
|---|---|---|---|---|---|
| Q1 | **All logging is `print()`** | 🟡 Medium | No levels, no timestamps, hard to debug in production | Replace with Python `logging` module | Easy |
| Q2 | **Health check doesn't verify dependencies** | 🟢 Low | `/health` returns `{"status": "ok"}` blindly | Add Supabase + OpenF1 connectivity check | Easy |
| Q3 | **Typo in WebSocket error** | 🟢 Low | `"Telemetery"` in `live.py:37` | Fix to `"Telemetry"` | Trivial |
| Q4 | **Docstring coverage < 80%** | 🟢 Low | CodeRabbit flagged 72.73% | Add missing docstrings to `openf1_fetcher.py` | Easy |
| Q5 | **No roadmap or contributor docs** | 🟡 Medium | No public direction for the project | Create `roadmap.md` (like TomShaw's) | Easy |
| Q6 | **No license** | 🟡 Medium | Neither repo has one | Add MIT or similar | Trivial |

### F. UX & Frontend

| # | Problem | Severity | Current State | Solution | Effort |
|---|---|---|---|---|---|
| U1 | **No playback scrubber in demo mode** | 🟡 Medium | `ws.py` supports seek/pause but no UI for it | Build a timeline/progress bar component in React | Medium |
| U2 | **No qualifying session support** | 🟡 Medium | Race only | Add qualifying data fetching + display mode | Hard |
| U3 | **No race event timeline** | 🟡 Medium | No progress bar with flag/SC markers | Build like TomShaw's `RaceProgressBarComponent` | Medium |

---

## 5. Recommended Priority Order

### Phase 1 — Quick Wins (1-2 hours each)
- [ ] **T1** — Increase track resolution to 500+ points
- [ ] **Q3** — Fix "Telemetery" typo
- [ ] **Q4** — Add missing docstrings
- [ ] **D2** — Add weather widget (OpenF1 `/weather`)
- [ ] **D3** — Add track status events (OpenF1 `/race_control`)
- [ ] **Q2** — Enhanced health check
- [ ] **T4** — Add finish line rendering

### Phase 2 — Medium Impact (half-day each)
- [ ] **P2** — Shared `httpx.AsyncClient`
- [ ] **P3** — REST endpoint caching
- [ ] **Q1** — Structured logging
- [ ] **T3** — Pre-baked DRS zone data
- [ ] **D1** — Per-driver deep telemetry (`/car_data`)
- [ ] **D4** — Driver click → detail panel

### Phase 3 — Architecture Upgrades (1-2 days each)
- [ ] **P1** — Shared WebSocket data broadcaster
- [ ] **T2** — Track width rendering (inner/outer edges)
- [ ] **T5** — FastF1 offline pipeline → Supabase seed
- [ ] **S2** — Rate limiting

### Phase 4 — Big Features (multi-day)
- [ ] **U1** — Full playback scrubber UI
- [ ] **U3** — Race progress bar with event markers
- [ ] **U2** — Qualifying session support

---

## 6. Changes Already Applied (PR #2 + CodeRabbit)

| Change | File | Status |
|---|---|---|
| CORS locked to specific origins | `backend/main.py` | ✅ Pushed |
| `ALLOWED_ORIGINS` env var support | `backend/main.py` | ✅ Pushed |
| Parallel fetch with `asyncio.gather` | `backend/openf1_fetcher.py` | ✅ Pushed |
| Driver cache (5-min TTL, max 50) | `backend/openf1_fetcher.py` | ✅ Pushed |
| Gap == 0 bug fix (`is not None`) | `backend/openf1_fetcher.py` | ✅ Pushed |
| `Optional[int]` type hints | `backend/openf1_fetcher.py` | ✅ Pushed |
| Removed unnecessary `global` | `backend/openf1_fetcher.py` | ✅ Pushed |
| Renamed `l` → `loc` | `backend/openf1_fetcher.py` | ✅ Pushed |
| Async unit tests | `backend/tests/test_live_fetch.py` | ✅ Pushed |

> **Commit:** `710aaa4` on `main` — *"perf+security: parallel fetch, driver cache, CORS lockdown, and CodeRabbit fixes"*

---

## 7. UI/UX Frontend Audit — Hardcoded vs Dynamic

> **Audit Date:** 2026-02-21 — Full trace from backend → hooks → components

### 🔴 Hardcoded Values Found

| # | File | Line(s) | What's Hardcoded | Should Be |
|---|---|---|---|---|
| H1 | `TelemetryLive.tsx` | 97 | `isOffSeason ? 'albert_park' : 'abu_dhabi'` | `raceStatus.circuit` or `raceStatus.nextSeason.circuit` |
| H2 | `TelemetryLive.tsx` | 247 | Fallback `'Abu Dhabi GP'` | Should show `'TBD'` or `'Loading...'` |
| H3 | `TelemetryLive.tsx` | 485-488 | `'Yas Marina Circuit'`, `'Abu Dhabi'` | `track?.name` or `'Loading...'` |
| H4 | `TelemetryLive.tsx` | 102 | `sessionTime = '--:--:--'` (never updates) | Calculate from WebSocket frame timestamp |
| H5 | `TelemetryLive.tsx` | 111-135 | `teamColors` and `teamNames` dictionaries | Fetch from backend driver data |
| H6 | `TelemetryLive.tsx` | 268 | `'2026 SEASON'` | `raceStatus.nextSeason?.year + ' SEASON'` |
| H7 | `TelemetryLive.tsx` | 426 | Static SVG `d="M 200 550 ..."` fallback | Show loading spinner or `'NO TRACK DATA'` |
| H8 | `Landing.tsx` | 86-87 | Always green dot + `'System Operational'` | Color-coded by `raceStatus.status` |
| H9 | `Landing.tsx` (RaceCard) | 329 | `"58"` laps, `"5.281 KM"` circuit length | Backend should send laps + circuit_length |
| H10 | `CountdownOverlay.tsx` | 87 | `'MARCH 15, 2026'` | `nextSeason.race_date` formatted dynamically |
| H11 | `SeasonCountdown.tsx` | 49-51 | `'2025 Season Complete'` | `nextSeason.year - 1 + ' Season Complete'` |
| H12 | `SeasonCountdown.tsx` | 118 | `'MAR 08, 2026'` | Parse from `nextSeason.race_date` |
| H13 | `SeasonCountdown.tsx` | 134-135 | `'VER'`, `'4x CHAMPION'` | Fetch from `useChampions()` hook |
| H14 | `useTrack.ts` | 34 | Default param `'abu_dhabi'` | Should have no default or use `'latest'` |

### 🔴 Backend-Frontend Data Contract Mismatch

**Backend `off_season` response** (from `status.py`):
```python
{ "status": "off_season", "next_season": { "year": 2026, "message": "..." } }
```

**Frontend expects** (from `SeasonCountdown.tsx` interface):
```ts
{ year, first_race, location, country, circuit, circuit_length_km, laps, race_date, countdown_seconds }
```

**8 fields missing from backend** → Frontend renders `undefined` everywhere during off-season.

### 🟡 Missing UX Feature: Color-Coded Status Indicator

The header status dot in `Landing.tsx:86` is always green. User's desired behavior:

| Race Status | Dot Color | Text |
|---|---|---|
| `live` | 🟢 Green | `RACE LIVE` |
| `waiting` (pre-race) | 🔴 Red | `NEXT RACE IN: XXD XXH` |
| `ended` (post-race, waiting for next) | 🟡 Yellow | `RACE ENDED · NEXT: ...` |
| `off_season` | ⚫ Grey | `OFF SEASON` |

### ✅ What IS Truly Dynamic (Confirmed Working)

| Feature | Source | Hook | Status |
|---|---|---|---|
| Race name in RaceCard | Supabase `races` table | `useRaceStatus` | ✅ |
| Circuit name | Supabase `races.circuit_name` | `useRaceStatus` | ✅ |
| Country / location | Supabase `races.country` | `useRaceStatus` | ✅ |
| Race date | Supabase `races.race_date` | `useRaceStatus` | ✅ |
| Countdown (waiting mode) | Backend computes seconds diff | `useRaceStatus` | ✅ |
| Track map SVG | API `/api/track/{circuit}` | `useTrack` | ✅ |
| Champions banner | API `/api/champions` + `/standings` | `useChampions` | ✅ |
| Leaderboard | WebSocket frame `cars[]` | `useTelemetry` | ✅ |
| Driver telemetry | WebSocket frame `cars[]` | `useTelemetry` | ✅ |
