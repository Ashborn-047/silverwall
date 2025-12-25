"""
SilverWall - Track Geometry Seeder
Seeds common F1 circuit geometries into Supabase to ensure maps 
are available for countdowns throughout the season.
"""

import asyncio
from database import save_track_geometry

# Principal Circuit Geometries (Normalized 0-1)
# Note: These are representative samples. 
# The system will "perfect" them via Autonomous Learning during live sessions.
TRACKS = [
    {
        "circuit_key": "yas_marina",
        "name": "Yas Marina Circuit",
        "location": "Abu Dhabi",
        "country": "UAE",
        "points": [
            {"x": 0.5, "y": 0.1}, {"x": 0.7, "y": 0.2}, {"x": 0.8, "y": 0.4}, 
            {"x": 0.7, "y": 0.6}, {"x": 0.5, "y": 0.8}, {"x": 0.3, "y": 0.6}, 
            {"x": 0.2, "y": 0.4}, {"x": 0.3, "y": 0.2} # Simplified loop for seeding
        ]
    },
    {
        "circuit_key": "monza",
        "name": "Autodromo Nazionale Monza",
        "location": "Monza",
        "country": "Italy",
        "points": [
            {"x": 0.1, "y": 0.5}, {"x": 0.9, "y": 0.5}, {"x": 0.95, "y": 0.4}, 
            {"x": 0.8, "y": 0.1}, {"x": 0.2, "y": 0.1}, {"x": 0.05, "y": 0.4}
        ]
    },
    {
        "circuit_key": "monaco",
        "name": "Circuit de Monaco",
        "location": "Monte Carlo",
        "country": "Monaco",
        "points": [
            {"x": 0.3, "y": 0.7}, {"x": 0.5, "y": 0.8}, {"x": 0.7, "y": 0.7}, 
            {"x": 0.8, "y": 0.5}, {"x": 0.6, "y": 0.3}, {"x": 0.4, "y": 0.4}
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
