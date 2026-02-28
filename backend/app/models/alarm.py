# ============================================================
# PetroVision — Alarm Model
# ============================================================

from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text,
    ForeignKey,
)
from app.core.database import Base


class Alarm(Base):
    """
    Process alarm event — generated when instrument value exceeds limits.
    Follows ISA-18.2 alarm management lifecycle.
    """
    __tablename__ = "alarms"

    id = Column(Integer, primary_key=True, index=True)

    # Source
    instrument_tag = Column(String(20), nullable=False, index=True)
    process_id = Column(Integer, ForeignKey("chemical_processes.id"), nullable=False)
    area = Column(String(50), nullable=True)

    # Alarm classification (ISA 18.2)
    priority = Column(String(10), nullable=False)  # CRITICA, ALTA, MEDIA, BAJA
    alarm_type = Column(String(20), nullable=False)  # HIHI, HI, LO, LOLO, RATE, DEVIATION
    message = Column(String(300), nullable=False)

    # Values at time of alarm
    value = Column(Float, nullable=True)
    limit = Column(Float, nullable=True)
    unit = Column(String(20), nullable=True)

    # Lifecycle (ISA 18.2 states)
    state = Column(String(20), default="UNACK_ACTIVE")
    # States: UNACK_ACTIVE, ACK_ACTIVE, UNACK_CLEAR, ACK_CLEAR (NORMAL)

    # Timestamps
    triggered_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    acknowledged_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    cleared_at = Column(DateTime(timezone=True), nullable=True)

    # Shelving (temporary suppress)
    is_shelved = Column(Boolean, default=False)
    shelved_until = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<Alarm {self.instrument_tag} [{self.priority}] {self.state}>"


class AlarmSummary(Base):
    """
    Aggregated alarm statistics per shift/day for KPI reporting.
    """
    __tablename__ = "alarm_summaries"

    id = Column(Integer, primary_key=True, index=True)
    process_id = Column(Integer, ForeignKey("chemical_processes.id"), nullable=False)
    period_start = Column(DateTime(timezone=True), nullable=False)
    period_end = Column(DateTime(timezone=True), nullable=False)

    total_alarms = Column(Integer, default=0)
    critical_count = Column(Integer, default=0)
    high_count = Column(Integer, default=0)
    medium_count = Column(Integer, default=0)
    low_count = Column(Integer, default=0)

    avg_response_time_s = Column(Float, nullable=True)
    standing_alarms = Column(Integer, default=0)  # alarms that stayed active > 30 min
