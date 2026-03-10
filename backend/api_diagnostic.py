import asyncio
import httpx
import json

OPENF1_API = "https://api.openf1.org/v1"

async def diagnose_api():
    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. Get latest session details
        print("--- Fetching Latest Session ---")
        resp = await client.get(f"{OPENF1_API}/sessions", params={"session_key": "latest"})
        if resp.status_code != 200:
            print(f"FAILED to fetch latest session: {resp.status_code}")
            return
            
        sessions = resp.json()
        if not sessions:
            print("No sessions found.")
            return
            
        latest_session = sessions[0]
        sk = latest_session.get("session_key")
        print(f"Latest Session Key: {sk}")
        print(f"Meeting: {latest_session.get('meeting_name')}")
        print(f"Session: {latest_session.get('session_name')}")
        print(f"Status: {'LIVE' if latest_session.get('date_end') is None else 'ENDED'}")
        
        # 2. Check key endpoints for this session
        endpoints = ["position", "location", "intervals", "drivers", "stints"]
        results = {}
        
        print("\n--- Checking Data Endpoints ---")
        for ep in endpoints:
            try:
                e_resp = await client.get(f"{OPENF1_API}/{ep}", params={"session_key": sk})
                if e_resp.status_code == 200:
                    data = e_resp.json()
                    results[ep] = {
                        "status": "OK",
                        "count": len(data) if isinstance(data, list) else 1,
                        "sample": data[0] if isinstance(data, list) and data else (data if data else None)
                    }
                    print(f"✅ {ep:10}: {len(data) if isinstance(data, list) else 1} entries found")
                else:
                    results[ep] = {"status": f"ERROR {e_resp.status_code}"}
                    print(f"❌ {ep:10}: HTTP {e_resp.status_code}")
                    print(f"   Response: {e_resp.text}")
            except Exception as e:
                results[ep] = {"status": f"EXCEPTION {str(e)}"}
                print(f"❌ {ep:10}: Exception {str(e)}")
        
        # 3. Special Check: Driver Names/Colors (Common breaking point)
        if "drivers" in results and results["drivers"]["status"] == "OK":
            print("\n--- Driver Metadata Sample ---")
            d_sample = results["drivers"]["sample"]
            if d_sample:
                print(f"Name Acronym: {d_sample.get('name_acronym')}")
                print(f"Full Name: {d_sample.get('full_name')}")
                print(f"Team Color: {d_sample.get('team_colour')}")
            else:
                print("No driver data returned for this session.")

if __name__ == "__main__":
    asyncio.run(diagnose_api())
