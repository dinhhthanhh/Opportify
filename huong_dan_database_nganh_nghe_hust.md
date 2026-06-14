# HƯỚNG DẪN THIẾT KẾ DATABASE NGÀNH NGHỀ CHO HỆ THỐNG GỢI Ý VIỆC LÀM / HỌC BỔNG

> Bối cảnh: Hệ thống dành cho sinh viên Đại học Bách khoa Hà Nội.  
> Mục tiêu: Lưu thông tin ngành nghề để AI có thể gợi ý việc làm, học bổng, chương trình thực tập, lộ trình học kỹ năng phù hợp với từng sinh viên.

---

## 1. Nguyên tắc thiết kế

Không nên lưu “ngành học” quá cứng theo đúng mã tuyển sinh, vì một ngành học có thể đi tới nhiều hướng nghề nghiệp khác nhau.

Ví dụ:

- Công nghệ thông tin có thể đi tới Backend, Frontend, AI Engineer, Data Engineer, DevOps, Security.
- Điện tử viễn thông có thể đi tới Embedded, IoT, Network Engineer, IC Design, Telecom Engineer.
- Cơ điện tử có thể đi tới Robotics, Automation, Mechanical Design, Embedded Control.

Vì vậy nên tách thành 3 lớp dữ liệu:

```text
academic_major_group      Nhóm ngành học tại HUST
career_track              Hướng nghề nghiệp cụ thể
career_profile_template   Bộ tiêu chí dùng để AI đánh giá / gợi ý
```

---

## 2. Bảng tổng quan nhóm ngành nên có

| Mã nhóm | Nhóm ngành / nghề | Phù hợp với sinh viên |
|---|---|---|
| IT | Công nghệ thông tin, Khoa học máy tính, Kỹ thuật phần mềm, AI, Data | Sinh viên CNTT, Toán tin, AI, Data |
| EE_ET | Điện - Điện tử - Viễn thông - Vi mạch | Sinh viên điện tử, viễn thông, kỹ thuật máy tính, bán dẫn |
| AUTO_ROBOT | Điều khiển - Tự động hóa - Robotics - IoT công nghiệp | Sinh viên tự động hóa, cơ điện tử, điện, robot |
| MECH_AUTO | Cơ khí - Cơ điện tử - Ô tô - Chế tạo máy | Sinh viên cơ khí, cơ điện tử, ô tô |
| MATERIAL | Vật liệu - Luyện kim - Công nghệ nano | Sinh viên vật liệu, kim loại, composite, bán dẫn vật liệu |
| CHEM_BIO_FOOD | Hóa học - Sinh học - Thực phẩm - Môi trường | Sinh viên hóa, sinh học, thực phẩm, môi trường |
| ENERGY | Năng lượng - Nhiệt lạnh - Điện năng - Năng lượng tái tạo | Sinh viên điện, nhiệt, năng lượng |
| CIVIL_INFRA | Xây dựng - Hạ tầng - Giao thông - Quản lý công trình | Sinh viên xây dựng, hạ tầng, logistics kỹ thuật |
| ECON_MANAGEMENT | Kinh tế công nghiệp - Logistics - Quản trị - Kế toán kỹ thuật | Sinh viên kinh tế quản lý, logistics, quản lý công nghiệp |
| LANGUAGE_TECH | Ngoại ngữ khoa học công nghệ - Biên phiên dịch kỹ thuật | Sinh viên tiếng Anh/Nhật/Hàn khoa học công nghệ |
| INTERDISCIPLINARY | Tâm lý học công nghiệp - Giáo dục STEM - Công nghệ giáo dục | Sinh viên ngành mới, liên ngành, giáo dục kỹ thuật |

---

## 3. Schema database đề xuất

### 3.1. Bảng `major_groups`

Lưu nhóm ngành học lớn.

```ts
type MajorGroup = {
  id: string;
  code: string;                 // IT, EE_ET, AUTO_ROBOT...
  nameVi: string;
  nameEn: string;
  description: string;
  relatedHustPrograms: string[]; // Tên ngành/chương trình HUST liên quan
  keywords: string[];
  createdAt: Date;
  updatedAt: Date;
};
```

### 3.2. Bảng `career_tracks`

Lưu hướng nghề nghiệp cụ thể trong từng nhóm ngành.

```ts
type CareerTrack = {
  id: string;
  majorGroupId: string;
  code: string;                 // BACKEND, AI_ENGINEER, EMBEDDED...
  nameVi: string;
  nameEn: string;
  description: string;

  typicalJobTitles: string[];   // Tên vị trí thường gặp
  targetStudentYears: number[]; // [1,2,3,4,5]
  suitableForMajors: string[];  // Các ngành học phù hợp

  requiredSkills: SkillRequirement[];
  preferredSkills: SkillRequirement[];
  domainKnowledge: string[];
  tools: string[];
  programmingLanguages: string[];

  commonCertificates: string[];
  portfolioSuggestions: string[];
  scholarshipKeywords: string[];
  internshipKeywords: string[];
  jobSearchKeywords: string[];

  filterConfig: CareerFilterConfig;

  createdAt: Date;
  updatedAt: Date;
};
```

### 3.3. Object `SkillRequirement`

```ts
type SkillRequirement = {
  name: string;
  category:
    | "programming"
    | "framework"
    | "database"
    | "math"
    | "engineering"
    | "language"
    | "soft_skill"
    | "tool"
    | "domain";
  level: "basic" | "intermediate" | "advanced";
  weight: number; // 1-5, dùng cho AI scoring
};
```

### 3.4. Object `CareerFilterConfig`

```ts
type CareerFilterConfig = {
  filterByYear: boolean;
  filterByGpa: boolean;
  filterByLanguage: boolean;
  filterByProgrammingLanguage: boolean;
  filterByTool: boolean;
  filterByCertificate: boolean;
  filterByLocation: boolean;
  filterByWorkMode: boolean;
  filterByDomainInterest: boolean;
  filterByScholarshipType: boolean;
  filterByExperienceLevel: boolean;
};
```

### 3.5. Bảng `student_profiles`

Lưu hồ sơ năng lực sinh viên.

```ts
type StudentProfile = {
  id: string;
  userId: string;

  majorGroupCode: string;
  majorName: string;
  studentYear: number;
  gpa?: number;

  interestedCareerTrackCodes: string[];

  skills: StudentSkill[];
  languages: LanguageSkill[];
  certificates: Certificate[];
  projects: ProjectProfile[];
  workExperiences: WorkExperience[];

  preferredLocations: string[];
  preferredWorkModes: ("onsite" | "hybrid" | "remote")[];
  preferredOpportunityTypes: ("internship" | "job" | "scholarship" | "contest" | "research")[];

  createdAt: Date;
  updatedAt: Date;
};
```

---

# 4. Chi tiết theo từng nhóm ngành

---

## 4.1. Nhóm Công nghệ thông tin / AI / Data

### Các hướng nghề nên có

| Code | Hướng nghề |
|---|---|
| FRONTEND | Frontend Developer |
| BACKEND | Backend Developer |
| FULLSTACK | Fullstack Developer |
| MOBILE | Mobile Developer |
| AI_ENGINEER | AI / Machine Learning Engineer |
| DATA_ANALYST | Data Analyst |
| DATA_ENGINEER | Data Engineer |
| DEVOPS | DevOps / Cloud Engineer |
| CYBER_SECURITY | Cybersecurity Engineer |
| QA_TESTER | QA / Software Tester |
| PRODUCT_UIUX | Product / UIUX / Business Analyst |

### Thông tin cần lưu

```ts
{
  majorGroupCode: "IT",
  careerTrackCode: "BACKEND",
  nameVi: "Lập trình Backend",
  typicalJobTitles: [
    "Backend Developer",
    "Node.js Developer",
    "Java Spring Developer",
    "API Developer",
    "Software Engineer"
  ],
  requiredSkills: [
    { name: "REST API", category: "framework", level: "intermediate", weight: 5 },
    { name: "Database Design", category: "database", level: "intermediate", weight: 5 },
    { name: "SQL", category: "database", level: "intermediate", weight: 5 },
    { name: "Authentication / Authorization", category: "domain", level: "intermediate", weight: 4 },
    { name: "Git", category: "tool", level: "basic", weight: 4 }
  ],
  preferredSkills: [
    { name: "Docker", category: "tool", level: "basic", weight: 3 },
    { name: "Clean Architecture", category: "domain", level: "intermediate", weight: 3 },
    { name: "Redis", category: "database", level: "basic", weight: 2 },
    { name: "CI/CD", category: "tool", level: "basic", weight: 2 }
  ],
  programmingLanguages: ["JavaScript", "TypeScript", "Java", "Python", "Go", "C#"],
  tools: ["Git", "Docker", "Postman", "Swagger", "PostgreSQL", "MySQL", "MongoDB"],
  portfolioSuggestions: [
    "Website fullstack có authentication",
    "REST API có phân quyền",
    "Hệ thống quản lý học tập / tuyển dụng / đặt phòng",
    "Dự án có Docker và tài liệu API"
  ]
}
```

### Nên lọc theo

- Năm học: năm 2 trở lên cho internship, năm 3-5 cho job.
- Ngôn ngữ lập trình: JavaScript, TypeScript, Java, Python, Go.
- Framework: React, Next.js, NestJS, Spring Boot, Django.
- Database: PostgreSQL, MySQL, MongoDB.
- Trình độ tiếng Anh/Nhật.
- Loại cơ hội: internship, fresher, research, học bổng AI/Data.
- Kinh nghiệm dự án: có GitHub, có demo, có API document.
- Mức độ phù hợp: Backend / Frontend / AI / Data / Security.

---

## 4.2. Nhóm Điện - Điện tử - Viễn thông - Vi mạch

### Các hướng nghề nên có

| Code | Hướng nghề |
|---|---|
| EMBEDDED | Embedded Software Engineer |
| IOT | IoT Engineer |
| TELECOM | Telecom / Network Engineer |
| IC_DESIGN | IC Design / Semiconductor Engineer |
| HARDWARE | Hardware Design Engineer |
| SIGNAL_PROCESSING | Signal Processing Engineer |
| COMPUTER_ENGINEERING | Computer Engineering |

### Thông tin cần lưu

```ts
{
  majorGroupCode: "EE_ET",
  careerTrackCode: "EMBEDDED",
  nameVi: "Kỹ sư lập trình nhúng",
  typicalJobTitles: [
    "Embedded Software Engineer",
    "Firmware Engineer",
    "IoT Developer",
    "Automotive Embedded Engineer"
  ],
  requiredSkills: [
    { name: "C/C++", category: "programming", level: "intermediate", weight: 5 },
    { name: "Microcontroller", category: "engineering", level: "intermediate", weight: 5 },
    { name: "Digital Electronics", category: "engineering", level: "basic", weight: 4 },
    { name: "RTOS", category: "domain", level: "basic", weight: 3 },
    { name: "Debugging Hardware", category: "tool", level: "basic", weight: 3 }
  ],
  preferredSkills: [
    { name: "STM32", category: "tool", level: "basic", weight: 4 },
    { name: "Arduino/ESP32", category: "tool", level: "basic", weight: 3 },
    { name: "CAN/UART/I2C/SPI", category: "domain", level: "basic", weight: 4 },
    { name: "Linux Embedded", category: "domain", level: "basic", weight: 3 }
  ],
  programmingLanguages: ["C", "C++", "Python"],
  tools: ["STM32CubeIDE", "Keil C", "Proteus", "Altium", "Oscilloscope", "Logic Analyzer"],
  portfolioSuggestions: [
    "Robot điều khiển bằng vi điều khiển",
    "Thiết bị IoT đo nhiệt độ/độ ẩm gửi dữ liệu lên cloud",
    "Firmware giao tiếp UART/I2C/SPI",
    "Mạch PCB tự thiết kế"
  ]
}
```

### Nên lọc theo

- Có biết C/C++ hay không.
- Có kinh nghiệm vi điều khiển: STM32, ESP32, Arduino.
- Có biết giao tiếp phần cứng: UART, I2C, SPI, CAN.
- Có dự án phần cứng thực tế.
- Có biết thiết kế mạch/PCB.
- Tiếng Nhật nếu gợi ý công ty Nhật về embedded/automotive.
- Hướng muốn làm: firmware, hardware, network, chip design, telecom.

---

## 4.3. Nhóm Điều khiển - Tự động hóa - Robotics - IoT công nghiệp

### Các hướng nghề nên có

| Code | Hướng nghề |
|---|---|
| AUTOMATION_ENGINEER | Automation Engineer |
| PLC_SCADA | PLC / SCADA Engineer |
| ROBOTICS | Robotics Engineer |
| CONTROL_ENGINEER | Control System Engineer |
| INDUSTRIAL_IOT | Industrial IoT Engineer |
| SMART_FACTORY | Smart Factory Engineer |

### Thông tin cần lưu

```ts
{
  majorGroupCode: "AUTO_ROBOT",
  careerTrackCode: "PLC_SCADA",
  nameVi: "Kỹ sư PLC/SCADA",
  typicalJobTitles: [
    "Automation Engineer",
    "PLC Engineer",
    "SCADA Engineer",
    "Control Engineer"
  ],
  requiredSkills: [
    { name: "PLC Programming", category: "engineering", level: "intermediate", weight: 5 },
    { name: "Control Theory", category: "engineering", level: "intermediate", weight: 5 },
    { name: "Electrical Drawing", category: "engineering", level: "basic", weight: 4 },
    { name: "Sensor and Actuator", category: "engineering", level: "basic", weight: 4 }
  ],
  preferredSkills: [
    { name: "Siemens PLC", category: "tool", level: "basic", weight: 4 },
    { name: "SCADA/HMI", category: "tool", level: "basic", weight: 4 },
    { name: "MATLAB/Simulink", category: "tool", level: "basic", weight: 3 },
    { name: "Industrial Network", category: "domain", level: "basic", weight: 3 }
  ],
  programmingLanguages: ["C", "C++", "Python", "Ladder Logic"],
  tools: ["TIA Portal", "WinCC", "MATLAB", "Simulink", "LabVIEW"],
  portfolioSuggestions: [
    "Mô hình băng chuyền dùng PLC",
    "Hệ thống giám sát nhiệt độ/áp suất bằng SCADA",
    "Robot dò line / robot cánh tay",
    "Mô phỏng điều khiển PID bằng MATLAB"
  ]
}
```

### Nên lọc theo

- Biết PLC hãng nào: Siemens, Mitsubishi, Omron.
- Có biết SCADA/HMI không.
- Có nền tảng điều khiển tự động, PID, sensor/actuator.
- Có biết robot, ROS, MATLAB/Simulink.
- Muốn làm nhà máy, smart factory, robotics hay R&D.
- Sẵn sàng đi công tác / làm tại khu công nghiệp.
- Tiếng Nhật/Hàn/Trung nếu công ty sản xuất nước ngoài.

---

## 4.4. Nhóm Cơ khí - Cơ điện tử - Ô tô - Chế tạo máy

### Các hướng nghề nên có

| Code | Hướng nghề |
|---|---|
| MECHANICAL_DESIGN | Mechanical Design Engineer |
| MECHATRONICS | Mechatronics Engineer |
| AUTOMOTIVE | Automotive Engineer |
| MANUFACTURING | Manufacturing Engineer |
| CAD_CAM_CAE | CAD/CAM/CAE Engineer |
| MAINTENANCE | Maintenance Engineer |
| QUALITY_MECHANICAL | Mechanical Quality Engineer |

### Thông tin cần lưu

```ts
{
  majorGroupCode: "MECH_AUTO",
  careerTrackCode: "MECHANICAL_DESIGN",
  nameVi: "Kỹ sư thiết kế cơ khí",
  typicalJobTitles: [
    "Mechanical Design Engineer",
    "CAD Engineer",
    "Product Design Engineer",
    "Manufacturing Engineer"
  ],
  requiredSkills: [
    { name: "Technical Drawing", category: "engineering", level: "intermediate", weight: 5 },
    { name: "Mechanical Design", category: "engineering", level: "intermediate", weight: 5 },
    { name: "Material Mechanics", category: "engineering", level: "basic", weight: 4 },
    { name: "CAD", category: "tool", level: "intermediate", weight: 5 }
  ],
  preferredSkills: [
    { name: "SolidWorks", category: "tool", level: "intermediate", weight: 4 },
    { name: "AutoCAD", category: "tool", level: "basic", weight: 3 },
    { name: "CATIA", category: "tool", level: "basic", weight: 3 },
    { name: "CAM/CNC", category: "tool", level: "basic", weight: 3 }
  ],
  programmingLanguages: ["Python", "MATLAB"],
  tools: ["SolidWorks", "AutoCAD", "CATIA", "Inventor", "ANSYS", "Mastercam"],
  portfolioSuggestions: [
    "Bản vẽ 3D sản phẩm cơ khí",
    "Mô phỏng chịu lực bằng ANSYS",
    "Thiết kế chi tiết máy hoàn chỉnh",
    "Dự án robot/cơ cấu truyền động"
  ]
}
```

### Nên lọc theo

- Công cụ CAD/CAM/CAE: SolidWorks, AutoCAD, CATIA, ANSYS.
- Hướng nghề: thiết kế, sản xuất, bảo trì, ô tô, chất lượng.
- Có portfolio bản vẽ 2D/3D.
- Có hiểu tiêu chuẩn kỹ thuật, dung sai, vật liệu.
- Có sẵn sàng làm nhà máy/khu công nghiệp.
- Tiếng Nhật nếu ứng tuyển công ty cơ khí Nhật.

---

## 4.5. Nhóm Vật liệu - Luyện kim - Công nghệ nano - Bán dẫn vật liệu

### Các hướng nghề nên có

| Code | Hướng nghề |
|---|---|
| MATERIAL_ENGINEER | Materials Engineer |
| METALLURGY | Metallurgical Engineer |
| SEMICONDUCTOR_MATERIAL | Semiconductor Materials Engineer |
| NANO_TECH | Nanotechnology Engineer |
| QUALITY_MATERIAL | Material Quality Engineer |
| LAB_RESEARCH | Laboratory Research Assistant |

### Thông tin cần lưu

```ts
{
  majorGroupCode: "MATERIAL",
  careerTrackCode: "MATERIAL_ENGINEER",
  nameVi: "Kỹ sư vật liệu",
  typicalJobTitles: [
    "Materials Engineer",
    "Quality Engineer",
    "R&D Lab Assistant",
    "Semiconductor Materials Engineer"
  ],
  requiredSkills: [
    { name: "Material Science", category: "domain", level: "intermediate", weight: 5 },
    { name: "Material Testing", category: "engineering", level: "basic", weight: 4 },
    { name: "Chemistry Foundation", category: "domain", level: "basic", weight: 4 },
    { name: "Lab Safety", category: "domain", level: "basic", weight: 4 }
  ],
  preferredSkills: [
    { name: "SEM/XRD/EDS", category: "tool", level: "basic", weight: 3 },
    { name: "Quality Control", category: "domain", level: "basic", weight: 3 },
    { name: "Semiconductor Process", category: "domain", level: "basic", weight: 3 }
  ],
  programmingLanguages: ["Python", "MATLAB"],
  tools: ["SEM", "XRD", "EDS", "Origin", "Excel", "MATLAB"],
  portfolioSuggestions: [
    "Báo cáo thí nghiệm vật liệu",
    "Nghiên cứu về polymer/composite/kim loại",
    "Phân tích dữ liệu đo kiểm vật liệu",
    "Dự án liên quan vật liệu bán dẫn"
  ]
}
```

### Nên lọc theo

- Hướng vật liệu: kim loại, polymer, composite, nano, bán dẫn.
- Có kinh nghiệm phòng thí nghiệm.
- Có biết thiết bị phân tích: SEM, XRD, EDS.
- Có kỹ năng xử lý số liệu.
- Có quan tâm R&D hay QA/QC.
- Học bổng nghiên cứu, lab, master, exchange.

---

## 4.6. Nhóm Hóa học - Sinh học - Thực phẩm - Môi trường

### Các hướng nghề nên có

| Code | Hướng nghề |
|---|---|
| CHEMICAL_ENGINEER | Chemical Engineer |
| FOOD_TECH | Food Technology Engineer |
| BIOTECH | Biotechnology Engineer |
| ENVIRONMENTAL | Environmental Engineer |
| COSMETIC_CHEMISTRY | Cosmetic Chemistry |
| QA_QC_LAB | QA/QC Lab Engineer |
| PROCESS_ENGINEER_CHEM | Chemical Process Engineer |

### Thông tin cần lưu

```ts
{
  majorGroupCode: "CHEM_BIO_FOOD",
  careerTrackCode: "FOOD_TECH",
  nameVi: "Kỹ sư công nghệ thực phẩm",
  typicalJobTitles: [
    "Food Technologist",
    "QA/QC Food Engineer",
    "R&D Food Engineer",
    "Production Engineer"
  ],
  requiredSkills: [
    { name: "Food Chemistry", category: "domain", level: "intermediate", weight: 5 },
    { name: "Food Safety", category: "domain", level: "intermediate", weight: 5 },
    { name: "Quality Control", category: "domain", level: "basic", weight: 4 },
    { name: "Lab Skills", category: "tool", level: "basic", weight: 4 }
  ],
  preferredSkills: [
    { name: "HACCP", category: "certificate", level: "basic", weight: 4 },
    { name: "ISO 22000", category: "certificate", level: "basic", weight: 3 },
    { name: "Data Analysis", category: "tool", level: "basic", weight: 2 }
  ],
  programmingLanguages: ["Python", "R"],
  tools: ["Excel", "SPSS", "Origin", "Lab Equipment"],
  portfolioSuggestions: [
    "Báo cáo kiểm nghiệm chất lượng thực phẩm",
    "Dự án phát triển sản phẩm thực phẩm",
    "Báo cáo HACCP/ISO",
    "Phân tích dữ liệu thí nghiệm"
  ]
}
```

### Nên lọc theo

- Lĩnh vực: thực phẩm, hóa mỹ phẩm, sinh học, môi trường.
- Có kỹ năng lab.
- Có chứng chỉ an toàn/chất lượng: HACCP, ISO, GMP.
- Có định hướng R&D, QA/QC, sản xuất hay môi trường.
- Có sẵn sàng làm nhà máy/phòng thí nghiệm.
- Học bổng nghiên cứu, trao đổi, lab internship.

---

## 4.7. Nhóm Năng lượng - Điện năng - Nhiệt lạnh - Năng lượng tái tạo

### Các hướng nghề nên có

| Code | Hướng nghề |
|---|---|
| POWER_ENGINEER | Power System Engineer |
| RENEWABLE_ENERGY | Renewable Energy Engineer |
| HVAC | HVAC Engineer |
| THERMAL_ENGINEER | Thermal Engineer |
| ENERGY_MANAGEMENT | Energy Management Engineer |
| ELECTRICAL_DESIGN | Electrical Design Engineer |

### Thông tin cần lưu

```ts
{
  majorGroupCode: "ENERGY",
  careerTrackCode: "RENEWABLE_ENERGY",
  nameVi: "Kỹ sư năng lượng tái tạo",
  typicalJobTitles: [
    "Renewable Energy Engineer",
    "Solar Project Engineer",
    "Power System Engineer",
    "Energy Analyst"
  ],
  requiredSkills: [
    { name: "Electrical Power System", category: "engineering", level: "intermediate", weight: 5 },
    { name: "Energy Conversion", category: "engineering", level: "basic", weight: 4 },
    { name: "Electrical Safety", category: "domain", level: "basic", weight: 4 },
    { name: "Technical Drawing", category: "tool", level: "basic", weight: 3 }
  ],
  preferredSkills: [
    { name: "Solar PV Design", category: "domain", level: "basic", weight: 4 },
    { name: "PVSyst", category: "tool", level: "basic", weight: 3 },
    { name: "AutoCAD Electrical", category: "tool", level: "basic", weight: 3 }
  ],
  programmingLanguages: ["Python", "MATLAB"],
  tools: ["PVSyst", "AutoCAD Electrical", "ETAP", "MATLAB", "Excel"],
  portfolioSuggestions: [
    "Thiết kế hệ thống điện mặt trời",
    "Tính toán phụ tải điện",
    "Mô phỏng hệ thống điện bằng ETAP/MATLAB",
    "Báo cáo tiết kiệm năng lượng"
  ]
}
```

### Nên lọc theo

- Hướng điện năng, HVAC, năng lượng tái tạo, nhiệt.
- Công cụ: ETAP, PVSyst, AutoCAD Electrical, MATLAB.
- Có hiểu an toàn điện.
- Có sẵn sàng đi công trình.
- Có quan tâm phát triển bền vững/ESG.
- Loại cơ hội: dự án điện mặt trời, HVAC, nhà máy, tư vấn năng lượng.

---

## 4.8. Nhóm Xây dựng - Hạ tầng - Giao thông - Quản lý công trình

### Các hướng nghề nên có

| Code | Hướng nghề |
|---|---|
| CIVIL_ENGINEER | Civil Engineer |
| STRUCTURAL_ENGINEER | Structural Engineer |
| CONSTRUCTION_MANAGEMENT | Construction Management |
| BIM_ENGINEER | BIM Engineer |
| TRANSPORT_INFRA | Transport Infrastructure Engineer |
| QUANTITY_SURVEYOR | Quantity Surveyor |

### Thông tin cần lưu

```ts
{
  majorGroupCode: "CIVIL_INFRA",
  careerTrackCode: "BIM_ENGINEER",
  nameVi: "Kỹ sư BIM",
  typicalJobTitles: [
    "BIM Engineer",
    "Civil Engineer",
    "Structural Engineer",
    "Construction Engineer"
  ],
  requiredSkills: [
    { name: "Construction Drawing", category: "engineering", level: "intermediate", weight: 5 },
    { name: "Structural Analysis", category: "engineering", level: "basic", weight: 4 },
    { name: "BIM Modeling", category: "tool", level: "basic", weight: 4 },
    { name: "Construction Management", category: "domain", level: "basic", weight: 3 }
  ],
  preferredSkills: [
    { name: "Revit", category: "tool", level: "basic", weight: 4 },
    { name: "AutoCAD", category: "tool", level: "basic", weight: 4 },
    { name: "ETABS/SAP2000", category: "tool", level: "basic", weight: 3 },
    { name: "MS Project", category: "tool", level: "basic", weight: 2 }
  ],
  programmingLanguages: ["Python"],
  tools: ["AutoCAD", "Revit", "ETABS", "SAP2000", "MS Project", "Navisworks"],
  portfolioSuggestions: [
    "Mô hình BIM công trình nhỏ",
    "Bản vẽ kết cấu",
    "Tính toán kết cấu bằng ETABS/SAP2000",
    "Kế hoạch tiến độ thi công"
  ]
}
```

### Nên lọc theo

- Hướng thiết kế, thi công, BIM, quản lý dự án.
- Công cụ: AutoCAD, Revit, ETABS, SAP2000.
- Có sẵn sàng đi công trường.
- Có kỹ năng đọc bản vẽ.
- Có chứng chỉ BIM/AutoCAD nếu có.
- Loại cơ hội: thực tập công trường, thiết kế, tư vấn, quản lý dự án.

---

## 4.9. Nhóm Kinh tế công nghiệp - Logistics - Quản trị - Kế toán kỹ thuật

### Các hướng nghề nên có

| Code | Hướng nghề |
|---|---|
| BUSINESS_ANALYST | Business Analyst |
| PRODUCT_MANAGER | Product / Project Coordinator |
| LOGISTICS | Logistics / Supply Chain |
| INDUSTRIAL_MANAGEMENT | Industrial Management |
| TECH_SALES | Technical Sales |
| ACCOUNTING_TECH | Accounting / Finance in Tech Company |
| DATA_BUSINESS | Business Data Analyst |

### Thông tin cần lưu

```ts
{
  majorGroupCode: "ECON_MANAGEMENT",
  careerTrackCode: "BUSINESS_ANALYST",
  nameVi: "Business Analyst",
  typicalJobTitles: [
    "Business Analyst",
    "Product Owner Assistant",
    "Project Coordinator",
    "ERP Consultant"
  ],
  requiredSkills: [
    { name: "Requirement Analysis", category: "domain", level: "intermediate", weight: 5 },
    { name: "Communication", category: "soft_skill", level: "intermediate", weight: 5 },
    { name: "Business Process Modeling", category: "domain", level: "basic", weight: 4 },
    { name: "Excel", category: "tool", level: "intermediate", weight: 4 }
  ],
  preferredSkills: [
    { name: "SQL", category: "database", level: "basic", weight: 3 },
    { name: "UML/BPMN", category: "tool", level: "basic", weight: 4 },
    { name: "Figma", category: "tool", level: "basic", weight: 2 },
    { name: "Agile/Scrum", category: "domain", level: "basic", weight: 3 }
  ],
  programmingLanguages: ["SQL", "Python"],
  tools: ["Excel", "Power BI", "Figma", "Jira", "Draw.io", "Notion"],
  portfolioSuggestions: [
    "Tài liệu đặc tả yêu cầu phần mềm",
    "Use case diagram / activity diagram",
    "Dashboard Power BI",
    "Phân tích quy trình nghiệp vụ"
  ]
}
```

### Nên lọc theo

- Kỹ năng phân tích nghiệp vụ.
- Kỹ năng Excel/Power BI/SQL.
- Khả năng giao tiếp, viết tài liệu.
- Tiếng Anh/Nhật.
- Có hiểu công nghệ cơ bản hay không.
- Hướng nghề: BA, logistics, project coordinator, ERP, product.

---

## 4.10. Nhóm Ngoại ngữ khoa học công nghệ

### Các hướng nghề nên có

| Code | Hướng nghề |
|---|---|
| TECH_TRANSLATOR | Technical Translator |
| JP_BRSE_ASSISTANT | Japanese BrSE Assistant |
| TECH_INTERPRETER | Technical Interpreter |
| GLOBAL_SUPPORT | Global Customer / Technical Support |
| LOCALIZATION | Software Localization |
| LANGUAGE_PROJECT_COORDINATOR | Language Project Coordinator |

### Thông tin cần lưu

```ts
{
  majorGroupCode: "LANGUAGE_TECH",
  careerTrackCode: "JP_BRSE_ASSISTANT",
  nameVi: "Trợ lý BrSE tiếng Nhật",
  typicalJobTitles: [
    "Japanese IT Communicator",
    "BrSE Assistant",
    "Technical Translator",
    "Project Coordinator"
  ],
  requiredSkills: [
    { name: "Japanese", category: "language", level: "intermediate", weight: 5 },
    { name: "Technical Vocabulary", category: "language", level: "basic", weight: 4 },
    { name: "Communication", category: "soft_skill", level: "intermediate", weight: 5 },
    { name: "Document Writing", category: "soft_skill", level: "basic", weight: 4 }
  ],
  preferredSkills: [
    { name: "Software Development Basics", category: "domain", level: "basic", weight: 3 },
    { name: "Agile/Scrum", category: "domain", level: "basic", weight: 2 },
    { name: "Figma/Jira", category: "tool", level: "basic", weight: 2 }
  ],
  programmingLanguages: ["HTML", "CSS", "JavaScript"],
  tools: ["Jira", "Confluence", "Excel", "Google Docs", "Figma"],
  portfolioSuggestions: [
    "Bản dịch tài liệu kỹ thuật",
    "Tài liệu yêu cầu song ngữ Nhật - Việt",
    "Glossary thuật ngữ IT",
    "Case study giao tiếp dự án Nhật"
  ]
}
```

### Nên lọc theo

- Ngôn ngữ chính: Nhật, Anh, Hàn.
- Trình độ chứng chỉ: JLPT, TOEIC, IELTS, TOPIK.
- Có kiến thức IT/công nghệ cơ bản.
- Có kinh nghiệm dịch tài liệu kỹ thuật.
- Có khả năng giao tiếp trong dự án.
- Hướng nghề: IT communicator, technical translator, coordinator.

---

## 4.11. Nhóm Liên ngành: Tâm lý công nghiệp - Giáo dục STEM - Công nghệ giáo dục

### Các hướng nghề nên có

| Code | Hướng nghề |
|---|---|
| EDTECH | EdTech Product / Content |
| STEM_EDUCATOR | STEM Educator |
| INDUSTRIAL_PSYCHOLOGY | Industrial & Organizational Psychology |
| LEARNING_DESIGN | Learning Experience Designer |
| HR_ANALYTICS | HR Analytics |
| TRAINING_SPECIALIST | Training Specialist |

### Thông tin cần lưu

```ts
{
  majorGroupCode: "INTERDISCIPLINARY",
  careerTrackCode: "EDTECH",
  nameVi: "Sản phẩm công nghệ giáo dục",
  typicalJobTitles: [
    "EdTech Product Assistant",
    "Learning Designer",
    "STEM Content Developer",
    "Training Specialist"
  ],
  requiredSkills: [
    { name: "Learning Design", category: "domain", level: "basic", weight: 5 },
    { name: "Communication", category: "soft_skill", level: "intermediate", weight: 5 },
    { name: "Content Writing", category: "soft_skill", level: "intermediate", weight: 4 },
    { name: "User Research", category: "domain", level: "basic", weight: 4 }
  ],
  preferredSkills: [
    { name: "Figma", category: "tool", level: "basic", weight: 3 },
    { name: "Data Analysis", category: "tool", level: "basic", weight: 3 },
    { name: "Basic Programming", category: "programming", level: "basic", weight: 2 }
  ],
  programmingLanguages: ["Python", "JavaScript"],
  tools: ["Figma", "Notion", "Google Forms", "Excel", "Power BI"],
  portfolioSuggestions: [
    "Thiết kế khóa học mini",
    "Prototype ứng dụng học tập",
    "Báo cáo khảo sát người học",
    "Bộ nội dung STEM/AI cho sinh viên"
  ]
}
```

### Nên lọc theo

- Có quan tâm giáo dục, đào tạo, tâm lý học tổ chức.
- Có kỹ năng viết nội dung.
- Có kỹ năng nghiên cứu người dùng.
- Có biết phân tích dữ liệu cơ bản.
- Có kỹ năng thiết kế học liệu / UX.
- Hướng nghề: EdTech, HR, training, learning design.

---

# 5. Bộ thông tin lọc chung cho tất cả ngành

## 5.1. Lọc theo thông tin sinh viên

```ts
type StudentFilterInput = {
  majorGroupCode?: string;
  majorName?: string;
  studentYear?: number;
  gpaMin?: number;
  languageCodes?: string[];
  languageLevelMin?: string;
  skillNames?: string[];
  certificateNames?: string[];
  careerTrackCodes?: string[];
  preferredLocation?: string;
  preferredWorkMode?: "onsite" | "hybrid" | "remote";
  opportunityType?: "internship" | "job" | "scholarship" | "contest" | "research";
  experienceLevel?: "none" | "project" | "internship" | "part_time" | "full_time";
};
```

## 5.2. Lọc theo cơ hội việc làm / học bổng

```ts
type OpportunityFilterInput = {
  opportunityType?: "internship" | "job" | "scholarship" | "contest" | "research";
  majorGroupCodes?: string[];
  careerTrackCodes?: string[];

  requiredSkills?: string[];
  preferredSkills?: string[];
  requiredLanguages?: string[];
  minLanguageLevel?: string;

  minGpa?: number;
  eligibleStudentYears?: number[];

  location?: string;
  workMode?: "onsite" | "hybrid" | "remote";
  companyType?: "startup" | "corporate" | "factory" | "research_lab" | "university" | "ngo";

  deadlineFrom?: Date;
  deadlineTo?: Date;
};
```

---

# 6. Gợi ý scoring để AI xếp hạng phù hợp

Nên tính điểm phù hợp theo nhiều tiêu chí, không chỉ theo ngành.

```ts
type MatchScoreBreakdown = {
  majorMatchScore: number;       // 0-20
  skillMatchScore: number;       // 0-30
  languageMatchScore: number;    // 0-15
  projectMatchScore: number;     // 0-15
  yearGpaMatchScore: number;     // 0-10
  preferenceMatchScore: number;  // 0-10
  totalScore: number;            // 0-100
};
```

Công thức gợi ý:

```text
totalScore =
  majorMatchScore
+ skillMatchScore
+ languageMatchScore
+ projectMatchScore
+ yearGpaMatchScore
+ preferenceMatchScore
```

Gợi ý trọng số:

| Thành phần | Điểm tối đa | Lý do |
|---|---:|---|
| Ngành học phù hợp | 20 | Loại bỏ cơ hội quá lệch ngành |
| Kỹ năng phù hợp | 30 | Quan trọng nhất với việc làm/thực tập |
| Ngoại ngữ | 15 | Quan trọng với học bổng và công ty nước ngoài |
| Dự án/portfolio | 15 | Chứng minh năng lực thực tế |
| Năm học/GPA | 10 | Phù hợp điều kiện tuyển |
| Sở thích địa điểm/hình thức | 10 | Tăng khả năng ứng tuyển thật |

---

# 7. Seed data mẫu

```ts
const majorGroups = [
  {
    code: "IT",
    nameVi: "Công nghệ thông tin / AI / Data",
    nameEn: "Information Technology, AI and Data",
    keywords: ["software", "web", "mobile", "AI", "data", "security", "cloud"]
  },
  {
    code: "EE_ET",
    nameVi: "Điện - Điện tử - Viễn thông - Vi mạch",
    nameEn: "Electrical, Electronics, Telecommunications and Semiconductor",
    keywords: ["embedded", "electronics", "telecom", "chip", "semiconductor", "hardware"]
  },
  {
    code: "AUTO_ROBOT",
    nameVi: "Điều khiển - Tự động hóa - Robotics",
    nameEn: "Automation, Control and Robotics",
    keywords: ["automation", "PLC", "SCADA", "robotics", "control", "IoT"]
  },
  {
    code: "MECH_AUTO",
    nameVi: "Cơ khí - Cơ điện tử - Ô tô",
    nameEn: "Mechanical, Mechatronics and Automotive Engineering",
    keywords: ["mechanical", "mechatronics", "automotive", "CAD", "manufacturing"]
  },
  {
    code: "MATERIAL",
    nameVi: "Vật liệu - Luyện kim - Công nghệ nano",
    nameEn: "Materials, Metallurgy and Nanotechnology",
    keywords: ["materials", "metallurgy", "nano", "semiconductor material", "composite"]
  },
  {
    code: "CHEM_BIO_FOOD",
    nameVi: "Hóa học - Sinh học - Thực phẩm - Môi trường",
    nameEn: "Chemical, Biological, Food and Environmental Engineering",
    keywords: ["chemistry", "biotech", "food", "environment", "lab", "QA", "QC"]
  },
  {
    code: "ENERGY",
    nameVi: "Năng lượng - Điện năng - Nhiệt lạnh",
    nameEn: "Energy, Power and Thermal Engineering",
    keywords: ["energy", "power", "renewable", "HVAC", "solar", "thermal"]
  },
  {
    code: "CIVIL_INFRA",
    nameVi: "Xây dựng - Hạ tầng - Giao thông",
    nameEn: "Civil, Infrastructure and Transport Engineering",
    keywords: ["civil", "construction", "BIM", "infrastructure", "transport"]
  },
  {
    code: "ECON_MANAGEMENT",
    nameVi: "Kinh tế công nghiệp - Logistics - Quản trị",
    nameEn: "Industrial Economics, Logistics and Management",
    keywords: ["business", "logistics", "supply chain", "management", "BA", "ERP"]
  },
  {
    code: "LANGUAGE_TECH",
    nameVi: "Ngoại ngữ khoa học công nghệ",
    nameEn: "Languages for Science and Technology",
    keywords: ["Japanese", "English", "Korean", "translation", "technical communication"]
  },
  {
    code: "INTERDISCIPLINARY",
    nameVi: "Liên ngành - Giáo dục - Tâm lý công nghiệp",
    nameEn: "Interdisciplinary, Education and Industrial Psychology",
    keywords: ["edtech", "STEM", "training", "psychology", "learning design"]
  }
];
```

---

# 8. Gợi ý câu lệnh cho AI code agent

Dùng đoạn sau để yêu cầu AI sinh code:

```text
Hãy tạo database seed và entity cho hệ thống gợi ý việc làm/học bổng theo các nhóm ngành HUST.

Yêu cầu:
1. Tạo bảng major_groups.
2. Tạo bảng career_tracks.
3. Mỗi career_track thuộc một major_group.
4. Mỗi career_track có:
   - code
   - nameVi
   - nameEn
   - description
   - typicalJobTitles
   - requiredSkills
   - preferredSkills
   - domainKnowledge
   - tools
   - programmingLanguages
   - commonCertificates
   - portfolioSuggestions
   - scholarshipKeywords
   - internshipKeywords
   - jobSearchKeywords
   - filterConfig
5. Tạo seed data cho ít nhất các nhóm:
   - IT
   - EE_ET
   - AUTO_ROBOT
   - MECH_AUTO
   - MATERIAL
   - CHEM_BIO_FOOD
   - ENERGY
   - CIVIL_INFRA
   - ECON_MANAGEMENT
   - LANGUAGE_TECH
   - INTERDISCIPLINARY
6. Viết theo NestJS + TypeORM.
7. Nếu dùng PostgreSQL, các field dạng danh sách/object nên dùng JSONB.
8. Viết migration, entity, seed service và repository.
9. Không hard-code logic gợi ý trong controller.
10. Logic tính điểm phù hợp đặt trong domain/service riêng.
```

---

# 9. Kết luận thiết kế

Nên lưu dữ liệu theo hướng “career track” thay vì chỉ lưu “ngành học”.

Cách này giúp hệ thống:
- Gợi ý việc làm sát hơn.
- Gợi ý học bổng đúng hướng hơn.
- Phù hợp với sinh viên học một ngành nhưng muốn đi theo hướng khác.
- Dễ mở rộng khi HUST thêm ngành/chương trình mới.
- Dễ cho AI phân tích hồ sơ năng lực và match với cơ hội.
