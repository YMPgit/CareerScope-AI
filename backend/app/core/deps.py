from typing import Generator

import jwt as pyjwt
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core import security
from app.core.config import settings
from app.db.session import SessionLocal
from app.models.token_blacklist import TokenBlacklist
from app.models.user import User

SESSION_COOKIE = "careerscope_token"
CSRF_COOKIE = "careerscope_csrf"


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _token_from_request(request: Request) -> str | None:
    raw = request.cookies.get(SESSION_COOKIE)
    if raw:
        return raw
    auth = request.headers.get("Authorization")
    if auth and auth.lower().startswith("bearer "):
        return auth[len("Bearer "):].strip()
    return None


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = _token_from_request(request)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    try:
        payload = security.decode_token(token)
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired, please sign in again")
    except pyjwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session token")

    if payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session token")

    jti = payload.get("jti")
    if jti:
        blacklisted = db.query(TokenBlacklist).filter(TokenBlacklist.jti == jti).first()
        if blacklisted:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session revoked, please sign in again")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session token")

    user = db.get(User, int(user_id))
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account not found")

    return user


def require_ownership(owner_user_id: int, current_user: User) -> None:
    if owner_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")


def get_client_origin(request: Request) -> str:
    return request.headers.get("origin") or request.headers.get("referer") or ""


def is_origin_allowed(origin: str, request: Request | None = None) -> bool:
    if not origin:
        return True
    try:
        host = origin.split("://", 1)[1].rstrip("/").lower()
    except IndexError:
        return True
    # Same-origin requests (SPA served from the same host as the API) are
    # always allowed, regardless of CORS_ORIGINS configuration.
    if request is not None:
        self_host = (request.headers.get("host") or request.url.netloc or "").lower()
        if host == self_host or host == f"www.{self_host}":
            return True
    allowed_hosts = []
    for o in settings.cors_origins_list:
        allowed_hosts.append(o.split("://", 1)[1].rstrip("/").lower() if "://" in o else o.lower())
    return host in allowed_hosts