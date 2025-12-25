"""
SilverWall REST API - Track Geometry
Dynamic circuit detection and geometry fetching from Supabase
"""

import httpx
from fastapi import APIRouter
from database import get_track_geometry, get_next_race, save_track_geometry

router = APIRouter()

# OpenF1 API base URL
OPENF1_API = "https://api.openf1.org/v1"

# Cache for track data
_track_cache = {}


async def fetch_current_session():
    """Fetch current/latest session info from OpenF1"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{OPENF1_API}/sessions", params={"session_key": "latest"})
            response.raise_for_status()
            data = response.json()
            
            if data and len(data) > 0:
                session = data[0]
                return {
                    "session_key": session.get("session_key"),
                    "circuit_key": session.get("circuit_key"),
                    "circuit_short_name": session.get("circuit_short_name"),
                    "session_name": session.get("session_name"),
                    "meeting_name": session.get("meeting_name"),
                    "country_name": session.get("country_name"),
                }
            return None
    except Exception as e:
        print(f"[ERR] Error fetching current session: {e}")
        return None


async def fetch_track_from_openf1(session_key: str = "latest") -> list:
    """Fetch track coordinates from OpenF1 location data with artifact filtering."""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            url = f"{OPENF1_API}/location"
            # We use driver 1 to get a representative lap
            params = {"session_key": session_key, "driver_number": 1}
            
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            if not data:
                return []
            
            # 1. Basic Extraction & Zero-Point Filtering
            # OpenF1 sometimes returns (0,0) for invalid GPS locks which causes horizontal lines
            points = []
            for item in data:
                x, y = item.get("x"), item.get("y")
                if x is not None and y is not None and (abs(x) > 0.1 or abs(y) > 0.1):
                    points.append({"x": x, "y": y})
            
            if len(points) < 50:
                return []

            # 2. Outlier Removal (Simple Z-Score approximation)
            # Find the center and remove extreme jumps that usually represent data errors
            xs = [p["x"] for p in points]
            ys = [p["y"] for p in points]
            avg_x = sum(xs) / len(xs)
            avg_y = sum(ys) / len(ys)
            
            # Filter points too far from the average (simple way to kill major outliers)
            # F1 tracks are usually within 5000-10000 units in OpenF1 coords
            filtered_points = [
                p for p in points 
                if abs(p["x"] - avg_x) < 20000 and abs(p["y"] - avg_y) < 20000
            ]

            if len(filtered_points) < 50:
                filtered_points = points # Fallback if filtering too aggressive

            # 3. Normalization and Downsampling
            xs = [p["x"] for p in filtered_points]
            ys = [p["y"] for p in filtered_points]
            min_x, max_x = min(xs), max(xs)
            min_y, max_y = min(ys), max(ys)
            
            width = max_x - min_x
            height = max_y - min_y
            max_range = max(width, height) or 1
            
            # Downsample to ~250 points for efficient SVG rendering
            target_points = 250
            step = max(1, len(filtered_points) // target_points)
            normalized = []
            
            for i in range(0, len(filtered_points), step):
                p = filtered_points[i]
                # Center the track in the 0-1 coordinate space
                norm_x = (p["x"] - min_x) / max_range
                norm_y = (p["y"] - min_y) / max_range
                
                # Offset to center it if it's wider than tall or vice versa
                x_offset = (1.0 - (width / max_range)) / 2 if width < max_range else 0
                y_offset = (1.0 - (height / max_range)) / 2 if height < max_range else 0

                normalized.append({
                    "x": round(norm_x + x_offset, 4),
                    "y": round(norm_y + y_offset, 4)
                })
            
            return normalized
            
    except Exception as e:
        print(f"[ERR] Error fetching from OpenF1: {e}")
        return []


@router.get("/track/current")
async def get_current_track():
    """Get track for current F1 session (LIVE mode)"""
    # 1. Try Live OpenF1 Data
    try:
        session_info = await fetch_current_session()
        if session_info:
            cache_key = f"current_{session_info.get('session_key')}"
            if cache_key in _track_cache:
                points = _track_cache[cache_key]
            else:
                points = await fetch_track_from_openf1(session_info.get("session_key"))
                if points:
                    _track_cache[cache_key] = points
            
            if points:
                track_data = {
                    "name": session_info.get("meeting_name", "Current Circuit"),
                    "location": session_info.get("country_name", "Unknown"),
                    "circuit_key": session_info.get("circuit_short_name", "").lower().replace(" ", "_"),
                    "points": points,
                    "source": "openf1_live"
                }
                
                # [AUTONOMOUS ENGINE] Track Geometry Learning
                # Automatically save new/updated maps to the DB so they are available for future countdowns
                try:
                    await save_track_geometry(track_data)
                except Exception as e:
                    print(f"[ERR] Failed to save learned track: {e}")
                
                return track_data
    except Exception:
        pass
    
    # 2. Database-driven Fallback (Next Race)
    try:
        next_race = await get_next_race()
        if next_race:
            circuit_key = next_race.get("circuit")
            track_data = await get_track_geometry(circuit_key)
            if track_data:
                return {
                    **track_data,
                    "source": "database_fallback"
                }
    except Exception as e:
        print(f"[ERR] Database fallback failed: {e}")

    return {"error": "No track geometry available. Please seed the database."}


@router.get("/track/{circuit}")
async def get_track(circuit: str, use_openf1: bool = False, session_key: str = "latest"):
    """Return track geometry for a specific circuit"""
    # 1. Prefer database
    try:
        track_data = await get_track_geometry(circuit)
        if track_data:
            if use_openf1:
                points = await fetch_track_from_openf1(session_key)
                if points:
                    track_data["points"] = points
                    track_data["source"] = "openf1_live_override"
            return track_data
    except Exception:
        pass

    # 2. OpenF1 Autogen
    points = await fetch_track_from_openf1(session_key)
    if points:
        return {
            "name": circuit.replace("_", " ").title(),
            "location": "Dynamic",
            "points": points,
            "circuit_key": circuit,
            "source": "openf1_autogen"
        }
    
    return {"error": f"Track geometry not found for: {circuit}"}
