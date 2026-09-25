from sqlalchemy import BigInteger, Column, ForeignKey, String

from app.db.session import Base


class Skill(Base):
    __tablename__ = "skills"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False, unique=True, index=True)
    category = Column(String(100), nullable=True)

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Skill {self.name}>"