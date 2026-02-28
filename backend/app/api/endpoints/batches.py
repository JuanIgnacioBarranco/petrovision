# ============================================================
# PetroVision — Batch & Production Endpoints
# ============================================================

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import User
from app.models.batch import Batch
from app.schemas import BatchCreate, BatchOut

router = APIRouter(prefix="/batches", tags=["Lotes & Producción"])


@router.get("/", response_model=list[BatchOut])
def list_batches(
    process_id: int = None,
    status: str = None,
    limit: int = Query(default=50, le=200),
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    query = db.query(Batch).order_by(desc(Batch.created_at))
    if process_id:
        query = query.filter(Batch.process_id == process_id)
    if status:
        query = query.filter(Batch.status == status)
    return [BatchOut.model_validate(b) for b in query.limit(limit).all()]


@router.get("/{batch_id}", response_model=BatchOut)
def get_batch(batch_id: int, db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Lote no encontrado")
    return BatchOut.model_validate(batch)


@router.post("/", response_model=BatchOut, status_code=201)
def create_batch(
    data: BatchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("operador", "ingeniero_quimico", "admin")),
):
    batch = Batch(
        **data.model_dump(),
        operator_id=current_user.id,
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return BatchOut.model_validate(batch)


@router.post("/{batch_id}/start", response_model=BatchOut)
def start_batch(
    batch_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("operador", "ingeniero_quimico", "admin")),
):
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Lote no encontrado")
    if batch.status != "PLANNED":
        raise HTTPException(status_code=400, detail=f"Lote en estado '{batch.status}' no puede iniciarse")
    batch.status = "IN_PROGRESS"
    batch.actual_start = datetime.now(timezone.utc)
    db.commit()
    db.refresh(batch)
    return BatchOut.model_validate(batch)


@router.post("/{batch_id}/complete", response_model=BatchOut)
def complete_batch(
    batch_id: int,
    product_amount_kg: float = None,
    purity: float = None,
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("operador", "ingeniero_quimico", "admin")),
):
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Lote no encontrado")
    if batch.status != "IN_PROGRESS":
        raise HTTPException(status_code=400, detail=f"Lote en estado '{batch.status}' no puede completarse")

    batch.status = "COMPLETED"
    batch.actual_end = datetime.now(timezone.utc)
    if product_amount_kg is not None:
        batch.product_amount_kg = product_amount_kg
    if purity is not None:
        batch.purity = purity
    if batch.feed_amount_kg and batch.product_amount_kg:
        batch.yield_actual = (batch.product_amount_kg / batch.feed_amount_kg) * 100

    db.commit()
    db.refresh(batch)
    return BatchOut.model_validate(batch)
