from sqlalchemy import BigInteger, Column, ForeignKey, JSON, String, Text
from sqlalchemy.orm import relationship

from app.db.session import Base
from app.models.mixins import TimestampMixin


class Resume(TimestampMixin, Base):
    __tablename__ = "resumes"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=True)
    raw_text = Column(Text, nullable=True)
    parsed_data = Column(JSON, nullable=True)

    user = relationship("User", back_populates="resumes")
    analyses = relationship("Analysis", back_populates="resume")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Resume id={self.id} file={self.file_name}>"