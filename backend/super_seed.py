import asyncio
import uuid
import random
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from models.job import Job
from models.scholarship import Scholarship
from config import settings
from datetime import datetime, timedelta

engine = create_async_engine(settings.DATABASE_URL)
async_session = async_sessionmaker(engine, expire_on_commit=False)

def generate_job_data():
    titles = [
        "Software Engineer", "Frontend Developer", "Backend Developer", "Fullstack Developer",
        "AI/ML Engineer", "Data Scientist", "DevOps Engineer", "Mobile App Developer",
        "Product Manager", "UI/UX Designer", "Marketing Manager", "Content Specialist",
        "Sales Executive", "Business Analyst", "Human Resources Manager", "Accountant",
        "Project Manager", "Cybersecurity Specialist", "Cloud Architect", "QA Tester"
    ]
    companies = [
        "VNG Corporation", "FPT Software", "Viettel Group", "VNPT", "Grab Vietnam", 
        "Shopee Vietnam", "Tiki.vn", "VinAI", "VinBrain", "Momo", "ZaloPay", 
        "Techcombank", "Vietcombank", "Vingroup", "Sendo", "Kyber Network", "Axcie Infinity"
    ]
    locations = ["Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Singapore", "Remote"]
    skills_pool = ["Python", "JavaScript", "React", "Node.js", "SQL", "Docker", "AWS", "Java", "Go", "TypeScript", "Tailwind", "Git", "AI", "Agile"]
    sources = ["direct", "vietnamworks", "linkedin", "topcv"]

    jobs = []
    for i in range(150):
        salary_min = random.randint(15, 60) * 1000000
        salary_max = salary_min + random.randint(10, 40) * 1000000
        
        jobs.append(Job(
            id=uuid.uuid4(),
            title=f"{random.choice(titles)} ({random.choice(['Senior', 'Junior', 'Mid-level'])})",
            company=random.choice(companies),
            location=random.choice(locations),
            salary_min=salary_min,
            salary_max=salary_max,
            salary_currency="VND",
            description=f"Chúng tôi đang tìm kiếm ứng viên xuất sắc cho vị trí này. Cơ hội làm việc trong môi trường năng động với đãi ngộ hấp dẫn.",
            skills=random.sample(skills_pool, k=min(len(skills_pool), random.randint(3, 6))),
            job_type=random.choice(["fulltime", "parttime", "contract"]),
            experience=random.choice(["fresher", "junior", "mid", "senior"]),
            url=f"https://opportify.ai/jobs/internal-{uuid.uuid4()}",
            source=random.choice(sources),
            crawled_at=datetime.utcnow() - timedelta(days=random.randint(0, 10))
        ))
    return jobs

def generate_scholarship_data():
    countries = ["Đức", "Anh", "Mỹ", "Nhật Bản", "Úc", "Pháp", "Canada", "Thụy Sĩ"]
    levels = ["bachelor", "master", "phd", "postdoc"]
    organizations = ["DAAD", "Chevening", "Fullbright", "MEXT", "Erasmus+", "AAS", "Vingroup Scholarship"]
    fields = ["Engineering", "Computer Science", "Business", "Medicine", "Social Science", "Data Science"]

    scholarships = []
    for i in range(50):
        scholarships.append(Scholarship(
            id=uuid.uuid4(),
            title=f"Học bổng {random.choice(levels).capitalize()} {random.choice(fields)} tại {random.choice(countries)}",
            organization=random.choice(organizations),
            country=random.choice(countries),
            level=random.choice(levels),
            field=random.choice(fields),
            coverage=random.choice(["full", "partial", "tuition_only"]),
            amount=f"{random.randint(1000, 3000)} EUR/month" if i % 2 == 0 else "100% Học phí + Sinh hoạt phí",
            deadline=datetime.utcnow() + timedelta(days=random.randint(30, 180)),
            description="Chương trình học bổng uy tín dành cho các sinh viên có thành tích học tập xuất sắc và khát vọng cống hiến.",
            url=f"https://opportify.ai/scholarships/internal-{uuid.uuid4()}",
            source="opportify",
            created_at=datetime.utcnow()
        ))
    return scholarships

async def seed_data():
    async with async_session() as session:
        async with session.begin():
            # Clear old data to prevent duplication during demo
            # await session.execute(text("DELETE FROM jobs"))
            # await session.execute(text("DELETE FROM scholarships"))
            
            jobs = generate_job_data()
            scholarships = generate_scholarship_data()
            
            for item in jobs + scholarships:
                session.add(item)
                
        print(f"Đã nạp thành công 200+ bản ghi (150 Việt làm, 50 Học bổng)!")

if __name__ == "__main__":
    asyncio.run(seed_data())
