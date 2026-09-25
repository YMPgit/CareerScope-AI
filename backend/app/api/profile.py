from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.activity_log import ActivityLog
from app.models.analysis import Analysis
from app.models.analysis_skill import AnalysisSkill
from app.models.profile import UserProfile
from app.models.resume import Resume
from app.models.roadmap import Roadmap
from app.models.roadmap_item import RoadmapItem
from app.models.saved_job import SavedJob
from app.models.user import User
from app.schemas.dashboard import ProfileUpdate

router = APIRouter()


def _profile_dict(user: User) -> dict:
    prof = user.profile
    return {
        "full_name": user.full_name,
        "email": user.email,
        "target_role": prof.target_role if prof else None,
        "target_location": prof.target_location if prof else None,
        "experience_level": prof.experience_level if prof else None,
        "preferred_work_mode": prof.preferred_work_mode if prof else None,
        "career_interests": prof.career_interests if prof else None,
        "bio": prof.bio if prof else None,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


def _stats(db: Session, user: User) -> dict:
    analyses = db.query(Analysis).filter(Analysis.user_id == user.id).all()
    analysis_ids = [a.id for a in analyses] or [0]

    from app.models.job import Job

    jobs_count = db.query(Job).filter(Job.analysis_id.in_(analysis_ids)).count()
    saved_count = db.query(SavedJob).filter(SavedJob.user_id == user.id).count()
    resumes_count = db.query(Resume).filter(Resume.user_id == user.id).count()

    latest_completed = (
        db.query(Analysis)
        .filter(Analysis.user_id == user.id, Analysis.status == "completed")
        .order_by(Analysis.created_at.desc())
        .first()
    )
    last_analysis_date = latest_completed.created_at.isoformat() if latest_completed and latest_completed.created_at else None

    roadmap_progress = 0.0
    total_items = 0
    completed_items = 0
    for roadmap_id, in db.query(Roadmap.id).join(Analysis, Roadmap.analysis_id == Analysis.id).filter(Analysis.user_id == user.id):
        _items = db.query(RoadmapItem).filter(RoadmapItem.roadmap_id == roadmap_id)
        total_items += _items.count() or 0
        completed_items += _items.filter(RoadmapItem.status == "completed").count() or 0
    if total_items:
        roadmap_progress = round(completed_items / total_items * 100, 1)

    return {
        "analyses_count": len(analyses),
        "saved_jobs_count": saved_count,
        "roadmap_progress": roadmap_progress,
        "resumes_count": resumes_count,
        "last_analysis_date": last_analysis_date,
        "jobs_analyzed": jobs_count,
    }


@router.get("")
def get_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.add(ActivityLog(user_id=current_user.id, activity_type="profile_viewed"))
    db.commit()
    return {"profile": _profile_dict(current_user), "stats": _stats(db, current_user)}


@router.put("")
def update_profile(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prof = current_user.profile
    if not prof:
        prof = UserProfile(user_id=current_user.id)
        db.add(prof)

    if payload.full_name is not None:
        current_user.full_name = payload.full_name.strip()
    if payload.target_role is not None:
        prof.target_role = payload.target_role.strip() or None
    if payload.target_location is not None:
        prof.target_location = payload.target_location.strip() or None
    if payload.experience_level is not None:
        prof.experience_level = payload.experience_level.strip() or None
    if payload.preferred_work_mode is not None:
        prof.preferred_work_mode = payload.preferred_work_mode.strip() or None
    if payload.career_interests is not None:
        prof.career_interests = payload.career_interests.strip() or None
    if payload.bio is not None:
        prof.bio = payload.bio.strip() or None

    db.add(ActivityLog(user_id=current_user.id, activity_type="profile_updated"))
    db.commit()
    db.refresh(current_user)
    return {"profile": _profile_dict(current_user)}