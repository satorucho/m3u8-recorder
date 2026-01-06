from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload
from typing import List
from uuid import UUID
import os

from app.database import get_db
from app.models.recorded_file import RecordedFile
from app.schemas.recorded_file import RecordedFileResponse
from app.config import get_settings

router = APIRouter()
settings = get_settings()


@router.get("", response_model=List[RecordedFileResponse])
def get_files(db: Session = Depends(get_db)):
    """録画ファイル一覧を取得"""
    from app.models.recording import Recording
    files = (
        db.query(RecordedFile)
        .options(joinedload(RecordedFile.recording).joinedload(Recording.channel))
        .order_by(RecordedFile.created_at.desc())
        .all()
    )
    return files


@router.get("/{file_id}", response_model=RecordedFileResponse)
def get_file(file_id: UUID, db: Session = Depends(get_db)):
    """録画ファイル詳細を取得"""
    from app.models.recording import Recording
    file = (
        db.query(RecordedFile)
        .options(joinedload(RecordedFile.recording).joinedload(Recording.channel))
        .filter(RecordedFile.id == file_id)
        .first()
    )
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    return file


@router.get("/{file_id}/download")
def download_file(file_id: UUID, db: Session = Depends(get_db)):
    """録画ファイルをダウンロード"""
    file = db.query(RecordedFile).filter(RecordedFile.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    file_path = file.file_path
    if not os.path.isabs(file_path):
        file_path = os.path.join(settings.recordings_path, file_path)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    filename = os.path.basename(file_path)
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="video/MP2T"
    )


@router.delete("/{file_id}", status_code=204)
def delete_file(file_id: UUID, db: Session = Depends(get_db)):
    """録画ファイルを削除"""
    file = db.query(RecordedFile).filter(RecordedFile.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    file_path = file.file_path
    if not os.path.isabs(file_path):
        file_path = os.path.join(settings.recordings_path, file_path)
    
    # Delete file from disk
    if os.path.exists(file_path):
        os.remove(file_path)
    
    # Delete record from database
    db.delete(file)
    db.commit()
    
    return None

