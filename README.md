# Opportify - Nền tảng Tìm kiếm Việc làm & Học bổng thông minh với AI

Opportify là một nền tảng hiện đại giúp kết nối ứng viên với hàng ngàn cơ hội việc làm và học bổng. Điểm khác biệt của dự án là việc ứng dụng Trí tuệ nhân tạo (AI) để phân tích CV, tư vấn nghề nghiệp và đề xuất cơ hội dựa trên sự tương đồng về năng lực thay vì chỉ khớp từ khóa đơn thuần.

## 🚀 Tính năng chính

- **Crawler tự động:** Tự động thu thập dữ liệu từ các nguồn uy tín như TopCV, ITViec, VietnamWorks, DAAD, Chevening...
- **AI Chatbot (Claude 3):** Trợ lý tư vấn lộ trình nghề nghiệp và giải đáp thắc mắc về tuyển dụng.
- **Phân tích CV AI:** Tự động trích xuất thông tin từ CV PDF để xây dựng hồ sơ năng lực.
- **Hồ sơ năng lực (Capability Profile):** Quản lý kỹ năng, kinh nghiệm và học vấn một cách chuyên nghiệp.
- **Đề xuất cá nhân hóa (Personalized Recommendations):** Thuật toán rule-based kết hợp vector search để gợi ý việc làm/học bổng phù hợp nhất với từng hồ sơ.
- **Tìm kiếm thông minh:** Tích hợp Meilisearch cho tốc độ tìm kiếm cực nhanh và gợi ý chính xác.

## 🛠️ Công nghệ sử dụng

- **Frontend:** Next.js 15 (App Router), Tailwind CSS, Lucide React.
- **Backend:** FastAPI (Python 3.11+), SQLAlchemy (PostgreSQL + pgvector).
- **Infras:** Docker (Postgres, Redis, Meilisearch).
- **Search Engine:** Meilisearch.
- **Task Queue:** Celery & Redis.
- **AI Integration:** Claude API (qua Custom LLM) & OpenAI Embeddings.
- **Crawler:** Scrapy & Playwright.

---

## 💻 Hướng dẫn Cài đặt & Chạy dự án

### 1. Yêu cầu hệ thống
- Docker & Docker Desktop.
- Python 3.11+.
- Node.js 18+.

### 2. Thiết lập Hạ tầng (Docker)
Khởi động cơ sở dữ liệu và các dịch vụ bổ trợ:
```bash
docker-compose up -d
```

### 3. Cài đặt & Chạy Backend
Mở một terminal mới:
```bash
cd backend
# Tạo môi trường ảo (khuyên dùng)
python -m venv venv
.\venv\Scripts\activate  # Windows
# Cài đặt dependencies
pip install -r requirements.txt
# Chạy migration và seed dữ liệu mẫu
python seed_profiles.py
# Khởi động server
uvicorn main:app --reload --port 8000
```
Server backend sẽ chạy tại: `http://localhost:8000`

### 4. Cài đặt & Chạy Frontend
Mở một terminal mới:
```bash
cd frontend
# Cài đặt dependencies
npm install
# Khởi động server phát triển
npm run dev
```
Truy cập ứng dụng tại: `http://localhost:3000`

---

## 📁 Cấu trúc thư mục
- `/backend`: Mã nguồn FastAPI và Crawlers.
- `/frontend`: Mã nguồn Next.js.
- `/references`: Tài liệu tham khảo và kiến trúc chi tiết.
- `docker-compose.yml`: Cấu hình các dịch vụ infrastructure.

## 📄 License
Dự án được phát triển cho mục đích học thuật và cộng đồng.

---
*Phát triển bởi Opportify Team.*
