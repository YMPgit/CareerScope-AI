from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, String

from app.db.session import Base
from app.models.mixins import TimestampMixin


class TokenBlacklist(TimestampMixin, Base):
    __tablename__ = "token_blacklist"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    jti = Column(String(255), nullable=False, unique=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self) -> str:  # pragma: no cover
        return f"<TokenBlacklist jti={self.jti}>"