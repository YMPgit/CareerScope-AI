from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, JSON, String, Text
from sqlalchemy.orm import relationship

from app.db.session import Base
from app.models.mixins import utcnow


class Job(Base):
    __tablename__ = "jobs"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    analysis_id = Column(BigInteger, ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False, index=True)
    external_job_id = Column(Text, nullable=True)
    title = Column(String(500), nullable=False)
    company = Column(String(255), nullable=True)
    location = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    source = Column(String(100), nullable=True, default="Google Jobs")
    salary = Column(String(255), nullable=True)
    employment_type = Column(String(100), nullable=True)
    experience = Column(String(100), nullable=True)
    url = Column(Text, nullable=True)
    posted_at = Column(DateTime(timezone=True), nullable=True)
    posted_text = Column(String(120), nullable=True)
    remote_type = Column(String(50), nullable=True)
    raw_data = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)

    analysis = relationship("Analysis", back_populates="jobs")
    saved_by = relationship("SavedJob", back_populates="job", cascade="all, delete-orphan")

    index_analysis_company = True

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Job id={self.id} {self.title} @ {self.company}>"