from itemadapter import ItemAdapter
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select, update
from sqlalchemy.dialects.postgresql import insert
from models.job import Job
from models.scholarship import Scholarship
from config import settings
import logging
import traceback
from datetime import datetime

class DatabasePipeline:
    def __init__(self):
        self.engine = create_async_engine(settings.DATABASE_URL)
        self.async_session = async_sessionmaker(self.engine, expire_on_commit=False)

    async def close_spider(self, spider):
        await self.engine.dispose()

    async def process_item(self, item, spider):
        adapter = ItemAdapter(item)
        async with self.async_session() as session:
            try:
                if spider.name == "daad" or "scholarship" in item.__class__.__name__.lower():
                    # Upsert logic for scholarships
                    stmt = insert(Scholarship).values(
                        title=adapter.get("title"),
                        organization=adapter.get("organization"),
                        country=adapter.get("country"),
                        level=adapter.get("level"),
                        field=adapter.get("field"),
                        coverage=adapter.get("coverage"),
                        amount=adapter.get("amount"),
                        deadline=adapter.get("deadline"),
                        description=adapter.get("description"),
                        url=adapter.get("url"),
                        source=adapter.get("source")
                    ).on_conflict_do_nothing(index_elements=["url"])
                    await session.execute(stmt)
                else:
                    # Upsert logic for jobs
                    stmt = insert(Job).values(
                        title=adapter.get("title"),
                        company=adapter.get("company"),
                        location=adapter.get("location"),
                        salary_min=adapter.get("salary_min"),
                        salary_max=adapter.get("salary_max"),
                        description=adapter.get("description"),
                        skills=adapter.get("skills", []),
                        url=adapter.get("url"),
                        source=adapter.get("source"),
                        posted_at=adapter.get("posted_at")
                    )
                    upsert_stmt = stmt.on_conflict_do_update(
                        index_elements=["url"],
                        set_={
                            "title": stmt.excluded.title,
                            "salary_min": stmt.excluded.salary_min,
                            "salary_max": stmt.excluded.salary_max,
                            "crawled_at": datetime.utcnow()
                        }
                    )
                    await session.execute(upsert_stmt)
                
                await session.commit()
            except Exception as e:
                await session.rollback()
                spider.logger.error(f"Error saving item to DB (SQLAlchemy): {e}")
        return item

