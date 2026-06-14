import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from enum import Enum
from typing import List, Optional

from db.database import get_db
from db.auth import get_current_user
from models.user import User

router = APIRouter()

AVATAR_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "avatars")
ALLOWED_AVATAR_EXT = {".jpg", ".jpeg", ".png", ".gif", ".webp"}

# ── Pydantic schemas ───────────────────────────────────────────────────────────

class ExperienceLevel(str, Enum):
    fresher = "fresher"
    junior = "junior"
    mid = "mid"
    senior = "senior"

class EducationLevel(str, Enum):
    bachelor = "bachelor"
    master = "master"
    phd = "phd"

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    contact_email: Optional[str] = None
    phone: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    skills: Optional[List[str]] = None
    experience_years: Optional[int] = None
    experience_level: Optional[ExperienceLevel] = None
    education_level: Optional[EducationLevel] = None
    education_field: Optional[str] = None
    university: Optional[str] = None
    gpa: Optional[float] = None
    preferred_locations: Optional[List[str]] = None
    preferred_job_types: Optional[List[str]] = None
    interest_fields: Optional[List[str]] = None


def _user_to_profile(u: User) -> dict:
    return {
        "id": str(u.id),
        "email": u.email,
        "username": u.username,
        "full_name": u.full_name,
        "avatar_url": u.avatar_url,
        "bio": u.bio,
        "contact_email": u.contact_email,
        "phone": u.phone,
        "github_url": u.github_url,
        "linkedin_url": u.linkedin_url,
        "portfolio_url": u.portfolio_url,
        "skills": u.skills or [],
        "experience_years": u.experience_years or 0,
        "experience_level": u.experience_level,
        "education_level": u.education_level,
        "education_field": u.education_field,
        "university": u.university,
        "gpa": u.gpa,
        "preferred_locations": u.preferred_locations or [],
        "preferred_job_types": u.preferred_job_types or [],
        "interest_fields": u.interest_fields or [],
        "created_at": u.created_at.isoformat() if u.created_at else None,
    }


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("/me")
async def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    """Lấy hồ sơ năng lực của user đang đăng nhập."""
    return _user_to_profile(current_user)


@router.put("/me")
async def update_my_profile(
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cập nhật hồ sơ năng lực."""
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)

    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return _user_to_profile(current_user)


@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Tải ảnh đại diện lên, lưu vào thư mục uploads/avatars và cập nhật hồ sơ."""
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_AVATAR_EXT:
        raise HTTPException(status_code=400, detail="Định dạng ảnh không hợp lệ")

    os.makedirs(AVATAR_DIR, exist_ok=True)
    filename = f"{current_user.id}{ext}"
    filepath = os.path.join(AVATAR_DIR, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    # Lưu đường dẫn tương đối; frontend tự ghép với API_URL
    current_user.avatar_url = f"/uploads/avatars/{filename}"
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return {"avatar_url": current_user.avatar_url}


@router.get("/mock-users")
async def get_mock_users(db: AsyncSession = Depends(get_db)):
    """Trả về danh sách các mock user để demo tính năng đề xuất."""
    result = await db.execute(select(User).where(User.email.like("%@mock.opportify%")).limit(10))
    users = result.scalars().all()

    if not users:
        return {"message": "Chưa có mock data. Hãy chạy seed_profiles.py", "users": []}

    return {"users": [_user_to_profile(u) for u in users]}


@router.get("/{user_id}")
async def get_profile_by_id(user_id: str, db: AsyncSession = Depends(get_db)):
    """Lấy hồ sơ của một user bất kỳ theo ID (dùng cho demo/recommend)."""
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="user_id không hợp lệ")

    result = await db.execute(select(User).where(User.id == uid))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User không tồn tại")

    return _user_to_profile(user)
