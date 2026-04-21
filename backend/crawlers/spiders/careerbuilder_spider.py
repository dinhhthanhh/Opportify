import scrapy
from crawlers.items import JobItem

class CareerBuilderSpider(scrapy.Spider):
    name = "careerbuilder"
    
    def start_requests(self):
        # Redirected URL for CareerViet
        urls = [
            "https://careerviet.vn/viec-lam/tat-ca-viec-lam-vi.html",
        ]
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        }
        for url in urls:
            yield scrapy.Request(url=url, headers=headers, callback=self.parse)

    def parse(self, response):
        # CareerViet (former CareerBuilder) listing items
        for job_item in response.css(".job-item"):
            # New selectors based on browser investigation
            title_node = job_item.css(".job_link")
            title = title_node.css("::text").get()
            url = title_node.css("::attr(href)").get()
            
            company = job_item.css(".company-name::text").get()
            location = job_item.css(".location ul li::text").get()
            salary = job_item.css(".salary p::text").get()
            
            if title and company:
                yield JobItem(
                    title=title.strip(),
                    company=company.strip(),
                    location=location.strip() if location else "Việt Nam",
                    url=url,
                    source="careerbuilder",
                    description=f"Lương: {salary.strip() if salary else 'Thỏa thuận'}"
                )
        
        # Follow pagination (first 2 pages for demo)
        next_page = response.css(".pagination li.next a::attr(href)").get()
        if next_page:
            yield response.follow(next_page, callback=self.parse)
