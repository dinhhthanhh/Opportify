# Crawler Reference

## Cài đặt dependencies
```bash
pip install scrapy playwright scrapy-playwright python-dotenv
playwright install chromium
```

## settings.py cho Scrapy project
```python
# crawlers/settings.py
BOT_NAME = "jobscholar_crawler"
SPIDER_MODULES = ["crawlers.spiders"]
USER_AGENT = "Mozilla/5.0 (compatible; JobScholarBot/1.0)"
ROBOTSTXT_OBEY = True
DOWNLOAD_DELAY = 2
AUTOTHROTTLE_ENABLED = True
AUTOTHROTTLE_START_DELAY = 1
AUTOTHROTTLE_MAX_DELAY = 10
AUTOTHROTTLE_TARGET_CONCURRENCY = 2.0
CONCURRENT_REQUESTS_PER_DOMAIN = 4

# Playwright cho JS pages
DOWNLOAD_HANDLERS = {
    "http": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
    "https": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
}
TWISTED_REACTOR = "twisted.internet.asyncioreactor.AsyncioSelectorReactor"

# Pipeline
ITEM_PIPELINES = {
    "crawlers.pipelines.DeduplicatePipeline": 100,
    "crawlers.pipelines.CleanTextPipeline": 200,
    "crawlers.pipelines.DatabasePipeline": 300,
    "crawlers.pipelines.MeilisearchPipeline": 400,
    "crawlers.pipelines.EmbeddingPipeline": 500,  # Tạo vector embedding
}
```

## Pipeline xử lý data
```python
# crawlers/pipelines.py
import re, asyncpg
from itemadapter import ItemAdapter

class DeduplicatePipeline:
    def __init__(self):
        self.seen_urls = set()

    def process_item(self, item, spider):
        url = item.get("url")
        if url in self.seen_urls:
            raise DropItem(f"Duplicate: {url}")
        self.seen_urls.add(url)
        return item

class CleanTextPipeline:
    def process_item(self, item, spider):
        adapter = ItemAdapter(item)
        for field in ["title", "company", "description"]:
            if adapter.get(field):
                # Xóa whitespace thừa, HTML tags
                text = re.sub(r"\s+", " ", adapter[field]).strip()
                text = re.sub(r"<[^>]+>", "", text)
                adapter[field] = text
        return item

class DatabasePipeline:
    async def open_spider(self, spider):
        self.pool = await asyncpg.create_pool(spider.settings["DATABASE_URL"])

    async def process_item(self, item, spider):
        async with self.pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO jobs (title, company, location, salary_min, salary_max,
                                  description, skills, url, source, posted_at)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
                ON CONFLICT (url) DO UPDATE SET
                    title = EXCLUDED.title,
                    crawled_at = NOW()
            """, item["title"], item["company"], item.get("location"),
                item.get("salary_min"), item.get("salary_max"),
                item.get("description"), item.get("skills", []),
                item["url"], item["source"], item.get("posted_at"))
        return item
```

## Các spider tham khảo

### VietnamWorks
```python
class VietnamWorksSpider(scrapy.Spider):
    name = "vietnamworks"
    
    def start_requests(self):
        # VietnamWorks có API không chính thức
        yield scrapy.Request(
            "https://ms.vietnamworks.com/job-search/v1.0/jobs",
            method="POST",
            body=json.dumps({
                "query": "", "filter": [], "ranges": [],
                "order": [], "hitsPerPage": 50, "page": 0
            }),
            headers={"Content-Type": "application/json"},
            callback=self.parse_api
        )

    def parse_api(self, response):
        data = response.json()
        for job in data.get("hits", []):
            yield JobItem(
                title=job["jobTitle"],
                company=job["companyName"],
                location=job.get("workingLocations", [{}])[0].get("cityInput",""),
                salary_min=job.get("salary", {}).get("from"),
                salary_max=job.get("salary", {}).get("to"),
                url=f"https://www.vietnamworks.com/{job['alias']}-{job['jobId']}",
                source="vietnamworks",
            )
```

### DAAD Scholarship (RSS)
```python
import feedparser

class DAADScholarshipSpider(scrapy.Spider):
    name = "daad"
    
    def start_requests(self):
        feeds = [
            "https://www.daad.de/en/study-and-research-in-germany/scholarships/rss/",
        ]
        for url in feeds:
            yield scrapy.Request(url, callback=self.parse_rss)

    def parse_rss(self, response):
        feed = feedparser.parse(response.text)
        for entry in feed.entries:
            yield ScholarshipItem(
                title=entry.title,
                description=entry.get("summary",""),
                url=entry.link,
                organization="DAAD",
                country="Germany",
                deadline=entry.get("deadline"),
                source="daad",
            )
```