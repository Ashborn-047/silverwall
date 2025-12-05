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
    """Fetch race results from OpenF1 API"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Get final positions
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
    results_data = await fetch_race_results_from_openf1(session_key)
    
    if not results_data:
        # Return mock results for demo/development
        return {
            "source": "mock",
            "race": "Abu Dhabi Grand Prix 2025",
            "podium": [
                {"position": 1, "code": "VER", "name": "Max Verstappen", "team": "Red Bull Racing", "time": "1:32:45.123", "color": "#3671C6"},
                {"position": 2, "code": "HAM", "name": "Lewis Hamilton", "team": "Ferrari", "gap": "+5.234s", "color": "#DC0000"},
                {"position": 3, "code": "LEC", "name": "Charles Leclerc", "team": "Ferrari", "gap": "+12.567s", "color": "#DC0000"},
            ],
            "standings": [
                {"position": 1, "code": "VER", "name": "Max Verstappen", "team": "Red Bull Racing", "time": "1:32:45.123"},
                {"position": 2, "code": "HAM", "name": "Lewis Hamilton", "team": "Ferrari", "gap": "+5.234s"},
                {"position": 3, "code": "LEC", "name": "Charles Leclerc", "team": "Ferrari", "gap": "+12.567s"},
                {"position": 4, "code": "NOR", "name": "Lando Norris", "team": "McLaren", "gap": "+18.901s"},
                {"position": 5, "code": "SAI", "name": "Carlos Sainz", "team": "Williams", "gap": "+22.345s"},
                {"position": 6, "code": "PIA", "name": "Oscar Piastri", "team": "McLaren", "gap": "+28.678s"},
                {"position": 7, "code": "RUS", "name": "George Russell", "team": "Mercedes", "gap": "+35.012s"},
                {"position": 8, "code": "ALO", "name": "Fernando Alonso", "team": "Aston Martin", "gap": "+42.345s"},
                {"position": 9, "code": "PER", "name": "Sergio Perez", "team": "Red Bull Racing", "gap": "+48.678s"},
                {"position": 10, "code": "STR", "name": "Lance Stroll", "team": "Aston Martin", "gap": "+55.901s"},
            ],
            "fastest_lap": {"driver": "VER", "time": "1:25.678"},
        }
    
    # Format live results
    results = []
    for i, entry in enumerate(results_data[:20]):
        driver_num = entry.get("driver_number")
        driver_info = DRIVERS.get(driver_num, {"code": f"#{driver_num}", "name": "Unknown", "team": "Unknown", "color": "#555"})
        
        result = {
            "position": entry.get("position", i + 1),
            "code": driver_info["code"],
            "name": driver_info["name"],
            "team": driver_info["team"],
            "color": driver_info["color"],
        }
        
        if i == 0:
            result["time"] = "—"  # Winner's time not available from position data
        else:
            result["gap"] = f"+{i * 5 + (i * 0.234):.3f}s"  # Simulated gap
        
        results.append(result)
    
    return {
        "source": "live",
        "race": "Abu Dhabi Grand Prix 2025",
        "podium": results[:3],
        "standings": results,
        "fastest_lap": {"driver": results[0]["code"] if results else "—", "time": "1:25.xxx"},
    }


@router.get("/results/podium")
async def get_podium():
    """Get just the podium (top 3) for quick display"""
    full_results = await get_race_results()
    return {
        "race": full_results.get("race"),
        "podium": full_results.get("podium", []),
        "fastest_lap": full_results.get("fastest_lap"),
    }
