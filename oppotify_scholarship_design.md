# OPPOTIFY - SCHOLARSHIP DATA MODEL & FILTER DESIGN

## Mục tiêu

Oppotify là hệ thống phân tích hồ sơ năng lực sinh viên và gợi ý học bổng phù hợp.

AI sẽ sử dụng:
- Hồ sơ năng lực sinh viên
- Điều kiện học bổng
- Điểm tương đồng ngành học
- Kỹ năng
- Thành tích học tập
- Hoạt động nghiên cứu
- Hoạt động ngoại khóa
- Ngoại ngữ

để xếp hạng học bổng phù hợp nhất.

---

# 1. SCHOLARSHIP MASTER DATA

## Thông tin cơ bản

```ts
Scholarship {
  id: string;
  title: string;
  slug: string;

  providerName: string;
  providerType:
    | "UNIVERSITY"
    | "GOVERNMENT"
    | "FOUNDATION"
    | "COMPANY"
    | "NGO";

  description: string;
  benefits: string;

  applicationUrl: string;
  officialWebsite: string;

  logoUrl: string;
  bannerUrl: string;

  country: string;
  city?: string;

  createdAt: Date;
  updatedAt: Date;
}
```

---

# 2. HỌC BỔNG ÁP DỤNG CHO NHỮNG NGÀNH NÀO

```ts
ScholarshipMajor {
   scholarshipId: string;
   majorId: string;
}
```

## Nhóm ngành

### CNTT

- Computer Science
- Software Engineering
- AI
- Data Science
- Cyber Security
- Information Systems

### Điện - Điện tử

- Electrical Engineering
- Electronics Engineering
- Telecommunications

### Cơ khí

- Mechanical Engineering
- Automotive Engineering
- Manufacturing

### Tự động hóa

- Automation
- Robotics
- Control Engineering

### Hóa học

- Chemical Engineering
- Food Engineering
- Cosmetic Science

### Y Sinh

- Biotechnology
- Biomedical Engineering
- Medicine
- Pharmacy

### Kinh tế

- Finance
- Accounting
- Business Administration
- Economics
- Supply Chain

### Ngoại ngữ

- English
- Japanese
- Korean
- Chinese

### STEM

- Engineering
- STEM
- Any Major

---

# 3. BẬC HỌC

```ts
degreeLevel:
 | HIGH_SCHOOL
 | BACHELOR
 | MASTER
 | PHD
```

---

# 4. GIÁ TRỊ HỌC BỔNG

```ts
ScholarshipFunding {
  fundingType:
    | FULL
    | PARTIAL
    | TUITION_ONLY
    | STIPEND_ONLY;

  tuitionCoveragePercent: number;

  monthlyStipend?: number;

  accommodationCovered: boolean;
  airfareCovered: boolean;
  insuranceCovered: boolean;
}
```

---

# 5. ĐIỀU KIỆN ỨNG TUYỂN

## Học thuật

```ts
minGpa: number
```

Ví dụ

- GPA 2.5+
- GPA 3.0+
- GPA 3.2+
- GPA 3.5+
- GPA 3.7+

## Ngoại ngữ

IELTS

- 5.5+
- 6.0+
- 6.5+
- 7.0+
- 7.5+

TOEFL

- 70+
- 80+
- 90+
- 100+

JLPT

- N5
- N4
- N3
- N2
- N1

TOPIK

- 1
- 2
- 3
- 4
- 5
- 6

## Kinh nghiệm

- Không yêu cầu
- 6 tháng
- 1 năm
- 2 năm
- 5 năm

## Nghiên cứu

- Có kinh nghiệm nghiên cứu
- Có bài báo
- Có conference paper
- Có research proposal

## Hoạt động

- Leadership
- Volunteer
- Community Service
- Startup Experience

---

# 6. DỮ LIỆU AI MATCHING

## Kỹ năng

Ví dụ

- Python
- Java
- Spring Boot
- React
- Machine Learning
- Deep Learning
- CAD
- SolidWorks
- MATLAB
- PLC
- SCADA

## Chứng chỉ

- AWS
- Azure
- CCNA
- FE
- PMP

## Thành tích

- GPA
- Giải thưởng
- Olympic
- Nghiên cứu khoa học
- Cuộc thi quốc tế

---

# 7. BỘ LỌC CHUNG

## Thông tin cơ bản

- Bậc học
- Quốc gia
- Thành phố
- Ngành học
- Tổ chức cấp
- Trường đại học

## Học bổng

- Toàn phần
- Bán phần
- Học phí
- Sinh hoạt phí
- Ký túc xá
- Vé máy bay
- Bảo hiểm

## Deadline

- Hôm nay
- 7 ngày
- 30 ngày
- 90 ngày
- Tùy chọn ngày

## GPA

- 2.5+
- 3.0+
- 3.2+
- 3.5+
- 3.7+

## Ngoại ngữ

- IELTS
- TOEFL
- TOEIC
- JLPT
- TOPIK
- HSK

---

# 8. BỘ LỌC RIÊNG THEO NGÀNH

## CNTT

- AI
- Data Science
- Web
- Mobile
- Backend
- Frontend
- Cloud
- DevOps
- Cyber Security

## AI

- Machine Learning
- Deep Learning
- NLP
- Computer Vision

## Điện - Điện tử

- Embedded
- IoT
- VLSI
- Circuit Design

## Tự động hóa

- PLC
- SCADA
- Robotics

## Cơ khí

- CAD
- SolidWorks
- Manufacturing

## Kinh tế

- Finance
- Accounting
- Marketing
- Supply Chain

## Y Sinh

- Biotechnology
- Genetics
- Biomedical

---

# 9. TAG HIỂN THỊ TRÊN CARD HỌC BỔNG

Ví dụ

- GPA 3.2+
- IELTS 6.5+
- TOEFL 90+
- JLPT N2+
- Research Experience
- Leadership
- STEM
- Engineering
- AI
- Full Scholarship
- Tuition Covered
- Monthly Stipend
- Bachelor
- Master
- PhD
- Japan
- USA
- Canada

---

# 10. HỒ SƠ NĂNG LỰC SINH VIÊN

```ts
StudentProfile {
  major: string;

  gpa: number;

  targetDegree:
    | BACHELOR
    | MASTER
    | PHD;

  targetCountries: string[];

  englishScore?: number;
  japaneseLevel?: string;
  koreanLevel?: string;

  workExperienceMonths?: number;

  researchExperience: boolean;

  publicationCount?: number;

  leadershipActivities: string[];

  volunteerActivities: string[];

  skills: string[];

  certifications: string[];

  interests: string[];
}
```

---

# 11. AI RANKING SCORE

Ví dụ

- GPA: 25%
- Ngành học: 20%
- Ngoại ngữ: 15%
- Kỹ năng: 15%
- Quốc gia mong muốn: 10%
- Nghiên cứu: 10%
- Hoạt động: 5%

Tổng điểm dùng để sắp xếp danh sách học bổng được đề xuất.
