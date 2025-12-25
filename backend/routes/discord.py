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
        data_obj = data.get("data", {})
        command_name = data_obj.get("name")
        options = data_obj.get("options", [])
        
        # Parse options into a dict
        params = {opt['name']: opt['value'] for opt in options} if options else {}
        
        if command_name == "status":
            return await handle_status_command()
        elif command_name == "standings":
            return await handle_standings_command(params.get("year"))
        elif command_name == "results":
            return await handle_results_command()
        elif command_name == "next":
            return await handle_next_gp_command()
        elif command_name == "champions":
            return await handle_champions_command()
            
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
            f"> **Backend:** `v3.0 Autonomous (Discord Active)`\n"
            f"> **Database:** `Supabase Connected`\n"
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

async def handle_standings_command(year: int = None):
    """Handle /standings command with optional year."""
    try:
        client = supabase()
        if not year:
            # Fallback to current year
            res = client.table("seasons").select("year").order("year", desc=True).limit(1).execute()
            year = res.data[0]['year'] if res.data else 2025
        
        drivers = await get_driver_standings(year)
        constructors = await get_constructor_standings(year)
        
        if not drivers and not constructors:
            return JSONResponse(content={
                "type": CHANNEL_MESSAGE_WITH_SOURCE,
                "data": {"content": f"📭 No standings found for **{year}**."}
            })

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

async def handle_results_command():
    """Handle /results command (last race results)."""
    try:
        from database import get_last_race
        race = await get_last_race()
        
        if not race:
            return JSONResponse(content={"type": CHANNEL_MESSAGE_WITH_SOURCE, "data": {"content": "🏁 No completed races found."}})
            
        results = race.get('race_results', [])
        lines = [f"## 🏁 Last Race Results: {race['name']}"]
        lines.append(f"> 📍 {race.get('circuit', 'Unknown')}, {race.get('country', 'N/A')}")
        lines.append(f"> 📅 Date: {race['race_date']}\n")
        
        if results:
            lines.append("**Podium:**")
            for r in sorted(results, key=lambda x: x['position'])[:3]:
                medal = "🥇" if r['position'] == 1 else "🥈" if r['position'] == 2 else "🥉"
                lines.append(f"{medal} `{r['position']}` **{r['driver_name']}** — `{r['team']}`")
            
            lines.append("\n*Full results available in the SilverWall Dashboard.*")
        else:
            lines.append("*No detailed results available for this race.*")
            
        return JSONResponse(content={
            "type": CHANNEL_MESSAGE_WITH_SOURCE,
            "data": {"content": "\n".join(lines)}
        })
    except Exception as e:
        return JSONResponse(content={
            "type": CHANNEL_MESSAGE_WITH_SOURCE,
            "data": {"content": f"❌ Error fetching results: {str(e)}"}
        })

async def handle_champions_command():
    """Handle /champions command."""
    try:
        from routes.standings import get_champions_logic
        champs = await get_champions_logic()
        
        if not champs:
            return JSONResponse(content={"type": CHANNEL_MESSAGE_WITH_SOURCE, "data": {"content": "🏆 No champion data available."}})
            
        content = (
            f"## 👑 F1 World Champions ({champs['year']})\n"
            f"> 🏎️ **Driver:** **{champs['driver']['name']}** ({champs['driver']['team']})\n"
            f"> 🛠️ **Constructor:** **{champs['constructor']['name']}**\n"
            "\n"
            f"*Data sourced from official {champs['year']} standings.*"
        )
        return JSONResponse(content={
            "type": CHANNEL_MESSAGE_WITH_SOURCE,
            "data": {"content": content}
        })
    except Exception as e:
        return JSONResponse(content={
            "type": CHANNEL_MESSAGE_WITH_SOURCE,
            "data": {"content": f"❌ Error fetching champions: {str(e)}"}
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
