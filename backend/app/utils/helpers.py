from app.models import OTPPurpose, UserRole as UserRoleEnum
from app.models import OTPToken, RefreshToken, Role, User, UserRole

from sqlalchemy.orm import Session

# Routers - auth
def _get_role(db: Session, role_name: UserRoleEnum) -> Role:
    r = db.query(Role).filter(Role.role_name == role_name).first()
    if not r:
        raise RuntimeError(f"Role '{role_name}' not seeded in DB.")
    return r


def _user_roles(db: Session, user: User) -> set[str]:
    return {
        ur.role.role_name
        for ur in db.query(UserRole).filter(
            UserRole.user_id == user.user_id, UserRole.is_active == True
        ).all()
    }


async def _send_otp_email(email: str, otp: str) -> None:
    """Placeholder – replace with real SMTP / email service."""
    print(f"[EMAIL] OTP for {email}: {otp}")