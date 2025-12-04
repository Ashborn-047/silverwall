# SilverWall 🏎️

Real-time F1 telemetry dashboard with live car tracking, leaderboard, and driver telemetry visualization. Built with React + FastAPI, powered by OpenF1 API.

## Quick Start

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

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/status` | Race status + countdown |
| `GET /api/leaderboard` | Live/mock leaderboard |
| `GET /api/track/current` | Current circuit geometry |
| `GET /api/track/{circuit}` | Specific circuit geometry |
| `WS /ws/abu_dhabi` | Live telemetry stream |
| `GET /health` | Health check |

## Environment Variables

### Frontend (`Silverwall UIUX design system/.env`)
```
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws/abu_dhabi
```

### Production
```
VITE_API_URL=https://your-backend.railway.app
VITE_WS_URL=wss://your-backend.railway.app/ws/abu_dhabi
```

## Deployment

### Railway (Backend)
1. Connect GitHub repo to Railway
2. Set root directory to `backend`
3. Deploy using Dockerfile

### Vercel (Frontend)
1. Connect GitHub repo to Vercel  
2. Set root directory to `Silverwall UIUX design system`
3. Set environment variables
4. Deploy

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: FastAPI, Python 3.11, WebSockets
- **Data**: OpenF1 API
- **Deployment**: Railway (backend), Vercel (frontend)

## License

MIT
