import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from config import settings

async def migrate():
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        print("Migrating jobs table...")
        await conn.execute(text("ALTER TABLE jobs ADD COLUMN job_level TEXT"))
        await conn.execute(text("ALTER TABLE jobs ADD COLUMN experience_years INTEGER"))
        await conn.execute(text("ALTER TABLE jobs ADD COLUMN industry TEXT"))
        await conn.execute(text("ALTER TABLE jobs ADD COLUMN working_time TEXT"))
        
        print("Migrating scholarships table...")
        await conn.execute(text("ALTER TABLE scholarships ADD COLUMN gender_requirement TEXT"))
        await conn.execute(text("ALTER TABLE scholarships ADD COLUMN nationality_requirement TEXT"))
        await conn.execute(text("ALTER TABLE scholarships ADD COLUMN website_url TEXT"))
        
    print("Migration finished!")

if __name__ == "__main__":
    asyncio.run(migrate())
