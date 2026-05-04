import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from db.database import Base
from config import settings
import models.application

async def migrate():
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        # Add new columns to applications
        try: await conn.execute(text("ALTER TABLE applications ADD COLUMN is_viewed BOOLEAN DEFAULT FALSE"))
        except: pass
        try: await conn.execute(text("ALTER TABLE applications ADD COLUMN interview_date TIMESTAMP"))
        except: pass
        
        # Create notifications table
        await conn.run_sync(Base.metadata.create_all)
    print("Migration finished!")

if __name__ == "__main__":
    asyncio.run(migrate())
