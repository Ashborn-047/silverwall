import sys
import unittest
from unittest.mock import MagicMock, patch
import os

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

class TestCORSSecurity(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Start a scoped patch for sys.modules during this test class execution
        cls.modules_patcher = patch.dict('sys.modules', {
            "fastapi": MagicMock(),
            "fastapi.middleware.cors": MagicMock(),
            "fastapi.middleware.gzip": MagicMock(),
            "slowapi": MagicMock(),
            "slowapi.errors": MagicMock(),
            "limiter": MagicMock(),
            "logger": MagicMock(),
            "middleware.request_tracking": MagicMock(),
            "websocket.live": MagicMock(),
            "routes.track": MagicMock(),
            "routes.status": MagicMock(),
            "routes.commentary": MagicMock(),
            "routes.radio": MagicMock(),
            "routes.results": MagicMock(),
            "routes.standings": MagicMock(),
            "routes.discord": MagicMock(),
            "openf1_fetcher": MagicMock(),
        })
        cls.modules_patcher.start()

    @classmethod
    def tearDownClass(cls):
        cls.modules_patcher.stop()

    def test_cors_configuration(self):
        # Import inside the test method when mocks are active
        from fastapi.middleware.cors import CORSMiddleware
        import main

        # Verify app.add_middleware was called with CORSMiddleware
        add_middleware_mock = main.app.add_middleware
        self.assertTrue(add_middleware_mock.called, "app.add_middleware should be called")

        # Find the call to add_middleware that configures CORSMiddleware
        cors_call_kwargs = None
        for call in add_middleware_mock.call_args_list:
            args, kwargs = call
            if args and args[0] is CORSMiddleware:
                cors_call_kwargs = kwargs
                break

        self.assertIsNotNone(cors_call_kwargs, "CORSMiddleware should be added to the app")

        # Verify methods
        allowed_methods = cors_call_kwargs.get("allow_methods", [])
        self.assertEqual(
            sorted(allowed_methods),
            ["GET", "OPTIONS", "POST"],
            "CORS allow_methods should be restricted to GET, POST, and OPTIONS"
        )
        self.assertNotIn("*", allowed_methods, "Wildcard '*' should not be used for methods")

        # Verify headers
        allowed_headers = cors_call_kwargs.get("allow_headers", [])
        self.assertNotIn("*", allowed_headers, "Wildcard '*' should not be used for headers")

        expected_headers = [
            "Accept",
            "Accept-Language",
            "Content-Language",
            "Content-Type",
            "Authorization",
            "Origin",
            "X-Signature-Ed25519",
            "X-Signature-Timestamp",
        ]

        for header in expected_headers:
            self.assertIn(header, allowed_headers, f"Expected header {header} to be allowed")

if __name__ == "__main__":
    unittest.main()
