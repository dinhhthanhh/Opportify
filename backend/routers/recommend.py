"""
recommend.py — Rule-based matching engine cho Opportify.

Logic tính match_score (0-100):
  - Skills overlap: 60 điểm tối đa
  - Experience level match: 20 điểm
  - Location match: 10 điểm
  - Job type match: 10 điểm
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
EDU_ORDER = {"bachelor": 0, "master": 1, "phd": 2, "postdoc": 3}


def _normalize(lst: list | None) -> list[str]:
    if not lst:
        return []
    return [s.lower().strip() for s in lst]


def _skills_overlap_score(user_skills: list[str], item_skills: list[str]) -> float:
    """Tỉ lệ overlap kỹ năng, tính theo Jaccard-like: intersection / union."""
    u = set(_normalize(user_skills))
    i = set(_normalize(item_skills))
    if not i:
        return 30.0  # nếu job/scholarship không yêu cầu skill → trung bình
    intersection = u & i
    if not u:
        return 0.0
    return min(len(intersection) / len(i), 1.0) * 60


def _level_score(user_level: str | None, item_experience: str | None) -> float:
    """Score 20 điểm nếu level người dùng nằm trong range phù hợp."""
    if not user_level or not item_experience:
        return 10.0  # trung bình nếu thiếu thông tin
    u = LEVEL_ORDER.get(user_level.lower(), -1)
    i = LEVEL_ORDER.get(item_experience.lower(), -1)
    if u == -1 or i == -1:
        return 10.0
    diff = abs(u - i)
    return max(0, 20 - diff * 7)


def _location_score(preferred: list[str] | None, item_location: str | None) -> float:
    """Score 10 điểm nếu địa điểm nằm trong danh sách ưu tiên."""
    if not preferred or not item_location:
        return 5.0
    pl = _normalize(preferred)
    iloc = item_location.lower()
    # hỗ trợ "remote" và "anywhere"
    if "remote" in pl or "anywhere" in pl or "toàn quốc" in iloc:
        return 10.0
    for loc in pl:
        if loc in iloc or iloc in loc:
            return 10.0
    return 0.0


def _jobtype_score(preferred_types: list[str] | None, item_type: str | None) -> float:
    """Score 10 điểm nếu job type khớp."""
    if not preferred_types or not item_type:
        return 5.0
    pt = _normalize(preferred_types)
    it = item_type.lower()
    return 10.0 if it in pt else 0.0


def _edu_scholarship_score(user_edu: str | None, scholarship_level: str | None) -> float:
    """Cho học bổng: user cần có trình độ tương ứng hoặc thấp hơn 1 bậc."""
    if not user_edu or not scholarship_level:
        return 10.0
    u = EDU_ORDER.get(user_edu.lower(), -1)
    s = EDU_ORDER.get(scholarship_level.lower(), -1)
    if u == -1 or s == -1:
        return 10.0
    diff = s - u  # học bổng hướng đến trình độ cao hơn mới phù hợp
    if diff == 1 or diff == 0:
        return 20.0
    if diff == -1:
        return 10.0
    return 0.0


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


def _job_to_dict(job: Job, score: float) -> dict:
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
    }


def _scholarship_to_dict(s: Scholarship, score: float) -> dict:
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
        score = (
            _skills_overlap_score(user.skills, job.skills or [])
            + _level_score(user.experience_level, job.experience)
            + _location_score(user.preferred_locations, job.location)
            + _jobtype_score(user.preferred_job_types, job.job_type)
        )
        scored.append((score, job))

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
        "results": [_job_to_dict(job, score) for score, job in top],
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
        # Matching dựa trên: education level, interest fields vs scholarship field
        edu_score = _edu_scholarship_score(user.education_level, s.level)
        # Match lĩnh vực quan tâm với field của học bổng
        field_score = 0.0
        if user.interest_fields and s.field:
            s_field_lower = s.field.lower()
            for interest in _normalize(user.interest_fields):
                if interest in s_field_lower or s_field_lower in interest:
                    field_score = 40.0
                    break
            else:
                field_score = 10.0
        else:
            field_score = 20.0

        # Country preference — bonus nếu user không care về quốc gia
        country_score = 20.0  # default neutral

        score = edu_score + field_score + country_score
        scored.append((score, s))

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
        "results": [_scholarship_to_dict(s, score) for score, s in top],
    }
