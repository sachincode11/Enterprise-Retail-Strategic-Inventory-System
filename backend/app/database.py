"""
Database engine, session factory, and Base for all models.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

# URL_DATABASE = 'mysql+pymysql://root:password@localhost/ersis'

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,      # drops stale connections automatically
    pool_size=10,
    max_overflow=20,
    echo=settings.DEBUG,     # log SQL only in debug mode
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""
    pass


def get_db():
    """FastAPI dependency – yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
 