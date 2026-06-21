import asyncio
from spacetimedb import execute_sql

async def test():
    res = await execute_sql("SELECT * FROM race LIMIT 1")
    print("Race table:", res)

if __name__ == "__main__":
    asyncio.run(test())
