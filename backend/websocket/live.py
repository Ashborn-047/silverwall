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

# SpacetimeDB connection details
SPACETIME_URL = os.getenv("SPACETIME_URL", "https://maincloud.spacetimedb.com")
SPACETIME_DBNAME = os.getenv("SPACETIME_DBNAME", "spacetimedb-uorks")
SPACETIME_TOKEN = os.getenv("SPACETIME_TOKEN", "")  # Optional auth token

async def sync_to_spacetime(car_data: dict, session_key: int):
    """
    Call SpacetimeDB reducers to sync live telemetry
    This makes the data available to all connected frontend clients via subscriptions
    """
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            # 1. Update race status to 'live' with current session
            try:
                await client.post(
                    f"{SPACETIME_URL}/database/{SPACETIME_DBNAME}/execute_reducer",
                    json={
                        "reducer": "seed_race",
                        "args": {
                            "race_key": session_key,
                            "name": car_data.get("session_name", "Practice"),
                            "meeting_name": car_data.get("meeting_name", "GRAND PRIX"),
                            "location": car_data.get("location", "—"),
                            "date": datetime.now(timezone.utc).isoformat(),
                            "circuit_key": car_data.get("circuit_key", 0),
                            "status": "live",  # 🔑 Mark as LIVE
                            "year": 2026
                        }
                    },
                    headers={"Authorization": f"Bearer {SPACETIME_TOKEN}"} if SPACETIME_TOKEN else {}
                )
                print(f"✅ Updated race {session_key} to live in SpacetimeDB")
            except Exception as e:
                print(f"⚠️ Failed to seed race: {e}")
            
            # 2. Insert telemetry for each car
            for car in car_data.get("cars", []):
                try:
                    await client.post(
                        f"{SPACETIME_URL}/database/{SPACETIME_DBNAME}/execute_reducer",
                        json={
                            "reducer": "insert_telemetry",
                            "args": {
                                "driver_number": int(car.get("driver_number", 0)),
                                "session_key": session_key,
                                "timestamp": datetime.now(timezone.utc).isoformat(),
                                "speed": int(car.get("speed", 0)),
                                "rpm": 0,
                                "gear": int(car.get("position", 0)),
                                "throttle": 0,
                                "brake": 0,
                                "drs": 0,
                                "x": float(car.get("x", 0)),
                                "y": float(car.get("y", 0))
                            }
                        },
                        headers={"Authorization": f"Bearer {SPACETIME_TOKEN}"} if SPACETIME_TOKEN else {}
                    )
                except Exception as e:
                    print(f"⚠️ Failed to insert telemetry for driver {car.get('driver_number')}: {e}")
            
            # 3. Upsert driver info
            for car in car_data.get("cars", []):
                try:
                    await client.post(
                        f"{SPACETIME_URL}/database/{SPACETIME_DBNAME}/execute_reducer",
                        json={
                            "reducer": "upsert_driver",
                            "args": {
                                "driver_number": int(car.get("driver_number", 0)),
                                "name": car.get("code", "UNK"),
                                "team": car.get("team", "Unknown"),
                                "color": car.get("color", "#00D2BE")
                            }
                        },
                        headers={"Authorization": f"Bearer {SPACETIME_TOKEN}"} if SPACETIME_TOKEN else {}
                    )
                except Exception as e:
                    print(f"⚠️ Failed to upsert driver {car.get('driver_number')}: {e}")
                
    except Exception as e:
        print(f"⚠️ SpacetimeDB sync failed: {e}")


@router.websocket("/ws/live")
async def websocket_live(websocket: WebSocket):
    """
    LIVE MODE WebSocket - Fetches real car positions from OpenF1 API
    ALSO syncs to SpacetimeDB for all frontend clients to consume via subscriptions
    """
    await websocket.accept()
    print("🏎️ LIVE: Client connected to /ws/live")
    
    try:
        while True:
            try:
                # Fetch live state from OpenF1
                data = await fetch_live_telemetry()
                
                # 🔑 NEW: Sync to SpacetimeDB in background
                session_key = await get_latest_session_key()
                if session_key and data.get("status") == "live":
                    asyncio.create_task(sync_to_spacetime(data, session_key))
                
                # Send to direct WebSocket clients (backup/fallback)
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
