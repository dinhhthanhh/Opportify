"""
seed_profiles.py — Tạo 5 mock users với hồ sơ năng lực đa dạng.

Chạy: python seed_profiles.py
"""
import asyncio
import uuid
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select
from models.user import User
from db.auth import get_password_hash
from config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    connect_args={
        "prepared_statement_cache_size": 0,
        "statement_cache_size": 0,
    },
)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

MOCK_USERS = [
    {
        "email": "an.nguyen@mock.opportify",
        "username": "an_nguyen",
        "password": "mock1234",
        "full_name": "Nguyễn Minh An",
        "bio": "Sinh viên năm 4 Công nghệ Thông tin, đam mê AI và Machine Learning. Tìm kiếm internship hoặc fresher job.",
        "skills": ["Python", "TensorFlow", "PyTorch", "Machine Learning", "Data Analysis", "SQL", "Git"],
        "experience_years": 0,
        "experience_level": "fresher",
        "education_level": "bachelor",
        "education_field": "Công nghệ Thông tin",
        "university": "Đại học Bách Khoa Hà Nội",
        "preferred_locations": ["Hà Nội"],
        "preferred_job_types": ["internship", "fulltime"],
        "interest_fields": ["AI", "Machine Learning", "Data Science"],
    },
    {
        "email": "linh.tran@mock.opportify",
        "username": "linh_tran",
        "password": "mock1234",
        "full_name": "Trần Phương Linh",
        "bio": "Frontend Developer 3 năm kinh nghiệm. Thành thạo React, Next.js và TypeScript. Tìm kiếm vị trí mid-level tại HCM.",
        "skills": ["React", "Next.js", "TypeScript", "Tailwind CSS", "GraphQL", "Jest", "Figma"],
        "experience_years": 3,
        "experience_level": "mid",
        "education_level": "bachelor",
        "education_field": "Kỹ thuật Phần mềm",
        "university": "Đại học FPT",
        "preferred_locations": ["TP. Hồ Chí Minh"],
        "preferred_job_types": ["fulltime"],
        "interest_fields": ["Frontend", "UI/UX", "Web Development"],
    },
    {
        "email": "duc.le@mock.opportify",
        "username": "duc_le",
        "password": "mock1234",
        "full_name": "Lê Quốc Đức",
        "bio": "Senior Backend Engineer 6 năm kinh nghiệm với Python/FastAPI và hệ thống phân tán. Đang tìm kiếm challenge mới.",
        "skills": ["Python", "FastAPI", "Django", "PostgreSQL", "Redis", "Docker", "Kubernetes", "AWS", "Microservices"],
        "experience_years": 6,
        "experience_level": "senior",
        "education_level": "bachelor",
        "education_field": "Khoa học Máy tính",
        "university": "Đại học Quốc gia Hà Nội",
        "preferred_locations": ["Hà Nội", "TP. Hồ Chí Minh"],
        "preferred_job_types": ["fulltime"],
        "interest_fields": ["Backend", "Cloud", "DevOps", "System Design"],
    },
    {
        "email": "mai.pham@mock.opportify",
        "username": "mai_pham",
        "password": "mock1234",
        "full_name": "Phạm Thị Mai",
        "bio": "Nghiên cứu sinh Tiến sĩ ngành Kinh tế quốc tế. Đang tìm học bổng thạc sĩ/tiến sĩ tại Châu Âu.",
        "skills": ["Research", "Data Analysis", "SPSS", "R", "Academic Writing", "English (IELTS 7.5)", "German (B1)"],
        "experience_years": 2,
        "experience_level": "junior",
        "education_level": "master",
        "education_field": "Kinh tế Quốc tế",
        "university": "Đại học Ngoại thương",
        "preferred_locations": ["Germany", "UK", "Netherlands"],
        "preferred_job_types": ["fulltime", "research"],
        "interest_fields": ["Economics", "Finance", "International Relations", "Research"],
    },
    {
        "email": "khang.vo@mock.opportify",
        "username": "khang_vo",
        "password": "mock1234",
        "full_name": "Võ Thanh Khang",
        "bio": "Data Engineer 2 năm kinh nghiệm xây dựng data pipeline. Đam mê Big Data và Cloud computing.",
        "skills": ["Python", "SQL", "Apache Spark", "Airflow", "dbt", "BigQuery", "Snowflake", "Kafka"],
        "experience_years": 2,
        "experience_level": "junior",
        "education_level": "bachelor",
        "education_field": "Hệ thống Thông tin",
        "university": "Đại học Kinh tế TP.HCM",
        "preferred_locations": ["TP. Hồ Chí Minh"],
        "preferred_job_types": ["fulltime"],
        "interest_fields": ["Data Engineering", "Big Data", "Cloud", "Analytics"],
    },
]


async def seed():
    async with AsyncSessionLocal() as session:
        async with session.begin():
            created = 0
            skipped = 0
            for data in MOCK_USERS:
                # Check nếu đã tồn tại
                existing = await session.execute(
                    select(User).where(User.email == data["email"])
                )
                if existing.scalar_one_or_none():
                    print(f"  ⚠️  Đã tồn tại: {data['email']}")
                    skipped += 1
                    continue

                user = User(
                    id=uuid.uuid4(),
                    email=data["email"],
                    username=data["username"],
                    hashed_password=get_password_hash(data["password"]),
                    is_active=True,
                    full_name=data["full_name"],
                    bio=data["bio"],
                    skills=data["skills"],
                    experience_years=data["experience_years"],
                    experience_level=data["experience_level"],
                    education_level=data["education_level"],
                    education_field=data["education_field"],
                    university=data["university"],
                    preferred_locations=data["preferred_locations"],
                    preferred_job_types=data["preferred_job_types"],
                    interest_fields=data["interest_fields"],
                )
                session.add(user)
                print(f"  ✅ Tạo: {data['full_name']} ({data['email']})")
                created += 1

        print(f"\n🎉 Hoàn thành! Tạo mới: {created} | Bỏ qua: {skipped}")

        # In ra danh sách ID để dùng test
        all_mocks = await session.execute(
            select(User).where(User.email.like("%@mock.opportify%"))
        )
        users = all_mocks.scalars().all()
        print("\n📋 Danh sách mock users:")
        for u in users:
            print(f"  • {u.full_name} | ID: {u.id} | Level: {u.experience_level}")


if __name__ == "__main__":
    asyncio.run(seed())
