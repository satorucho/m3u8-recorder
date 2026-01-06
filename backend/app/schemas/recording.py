from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID
from typing import Optional

from app.models.recording import RecordingStatus
from app.schemas.channel import ChannelResponse


class RecordingBase(BaseModel):
    channel_id: UUID
    title: str = Field(..., min_length=1, max_length=255)
    start_time: datetime
    end_time: datetime


class RecordingCreate(RecordingBase):
    pass


class RecordingUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None


class RecordingResponse(RecordingBase):
    id: UUID
    status: RecordingStatus
    created_at: datetime
    channel: Optional[ChannelResponse] = None

    class Config:
        from_attributes = True


class TimeConversionResponse(BaseModel):
    channel_timezone: str
    channel_start_time: str
    channel_end_time: str
    utc_start_time: datetime
    utc_end_time: datetime

