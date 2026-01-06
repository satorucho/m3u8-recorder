import subprocess
import os
import logging
from datetime import datetime, timedelta
from typing import Dict
from uuid import UUID

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.recording import Recording, RecordingStatus
from app.models.recorded_file import RecordedFile
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

scheduler = BackgroundScheduler()
active_recordings: Dict[UUID, subprocess.Popen] = {}


def get_output_filename(recording: Recording) -> str:
    """録画ファイル名を生成"""
    timestamp = recording.start_time.strftime("%Y%m%d_%H%M%S")
    safe_title = "".join(c if c.isalnum() or c in "._-" else "_" for c in recording.title)
    return f"{timestamp}_{safe_title}.ts"


def start_recording(recording_id: UUID, m3u8_url: str, output_path: str):
    """ffmpegで録画を開始"""
    try:
        cmd = [
            "ffmpeg",
            "-y",  # Overwrite output file
            "-i", m3u8_url,
            "-c", "copy",  # Copy without re-encoding
            "-f", "mpegts",  # Output format
            output_path
        ]
        
        logger.info(f"Starting recording {recording_id}: {' '.join(cmd)}")
        
        # Fix for hypothesis A: Use DEVNULL to avoid buffer overflow deadlock
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        
        active_recordings[recording_id] = process
        return True
    except Exception as e:
        logger.error(f"Failed to start recording {recording_id}: {e}")
        return False


def stop_recording(recording_id: UUID) -> bool:
    """録画を停止"""
    if recording_id in active_recordings:
        process = active_recordings[recording_id]
        try:
            process.terminate()
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait()
        except Exception as e:
            logger.error(f"Error stopping recording {recording_id}: {e}")
        
        del active_recordings[recording_id]
        return True
    return False


def check_recordings():
    """予約をチェックし、録画を開始/停止"""
    db: Session = SessionLocal()
    try:
        now = datetime.utcnow()
        
        # Check for recordings to start
        recordings_to_start = db.query(Recording).filter(
            Recording.status == RecordingStatus.SCHEDULED,
            Recording.start_time <= now,
            Recording.end_time > now
        ).all()
        
        for recording in recordings_to_start:
            filename = get_output_filename(recording)
            output_path = os.path.join(settings.recordings_path, filename)
            
            if start_recording(recording.id, recording.channel.m3u8_url, output_path):
                recording.status = RecordingStatus.RECORDING
                db.commit()
                logger.info(f"Started recording: {recording.title}")
        
        # Check for recordings to stop
        recordings_to_stop = db.query(Recording).filter(
            Recording.status == RecordingStatus.RECORDING,
            Recording.end_time <= now
        ).all()
        
        for recording in recordings_to_stop:
            if stop_recording(recording.id):
                recording.status = RecordingStatus.COMPLETED
                
                # Create recorded file entry
                filename = get_output_filename(recording)
                output_path = os.path.join(settings.recordings_path, filename)
                
                file_size = None
                if os.path.exists(output_path):
                    file_size = os.path.getsize(output_path)
                
                recorded_file = RecordedFile(
                    recording_id=recording.id,
                    file_path=filename,
                    file_size=file_size,
                )
                db.add(recorded_file)
                db.commit()
                logger.info(f"Completed recording: {recording.title}")
        
        # Check for cancelled recordings
        cancelled_recordings = db.query(Recording).filter(
            Recording.status == RecordingStatus.CANCELLED,
            Recording.id.in_(list(active_recordings.keys()))
        ).all()
        
        for recording in cancelled_recordings:
            if stop_recording(recording.id):
                logger.info(f"Cancelled recording: {recording.title}")
        
        # Mark missed recordings as failed
        missed_recordings = db.query(Recording).filter(
            Recording.status == RecordingStatus.SCHEDULED,
            Recording.end_time <= now
        ).all()
        
        for recording in missed_recordings:
            recording.status = RecordingStatus.FAILED
            logger.warning(f"Missed recording: {recording.title}")
        
        if missed_recordings:
            db.commit()
            
    except Exception as e:
        logger.error(f"Error in check_recordings: {e}")
        db.rollback()
    finally:
        db.close()


def start_scheduler():
    """スケジューラーを開始"""
    scheduler.add_job(
        check_recordings,
        IntervalTrigger(seconds=30),
        id="check_recordings",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Recording scheduler started")


def shutdown_scheduler():
    """スケジューラーを停止"""
    # Stop all active recordings
    for recording_id in list(active_recordings.keys()):
        stop_recording(recording_id)
    
    scheduler.shutdown()
    logger.info("Recording scheduler stopped")

