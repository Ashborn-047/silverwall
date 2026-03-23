import os
import httpx
from supabase import create_client
from dotenv import load_dotenv

# Load Supabase keys
env_path = r'e:\My Projects\F1\silverwall\backend\env\.env.supabase'
load_dotenv(dotenv_path=env_path)

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_KEY")

async def check_data():
    print(f"Connecting to: {url}")
    sb = create_client(url, key)
    
    # Check seasons
    seasons = sb.table("seasons").select("*").execute()
    print("\n--- Seasons ---")
    for s in seasons.data:
        print(f"Year: {s['year']}, ID: {s['id']}")
    
    # Check races for 2026
    races_2026 = sb.table("races").select("*").eq("season_year", 2026).execute()
    print(f"\n--- 2026 Races: {len(races_2026.data)} found ---")
    for r in races_2026.data[:5]:
        print(f"Race: {r['name']}, Date: {r['race_date']}, Status: {r['status']}")

    # Check OpenF1 latest session
    async with httpx.AsyncClient() as client:
        resp = await client.get("https://api.openf1.org/v1/sessions", params={"session_key": "latest"})
        if resp.status_code == 200:
            data = resp.json()
            if data:
                session = data[0]
                print(f"\n--- OpenF1 Latest Session ---")
                print(f"Session: {session.get('session_name')}")
                print(f"Meeting: {session.get('meeting_name')}")
                print(f"Date: {session.get('date_start')}")
                print(f"Year: {session.get('year')}")
            else:
                print("\nOpenF1 returned no latest session data")
        else:
            print(f"\nOpenF1 API failed: {resp.status_code}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(check_data())
