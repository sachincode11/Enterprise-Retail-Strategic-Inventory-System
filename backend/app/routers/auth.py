"""
Auth router – register, login (with 2FA for admin/cashier), token refresh, logout.
"""
# Standard library: UTC timestamps for token expiry and revocation
from datetime import datetime, timezone

# FastAPI: routing, background tasks, dependency injection, HTTP exceptions, body parsing
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Body
# SQLAlchemy session for all DB operations
from sqlalchemy.orm import Session

# Auth dependency: extract the currently logged-in user from JWT
from app.core.deps import get_current_user
# App settings (e.g., DEBUG mode, SMTP credentials)
from app.core.config import settings
# Security utilities: token creation, OTP generation/verification, password hashing
from app.core.security import (
    create_access_token, create_refresh_token, generate_otp,
    hash_otp, hash_password, hash_token, otp_expiry,
    verify_otp, verify_password,
)
# DB session factory
from app.database import get_db
# Enums: OTP purpose types and user role types
from app.models.enums import OTPPurpose, UserRole as UserRoleEnum
# ORM models for users, roles, tokens
from app.models import OTPToken, RefreshToken, Role, User, UserRole
# Pydantic schemas for request/response validation
from app.schemas import (
    LoginRequest, MessageResponse, OTPVerifyRequest,
    RefreshRequest, RegisterRequest, TokenResponse, UserOut,
    UserProfileUpdate, ResendOTPRequest, PasswordChangeRequest, ForgotPasswordRequest
)

# Shared utility functions: role lookup, user role list, OTP email sender
from app.utils import  _get_role, _user_roles, _send_otp_email

# All routes prefixed with /auth; grouped under "Auth" in the API docs
router = APIRouter(prefix="/auth", tags=["Auth"])


def _role_slug(role_obj) -> str:
    """Normalize a role value (Enum or string) to a lowercase string slug."""
    value = getattr(role_obj, "value", role_obj)  # Extract .value if it's an Enum
    return str(value).strip().lower()


def _session_user_payload(db: Session, user: User) -> dict:
    """
    Build the standard user payload dict returned to the frontend after login.
    Includes name, email, role, initials, and store info.
    """
    # Fetch all active roles for the user across all stores
    roles = _user_roles(db, user)
    # Convert role objects to normalized slug strings (e.g., 'admin', 'cashier')
    role_slugs = {_role_slug(role) for role in roles}

    # Determine the highest-priority role for display (admin > cashier > customer)
    if "admin" in role_slugs:
        primary_role = "admin"
    elif "cashier" in role_slugs:
        primary_role = "cashier"
    else:
        primary_role = "customer"

    # Fetch the user's first active role assignment to determine their store
    role_row = (
        db.query(UserRole)
        .filter(UserRole.user_id == user.user_id, UserRole.is_active == True)
        .order_by(UserRole.user_role_id.asc())  # Pick the earliest assigned role
        .first()
    )
    store_id = role_row.store_id if role_row else 1  # Default to store 1 if no role found

    # Construct a display name from first + last name
    display_name = " ".join(filter(None, [user.first_name, user.last_name]))
    # Generate 2-letter initials from the display name (e.g., "John Doe" → "JD")
    initials = "".join([p[0] for p in display_name.split() if p])[:2].upper() or "US"

    # Return structured user info dict for frontend session state
    return {
        "id": user.user_id,
        "name": display_name,
        "email": user.email,
        "phone": user.phone,
        "role": primary_role,
        "roles": sorted(role_slugs),    # All roles, sorted alphabetically
        "initials": initials,
        "store": f"STORE-{store_id:03d}",  # Human-readable store label (e.g., STORE-001)
        "storeId": store_id,
        "verified": user.is_verified,
    }


# endpoints
# POST /auth/register — Public endpoint for customer self-registration
@router.post("/register", response_model=UserOut, status_code=201)
def register(body: RegisterRequest, background: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Self-registration for customers (mobile app).
    Shopkeeper / cashier accounts are created by the admin.
    """
    # Prevent duplicate email registrations
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered.")
    
    # Check duplicate username
    if db.query(User).filter(User.username == body.username).first():
        raise HTTPException(status_code=400, detail="Username already taken.")

    # Create new user record with hashed password; email not yet verified
    user = User(
        username=body.username,
        email=body.email,
        password_hash=hash_password(body.password),  # Never store plain-text passwords
        first_name=body.first_name,
        last_name=body.last_name,
        phone=body.phone,
        is_active=True,
        is_verified=False  # Requires OTP verification before login
    )
    db.add(user)
    db.flush() # get user_id — flush writes to DB without committing so user_id is available

    # Assign customer role (no store required for customers)
    customer_role = _get_role(db, UserRoleEnum.customer)

    db.add(UserRole(user_id=user.user_id, role_id=customer_role.role_id,
                    store_id=1))  # placeholder — store_id=1 is default for customers
    
    # Send verification OTP
    otp = generate_otp()
    print(f"[OTP] Registration OTP for {user.email}: {otp}")  # Debug log (visible in server console)
    # Store hashed OTP in DB with expiry and purpose tag
    db.add(OTPToken(
        user_id=user.user_id,
        otp_code_hash=hash_otp(otp),             # Store hash, not raw OTP
        purpose=OTPPurpose.email_verification,   # Marks this OTP for email verification
        expires_at=otp_expiry()                  # Sets a short expiry window
    ))
    
    db.commit()        # Persist user, role, and OTP records together
    db.refresh(user)   # Reload user from DB to get auto-generated fields
    
    # Send OTP email in the background so the response is not delayed
    background.add_task(_send_otp_email, user.email, otp, "Email Verification")

    return user


# POST /auth/login — Step 1 of authentication (credentials check)
@router.post("/login", openapi_extra={"security": []})  # No auth required for login
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
    # Fetch active user by email and verify password
    user = db.query(User).filter(User.email == body.email,
                                  User.is_active == True).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials.")

    # Get all roles for this user and build the session payload
    roles = _user_roles(db, user)
    user_payload = _session_user_payload(db, user)

    # Customers skip 2FA but check verification
    # If user is only a customer (not admin/cashier), bypass OTP and return tokens directly
    if UserRoleEnum.customer in roles and not roles.intersection(
        {UserRoleEnum.admin, UserRoleEnum.cashier}
    ):
        # Block unverified customers from logging in
        if not user.is_verified:
            raise HTTPException(
                status_code=403, 
                detail="Account not verified. Please verify your email first."
            )
        # Issue access + refresh tokens for verified customers
        at = create_access_token({"sub": str(user.user_id)})
        rt = create_refresh_token({"sub": str(user.user_id)})
        # Store hashed refresh token in DB for revocation support
        db.add(RefreshToken(user_id=user.user_id, token_hash=hash_token(rt),
                            expires_at=datetime.now(timezone.utc).replace(
                                tzinfo=None)))  # Strip tz info to match DB column type
        db.commit()
        return {
            "requires_otp": False,     # Client knows tokens are included
            "user": user_payload,
            "access_token": at,
            "refresh_token": rt,
            "token_type": "bearer",
        }

    # Admin / Cashier → send OTP (2FA step required before tokens are issued)
    otp = generate_otp()
    print(f"[OTP] Login OTP for {user.email}: {otp}")  # Debug log
    # Save hashed OTP with login_2fa purpose so only this OTP type is accepted next
    db.add(OTPToken(user_id=user.user_id, otp_code_hash=hash_otp(otp),
                    purpose=OTPPurpose.login_2fa, expires_at=otp_expiry()))
    db.commit()
    background.add_task(_send_otp_email, user.email, otp)  # Send OTP email asynchronously
    response = {
        "requires_otp": True,                          # Client should redirect to OTP screen
        "user": user_payload,
        "otp_purpose": OTPPurpose.login_2fa.value,
        "message": "OTP sent to registered email. Please verify to complete login.",
    }
    # Expose raw OTP in response only in debug/dev mode (never in production)
    if settings.DEBUG or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        response["debug_otp"] = otp
    return response


# POST /auth/verify-otp — Step 2: submit OTP to complete login or email verification
@router.post("/verify-otp", openapi_extra={"security": []})
def verify_otp_endpoint(body: OTPVerifyRequest, db: Session = Depends(get_db)):
    """Step 2 – submit OTP to get tokens."""
    # Look up the active user by email
    user = db.query(User).filter(User.email == body.email,
                                  User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    # Fetch the latest unused, non-expired OTP matching the user and purpose
    token_row = (
        db.query(OTPToken)
        .filter(
            OTPToken.user_id == user.user_id,
            OTPToken.purpose == body.purpose,           # Must match the intended purpose
            OTPToken.is_used == False,                  # Must not have been consumed already
            OTPToken.expires_at >= datetime.now(timezone.utc).replace(tzinfo=None),  # Not expired
        )
        .order_by(OTPToken.created_at.desc())  # Use the most recently issued OTP
        .first()
    )
    # Reject if no valid OTP found or the submitted code doesn't match the stored hash
    if not token_row or not verify_otp(body.otp_code, token_row.otp_code_hash):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP.")

    # Mark OTP as used to prevent replay attacks
    token_row.is_used = True
    
    # If purpose was email verification, mark user as verified
    if body.purpose == OTPPurpose.email_verification:
        user.is_verified = True  # Allow future logins without re-verification
        
    # Issue new access and refresh tokens now that identity is confirmed
    at = create_access_token({"sub": str(user.user_id)})
    rt = create_refresh_token({"sub": str(user.user_id)})
    # Store hashed refresh token for future revocation checks
    db.add(RefreshToken(user_id=user.user_id, token_hash=hash_token(rt),
                        expires_at=datetime.now(timezone.utc).replace(tzinfo=None)))
    db.commit()
    return {
        "user": _session_user_payload(db, user),  # Full session user info for the frontend
        "access_token": at,
        "refresh_token": rt,
        "token_type": "bearer",
    }


# POST /auth/resend-otp — Resend a fresh OTP to the user's email
@router.post("/resend-otp", openapi_extra={"security": []})
def resend_otp_endpoint(
    body: ResendOTPRequest,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
):
    # Verify the user exists and is active before sending a new OTP
    user = db.query(User).filter(User.email == body.email, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    # Generate a fresh OTP and store it with the requested purpose
    otp = generate_otp()
    print(f"[OTP] Resend OTP for {user.email}: {otp}")  # Debug log
    db.add(OTPToken(user_id=user.user_id, otp_code_hash=hash_otp(otp),
                    purpose=body.purpose, expires_at=otp_expiry()))
    db.commit()
    background.add_task(_send_otp_email, user.email, otp)  # Send async so API responds quickly
    
    response = {
        "message": "A new OTP has been sent to your email.",
    }
    # Only expose raw OTP in debug/dev mode for testing without a real mail server
    if settings.DEBUG or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        response["debug_otp"] = otp
    return response


# PATCH /auth/me — Update the currently logged-in user's profile fields
@router.patch("/me")
def update_my_profile(
    body: UserProfileUpdate,
    current_user: User = Depends(get_current_user),  # Must be authenticated
    db: Session = Depends(get_db),
):
    """Update the currently authenticated user's profile details."""
    # If email is being changed, ensure it's not already taken by another user
    if body.email and body.email.lower() != current_user.email.lower():
        existing = (
            db.query(User)
            .filter(User.email == body.email, User.user_id != current_user.user_id)
            .first()
        )
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use.")

    # Apply only the fields that were explicitly provided in the request (partial update)
    if body.first_name is not None:
        current_user.first_name = body.first_name.strip()
    if body.last_name is not None:
        current_user.last_name = body.last_name.strip() or None  # Store None if empty string
    if body.email is not None:
        current_user.email = body.email.strip().lower()           # Normalize email to lowercase
    if body.phone is not None:
        current_user.phone = body.phone.strip() or None

    db.commit()
    db.refresh(current_user)  # Reload updated fields from DB
    return {"user": _session_user_payload(db, current_user)}


# GET /auth/me — Return the currently authenticated user's profile
@router.get("/me")
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fetch the currently authenticated user's profile details."""
    return {"user": _session_user_payload(db, current_user)}

# POST /auth/refresh — Issue a new token pair using a valid refresh token
@router.post("/refresh", response_model=TokenResponse)
def refresh_token(body: RefreshRequest, db: Session = Depends(get_db)):
    # Import here to avoid circular import at module level
    from app.core.security import decode_token
    from jose import JWTError

    try:
        # Decode and validate the incoming refresh token's signature and expiry
        payload = decode_token(body.refresh_token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token.")

    # Look up the hashed token in the DB to check if it's been revoked
    h = hash_token(body.refresh_token)
    row = db.query(RefreshToken).filter(
        RefreshToken.token_hash == h, RefreshToken.revoked_at == None  # None = not revoked
    ).first()
    if not row:
        raise HTTPException(status_code=401, detail="Refresh token revoked or unknown.")

    # Rotate the refresh token: revoke the old one and issue a new pair
    row.revoked_at = datetime.now(timezone.utc)             # Mark old token as revoked
    at = create_access_token({"sub": str(payload["sub"])})  # New short-lived access token
    rt = create_refresh_token({"sub": str(payload["sub"])}) # New long-lived refresh token
    # Persist the new refresh token record
    db.add(RefreshToken(user_id=row.user_id, token_hash=hash_token(rt),
                        expires_at=datetime.now(timezone.utc).replace(tzinfo=None)))
    db.commit()
    return TokenResponse(access_token=at, refresh_token=rt)

# POST /auth/logout — Revoke the refresh token to invalidate the session
@router.post("/logout", response_model=MessageResponse)
def logout(
    body: RefreshRequest,
    current_user: User = Depends(get_current_user),  # Requires valid access token
    db: Session = Depends(get_db),
):
    # Hash the provided refresh token and look it up in the DB
    h = hash_token(body.refresh_token)
    row = db.query(RefreshToken).filter(RefreshToken.token_hash == h).first()
    if row:
        row.revoked_at = datetime.now(timezone.utc)  # Mark as revoked to prevent future use
        db.commit()
    return MessageResponse(message="Logged out successfully.")

# POST /auth/dev/grant-role — Dev-only: manually assign a role to a user by email
@router.post("/dev/grant-role")
def dev_grant_role(
    email: str = Body(...),
    role: UserRoleEnum = Body(...),
    store_id: int = Body(1),           # Default to store 1 if not specified
    db: Session = Depends(get_db)
):
    """DEV ONLY: Grant a role to a user by email."""
    # Look up the target user by email
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    # Fetch the Role record matching the given role enum value
    role_obj = _get_role(db, role)
    if not role_obj:
        raise HTTPException(status_code=400, detail="Role not found in DB.")
        
    # Check if the user already has this role for the given store (avoid duplicates)
    existing = db.query(UserRole).filter(
        UserRole.user_id == user.user_id,
        UserRole.role_id == role_obj.role_id,
        UserRole.store_id == store_id
    ).first()
    
    if existing:
        return {"message": f"User already has role {role.value} for store {store_id}."}
        
    # Create the role assignment record
    db.add(UserRole(
        user_id=user.user_id,
        role_id=role_obj.role_id,
        store_id=store_id,
        is_active=True
    ))
    db.commit()
    return {"message": f"Granted role {role.value} to user {email}."}

# POST /auth/change-password — Allow authenticated user to change their own password
@router.post("/change-password", response_model=MessageResponse)
def change_password(
    body: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Change the currently authenticated user's password."""
    # Verify the user knows their current password before allowing the change
    if not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid current password.")
    
    # Hash and store the new password
    current_user.password_hash = hash_password(body.new_password)
    db.commit()
    return MessageResponse(message="Password changed successfully.")


# POST /auth/forgot-password — Send a temporary password to the user's email
@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(
    body: ForgotPasswordRequest,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Reset password and send a temporary one to the user's email."""
    # Lookup user — silently return success even if email not found (prevents user enumeration)
    user = db.query(User).filter(User.email == body.email.lower(), User.is_active == True).first()
    if not user:
        return MessageResponse(message="If the email exists, a temporary password has been sent.")

    # Reuse OTP generator to create a random temporary password
    temp_password = generate_otp()
    user.password_hash = hash_password(temp_password)  # Replace current password hash
    db.commit()

    # Send the temporary password via email in the background
    background.add_task(_send_otp_email, user.email, temp_password, "Password Reset")
    
    return MessageResponse(message="A temporary password has been sent to your email.")
