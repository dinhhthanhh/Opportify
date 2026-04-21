import uuid
from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from pgvector.sqlalchemy import Vector
from db.database import Base
from datetime import datetime

class Job(Base):
    __tablename__ = "jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=False)
    location = Column(String(100))
    salary_min = Column(Integer)
    salary_max = Column(Integer)
    salary_currency = Column(String(10), default='VND')
    description = Column(Text)
    skills = Column(ARRAY(String), default=[])
    job_type = Column(String(50))
    experience = Column(String(50))
    url = Column(String(500), unique=True, nullable=False)
    source = Column(String(50))
    is_active = Column(Boolean, default=True)
    posted_at = Column(DateTime)
    crawled_at = Column(DateTime, default=datetime.utcnow)
    # embedding = Column(Vector(1536))
