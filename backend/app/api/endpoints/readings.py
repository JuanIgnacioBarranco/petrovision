# ============================================================
# PetroVision — Time Series Data Endpoints
# ============================================================

from fastapi import APIRouter, Depends, Query
from app.core.security import get_current_user
from app.models.user import User
from app.core.influxdb import query_sensor_history
from app.schemas import ReadingOut

router = APIRouter(prefix="/readings", tags=["Datos en Tiempo Real"])


@router.get("/", response_model=list[ReadingOut])
def get_readings(
    instrument: str = Query(..., description="Instrument tag, e.g., TI-101"),
    range: str = Query(default="-1h", description="InfluxDB time range: -5m, -1h, -24h, -7d"),
    downsample: str = Query(default=None, description="Downsample interval: 10s, 1m, 5m, 1h"),
    _user: User = Depends(get_current_user),
):
    """
    Query historical sensor readings from InfluxDB.
    Supports flexible time ranges and downsampling for trend charts.
    """
    readings = query_sensor_history(
        tag=instrument,
        time_range=range,
        downsample=downsample,
    )
    return [ReadingOut(**r) for r in readings]
