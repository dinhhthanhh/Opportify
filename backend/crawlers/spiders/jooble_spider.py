import scrapy
import json
from crawlers.items import JobItem

class JoobleSpider(scrapy.Spider):
    name = "jooble"
    
    # NOTE: In a real app, the API key should be in .env
    # For this implementation, we use a sample request or a placeholder
    # Jooble requires a POST request to their API endpoint
    api_url = "https://jooble.org/api/"
    api_key = "24c2ed50-4886-444a-988a-ea36b13cf10e" # This is a placeholder, user should get theirs
    
    def start_requests(self):
        # We'll search for 'software' jobs in 'Vietnam' and 'International'
        queries = [
            {"keywords": "software", "location": "Vietnam"},
            {"keywords": "internship", "location": ""}, # Global
            {"keywords": "scholarship", "location": ""} # Some scholarship listings also appear in job boards
        ]
        
        for q in queries:
            yield scrapy.Request(
                url=f"{self.api_url}{self.api_key}",
                method="POST",
                body=json.dumps(q),
                headers={"Content-Type": "application/json"},
                callback=self.parse
            )

    def parse(self, response):
        data = json.loads(response.text)
        jobs = data.get("jobs", [])
        
        for job in jobs:
            yield JobItem(
                title=job.get("title"),
                company=job.get("company", "Various"),
                location=job.get("location", "Remote"),
                salary_min=None,
                salary_max=None,
                salary_currency="VND",
                description=job.get("snippet", ""),
                skills=[],
                url=job.get("link"),
                source="jooble"
            )
