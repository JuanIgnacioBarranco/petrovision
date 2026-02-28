# ============================================================
# PetroVision — Chemical Process Endpoints (CRUD)
# ============================================================

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import User
from app.models.process import ChemicalProcess
from app.schemas import ProcessCreate, ProcessOut

router = APIRouter(prefix="/processes", tags=["Procesos Químicos"])


@router.get("/", response_model=list[ProcessOut])
def list_processes(
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """List all configured chemical processes."""
    return [ProcessOut.model_validate(p) for p in db.query(ChemicalProcess).filter(ChemicalProcess.is_active == True).all()]


@router.get("/{process_id}", response_model=ProcessOut)
def get_process(
    process_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Get a single chemical process by ID."""
    process = db.query(ChemicalProcess).filter(ChemicalProcess.id == process_id).first()
    if not process:
        raise HTTPException(status_code=404, detail="Proceso no encontrado")
    return ProcessOut.model_validate(process)


@router.post("/", response_model=ProcessOut, status_code=status.HTTP_201_CREATED)
def create_process(
    data: ProcessCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("admin", "ingeniero_quimico")),
):
    """Create a new chemical process configuration."""
    if db.query(ChemicalProcess).filter(ChemicalProcess.code == data.code).first():
        raise HTTPException(status_code=400, detail=f"Código '{data.code}' ya existe")

    process = ChemicalProcess(**data.model_dump())
    db.add(process)
    db.commit()
    db.refresh(process)
    return ProcessOut.model_validate(process)


@router.put("/{process_id}", response_model=ProcessOut)
def update_process(
    process_id: int,
    data: ProcessCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("admin", "ingeniero_quimico")),
):
    """Update an existing chemical process."""
    process = db.query(ChemicalProcess).filter(ChemicalProcess.id == process_id).first()
    if not process:
        raise HTTPException(status_code=404, detail="Proceso no encontrado")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(process, field, value)
    db.commit()
    db.refresh(process)
    return ProcessOut.model_validate(process)


@router.delete("/{process_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_process(
    process_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("admin")),
):
    """Soft-delete a chemical process."""
    process = db.query(ChemicalProcess).filter(ChemicalProcess.id == process_id).first()
    if not process:
        raise HTTPException(status_code=404, detail="Proceso no encontrado")
    process.is_active = False
    db.commit()
