from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.job import Job
from app.models.saved_job import SavedJob
from app.models.user import User
from app.services import analysis_service

router = APIRouter()


@router.post("/jobs/{job_id}/save")
def save_job(job_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    # A user may only save jobs coming from their own analyses.
    owned = (
        db.query(Job)
        .join(Job.analysis)
        .filter(Job.id == job_id)
        .first()
    )
    analysis = owned.analysis if owned else None
    if not analysis or analysis.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Job not found.")

    existing = (
        db.query(SavedJob)
        .filter(SavedJob.user_id == current_user.id, SavedJob.job_id == job_id)
        .first()
    )
    if not existing:
        db.add(SavedJob(user_id=current_user.id, job_id=job_id))
        db.commit()
    return {"saved": True, "job_id": job_id}


@router.delete("/jobs/{job_id}/save")
def unsave_job(job_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = (
        db.query(SavedJob)
        .filter(SavedJob.user_id == current_user.id, SavedJob.job_id == job_id)
        .first()
    )
    if existing:
        db.delete(existing)
        db.commit()
    return {"saved": False, "job_id": job_id}


@router.get("/saved-jobs")
def list_saved_jobs(
    location: str | None = Query(default=None),
    employment_type: str | None = Query(default=None),
    query: str | None = Query(default=None, max_length=255),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    base = (
        db.query(SavedJob)
        .join(SavedJob.job)
        .filter(SavedJob.user_id == current_user.id)
        .order_by(SavedJob.created_at.desc())
    )
    if location:
        base = base.filter(Job.location.ilike(f"%{location}%"))
    if employment_type and employment_type != "Any":
        base = base.filter(Job.employment_type.ilike(f"%{employment_type}%"))
    if query:
        base = base.filter(Job.title.ilike(f"%{query}%"))
    rows = base.all()

    saved_ids = {sj.job_id for sj in rows}
    payload = []
    for sj in rows:
        job = sj.job
        payload.append({
            "saved_at": sj.created_at.isoformat() if sj.created_at else None,
            "job": {
                "id": job.id,
                "analysis_id": job.analysis_id,
                "title": job.title,
                "company": job.company,
                "location": job.location,
                "description": job.description,
                "source": job.source,
                "salary": job.salary,
                "employment_type": job.employment_type,
                "experience": job.experience,
                "url": job.url,
                "posted_text": job.posted_text,
                "remote_type": job.remote_type,
                "is_saved": job.id in saved_ids,
            },
        })
    return {"saved_jobs": payload, "total": len(payload)}