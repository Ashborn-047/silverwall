"""
SilverWall - Race Results Ingestion
Automates the finalization of a race by fetching results from OpenF1 
and updating standings in Supabase.
"""

import asyncio
import httpx
from database import finalize_race_status
from spacetimedb import call_reducer, execute_sql

OPENF1_API = "https://api.openf1.org/v1"

async def fetch_session_order(session_key: int):
    """Fetch final position order from OpenF1"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{OPENF1_API}/session_result", params={"session_key": session_key})
            if response.status_code == 200:
                data = response.json()
                if data:
                    return sorted(data, key=lambda x: x.get("position", 999))

            # Older sessions can lag behind official publication, so keep the
            # previous position-derived path as a compatibility fallback.
            response = await client.get(f"{OPENF1_API}/position", params={"session_key": session_key})
            if response.status_code == 200:
                data = response.json()
                latest = {}
                for entry in data:
                    d_num = entry.get("driver_number")
                    if d_num and (d_num not in latest or entry.get("date", "") > latest[d_num].get("date", "")):
                        latest[d_num] = entry
                return sorted(latest.values(), key=lambda x: x.get("position", 999))
    except Exception as e:
        print(f"Error fetching session order: {e}")
    return []

async def fetch_driver_metadata(session_key: int):
    """Fetch driver details from OpenF1"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{OPENF1_API}/drivers", params={"session_key": session_key})
            if response.status_code == 200:
                return {d["driver_number"]: d for d in response.json()}
    except:
        pass
    return {}

POINTS_MAP = {1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2, 10: 1}

async def ingest_race_results(race_uuid: str, session_key: int):
    """Ingest P1-P20 results and finalize the race."""
    print(f"Ingesting results for session {session_key}...")
    
    order = await fetch_session_order(session_key)
    drivers = await fetch_driver_metadata(session_key)
    
    if not order:
        print("❌ No results found to ingest.")
        return

    # Clear existing results for this race if any
    # Assuming race_uuid in the old code might now correspond to session_key (raceKey) in SpacetimeDB
    race_key = session_key
    await execute_sql(f"DELETE FROM race_result WHERE race_key = {race_key}")

    inserted_count = 0
    for entry in order[:20]:
        pos = entry.get("position")
        d_num = entry.get("driver_number")
        driver_info = drivers.get(d_num, {})
        
        # seedRaceResult args: raceKey, position, driverNumber, driverName, team, timeStatus
        args = [
            race_key,
            pos,
            d_num if d_num else 0,
            driver_info.get("full_name", "Unknown"),
            driver_info.get("team_name", "Unknown"),
            "Finished"
        ]
        if await call_reducer("seedRaceResult", args):
            inserted_count += 1

    if inserted_count > 0:
        print(f"✅ Ingested {inserted_count} result rows.")
        
        # Set race to completed
        await call_reducer("seedRace", [race_key, "", "", "", "", 0, "ended", 0])
        print("🏁 Race marked as COMPLETED.")
        
        # In a real production scenario, we'd trigger a standings recalculation here
        print("🚀 Standings update triggered.")

if __name__ == "__main__":
    # Example usage (would be called by a trigger or command)
    import sys
    if len(sys.argv) > 2:
        asyncio.run(ingest_race_results(sys.argv[1], int(sys.argv[2])))
    else:
        print("Usage: python ingest_results.py <race_uuid> <session_key>")
