import asyncio
import uuid
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from models.job import Job
from models.user import User
from models.scholarship import Scholarship
from db.auth import get_password_hash
from config import settings
from datetime import datetime

from db.database import engine, async_session, init_database

async def seed_data():
    # Khởi tạo bảng nếu chưa có
    await init_database()
    
    async with async_session() as session:
        async with session.begin():
            # Seed Users
            users = [
                User(
                    id=uuid.uuid4(),
                    email="admin@opportify.ai",
                    username="admin",
                    # Hash of "admin123"
                    hashed_password="$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGGa31S.",
                    is_active=True,
                    latitude="21.0285", # Hà Nội
                    longitude="105.8542"
                ),
                User(
                    id=uuid.uuid4(),
                    email="student@example.com",
                    username="student",
                    # Hash of "student123"
                    hashed_password="$2b$12$Y5y5S0mJ5.5O/5.5y5S0mO.5y5S0mO.5y5S0mO.5y5S0mO.5y5S0mO",
                    is_active=True,
                    latitude="10.7626", # TP. HCM
                    longitude="106.6602"
                )
            ]
            
            # Seed Scholarships
            scholarships = [
                Scholarship(
                    id=uuid.uuid4(),
                    title="DAAD Development-Related Postgraduate Courses",
                    organization="DAAD Germany",
                    country="Germany",
                    level="master",
                    field="Economics, Engineering, Agriculture",
                    coverage="full",
                    amount="1,200 EUR/month",
                    deadline=datetime(2024, 10, 31),
                    description="The EPOS program offers scholarships for postgraduate courses at German universities for professionals from developing countries.",
                    url="https://www.daad.de/en/study-and-research-in-germany/scholarships/",
                    source="daad"
                ),
                Scholarship(
                    id=uuid.uuid4(),
                    title="Chevening Scholarship",
                    organization="UK Government",
                    country="United Kingdom",
                    level="master",
                    field="Any",
                    coverage="full",
                    amount="Full tuition + Living allowance",
                    deadline=datetime(2024, 11, 7),
                    description="Chevening is the UK government’s international awards programme aimed at developing global leaders.",
                    url="https://www.chevening.org/scholarship/vietnam/",
                    source="chevening"
                )
            ]
            
            # Seed Jobs
            jobs = [
                Job(
                    id=uuid.uuid4(),
                    title="Kỹ sư Trí tuệ Nhân tạo (AI Engineer)",
                    company="VinAI Research",
                    location="Hà Nội",
                    salary_min=40000000,
                    salary_max=80000000,
                    salary_currency="VND",
                    description="Phát triển các mô hình học máy tiên tiến cho xe tự lái.",
                    skills=["Python", "PyTorch", "Computer Vision"],
                    job_type="fulltime",
                    experience="junior",
                    url="https://vinai.io/jobs/ai-engineer",
                    source="direct",
                    crawled_at=datetime.utcnow()
                ),
                Job(
                    id=uuid.uuid4(),
                    title="Senior React Developer",
                    company="VNG Corporation",
                    location="TP. Hồ Chí Minh",
                    salary_min=35000000,
                    salary_max=60000000,
                    salary_currency="VND",
                    description="Xây dựng giao diện người dùng cho ứng dụng Zalo.",
                    skills=["React", "TypeScript", "Tailwind"],
                    job_type="fulltime",
                    experience="senior",
                    url="https://vng.com.vn/career/senior-react",
                    source="direct",
                    crawled_at=datetime.utcnow()
                )
            ]
            
            for item in users + scholarships + jobs:
                try:
                    session.add(item)
                except Exception as e:
                    print(f"Error seeding {item}: {e}")
                    
        print("Đã seed dữ liệu mẫu (Users, Scholarships, Jobs) thành công!")

if __name__ == "__main__":
    asyncio.run(seed_data())
