# ============================================================
# PetroVision — Main Application Entry Point
# ============================================================
# Sistema RTIC Industrial con IA & Machine Learning
# UTN FRM — Tesis ISI 2026
# ============================================================

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.core.config import get_settings
from app.core.database import engine, Base, SessionLocal
from app.core.influxdb import close_influx
from app.core.redis import close_redis

settings = get_settings()


# ── Lifespan: startup + shutdown ─────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    logger.info(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")

    # Create database tables
    from app.models import __all__ as _models  # noqa: ensure all models are imported
    Base.metadata.create_all(bind=engine)
    logger.info("✅ Database tables created")

    # Seed initial data
    db = SessionLocal()
    try:
        from app.services.seed import seed_database, seed_missing_data
        seed_database(db)
        seed_missing_data(db)
    finally:
        db.close()

    # Start simulation loop (background task)
    if settings.SIMULATION_ENABLED:
        from app.services.data_generator import run_simulation_loop
        simulation_task = asyncio.create_task(run_simulation_loop())
        logger.info("✅ Simulation loop started")

    yield  # ← Application is running

    # Shutdown
    logger.info("🛑 Shutting down...")
    if settings.SIMULATION_ENABLED:
        simulation_task.cancel()
    close_influx()
    await close_redis()
    logger.info("👋 Shutdown complete")


# ── Create App ───────────────────────────────────────────────

app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Register Routers ────────────────────────────────────────

from app.api.endpoints.auth import router as auth_router
from app.api.endpoints.processes import router as processes_router
from app.api.endpoints.instruments import router as instruments_router
from app.api.endpoints.alarms import router as alarms_router
from app.api.endpoints.batches import router as batches_router
from app.api.endpoints.ml import router as ml_router
from app.api.endpoints.readings import router as readings_router
from app.api.endpoints.audit import router as audit_router
from app.api.endpoints.websocket import router as ws_router
from app.api.endpoints.push import router as push_router
from app.api.endpoints.digital_twin import router as digital_twin_router
from app.api.endpoints.spc import router as spc_router
from app.api.endpoints.reports import router as reports_router

app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(processes_router, prefix=settings.API_V1_PREFIX)
app.include_router(instruments_router, prefix=settings.API_V1_PREFIX)
app.include_router(alarms_router, prefix=settings.API_V1_PREFIX)
app.include_router(batches_router, prefix=settings.API_V1_PREFIX)
app.include_router(ml_router, prefix=settings.API_V1_PREFIX)
app.include_router(readings_router, prefix=settings.API_V1_PREFIX)
app.include_router(audit_router, prefix=settings.API_V1_PREFIX)
app.include_router(push_router, prefix=settings.API_V1_PREFIX)
app.include_router(digital_twin_router, prefix=settings.API_V1_PREFIX)
app.include_router(spc_router, prefix=settings.API_V1_PREFIX)
app.include_router(reports_router, prefix=settings.API_V1_PREFIX)
app.include_router(ws_router)  # WebSocket at root /ws/{channel}


# ── Health Check ─────────────────────────────────────────────

@app.get("/health", tags=["Sistema"])
def health_check():
    """System health check endpoint."""
    from app.api.endpoints.websocket import manager
    return {
        "status": "OK",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "simulation": settings.SIMULATION_ENABLED,
        "websocket_connections": manager.connection_count,
    }


@app.get("/", tags=["Sistema"])
def root():
    """API root — redirect to docs."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health",
    }
