import uuid
from sqlalchemy import Column, String, Text, DateTime
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
    description = Column(Text)
    url = Column(String(500), unique=True, nullable=False)
    source = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)
