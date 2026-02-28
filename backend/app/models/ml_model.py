# ============================================================
# PetroVision — Machine Learning Model Registry
# ============================================================

from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text, JSON,
    ForeignKey,
)
from app.core.database import Base


class MLModel(Base):
    """
    Registry of trained ML models — versioned, with metrics.
    """
    __tablename__ = "ml_models"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(100), nullable=False, index=True)
    version = Column(String(20), nullable=False)
    algorithm = Column(String(80), nullable=False)  # "LSTM", "XGBoost", "IsolationForest", "RandomForest"
    model_type = Column(String(30), nullable=False)  # prediction, anomaly, classification, optimization

    # Performance metrics (JSON for flexibility)
    metrics = Column(JSON, nullable=True)
    # e.g., {"accuracy": 0.96, "rmse": 1.2, "r2": 0.94, "precision": 0.92, "recall": 0.88}

    # Training info
    trained_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    training_duration_s = Column(Float, nullable=True)
    training_samples = Column(Integer, nullable=True)
    features_used = Column(JSON, nullable=True)  # ["TI_101", "PI_101", "FI_101", ...]
    hyperparameters = Column(JSON, nullable=True)

    # Model artifact
    artifact_path = Column(String(500), nullable=True)  # path to serialized model file

    # Status
    status = Column(String(20), default="TRAINED")  # TRAINED, DEPLOYED, RETIRED, FAILED
    is_production = Column(Boolean, default=False)  # only 1 per name should be True

    # Drift monitoring
    last_drift_check = Column(DateTime(timezone=True), nullable=True)
    drift_detected = Column(Boolean, default=False)
    drift_score = Column(Float, nullable=True)

    description = Column(Text, nullable=True)

    def __repr__(self):
        return f"<MLModel {self.name} v{self.version} [{self.status}]>"


class Prediction(Base):
    """
    Individual ML prediction record — links to batch, model.
    """
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)

    model_id = Column(Integer, ForeignKey("ml_models.id"), nullable=False)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=True)

    prediction_type = Column(String(30), nullable=False)  # temperature, yield, anomaly, maintenance
    target_tag = Column(String(20), nullable=True)  # instrument or equipment tag

    # Result
    predicted_value = Column(Float, nullable=True)
    confidence = Column(Float, nullable=True)  # 0-1
    horizon_minutes = Column(Integer, nullable=True)  # prediction horizon

    # Context (features used for this prediction)
    features = Column(JSON, nullable=True)

    # Actual vs predicted (filled later for validation)
    actual_value = Column(Float, nullable=True)
    error = Column(Float, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<Prediction {self.prediction_type}: {self.predicted_value} ({self.confidence:.0%})>"


class AnomalyEvent(Base):
    """
    Detected anomaly from the Isolation Forest / Autoencoder.
    """
    __tablename__ = "anomaly_events"

    id = Column(Integer, primary_key=True, index=True)

    instrument_tag = Column(String(20), nullable=False, index=True)
    process_id = Column(Integer, ForeignKey("chemical_processes.id"), nullable=False)
    model_id = Column(Integer, ForeignKey("ml_models.id"), nullable=True)

    anomaly_score = Column(Float, nullable=False)  # 0-1 (higher = more anomalous)
    severity = Column(String(10), nullable=False)  # BAJA, MEDIA, ALTA, CRITICA
    description = Column(String(300), nullable=True)
    recommended_action = Column(String(300), nullable=True)

    # Context
    value_at_detection = Column(Float, nullable=True)
    features = Column(JSON, nullable=True)

    # Resolution
    is_resolved = Column(Boolean, default=False)
    resolved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    detected_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<Anomaly {self.instrument_tag} score={self.anomaly_score:.2f}>"
