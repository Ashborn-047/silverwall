"""
SilverWall - OpenF1 Live Data Fetcher
Fetches real-time car positions and telemetry from OpenF1 API
"""

import httpx
from datetime import datetime, timezone
from typing import Optional, List, Dict

OPENF1_API = "https://api.openf1.org/v1"


async def get_latest_session_key() -> Optional[int]:
    """Get the current/latest session key from OpenF1"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{OPENF1_API}/sessions", params={"session_key": "latest"})
            if response.status_code == 200:
                data = response.json()
                if data:
                    session = data[0]
                    # Only return if session is live (no end time)
                    if session.get("date_end") is None:
                        return session.get("session_key")
    except Exception as e:
        print(f"Error getting session key: {e}")
    return None


async def fetch_car_positions(session_key: int = None) -> List[Dict]:
    """Fetch current car positions from OpenF1"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            params = {}
            if session_key:
                params["session_key"] = session_key
            else:
                params["session_key"] = "latest"
            
            # Get location data (x, y coordinates)
            response = await client.get(f"{OPENF1_API}/location", params=params)
            if response.status_code == 200:
                data = response.json()
                if data:
                    # Group by driver_number and get latest position for each
                    latest_positions = {}
                    for entry in data:
                        driver_num = entry.get("driver_number")
                        if driver_num:
                            # Keep the most recent entry for each driver
                            if driver_num not in latest_positions or entry.get("date", "") > latest_positions[driver_num].get("date", ""):
                                latest_positions[driver_num] = entry
                    
                    return list(latest_positions.values())
    except Exception as e:
        print(f"Error fetching car positions: {e}")
    return []


async def fetch_driver_info(session_key: int = None) -> Dict[int, Dict]:
    """Fetch driver info (name, team) from OpenF1"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            params = {}
            if session_key:
                params["session_key"] = session_key
            else:
                params["session_key"] = "latest"
            
            response = await client.get(f"{OPENF1_API}/drivers", params=params)
            if response.status_code == 200:
                data = response.json()
                drivers = {}
                for d in data:
                    driver_num = d.get("driver_number")
                    if driver_num:
                        drivers[driver_num] = {
                            "code": d.get("name_acronym", f"#{driver_num}"),
                            "name": d.get("full_name", "Unknown"),
                            "team": d.get("team_name", "Unknown"),
                            "color": d.get("team_colour", "#00D2BE"),
                        }
                return drivers
    except Exception as e:
        print(f"Error fetching driver info: {e}")
    return {}


async def fetch_live_telemetry(session_key: int = None) -> Dict:
    """
    Fetch live telemetry data combining positions and driver info.
    Returns data ready for WebSocket broadcast.
    """
    session_key = session_key or await get_latest_session_key()
    
    if not session_key:
        return {"status": "offline", "cars": [], "message": "No active session"}
    
    # Fetch positions and drivers in parallel
    positions = await fetch_car_positions(session_key)
    drivers = await fetch_driver_info(session_key)
    
    if not positions:
        return {"status": "waiting", "cars": [], "session_key": session_key}
    
    # Combine position data with driver info
    cars = []
    for pos in positions:
        driver_num = pos.get("driver_number")
        driver_info = drivers.get(driver_num, {"code": f"#{driver_num}", "team": "Unknown", "color": "#555"})
        
        cars.append({
            "code": driver_info["code"],
            "team": driver_info["team"],
            "color": driver_info["color"],
            "x": pos.get("x", 0),
            "y": pos.get("y", 0),
            "z": pos.get("z", 0),
            "driver_number": driver_num,
        })
    
    return {
        "status": "live",
        "session_key": session_key,
        "cars": cars,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


async def fetch_intervals() -> List[Dict]:
    """Fetch gap intervals between drivers for leaderboard"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{OPENF1_API}/intervals", params={"session_key": "latest"})
            if response.status_code == 200:
                data = response.json()
                # Get latest interval for each driver
                latest = {}
                for entry in data:
                    driver_num = entry.get("driver_number")
                    if driver_num:
                        if driver_num not in latest or entry.get("date", "") > latest[driver_num].get("date", ""):
                            latest[driver_num] = entry
                return list(latest.values())
    except Exception as e:
        print(f"Error fetching intervals: {e}")
    return []


async def fetch_position() -> List[Dict]:
    """Fetch current race positions for leaderboard"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{OPENF1_API}/position", params={"session_key": "latest"})
            if response.status_code == 200:
                data = response.json()
                # Get latest position for each driver
                latest = {}
                for entry in data:
                    driver_num = entry.get("driver_number")
                    if driver_num:
                        if driver_num not in latest or entry.get("date", "") > latest[driver_num].get("date", ""):
                            latest[driver_num] = entry
                return sorted(latest.values(), key=lambda x: x.get("position", 999))
    except Exception as e:
        print(f"Error fetching positions: {e}")
    return []
