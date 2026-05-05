import uuid
from sqlalchemy import Column, String, Text, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID
from db.database import Base
from datetime import datetime

class Scholarship(Base):
    __tablename__ = "scholarships"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    organization = Column(String(255), nullable=False)
    country = Column(String(100))
    level = Column(String(50)) # bachelor, master, phd, postdoc
    field = Column(String(255))
    coverage = Column(String(50)) # full, partial, tuition_only
    amount = Column(String(255))
    deadline = Column(DateTime)
    view_count = Column(Integer, default=0)
    numeric_amount = Column(Integer, nullable=True) # Giá trị quy đổi ra số
    competitiveness_score = Column(Integer, default=5) # 1-10
    description = Column(Text)
    requirements = Column(Text)
    benefits = Column(Text)
    application_process = Column(Text)
    gender_requirement = Column(String) # All, Male, Female
    nationality_requirement = Column(String)
    website_url = Column(String)
    url = Column(String(500), unique=True, nullable=False)
    source = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)
