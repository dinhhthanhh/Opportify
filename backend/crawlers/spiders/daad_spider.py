import scrapy
import feedparser
from crawlers.items import ScholarshipItem

class DAADScholarshipSpider(scrapy.Spider):
    name = "daad"
    
    def start_requests(self):
        # Using the direct RSS feed URL for international scholarships
        feeds = [
            "https://www.daad.de/en/study-and-research-in-germany/scholarships/rss/",
        ]
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        }
        for url in feeds:
            yield scrapy.Request(url, headers=headers, callback=self.parse_rss)

    def parse_rss(self, response):
        feed = feedparser.parse(response.text)
        for entry in feed.entries:
            # Simple keyword matching for better metadata
            title_lower = entry.title.lower()
            level = "master"
            if "phd" in title_lower or "doctoral" in title_lower:
                level = "phd"
            elif "bachelor" in title_lower:
                level = "bachelor"
                
            yield ScholarshipItem(
                title=entry.title,
                organization="DAAD",
                country="Germany",
                level=level,
                field="Multi-disciplinary",
                coverage="full",
                amount="Monthly allowance + Insurance",
                deadline=None, # RSS sometimes lacks structured deadlines
                description=entry.get("summary", ""),
                url=entry.link,
                source="daad"
            )
