# ============================================================
# PetroVision — Instrument, Equipment, PID, Interlock Models
# ============================================================

from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text, JSON,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class Instrument(Base):
    """
    ISA-standard tagged instrument (sensor/transmitter).
    Examples: TI-101, PI-101, FI-101, LI-101, AI-101
    """
    __tablename__ = "instruments"

    id = Column(Integer, primary_key=True, index=True)
    process_id = Column(Integer, ForeignKey("chemical_processes.id"), nullable=False)

    tag = Column(String(20), unique=True, nullable=False, index=True)  # ISA tag: TI-101
    description = Column(String(200), nullable=False)
    instrument_type = Column(String(30), nullable=False)  # temperature, pressure, flow, level, analyzer

    unit = Column(String(20), nullable=False)  # °C, bar, kg/h, %, m
    area = Column(String(50), nullable=True)    # Reactor, Absorber, Distillation, etc.

    # Alarm limits (ISA standard)
    lolo = Column(Float, nullable=True)   # Low-Low (critical)
    lo = Column(Float, nullable=True)     # Low
    sp = Column(Float, nullable=True)     # Setpoint
    hi = Column(Float, nullable=True)     # High
    hihi = Column(Float, nullable=True)   # High-High (critical)

    # Sensor range
    range_min = Column(Float, nullable=True)
    range_max = Column(Float, nullable=True)

    is_active = Column(Boolean, default=True)
    calibration_date = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    process = relationship("ChemicalProcess", back_populates="instruments")

    def __repr__(self):
        return f"<Instrument {self.tag}: {self.description}>"


class Equipment(Base):
    """
    Physical equipment in the plant (reactors, pumps, exchangers, etc.).
    """
    __tablename__ = "equipment"

    id = Column(Integer, primary_key=True, index=True)
    process_id = Column(Integer, ForeignKey("chemical_processes.id"), nullable=False)

    tag = Column(String(20), unique=True, nullable=False, index=True)  # R-101, P-101, E-101
    name = Column(String(100), nullable=False)
    equipment_type = Column(String(50), nullable=False)  # reactor, pump, heat_exchanger, column, tank, compressor
    area = Column(String(50), nullable=True)

    # Status tracking
    status = Column(String(20), default="RUNNING")  # RUNNING, STOPPED, MAINTENANCE, FAULT
    operating_hours = Column(Float, default=0.0)
    last_maintenance = Column(DateTime(timezone=True), nullable=True)
    next_maintenance = Column(DateTime(timezone=True), nullable=True)

    # Design specs (JSON for flexibility)
    specs = Column(JSON, nullable=True)  # {"material": "SS316", "capacity_m3": 15, ...}

    is_active = Column(Boolean, default=True)

    # Relationships
    process = relationship("ChemicalProcess", back_populates="equipment")

    def __repr__(self):
        return f"<Equipment {self.tag}: {self.name} [{self.status}]>"


class PIDLoop(Base):
    """
    PID control loop configuration.
    """
    __tablename__ = "pid_loops"

    id = Column(Integer, primary_key=True, index=True)
    process_id = Column(Integer, ForeignKey("chemical_processes.id"), nullable=False)

    tag = Column(String(20), unique=True, nullable=False, index=True)  # TIC-101, PIC-101
    description = Column(String(200), nullable=False)

    # IDs of related instruments
    pv_tag = Column(String(20), nullable=False)  # Process Variable instrument tag
    cv_tag = Column(String(20), nullable=True)   # Control Valve tag
    sp_tag = Column(String(20), nullable=True)   # Setpoint source tag (for CASCADE)

    # Tuning parameters
    kp = Column(Float, nullable=False, default=1.0)   # Proportional gain
    ti = Column(Float, nullable=False, default=60.0)   # Integral time (s)
    td = Column(Float, nullable=False, default=0.0)    # Derivative time (s)

    # Operating
    mode = Column(String(15), default="AUTO")  # AUTO, MANUAL, CASCADE
    setpoint = Column(Float, nullable=True)
    output = Column(Float, nullable=True, default=50.0)  # 0-100%
    output_min = Column(Float, default=0.0)
    output_max = Column(Float, default=100.0)

    # Anti-windup
    anti_windup = Column(Boolean, default=True)

    is_active = Column(Boolean, default=True)

    # Relationships
    process = relationship("ChemicalProcess", back_populates="pid_loops")

    def __repr__(self):
        return f"<PIDLoop {self.tag} [{self.mode}] SP={self.setpoint}>"


class Interlock(Base):
    """
    Safety Instrumented System (SIS) interlock definition.
    """
    __tablename__ = "interlocks"

    id = Column(Integer, primary_key=True, index=True)
    process_id = Column(Integer, ForeignKey("chemical_processes.id"), nullable=False)

    tag = Column(String(20), unique=True, nullable=False, index=True)  # SIS-001
    description = Column(String(300), nullable=False)

    # Trigger condition
    trigger_tag = Column(String(20), nullable=False)  # Instrument tag that triggers
    trigger_condition = Column(String(50), nullable=False)  # ">450", "<1.5", etc.
    trigger_value = Column(Float, nullable=True)

    # Action
    action = Column(String(300), nullable=False)  # "Shutdown reactor, open vent valve"
    sil_level = Column(Integer, default=1)  # SIL 1-4

    # Status
    status = Column(String(20), default="ARMED")  # ARMED, TRIPPED, BYPASSED, TESTING
    last_trip = Column(DateTime(timezone=True), nullable=True)
    trip_count = Column(Integer, default=0)

    is_active = Column(Boolean, default=True)

    # Relationships
    process = relationship("ChemicalProcess", back_populates="interlocks")

    def __repr__(self):
        return f"<Interlock {self.tag} [{self.status}]>"
