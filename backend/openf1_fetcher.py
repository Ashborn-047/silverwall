"""
SilverWall - OpenF1 Live Data Fetcher
Fetches real-time car positions and telemetry from OpenF1 API
"""

import httpx
import asyncio
from datetime import datetime, timezone
from typing import Optional, List, Dict

OPENF1_API = "https://api.openf1.org/v1"

# Cache for static data
_driver_cache = {}


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
    global _driver_cache

    # Check cache first if session key is provided
    cache_key = f"drivers_{session_key}" if session_key else "drivers_latest"
    if cache_key in _driver_cache:
        return _driver_cache[cache_key]

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

                # Cache the result if we have drivers
                if drivers:
                    _driver_cache[cache_key] = drivers
                return drivers
    except Exception as e:
        print(f"Error fetching driver info: {e}")
    return {}


async def fetch_stints(session_key: int = None) -> Dict[int, Dict]:
    """Fetch latest tyre stint for each driver"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            params = {}
            if session_key:
                params["session_key"] = session_key
            else:
                params["session_key"] = "latest"
            
            response = await client.get(f"{OPENF1_API}/stints", params=params)
            if response.status_code == 200:
                data = response.json()
                stints = {}
                for s in data:
                    driver_num = s.get("driver_number")
                    if driver_num:
                        # Keep latest stint
                        if driver_num not in stints or s.get("stint_number") > stints[driver_num].get("stint_number"):
                            stints[driver_num] = s
                return stints
    except Exception as e:
        print(f"Error fetching stints: {e}")
    return {}


async def fetch_intervals(session_key: int = None) -> List[Dict]:
    """Fetch gap intervals between drivers for leaderboard"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            params = {}
            if session_key:
                params["session_key"] = session_key
            else:
                params["session_key"] = "latest"

            response = await client.get(f"{OPENF1_API}/intervals", params=params)
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


async def fetch_position(session_key: int = None) -> List[Dict]:
    """Fetch current race positions for leaderboard"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            params = {}
            if session_key:
                params["session_key"] = session_key
            else:
                params["session_key"] = "latest"

            response = await client.get(f"{OPENF1_API}/position", params=params)
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


async def fetch_live_telemetry(session_key: int = None) -> Dict:
    """
    Fetch live telemetry data combining positions, intervals, stints, and driver info.
    Returns data ready for WebSocket broadcast, SORTED by race position.
    """
    session_key = session_key or await get_latest_session_key()
    
    if not session_key:
        return {"status": "offline", "cars": [], "message": "No active session"}
    
    # Fetch all data in parallel using asyncio.gather
    try:
        results = await asyncio.gather(
            fetch_position(session_key),
            fetch_intervals(session_key),
            fetch_car_positions(session_key),
            fetch_driver_info(session_key),
            fetch_stints(session_key),
            return_exceptions=True # Don't crash if one fails
        )

        # Unpack results, handling potential exceptions
        race_positions = results[0] if isinstance(results[0], list) else []
        intervals = results[1] if isinstance(results[1], list) else []
        locations = results[2] if isinstance(results[2], list) else []
        drivers = results[3] if isinstance(results[3], dict) else {}
        stints = results[4] if isinstance(results[4], dict) else {}

    except Exception as e:
        print(f"Critical error in parallel fetch: {e}")
        return {"status": "error", "cars": [], "message": str(e)}
    
    if not race_positions and not locations:
        return {"status": "waiting", "cars": [], "session_key": session_key}
    
    # helper maps
    interval_map = {i.get("driver_number"): i for i in intervals}
    location_map = {l.get("driver_number"): l for l in locations}
    
    # If we have race positions, use that as the primary list
    # If not (e.g. practice session where position might be weird or missing), fall back to location keys
    
    primary_list = race_positions if race_positions else [{"driver_number": k} for k in location_map.keys()]
    
    cars = []
    for entry in primary_list:
        driver_num = entry.get("driver_number")
        if not driver_num:
            continue
            
        driver_info = drivers.get(driver_num, {"code": f"#{driver_num}", "team": "Unknown", "color": "#555"})
        loc = location_map.get(driver_num, {})
        interval_data = interval_map.get(driver_num, {})
        stint_data = stints.get(driver_num, {})
        
        # Calculate gap
        gap = interval_data.get("gap_to_leader")
        if gap is None:
            gap = interval_data.get("interval") # Fallback
            
        # Format gap string
        gap_str = ""
        if entry.get("position") == 1:
            gap_str = "LEADER"
        elif gap:
             gap_str = f"+{gap}s"
        else:
            gap_str = "--"
            
        cars.append({
            "position": entry.get("position", 0),
            "driver_number": driver_num,
            "code": driver_info["code"],
            "team": driver_info["team"],
            "color": driver_info["color"],
            "x": loc.get("x", 0),
            "y": loc.get("y", 0),
            "z": loc.get("z", 0),
            "gap": gap_str,
            "interval": interval_data.get("interval"),
            "tyre": stint_data.get("compound", "UNKNOWN"),
            "tyre_age": stint_data.get("tyre_age_at_start", 0), # This might be laps?
        })
        
    # Sort by position just in case
    cars.sort(key=lambda x: x["position"] if x["position"] > 0 else 999)
    
    return {
        "status": "live",
        "session_key": session_key,
        "cars": cars,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
