"""
SilverWall Backend
FastAPI application for F1 telemetry streaming
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Import logging and middleware
from logger import logger
from middleware.request_tracking import RequestTrackingMiddleware

# Import routers
from websocket.live import router as live_ws_router
from routes.track import router as track_router
from routes.status import router as status_router
from routes.commentary import router as commentary_router
from routes.radio import router as radio_router
from routes.results import router as results_router
from routes.standings import router as standings_router
from routes.discord import router as discord_router

# Import HTTP client cleanup
from openf1_fetcher import close_http_client

app = FastAPI(
    title="SilverWall F1 Telemetry",
    description="Real-time F1 pit wall telemetry system",
    version="1.0.0"
)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS for frontend
# Allow production and local development origins
origins = [
    "https://silverwall.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]

# Allow additional origins via environment variable
env_origins = os.getenv("ALLOWED_ORIGINS")
if env_origins:
    origins.extend(o.strip() for o in env_origins.split(",") if o.strip())

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add response compression for responses > 1KB
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add request tracking middleware for observability
app.add_middleware(RequestTrackingMiddleware)

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
    logger.info("=" * 60)
    logger.info("SilverWall F1 Telemetry Backend Starting")
    logger.info("=" * 60)
    logger.info("System: Autonomous Mode Active")
    logger.info("Source: Supabase + OpenF1 Live")
    logger.info("Features: Connection Pooling, Circuit Breaker, Compression, Observability")
    logger.info("=" * 60)
    logger.info("Backend ready at http://127.0.0.1:8000")
    logger.info("=" * 60)


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup resources on shutdown"""
    print("\n" + "="*60)
    print("SilverWall Backend Shutting Down")
    print("="*60)
    print("Closing HTTP client connections...")
    await close_http_client()
    print("Cleanup complete")
    print("="*60 + "\n")


@app.get("/")
@limiter.limit("60/minute")
def root():
    """API status endpoint"""
    return {
        "status": "SilverWall autonomous backend running",
        "engine": "v2 (Supabase-driven)",
        "openf1_proxy": "active",
    }


@app.get("/health")
@limiter.limit("120/minute")
def health():
    """
    Health check endpoint with basic system info
    Used by monitoring systems and load balancers
    """
    return {
        "status": "ok",
        "service": "silverwall-backend",
        "version": "1.0.0"
    }
