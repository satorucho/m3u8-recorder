from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
import pytz

from app.database import get_db
from app.models.channel import Channel
from app.schemas.channel import ChannelCreate, ChannelUpdate, ChannelResponse

router = APIRouter()


def validate_timezone(timezone: str) -> bool:
    try:
        pytz.timezone(timezone)
        return True
    except pytz.exceptions.UnknownTimeZoneError:
        return False


@router.get("/timezones/list", response_model=List[str])
def get_timezones():
    """利用可能なタイムゾーン一覧を取得"""
    return pytz.common_timezones


@router.get("", response_model=List[ChannelResponse])
def get_channels(db: Session = Depends(get_db)):
    """チャンネル一覧を取得"""
    return db.query(Channel).order_by(Channel.name).all()


@router.get("/{channel_id}", response_model=ChannelResponse)
def get_channel(channel_id: UUID, db: Session = Depends(get_db)):
    """チャンネル詳細を取得"""
    channel = db.query(Channel).filter(Channel.id == channel_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    return channel


@router.post("", response_model=ChannelResponse, status_code=201)
def create_channel(channel_data: ChannelCreate, db: Session = Depends(get_db)):
    """チャンネルを作成"""
    if not validate_timezone(channel_data.timezone):
        raise HTTPException(status_code=400, detail="Invalid timezone")
    
    channel = Channel(**channel_data.model_dump())
    db.add(channel)
    db.commit()
    db.refresh(channel)
    return channel


@router.put("/{channel_id}", response_model=ChannelResponse)
def update_channel(
    channel_id: UUID,
    channel_data: ChannelUpdate,
    db: Session = Depends(get_db)
):
    """チャンネルを更新"""
    channel = db.query(Channel).filter(Channel.id == channel_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    update_data = channel_data.model_dump(exclude_unset=True)
    
    if "timezone" in update_data and not validate_timezone(update_data["timezone"]):
        raise HTTPException(status_code=400, detail="Invalid timezone")
    
    for key, value in update_data.items():
        setattr(channel, key, value)
    
    db.commit()
    db.refresh(channel)
    return channel


@router.delete("/{channel_id}", status_code=204)
def delete_channel(channel_id: UUID, db: Session = Depends(get_db)):
    """チャンネルを削除"""
    channel = db.query(Channel).filter(Channel.id == channel_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    db.delete(channel)
    db.commit()
    return None

