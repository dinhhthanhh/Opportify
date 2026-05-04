import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from db.database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # --- Hồ sơ năng lực cá nhân ---
    full_name = Column(String(255), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)

    # Kỹ năng & Kinh nghiệm
    skills = Column(ARRAY(String), default=[], server_default='{}')
    experience_years = Column(Integer, nullable=True, default=0)
    # fresher | junior | mid | senior
    experience_level = Column(String(50), nullable=True)

    # Học vấn
    # bachelor | master | phd
    education_level = Column(String(50), nullable=True)
    education_field = Column(String(255), nullable=True)  # e.g. "Khoa học Máy tính"
    university = Column(String(255), nullable=True)

    # Sở thích tìm việc
    preferred_locations = Column(ARRAY(String), default=[], server_default='{}')
    # fulltime | parttime | remote | internship
    preferred_job_types = Column(ARRAY(String), default=[], server_default='{}')
    # Lĩnh vực quan tâm (AI, Backend, Frontend, Data...)
    interest_fields = Column(ARRAY(String), default=[], server_default='{}')

    # Địa lý
    latitude = Column(String(50), nullable=True)
    longitude = Column(String(50), nullable=True)

