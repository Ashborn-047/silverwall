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
        "content": f"**[SilverWall Health Check]** {content}",
        "username": "SilverWall Sentinel",
        "avatar_url": "https://raw.githubusercontent.com/f1-telemetry/silverwall/main/docs/assets/logo.png"
    }
    
    if is_error:
        payload["content"] = f"🚨 **ALERT:** {content}"

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
        seasons = client.table("seasons").select("count", count="exact").execute()
        races = client.table("races").select("count", count="exact").execute()
        
        # 2. Status Check: Find next race
        next_race = await get_next_race()
        
        status_msg = (
            f"✅ **Database Alive.**\n"
            f"📊 Tables: {seasons.count} Seasons, {races.count} Races.\n"
            f"🏎️ Next Race: **{next_race['name']}** on {next_race['race_date'] if next_race else 'N/A'}"
        )
        
        print(status_msg)
        await send_discord_alert(status_msg)
        
    except Exception as e:
        err_msg = f"Health check failed: {str(e)}"
        print(f"❌ {err_msg}")
        await send_discord_alert(err_msg, is_error=True)

if __name__ == "__main__":
    asyncio.run(run_health_check())
