# SilverWall Deployment Checklist

## ✅ Files Created/Updated

### Backend (`backend/`)
- [x] `requirements.txt` - Dependencies (fastapi, uvicorn, websockets, pydantic, httpx)
- [x] `Dockerfile` - Python 3.11 container
- [x] `Procfile` - Heroku/Railway start command
- [x] `routes/status.py` - Race status + leaderboard endpoints
- [x] `main.py` - Updated with status router

### Root
- [x] `.gitignore` - Node, Python, editor ignores
- [x] `README.md` - Setup + API docs
- [x] `railway.json` - Railway deployment config

---

## 🚀 Railway Deployment Steps

1. **Login to Railway**: https://railway.app
2. **New Project** → Deploy from GitHub
3. **Select repo**: `Ashborn-047/silverwall`
4. **Configure**:
   - Root Directory: `backend`
   - Build: Dockerfile
5. **Deploy** → Wait for build
6. **Get URL**: `https://silverwall-production.up.railway.app` (or similar)

---

## 🖥️ Frontend Connection

Update `Silverwall UIUX design system/.env`:

```env
VITE_API_URL=https://your-railway-url.up.railway.app
VITE_WS_URL=wss://your-railway-url.up.railway.app/ws/abu_dhabi
```

---

## 📡 API Reference

### REST Endpoints
```
GET  /health           → { status: "ok" }
GET  /api/status       → { status: "live"|"waiting", countdown_seconds, ... }
GET  /api/leaderboard  → { drivers: [...] }
GET  /api/track/current → { points: [...], name, location }
```

### WebSocket
```javascript
const ws = new WebSocket("wss://your-backend.railway.app/ws/abu_dhabi");
ws.onmessage = (e) => {
  const frame = JSON.parse(e.data);
  // frame.cars = [{ code, team, x, y, speed, gear, throttle, brake, drs }, ...]
};
```

---

## 🏁 Abu Dhabi GP 2024 Schedule (UTC)

| Session | Date | Time (UTC) |
|---------|------|------------|
| FP1 | Dec 6 | 06:30 |
| FP2 | Dec 6 | 10:00 |
| FP3 | Dec 7 | 07:30 |
| Qualifying | Dec 7 | 11:00 |
| Race | Dec 8 | 09:00 |
