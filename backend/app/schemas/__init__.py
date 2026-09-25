from pydantic import BaseModel

from app.schemas.analysis import (
    AnalysisCreate,
    AnalysisDetail,
    AnalysisListItem,
    AnalysisRename,
    JobOut,
    MarketSkill,
    RoadmapItemOut,
    RoadmapOut,
    SourceOut,
)
from app.schemas.auth import (
    ChangePasswordRequest,
    ForgotPasswordOut,
    ForgotPasswordRequest,
    MessageOut,
    ResetPasswordRequest,
    SigninRequest,
    SignupRequest,
    UserOut,
)
from app.schemas.dashboard import (
    DashboardResponse,
    MarketResponse,
    ProfileOut,
    ProfileResponse,
    ProfileStats,
    ProfileUpdate,
    SavedJobsResponse,
    SkillsResponse,
)


class JobSaveResponse(BaseModel):
    saved: bool
    job_id: int


__all__ = [
    "AnalysisCreate",
    "AnalysisDetail",
    "AnalysisListItem",
    "AnalysisRename",
    "ChangePasswordRequest",
    "DashboardResponse",
    "ForgotPasswordOut",
    "ForgotPasswordRequest",
    "JobOut",
    "JobSaveResponse",
    "MarketResponse",
    "MarketSkill",
    "MessageOut",
    "ProfileOut",
    "ProfileResponse",
    "ProfileStats",
    "ProfileUpdate",
    "ResetPasswordRequest",
    "RoadmapItemOut",
    "RoadmapOut",
    "SavedJobsResponse",
    "SigninRequest",
    "SignupRequest",
    "SkillsResponse",
    "SourceOut",
    "UserOut",
]