import scrapy
import lxml.etree
from crawlers.items import ScholarshipItem
from datetime import datetime

class ScholarshipsAdsSpider(scrapy.Spider):
    name = "scholarshipsads"
    start_urls = ["https://www.scholarshipsads.com/feed/"]

    def parse(self, response):
        # RSS feeds use XML, so we need to handle it accordingly
        # Scrapy's default response.xpath works with XML namespaces too
        items = response.xpath("//item")
        for item in items:
            title = item.xpath("title/text()").get()
            url = item.xpath("link/text()").get()
            description = item.xpath("description/text()").get()
            
            # Simple metadata extraction from title
            # Example title: "Postdoctoral Fellowship in Physics, Germany"
            location = "Global"
            level = "Any"
            
            title_lower = title.lower()
            if "germany" in title_lower: location = "Germany"
            if "uk" in title_lower or "united kingdom" in title_lower: location = "UK"
            if "usa" in title_lower or "united states" in title_lower: location = "USA"
            if "australia" in title_lower: location = "Australia"
            
            if "master" in title_lower: level = "Master"
            elif "phd" in title_lower: level = "PhD"
            elif "bachelor" in title_lower: level = "Bachelor"
            elif "postdoc" in title_lower: level = "PostDoc"

            yield ScholarshipItem(
                title=title,
                organization="Scholarships Ads",
                country=location,
                level=level,
                field="Multiple",
                coverage="Full/Partial",
                amount="Check Website",
                description=description[:1000] if description else "",
                url=url,
                source="scholarshipsads"
            )
