from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from db.database import get_db
from models.job import Job
from typing import Optional, List

import uuid
from datetime import datetime
import math

# Import helpers from recommend if needed, or re-implement here for self-containment
from models.user import User
from routers.recommend import _skills_overlap_score, _level_score, _location_score, _jobtype_score, _job_to_dict

router = APIRouter()

@router.get("/locations")
async def get_job_locations(db: AsyncSession = Depends(get_db)):
    query = (
        select(Job.location)
        .where(Job.location.isnot(None))
        .where(func.length(func.trim(Job.location)) > 0)
        .distinct()
        .order_by(Job.location)
    )
    result = await db.execute(query)
    locations = [row[0] for row in result.fetchall() if row[0]]
    return {"results": locations}

@router.get("/")
async def get_jobs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=100),
    q: Optional[str] = None,
    location: Optional[str] = None,
    salary_min: Optional[int] = None,
    salary_max: Optional[int] = None,
    salary_currency: Optional[str] = None,
    experience: Optional[str] = None,
    job_type: Optional[str] = None,
    sort_by: str = Query("posted_at"),
    order: str = Query("desc"),
    user_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    def parse_csv(value: Optional[str]) -> List[str]:
        if not value:
            return []
        return [item.strip().lower() for item in value.split(",") if item.strip()]

    query = select(Job)
    if q:
        query = query.where(Job.title.ilike(f"%{q}%") | Job.description.ilike(f"%{q}%"))
    if location:
        location_value = location.strip().lower()
        location_aliases = {
            "ho chi minh": [
                "ho chi minh",
                "hcm",
                "tp ho chi minh",
                "tp. ho chi minh",
                "ho chi minh city",
                "hồ chí minh",
                "tp hồ chí minh",
                "tp. hồ chí minh",
            ],
            "ha noi": ["ha noi", "hanoi", "hà nội"],
            "da nang": ["da nang", "danang", "đà nẵng"],
        }
        variants = location_aliases.get(location_value, [location_value])
        location_filters = [
            func.lower(Job.location).ilike(f"%{variant}%") for variant in variants
        ]
        query = query.where(or_(*location_filters))
    if salary_currency:
        query = query.where(func.lower(Job.salary_currency) == salary_currency.lower())
    if salary_min is not None:
        query = query.where(
            or_(Job.salary_min >= salary_min, Job.salary_max >= salary_min)
        )
    if salary_max is not None:
        query = query.where(
            or_(Job.salary_min <= salary_max, Job.salary_max <= salary_max)
        )

    experience_list = parse_csv(experience)
    if experience_list:
        experience_filters = [
            func.lower(Job.experience).ilike(f"%{value}%") for value in experience_list
        ]
        query = query.where(or_(*experience_filters))

    job_type_list = parse_csv(job_type)
    if job_type_list:
        query = query.where(func.lower(Job.job_type).in_(job_type_list))
        
    # Count total before applying pagination so every page reports the same total.
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # 1. Xử lý các tiêu chí sắp xếp thuần SQL (Lương, Ngày đăng, Hạn nộp, Lượt xem)
    if sort_by == "salary":
        query = query.order_by(Job.salary_max.desc() if order == "desc" else Job.salary_max.asc())
    elif sort_by == "posted_at":
        query = query.order_by(Job.posted_at.desc() if order == "desc" else Job.posted_at.asc())
    elif sort_by == "deadline":
        query = query.order_by(Job.deadline.desc() if order == "desc" else Job.deadline.asc())
    elif sort_by == "popularity":
        query = query.order_by(Job.view_count.desc() if order == "desc" else Job.view_count.asc())

    # Lấy dữ liệu
    result = await db.execute(query)
    jobs = result.scalars().all()

    # 2. Xử lý Sắp xếp nâng cao theo match_score (Cần User Profile)
    if sort_by == "match_score" and user_id:
        try:
            uid = uuid.UUID(user_id)
            user_res = await db.execute(select(User).where(User.id == uid))
            user = user_res.scalar_one_or_none()

            if user:
                scored_jobs = []
                for job in jobs:
                    skills_score, _ = _skills_overlap_score(user.skills, job.skills or [])
                    lvl_score, _ = _level_score(user.experience_level, job.experience)
                    loc_score, _ = _location_score(user.preferred_locations, job.location)
                    jt_score, _ = _jobtype_score(user.preferred_job_types, job.job_type)
                    score = skills_score + lvl_score + loc_score + jt_score
                    scored_jobs.append((score, job))

                scored_jobs.sort(key=lambda x: x[0], reverse=(order == "desc"))
                jobs = [x[1] for x in scored_jobs]
        except Exception as e:
            print(f"Sorting error: {e}")

    # Phân trang in-memory sau khi sort
    start = (page - 1) * limit
    end = start + limit
    paginated_jobs = jobs[start:end]

    return {"results": paginated_jobs, "total": total}

@router.get("/{id}")
async def get_job_detail(id: str, db: AsyncSession = Depends(get_db)):
    query = select(Job).where(Job.id == id)
    result = await db.execute(query)
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Job not found")
    return item
