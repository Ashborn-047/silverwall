"""
SilverWall - Radio Transcripts API
Fetches team radio messages from OpenF1 API
"""

from fastapi import APIRouter
from datetime import datetime, timezone
from typing import List, Optional
import httpx

router = APIRouter()

OPENF1_API = "https://api.openf1.org/v1"

# Driver code to name mapping
DRIVER_NAMES = {
    "HAM": "Lewis Hamilton",
    "VER": "Max Verstappen",
    "LEC": "Charles Leclerc",
    "SAI": "Carlos Sainz",
    "NOR": "Lando Norris",
    "PER": "Sergio Perez",
    "RUS": "George Russell",
    "ALO": "Fernando Alonso",
    "STR": "Lance Stroll",
    "GAS": "Pierre Gasly",
    "OCO": "Esteban Ocon",
    "ALB": "Alex Albon",
    "TSU": "Yuki Tsunoda",
    "RIC": "Daniel Ricciardo",
    "MAG": "Kevin Magnussen",
    "HUL": "Nico Hulkenberg",
    "BOT": "Valtteri Bottas",
    "ZHO": "Zhou Guanyu",
    "SAR": "Logan Sargeant",
    "PIA": "Oscar Piastri",
}


async def fetch_radio_from_openf1(session_key: str = "latest", limit: int = 10):
    """Fetch team radio from OpenF1 API"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{OPENF1_API}/team_radio",
                params={"session_key": session_key}
            )
            if response.status_code == 200:
                data = response.json()
                # Return latest messages
                return data[-limit:] if len(data) > limit else data
    except Exception as e:
        print(f"Error fetching radio: {e}")
    return []


@router.get("/radio")
async def get_radio_messages(session_key: str = "latest", limit: int = 10):
    """
    Get team radio messages from the current session.
    
    Note: OpenF1 team_radio endpoint may have limited data.
    Falls back to empty list if no data available.
    """
    messages = await fetch_radio_from_openf1(session_key, limit)
    
    formatted = []
    for msg in messages:
        driver_num = msg.get("driver_number")
        # Map number to code if possible
        driver_code = next(
            (code for code, name in DRIVER_NAMES.items() 
             if str(driver_num) in str(msg.get("driver_number", ""))),
            f"#{driver_num}" if driver_num else "TEAM"
        )
        
        formatted.append({
            "driver": driver_code,
            "driver_number": driver_num,
            "recording_url": msg.get("recording_url"),
            "timestamp": msg.get("date"),
        })
    
    return {
        "source": "openf1" if formatted else "none",
        "messages": formatted,
        "count": len(formatted),
    }


@router.get("/radio/demo")
async def get_demo_radio():
    """Get demo radio messages for testing UI"""
    demo_messages = [
        {"driver": "HAM", "message": "These tyres are completely gone!", "team": "Mercedes"},
        {"driver": "VER", "message": "He pushed me off the track!", "team": "Red Bull"},
        {"driver": "LEC", "message": "Box box, box box", "team": "Ferrari"},
        {"driver": "NOR", "message": "This is mega pace guys!", "team": "McLaren"},
        {"driver": "ALO", "message": "What is this power?!", "team": "Aston Martin"},
        {"driver": "RUS", "message": "Copy, we're looking good", "team": "Mercedes"},
        {"driver": "SAI", "message": "Pronto? Plan B, Plan B", "team": "Ferrari"},
        {"driver": "PER", "message": "Track limits, what happened?", "team": "Red Bull"},
    ]
    
    return {
        "source": "demo",
        "messages": demo_messages,
        "count": len(demo_messages),
    }
