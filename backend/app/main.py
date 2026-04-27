"""
ERSIS – Enterprise Retail & Strategic Inventory System
FastAPI application entry point.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
)


# lifespan (startup / shutdown)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup (use Alembic migrations in production)
    Base.metadata.create_all(bind=engine)
    _seed_roles()
    yield
    # Shutdown: nothing to clean up yet

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


# Health check
@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "version": settings.APP_VERSION}