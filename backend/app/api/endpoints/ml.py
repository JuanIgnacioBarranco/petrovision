# ============================================================
# PetroVision — ML Endpoints (Predict, Models, Retrain)
# ============================================================

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import User
from app.models.ml_model import MLModel, Prediction
from app.schemas import MLModelOut, PredictionOut, PredictionRequest

router = APIRouter(prefix="/ml", tags=["Machine Learning"])


@router.get("/models", response_model=list[MLModelOut])
def list_models(
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """List all ML models."""
    return [MLModelOut.model_validate(m) for m in db.query(MLModel).all()]


@router.get("/models/{model_id}", response_model=MLModelOut)
def get_model(model_id: int, db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    model = db.query(MLModel).filter(MLModel.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Modelo no encontrado")
    return MLModelOut.model_validate(model)


@router.post("/predict")
def predict(
    request: PredictionRequest,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """
    Run a prediction using the currently deployed model.
    Returns rich response including interpretation, recommendations, and extras.
    """
    model = db.query(MLModel).filter(
        MLModel.name == request.model_name,
        MLModel.is_production == True,
    ).first()

    if not model:
        raise HTTPException(
            status_code=404,
            detail=f"No hay modelo activo con nombre '{request.model_name}'",
        )

    # ── Inference ────────────────────────────────────────────
    from app.services.ml_service import run_inference
    result = run_inference(
        model_name=request.model_name,
        target_tag=request.target_tag,
        horizon_minutes=request.horizon_minutes,
        features=request.features,
    )

    # Separate core fields from extras
    predicted_value = result.pop("predicted_value", None)
    confidence = result.pop("confidence", None)
    # Remaining keys are extras (interpretation, recommendations, etc.)
    extras = result

    prediction = Prediction(
        model_id=model.id,
        prediction_type=model.model_type,
        target_tag=request.target_tag,
        predicted_value=predicted_value,
        confidence=confidence,
        horizon_minutes=request.horizon_minutes,
        features=request.features,
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)

    return {
        "id": prediction.id,
        "model_id": prediction.model_id,
        "model_name": model.name,
        "model_version": model.version,
        "algorithm": model.algorithm,
        "prediction_type": prediction.prediction_type,
        "target_tag": prediction.target_tag,
        "predicted_value": predicted_value,
        "confidence": confidence,
        "horizon_minutes": prediction.horizon_minutes,
        "created_at": prediction.created_at.isoformat() if prediction.created_at else None,
        **extras,
    }


@router.get("/predictions", response_model=list[PredictionOut])
def list_predictions(
    model_name: str = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """List recent predictions."""
    query = db.query(Prediction).order_by(Prediction.created_at.desc())
    if model_name:
        model = db.query(MLModel).filter(MLModel.name == model_name).first()
        if model:
            query = query.filter(Prediction.model_id == model.id)
    return [PredictionOut.model_validate(p) for p in query.limit(limit).all()]


@router.post("/retrain/{model_name}")
def retrain_model(
    model_name: str,
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("data_scientist", "admin")),
):
    """Trigger retraining of a model (async task in production)."""
    model = db.query(MLModel).filter(MLModel.name == model_name).first()
    if not model:
        raise HTTPException(status_code=404, detail=f"Modelo '{model_name}' no encontrado")

    # In production, this would enqueue a Celery/RQ task
    return {
        "status": "QUEUED",
        "model": model_name,
        "message": f"Reentrenamiento de '{model_name}' encolado. Se notificará al completar.",
    }
