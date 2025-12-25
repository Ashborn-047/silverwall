# SilverWall 🏎️

**Engineering-Grade F1 Telemetry Dashboard**

SilverWall is a fully **autonomous**, **database-driven** F1 telemetry dashboard. It transitions seamlessly between seasons, tracks, and off-seasons without any manual code updates, leveraging Supabase as its central nervous system and OpenF1 for live telemetry.

![SilverWall Autonomous](https://img.shields.io/badge/Engine-Autonomous-00D2BE?style=for-the-badge)
![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=flat-square&logo=supabase)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)

---

## ⚡ Autonomous Features

### 🧠 Year-Agnostic Intelligence
The backend dynamically queries Supabase to identify the "Active Season" based on your data. As soon as you seed a new season, the entire app transitions automatically—no hardcoded years.

### 🗺️ Dynamic Track Learning
- **Zero-Blank Maps**: Fetches geometry from the `tracks` table
- **Self-Healing**: Autonomously captures and saves new track maps during live sessions

### 🏁 Automated Results Ingestion
Built-in pipeline (`ingest_results.py`) fetches official positions from OpenF1 and updates championship standings in Supabase.

### 💓 Sentinel Monitoring
- **GitHub Actions**: Health checks every 72 hours
- **Discord Integration**: Real-time health reports to your Discord channel

---

## 📁 Project Structure

```
silverwall/
├── 📂 backend/                     # FastAPI Python Backend
│   ├── main.py                     # FastAPI app entry point with CORS
│   ├── database.py                 # Supabase client initialization
│   ├── models.py                   # Pydantic models for API responses
│   ├── requirements.txt            # Python dependencies
│   ├── vercel.json                 # Vercel serverless deployment config
│   ├── Procfile                    # Railway/Heroku deployment
│   │
│   ├── 📂 routes/                  # API Endpoint Handlers
│   │   ├── status.py               # /api/status - Race status & countdown
│   │   ├── standings.py            # /api/standings/* & /api/champions
│   │   ├── track.py                # /api/track/{circuit} - SVG geometry
│   │   ├── results.py              # /api/results & /api/season/races
│   │   ├── commentary.py           # /api/commentary - AI race commentary
│   │   └── radio.py                # /api/radio - Team radio messages
│   │
│   ├── 📂 migrations/              # Supabase SQL Migrations
│   │   ├── 001_create_tables.sql   # Core schema (seasons, races, standings)
│   │   ├── 002_seed_2025_data.sql  # 2025 race schedule seed
│   │   ├── 003_seed_2024_data.sql  # 2024 season data
│   │   ├── 004_2025_final_results.sql # 2025 race results (partial)
│   │   ├── 005_complete_2025_results.sql # Complete 2025 P1-P10 results
│   │   └── 006_2024_season_complete.sql  # Complete 2024 season data
│   │
│   ├── 📂 pipeline/                # Automation Scripts
│   │   ├── seed_tracks.py          # Seed track geometry to Supabase
│   │   ├── ingest_results.py       # Fetch & store race results from OpenF1
│   │   ├── health_keepalive.py     # Supabase keepalive + Discord alerts
│   │   └── fake_monza_timeline.py  # Test timeline generator
│   │
│   ├── 📂 websocket/               # WebSocket Handlers
│   │   └── telemetry_ws.py         # Real-time telemetry streaming
│   │
│   ├── openf1_fetcher.py           # OpenF1 API client
│   └── gemini_fetcher.py           # Gemini AI integration for commentary
│
├── 📂 Silverwall UIUX design system/  # React Frontend (Vite + TypeScript)
│   ├── index.html                  # HTML entry point
│   ├── vite.config.ts              # Vite configuration
│   ├── tailwind.config.js          # Tailwind CSS configuration
│   ├── package.json                # NPM dependencies
│   │
│   └── 📂 src/
│       ├── main.tsx                # React entry point
│       ├── App.tsx                 # Router configuration
│       │
│       ├── 📂 pages/               # Route Pages
│       │   ├── Landing.tsx         # Home page with race card & countdown
│       │   ├── TelemetryLive.tsx   # Live telemetry pit-wall dashboard
│       │   └── DesignSystem.tsx    # Component library showcase
│       │
│       ├── 📂 components/          # Reusable UI Components
│       │   ├── ResultsModal.tsx    # Season results modal (standings, races)
│       │   ├── CountdownOverlay.tsx # Race countdown overlay
│       │   ├── SeasonCountdown.tsx # Off-season countdown display
│       │   └── CommentaryPanel.tsx # AI-generated race commentary
│       │
│       ├── 📂 hooks/               # Custom React Hooks
│       │   ├── useRaceStatus.ts    # Fetches race status from /api/status
│       │   ├── useChampions.ts     # Fetches champions from /api/champions
│       │   ├── useStandings.ts     # Fetches standings from /api/standings
│       │   ├── useTrack.ts         # Fetches track SVG from /api/track
│       │   └── useTelemetry.ts     # WebSocket telemetry hook
│       │
│       └── 📂 styles/              # Global Styles
│           └── index.css           # Tailwind imports & custom styles
│
├── 📂 .github/
│   └── 📂 workflows/
│       └── health.yml              # Automated Supabase health checks
│
├── 📂 docs/                        # Documentation
│   ├── API.md                      # API endpoint documentation
│   └── ARCHITECTURE.md             # System architecture details
│
├── README.md                       # This file
├── CHANGELOG.md                    # Version history
├── DEPLOYMENT.md                   # Deployment instructions
├── Dockerfile                      # Container deployment
└── railway.json                    # Railway deployment config
```

---

## 🏗️ Architecture

```mermaid
graph TD
    A[OpenF1 API] -->|Live Telemetry| B[FastAPI Backend]
    S[(Supabase DB)] <-->|Schedules/Standings/Tracks| B
    B -->|REST API| F[React Frontend]
    B -->|WebSocket| F
    G[GitHub Actions] -->|Trigger| H[Health Sentinel]
    H -->|Ping| S
    H -->|Report| D[Discord Webhook]
```

---

## 🗄️ Database Schema

| Table | Description |
|-------|-------------|
| `seasons` | Year, champion driver/constructor |
| `races` | Race schedule (date, circuit, status) |
| `race_results` | P1-P10 results for each race |
| `driver_standings` | Points, wins, position per driver |
| `constructor_standings` | Team championship standings |
| `tracks` | Circuit geometry (SVG path data) |

---

## 🚀 Quick Start

### 1. Database Setup
```bash
# Create a Supabase project, then run migrations in order:
psql -f backend/migrations/001_create_tables.sql
psql -f backend/migrations/002_seed_2025_data.sql
# ... continue for all migration files
```

### 2. Environment Variables
Create `backend/env/.env.supabase`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

Create `Silverwall UIUX design system/.env`:
```env
VITE_API_URL=http://localhost:8000
```

### 3. Run Locally

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd "Silverwall UIUX design system"
npm install
npm run dev -- --port 3000
```

---

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status` | GET | Race status, countdown, next event |
| `/api/champions` | GET | Current season champions |
| `/api/standings/drivers/{year}` | GET | Driver championship standings |
| `/api/standings/constructors/{year}` | GET | Constructor standings |
| `/api/season/races/{year}` | GET | Race schedule with podium results |
| `/api/track/{circuit}` | GET | Track SVG geometry |
| `/api/results` | GET | Latest race results |

---

## 🔐 GitHub Secrets

| Secret | Description |
|--------|-------------|
| `SUPABASE_URL` | Your Supabase Project API URL |
| `SUPABASE_SERVICE_KEY` | Service Role Key (write access) |
| `DISCORD_WEBHOOK_URL` | Discord health channel webhook |

---

## 🚀 Deployment

| Platform | Config File |
|----------|-------------|
| **Vercel** | `backend/vercel.json` |
| **Railway** | `railway.json` |
| **Docker** | `Dockerfile` |

---

## 📅 Roadmap

- [x] Autonomous Season Transitions
- [x] Dynamic Track Map Learning
- [x] Automated Standings Ingestion
- [x] Off-Season Countdown Display
- [ ] AI-Powered Race Strategy Predictions
- [ ] Multi-Driver Multi-View Layout
- [ ] Lap Time Comparison Charts

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **Backend** | Python, FastAPI, Pydantic |
| **Database** | Supabase (PostgreSQL) |
| **Real-time** | WebSocket, OpenF1 API |
| **AI** | Google Gemini (Commentary) |
| **CI/CD** | GitHub Actions |

---

## 📄 License

MIT License | Built with passion for F1 Engineering.

---

<p align="center">
  <strong>🏎️ SilverWall</strong> — Where Data Meets the Track
</p>
