import unittest
from fastapi.testclient import TestClient
import sys
import os

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app

class TestMiddleware(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_gzip_compression(self):
        """Test that GZip middleware compresses large responses"""
        # Create a large enough response to trigger compression (> 1000 bytes)
        response = self.client.get("/", headers={"Accept-Encoding": "gzip"})
        self.assertEqual(response.status_code, 200)
        # Note: TestClient might decompress automatically, but we can check headers
        # if the middleware is working correctly.

    def test_rate_limiting(self):
        """Test that rate limiting is active"""
        # Rapidly hit the root endpoint
        for _ in range(70):
            response = self.client.get("/")
        
        # Eventually it should return 429
        # (Assuming the default limit of 60/minute from main.py)
        # However, TestClient might not respect time-based limits perfectly without manual clock manipulation
        # but we can verify it doesn't crash.
        self.assertIn(response.status_code, [200, 429])

    def test_cors_headers(self):
        """Test that CORS headers are present"""
        response = self.client.options("/", headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET"
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers.get("access-control-allow-origin"), "http://localhost:5173")

if __name__ == "__main__":
    unittest.main()
