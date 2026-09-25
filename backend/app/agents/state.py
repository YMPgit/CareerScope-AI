from typing import Any, TypedDict


class WorkflowState(TypedDict, total=False):
    started_at: float
    analysis_id: int
    user_id: int
    resume_id: int | None
    resume_text: str
    resume_parsed: dict[str, Any]

    target_role: str
    location: str
    experience_level: str
    employment_type: str

    jobs: list[dict[str, Any]]
    market_stats: dict[str, Any]
    search_results: list[dict[str, Any]]
    news_results: list[dict[str, Any]]
    sources: list[dict[str, Any]]

    resume_skills: list[str]
    market_skills: list[dict[str, Any]]
    skill_gaps: list[dict[str, Any]]
    overall_match: float | None

    market_intel: dict[str, Any]
    roadmap: dict[str, Any]
    insights: dict[str, Any]


AGENT_STAGES: list[tuple[str, str]] = [
    ("manager", "Initializing the analysis"),
    ("resume_analyzer", "Analyzing your resume"),
    ("job_market", "Searching live job market"),
    ("skill_intelligence", "Extracting market skill demand"),
    ("skill_gap", "Comparing skills with the market"),
    ("career_planner", "Building your career roadmap"),
    ("insight", "Writing your personalized report"),
    ("persist", "Saving your results"),
]

STAGE_LABELS: dict[str, str] = dict(AGENT_STAGES)