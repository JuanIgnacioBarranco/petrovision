# ============================================================
# PetroVision — User Model
# ============================================================

from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Text,
)
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(150), nullable=False)
    hashed_password = Column(String(255), nullable=False)

    # Roles: operador, ingeniero_quimico, data_scientist, supervisor, admin
    role = Column(String(30), nullable=False, default="operador")

    is_active = Column(Boolean, default=True, nullable=False)
    last_login = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Plant-specific
    area = Column(String(50), nullable=True)  # e.g., "Reactor", "Destilación"
    shift = Column(String(20), nullable=True)  # e.g., "Mañana", "Tarde", "Noche"

    def __repr__(self):
        return f"<User {self.username} ({self.role})>"
