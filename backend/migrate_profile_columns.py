"""
migrate_profile_columns.py — Thêm các cột hồ sơ năng lực vào bảng users hiện có.
Chạy một lần: python migrate_profile_columns.py
"""
import asyncio
from db.database import engine
from sqlalchemy import text

ALTER_STATEMENTS = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}'",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS experience_level VARCHAR(50)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS education_level VARCHAR(50)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS education_field VARCHAR(255)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS university VARCHAR(255)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_locations TEXT[] DEFAULT '{}'",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_job_types TEXT[] DEFAULT '{}'",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS interest_fields TEXT[] DEFAULT '{}'",
]

async def migrate():
    async with engine.begin() as conn:
        for stmt in ALTER_STATEMENTS:
            await conn.execute(text(stmt))
            print(f"  ✅ {stmt}")
    print("\n🎉 Migration hoàn tất!")

if __name__ == "__main__":
    asyncio.run(migrate())
