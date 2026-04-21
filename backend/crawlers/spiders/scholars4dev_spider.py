import scrapy
from crawlers.items import ScholarshipItem
from datetime import datetime

class Scholars4DevSpider(scrapy.Spider):
    name = "scholars4dev"
    start_urls = ["https://www.scholars4dev.com/feed/"]
    
    custom_settings = {
        'USER_AGENT': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    }

    def parse(self, response):
        # Remove namespaces for easier XPath selection in some RSS feeds
        response.selector.remove_namespaces()
        items = response.xpath("//item")
        for item in items:
            title = item.xpath("title/text()").get()
            url = item.xpath("link/text()").get()
            description = item.xpath("description/text()").get()
            
            # Simple metadata extraction from the title/description
            # Scholars4Dev titles often contain the country/level
            location = "Global"
            level = "Master/PhD"
            
            title_lower = title.lower()
            if "germany" in title_lower: location = "Germany"
            elif "uk" in title_lower or "united kingdom" in title_lower: location = "UK"
            elif "usa" in title_lower or "united states" in title_lower: location = "USA"
            elif "australia" in title_lower: location = "Australia"
            elif "netherlands" in title_lower: location = "Netherlands"
            
            if "master" in title_lower: level = "Master"
            elif "phd" in title_lower: level = "PhD"
            elif "bachelor" in title_lower: level = "Bachelor"

            yield ScholarshipItem(
                title=title,
                organization="Scholars4Dev",
                country=location,
                level=level,
                field="Multiple Fields",
                coverage="Full/Partial",
                amount="Check Details",
                description=description[:2000] if description else "",
                url=url,
                source="scholars4dev"
            )
