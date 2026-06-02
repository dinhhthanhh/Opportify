import asyncio
import random
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select
from config import settings
from models.job import Job

engine = create_async_engine(
    settings.DATABASE_URL,
    connect_args={
        "prepared_statement_cache_size": 0,
        "statement_cache_size": 0
    }
)
async_session = async_sessionmaker(engine, expire_on_commit=False)

async def update_remote_jobs():
    async with async_session() as session:
        async with session.begin():
            # 1. Fetch all jobs
            res = await session.execute(select(Job))
            jobs = res.scalars().all()
            
            updated_remote_type_count = 0
            random_remote_count = 0
            
            for job in jobs:
                # Normalize job_type comparison
                jtype = (job.job_type or "").strip().lower()
                
                if jtype == "remote":
                    job.location = "Remote"
                    job.job_type = "fulltime"
                    updated_remote_type_count += 1
                else:
                    # Randomly set 15% of other jobs to "Remote" location
                    if random.random() < 0.15:
                        job.location = "Remote"
                        random_remote_count += 1
            
            print(f"Updated {updated_remote_type_count} jobs that had job_type='remote' to location='Remote' and job_type='fulltime'.")
            print(f"Randomly updated {random_remote_count} other jobs to location='Remote'.")
            print("Database updates committed successfully!")

if __name__ == "__main__":
    asyncio.run(update_remote_jobs())
