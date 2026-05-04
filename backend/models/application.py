from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from db.database import Base
import uuid
from datetime import datetime

class Application(Base):
    __tablename__ = "applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), index=True) # Mock for now
    item_id = Column(UUID(as_uuid=True), index=True)
    item_type = Column(String(50)) # job, scholarship
    full_name = Column(String(255))
    email = Column(String(255))
    phone = Column(String(50))
    cv_url = Column(String(500)) # S3 or local path
    cover_letter = Column(Text)
    status = Column(String(50), default="pending") # pending, viewed, interviewing, offered, rejected
    is_viewed = Column(Boolean, default=False)
    interview_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), index=True)
    title = Column(String(255))
    message = Column(Text)
    type = Column(String(50)) # "interview_invite", "status_change", "system"
    is_read = Column(Boolean, default=False)
    link = Column(String(500)) # Link to application or job
    created_at = Column(DateTime, default=datetime.utcnow)
