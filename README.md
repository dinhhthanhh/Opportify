# Opportify - Nền tảng Tìm kiếm Việc làm & Học bổng thông minh với AI

Opportify giúp kết nối ứng viên với các cơ hội việc làm và học bổng, đồng thời ứng dụng AI để phân tích CV, tư vấn nghề nghiệp và gợi ý cơ hội dựa trên hồ sơ năng lực.

## Tính năng chính

- **Crawler tự động:** Thu thập dữ liệu từ các nguồn việc làm và học bổng.
- **AI Chatbot:** Trợ lý tư vấn lộ trình nghề nghiệp và giải đáp thắc mắc tuyển dụng.
- **Phân tích CV AI:** Trích xuất thông tin từ CV PDF để xây dựng hồ sơ năng lực.
- **Hồ sơ năng lực:** Quản lý kỹ năng, kinh nghiệm, học vấn và mục tiêu nghề nghiệp.
- **Gợi ý cá nhân hóa:** Kết hợp rule-based matching và vector search.
- **Tìm kiếm cơ hội:** Frontend gọi API backend để hiển thị việc làm, học bổng và hồ sơ ứng tuyển.

## Công nghệ

- **Frontend:** Next.js 16, React 19, Tailwind CSS, Lucide React.
- **Backend:** FastAPI, SQLAlchemy async, PostgreSQL/Supabase.
- **AI:** Custom LLM endpoint, OpenAI-compatible client.
- **Crawler:** Scrapy, Playwright.

## Yêu cầu

- Python 3.11+
- Node.js 18+
- Một Supabase project đã tạo sẵn
- PostgreSQL connection string từ Supabase

Dự án hiện chạy backend và frontend trực tiếp trên máy local. Không cần Docker.

## Cấu hình Supabase

1. Mở Supabase project.
2. Vào phần database connection string và lấy URI PostgreSQL.
3. Nếu dùng Supabase Pooler, dùng host/port pooler của project và thay đúng database password.
4. Nếu password có ký tự đặc biệt, encode password trong URL. Ví dụ `/` thành `%2F`.

Tạo file `backend/.env`:

```env
DATABASE_URL=postgresql+asyncpg://postgres.<project-ref>:<password>@aws-1-<region>.pooler.supabase.com:6543/postgres
CUSTOM_LLM_URL=http://your-llm-host/v1
CUSTOM_LLM_KEY=your-custom-llm-key
SECRET_KEY=change-me
```

Các biến tùy chọn, chỉ cần khi dùng tính năng liên quan:

```env
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
REDIS_URL=redis://localhost:6379/0
MEILISEARCH_URL=http://localhost:7700
MEILISEARCH_KEY=your-master-key
```

Lưu ý với Supabase Pooler: các script tự tạo SQLAlchemy async engine cần tắt prepared statement cache bằng `prepared_statement_cache_size=0` và `statement_cache_size=0`.

## Chạy backend

Mở terminal tại thư mục root của dự án:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

Khởi tạo database nếu Supabase project chưa có schema:

```powershell
python init_db.py
```

Seed dữ liệu mẫu:

```powershell
python seed_profiles.py
```

Khởi động API:

```powershell
uvicorn main:app --reload --port 8001
```

Backend chạy tại `http://localhost:8001`.

## Chạy frontend

Mở terminal khác tại thư mục root của dự án:

```powershell
cd frontend
npm install
npm run dev
```

Frontend chạy tại `http://localhost:3000`.

Mặc định frontend gọi backend qua `http://127.0.0.1:8001`. Nếu cần đổi API URL, tạo file `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8001
```

## Luồng chạy khuyến nghị

1. Kiểm tra Supabase project đang hoạt động và `DATABASE_URL` đúng.
2. Cài backend dependencies bằng `pip install -r requirements.txt`.
3. Chạy `python init_db.py` nếu database chưa có schema.
4. Chạy `python seed_profiles.py`.
5. Chạy backend bằng `uvicorn main:app --reload --port 8001`.
6. Cài frontend dependencies bằng `npm install`.
7. Chạy frontend bằng `npm run dev`.
8. Mở `http://localhost:3000`.

## Cấu trúc thư mục

- `backend`: Mã nguồn FastAPI, models, routers, crawlers và script seed/migrate.
- `frontend`: Mã nguồn Next.js.
- `references`: Tài liệu tham khảo và thiết kế.

## Troubleshooting

- **`tenant/user ... not found`:** `DATABASE_URL` sai project ref, username, password hoặc Supabase project chưa được khởi động lại.
- **`DuplicatePreparedStatementError`:** Đang dùng Supabase Pooler nhưng engine chưa tắt prepared statement cache.
- **Frontend không có dữ liệu:** Đảm bảo backend đang chạy tại `localhost:8001` và `NEXT_PUBLIC_API_URL` đúng.
- **Seed báo đã tồn tại:** Dữ liệu mẫu đã có trong database, có thể tiếp tục chạy app.
