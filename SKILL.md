---
name: job-scholarship-platform
description: >
  Hướng dẫn toàn diện để xây dựng nền tảng tìm kiếm việc làm và học bổng với AI.
  Kích hoạt skill này bất cứ khi nào người dùng hỏi về: crawl dữ liệu việc làm/học bổng,
  tích hợp API tuyển dụng, xây dựng job board, tìm kiếm semantic cho CV, chatbot gợi ý
  nghề nghiệp, hệ thống thông báo học bổng, phân tích CV tự động, hoặc bất kỳ thành phần
  nào của hệ thống tuyển dụng/học bổng. Kích hoạt ngay cả khi người dùng chỉ hỏi một
  tính năng nhỏ như "crawl topcv" hay "chatbot gợi ý việc làm" — đây đều là một phần
  của hệ thống này.
---

# Job & Scholarship Platform — Skill

Skill này hướng dẫn xây dựng nền tảng tìm kiếm việc làm và học bổng cho thị trường
Việt Nam + quốc tế, tích hợp AI chatbot, semantic search, và hệ thống crawl tự động.

## Mục lục
- [Kiến trúc tổng thể](#kiến-trúc-tổng-thể)
- [Module 1: Data Crawler](#module-1-data-crawler)
- [Module 2: Backend API](#module-2-backend-api)
- [Module 3: AI Layer](#module-3-ai-layer)
- [Module 4: Frontend](#module-4-frontend)
- [Module 5: Database Schema](#module-5-database-schema)
- [Module 6: Deployment](#module-6-deployment)
- [Tham chiếu nhanh](#tham-chiếu-nhanh)

---

## Kiến trúc tổng thể

```
Data Sources → Crawler (Scrapy/Playwright) → Task Queue (Celery+Redis)
                                                    ↓
                                        Database (PostgreSQL + pgvector)
                                                    ↓
                              Backend API (FastAPI) + Search (Meilisearch)
                                                    ↓
                                     AI Layer (Claude API / OpenAI)
                                                    ↓
                              Frontend (Next.js 14 + Tailwind CSS)
```

**Tech Stack chính:**
| Layer | Công nghệ | Lý do chọn |
|---|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind | SSR/SSG, SEO tốt, DX cao |
| Backend | FastAPI (Python) | Async native, tích hợp AI dễ |
| Database | PostgreSQL 16 + pgvector | Vector search tích hợp sẵn |
| Search | Meilisearch | Dễ setup, typo-tolerant, tiếng Việt tốt |
| Crawler | Scrapy 2.x + Playwright | JS rendering + tốc độ cao |
| Queue | Celery 5 + Redis | Lên lịch crawl tự động |
| Auth | Supabase Auth | Miễn phí, tích hợp nhanh |
| AI | Claude API (claude-sonnet-4-20250514) | Chatbot + phân tích CV |
| Cache | Redis | API response cache |
| Storage | Supabase Storage / S3 | Lưu CV PDF |

---

## Module 1: Data Crawler

Chi tiết: xem `references/crawler.md`

### Nguồn dữ liệu ưu tiên

**Việc làm trong nước:**
- `topcv.vn` — cần Playwright (React SPA)
- `vietnamworks.com` — có sitemaps, crawl được
- `itviec.com` — chuyên IT, HTML thuần
- `careerbuilder.vn` — crawl dễ

**Việc làm quốc tế có API:**
- Adzuna API (miễn phí, 250 req/ngày): `https://api.adzuna.com/v1/api/jobs`
- Remotive API (remote jobs, miễn phí hoàn toàn): `https://remotive.com/api/remote-jobs`
- The Muse API (miễn phí): `https://www.themuse.com/api/public/jobs`

**Học bổng:**
- DAAD (scholarships.daad.de) — có RSS feed
- Chevening — crawl trang tĩnh
- ADB Scholarship — crawl + parse PDF
- British Council — RSS + sitemap
- VEF, Vingroup Foundation — crawl trang tĩnh VN

### Cấu trúc Scrapy Spider mẫu

```python
# crawlers/spiders/itviec_spider.py
import scrapy
from crawlers.items import JobItem
from datetime import datetime

class ITViecSpider(scrapy.Spider):
    name = "itviec"
    start_urls = ["https://itviec.com/it-jobs"]
    custom_settings = {
        "DOWNLOAD_DELAY": 2,          # Lịch sự với server
        "CONCURRENT_REQUESTS": 4,
        "ROBOTSTXT_OBEY": True,
    }

    def parse(self, response):
        for job_card in response.css("div.job_content"):
            yield response.follow(
                job_card.css("h3 a::attr(href)").get(),
                callback=self.parse_job
            )
        # Pagination
        next_page = response.css("a[rel='next']::attr(href)").get()
        if next_page:
            yield response.follow(next_page, self.parse)

    def parse_job(self, response):
        yield JobItem(
            title=response.css("h1.job-title::text").get("").strip(),
            company=response.css("a.employer-name::text").get("").strip(),
            location=response.css("div.location span::text").get("").strip(),
            salary=response.css("div.salary::text").get("").strip(),
            description="\n".join(
                response.css("div.job-description *::text").getall()
            ).strip(),
            skills=response.css("a.skill-tag::text").getall(),
            url=response.url,
            source="itviec",
            crawled_at=datetime.utcnow().isoformat(),
        )
```

### Playwright cho SPA (TopCV)

```python
# crawlers/spiders/topcv_spider.py
from playwright.async_api import async_playwright
import asyncio, json

async def crawl_topcv(page_num: int = 1):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # Chặn ảnh/font để tăng tốc
        await page.route("**/*.{png,jpg,jpeg,gif,svg,woff,woff2}", 
                         lambda r: r.abort())
        
        await page.goto(f"https://www.topcv.vn/viec-lam?page={page_num}", 
                        wait_until="networkidle")
        
        jobs = await page.evaluate("""
            () => Array.from(document.querySelectorAll('[data-job-id]')).map(el => ({
                id: el.dataset.jobId,
                title: el.querySelector('.job-title')?.textContent?.trim(),
                company: el.querySelector('.company-name')?.textContent?.trim(),
                salary: el.querySelector('.salary')?.textContent?.trim(),
                url: el.querySelector('a')?.href,
            }))
        """)
        await browser.close()
        return jobs
```

### Celery Tasks lên lịch crawl

```python
# tasks/crawl_tasks.py
from celery import Celery
from celery.schedules import crontab

app = Celery('crawler', broker='redis://localhost:6379/0')

app.conf.beat_schedule = {
    'crawl-itviec-daily': {
        'task': 'tasks.crawl_tasks.run_spider',
        'schedule': crontab(hour=6, minute=0),     # 6h sáng mỗi ngày
        'args': ('itviec',),
    },
    'crawl-scholarships-weekly': {
        'task': 'tasks.crawl_tasks.crawl_scholarships',
        'schedule': crontab(day_of_week=1, hour=7), # Thứ 2 hàng tuần
    },
}

@app.task(bind=True, max_retries=3)
def run_spider(self, spider_name: str):
    from scrapy.crawler import CrawlerProcess
    from scrapy.utils.project import get_project_settings
    try:
        process = CrawlerProcess(get_project_settings())
        process.crawl(spider_name)
        process.start()
    except Exception as exc:
        raise self.retry(exc=exc, countdown=300)  # Retry sau 5 phút
```

---

## Module 2: Backend API

Chi tiết: xem `references/backend.md`

### Cấu trúc thư mục FastAPI

```
backend/
├── main.py               # FastAPI app entry point
├── routers/
│   ├── jobs.py           # GET /jobs, GET /jobs/{id}
│   ├── scholarships.py   # GET /scholarships
│   ├── search.py         # GET /search (unified)
│   ├── users.py          # Auth, profile, saved items
│   ├── ai.py             # POST /chat, POST /analyze-cv
│   └── admin.py          # Trigger crawl, stats
├── models/
│   ├── job.py            # Pydantic + SQLAlchemy models
│   ├── scholarship.py
│   └── user.py
├── services/
│   ├── search_service.py # Meilisearch integration
│   ├── ai_service.py     # Claude API calls
│   ├── embedding_service.py  # pgvector operations
│   └── notification_service.py  # Email alerts
├── db/
│   ├── database.py       # Async SQLAlchemy engine
│   └── migrations/       # Alembic migrations
└── config.py             # Settings (pydantic-settings)
```

### FastAPI app cơ bản

```python
# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from routers import jobs, scholarships, search, users, ai

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: init DB, search index, embedding model
    await init_database()
    await init_meilisearch()
    yield
    # Shutdown

app = FastAPI(title="JobScholar API", version="1.0.0", lifespan=lifespan)

app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"],
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(jobs.router, prefix="/api/v1/jobs", tags=["jobs"])
app.include_router(scholarships.router, prefix="/api/v1/scholarships", tags=["scholarships"])
app.include_router(search.router, prefix="/api/v1/search", tags=["search"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["ai"])
```

### Search endpoint với Meilisearch

```python
# routers/search.py
from fastapi import APIRouter, Query
from services.search_service import MeilisearchService

router = APIRouter()
search_svc = MeilisearchService()

@router.get("/")
async def unified_search(
    q: str = Query(..., min_length=1),
    type: str = Query("all", pattern="^(all|jobs|scholarships)$"),
    location: str | None = None,
    salary_min: int | None = None,
    deadline_after: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=100),
):
    filters = []
    if location:
        filters.append(f'location = "{location}"')
    if salary_min:
        filters.append(f"salary_min >= {salary_min}")
    if deadline_after:
        filters.append(f'deadline >= "{deadline_after}"')

    results = await search_svc.search(
        query=q,
        index=type,
        filter=" AND ".join(filters) if filters else None,
        offset=(page - 1) * limit,
        limit=limit,
    )
    return results
```

---

## Module 3: AI Layer

Chi tiết: xem `references/ai.md`

### Chatbot endpoint (Claude API)

```python
# routers/ai.py
import anthropic
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()
client = anthropic.AsyncAnthropic()

SYSTEM_PROMPT = """Bạn là trợ lý tìm việc và học bổng thông minh cho người dùng Việt Nam.
Nhiệm vụ của bạn:
1. Gợi ý công việc phù hợp dựa trên kỹ năng và sở thích người dùng
2. Tư vấn học bổng phù hợp với profile học vấn
3. Giải thích các yêu cầu tuyển dụng bằng tiếng Việt rõ ràng
4. Hướng dẫn chuẩn bị hồ sơ xin việc/học bổng

Luôn trả lời bằng tiếng Việt, ngắn gọn, thực tế. Khi gợi ý việc làm hoặc học bổng,
hãy đề cập cụ thể tên vị trí/chương trình và lý do phù hợp.

Nếu cần tìm kiếm thêm thông tin trong database, hãy nói rõ bạn cần thêm thông tin gì."""

class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []
    user_profile: dict | None = None  # Kỹ năng, kinh nghiệm từ profile

@router.post("/chat")
async def chat(req: ChatRequest):
    messages = req.history + [{"role": "user", "content": req.message}]
    
    # Thêm context từ user profile nếu có
    system = SYSTEM_PROMPT
    if req.user_profile:
        system += f"\n\nThông tin người dùng hiện tại:\n{req.user_profile}"

    response = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        system=system,
        messages=messages,
    )
    return {"reply": response.content[0].text}
```

### CV Analyzer

```python
# services/ai_service.py
import anthropic, base64
from pathlib import Path

client = anthropic.AsyncAnthropic()

async def analyze_cv(pdf_bytes: bytes) -> dict:
    """Trích xuất thông tin từ CV PDF và gợi ý việc phù hợp."""
    pdf_b64 = base64.standard_b64encode(pdf_bytes).decode()
    
    response = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2048,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "document",
                    "source": {"type": "base64", "media_type": "application/pdf", 
                               "data": pdf_b64}
                },
                {
                    "type": "text",
                    "text": """Phân tích CV này và trả về JSON với các trường:
                    {
                      "name": "Họ tên",
                      "skills": ["skill1", "skill2"],
                      "experience_years": số năm kinh nghiệm,
                      "education": "Trình độ học vấn",
                      "languages": ["ngôn ngữ lập trình"],
                      "job_suggestions": ["Vị trí phù hợp 1", "Vị trí phù hợp 2"],
                      "scholarship_suggestions": ["Học bổng phù hợp 1"],
                      "strengths": ["Điểm mạnh 1"],
                      "improvements": ["Cần cải thiện 1"]
                    }
                    Chỉ trả về JSON, không có text thêm."""
                }
            ]
        }]
    )
    
    import json
    return json.loads(response.content[0].text)
```

### Semantic Search với pgvector

```python
# services/embedding_service.py
import openai  # hoặc dùng sentence-transformers local
from sqlalchemy import text
from db.database import async_session

async def get_embedding(text: str) -> list[float]:
    """Tạo vector embedding cho text."""
    # Option 1: OpenAI embeddings
    client = openai.AsyncOpenAI()
    response = await client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding

    # Option 2 (free): sentence-transformers local
    # from sentence_transformers import SentenceTransformer
    # model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
    # return model.encode(text).tolist()

async def semantic_search_jobs(query: str, limit: int = 10):
    """Tìm việc bằng semantic similarity."""
    query_embedding = await get_embedding(query)
    
    async with async_session() as session:
        result = await session.execute(text("""
            SELECT id, title, company, location, salary,
                   1 - (embedding <=> :embedding) AS similarity
            FROM jobs
            WHERE 1 - (embedding <=> :embedding) > 0.6
            ORDER BY embedding <=> :embedding
            LIMIT :limit
        """), {"embedding": str(query_embedding), "limit": limit})
        
        return [dict(row) for row in result.mappings()]
```

---

## Module 4: Frontend

Chi tiết: xem `references/frontend.md`

### Cấu trúc Next.js 14 (App Router)

```
frontend/
├── app/
│   ├── layout.tsx              # Root layout + providers
│   ├── page.tsx                # Landing page
│   ├── jobs/
│   │   ├── page.tsx            # Danh sách việc làm + search
│   │   └── [id]/page.tsx       # Chi tiết việc làm
│   ├── scholarships/
│   │   ├── page.tsx            # Danh sách học bổng
│   │   └── [id]/page.tsx       # Chi tiết học bổng
│   ├── profile/
│   │   ├── page.tsx            # Hồ sơ cá nhân
│   │   └── cv/page.tsx         # Upload & phân tích CV
│   └── api/                    # Next.js API routes (proxy to FastAPI)
├── components/
│   ├── search/
│   │   ├── SearchBar.tsx       # Ô tìm kiếm chính
│   │   └── FilterPanel.tsx     # Bộ lọc
│   ├── cards/
│   │   ├── JobCard.tsx         # Card việc làm
│   │   └── ScholarshipCard.tsx # Card học bổng
│   ├── chatbot/
│   │   └── ChatWidget.tsx      # AI chat floating button
│   └── ui/                     # shadcn/ui components
└── lib/
    ├── api.ts                  # API client (fetch wrapper)
    └── types.ts                # TypeScript types
```

### Trang tìm kiếm việc làm

```tsx
// app/jobs/page.tsx
import { Suspense } from "react"
import SearchBar from "@/components/search/SearchBar"
import FilterPanel from "@/components/search/FilterPanel"
import JobCard from "@/components/cards/JobCard"

interface SearchParams {
  q?: string; location?: string; salary_min?: string; page?: string;
}

async function getJobs(params: SearchParams) {
  const url = new URL(`${process.env.API_URL}/api/v1/jobs`)
  Object.entries(params).forEach(([k, v]) => v && url.searchParams.set(k, v))
  const res = await fetch(url.toString(), { next: { revalidate: 300 } }) // Cache 5 phút
  return res.json()
}

export default async function JobsPage({ searchParams }: { searchParams: SearchParams }) {
  const { results, total } = await getJobs(searchParams)
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <SearchBar placeholder="Tìm việc làm, kỹ năng, công ty..." />
      <div className="flex gap-6 mt-6">
        <FilterPanel className="w-64 shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-4">{total.toLocaleString()} việc làm</p>
          <div className="space-y-4">
            {results.map((job: any) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
```

### Chat Widget (AI Chatbot)

```tsx
// components/chatbot/ChatWidget.tsx
"use client"
import { useState } from "react"
import { MessageSquare, X, Send } from "lucide-react"

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<{role: string; content: string}[]>([
    { role: "assistant", content: "Xin chào! Tôi có thể giúp bạn tìm việc làm hoặc học bổng phù hợp. Hãy cho tôi biết bạn đang tìm kiếm gì?" }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  const sendMessage = async () => {
    if (!input.trim()) return
    const userMsg = { role: "user", content: input }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setLoading(true)

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input, history: messages }),
    })
    const { reply } = await res.json()
    setMessages(prev => [...prev, { role: "assistant", content: reply }])
    setLoading(false)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="bg-white rounded-2xl shadow-2xl w-80 h-[480px] flex flex-col mb-4 border">
          <div className="bg-blue-600 text-white p-4 rounded-t-2xl flex justify-between items-center">
            <span className="font-semibold">AI Tư vấn việc làm</span>
            <button onClick={() => setOpen(false)}><X size={18} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`text-sm p-3 rounded-xl max-w-[85%] ${
                m.role === "user" 
                  ? "bg-blue-600 text-white ml-auto" 
                  : "bg-gray-100 text-gray-800"
              }`}>
                {m.content}
              </div>
            ))}
            {loading && <div className="text-xs text-gray-400 italic">Đang trả lời...</div>}
          </div>
          <div className="p-4 border-t flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Nhập câu hỏi..."
              className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={sendMessage}
              className="bg-blue-600 text-white rounded-lg p-2 hover:bg-blue-700">
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition"
      >
        <MessageSquare size={24} />
      </button>
    </div>
  )
}
```

---

## Module 5: Database Schema

```sql
-- migrations/001_init.sql

-- Kích hoạt pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Bảng việc làm
CREATE TABLE jobs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(255) NOT NULL,
    company     VARCHAR(255) NOT NULL,
    location    VARCHAR(100),
    salary_min  INTEGER,
    salary_max  INTEGER,
    salary_currency VARCHAR(10) DEFAULT 'VND',
    description TEXT,
    requirements TEXT,
    skills      TEXT[],               -- Array: ['Python', 'FastAPI', 'Docker']
    job_type    VARCHAR(50),          -- fulltime, parttime, remote, internship
    experience  VARCHAR(50),          -- fresher, junior, mid, senior
    url         VARCHAR(500) UNIQUE NOT NULL,
    source      VARCHAR(50),          -- itviec, topcv, linkedin, ...
    is_active   BOOLEAN DEFAULT true,
    posted_at   TIMESTAMP,
    crawled_at  TIMESTAMP DEFAULT NOW(),
    embedding   vector(1536),         -- Cho semantic search
    CONSTRAINT idx_jobs_url UNIQUE (url)
);

-- Index cho full-text search (tiếng Việt)
CREATE INDEX idx_jobs_fts ON jobs 
    USING GIN(to_tsvector('simple', title || ' ' || COALESCE(company,'') || ' ' || COALESCE(description,'')));

-- Index cho vector similarity search
CREATE INDEX idx_jobs_embedding ON jobs USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Index cho filter thường dùng
CREATE INDEX idx_jobs_location ON jobs(location);
CREATE INDEX idx_jobs_type ON jobs(job_type);
CREATE INDEX idx_jobs_active ON jobs(is_active, crawled_at DESC);

-- Bảng học bổng
CREATE TABLE scholarships (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(500) NOT NULL,
    organization    VARCHAR(255),
    country         VARCHAR(100),
    level           VARCHAR(50),     -- bachelor, master, phd, postdoc
    field           VARCHAR(255),    -- Ngành học
    coverage        TEXT,            -- Học phí, sinh hoạt phí, vé máy bay...
    amount          VARCHAR(100),    -- '100% tuition + $2000/month'
    deadline        DATE,
    requirements    TEXT,
    description     TEXT,
    url             VARCHAR(500) UNIQUE NOT NULL,
    source          VARCHAR(100),
    is_active       BOOLEAN DEFAULT true,
    crawled_at      TIMESTAMP DEFAULT NOW(),
    embedding       vector(1536)
);

CREATE INDEX idx_scholarships_deadline ON scholarships(deadline) WHERE deadline > NOW();
CREATE INDEX idx_scholarships_level ON scholarships(level);
CREATE INDEX idx_scholarships_country ON scholarships(country);

-- Người dùng
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) UNIQUE NOT NULL,
    name        VARCHAR(255),
    skills      TEXT[],
    experience  VARCHAR(50),
    location    VARCHAR(100),
    education   VARCHAR(100),
    cv_url      VARCHAR(500),          -- Link PDF CV trên Supabase Storage
    cv_parsed   JSONB,                 -- Kết quả AI phân tích CV
    preferences JSONB,                 -- Job preferences
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Lưu việc / học bổng yêu thích
CREATE TABLE saved_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    item_type       VARCHAR(20) NOT NULL CHECK (item_type IN ('job', 'scholarship')),
    item_id         UUID NOT NULL,
    notes           TEXT,
    status          VARCHAR(50) DEFAULT 'saved',  -- saved, applied, interview, rejected
    created_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, item_type, item_id)
);

-- Thông báo (email alerts)
CREATE TABLE alert_subscriptions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(20) CHECK (type IN ('job', 'scholarship')),
    keywords    TEXT[],
    location    VARCHAR(100),
    frequency   VARCHAR(20) DEFAULT 'daily',  -- daily, weekly
    is_active   BOOLEAN DEFAULT true,
    last_sent   TIMESTAMP
);
```

---

## Module 6: Deployment

### Docker Compose (Local Development)

```yaml
# docker-compose.yml
version: "3.9"
services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: jobscholar
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports: ["5432:5432"]
    volumes: [postgres_data:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  meilisearch:
    image: getmeili/meilisearch:v1.7
    environment:
      MEILI_MASTER_KEY: "your-master-key"
    ports: ["7700:7700"]
    volumes: [meili_data:/meili_data]

  backend:
    build: ./backend
    ports: ["8000:8000"]
    environment:
      DATABASE_URL: postgresql+asyncpg://postgres:postgres@postgres/jobscholar
      REDIS_URL: redis://redis:6379/0
      MEILISEARCH_URL: http://meilisearch:7700
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
    depends_on: [postgres, redis, meilisearch]
    volumes: [./backend:/app]
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload

  worker:
    build: ./backend
    command: celery -A tasks worker --loglevel=info
    environment:
      REDIS_URL: redis://redis:6379/0
    depends_on: [redis, postgres]

  beat:
    build: ./backend
    command: celery -A tasks beat --loglevel=info
    depends_on: [redis]

  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000
    depends_on: [backend]

volumes:
  postgres_data:
  meili_data:
```

### Biến môi trường cần thiết

```env
# backend/.env
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/jobscholar
REDIS_URL=redis://localhost:6379/0
MEILISEARCH_URL=http://localhost:7700
MEILISEARCH_KEY=your-master-key
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...          # Cho embeddings (hoặc dùng local model)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJ...
SMTP_HOST=smtp.gmail.com
SMTP_USER=your@gmail.com
SMTP_PASS=app-password

# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### Production (Railway / Render)

- **Backend FastAPI** → Deploy lên Railway (tự detect Dockerfile)
- **Frontend Next.js** → Deploy lên Vercel (tự động từ GitHub)
- **PostgreSQL** → Railway PostgreSQL plugin hoặc Supabase (có pgvector)
- **Redis** → Railway Redis plugin hoặc Upstash Redis (serverless, free tier)
- **Meilisearch** → Meilisearch Cloud (free 100k docs) hoặc self-host trên Railway

---

## Tham chiếu nhanh

### API endpoints tóm tắt
```
GET  /api/v1/jobs                 # Danh sách + filter
GET  /api/v1/jobs/{id}            # Chi tiết
GET  /api/v1/scholarships         # Danh sách học bổng
GET  /api/v1/search?q=            # Tìm kiếm unified
POST /api/v1/ai/chat              # Chatbot
POST /api/v1/ai/analyze-cv        # Phân tích CV PDF
GET  /api/v1/users/me             # Profile người dùng
POST /api/v1/users/saved          # Lưu việc/học bổng
GET  /api/v1/users/saved          # Danh sách đã lưu
POST /api/v1/users/alerts         # Tạo thông báo
POST /api/v1/admin/crawl/{spider} # Trigger crawl thủ công
```

### Thứ tự triển khai đề xuất
1. Setup PostgreSQL + schema migrations
2. Backend FastAPI với routes cơ bản (jobs CRUD)
3. Viết 1-2 spider Scrapy đơn giản (itviec, scholarship.vn)
4. Tích hợp Meilisearch cho search
5. Frontend Next.js: trang danh sách + search bar
6. Tích hợp chatbot Claude API
7. Thêm auth (Supabase)
8. CV upload + AI analysis
9. Email notifications
10. Semantic search với pgvector
11. Celery beat cho crawl tự động

### Ghi chú quan trọng
- **Crawl đạo đức**: Luôn check `robots.txt`, đặt delay 2-3s, không crawl quá 4 concurrent requests
- **Rate limiting**: API nên có rate limit 100 req/phút/user dùng `slowapi`
- **Deduplication**: Check URL unique trước khi insert, dùng `ON CONFLICT DO NOTHING`
- **Tiếng Việt**: Dùng `paraphrase-multilingual-MiniLM-L12-v2` cho embedding tiếng Việt free
- **CV Privacy**: Không lưu nội dung CV raw, chỉ lưu kết quả phân tích đã parse

---

*Để xem hướng dẫn chi tiết từng module, đọc các file trong thư mục `references/`.*