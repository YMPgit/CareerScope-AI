from __future__ import annotations

from collections import Counter

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.resume import Resume
from app.models.user import User
from app.services import analysis_service

router = APIRouter()


@router.get("/{analysis_id}")
def skills_detail(analysis_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    analysis = analysis_service.get_owned_analysis(db, analysis_id, current_user.id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    skills = analysis_service.skills_payload(db, analysis)
    distribution = Counter(s["skill_gap_level"] for s in skills)
    resume_skills = []
    if analysis.resume_id:
        resume = db.get(Resume, analysis.resume_id)
        if resume and resume.parsed_data:
            resume_skills = resume.parsed_data.get("skills", [])

    return {
        "analysis_id": analysis.id,
        "status": analysis.status,
        "skills": skills,
        "gap_distribution": {"strong": distribution["strong"], "partial": distribution["partial"], "missing": distribution["missing"]},
        "resume_skills": resume_skills,
    }