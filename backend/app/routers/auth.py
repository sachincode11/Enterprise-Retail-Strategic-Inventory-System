"""
Auth router – register, login (with 2FA for admin/cashier), token refresh, logout.
"""
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.security import (
    create_access_token, create_refresh_token, generate_otp,
    hash_otp, hash_password, hash_token, otp_expiry,
    verify_otp, verify_password,
)
from app.database import get_db
from app.models.enums import OTPPurpose, UserRole as UserRoleEnum
from app.models import OTPToken, RefreshToken, Role, User, UserRole
from app.schemas import (
    LoginRequest, MessageResponse, OTPVerifyRequest,
    RefreshRequest, RegisterRequest, TokenResponse, UserOut,
)

from app.utils import  _get_role, _user_roles, _send_otp_email

router = APIRouter(prefix="/auth", tags=["Auth"])

# endpoints
@router.post("/register", response_model=UserOut, status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    """
    Self-registration for customers (mobile app).
    Shopkeeper / cashier accounts are created by the admin.
    """
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered.")
    
    # Check duplicate username
    if db.query(User).filter(User.username == body.username).first():
        raise HTTPException(status_code=400, detail="Username already taken.")

    user = User(
        username=body.username,
        email=body.email,
        password_hash=hash_password(body.password),
        first_name=body.first_name,
        last_name=body.last_name,
        phone=body.phone,
        is_active=True
    )
    db.add(user)
    db.flush() # get user_id

    # Assign customer role (no store required for customers)
    customer_role = _get_role(db, UserRoleEnum.customer)

    db.add(UserRole(user_id=user.user_id, role_id=customer_role.role_id,
                    store_id=1))  # placeholder
    
    db.commit()
    db.refresh(user)

    return user


@router.post("/login")
def login(
    body: LoginRequest,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Step 1 of login.
    - Customer  → returns tokens immediately.
    - Admin / Cashier → sends OTP email; client must call /auth/verify-otp next.
    """
    user = db.query(User).filter(User.email == body.email,
                                  User.is_active == True).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials.")

    roles = _user_roles(db, user)

    # Customers skip 2FA
    if UserRoleEnum.customer in roles and not roles.intersection(
        {UserRoleEnum.admin, UserRoleEnum.cashier}
    ):
        at = create_access_token({"sub": user.user_id})
        rt = create_refresh_token({"sub": user.user_id})
        db.add(RefreshToken(user_id=user.user_id, token_hash=hash_token(rt),
                            expires_at=datetime.now(timezone.utc).replace(
                                tzinfo=None)))
        db.commit()
        return TokenResponse(access_token=at, refresh_token=rt)

    # Admin / Cashier → send OTP
    otp = generate_otp()
    db.add(OTPToken(user_id=user.user_id, otp_code_hash=hash_otp(otp),
                    purpose=OTPPurpose.login_2fa, expires_at=otp_expiry()))
    db.commit()
    background.add_task(_send_otp_email, user.email, otp)
    return {"detail": "OTP sent to registered email. Please verify to complete login."}


@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp_endpoint(body: OTPVerifyRequest, db: Session = Depends(get_db)):
    """Step 2 – submit OTP to get tokens."""
    user = db.query(User).filter(User.email == body.email,
                                  User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    token_row = (
        db.query(OTPToken)
        .filter(
            OTPToken.user_id == user.user_id,
            OTPToken.purpose == body.purpose,
            OTPToken.is_used == False,
            OTPToken.expires_at >= datetime.now(timezone.utc),
        )
        .order_by(OTPToken.created_at.desc())
        .first()
    )
    if not token_row or not verify_otp(body.otp_code, token_row.otp_code_hash):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP.")

    token_row.is_used = True
    at = create_access_token({"sub": user.user_id})
    rt = create_refresh_token({"sub": user.user_id})
    db.add(RefreshToken(user_id=user.user_id, token_hash=hash_token(rt),
                        expires_at=datetime.now(timezone.utc).replace(tzinfo=None)))
    db.commit()
    return TokenResponse(access_token=at, refresh_token=rt)

@router.post("/refresh", response_model=TokenResponse)
def refresh_token(body: RefreshRequest, db: Session = Depends(get_db)):
    from app.core.security import decode_token
    from jose import JWTError

    try:
        payload = decode_token(body.refresh_token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token.")

    h = hash_token(body.refresh_token)
    row = db.query(RefreshToken).filter(
        RefreshToken.token_hash == h, RefreshToken.revoked_at == None
    ).first()
    if not row:
        raise HTTPException(status_code=401, detail="Refresh token revoked or unknown.")

    row.revoked_at = datetime.now(timezone.utc)
    at = create_access_token({"sub": payload["sub"]})
    rt = create_refresh_token({"sub": payload["sub"]})
    db.add(RefreshToken(user_id=row.user_id, token_hash=hash_token(rt),
                        expires_at=datetime.now(timezone.utc).replace(tzinfo=None)))
    db.commit()
    return TokenResponse(access_token=at, refresh_token=rt)

@router.post("/logout", response_model=MessageResponse)
def logout(
    body: RefreshRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    h = hash_token(body.refresh_token)
    row = db.query(RefreshToken).filter(RefreshToken.token_hash == h).first()
    if row:
        row.revoked_at = datetime.now(timezone.utc)
        db.commit()
    return MessageResponse(message="Logged out successfully.")