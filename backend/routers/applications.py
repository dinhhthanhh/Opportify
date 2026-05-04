from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from db.database import get_db
from models.application import Application
import uuid
from datetime import datetime
import os
from typing import Optional

router = APIRouter()

@router.post("/apply")
async def apply_item(
    item_id: str = Form(...),
    item_type: str = Form(...),
    full_name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    cover_letter: Optional[str] = Form(None),
    cv_file: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db)
):
    # In a real app, save file to S3. Here we just mock it.
    cv_url = f"uploads/{cv_file.filename}" if cv_file else "profile_cv.pdf"
    
    new_app = Application(
        item_id=uuid.UUID(item_id),
        item_type=item_type,
        full_name=full_name,
        email=email,
        phone=phone,
        cover_letter=cover_letter,
        cv_url=cv_url
    )
    
    db.add(new_app)
    await db.commit()
    return {"message": "Ứng tuyển thành công!", "application_id": str(new_app.id)}

@router.get("/my")
async def get_my_apps(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    from models.job import Job
    from models.scholarship import Scholarship
    
    # Mocking for demo user
    stmt = select(Application).order_by(Application.created_at.desc())
    result = await db.execute(stmt)
    apps = result.scalars().all()
    
    # Join with titles (manual for now to simplify)
    full_apps = []
    for app in apps:
        title = "Đang tải..."
        if app.item_type == "job":
            j = await db.get(Job, app.item_id)
            title = j.title if j else "Vị trí không còn tồn tại"
        else:
            s = await db.get(Scholarship, app.item_id)
            title = s.title if s else "Học bổng không còn tồn tại"
        
        full_apps.append({
            "id": str(app.id),
            "item_type": app.item_type,
            "title": title,
            "status": app.status,
            "is_viewed": app.is_viewed,
            "created_at": app.created_at,
            "interview_date": app.interview_date
        })
    return full_apps

@router.put("/{app_id}")
async def update_app(app_id: str, full_name: str = Form(...), email: str = Form(...), phone: str = Form(...), cover_letter: Optional[str] = Form(None), db: AsyncSession = Depends(get_db)):
    app = await db.get(Application, uuid.UUID(app_id))
    if not app:
        return {"error": "Không tìm thấy đơn ứng tuyển"}
    
    if app.is_viewed:
        return {"error": "Nhà tuyển dụng đã xem hồ sơ, không thể thay đổi thông tin."}
    
    app.full_name = full_name
    app.email = email
    app.phone = phone
    app.cover_letter = cover_letter
    await db.commit()
    return {"message": "Cập nhật thành công!"}

@router.get("/notifications")
async def get_notifications(db: AsyncSession = Depends(get_db)):
    from models.application import Notification
    from sqlalchemy import select
    stmt = select(Notification).order_by(Notification.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/mock-invite")
async def mock_invite(app_id: str, db: AsyncSession = Depends(get_db)):
    from models.application import Notification
    app = await db.get(Application, uuid.UUID(app_id))
    if not app: return {"error": "App not found"}
    
    app.status = "interviewing"
    app.interview_date = datetime.utcnow() # Mock 
    
    notif = Notification(
        user_id=app.user_id,
        title="Lời mời phỏng vấn mới!",
        message=f"Nhà tuyển dụng đã đồng ý hồ sơ của bạn cho vị trí. Hãy kiểm tra lịch hẹn.",
        type="interview_invite",
        link=f"/profile/applications"
    )
    db.add(notif)
    await db.commit()
    return {"message": "Mock invite created"}
