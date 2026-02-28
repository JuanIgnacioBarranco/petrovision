# ============================================================
# PetroVision — Push Notification Endpoints
# Subscribe / unsubscribe / get VAPID public key
# ============================================================

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import get_settings
from app.core.security import get_current_user
from app.models.push_subscription import PushSubscription
from app.models.user import User

router = APIRouter(prefix="/push", tags=["Push Notifications"])
settings = get_settings()


# ── Schemas ──────────────────────────────────────────────────

class PushSubscriptionCreate(BaseModel):
    endpoint: str
    p256dh: str
    auth: str


class PushSubscriptionResponse(BaseModel):
    id: int
    endpoint: str
    message: str


# ── Endpoints ────────────────────────────────────────────────

@router.get("/vapid-key")
def get_vapid_public_key():
    """Return the VAPID public key for client-side subscription."""
    return {"public_key": settings.VAPID_PUBLIC_KEY}


@router.post("/subscribe", response_model=PushSubscriptionResponse)
def subscribe(
    data: PushSubscriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Register a push subscription for the authenticated user."""
    # Check if this endpoint already exists
    existing = db.query(PushSubscription).filter(
        PushSubscription.endpoint == data.endpoint
    ).first()

    if existing:
        # Update keys if same endpoint but different keys
        existing.p256dh = data.p256dh
        existing.auth = data.auth
        existing.user_id = current_user.id
        db.commit()
        return PushSubscriptionResponse(
            id=existing.id,
            endpoint=existing.endpoint,
            message="Suscripción actualizada",
        )

    sub = PushSubscription(
        user_id=current_user.id,
        endpoint=data.endpoint,
        p256dh=data.p256dh,
        auth=data.auth,
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)

    return PushSubscriptionResponse(
        id=sub.id,
        endpoint=sub.endpoint,
        message="Suscripción registrada exitosamente",
    )


@router.delete("/unsubscribe")
def unsubscribe(
    data: PushSubscriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a push subscription."""
    deleted = db.query(PushSubscription).filter(
        PushSubscription.endpoint == data.endpoint,
        PushSubscription.user_id == current_user.id,
    ).delete()
    db.commit()

    if deleted == 0:
        raise HTTPException(status_code=404, detail="Suscripción no encontrada")

    return {"message": "Suscripción eliminada", "deleted": deleted}


@router.get("/status")
def push_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Check if the current user has an active push subscription."""
    count = db.query(PushSubscription).filter(
        PushSubscription.user_id == current_user.id
    ).count()
    return {
        "subscribed": count > 0,
        "subscription_count": count,
    }
