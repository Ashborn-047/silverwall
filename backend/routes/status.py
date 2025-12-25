"""
SilverWall REST API - Race Status & Leaderboard
Provides race countdown, status, and leaderboard endpoints driven by Supabase & OpenF1
"""

from fastapi import APIRouter
from datetime import datetime, timezone, timedelta
import httpx
from database import get_next_race, supabase, get_current_season

router = APIRouter()

OPENF1_API = "https://api.openf1.org/v1"

async def fetch_live_session():
    """Check if there's an active session on OpenF1"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{OPENF1_API}/sessions", params={"session_key": "latest"})
            if response.status_code == 200:
                data = response.json()
                if data:
                    session = data[0]
                    date_end = session.get("date_end")
                    if date_end is None:
                        return session
                    
                    # Check if session ended recently (within last 30 minutes)
                    try:
                        end_time = datetime.fromisoformat(date_end.replace('Z', '+00:00'))
                        now = datetime.now(timezone.utc)
                        if (now - end_time).total_seconds() < 1800:
                            return session
                    except:
                        pass
    except Exception as e:
        print(f"[ERR] Live session fetch failed: {e}")
    return None

@router.get("/status")
async def get_race_status():
    """
    Returns current race status:
    - "live": Race/session is active on OpenF1
    - "waiting": Countdown to the next race in the DB
    - "off_season": No more races scheduled for the year
    """
    now = datetime.now(timezone.utc)
    
    # 1. Check for live session
    live = await fetch_live_session()
    if live:
        return {
            "status": "live",
            "session_name": live.get("session_name"),
            "meeting_name": live.get("meeting_name"),
            "circuit": live.get("circuit_short_name"),
        }
    
    # 2. Get next scheduled race from DB
    next_race = await get_next_race()
    
    if next_race:
        race_date = datetime.fromisoformat(next_race["race_date"].replace('Z', '+00:00'))
        countdown = int((race_date - now).total_seconds())
        
        # If the race is in the past but status wasn't updated yet, it might still be 'waiting' or 'live'
        # For autonomous flow, we treat it as "waiting" if DB says so.
        return {
            "status": "waiting",
            "meeting": next_race["name"],
            "circuit": next_race["circuit"],
            "circuit_name": next_race.get("circuit_name") or next_race["circuit"].replace("_", " ").title(),
            "country": next_race.get("country"),
            "race_date": next_race["race_date"],
            "countdown_seconds": max(0, countdown),
            "round": next_race["round"]
        }
    
    # 3. No races found -> Off-season
    season_year = await get_current_season()
    return {
        "status": "off_season",
        "message": f"{season_year} Season Finalized",
        "next_season": {
            "year": season_year + 1,
            "message": "Stay tuned for the next season opener!"
        }
    }

@router.get("/leaderboard")
async def get_leaderboard():
    """
    Returns current leaderboard from live session or DB final results
    """
    # 1. Try Live
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            response = await client.get(f"{OPENF1_API}/position", params={"session_key": "latest"})
            if response.status_code == 200:
                data = response.json()
                if data:
                    latest = {}
                    for item in data:
                        driver = item.get("driver_number")
                        if driver not in latest:
                            latest[driver] = item
                    
                    sorted_drivers = sorted(latest.values(), key=lambda x: x.get("position", 99))
                    return {
                        "source": "live",
                        "drivers": [{"position": d.get("position"), "driver_number": d.get("driver_number")} for d in sorted_drivers[:20]]
                    }
    except:
        pass
    
    # 2. Fallback to Last Race Results from DB
    client = supabase()
    last_race = client.table("races").select("id, name").eq("status", "completed").order("race_date", desc=True).limit(1).execute()
    
    if last_race.data:
        race_id = last_race.data[0]["id"]
        results = client.table("race_results").select("*").eq("race_id", race_id).order("position").execute()
        return {
            "source": "database_final",
            "meeting": last_race.data[0]["name"],
            "drivers": results.data if results.data else []
        }

    return {"source": "empty", "drivers": []}
