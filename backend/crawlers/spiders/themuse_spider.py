import scrapy
import json
from crawlers.items import JobItem

class TheMuseSpider(scrapy.Spider):
    name = "themuse"
    
    def start_requests(self):
        # Fetching first 30 pages from The Muse API for very high data volume
        for page in range(1, 31):
            url = f"https://www.themuse.com/api/public/jobs?page={page}"
            yield scrapy.Request(url=url, callback=self.parse_api)

    def parse_api(self, response):
        data = response.json()
        for job in data.get("results", []):
            yield JobItem(
                title=job.get("name"),
                company=job.get("company", {}).get("name"),
                location=job.get("locations", [{}])[0].get("name", "Remote"),
                url=job.get("refs", {}).get("landing_page"),
                source="themuse",
                description=job.get("contents")[:500] if job.get("contents") else ""
            )
