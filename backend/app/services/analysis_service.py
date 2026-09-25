"""Analysis orchestration: create, run the LangGraph pipeline, and serialize results."""
from __future__ import annotations

import asyncio
import traceback
from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.agents.graph import workflow
from app.core.logging import get_logger
from app.core.config import settings
from app.db.session import SessionLocal
from app.integrations.serpapi import apply_url_from_raw, apply_platform_from_raw
from app.models.analysis import Analysis
from app.models.analysis_skill import AnalysisSkill
from app.models.job import Job
from app.models.roadmap import Roadmap
from app.models.roadmap_item import RoadmapItem
from app.models.saved_job import SavedJob
from app.models.search import Search
from app.services.email_service import send_email  # noqa: F401  (import kept for parity)

logger = get_logger("analysis_service")

OCCUPIED = object()


def iso(dt) -> str | None:
    if not dt:
        return None
    return dt.isoformat() if hasattr(dt, "isoformat") else str(dt)


# --------------------------------------------------------------------- #
# Creation & scheduling
# --------------------------------------------------------------------- #
def create_analysis(
    db: Session,
    user_id: int,
    target_role: str,
    location: str | None,
    experience_level: str | None,
    employment_type: str | None,
    resume_id: int | None,
) -> Analysis:
    default_title = f"{target_role}"
    if location:
        default_title += f" — {location}"
    analysis = Analysis(
        user_id=user_id,
        resume_id=resume_id,
        target_role=target_role,
        location=location,
        experience_level=experience_level,
        employment_type=employment_type,
        title=default_title,
        status="queued",
        current_stage="queued",
        completed_stages=["queued"],
        progress=0.0,
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    db.add(Search(user_id=user_id, query=target_role, location=location, search_type="google_jobs"))
    db.commit()
    return analysis


def schedule_run(analysis_id: int) -> None:
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    loop.run_in_executor(None, run_pipeline, analysis_id)


# --------------------------------------------------------------------- #
# Pipeline runner
# --------------------------------------------------------------------- #
def run_pipeline(analysis_id: int) -> None:
    db = SessionLocal()
    try:
        analysis = db.get(Analysis, analysis_id)
        if not analysis:
            logger.error("Analysis %s not found", analysis_id)
            return
        analysis.status = "processing"
        analysis.error_message = None
        db.commit()

        resume_text = None
        parsed = None
        if analysis.resume_id:
            from app.models.resume import Resume

            resume = db.get(Resume, analysis.resume_id)
            resume_text = resume.raw_text if resume else None
            parsed = resume.parsed_data if resume else None

        initial_state = {
            "analysis_id": analysis.id,
            "user_id": analysis.user_id,
            "resume_id": analysis.resume_id,
            "resume_text": resume_text or "",
            "resume_parsed": parsed or {},
            "target_role": analysis.target_role,
            "location": analysis.location,
            "experience_level": analysis.experience_level,
            "employment_type": analysis.employment_type,
            "jobs": [],
            "market_stats": {},
            "sources": [],
            "search_results": [],
            "news_results": [],
            "resume_skills": [],
            "market_skills": [],
            "skill_gaps": [],
            "overall_match": None,
            "market_intel": {},
            "roadmap": {},
            "insights": {},
        }
        db.close()

        chunks = list(workflow.stream(initial_state, stream_mode="updates"))
        # stream() already settles final state; blocks until completion
        final_state = {}
        for chunk in chunks:
            for node_name, payload in chunk.items():
                final_state = payload

        db = SessionLocal()
        analysis = db.get(Analysis, analysis_id)
        if analysis and analysis.status != "completed":
            analysis.status = "completed"
            analysis.completed_at = datetime.utcnow()
            db.commit()

    except Exception as exc:  # noqa: BLE001
        logger.error("Analysis %s failed:\n%s", analysis_id, traceback.format_exc())
        db = SessionLocal()
        try:
            analysis = db.get(Analysis, analysis_id)
            if analysis:
                analysis.status = "failed"
                analysis.error_message = _friendly_pipeline_error(exc)
                analysis.current_stage = "failed"
                db.commit()
        finally:
            db.close()
    finally:
        try:
            db.close()
        except Exception:  # noqa: BLE001
            pass


def _friendly_pipeline_error(exc: Exception) -> str:
    msg = str(exc) or exc.__class__.__name__
    lowered = msg.lower()
    if any(k in lowered for k in ("rate limit", "429", "too many requests")):
        return "The analysis service is busy right now. Please wait a moment and try again."
    if any(k in lowered for k in ("timed out", "timeout", "connection", "internet")):
        return "The live data source timed out. Please check your connection and try again."
    if any(k in lowered for k in ("api key", "invalid key", "unauthorized", "forbidden", "authentication")):
        return "This analysis couldn't be authorized. Please try again later."
    if any(k in lowered for k in ("quota", "capacity", "model", "llm", "groq", "serpapi", "malformed json", "empty response")):
        return "Something went wrong while generating your analysis. Please try again."


# --------------------------------------------------------------------- #
# Serialization
# --------------------------------------------------------------------- #
def serialize_analysis(analysis: Analysis, jobs_count: int | None = None) -> dict:
    if jobs_count is None:
        jobs_count = len(analysis.jobs) if analysis.jobs else 0
    return {
        "id": analysis.id,
        "title": analysis.title,
        "target_role": analysis.target_role,
        "location": analysis.location,
        "experience_level": analysis.experience_level,
        "employment_type": analysis.employment_type,
        "status": analysis.status,
        "current_stage": analysis.current_stage,
        "progress": analysis.progress,
        "overall_match": analysis.overall_match,
        "jobs_count": jobs_count,
        "created_at": iso(analysis.created_at),
        "completed_at": iso(analysis.completed_at),
    }


def list_analyses(db: Session, user_id: int) -> list[dict]:
    rows = (
        db.query(Analysis)
        .filter(Analysis.user_id == user_id)
        .order_by(Analysis.created_at.desc())
        .all()
    )
    counts = dict(
        db.query(Job.analysis_id, func.count(Job.id))
        .filter(Job.analysis_id.in_([a.id for a in rows] or [0]))
        .group_by(Job.analysis_id)
        .all()
    )
    return [serialize_analysis(a, counts.get(a.id, 0)) for a in rows]


def get_owned_analysis(db: Session, analysis_id: int, user_id: int) -> Analysis:
    return (
        db.query(Analysis)
        .filter(Analysis.id == analysis_id, Analysis.user_id == user_id)
        .first()
    )


def jobs_payload(db: Session, analysis: Analysis, user_id: int) -> list[dict]:
    saved_ids = {
        sj.job_id
        for sj in db.query(SavedJob).filter(
            SavedJob.user_id == user_id,
            SavedJob.job_id.in_([j.id for j in analysis.jobs] or [0]),
        )
    }
    out = []
    for job in analysis.jobs:
        raw = job.raw_data or {}
        # Prefer the direct application portal link derived from the cached raw
        # fetch data; fall back to the link captured at analysis time.
        resolved_url = apply_url_from_raw(raw) or job.url
        apply_via = apply_platform_from_raw(raw) or None
        out.append({
            "id": job.id,
            "analysis_id": job.analysis_id,
            "external_job_id": job.external_job_id,
            "title": job.title,
            "company": job.company,
            "location": job.location,
            "description": job.description,
            "source": job.source,
            "salary": job.salary,
            "employment_type": job.employment_type,
            "experience": job.experience,
            "url": resolved_url,
            "apply_via": apply_via,
            "posted_text": job.posted_text,
            "posted_at": iso(job.posted_at),
            "remote_type": job.remote_type,
            "is_saved": job.id in saved_ids,
        })
    return out


def roadmap_payload(db: Session, analysis: Analysis) -> dict | None:
    roadmap = db.query(Roadmap).filter(Roadmap.analysis_id == analysis.id).first()
    if not roadmap:
        return None
    items = (
        db.query(RoadmapItem)
        .filter(RoadmapItem.roadmap_id == roadmap.id)
        .order_by(RoadmapItem.week_number)
        .all()
    )
    return {
        "id": roadmap.id,
        "analysis_id": roadmap.analysis_id,
        "title": roadmap.title,
        "duration": roadmap.duration,
        "items": [
            {
                "id": item.id,
                "week_number": item.week_number,
                "title": item.title,
                "description": item.description,
                "learning_objective": item.learning_objective,
                "why_it_matters": item.why_it_matters,
                "what_to_learn": item.what_to_learn,
                "practice": item.practice,
                "project_task": item.project_task,
                "interview_prep": item.interview_prep,
                "skills": item.skills or [],
                "resources": item.resources or [],
                "status": item.status,
            }
            for item in items
        ],
    }


def skills_payload(db: Session, analysis: Analysis) -> list[dict]:
    rows = (
        db.query(AnalysisSkill)
        .filter(AnalysisSkill.analysis_id == analysis.id)
        .order_by(AnalysisSkill.market_frequency.desc())
        .all()
    )
    return [
        {
            "name": r.skill_name,
            "category": r.category,
            "market_frequency": r.market_frequency,
            "market_percentage": r.market_percentage,
            "market_rank": r.market_rank,
            "user_has_skill": r.user_has_skill,
            "skill_gap_level": r.skill_gap_level,
            "priority": r.priority,
            "reason": r.reason,
        }
        for r in rows
    ]


def build_analysis_detail(db: Session, analysis: Analysis, user_id: int) -> dict:
    resume = None
    if analysis.resume_id:
        from app.models.resume import Resume

        r = db.get(Resume, analysis.resume_id)
        if r:
            resume = {
                "id": r.id,
                "file_name": r.file_name,
                "parsed_data": r.parsed_data,
            }

    stages = analysis.completed_stages or []
    return {
        "id": analysis.id,
        "title": analysis.title,
        "target_role": analysis.target_role,
        "location": analysis.location,
        "experience_level": analysis.experience_level,
        "employment_type": analysis.employment_type,
        "status": analysis.status,
        "current_stage": analysis.current_stage,
        "completed_stages": stages,
        "progress": analysis.progress,
        "summary": analysis.summary,
        "overall_match": analysis.overall_match,
        "market_overview": analysis.market_overview,
        "insights": analysis.insights,
        "error_message": analysis.error_message,
        "created_at": iso(analysis.created_at),
        "completed_at": iso(analysis.completed_at),
        "resume": resume,
        "skills": skills_payload(db, analysis),
        "jobs": jobs_payload(db, analysis, user_id),
        "market_stats": analysis.market_overview,
        "roadmap": roadmap_payload(db, analysis),
        "sources": sources_payload(analysis),
    }


def sources_payload(analysis: Analysis) -> list[dict]:
    overview = analysis.market_overview or {}
    raw_sources = overview.get("sources")
    if not raw_sources:
        return []
    out = []
    for s in raw_sources:
        if not isinstance(s, dict):
            continue
        item = {
            "source_type": s.get("source_type", "unknown"),
            "label": s.get("label"),
            "count": s.get("count", 0),
            "query": s.get("query"),
            "url": s.get("url"),
            "links": _normalize_source_links(s.get("links")),
        }
        # Job evidence always comes from the persisted postings so every
        # analysis (including older ones) shows the real listings behind it.
        if s.get("source_type") == "google_jobs":
            job_links = []
            for job in analysis.jobs or []:
                url = apply_url_from_raw(job.raw_data or {}) or job.url
                if not url:
                    continue
                job_links.append({
                    "title": job.title,
                    "url": url,
                    "company": job.company,
                    "source_type": "google_jobs",
                })
                if len(job_links) >= 8:
                    break
            item["links"] = job_links
            if job_links and not item["count"]:
                item["count"] = len(job_links)
        out.append(item)
    return out


def _normalize_source_links(links) -> list[dict]:
    out = []
    for link in links or []:
        if isinstance(link, dict):
            out.append({
                "title": link.get("title") or link.get("url"),
                "url": link.get("url"),
                "company": link.get("company"),
                "source_type": link.get("source_type"),
            })
        elif isinstance(link, str):
            out.append({"title": link, "url": link, "company": None, "source_type": None})
        if len(out) >= 8:
            break
    return out