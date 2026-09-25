from sqlalchemy import BigInteger, Column, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship

from app.db.session import Base
from app.models.mixins import TimestampMixin


class RoadmapItem(TimestampMixin, Base):
    __tablename__ = "roadmap_items"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    roadmap_id = Column(BigInteger, ForeignKey("roadmaps.id", ondelete="CASCADE"), nullable=False, index=True)
    week_number = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    learning_objective = Column(Text, nullable=True)
    why_it_matters = Column(Text, nullable=True)
    what_to_learn = Column(Text, nullable=True)
    practice = Column(Text, nullable=True)
    project_task = Column(Text, nullable=True)
    interview_prep = Column(Text, nullable=True)
    skills = Column(JSON, nullable=True, default=list)
    resources = Column(JSON, nullable=True, default=list)
    status = Column(String(20), nullable=False, default="pending")

    roadmap = relationship("Roadmap", back_populates="items")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<RoadmapItem week={self.week_number} {self.title}>"