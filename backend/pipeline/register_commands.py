import os
import httpx
from dotenv import load_dotenv

# Load credentials
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../env', '.env.supabase'))

APP_ID = os.getenv("DISCORD_APP_ID")
BOT_TOKEN = os.getenv("DISCORD_BOT_TOKEN")  # Need to add this to .env

if not APP_ID or not BOT_TOKEN:
    print("❌ Error: DISCORD_APP_ID or DISCORD_BOT_TOKEN not found in .env.supabase")
    exit(1)

URL = f"https://discord.com/api/v10/applications/{APP_ID}/commands"

COMMANDS = [
    {
        "name": "status",
        "description": "Check SilverWall system health and next race status"
    },
    {
        "name": "standings",
        "description": "Get current F1 championship standings (Drivers & Constructors)"
    },
    {
        "name": "next",
        "description": "Get detailed info about the upcoming Grand Prix"
    }
]

def register_commands():
    headers = {
        "Authorization": f"Bot {BOT_TOKEN}",
        "Content-Type": "application/json"
    }
    
    print(f"Registering {len(COMMANDS)} commands for App ID: {APP_ID}...")
    
    with httpx.Client() as client:
        response = client.put(URL, headers=headers, json=COMMANDS)
        
        if response.status_code in [200, 201]:
            print("✅ Successfully registered slash commands!")
            print(f"Commands: {', '.join([c['name'] for c in COMMANDS])}")
        else:
            print(f"❌ Failed to register commands: {response.status_code}")
            print(response.text)

if __name__ == "__main__":
    register_commands()
