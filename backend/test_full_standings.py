#!/usr/bin/env python3
"""
Standalone 24-race standings calculation test
(No FastAPI import needed)
"""

# ============================================================================
# F1 POINTS SYSTEM
# ============================================================================
GP_POINTS = {1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2, 10: 1}

# ============================================================================
# DRIVER INFO
# ============================================================================
DRIVERS = {
    "VER": {"name": "Max Verstappen", "team": "Red Bull Racing"},
    "NOR": {"name": "Lando Norris", "team": "McLaren"},
    "PIA": {"name": "Oscar Piastri", "team": "McLaren"},
    "RUS": {"name": "George Russell", "team": "Mercedes"},
    "HAM": {"name": "Lewis Hamilton", "team": "Ferrari"},
    "LEC": {"name": "Charles Leclerc", "team": "Ferrari"},
    "SAI": {"name": "Carlos Sainz", "team": "Williams"},
    "ALB": {"name": "Alex Albon", "team": "Williams"},
    "ANT": {"name": "Kimi Antonelli", "team": "Mercedes"},
    "ALO": {"name": "Fernando Alonso", "team": "Aston Martin"},
    "STR": {"name": "Lance Stroll", "team": "Aston Martin"},
    "GAS": {"name": "Pierre Gasly", "team": "Alpine"},
    "DOO": {"name": "Jack Doohan", "team": "Alpine"},
    "TSU": {"name": "Yuki Tsunoda", "team": "Red Bull Racing"},
    "HAD": {"name": "Isack Hadjar", "team": "RB"},
    "LAW": {"name": "Liam Lawson", "team": "RB"},
    "HUL": {"name": "Nico Hulkenberg", "team": "Kick Sauber"},
    "BOT": {"name": "Valtteri Bottas", "team": "Kick Sauber"},
    "BEA": {"name": "Oliver Bearman", "team": "Haas F1"},
    "OCO": {"name": "Esteban Ocon", "team": "Haas F1"},
}

# ============================================================================
# ALL 24 RACES (P1-P10)
# ============================================================================
SEASON_RACES = [
    {"round": 1, "name": "Australian GP", "results": [
        {"pos": 1, "code": "NOR"}, {"pos": 2, "code": "VER"}, {"pos": 3, "code": "RUS"},
        {"pos": 4, "code": "PIA"}, {"pos": 5, "code": "LEC"}, {"pos": 6, "code": "HAM"},
        {"pos": 7, "code": "ANT"}, {"pos": 8, "code": "ALB"}, {"pos": 9, "code": "SAI"}, {"pos": 10, "code": "ALO"}
    ]},
    {"round": 2, "name": "Chinese GP", "results": [
        {"pos": 1, "code": "PIA"}, {"pos": 2, "code": "NOR"}, {"pos": 3, "code": "RUS"},
        {"pos": 4, "code": "VER"}, {"pos": 5, "code": "LEC"}, {"pos": 6, "code": "ANT"},
        {"pos": 7, "code": "HAM"}, {"pos": 8, "code": "SAI"}, {"pos": 9, "code": "ALB"}, {"pos": 10, "code": "GAS"}
    ]},
    {"round": 3, "name": "Japanese GP", "results": [
        {"pos": 1, "code": "VER"}, {"pos": 2, "code": "NOR"}, {"pos": 3, "code": "PIA"},
        {"pos": 4, "code": "RUS"}, {"pos": 5, "code": "LEC"}, {"pos": 6, "code": "ANT"},
        {"pos": 7, "code": "HAM"}, {"pos": 8, "code": "ALB"}, {"pos": 9, "code": "SAI"}, {"pos": 10, "code": "TSU"}
    ]},
    {"round": 4, "name": "Bahrain GP", "results": [
        {"pos": 1, "code": "PIA"}, {"pos": 2, "code": "RUS"}, {"pos": 3, "code": "NOR"},
        {"pos": 4, "code": "VER"}, {"pos": 5, "code": "LEC"}, {"pos": 6, "code": "ANT"},
        {"pos": 7, "code": "HAM"}, {"pos": 8, "code": "SAI"}, {"pos": 9, "code": "ALB"}, {"pos": 10, "code": "HAD"}
    ]},
    {"round": 5, "name": "Saudi Arabian GP", "results": [
        {"pos": 1, "code": "PIA"}, {"pos": 2, "code": "VER"}, {"pos": 3, "code": "LEC"},
        {"pos": 4, "code": "NOR"}, {"pos": 5, "code": "RUS"}, {"pos": 6, "code": "ANT"},
        {"pos": 7, "code": "HAM"}, {"pos": 8, "code": "SAI"}, {"pos": 9, "code": "ALB"}, {"pos": 10, "code": "GAS"}
    ]},
    {"round": 6, "name": "Miami GP", "results": [
        {"pos": 1, "code": "PIA"}, {"pos": 2, "code": "NOR"}, {"pos": 3, "code": "RUS"},
        {"pos": 4, "code": "VER"}, {"pos": 5, "code": "LEC"}, {"pos": 6, "code": "ANT"},
        {"pos": 7, "code": "HAM"}, {"pos": 8, "code": "SAI"}, {"pos": 9, "code": "ALB"}, {"pos": 10, "code": "HAD"}
    ]},
    {"round": 7, "name": "Emilia Romagna GP", "results": [
        {"pos": 1, "code": "VER"}, {"pos": 2, "code": "NOR"}, {"pos": 3, "code": "PIA"},
        {"pos": 4, "code": "RUS"}, {"pos": 5, "code": "LEC"}, {"pos": 6, "code": "ANT"},
        {"pos": 7, "code": "HAM"}, {"pos": 8, "code": "SAI"}, {"pos": 9, "code": "GAS"}, {"pos": 10, "code": "ALO"}
    ]},
    {"round": 8, "name": "Monaco GP", "results": [
        {"pos": 1, "code": "NOR"}, {"pos": 2, "code": "LEC"}, {"pos": 3, "code": "PIA"},
        {"pos": 4, "code": "VER"}, {"pos": 5, "code": "RUS"}, {"pos": 6, "code": "ANT"},
        {"pos": 7, "code": "HAM"}, {"pos": 8, "code": "SAI"}, {"pos": 9, "code": "ALB"}, {"pos": 10, "code": "GAS"}
    ]},
    {"round": 9, "name": "Spanish GP", "results": [
        {"pos": 1, "code": "PIA"}, {"pos": 2, "code": "NOR"}, {"pos": 3, "code": "LEC"},
        {"pos": 4, "code": "VER"}, {"pos": 5, "code": "RUS"}, {"pos": 6, "code": "ANT"},
        {"pos": 7, "code": "HAM"}, {"pos": 8, "code": "SAI"}, {"pos": 9, "code": "ALB"}, {"pos": 10, "code": "HAD"}
    ]},
    {"round": 10, "name": "Canadian GP", "results": [
        {"pos": 1, "code": "RUS"}, {"pos": 2, "code": "VER"}, {"pos": 3, "code": "ANT"},
        {"pos": 4, "code": "NOR"}, {"pos": 5, "code": "PIA"}, {"pos": 6, "code": "LEC"},
        {"pos": 7, "code": "HAM"}, {"pos": 8, "code": "SAI"}, {"pos": 9, "code": "ALB"}, {"pos": 10, "code": "GAS"}
    ]},
    {"round": 11, "name": "Austrian GP", "results": [
        {"pos": 1, "code": "NOR"}, {"pos": 2, "code": "PIA"}, {"pos": 3, "code": "LEC"},
        {"pos": 4, "code": "VER"}, {"pos": 5, "code": "RUS"}, {"pos": 6, "code": "ANT"},
        {"pos": 7, "code": "HAM"}, {"pos": 8, "code": "SAI"}, {"pos": 9, "code": "ALB"}, {"pos": 10, "code": "HAD"}
    ]},
    {"round": 12, "name": "British GP", "results": [
        {"pos": 1, "code": "NOR"}, {"pos": 2, "code": "PIA"}, {"pos": 3, "code": "HUL"},
        {"pos": 4, "code": "VER"}, {"pos": 5, "code": "RUS"}, {"pos": 6, "code": "LEC"},
        {"pos": 7, "code": "ANT"}, {"pos": 8, "code": "HAM"}, {"pos": 9, "code": "SAI"}, {"pos": 10, "code": "ALB"}
    ]},
    {"round": 13, "name": "Belgian GP", "results": [
        {"pos": 1, "code": "PIA"}, {"pos": 2, "code": "NOR"}, {"pos": 3, "code": "LEC"},
        {"pos": 4, "code": "VER"}, {"pos": 5, "code": "RUS"}, {"pos": 6, "code": "ANT"},
        {"pos": 7, "code": "HAM"}, {"pos": 8, "code": "SAI"}, {"pos": 9, "code": "ALB"}, {"pos": 10, "code": "HAD"}
    ]},
    {"round": 14, "name": "Hungarian GP", "results": [
        {"pos": 1, "code": "NOR"}, {"pos": 2, "code": "PIA"}, {"pos": 3, "code": "RUS"},
        {"pos": 4, "code": "VER"}, {"pos": 5, "code": "LEC"}, {"pos": 6, "code": "ANT"},
        {"pos": 7, "code": "HAM"}, {"pos": 8, "code": "SAI"}, {"pos": 9, "code": "ALB"}, {"pos": 10, "code": "GAS"}
    ]},
    {"round": 15, "name": "Dutch GP", "results": [
        {"pos": 1, "code": "PIA"}, {"pos": 2, "code": "VER"}, {"pos": 3, "code": "HAD"},
        {"pos": 4, "code": "NOR"}, {"pos": 5, "code": "RUS"}, {"pos": 6, "code": "LEC"},
        {"pos": 7, "code": "ANT"}, {"pos": 8, "code": "HAM"}, {"pos": 9, "code": "SAI"}, {"pos": 10, "code": "ALB"}
    ]},
    {"round": 16, "name": "Italian GP", "results": [
        {"pos": 1, "code": "VER"}, {"pos": 2, "code": "NOR"}, {"pos": 3, "code": "PIA"},
        {"pos": 4, "code": "RUS"}, {"pos": 5, "code": "LEC"}, {"pos": 6, "code": "ANT"},
        {"pos": 7, "code": "HAM"}, {"pos": 8, "code": "SAI"}, {"pos": 9, "code": "GAS"}, {"pos": 10, "code": "ALB"}
    ]},
    {"round": 17, "name": "Azerbaijan GP", "results": [
        {"pos": 1, "code": "VER"}, {"pos": 2, "code": "RUS"}, {"pos": 3, "code": "SAI"},
        {"pos": 4, "code": "NOR"}, {"pos": 5, "code": "PIA"}, {"pos": 6, "code": "LEC"},
        {"pos": 7, "code": "ANT"}, {"pos": 8, "code": "HAM"}, {"pos": 9, "code": "ALB"}, {"pos": 10, "code": "HAD"}
    ]},
    {"round": 18, "name": "Singapore GP", "results": [
        {"pos": 1, "code": "RUS"}, {"pos": 2, "code": "VER"}, {"pos": 3, "code": "NOR"},
        {"pos": 4, "code": "PIA"}, {"pos": 5, "code": "LEC"}, {"pos": 6, "code": "ANT"},
        {"pos": 7, "code": "HAM"}, {"pos": 8, "code": "SAI"}, {"pos": 9, "code": "ALB"}, {"pos": 10, "code": "GAS"}
    ]},
    {"round": 19, "name": "United States GP", "results": [
        {"pos": 1, "code": "VER"}, {"pos": 2, "code": "NOR"}, {"pos": 3, "code": "LEC"},
        {"pos": 4, "code": "PIA"}, {"pos": 5, "code": "RUS"}, {"pos": 6, "code": "ANT"},
        {"pos": 7, "code": "HAM"}, {"pos": 8, "code": "SAI"}, {"pos": 9, "code": "ALB"}, {"pos": 10, "code": "HAD"}
    ]},
    {"round": 20, "name": "Mexico City GP", "results": [
        {"pos": 1, "code": "NOR"}, {"pos": 2, "code": "LEC"}, {"pos": 3, "code": "VER"},
        {"pos": 4, "code": "PIA"}, {"pos": 5, "code": "RUS"}, {"pos": 6, "code": "ANT"},
        {"pos": 7, "code": "HAM"}, {"pos": 8, "code": "SAI"}, {"pos": 9, "code": "ALB"}, {"pos": 10, "code": "GAS"}
    ]},
    {"round": 21, "name": "São Paulo GP", "results": [
        {"pos": 1, "code": "NOR"}, {"pos": 2, "code": "ANT"}, {"pos": 3, "code": "VER"},
        {"pos": 4, "code": "PIA"}, {"pos": 5, "code": "RUS"}, {"pos": 6, "code": "LEC"},
        {"pos": 7, "code": "HAM"}, {"pos": 8, "code": "SAI"}, {"pos": 9, "code": "ALB"}, {"pos": 10, "code": "HAD"}
    ]},
    {"round": 22, "name": "Las Vegas GP", "results": [
        {"pos": 1, "code": "VER"}, {"pos": 2, "code": "RUS"}, {"pos": 3, "code": "ANT"},
        {"pos": 4, "code": "NOR"}, {"pos": 5, "code": "PIA"}, {"pos": 6, "code": "LEC"},
        {"pos": 7, "code": "HAM"}, {"pos": 8, "code": "SAI"}, {"pos": 9, "code": "ALB"}, {"pos": 10, "code": "GAS"}
    ]},
    {"round": 23, "name": "Qatar GP", "results": [
        {"pos": 1, "code": "VER"}, {"pos": 2, "code": "PIA"}, {"pos": 3, "code": "SAI"},
        {"pos": 4, "code": "NOR"}, {"pos": 5, "code": "RUS"}, {"pos": 6, "code": "LEC"},
        {"pos": 7, "code": "ANT"}, {"pos": 8, "code": "HAM"}, {"pos": 9, "code": "ALB"}, {"pos": 10, "code": "HAD"}
    ]},
    {"round": 24, "name": "Abu Dhabi GP", "results": [
        {"pos": 1, "code": "VER"}, {"pos": 2, "code": "NOR"}, {"pos": 3, "code": "LEC"},
        {"pos": 4, "code": "PIA"}, {"pos": 5, "code": "RUS"}, {"pos": 6, "code": "HAM"},
        {"pos": 7, "code": "SAI"}, {"pos": 8, "code": "ALO"}, {"pos": 9, "code": "GAS"}, {"pos": 10, "code": "ALB"}
    ]},
]


def calculate_driver_standings(races):
    driver_points = {code: 0 for code in DRIVERS.keys()}
    for race in races:
        for entry in race.get("results", []):
            code = entry.get("code")
            pos = entry.get("pos")
            if code in driver_points and pos in GP_POINTS:
                driver_points[code] += GP_POINTS[pos]
    
    standings = []
    for code, points in sorted(driver_points.items(), key=lambda x: x[1], reverse=True):
        info = DRIVERS.get(code, {})
        standings.append({
            "position": len(standings) + 1,
            "code": code,
            "name": info.get("name", code),
            "team": info.get("team", "Unknown"),
            "points": points,
        })
    return standings


def calculate_constructor_standings(races):
    team_points = {}
    for race in races:
        for entry in race.get("results", []):
            code = entry.get("code")
            pos = entry.get("pos")
            driver_info = DRIVERS.get(code)
            if driver_info and pos in GP_POINTS:
                team = driver_info["team"]
                team_points[team] = team_points.get(team, 0) + GP_POINTS[pos]
    
    standings = []
    for team, points in sorted(team_points.items(), key=lambda x: x[1], reverse=True):
        standings.append({
            "position": len(standings) + 1,
            "team": team,
            "points": points,
        })
    return standings


if __name__ == "__main__":
    print("=" * 60)
    print("2025 DRIVER CHAMPIONSHIP - CALCULATED FROM ALL 24 RACES")
    print("=" * 60)
    
    driver_standings = calculate_driver_standings(SEASON_RACES)
    for d in driver_standings:
        champion = " 🏆 CHAMPION" if d["position"] == 1 else ""
        print(f"  P{d['position']:2} | {d['code']} | {d['points']:3} pts | {d['team']}{champion}")
    
    print()
    print("=" * 60)
    print("2025 CONSTRUCTOR CHAMPIONSHIP - CALCULATED FROM ALL 24 RACES")
    print("=" * 60)
    
    constructor_standings = calculate_constructor_standings(SEASON_RACES)
    for c in constructor_standings:
        champion = " 🏆 CHAMPION" if c["position"] == 1 else ""
        print(f"  P{c['position']:2} | {c['team']:20} | {c['points']:3} pts{champion}")
