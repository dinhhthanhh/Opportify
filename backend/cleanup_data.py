import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import text
from config import settings

engine = create_async_engine(settings.DATABASE_URL)
async_session = async_sessionmaker(engine, expire_on_commit=False)

async def cleanup():
    async with async_session() as session:
        async with session.begin():
            print("Đang xóa dữ liệu cũ...")
            await session.execute(text("TRUNCATE TABLE jobs CASCADE"))
            await session.execute(text("TRUNCATE TABLE scholarships CASCADE"))
            print("Đã xóa toàn bộ dữ liệu mẫu trong bảng jobs và scholarships!")

if __name__ == "__main__":
    asyncio.run(cleanup())
