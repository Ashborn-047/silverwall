from fastapi import APIRouter, Request, Header, HTTPException
from fastapi.responses import JSONResponse
import os
import json
from nacl.signing import VerifyKey
from nacl.exceptions import BadSignatureError
from datetime import datetime, timezone
from database import supabase, get_next_race, get_driver_standings, get_constructor_standings

router = APIRouter(tags=["discord"])

# Discord Interaction Types
PING = 1
APPLICATION_COMMAND = 2

# Discord Response Types
PONG = 1
CHANNEL_MESSAGE_WITH_SOURCE = 4

DISCORD_PUBLIC_KEY = os.getenv("DISCORD_PUBLIC_KEY")

async def verify_signature(request: Request):
    """Verify that the request is actually from Discord."""
    signature = request.headers.get("X-Signature-Ed25519")
    timestamp = request.headers.get("X-Signature-Timestamp")
    
    if not signature or not timestamp:
        raise HTTPException(status_code=401, detail="Missing signature headers")
    
    body = await request.body()
    
    try:
        verify_key = VerifyKey(bytes.fromhex(DISCORD_PUBLIC_KEY))
        verify_key.verify(f"{timestamp}{body.decode()}".encode(), bytes.fromhex(signature))
    except (BadSignatureError, ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid request signature")

@router.post("/discord/interactions")
async def discord_interactions(request: Request):
    # 1. Security Verification
    await verify_signature(request)
    
    # 2. Parse Body
    data = await request.json()
    interaction_type = data.get("type")
    
    # 3. Handle PING (Endpoint Validation)
    if interaction_type == PING:
        return JSONResponse(content={"type": PONG})
    
    # 4. Handle Slash Commands
    if interaction_type == APPLICATION_COMMAND:
        command_name = data.get("data", {}).get("name")
        
        if command_name == "status":
            return await handle_status_command()
        elif command_name == "standings":
            return await handle_standings_command()
        elif command_name == "next":
            return await handle_next_gp_command()
            
    return JSONResponse(content={"type": CHANNEL_MESSAGE_WITH_SOURCE, "data": {"content": "Unknown command"}})

async def handle_status_command():
    """Handle /status command."""
    try:
        client = supabase()
        # Ping DB
        client.table("seasons").select("count", count="exact").execute()
        next_race = await get_next_race()
        
        content = (
            "### 🟢 SilverWall System Status\n"
            f"> **Status:** `OPERATIONAL`\n"
            f"> **Backend:** `v2.0 Autonomous`\n"
            f"> **Database:** `Connected`\n"
            "\n"
            f"🏁 **Next Race:** **{next_race['name']}** on {next_race['race_date'] if next_race else 'TBD'}"
        )
        return JSONResponse(content={
            "type": CHANNEL_MESSAGE_WITH_SOURCE,
            "data": {"content": content}
        })
    except Exception as e:
        return JSONResponse(content={
            "type": CHANNEL_MESSAGE_WITH_SOURCE,
            "data": {"content": f"❌ Error checking status: {str(e)}"}
        })

async def handle_standings_command():
    """Handle /standings command."""
    try:
        # Get latest season year
        client = supabase()
        res = client.table("seasons").select("year").order("year", desc=True).limit(1).execute()
        year = res.data[0]['year'] if res.data else 2025
        
        drivers = await get_driver_standings(year)
        constructors = await get_constructor_standings(year)
        
        lines = [f"## 🏆 {year} Championship Standings"]
        
        if drivers:
            lines.append("\n**Top 5 Drivers:**")
            for d in drivers[:5]:
                medal = "🥇" if d['position'] == 1 else "🥈" if d['position'] == 2 else "🥉" if d['position'] == 3 else "▫️"
                lines.append(f"{medal} `{d['position']}` **{d['driver_name']}** — `{d['points']} pts`")
        
        if constructors:
            lines.append("\n**Top 3 Constructors:**")
            for c in constructors[:3]:
                lines.append(f"▫️ `{c['position']}` **{c['team']}** — `{c['points']} pts`")
                
        return JSONResponse(content={
            "type": CHANNEL_MESSAGE_WITH_SOURCE,
            "data": {"content": "\n".join(lines)}
        })
    except Exception as e:
        return JSONResponse(content={
            "type": CHANNEL_MESSAGE_WITH_SOURCE,
            "data": {"content": f"❌ Error fetching standings: {str(e)}"}
        })

async def handle_next_gp_command():
    """Handle /next command."""
    try:
        next_race = await get_next_race()
        if not next_race:
            return JSONResponse(content={"type": CHANNEL_MESSAGE_WITH_SOURCE, "data": {"content": "🏁 No upcoming races found."}})
            
        content = (
            f"## 🏁 Upcoming Event: {next_race['name']}\n"
            f"> 📍 **Location:** {next_race.get('circuit', 'Unknown Circuit')}, {next_race.get('country', 'N/A')}\n"
            f"> 📅 **Date:** {next_race['race_date']}\n"
            f"> 🔢 **Round:** {next_race.get('round', 'N/A')}\n"
            "\n"
            f"*Type /status to check system health.*"
        )
        return JSONResponse(content={
            "type": CHANNEL_MESSAGE_WITH_SOURCE,
            "data": {"content": content}
        })
    except Exception as e:
        return JSONResponse(content={
            "type": CHANNEL_MESSAGE_WITH_SOURCE,
            "data": {"content": f"❌ Error fetching next GP: {str(e)}"}
        })
