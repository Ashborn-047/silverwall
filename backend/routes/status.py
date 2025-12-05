"""
SilverWall REST API - Race Status & Leaderboard
Provides race countdown, status, and leaderboard endpoints
"""

from fastapi import APIRouter
from datetime import datetime, timezone
import httpx

router = APIRouter()

OPENF1_API = "https://api.openf1.org/v1"

# Abu Dhabi GP 2025 Schedule (UTC times)
ABU_DHABI_SCHEDULE = {
    "fp1": datetime(2025, 12, 5, 6, 30, tzinfo=timezone.utc),
    "fp2": datetime(2025, 12, 5, 10, 0, tzinfo=timezone.utc),
    "fp3": datetime(2025, 12, 6, 7, 30, tzinfo=timezone.utc),
    "qualifying": datetime(2025, 12, 6, 11, 0, tzinfo=timezone.utc),
    "race": datetime(2025, 12, 7, 9, 0, tzinfo=timezone.utc),
}


async def fetch_live_session():
    """Check if there's an active session on OpenF1"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{OPENF1_API}/sessions", params={"session_key": "latest"})
            if response.status_code == 200:
                data = response.json()
                if data:
                    return data[0]
    except:
        pass
    return None


def get_next_session():
    """Get the next scheduled session"""
    now = datetime.now(timezone.utc)
    for name, time in sorted(ABU_DHABI_SCHEDULE.items(), key=lambda x: x[1]):
        if time > now:
            return {"name": name, "start_time": time.isoformat(), "countdown_seconds": int((time - now).total_seconds())}
    return None


@router.get("/status")
async def get_race_status():
    """
    Returns current race status:
    - "live": Race/session is active
    - "waiting": No active session, includes countdown to next
    - "ended": Season ended
    """
    # Check for live session
    live = await fetch_live_session()
    
    if live:
        return {
            "status": "live",
            "session_name": live.get("session_name"),
            "meeting_name": live.get("meeting_name"),
            "circuit": live.get("circuit_short_name"),
        }
    
    # Get next scheduled session
    next_session = get_next_session()
    if next_session:
        return {
            "status": "waiting",
            "next_session": next_session["name"],
            "start_time": next_session["start_time"],
            "countdown_seconds": next_session["countdown_seconds"],
            "meeting": "Abu Dhabi Grand Prix",
        }
    
    return {"status": "ended", "message": "2024 F1 Season Complete"}


@router.get("/leaderboard")
async def get_leaderboard():
    """
    Returns current leaderboard from live session or mock data
    """
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            # Try to get live position data
            response = await client.get(f"{OPENF1_API}/position", params={"session_key": "latest"})
            if response.status_code == 200:
                data = response.json()
                if data:
                    # Get latest position for each driver
                    latest = {}
                    for item in data:
                        driver = item.get("driver_number")
                        if driver not in latest:
                            latest[driver] = item
                    
                    # Sort by position
                    sorted_drivers = sorted(latest.values(), key=lambda x: x.get("position", 99))
                    return {
                        "source": "live",
                        "drivers": [
                            {
                                "position": d.get("position"),
                                "driver_number": d.get("driver_number"),
                            }
                            for d in sorted_drivers[:20]
                        ]
                    }
    except:
        pass
    
    # Fallback mock leaderboard
    return {
        "source": "mock",
        "drivers": [
            {"position": 1, "code": "HAM", "team": "Mercedes", "gap": "—"},
            {"position": 2, "code": "VER", "team": "Red Bull", "gap": "+0.5s"},
            {"position": 3, "code": "LEC", "team": "Ferrari", "gap": "+1.0s"},
            {"position": 4, "code": "SAI", "team": "Ferrari", "gap": "+1.5s"},
            {"position": 5, "code": "NOR", "team": "McLaren", "gap": "+2.0s"},
            {"position": 6, "code": "PER", "team": "Red Bull", "gap": "+2.5s"},
            {"position": 7, "code": "RUS", "team": "Mercedes", "gap": "+3.0s"},
            {"position": 8, "code": "ALO", "team": "Aston Martin", "gap": "+3.5s"},
        ]
    }
