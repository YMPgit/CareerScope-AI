from sqlalchemy import BigInteger, Boolean, Column, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.session import Base
from app.models.mixins import TimestampMixin


class AnalysisSkill(TimestampMixin, Base):
    __tablename__ = "analysis_skills"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    analysis_id = Column(BigInteger, ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False, index=True)
    skill_id = Column(BigInteger, ForeignKey("skills.id", ondelete="SET NULL"), nullable=True)
    skill_name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=True)
    market_frequency = Column(Integer, nullable=False, default=0)
    market_percentage = Column(Float, nullable=False, default=0.0)
    market_rank = Column(Integer, nullable=False, default=0)
    user_has_skill = Column(Boolean, nullable=False, default=False)
    skill_gap_level = Column(String(20), nullable=False, default="missing")
    priority = Column(String(20), nullable=False, default="low")
    reason = Column(Text, nullable=True)

    analysis = relationship("Analysis", back_populates="skills")
    skill = relationship("Skill", lazy="joined")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<AnalysisSkill {self.skill_name} pct={self.market_percentage}>"