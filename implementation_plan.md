# Fix Login Flow (Backend + Frontend)

The login system has all the architecture in place (backend auth router, JWT security, frontend auth service, login pages, OTP verification), but several issues prevent it from working end-to-end. This plan addresses all the identified problems.

## Identified Issues

### Backend Issues

1. **Empty `.env` file** — The `.env` file is blank. The `DATABASE_URL` defaults to `mysql+pymysql://root:password@localhost/ersis`, but `JWT_SECRET_KEY` defaults to `"change-me-in-production"`. Without a proper `.env`, the database connection will fail if the user's MySQL credentials differ from the defaults.

2. **`bcrypt` not in dependencies** — `pyproject.toml` includes `passlib[bcrypt]` but the code (`security.py`) uses `bcrypt` **directly** (not via passlib). The `bcrypt` package must be added as an explicit dependency.

3. **`_user_roles()` returns strings, but `auth.py` compares against enums** — In `helpers.py`, `_user_roles()` returns `{ur.role.role_name for ur in ...}`, which yields the **string values** stored in the DB (e.g., `"Admin"`, `"Cashier"`, `"Customer"`). However, in `auth.py` line 126-128, it compares against `UserRoleEnum.customer`, `UserRoleEnum.admin`, `UserRoleEnum.cashier` — which are enum members. This comparison will **always fail**, meaning admins/cashiers will be treated as customers (no 2FA) or the logic won't match at all.

4. **`_role_slug()` in `_session_user_payload` also has issues** — It calls `_role_slug(role)` on the return of `_user_roles()` which returns strings, so `getattr(role_obj, "value", role_obj)` just returns the string. This works accidentally but the capitalization inconsistency (`"Admin"` → `"admin"`) matters only for `_role_slug`, not for the comparison bug in issue #3.

5. **`UserRole.store_id` is NOT NULL but customers don't have a store** — During registration, a `store_id=1` placeholder is hardcoded. If store with ID 1 doesn't exist in the DB, the FK constraint will fail and registration will crash.

6. **Missing `Store` seed data** — The lifespan seeds roles but not stores. If the DB is fresh, there's no store with `store_id=1`, causing FK violations in both registration and login.

## Open Questions

> [!IMPORTANT]
> **Database credentials**: What is your MySQL username, password, and database name? The default config assumes `root:password@localhost/ersis`. If you use different credentials, please share them so I can update the `.env` file.

> [!IMPORTANT]
> **Has the database been created?** Do you already have a MySQL database named `ersis` set up, or do I need to guide you through creating it?

## Proposed Changes

### Backend Core Fixes

---

#### [MODIFY] [.env](file:///c:/Users/sachi/OneDrive/Desktop/Systems%20Development%20Group%20Project/Enterprise-Retail-Strategic-Inventory-System/backend/.env)

Populate with working defaults so the app can start:

```env
DATABASE_URL=mysql+pymysql://root:password@localhost/ersis
JWT_SECRET_KEY=ersis-dev-secret-key-change-in-prod
DEBUG=true
```

---

#### [MODIFY] [pyproject.toml](file:///c:/Users/sachi/OneDrive/Desktop/Systems%20Development%20Group%20Project/Enterprise-Retail-Strategic-Inventory-System/backend/pyproject.toml)

Add `bcrypt` as an explicit dependency (currently the code uses it directly but it's only an optional sub-dependency of `passlib`).

---

#### [MODIFY] [helpers.py](file:///c:/Users/sachi/OneDrive/Desktop/Systems%20Development%20Group%20Project/Enterprise-Retail-Strategic-Inventory-System/backend/app/utils/helpers.py)

Fix `_user_roles()` to return **enum members** instead of raw strings, so the comparison in `auth.py` works correctly:

```diff
 def _user_roles(db: Session, user: User) -> set[str]:
-    return {
-        ur.role.role_name
-        for ur in db.query(UserRole).filter(
-            UserRole.user_id == user.user_id, UserRole.is_active == True
-        ).all()
-    }
+    roles = set()
+    for ur in db.query(UserRole).filter(
+        UserRole.user_id == user.user_id, UserRole.is_active == True
+    ).all():
+        raw = ur.role.role_name
+        # Convert to enum member if it's a raw string
+        if isinstance(raw, UserRoleEnum):
+            roles.add(raw)
+        else:
+            try:
+                roles.add(UserRoleEnum(raw))
+            except ValueError:
+                roles.add(raw)
+    return roles
```

This ensures `_user_roles()` returns `{UserRoleEnum.admin, ...}` so that the `if UserRoleEnum.customer in roles` check in `auth.py` actually works.

---

#### [MODIFY] [main.py](file:///c:/Users/sachi/OneDrive/Desktop/Systems%20Development%20Group%20Project/Enterprise-Retail-Strategic-Inventory-System/backend/app/main.py)

Add `_seed_default_store()` in the lifespan to ensure store ID 1 exists. This prevents FK violations when registering customers or when login tries to look up store data.

```diff
 async def lifespan(app: FastAPI):
     Base.metadata.create_all(bind=engine)
     _ensure_schema_compatibility()
     _seed_roles()
+    _seed_default_store()
     yield
```

New function:
```python
def _seed_default_store() -> None:
    """Ensure a default store exists (store_id=1) for customer registration."""
    from sqlalchemy.orm import Session
    from app.database import SessionLocal
    from app.models import Store, User

    db: Session = SessionLocal()
    try:
        if not db.query(Store).filter(Store.store_id == 1).first():
            # Need a default owner — use the first user if exists, or create a system user
            owner = db.query(User).first()
            if not owner:
                from app.core.security import hash_password
                owner = User(
                    username="system",
                    email="system@ersis.local",
                    password_hash=hash_password("System@123"),
                    first_name="System",
                    is_active=True,
                )
                db.add(owner)
                db.flush()
            db.add(Store(store_name="Default Store", owner_id=owner.user_id))
            db.commit()
    finally:
        db.close()
```

---

#### [MODIFY] [auth.py](file:///c:/Users/sachi/OneDrive/Desktop/Systems%20Development%20Group%20Project/Enterprise-Retail-Strategic-Inventory-System/backend/app/routers/auth.py)

Fix the OTP expiry timezone comparison. `OTPToken.expires_at` is stored as a naive datetime (via `otp_expiry()` which returns `datetime.now(timezone.utc)` — timezone-aware). But MySQL stores naive datetimes. The comparison on line 175 `OTPToken.expires_at >= datetime.now(timezone.utc)` may misbehave with mixed aware/naive comparisons. Normalize to naive UTC.

```diff
-            OTPToken.expires_at >= datetime.now(timezone.utc),
+            OTPToken.expires_at >= datetime.now(timezone.utc).replace(tzinfo=None),
```

Also fix `otp_expiry()` in security.py to return naive UTC:

```diff
 def otp_expiry() -> datetime:
-    return datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
+    return (datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)).replace(tzinfo=None)
```

### Frontend — No Code Changes Needed

The frontend auth flow is well-structured and should work as-is once the backend is running correctly:
- `authService.js` handles both mock and real API modes
- `VITE_USE_MOCK_AUTH` env controls mock vs real backend
- Login → OTP → Dashboard flow is wired in `AdminApp.jsx` / `CashierApp.jsx`
- `apiClient.js` proxies to `http://127.0.0.1:8000` via Vite

The only frontend thing to confirm is that `VITE_USE_MOCK_AUTH` is **not** set to `'true'` when testing against the real backend.

## Verification Plan

### Automated Tests
1. Start the backend: `cd backend && uv run uvicorn app.main:app --reload`
2. Confirm it starts without errors
3. Test registration via Swagger UI (`/docs`): POST `/api/v1/auth/register`
4. Test login via Swagger UI: POST `/api/v1/auth/login`
5. Verify customer login returns tokens directly (no OTP)
6. Verify admin/cashier login returns `requires_otp: true` with `debug_otp`
7. Test OTP verification: POST `/api/v1/auth/verify-otp`

### Manual Verification
1. Start frontend: `cd frontend-web && npm run dev`
2. Navigate to `http://localhost:5173/#/admin`
3. Login with a registered admin user
4. Verify OTP page shows and debug OTP works
5. Verify redirect to dashboard after OTP verification
