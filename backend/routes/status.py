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
# Abu Dhabi is UTC+4, so local times convert as: Local - 4 = UTC
# Race is 17:00 local = 13:00 UTC = 18:30 IST
ABU_DHABI_SCHEDULE = {
    "fp1": datetime(2025, 12, 5, 6, 30, tzinfo=timezone.utc),     # 10:30 AM local
    "fp2": datetime(2025, 12, 5, 10, 0, tzinfo=timezone.utc),    # 2:00 PM local
    "fp3": datetime(2025, 12, 6, 8, 30, tzinfo=timezone.utc),    # 12:30 PM local
    "qualifying": datetime(2025, 12, 6, 12, 0, tzinfo=timezone.utc),  # 4:00 PM local
    "race": datetime(2025, 12, 7, 13, 0, tzinfo=timezone.utc),   # 5:00 PM local = 6:30 PM IST
}

# 2026 Season - First Race: Australian GP (Melbourne)
NEXT_SEASON = {
    "year": 2026,
    "first_race": "Australian Grand Prix",
    "location": "Melbourne",
    "country": "Australia",
    "circuit": "Albert Park",
    "circuit_length_km": 5.278,
    "laps": 58,
    # Official date: March 15, 2026
    "race_date": datetime(2026, 3, 15, 5, 0, tzinfo=timezone.utc),  # Approx 3 PM local Melbourne time
}


async def fetch_live_session():
    """Check if there's an active session on OpenF1"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Get the latest session
            response = await client.get(f"{OPENF1_API}/sessions", params={"session_key": "latest"})
            if response.status_code == 200:
                data = response.json()
                if data:
                    session = data[0]
                    # Check if session is currently live:
                    # - date_end is None (session hasn't ended)
                    # - OR session started less than 3 hours ago (as fallback)
                    date_end = session.get("date_end")
                    date_start = session.get("date_start")
                    
                    if date_end is None:
                        # Session is live - no end time yet
                        print(f"OK: LIVE SESSION DETECTED: {session.get('session_name')} at {session.get('circuit_short_name')}")
                        return session
                    
                    # Check if session ended recently (within last 30 minutes) - show as live
                    if date_end:
                        from datetime import datetime
                        try:
                            end_time = datetime.fromisoformat(date_end.replace('Z', '+00:00'))
                            now = datetime.now(timezone.utc)
                            if (now - end_time).total_seconds() < 1800:  # 30 minutes
                                print(f"WAIT: RECENT SESSION: {session.get('session_name')} ended {int((now - end_time).total_seconds() / 60)} mins ago")
                                return session
                        except:
                            pass
                    
                    print(f"DONE: Session ended: {session.get('session_name')}")
    except Exception as e:
        print(f"ERR: Error fetching live session: {e}")
    return None


def get_next_session():
    """Get the next scheduled session"""
    now = datetime.now(timezone.utc)
    # If it's after the 2025 season finale (Dec 7), skip Abu Dhabi schedule
    if now.year == 2025 and now.month == 12 and now.day > 10:
        return None

    for name, time in sorted(ABU_DHABI_SCHEDULE.items(), key=lambda x: x[1]):
        if time > now:
            return {"name": name, "start_time": time.isoformat(), "countdown_seconds": int((time - now).total_seconds())}
    return None


def get_2026_countdown():
    """Get countdown to 2026 season opener"""
    now = datetime.now(timezone.utc)
    race_date = NEXT_SEASON["race_date"]
    countdown_seconds = int((race_date - now).total_seconds())
    
    return {
        "year": NEXT_SEASON["year"],
        "first_race": NEXT_SEASON["first_race"],
        "location": NEXT_SEASON["location"],
        "country": NEXT_SEASON["country"],
        "circuit": NEXT_SEASON["circuit"],
        "circuit_length_km": NEXT_SEASON["circuit_length_km"],
        "laps": NEXT_SEASON["laps"],
        "race_date": race_date.isoformat(),
        "countdown_seconds": countdown_seconds,
    }


@router.get("/status")
async def get_race_status():
    """
    Returns current race status:
    - "live": Race/session is active
    - "waiting": No active session, includes countdown to next
    - "off_season": Season ended, countdown to 2026
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
    
    # Season ended - show 2026 countdown
    return {
        "status": "off_season",
        "message": "2025 F1 Season Complete",
        "next_season": get_2026_countdown(),
    }


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
