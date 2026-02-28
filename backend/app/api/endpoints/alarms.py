# ============================================================
# PetroVision — Alarm Endpoints
# ============================================================

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.alarm import Alarm
from app.models.audit import AuditLog
from app.schemas import AlarmOut

router = APIRouter(prefix="/alarms", tags=["Alarmas"])


@router.get("/", response_model=list[AlarmOut])
def list_alarms(
    process_id: int = None,
    state: str = None,
    priority: str = None,
    limit: int = Query(default=100, le=500),
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """List alarms with optional filters."""
    query = db.query(Alarm).order_by(desc(Alarm.triggered_at))
    if process_id:
        query = query.filter(Alarm.process_id == process_id)
    if state:
        query = query.filter(Alarm.state == state)
    if priority:
        query = query.filter(Alarm.priority == priority)
    return [AlarmOut.model_validate(a) for a in query.limit(limit).all()]


@router.get("/active", response_model=list[AlarmOut])
def list_active_alarms(
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """List currently active (uncleared) alarms."""
    alarms = db.query(Alarm).filter(
        Alarm.state.in_(["UNACK_ACTIVE", "ACK_ACTIVE"])
    ).order_by(desc(Alarm.triggered_at)).all()
    return [AlarmOut.model_validate(a) for a in alarms]


@router.post("/{alarm_id}/acknowledge", response_model=AlarmOut)
def acknowledge_alarm(
    alarm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Acknowledge an active alarm (ISA 18.2 lifecycle)."""
    alarm = db.query(Alarm).filter(Alarm.id == alarm_id).first()
    if not alarm:
        raise HTTPException(status_code=404, detail="Alarma no encontrada")

    if alarm.state == "UNACK_ACTIVE":
        alarm.state = "ACK_ACTIVE"
    elif alarm.state == "UNACK_CLEAR":
        alarm.state = "ACK_CLEAR"
    else:
        raise HTTPException(status_code=400, detail=f"Alarma en estado '{alarm.state}' no puede ser reconocida")

    alarm.acknowledged_at = datetime.now(timezone.utc)
    alarm.acknowledged_by = current_user.id

    db.add(AuditLog(
        user_id=current_user.id,
        username=current_user.username,
        action="ACK_ALARM",
        resource_type="alarm",
        resource_id=str(alarm.id),
        description=f"Alarma reconocida: {alarm.instrument_tag} [{alarm.priority}] — {alarm.message}",
    ))
    db.commit()
    db.refresh(alarm)
    return AlarmOut.model_validate(alarm)


@router.get("/summary")
def alarm_summary(
    process_id: int = None,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Get alarm statistics summary."""
    query = db.query(Alarm)
    if process_id:
        query = query.filter(Alarm.process_id == process_id)

    active = query.filter(Alarm.state.in_(["UNACK_ACTIVE", "ACK_ACTIVE"])).all()
    total = query.count()

    priority_counts = {}
    for alarm in active:
        priority_counts[alarm.priority] = priority_counts.get(alarm.priority, 0) + 1

    return {
        "total_alarms": total,
        "active_alarms": len(active),
        "unacknowledged": len([a for a in active if a.state == "UNACK_ACTIVE"]),
        "by_priority": priority_counts,
    }
