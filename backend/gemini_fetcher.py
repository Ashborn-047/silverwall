"""
SilverWall - Gemini Race Results Fetcher
Uses Google's Gemini API to fetch and store F1 race results
"""

import os
import json
from typing import Dict, List, Optional

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    print("⚠️ google-generativeai not installed. Run: pip install google-generativeai")


def configure_gemini(api_key: str = None) -> bool:
    """Configure Gemini with API key"""
    if not GEMINI_AVAILABLE:
        return False
    
    key = api_key or os.getenv("GEMINI_API_KEY")
    if not key:
        print("⚠️ GEMINI_API_KEY not set")
        return False
    
    genai.configure(api_key=key)
    return True


async def fetch_race_results_from_gemini(race_name: str, year: int = 2025) -> Optional[List[Dict]]:
    """
    Use Gemini to fetch race results for a specific race.
    Returns list of {position, driver_code, driver_name, team, points}
    """
    if not GEMINI_AVAILABLE:
        return None
    
    prompt = f"""
    Provide the official F1 {year} {race_name} race results (P1 to P10).
    Return ONLY a JSON array with this exact format:
    [
        {{"position": 1, "driver_code": "XXX", "driver_name": "Full Name", "team": "Team Name", "points": 25}},
        ...
    ]
    Use standard 3-letter driver codes (VER, NOR, PIA, etc).
    Points should be: P1=25, P2=18, P3=15, P4=12, P5=10, P6=8, P7=6, P8=4, P9=2, P10=1
    Return ONLY the JSON array, no other text.
    """
    
    try:
        model = genai.GenerativeModel('gemini-pro')
        response = await model.generate_content_async(prompt)
        
        # Parse JSON from response
        text = response.text.strip()
        # Remove markdown code blocks if present
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        
        results = json.loads(text)
        return results
    except Exception as e:
        print(f"❌ Gemini fetch error: {e}")
        return None


async def save_results_to_db(race_id: str, results: List[Dict], supabase_client) -> bool:
    """Save fetched results to Supabase"""
    try:
        # Clear existing results for this race
        supabase_client.table("race_results").delete().eq("race_id", race_id).execute()
        
        # Insert new results
        for result in results:
            supabase_client.table("race_results").insert({
                "race_id": race_id,
                "position": result["position"],
                "driver_code": result["driver_code"],
                "driver_name": result["driver_name"],
                "team": result["team"],
                "team_color": get_team_color(result["team"]),
                "points": result["points"],
            }).execute()
        
        return True
    except Exception as e:
        print(f"❌ DB save error: {e}")
        return False


def get_team_color(team: str) -> str:
    """Get team color hex code"""
    colors = {
        "McLaren": "#FF8000",
        "Red Bull Racing": "#3671C6",
        "Mercedes": "#00D2BE",
        "Ferrari": "#DC0000",
        "Williams": "#00A0DE",
        "Aston Martin": "#006F62",
        "Alpine": "#0090FF",
        "RB": "#6692FF",
        "Racing Bulls": "#6692FF",
        "Kick Sauber": "#52E252",
        "Sauber": "#52E252",
        "Haas F1": "#B6BABD",
        "Haas": "#B6BABD",
    }
    return colors.get(team, "#FFFFFF")


async def fetch_all_season_results(year: int = 2025):
    """Fetch results for entire season using Gemini"""
    races = [
        "Australian Grand Prix",
        "Chinese Grand Prix",
        "Japanese Grand Prix",
        "Bahrain Grand Prix",
        "Saudi Arabian Grand Prix",
        "Miami Grand Prix",
        "Emilia Romagna Grand Prix",
        "Monaco Grand Prix",
        "Spanish Grand Prix",
        "Canadian Grand Prix",
        "Austrian Grand Prix",
        "British Grand Prix",
        "Belgian Grand Prix",
        "Hungarian Grand Prix",
        "Dutch Grand Prix",
        "Italian Grand Prix",
        "Azerbaijan Grand Prix",
        "Singapore Grand Prix",
        "United States Grand Prix",
        "Mexico City Grand Prix",
        "São Paulo Grand Prix",
        "Las Vegas Grand Prix",
        "Qatar Grand Prix",
        "Abu Dhabi Grand Prix",
    ]
    
    all_results = {}
    for i, race_name in enumerate(races, start=1):
        print(f"Fetching Round {i}: {race_name}...")
        results = await fetch_race_results_from_gemini(race_name, year)
        if results:
            all_results[f"Round {i}"] = {"name": race_name, "results": results}
            print(f"  ✅ Got {len(results)} results")
        else:
            print(f"  ❌ Failed to fetch")
    
    return all_results


# Example usage
if __name__ == "__main__":
    import asyncio
    
    if configure_gemini():
        results = asyncio.run(fetch_all_season_results(2025))
        print(json.dumps(results, indent=2))
