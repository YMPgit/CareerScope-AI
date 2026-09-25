from __future__ import annotations

import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import get_current_user, get_db
from app.models.resume import Resume
from app.models.user import User
from app.schemas.resume import ResumeListOut
from app.services.resume_upload import ResumeUploadError, validate_and_store

router = APIRouter()


async def _read_limited(file: UploadFile, max_bytes: int) -> bytes:
    chunks = []
    total = 0
    while True:
        chunk = await file.read(1024 * 1024)
        if not chunk:
            break
        total += len(chunk)
        if total > max_bytes:
            mb = settings.MAX_UPLOAD_SIZE_MB
            raise ResumeUploadError(f"File exceeds the {mb} MB limit.")
        chunks.append(chunk)
    return b"".join(chunks)


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    try:
        data = await _read_limited(file, max_bytes)
        if not data:
            raise ResumeUploadError("The uploaded file is empty.")
        resume = validate_and_store(db, current_user.id, file.filename or "resume.pdf", data)
    except ResumeUploadError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    return {
        "id": resume.id,
        "file_name": resume.file_name,
        "parsed_data": resume.parsed_data,
        "created_at": resume.created_at.isoformat() if resume.created_at else None,
    }


@router.get("")
def list_resumes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.created_at.desc())
        .all()
    )
    return [
        ResumeListOut(
            id=r.id,
            file_name=r.file_name,
            parsed_count=len((r.parsed_data or {}).get("skills", [])) if r.parsed_data else None,
            created_at=r.created_at.isoformat() if r.created_at else None,
        )
        for r in rows
    ]


@router.delete("/{resume_id}")
def delete_resume(resume_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    if resume.file_path:
        try:
            os.remove(resume.file_path)
        except OSError:
            pass
    db.delete(resume)
    db.commit()
    return {"message": "Resume deleted."}