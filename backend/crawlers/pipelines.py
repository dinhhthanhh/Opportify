from itemadapter import ItemAdapter
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select, update
from sqlalchemy.dialects.postgresql import insert
from models.job import Job
from models.scholarship import Scholarship
from config import settings
import logging
import traceback
from datetime import datetime
import re
from bs4 import BeautifulSoup

import httpx
import json
import os
from dotenv import load_dotenv
load_dotenv()

class DataCleanerPipeline:
    AI_API_URL = "http://171.226.10.154:8080/v1/chat/completions"
    
    async def process_item(self, item, spider):
        adapter = ItemAdapter(item)
        raw_desc = adapter.get("description")
        if not raw_desc:
            return item

        # 1. Clean HTML tags
        soup = BeautifulSoup(raw_desc, "html.parser")
        for tag in soup.find_all(['p', 'div', 'br', 'li']):
            tag.append('\n')
        text = soup.get_text().strip()
        
        # 2. AI Processing via Qwen3
        try:
            prompt = f"""
            Bạn là một chuyên gia tuyển dụng cao cấp. Hãy đọc mô tả công việc (thường bằng tiếng Anh) và thực hiện các bước sau:
            1. Dịch toàn bộ nội dung sang tiếng Việt chuyên nghiệp, mượt mà.
            2. Chia nội dung thành 3 phần: Mô tả chung (description), Yêu cầu ứng viên (requirements), và Quyền lợi (benefits).
            3. Trích xuất danh sách các kỹ năng chuyên môn (ví dụ: Python, Docker, Django, React, v.v.).
            
            Trả về kết quả dưới dạng JSON duy nhất với cấu trúc:
            {{
                "description_vi": "...",
                "requirements_vi": "...",
                "benefits_vi": "...",
                "skills": ["...", "..."]
            }}
            
            Nội dung gốc:
            {text}
            """
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    self.AI_API_URL,
                    json={
                        "model": "Qwen/Qwen3-32B-AWQ",
                        "messages": [
                            {"role": "system", "content": "Bạn là trợ lý AI chuyên nghiệp về tuyển dụng. Luôn trả về JSON."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.3
                    },
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {os.getenv('CUSTOM_LLM_KEY')}"
                    }
                )
                
                if response.status_code == 200:
                    ai_data = response.json()
                    content_str = ai_data['choices'][0]['message']['content']
                    # Handle potential markdown blocks in AI response
                    if "```json" in content_str:
                        content_str = content_str.split("```json")[1].split("```")[0]
                    elif "```" in content_str:
                        content_str = content_str.split("```")[1].split("```")[0]
                    
                    parsed_ai = json.loads(content_str.strip())
                    
                    adapter["description"] = parsed_ai.get("description_vi", "").strip()
                    adapter["requirements"] = parsed_ai.get("requirements_vi", "").strip()
                    adapter["benefits"] = parsed_ai.get("benefits_vi", "").strip()
                    adapter["skills"] = list(set(adapter.get("skills", []) + parsed_ai.get("skills", [])))
                    spider.logger.info(f"AI processing successful for: {adapter.get('title')}")
                else:
                    spider.logger.error(f"AI API failed with status {response.status_code}: {response.text}")
        except Exception as e:
            spider.logger.error(f"Error in AI processing: {e}")
            # Fallback to basic cleaning if AI fails
            adapter["description"] = text

        return item
class DatabasePipeline:
    def __init__(self):
        self.engine = create_async_engine(settings.DATABASE_URL)
        self.async_session = async_sessionmaker(self.engine, expire_on_commit=False)

    async def close_spider(self, spider):
        await self.engine.dispose()

    async def process_item(self, item, spider):
        adapter = ItemAdapter(item)
        async with self.async_session() as session:
            try:
                if "scholarship" in item.__class__.__name__.lower():
                    # Upsert logic for scholarships
                    stmt = insert(Scholarship).values(
                        title=adapter.get("title"),
                        organization=adapter.get("organization"),
                        country=adapter.get("country"),
                        level=adapter.get("level"),
                        field=adapter.get("field"),
                        coverage=adapter.get("coverage"),
                        amount=adapter.get("amount"),
                        deadline=adapter.get("deadline"),
                        description=adapter.get("description"),
                        requirements=adapter.get("requirements"),
                        benefits=adapter.get("benefits"),
                        application_process=adapter.get("application_process"),
                        url=adapter.get("url"),
                        source=adapter.get("source")
                    ).on_conflict_do_update(
                        index_elements=["url"],
                        set_={
                            "description": adapter.get("description"),
                            "requirements": adapter.get("requirements"),
                            "benefits": adapter.get("benefits"),
                            "application_process": adapter.get("application_process"),
                        }
                    )
                    await session.execute(stmt)
                else:
                    # Upsert logic for jobs
                    stmt = insert(Job).values(
                        title=adapter.get("title"),
                        company=adapter.get("company"),
                        location=adapter.get("location"),
                        salary_min=adapter.get("salary_min"),
                        salary_max=adapter.get("salary_max"),
                        description=adapter.get("description"),
                        requirements=adapter.get("requirements"),
                        benefits=adapter.get("benefits"),
                        company_info=adapter.get("company_info"),
                        skills=adapter.get("skills", []),
                        url=adapter.get("url"),
                        source=adapter.get("source"),
                        posted_at=adapter.get("posted_at")
                    )
                    upsert_stmt = stmt.on_conflict_do_update(
                        index_elements=["url"],
                        set_={
                            "title": stmt.excluded.title,
                            "salary_min": stmt.excluded.salary_min,
                            "salary_max": stmt.excluded.salary_max,
                            "description": stmt.excluded.description,
                            "requirements": stmt.excluded.requirements,
                            "benefits": stmt.excluded.benefits,
                            "crawled_at": datetime.utcnow()
                        }
                    )
                    await session.execute(upsert_stmt)
                
                await session.commit()
            except Exception as e:
                await session.rollback()
                spider.logger.error(f"Error saving item to DB (SQLAlchemy): {e}")
                spider.logger.error(traceback.format_exc())
        return item

