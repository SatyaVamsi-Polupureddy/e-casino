from contextlib import asynccontextmanager
from typing import AsyncGenerator
from psycopg_pool import AsyncConnectionPool
from psycopg.rows import dict_row
from app.core.config import settings

# Initialize Pool
pool = AsyncConnectionPool(
    conninfo=settings.DB_CONFIG,
    open=False, 
    min_size=1,
    max_size=20, # increase or decrease entries at a time based on traffic
    kwargs={
        "row_factory": dict_row # to return results as dictionaries
    }
)

@asynccontextmanager
async def get_db_connection() -> AsyncGenerator:
    """
    Usage in API:
    async with get_db_connection() as conn:
        await conn.execute(...)
    """
    async with pool.connection() as conn:
        yield conn