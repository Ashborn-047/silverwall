"""
SilverWall Backend
FastAPI application for F1 telemetry streaming
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import routers
from websocket.live import router as live_ws_router
from routes.track import router as track_router
from routes.status import router as status_router
from routes.commentary import router as commentary_router
from routes.radio import router as radio_router
from routes.results import router as results_router
from routes.standings import router as standings_router
from routes.discord import router as discord_router

app = FastAPI(
    title="SilverWall F1 Telemetry",
    description="Real-time F1 pit wall telemetry system",
    version="1.0.0"
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include WebSocket routers
app.include_router(live_ws_router)

# Include REST API routers
app.include_router(track_router, prefix="/api")
app.include_router(status_router, prefix="/api")
app.include_router(commentary_router, prefix="/api")
app.include_router(radio_router, prefix="/api")
app.include_router(results_router, prefix="/api")
app.include_router(standings_router, prefix="/api")
app.include_router(discord_router, prefix="/api")


@app.on_event("startup")
async def startup_event():
    """System check on startup"""
    print("\n" + "="*60)
    print("SilverWall F1 Telemetry Backend")
    print("="*60)
    print("System: Autonomous Mode Active")
    print("Source: Supabase + OpenF1 Live")
    print("="*60)
    print("Backend ready at http://127.0.0.1:8000")
    print("="*60 + "\n")


@app.get("/")
def root():
    """API status endpoint"""
    return {
        "status": "SilverWall autonomous backend running",
        "engine": "v2 (Supabase-driven)",
        "openf1_proxy": "active",
    }


@app.get("/health")
def health():
    """Health check endpoint"""
    return {"status": "ok"}
