"""
SilverWall Sentinel
Autonomous Health, Security, and Infrastructure Monitor.
"""

import os
import httpx
import asyncio
import subprocess
import json
from datetime import datetime, timezone

# Configuration
FRONTEND_URL = "https://silverwall.vercel.app"  # Update to github pages if needed, but vercel is usually preferred
SPACETIME_DB_NAME = "spacetimedb-uorks"
SPACETIME_URL = f"https://maincloud.spacetimedb.com/api/v1/database/{SPACETIME_DB_NAME}/sql"
DISCORD_WEBHOOK = os.getenv("DISCORD_WEBHOOK_URL")

async def check_frontend():
    """Ping the frontend and return status and latency."""
    try:
        async with httpx.AsyncClient() as client:
            start = datetime.now()
            # Follow redirects in case of trailing slashes or http->https
            response = await client.get(FRONTEND_URL, follow_redirects=True, timeout=10.0)
            latency = (datetime.now() - start).total_seconds() * 1000
            
            if response.status_code == 200:
                return True, f"🟢 ONLINE ({int(latency)}ms)"
            else:
                return False, f"🔴 ERROR HTTP {response.status_code}"
    except Exception as e:
        return False, f"🔴 UNREACHABLE ({str(e)})"

async def check_spacetimedb():
    """Ping SpacetimeDB to ensure the database is alive."""
    try:
        async with httpx.AsyncClient() as client:
            start = datetime.now()
            # A simple query to check database health
            payload = {"sql": "SELECT 1"}
            response = await client.post(SPACETIME_URL, json=payload, timeout=10.0)
            latency = (datetime.now() - start).total_seconds() * 1000
            
            # Maincloud returns 403 without valid auth, but this confirms the server is up and responsive.
            if response.status_code in [200, 403]:
                return True, f"🟢 RESPONSIVE ({int(latency)}ms) - HTTP {response.status_code}"
            else:
                return False, f"🔴 API ERROR HTTP {response.status_code}"
    except Exception as e:
        return False, f"🔴 UNREACHABLE ({str(e)})"

def run_security_audit():
    """Run npm audit on the frontend to detect vulnerabilities."""
    try:
        print("Running npm audit...")
        # We run from the 'backend' directory in GitHub Actions, so we must go up one level
        repo_root = os.path.dirname(os.getcwd())
        project_dir = os.path.join(repo_root, 'Silverwall UIUX design system')
        if not os.path.exists(project_dir):
            return "⚠️ Security Scan Skipped: Frontend directory not found."
            
        result = subprocess.run(
            ['npm', 'audit', '--json'], 
            cwd=project_dir,
            capture_output=True,
            text=True
        )
        
        # npm audit exits with 0 if no vulnerabilities, 1+ if vulnerabilities exist
        try:
            audit_data = json.loads(result.stdout)
            vulns = audit_data.get('metadata', {}).get('vulnerabilities', {})
            high = vulns.get('high', 0)
            critical = vulns.get('critical', 0)
            
            if high == 0 and critical == 0:
                return f"✅ **Dependencies:** 0 Critical, 0 High vulnerabilities."
            else:
                vuln_dict = audit_data.get('vulnerabilities', {})
                bad_packages = []
                for pkg, details in vuln_dict.items():
                    if isinstance(details, dict) and details.get('severity') in ['high', 'critical']:
                        bad_packages.append(f"`{pkg}` ({details.get('severity')})")
                
                # Truncate if there are too many to avoid Discord embed limits
                if len(bad_packages) > 10:
                    pkg_str = ", ".join(bad_packages[:10]) + f", and {len(bad_packages)-10} more..."
                else:
                    pkg_str = ", ".join(bad_packages) if bad_packages else "See action logs."
                    
                return f"⚠️ **WARNING:** {critical} Critical, {high} High vulnerabilities.\n**Affected:** {pkg_str}"
        except json.JSONDecodeError:
            return "⚠️ Security Scan Failed: Could not parse npm audit output."
            
    except Exception as e:
        return f"⚠️ Security Scan Failed: {str(e)}"

async def send_discord_alert(frontend_status, spacetime_status, security_status):
    """Send the compiled report to Discord."""
    if not DISCORD_WEBHOOK:
        print("WARNING: DISCORD_WEBHOOK_URL not set. Printing to console instead.")
        print(frontend_status)
        print(spacetime_status)
        print(security_status)
        return

    # Determine overall status color (Red if any system is down)
    color = 0x00D2BE # Silverwall Teal
    if "🔴" in frontend_status or "🔴" in spacetime_status or "⚠️" in security_status:
        color = 0xFF3B30 # Red for errors
        
    payload = {
        "username": "SilverWall Sentinel",
        "avatar_url": "https://raw.githubusercontent.com/f1-telemetry/silverwall/main/docs/assets/logo.png",
        "embeds": [
            {
                "title": "🛡️ SilverWall Sentinel Report",
                "color": color,
                "description": f"> 📅 **Timestamp:** {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}",
                "fields": [
                    {
                        "name": "Infrastructure Status",
                        "value": f"🌍 **Frontend:** {frontend_status}\n🚀 **SpacetimeDB:** {spacetime_status}",
                        "inline": False
                    },
                    {
                        "name": "Security Audit",
                        "value": security_status,
                        "inline": False
                    }
                ],
                "footer": {
                    "text": "SILVERWALL_SENTINEL_V2.0_ACTIVE"
                }
            }
        ]
    }
    
    try:
        async with httpx.AsyncClient() as client:
            await client.post(DISCORD_WEBHOOK, json=payload)
            print("Alert sent to Discord successfully.")
    except Exception as e:
        print(f"Failed to send Discord alert: {e}")

async def run_sentinel():
    """Main execution flow."""
    print(f"Starting Sentinel scan: {datetime.now(timezone.utc)}")
    
    front_ok, front_status = await check_frontend()
    st_ok, st_status = await check_spacetimedb()
    sec_status = run_security_audit()
    
    await send_discord_alert(front_status, st_status, sec_status)
    
    if not front_ok or not st_ok:
        print("ERROR: One or more systems are down!")
        # We can sys.exit(1) here if we want the GitHub Action to fail
        # but usually we just want the Discord alert.
        
if __name__ == "__main__":
    asyncio.run(run_sentinel())
