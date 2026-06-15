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
    user_id: str
    certificates: str | None = None
    research_papers: str | None = None
    target_country: str | None = None
    target_degree: str | None = None
    language_scores: str | None = None

@router.post("/insight")
async def get_insight(req: InsightRequest, db: AsyncSession = Depends(get_db)):
    try:
        from sqlalchemy import select
        import uuid
        from models.user import User
        from routers.recommend import calculate_job_match, calculate_scholarship_match
        
        # Fetch user
        user_id_uuid = uuid.UUID(req.user_id)
        user_result = await db.execute(select(User).where(User.id == user_id_uuid))
        user = user_result.scalar_one_or_none()
        if not user:
            return {"score": 0, "analysis": "Không tìm thấy hồ sơ người dùng."}

        item_id_uuid = uuid.UUID(req.item_id)
        score = 0
        match_reasons = []

        if req.item_type == "job":
            stmt = select(Job).where(Job.id == item_id_uuid)
            result = await db.execute(stmt)
            item = result.scalar_one_or_none()
            if not item:
                return {"score": 0, "analysis": "Không tìm thấy công việc."}
            score, match_reasons = calculate_job_match(user, item, req.certificates)
        else:
            stmt = select(Scholarship).where(Scholarship.id == item_id_uuid)
            result = await db.execute(stmt)
            item = result.scalar_one_or_none()
            if not item:
                return {"score": 0, "analysis": "Không tìm thấy học bổng."}
            score, match_reasons = calculate_scholarship_match(
                user, item, req.target_degree, req.target_country, 
                req.certificates, req.research_papers, req.language_scores
            )

        sys_prompt = f"""Bạn là Opportify Insight AI.
Dựa vào các lý do khớp (Match Reasons) sau đây, hãy viết một đoạn phân tích ngắn (2-3 câu) về mức độ phù hợp, và phân loại các lý do đó thành 'pros' (điểm mạnh/phù hợp) và 'cons' (điểm yếu/chưa phù hợp). Sinh ra 1-2 'tips' (lời khuyên) cho ứng viên.
LƯU Ý: BẮT BUỘC TRẢ VỀ JSON ĐÚNG ĐỊNH DẠNG. Điểm số (score) PHẢI LÀ {round(score, 1)}. Không thay đổi điểm số.
{{
    "score": {round(score, 1)}, 
    "analysis": "Đoạn văn phân tích ngắn gọn",
    "pros": ["Điểm mạnh 1", "Điểm mạnh 2"],
    "cons": ["Điểm yếu 1"],
    "tips": ["Lời khuyên 1"]
}}"""
        
        user_prompt = "Các lý do khớp từ hệ thống (có thể chứa điểm cộng và điểm trừ):\n" + "\n".join([f"- {r}" for r in match_reasons])

        response = await client.chat.completions.create(
            model="default",
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": user_prompt}
            ],
            stream=False
        )
        
        content = response.choices[0].message.content.strip()
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
            
        result_json = json.loads(content.strip())
        # Force the score to match rule-based exactly
        result_json["score"] = round(score, 1)
        return result_json
    except Exception as e:
        print(f"Error AI Insight: {e}")
        return {
            "score": round(score, 1) if 'score' in locals() else 0,
            "analysis": "Hệ thống AI đang quá tải, nhưng đây là kết quả phân tích theo thuật toán hệ thống.",
            "pros": match_reasons if 'match_reasons' in locals() else [],
            "cons": [],
            "tips": ["Hãy chuẩn bị hồ sơ thật tốt trước khi ứng tuyển."]
        }
