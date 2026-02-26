"""
Request tracking middleware for performance monitoring and debugging
Tracks request duration, status codes, and provides request IDs
"""

import time
import uuid
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from logger import logger


class RequestTrackingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to track requests with unique IDs and performance metrics

    Features:
    - Generates unique request ID for tracing
    - Measures request duration
    - Logs request details (method, path, status, duration)
    - Adds request ID to response headers for client-side tracing
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request with tracking"""
        # Generate unique request ID
        request_id = str(uuid.uuid4())[:8]  # Short ID for readability

        # Attach request ID to request state for access in route handlers
        request.state.request_id = request_id

        # Record start time
        start_time = time.time()

        # Process request
        try:
            response = await call_next(request)
            status_code = response.status_code
        except Exception as exc:
            # Log exception with request context
            logger.error(
                f"Request failed: {request.method} {request.url.path}",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": str(request.url.path),
                    "client_ip": request.client.host if request.client else "unknown",
                },
                exc_info=True
            )
            raise exc

        # Calculate duration
        duration_ms = round((time.time() - start_time) * 1000, 2)

        # Log request completion
        logger.info(
            f"{request.method} {request.url.path} - {status_code}",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": str(request.url.path),
                "status_code": status_code,
                "duration_ms": duration_ms,
                "client_ip": request.client.host if request.client else "unknown",
            }
        )

        # Add request ID to response headers for client-side tracing
        response.headers["X-Request-ID"] = request_id

        # Add performance metrics to response headers
        response.headers["X-Response-Time"] = f"{duration_ms}ms"

        return response
