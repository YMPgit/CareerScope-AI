from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

connect_args = {}
if settings.sqlalchemy_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.sqlalchemy_url,
    pool_pre_ping=True,
    connect_args=connect_args,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)

Base = declarative_base()


def init_db() -> None:
    """Create tables if AUTO_CREATE_TABLES is enabled (idempotent; migrations are preferred)."""
    if not settings.AUTO_CREATE_TABLES:
        return
    from app.models import (  # noqa: F401  ensure all models are imported
        ActivityLog,
        Analysis,
        AnalysisSkill,
        Job,
        Resume,
        Roadmap,
        RoadmapItem,
        SavedJob,
        Search,
        Skill,
        TokenBlacklist,
        User,
        UserProfile,
    )

    Base.metadata.create_all(bind=engine)