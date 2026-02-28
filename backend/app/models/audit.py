# ============================================================
# PetroVision — Audit Log
# ============================================================

from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, DateTime, Text, JSON, ForeignKey,
)
from app.core.database import Base


class AuditLog(Base):
    """
    System-wide audit trail for compliance and traceability.
    Records who did what, when, and from where.
    """
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    username = Column(String(50), nullable=True)

    action = Column(String(50), nullable=False)  # LOGIN, LOGOUT, CREATE, UPDATE, DELETE, ACK_ALARM, CHANGE_SP, etc.
    resource_type = Column(String(50), nullable=True)  # user, alarm, batch, pid_loop, etc.
    resource_id = Column(String(50), nullable=True)

    description = Column(Text, nullable=True)
    old_value = Column(JSON, nullable=True)
    new_value = Column(JSON, nullable=True)

    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(300), nullable=True)

    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)

    def __repr__(self):
        return f"<AuditLog {self.action} by {self.username} at {self.timestamp}>"
