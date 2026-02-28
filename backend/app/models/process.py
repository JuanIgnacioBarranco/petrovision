# ============================================================
# PetroVision — Chemical Process & Configuration Models
# ============================================================

from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text, JSON,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class ChemicalProcess(Base):
    """
    Defines a chemical process that the system can monitor.
    Generic: supports Maleic Anhydride, Tartaric Acid, or any other.
    """
    __tablename__ = "chemical_processes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, nullable=False)
    code = Column(String(20), unique=True, nullable=False)  # e.g., "MA-100", "AT-200"
    description = Column(Text, nullable=True)

    # Reaction
    reaction_equation = Column(String(500), nullable=True)  # e.g., "C₄H₁₀ + 3.5 O₂ → C₄H₂O₃ + 4 H₂O"
    catalyst = Column(String(150), nullable=True)

    # Operating conditions (nominal)
    temperature_sp = Column(Float, nullable=True)  # °C
    pressure_sp = Column(Float, nullable=True)     # bar
    conversion = Column(Float, nullable=True)      # fraction 0-1
    selectivity = Column(Float, nullable=True)     # fraction 0-1
    yield_global = Column(Float, nullable=True)    # fraction 0-1

    # Feed
    feed_material = Column(String(100), nullable=True)
    feed_rate_kg_h = Column(Float, nullable=True)
    feed_density = Column(Float, nullable=True)  # kg/L

    # Product
    product_name = Column(String(100), nullable=True)
    product_mw = Column(Float, nullable=True)  # g/mol
    product_rate_kg_h = Column(Float, nullable=True)

    # Economics
    feed_cost_per_kg = Column(Float, nullable=True)  # USD
    product_price_per_kg = Column(Float, nullable=True)  # USD

    # Stoichiometry (JSON: list of {name, formula, mw, stoich_coeff, role: "reactant"|"product"})
    stoichiometry = Column(JSON, nullable=True)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    instruments = relationship("Instrument", back_populates="process", cascade="all, delete-orphan")
    equipment = relationship("Equipment", back_populates="process", cascade="all, delete-orphan")
    pid_loops = relationship("PIDLoop", back_populates="process", cascade="all, delete-orphan")
    interlocks = relationship("Interlock", back_populates="process", cascade="all, delete-orphan")
    batches = relationship("Batch", back_populates="process", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ChemicalProcess {self.code}: {self.name}>"


class ProcessParameter(Base):
    """
    Additional configurable parameters for a process (extensible key-value).
    """
    __tablename__ = "process_parameters"

    id = Column(Integer, primary_key=True, index=True)
    process_id = Column(Integer, ForeignKey("chemical_processes.id"), nullable=False)
    key = Column(String(100), nullable=False)  # e.g., "oxygen_excess_pct"
    value = Column(String(255), nullable=False)
    unit = Column(String(30), nullable=True)
    description = Column(String(300), nullable=True)

    def __repr__(self):
        return f"<ProcessParam {self.key}={self.value}>"
