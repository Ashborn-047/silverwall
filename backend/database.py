"""
SilverWall - Supabase Database Client
Wrapper for Supabase connection with environment configuration
"""

import os
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
async def get_current_season_id() -> str:
    """Get the current season (2025) ID from database."""
    client = supabase()
    result = client.table("seasons").select("id").eq("year", 2025).single().execute()
    return result.data["id"] if result.data else None


async def get_driver_standings(season_year: int = 2025):
    """Fetch driver standings for a season."""
    client = supabase()
    result = client.table("driver_standings") \
        .select("*") \
        .eq("season_year", season_year) \
        .order("position") \
        .execute()
    return result.data


async def get_constructor_standings(season_year: int = 2025):
    """Fetch constructor standings for a season."""
    client = supabase()
    result = client.table("constructor_standings") \
        .select("*") \
        .eq("season_year", season_year) \
        .order("position") \
        .execute()
    return result.data


async def get_season_races(season_year: int = 2025):
    """Fetch all races for a season with results."""
    client = supabase()
    result = client.table("races") \
        .select("*, race_results(*)") \
        .eq("season_year", season_year) \
        .order("round") \
        .execute()
    return result.data
