import json
import os
import httpx
from fastapi import APIRouter, Request
from database import get_track_geometry, get_next_race, save_track_geometry
from limiter import limiter

router = APIRouter()

# OpenF1 API base URL
OPENF1_API = "https://api.openf1.org/v1"

# Load static track geometry compiled from frontend files
TRACKS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "tracks.json")
try:
    with open(TRACKS_FILE, "r", encoding="utf-8") as f:
        STATIC_TRACKS = json.load(f)
    print(f"[INFO] Successfully loaded {len(STATIC_TRACKS)} static tracks in backend.")
except Exception as e:
    print(f"[ERR] Failed to load static tracks: {e}")
    STATIC_TRACKS = {}


def normalize_key(name: str) -> str:
    if not name:
        return ""
    name = name.lower().strip()
    name = name.replace(" ", "_").replace("-", "_")
    
    # Fuzzy mappings to match filenames in tracks.json
    if "albert_park" in name or "melbourne" in name or "australia" in name:
        return "melbourne"
    if "shanghai" in name or "china" in name:
        return "shanghai"
    if "suzuka" in name or "japan" in name:
        return "suzuka"
    if "sakhir" in name or "bahrain" in name:
        return "bahrain"
    if "jeddah" in name or "saudi" in name:
        return "jeddah"
    if "miami" in name:
        return "miami"
    if "gilles_villeneuve" in name or "montreal" in name or "canada" in name:
        return "montreal"
    if "monaco" in name or "monte_carlo" in name:
        return "monaco"
    if "catalunya" in name or "barcelona" in name or "spain" in name:
        return "catalunya"
    if "silverstone" in name or "united_kingdom" in name or "british" in name:
        return "silverstone"
    if "red_bull" in name or "spielberg" in name or "austria" in name:
        return "red_bull_ring"
    if "hungaroring" in name or "budapest" in name or "hungary" in name:
        return "hungaroring"
    if "spa" in name or "francorchamps" in name or "belgium" in name:
        return "belgium"
    if "monza" in name or "italy" in name:
        return "monza"
    if "baku" in name or "azerbaijan" in name:
        return "baku"
    if "singapore" in name:
        return "singapore"
    if "austin" in name or "united_states" in name or "cota" in name:
        return "austin"
    if "mexico" in name or "hermanos" in name:
        return "mexico_city"
    if "interlagos" in name or "brazil" in name or "sao_paulo" in name:
        return "interlagos"
    if "las_vegas" in name or "vegas" in name:
        return "vegas"
    if "lusail" in name or "qatar" in name:
        return "qatar"
    if "yas_marina" in name or "abu_dhabi" in name or "uae" in name:
        return "yas_marina"
    if "imola" in name or "emilia" in name:
        return "imola"
    if "zandvoort" in name or "netherlands" in name or "dutch" in name:
        return "zandvoort"
        
    return name


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
@limiter.limit("60/minute")
async def get_current_track(request: Request):
    """Get track for current F1 session (LIVE mode)"""
    # 1. Try static JSON mapping based on current session
    try:
        session_info = await fetch_current_session()
        if session_info:
            circuit_short = session_info.get("circuit_short_name") or ""
            meeting = session_info.get("meeting_name") or ""
            country = session_info.get("country_name") or ""
            
            for search_str in [circuit_short, meeting, country]:
                key = normalize_key(search_str)
                if key and key in STATIC_TRACKS:
                    return {
                        **STATIC_TRACKS[key],
                        "source": "static_apex_json_current"
                    }
    except Exception as e:
        print(f"[WARN] Failed static match for current session: {e}")

    # 2. Try Live OpenF1 Data
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
    
    # 3. Database-driven or static Fallback (Next Race)
    try:
        next_race = await get_next_race()
        if next_race:
            circuit_name = next_race.get("circuit") or ""
            meeting_name = next_race.get("name") or ""
            
            for search_str in [circuit_name, meeting_name]:
                key = normalize_key(search_str)
                if key and key in STATIC_TRACKS:
                    return {
                        **STATIC_TRACKS[key],
                        "source": "static_apex_json_next_race"
                    }
            
            circuit_key = circuit_name.lower().replace(" ", "_")
            track_data = await get_track_geometry(circuit_key)
            if track_data:
                return {
                    **track_data,
                    "source": "database_fallback"
                }
    except Exception as e:
        print(f"[ERR] Next race static/db fallback failed: {e}")

    return {"error": "No track geometry available. Please seed the database."}


@router.get("/track/{circuit}")
@limiter.limit("60/minute")
async def get_track(request: Request, circuit: str, use_openf1: bool = False, session_key: str = "latest"):
    """Return track geometry for a specific circuit"""
    circuit_key = normalize_key(circuit)
    
    # 1. Prefer static JSON map if available (unless use_openf1 override is requested)
    if not use_openf1 and circuit_key in STATIC_TRACKS:
        return {
            **STATIC_TRACKS[circuit_key],
            "source": "static_apex_json"
        }
        
    # 2. Prefer database
    try:
        track_data = await get_track_geometry(circuit_key)
        if track_data:
            if use_openf1:
                points = await fetch_track_from_openf1(session_key)
                if points:
                    track_data["points"] = points
                    track_data["source"] = "openf1_live_override"
            return track_data
    except Exception:
        pass

    # 3. OpenF1 Autogen
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
