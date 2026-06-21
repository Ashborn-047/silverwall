import httpx
import json
import os
from typing import Any, Dict, List, Optional
from logger import logger

SPACETIME_DB_NAME = "spacetimedb-uorks"
SPACETIME_BASE_URL = f"https://maincloud.spacetimedb.com/api/v1/database/{SPACETIME_DB_NAME}"

# We can optionally use a SPACETIME_TOKEN if it's set in the environment
def _get_headers():
    token = os.getenv("SPACETIME_TOKEN")
    if token:
        return {"Authorization": f"Bearer {token}"}
    return {}

async def execute_sql(sql: str) -> List[Dict[str, Any]]:
    """
    Execute a SQL query against SpacetimeDB.
    Returns a list of dictionaries mapping column names to values.
    """
    url = f"{SPACETIME_BASE_URL}/sql"
    payload = {"sql": sql}

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(url, json=payload, headers=_get_headers())

            # The sentinel script says: Maincloud returns 403 without valid auth,
            # but this confirms the server is up and responsive.
            # If we don't have auth, we might just get 403. Let's handle 200 properly.
            if response.status_code == 200:
                data = response.json()
                # If it's a list, return it
                if isinstance(data, list):
                    return data
                # Sometimes it might be {"results": [...] } or similar.
                if isinstance(data, dict):
                    if "rows" in data and isinstance(data["rows"], list):
                        return data["rows"]
                    elif "results" in data and isinstance(data["results"], list):
                        return data["results"]
                    return []
            else:
                logger.error(f"SpacetimeDB SQL error HTTP {response.status_code}: {response.text}")
            return []
    except Exception as e:
        logger.error(f"SpacetimeDB SQL error ({sql}): {e}")
        return []

async def call_reducer(reducer_name: str, args: List[Any] = None) -> bool:
    """
    Call a SpacetimeDB reducer.
    """
    if args is None:
        args = []

    url = f"{SPACETIME_BASE_URL}/call/{reducer_name}"
    payload = {"args": args}

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(url, json=payload, headers=_get_headers())
            if response.status_code == 200:
                return True
            else:
                logger.error(f"SpacetimeDB Reducer error HTTP {response.status_code}: {response.text}")
                return False
    except Exception as e:
        logger.error(f"SpacetimeDB Reducer error ({reducer_name}): {e}")
        return False
