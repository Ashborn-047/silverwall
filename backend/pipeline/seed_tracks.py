"""
SilverWall - Track Geometry Seeder
Seeds common F1 circuit geometries into Supabase to ensure maps 
are available for countdowns throughout the season.
"""

import asyncio
import sys
import os

# Add parent directory to path so we can import 'database'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import save_track_geometry

# Principal Circuit Geometries (Normalized 0-1)
# Note: These are representative samples. 
# The system will "perfect" them via Autonomous Learning during live sessions.
TRACKS = [
    {
        "circuit_key": "albert_park",
        "name": "Albert Park Circuit",
        "location": "Melbourne",
        "country": "Australia",
        "points": [
            {"x": 0.45, "y": 0.20}, {"x": 0.55, "y": 0.18}, {"x": 0.65, "y": 0.22}, {"x": 0.70, "y": 0.30},
            {"x": 0.75, "y": 0.40}, {"x": 0.85, "y": 0.45}, {"x": 0.90, "y": 0.55}, {"x": 0.85, "y": 0.65},
            {"x": 0.75, "y": 0.70}, {"x": 0.70, "y": 0.80}, {"x": 0.60, "y": 0.85}, {"x": 0.50, "y": 0.90},
            {"x": 0.40, "y": 0.85}, {"x": 0.30, "y": 0.75}, {"x": 0.20, "y": 0.65}, {"x": 0.15, "y": 0.55},
            {"x": 0.10, "y": 0.45}, {"x": 0.20, "y": 0.35}, {"x": 0.30, "y": 0.30}, {"x": 0.40, "y": 0.25}
        ]
    }
]

async def seed_tracks():
    print("🚀 Seeding Principal Track Geometries...")
    for track in TRACKS:
        try:
            await save_track_geometry(track)
            print(f"✅ Seeded: {track['name']}")
        except Exception as e:
            print(f"❌ Failed to seed {track['name']}: {e}")
    print("✨ Seeding Complete. The system will autonomously learn more tracks during live sessions.")

if __name__ == "__main__":
    asyncio.run(seed_tracks())
