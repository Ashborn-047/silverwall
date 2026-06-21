"""
SilverWall - Season Standings API
Autonomous standings and race history driven by SpacetimeDB
"""

from fastapi import APIRouter, Request
from typing import Optional
from database import get_current_season, get_driver_standings as db_get_driver_standings, get_constructor_standings as db_get_constructor_standings, get_season_races as db_get_season_races, execute_sql
from limiter import limiter

router = APIRouter()

@router.get("/standings/drivers")
@router.get("/standings/drivers/{year}")
@limiter.limit("60/minute")
async def get_driver_standings(request: Request, year: Optional[int] = None):
    """Get driver championship standings. Defaults to current active season."""
    if year is None:
        year = await get_current_season()
        
    standings = await db_get_driver_standings(year)
    
    # Try to determine champion
    champion_name = None
    if standings and len(standings) > 0 and standings[0].get("position") == 1:
         # Need to check if season is ended to confirm champion, but we'll approximate
         # based on whether a driver has enough points or if it's past year
         current_year = await get_current_season()
         if year < current_year:
              champion_name = standings[0].get("driver_name")
    
    title_fight_msg = f"{champion_name} - {year} WORLD CHAMPION! 🏆" if champion_name else f"{year} World Championship"

    return {
        "season": year,
        "source": "spacetimedb",
        "title_fight": title_fight_msg,
        "standings": standings,
        "leader": standings[0] if standings else None,
        "champion": {"name": champion_name} if champion_name else None
    }

@router.get("/standings/constructors")
@router.get("/standings/constructors/{year}")
@limiter.limit("60/minute")
async def get_constructor_standings(request: Request, year: Optional[int] = None):
    """Get constructor championship standings. Defaults to current active season."""
    if year is None:
        year = await get_current_season()
        
    standings = await db_get_constructor_standings(year)
    
    champ_team = None
    if standings and len(standings) > 0 and standings[0].get("position") == 1:
         current_year = await get_current_season()
         if year < current_year:
              champ_team = standings[0].get("team")

    return {
        "season": year,
        "source": "spacetimedb",
        "standings": standings,
        "champion_team": champ_team,
        "message": f"{champ_team} - {year} CONSTRUCTORS' CHAMPIONS! 🏆" if champ_team else None
    }

@router.get("/season/races")
@router.get("/season/races/{year}")
@limiter.limit("60/minute")
async def get_season_races(request: Request, year: Optional[int] = None):
    """Get all races in the specified season. Defaults to current active season."""
    if year is None:
        year = await get_current_season()
        
    races_raw = await db_get_season_races(year)
        
    races = []
    completed_count = 0
    
    if races_raw:
        for r in races_raw:
            podium = []
            results = r.get("race_results", [])
            podium_results = sorted([res for res in results if res.get("position", 999) <= 3], key=lambda x: x.get("position", 999))
            
            if podium_results:
                completed_count += 1
                for pres in podium_results:
                    podium.append({
                        "pos": pres.get("position"),
                        "code": pres.get("driver_code"),
                        "name": pres.get("driver_name")
                    })
            
            races.append({
                "round": r.get("round"),
                "name": r.get("name"),
                "circuit": r.get("circuit"),
                "date": r.get("race_date"),
                "podium": podium if podium else None,
                "status": r.get("status")
            })
            
    return {
        "season": year,
        "total_races": len(races),
        "completed": completed_count,
        "source": "spacetimedb",
        "races": races
    }

@router.get("/season/race/{round_num}")
@limiter.limit("60/minute")
async def get_race_by_round(request: Request, round_num: int, year: Optional[int] = None):
    """Get specific race details from DB by round number. Defaults to current season."""
    if year is None:
        year = await get_current_season()
        
    # We use race_key for round in our SpacetimeDB abstraction
    res = await execute_sql(f"SELECT * FROM race WHERE season_year = {year} AND race_key = {round_num}")
    
    if not res:
        return {"error": f"Race round {round_num} not found for {year}"}

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


@router.get("/champions")
@router.get("/champions/{year}")
@limiter.limit("60/minute")
async def get_champions(request: Optional[Request] = None, year: Optional[int] = None):
    """
    Get the World Champions (Driver & Constructor) for a given season.
    FULLY AUTONOMOUS: Detects the most recent COMPLETED season from race data.
    """
    if year is None:
        # First, try to find a season with standings data, ordered by year
        standings_res = await execute_sql("SELECT season_year FROM driver_standings WHERE position = 1 ORDER BY season_year DESC LIMIT 1")
        
        if standings_res:
            year = standings_res[0].get("season_year")
        else:
            # Fallback: find the most recent season where all races have ended
            seasons_res = await execute_sql("SELECT DISTINCT season_year FROM race WHERE status = 'ended' ORDER BY season_year DESC")
            if seasons_res:
                for row in seasons_res:
                    yr = row.get("season_year")
                    check_res = await execute_sql(f"SELECT * FROM race WHERE season_year = {yr} AND status IN ('upcoming', 'live') LIMIT 1")
                    if not check_res:
                        year = yr
                        break
                
                if year is None:
                    year = seasons_res[0].get("season_year")
            else:
                return {"error": "No completed seasons found", "year": None, "source": "spacetimedb"}
    
    # We don't have a 'seasons' table anymore in SpacetimeDB schema.
    driver_champion = None
    driver_team = None
    constructor_champion = None
    
    driver_res = await execute_sql(f"SELECT driver_name, team FROM driver_standings WHERE season_year = {year} AND position = 1 LIMIT 1")
    if driver_res:
        driver_champion = driver_res[0].get("driver_name")
        driver_team = driver_res[0].get("team")

    cons_res = await execute_sql(f"SELECT team FROM constructor_standings WHERE season_year = {year} AND position = 1 LIMIT 1")
    if cons_res:
        constructor_champion = cons_res[0].get("team")
    
    return {
        "year": year,
        "driver": {
            "name": driver_champion,
            "team": driver_team
        } if driver_champion else None,
        "constructor": {
            "name": constructor_champion
        } if constructor_champion else None,
        "source": "spacetimedb"
    }
