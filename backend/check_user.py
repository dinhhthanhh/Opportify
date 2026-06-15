import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from models.user import User
from config import settings

async def main():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = async_sessionmaker(engine)
    async with async_session() as session:
        res = await session.execute(select(User).where(User.email == 'anan2022@gmail.com'))
        user = res.scalar_one_or_none()
        if user:
            print(f"Name: {user.full_name}, Bio: {user.bio}")
        else:
            print("Not found")

if __name__ == "__main__":
    asyncio.run(main())
