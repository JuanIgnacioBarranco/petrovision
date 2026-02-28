# ============================================================
# PetroVision — Core Configuration
# ============================================================

from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    """Application-wide settings loaded from environment variables."""

    # ── App ──────────────────────────────────────────────────
    APP_NAME: str = "PetroVision"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "Sistema RTIC Industrial con IA — UTN FRM Tesis ISI 2026"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # ── Security ─────────────────────────────────────────────
    SECRET_KEY: str = "petrovision-secret-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours (shift duration)

    # ── PostgreSQL ───────────────────────────────────────────
    POSTGRES_HOST: str = "postgres"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "petrovision"
    POSTGRES_PASSWORD: str = "petrovision2026"
    POSTGRES_DB: str = "petrovision"

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # ── InfluxDB ─────────────────────────────────────────────
    INFLUXDB_URL: str = "http://influxdb:8086"
    INFLUXDB_TOKEN: str = "petrovision-influx-token-2026"
    INFLUXDB_ORG: str = "petrovision"
    INFLUXDB_BUCKET: str = "process_data"
    INFLUXDB_BUCKET_DOWNSAMPLED: str = "process_data_1m"

    # ── Redis ────────────────────────────────────────────────
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0

    @property
    def REDIS_URL(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    # ── ML ───────────────────────────────────────────────────
    ML_MODELS_PATH: str = "/app/ml/models"
    ML_RETRAIN_INTERVAL_HOURS: int = 24

    # ── Data Simulation ──────────────────────────────────────
    SIMULATION_INTERVAL_SECONDS: float = 2.0
    SIMULATION_ENABLED: bool = True

    # ── CORS ─────────────────────────────────────────────────
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173", "http://frontend:3000"]

    # ── Web Push (VAPID) ────────────────────────────────────
    VAPID_PUBLIC_KEY: str = "BJSWAgOENqYDQ7NGFvdXZghH0jh4AzIT5PeDSsSxo0rC7fssA7qGA0TZ7yePTFy4TrUo6lI5tLPsBwfFUtwi9nk"
    VAPID_PRIVATE_KEY: str = "WcqjUyK0xyQzVyIqegmo1QS55hE6zgRzFUb5JLEI1G4"
    VAPID_CLAIMS_EMAIL: str = "mailto:admin@petrovision.com"

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()
