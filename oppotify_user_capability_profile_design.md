# OPPOTIFY - HỒ SƠ NĂNG LỰC NGƯỜI DÙNG  
## Profile Data Model & Form Field Specification cho AI gợi ý Việc làm + Học bổng

---

## 0. Mục tiêu của hồ sơ năng lực

Hồ sơ năng lực trong Oppotify **không phải CV truyền thống**.

CV thường dùng để ứng tuyển một vị trí cụ thể, còn hồ sơ năng lực trong Oppotify dùng để:

1. Phân tích năng lực thật của người dùng.
2. Xác định ngành nghề phù hợp.
3. Gợi ý việc làm phù hợp.
4. Gợi ý học bổng phù hợp.
5. Tính điểm phù hợp giữa người dùng và từng job/scholarship.
6. Phát hiện những điểm còn thiếu để người dùng cải thiện hồ sơ.
7. Cá nhân hóa chatbot tư vấn nghề nghiệp và học bổng.

Vì vậy, hồ sơ này cần lưu nhiều nhóm thông tin hơn CV, bao gồm:

- Thông tin cá nhân cơ bản
- Thông tin học vấn
- Ngành học
- Ngành nghề mong muốn
- Mục tiêu nghề nghiệp
- Mục tiêu học bổng
- Kỹ năng chuyên môn
- Kỹ năng mềm
- Ngoại ngữ
- Chứng chỉ
- Dự án
- Kinh nghiệm làm việc
- Kinh nghiệm nghiên cứu
- Thành tích
- Hoạt động ngoại khóa
- Sở thích học thuật/nghề nghiệp
- Điều kiện cá nhân
- Mức độ sẵn sàng ứng tuyển
- Dữ liệu AI phân tích

---

# 1. Nguyên tắc thiết kế hồ sơ năng lực

## 1.1. Không chỉ lưu text tự do

Không nên chỉ cho người dùng nhập một ô lớn như:

```text
Kỹ năng: Java, React, Python, AI...
```

Vì AI có thể đọc được, nhưng hệ thống lọc và matching sẽ khó xử lý.

Nên tách thành:

```ts
Skill {
  name: string;
  category: SkillCategory;
  level: SkillLevel;
  yearsOfExperience?: number;
  evidence?: string;
}
```

## 1.2. Vừa cho người dùng nhập, vừa cho AI chuẩn hóa

Ví dụ người dùng nhập:

```text
Springboot, js, nodejs, reactjs
```

AI nên chuẩn hóa thành:

```json
[
  { "name": "Spring Boot", "normalizedName": "spring-boot" },
  { "name": "JavaScript", "normalizedName": "javascript" },
  { "name": "Node.js", "normalizedName": "nodejs" },
  { "name": "React", "normalizedName": "react" }
]
```

## 1.3. Hồ sơ phải phục vụ cả job và scholarship

Một số trường quan trọng cho job:

- Kỹ năng chuyên môn
- Kinh nghiệm làm việc
- Dự án
- Công nghệ đã dùng
- Vị trí mong muốn
- Hình thức làm việc
- Địa điểm làm việc
- Mức lương mong muốn

Một số trường quan trọng cho scholarship:

- GPA
- Bậc học hiện tại
- Bậc học mong muốn
- Quốc gia mong muốn
- Thành tích học thuật
- Kinh nghiệm nghiên cứu
- Bài báo
- Ngoại ngữ
- Thư giới thiệu
- Research proposal
- Hoạt động ngoại khóa

---

# 2. Tổng quan database đề xuất

```ts
UserCapabilityProfile {
  id: string;
  userId: string;

  profileStatus: ProfileStatus;
  readinessScore: number;

  createdAt: Date;
  updatedAt: Date;
  lastAnalyzedAt?: Date;
}
```

```ts
ProfileStatus =
  | "DRAFT"
  | "INCOMPLETE"
  | "READY_FOR_JOB"
  | "READY_FOR_SCHOLARSHIP"
  | "READY_FOR_BOTH";
```

---

# 3. Nhóm thông tin cá nhân cơ bản

## 3.1. Bảng đề xuất

```ts
ProfileBasicInfo {
  id: string;
  profileId: string;

  displayName: string;
  email: string;
  phone?: string;

  avatarUrl?: string;

  gender?: Gender;
  dateOfBirth?: Date;
  nationality?: string;

  currentCountry?: string;
  currentCity?: string;

  personalWebsiteUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;

  shortBio?: string;
}
```

## 3.2. Các trường trên UI

### Họ tên hiển thị

- Field: `displayName`
- Type: text
- Required: yes
- Dùng cho:
  - Hiển thị hồ sơ
  - Cá nhân hóa chatbot
  - Tạo CV gợi ý sau này

### Email

- Field: `email`
- Type: email
- Required: yes
- Dùng cho:
  - Liên hệ
  - Tài khoản

### Số điện thoại

- Field: `phone`
- Type: text
- Required: no
- Dùng cho:
  - CV/job application
  - Không bắt buộc với học bổng

### Quốc tịch

- Field: `nationality`
- Type: select country
- Required: yes nếu dùng học bổng
- Dùng cho:
  - Lọc học bổng theo nationality whitelist/blacklist
  - Một số học bổng chỉ dành cho công dân Việt Nam, ASEAN, nước đang phát triển...

### Quốc gia/thành phố hiện tại

- Field: `currentCountry`, `currentCity`
- Type: select/text
- Required: recommended
- Dùng cho:
  - Gợi ý việc làm theo địa điểm
  - Gợi ý internship onsite
  - Gợi ý học bổng có yêu cầu cư trú

### Link GitHub

- Field: `githubUrl`
- Type: URL
- Required: với ngành IT nên có
- Dùng cho:
  - AI đánh giá năng lực coding
  - Matching job IT
  - Tăng độ tin cậy cho kỹ năng lập trình

### Link LinkedIn

- Field: `linkedinUrl`
- Type: URL
- Required: no
- Dùng cho:
  - Job matching
  - Networking
  - Hồ sơ chuyên nghiệp

### Link Portfolio

- Field: `portfolioUrl`
- Type: URL
- Required: ngành IT/design nên có
- Dùng cho:
  - Job frontend
  - UI/UX
  - Data/AI project showcase

### Giới thiệu ngắn

- Field: `shortBio`
- Type: textarea
- Required: recommended
- Gợi ý placeholder:

```text
Sinh viên năm 4 ngành Công nghệ thông tin, quan tâm đến Backend, AI và học bổng sau đại học.
```

---

# 4. Thông tin học vấn

## 4.1. Bảng đề xuất

```ts
Education {
  id: string;
  profileId: string;

  institutionName: string;
  degreeLevel: DegreeLevel;
  majorId: string;
  majorName: string;

  specialization?: string;

  startYear: number;
  endYear?: number;
  isCurrent: boolean;

  gpa?: number;
  gpaScale?: number;

  thesisTitle?: string;
  thesisDescription?: string;

  relevantCourses?: string[];

  academicRank?: string;
}
```

```ts
DegreeLevel =
  | "HIGH_SCHOOL"
  | "BACHELOR"
  | "MASTER"
  | "PHD"
  | "OTHER";
```

## 4.2. Các trường trên UI

### Trường/Đại học

- Field: `institutionName`
- Required: yes
- Ví dụ:
  - Đại học Bách khoa Hà Nội
  - Hanoi University of Science and Technology

### Bậc học hiện tại/cao nhất

- Field: `degreeLevel`
- Required: yes
- Options:
  - THPT
  - Đại học
  - Thạc sĩ
  - Tiến sĩ
  - Khác

Dùng cho:
- Lọc job fresher/intern/junior
- Lọc học bổng Bachelor/Master/PhD

### Ngành học

- Field: `majorId`, `majorName`
- Required: yes
- Dùng cho:
  - Mapping với ngành nghề
  - Mapping với học bổng
  - Gợi ý career path

Ví dụ nhóm ngành:

- Công nghệ thông tin
- Khoa học máy tính
- Kỹ thuật phần mềm
- AI/Data Science
- Điện - Điện tử
- Tự động hóa
- Cơ khí
- Hóa học
- Kinh tế
- Ngoại ngữ

### Chuyên ngành/hướng chuyên sâu

- Field: `specialization`
- Required: no
- Ví dụ:
  - Backend Engineering
  - Artificial Intelligence
  - Cyber Security
  - Embedded Systems
  - Robotics
  - Data Science

### Năm bắt đầu

- Field: `startYear`
- Required: yes

### Năm kết thúc/dự kiến tốt nghiệp

- Field: `endYear`
- Required: recommended
- Dùng cho:
  - Xác định internship/fresher/full-time
  - Gợi ý học bổng đúng thời điểm

### GPA

- Field: `gpa`
- Required: rất nên có
- Dùng cho:
  - Scholarship eligibility
  - Academic strength score
  - Ranking học bổng

### Thang GPA

- Field: `gpaScale`
- Required: yes nếu có GPA
- Options:
  - 4.0
  - 10.0
  - 100
  - Khác

### Đề tài tốt nghiệp/nghiên cứu

- Field: `thesisTitle`
- Required: no
- Rất quan trọng với:
  - Master/PhD scholarship
  - Research assistant
  - AI/Data scholarship

### Mô tả đề tài

- Field: `thesisDescription`
- Required: no
- Dùng cho AI phân tích hướng nghiên cứu.

### Môn học liên quan

- Field: `relevantCourses`
- Type: multi tag
- Required: no
- Ví dụ:
  - Machine Learning
  - Database
  - Operating System
  - Computer Network
  - Data Structures and Algorithms

Dùng cho:
- Gợi ý internship khi chưa có kinh nghiệm
- Gợi ý học bổng theo nền tảng học thuật

---

# 5. Thông tin ngành nghề mục tiêu

Đây là phần hiện tại app có nhưng còn đơn giản. Nên tách rõ hơn.

## 5.1. Bảng đề xuất

```ts
CareerPreference {
  id: string;
  profileId: string;

  desiredJobRoles: string[];
  desiredIndustries: string[];

  careerLevel:
    | "INTERN"
    | "FRESHER"
    | "JUNIOR"
    | "MIDDLE"
    | "SENIOR";

  employmentTypes: EmploymentType[];

  preferredCountries: string[];
  preferredCities: string[];

  workModes: WorkMode[];

  expectedSalaryMin?: number;
  expectedSalaryMax?: number;
  expectedSalaryCurrency?: string;

  availableFrom?: Date;

  willingToRelocate: boolean;
  willingToWorkOvertime?: boolean;

  careerGoalsShortTerm?: string;
  careerGoalsLongTerm?: string;
}
```

```ts
EmploymentType =
  | "INTERNSHIP"
  | "FULL_TIME"
  | "PART_TIME"
  | "CONTRACT"
  | "FREELANCE"
  | "REMOTE";

WorkMode =
  | "ONSITE"
  | "HYBRID"
  | "REMOTE";
```

## 5.2. Các trường UI cần có

### Vị trí công việc mong muốn

- Field: `desiredJobRoles`
- Type: multi-select/tag
- Required: yes nếu muốn tìm việc
- Ví dụ:
  - Backend Developer
  - Frontend Developer
  - Fullstack Developer
  - AI Engineer
  - Data Analyst
  - Data Scientist
  - DevOps Engineer
  - QA/QC Engineer
  - Business Analyst
  - Embedded Engineer
  - Automation Engineer
  - Mechanical Design Engineer

### Lĩnh vực/ngành công nghiệp quan tâm

- Field: `desiredIndustries`
- Type: multi-select
- Ví dụ:
  - IT Services
  - Fintech
  - EdTech
  - Healthcare
  - Manufacturing
  - Automotive
  - E-commerce
  - Game
  - AI
  - Semiconductor
  - Energy

### Cấp độ nghề nghiệp

- Field: `careerLevel`
- Options:
  - Intern
  - Fresher
  - Junior
  - Middle
  - Senior

Dùng cho:
- Không gợi ý job senior cho sinh viên mới ra trường
- Không gợi ý internship cho người đã có nhiều kinh nghiệm nếu không muốn

### Hình thức làm việc

- Field: `employmentTypes`
- Options:
  - Internship
  - Full-time
  - Part-time
  - Contract
  - Freelance
  - Remote

### Chế độ làm việc

- Field: `workModes`
- Options:
  - Onsite
  - Hybrid
  - Remote

### Địa điểm làm việc mong muốn

- Field: `preferredCountries`, `preferredCities`
- Ví dụ:
  - Việt Nam - Hà Nội
  - Nhật Bản - Tokyo
  - Singapore
  - Remote

### Mức lương mong muốn

- Field:
  - `expectedSalaryMin`
  - `expectedSalaryMax`
  - `expectedSalaryCurrency`
- Required: no
- Dùng cho:
  - Lọc job theo salary range
  - Không dùng cho học bổng

### Thời điểm có thể bắt đầu

- Field: `availableFrom`
- Required: no
- Dùng cho:
  - Internship
  - Full-time job
  - Graduate program

### Có sẵn sàng chuyển địa điểm không?

- Field: `willingToRelocate`
- Type: boolean
- Dùng cho:
  - Job ở tỉnh/thành khác
  - Job ở nước ngoài
  - Học bổng du học

### Mục tiêu ngắn hạn

- Field: `careerGoalsShortTerm`
- Type: textarea
- Ví dụ:

```text
Tìm việc Fresher Backend Developer sau khi tốt nghiệp.
```

### Mục tiêu dài hạn

- Field: `careerGoalsLongTerm`
- Type: textarea
- Ví dụ:

```text
Trở thành Fullstack Developer, sau đó phát triển lên Team Leader hoặc Project Manager.
```

---

# 6. Mục tiêu học bổng/học thuật

## 6.1. Bảng đề xuất

```ts
ScholarshipPreference {
  id: string;
  profileId: string;

  targetDegreeLevels: DegreeLevel[];
  targetCountries: string[];
  targetMajors: string[];

  targetIntakes: string[];

  scholarshipFundingTypes: ScholarshipFundingType[];

  preferredStudyLanguages: string[];

  interestedResearchFields: string[];

  needFullFunding: boolean;
  minimumFundingCoveragePercent?: number;

  willingToPrepareResearchProposal: boolean;
  willingToContactProfessor: boolean;

  scholarshipGoals?: string;
}
```

```ts
ScholarshipFundingType =
  | "FULL"
  | "PARTIAL"
  | "TUITION_ONLY"
  | "LIVING_STIPEND"
  | "RESEARCH_GRANT"
  | "TRAVEL_GRANT";
```

## 6.2. Các trường UI cần có

### Bậc học muốn ứng tuyển

- Field: `targetDegreeLevels`
- Options:
  - Bachelor
  - Master
  - PhD
  - Exchange
  - Research Internship
  - Short Course

### Quốc gia mong muốn

- Field: `targetCountries`
- Type: multi-select
- Ví dụ:
  - Nhật Bản
  - Hàn Quốc
  - Đức
  - Canada
  - Mỹ
  - Úc
  - Singapore
  - Châu Âu

### Ngành học muốn xin học bổng

- Field: `targetMajors`
- Type: multi-select
- Có thể khác ngành hiện tại.
- Ví dụ:
  - Computer Science
  - AI
  - Data Science
  - Software Engineering
  - Robotics
  - Biomedical Engineering
  - Business Analytics

### Kỳ nhập học mong muốn

- Field: `targetIntakes`
- Options:
  - Spring
  - Summer
  - Fall
  - Winter
  - Không rõ/chưa quyết định

### Loại hỗ trợ mong muốn

- Field: `scholarshipFundingTypes`
- Options:
  - Toàn phần
  - Bán phần
  - Hỗ trợ học phí
  - Sinh hoạt phí
  - Hỗ trợ nghiên cứu
  - Vé máy bay
  - Bảo hiểm
  - Ký túc xá

### Ngôn ngữ học mong muốn

- Field: `preferredStudyLanguages`
- Options:
  - English
  - Japanese
  - Korean
  - German
  - French
  - Chinese

### Lĩnh vực nghiên cứu quan tâm

- Field: `interestedResearchFields`
- Type: multi tag
- Rất quan trọng với Master/PhD.
- Ví dụ:
  - Natural Language Processing
  - Computer Vision
  - Cyber Security
  - Recommender Systems
  - Robotics
  - Renewable Energy
  - Biotechnology

### Có cần học bổng toàn phần không?

- Field: `needFullFunding`
- Type: boolean
- Dùng cho:
  - Ưu tiên full scholarship
  - Loại học bổng bán phần nếu người dùng không đủ tài chính

### Mức hỗ trợ tối thiểu mong muốn

- Field: `minimumFundingCoveragePercent`
- Type: number
- Ví dụ:
  - 50%
  - 70%
  - 100%

### Có sẵn sàng viết research proposal không?

- Field: `willingToPrepareResearchProposal`
- Type: boolean
- Dùng cho:
  - Lọc học bổng nghiên cứu
  - Master/PhD scholarship

### Có sẵn sàng liên hệ giáo sư không?

- Field: `willingToContactProfessor`
- Type: boolean
- Dùng cho:
  - Nhật Bản
  - Hàn Quốc
  - Đức
  - Research-based Master/PhD

---

# 7. Kỹ năng chuyên môn

## 7.1. Bảng đề xuất

```ts
ProfileSkill {
  id: string;
  profileId: string;

  skillName: string;
  normalizedSkillId?: string;

  skillCategory: SkillCategory;

  level: SkillLevel;

  yearsOfExperience?: number;

  evidenceType?: SkillEvidenceType;
  evidenceDescription?: string;
}
```

```ts
SkillCategory =
  | "PROGRAMMING_LANGUAGE"
  | "FRAMEWORK"
  | "DATABASE"
  | "CLOUD"
  | "DEVOPS"
  | "AI_DATA"
  | "CYBER_SECURITY"
  | "DESIGN"
  | "ENGINEERING_TOOL"
  | "BUSINESS"
  | "LANGUAGE"
  | "SOFT_SKILL"
  | "RESEARCH"
  | "OTHER";
```

```ts
SkillLevel =
  | "BEGINNER"
  | "BASIC"
  | "INTERMEDIATE"
  | "ADVANCED"
  | "EXPERT";
```

```ts
SkillEvidenceType =
  | "PROJECT"
  | "WORK_EXPERIENCE"
  | "COURSE"
  | "CERTIFICATE"
  | "COMPETITION"
  | "SELF_STUDY"
  | "OTHER";
```

## 7.2. Các trường UI cần có

### Tên kỹ năng

- Field: `skillName`
- Required: yes
- Ví dụ:
  - Java
  - Spring Boot
  - React
  - PostgreSQL
  - Docker
  - Python
  - Machine Learning
  - AutoCAD
  - MATLAB
  - PLC
  - Accounting
  - Financial Analysis

### Nhóm kỹ năng

- Field: `skillCategory`
- Required: yes
- Dùng để filter và hiển thị Skills Cloud theo nhóm.

### Mức độ thành thạo

- Field: `level`
- Required: recommended
- Options:
  - Beginner
  - Basic
  - Intermediate
  - Advanced
  - Expert

### Số năm/tháng kinh nghiệm

- Field: `yearsOfExperience`
- Required: no
- Dùng cho:
  - Job matching
  - Phân biệt biết sơ qua và đã dùng thực tế

### Bằng chứng năng lực

- Field: `evidenceDescription`
- Type: textarea
- Ví dụ:

```text
Đã dùng Spring Boot trong dự án quản lý học tập, xây dựng REST API, authentication và PostgreSQL.
```

Rất quan trọng vì AI không nên chỉ tin tag kỹ năng, mà cần evidence.

---

# 8. Kỹ năng mềm

## 8.1. Bảng đề xuất

```ts
SoftSkill {
  id: string;
  profileId: string;

  skillName: string;
  level: SkillLevel;

  evidence?: string;
}
```

## 8.2. Các kỹ năng mềm nên có

- Teamwork
- Communication
- Problem Solving
- Critical Thinking
- Leadership
- Time Management
- Self-learning
- Adaptability
- Presentation
- Negotiation
- Project Management

## 8.3. UI field

### Kỹ năng mềm

- Field: `skillName`
- Type: multi-select/tag

### Mức độ

- Field: `level`
- Type: select

### Minh chứng

- Field: `evidence`
- Type: textarea
- Ví dụ:

```text
Từng làm nhóm trưởng trong project môn học, chia task và theo dõi tiến độ nhóm 5 người.
```

---

# 9. Ngoại ngữ

Hiện app đã có IELTS, TOEFL, GRE, JLPT, TOEIC. Nên mở rộng và chuẩn hóa hơn.

## 9.1. Bảng đề xuất

```ts
LanguageProficiency {
  id: string;
  profileId: string;

  language: string;

  certificateType?: LanguageCertificateType;
  overallScore?: string;

  listeningScore?: string;
  readingScore?: string;
  writingScore?: string;
  speakingScore?: string;

  cefrLevel?: string;

  testDate?: Date;
  expiryDate?: Date;

  selfAssessmentLevel?: LanguageSelfLevel;
}
```

```ts
LanguageCertificateType =
  | "IELTS"
  | "TOEFL"
  | "TOEIC"
  | "JLPT"
  | "TOPIK"
  | "HSK"
  | "DELF"
  | "GOETHE"
  | "GRE"
  | "GMAT"
  | "OTHER";
```

## 9.2. Các trường UI cần có

### Ngôn ngữ

- Field: `language`
- Required: yes
- Options:
  - English
  - Japanese
  - Korean
  - Chinese
  - German
  - French
  - Vietnamese
  - Other

### Loại chứng chỉ

- Field: `certificateType`
- Required: no
- Ví dụ:
  - IELTS
  - TOEFL
  - TOEIC
  - JLPT
  - TOPIK
  - HSK

### Điểm tổng

- Field: `overallScore`
- Required: nếu có chứng chỉ

### Điểm thành phần

- Fields:
  - `listeningScore`
  - `readingScore`
  - `writingScore`
  - `speakingScore`
- Dùng cho:
  - Một số học bổng yêu cầu writing/speaking riêng
  - Job yêu cầu giao tiếp

### Ngày thi

- Field: `testDate`
- Dùng cho:
  - Kiểm tra chứng chỉ còn mới hay không

### Ngày hết hạn

- Field: `expiryDate`
- Dùng cho:
  - IELTS/TOEFL/TOEIC thường có hạn
  - AI cảnh báo nếu sắp hết hạn

### Tự đánh giá nếu chưa có chứng chỉ

- Field: `selfAssessmentLevel`
- Options:
  - Beginner
  - Elementary
  - Intermediate
  - Upper Intermediate
  - Advanced
  - Native

---

# 10. Chứng chỉ chuyên môn

## 10.1. Bảng đề xuất

```ts
Certification {
  id: string;
  profileId: string;

  name: string;
  issuer: string;

  issueDate?: Date;
  expiryDate?: Date;

  credentialId?: string;
  credentialUrl?: string;

  relatedSkills: string[];
}
```

## 10.2. Ví dụ chứng chỉ

### IT

- AWS Certified Cloud Practitioner
- AWS Solutions Architect
- Microsoft Azure Fundamentals
- Google Cloud Associate Cloud Engineer
- Cisco CCNA
- Oracle Java Certification
- FE - Fundamental Information Technology Engineer
- Security+
- Scrum Master

### Business

- ACCA
- CFA
- Google Analytics
- Digital Marketing
- PMP

### Engineering

- AutoCAD Certification
- SolidWorks Certification
- MATLAB Certification

## 10.3. UI field

- Tên chứng chỉ
- Tổ chức cấp
- Ngày cấp
- Ngày hết hạn
- Link xác thực
- Kỹ năng liên quan

---

# 11. Dự án cá nhân/học tập

Dự án rất quan trọng với job matching, đặc biệt với sinh viên ít kinh nghiệm.

## 11.1. Bảng đề xuất

```ts
Project {
  id: string;
  profileId: string;

  projectName: string;
  projectType: ProjectType;

  roleInProject?: string;

  description: string;

  startDate?: Date;
  endDate?: Date;
  isOngoing: boolean;

  teamSize?: number;

  technologies: string[];

  skillsDemonstrated: string[];

  githubUrl?: string;
  demoUrl?: string;
  documentUrl?: string;

  achievements?: string;
}
```

```ts
ProjectType =
  | "COURSE_PROJECT"
  | "PERSONAL_PROJECT"
  | "GRADUATION_THESIS"
  | "RESEARCH_PROJECT"
  | "COMPANY_PROJECT"
  | "OPEN_SOURCE"
  | "COMPETITION_PROJECT";
```

## 11.2. Các trường UI cần có

### Tên dự án

- Field: `projectName`
- Required: yes

### Loại dự án

- Field: `projectType`
- Required: yes

### Vai trò trong dự án

- Field: `roleInProject`
- Ví dụ:
  - Backend Developer
  - Frontend Developer
  - Fullstack Developer
  - Team Leader
  - Data Analyst
  - Researcher

### Mô tả dự án

- Field: `description`
- Required: yes
- Nên hướng dẫn người dùng viết:
  - Dự án giải quyết vấn đề gì?
  - Người dùng mục tiêu là ai?
  - Có chức năng chính nào?
  - Bản thân đã làm phần nào?

### Công nghệ sử dụng

- Field: `technologies`
- Type: multi-tag
- Required: recommended

### Kỹ năng thể hiện

- Field: `skillsDemonstrated`
- Type: multi-tag
- Ví dụ:
  - REST API
  - Database Design
  - Authentication
  - Recommendation System
  - UI Design
  - Data Visualization

### Link GitHub

- Field: `githubUrl`
- Required: ngành IT nên có

### Link demo

- Field: `demoUrl`
- Required: no

### Thành tích/kết quả

- Field: `achievements`
- Ví dụ:
  - Đạt điểm A
  - Có 100 người dùng thử
  - Giải nhất cuộc thi
  - Được giảng viên đánh giá cao

---

# 12. Kinh nghiệm làm việc

## 12.1. Bảng đề xuất

```ts
WorkExperience {
  id: string;
  profileId: string;

  companyName: string;
  positionTitle: string;

  employmentType: EmploymentType;

  industry?: string;

  startDate: Date;
  endDate?: Date;
  isCurrent: boolean;

  location?: string;
  workMode?: WorkMode;

  responsibilities: string[];

  achievements?: string[];

  technologiesUsed?: string[];

  skillsUsed?: string[];
}
```

## 12.2. UI field

### Công ty/Tổ chức

- Field: `companyName`
- Required: yes

### Vị trí

- Field: `positionTitle`
- Required: yes

### Loại kinh nghiệm

- Field: `employmentType`
- Options:
  - Internship
  - Part-time
  - Full-time
  - Freelance
  - Volunteer
  - Research Assistant

### Ngành/lĩnh vực công ty

- Field: `industry`
- Required: no

### Thời gian

- Field:
  - `startDate`
  - `endDate`
  - `isCurrent`

### Nhiệm vụ chính

- Field: `responsibilities`
- Type: list textarea

### Thành tích

- Field: `achievements`
- Type: list textarea

### Công nghệ/kỹ năng sử dụng

- Field:
  - `technologiesUsed`
  - `skillsUsed`

---

# 13. Kinh nghiệm nghiên cứu

Phần này rất quan trọng cho học bổng sau đại học.

## 13.1. Bảng đề xuất

```ts
ResearchExperience {
  id: string;
  profileId: string;

  title: string;
  researchField: string;

  supervisorName?: string;
  institutionName?: string;

  startDate?: Date;
  endDate?: Date;
  isOngoing: boolean;

  description: string;

  methodsUsed?: string[];
  toolsUsed?: string[];

  outcome?: string;

  relatedPublicationIds?: string[];
}
```

## 13.2. Các trường UI

### Tên đề tài/nghiên cứu

- Field: `title`
- Required: yes

### Lĩnh vực nghiên cứu

- Field: `researchField`
- Required: yes
- Ví dụ:
  - AI
  - NLP
  - Computer Vision
  - Cyber Security
  - Robotics
  - Renewable Energy
  - Biotechnology

### Người hướng dẫn

- Field: `supervisorName`
- Required: no

### Tổ chức/Phòng lab

- Field: `institutionName`
- Required: no

### Mô tả nghiên cứu

- Field: `description`
- Required: yes

### Phương pháp sử dụng

- Field: `methodsUsed`
- Ví dụ:
  - Literature Review
  - Experiment
  - Simulation
  - Survey
  - Machine Learning
  - Statistical Analysis

### Công cụ sử dụng

- Field: `toolsUsed`
- Ví dụ:
  - Python
  - MATLAB
  - R
  - SPSS
  - PyTorch
  - TensorFlow

### Kết quả

- Field: `outcome`
- Ví dụ:
  - Hoàn thành báo cáo
  - Có bài báo
  - Đạt giải nghiên cứu khoa học
  - Đang chuẩn bị submission

---

# 14. Công bố khoa học

## 14.1. Bảng đề xuất

```ts
Publication {
  id: string;
  profileId: string;

  title: string;
  publicationType: PublicationType;

  venueName?: string;
  publicationDate?: Date;

  authors: string[];

  doi?: string;
  url?: string;

  abstract?: string;

  relatedFields: string[];
}
```

```ts
PublicationType =
  | "JOURNAL"
  | "CONFERENCE"
  | "WORKSHOP"
  | "PREPRINT"
  | "THESIS"
  | "REPORT"
  | "OTHER";
```

## 14.2. UI field

- Tên bài báo
- Loại công bố
- Hội nghị/tạp chí
- Ngày công bố
- Danh sách tác giả
- DOI/link
- Abstract
- Lĩnh vực liên quan

---

# 15. Thành tích, giải thưởng

## 15.1. Bảng đề xuất

```ts
Achievement {
  id: string;
  profileId: string;

  title: string;
  achievementType: AchievementType;

  issuer?: string;
  date?: Date;

  description?: string;

  level?: AchievementLevel;

  relatedSkills?: string[];
}
```

```ts
AchievementType =
  | "ACADEMIC"
  | "COMPETITION"
  | "SCHOLARSHIP"
  | "OLYMPIAD"
  | "RESEARCH"
  | "LEADERSHIP"
  | "SPORT"
  | "ART"
  | "OTHER";
```

```ts
AchievementLevel =
  | "SCHOOL"
  | "UNIVERSITY"
  | "CITY"
  | "NATIONAL"
  | "INTERNATIONAL";
```

## 15.2. UI field

- Tên thành tích
- Loại thành tích
- Tổ chức cấp
- Thời gian
- Cấp độ
- Mô tả
- Kỹ năng liên quan

---

# 16. Hoạt động ngoại khóa và lãnh đạo

## 16.1. Bảng đề xuất

```ts
Activity {
  id: string;
  profileId: string;

  activityName: string;
  organizationName?: string;

  role?: string;

  activityType: ActivityType;

  startDate?: Date;
  endDate?: Date;

  description?: string;

  impact?: string;

  skillsGained?: string[];
}
```

```ts
ActivityType =
  | "CLUB"
  | "VOLUNTEER"
  | "COMMUNITY_SERVICE"
  | "LEADERSHIP"
  | "EVENT_ORGANIZATION"
  | "MENTORING"
  | "SPORT"
  | "OTHER";
```

## 16.2. UI field

- Tên hoạt động
- Tổ chức
- Vai trò
- Loại hoạt động
- Thời gian
- Mô tả
- Tác động/kết quả
- Kỹ năng học được

Dùng cho:
- Học bổng yêu cầu leadership
- Học bổng yêu cầu community service
- Job đánh giá kỹ năng mềm

---

# 17. Sở thích học thuật/nghề nghiệp

## 17.1. Bảng đề xuất

```ts
Interest {
  id: string;
  profileId: string;

  interestName: string;

  interestType:
    | "CAREER"
    | "ACADEMIC"
    | "RESEARCH"
    | "INDUSTRY"
    | "TECHNOLOGY";

  priorityLevel:
    | "LOW"
    | "MEDIUM"
    | "HIGH";
}
```

## 17.2. UI field

### Lĩnh vực quan tâm

- Field: `interestName`
- Ví dụ:
  - Backend
  - AI
  - Game
  - Pentesting
  - Data
  - Robotics
  - Semiconductor
  - Finance
  - Education

### Mức độ ưu tiên

- Field: `priorityLevel`
- Options:
  - Thấp
  - Trung bình
  - Cao

Dùng cho:
- AI recommendation
- Không chỉ match theo ngành học, mà còn theo định hướng cá nhân

---

# 18. Điều kiện cá nhân và ràng buộc

## 18.1. Bảng đề xuất

```ts
PersonalConstraint {
  id: string;
  profileId: string;

  constraintType: ConstraintType;
  value: string;
  priority: PriorityLevel;
}
```

```ts
ConstraintType =
  | "LOCATION"
  | "FINANCIAL"
  | "TIME"
  | "VISA"
  | "FAMILY"
  | "HEALTH"
  | "OTHER";
```

## 18.2. Các trường nên có

### Ràng buộc địa điểm

- Ví dụ:
  - Chỉ muốn làm ở Hà Nội
  - Có thể đi Nhật
  - Chỉ muốn remote

### Ràng buộc tài chính

- Ví dụ:
  - Cần học bổng toàn phần
  - Có thể tự chi trả một phần
  - Cần có sinh hoạt phí

### Ràng buộc thời gian

- Ví dụ:
  - Chỉ có thể làm part-time
  - Có thể bắt đầu từ tháng 9
  - Muốn apply học bổng năm sau

### Ràng buộc visa/di chuyển

- Ví dụ:
  - Sẵn sàng làm visa
  - Chưa có hộ chiếu
  - Chỉ muốn học online/remote

---

# 19. Tài liệu và minh chứng

## 19.1. Bảng đề xuất

```ts
ProfileDocument {
  id: string;
  profileId: string;

  documentType: DocumentType;

  fileUrl: string;
  fileName: string;

  uploadedAt: Date;

  extractedText?: string;
  aiSummary?: string;
}
```

```ts
DocumentType =
  | "CV"
  | "TRANSCRIPT"
  | "CERTIFICATE"
  | "LANGUAGE_CERTIFICATE"
  | "RECOMMENDATION_LETTER"
  | "RESEARCH_PROPOSAL"
  | "PORTFOLIO"
  | "PUBLICATION"
  | "OTHER";
```

## 19.2. Tài liệu nên cho upload

- CV
- Bảng điểm
- Chứng chỉ ngoại ngữ
- Chứng chỉ chuyên môn
- Thư giới thiệu
- Research proposal
- Portfolio
- Bài báo
- Giấy chứng nhận giải thưởng

Dùng cho:
- AI trích xuất thông tin tự động
- Xác minh độ tin cậy hồ sơ
- Gợi ý học bổng yêu cầu hồ sơ đầy đủ

---

# 20. Dữ liệu AI phân tích từ hồ sơ

Không nhất thiết cho người dùng sửa trực tiếp, nhưng nên lưu trong database.

## 20.1. Bảng đề xuất

```ts
ProfileAIAnalysis {
  id: string;
  profileId: string;

  summary: string;

  detectedCareerTracks: string[];
  detectedAcademicTracks: string[];

  strengthTags: string[];
  weaknessTags: string[];

  missingFields: string[];

  jobReadinessScore: number;
  scholarshipReadinessScore: number;

  recommendedImprovements: string[];

  analyzedAt: Date;
}
```

## 20.2. Ví dụ AI summary

```text
Người dùng có nền tảng Công nghệ thông tin, mạnh về Backend, Java, Spring Boot, React và có định hướng tìm việc Fresher Fullstack/Backend. Hồ sơ phù hợp với job Fresher Backend, Web Developer và một số học bổng Master ngành Computer Science/Data Science nếu cải thiện thêm nghiên cứu và chứng chỉ ngoại ngữ.
```

## 20.3. Strength tags

Ví dụ:

- Strong GPA
- Backend Foundation
- AI Interest
- Japanese N2
- Research Potential
- Fullstack Project Experience

## 20.4. Weakness tags

Ví dụ:

- Missing Research Experience
- No Publication
- No GitHub Link
- Limited Work Experience
- IELTS Missing
- Scholarship Documents Incomplete

## 20.5. Missing fields

Ví dụ:

- Chưa có bảng điểm
- Chưa có chứng chỉ tiếng Anh
- Chưa có link GitHub
- Chưa có research proposal
- Chưa có thư giới thiệu
- Chưa có mức lương mong muốn

---

# 21. Profile completeness score

Nên có điểm hoàn thiện hồ sơ.

## 21.1. Công thức gợi ý

```text
Basic Info: 10%
Education: 15%
Career Preference: 10%
Scholarship Preference: 10%
Skills: 15%
Languages: 10%
Projects: 10%
Work Experience: 5%
Research: 5%
Achievements/Activities: 5%
Documents: 5%
```

## 21.2. UI hiển thị

```text
Hồ sơ hoàn thiện 83%
Còn thiếu: Link GitHub, chứng chỉ tiếng Anh, research proposal
```

---

# 22. Job readiness score

Điểm sẵn sàng ứng tuyển việc làm.

## 22.1. Công thức gợi ý

```text
Relevant Skills: 30%
Projects: 20%
Work Experience: 20%
Education/Major Fit: 10%
Language: 10%
Portfolio/GitHub: 5%
Soft Skills: 5%
```

## 22.2. Ý nghĩa

- 0 - 40: Chưa sẵn sàng
- 41 - 60: Có thể ứng tuyển internship
- 61 - 80: Có thể ứng tuyển fresher/junior
- 81 - 100: Hồ sơ mạnh

---

# 23. Scholarship readiness score

Điểm sẵn sàng ứng tuyển học bổng.

## 23.1. Công thức gợi ý

```text
GPA: 20%
Major Fit: 15%
Language: 20%
Research Experience: 15%
Achievements: 10%
Activities/Leadership: 10%
Documents: 10%
```

## 23.2. Ý nghĩa

- 0 - 40: Chưa sẵn sàng
- 41 - 60: Có thể ứng tuyển học bổng yêu cầu thấp/bán phần
- 61 - 80: Có thể ứng tuyển nhiều học bổng tốt
- 81 - 100: Hồ sơ mạnh cho học bổng cạnh tranh

---

# 24. Mapping hồ sơ năng lực với việc làm

Khi match một job, AI nên dùng các trường:

```text
desiredJobRoles
desiredIndustries
careerLevel
employmentTypes
workModes
preferredLocations
skills
projects
workExperience
languages
certifications
expectedSalary
availableFrom
```

## 24.1. Công thức match job gợi ý

```text
Skill Match: 35%
Role Match: 20%
Experience Level Match: 15%
Location/Work Mode Match: 10%
Industry Interest Match: 10%
Language/Certificate Match: 5%
Salary/Availability Match: 5%
```

---

# 25. Mapping hồ sơ năng lực với học bổng

Khi match một scholarship, AI nên dùng các trường:

```text
degreeLevel
major
gpa
nationality
targetCountries
targetDegreeLevels
targetMajors
languages
researchExperience
publications
achievements
activities
documents
fundingPreference
```

## 25.1. Công thức match học bổng gợi ý

```text
Eligibility Match: 30%
Major/Research Field Match: 20%
Academic Strength: 15%
Language Match: 15%
Funding/Country Preference: 10%
Activities/Achievements: 5%
Document Readiness: 5%
```

---

# 26. Các tab UI đề xuất cho hồ sơ năng lực

## Tab 1: Tổng quan

Hiển thị:

- Avatar
- Tên
- Ngành học
- Trường
- Bio ngắn
- Profile completeness score
- Job readiness score
- Scholarship readiness score
- Strength tags
- Missing fields

## Tab 2: Học vấn & Ngành học

Form:

- Trường
- Bậc học
- Ngành học
- Chuyên ngành
- GPA
- Năm học
- Đề tài
- Môn học liên quan

## Tab 3: Định hướng việc làm

Form:

- Vị trí mong muốn
- Ngành công nghiệp quan tâm
- Level
- Hình thức làm việc
- Work mode
- Địa điểm
- Lương mong muốn
- Có thể bắt đầu từ ngày nào
- Mục tiêu ngắn hạn/dài hạn

## Tab 4: Định hướng học bổng

Form:

- Bậc học muốn apply
- Quốc gia mong muốn
- Ngành học muốn apply
- Funding mong muốn
- Kỳ nhập học
- Ngôn ngữ học
- Lĩnh vực nghiên cứu
- Có cần full funding không
- Có sẵn sàng liên hệ giáo sư không

## Tab 5: Kỹ năng

Form:

- Hard skills
- Soft skills
- Research skills
- Tool skills
- Skill level
- Evidence

## Tab 6: Ngoại ngữ & Chứng chỉ

Form:

- Ngoại ngữ
- Chứng chỉ
- Điểm tổng
- Điểm thành phần
- Ngày thi
- Ngày hết hạn
- Chứng chỉ chuyên môn

## Tab 7: Dự án & Kinh nghiệm

Form:

- Dự án
- Kinh nghiệm làm việc
- Công nghệ dùng
- Vai trò
- Thành tích

## Tab 8: Nghiên cứu & Thành tích

Form:

- Kinh nghiệm nghiên cứu
- Công bố khoa học
- Giải thưởng
- Hoạt động ngoại khóa
- Leadership

## Tab 9: Tài liệu

Form upload:

- CV
- Bảng điểm
- Chứng chỉ
- Portfolio
- Thư giới thiệu
- Research proposal

---

# 27. Những trường hiện tại trong ảnh nên giữ

Từ UI hiện tại, nên giữ các trường:

- Họ tên
- Email
- Trình độ cao nhất
- Ngành học
- Số năm kinh nghiệm
- Bio
- Địa điểm mong muốn
- Lĩnh vực quan tâm
- Mục tiêu ngắn hạn
- Học vấn
- Kinh nghiệm
- Kỹ năng
- Ngoại ngữ
- Trạng thái sẵn sàng

Nhưng cần mở rộng vì hiện tại còn thiếu:

- Quốc tịch
- Năm tốt nghiệp dự kiến
- GPA scale
- Chuyên ngành
- Môn học liên quan
- Career level
- Employment type
- Work mode
- Expected salary
- Available from
- Target scholarship degree
- Target scholarship country
- Funding preference
- Research fields
- Research experience
- Publications
- Achievements
- Activities
- Certifications
- Documents
- Skill level
- Evidence cho kỹ năng
- AI analysis
- Missing fields
- Readiness score riêng cho job và scholarship

---

# 28. Schema tổng hợp đề xuất

```ts
UserCapabilityProfile {
  id: string;
  userId: string;

  basicInfo: ProfileBasicInfo;

  educations: Education[];

  careerPreference: CareerPreference;

  scholarshipPreference: ScholarshipPreference;

  skills: ProfileSkill[];

  softSkills: SoftSkill[];

  languages: LanguageProficiency[];

  certifications: Certification[];

  projects: Project[];

  workExperiences: WorkExperience[];

  researchExperiences: ResearchExperience[];

  publications: Publication[];

  achievements: Achievement[];

  activities: Activity[];

  interests: Interest[];

  constraints: PersonalConstraint[];

  documents: ProfileDocument[];

  aiAnalysis: ProfileAIAnalysis;

  profileCompletenessScore: number;
  jobReadinessScore: number;
  scholarshipReadinessScore: number;

  createdAt: Date;
  updatedAt: Date;
}
```

---

# 29. Gợi ý thứ tự ưu tiên phát triển

## MVP nên làm trước

1. Basic info
2. Education
3. Career preference
4. Scholarship preference
5. Skills
6. Languages
7. Projects
8. Work experience
9. AI analysis summary
10. Readiness score

## Sau MVP

1. Research experience
2. Publications
3. Achievements
4. Activities
5. Documents upload
6. Skill evidence
7. AI extracted profile from uploaded CV/transcript
8. Missing field detection
9. Recommendation explanation

---

# 30. Nguyên tắc hiển thị kết quả gợi ý

Khi hệ thống gợi ý job/học bổng, không chỉ hiện danh sách, mà nên giải thích:

```text
Vì sao phù hợp?
- Ngành học của bạn phù hợp 90%
- Bạn có 7/10 kỹ năng yêu cầu
- GPA của bạn đạt điều kiện
- IELTS của bạn cao hơn yêu cầu
- Bạn quan tâm đến Backend và job này là Backend Fresher
```

Và cũng cần cảnh báo:

```text
Bạn còn thiếu:
- Chưa có Docker
- Chưa có AWS
- Chưa có chứng chỉ tiếng Anh
- Chưa có research proposal
```

Đây là điểm quan trọng để Oppotify khác với website tìm việc/học bổng thông thường.
