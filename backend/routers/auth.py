from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr

from db.database import get_db
from db.auth import get_password_hash, verify_password, create_access_token, get_current_user
from models.user import User

router = APIRouter()

class UserRegister(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: str | None = None

class Token(BaseModel):
    access_token: str
    token_type: str

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user_in: UserRegister, db: AsyncSession = Depends(get_db)):
    # Check if user already exists
    query = select(User).where((User.email == user_in.email) | (User.username == user_in.username))
    result = await db.execute(query)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username already registered"
        )
    
    new_user = User(
        email=user_in.email,
        username=user_in.username,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password)
    )

    # Copy profile từ an_nguyen để làm dữ liệu mẫu cho tất cả user mới
    template_query = select(User).where(User.username == "an_nguyen")
    template_res = await db.execute(template_query)
    template_user = template_res.scalar_one_or_none()
    
    if template_user:
        if user_in.email.startswith("guest_"):
            new_user.full_name = "Guest"
            new_user.contact_email = template_user.contact_email
        new_user.avatar_url = template_user.avatar_url
        new_user.bio = template_user.bio
        new_user.phone = template_user.phone
        new_user.github_url = template_user.github_url
        new_user.linkedin_url = template_user.linkedin_url
        new_user.portfolio_url = template_user.portfolio_url
        new_user.skills = list(template_user.skills) if template_user.skills else []
        new_user.experience_years = template_user.experience_years
        new_user.experience_level = template_user.experience_level
        new_user.education_level = template_user.education_level
        new_user.education_field = template_user.education_field
        new_user.university = template_user.university
        new_user.gpa = template_user.gpa
        new_user.preferred_locations = list(template_user.preferred_locations) if template_user.preferred_locations else []
        new_user.preferred_job_types = list(template_user.preferred_job_types) if template_user.preferred_job_types else []
        new_user.interest_fields = list(template_user.interest_fields) if template_user.interest_fields else []
        new_user.latitude = template_user.latitude
        new_user.longitude = template_user.longitude

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return {"message": "User registered successfully", "user_id": str(new_user.id)}

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    # Note: OAuth2PasswordRequestForm uses 'username' field for whatever identifier is used (in our case, email or username)
    query = select(User).where((User.email == form_data.username) | (User.username == form_data.username))
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "username": current_user.username,
        "is_active": current_user.is_active
    }
