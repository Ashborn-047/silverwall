"""
SilverWall REST API - Track Geometry
Fetches real circuit coordinates from OpenF1 API location data
Supports dynamic circuit detection for live race days
"""

import httpx
from fastapi import APIRouter
import math

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
        print(f"❌ Error fetching current session: {e}")
        return None


async def fetch_track_from_openf1(session_key: str = "latest") -> list:
    """Fetch track coordinates from OpenF1 location data."""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            url = f"{OPENF1_API}/location"
            params = {"session_key": session_key, "driver_number": 1}
            
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            if not data:
                return []
            
            # Fetch more points for higher fidelity (up to 2000)
            points = [{"x": item["x"], "y": item["y"]} for item in data[:2000] if "x" in item and "y" in item]
            
            if not points:
                return []
            
            xs = [p["x"] for p in points]
            ys = [p["y"] for p in points]
            min_x, max_x = min(xs), max(xs)
            min_y, max_y = min(ys), max(ys)
            range_x = max_x - min_x if max_x != min_x else 1
            range_y = max_y - min_y if max_y != min_y else 1
            
            # To prevent squashing, we need to maintain the aspect ratio.
            # We'll normalize both X and Y by the SAME larger range.
            max_range = max(range_x, range_y)
            
            # Use a step that gives us around 200 points for the final path
            # (balanced for performance and smoothness)
            step = max(1, len(points) // 200)
            normalized = []
            for i in range(0, len(points), step):
                p = points[i]
                normalized.append({
                    "x": round((p["x"] - min_x) / max_range, 4),
                    "y": round((p["y"] - min_y) / max_range, 4)
                })
            
            return normalized
            
    except Exception as e:
        print(f"❌ Error fetching from OpenF1: {e}")
        return []


def generate_curve(start, end, control, num_points=8):
    """Generate points along a quadratic bezier curve"""
    points = []
    for i in range(num_points + 1):
        t = i / num_points
        # Quadratic bezier formula
        x = (1-t)**2 * start[0] + 2*(1-t)*t * control[0] + t**2 * end[0]
        y = (1-t)**2 * start[1] + 2*(1-t)*t * control[1] + t**2 * end[1]
        points.append({"x": round(x, 4), "y": round(y, 4)})
    return points[:-1]  # Exclude last point to avoid duplicates


def generate_arc(cx, cy, radius, start_angle, end_angle, num_points=10):
    """Generate points along a circular arc"""
    points = []
    angle_step = (end_angle - start_angle) / num_points
    for i in range(num_points + 1):
        angle = start_angle + i * angle_step
        x = cx + radius * math.cos(math.radians(angle))
        y = cy + radius * math.sin(math.radians(angle))
        points.append({"x": round(x, 4), "y": round(y, 4)})
    return points[:-1]


# Yas Marina Circuit - High-detail coordinates with smooth curves
# Traced from official F1 track map with ~80 points for smooth rendering
YAS_MARINA_POINTS = [
    # === START/FINISH STRAIGHT (right side) ===
    {"x": 0.92, "y": 0.52},
    {"x": 0.90, "y": 0.48},
    {"x": 0.88, "y": 0.44},
    
    # === TURN 1-2-3 COMPLEX (braking zone, chicane) ===
    {"x": 0.86, "y": 0.40},
    {"x": 0.84, "y": 0.36},
    {"x": 0.81, "y": 0.33},
    {"x": 0.78, "y": 0.30},
    {"x": 0.75, "y": 0.28},
    {"x": 0.72, "y": 0.27},
    {"x": 0.69, "y": 0.26},
    {"x": 0.66, "y": 0.26},
    
    # === TURN 4-5 (left-right) ===
    {"x": 0.62, "y": 0.27},
    {"x": 0.58, "y": 0.28},
    {"x": 0.54, "y": 0.30},
    {"x": 0.50, "y": 0.32},
    
    # === TURN 6-7 (approaching hotel section) ===
    {"x": 0.46, "y": 0.34},
    {"x": 0.42, "y": 0.37},
    {"x": 0.38, "y": 0.40},
    
    # === HOTEL SECTION TURNS 8-9 (the distinctive tight hairpin) ===
    {"x": 0.34, "y": 0.42},
    {"x": 0.30, "y": 0.43},
    {"x": 0.26, "y": 0.42},
    {"x": 0.22, "y": 0.40},
    {"x": 0.18, "y": 0.37},
    {"x": 0.15, "y": 0.34},
    {"x": 0.12, "y": 0.31},
    {"x": 0.10, "y": 0.28},
    # Hairpin apex
    {"x": 0.08, "y": 0.26},
    {"x": 0.07, "y": 0.28},
    {"x": 0.07, "y": 0.31},
    {"x": 0.08, "y": 0.34},
    {"x": 0.10, "y": 0.37},
    
    # === TURN 10-11 (exiting hotel, going south) ===
    {"x": 0.12, "y": 0.41},
    {"x": 0.14, "y": 0.45},
    {"x": 0.16, "y": 0.49},
    {"x": 0.18, "y": 0.53},
    {"x": 0.20, "y": 0.57},
    
    # === LONG BACK STRAIGHT (going right/east) ===
    {"x": 0.23, "y": 0.60},
    {"x": 0.28, "y": 0.63},
    {"x": 0.33, "y": 0.65},
    {"x": 0.38, "y": 0.67},
    {"x": 0.43, "y": 0.68},
    {"x": 0.48, "y": 0.69},
    {"x": 0.53, "y": 0.70},
    {"x": 0.58, "y": 0.70},
    
    # === TURN 12-13-14 (marina section, sweeping right) ===
    {"x": 0.62, "y": 0.71},
    {"x": 0.66, "y": 0.72},
    {"x": 0.70, "y": 0.72},
    {"x": 0.74, "y": 0.71},
    {"x": 0.77, "y": 0.70},
    {"x": 0.80, "y": 0.68},
    {"x": 0.82, "y": 0.66},
    
    # === TURN 15-16-17-18-19 (final complex) ===
    {"x": 0.84, "y": 0.64},
    {"x": 0.86, "y": 0.62},
    {"x": 0.88, "y": 0.60},
    {"x": 0.89, "y": 0.58},
    {"x": 0.90, "y": 0.56},
    {"x": 0.91, "y": 0.54},
    
    # === BACK TO START/FINISH ===
    {"x": 0.92, "y": 0.52},
]

CIRCUITS = {
    "abu_dhabi": {
        "name": "Yas Marina Circuit",
        "location": "Abu Dhabi, UAE",
        "points": YAS_MARINA_POINTS,
        "drs_zones": [
            {"start": 0.0, "end": 0.10},
            {"start": 0.50, "end": 0.70},
        ],
    },
}


@router.get("/track/current")
async def get_current_track():
    """Get track for current F1 session (LIVE mode)"""
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
            return {
                "name": session_info.get("meeting_name", "Current Circuit"),
                "location": session_info.get("country_name", "Unknown"),
                "circuit_key": session_info.get("circuit_short_name", "").lower().replace(" ", "_"),
                "session_name": session_info.get("session_name"),
                "points": points,
                "source": "openf1_live"
            }
    
    return {**CIRCUITS["abu_dhabi"], "circuit_key": "abu_dhabi", "source": "fallback"}


@router.get("/track/{circuit}")
async def get_track(circuit: str, use_openf1: bool = False, session_key: str = "latest"):
    """Return track geometry for a specific circuit (DEMO mode)"""
    if circuit not in CIRCUITS:
        return {"error": f"Unknown circuit: {circuit}", "available": list(CIRCUITS.keys())}
    
    track_data = CIRCUITS[circuit].copy()
    
    if use_openf1:
        cache_key = f"{circuit}_{session_key}"
        if cache_key in _track_cache:
            points = _track_cache[cache_key]
        else:
            points = await fetch_track_from_openf1(session_key)
            if points:
                _track_cache[cache_key] = points
        
        if points:
            track_data["points"] = points
            track_data["source"] = "openf1"
    
    return track_data


def get_track_points():
    """Get current track points for WebSocket car positioning"""
    return YAS_MARINA_POINTS
