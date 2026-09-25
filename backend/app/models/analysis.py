from sqlalchemy import (
    BigInteger,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.db.session import Base
from app.models.mixins import TimestampMixin, utcnow


class Analysis(TimestampMixin, Base):
    __tablename__ = "analyses"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    resume_id = Column(BigInteger, ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(255), nullable=True)
    target_role = Column(String(255), nullable=False)
    location = Column(String(255), nullable=True)
    experience_level = Column(String(100), nullable=True)
    employment_type = Column(String(50), nullable=True)

    status = Column(String(20), nullable=False, default="queued", index=True)
    current_stage = Column(String(50), nullable=True)
    completed_stages = Column(JSON, nullable=True, default=list)
    progress = Column(Float, nullable=False, default=0.0)

    summary = Column(Text, nullable=True)
    overall_match = Column(Float, nullable=True)
    market_overview = Column(JSON, nullable=True)
    insights = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)

    completed_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="analyses")
    resume = relationship("Resume", back_populates="analyses")
    jobs = relationship("Job", back_populates="analysis", cascade="all, delete-orphan")
    skills = relationship("AnalysisSkill", back_populates="analysis", cascade="all, delete-orphan")
    roadmap = relationship("Roadmap", back_populates="analysis", uselist=False, cascade="all, delete-orphan")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Analysis id={self.id} {self.target_role}/{self.location}>"