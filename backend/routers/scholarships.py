from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from db.database import get_db
from models.scholarship import Scholarship
from typing import List, Optional

router = APIRouter()

@router.get("/")
async def get_scholarships(
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=100),
    q: Optional[str] = None,
    country: Optional[str] = None,
    level: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Scholarship)
    
    if q:
        query = query.where(Scholarship.title.ilike(f"%{q}%") | Scholarship.description.ilike(f"%{q}%"))
    if country:
        query = query.where(Scholarship.country.ilike(f"%{country}%"))
    if level:
        query = query.where(Scholarship.level.ilike(f"%{level}%"))
        
    # Count total for pagination
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Execute paginated query
    query = query.limit(limit).offset((page - 1) * limit)
    result = await db.execute(query)
    items = result.scalars().all()
    
    return {"results": items, "total": total}

@router.get("/{id}")
async def get_scholarship_detail(id: str, db: AsyncSession = Depends(get_db)):
    query = select(Scholarship).where(Scholarship.id == id)
    result = await db.execute(query)
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Scholarship not found")
    return item
