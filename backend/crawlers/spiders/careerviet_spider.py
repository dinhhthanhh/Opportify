import scrapy
from crawlers.items import JobItem

class CareerVietSpider(scrapy.Spider):
    name = "careerviet"
    start_urls = [
        "https://careerviet.vn/vi/tim-viec-lam/tat-ca-viec-lam.html",
        "https://careerviet.vn/vi/tim-viec-lam/tat-ca-viec-lam-page-2.html"
    ]

    def parse(self, response):
        # CareerViet typical job item selector
        jobs = response.css(".job-item")
        
        for job in jobs:
            title = job.css(".title a::text").get()
            company = job.css(".company-name::text").get()
            location = job.css(".location ul li::text").get()
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
                salary_min=None, # Extracting ranges from string is complex, let's keep it simple for now
                salary_max=None,
                salary_currency="VND",
                description=f"Lương: {salary}" if salary else "",
                skills=[],
                url=url,
                source="careerviet"
            )
