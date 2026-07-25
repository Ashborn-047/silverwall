import unittest
from unittest.mock import patch, MagicMock
import sys
import asyncio

# Create mock for spacetimedb
mock_spacetimedb = MagicMock()

async def mock_execute_sql(query):
    if "SELECT MAX(season_year)" in query:
        return [{"year": 2024}]
    elif "SELECT * FROM race " in query:
        return [
            {"race_key": 1, "season_year": 2024, "meeting_name": "Bahrain Grand Prix", "location": "Sakhir", "date": "2024-03-02", "status": "ended"}
        ]
    elif "SELECT * FROM race_result" in query:
        return [
            {"race_key": 1, "driver_name": "Max Verstappen", "team": "Red Bull", "position": 1},
            {"race_key": 1, "driver_name": "Sergio Perez", "team": "Red Bull", "position": 2}
        ]
    return []

mock_spacetimedb.execute_sql = mock_execute_sql
sys.modules['spacetimedb'] = mock_spacetimedb

from backend.database import get_season_races

class TestDatabaseFunctions(unittest.IsolatedAsyncioTestCase):
    async def test_get_season_races_optimization(self):
        races = await get_season_races(2024)

        self.assertEqual(len(races), 1)
        self.assertEqual(races[0]["id"], 1)
        self.assertEqual(races[0]["name"], "Bahrain Grand Prix")
        self.assertEqual(len(races[0]["race_results"]), 2)

        # Verify race result details
        self.assertEqual(races[0]["race_results"][0]["driver_name"], "Max Verstappen")
        self.assertEqual(races[0]["race_results"][0]["driver_code"], "VER")

if __name__ == "__main__":
    unittest.main()
