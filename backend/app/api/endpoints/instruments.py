# ============================================================
# PetroVision — Instrument & Equipment & PID Endpoints
# ============================================================

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import User
from app.models.instrument import Instrument, Equipment, PIDLoop, Interlock
from app.schemas import (
    InstrumentCreate, InstrumentOut,
    EquipmentCreate, EquipmentOut,
    PIDLoopCreate, PIDLoopOut,
    PIDSetpointChange, PIDModeChange,
)

router = APIRouter(tags=["Instrumentos & Equipos"])


# ── Instruments ──────────────────────────────────────────────

@router.get("/instruments/live")
def get_live_readings(
    _user: User = Depends(get_current_user),
):
    """Return the latest simulated value for every instrument tag."""
    try:
        from app.services.data_generator import get_latest_readings
        return get_latest_readings()
    except Exception as e:
        return {}


@router.get("/instruments", response_model=list[InstrumentOut])
def list_instruments(
    process_id: int = None,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """List instruments, optionally filtered by process."""
    query = db.query(Instrument).filter(Instrument.is_active == True)
    if process_id:
        query = query.filter(Instrument.process_id == process_id)
    return [InstrumentOut.model_validate(i) for i in query.all()]


@router.get("/instruments/{tag}", response_model=InstrumentOut)
def get_instrument(tag: str, db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    inst = db.query(Instrument).filter(Instrument.tag == tag).first()
    if not inst:
        raise HTTPException(status_code=404, detail=f"Instrumento '{tag}' no encontrado")
    return InstrumentOut.model_validate(inst)


@router.post("/instruments", response_model=InstrumentOut, status_code=201)
def create_instrument(
    data: InstrumentCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("admin", "ingeniero_quimico")),
):
    inst = Instrument(**data.model_dump())
    db.add(inst)
    db.commit()
    db.refresh(inst)
    return InstrumentOut.model_validate(inst)


# ── Equipment ────────────────────────────────────────────────

@router.get("/equipment", response_model=list[EquipmentOut])
def list_equipment(
    process_id: int = None,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    query = db.query(Equipment).filter(Equipment.is_active == True)
    if process_id:
        query = query.filter(Equipment.process_id == process_id)
    return [EquipmentOut.model_validate(e) for e in query.all()]


@router.post("/equipment", response_model=EquipmentOut, status_code=201)
def create_equipment(
    data: EquipmentCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("admin", "ingeniero_quimico")),
):
    eq = Equipment(**data.model_dump())
    db.add(eq)
    db.commit()
    db.refresh(eq)
    return EquipmentOut.model_validate(eq)


# ── PID Loops ────────────────────────────────────────────────

@router.get("/pid-loops", response_model=list[PIDLoopOut])
def list_pid_loops(
    process_id: int = None,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    query = db.query(PIDLoop).filter(PIDLoop.is_active == True)
    if process_id:
        query = query.filter(PIDLoop.process_id == process_id)
    return [PIDLoopOut.model_validate(p) for p in query.all()]


@router.patch("/pid-loops/{tag}/setpoint", response_model=PIDLoopOut)
def change_setpoint(
    tag: str,
    data: PIDSetpointChange,
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("operador", "ingeniero_quimico", "admin")),
):
    """Change PID loop setpoint (logged action)."""
    loop = db.query(PIDLoop).filter(PIDLoop.tag == tag).first()
    if not loop:
        raise HTTPException(status_code=404, detail=f"Lazo PID '{tag}' no encontrado")
    loop.setpoint = data.setpoint
    db.commit()
    db.refresh(loop)
    return PIDLoopOut.model_validate(loop)


@router.patch("/pid-loops/{tag}/mode", response_model=PIDLoopOut)
def change_mode(
    tag: str,
    data: PIDModeChange,
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("operador", "ingeniero_quimico", "admin")),
):
    """Change PID loop mode (AUTO/MANUAL/CASCADE)."""
    loop = db.query(PIDLoop).filter(PIDLoop.tag == tag).first()
    if not loop:
        raise HTTPException(status_code=404, detail=f"Lazo PID '{tag}' no encontrado")
    loop.mode = data.mode
    db.commit()
    db.refresh(loop)
    return PIDLoopOut.model_validate(loop)
