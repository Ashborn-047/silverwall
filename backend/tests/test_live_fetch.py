import unittest
import asyncio
from unittest.mock import MagicMock, patch, AsyncMock
import sys
import os

# Mock httpx before importing openf1_fetcher
sys.modules["httpx"] = MagicMock()

# Add backend to path to import openf1_fetcher
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Now import
from openf1_fetcher import fetch_live_telemetry, fetch_driver_info, _driver_cache

class TestLiveFetch(unittest.IsolatedAsyncioTestCase):

    async def asyncSetUp(self):
        """Clear cache before each test"""
        _driver_cache.clear()

    @patch('openf1_fetcher.httpx.AsyncClient')
    async def test_fetch_live_telemetry_concurrent(self, mock_client_cls):
        """Test that fetch_live_telemetry aggregates data correctly"""

        # Mock the client instance
        mock_client = AsyncMock()
        mock_client_cls.return_value.__aenter__.return_value = mock_client

        # Helper to create mock responses
        def create_response(data):
            resp = MagicMock()
            resp.status_code = 200
            resp.json.return_value = data
            return resp

        # Setup side effects for different endpoints
        async def side_effect(url, params=None):
            if "sessions" in url:
                return create_response([{"session_key": 123, "date_end": None}])
            elif "position" in url:
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
                    {"driver_number": 1, "name_acronym": "VER", "full_name": "Max Verstappen", "team_name": "Red Bull", "team_colour": "#0000FF"},
                    {"driver_number": 11, "name_acronym": "PER", "full_name": "Sergio Perez", "team_name": "Red Bull", "team_colour": "#0000FF"}
                ])
            elif "stints" in url:
                return create_response([
                    {"driver_number": 1, "stint_number": 2, "compound": "HARD", "tyre_age_at_start": 5},
                    {"driver_number": 11, "stint_number": 2, "compound": "MEDIUM", "tyre_age_at_start": 8}
                ])
            return create_response([])

        mock_client.get.side_effect = side_effect

        # Call the function
        result = await fetch_live_telemetry(session_key=123)

        # Assertions
        self.assertEqual(result["status"], "live")
        self.assertEqual(len(result["cars"]), 2)

        ver = result["cars"][0]
        self.assertEqual(ver["driver_number"], 1)
        self.assertEqual(ver["code"], "VER")
        self.assertEqual(ver["gap"], "LEADER")
        self.assertEqual(ver["tyre"], "HARD")

        per = result["cars"][1]
        self.assertEqual(per["driver_number"], 11)
        self.assertEqual(per["code"], "PER")
        self.assertEqual(per["gap"], "+5.5s")
        self.assertEqual(per["tyre"], "MEDIUM")

    @patch('openf1_fetcher.httpx.AsyncClient')
    async def test_driver_cache(self, mock_client_cls):
        """Test that driver info is cached"""
        mock_client = AsyncMock()
        mock_client_cls.return_value.__aenter__.return_value = mock_client

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = [
             {"driver_number": 1, "name_acronym": "VER", "full_name": "Max Verstappen", "team_name": "Red Bull"}
        ]
        mock_client.get.return_value = mock_response

        # First call - should hit API
        await fetch_driver_info(session_key=999)
        self.assertEqual(mock_client.get.call_count, 1)

        # Second call - should use cache
        await fetch_driver_info(session_key=999)
        self.assertEqual(mock_client.get.call_count, 1) # Count should not increase

        # Call with different session key - should hit API
        await fetch_driver_info(session_key=888)
        self.assertEqual(mock_client.get.call_count, 2)

if __name__ == '__main__':
    unittest.main()
