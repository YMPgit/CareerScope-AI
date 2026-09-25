from typing import Any, Optional

from pydantic import BaseModel, Field

from app.schemas.analysis import MarketSkill


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    target_role: Optional[str] = Field(default=None, max_length=255)
    target_location: Optional[str] = Field(default=None, max_length=255)
    experience_level: Optional[str] = Field(default=None, max_length=100)
    preferred_work_mode: Optional[str] = Field(default=None, max_length=50)
    career_interests: Optional[str] = None
    bio: Optional[str] = None


class ProfileOut(BaseModel):
    full_name: str
    email: str
    target_role: Optional[str] = None
    target_location: Optional[str] = None
    experience_level: Optional[str] = None
    preferred_work_mode: Optional[str] = None
    career_interests: Optional[str] = None
    bio: Optional[str] = None
    created_at: Optional[str] = None


class ProfileStats(BaseModel):
    analyses_count: int = 0
    saved_jobs_count: int = 0
    roadmap_progress: float = 0.0
    resumes_count: int = 0
    last_analysis_date: Optional[str] = None


class ProfileResponse(BaseModel):
    profile: ProfileOut
    stats: ProfileStats


class DashboardResponse(BaseModel):
    profile: ProfileOut
    stats: dict[str, Any]
    skill_demand: list[MarketSkill] = Field(default_factory=list)
    match_chart: list[dict[str, Any]] = Field(default_factory=list)
    gap_distribution: dict[str, int] = Field(default_factory=dict)
    market_overview: Optional[dict[str, Any]] = None
    recent_analyses: list[Any] = Field(default_factory=list)


class MarketResponse(BaseModel):
    analysis_id: int
    target_role: str
    location: Optional[str] = None
    status: str
    market_stats: Optional[dict[str, Any]] = None
    jobs: list[Any] = Field(default_factory=list)
    sources: list[Any] = Field(default_factory=list)


class SkillsResponse(BaseModel):
    analysis_id: int
    status: str
    skills: list[MarketSkill] = Field(default_factory=list)
    gap_distribution: dict[str, int] = Field(default_factory=dict)
    resume_skills: list[str] = Field(default_factory=list)


class JobSaveResponse(BaseModel):
    saved: bool
    job_id: int


class SavedJobsResponse(BaseModel):
    saved_jobs: list[Any] = Field(default_factory=list)
    total: int = 0