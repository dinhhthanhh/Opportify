import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select, func
from models.job import Job
from models.scholarship import Scholarship
from config import settings

async def verify():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    
    async with async_session() as session:
        job_count = await session.scalar(select(func.count()).select_from(Job))
        scholarship_count = await session.scalar(select(func.count()).select_from(Scholarship))
        
        print(f"Jobs in DB: {job_count}")
        print(f"Scholarships in DB: {scholarship_count}")
        
        if job_count > 0:
            first_job = await session.execute(select(Job).limit(1))
            print(f"Sample Job: {first_job.scalar().title}")
            
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(verify())
