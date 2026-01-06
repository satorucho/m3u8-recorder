from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional

from app.schemas.recording import RecordingResponse


class RecordedFileBase(BaseModel):
    file_path: str
    file_size: Optional[int] = None


class RecordedFileResponse(RecordedFileBase):
    id: UUID
    recording_id: UUID
    created_at: datetime
    recording: Optional[RecordingResponse] = None

    class Config:
        from_attributes = True

