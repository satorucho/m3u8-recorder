from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from uuid import UUID
from datetime import datetime
import pytz

from app.database import get_db
from app.models.channel import Channel
from app.models.recording import Recording, RecordingStatus
from app.schemas.recording import (
    RecordingCreate,
    RecordingUpdate,
    RecordingResponse,
    TimeConversionResponse,
)

router = APIRouter()


@router.get("", response_model=List[RecordingResponse])
def get_recordings(
    channel_id: Optional[UUID] = Query(None),
    status: Optional[RecordingStatus] = Query(None),
    db: Session = Depends(get_db)
):
    """録画予約一覧を取得"""
    query = db.query(Recording).options(joinedload(Recording.channel))
    
    if channel_id:
        query = query.filter(Recording.channel_id == channel_id)
    if status:
        query = query.filter(Recording.status == status)
    
    return query.order_by(Recording.start_time.desc()).all()


@router.get("/{recording_id}", response_model=RecordingResponse)
def get_recording(recording_id: UUID, db: Session = Depends(get_db)):
    """録画予約詳細を取得"""
    recording = (
        db.query(Recording)
        .options(joinedload(Recording.channel))
        .filter(Recording.id == recording_id)
        .first()
    )
    if not recording:
        raise HTTPException(status_code=404, detail="Recording not found")
    return recording


@router.post("", response_model=RecordingResponse, status_code=201)
def create_recording(recording_data: RecordingCreate, db: Session = Depends(get_db)):
    """録画予約を作成"""
    channel = db.query(Channel).filter(Channel.id == recording_data.channel_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    if recording_data.end_time <= recording_data.start_time:
        raise HTTPException(status_code=400, detail="End time must be after start time")
    
    recording = Recording(**recording_data.model_dump())
    db.add(recording)
    db.commit()
    db.refresh(recording)
    
    # Load channel relationship
    db.refresh(recording)
    recording = (
        db.query(Recording)
        .options(joinedload(Recording.channel))
        .filter(Recording.id == recording.id)
        .first()
    )
    
    return recording


@router.put("/{recording_id}", response_model=RecordingResponse)
def update_recording(
    recording_id: UUID,
    recording_data: RecordingUpdate,
    db: Session = Depends(get_db)
):
    """録画予約を更新"""
    recording = (
        db.query(Recording)
        .options(joinedload(Recording.channel))
        .filter(Recording.id == recording_id)
        .first()
    )
    if not recording:
        raise HTTPException(status_code=404, detail="Recording not found")
    
    if recording.status != RecordingStatus.SCHEDULED:
        raise HTTPException(
            status_code=400,
            detail="Can only update scheduled recordings"
        )
    
    update_data = recording_data.model_dump(exclude_unset=True)
    
    # Validate time range
    start_time = update_data.get("start_time", recording.start_time)
    end_time = update_data.get("end_time", recording.end_time)
    if end_time <= start_time:
        raise HTTPException(status_code=400, detail="End time must be after start time")
    
    for key, value in update_data.items():
        setattr(recording, key, value)
    
    db.commit()
    db.refresh(recording)
    return recording


@router.delete("/{recording_id}", status_code=204)
def delete_recording(recording_id: UUID, db: Session = Depends(get_db)):
    """録画予約をキャンセル/削除"""
    recording = db.query(Recording).filter(Recording.id == recording_id).first()
    if not recording:
        raise HTTPException(status_code=404, detail="Recording not found")
    
    if recording.status == RecordingStatus.RECORDING:
        # Recording in progress - mark as cancelled
        recording.status = RecordingStatus.CANCELLED
        db.commit()
    else:
        db.delete(recording)
        db.commit()
    
    return None


@router.get("/{recording_id}/convert-time", response_model=TimeConversionResponse)
def convert_recording_time(recording_id: UUID, db: Session = Depends(get_db)):
    """録画時刻をチャンネルのタイムゾーンで表示"""
    recording = (
        db.query(Recording)
        .options(joinedload(Recording.channel))
        .filter(Recording.id == recording_id)
        .first()
    )
    if not recording:
        raise HTTPException(status_code=404, detail="Recording not found")
    
    channel_tz = pytz.timezone(recording.channel.timezone)
    utc = pytz.UTC
    
    # Convert UTC to channel timezone
    start_utc = utc.localize(recording.start_time) if recording.start_time.tzinfo is None else recording.start_time
    end_utc = utc.localize(recording.end_time) if recording.end_time.tzinfo is None else recording.end_time
    
    start_local = start_utc.astimezone(channel_tz)
    end_local = end_utc.astimezone(channel_tz)
    
    return TimeConversionResponse(
        channel_timezone=recording.channel.timezone,
        channel_start_time=start_local.strftime("%Y-%m-%d %H:%M"),
        channel_end_time=end_local.strftime("%Y-%m-%d %H:%M"),
        utc_start_time=start_utc,  # UTCタイムゾーン情報付きで返す
        utc_end_time=end_utc,      # UTCタイムゾーン情報付きで返す
    )

