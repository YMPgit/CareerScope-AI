"""HTTP middleware: logging, CSRF double-submit, origin checks, lightweight rate limiting."""
from __future__ import annotations

import time
import uuid
from collections import defaultdict, deque
from datetime import datetime

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.core.config import settings
from app.core.deps import CSRF_COOKIE, SESSION_COOKIE, is_origin_allowed
from app.core.logging import get_logger

logger = get_logger("middleware")

UNSAFE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}

# Endpoints that legitimately have no session/CSRF cookie yet.
CSRF_EXEMPT_PREFIXES = (
    "/api/auth/signup",
    "/api/auth/signin",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
    "/api/auth/verify-email",
    "/health",
)

# ------------------------------------------------------------------ #
# Rate limiting (in-memory, best-effort; enabled via RATE_LIMIT_ENABLED)
# ------------------------------------------------------------------ #
_hits: dict[str, deque[float]] = defaultdict(deque)


def _rate_limited(key: str, limit: int, window_seconds: int) -> bool:
    now = time.time()
    q = _hits[key]
    while q and now - q[0] > window_seconds:
        q.popleft()
    if len(q) >= limit:
        return True
    q.append(now)
    return False


class SecurityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        method = request.method.upper()

        start = time.perf_counter()
        response = await call_next(request)

        # Origin guard for unsafe cross-site requests
        if method in UNSAFE_METHODS:
            origin = request.headers.get("origin")
            if origin and not is_origin_allowed(origin, request):
                logger.warning("Blocked cross-origin %s %s from %s", method, path, origin)
                return JSONResponse(status_code=403, content={"detail": "Cross-origin request blocked."})

            exempt = path.startswith(CSRF_EXEMPT_PREFIXES)
            csrf_cookie = request.cookies.get(CSRF_COOKIE)
            csrf_header = request.headers.get("X-CSRF-Token")
            if not exempt and csrf_cookie and csrf_cookie != csrf_header:
                logger.warning("CSRF check failed for %s %s", method, path)
                return JSONResponse(status_code=403, content={"detail": "CSRF validation failed. Refresh and try again."})

        if settings.RATE_LIMIT_ENABLED and "/api/auth/" in path:
            key = f"{request.client.host}:{path}"
            if _rate_limited(key, limit=30, window_seconds=60):
                return JSONResponse(status_code=429, content={"detail": "Too many requests. Slow down."})

        elapsed = (time.perf_counter() - start) * 1000
        if elapsed > 500:
            logger.info("%s %s -> %s (%dms)", method, path, response.status_code, int(elapsed))
        return response


def set_auth_cookies(response, token: str, csrf_token: str, max_age_seconds: int, secure: bool | None = None) -> None:
    if secure is None:
        secure = settings.is_production
    response.set_cookie(
        key=SESSION_COOKIE,
        value=token,
        max_age=max_age_seconds,
        httponly=True,
        secure=secure,
        samesite="lax",
        path="/",
    )
    response.set_cookie(
        key=CSRF_COOKIE,
        value=csrf_token or uuid.uuid4().hex,
        max_age=max_age_seconds,
        httponly=False,
        secure=secure,
        samesite="lax",
        path="/",
    )


def clear_auth_cookies(response, secure: bool | None = None) -> None:
    if secure is None:
        secure = settings.is_production
    response.delete_cookie(SESSION_COOKIE, path="/", secure=secure, httponly=True, samesite="lax")
    response.delete_cookie(CSRF_COOKIE, path="/", secure=secure, httponly=False, samesite="lax")


def utcnow_iso() -> str:
    return datetime.utcnow().isoformat()