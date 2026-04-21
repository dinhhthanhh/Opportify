from fastapi import APIRouter, File, UploadFile
from pydantic import BaseModel
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
