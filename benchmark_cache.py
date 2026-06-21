import timeit
import time
from typing import Optional, Any, Dict

_query_cache: Dict[str, tuple] = {}
_CACHE_TTL = 300

def _get_cache(key: str, ttl: int = _CACHE_TTL) -> Optional[Any]:
    if key in _query_cache:
        data, timestamp = _query_cache[key]
        if time.time() - timestamp < ttl:
            return data
        else:
            del _query_cache[key]
    return None

def _set_cache(key: str, data: Any) -> None:
    _query_cache[key] = (data, time.time())

# Setup cache
_set_cache("current_season_year", 2025)

def test_without_ttl():
    return _get_cache("current_season_year")

def test_with_ttl():
    return _get_cache("current_season_year", ttl=300)

if __name__ == "__main__":
    n_iterations = 10_000_000
    time_without = timeit.timeit(test_without_ttl, number=n_iterations)
    time_with = timeit.timeit(test_with_ttl, number=n_iterations)

    print(f"Time without explicit ttl (baseline): {time_without:.4f} seconds")
    print(f"Time with explicit ttl=300 (proposed): {time_with:.4f} seconds")
    diff = time_with - time_without
    pct = (diff / time_without) * 100
    print(f"Difference: {diff:.4f} seconds ({pct:+.2f}%)")
