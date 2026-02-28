# ============================================================
# PetroVision — Database Connection (PostgreSQL + SQLAlchemy)
# ============================================================

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.DATABASE_URL,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
    echo=settings.DEBUG,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


def get_db():
    """Dependency: yields a DB session per request, auto-closes."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
