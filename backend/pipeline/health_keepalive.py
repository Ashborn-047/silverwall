"""
SilverWall Health Keep-Alive
Pings Supabase to prevent project pausing and sends status to Discord.
"""

import os
import httpx
import asyncio
from datetime import datetime, timezone
from dotenv import load_dotenv
from database import supabase, get_next_race

# Load env/.env.supabase if it exists locally
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', 'env', '.env.supabase'))

# Discord Webhook URL (Should be set in GitHub Secrets)
DISCORD_WEBHOOK = os.getenv("DISCORD_WEBHOOK_URL")

async def send_discord_alert(content: str, is_error: bool = False):
    """Send a notification to Discord."""
    if not DISCORD_WEBHOOK:
        print("⚠ DISCORD_WEBHOOK_URL not set. Skipping notification.")
        return

    payload = {
        "username": "SilverWall Sentinel",
        "avatar_url": "https://raw.githubusercontent.com/f1-telemetry/silverwall/main/docs/assets/logo.png"
    }
    
    if is_error:
        payload["content"] = f"🚨 **[SilverWall ERROR]**\n{content}"
    else:
        # No prefix here, build it in the content for cleaner header alignment
        payload["content"] = content

    try:
        async with httpx.AsyncClient() as client:
            await client.post(DISCORD_WEBHOOK, json=payload)
    except Exception as e:
        print(f"Failed to send Discord alert: {e}")

async def run_health_check():
    """Perform health checks and keep-alive."""
    print(f"Starting health check: {datetime.now(timezone.utc)}")
    
    try:
        client = supabase()
        
        # 1. Keep-Alive: Ping core tables
        seasons_res = client.table("seasons").select("*").order("year", desc=True).limit(1).execute()
        current_year = seasons_res.data[0]['year'] if seasons_res.data else datetime.now().year
        
        # 2. Status Check: Find next race
        next_race = await get_next_race()
        
        # 3. Fetch Standings for the report
        drivers = client.table("driver_standings").select("*").eq("season_year", current_year).order("position").limit(5).execute()
        constructors = client.table("constructor_standings").select("*").eq("season_year", current_year).order("position").limit(3).execute()
        
        # Format Date for Next Race
        race_date_str = "TBD"
        if next_race and next_race.get('race_date'):
            try:
                dt = datetime.fromisoformat(next_race['race_date'].replace('Z', '+00:00'))
                race_date_str = dt.strftime("%b %d, %Y (%H:%M UTC)").upper()
            except:
                race_date_str = next_race['race_date']

        # Format Circuit Name
        circuit_name = next_race.get('circuit', 'Unknown').replace('_', ' ').title() if next_race else "N/A"

        # 4. Build Rich Message
        lines = [
            f"# 🏎️ SilverWall System Report",
            f"> 📡 **Status:** `OPERATIONAL` | 📅 **Sync:** `{datetime.now(timezone.utc).strftime('%H:%M:%S UTC')}`",
            "",
            f"### 🏁 **Upcoming Event**",
            f"**{next_race.get('name', 'N/A')}**",
            f"📍 {circuit_name}, {next_race.get('country', 'N/A')}",
            f"⏰ {race_date_str}",
            "",
            f"### 🏆 **Championship Leaders ({current_year})**",
        ]
        
        if drivers.data:
            lines.append("**Drivers (Top 5):**")
            for d in drivers.data:
                medal = "🥇" if d['position'] == 1 else "🥈" if d['position'] == 2 else "🥉" if d['position'] == 3 else "▫️"
                lines.append(f"{medal} `{d['position']}` **{d['driver_name']}** — `{d['points']} pts` | `{d['wins']} wins`")
        else:
            lines.append("▫️ *No driver data yet for this season*")
            
        lines.append("")
        
        if constructors.data:
            lines.append("**Constructors (Top 3):**")
            for c in constructors.data:
                lines.append(f"▫️ `{c['position']}` **{c['team']}** — `{c['points']} pts`")
        else:
            lines.append("▫️ *No constructor data yet*")
            
        lines.append("")
        lines.append("---")
        lines.append("*`SILVERWALL_SENTINEL_V1.2_ACTIVE`*")
        
        status_msg = "\n".join(lines)
        
        print("Health check complete. Sending to Discord...")
        await send_discord_alert(status_msg)
        
    except Exception as e:
        err_msg = f"Health check failed: {str(e)}"
        print(f"❌ {err_msg}")
        await send_discord_alert(err_msg, is_error=True)

if __name__ == "__main__":
    asyncio.run(run_health_check())
