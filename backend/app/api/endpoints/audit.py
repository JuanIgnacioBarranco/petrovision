# ============================================================
# PetroVision — Audit Log Endpoint (21 CFR Part 11)
# ============================================================

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.audit import AuditLog
from app.models.user import User

router = APIRouter(prefix="/audit", tags=["Auditoría"])


class AuditEntryOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    username: Optional[str] = None
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    description: Optional[str] = None
    ip_address: Optional[str] = None
    timestamp: Optional[datetime] = None

    class Config:
        from_attributes = True


@router.get("/", response_model=list[AuditEntryOut])
def list_audit_logs(
    action: str = None,
    username: str = None,
    resource_type: str = None,
    limit: int = Query(default=200, le=1000),
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("admin", "supervisor", "ingeniero_quimico")),
):
    """
    List audit log entries (most recent first).
    Only accessible by admin, supervisor, and chemical engineer roles.
    """
    query = db.query(AuditLog).order_by(desc(AuditLog.timestamp))
    if action:
        query = query.filter(AuditLog.action == action)
    if username:
        query = query.filter(AuditLog.username.ilike(f"%{username}%"))
    if resource_type:
        query = query.filter(AuditLog.resource_type == resource_type)
    return [AuditEntryOut.model_validate(e) for e in query.limit(limit).all()]
