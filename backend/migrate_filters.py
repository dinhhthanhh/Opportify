"""
migrate_filters.py — Thêm các cột phục vụ bộ lọc mới vào DB hiện có.
Chạy một lần: python migrate_filters.py
"""
import asyncio
from db.database import engine
from sqlalchemy import text

ALTER_STATEMENTS = [
    # Job: hình thức làm việc
    "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS work_mode VARCHAR(50)",
    # Scholarship: lọc theo GPA & ngoại ngữ
    "ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS min_gpa DOUBLE PRECISION",
    "ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS language_requirement VARCHAR(255)",
    # User: GPA cho hồ sơ năng lực
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS gpa DOUBLE PRECISION",
    # User: thông tin liên hệ
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS github_url VARCHAR(500)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(500)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS portfolio_url VARCHAR(500)",
]

async def migrate():
    async with engine.begin() as conn:
        for stmt in ALTER_STATEMENTS:
            await conn.execute(text(stmt))
            print(f"  ✅ {stmt}")
    print("\n🎉 Migration hoàn tất!")

if __name__ == "__main__":
    asyncio.run(migrate())
