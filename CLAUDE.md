# CLAUDE.md

Hướng dẫn cho Claude Code (và các agent khác) khi làm việc trong repo này.

## Tổng quan

**Opportify** là nền tảng tìm **việc làm & học bổng** cho sinh viên (đặc biệt Đại học Bách khoa Hà Nội — HUST). Hệ thống thu thập/seed dữ liệu cơ hội, cho phép tìm kiếm – lọc – xem chi tiết, quản lý hồ sơ năng lực, và gợi ý cơ hội phù hợp dựa trên hồ sơ người dùng.

Monorepo gồm 2 phần:
- `backend/` — API FastAPI + SQLAlchemy async + PostgreSQL/Supabase.
- `frontend/` — Next.js 16 (App Router) + React 19 + Tailwind CSS v4.

## Lệnh chạy

### Backend (port 8001)
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python init_db.py            # khởi tạo schema nếu DB trống
python super_seed.py         # seed jobs + scholarships
python seed_profiles.py      # seed mock users
uvicorn main:app --reload --port 8001
```
Các script `migrate_*.py` dùng để ALTER bảng đã tồn tại trên Supabase (thêm cột mới mà không xoá dữ liệu).

### Frontend (port 3000)
```powershell
cd frontend
npm install
npm run dev      # dev server
npm run build    # build production (chạy để check lỗi TS/Next)
npm run lint     # eslint
```
Frontend gọi backend qua `NEXT_PUBLIC_API_URL` (mặc định `http://127.0.0.1:8001`).

## Kiến trúc backend

- `main.py` — tạo app, CORS, đăng ký router dưới prefix `/api/v1/*`, `lifespan` gọi `init_database()`.
- `models/` — `Job`, `Scholarship`, `User` (kiêm hồ sơ năng lực), `Application`.
- `routers/`:
  - `jobs.py`, `scholarships.py` — list (search/filter/sort/pagination) + detail.
  - `recommend.py` — **engine matching rule-based** (không phải LLM). Tính `match_score` thang **0–100** kèm `match_reasons`. Các helper (`_skills_overlap_score`, `_level_score`, `_location_score`...) được **tái dùng** trong `jobs.py`/`scholarships.py` cho sort `match_score`.
  - `profile.py` — `/me` (đọc/cập nhật hồ sơ user hiện tại), `/{user_id}`, `/mock-users`.
  - `ai.py` — gọi **custom LLM** (OpenAI-compatible) cho `chat`, `insight`, `analyze-cv`. Đây là chỗ duy nhất dùng LLM thật.
  - `auth.py`, `applications.py`.
- `uploads/` — file người dùng tải lên (avatar), phục vụ tĩnh tại `/uploads` (mount trong `main.py`). Endpoint `POST /api/v1/profile/avatar` lưu ảnh và cập nhật `user.avatar_url` (đường dẫn tương đối; frontend tự ghép `API_URL`). Thư mục này nằm trong `.gitignore`.
- `db/database.py` — engine async; `init_database()` tạo bảng qua `Base.metadata.create_all`.
- `db/auth.py` — JWT (jose) + bcrypt; `get_current_user` decode token theo `email`.
- `crawlers/` — Scrapy spiders (topcv, vietnamworks, daad, mext...). Tùy chọn cho cào dữ liệu thực.
- `config.py` — `Settings` (pydantic) đọc `backend/.env`.

## Kiến trúc frontend

- `src/app/` — pages: `/`, `/jobs`, `/jobs/[id]`, `/scholarships`, `/scholarships/[id]`, `/profile`, `/auth/*`.
- `src/components/` — `cards/` (JobCard, ScholarshipCard), `search/` (SearchBar, FilterPanel, ScholarshipFilterPanel, SortDropdown, Pagination), `layout/` (Navbar, Footer), `ai/` (AIInsightCard), `chatbot/` (ChatWidget).
- `src/lib/api.ts` — client gọi backend; `api.auth.autoLogin()` tự đăng nhập **mock user `an_nguyen`** (auth MVP).
- `src/lib/types.ts` — `Job`, `Scholarship`, `UserProfile`, `RecommendedJob/Scholarship`...

## Quy ước & cạm bẫy quan trọng

- ⚠️ **`frontend/AGENTS.md`: "This is NOT the Next.js you know".** Trước khi viết code Next.js, đọc `frontend/node_modules/next/dist/docs/`. Lưu ý `searchParams` của page là **Promise** (phải `await`).
- **`match_score` đã ở thang 0–100** (đã là %). KHÔNG nhân thêm `* 100` khi hiển thị (đây là nguồn của bug hiển thị "8330%").
- **Supabase Pooler**: mọi engine async phải tắt prepared statement cache (`prepared_statement_cache_size=0`, `statement_cache_size=0`), xem các script seed/migrate.
- **Cột mới trên DB Supabase đã có dữ liệu** phải `ALTER TABLE ... ADD COLUMN` (viết script `migrate_*.py`), không chỉ dựa vào `create_all`. Các cột mở rộng (work_mode, scholarship min_gpa/language_requirement, user gpa + contact_email/phone/github_url/linkedin_url/portfolio_url) nằm trong `migrate_filters.py`.
- **Bộ lọc (FilterPanel / ScholarshipFilterPanel)** dùng cơ chế "staged": thay đổi chỉ cập nhật state cục bộ, chỉ đẩy lên URL khi bấm **Áp dụng** (nút "Xóa lọc" để reset). Panel cao tối đa bằng màn hình, body cuộn, thanh nút luôn cố định ở đáy.
- **Sắp xếp mặc định** của cả jobs và scholarships là "Hạn nộp gần nhất" (`sort_by=deadline`, `order=asc`); tin đã hết hạn luôn bị đẩy xuống cuối với mọi kiểu sort.
- ⚠️ Khi chạy script Python in tiếng Việt/emoji trên Windows PowerShell, đặt `$env:PYTHONIOENCODING="utf-8"` để tránh lỗi cp1252.
- Một số class Tailwind không hợp lệ tồn tại trong code (vd `indigo-650`, `slate-450`, `rose-450`) — chúng render rỗng. Khi sửa giao diện liên quan tương phản màu, dùng bậc màu Tailwind hợp lệ.
- Người dùng ưu tiên giao diện/nội dung tiếng Việt tự nhiên, **không phô trương "AI"**.

## Tài liệu thiết kế (spec tham khảo)

Ở root có 3 file spec định hướng dữ liệu/UX (schema viết theo NestJS/TypeORM chỉ mang tính tham khảo — dự án thực tế dùng FastAPI/SQLAlchemy, mở rộng thực dụng trên bảng hiện có):
- `huong_dan_database_nganh_nghe_hust.md` — nhóm ngành/career track HUST, bộ lọc việc làm, công thức scoring.
- `oppotify_scholarship_design.md` — data model & bộ lọc học bổng, tag hiển thị.
- `oppotify_user_capability_profile_design.md` — thiết kế hồ sơ năng lực người dùng.
