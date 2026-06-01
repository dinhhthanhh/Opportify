from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from db.database import get_db
from models.scholarship import Scholarship
from typing import List, Optional
from datetime import datetime, date, time
import uuid
from models.user import User
from routers.recommend import _edu_scholarship_score, _normalize

router = APIRouter()

@router.get("/filters")
async def get_scholarship_filters(db: AsyncSession = Depends(get_db)):
    base_query = select(Scholarship)

    country_query = (
        select(Scholarship.country)
        .where(Scholarship.country.isnot(None))
        .where(func.length(func.trim(Scholarship.country)) > 0)
        .distinct()
        .order_by(Scholarship.country)
    )
    field_query = (
        select(Scholarship.field)
        .where(Scholarship.field.isnot(None))
        .where(func.length(func.trim(Scholarship.field)) > 0)
        .distinct()
        .order_by(Scholarship.field)
    )
    organization_query = (
        select(Scholarship.organization)
        .where(Scholarship.organization.isnot(None))
        .where(func.length(func.trim(Scholarship.organization)) > 0)
        .distinct()
        .order_by(Scholarship.organization)
    )

    country_result = await db.execute(country_query)
    field_result = await db.execute(field_query)
    organization_result = await db.execute(organization_query)

    countries = [row[0] for row in country_result.fetchall() if row[0]]
    fields = [row[0] for row in field_result.fetchall() if row[0]]
    organizations = [row[0] for row in organization_result.fetchall() if row[0]]

    return {
        "countries": countries,
        "fields": fields,
        "organizations": organizations,
    }

@router.get("/")
async def get_scholarships(
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=100),
    q: Optional[str] = None,
    country: Optional[str] = None,
    level: Optional[str] = None,
    coverage: Optional[str] = None,
    field: Optional[str] = None,
    organization: Optional[str] = None,
    deadline_to: Optional[str] = None,
    sort_by: str = Query("deadline"),
    order: str = Query("asc"),
    user_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    def parse_csv(value: Optional[str]) -> List[str]:
        if not value:
            return []
        return [item.strip().lower() for item in value.split(",") if item.strip()]

    query = select(Scholarship)
    
    if q:
        query = query.where(Scholarship.title.ilike(f"%{q}%") | Scholarship.description.ilike(f"%{q}%"))
    if country:
        query = query.where(Scholarship.country.ilike(f"%{country}%"))
    if level:
        query = query.where(Scholarship.level.ilike(f"%{level}%"))
    coverage_list = parse_csv(coverage)
    if coverage_list:
        query = query.where(func.lower(Scholarship.coverage).in_(coverage_list))
    if field:
        query = query.where(Scholarship.field.ilike(f"%{field}%"))
    if organization:
        query = query.where(Scholarship.organization.ilike(f"%{organization}%"))
    if deadline_to:
        try:
            if "T" in deadline_to:
                end_dt = datetime.fromisoformat(deadline_to)
            else:
                end_date = datetime.strptime(deadline_to, "%Y-%m-%d").date()
                end_dt = datetime.combine(end_date, time.max)
            query = query.where(Scholarship.deadline <= end_dt)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid deadline_to date")
        
    # Count total before applying pagination so every page reports the same total.
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # 1. SQL Sorting
    if sort_by == "deadline":
        query = query.order_by(Scholarship.deadline.desc() if order == "desc" else Scholarship.deadline.asc())
    elif sort_by == "value":
        query = query.order_by(Scholarship.numeric_amount.desc() if order == "desc" else Scholarship.numeric_amount.asc())
    elif sort_by == "posted_at":
        query = query.order_by(Scholarship.created_at.desc() if order == "desc" else Scholarship.created_at.asc())
    elif sort_by == "competitiveness":
        query = query.order_by(Scholarship.competitiveness_score.desc() if order == "desc" else Scholarship.competitiveness_score.asc())

    result = await db.execute(query)
    items = result.scalars().all()

    # 2. Advanced AI Sorting (Match Score)
    if sort_by == "match_score" and user_id:
        try:
            uid = uuid.UUID(user_id)
            user_res = await db.execute(select(User).where(User.id == uid))
            user = user_res.scalar_one_or_none()
            
            if user:
                scored = []
                for s in items:
                    edu_score = _edu_scholarship_score(user.education_level, s.level)
                    field_score = 0.0
                    if user.interest_fields and s.field:
                        s_field_lower = s.field.lower()
                        for interest in _normalize(user.interest_fields):
                            if interest in s_field_lower or s_field_lower in interest:
                                field_score = 40.0
                                break
                    
                    score = edu_score + field_score
                    scored.append((score, s))
                
                scored.sort(key=lambda x: x[0], reverse=(order == "desc"))
                items = [x[1] for x in scored]
        except:
            pass

    # Pagination
    start = (page - 1) * limit
    paginated_items = items[start:start+limit]
    
    return {"results": paginated_items, "total": total}

@router.get("/{id}")
async def get_scholarship_detail(id: str, db: AsyncSession = Depends(get_db)):
    query = select(Scholarship).where(Scholarship.id == id)
    result = await db.execute(query)
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Scholarship not found")
    return item
