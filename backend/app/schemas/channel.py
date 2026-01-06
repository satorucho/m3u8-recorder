from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID
from typing import Optional


class ChannelBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    m3u8_url: str = Field(..., min_length=1, max_length=2048)
    timezone: str = Field(default="UTC", max_length=50)


class ChannelCreate(ChannelBase):
    pass


class ChannelUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    m3u8_url: Optional[str] = Field(None, min_length=1, max_length=2048)
    timezone: Optional[str] = Field(None, max_length=50)


class ChannelResponse(ChannelBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

