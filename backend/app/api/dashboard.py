from __future__ import annotations

from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.analysis import Analysis
from app.models.analysis_skill import AnalysisSkill
from app.models.job import Job
from app.models.roadmap import Roadmap
from app.models.roadmap_item import RoadmapItem
from app.models.saved_job import SavedJob
from app.models.user import User
from app.services import analysis_service

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


@router.get("")
def get_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    analyses = (
        db.query(Analysis)
        .filter(Analysis.user_id == current_user.id)
        .order_by(Analysis.created_at.desc())
        .all()
    )
    completed = [a for a in analyses if a.status == "completed"]

    latest = completed[0] if completed else None

    # ---- Stats
    analysis_ids = [a.id for a in analyses] or [0]
    jobs_analyzed = db.query(Job).filter(Job.analysis_id.in_(analysis_ids)).count()
    saved_count = db.query(SavedJob).filter(SavedJob.user_id == current_user.id).count()
    resumes_count = len(current_user.resumes)

    roadmap_progress = 0.0
    total_items = completed_items = 0
    if latest and latest.roadmap:
        items = latest.roadmap.items
        total_items = len(items)
        completed_items = sum(1 for i in items if i.status == "completed")
        roadmap_progress = round(completed_items / total_items * 100, 1) if total_items else 0.0

    gap_counts = {"strong": 0, "partial": 0, "missing": 0}
    skill_demand = []
    match_chart = []
    market_overview = None
    if latest:
        skills = (
            db.query(AnalysisSkill)
            .filter(AnalysisSkill.analysis_id == latest.id)
            .order_by(AnalysisSkill.market_frequency.desc())
            .all()
        )
        skill_demand = [
            {
                "name": s.skill_name,
                "category": s.category,
                "market_frequency": s.market_frequency,
                "market_percentage": s.market_percentage,
                "market_rank": s.market_rank,
                "user_has_skill": s.user_has_skill,
                "skill_gap_level": s.skill_gap_level,
                "priority": s.priority,
                "reason": s.reason,
            }
            for s in skills[:15]
        ]
        gap_counts = dict(Counter(s["skill_gap_level"] for s in skill_demand))
        gap_counts.setdefault("strong", 0)
        gap_counts.setdefault("partial", 0)
        gap_counts.setdefault("missing", 0)

        top_skills = skill_demand[:6]
        for s in top_skills:
            match_chart.append({
                "name": s["name"],
                "market": s["market_percentage"],
                "user": s["market_percentage"] if s["user_has_skill"] else 0,
            })

        market_overview = latest.market_overview

    stats = {
        "analyses_count": len(analyses),
        "completed_analyses_count": len(completed),
        "jobs_analyzed": jobs_analyzed,
        "saved_jobs_count": saved_count,
        "resumes_count": resumes_count,
        "roadmap_progress": roadmap_progress,
        "roadmap_completed_items": completed_items,
        "roadmap_total_items": total_items,
        "last_analysis_date": latest.created_at.isoformat() if latest and latest.created_at else None,
        "current_overall_match": latest.overall_match if latest else None,
        "skill_gaps_count": gap_counts.get("missing", 0) + gap_counts.get("partial", 0),
        "target_role": latest.target_role if latest else (current_user.profile.target_role if current_user.profile else None),
        "target_location": latest.location if latest else (current_user.profile.target_location if current_user.profile else None),
    }

    recent = analysis_service.list_analyses(db, current_user.id)[:5]

    return {
        "profile": _profile_dict(current_user),
        "stats": stats,
        "skill_demand": skill_demand,
        "match_chart": match_chart,
        "gap_distribution": gap_counts,
        "market_overview": market_overview,
        "recent_analyses": recent,
    }