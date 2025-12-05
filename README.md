# SilverWall 🏎️

Real-time F1 telemetry dashboard with live car tracking, leaderboard, and driver telemetry visualization. Built with React + FastAPI, powered by OpenF1 API.

![SilverWall Demo](https://img.shields.io/badge/Status-Live-00D2BE?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)

---

## 🎯 Features

- **Live Track Visualization** - Real-time car positions on circuit map
- **Dynamic Leaderboard** - Gap times, positions, fastest laps
- **Driver Telemetry** - Speed, throttle, brake, DRS status
- **Live Commentary** - AI-generated race events and commentary
- **2026 Season Countdown** - Off-season countdown to next race

---

## 🏗️ Architecture

### Demo vs Live Mode

| Mode | URL | WebSocket | Behavior |
|------|-----|-----------|----------|
| **Live** | `/telemetry/live` | `/ws/live` | Real OpenF1 data - shows waiting state when no race |
| **Demo** | `/telemetry/live?demo=true` | `/ws/abu_dhabi` | Simulated telemetry with animated cars |

### Data Flow

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   OpenF1 API    │──────│  FastAPI Backend │──────│  React Frontend │
│  (Real Data)    │      │   (Railway)      │      │   (Vercel)      │
└─────────────────┘      └─────────────────┘      └─────────────────┘
                                ▲
                                │
                         WebSocket Stream
                           (/ws/live)
```

---

## 🚀 Quick Start

### Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`

### Frontend (React + Vite)

```bash
cd "Silverwall UIUX design system"
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## 📡 API Endpoints

### REST API

| Endpoint | Description |
|----------|-------------|
| `GET /api/status` | Race status (live/waiting/off_season) + countdown |
| `GET /api/leaderboard` | Live or mock leaderboard data |
| `GET /api/track/current` | Current circuit geometry from OpenF1 |
| `GET /api/track/{circuit}` | Static circuit geometry (abu_dhabi, monza, etc.) |
| `GET /api/commentary` | Live commentary events |
| `GET /api/results` | Race results with podium data |
| `GET /api/radio` | Team radio transcripts |
| `GET /health` | Health check |

### WebSocket Endpoints

| Endpoint | Mode | Description |
|----------|------|-------------|
| `WS /ws/live` | Live | Real OpenF1 car positions (2 FPS) |
| `WS /ws/abu_dhabi` | Demo | Simulated car movements (3 FPS) |

---

## ⚙️ Environment Variables

### Frontend (`.env`)

```env
# Local development
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000

# Production
VITE_API_URL=https://silverwall-production.up.railway.app
VITE_WS_URL=wss://silverwall-production.up.railway.app
```

---

## 🚀 Deployment

### Railway (Backend)

1. Connect GitHub repo to Railway
2. Set root directory to `backend`
3. Deploy using Dockerfile (auto-detected)

### Vercel (Frontend)

1. Connect GitHub repo to Vercel
2. Set root directory to `Silverwall UIUX design system`
3. Add environment variables (VITE_API_URL, VITE_WS_URL)
4. Deploy

---

## 🎨 Design System

**Theme:** AMG Surgical Engineering - Dark, precise, professional

| Token | Value | Usage |
|-------|-------|-------|
| `--sw-primary-teal` | `#00D2BE` | Mercedes teal accent |
| `--sw-bg-carbon-100` | `#0A0C10` | Primary background |
| `--sw-text-high` | `#E0E0E0` | Primary text |
| `--sw-status-green` | `#00FF88` | Success/positive |
| `--sw-status-red` | `#FF3B3B` | Error/negative |

---

## 📁 Project Structure

```
silverwall/
├── backend/                    # FastAPI backend
│   ├── main.py                 # App entry point
│   ├── routes/                 # API routes
│   │   ├── status.py           # Race status + 2026 countdown
│   │   ├── track.py            # Circuit geometry
│   │   ├── commentary.py       # Live commentary
│   │   ├── results.py          # Race results
│   │   └── radio.py            # Team radio
│   ├── websocket/              # WebSocket handlers
│   │   └── live.py             # Demo + Live streams
│   └── openf1_fetcher.py       # OpenF1 API integration
│
└── Silverwall UIUX design system/  # React frontend
    ├── src/
    │   ├── pages/
    │   │   ├── Landing.tsx     # Home page
    │   │   └── TelemetryLive.tsx   # Main telemetry view
    │   ├── components/
    │   │   ├── CommentaryPanel.tsx
    │   │   └── SeasonCountdown.tsx
    │   └── hooks/
    │       ├── useTelemetry.ts # WebSocket connection
    │       ├── useTrack.ts     # Track geometry
    │       └── useRaceStatus.ts # Race status polling
    └── vercel.json             # SPA routing config
```

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **Backend** | FastAPI, Python 3.11, WebSockets, httpx |
| **Data Source** | OpenF1 API (free F1 telemetry) |
| **Deployment** | Railway (backend), Vercel (frontend) |

---

## 📅 2026 Season

After Abu Dhabi GP 2025, the app shows a countdown to:

- **Australian Grand Prix 2026**
- **Albert Park, Melbourne**
- **March 6-8, 2026**

---

## 📄 License

MIT
