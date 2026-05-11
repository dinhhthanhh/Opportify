import asyncio
import uuid
import random
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from models.job import Job
from models.scholarship import Scholarship
from config import settings
from datetime import datetime, timedelta

engine = create_async_engine(
    settings.DATABASE_URL,
    connect_args={
        "prepared_statement_cache_size": 0,
        "statement_cache_size": 0
    }
)
async_session = async_sessionmaker(engine, expire_on_commit=False)

JOB_DESCRIPTIONS = [
    "Chúng tôi đang tìm kiếm một chuyên gia đầy nhiệt huyết để gia nhập đội ngũ. Bạn sẽ tham gia vào các dự án quy mô lớn, giải quyết những thách thức kỹ thuật phức tạp.",
    "Cơ hội tuyệt vời để phát triển sự nghiệp trong môi trường công nghệ hiện đại. Chúng tôi ưu tiên tư duy sáng tạo và khả năng làm việc độc lập cao.",
    "Tham gia xây dựng hệ sinh thái sản phẩm phục vụ hàng triệu người dùng. Bạn sẽ làm việc cùng những đồng nghiệp xuất sắc nhất trong ngành."
]

JOB_REQUIREMENTS = """
- Ít nhất 2-3 năm kinh nghiệm trong lĩnh vực tương đương.
- Thành thạo các ngôn ngữ lập trình và công cụ liên quan.
- Tư duy logic tốt, khả năng giải quyết vấn đề nhanh nhạy.
- Kỹ năng giao tiếp và làm việc nhóm hiệu quả.
- Tiếng Anh đọc hiểu tài liệu chuyên ngành tốt.
"""

JOB_BENEFITS = """
- Mức lương cạnh tranh, thưởng theo hiệu quả công việc (13-15 tháng lương/năm).
- Bảo hiểm sức khỏe cao cấp cho nhân viên và người thân.
- Môi trường làm việc năng động, trẻ trung, có pantry với trà, cafe miễn phí.
- Lộ trình thăng tiến rõ ràng, được tài trợ các khóa học nâng cao nghiệp vụ.
- Du lịch hàng năm, team building hàng quý.
"""

COMPANY_INFO = """
Lô trình phát triển bền vững với hơn 10 năm kinh nghiệm trong lĩnh vực công nghệ. Chúng tôi tự hào là nơi hội tụ của những tài năng trẻ và khao khát đổi mới.
"""

sources = ["opportify", "crawler", "seed"]

SCHOLARSHIP_DESCRIPTION = "Chương trình học bổng uy tín nhằm hỗ trợ các sinh viên tài năng theo đuổi đam mê nghiên cứu và học tập tại các trường đại học hàng đầu thế giới."

SCHOLARSHIP_REQUIREMENTS = """
- Điểm trung bình học tập (GPA) từ 3.2/4.0 trở lên.
- Chứng chỉ tiếng Anh (IELTS 6.5+ hoặc TOEFL tương đương).
- Có thành tích trong các hoạt động ngoại khóa hoặc nghiên cứu khoa học.
- Viết bài luận (Statement of Purpose) thuyết phục.
- Hai thư giới thiệu từ giảng viên hoặc người hướng dẫn.
"""

SCHOLARSHIP_BENEFITS = """
- Hỗ trợ 100% học phí trong suốt quá trình học.
- Sinh hoạt phí hàng tháng từ 1,000 - 2,500 USD tùy quốc gia.
- Hỗ trợ vé máy bay khứ hồi và phí làm visa.
- Gói bảo hiểm y tế toàn diện.
- Cơ hội tham gia các hội thảo quốc tế và mạng lưới cựu sinh viên toàn cầu.
"""

APPLICATION_PROCESS = """
1. **Vòng hồ sơ:** Nộp đơn trực tuyến kèm theo các giấy tờ liên quan.
2. **Vòng bài luận:** Đánh giá tư duy và khát vọng của ứng viên.
3. **Vòng phỏng vấn:** Trao đổi trực tiếp với hội đồng tuyển chọn.
4. **Thông báo kết quả:** Kết quả chính thức sẽ được gửi qua email sau 4 tuần.
"""

def generate_job_data():
    titles = [
        "Software Engineer", "Frontend Developer", "Backend Developer", "Fullstack Developer",
        "AI/ML Engineer", "Data Scientist", "DevOps Engineer", "Mobile App Developer",
        "Product Manager", "UI/UX Designer", "Marketing Manager", "Content Specialist",
        "Sales Executive", "Business Analyst", "Human Resources Manager", "Accountant"
    ]
    companies = ["VNG Corporation", "FPT Software", "Viettel Group", "Grab", "Shopee", "Tiki", "VinAI", "Momo"]
    locations = ["Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Singapore", "Remote"]
    skills_pool = ["Python", "JavaScript", "React", "Node.js", "SQL", "Docker", "AWS", "Java", "Go", "TypeScript"]
    
    jobs = []
    for i in range(100):
        salary_min = random.randint(15, 60) * 1000000
        salary_max = salary_min + random.randint(10, 40) * 1000000
        
        # Tọa độ giả lập quanh Hà Nội (21.0, 105.8) hoặc HCM (10.7, 106.6)
        is_hanoi = random.choice([True, False])
        lat = 21.0285 + random.uniform(-0.1, 0.1) if is_hanoi else 10.7626 + random.uniform(-0.1, 0.1)
        lon = 105.8542 + random.uniform(-0.1, 0.1) if is_hanoi else 106.6602 + random.uniform(-0.1, 0.1)

        jobs.append(Job(
            id=uuid.uuid4(),
            title=f"{random.choice(titles)} ({random.choice(['Senior', 'Junior', 'Mid'])})",
            company=random.choice(companies),
            location=random.choice(locations),
            salary_min=salary_min,
            salary_max=salary_max,
            salary_currency="VND",
            description=random.choice(JOB_DESCRIPTIONS),
            requirements=JOB_REQUIREMENTS,
            benefits=JOB_BENEFITS,
            company_info=COMPANY_INFO,
            job_level=random.choice(["Senior", "Junior", "Mid", "Intern"]),
            experience_years=random.randint(0, 5),
            industry=random.choice(["IT", "Finance", "Healthcare", "E-commerce"]),
            working_time="Thứ 2 - Thứ 6",
            skills=random.sample(skills_pool, k=random.randint(3, 6)),
            job_type=random.choice(["fulltime", "parttime", "remote"]),
            experience=random.choice(["fresher", "junior", "mid", "senior"]),
            url=f"https://opportify.ai/jobs/internal-{uuid.uuid4()}",
            source=random.choice(sources),
            posted_at=datetime.utcnow() - timedelta(days=random.randint(0, 30)),
            deadline=datetime.utcnow() + timedelta(days=random.randint(5, 60)),
            view_count=random.randint(10, 5000),
            latitude=str(lat),
            longitude=str(lon),
            crawled_at=datetime.utcnow()
        ))
    return jobs

def generate_scholarship_data():
    countries = ["Đức", "Anh", "Mỹ", "Nhật Bản", "Úc", "Pháp", "Canada"]
    levels = ["bachelor", "master", "phd", "postdoc"]
    organizations = ["DAAD", "Chevening", "Fullbright", "MEXT", "Erasmus+", "Vingroup"]
    fields = ["Engineering", "Computer Science", "Business", "Medicine", "Arts"]

    scholarships = []
    for i in range(50):
        numeric_amt = random.randint(500, 5000)
        scholarships.append(Scholarship(
            id=uuid.uuid4(),
            title=f"Học bổng {random.choice(levels).capitalize()} {random.choice(fields)} tại {random.choice(countries)}",
            organization=random.choice(organizations),
            country=random.choice(countries),
            level=random.choice(levels),
            field=random.choice(fields),
            coverage=random.choice(["full", "partial", "tuition_only"]),
            description=SCHOLARSHIP_DESCRIPTION,
            requirements=SCHOLARSHIP_REQUIREMENTS,
            benefits=SCHOLARSHIP_BENEFITS,
            application_process=APPLICATION_PROCESS,
            gender_requirement="Tất cả",
            nationality_requirement="Việt Nam",
            website_url="https://scholarship-provider.com",
            url=f"https://opportify.ai/scholarships/{uuid.uuid4()}",
            amount=f"{numeric_amt} EUR/month" if i % 2 == 0 else "100% Học phí + Sinh hoạt phí",
            numeric_amount=numeric_amt if i % 2 == 0 else 10000, # Giả lập 10000 cho học bổng toàn phần
            deadline=datetime.utcnow() + timedelta(days=random.randint(30, 180)),
            view_count=random.randint(100, 10000),
            competitiveness_score=random.randint(1, 10),
            # url=f"https://opportify.ai/scholarships/internal-{uuid.uuid4()}",
            source="opportify",
            created_at=datetime.utcnow() - timedelta(days=random.randint(0, 60))
        ))
    return scholarships

async def seed_data():
    async with async_session() as session:
        async with session.begin():
            from sqlalchemy import text
            await session.execute(text("DELETE FROM jobs"))
            await session.execute(text("DELETE FROM scholarships"))
            jobs = generate_job_data()
            scholarships = generate_scholarship_data()
            for item in jobs + scholarships:
                session.add(item)
        print(f"Đã nạp thành công dữ liệu mẫu phong phú!")

if __name__ == "__main__":
    asyncio.run(seed_data())
