#!/usr/bin/env python3
"""Quick test of standings calculation logic"""

GP_POINTS = {1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2, 10: 1}

# Sample races (just 3 for quick test)
races = [
    {"results": [{"pos": 1, "code": "NOR"}, {"pos": 2, "code": "VER"}, {"pos": 3, "code": "RUS"}, {"pos": 4, "code": "PIA"}, {"pos": 5, "code": "LEC"}]},
    {"results": [{"pos": 1, "code": "VER"}, {"pos": 2, "code": "NOR"}, {"pos": 3, "code": "PIA"}, {"pos": 4, "code": "RUS"}, {"pos": 5, "code": "LEC"}]},
    {"results": [{"pos": 1, "code": "NOR"}, {"pos": 2, "code": "PIA"}, {"pos": 3, "code": "LEC"}, {"pos": 4, "code": "VER"}, {"pos": 5, "code": "RUS"}]},
]

driver_points = {}
for race in races:
    for entry in race["results"]:
        code = entry["code"]
        pos = entry["pos"]
        pts = GP_POINTS.get(pos, 0)
        driver_points[code] = driver_points.get(code, 0) + pts

print("=== DRIVER POINTS (3 races) ===")
for code, pts in sorted(driver_points.items(), key=lambda x: x[1], reverse=True):
    print(f"  {code}: {pts} pts")

# Expected:
# NOR: 25 + 18 + 25 = 68
# VER: 18 + 25 + 12 = 55
# PIA: 12 + 15 + 18 = 45
# RUS: 15 + 12 + 10 = 37
# LEC: 10 + 10 + 15 = 35
