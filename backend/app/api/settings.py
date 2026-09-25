from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

from app.core import security
from app.core.deps import get_current_user, get_db
from app.models.activity_log import ActivityLog
from app.models.user import User
from app.schemas.auth import ChangePasswordRequest, MessageOut
from app.api.middleware import clear_auth_cookies

router = APIRouter()


@router.put("/password")
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.current_password == payload.new_password:
        raise HTTPException(status_code=400, detail="New password must be different from the current password.")
    if not security.verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")

    current_user.password_hash = security.hash_password(payload.new_password)
    db.add(ActivityLog(user_id=current_user.id, activity_type="password_changed"))
    db.commit()
    return MessageOut(message="Password changed successfully.")


@router.delete("/account")
def delete_account(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        db.delete(current_user)
        db.commit()
    except Exception:  # noqa: BLE001
        db.rollback()
        raise HTTPException(status_code=500, detail="Could not delete account. Please try again.")

    clear_auth_cookies(response)
    return MessageOut(message="Account deleted. All associated data has been removed.")