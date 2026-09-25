from sqlalchemy import BigInteger, Column, ForeignKey, JSON, String
from sqlalchemy.orm import relationship

from app.db.session import Base
from app.models.mixins import TimestampMixin


class ActivityLog(TimestampMixin, Base):
    __tablename__ = "activity_logs"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_type = Column(String(100), nullable=False, index=True)
    meta = Column("metadata", JSON, nullable=True)

    user = relationship("User", back_populates="activity_logs")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<ActivityLog {self.activity_type}>"