"""
SilverWall - Supabase Database Client
Wrapper for Supabase connection with environment configuration
"""

import os
from datetime import datetime, timezone
from functools import lru_cache
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from env/.env.supabase
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), 'env', '.env.supabase'))


@lru_cache()
def get_supabase_client() -> Client:
    """
    Get cached Supabase client instance.
    Uses service role key for backend operations.
    """
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    
    if not url or not key:
        raise ValueError(
            "Missing Supabase credentials. "
            "Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.supabase"
        )
    
    return create_client(url, key)


# Quick access to client
def supabase() -> Client:
    """Get the Supabase client."""
    return get_supabase_client()


# Helper functions for common operations
async def get_current_season_year():
    """Get the latest season year from database."""
    client = supabase()
    result = client.table("seasons").select("year").order("year", desc=True).limit(1).single().execute()
    return result.data['year'] if result.data else 2025

async def get_current_season_id() -> str:
    """Get the current season ID from database."""
    year = await get_current_season_year()
    client = supabase()
    result = client.table("seasons").select("id").eq("year", year).single().execute()
    return result.data['id'] if result.data else None


async def get_driver_standings(season_year: int = None):
    """Fetch driver standings for a season."""
    client = supabase()
    if not season_year:
        season_year = await get_current_season_year()
    print(f"Fetching driver standings for {season_year}")
    result = client.table("driver_standings") \
        .select("*") \
        .eq("season_year", season_year) \
        .order("position") \
        .execute()
    return result.data


async def get_constructor_standings(season_year: int = None):
    """Fetch constructor standings for a season."""
    client = supabase()
    if not season_year:
        season_year = await get_current_season_year()
    print(f"Fetching constructor standings for {season_year}")
    result = client.table("constructor_standings") \
        .select("*") \
        .eq("season_year", season_year) \
        .order("position") \
        .execute()
    return result.data


async def get_season_races(season_year: int = None):
    """Fetch all races for a season with results."""
    client = supabase()
    if not season_year:
        season_year = await get_current_season_year()
    result = client.table("races") \
        .select("*, race_results(*)") \
        .eq("season_year", season_year) \
        .order("round") \
        .execute()
    return result.data


async def get_track_geometry(circuit_key: str):
    """Fetch track geometry from database."""
    try:
        client = supabase()
        result = client.table("tracks") \
            .select("*") \
            .eq("circuit_key", circuit_key) \
            .single() \
            .execute()
        return result.data
    except Exception as e:
        print(f"[WARN] Track geometry fetch failed for {circuit_key}: {e}")
        return None


async def get_next_race():
    """
    Fetch the next upcoming race from the database.
    Autonomously filters out races that have already passed (past their UTC date).
    """
    now = datetime.now(timezone.utc).isoformat()
    client = supabase()
    
    # Query for the first race whose date is in the future
    # This automatically skips past "2025" if it's already over
    result = client.table("races") \
        .select("*") \
        .gte("race_date", now) \
        .order("race_date") \
        .limit(1) \
        .execute()
    
    return result.data[0] if result.data else None


async def get_last_race():
    """Fetch the most recently completed race from the database."""
    client = supabase()
    
    # Query for the latest race that is completed
    result = client.table("races") \
        .select("*, race_results(*)") \
        .eq("status", "completed") \
        .order("race_date", desc=True) \
        .limit(1) \
        .execute()
    
    return result.data[0] if result.data else None
async def update_standings_from_results(year: int):
    """Recalculate and update driver and constructor standings for a season."""
    client = supabase()
    
    # 1. Recalculate Driver Standings
    # Note: Simplified points logic for F1 (25, 18, 15, 12, 10, 8, 6, 4, 2, 1)
    # This queries all race_results for the year and aggregates
    results = client.table("race_results") \
        .select("driver_code, driver_name, team, team_color, points") \
        .execute()
    
    # ... In a real app, this would be a more complex aggregation query or a Postgres function
    # For now, we provide the hook for ingest_results.py to call.
    pass

async def get_current_season() -> int:
    """Dynamically determine the current season year."""
    return await get_current_season_year()

async def save_track_geometry(track_data: dict):
    """Save or update track geometry in the database."""
    client = supabase()
    # Ensure points is JSONB compatible
    result = client.table("tracks").upsert({
        "circuit_key": track_data["circuit_key"],
        "name": track_data["name"],
        "location": track_data.get("location"),
        "country": track_data.get("country"),
        "points": track_data["points"],
        "drs_zones": track_data.get("drs_zones", [])
    }, on_conflict="circuit_key").execute()
    return result.data

async def finalize_race_status(race_id: str):
    """Set race status to completed."""
    client = supabase()
    client.table("races").update({"status": "completed"}).eq("id", race_id).execute()
