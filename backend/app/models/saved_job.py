from sqlalchemy import BigInteger, Column, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from app.db.session import Base
from app.models.mixins import TimestampMixin


class SavedJob(TimestampMixin, Base):
    __tablename__ = "saved_jobs"
    __table_args__ = (UniqueConstraint("user_id", "job_id", name="uq_saved_jobs_user_job"),)

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(BigInteger, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)

    user = relationship("User", back_populates="saved_jobs")
    job = relationship("Job", back_populates="saved_by")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<SavedJob user={self.user_id} job={self.job_id}>"