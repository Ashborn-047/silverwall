"""
SilverWall Backend
FastAPI application for F1 telemetry streaming
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ws import router as ws_router
import ws
from pipeline.fake_monza_timeline import TIMELINE

# Import Abu Dhabi routers
from websocket.live import router as abu_dhabi_ws_router
from routes.track import router as track_router
from routes.status import router as status_router

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
app.include_router(ws_router)
app.include_router(abu_dhabi_ws_router)

# Include REST API routers
app.include_router(track_router, prefix="/api")
app.include_router(status_router, prefix="/api")


@app.on_event("startup")
async def startup_event():
    """Load timeline data on startup"""
    print("\n" + "="*60)
    print("🏁 SilverWall F1 Telemetry Backend")
    print("="*60)
    print(f"📊 Loading timeline...")
    
    # Load fake timeline into WebSocket module
    ws.TIMELINE = TIMELINE
    
    print(f"✓ Timeline loaded: {len(TIMELINE)} frames")
    if TIMELINE:
        print(f"✓ Duration: {TIMELINE[-1].t:.1f}s")
        print(f"✓ Cars: {len(TIMELINE[0].cars)}")
    print(f"✓ Frame rate: 10 fps (0.1s intervals)")
    print("="*60)
    print("🚀 Backend ready at http://127.0.0.1:8000")
    print("🔌 WebSocket endpoint: ws://127.0.0.1:8000/ws/monza")
    print("="*60 + "\n")


@app.get("/")
def root():
    """API status endpoint"""
    return {
        "status": "SilverWall backend running",
        "frames": len(TIMELINE),
        "duration": f"{TIMELINE[-1].t:.1f}s" if TIMELINE else "0s",
        "cars": len(TIMELINE[0].cars) if TIMELINE else 0,
        "websocket": "/ws/monza"
    }


@app.get("/health")
def health():
    """Health check endpoint"""
    return {"status": "ok"}
