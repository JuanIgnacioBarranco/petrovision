# ============================================================
# PetroVision — Push Subscription Model
# Stores Web Push API subscriptions for each user.
# ============================================================

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base


class PushSubscription(Base):
    __tablename__ = "push_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    endpoint = Column(Text, nullable=False)
    p256dh = Column(String(256), nullable=False)
    auth = Column(String(128), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint("endpoint", name="uq_push_endpoint"),
    )

    user = relationship("User", backref="push_subscriptions")

    def __repr__(self):
        return f"<PushSubscription user={self.user_id} endpoint={self.endpoint[:40]}...>"
