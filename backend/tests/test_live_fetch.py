"""
SilverWall Backend - Unit Tests for OpenF1 Live Data Fetcher
Tests connection pooling, circuit breaker integration, caching, and telemetry aggregation.
"""
import unittest
import asyncio
import time
from unittest.mock import MagicMock, patch, AsyncMock
import sys
import os

# Mock httpx before importing openf1_fetcher
sys.modules["httpx"] = MagicMock()

# Add backend to path to import openf1_fetcher
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Now import
from openf1_fetcher import (
    fetch_live_telemetry, fetch_driver_info, fetch_car_positions,
    fetch_position, fetch_intervals, fetch_stints,
    _driver_cache, _cache_get, _cache_set, _session_key_cache,
    get_http_client, close_http_client
)


def create_response(data, status_code=200):
    """Helper to create mock HTTP responses"""
    resp = MagicMock()
    resp.status_code = status_code
    resp.json.return_value = data
    return resp


class TestCacheUtilities(unittest.TestCase):
    """Test the TTL cache utility functions"""

    def setUp(self):
        _driver_cache.clear()

    def test_cache_set_and_get(self):
        """Test basic cache set and get"""
        _cache_set("test_key", {"driver": "VER"})
        result = _cache_get("test_key")
        self.assertEqual(result, {"driver": "VER"})

    def test_cache_miss(self):
        """Test cache miss returns None"""
        result = _cache_get("nonexistent_key")
        self.assertIsNone(result)

    def test_cache_expiry(self):
        """Test that cache entries expire after TTL"""
        # Manually insert with an old timestamp
        _driver_cache["old_key"] = ({"data": "old"}, time.time() - 400)
        result = _cache_get("old_key")
        self.assertIsNone(result)
        # Expired entry should also be cleaned up
        self.assertNotIn("old_key", _driver_cache)

    def test_cache_eviction(self):
        """Test that cache evicts oldest entries when full"""
        # Fill cache to max (50 entries)
        for i in range(50):
            _cache_set(f"key_{i}", {"data": i})
        
        self.assertEqual(len(_driver_cache), 50)
        
        # Adding one more should evict the oldest
        _cache_set("new_key", {"data": "new"})
        self.assertEqual(len(_driver_cache), 50)
        self.assertIsNotNone(_cache_get("new_key"))


class TestConnectionPooling(unittest.IsolatedAsyncioTestCase):
    """Test the HTTP client connection pooling"""

    async def test_get_http_client_returns_client(self):
        """Test that get_http_client returns the same shared client"""
        import openf1_fetcher
        openf1_fetcher._http_client = None  # Reset

        client1 = await get_http_client()
        client2 = await get_http_client()
        self.assertIs(client1, client2, "Should return the same shared client instance")

    async def test_close_http_client(self):
        """Test that closing the client resets it to None"""
        import openf1_fetcher
        openf1_fetcher._http_client = MagicMock()
        openf1_fetcher._http_client.aclose = AsyncMock()

        await close_http_client()
        self.assertIsNone(openf1_fetcher._http_client)


class TestDriverInfoCaching(unittest.IsolatedAsyncioTestCase):
    """Test driver info fetch with caching"""

    async def asyncSetUp(self):
        """Clear cache before each test"""
        _driver_cache.clear()

    @patch('openf1_fetcher.openf1_breaker')
    @patch('openf1_fetcher.get_http_client')
    async def test_driver_cache_hit(self, mock_get_client, mock_breaker):
        """Test that driver info is cached after first fetch"""
        mock_client = AsyncMock()
        mock_get_client.return_value = mock_client

        mock_response = create_response([
            {"driver_number": 1, "name_acronym": "VER", "full_name": "Max Verstappen",
             "team_name": "Red Bull", "team_colour": "#0000FF"}
        ])

        # Make breaker.call an AsyncMock that returns the response
        mock_breaker.call = AsyncMock(return_value=mock_response)

        # First call - should hit API
        result1 = await fetch_driver_info(session_key=999)
        self.assertEqual(mock_breaker.call.call_count, 1)
        self.assertIn(1, result1)
        self.assertEqual(result1[1]["code"], "VER")

        # Second call with same session_key - should use cache
        result2 = await fetch_driver_info(session_key=999)
        self.assertEqual(mock_breaker.call.call_count, 1)  # No new API call
        self.assertEqual(result1, result2)

        # Third call with different session_key - should hit API again
        result3 = await fetch_driver_info(session_key=888)
        self.assertEqual(mock_breaker.call.call_count, 2)

    @patch('openf1_fetcher.openf1_breaker')
    @patch('openf1_fetcher.get_http_client')
    async def test_driver_info_error_handling(self, mock_get_client, mock_breaker):
        """Test that fetch_driver_info handles errors gracefully"""
        mock_client = AsyncMock()
        mock_get_client.return_value = mock_client

        mock_breaker.call = AsyncMock(side_effect=Exception("Connection failed"))

        result = await fetch_driver_info(session_key=999)
        self.assertEqual(result, {})


class TestLiveTelemetry(unittest.IsolatedAsyncioTestCase):
    """Test the full live telemetry aggregation pipeline"""

    async def asyncSetUp(self):
        """Clear caches before each test"""
        _driver_cache.clear()

    @patch('openf1_fetcher.openf1_breaker')
    @patch('openf1_fetcher.get_http_client')
    async def test_fetch_live_telemetry_aggregation(self, mock_get_client, mock_breaker):
        """Test that fetch_live_telemetry correctly aggregates data from multiple endpoints"""
        mock_client = AsyncMock()
        mock_get_client.return_value = mock_client

        # Setup side effects based on the URL parameter
        async def breaker_side_effect(func, url, params=None):
            if "position" in url:
                return create_response([
                    {"driver_number": 1, "position": 1, "date": "2024-01-01T12:00:01Z"},
                    {"driver_number": 11, "position": 2, "date": "2024-01-01T12:00:01Z"}
                ])
            elif "intervals" in url:
                return create_response([
                    {"driver_number": 1, "interval": 0, "gap_to_leader": 0, "date": "2024-01-01T12:00:01Z"},
                    {"driver_number": 11, "interval": 5.5, "gap_to_leader": 5.5, "date": "2024-01-01T12:00:01Z"}
                ])
            elif "location" in url:
                return create_response([
                    {"driver_number": 1, "x": 100, "y": 200, "z": 0, "date": "2024-01-01T12:00:01Z"},
                    {"driver_number": 11, "x": 150, "y": 250, "z": 0, "date": "2024-01-01T12:00:01Z"}
                ])
            elif "drivers" in url:
                return create_response([
                    {"driver_number": 1, "name_acronym": "VER", "full_name": "Max Verstappen",
                     "team_name": "Red Bull", "team_colour": "#0000FF"},
                    {"driver_number": 11, "name_acronym": "PER", "full_name": "Sergio Perez",
                     "team_name": "Red Bull", "team_colour": "#0000FF"}
                ])
            elif "stints" in url:
                return create_response([
                    {"driver_number": 1, "stint_number": 2, "compound": "HARD", "tyre_age_at_start": 5},
                    {"driver_number": 11, "stint_number": 2, "compound": "MEDIUM", "tyre_age_at_start": 8}
                ])
            return create_response([])

        mock_breaker.call = AsyncMock(side_effect=breaker_side_effect)

        # Call with explicit session_key to skip session key lookup
        result = await fetch_live_telemetry(session_key=123)

        # Verify status
        self.assertEqual(result["status"], "live")
        self.assertEqual(len(result["cars"]), 2)
        self.assertIn("timestamp", result)
        self.assertEqual(result["session_key"], 123)

        # Verify VER (P1)
        ver = result["cars"][0]
        self.assertEqual(ver["driver_number"], 1)
        self.assertEqual(ver["code"], "VER")
        self.assertEqual(ver["position"], 1)
        self.assertEqual(ver["gap"], "LEADER")
        self.assertEqual(ver["tyre"], "HARD")
        self.assertEqual(ver["x"], 100)
        self.assertEqual(ver["y"], 200)

        # Verify PER (P2)
        per = result["cars"][1]
        self.assertEqual(per["driver_number"], 11)
        self.assertEqual(per["code"], "PER")
        self.assertEqual(per["position"], 2)
        self.assertEqual(per["gap"], "+5.5s")
        self.assertEqual(per["tyre"], "MEDIUM")

    async def test_fetch_live_telemetry_no_session(self):
        """Test that fetch_live_telemetry returns offline when no session"""
        import openf1_fetcher
        openf1_fetcher._session_key_cache = None

        with patch('openf1_fetcher.get_latest_session_key', new_callable=AsyncMock, return_value=None):
            result = await fetch_live_telemetry()
            self.assertEqual(result["status"], "offline")
            self.assertEqual(result["cars"], [])

    @patch('openf1_fetcher.openf1_breaker')
    @patch('openf1_fetcher.get_http_client')
    async def test_fetch_live_telemetry_no_data(self, mock_get_client, mock_breaker):
        """Test that fetch_live_telemetry returns waiting when no positions"""
        mock_client = AsyncMock()
        mock_get_client.return_value = mock_client

        # Return empty data for all endpoints
        mock_breaker.call = AsyncMock(return_value=create_response([]))

        result = await fetch_live_telemetry(session_key=123)
        self.assertEqual(result["status"], "waiting")
        self.assertEqual(result["cars"], [])


class TestSessionKeyCache(unittest.IsolatedAsyncioTestCase):
    """Test session key caching"""

    async def asyncSetUp(self):
        import openf1_fetcher
        openf1_fetcher._session_key_cache = None

    @patch('openf1_fetcher.openf1_breaker')
    @patch('openf1_fetcher.get_http_client')
    async def test_session_key_cached(self, mock_get_client, mock_breaker):
        """Test that session key is cached for 30 seconds"""
        from openf1_fetcher import get_latest_session_key
        import openf1_fetcher

        mock_client = AsyncMock()
        mock_get_client.return_value = mock_client

        mock_breaker.call = AsyncMock(
            return_value=create_response([{"session_key": 9999, "date_end": None}])
        )

        # First call
        key1 = await get_latest_session_key()
        self.assertEqual(key1, 9999)
        self.assertEqual(mock_breaker.call.call_count, 1)

        # Second call - should use cache
        key2 = await get_latest_session_key()
        self.assertEqual(key2, 9999)
        self.assertEqual(mock_breaker.call.call_count, 1)  # No new API call


class TestCircuitBreakerIntegration(unittest.IsolatedAsyncioTestCase):
    """Test circuit breaker behavior"""

    async def asyncSetUp(self):
        _driver_cache.clear()

    @patch('openf1_fetcher.openf1_breaker')
    @patch('openf1_fetcher.get_http_client')
    async def test_api_failure_returns_empty(self, mock_get_client, mock_breaker):
        """Test that API failure returns empty gracefully"""
        mock_client = AsyncMock()
        mock_get_client.return_value = mock_client

        mock_breaker.call = AsyncMock(side_effect=Exception("Circuit open"))

        positions = await fetch_car_positions(session_key=123)
        self.assertEqual(positions, [])

        intervals = await fetch_intervals(session_key=123)
        self.assertEqual(intervals, [])

        stints = await fetch_stints(session_key=123)
        self.assertEqual(stints, {})

    @patch('openf1_fetcher.openf1_breaker')
    @patch('openf1_fetcher.get_http_client')
    async def test_http_error_returns_empty(self, mock_get_client, mock_breaker):
        """Test that HTTP errors (non-200) return empty data"""
        mock_client = AsyncMock()
        mock_get_client.return_value = mock_client

        mock_breaker.call = AsyncMock(return_value=create_response([], status_code=500))

        positions = await fetch_car_positions(session_key=123)
        self.assertEqual(positions, [])


if __name__ == '__main__':
    unittest.main()
