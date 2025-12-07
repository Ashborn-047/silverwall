"""
SilverWall - Season Standings API
2025 Championship standings and season race history
"""

from fastapi import APIRouter
from typing import List, Dict

router = APIRouter()

# 2025 Driver Championship Standings (before Abu Dhabi - Round 24)
# THREE-WAY TITLE FIGHT! Norris leads by 12 points, Piastri 4 behind Verstappen
DRIVER_STANDINGS = [
    {"position": 1, "code": "NOR", "name": "Lando Norris", "team": "McLaren", "points": 408, "color": "#FF8000"},
    {"position": 2, "code": "VER", "name": "Max Verstappen", "team": "Red Bull Racing", "points": 396, "color": "#3671C6"},
    {"position": 3, "code": "PIA", "name": "Oscar Piastri", "team": "McLaren", "points": 392, "color": "#FF8000"},
    {"position": 4, "code": "RUS", "name": "George Russell", "team": "Mercedes", "points": 309, "color": "#00D2BE"},
    {"position": 5, "code": "LEC", "name": "Charles Leclerc", "team": "Ferrari", "points": 230, "color": "#DC0000"},
    {"position": 6, "code": "HAM", "name": "Lewis Hamilton", "team": "Ferrari", "points": 152, "color": "#DC0000"},
    {"position": 7, "code": "ANT", "name": "Kimi Antonelli", "team": "Mercedes", "points": 150, "color": "#00D2BE"},
    {"position": 8, "code": "ALB", "name": "Alex Albon", "team": "Williams", "points": 73, "color": "#00A0DE"},
    {"position": 9, "code": "SAI", "name": "Carlos Sainz", "team": "Williams", "points": 64, "color": "#00A0DE"},
    {"position": 10, "code": "HAD", "name": "Isack Hadjar", "team": "RB", "points": 51, "color": "#6692FF"},
    {"position": 11, "code": "TSU", "name": "Yuki Tsunoda", "team": "Red Bull Racing", "points": 35, "color": "#3671C6"},
    {"position": 12, "code": "GAS", "name": "Pierre Gasly", "team": "Alpine", "points": 30, "color": "#0090FF"},
    {"position": 13, "code": "HUL", "name": "Nico Hulkenberg", "team": "Kick Sauber", "points": 22, "color": "#52E252"},
    {"position": 14, "code": "DOO", "name": "Jack Doohan", "team": "Alpine", "points": 16, "color": "#0090FF"},
    {"position": 15, "code": "STR", "name": "Lance Stroll", "team": "Aston Martin", "points": 14, "color": "#006F62"},
    {"position": 16, "code": "ALO", "name": "Fernando Alonso", "team": "Aston Martin", "points": 12, "color": "#006F62"},
    {"position": 17, "code": "BEA", "name": "Oliver Bearman", "team": "Haas F1", "points": 8, "color": "#B6BABD"},
    {"position": 18, "code": "OCO", "name": "Esteban Ocon", "team": "Haas F1", "points": 6, "color": "#B6BABD"},
    {"position": 19, "code": "BOT", "name": "Valtteri Bottas", "team": "Kick Sauber", "points": 4, "color": "#52E252"},
    {"position": 20, "code": "LAW", "name": "Liam Lawson", "team": "RB", "points": 2, "color": "#6692FF"},
]

# 2025 Constructor Championship Standings (before Abu Dhabi)
# McLaren already CHAMPIONS! (won at Singapore)
CONSTRUCTOR_STANDINGS = [
    {"position": 1, "team": "McLaren", "points": 800, "color": "#FF8000", "champion": True},
    {"position": 2, "team": "Mercedes", "points": 459, "color": "#00D2BE"},
    {"position": 3, "team": "Red Bull Racing", "points": 441, "color": "#3671C6"},
    {"position": 4, "team": "Ferrari", "points": 382, "color": "#DC0000"},
    {"position": 5, "team": "Williams", "points": 137, "color": "#00A0DE"},
    {"position": 6, "team": "RB", "points": 88, "color": "#6692FF"},
    {"position": 7, "team": "Alpine", "points": 46, "color": "#0090FF"},
    {"position": 8, "team": "Aston Martin", "points": 26, "color": "#006F62"},
    {"position": 9, "team": "Kick Sauber", "points": 26, "color": "#52E252"},
    {"position": 10, "team": "Haas F1", "points": 14, "color": "#B6BABD"},
]

# 2025 Season Race Results - ACCURATE PODIUMS (all 23 races before Abu Dhabi)
SEASON_RACES = [
    {"round": 1, "name": "Australian Grand Prix", "circuit": "Albert Park", "date": "2025-03-16",
     "podium": [{"pos": 1, "code": "NOR", "name": "Lando Norris"}, {"pos": 2, "code": "VER", "name": "Max Verstappen"}, {"pos": 3, "code": "RUS", "name": "George Russell"}]},
    {"round": 2, "name": "Chinese Grand Prix", "circuit": "Shanghai", "date": "2025-03-23",
     "podium": [{"pos": 1, "code": "PIA", "name": "Oscar Piastri"}, {"pos": 2, "code": "NOR", "name": "Lando Norris"}, {"pos": 3, "code": "RUS", "name": "George Russell"}]},
    {"round": 3, "name": "Japanese Grand Prix", "circuit": "Suzuka", "date": "2025-04-06",
     "podium": [{"pos": 1, "code": "VER", "name": "Max Verstappen"}, {"pos": 2, "code": "NOR", "name": "Lando Norris"}, {"pos": 3, "code": "PIA", "name": "Oscar Piastri"}]},
    {"round": 4, "name": "Bahrain Grand Prix", "circuit": "Bahrain International Circuit", "date": "2025-04-13",
     "podium": [{"pos": 1, "code": "PIA", "name": "Oscar Piastri"}, {"pos": 2, "code": "RUS", "name": "George Russell"}, {"pos": 3, "code": "NOR", "name": "Lando Norris"}]},
    {"round": 5, "name": "Saudi Arabian Grand Prix", "circuit": "Jeddah Corniche Circuit", "date": "2025-04-20",
     "podium": [{"pos": 1, "code": "PIA", "name": "Oscar Piastri"}, {"pos": 2, "code": "VER", "name": "Max Verstappen"}, {"pos": 3, "code": "LEC", "name": "Charles Leclerc"}]},
    {"round": 6, "name": "Miami Grand Prix", "circuit": "Miami International Autodrome", "date": "2025-05-04",
     "podium": [{"pos": 1, "code": "PIA", "name": "Oscar Piastri"}, {"pos": 2, "code": "NOR", "name": "Lando Norris"}, {"pos": 3, "code": "RUS", "name": "George Russell"}]},
    {"round": 7, "name": "Emilia Romagna Grand Prix", "circuit": "Imola", "date": "2025-05-18",
     "podium": [{"pos": 1, "code": "VER", "name": "Max Verstappen"}, {"pos": 2, "code": "NOR", "name": "Lando Norris"}, {"pos": 3, "code": "PIA", "name": "Oscar Piastri"}]},
    {"round": 8, "name": "Monaco Grand Prix", "circuit": "Monaco", "date": "2025-05-25",
     "podium": [{"pos": 1, "code": "NOR", "name": "Lando Norris"}, {"pos": 2, "code": "LEC", "name": "Charles Leclerc"}, {"pos": 3, "code": "PIA", "name": "Oscar Piastri"}]},
    {"round": 9, "name": "Spanish Grand Prix", "circuit": "Barcelona", "date": "2025-06-01",
     "podium": [{"pos": 1, "code": "PIA", "name": "Oscar Piastri"}, {"pos": 2, "code": "NOR", "name": "Lando Norris"}, {"pos": 3, "code": "LEC", "name": "Charles Leclerc"}]},
    {"round": 10, "name": "Canadian Grand Prix", "circuit": "Montreal", "date": "2025-06-15",
     "podium": [{"pos": 1, "code": "RUS", "name": "George Russell"}, {"pos": 2, "code": "VER", "name": "Max Verstappen"}, {"pos": 3, "code": "ANT", "name": "Kimi Antonelli"}]},
    {"round": 11, "name": "Austrian Grand Prix", "circuit": "Red Bull Ring", "date": "2025-06-29",
     "podium": [{"pos": 1, "code": "NOR", "name": "Lando Norris"}, {"pos": 2, "code": "PIA", "name": "Oscar Piastri"}, {"pos": 3, "code": "LEC", "name": "Charles Leclerc"}]},
    {"round": 12, "name": "British Grand Prix", "circuit": "Silverstone", "date": "2025-07-06",
     "podium": [{"pos": 1, "code": "NOR", "name": "Lando Norris"}, {"pos": 2, "code": "PIA", "name": "Oscar Piastri"}, {"pos": 3, "code": "HUL", "name": "Nico Hulkenberg"}]},
    {"round": 13, "name": "Belgian Grand Prix", "circuit": "Spa-Francorchamps", "date": "2025-07-27",
     "podium": [{"pos": 1, "code": "PIA", "name": "Oscar Piastri"}, {"pos": 2, "code": "NOR", "name": "Lando Norris"}, {"pos": 3, "code": "LEC", "name": "Charles Leclerc"}]},
    {"round": 14, "name": "Hungarian Grand Prix", "circuit": "Hungaroring", "date": "2025-08-03",
     "podium": [{"pos": 1, "code": "NOR", "name": "Lando Norris"}, {"pos": 2, "code": "PIA", "name": "Oscar Piastri"}, {"pos": 3, "code": "RUS", "name": "George Russell"}]},
    {"round": 15, "name": "Dutch Grand Prix", "circuit": "Zandvoort", "date": "2025-08-31",
     "podium": [{"pos": 1, "code": "PIA", "name": "Oscar Piastri"}, {"pos": 2, "code": "VER", "name": "Max Verstappen"}, {"pos": 3, "code": "HAD", "name": "Isack Hadjar"}]},
    {"round": 16, "name": "Italian Grand Prix", "circuit": "Monza", "date": "2025-09-07",
     "podium": [{"pos": 1, "code": "VER", "name": "Max Verstappen"}, {"pos": 2, "code": "NOR", "name": "Lando Norris"}, {"pos": 3, "code": "PIA", "name": "Oscar Piastri"}]},
    {"round": 17, "name": "Azerbaijan Grand Prix", "circuit": "Baku", "date": "2025-09-21",
     "podium": [{"pos": 1, "code": "VER", "name": "Max Verstappen"}, {"pos": 2, "code": "RUS", "name": "George Russell"}, {"pos": 3, "code": "SAI", "name": "Carlos Sainz"}]},
    {"round": 18, "name": "Singapore Grand Prix", "circuit": "Marina Bay", "date": "2025-10-05",
     "podium": [{"pos": 1, "code": "RUS", "name": "George Russell"}, {"pos": 2, "code": "VER", "name": "Max Verstappen"}, {"pos": 3, "code": "NOR", "name": "Lando Norris"}]},
    {"round": 19, "name": "United States Grand Prix", "circuit": "COTA", "date": "2025-10-19",
     "podium": [{"pos": 1, "code": "VER", "name": "Max Verstappen"}, {"pos": 2, "code": "NOR", "name": "Lando Norris"}, {"pos": 3, "code": "LEC", "name": "Charles Leclerc"}]},
    {"round": 20, "name": "Mexico City Grand Prix", "circuit": "Autodromo Hermanos Rodriguez", "date": "2025-10-26",
     "podium": [{"pos": 1, "code": "NOR", "name": "Lando Norris"}, {"pos": 2, "code": "LEC", "name": "Charles Leclerc"}, {"pos": 3, "code": "VER", "name": "Max Verstappen"}]},
    {"round": 21, "name": "São Paulo Grand Prix", "circuit": "Interlagos", "date": "2025-11-09",
     "podium": [{"pos": 1, "code": "NOR", "name": "Lando Norris"}, {"pos": 2, "code": "ANT", "name": "Kimi Antonelli"}, {"pos": 3, "code": "VER", "name": "Max Verstappen"}]},
    {"round": 22, "name": "Las Vegas Grand Prix", "circuit": "Las Vegas Strip", "date": "2025-11-22",
     "podium": [{"pos": 1, "code": "VER", "name": "Max Verstappen"}, {"pos": 2, "code": "RUS", "name": "George Russell"}, {"pos": 3, "code": "ANT", "name": "Kimi Antonelli"}]},
    {"round": 23, "name": "Qatar Grand Prix", "circuit": "Lusail", "date": "2025-11-30",
     "podium": [{"pos": 1, "code": "VER", "name": "Max Verstappen"}, {"pos": 2, "code": "PIA", "name": "Oscar Piastri"}, {"pos": 3, "code": "SAI", "name": "Carlos Sainz"}]},
    {"round": 24, "name": "Abu Dhabi Grand Prix", "circuit": "Yas Marina Circuit", "date": "2025-12-07",
     "podium": None, "status": "upcoming"},  # TODAY'S RACE - TITLE DECIDER!
]


@router.get("/standings/drivers")
async def get_driver_standings():
    """Get current driver championship standings"""
    return {
        "season": 2025,
        "round": 23,
        "total_rounds": 24,
        "title_fight": "THREE-WAY BATTLE: Norris leads by 12pts, Piastri 4pts behind Verstappen!",
        "standings": DRIVER_STANDINGS[:20],
        "leader": DRIVER_STANDINGS[0] if DRIVER_STANDINGS else None,
    }


@router.get("/standings/constructors")
async def get_constructor_standings():
    """Get current constructor championship standings"""
    return {
        "season": 2025,
        "round": 23,
        "total_rounds": 24,
        "standings": CONSTRUCTOR_STANDINGS,
        "champion": {"team": "McLaren", "message": "2025 CONSTRUCTORS' CHAMPIONS! 🏆"},
    }


@router.get("/season/races")
async def get_season_races():
    """Get all races in the current season with podium results"""
    from datetime import datetime, timezone
    
    # Dynamically calculate Abu Dhabi race status
    RACE_START = datetime(2025, 12, 7, 13, 0, tzinfo=timezone.utc)  # 18:30 IST = 13:00 UTC
    RACE_END = datetime(2025, 12, 7, 15, 0, tzinfo=timezone.utc)    # ~2 hours for race
    
    now = datetime.now(timezone.utc)
    races = SEASON_RACES.copy()
    
    # Update Abu Dhabi (Round 24) status dynamically
    for race in races:
        if race["round"] == 24:
            if race.get("podium") is not None:
                # Race finished - has results
                race["status"] = None
            elif now < RACE_START:
                race["status"] = "upcoming"
            elif now < RACE_END:
                race["status"] = "live"
            else:
                # Race should be over, waiting for results
                race["status"] = "finished"
    
    return {
        "season": 2025,
        "total_races": 24,
        "completed": 23,
        "races": races,
    }


@router.get("/season/race/{round_num}")
async def get_race_by_round(round_num: int):
    """Get specific race details by round number"""
    for race in SEASON_RACES:
        if race["round"] == round_num:
            return race
    return {"error": f"Race round {round_num} not found"}
