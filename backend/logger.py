"""
Structured logging configuration for SilverWall Backend
Provides consistent logging with request tracking and performance metrics
"""

import logging
import sys
import json
from datetime import datetime
from typing import Any, Dict


class StructuredFormatter(logging.Formatter):
    """
    Custom formatter that outputs logs as structured JSON
    Makes logs easier to parse, search, and analyze
    """

    def format(self, record: logging.LogRecord) -> str:
        """Format log record as structured JSON"""
        log_data: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        # Add extra fields from record
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id
        if hasattr(record, "duration_ms"):
            log_data["duration_ms"] = record.duration_ms
        if hasattr(record, "status_code"):
            log_data["status_code"] = record.status_code
        if hasattr(record, "method"):
            log_data["method"] = record.method
        if hasattr(record, "path"):
            log_data["path"] = record.path
        if hasattr(record, "client_ip"):
            log_data["client_ip"] = record.client_ip

        return json.dumps(log_data)


def setup_logging(log_level: str = "INFO") -> logging.Logger:
    """
    Configure structured logging for the application

    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)

    Returns:
        Configured logger instance
    """
    # Create logger
    logger = logging.getLogger("silverwall")
    logger.setLevel(getattr(logging, log_level.upper()))

    # Remove existing handlers to avoid duplicates
    logger.handlers.clear()

    # Create console handler with structured formatter
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(getattr(logging, log_level.upper()))

    # Use JSON formatter for production, simple formatter for development
    use_json = True  # Can be controlled via environment variable
    if use_json:
        formatter = StructuredFormatter()
    else:
        formatter = logging.Formatter(
            fmt="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )

    handler.setFormatter(formatter)
    logger.addHandler(handler)

    return logger


# Create default logger instance
logger = setup_logging()
