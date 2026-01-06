import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class RecordingStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    RECORDING = "recording"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Recording(Base):
    __tablename__ = "recordings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    channel_id = Column(UUID(as_uuid=True), ForeignKey("channels.id"), nullable=False)
    title = Column(String(255), nullable=False)
    start_time = Column(DateTime, nullable=False)  # UTC
    end_time = Column(DateTime, nullable=False)    # UTC
    status = Column(
        Enum(RecordingStatus),
        default=RecordingStatus.SCHEDULED,
        nullable=False
    )
    created_at = Column(DateTime, default=datetime.utcnow)

    channel = relationship("Channel", back_populates="recordings")
    recorded_file = relationship("RecordedFile", back_populates="recording", uselist=False, cascade="all, delete-orphan")

