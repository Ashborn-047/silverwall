#!/usr/bin/env python3
"""Test standings calculation"""

GP_POINTS = {1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2, 10: 1}

DRIVERS = {
    "VER": "Red Bull Racing", "NOR": "McLaren", "PIA": "McLaren", 
    "RUS": "Mercedes", "HAM": "Ferrari", "LEC": "Ferrari",
    "SAI": "Williams", "ALB": "Williams", "ANT": "Mercedes",
    "ALO": "Aston Martin", "STR": "Aston Martin", "GAS": "Alpine",
    "DOO": "Alpine", "TSU": "Red Bull Racing", "HAD": "RB",
    "LAW": "RB", "HUL": "Kick Sauber", "BOT": "Kick Sauber",
    "BEA": "Haas F1", "OCO": "Haas F1",
}

RACES = [
    ["NOR", "VER", "RUS", "ANT", "ALB", "STR", "HUL", "LEC", "PIA", "HAM"],  # AUS
    ["PIA", "NOR", "RUS", "VER", "OCO", "ANT", "ALB", "BEA", "STR", "SAI"],  # CHN
    ["VER", "NOR", "PIA", "LEC", "RUS", "ANT", "HAM", "ALB", "SAI", "TSU"],  # JPN
    ["PIA", "RUS", "NOR", "LEC", "HAM", "VER", "GAS", "OCO", "TSU", "BEA"],  # BHR
    ["PIA", "NOR", "VER", "LEC", "RUS", "ANT", "HAM", "SAI", "ALB", "GAS"],  # SAU
    ["PIA", "NOR", "VER", "LEC", "RUS", "ANT", "HAM", "SAI", "ALB", "HAD"],  # MIA
    ["VER", "NOR", "PIA", "LEC", "RUS", "ANT", "HAM", "SAI", "ALB", "GAS"],  # EMI
    ["NOR", "PIA", "VER", "LEC", "RUS", "ANT", "HAM", "SAI", "ALB", "GAS"],  # MON
    ["PIA", "NOR", "VER", "LEC", "RUS", "ANT", "HAM", "SAI", "ALB", "HAD"],  # SPA
    ["RUS", "VER", "NOR", "PIA", "LEC", "ANT", "HAM", "SAI", "ALB", "GAS"],  # CAN
    ["NOR", "PIA", "VER", "LEC", "RUS", "ANT", "HAM", "SAI", "ALB", "HAD"],  # AUT
    ["NOR", "PIA", "VER", "LEC", "RUS", "ANT", "HAM", "SAI", "ALB", "GAS"],  # GBR
    ["PIA", "NOR", "VER", "LEC", "RUS", "ANT", "HAM", "SAI", "ALB", "HAD"],  # BEL
    ["NOR", "PIA", "VER", "RUS", "LEC", "ANT", "HAM", "SAI", "ALB", "GAS"],  # HUN
    ["PIA", "VER", "NOR", "RUS", "LEC", "ANT", "HAM", "SAI", "ALB", "GAS"],  # NED
    ["VER", "NOR", "PIA", "LEC", "RUS", "ANT", "HAM", "SAI", "ALB", "GAS"],  # ITA
    ["VER", "NOR", "PIA", "LEC", "RUS", "ANT", "HAM", "SAI", "ALB", "HAD"],  # AZE
    ["RUS", "VER", "NOR", "PIA", "LEC", "ANT", "HAM", "SAI", "ALB", "GAS"],  # SIN
    ["VER", "NOR", "LEC", "HAM", "PIA", "RUS", "TSU", "HUL", "BEA", "ALO"],  # USA
    ["NOR", "LEC", "VER", "BEA", "PIA", "ANT", "RUS", "HAM", "OCO", "BOT"],  # MEX
    ["NOR", "ANT", "VER", "RUS", "PIA", "BEA", "LAW", "HAD", "HUL", "GAS"],  # BRA
    ["VER", "NOR", "PIA", "RUS", "LEC", "ANT", "HAM", "SAI", "ALB", "GAS"],  # LAS
    ["VER", "PIA", "SAI", "NOR", "ANT", "RUS", "ALO", "LEC", "LAW", "TSU"],  # QAT
    ["VER", "PIA", "NOR", "LEC", "RUS", "ALO", "OCO", "HAM", "BEA", "HUL"],  # ABU
]

# Calculate driver points
driver_points = {code: 0 for code in DRIVERS.keys()}
for race in RACES:
    for pos, code in enumerate(race, start=1):
        if code in driver_points:
            driver_points[code] += GP_POINTS.get(pos, 0)

print("=" * 50)
print("CALCULATED DRIVER STANDINGS")
print("=" * 50)
for code, pts in sorted(driver_points.items(), key=lambda x: x[1], reverse=True)[:15]:
    print(f"  {code}: {pts} pts")

# Calculate constructor points
team_points = {}
for race in RACES:
    for pos, code in enumerate(race, start=1):
        team = DRIVERS.get(code)
        if team:
            team_points[team] = team_points.get(team, 0) + GP_POINTS.get(pos, 0)

print()
print("=" * 50)
print("CALCULATED CONSTRUCTOR STANDINGS")
print("=" * 50)
for team, pts in sorted(team_points.items(), key=lambda x: x[1], reverse=True):
    print(f"  {team}: {pts} pts")

print()
print("OFFICIAL VALUES (from TV):")
print("  McLaren: 833 | Mercedes: 469 | Red Bull: 451 | Ferrari: 398")
