from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from sqlalchemy.orm import Session

from app.core import security
from app.core.config import settings
from app.core.deps import SESSION_COOKIE, get_current_user, get_db
from app.core.logging import get_logger
from app.models.activity_log import ActivityLog
from app.models.profile import UserProfile
from app.models.token_blacklist import TokenBlacklist
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordOut,
    ForgotPasswordRequest,
    MessageOut,
    ResetPasswordRequest,
    SigninRequest,
    SignupRequest,
)
from app.services.email_service import send_password_reset, send_verification

from app.api.middleware import clear_auth_cookies, set_auth_cookies

logger = get_logger("auth")
router = APIRouter()


def _profile_out(user: User) -> dict:
    prof = user.profile
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "is_verified": user.is_verified,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None,
        "profile": {
            "target_role": prof.target_role if prof else None,
            "target_location": prof.target_location if prof else None,
            "experience_level": prof.experience_level if prof else None,
            "preferred_work_mode": prof.preferred_work_mode if prof else None,
            "bio": prof.bio if prof else None,
            "career_interests": prof.career_interests if prof else None,
        }
        if prof
        else None,
    }


def _set_cookie_pair(response: Response, user_id: int, request: Request | None = None) -> None:
    token, _, exp = security.create_access_token(user_id)
    max_age = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    secure = request.url.scheme == "https" if request else settings.is_production
    set_auth_cookies(response, token, "", max_age, secure=secure)


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists.")

    user = User(
        full_name=payload.full_name.strip(),
        email=email,
        password_hash=security.hash_password(payload.password),
        is_verified=not settings.smtp_configured,
    )
    db.add(user)
    db.flush()
    db.add(UserProfile(user_id=user.id))
    db.add(ActivityLog(user_id=user.id, activity_type="signup", meta={"source": request.client.host if request.client else None}))
    db.commit()
    db.refresh(user)

    _set_cookie_pair(response, user.id, request)

    if settings.smtp_configured:
        token, _, exp = security.create_token(user.id, "verify", settings.VERIFY_TOKEN_EXPIRE_MINUTES)
        link = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        send_verification(email, link)

    return {"user": _profile_out(user)}


@router.post("/signin")
def signin(payload: SigninRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    if not user or not security.verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account has been deactivated.")

    from datetime import datetime

    user.last_login_at = datetime.utcnow()
    db.add(ActivityLog(user_id=user.id, activity_type="signin", meta={"source": request.client.host if request.client else None}))
    db.commit()

    _set_cookie_pair(response, user.id, request)
    return {"user": _profile_out(user)}


@router.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    token = request.cookies.get(SESSION_COOKIE)
    if token:
        try:
            payload = security.decode_token(token)
            jti = payload.get("jti")
            exp = payload.get("exp")
            if jti:
                db.add(TokenBlacklist(jti=jti, user_id=int(payload.get("sub", 0) or 0), expires_at=None))
                db.commit()
        except Exception:  # noqa: BLE001
            logger.debug("Logout token decode failed")
    clear_auth_cookies(response, secure=request.url.scheme == "https")
    return {"message": "Signed out successfully."}


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {"user": _profile_out(current_user)}


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Do not reveal whether the account exists.
        return ForgotPasswordOut(message="If that email exists, a reset link has been sent.")

    token, _, exp = security.create_token(user.id, "reset", settings.RESET_TOKEN_EXPIRE_MINUTES)
    link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    sent = send_password_reset(email, link)

    if sent or not settings.smtp_configured:
        logger.info("Password reset requested for %s. Link: %s", email, link)
    else:
        logger.warning("Password reset requested for %s but email send failed.", email)

    dev_token = None
    if not settings.is_production and not settings.smtp_configured:
        dev_token = token

    return ForgotPasswordOut(
        message="If that email exists, a reset link has been sent."
        + (" (development mode: see server logs for the reset link)." if dev_token else ""),
        reset_token=dev_token,
        email_configured=settings.smtp_configured,
    )


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    try:
        data = security.decode_token(payload.token)
    except Exception:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This reset link is invalid or has expired.")

    if data.get("type") != "reset":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This reset link is invalid.")

    user = db.get(User, int(data.get("sub", 0)))
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account not found.")

    jti = data.get("jti")
    if jti:
        db.add(TokenBlacklist(jti=jti, user_id=user.id, expires_at=None))

    user.password_hash = security.hash_password(payload.new_password)
    db.commit()

    clear_auth_cookies(response, secure=request.url.scheme == "https")
    return MessageOut(message="Password updated. You can now sign in with your new password.")


@router.get("/verify-email")
def verify_email(token: str = Query(...), db: Session = Depends(get_db)):
    try:
        data = security.decode_token(token)
    except Exception:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification link is invalid or expired.")

    if data.get("type") != "verify":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification link is invalid.")

    user = db.get(User, int(data.get("sub", 0)))
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account not found.")

    user.is_verified = True
    db.commit()
    return MessageOut(message="Email verified successfully. You're all set!")