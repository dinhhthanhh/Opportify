from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from db.database import get_db
from models.job import Job

router = APIRouter()

@router.get("/")
async def get_jobs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=100),
    q: str = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Job)
    if q:
        query = query.where(Job.title.ilike(f"%{q}%") | Job.description.ilike(f"%{q}%"))
        
    # Count total for pagination
    count_query = select(func.count(Job.id))
    if q:
        count_query = count_query.where(Job.title.ilike(f"%{q}%") | Job.description.ilike(f"%{q}%"))
    
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
