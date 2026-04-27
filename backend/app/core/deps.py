"""
FastAPI dependencies: extract and validate the current user from JWT,
enforce role-based access control.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.database import get_db
from app.models.enums import UserRole
from app.models import User, UserRole as UserRoleModel


bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Decode JWT and return the authenticated User row."""
    token = credentials.credentials
    try:
        payload = decode_token(token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
        )

    user_id: str | None = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Token payload missing subject.")

    user = db.query(User).filter(User.user_id == user_id,
                                  User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="User not found or deactivated.")
    return user


def require_roles(*roles: UserRole):
    """
    Dependency factory – raises 403 if the current user does not have
    at least one of the specified roles in any active store assignment.

    Usage:
        @router.get("/admin-only")
        def view(user = Depends(require_roles(UserRole.admin))):
            ...
    """
    def _check(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> User:
        role_names = {r.value for r in roles}
        has_role = (
            db.query(UserRoleModel)
            .join(UserRoleModel.role)
            .filter(
                UserRoleModel.user_id == current_user.user_id,
                UserRoleModel.is_active == True,
            )
            .all()
        )
        user_roles = {ur.role.role_name for ur in has_role}
        if not user_roles.intersection(role_names):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role(s): {role_names}",
            )
        return current_user

    return _check


# Convenience shortcuts
require_admin    = require_roles(UserRole.admin)
require_cashier  = require_roles(UserRole.admin, UserRole.cashier)
require_customer = require_roles(UserRole.customer)