from typing import Any, Optional

from pydantic import BaseModel, Field


class AnalysisCreate(BaseModel):
    target_role: str = Field(min_length=1, max_length=255)
    location: Optional[str] = Field(default=None, max_length=255)
    experience_level: Optional[str] = None
    employment_type: Optional[str] = None
    resume_id: Optional[int] = None


class AnalysisRename(BaseModel):
    title: Optional[str] = Field(default=None, max_length=255)


class AnalysisListItem(BaseModel):
    id: int
    title: Optional[str] = None
    target_role: str
    location: Optional[str] = None
    experience_level: Optional[str] = None
    status: str
    current_stage: Optional[str] = None
    progress: float = 0.0
    overall_match: Optional[float] = None
    jobs_count: int = 0
    created_at: Optional[str] = None
    completed_at: Optional[str] = None


class MarketSkill(BaseModel):
    name: str
    category: Optional[str] = None
    market_frequency: int = 0
    market_percentage: float = 0.0
    market_rank: int = 0
    user_has_skill: bool = False
    skill_gap_level: str = "missing"
    priority: str = "low"
    reason: Optional[str] = None


class JobOut(BaseModel):
    id: int
    analysis_id: int
    external_job_id: Optional[str] = None
    title: str
    company: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    source: Optional[str] = None
    salary: Optional[str] = None
    employment_type: Optional[str] = None
    experience: Optional[str] = None
    url: Optional[str] = None
    posted_text: Optional[str] = None
    posted_at: Optional[str] = None
    remote_type: Optional[str] = None
    is_saved: bool = False


class RoadmapItemOut(BaseModel):
    id: int
    week_number: int
    title: str
    description: Optional[str] = None
    learning_objective: Optional[str] = None
    why_it_matters: Optional[str] = None
    what_to_learn: Optional[str] = None
    practice: Optional[str] = None
    project_task: Optional[str] = None
    interview_prep: Optional[str] = None
    skills: list[str] = Field(default_factory=list)
    resources: list[str] = Field(default_factory=list)
    status: str = "pending"


class RoadmapOut(BaseModel):
    id: int
    analysis_id: int
    title: Optional[str] = None
    duration: int = 30
    items: list[RoadmapItemOut] = Field(default_factory=list)


class SourceOut(BaseModel):
    source_type: str
    count: Optional[int] = None
    url: Optional[str] = None
    label: Optional[str] = None


class AnalysisDetail(BaseModel):
    id: int
    title: Optional[str] = None
    target_role: str
    location: Optional[str] = None
    experience_level: Optional[str] = None
    employment_type: Optional[str] = None
    status: str
    current_stage: Optional[str] = None
    completed_stages: list[str] = Field(default_factory=list)
    progress: float = 0.0
    summary: Optional[str] = None
    overall_match: Optional[float] = None
    market_overview: Optional[dict[str, Any]] = None
    insights: Optional[dict[str, Any]] = None
    error_message: Optional[str] = None
    created_at: Optional[str] = None
    completed_at: Optional[str] = None
    resume: Optional[dict[str, Any]] = None
    skills: list[MarketSkill] = Field(default_factory=list)
    jobs: list[JobOut] = Field(default_factory=list)
    market_stats: Optional[dict[str, Any]] = None
    roadmap: Optional[RoadmapOut] = None
    sources: list[SourceOut] = Field(default_factory=list)