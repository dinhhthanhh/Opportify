"""
recommend.py — Rule-based matching engine cho Opportify.

Logic tính match_score (0-100):
  Jobs:
    - Skills overlap: 50 điểm tối đa
    - Experience level match: 20 điểm
    - Location match: 15 điểm
    - Job type match: 15 điểm
  Scholarships:
    - Education level match: 25 điểm
    - Field of interest match: 35 điểm
    - Education field match: 20 điểm
    - Country preference: 20 điểm

Mỗi kết quả trả về kèm match_reasons — giải thích lý do đề xuất.
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
import uuid
from datetime import datetime

from db.database import get_db
from models.user import User
from models.job import Job
from models.scholarship import Scholarship

router = APIRouter()

# ── Helpers ────────────────────────────────────────────────────────────────────

LEVEL_ORDER = {"fresher": 0, "junior": 1, "mid": 2, "senior": 3}
LEVEL_LABELS = {"fresher": "Fresher", "junior": "Junior", "mid": "Mid-level", "senior": "Senior"}
EDU_ORDER = {"bachelor": 0, "master": 1, "phd": 2, "postdoc": 3}
EDU_LABELS = {"bachelor": "Cử nhân", "master": "Thạc sĩ", "phd": "Tiến sĩ", "postdoc": "Sau tiến sĩ"}


def _normalize(lst: list | None) -> list[str]:
    if not lst:
        return []
    return [s.lower().strip() for s in lst if s and s.strip()]


def _skills_overlap_score(user_skills: list[str], item_skills: list[str]) -> tuple[float, list[str]]:
    """Tỉ lệ overlap kỹ năng, tính theo Jaccard-like: intersection / required.
    Returns (score, matched_skills)."""
    u = set(_normalize(user_skills))
    i = set(_normalize(item_skills))
    if not i:
        return 25.0, []  # nếu job không yêu cầu skill → trung bình
    intersection = u & i
    if not u:
        return 0.0, []
    matched = sorted(intersection)
    return min(len(intersection) / len(i), 1.0) * 50, matched


def _level_score(user_level: str | None, item_experience: str | None) -> tuple[float, str | None]:
    """Score 20 điểm nếu level người dùng nằm trong range phù hợp.
    Returns (score, reason)."""
    if not user_level or not item_experience:
        return 10.0, None
    u = LEVEL_ORDER.get(user_level.lower(), -1)
    i = LEVEL_ORDER.get(item_experience.lower(), -1)
    if u == -1 or i == -1:
        return 10.0, None
    diff = abs(u - i)
    score = max(0, 20 - diff * 7)
    if diff == 0:
        reason = f"Cấp bậc {LEVEL_LABELS.get(user_level.lower(), user_level)} phù hợp hoàn toàn"
    elif diff == 1:
        reason = f"Cấp bậc gần phù hợp ({LEVEL_LABELS.get(user_level.lower(), user_level)})"
    else:
        reason = None
    return score, reason


def _location_score(preferred: list[str] | None, item_location: str | None) -> tuple[float, str | None]:
    """Score 15 điểm nếu địa điểm nằm trong danh sách ưu tiên. Phạt nếu lệch địa lý."""
    if not preferred:
        return 15.0, None # Không yêu cầu cụ thể
    if not item_location:
        return 7.0, None
        
    pl = _normalize(preferred)
    iloc = item_location.lower().strip()
    
    if "remote" in pl or "anywhere" in pl or "toàn quốc" in iloc:
        return 15.0, f"Phù hợp địa điểm: {item_location}"
        
    for loc in pl:
        if loc in iloc or iloc in loc:
            return 15.0, f"Phù hợp địa điểm: {item_location}"
            
    # Không khớp địa điểm -> Phạt
    return -15.0, f"Địa điểm ({item_location}) không khớp mong muốn"

def _industry_match_score(user_interests: list[str] | None, job_industry: str | None) -> tuple[float, str | None]:
    """Matches user interest fields with job industry. Max 15 points. Penalty if mismatched."""
    if not user_interests or not job_industry:
        return 7.5, None
    pl = _normalize(user_interests)
    ji = job_industry.lower().strip()
    
    for interest in pl:
        if interest in ji or ji in interest:
            return 15.0, f"Ngành nghề phù hợp: {job_industry}"
            
    # Check word overlap
    ji_words = set(ji.split())
    for interest in pl:
        interest_words = set(interest.split())
        common = ji_words & interest_words - {"và", "and", "of", "the", "các", "ngành", "nghề"}
        if common:
            return 10.0, f"Ngành liên quan: {job_industry}"
            
    return -15.0, f"Khác ngành quan tâm (Công việc thuộc: {job_industry})"



def _jobtype_score(preferred_types: list[str] | None, item_type: str | None) -> tuple[float, str | None]:
    """Score 10 điểm nếu job type khớp. Phạt nặng nếu không khớp với nguyện vọng của user."""
    if not preferred_types:
        return 10.0, None # Không yêu cầu cụ thể
    if not item_type:
        return 5.0, None
        
    pt = _normalize(preferred_types)
    it = item_type.lower().strip()
    
    if it in pt:
        return 10.0, f"Loại hình phù hợp: {item_type}"
    else:
        req_types_str = ", ".join(preferred_types)
        return -20.0, f"Khác loại hình mong muốn (Yêu cầu: {req_types_str}, Công việc là: {item_type})"



def _edu_scholarship_score(user_edu: str | None, scholarship_level: str | None, target_degree: str | None = None) -> tuple[float, str | None]:
    """Checks scholarship level against user's target degree or current education. Max 20 points."""
    if not scholarship_level:
        return 10.0, None
    s_lvl = scholarship_level.lower().strip()
    
    # 1. So khớp với target_degree trước
    if target_degree:
        td = target_degree.lower().strip()
        if td == s_lvl:
            return 20.0, f"Bậc học {EDU_LABELS.get(s_lvl, s_lvl)} khớp nguyện vọng du học"
            
    # 2. So khớp tiến trình học vấn bình thường
    if user_edu:
        u = EDU_ORDER.get(user_edu.lower(), -1)
        s = EDU_ORDER.get(s_lvl, -1)
        if u != -1 and s != -1:
            diff = s - u
            if diff == 0:
                return 20.0, f"Trình độ {EDU_LABELS.get(user_edu.lower(), user_edu)} phù hợp hoàn toàn"
            if diff == 1:
                return 20.0, f"Học bổng bậc {EDU_LABELS.get(s_lvl, s_lvl)} — bước tiến tiếp theo phù hợp"
            if diff == -1:
                return 8.0, None
    return 0.0, None


def _field_interest_score(user_interests: list[str] | None, scholarship_field: str | None) -> tuple[float, str | None]:
    """Match lĩnh vực quan tâm với field của học bổng.
    Returns (score, reason)."""
    if not user_interests or not scholarship_field:
        return 15.0, None
    s_field_lower = scholarship_field.lower()
    matched_interests = []
    for interest in _normalize(user_interests):
        if interest in s_field_lower or s_field_lower in interest:
            matched_interests.append(interest)
    if matched_interests:
        return 35.0, f"Phù hợp lĩnh vực quan tâm: {', '.join(matched_interests)}"
    return 5.0, None


def _edu_field_score(user_edu_field: str | None, scholarship_field: str | None) -> tuple[float, str | None]:
    """Match ngành học hiện tại với field của học bổng.
    Returns (score, reason)."""
    if not user_edu_field or not scholarship_field:
        return 10.0, None
    uf = user_edu_field.lower().strip()
    sf = scholarship_field.lower().strip()
    if uf in sf or sf in uf:
        return 20.0, f"Ngành học ({user_edu_field}) phù hợp với lĩnh vực học bổng"
    # Kiểm tra từ khóa chung
    uf_words = set(uf.split())
    sf_words = set(sf.split())
    common = uf_words & sf_words - {"và", "and", "of", "the", "các", "khoa", "học"}
    if common:
        return 12.0, f"Ngành học liên quan ({', '.join(common)})"
    return 0.0, None


def _country_score_updated(preferred_locations: list[str] | None, target_country: str | None, scholarship_country: str | None) -> tuple[float, str | None]:
    """Matches scholarship country with user's preferred locations and specific target country. Max 20 points."""
    if not scholarship_country:
        return 10.0, None
    sc = scholarship_country.lower().strip()
    
    # 1. Khớp quốc gia du học mong muốn
    if target_country:
        tc = target_country.lower().strip()
        if tc in sc or sc in tc:
            return 20.0, f"Quốc gia mong muốn ({scholarship_country}) phù hợp mục tiêu"
            
    # 2. Khớp danh sách preferred_locations
    if preferred_locations:
        pl = _normalize(preferred_locations)
        for loc in pl:
            if loc in sc or sc in loc:
                return 18.0, f"Quốc gia phù hợp địa điểm ưu tiên: {scholarship_country}"
        if "remote" in pl or "anywhere" in pl or "quốc tế" in pl or "toàn cầu" in pl:
            return 15.0, "Học bổng quốc tế/toàn cầu"
            
    return 5.0, None


def _certificates_score(user_certs_str: str | None, item_desc: str | None, item_req: str | None) -> tuple[float, list[str]]:
    """Tỉ lệ khớp chứng chỉ. Trả về (score, matched_certs)."""
    if not user_certs_str or (not item_desc and not item_req):
        return 0.0, []
    text = f"{item_desc or ''} {item_req or ''}".lower()
    certs = [c.strip() for c in user_certs_str.split(",") if c.strip()]
    matched = []
    for cert in certs:
        c_lower = cert.lower()
        if len(c_lower) <= 3:
            import re
            if re.search(r'\b' + re.escape(c_lower) + r'\b', text):
                matched.append(cert)
        else:
            if c_lower in text:
                matched.append(cert)
    if not matched:
        return 0.0, []
    # 5 điểm mỗi chứng chỉ khớp, tối đa 10 điểm
    score = min(len(matched) * 5.0, 10.0)
    return score, matched


def _gpa_score(user_gpa: float | None, min_gpa: float | None) -> tuple[float, str | None]:
    """GPA matching: max 10 points. Heavy penalty if below min_gpa."""
    if not user_gpa:
        return 7.0, None
    if not min_gpa:
        return 10.0, f"GPA của bạn là {user_gpa:.2f} (Học bổng không yêu cầu GPA tối thiểu)"
    if user_gpa >= min_gpa:
        diff = user_gpa - min_gpa
        bonus = min(diff * 4.0, 3.0)  # Thêm điểm thưởng nếu GPA cao hơn yêu cầu
        return 7.0 + bonus, f"GPA đạt yêu cầu: {user_gpa:.2f} (Yêu cầu: {min_gpa:.2f})"
    else:
        return -20.0, f"GPA chưa đạt yêu cầu: {user_gpa:.2f} (Yêu cầu tối thiểu: {min_gpa:.2f})"


def _language_score(user_langs_str: str | None, lang_req: str | None) -> tuple[float, str | None]:
    """Matches user language certs against scholarship language requirement. Max 10 points."""
    if not lang_req:
        return 10.0, None
    if not user_langs_str:
        return 0.0, f"Học bổng yêu cầu chứng chỉ ngoại ngữ: {lang_req}"
        
    req_lower = lang_req.lower().strip()
    user_langs = {}
    for item in user_langs_str.split(","):
        if ":" in item:
            k, v = item.split(":", 1)
            user_langs[k.strip().lower()] = v.strip().lower()
            
    # Tìm chứng chỉ tương ứng
    matched_test = None
    for test in ["ielts", "toefl", "toeic", "jlpt", "topik", "hsk"]:
        if test in req_lower:
            matched_test = test
            break
            
    if not matched_test:
        for k, v in user_langs.items():
            if k in req_lower:
                return 10.0, f"Chứng chỉ ngoại ngữ phù hợp: {lang_req}"
        return 0.0, f"Học bổng yêu cầu chứng chỉ ngoại ngữ: {lang_req}"
        
    user_score_str = user_langs.get(matched_test)
    if not user_score_str:
        return -15.0, f"Thiếu chứng chỉ yêu cầu: {matched_test.upper()} (Yêu cầu: {lang_req})"
        
    try:
        import re
        req_score_match = re.search(r'[\d.]+', req_lower)
        if matched_test in ["ielts", "toefl", "toeic"]:
            req_val = float(req_score_match.group()) if req_score_match else 0.0
            user_val = float(re.search(r'[\d.]+', user_score_str).group()) if re.search(r'[\d.]+', user_score_str) else 0.0
            if user_val >= req_val:
                return 10.0, f"Ngoại ngữ đạt yêu cầu: {matched_test.upper()} {user_score_str} (Yêu cầu: {lang_req})"
            else:
                return -15.0, f"Điểm ngoại ngữ chưa đạt: {matched_test.upper()} {user_score_str} (Yêu cầu: {lang_req})"
                
        elif matched_test == "jlpt":
            req_lvl_match = re.search(r'n([1-5])', req_lower)
            user_lvl_match = re.search(r'n([1-5])', user_score_str)
            if req_lvl_match and user_lvl_match:
                req_lvl = int(req_lvl_match.group(1))
                user_lvl = int(user_lvl_match.group(1))
                if user_lvl <= req_lvl:
                    return 10.0, f"Ngoại ngữ đạt yêu cầu: JLPT {user_score_str.upper()} (Yêu cầu: {lang_req})"
                else:
                    return -15.0, f"Trình độ JLPT chưa đạt: {user_score_str.upper()} (Yêu cầu: {lang_req})"
                    
        elif matched_test == "topik":
            req_lvl_match = re.search(r'([1-6])', req_lower)
            user_lvl_match = re.search(r'([1-6])', user_score_str)
            if req_lvl_match and user_lvl_match:
                req_lvl = int(req_lvl_match.group(1))
                user_lvl = int(user_lvl_match.group(1))
                if user_lvl >= req_lvl:
                    return 10.0, f"Ngoại ngữ đạt yêu cầu: TOPIK {user_score_str} (Yêu cầu: {lang_req})"
                else:
                    return -15.0, f"Trình độ TOPIK chưa đạt: {user_score_str} (Yêu cầu: {lang_req})"
    except Exception:
        pass
        
    if user_score_str in req_lower or req_lower in user_score_str:
        return 10.0, f"Ngoại ngữ đạt yêu cầu: {matched_test.upper()} {user_score_str}"
    return 5.0, f"Có chứng chỉ ngoại ngữ: {matched_test.upper()} {user_score_str}"


def _research_papers_score(user_papers_str: str | None, s_title: str | None, s_desc: str | None, s_req: str | None, s_level: str | None) -> tuple[float, str | None]:
    """Calculates research paper matching bonus (up to 10 points)."""
    if not user_papers_str:
        return 0.0, None
    text = f"{s_title or ''} {s_desc or ''} {s_req or ''}".lower()
    is_research = (
        s_level in ["phd", "postdoc"] or 
        any(w in text for w in ["research", "thesis", "publication", "paper", "journal", "nghiên cứu", "đề tài", "bài báo", "luận văn"])
    )
    if is_research:
        papers = [p.strip() for p in user_papers_str.split(",") if p.strip()]
        if papers:
            score = min(len(papers) * 5.0, 10.0)
            return score, f"Hồ sơ có {len(papers)} bài báo/đề tài nghiên cứu phù hợp định hướng học thuật"
    return 0.0, None


def _build_match_reasons(
    matched_skills: list[str],
    level_reason: str | None,
    location_reason: str | None,
    jobtype_reason: str | None,
    matched_certs: list[str] = None,
    ind_reason: str | None = None,
) -> list[str]:
    """Xây dựng danh sách lý do match cho job."""
    reasons = []
    if matched_skills:
        if len(matched_skills) <= 3:
            reasons.append(f"Kỹ năng phù hợp: {', '.join(matched_skills)}")
        else:
            reasons.append(f"Kỹ năng phù hợp: {', '.join(matched_skills[:3])} +{len(matched_skills)-3}")
    if level_reason:
        reasons.append(level_reason)
    if location_reason:
        reasons.append(location_reason)
    if jobtype_reason:
        reasons.append(jobtype_reason)
    if ind_reason:
        reasons.append(ind_reason)
    if matched_certs:
        reasons.append(f"Chứng chỉ phù hợp: {', '.join(matched_certs)}")
    return reasons


def _job_to_dict(job: Job, score: float, match_reasons: list[str]) -> dict:
    return {
        "id": str(job.id),
        "title": job.title,
        "company": job.company,
        "location": job.location,
        "salary_min": job.salary_min,
        "salary_max": job.salary_max,
        "salary_currency": job.salary_currency,
        "description": job.description,
        "skills": job.skills or [],
        "job_type": job.job_type,
        "experience": job.experience,
        "url": job.url,
        "source": job.source,
        "match_score": round(score, 1),
        "match_reasons": match_reasons,
    }


def _scholarship_to_dict(s: Scholarship, score: float, match_reasons: list[str]) -> dict:
    return {
        "id": str(s.id),
        "title": s.title,
        "organization": s.organization,
        "country": s.country,
        "level": s.level,
        "field": s.field,
        "coverage": s.coverage,
        "amount": s.amount,
        "deadline": s.deadline.isoformat() if s.deadline else None,
        "description": s.description,
        "url": s.url,
        "source": s.source,
        "match_score": round(score, 1),
        "match_reasons": match_reasons,
    }


async def _get_user(user_id: str, db: AsyncSession) -> User:
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="user_id không hợp lệ")
    result = await db.execute(select(User).where(User.id == uid))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User không tồn tại")
    return user


# ── Endpoints ──────────────────────────────────────────────────────────────────

def calculate_job_match(user: User, job: Job, certificates: Optional[str] = None) -> tuple[float, list[str]]:
    # 1. Skills overlap (max 35)
    raw_skills_score, matched_skills = _skills_overlap_score(user.skills, job.skills or [])
    skills_score = (raw_skills_score / 50.0) * 35.0
    
    # 2. Level match (max 15)
    raw_lvl_score, lvl_reason = _level_score(user.experience_level, job.experience)
    lvl_score = (raw_lvl_score / 20.0) * 15.0
    
    # 3. Location match (max 15, can go negative)
    raw_loc_score, loc_reason = _location_score(user.preferred_locations, job.location)
    loc_score = (raw_loc_score / 15.0) * 15.0 if raw_loc_score >= 0 else raw_loc_score
    
    # 4. Job Type match (max 10, can go negative)
    raw_jt_score, jt_reason = _jobtype_score(user.preferred_job_types, job.job_type)
    jt_score = (raw_jt_score / 10.0) * 10.0 if raw_jt_score >= 0 else raw_jt_score
    
    # 5. Industry match (max 15, can go negative)
    raw_ind_score, ind_reason = _industry_match_score(user.interest_fields, job.industry)
    ind_score = raw_ind_score
    
    # 6. Certificates match (max 10)
    cert_score, matched_certs = _certificates_score(certificates, job.description, job.requirements)

    score = skills_score + lvl_score + loc_score + jt_score + ind_score + cert_score
    # Enforce range [0.0, 100.0]
    score = max(0.0, min(score, 100.0))
    
    reasons = _build_match_reasons(matched_skills, lvl_reason, loc_reason, jt_reason, matched_certs, ind_reason)
    return score, reasons

@router.get("/jobs")
async def recommend_jobs(
    user_id: str = Query(..., description="UUID của user muốn lấy gợi ý"),
    limit: int = Query(20, le=200),
    sort_by: str = Query("match_score", description="Sắp xếp theo: match_score, salary, posted_at"),
    order: str = Query("desc", description="Thứ tự: asc, desc"),
    certificates: Optional[str] = Query(None, description="Chứng chỉ chuyên môn từ local storage"),
    db: AsyncSession = Depends(get_db),
):
    """Gợi ý việc làm cá nhân hóa dựa trên hồ sơ năng lực."""
    user = await _get_user(user_id, db)

    result = await db.execute(select(Job).where(Job.is_active == True))
    jobs = result.scalars().all()

    scored = []
    for job in jobs:
        score, reasons = calculate_job_match(user, job, certificates)
        scored.append((score, job, reasons))

    # Sắp xếp
    if sort_by == "salary":
        scored.sort(key=lambda x: (x[1].salary_max or 0), reverse=(order == "desc"))
    elif sort_by == "posted_at":
        scored.sort(key=lambda x: (x[1].posted_at or datetime.min), reverse=(order == "desc"))
    else:  # default match_score
        scored.sort(key=lambda x: x[0], reverse=(order == "desc"))

    top = scored[:limit]

    return {
        "user_id": str(user.id),
        "username": user.username,
        "full_name": user.full_name,
        "total_candidates": len(jobs),
        "results": [_job_to_dict(job, score, reasons) for score, job, reasons in top],
    }


def calculate_scholarship_match(
    user: User, 
    s: Scholarship, 
    target_degree: Optional[str] = None, 
    target_country: Optional[str] = None,
    certificates: Optional[str] = None,
    research_papers: Optional[str] = None,
    language_scores: Optional[str] = None
) -> tuple[float, list[str]]:
    edu_score, edu_reason = _edu_scholarship_score(user.education_level, s.level, target_degree)
    raw_field_score, field_reason = _field_interest_score(user.interest_fields, s.field)
    field_score = (raw_field_score / 35.0) * 25.0
    raw_edufield_score, edufield_reason = _edu_field_score(user.education_field, s.field)
    edufield_score = (raw_edufield_score / 20.0) * 15.0
    ctry_score, ctry_reason = _country_score_updated(user.preferred_locations, target_country, s.country)
    raw_gpa_score, gpa_reason = _gpa_score(user.gpa, s.min_gpa)
    gpa_score = (raw_gpa_score / 10.0) * 10.0 if raw_gpa_score >= 0 else raw_gpa_score
    raw_lang_score, lang_reason = _language_score(language_scores, s.language_requirement)
    lang_score = (raw_lang_score / 10.0) * 10.0 if raw_lang_score >= 0 else raw_lang_score
    research_score, research_reason = _research_papers_score(research_papers, s.title, s.description, s.requirements, s.level)

    score = edu_score + field_score + edufield_score + ctry_score + gpa_score + lang_score + research_score
    score = max(0.0, min(score, 100.0))

    reasons = []
    if edu_reason: reasons.append(edu_reason)
    if field_reason: reasons.append(field_reason)
    if edufield_reason: reasons.append(edufield_reason)
    if ctry_reason: reasons.append(ctry_reason)
    if gpa_reason: reasons.append(gpa_reason)
    if lang_reason: reasons.append(lang_reason)
    if research_reason: reasons.append(research_reason)

    return score, reasons

@router.get("/scholarships")
async def recommend_scholarships(
    user_id: str = Query(..., description="UUID của user muốn lấy gợi ý"),
    limit: int = Query(20, le=200),
    sort_by: str = Query("match_score", description="Sắp xếp theo: match_score, deadline, posted_at"),
    order: str = Query("desc", description="Thứ tự: asc, desc"),
    certificates: Optional[str] = Query(None, description="Chứng chỉ chuyên môn"),
    research_papers: Optional[str] = Query(None, description="Bài báo và công trình nghiên cứu"),
    target_country: Optional[str] = Query(None, description="Quốc gia du học mong muốn"),
    target_degree: Optional[str] = Query(None, description="Bậc học muốn xin học bổng"),
    language_scores: Optional[str] = Query(None, description="Chứng chỉ ngoại ngữ của user"),
    db: AsyncSession = Depends(get_db),
):
    """Gợi ý học bổng cá nhân hóa dựa trên hồ sơ."""
    user = await _get_user(user_id, db)

    result = await db.execute(select(Scholarship))
    scholarships = result.scalars().all()

    scored = []
    for s in scholarships:
        score, reasons = calculate_scholarship_match(
            user, s, target_degree, target_country, certificates, research_papers, language_scores
        )
        scored.append((score, s, reasons))

    # Sắp xếp
    if sort_by == "deadline":
        scored.sort(key=lambda x: (x[1].deadline or datetime.max), reverse=(order == "desc"))
    elif sort_by == "posted_at":
        scored.sort(key=lambda x: (x[1].created_at or datetime.min), reverse=(order == "desc"))
    else:  # default match_score
        scored.sort(key=lambda x: x[0], reverse=(order == "desc"))

    top = scored[:limit]

    return {
        "user_id": str(user.id),
        "username": user.username,
        "full_name": user.full_name,
        "total_candidates": len(scholarships),
        "results": [_scholarship_to_dict(s, score, reasons) for score, s, reasons in top],
    }
