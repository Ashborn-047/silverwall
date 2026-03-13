import asyncio
import sys
import unittest
sys.path.append("backend")
from routes.track import get_current_track, get_track
from unittest.mock import AsyncMock

class DummyRequest:
    pass

class TestTrack(unittest.IsolatedAsyncioTestCase):
    async def test_get_track_found(self):
        res = await get_track(DummyRequest(), "bahrain")
        self.assertNotIn("error", res)
        self.assertIn("points", res)
        self.assertTrue(len(res["points"]) > 0)

    async def test_get_track_not_found(self):
        res = await get_track(DummyRequest(), "nonexistent_track_12345")
        self.assertIn("error", res)

if __name__ == "__main__":
    unittest.main()
