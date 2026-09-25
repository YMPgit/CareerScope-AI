"""Shared resume storage/validation used by resume upload and analysis creation."""
from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logging import get_logger
from app.models.resume import Resume
from app.services.extractor import EmptyResumeError, UnsupportedFileError, extract_text
from app.services.resume_parser import parse_resume

logger = get_logger("resume_upload")


class ResumeUploadError(Exception):
    pass


def validate_and_store(
    db: Session,
    user_id: int,
    file_name: str,
    data: bytes,
    max_size_mb: int | None = None,
) -> Resume:
    limit = max_size_mb or settings.MAX_UPLOAD_SIZE_MB
    limit_bytes = limit * 1024 * 1024
    if len(data) > limit_bytes:
        raise ResumeUploadError(f"File exceeds the {limit} MB limit.")

    ext = "." + (file_name.rsplit(".", 1)[-1].lower() if "." in file_name else "")
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise ResumeUploadError(f"Unsupported file type. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}")

    try:
        raw_text = extract_text(file_name, data)
    except UnsupportedFileError as exc:
        raise ResumeUploadError(str(exc))
    except EmptyResumeError as exc:
        raise ResumeUploadError(str(exc))

    # Store a copy on disk (sanitized name).
    from pathlib import Path

    upload_root = Path(settings.UPLOAD_DIR) / str(user_id)
    upload_root.mkdir(parents=True, exist_ok=True)
    stored_name = f"{uuid.uuid4().hex[:12]}_{file_name.replace(' ', '_')[:120]}"
    file_path = upload_root / stored_name
    file_path.write_bytes(data)

    parsed = None
    try:
        parsed = parse_resume(raw_text)
    except Exception as exc:  # noqa: BLE001
        logger.info("Resume parse skipped at upload for %s: %s", file_name, exc)

    resume = Resume(
        user_id=user_id,
        file_name=file_name,
        file_path=str(file_path),
        raw_text=raw_text,
        parsed_data=parsed,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume