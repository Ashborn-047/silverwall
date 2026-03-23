from slowapi import Limiter
from slowapi.util import get_remote_address

# Shared instance of Rate Limiter for the FastAPI application
limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])
