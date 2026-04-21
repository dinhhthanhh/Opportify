import scrapy
import json
from crawlers.items import JobItem

class VietnamWorksSpider(scrapy.Spider):
    name = "vietnamworks"
    
    # Algolia credentials found via browser investigation
    ALGOLIA_URL = "https://u97s6s8i86-dsn.algolia.net/1/indexes/*/queries?x-algolia-agent=Algolia%20for%20JavaScript%20(4.22.1)%3B%20Browser%20(lite)"
    ALGOLIA_HEADERS = {
        "X-Algolia-API-Key": "b36440f82dfdf77180ba30e461a33716",
        "X-Algolia-Application-Id": "U97S6S8I86",
        "Content-Type": "application/json",
    }

    def start_requests(self):
        for page in range(5): # Fetching 5 pages (100 jobs)
            payload = {
                "requests": [
                    {
                        "indexName": "vnw_job_v2",
                        "params": f"query=&hitsPerPage=20&page={page}&facets=%5B%22*%22%5D"
                    }
                ]
            }
            yield scrapy.Request(
                self.ALGOLIA_URL,
                method="POST",
                body=json.dumps(payload),
                headers=self.ALGOLIA_HEADERS,
                callback=self.parse_api,
                dont_filter=True
            )

    def parse_api(self, response):
        data = response.json()
        # Algolia returns multiple results for "requests", we pick the first one
        results = data.get("results", [{}])[0]
        for job in results.get("hits", []):
            yield JobItem(
                title=job.get("jobTitle"),
                company=job.get("companyName"),
                location=job.get("city"),
                salary_min=job.get("salaryFrom"),
                salary_max=job.get("salaryTo"),
                url=f"https://www.vietnamworks.com/{job['alias']}-{job['jobId']}-jv",
                source="vietnamworks",
                description=job.get("jobDescription")[:500] if job.get("jobDescription") else ""
            )
