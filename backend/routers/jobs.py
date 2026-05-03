from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from db.database import get_db
from models.job import Job
from typing import Optional, List

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
        
    # Count total for pagination
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Execute paginated query
    query = query.limit(limit).offset((page - 1) * limit)
    result = await db.execute(query)
    jobs = result.scalars().all()

    return {"results": jobs, "total": total}

@router.get("/{id}")
async def get_job_detail(id: str, db: AsyncSession = Depends(get_db)):
    query = select(Job).where(Job.id == id)
    result = await db.execute(query)
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Job not found")
    return item
