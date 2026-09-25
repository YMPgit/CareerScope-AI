from sqlalchemy import BigInteger, Column, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from app.db.session import Base
from app.models.mixins import TimestampMixin


class UserProfile(TimestampMixin, Base):
    __tablename__ = "user_profiles"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    target_role = Column(String(255), nullable=True)
    target_location = Column(String(255), nullable=True)
    experience_level = Column(String(100), nullable=True)
    preferred_work_mode = Column(String(50), nullable=True)
    career_interests = Column(Text, nullable=True)
    bio = Column(Text, nullable=True)

    user = relationship("User", back_populates="profile")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<UserProfile user_id={self.user_id}>"