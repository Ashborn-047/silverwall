import sys
import unittest
from unittest.mock import MagicMock, patch

# Mock all the necessary dependencies before importing the module
sys.modules["fastapi"] = MagicMock()
sys.modules["fastapi.middleware.cors"] = MagicMock()
sys.modules["fastapi.middleware.gzip"] = MagicMock()
sys.modules["slowapi"] = MagicMock()
sys.modules["slowapi.errors"] = MagicMock()
sys.modules["limiter"] = MagicMock()
sys.modules["logger"] = MagicMock()
sys.modules["middleware.request_tracking"] = MagicMock()
sys.modules["websocket.live"] = MagicMock()
sys.modules["routes.track"] = MagicMock()
sys.modules["routes.status"] = MagicMock()
sys.modules["routes.commentary"] = MagicMock()
sys.modules["routes.radio"] = MagicMock()
sys.modules["routes.results"] = MagicMock()
sys.modules["routes.standings"] = MagicMock()
sys.modules["routes.discord"] = MagicMock()
sys.modules["openf1_fetcher"] = MagicMock()

from fastapi.middleware.cors import CORSMiddleware

class TestCORSSecurity(unittest.TestCase):
    def test_cors_configuration(self):
        # We need to import main to run its top-level code,
        # which configures CORS via app.add_middleware
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
