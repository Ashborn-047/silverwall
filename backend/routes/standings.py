"""
SilverWall - Season Standings API
Autonomous standings and race history driven by Supabase
"""

from fastapi import APIRouter
from typing import Optional
from database import supabase, get_current_season

router = APIRouter()

@router.get("/standings/drivers")
@router.get("/standings/drivers/{year}")
async def get_driver_standings(year: Optional[int] = None):
    """Get driver championship standings. Defaults to current active season."""
    if year is None:
        year = await get_current_season()
        
    client = supabase()
    
    # 1. Fetch Season Info
    season_res = client.table("seasons").select("*").eq("year", year).single().execute()
    season_info = season_res.data if season_res.data else {}
    
    champion_name = season_info.get("driver_champion")
    title_fight_msg = f"{champion_name} - {year} WORLD CHAMPION! 🏆" if champion_name else f"{year} World Championship"
    
    # 2. Fetch Standings
    result = client.table("driver_standings") \
        .select("position, driver_code, driver_name, team, team_color, points, wins") \
        .eq("season_year", year) \
        .order("position") \
        .execute()
    
    standings = []
    if result.data:
        standings = [
            {
                "position": d["position"],
                "code": d["driver_code"],
                "name": d["driver_name"],
                "team": d["team"],
                "color": d["team_color"],
                "points": float(d["points"]),
                "wins": d.get("wins", 0),
            }
            for d in result.data
        ]

    return {
        "season": year,
        "source": "supabase",
        "title_fight": title_fight_msg,
        "standings": standings,
        "leader": standings[0] if standings else None,
        "champion": {"name": champion_name} if champion_name else None
    }

@router.get("/standings/constructors")
@router.get("/standings/constructors/{year}")
async def get_constructor_standings(year: Optional[int] = None):
    """Get constructor championship standings. Defaults to current active season."""
    if year is None:
        year = await get_current_season()
        
    client = supabase()
    
    # 1. Fetch Season Info
    season_res = client.table("seasons").select("*").eq("year", year).single().execute()
    season_info = season_res.data if season_res.data else {}
    champ_team = season_info.get("constructor_champion")
    
    # 2. Fetch Standings
    result = client.table("constructor_standings") \
        .select("position, team, team_color, points, wins, is_champion") \
        .eq("season_year", year) \
        .order("position") \
        .execute()
    
    standings = []
    if result.data:
        standings = [
            {
                "position": c["position"],
                "team": c["team"],
                "color": c["team_color"],
                "points": float(c["points"]),
                "wins": c.get("wins", 0),
                "champion": c.get("is_champion", False),
            }
            for c in result.data
        ]

    return {
        "season": year,
        "source": "supabase",
        "standings": standings,
        "champion_team": champ_team,
        "message": f"{champ_team} - {year} CONSTRUCTORS' CHAMPIONS! 🏆" if champ_team else None
    }

@router.get("/season/races")
@router.get("/season/races/{year}")
async def get_season_races(year: Optional[int] = None):
    """Get all races in the specified season. Defaults to current active season."""
    if year is None:
        year = await get_current_season()
        
    client = supabase()
    
    # Fetch races and their results
    result = client.table("races") \
        .select("*, race_results(*)") \
        .eq("season_year", year) \
        .order("round") \
        .execute()
        
    races = []
    completed_count = 0
    
    if result.data:
        for r in result.data:
            podium = []
            results = r.get("race_results", [])
            podium_results = sorted([res for res in results if res["position"] <= 3], key=lambda x: x["position"])
            
            if podium_results:
                completed_count += 1
                for pres in podium_results:
                    podium.append({
                        "pos": pres["position"],
                        "code": pres["driver_code"],
                        "name": pres["driver_name"]
                    })
            
            races.append({
                "round": r["round"],
                "name": r["name"],
                "circuit": r["circuit"],
                "date": r["race_date"],
                "podium": podium if podium else None,
                "status": r["status"]
            })
            
    return {
        "season": year,
        "total_races": len(races),
        "completed": completed_count,
        "source": "supabase",
        "races": races
    }

@router.get("/season/race/{round_num}")
async def get_race_by_round(round_num: int, year: Optional[int] = None):
    """Get specific race details from DB by round number. Defaults to current season."""
    if year is None:
        year = await get_current_season()
        
    client = supabase()
    result = client.table("races") \
        .select("*, race_results(*)") \
        .eq("season_year", year) \
        .eq("round", round_num) \
        .single() \
        .execute()
    
    if not result.data:
        return {"error": f"Race round {round_num} not found for {year}"}
    
    return result.data


@router.get("/champions")
@router.get("/champions/{year}")
async def get_champions(year: Optional[int] = None):
    """
    Get the World Champions (Driver & Constructor) for a given season.
    FULLY AUTONOMOUS: Detects the most recent COMPLETED season from race data.
    No hardcoded years - works for any season automatically.
    """
    client = supabase()
    
    if year is None:
        # AUTONOMOUS: Find the most recent season with completed races
        # A season is "completed" if all its races are marked as 'completed'
        # Or if it has standings data with a P1 driver
        
        # First, try to find a season with standings data, ordered by year
        standings_res = client.table("driver_standings") \
            .select("season_year") \
            .eq("position", 1) \
            .order("season_year", desc=True) \
            .limit(1) \
            .execute()
        
        if standings_res.data:
            year = standings_res.data[0]["season_year"]

        else:
            # Fallback: use recent season from races table
            races_res = client.table("races") \
                .select("season_year") \
                .eq("status", "completed") \
                .order("race_date", desc=True) \
                .limit(1) \
                .execute()
            if races_res.data:
                year = races_res.data[0]["season_year"]
            else:
                return {"error": "No completed seasons found", "year": None, "source": "supabase"}
    
    # Fetch Season Info        
    season_res = client.table("seasons").select("*").eq("year", year).single().execute()
    
    if not season_res.data:
        return {"error": f"Season {year} not found", "year": year}
    
    season = season_res.data if isinstance(season_res.data, dict) else season_res.data[0]
    driver_champion = season.get("driver_champion")
    constructor_champion = season.get("constructor_champion")
    
    # For the driver champion, fetch their team from standings
    # If driver_champion is not set, use the P1 driver from standings as fallback
    driver_team = None
    driver_res = client.table("driver_standings") \
        .select("driver_name, team, team_color") \
        .eq("season_year", year) \
        .eq("position", 1) \
        .single() \
        .execute()
    
    if driver_res.data:
        driver_team = driver_res.data.get("team")
        # Fallback: if no explicit champion, use P1 driver
        if not driver_champion:
            driver_champion = driver_res.data.get("driver_name")
    
    # Fallback for constructor: use P1 constructor if not set
    if not constructor_champion:
        cons_res = client.table("constructor_standings") \
            .select("team") \
            .eq("season_year", year) \
            .eq("position", 1) \
            .single() \
            .execute()
        if cons_res.data:
            constructor_champion = cons_res.data.get("team")
    
    return {
        "year": year,
        "driver": {
            "name": driver_champion,
            "team": driver_team
        } if driver_champion else None,
        "constructor": {
            "name": constructor_champion
        } if constructor_champion else None,
        "source": "supabase"
    }
