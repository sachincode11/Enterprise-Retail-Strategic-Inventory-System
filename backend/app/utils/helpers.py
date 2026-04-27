from app.models.enums import OTPPurpose, UserRole as UserRoleEnum
from app.models import OTPToken, RefreshToken, Role, User, UserRole

from sqlalchemy.orm import Session
from email.message import EmailMessage
import smtplib

from app.core.config import settings

# Routers - auth
def _get_role(db: Session, role_name: UserRoleEnum) -> Role:
    r = db.query(Role).filter(Role.role_name == role_name).first()
    if not r:
        raise RuntimeError(f"Role '{role_name}' not seeded in DB.")
    return r


def _user_roles(db: Session, user: User) -> set:
    """Return the set of UserRoleEnum members for the given user."""
    roles = set()
    for ur in db.query(UserRole).filter(
        UserRole.user_id == user.user_id, UserRole.is_active == True
    ).all():
        raw = ur.role.role_name
        # Convert raw DB string to enum member for safe comparison
        if isinstance(raw, UserRoleEnum):
            roles.add(raw)
        else:
            try:
                roles.add(UserRoleEnum(raw))
            except ValueError:
                # Keep as-is if it doesn't match any enum member
                roles.add(raw)
    return roles


async def _send_otp_email(email: str, otp: str) -> None:
    """Send OTP via SMTP; falls back to console output in dev/misconfigured envs."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print(f"[EMAIL-FALLBACK] OTP for {email}: {otp}")
        return

    msg = EmailMessage()
    msg["Subject"] = f"{settings.APP_NAME} - OTP Verification Code"
    msg["From"] = settings.EMAIL_FROM or settings.SMTP_USER
    msg["To"] = email
    msg.set_content(
        f"Your OTP code is: {otp}\n\n"
        f"This code expires in {settings.OTP_EXPIRE_MINUTES} minutes."
    )

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
    except Exception as exc:
        print(f"[EMAIL-ERROR] Failed to send OTP to {email}: {exc}")
        print(f"[EMAIL-FALLBACK] OTP for {email}: {otp}")