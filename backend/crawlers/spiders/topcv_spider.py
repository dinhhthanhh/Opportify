import scrapy
from crawlers.items import JobItem

class TopCVSpider(scrapy.Spider):
    name = "topcv"
    start_urls = [
        "https://www.topcv.vn/tim-viec-lam-moi-nhat",
    ]

    def parse(self, response):
        jobs = response.css(".job-item-2")
        
        for job in jobs:
            title = job.css(".title a span::text").get() or job.css(".title a::text").get()
            company = job.css(".company a::text").get()
            location = job.css(".address::text").get()
            salary = job.css(".salary::text").get()
            url = job.css(".title a::attr(href)").get()
            
            # Clean data
            title = title.strip() if title else ""
            company = company.strip() if company else ""
            location = location.strip() if location else "Việt Nam"
            
            yield JobItem(
                title=title,
                company=company,
                location=location,
                salary_min=None,
                salary_max=None,
                salary_currency="VND",
                description=f"Lương: {salary}" if salary else "",
                skills=[],
                url=url,
                source="topcv"
            )
