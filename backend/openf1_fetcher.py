"""
SilverWall - OpenF1 Live Data Fetcher
Fetches real-time car positions and telemetry from OpenF1 API
"""

import httpx
import asyncio
import time
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict
from pybreaker import CircuitBreaker

OPENF1_API = "https://api.openf1.org/v1"

# Module-level HTTP client for connection pooling
_http_client: Optional[httpx.AsyncClient] = None

# Circuit breaker for OpenF1 API
openf1_breaker = CircuitBreaker(
    fail_max=5,  # Open circuit after 5 consecutive failures
    reset_timeout=60,  # Wait 60 seconds before attempting to close circuit
    exclude=[httpx.HTTPStatusError]  # Don't count HTTP errors as circuit failures
)

# Cache for static driver data with TTL
# Format: { "drivers_{session_key}": (data, timestamp) }
_driver_cache: Dict[str, tuple] = {}
_CACHE_TTL_SECONDS = 300  # 5 minutes
_CACHE_MAX_SIZE = 50

# Cache for session key with shorter TTL
_session_key_cache: Optional[tuple] = None  # (session_key, timestamp)
_SESSION_KEY_TTL = 30  # 30 seconds - reduce repeated API calls

# Cache full telemetry snapshots so each WebSocket client does not create its
# own burst of OpenF1 requests. OpenF1's free tier is intentionally modest.
_telemetry_cache: Optional[tuple] = None  # (payload, timestamp)
_LIVE_TELEMETRY_TTL = 4
_IDLE_TELEMETRY_TTL = 30
_LIVE_WINDOW_PADDING = timedelta(minutes=30)


async def get_http_client() -> httpx.AsyncClient:
    """Get or create the shared HTTP client with connection pooling."""
    global _http_client
    if _http_client is None:
        _http_client = httpx.AsyncClient(
            timeout=10.0,
            limits=httpx.Limits(
                max_connections=50,  # Max concurrent connections
                max_keepalive_connections=20  # Keep connections alive for reuse
            )
        )
    return _http_client


async def close_http_client():
    """Close the shared HTTP client. Called on shutdown."""
    global _http_client
    if _http_client is not None:
        await _http_client.aclose()
        _http_client = None


def _cache_get(key: str) -> Optional[Dict]:
    """Get a value from cache if it exists and hasn't expired."""
    if key in _driver_cache:
        data, ts = _driver_cache[key]
        if time.time() - ts < _CACHE_TTL_SECONDS:
            return data
        else:
            del _driver_cache[key]
    return None


def _cache_set(key: str, data: Dict) -> None:
    """Set a value in cache with TTL, evicting oldest if max size reached."""
    # Evict oldest entries if cache is too large
    while len(_driver_cache) >= _CACHE_MAX_SIZE:
        oldest_key = min(_driver_cache, key=lambda k: _driver_cache[k][1])
        del _driver_cache[oldest_key]
    _driver_cache[key] = (data, time.time())


def _parse_openf1_datetime(value: Optional[str]) -> Optional[datetime]:
    """Parse OpenF1 ISO timestamps into timezone-aware UTC datetimes."""
    if not value:
        return None

    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc)
    except ValueError:
        return None


def is_session_in_live_window(session: Dict) -> bool:
    """
    OpenF1 now classifies live data by time window, not only by null date_end.
    Treat sessions as active from 30 minutes before start through 30 minutes
    after end, matching OpenF1's own live/historical boundary.
    """
    if session.get("date_end") is None:
        return True

    now = datetime.now(timezone.utc)
    start = _parse_openf1_datetime(session.get("date_start"))
    end = _parse_openf1_datetime(session.get("date_end"))

    if start and end:
        return (start - _LIVE_WINDOW_PADDING) <= now <= (end + _LIVE_WINDOW_PADDING)
    if start:
        return now >= (start - _LIVE_WINDOW_PADDING)
    return False


def _get_telemetry_cache() -> Optional[Dict]:
    if _telemetry_cache is None:
        return None

    payload, ts = _telemetry_cache
    ttl = _LIVE_TELEMETRY_TTL if payload.get("status") == "live" else _IDLE_TELEMETRY_TTL
    if time.time() - ts < ttl:
        return payload
    return None


def _set_telemetry_cache(payload: Dict) -> Dict:
    global _telemetry_cache
    _telemetry_cache = (payload, time.time())
    return payload


async def get_latest_session_key() -> Optional[int]:
    """Get the current/latest session key from OpenF1. Results are cached for 30s."""
    global _session_key_cache

    # Check cache first
    if _session_key_cache is not None:
        session_key, ts = _session_key_cache
        if time.time() - ts < _SESSION_KEY_TTL:
            return session_key

    try:
        client = await get_http_client()
        response = await openf1_breaker.call(
            client.get, f"{OPENF1_API}/sessions", params={"session_key": "latest"}
        )
        if response.status_code == 200:
            data = response.json()
            if data:
                session = data[0]
                # Only return sessions that are currently in OpenF1's live window.
                if is_session_in_live_window(session):
                    session_key = session.get("session_key")
                    # Cache the result
                    _session_key_cache = (session_key, time.time())
                    return session_key
    except Exception as e:
        print(f"Error getting session key: {e}")
    return None


async def fetch_car_positions(session_key: int = None) -> List[Dict]:
    """Fetch current car positions from OpenF1"""
    try:
        client = await get_http_client()
        params = {}
        if session_key:
            params["session_key"] = session_key
        else:
            params["session_key"] = "latest"

        # Get location data (x, y coordinates)
        response = await openf1_breaker.call(
            client.get, f"{OPENF1_API}/location", params=params
        )
        if response.status_code == 200:
            data = response.json()
            if data:
                # Group by driver_number and get latest position for each
                latest_positions = {}
                for entry in data:
                    driver_num = entry.get("driver_number")
                    if driver_num:
                        # Keep the most recent entry for each driver
                        if driver_num not in latest_positions or entry.get("date", "") > latest_positions[driver_num].get("date", ""):
                            latest_positions[driver_num] = entry

                return list(latest_positions.values())
    except Exception as e:
        print(f"Error fetching car positions: {e}")
    return []


async def fetch_driver_info(session_key: Optional[int] = None) -> Dict[int, Dict]:
    """Fetch driver info (name, team) from OpenF1. Results are cached per session."""
    # Check cache first
    cache_key = f"drivers_{session_key}" if session_key else "drivers_latest"
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached

    try:
        client = await get_http_client()
        params = {}
        if session_key:
            params["session_key"] = session_key
        else:
            params["session_key"] = "latest"

        response = await openf1_breaker.call(
            client.get, f"{OPENF1_API}/drivers", params=params
        )
        if response.status_code == 200:
            data = response.json()
            drivers = {}
            for d in data:
                driver_num = d.get("driver_number")
                if driver_num:
                    drivers[driver_num] = {
                        "code": d.get("name_acronym", f"#{driver_num}"),
                        "name": d.get("full_name", "Unknown"),
                        "team": d.get("team_name", "Unknown"),
                        "color": d.get("team_colour", "#00D2BE"),
                    }

            # Cache the result if we have drivers
            if drivers:
                _cache_set(cache_key, drivers)
            return drivers
    except Exception as e:
        print(f"Error fetching driver info: {e}")
    return {}


async def fetch_stints(session_key: int = None) -> Dict[int, Dict]:
    """Fetch latest tyre stint for each driver"""
    try:
        client = await get_http_client()
        params = {}
        if session_key:
            params["session_key"] = session_key
        else:
            params["session_key"] = "latest"

        response = await openf1_breaker.call(
            client.get, f"{OPENF1_API}/stints", params=params
        )
        if response.status_code == 200:
            data = response.json()
            stints = {}
            for s in data:
                driver_num = s.get("driver_number")
                if driver_num:
                    # Keep latest stint
                    if driver_num not in stints or s.get("stint_number") > stints[driver_num].get("stint_number"):
                        stints[driver_num] = s
            return stints
    except Exception as e:
        print(f"Error fetching stints: {e}")
    return {}


async def fetch_intervals(session_key: Optional[int] = None) -> List[Dict]:
    """Fetch gap intervals between drivers for leaderboard"""
    try:
        client = await get_http_client()
        params = {}
        if session_key:
            params["session_key"] = session_key
        else:
            params["session_key"] = "latest"

        response = await openf1_breaker.call(
            client.get, f"{OPENF1_API}/intervals", params=params
        )
        if response.status_code == 200:
            data = response.json()
            # Get latest interval for each driver
            latest = {}
            for entry in data:
                driver_num = entry.get("driver_number")
                if driver_num:
                    if driver_num not in latest or entry.get("date", "") > latest[driver_num].get("date", ""):
                        latest[driver_num] = entry
            return list(latest.values())
    except Exception as e:
        print(f"Error fetching intervals: {e}")
    return []


async def fetch_position(session_key: Optional[int] = None) -> List[Dict]:
    """Fetch current race positions for leaderboard"""
    try:
        client = await get_http_client()
        params = {}
        if session_key:
            params["session_key"] = session_key
        else:
            params["session_key"] = "latest"

        response = await openf1_breaker.call(
            client.get, f"{OPENF1_API}/position", params=params
        )
        if response.status_code == 200:
            data = response.json()
            # Get latest position for each driver
            latest = {}
            for entry in data:
                driver_num = entry.get("driver_number")
                if driver_num:
                    if driver_num not in latest or entry.get("date", "") > latest[driver_num].get("date", ""):
                        latest[driver_num] = entry
            return sorted(latest.values(), key=lambda x: x.get("position", 999))
    except Exception as e:
        print(f"Error fetching positions: {e}")
    return []


async def fetch_live_telemetry(session_key: int = None) -> Dict:
    """
    Fetch live telemetry data combining positions, intervals, stints, and driver info.
    Returns data ready for WebSocket broadcast, SORTED by race position.
    """
    should_cache_snapshot = session_key is None

    if should_cache_snapshot:
        cached_payload = _get_telemetry_cache()
        if cached_payload is not None:
            return cached_payload

    session_key = session_key or await get_latest_session_key()

    def maybe_cache(payload: Dict) -> Dict:
        return _set_telemetry_cache(payload) if should_cache_snapshot else payload
    
    if not session_key:
        return maybe_cache({
            "status": "offline",
            "cars": [],
            "message": "No active session",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

    # Fetch all data in parallel using asyncio.gather
    try:
        results = await asyncio.gather(
            fetch_position(session_key),
            fetch_intervals(session_key),
            fetch_car_positions(session_key),
            fetch_driver_info(session_key),
            fetch_stints(session_key),
            return_exceptions=True  # Don't crash if one fails
        )

        # Unpack results, handling potential exceptions
        race_positions = results[0] if isinstance(results[0], list) else []
        intervals = results[1] if isinstance(results[1], list) else []
        locations = results[2] if isinstance(results[2], list) else []
        drivers = results[3] if isinstance(results[3], dict) else {}
        stints = results[4] if isinstance(results[4], dict) else {}

    except Exception as e:
        print(f"Critical error in parallel fetch: {e}")
        return maybe_cache({"status": "error", "cars": [], "message": str(e)})
    
    if not race_positions and not locations:
        return maybe_cache({
            "status": "waiting",
            "cars": [],
            "session_key": session_key,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

    # Build lookup maps with None filtering (single pass, more efficient)
    interval_map = {i["driver_number"]: i for i in intervals if i.get("driver_number")}
    location_map = {loc["driver_number"]: loc for loc in locations if loc.get("driver_number")}

    # If we have race positions, use that as the primary list
    # If not (e.g. practice session where position might be weird or missing), fall back to location keys

    primary_list = race_positions if race_positions else [{"driver_number": k} for k in location_map.keys()]

    # Build car data with list comprehension (pre-filter invalid entries)
    def build_car_data(entry):
        """Helper function to build car data dictionary"""
        driver_num = entry.get("driver_number")
        if not driver_num:
            return None

        driver_info = drivers.get(driver_num, {"code": f"#{driver_num}", "team": "Unknown", "color": "#555"})
        loc = location_map.get(driver_num, {})
        interval_data = interval_map.get(driver_num, {})
        stint_data = stints.get(driver_num, {})

        # Simplified gap calculation
        position = entry.get("position", 0)
        gap = interval_data.get("gap_to_leader") or interval_data.get("interval")
        gap_str = "LEADER" if position == 1 else (f"+{gap}s" if gap is not None else "--")

        return {
            "position": position,
            "driver_number": driver_num,
            "code": driver_info["code"],
            "team": driver_info["team"],
            "color": driver_info["color"],
            "x": loc.get("x", 0),
            "y": loc.get("y", 0),
            "z": loc.get("z", 0),
            "gap": gap_str,
            "interval": interval_data.get("interval"),
            "tyre": stint_data.get("compound", "UNKNOWN"),
            "tyre_age": stint_data.get("tyre_age_at_start", 0),
        }

    # Build and filter cars list in one pass
    cars = [car for car in (build_car_data(entry) for entry in primary_list) if car is not None]

    # Sort by position (using optimized key function)
    cars.sort(key=lambda x: x["position"] or 999)
    
    payload = {
        "status": "live",
        "session_key": session_key,
        "cars": cars,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    return maybe_cache(payload)
