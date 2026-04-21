import os
import subprocess
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("update_log.txt"),
        logging.StreamHandler()
    ]
)

def run_spider(name):
    logging.info(f"Starting spider: {name}")
    try:
        # Run scrapy crawl and wait for it to finish
        result = subprocess.run(
            ["scrapy", "crawl", name],
            capture_output=True,
            text=True,
            check=True
        )
        logging.info(f"Successfully finished spider: {name}")
        return True
    except subprocess.CalledProcessError as e:
        logging.error(f"Error running spider {name}: {e.stderr}")
        return False

def main():
    logging.info("=== Starting Daily Data Update ===")
    
    # List of all active spiders
    spiders = ["themuse", "scholars4dev"]
    
    success_count = 0
    for spider in spiders:
        if run_spider(spider):
            success_count += 1
            
    logging.info(f"=== Update Completed. Successful spiders: {success_count}/{len(spiders)} ===")

if __name__ == "__main__":
    main()
