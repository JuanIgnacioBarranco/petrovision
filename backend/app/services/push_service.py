# ============================================================
# PetroVision — Push Notification Service
# Sends Web Push notifications to subscribed users.
# ============================================================

import json
from loguru import logger
from pywebpush import webpush, WebPushException
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.push_subscription import PushSubscription

settings = get_settings()


def send_push_to_all(db: Session, payload: dict) -> int:
    """
    Send a push notification to ALL subscribed users.
    Returns the number of successfully delivered notifications.
    """
    subscriptions = db.query(PushSubscription).all()
    if not subscriptions:
        return 0

    sent = 0
    expired = []

    for sub in subscriptions:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {
                        "p256dh": sub.p256dh,
                        "auth": sub.auth,
                    },
                },
                data=json.dumps(payload),
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={"sub": settings.VAPID_CLAIMS_EMAIL},
            )
            sent += 1
        except WebPushException as ex:
            logger.warning(f"Push failed for sub {sub.id}: {ex}")
            # 404 or 410 means subscription expired
            if ex.response and ex.response.status_code in (404, 410):
                expired.append(sub.id)
        except Exception as ex:
            logger.error(f"Push error for sub {sub.id}: {ex}")

    # Clean up expired subscriptions
    if expired:
        db.query(PushSubscription).filter(PushSubscription.id.in_(expired)).delete(
            synchronize_session=False
        )
        db.commit()
        logger.info(f"Removed {len(expired)} expired push subscriptions")

    logger.info(f"Push notifications sent: {sent}/{len(subscriptions)}")
    return sent


def send_alarm_push(db: Session, alarm_data: dict) -> int:
    """
    Build a push notification payload from alarm data and send to all subscribers.
    Only sends for CRITICA and ALTA priorities.
    """
    priority = alarm_data.get("priority", "")
    if priority not in ("CRITICA", "ALTA"):
        return 0

    tag = alarm_data.get("instrument_tag", "???")
    alarm_type = alarm_data.get("alarm_type", "")
    message = alarm_data.get("message", "Alarma detectada")
    value = alarm_data.get("value", "")
    unit = alarm_data.get("unit", "")
    limit_val = alarm_data.get("limit", "")

    # ISA-18.2 priority emoji mapping
    icon = "🔴" if priority == "CRITICA" else "🟠"

    payload = {
        "title": f"{icon} {priority} — {tag}",
        "body": f"{message}\nValor: {value} {unit} (Límite: {limit_val} {unit})",
        "tag": f"alarm-{tag}-{alarm_type}",
        "priority": priority,
        "alarm_id": alarm_data.get("id", 0),
        "url": "/alarms",
    }

    return send_push_to_all(db, payload)
