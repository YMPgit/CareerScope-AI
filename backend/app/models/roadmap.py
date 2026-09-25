from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship

from app.db.session import Base
from app.models.mixins import TimestampMixin, utcnow


class Roadmap(TimestampMixin, Base):
    __tablename__ = "roadmaps"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    analysis_id = Column(BigInteger, ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    title = Column(String(255), nullable=True)
    duration = Column(Integer, nullable=False, default=30)
    content = Column(JSON, nullable=True)

    analysis = relationship("Analysis", back_populates="roadmap")
    items = relationship("RoadmapItem", back_populates="roadmap", cascade="all, delete-orphan")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Roadmap analysis_id={self.analysis_id}>"