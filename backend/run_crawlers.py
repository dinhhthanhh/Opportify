import os
import sys
from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings

# Add backend directory to sys.path to allow crawlers to import items
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def run_all_spiders():
    settings = get_project_settings()
    process = CrawlerProcess(settings)
    
    spiders = ["vietnamworks", "daad", "careerbuilder"]
    
    for spider in spiders:
        print(f"Starting spider: {spider}")
        process.crawl(spider)
        
    process.start() # the script will block here until all crawling jobs are finished

if __name__ == "__main__":
    run_all_spiders()
