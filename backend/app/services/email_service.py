"""Optional SMTP email service for password reset & account verification."""
from __future__ import annotations

import smtplib
from email.message import EmailMessage

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("email")


def send_email(to_email: str, subject: str, body: str, is_html: bool = False) -> bool:
    if not settings.smtp_configured:
        logger.info("SMTP not configured - would send '%s' to %s", subject, to_email)
        return False

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM or settings.SMTP_USER
    msg["To"] = to_email
    if is_html:
        msg.add_alternative(body, subtype="html")
    else:
        msg.set_content(body)

    try:
        with smtplib.SMTP(settings.SMTP_HOST, int(settings.SMTP_PORT)) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        logger.info("Email sent to %s", to_email)
        return True
    except Exception as exc:  # noqa: BLE001
        logger.warning("Failed to send email: %s", exc)
        return False


def send_password_reset(to_email: str, reset_link: str) -> bool:
    subject = "CareerScope AI - Reset your password"
    body = f"""Hi,

We received a request to reset your CareerScope AI password.

Open this link within 60 minutes to choose a new password:

{reset_link}

If you didn't request this, you can safely ignore this email.

- CareerScope AI
"""
    return send_email(to_email, subject, body)


def send_verification(to_email: str, verify_link: str) -> bool:
    subject = "CareerScope AI - Verify your email"
    body = f"""Hi,

Please verify your email address to activate your CareerScope AI account:

{verify_link}

- CareerScope AI
"""
    return send_email(to_email, subject, body)