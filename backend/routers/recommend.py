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
import math

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
    """Score 15 điểm nếu địa điểm nằm trong danh sách ưu tiên.
    Returns (score, reason)."""
    if not preferred or not item_location:
        return 7.0, None
    pl = _normalize(preferred)
    iloc = item_location.lower()
    if "remote" in pl or "anywhere" in pl or "toàn quốc" in iloc:
        return 15.0, f"Phù hợp địa điểm: {item_location}"
    for loc in pl:
        if loc in iloc or iloc in loc:
            return 15.0, f"Phù hợp địa điểm: {item_location}"
    return 0.0, None


def _jobtype_score(preferred_types: list[str] | None, item_type: str | None) -> tuple[float, str | None]:
    """Score 15 điểm nếu job type khớp.
    Returns (score, reason)."""
    if not preferred_types or not item_type:
        return 7.0, None
    pt = _normalize(preferred_types)
    it = item_type.lower()
    if it in pt:
        return 15.0, f"Loại hình phù hợp: {item_type}"
    return 0.0, None


def _edu_scholarship_score(user_edu: str | None, scholarship_level: str | None) -> tuple[float, str | None]:
    """Cho học bổng: user cần có trình độ tương ứng hoặc thấp hơn 1 bậc.
    Returns (score, reason)."""
    if not user_edu or not scholarship_level:
        return 12.0, None
    u = EDU_ORDER.get(user_edu.lower(), -1)
    s = EDU_ORDER.get(scholarship_level.lower(), -1)
    if u == -1 or s == -1:
        return 12.0, None
    diff = s - u
    if diff == 0:
        return 25.0, f"Trình độ {EDU_LABELS.get(user_edu.lower(), user_edu)} phù hợp hoàn toàn"
    if diff == 1:
        return 25.0, f"Học bổng bậc {EDU_LABELS.get(scholarship_level.lower(), scholarship_level)} — phù hợp cho bước tiến tiếp theo"
    if diff == -1:
        return 10.0, None
    return 0.0, None


def _calculate_distance(lat1, lon1, lat2, lon2):
    """Haversine formula để tính khoảng cách giữa 2 điểm (km)."""
    if not all([lat1, lon1, lat2, lon2]):
        return 999999.0
    try:
        lat1, lon1, lat2, lon2 = map(float, [lat1, lon1, lat2, lon2])
        R = 6371  # Bán kính Trái đất
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c
    except:
        return 999999.0


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
        return 35.0, f"Phù hợp lĩnh vực: {', '.join(matched_interests)}"
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


def _country_score(preferred_locations: list[str] | None, scholarship_country: str | None) -> tuple[float, str | None]:
    """Match quốc gia học bổng với địa điểm ưu tiên.
    Returns (score, reason)."""
    if not preferred_locations or not scholarship_country:
        return 10.0, None
    pl = _normalize(preferred_locations)
    sc = scholarship_country.lower()
    for loc in pl:
        if loc in sc or sc in loc:
            return 20.0, f"Quốc gia phù hợp: {scholarship_country}"
    # Nếu user muốn remote/toàn cầu
    if "remote" in pl or "anywhere" in pl or "quốc tế" in pl:
        return 15.0, "Học bổng quốc tế"
    return 5.0, None


def _build_match_reasons(
    matched_skills: list[str],
    level_reason: str | None,
    location_reason: str | None,
    jobtype_reason: str | None,
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

@router.get("/jobs")
async def recommend_jobs(
    user_id: str = Query(..., description="UUID của user muốn lấy gợi ý"),
    limit: int = Query(10, le=50),
    sort_by: str = Query("match_score", description="Sắp xếp theo: match_score, salary, posted_at, deadline, popularity, distance"),
    order: str = Query("desc", description="Thứ tự: asc, desc"),
    db: AsyncSession = Depends(get_db),
):
    """Gợi ý việc làm cá nhân hóa dựa trên hồ sơ năng lực."""
    user = await _get_user(user_id, db)

    result = await db.execute(select(Job).where(Job.is_active == True).limit(200))
    jobs = result.scalars().all()

    scored = []
    for job in jobs:
        skills_score, matched_skills = _skills_overlap_score(user.skills, job.skills or [])
        lvl_score, lvl_reason = _level_score(user.experience_level, job.experience)
        loc_score, loc_reason = _location_score(user.preferred_locations, job.location)
        jt_score, jt_reason = _jobtype_score(user.preferred_job_types, job.job_type)

        score = skills_score + lvl_score + loc_score + jt_score
        reasons = _build_match_reasons(matched_skills, lvl_reason, loc_reason, jt_reason)
        scored.append((score, job, reasons))

    # Sắp xếp bổ sung
    if sort_by == "salary":
        scored.sort(key=lambda x: (x[1].salary_max or 0), reverse=(order == "desc"))
    elif sort_by == "posted_at":
        scored.sort(key=lambda x: (x[1].posted_at or datetime.min), reverse=(order == "desc"))
    elif sort_by == "deadline":
        scored.sort(key=lambda x: (x[1].deadline or datetime.max), reverse=(order == "desc"))
    elif sort_by == "popularity":
        scored.sort(key=lambda x: (x[1].view_count or 0), reverse=(order == "desc"))
    elif sort_by == "distance":
        scored.sort(key=lambda x: _calculate_distance(user.latitude, user.longitude, x[1].latitude, x[1].longitude), reverse=(order == "desc"))
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


@router.get("/scholarships")
async def recommend_scholarships(
    user_id: str = Query(..., description="UUID của user muốn lấy gợi ý"),
    limit: int = Query(10, le=50),
    sort_by: str = Query("match_score", description="Sắp xếp theo: match_score, deadline, value, posted_at, competitiveness"),
    order: str = Query("desc", description="Thứ tự: asc, desc"),
    db: AsyncSession = Depends(get_db),
):
    """Gợi ý học bổng cá nhân hóa dựa trên hồ sơ."""
    user = await _get_user(user_id, db)

    result = await db.execute(select(Scholarship).limit(200))
    scholarships = result.scalars().all()

    scored = []
    for s in scholarships:
        edu_score, edu_reason = _edu_scholarship_score(user.education_level, s.level)
        field_score, field_reason = _field_interest_score(user.interest_fields, s.field)
        edufield_score, edufield_reason = _edu_field_score(user.education_field, s.field)
        ctry_score, ctry_reason = _country_score(user.preferred_locations, s.country)

        score = edu_score + field_score + edufield_score + ctry_score

        reasons = []
        if edu_reason:
            reasons.append(edu_reason)
        if field_reason:
            reasons.append(field_reason)
        if edufield_reason:
            reasons.append(edufield_reason)
        if ctry_reason:
            reasons.append(ctry_reason)

        scored.append((score, s, reasons))

    # Sắp xếp bổ sung
    if sort_by == "deadline":
        scored.sort(key=lambda x: (x[1].deadline or datetime.max), reverse=(order == "desc"))
    elif sort_by == "value":
        scored.sort(key=lambda x: (x[1].numeric_amount or 0), reverse=(order == "desc"))
    elif sort_by == "posted_at":
        scored.sort(key=lambda x: (x[1].created_at or datetime.min), reverse=(order == "desc"))
    elif sort_by == "competitiveness":
        scored.sort(key=lambda x: (x[1].competitiveness_score or 5), reverse=(order == "desc"))
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
