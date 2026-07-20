import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.core.config import settings
from app.models.user import User
from app.core.security import get_password_hash


async def seed():
    engine = create_async_engine(settings.DATABASE_URL)
    session_maker = async_sessionmaker(bind=engine)
    
    async with session_maker() as session:
        result = await session.execute(
            select(User).where(User.email == "recruiter@recruitiq.ai")
        )
        user = result.scalar_one_or_none()
        
        if not user:
            new_user = User(
                email="recruiter@recruitiq.ai",
                hashed_password=get_password_hash("Password123!"),
                full_name="Jane Doe",
                company_name="TalentVault Enterprise",
                is_active=True,
                is_verified=True
            )
            session.add(new_user)
            await session.commit()
            print("[SEED] Successfully created default recruiter user.")
        else:
            print("[SEED] User recruiter@recruitiq.ai already exists.")
            
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
