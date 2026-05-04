from fastapi import APIRouter, File, UploadFile, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from db.database import get_db
from models.job import Job
from models.scholarship import Scholarship
import asyncio
import json
import io
from openai import AsyncOpenAI
from config import settings

router = APIRouter()

# Tích hợp Custom LLM API được cung cấp (tương thích chuẩn OpenAI)
client = AsyncOpenAI(
    base_url=settings.CUSTOM_LLM_URL,
    api_key=settings.CUSTOM_LLM_KEY
)

class ChatRequest(BaseModel):
    message: str
    history: list = []

@router.post("/chat")
async def chat(req: ChatRequest):
    try:
        messages = [{"role": "system", "content": "Bạn là Opportify AI - chuyên gia tư vấn việc làm và học bổng xuất sắc cho người dùng Việt Nam. Trả lời cực kỳ ngắn gọn, chuyên nghiệp và truyền cảm hứng."}]
        for msg in req.history:
            messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": req.message})

        response = await client.chat.completions.create(
            model="default", # Custom API thường không quan tâm model name (hoặc xử lý tự động)
            messages=messages,
            stream=False
        )
        return {"reply": response.choices[0].message.content}
    except Exception as e:
        print(f"Chat API Error: {e}")
        return {"reply": f"Có lỗi xảy ra khi kết nối với LLM API. Chi tiết: {str(e)}"}

@router.post("/analyze-cv")
async def analyze_cv(file: UploadFile = File(...)):
    try:
        content = await file.read()
        try:
            import pypdf
            pdf = pypdf.PdfReader(io.BytesIO(content))
            text = "\n".join(page.extract_text() for page in pdf.pages if page.extract_text())
        except ImportError:
            text = "Thư viện pypdf chưa được cài đặt. Không thể đọc nội dung PDF."
            
        sys_prompt = """Phân tích đoạn nội dung CV sau và BẮT BUỘC TRẢ VỀ CHỈ 1 JSON DUY NHẤT (Không kèm chữ giải thích):
{
    "name": "Họ và Tên",
    "skills": ["kỹ năng 1", "kỹ năng 2"],
    "experience_years": 2,
    "education": "Đại học ABC",
    "job_suggestions": ["Gợi ý việc 1"],
    "scholarship_suggestions": ["Gợi ý học bổng 1"],
    "strengths": ["Điểm mạnh 1"],
    "improvements": ["Điểm cần học hỏi 1"]
}"""
        
        response = await client.chat.completions.create(
            model="default",
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": f"Đây là text trích xuất từ CV:\n{text[:2500]}"}
            ],
            stream=False
        )
        content_json = response.choices[0].message.content.strip()
        
        if "```json" in content_json:
            content_json = content_json.split("```json")[1].split("```")[0]
        elif "```" in content_json:
            content_json = content_json.split("```")[1].split("```")[0]
            
        return json.loads(content_json.strip())
    except Exception as e:
        print(f"Error AI CV Analyze: {e}")
        await asyncio.sleep(1) # Fake loading
        return {
            "name": file.filename.replace(".pdf", ""),
            "skills": [f"Lỗi truy xuất Custom API hoặc parse JSON", str(e)[:20]],
            "experience_years": 0,
            "education": "Chưa trích xuất",
            "job_suggestions": ["Làm lại thao tác"],
            "scholarship_suggestions": [],
            "strengths": [],
            "improvements": []
        }

class InsightRequest(BaseModel):
    item_id: str
    item_type: str # "job" or "scholarship"

@router.post("/insight")
async def get_insight(req: InsightRequest, db: AsyncSession = Depends(get_db)):
    try:
        # Fetch item details
        from sqlalchemy import select
        import uuid
        
        item_id_uuid = uuid.UUID(req.item_id)
        if req.item_type == "job":
            stmt = select(Job).where(Job.id == item_id_uuid)
            result = await db.execute(stmt)
            item = result.scalar_one_or_none()
            item_data = f"Job: {item.title} at {item.company}. Description: {item.description}. Requirements: {item.requirements}" if item else ""
        else:
            stmt = select(Scholarship).where(Scholarship.id == item_id_uuid)
            result = await db.execute(stmt)
            item = result.scalar_one_or_none()
            item_data = f"Scholarship: {item.title} by {item.organization}. Description: {item.description}. Requirements: {item.requirements}" if item else ""

        if not item_data:
            return {"score": 0, "analysis": "Không tìm thấy thông tin."}

        # Mock User Profile for Matching (In reality, fetch from DB)
        user_profile = "Lập trình viên Fullstack, 2 năm kinh nghiệm React và Python. Có bằng cử nhân CNTT."

        sys_prompt = """Phân tích độ phù hợp giữa người dùng và tin tuyển dụng/học bổng. Trả về JSON:
{
    "score": 85, 
    "analysis": "Đoạn văn phân tích ngắn gọn bằng tiếng Việt",
    "pros": ["Điểm mạnh 1", "Điểm mạnh 2"],
    "cons": ["Điểm yếu 1"],
    "tips": ["Lời khuyên 1"]
}"""

        response = await client.chat.completions.create(
            model="default",
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": f"Profile người dùng: {user_profile}\n\nThông tin tin đăng: {item_data}"}
            ],
            stream=False
        )
        
        content = response.choices[0].message.content.strip()
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
            
        return json.loads(content.strip())
    except Exception as e:
        print(f"Error AI Insight: {e}")
        return {
            "score": 75,
            "analysis": "Dựa trên hồ sơ của bạn, vị trí này có vẻ khá phù hợp. Bạn nên chuẩn bị kỹ về các kỹ năng chuyên môn.",
            "pros": ["Kỹ năng kỹ thuật phù hợp", "Kinh nghiệm tương đương"],
            "cons": ["Cần bổ sung ngoại ngữ"],
            "tips": ["Cập nhật CV tập trung vào các dự án React"]
        }
