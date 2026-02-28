# ============================================================
# PetroVision — Pydantic Schemas (API Request/Response)
# ============================================================

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


# ── Auth ─────────────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class LoginRequest(BaseModel):
    username: str
    password: str


# ── User ─────────────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=150)
    password: str = Field(..., min_length=6)
    role: str = Field(default="operador", pattern="^(operador|ingeniero_quimico|data_scientist|supervisor|admin)$")
    area: Optional[str] = None
    shift: Optional[str] = None


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: str
    is_active: bool
    area: Optional[str] = None
    shift: Optional[str] = None
    last_login: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    area: Optional[str] = None
    shift: Optional[str] = None
    is_active: Optional[bool] = None


# ── Chemical Process ─────────────────────────────────────────

class ProcessCreate(BaseModel):
    name: str
    code: str = Field(..., max_length=20)
    description: Optional[str] = None
    reaction_equation: Optional[str] = None
    catalyst: Optional[str] = None
    temperature_sp: Optional[float] = None
    pressure_sp: Optional[float] = None
    conversion: Optional[float] = None
    selectivity: Optional[float] = None
    yield_global: Optional[float] = None
    feed_material: Optional[str] = None
    feed_rate_kg_h: Optional[float] = None
    feed_density: Optional[float] = None
    product_name: Optional[str] = None
    product_mw: Optional[float] = None
    product_rate_kg_h: Optional[float] = None
    feed_cost_per_kg: Optional[float] = None
    product_price_per_kg: Optional[float] = None
    stoichiometry: Optional[list[dict]] = None


class ProcessOut(ProcessCreate):
    id: int
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Instrument ───────────────────────────────────────────────

class InstrumentCreate(BaseModel):
    process_id: int
    tag: str = Field(..., max_length=20)
    description: str
    instrument_type: str
    unit: str
    area: Optional[str] = None
    lolo: Optional[float] = None
    lo: Optional[float] = None
    sp: Optional[float] = None
    hi: Optional[float] = None
    hihi: Optional[float] = None
    range_min: Optional[float] = None
    range_max: Optional[float] = None


class InstrumentOut(InstrumentCreate):
    id: int
    is_active: bool
    calibration_date: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Equipment ────────────────────────────────────────────────

class EquipmentCreate(BaseModel):
    process_id: int
    tag: str
    name: str
    equipment_type: str
    area: Optional[str] = None
    specs: Optional[dict] = None


class EquipmentOut(EquipmentCreate):
    id: int
    status: str
    operating_hours: float
    is_active: bool
    last_maintenance: Optional[datetime] = None
    next_maintenance: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── PID Loop ────────────────────────────────────────────────

class PIDLoopCreate(BaseModel):
    process_id: int
    tag: str
    description: str
    pv_tag: str
    cv_tag: Optional[str] = None
    kp: float = 1.0
    ti: float = 60.0
    td: float = 0.0
    mode: str = "AUTO"
    setpoint: Optional[float] = None


class PIDLoopOut(PIDLoopCreate):
    id: int
    output: Optional[float] = None
    output_min: float
    output_max: float
    anti_windup: bool
    is_active: bool

    class Config:
        from_attributes = True


class PIDSetpointChange(BaseModel):
    setpoint: float


class PIDModeChange(BaseModel):
    mode: str = Field(..., pattern="^(AUTO|MANUAL|CASCADE)$")


# ── Alarm ────────────────────────────────────────────────────

class AlarmOut(BaseModel):
    id: int
    instrument_tag: str
    process_id: int
    area: Optional[str] = None
    priority: str
    alarm_type: str
    message: str
    value: Optional[float] = None
    limit: Optional[float] = None
    unit: Optional[str] = None
    state: str
    triggered_at: Optional[datetime] = None
    acknowledged_at: Optional[datetime] = None
    acknowledged_by: Optional[int] = None
    cleared_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Batch ────────────────────────────────────────────────────

class BatchCreate(BaseModel):
    process_id: int
    batch_number: str
    feed_amount_kg: Optional[float] = None
    feed_material: Optional[str] = None
    planned_start: Optional[datetime] = None
    notes: Optional[str] = None


class BatchOut(BaseModel):
    id: int
    process_id: int
    batch_number: str
    status: str
    planned_start: Optional[datetime] = None
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    feed_amount_kg: Optional[float] = None
    product_amount_kg: Optional[float] = None
    purity: Optional[float] = None
    yield_actual: Optional[float] = None
    yield_predicted: Optional[float] = None
    quality_grade: Optional[str] = None
    avg_temperature: Optional[float] = None
    avg_pressure: Optional[float] = None
    production_cost: Optional[float] = None
    revenue: Optional[float] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── ML Model ────────────────────────────────────────────────

class MLModelOut(BaseModel):
    id: int
    name: str
    version: str
    algorithm: str
    model_type: str
    metrics: Optional[dict] = None
    trained_at: Optional[datetime] = None
    training_samples: Optional[int] = None
    features_used: Optional[list] = None
    hyperparameters: Optional[dict] = None
    description: Optional[str] = None
    status: str
    is_production: bool
    drift_detected: bool

    class Config:
        from_attributes = True


class PredictionOut(BaseModel):
    id: int
    model_id: int
    prediction_type: str
    target_tag: Optional[str] = None
    predicted_value: Optional[float] = None
    confidence: Optional[float] = None
    horizon_minutes: Optional[int] = None
    features: Optional[dict] = None
    actual_value: Optional[float] = None
    error: Optional[float] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PredictionRequest(BaseModel):
    model_name: str
    target_tag: Optional[str] = None
    horizon_minutes: int = 5
    features: Optional[dict] = None


class PredictionDetailOut(BaseModel):
    """Rich prediction response with model-specific extras."""
    id: int
    model_id: int
    prediction_type: str
    target_tag: Optional[str] = None
    predicted_value: Optional[float] = None
    confidence: Optional[float] = None
    horizon_minutes: Optional[int] = None
    created_at: Optional[datetime] = None
    # Extra model-specific fields (interpretation, recommendations, etc.)
    extras: Optional[dict] = None

    class Config:
        from_attributes = True


# ── Time Series ──────────────────────────────────────────────

class ReadingOut(BaseModel):
    time: str
    value: float
    instrument: Optional[str] = None


class LiveDataPoint(BaseModel):
    tag: str
    value: float
    unit: str
    quality: str = "GOOD"
    timestamp: str


# ── Rebuild forward references ───────────────────────────────
Token.model_rebuild()
