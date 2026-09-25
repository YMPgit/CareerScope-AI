from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.services import analysis_service

router = APIRouter()


def _owned_analysis(db: Session, analysis_id: int, user: User):
    analysis = analysis_service.get_owned_analysis(db, analysis_id, user.id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return analysis


@router.get("/{analysis_id}")
def market_detail(analysis_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    analysis = _owned_analysis(db, analysis_id, current_user)
    return {
        "analysis_id": analysis.id,
        "target_role": analysis.target_role,
        "location": analysis.location,
        "status": analysis.status,
        "market_stats": analysis.market_overview,
        "jobs": analysis_service.jobs_payload(db, analysis, current_user.id),
        "sources": analysis_service.sources_payload(analysis),
    }