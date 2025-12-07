"""
SilverWall - Race Results API
Fetches race results from OpenF1 for podium display
"""

from fastapi import APIRouter
from datetime import datetime, timezone
from typing import List, Optional
import httpx

router = APIRouter()

OPENF1_API = "https://api.openf1.org/v1"

# Driver info mapping
DRIVERS = {
    1: {"code": "VER", "name": "Max Verstappen", "team": "Red Bull Racing", "color": "#3671C6"},
    44: {"code": "HAM", "name": "Lewis Hamilton", "team": "Ferrari", "color": "#DC0000"},
    16: {"code": "LEC", "name": "Charles Leclerc", "team": "Ferrari", "color": "#DC0000"},
    55: {"code": "SAI", "name": "Carlos Sainz", "team": "Williams", "color": "#00A0DE"},
    4: {"code": "NOR", "name": "Lando Norris", "team": "McLaren", "color": "#FF8000"},
    81: {"code": "PIA", "name": "Oscar Piastri", "team": "McLaren", "color": "#FF8000"},
    11: {"code": "PER", "name": "Sergio Perez", "team": "Red Bull Racing", "color": "#3671C6"},
    63: {"code": "RUS", "name": "George Russell", "team": "Mercedes", "color": "#00D2BE"},
    14: {"code": "ALO", "name": "Fernando Alonso", "team": "Aston Martin", "color": "#006F62"},
    18: {"code": "STR", "name": "Lance Stroll", "team": "Aston Martin", "color": "#006F62"},
    10: {"code": "GAS", "name": "Pierre Gasly", "team": "Alpine", "color": "#0090FF"},
    31: {"code": "OCO", "name": "Esteban Ocon", "team": "Haas F1", "color": "#B6BABD"},
    23: {"code": "ALB", "name": "Alex Albon", "team": "Williams", "color": "#00A0DE"},
    22: {"code": "TSU", "name": "Yuki Tsunoda", "team": "RB", "color": "#6692FF"},
    27: {"code": "HUL", "name": "Nico Hulkenberg", "team": "Kick Sauber", "color": "#52E252"},
    20: {"code": "MAG", "name": "Kevin Magnussen", "team": "Haas F1", "color": "#B6BABD"},
    77: {"code": "BOT", "name": "Valtteri Bottas", "team": "Kick Sauber", "color": "#52E252"},
    24: {"code": "ZHO", "name": "Zhou Guanyu", "team": "Kick Sauber", "color": "#52E252"},
    3: {"code": "RIC", "name": "Daniel Ricciardo", "team": "RB", "color": "#6692FF"},
    2: {"code": "SAR", "name": "Logan Sargeant", "team": "Williams", "color": "#00A0DE"},
    87: {"code": "LAW", "name": "Liam Lawson", "team": "RB", "color": "#6692FF"},
    43: {"code": "COL", "name": "Franco Colapinto", "team": "Williams", "color": "#00A0DE"},
}


async def fetch_race_results_from_openf1(session_key: str = "latest"):
    """Fetch race results from OpenF1 API - ONLY for actual race sessions"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # First check if the latest session is actually a RACE (not qualifying, FP, etc.)
            session_resp = await client.get(
                f"{OPENF1_API}/sessions",
                params={"session_key": session_key}
            )
            if session_resp.status_code == 200:
                sessions = session_resp.json()
                if sessions:
                    session = sessions[0]
                    session_type = session.get("session_type", "").lower()
                    session_name = session.get("session_name", "").lower()
                    
                    # Only show results for actual race sessions
                    if "race" not in session_type and "race" not in session_name:
                        print(f"⚠️ Latest session is {session.get('session_name')}, not Race - skipping results")
                        return []
                    
                    # Check if race has ended (has date_end)
                    if session.get("date_end") is None:
                        print(f"🏎️ Race session is LIVE - no final results yet")
                        return []
            
            # Get final positions for race
            response = await client.get(
                f"{OPENF1_API}/position",
                params={"session_key": session_key}
            )
            if response.status_code == 200:
                data = response.json()
                if data:
                    # Get latest position for each driver
                    latest = {}
                    for entry in data:
                        driver_num = entry.get("driver_number")
                        if driver_num and (driver_num not in latest or entry.get("date", "") > latest[driver_num].get("date", "")):
                            latest[driver_num] = entry
                    
                    # Sort by position
                    sorted_results = sorted(latest.values(), key=lambda x: x.get("position", 999))
                    return sorted_results
    except Exception as e:
        print(f"Error fetching results: {e}")
    return []


@router.get("/results")
async def get_race_results(session_key: str = "latest"):
    """
    Get race results for podium and standings display.
    Returns top 3 for podium + full results.
    """
    # SIMULATION: Check if race has started yet (Abu Dhabi 2025)
    # 18:30 IST = 13:00 UTC
    RACE_START = datetime(2025, 12, 7, 13, 0, tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    
    if now < RACE_START:
        # Race hasn't started -> Show countdown
        return {
            "source": "waiting",
            "status": "waiting",
            "race": "Abu Dhabi Grand Prix 2025",
            "message": "Race hasn't started yet. Results will appear after the race.",
            "podium": None,
            "standings": None,
        }

    results_data = await fetch_race_results_from_openf1(session_key)
    
    if not results_data:
        # No results yet - race hasn't finished
        return {
            "source": "waiting",
            "status": "waiting",
            "race": "Abu Dhabi Grand Prix 2025",
            "message": "Race hasn't started yet. Results will appear after the race.",
            "podium": None,
            "standings": None,
        }
    
    results_data = await fetch_race_results_from_openf1(session_key)
    
    # Fallback to MOCK data if OpenF1 is empty/restricted (e.g. during live session without key)
    if not results_data and now >= RACE_START:
        print("⚠️ OpenF1 restricted or empty - using MOCK LIVE RESULTS")
        results_data = [
            {"driver_number": 4, "position": 1},  # NOR
            {"driver_number": 1, "position": 2},  # VER
            {"driver_number": 81, "position": 3}, # PIA
            {"driver_number": 63, "position": 4}, # RUS
            {"driver_number": 16, "position": 5}, # LEC
            {"driver_number": 44, "position": 6}, # HAM
            {"driver_number": 12, "position": 7}, # ANT (using 12 for Antonelli mock)
            {"driver_number": 55, "position": 8}, # SAI
            {"driver_number": 23, "position": 9}, # ALB
            {"driver_number": 22, "position": 10}, # TSU
        ]
    
    if not results_data:
        # No results yet - race hasn't finished
        return {
            "source": "waiting",
            "status": "waiting",
            "race": "Abu Dhabi Grand Prix 2025",
            "message": "Race hasn't started yet. Results will appear after the race.",
            "podium": None,
            "standings": None,
        }
    
    # Format live results
    results = []
    for i, entry in enumerate(results_data[:20]):
        driver_num = entry.get("driver_number")
        # Handle Antonelli special case or standard mapping
        if driver_num == 12:
            driver_info = {"code": "ANT", "name": "Kimi Antonelli", "team": "Mercedes", "color": "#00D2BE"}
        else:
            driver_info = DRIVERS.get(driver_num, {"code": f"#{driver_num}", "name": "Unknown", "team": "Unknown", "color": "#555"})
        
        result = {
            "position": entry.get("position", i + 1),
            "code": driver_info["code"],
            "name": driver_info["name"],
            "team": driver_info["team"],
            "color": driver_info["color"],
        }
        
        if i == 0:
            result["time"] = "Interval"  # Leader
        else:
            # Simulated gaps for mock data
            gap_base = i * 2.5
            result["gap"] = f"+{gap_base:.3f}s"
        
        results.append(result)
    
    return {
        "source": "live" if now < datetime(2025, 12, 7, 15, 0, tzinfo=timezone.utc) else "official",
        "race": "Abu Dhabi Grand Prix 2025",
        "podium": results[:3],
        "standings": results,
        "fastest_lap": {"driver": results[0]["code"] if results else "—", "time": "1:24.302"},
    }


@router.get("/results/podium")
async def get_podium():
    """Get just the podium (top 3) for quick display"""
    # Simply reuse the main logic to ensure consistency
    full_results = await get_race_results()
    return {
        "race": full_results.get("race"),
        "podium": full_results.get("podium", []),
        "fastest_lap": full_results.get("fastest_lap"),
    }
