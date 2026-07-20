import asyncio
from typing import AsyncGenerator
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.main import app
from app.core.database import get_db
from app.core.config import settings

# Create db fixture dynamically to prevent event loop mismatch with asyncpg connection pools
@pytest.fixture(scope="function")
async def db() -> AsyncGenerator[AsyncSession, None]:
    """
    Creates a new database session with a transaction that rolls back at the end
    of the test. This provides full test isolation.
    """
    engine = create_async_engine(
        settings.DATABASE_URL,
        poolclass=pool.NullPool,
        future=True,
    )
    
    testing_session_maker = async_sessionmaker(
        bind=engine,
        autocommit=False,
        autoflush=False,
        expire_on_commit=False,
        class_=AsyncSession,
    )

    async with engine.connect() as connection:
        transaction = await connection.begin()
        async_session = testing_session_maker(bind=connection)
        
        yield async_session
        
        await async_session.close()
        await transaction.rollback()
        
    await engine.dispose()



@pytest.fixture(scope="function")
async def client(db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """
    Creates an HTTP client that overrides the get_db dependency
    to use the isolated transaction session.
    """
    async def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac
        
    app.dependency_overrides.clear()
