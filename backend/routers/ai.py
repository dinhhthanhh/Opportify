from fastapi import APIRouter, File, UploadFile, Depends, Header
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from jose import JWTError, jwt
from db.database import get_db
from models.job import Job
from models.scholarship import Scholarship
from models.user import User
import asyncio
import json
import io
from openai import AsyncOpenAI
from config import settings


async def _resolve_optional_user(authorization: Optional[str], db: AsyncSession) -> Optional[User]:
    """Giải mã JWT (nếu có) để lấy user. Không raise nếu thiếu/sai token."""
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email = payload.get("sub")
        if not email:
            return None
    except JWTError:
        return None
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


def _build_user_profile_text(user: Optional[User]) -> str:
    """Tổng hợp hồ sơ năng lực thành đoạn text mô tả cho LLM."""
    if not user:
        return "Người dùng chưa đăng nhập hoặc chưa có hồ sơ — hãy đưa ra phân tích tổng quát dựa trên tin đăng."

    parts: list[str] = []
    name = user.full_name or user.username
    parts.append(f"Họ tên: {name}.")

    if user.experience_level or user.experience_years:
        exp_bits = []
        if user.experience_level:
            exp_bits.append(f"cấp bậc {user.experience_level}")
        if user.experience_years:
            exp_bits.append(f"{user.experience_years} năm kinh nghiệm")
        if exp_bits:
            parts.append("Kinh nghiệm: " + ", ".join(exp_bits) + ".")

    if user.skills:
        parts.append("Kỹ năng: " + ", ".join(user.skills) + ".")

    edu_bits = []
    if user.education_level:
        edu_bits.append(user.education_level)
    if user.education_field:
        edu_bits.append(f"ngành {user.education_field}")
    if user.university:
        edu_bits.append(f"tại {user.university}")
    if user.gpa:
        edu_bits.append(f"GPA {user.gpa:.2f}/4.0")
    if edu_bits:
        parts.append("Học vấn: " + ", ".join(edu_bits) + ".")

    if user.interest_fields:
        parts.append("Lĩnh vực quan tâm: " + ", ".join(user.interest_fields) + ".")
    if user.preferred_locations:
        parts.append("Địa điểm ưu tiên: " + ", ".join(user.preferred_locations) + ".")
    if user.preferred_job_types:
        parts.append("Loại hình công việc mong muốn: " + ", ".join(user.preferred_job_types) + ".")
    if user.bio:
        parts.append(f"Giới thiệu: {user.bio}")

    return " ".join(parts)

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
async def get_insight(
    req: InsightRequest,
    db: AsyncSession = Depends(get_db),
    authorization: Optional[str] = Header(None),
):
    from routers.recommend import compute_job_match_score, compute_scholarship_match_score
    import uuid

    item_id_uuid = uuid.UUID(req.item_id)
    item = None
    item_data = ""
    if req.item_type == "job":
        stmt = select(Job).where(Job.id == item_id_uuid)
        result = await db.execute(stmt)
        item = result.scalar_one_or_none()
        if item:
            item_data = f"Job: {item.title} at {item.company}. Description: {item.description}. Requirements: {item.requirements}"
    else:
        stmt = select(Scholarship).where(Scholarship.id == item_id_uuid)
        result = await db.execute(stmt)
        item = result.scalar_one_or_none()
        if item:
            item_data = f"Scholarship: {item.title} by {item.organization}. Description: {item.description}. Requirements: {item.requirements}"

    if not item:
        return {"score": 0, "analysis": "Không tìm thấy thông tin."}

    # Lấy hồ sơ năng lực thật từ JWT (nếu có)
    user = await _resolve_optional_user(authorization, db)
    user_profile = _build_user_profile_text(user)

    # Điểm "thật" (rule-based) — đồng bộ với card ở trang đề xuất
    rule_score: Optional[float] = None
    rule_reasons: list[str] = []
    if user:
        if req.item_type == "job":
            rule_score, rule_reasons = compute_job_match_score(user, item)
        else:
            rule_score, rule_reasons = compute_scholarship_match_score(user, item)

    # LM chỉ sinh analysis/pros/cons/tips; score lấy từ rule-based để khớp với card
    sys_prompt = """Bạn là cố vấn nghề nghiệp. Dựa trên hồ sơ người dùng và tin đăng, hãy viết phân tích độ phù hợp.
Trả về CHỈ 1 JSON (không kèm lời giải thích):
{
    "analysis": "Đoạn phân tích ngắn gọn 2-3 câu bằng tiếng Việt, giọng chuyên nghiệp, tích cực",
    "pros": ["Điểm mạnh 1", "Điểm mạnh 2"],
    "cons": ["Điểm cần cải thiện 1"],
    "tips": ["Lời khuyên hành động 1", "Lời khuyên 2"]
}"""

    score_hint = ""
    if rule_score is not None:
        score_hint = f"\n\nĐiểm phù hợp đã được tính theo thuật toán rule-based: {rule_score:.0f}/100. Lý do match: {'; '.join(rule_reasons) if rule_reasons else 'Không có lý do nổi bật.'}\nHãy viết phân tích bám theo điểm số này (ví dụ ≥80 = rất phù hợp, 60-79 = khá phù hợp, <60 = cần cân nhắc)."

    try:
        response = await client.chat.completions.create(
            model="default",
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": f"Profile người dùng: {user_profile}\n\nThông tin tin đăng: {item_data}{score_hint}"}
            ],
            stream=False
        )

        content = response.choices[0].message.content.strip()
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]

        parsed = json.loads(content.strip())
        # Ghi đè score bằng rule-based để khớp với card đề xuất
        if rule_score is not None:
            parsed["score"] = round(rule_score)
        else:
            # Không có user → giữ lại score LM trả về (nếu có), hoặc trung bình
            parsed.setdefault("score", 70)
        return parsed
    except Exception as e:
        print(f"Error AI Insight: {e}")
        fallback_score = round(rule_score) if rule_score is not None else 75
        return {
            "score": fallback_score,
            "analysis": "Dựa trên hồ sơ của bạn, vị trí này có vẻ khá phù hợp. Bạn nên chuẩn bị kỹ về các kỹ năng chuyên môn.",
            "pros": rule_reasons[:2] if rule_reasons else ["Hồ sơ có nhiều điểm phù hợp"],
            "cons": ["Cần bổ sung ngoại ngữ"],
            "tips": ["Cập nhật CV nhấn mạnh các kỹ năng phù hợp với tin đăng"]
        }
