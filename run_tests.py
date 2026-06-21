import sys
import os
from unittest.mock import MagicMock, patch, AsyncMock
import asyncio

class BaseModelMock:
    pass

def run_tests():
    pydantic_mock = MagicMock()
    pydantic_mock.BaseModel = BaseModelMock

    mock_modules = {
        'pybreaker': MagicMock(),
        'fastapi': MagicMock(),
        'fastapi.testclient': MagicMock(),
        'fastapi.middleware': MagicMock(),
        'fastapi.middleware.cors': MagicMock(),
        'fastapi.middleware.gzip': MagicMock(),
        'fastapi.responses': MagicMock(),
        'slowapi': MagicMock(),
        'slowapi.errors': MagicMock(),
        'slowapi.util': MagicMock(),
        'slowapi.middleware': MagicMock(),
        'starlette': MagicMock(),
        'starlette.middleware': MagicMock(),
        'starlette.middleware.base': MagicMock(),
        'nacl': MagicMock(),
        'nacl.signing': MagicMock(),
        'nacl.exceptions': MagicMock(),
        'pydantic': pydantic_mock,
        'dotenv': MagicMock(),
        'supabase': MagicMock(),
        'httpx': MagicMock(),
        'google': MagicMock(),
        'google.generativeai': MagicMock(),
    }

    with patch.dict('sys.modules', mock_modules):
        sys.path.insert(0, os.path.abspath('backend'))
        
        from database import get_current_season_year
        import database

        async def test_get_current_season_year():
            mock_execute_sql = AsyncMock(return_value=[{'year': 2024}])
            database.execute_sql = mock_execute_sql

            # First call - should execute SQL query
            database._query_cache.clear()
            year = await get_current_season_year()
            assert year == 2024, f"Expected 2024, got {year}"
            assert "current_season_year" in database._query_cache
            self_call_count = mock_execute_sql.call_count
            assert self_call_count == 1, f"Expected 1 call to execute_sql, got {self_call_count}"

            # Second call - should hit cache
            mock_execute_sql.reset_mock()
            year = await get_current_season_year()
            assert year == 2024
            mock_execute_sql.assert_not_called()
            print("Test passed: get_current_season_year works as expected with SpacetimeDB cache.")

        asyncio.run(test_get_current_season_year())

if __name__ == "__main__":
    run_tests()
