import scrapy
from crawlers.items import ScholarshipItem
import lxml.etree

class ScholarshipPositionsSpider(scrapy.Spider):
    name = "scholarships_positions"
    start_urls = ["https://scholarship-positions.com/feed/"]

    def parse(self, response):
        items = response.xpath("//item")
        for item in items:
            title = item.xpath("title/text()").get()
            url = item.xpath("link/text()").get()
            description = item.xpath("description/text()").get()
            
            # Extract metadata from title
            location = "Global"
            level = "PhD/Masters"
            
            title_lower = title.lower()
            if "germany" in title_lower: location = "Germany"
            elif "uk" in title_lower: location = "UK"
            elif "usa" in title_lower: location = "USA"
            elif "australia" in title_lower: location = "Australia"
            
            if "master" in title_lower: level = "Master"
            elif "phd" in title_lower: level = "PhD"
            elif "bachelor" in title_lower: level = "Bachelor"

            yield ScholarshipItem(
                title=title,
                organization="Scholarship Positions",
                country=location,
                level=level,
                field="International",
                coverage="Full/Partial",
                amount="Varies",
                description=description[:1000] if description else "",
                url=url,
                source="scholarship_positions"
            )
