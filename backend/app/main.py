"""
ERSIS – Enterprise Retail & Strategic Inventory System
FastAPI application entry point.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.core.config import settings
from app.database import Base, engine
from app.models import *

# routers
from app.routers.auth import router as auth_router
from app.routers.products import cat_router, prod_router, inv_router
from app.routers.transactions import router as txn_router, refund_router
from app.routers.admin import (
    supplier_router, po_router, user_router,
    faq_router, policy_router, notif_router,
    discount_router, staff_router, customer_router, store_router,
)


# lifespan (startup / shutdown)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup (use Alembic migrations in production)
    Base.metadata.create_all(bind=engine)
    _ensure_schema_compatibility()
    _seed_roles()
    _seed_default_store()
    yield
    # Shutdown: nothing to clean up yet


def _ensure_schema_compatibility() -> None:
    inspector = inspect(engine)
    if "suppliers" not in inspector.get_table_names():
        return

    cols = {column["name"] for column in inspector.get_columns("suppliers")}
    with engine.begin() as conn:
        if "store_id" not in cols:
            conn.execute(text("ALTER TABLE suppliers ADD COLUMN store_id INT NULL"))
        if "is_active" not in cols:
            conn.execute(text("ALTER TABLE suppliers ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT 1"))

def _seed_roles() -> None:
    """Insert the three core roles if they don't exist."""
    from sqlalchemy.orm import Session
    from app.database import SessionLocal
    from app.models.enums import UserRole
    from app.models import Role

    db: Session = SessionLocal()
    try:
        for role_name in UserRole:
            if not db.query(Role).filter(Role.role_name == role_name).first():
                db.add(Role(role_name=role_name))
        db.commit()
    finally:
        db.close()


def _seed_default_store() -> None:
    """Ensure a default store exists (store_id=1) for customer registration.

    The user_roles table has a NOT NULL FK to stores. Customer registration
    assigns store_id=1 as a placeholder, so this store must exist.
    """
    from sqlalchemy.orm import Session
    from app.database import SessionLocal
    from app.models import Store, User, Role, UserRole as UserRoleModel
    from app.models.enums import UserRole as UserRoleEnum
    from app.core.security import hash_password

    db: Session = SessionLocal()
    try:
        if db.query(Store).filter(Store.store_id == 1).first():
            return  # already exists

        # Need a default owner — use the first admin user if exists, or create a system user
        owner = db.query(User).first()
        if not owner:
            owner = User(
                username="admin",
                email="admin@store.np",
                password_hash=hash_password("Admin@123"),
                first_name="Admin",
                last_name="User",
                is_active=True,
            )
            db.add(owner)
            db.flush()

            # Assign admin role
            admin_role = db.query(Role).filter(Role.role_name == UserRoleEnum.admin).first()
            if admin_role:
                db.add(UserRoleModel(
                    user_id=owner.user_id,
                    role_id=admin_role.role_id,
                    store_id=1,
                ))

        db.add(Store(
            store_name="Default Store",
            owner_id=owner.user_id,
            address="Kathmandu, Nepal",
            is_active=True,
        ))
        db.commit()
        print(f"[SEED] Default store created. Owner: {owner.email}")
    finally:
        db.close()


# app factory
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Backend API for the Enterprise Retail & Strategic Inventory System – "
        "a cost-effective, secure, IoT-enabled billing and inventory platform."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# register routers
API = "/api/v1"

app.include_router(auth_router,     prefix=API)
app.include_router(cat_router,      prefix=API)
app.include_router(prod_router,     prefix=API)
app.include_router(inv_router,      prefix=API)
app.include_router(txn_router,      prefix=API)
app.include_router(refund_router,   prefix=API)
app.include_router(supplier_router, prefix=API)
app.include_router(po_router,       prefix=API)
app.include_router(user_router,     prefix=API)
app.include_router(faq_router,      prefix=API)
app.include_router(policy_router,   prefix=API)
app.include_router(notif_router,    prefix=API)
app.include_router(discount_router, prefix=API)
app.include_router(staff_router,    prefix=API)
app.include_router(customer_router, prefix=API)
app.include_router(store_router,    prefix=API)


# Health check
@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "version": settings.APP_VERSION}