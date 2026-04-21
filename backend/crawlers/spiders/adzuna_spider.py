import scrapy
import json
from crawlers.items import JobItem

class AdzunaSpider(scrapy.Spider):
    name = "adzuna"
    
    # Adzuna API details (Using a demo/public app ID/key for initial volume)
    # Developers should get their own at developer.adzuna.com
    app_id = "f8a09675"
    app_key = "7edc92c5567b43f068713d30e3188849"
    
    def start_requests(self):
        # We'll fetch jobs from Vietnam and UK (highly populated)
        targets = [
            # Countries use ISO codes
            {"country": "vn", "what": "technology"},
            {"country": "vn", "what": "english"},
            {"country": "gb", "what": "software engineer"}
        ]
        
        for t in targets:
            url = f"https://api.adzuna.com/v1/api/jobs/{t['country']}/search/1?app_id={self.app_id}&app_key={self.app_key}&what={t['what']}&content-type=application/json"
            yield scrapy.Request(url=url, callback=self.parse)

    def parse(self, response):
        data = json.loads(response.text)
        results = data.get("results", [])
        
        for job in results:
            yield JobItem(
                title=job.get("title"),
                company=job.get("company", {}).get("display_name", "Various"),
                location=job.get("location", {}).get("display_name", "Remote"),
                salary_min=job.get("salary_min"),
                salary_max=job.get("salary_max"),
                salary_currency="GBP" if "gb" in response.url else "VND",
                description=job.get("description", ""),
                skills=[],
                url=job.get("redirect_url"),
                source="adzuna"
            )
