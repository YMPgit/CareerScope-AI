from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import get_current_user, get_db
from app.models.analysis import Analysis
from app.models.resume import Resume
from app.models.user import User
from app.services import analysis_service
from app.services.resume_upload import ResumeUploadError, validate_and_store

router = APIRouter()


async def _resolve_resume(
    db: Session,
    user: User,
    resume_id: int | None,
    file: UploadFile | None,
):
    if resume_id:
        resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == user.id).first()
        if not resume:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
        return resume
    if file:
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        data = await _read_limited(file, max_bytes)
        try:
            return validate_and_store(db, user.id, file.filename or "resume.pdf", data)
        except ResumeUploadError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Upload a resume (PDF) or provide a resume_id.")


async def _read_limited(file: UploadFile, max_bytes: int) -> bytes:
    chunks = []
    total = 0
    while True:
        chunk = await file.read(1024 * 1024)
        if not chunk:
            break
        total += len(chunk)
        if total > max_bytes:
            raise ResumeUploadError(f"File exceeds the {settings.MAX_UPLOAD_SIZE_MB} MB limit.")
        chunks.append(chunk)
    return b"".join(chunks)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_analysis(
    target_role: str = Form(...),
    location: str | None = Form(None),
    experience_level: str | None = Form(None),
    employment_type: str | None = Form(None),
    resume_id: int | None = Form(None),
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not target_role.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Target role is required.")

    resume = await _resolve_resume(db, current_user, resume_id, file)

    analysis = analysis_service.create_analysis(
        db,
        current_user.id,
        target_role.strip(),
        location or None,
        experience_level or None,
        employment_type or None,
        resume.id,
    )
    analysis_service.schedule_run(analysis.id)
    return {"analysis": analysis_service.serialize_analysis(analysis, 0)}


@router.get("")
def list_analyses(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {"analyses": analysis_service.list_analyses(db, current_user.id)}


@router.get("/{analysis_id}")
def get_analysis(analysis_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    analysis = analysis_service.get_owned_analysis(db, analysis_id, current_user.id)
    if not analysis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")
    return analysis_service.build_analysis_detail(db, analysis, current_user.id)


@router.patch("/{analysis_id}")
def rename_analysis(
    analysis_id: int,
    body: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    analysis = analysis_service.get_owned_analysis(db, analysis_id, current_user.id)
    if not analysis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")
    new_title = (body.get("title") or "").strip()
    if not new_title:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Title cannot be empty.")
    analysis.title = new_title[:255]
    db.commit()
    return {"analysis": analysis_service.serialize_analysis(analysis)}


@router.delete("/{analysis_id}")
def delete_analysis(analysis_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    analysis = analysis_service.get_owned_analysis(db, analysis_id, current_user.id)
    if not analysis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")
    db.delete(analysis)
    db.commit()
    return {"message": "Analysis deleted."}


@router.post("/{analysis_id}/rerun", status_code=status.HTTP_201_CREATED)
def rerun_analysis(analysis_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = analysis_service.get_owned_analysis(db, analysis_id, current_user.id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")

    analysis = analysis_service.create_analysis(
        db,
        current_user.id,
        existing.target_role,
        existing.location,
        existing.experience_level,
        existing.employment_type,
        existing.resume_id,
    )
    analysis_service.schedule_run(analysis.id)
    return {"analysis": analysis_service.serialize_analysis(analysis, 0)}