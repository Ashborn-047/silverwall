"""
SilverWall - SpacetimeDB Database Client
Wrapper for SpacetimeDB connection and caching
"""

import time
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

from spacetimedb import execute_sql, call_reducer

# Query result cache with TTL
_query_cache: Dict[str, tuple] = {}
_CACHE_TTL = 300  # 5 minutes default

def _get_cache(key: str, ttl: int = _CACHE_TTL) -> Optional[Any]:
    """Get cached query result if not expired."""
    if key in _query_cache:
        data, timestamp = _query_cache[key]
        if time.time() - timestamp < ttl:
            return data
        else:
            del _query_cache[key]
    return None

def _set_cache(key: str, data: Any) -> None:
    """Cache query result with timestamp."""
    _query_cache[key] = (data, time.time())

async def get_current_season_year() -> int:
    """
    Get the latest season year from database.
    Cached for 5 minutes to reduce database load.
    """
    cache_key = "current_season_year"
    cached = _get_cache(cache_key, ttl=300)
    if cached is not None:
        return cached

    # Usually SpacetimeDB uses camelCase properties for TypeScript but the table column name might be snake_case in SQL.
    # We query the `race` table since there might not be a `seasons` table anymore (or `driver_standings` has season_year)
    # Let's get max seasonYear from driver_standings
    res = await execute_sql("SELECT MAX(season_year) as year FROM driver_standings")
    year = datetime.now().year
    if res and len(res) > 0 and 'year' in res[0] and res[0]['year'] is not None:
        year = int(res[0]['year'])
    else:
        # Fallback to checking the `race` table
        res2 = await execute_sql("SELECT MAX(season_year) as year FROM race")
        if res2 and len(res2) > 0 and 'year' in res2[0] and res2[0]['year'] is not None:
            year = int(res2[0]['year'])

    _set_cache(cache_key, year)
    return year

async def get_current_season_id() -> str:
    """Not really used in the same way with SpacetimeDB, but returning year string."""
    year = await get_current_season_year()
    return str(year)

async def get_driver_standings(season_year: int = None):
    if not season_year:
        season_year = await get_current_season_year()

    cache_key = f"driver_standings_{season_year}"
    cached = _get_cache(cache_key, ttl=60)
    if cached is not None:
        return cached

    res = await execute_sql(f"SELECT * FROM driver_standings WHERE season_year = {season_year} ORDER BY position ASC")

    # Needs to match the format expected by routes/standings.py
    # Supabase response format was: [{"position": ..., "driver_code": ..., "driver_name": ..., "team": ..., "team_color": ..., "points": ..., "wins": ...}]
    # SpacetimeDB driver_standings table: seasonYear, position, driverNumber, driverName, team, points, wins
    # Driver color and code might need to come from the driver table

    drivers_meta = await execute_sql("SELECT * FROM driver")
    driver_map = {d.get("driver_number"): d for d in drivers_meta} if drivers_meta else {}

    standings = []
    if res:
        for r in res:
            d_num = r.get("driver_number")
            d_meta = driver_map.get(d_num, {})
            name = r.get("driver_name", "")
            code = d_meta.get("name_acronym", "")
            if not code:
                 names = name.split()
                 lastName = names[-1] if len(names) > 0 else name
                 code = lastName[:3].upper()

            team_color = d_meta.get("team_color", "#FFFFFF")

            standings.append({
                "position": r.get("position"),
                "driver_code": code,
                "driver_name": name,
                "team": r.get("team"),
                "team_color": team_color,
                "points": r.get("points"),
                "wins": r.get("wins")
            })

    _set_cache(cache_key, standings)
    return standings


async def get_constructor_standings(season_year: int = None):
    if not season_year:
        season_year = await get_current_season_year()

    cache_key = f"constructor_standings_{season_year}"
    cached = _get_cache(cache_key, ttl=60)
    if cached is not None:
        return cached

    res = await execute_sql(f"SELECT * FROM constructor_standings WHERE season_year = {season_year} ORDER BY position ASC")

    standings = []
    if res:
        for r in res:
            standings.append({
                "position": r.get("position"),
                "team": r.get("team"),
                "team_color": r.get("team_color", "#FFFFFF"),
                "points": r.get("points"),
                "wins": r.get("wins"),
                "is_champion": r.get("position") == 1 # Assuming position 1 is champ if season over
            })

    _set_cache(cache_key, standings)
    return standings


async def get_season_races(season_year: int = None):
    if not season_year:
        season_year = await get_current_season_year()

    res = await execute_sql(f"SELECT * FROM race WHERE season_year = {season_year} ORDER BY race_key ASC")

    if not res:
        return []

    # Get race results only for the current season races to avoid unbounded full table scan
    race_keys = [r.get("race_key") for r in res if r.get("race_key") is not None]
    if race_keys:
        keys_str = ",".join(str(k) for k in race_keys)
        results_res = await execute_sql(f"SELECT * FROM race_result WHERE race_key IN ({keys_str})")
    else:
        results_res = []

    races = []
    for r in res:
        race_key = r.get("race_key")
        race_results = [res_obj for res_obj in results_res if res_obj.get("race_key") == race_key] if results_res else []

        # Need to format driver codes for results
        formatted_results = []
        for rr in race_results:
             name = rr.get("driver_name", "")
             names = name.split()
             code = names[-1][:3].upper() if names else ""
             formatted_results.append({
                 "position": rr.get("position"),
                 "driver_code": code,
                 "driver_name": name,
                 "team": rr.get("team"),
             })

        races.append({
            "id": race_key,
            "round": r.get("race_key"), # use race_key as round? or we can extract
            "name": r.get("meeting_name", r.get("name")),
            "circuit": r.get("location"),
            "race_date": r.get("date"),
            "status": r.get("status"),
            "race_results": formatted_results
        })

    return races


async def get_track_geometry(circuit_key: str):
    # Sanitize circuit_key to prevent SQL injection
    if not circuit_key or not str(circuit_key).replace("-", "_").replace("_", "").isalnum():
        return None

    cache_key = f"track_geometry_{circuit_key}"
    cached = _get_cache(cache_key, ttl=3600)
    if cached is not None:
        return cached

    res = await execute_sql(f"SELECT * FROM track_point WHERE circuit_key = '{circuit_key}'")
    if res:
        _set_cache(cache_key, {"points": res})
        return {"points": res}

    return None

async def get_next_race():
    cache_key = "next_race"
    cached = _get_cache(cache_key, ttl=300)
    if cached is not None:
        return cached

    now = datetime.now(timezone.utc).isoformat()
    # SpacetimeDB may use slightly different date format, but we can just filter in Python
    # if the query isn't perfect, but let's try direct SQL first.
    # We select races where status is 'upcoming' or 'live', order by date.
    res = await execute_sql("SELECT * FROM race WHERE status IN ('upcoming', 'live') ORDER BY date ASC LIMIT 1")

    next_race = None
    if res and len(res) > 0:
        r = res[0]
        next_race = {
            "name": r.get("meeting_name", r.get("name")),
            "circuit": r.get("location"),
            "race_date": r.get("date"),
            "status": r.get("status"),
            "round": r.get("race_key")
        }

    _set_cache(cache_key, next_race)
    return next_race


async def get_last_race():
    res = await execute_sql("SELECT * FROM race WHERE status = 'ended' ORDER BY date DESC LIMIT 1")
    if not res:
        return None

    r = res[0]
    race_key = r.get("race_key")
    
    results_res = await execute_sql(f"SELECT * FROM race_result WHERE race_key = {race_key}")
    
    return {
        "id": race_key,
        "name": r.get("meeting_name", r.get("name")),
        "circuit": r.get("location"),
        "race_date": r.get("date"),
        "status": r.get("status"),
        "race_results": results_res if results_res else []
    }

async def update_standings_from_results(year: int):
    # This was previously calling Supabase update or something. With SpacetimeDB we might just call a reducer
    # or rely on ingestor doing this. For now we will pass.
    pass

async def get_current_season() -> int:
    return await get_current_season_year()

async def save_track_geometry(track_data: dict):
    # Depending on SpacetimeDB reducer, we'd call seedTrack
    pass

async def finalize_race_status(race_id: str):
    # E.g. call a reducer to finalize race. race_id is probably race_key here.
    # In SpacetimeDB, updating a race could mean calling seedRace with 'ended' status.
    pass
