"""
SilverWall WebSocket - Live Telemetry
Streams real car positions from OpenF1 API + syncs to SpacetimeDB
"""

import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from openf1_fetcher import fetch_live_telemetry, get_latest_session_key
from datetime import datetime, timezone
import httpx
import os

router = APIRouter()


@router.websocket("/ws/live")
async def websocket_live(websocket: WebSocket):
    """
    LIVE MODE WebSocket - Fetches real car positions from OpenF1 API
    and streams directly to connected clients.
    """
    await websocket.accept()
    print("🏎️ LIVE: Client connected to /ws/live")
    
    try:
        while True:
            try:
                # Fetch live state from OpenF1
                data = await fetch_live_telemetry()
                
                # Send to direct WebSocket clients
                await websocket.send_json(data)
                
                # Polling interval: 0.5s if live, 5s if waiting
                if data.get("status") == "live":
                    await asyncio.sleep(0.5)
                else:
                    await asyncio.sleep(5)
                    
            except Exception as e:
                print(f"⚠️ LIVE fetch error: {e}")
                await websocket.send_json({"status": "error", "message": "Telemetery stream error", "cars": []})
                await asyncio.sleep(5)
            
    except WebSocketDisconnect:
        print("🏎️ LIVE: Client disconnected")
    except Exception as e:
        print(f"❌ WebSocket error: {e}")
