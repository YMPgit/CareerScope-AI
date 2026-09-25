"""Agent node implementations for the LangGraph workflow."""
from __future__ import annotations

import re
import time
from datetime import datetime

from app.agents.state import WorkflowState
from app.core.logging import get_logger
from app.db.session import SessionLocal
from app.integrations.groq_client import GroqClient, GroqError
from app.integrations.serpapi import SerpApiClient, SerpApiError, dedupe_jobs
from app.models.activity_log import ActivityLog
from app.models.analysis import Analysis
from app.models.analysis_skill import AnalysisSkill
from app.models.job import Job
from app.models.resume import Resume
from app.models.roadmap import Roadmap
from app.models.roadmap_item import RoadmapItem
from app.models.skill import Skill
from app.services.market_stats import (
    compute_market_stats,
    extract_skill_frequencies,
    classify_work_mode,
)
from app.services.prompts import (
    INSIGHT_SYSTEM,
    MARKET_INTEL_SYSTEM,
    ROADMAP_SYSTEM,
    SKILL_GAP_SYSTEM,
    insight_user_prompt,
    market_intel_user_prompt,
    roadmap_user_prompt,
    skill_gap_user_prompt,
)
from app.services.resume_parser import parse_resume

logger = get_logger("agents")


_TOTAL_STAGES = 9  # queued + 8 agent nodes

# Pacing: keep each stage visible long enough for the progress UI to feel alive.
_STAGE_PACING_S = 2.0
# Minimum total runtime so an analysis visibly "takes some time" to finish.
_MIN_RUNTIME_S = 35.0


def _set_stage(analysis_id: int, stage: str) -> None:
    time.sleep(_STAGE_PACING_S)
    db = SessionLocal()
    try:
        analysis = db.get(Analysis, analysis_id)
        if analysis:
            analysis.current_stage = stage
            stages = list(analysis.completed_stages or [])
            if stage not in stages:
                stages.append(stage)
            analysis.completed_stages = stages
            analysis.progress = round(len(stages) / float(_TOTAL_STAGES) * 100, 1)
            db.commit()
    except Exception:  # noqa: BLE001
        logger.exception("Failed to update stage for analysis %s", analysis_id)
    finally:
        db.close()


def _log_activity(user_id: int, activity_type: str, metadata: dict | None = None) -> None:
    db = SessionLocal()
    try:
        db.add(ActivityLog(user_id=user_id, activity_type=activity_type, meta=metadata or {}))
        db.commit()
    except Exception:  # noqa: BLE001
        logger.warning("Could not log activity %s", activity_type)
    finally:
        db.close()


# --------------------------------------------------------------------- #
def run_manager(state: WorkflowState) -> WorkflowState:
    analysis_id = state.get("analysis_id")
    _set_stage(analysis_id, "manager")
    if not state.get("resume_text") and not state.get("resume_parsed"):
        raise ValueError("No resume content found for analysis")
    state["started_at"] = time.monotonic()
    return state


# --------------------------------------------------------------------- #
def run_resume_analyzer(state: WorkflowState) -> WorkflowState:
    _set_stage(state["analysis_id"], "resume_analyzer")

    db = SessionLocal()
    try:
        analysis = db.get(Analysis, state["analysis_id"])
        parsed = None
        resume_text = state.get("resume_text") or ""
        if analysis and analysis.resume_id:
            resume = db.get(Resume, analysis.resume_id)
            if resume and resume.parsed_data:
                parsed = resume.parsed_data

        if not parsed:
            if not resume_text:
                raise ValueError("Resume text is empty - cannot extract skills.")
            parsed = parse_resume(resume_text)
            if state.get("resume_id") and analysis and analysis.resume_id:
                resume = db.get(Resume, analysis.resume_id)
                if resume:
                    resume.parsed_data = parsed
                    db.commit()

        state["resume_parsed"] = parsed
        resume_skills = [s for s in parsed.get("skills", [])]
        resume_tools = [t for t in parsed.get("tools", [])]
        # merge tools into skills for gap analysis
        state["resume_skills"] = _dedupe(resume_skills + resume_tools)
    finally:
        db.close()
    return state


# --------------------------------------------------------------------- #
def run_job_market(state: WorkflowState) -> WorkflowState:
    _set_stage(state["analysis_id"], "job_market")

    client = SerpApiClient()
    query = state["target_role"]
    location = state.get("location") or ""
    experience = state.get("experience_level") or ""

    seniority = _experience_seniority(experience)
    level_text = (experience or "").lower().strip()
    # Leading "Senior" in the query degrades Google Jobs matching, so only Mid
    # and custom levels are appended; the seniority filter does the rest.
    if seniority == "mid":
        search_query = f"{query} Mid Level jobs"
    elif level_text in ("", "any", "not specified", "fresher", "entry level", "entry", "junior", "senior"):
        search_query = f"{query} jobs"
    else:
        search_query = f"{query} {experience} jobs"

    sources: list[dict] = []
    news_results: list[dict] = []
    search_results: list[dict] = []
    jobs: list[dict] = []

    # 1. Live jobs via SerpApi Google Jobs.
    # Entry-level users get several query variants so filtering leaves enough.
    if seniority == "junior":
        job_queries = [
            f"{query} Fresher jobs",
            f"{query} Entry Level jobs",
            f"{query} 0-2 years jobs",
        ]
    else:
        job_queries = [search_query]

    last_error: SerpApiError | None = None
    for job_query in job_queries:
        try:
            jobs.extend(client.google_jobs(job_query, location=location, num=40))
        except SerpApiError as exc:
            last_error = exc
            logger.info("Job fetch skipped for %r: %s", job_query, exc)
    if not jobs:
        raise last_error or SerpApiError("Could not fetch live jobs.")
    jobs = dedupe_jobs(jobs)
    jobs = _filter_jobs_by_experience(jobs, seniority)
    sources.append({
        "source_type": "google_jobs",
        "label": f"Google Jobs results for '{search_query}'",
        "count": len(jobs),
        "url": None,
        "query": search_query,
        "links": [
            {
                "title": job.get("title"),
                "url": job.get("url"),
                "company": job.get("company"),
                "source_type": "google_jobs",
            }
            for job in jobs
            if job.get("url")
        ][:8],
    })

    # 2. Web search for market research (best effort)
    try:
        search_results = client.web_search(f"{query} {location} skills demand 2026", num=8)
        sources.append({
            "source_type": "google_search",
            "label": "Google Search - market research",
            "count": len(search_results),
            "url": None,
            "links": [
                {
                    "title": r.get("title") or r.get("link"),
                    "url": r["link"],
                    "source_type": "google_search",
                }
                for r in search_results
                if r.get("link")
            ][:8],
        })
    except SerpApiError as exc:
        logger.info("Web search skipped: %s", exc)
        sources.append({"source_type": "google_search", "label": "Google Search unavailable", "count": 0, "url": None})

    # 3. News (best effort)
    try:
        news_results = client.news(f"{query} {location} jobs market", num=6)
        sources.append({
            "source_type": "google_news",
            "label": "Google News - job market",
            "count": len(news_results),
            "url": None,
            "links": [
                {
                    "title": r.get("title") or r.get("link"),
                    "url": r["link"],
                    "source_type": "google_news",
                }
                for r in news_results
                if r.get("link")
            ][:8],
        })
    except SerpApiError as exc:
        logger.info("News search skipped: %s", exc)
        sources.append({"source_type": "google_news", "label": "Google News unavailable", "count": 0, "url": None})

    # classify work mode / employment type for each job
    for job in jobs:
        job["remote_type"] = classify_work_mode(job)

    state["jobs"] = jobs
    state["search_results"] = search_results
    state["news_results"] = news_results
    state["sources"] = sources

    stats = compute_market_stats(jobs)
    stats["sources"] = sources
    state["market_stats"] = stats
    _log_activity(state["user_id"], "market_fetched", {"role": query, "jobs": len(jobs)})
    return state


# --------------------------------------------------------------------- #
def run_skill_intelligence(state: WorkflowState) -> WorkflowState:
    _set_stage(state["analysis_id"], "skill_intelligence")
    market_skills = extract_skill_frequencies(state.get("jobs") or [])
    state["market_skills"] = market_skills

    # Market interpretation via Groq (Python computes the numbers, LLM explains).
    market_intel: dict = {}
    if state["market_stats"].get("total_jobs"):
        client = GroqClient()
        prompt = market_intel_user_prompt(
            state["target_role"],
            state.get("location") or "",
            state.get("experience_level") or "",
            state["market_stats"],
        )
        market_intel = client.chat_json(MARKET_INTEL_SYSTEM, prompt)
    state["market_intel"] = market_intel
    return state


# --------------------------------------------------------------------- #
_GAP_ORDER = {"strong": 0, "partial": 1, "missing": 2}
_PRIORITY_ORDER = {"high": 0, "medium": 1, "low": 2}


def run_skill_gap(state: WorkflowState) -> WorkflowState:
    _set_stage(state["analysis_id"], "skill_gap")

    resume_skills = state.get("resume_skills") or []
    market_skills = state.get("market_skills") or []

    # Deterministic level assignment (evidence-based).
    gap_rows = []
    for ms in market_skills:
        name = ms["name"]
        level = _deterministic_gap_level(name, resume_skills)
        gap_rows.append({**ms, "skill_gap_level": level, "priority": "low", "reason": None})

    # LLM adds priority + reasoning.
    try:
        client = GroqClient()
        prompt = skill_gap_user_prompt(state["target_role"], resume_skills, market_skills)
        llm_out = client.chat_json(SKILL_GAP_SYSTEM, prompt)
        llm_rows = llm_out.get("skills") or []
        llm_map = {r.get("name", "").strip().lower(): r for r in llm_rows if isinstance(r, dict)}
    except GroqError as exc:
        logger.warning("Skill-gap reasoning unavailable: %s", exc)
        llm_map = {}
        # deterministic fallback priority based purely on market frequency
        for row in gap_rows:
            row["priority"] = _auto_priority(row)

    for row in gap_rows:
        info = llm_map.get(row["name"].lower())
        if info:
            row["priority"] = (info.get("priority") or "low") if (info.get("priority") or "low") in _PRIORITY_ORDER else "low"
            row["reason"] = info.get("reason")

    gap_rows.sort(key=lambda r: (_GAP_ORDER[r["skill_gap_level"]], _PRIORITY_ORDER[r["priority"]]))
    state["skill_gaps"] = gap_rows
    state["overall_match"] = _compute_alignment_score(gap_rows)
    return state


def _deterministic_gap_level(name: str, resume_skills: list[str]) -> str:
    resume_norm = {_norm(s) for s in resume_skills}
    target_norm = _norm(name)
    if target_norm in resume_norm:
        return "strong"
    target_tokens = {t for t in target_norm.replace("-", " ").split() if len(t) > 2}
    for rs in resume_skills:
        rs_tokens = {t for t in _norm(rs).replace("-", " ").split() if len(t) > 2}
        if target_tokens and rs_tokens and (target_tokens & rs_tokens):
            return "partial"
        # e.g. market "Advanced SQL" vs resume "SQL"
        if target_norm.endswith(rs_norm := _norm(rs)) or rs_norm.endswith(target_norm):
            return "partial"
    return "missing"


def _norm(x: str) -> str:
    return x.strip().lower().replace("+", "")


def _auto_priority(row: dict) -> str:
    pct = row.get("market_percentage", 0)
    if pct >= 40:
        return "high"
    if pct >= 20:
        return "medium"
    return "low"


def _compute_alignment_score(gap_rows: list[dict]) -> float | None:
    """CareerScope Market Alignment Score (deterministic, weighted by demand)."""
    if not gap_rows:
        return None
    total_weight = sum(r.get("market_frequency", 0) or 0 for r in gap_rows)
    if total_weight <= 0:
        return None
    owned_weight = sum(
        (r.get("market_frequency", 0) or 0) for r in gap_rows if r.get("skill_gap_level") in ("strong", "partial")
    )
    score = (owned_weight / total_weight) * 100
    return round(min(score, 98.0), 1)


# --------------------------------------------------------------------- #
def run_career_planner(state: WorkflowState) -> WorkflowState:
    _set_stage(state["analysis_id"], "career_planner")
    client = GroqClient()
    high_gaps = [
        g for g in state.get("skill_gaps") or []
        if g.get("priority") in ("high", "medium") and g.get("skill_gap_level") in ("missing", "partial")
    ]
    if not high_gaps:
        high_gaps = [g for g in (state.get("skill_gaps") or []) if g.get("skill_gap_level") == "missing"][:5]

    overview = (state.get("market_intel") or {}).get("market_overview") or "No market overview available."
    prompt = roadmap_user_prompt(
        state["target_role"],
        state.get("location") or "",
        state.get("experience_level") or "",
        state.get("resume_skills") or [],
        high_gaps,
        overview,
    )
    roadmap = client.chat_json(ROADMAP_SYSTEM, prompt)
    weeks = roadmap.get("weeks") or []
    roadmap["duration"] = 30
    roadmap["weeks"] = weeks
    state["roadmap"] = roadmap
    return state


# --------------------------------------------------------------------- #
def run_insight(state: WorkflowState) -> WorkflowState:
    _set_stage(state["analysis_id"], "insight")
    client = GroqClient()
    stats = state.get("market_stats") or {}
    gaps = state.get("skill_gaps") or []
    roadmap_title = (state.get("roadmap") or {}).get("title") or "Career Roadmap"
    prompt = insight_user_prompt(
        state["target_role"],
        state.get("location") or "",
        state.get("overall_match") or 0,
        stats,
        state.get("resume_skills") or [],
        gaps,
        roadmap_title,
    )
    state["insights"] = client.chat_json(INSIGHT_SYSTEM, prompt)
    return state


# --------------------------------------------------------------------- #
def run_persist(state: WorkflowState) -> WorkflowState:
    _set_stage(state["analysis_id"], "persist")

    # Guarantee the analysis visibly works for a while, even when the LLM is fast.
    started = state.get("started_at")
    if started:
        remaining = _MIN_RUNTIME_S - (time.monotonic() - started)
        if remaining > 0:
            time.sleep(remaining)

    db = SessionLocal()
    try:
        analysis_id = state["analysis_id"]
        analysis = db.get(Analysis, analysis_id)
        if not analysis:
            raise ValueError("Analysis disappeared during pipeline")

        # Jobs
        for job in state.get("jobs") or []:
            existing = (
                db.query(Job)
                .filter(Job.analysis_id == analysis_id)
                .filter(Job.title == job.get("title", ""))
                .filter(Job.company == job.get("company"))
                .first()
            )
            if existing:
                continue
            db.add(Job(
                analysis_id=analysis_id,
                external_job_id=job.get("external_job_id"),
                title=job.get("title") or "",
                company=job.get("company"),
                location=job.get("location"),
                description=job.get("description"),
                source="Google Jobs",
                salary=job.get("salary"),
                employment_type=job.get("employment_type"),
                experience=job.get("experience"),
                url=job.get("url"),
                posted_text=job.get("posted_text"),
                posted_at=job.get("posted_at"),
                remote_type=job.get("remote_type"),
                raw_data=job.get("raw_data") or {},
            ))

        # Skills (upsert into skills catalog + analysis rows)
        for row in (state.get("skill_gaps") or [])[:30]:
            skill = db.query(Skill).filter(Skill.name == row["name"]).first()
            if not skill:
                skill = Skill(name=row["name"], category=row.get("category"))
                db.add(skill)
                db.flush()
            db.add(AnalysisSkill(
                analysis_id=analysis_id,
                skill_id=skill.id,
                skill_name=row["name"],
                category=row.get("category"),
                market_frequency=row.get("market_frequency", 0),
                market_percentage=row.get("market_percentage", 0.0),
                market_rank=row.get("market_rank", 0),
                user_has_skill=row.get("skill_gap_level") == "strong",
                skill_gap_level=row.get("skill_gap_level", "missing"),
                priority=row.get("priority", "low"),
                reason=row.get("reason"),
            ))

        # Roadmap
        roadmap_data = state.get("roadmap") or {}
        existing_roadmap = db.query(Roadmap).filter(Roadmap.analysis_id == analysis_id).first()
        if existing_roadmap:
            db.query(RoadmapItem).filter(RoadmapItem.roadmap_id == existing_roadmap.id).delete()
            roadmap = existing_roadmap
        else:
            roadmap = Roadmap(analysis_id=analysis_id)
            db.add(roadmap)
        roadmap.title = roadmap_data.get("title") or "30-Day Career Roadmap"
        roadmap.duration = int(roadmap_data.get("duration") or 30)
        roadmap.content = roadmap_data
        db.flush()

        for idx, week in enumerate((roadmap_data.get("weeks") or []), start=1):
            db.add(RoadmapItem(
                roadmap_id=roadmap.id,
                week_number=week.get("week", idx),
                title=week.get("title") or f"Week {idx}",
                description=week.get("description"),
                learning_objective=week.get("learning_objective"),
                why_it_matters=week.get("why_it_matters"),
                what_to_learn=week.get("what_to_learn"),
                practice=week.get("practice"),
                project_task=week.get("project_task"),
                interview_prep=week.get("interview_prep"),
                skills=week.get("skills") or [],
                resources=week.get("resources") or [],
                status="pending",
            ))

        # Finalize analysis row
        insights = state.get("insights") or {}
        analysis.summary = insights.get("summary")
        analysis.overall_match = state.get("overall_match")
        analysis.market_overview = state.get("market_stats") or {}
        analysis.insights = insights
        analysis.status = "completed"
        analysis.current_stage = "completed"
        analysis.completed_at = datetime.utcnow()
        stages = list(analysis.completed_stages or [])
        if "completed" not in stages:
            stages.append("completed")
        analysis.completed_stages = stages
        analysis.progress = 100.0
        _log_activity(state["user_id"], "analysis_completed", {"analysis_id": analysis_id})
        db.commit()
    finally:
        db.close()
    return state


_SENIOR_TITLE_WORDS = (
    "senior", "sr ", "sr.", "lead ", "lead-", "principal", "staff", "head of",
    "director", "vp ", "vp.", "vice president", "chief", "architect", "executive",
)
_TOP_TIER_WORDS = (
    "head of", "director", "vp ", "vp.", "vice president", "chief", "principal",
    "staff", "executive",
)
_JUNIOR_TITLE_WORDS = (
    "fresher", "entry", "intern", "internship", "trainee", "graduate", "junior",
    "apprentice", "assistant",
)


def _experience_seniority(level: str | None) -> str | None:
    """Map a user-selected experience level to a seniority bucket."""
    if not level:
        return None
    text = level.lower().strip()
    for kw in ("fresher", "entry", "junior", "intern", "internship", "graduate", "0-1", "0 to 1", "0-2"):
        if kw in text:
            return "junior"
    for kw in ("senior", "sr", "lead", "principal", "experienced", "staff", "head", "director", "5+", "5 plus"):
        if kw in text:
            return "senior"
    for kw in ("mid", "middle", "intermediate", "1-3", "1 to 3", "2-5", "2 to 5", "3-5", "3 to 6"):
        if kw in text:
            return "mid"
    return None


def _years_required(job: dict) -> int | None:
    """Lower bound of the years of experience a job asks for."""
    m = re.search(r"(\d+)\s*[-+–]?\s*\d*\s*years?", (job.get("experience") or "").lower())
    if m:
        return int(m.group(1))
    m = re.search(r"(\d+)\s*\+?\s*years?", (job.get("description") or "").lower())
    if m:
        return int(m.group(1))
    return None


def _filter_jobs_by_experience(jobs: list[dict], seniority: str | None) -> list[dict]:
    """Keep only jobs consistent with the requested experience level."""
    if not seniority:
        return jobs
    out = []
    for job in jobs:
        title = (job.get("title") or "").lower()
        years = _years_required(job)
        if seniority == "junior":
            if any(w in title for w in _SENIOR_TITLE_WORDS):
                continue
            if years is not None and years >= 2:
                continue
        elif seniority == "mid":
            if any(w in title for w in _JUNIOR_TITLE_WORDS):
                continue
            if any(w in title for w in _TOP_TIER_WORDS):
                continue
            if years is not None and years >= 6:
                continue
        elif seniority == "senior":
            if any(w in title for w in _JUNIOR_TITLE_WORDS):
                continue
            if years is not None and years <= 1:
                continue
        out.append(job)
    return out


def _dedupe(items: list[str]) -> list[str]:
    seen = set()
    out = []
    for i in items:
        key = _norm(i)
        if key in seen:
            continue
        seen.add(key)
        out.append(i)
    return out