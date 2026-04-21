# Backend Reference

## Cài đặt

```bash
pip install fastapi uvicorn[standard] sqlalchemy asyncpg alembic \
            meilisearch-python anthropic openai celery redis \
            python-multipart pydantic-settings slowapi
```

## Database async setup

```python
# db/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False, pool_size=10)
async_session = async_sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with async_session() as session:
        yield session

async def init_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
```

## Meilisearch Service

```python
# services/search_service.py
import meilisearch
from config import settings

class MeilisearchService:
    def __init__(self):
        self.client = meilisearch.Client(settings.MEILISEARCH_URL, settings.MEILISEARCH_KEY)
        self._setup_indexes()

    def _setup_indexes(self):
        # Cấu hình index jobs
        jobs_index = self.client.index("jobs")
        jobs_index.update_filterable_attributes(["location", "job_type", "salary_min", "source"])
        jobs_index.update_sortable_attributes(["posted_at", "salary_min"])
        jobs_index.update_searchable_attributes(["title", "company", "description", "skills"])

        # Cấu hình index scholarships
        sch_index = self.client.index("scholarships")
        sch_index.update_filterable_attributes(["country", "level", "deadline"])
        sch_index.update_sortable_attributes(["deadline"])

    async def search(self, query: str, index: str = "all", **kwargs):
        if index == "all":
            # Multi-index search
            results = self.client.multi_search([
                {"indexUid": "jobs", "q": query, "limit": kwargs.get("limit", 10)},
                {"indexUid": "scholarships", "q": query, "limit": kwargs.get("limit", 10)},
            ])
            return {
                "jobs": results["results"][0]["hits"],
                "scholarships": results["results"][1]["hits"],
                "total": sum(r["estimatedTotalHits"] for r in results["results"]),
            }
        
        result = self.client.index(index).search(query, {
            "filter": kwargs.get("filter"),
            "offset": kwargs.get("offset", 0),
            "limit": kwargs.get("limit", 20),
            "sort": kwargs.get("sort"),
        })
        return {"results": result["hits"], "total": result["estimatedTotalHits"]}

    def index_job(self, job: dict):
        self.client.index("jobs").add_documents([job], primary_key="id")

    def index_scholarship(self, scholarship: dict):
        self.client.index("scholarships").add_documents([scholarship], primary_key="id")
```

## Notification Service (Email Alert)

```python
# services/notification_service.py
import asyncio
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import aiosmtplib
from config import settings

async def send_job_alert(user_email: str, jobs: list, scholarships: list):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Có {len(jobs)} việc làm và {len(scholarships)} học bổng mới cho bạn!"
    msg["From"] = settings.SMTP_USER
    msg["To"] = user_email

    html_content = f"""
    <h2>Việc làm mới phù hợp với bạn</h2>
    {"".join([f'''
    <div style="border:1px solid #eee;padding:16px;margin:8px 0;border-radius:8px">
      <h3><a href="{j['url']}">{j['title']}</a></h3>
      <p>{j['company']} • {j.get('location','')}</p>
      <p style="color:#666">{j.get('salary_min','')}</p>
    </div>''' for j in jobs[:5]])}
    
    <h2>Học bổng mới</h2>
    {"".join([f'''
    <div style="border:1px solid #eee;padding:16px;margin:8px 0;border-radius:8px">
      <h3><a href="{s['url']}">{s['title']}</a></h3>
      <p>{s.get('organization','')} • Deadline: {s.get('deadline','')}</p>
    </div>''' for s in scholarships[:3]])}
    """
    
    msg.attach(MIMEText(html_content, "html"))
    
    async with aiosmtplib.SMTP(hostname=settings.SMTP_HOST, port=587, use_tls=False) as smtp:
        await smtp.starttls()
        await smtp.login(settings.SMTP_USER, settings.SMTP_PASS)
        await smtp.send_message(msg)
```

## Rate Limiting

```python
# main.py — thêm rate limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Trong router
@router.post("/chat")
@limiter.limit("20/minute")  # Giới hạn 20 chat requests/phút
async def chat(req: ChatRequest, request: Request):
    ...
```