from sqlalchemy import BigInteger, Column, ForeignKey, String
from sqlalchemy.orm import relationship

from app.db.session import Base
from app.models.mixins import TimestampMixin


class Search(TimestampMixin, Base):
    __tablename__ = "searches"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    query = Column(String(500), nullable=False)
    location = Column(String(255), nullable=True)
    search_type = Column(String(50), nullable=False, default="google_jobs")

    user = relationship("User", back_populates="searches")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Search {self.search_type}: {self.query}>"