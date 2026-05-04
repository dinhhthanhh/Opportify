BOT_NAME = "OpportifyBot"

SPIDER_MODULES = ["crawlers.spiders"]
NEWSPIDER_MODULE = "crawlers.spiders"

ROBOTSTXT_OBEY = False

DOWNLOAD_DELAY = 1
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# Playwright is available but not forced for all requests
TWISTED_REACTOR = "twisted.internet.asyncioreactor.AsyncioSelectorReactor"

ITEM_PIPELINES = {
    "crawlers.pipelines.DataCleanerPipeline": 200,
    "crawlers.pipelines.DatabasePipeline": 300,
}

# Add DATABASE_URL to settings for the pipeline
import os
from dotenv import load_dotenv
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/jobscholar")
# Resilience settings for external sources
DOWNLOADER_CLIENT_TLS_METHOD = "TLS"
DOWNLOADER_CLIENT_TLS_VERIFY_PEER = False # Bypass expired certs on some sources
DOWNLOAD_TIMEOUT = 30
RETRY_TIMES = 5
