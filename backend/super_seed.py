"""
super_seed.py — Seed dữ liệu việc làm & học bổng đa ngành (định hướng sinh viên HUST).

- Jobs: phủ 11 nhóm ngành HUST (IT, Điện-Điện tử, Tự động hóa-Robotics, Cơ khí-Ô tô,
  Vật liệu, Hóa-Sinh-Thực phẩm, Năng lượng, Xây dựng, Kinh tế-Logistics,
  Ngoại ngữ KHCN, Liên ngành). Mỗi nhóm có nhiều vị trí thực tế, kỹ năng riêng,
  địa điểm + tọa độ quanh Hà Nội/HCM/Đà Nẵng, deadline đa dạng (có cả tin đã hết hạn).
- Scholarships: học bổng thực tế (DAAD, Chevening, MEXT, KGSP, Erasmus+, Eiffel,
  AAS, VinUni, Vingroup...) kèm GPA tối thiểu, yêu cầu ngoại ngữ, coverage, level...

Chạy: python super_seed.py
"""
import asyncio
import uuid
import random
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from models.job import Job
from models.scholarship import Scholarship
from config import settings
from datetime import datetime, timedelta

random.seed(2025)

engine = create_async_engine(
    settings.DATABASE_URL,
    connect_args={
        "prepared_statement_cache_size": 0,
        "statement_cache_size": 0,
    },
)
async_session = async_sessionmaker(engine, expire_on_commit=False)

# ── Nội dung dùng chung ──────────────────────────────────────────────────────────
JOB_REQUIREMENTS = """
- Sinh viên năm cuối hoặc đã tốt nghiệp ngành liên quan.
- Nắm vững kiến thức nền tảng và các công cụ chuyên môn của vị trí.
- Tư duy logic, ham học hỏi, chủ động trong công việc.
- Kỹ năng làm việc nhóm và giao tiếp tốt.
- Đọc hiểu tài liệu chuyên ngành bằng tiếng Anh.
"""

JOB_BENEFITS = """
- Mức lương cạnh tranh, thưởng theo hiệu quả (13-15 tháng/năm).
- Bảo hiểm sức khỏe, khám sức khỏe định kỳ.
- Được cấp laptop/thiết bị làm việc, đào tạo bài bản.
- Lộ trình thăng tiến rõ ràng, mentor 1-1.
- Du lịch hàng năm, team building hàng quý.
"""

COMPANY_INFO = "Doanh nghiệp uy tín, môi trường làm việc trẻ trung, chuyên nghiệp, đề cao học hỏi và phát triển con người."

SOURCES = ["opportify", "topcv", "vietnamworks"]

# Địa điểm + tọa độ trung tâm để mô phỏng vị trí công ty
LOCATIONS = [
    ("Hà Nội", 21.0278, 105.8342),
    ("Hà Nội", 21.0061, 105.8431),   # quanh HUST
    ("TP. Hồ Chí Minh", 10.7769, 106.7009),
    ("Đà Nẵng", 16.0544, 108.2022),
    ("Bắc Ninh", 21.1861, 106.0763),
    ("Hải Phòng", 20.8449, 106.6881),
    ("Remote", 21.0278, 105.8342),
]

WORK_MODES = ["onsite", "hybrid", "remote"]
LEVELS = ["fresher", "junior", "mid", "senior"]
JOB_TYPES = ["fulltime", "parttime", "internship"]

# ── Định nghĩa nhóm ngành HUST + vị trí + kỹ năng + công ty ──────────────────────
# industry = nhãn nhóm ngành (đồng bộ với bộ lọc FilterPanel ở frontend)
CAREER_GROUPS = [
    {
        "industry": "Công nghệ thông tin",
        "companies": ["FPT Software", "VNG Corporation", "Viettel Solutions", "MoMo", "Tiki", "VNPT", "KMS Technology", "NashTech"],
        "tracks": [
            ("Backend Developer", ["Java", "Spring Boot", "REST API", "PostgreSQL", "Docker", "Git"]),
            ("Frontend Developer", ["React", "Next.js", "TypeScript", "Tailwind CSS", "HTML/CSS"]),
            ("Fullstack Developer", ["Node.js", "React", "MongoDB", "Express", "Docker"]),
            ("AI/ML Engineer", ["Python", "PyTorch", "TensorFlow", "Machine Learning", "NLP"]),
            ("Data Engineer", ["Python", "SQL", "Spark", "Airflow", "ETL"]),
            ("DevOps Engineer", ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux"]),
            ("QA/Software Tester", ["Manual Testing", "Selenium", "Postman", "SQL"]),
        ],
    },
    {
        "industry": "Điện - Điện tử - Viễn thông",
        "companies": ["Samsung Electronics Vietnam", "Viettel High Tech", "FPT Semiconductor", "Renesas Vietnam", "VinSmart", "Synopsys Vietnam"],
        "tracks": [
            ("Embedded Software Engineer", ["C/C++", "STM32", "RTOS", "UART/I2C/SPI", "Microcontroller"]),
            ("IoT Engineer", ["ESP32", "MQTT", "C++", "Python", "Cloud IoT"]),
            ("IC Design Engineer", ["Verilog", "VHDL", "Cadence", "Digital Design"]),
            ("Telecom/Network Engineer", ["CCNA", "TCP/IP", "Routing", "5G", "Linux"]),
            ("Hardware Design Engineer", ["Altium", "PCB Design", "Schematic", "Oscilloscope"]),
        ],
    },
    {
        "industry": "Tự động hóa - Robotics",
        "companies": ["Bosch Vietnam", "Schneider Electric", "Mitsubishi Electric", "Rorze Robotech", "ABB Vietnam"],
        "tracks": [
            ("Automation Engineer", ["PLC", "SCADA", "Siemens TIA Portal", "Control Theory"]),
            ("PLC/SCADA Engineer", ["Siemens PLC", "WinCC", "Ladder Logic", "HMI"]),
            ("Robotics Engineer", ["ROS", "Python", "C++", "Computer Vision", "Control"]),
            ("Control System Engineer", ["MATLAB", "Simulink", "PID", "Sensor & Actuator"]),
        ],
    },
    {
        "industry": "Cơ khí - Cơ điện tử - Ô tô",
        "companies": ["VinFast", "Toyota Vietnam", "THACO", "Doosan Vina", "Honda Vietnam", "Brother Industries"],
        "tracks": [
            ("Mechanical Design Engineer", ["SolidWorks", "AutoCAD", "Technical Drawing", "GD&T"]),
            ("Mechatronics Engineer", ["CAD", "PLC", "Embedded", "Sensor"]),
            ("Automotive Engineer", ["CATIA", "Automotive Standards", "Testing", "CAE"]),
            ("Manufacturing Engineer", ["Lean", "Six Sigma", "Process Improvement", "CNC"]),
            ("CAD/CAM Engineer", ["Mastercam", "CNC", "SolidWorks", "Inventor"]),
        ],
    },
    {
        "industry": "Vật liệu - Luyện kim - Nano",
        "companies": ["Hoa Phat Group", "Posco Vietnam", "SeAH Steel Vina", "Vingroup R&D", "Formosa Ha Tinh"],
        "tracks": [
            ("Materials Engineer", ["Material Science", "SEM/XRD", "Material Testing", "Lab Safety"]),
            ("Metallurgical Engineer", ["Metallurgy", "Heat Treatment", "Quality Control"]),
            ("R&D Lab Assistant", ["Lab Skills", "Data Analysis", "Origin", "Chemistry"]),
            ("Quality Engineer (Materials)", ["QC", "ISO", "Material Testing", "SPC"]),
        ],
    },
    {
        "industry": "Hóa - Sinh - Thực phẩm - Môi trường",
        "companies": ["Unilever Vietnam", "Nestlé Vietnam", "Vinamilk", "Masan Consumer", "URC Vietnam", "DKSH"],
        "tracks": [
            ("Food Technologist", ["Food Chemistry", "Food Safety", "HACCP", "QC"]),
            ("QA/QC Lab Engineer", ["Lab Skills", "ISO 22000", "Quality Control", "GMP"]),
            ("R&D Food Engineer", ["Product Development", "Sensory", "Food Science"]),
            ("Environmental Engineer", ["EIA", "Wastewater Treatment", "ISO 14001"]),
            ("Chemical Engineer", ["Process Engineering", "Chemistry", "Lab Skills"]),
        ],
    },
    {
        "industry": "Năng lượng - Nhiệt lạnh",
        "companies": ["EVN", "PECC1", "Trung Nam Group", "GE Vietnam", "Daikin Vietnam"],
        "tracks": [
            ("Renewable Energy Engineer", ["Solar PV Design", "PVSyst", "AutoCAD Electrical"]),
            ("Power System Engineer", ["ETAP", "Power System", "Electrical Safety", "MATLAB"]),
            ("HVAC Engineer", ["HVAC Design", "Heat Load", "AutoCAD", "Revit MEP"]),
            ("Energy Management Engineer", ["Energy Audit", "Excel", "ISO 50001"]),
        ],
    },
    {
        "industry": "Xây dựng - Hạ tầng - Giao thông",
        "companies": ["Coteccons", "Hoa Binh Construction", "Vinaconex", "Ricons", "Delta Group"],
        "tracks": [
            ("BIM Engineer", ["Revit", "Navisworks", "AutoCAD", "BIM Modeling"]),
            ("Civil Engineer", ["AutoCAD", "Structural Analysis", "Construction Drawing"]),
            ("Structural Engineer", ["ETABS", "SAP2000", "Structural Design"]),
            ("Construction Management", ["MS Project", "Site Management", "QS"]),
        ],
    },
    {
        "industry": "Kinh tế - Logistics - Quản trị",
        "companies": ["DHL Supply Chain", "Gemadept", "Bosch Vietnam", "Accenture Vietnam", "KPMG Vietnam"],
        "tracks": [
            ("Business Analyst", ["Requirement Analysis", "SQL", "Power BI", "UML/BPMN"]),
            ("Logistics/Supply Chain", ["SCM", "Excel", "ERP", "Inventory Management"]),
            ("Data Business Analyst", ["SQL", "Power BI", "Excel", "Python"]),
            ("Project Coordinator", ["Agile/Scrum", "Jira", "Communication"]),
        ],
    },
    {
        "industry": "Ngoại ngữ Khoa học Công nghệ",
        "companies": ["Rikkeisoft", "Luvina Software", "Fujinet Systems", "NTQ Solution", "VTI Japan"],
        "tracks": [
            ("Comtor tiếng Nhật (IT Communicator)", ["Japanese N2", "Technical Vocabulary", "Communication"]),
            ("BrSE Assistant", ["Japanese N2", "Software Basics", "Document Writing"]),
            ("Technical Translator", ["English", "Japanese", "Translation", "IT Knowledge"]),
            ("Global Technical Support", ["English", "Communication", "Troubleshooting"]),
        ],
    },
    {
        "industry": "Liên ngành - Giáo dục - EdTech",
        "companies": ["MindX", "FUNiX", "Got It Education", "Marathon Education", "Teky Holdings"],
        "tracks": [
            ("EdTech Product Assistant", ["Learning Design", "Figma", "Content Writing", "User Research"]),
            ("STEM Content Developer", ["STEM", "Content Writing", "Python", "Communication"]),
            ("Learning Experience Designer", ["Instructional Design", "Figma", "UX"]),
            ("Training Specialist", ["Training", "Communication", "Presentation"]),
        ],
    },
]

JOB_DESC_TEMPLATE = (
    "Chúng tôi đang tìm kiếm **{title}** đầy nhiệt huyết để gia nhập đội ngũ tại {company}. "
    "Bạn sẽ tham gia các dự án thực tế trong lĩnh vực {industry}, được làm việc cùng đồng nghiệp giàu kinh nghiệm "
    "và phát triển kỹ năng chuyên môn nhanh chóng.\n\n"
    "**Công việc chính:**\n"
    "- Tham gia trực tiếp vào các dự án của công ty theo phân công.\n"
    "- Phối hợp cùng team để phân tích, triển khai và kiểm thử giải pháp.\n"
    "- Học hỏi và áp dụng các công cụ, quy trình chuyên môn của vị trí."
)


def generate_jobs():
    jobs = []
    now = datetime.utcnow()
    for group in CAREER_GROUPS:
        industry = group["industry"]
        for title, skills in group["tracks"]:
            # mỗi vị trí tạo 3-4 tin ở các công ty/địa điểm/cấp bậc khác nhau
            for _ in range(random.randint(3, 4)):
                company = random.choice(group["companies"])
                loc_name, lat, lon = random.choice(LOCATIONS)
                lat += random.uniform(-0.05, 0.05)
                lon += random.uniform(-0.05, 0.05)
                level = random.choice(LEVELS)
                level_label = {"fresher": "Fresher", "junior": "Junior", "mid": "Middle", "senior": "Senior"}[level]
                work_mode = "remote" if loc_name == "Remote" else random.choice(WORK_MODES)

                salary_min = random.randint(10, 45) * 1_000_000
                salary_max = salary_min + random.randint(8, 35) * 1_000_000

                # ~15% tin đã hết hạn để kiểm thử sort
                if random.random() < 0.15:
                    deadline = now - timedelta(days=random.randint(1, 25))
                else:
                    deadline = now + timedelta(days=random.randint(5, 70))

                jobs.append(Job(
                    id=uuid.uuid4(),
                    title=f"{title} ({level_label})",
                    company=company,
                    location=loc_name,
                    salary_min=salary_min,
                    salary_max=salary_max,
                    salary_currency="VND",
                    description=JOB_DESC_TEMPLATE.format(title=title, company=company, industry=industry),
                    requirements=JOB_REQUIREMENTS,
                    benefits=JOB_BENEFITS,
                    company_info=COMPANY_INFO,
                    job_level=level_label,
                    experience_years=random.randint(0, 5),
                    industry=industry,
                    working_time="Thứ 2 - Thứ 6",
                    skills=skills,
                    job_type=random.choice(["fulltime", "parttime", "internship"]) if level == "fresher" else random.choice(["fulltime", "parttime"]),
                    work_mode=work_mode,
                    experience=level,
                    url=f"https://opportify.ai/jobs/{uuid.uuid4()}",
                    source=random.choice(SOURCES),
                    posted_at=now - timedelta(days=random.randint(0, 35)),
                    deadline=deadline,
                    view_count=random.randint(20, 5000),
                    latitude=str(round(lat, 6)),
                    longitude=str(round(lon, 6)),
                    crawled_at=now,
                ))
    return jobs


# ── Học bổng thực tế ─────────────────────────────────────────────────────────────
SCHOLARSHIP_BENEFITS_FULL = """
- Miễn 100% học phí trong suốt chương trình.
- Trợ cấp sinh hoạt phí hàng tháng.
- Hỗ trợ vé máy bay khứ hồi và bảo hiểm y tế.
- Tham gia mạng lưới cựu sinh viên và hội thảo quốc tế.
"""
SCHOLARSHIP_BENEFITS_PARTIAL = """
- Hỗ trợ một phần học phí theo thành tích học tập.
- Cơ hội gia hạn nếu duy trì kết quả tốt.
- Hỗ trợ định hướng học thuật và nghề nghiệp.
"""
APPLICATION_PROCESS = """
1. **Vòng hồ sơ:** Nộp đơn trực tuyến kèm bảng điểm, CV, SOP và thư giới thiệu.
2. **Vòng bài luận:** Đánh giá định hướng học thuật và động lực ứng viên.
3. **Vòng phỏng vấn:** Trao đổi trực tiếp với hội đồng tuyển chọn.
4. **Thông báo kết quả:** Qua email sau khi hội đồng xét duyệt.
"""

# Mỗi entry: (title, org, country, level, field, coverage, amount, numeric_amount, min_gpa, language)
SCHOLARSHIP_SEED = [
    ("Học bổng DAAD EPOS", "DAAD", "Đức", "master", "Engineering", "full", "Toàn phần + sinh hoạt phí", 12000, 3.2, "IELTS 6.5"),
    ("Học bổng Chevening", "Chevening", "Anh", "master", "Any Major", "full", "Toàn phần (1 năm)", 35000, 3.0, "IELTS 6.5"),
    ("Học bổng MEXT Chính phủ Nhật Bản", "MEXT", "Nhật Bản", "master", "Engineering", "full", "Toàn phần + vé máy bay", 14000, 3.2, "JLPT N3"),
    ("Học bổng KGSP Hàn Quốc", "NIIED", "Hàn Quốc", "master", "Computer Science", "full", "Toàn phần + sinh hoạt phí", 13000, 3.0, "TOPIK 3"),
    ("Học bổng Erasmus Mundus", "Erasmus+", "Châu Âu", "master", "Data Science", "full", "Toàn phần (2 năm)", 49000, 3.3, "IELTS 6.5"),
    ("Học bổng Eiffel Excellence", "Campus France", "Pháp", "master", "Engineering", "full", "Sinh hoạt phí + hỗ trợ", 18000, 3.4, "IELTS 6.0"),
    ("Học bổng Australia Awards", "AAS", "Úc", "master", "Business", "full", "Toàn phần + sinh hoạt phí", 40000, 3.0, "IELTS 6.5"),
    ("Học bổng Fulbright Việt Nam", "Fulbright", "Mỹ", "master", "Any Major", "full", "Toàn phần", 45000, 3.3, "TOEFL 90"),
    ("Học bổng VinUni Merit", "VinUni", "Việt Nam", "bachelor", "Engineering", "partial", "50% học phí", 5000, 3.2, "IELTS 6.0"),
    ("Học bổng Vingroup Khoa học Công nghệ", "Vingroup", "Việt Nam", "master", "AI", "full", "Toàn phần + sinh hoạt phí", 15000, 3.5, "IELTS 6.5"),
    ("Học bổng Lotte Foundation", "Lotte Foundation", "Hàn Quốc", "bachelor", "Any Major", "partial", "Sinh hoạt phí hàng tháng", 3000, 3.0, "TOPIK 2"),
    ("Học bổng Aun-Acts Trao đổi", "AUN", "ASEAN", "bachelor", "STEM", "partial", "Trao đổi 1 kỳ", 2500, 2.8, "IELTS 5.5"),
    ("Học bổng Panasonic", "Panasonic", "Nhật Bản", "master", "Electronics Engineering", "full", "Toàn phần", 13000, 3.2, "JLPT N2"),
    ("Học bổng GKS Bậc Tiến sĩ", "NIIED", "Hàn Quốc", "phd", "Robotics", "full", "Toàn phần + nghiên cứu", 16000, 3.4, "TOPIK 4"),
    ("Học bổng Swiss Government Excellence", "ESKAS", "Thụy Sĩ", "phd", "Computer Science", "full", "Toàn phần (nghiên cứu)", 22000, 3.5, "IELTS 7.0"),
    ("Học bổng Holland (NL Scholarship)", "Nuffic", "Hà Lan", "master", "Business", "partial", "5.000 EUR", 5000, 3.0, "IELTS 6.5"),
    ("Học bổng GIST Hàn Quốc", "GIST", "Hàn Quốc", "master", "AI", "full", "Toàn phần + nghiên cứu", 14000, 3.2, "IELTS 6.0"),
    ("Học bổng NTU Singapore", "NTU", "Singapore", "phd", "Engineering", "full", "Toàn phần + stipend", 30000, 3.5, "IELTS 6.5"),
    ("Học bổng Stipendium Hungaricum", "Tempus", "Hungary", "master", "Engineering", "full", "Toàn phần", 9000, 3.0, "IELTS 5.5"),
    ("Học bổng Türkiye Bursları", "YTB", "Thổ Nhĩ Kỳ", "bachelor", "Any Major", "full", "Toàn phần + sinh hoạt phí", 8000, 2.8, "IELTS 5.5"),
]

SCH_DESC_TEMPLATE = (
    "**{title}** là chương trình học bổng {coverage_label} dành cho ứng viên xuất sắc theo học bậc {level_label} "
    "ngành {field} tại {country}. Học bổng do {org} tài trợ, hướng tới hỗ trợ các tài năng trẻ phát triển "
    "học thuật và chuyên môn trong môi trường quốc tế.\n\n"
    "Đây là cơ hội tuyệt vời để mở rộng mạng lưới, trải nghiệm nền giáo dục tiên tiến và xây dựng nền tảng sự nghiệp vững chắc."
)
LEVEL_LABEL = {"bachelor": "Cử nhân", "master": "Thạc sĩ", "phd": "Tiến sĩ", "postdoc": "Sau tiến sĩ"}
COVERAGE_LABEL = {"full": "toàn phần", "partial": "bán phần", "tuition_only": "hỗ trợ học phí"}


def generate_scholarships():
    scholarships = []
    now = datetime.utcnow()
    for title, org, country, level, field, coverage, amount, numeric, min_gpa, language in SCHOLARSHIP_SEED:
        # tạo 1-2 đợt cho mỗi học bổng (kỳ khác nhau), một số đã hết hạn
        for k in range(random.randint(1, 2)):
            if random.random() < 0.18:
                deadline = now - timedelta(days=random.randint(1, 30))
            else:
                deadline = now + timedelta(days=random.randint(15, 160))

            requirements = (
                f"- GPA tối thiểu {min_gpa}/4.0.\n"
                f"- Chứng chỉ ngoại ngữ: {language} trở lên.\n"
                f"- Có thành tích học tập/hoạt động ngoại khóa tốt.\n"
                f"- Bài luận (SOP) và 2 thư giới thiệu.\n"
            )
            benefits = SCHOLARSHIP_BENEFITS_FULL if coverage == "full" else SCHOLARSHIP_BENEFITS_PARTIAL

            scholarships.append(Scholarship(
                id=uuid.uuid4(),
                title=title if k == 0 else f"{title} (Kỳ {k + 1})",
                organization=org,
                country=country,
                level=level,
                field=field,
                coverage=coverage,
                amount=amount,
                numeric_amount=numeric,
                min_gpa=min_gpa,
                language_requirement=language,
                competitiveness_score=random.randint(4, 10),
                description=SCH_DESC_TEMPLATE.format(
                    title=title, coverage_label=COVERAGE_LABEL[coverage], level_label=LEVEL_LABEL[level],
                    field=field, country=country, org=org,
                ),
                requirements=requirements,
                benefits=benefits,
                application_process=APPLICATION_PROCESS,
                gender_requirement="Tất cả",
                nationality_requirement="Việt Nam / Quốc tế",
                website_url="https://scholarship-provider.com",
                url=f"https://opportify.ai/scholarships/{uuid.uuid4()}",
                deadline=deadline,
                view_count=random.randint(100, 12000),
                source="opportify",
                created_at=now - timedelta(days=random.randint(0, 60)),
            ))
    return scholarships


async def seed_data():
    async with async_session() as session:
        async with session.begin():
            from sqlalchemy import text
            await session.execute(text("DELETE FROM jobs"))
            await session.execute(text("DELETE FROM scholarships"))
            jobs = generate_jobs()
            scholarships = generate_scholarships()
            for item in jobs + scholarships:
                session.add(item)
        print(f"Đã nạp thành công {len(jobs) + len(scholarships)} bản ghi ({len(jobs)} jobs, {len(scholarships)} scholarships)!")


if __name__ == "__main__":
    asyncio.run(seed_data())
