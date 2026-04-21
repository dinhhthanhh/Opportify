import asyncio
from crawlers.pipelines import DatabasePipeline
from crawlers.items import JobItem
import uuid

async def test():
    pipe = DatabasePipeline()
    # Mock spider
    class Spider:
        name = "test"
        logger = type('logger', (), {'error': print, 'info': print})
    
    item = JobItem(
        title="Test Job",
        company="Test Co",
        location="Vietnam",
        url=f"https://test.com/{uuid.uuid4()}",
        source="test"
    )
    
    print("Attempting to process item...")
    result = await pipe.process_item(item, Spider())
    print("Done.")
    await pipe.engine.dispose()

if __name__ == "__main__":
    asyncio.run(test())
