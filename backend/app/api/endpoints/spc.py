# ============================================================
# PetroVision — SPC (Statistical Process Control) Endpoints
# ============================================================
# Real-time Shewhart, CUSUM & EWMA control charts.
# Capability indices Cp, Cpk, Pp, Ppk.
# Western Electric Rules violation detection.
# ============================================================

import math
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.influxdb import query_sensor_history
from app.models.user import User
from app.models.instrument import Instrument

router = APIRouter(prefix="/spc", tags=["SPC — Control Estadístico"])


# ── Helpers ──────────────────────────────────────────────────

def _we_rules(values: list[float], mean: float, sigma: float) -> list[dict]:
    """Western Electric Rules violation detection."""
    violations: list[dict] = []
    n = len(values)
    if sigma == 0 or n < 8:
        return violations

    for i in range(n):
        v = values[i]
        z = (v - mean) / sigma

        # Rule 1: 1 point beyond 3σ
        if abs(z) > 3:
            violations.append({"index": i, "rule": 1, "desc": "Punto fuera de ±3σ", "severity": "CRITICA"})

        # Rule 2: 9 consecutive points on same side of mean
        if i >= 8:
            window = values[i - 8: i + 1]
            if all(x > mean for x in window) or all(x < mean for x in window):
                violations.append({"index": i, "rule": 2, "desc": "9 puntos consecutivos del mismo lado", "severity": "ALTA"})

        # Rule 3: 6 consecutive increasing or decreasing points
        if i >= 5:
            window = values[i - 5: i + 1]
            if all(window[j] < window[j + 1] for j in range(5)) or \
               all(window[j] > window[j + 1] for j in range(5)):
                violations.append({"index": i, "rule": 3, "desc": "6 puntos con tendencia monótona", "severity": "MEDIA"})

        # Rule 4: 2 of 3 consecutive points beyond 2σ (same side)
        if i >= 2:
            window = [values[i - 2], values[i - 1], v]
            above2 = sum(1 for x in window if (x - mean) / sigma > 2)
            below2 = sum(1 for x in window if (x - mean) / sigma < -2)
            if above2 >= 2 or below2 >= 2:
                violations.append({"index": i, "rule": 4, "desc": "2/3 puntos más allá de ±2σ", "severity": "ALTA"})

    # Deduplicate by index
    seen = set()
    unique = []
    for v in violations:
        key = (v["index"], v["rule"])
        if key not in seen:
            seen.add(key)
            unique.append(v)
    return unique


def _capability_indices(values: list[float], sp: float, hi: float, lo: float) -> dict:
    """Compute Cp, Cpk, Pp, Ppk process capability indices."""
    n = len(values)
    if n < 10 or hi <= lo:
        return {"cp": None, "cpk": None, "pp": None, "ppk": None, "sigma_within": None, "sigma_overall": None}

    mean = sum(values) / n
    usl = hi
    lsl = lo

    # Overall sigma (Pp, Ppk)
    sigma_overall = math.sqrt(sum((x - mean) ** 2 for x in values) / (n - 1))

    # Within-group sigma estimate (MR-bar / d2, subgroup=1, d2=1.128)
    mr = [abs(values[i] - values[i - 1]) for i in range(1, n)]
    mr_bar = sum(mr) / len(mr) if mr else 0
    sigma_within = mr_bar / 1.128 if mr_bar > 0 else sigma_overall

    cp = (usl - lsl) / (6 * sigma_within) if sigma_within > 0 else None
    cpu = (usl - mean) / (3 * sigma_within) if sigma_within > 0 else None
    cpl = (mean - lsl) / (3 * sigma_within) if sigma_within > 0 else None
    cpk = min(cpu, cpl) if cpu is not None and cpl is not None else None

    pp = (usl - lsl) / (6 * sigma_overall) if sigma_overall > 0 else None
    ppu = (usl - mean) / (3 * sigma_overall) if sigma_overall > 0 else None
    ppl = (mean - lsl) / (3 * sigma_overall) if sigma_overall > 0 else None
    ppk = min(ppu, ppl) if ppu is not None and ppl is not None else None

    return {
        "cp": round(cp, 3) if cp else None,
        "cpk": round(cpk, 3) if cpk else None,
        "pp": round(pp, 3) if pp else None,
        "ppk": round(ppk, 3) if ppk else None,
        "sigma_within": round(sigma_within, 4) if sigma_within else None,
        "sigma_overall": round(sigma_overall, 4) if sigma_overall else None,
        "mean": round(mean, 4),
        "usl": usl,
        "lsl": lsl,
        "n": n,
    }


# ── 1. Shewhart X-bar Chart ─────────────────────────────────

@router.get("/shewhart/{instrument_tag}")
def shewhart_chart(
    instrument_tag: str,
    time_range: str = Query("-6h", description="InfluxDB range: -1h, -6h, -24h, -7d"),
    downsample: Optional[str] = Query(None, description="Downsample: 10s, 1m, 5m"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Shewhart X̄ chart with control limits, capability indices & WE rules."""
    inst = db.query(Instrument).filter(Instrument.tag == instrument_tag).first()
    if not inst:
        return {"error": f"Instrumento {instrument_tag} no encontrado"}

    readings = query_sensor_history(tag=instrument_tag, time_range=time_range, downsample=downsample)
    if len(readings) < 5:
        return {"error": "Datos insuficientes", "data": [], "limits": None}

    values = [r["value"] for r in readings if r["value"] is not None]
    times = [r["time"] for r in readings if r["value"] is not None]
    n = len(values)
    mean = sum(values) / n
    sigma = math.sqrt(sum((x - mean) ** 2 for x in values) / (n - 1)) if n > 1 else 0

    ucl = mean + 3 * sigma
    lcl = mean - 3 * sigma
    uwl = mean + 2 * sigma  # Warning limit
    lwl = mean - 2 * sigma

    # Moving range for subgroup=1
    mr = [abs(values[i] - values[i - 1]) for i in range(1, n)]
    mr_bar = sum(mr) / len(mr) if mr else 0

    # Capability
    capability = {}
    if inst.hi is not None and inst.lo is not None:
        capability = _capability_indices(values, inst.sp or mean, inst.hi, inst.lo)

    # Western Electric Rules
    we_violations = _we_rules(values, mean, sigma)

    # Build data series
    data = []
    for i in range(n):
        point = {
            "time": times[i],
            "value": round(values[i], 4),
            "zone": "A" if abs(values[i] - mean) > 2 * sigma else ("B" if abs(values[i] - mean) > sigma else "C"),
            "ooc": abs(values[i] - mean) > 3 * sigma,
        }
        data.append(point)

    return {
        "instrument": {
            "tag": inst.tag,
            "description": inst.description,
            "unit": inst.unit,
            "sp": inst.sp,
            "hi": inst.hi,
            "lo": inst.lo,
            "hihi": inst.hihi,
            "lolo": inst.lolo,
        },
        "limits": {
            "cl": round(mean, 4),
            "ucl": round(ucl, 4),
            "lcl": round(lcl, 4),
            "uwl": round(uwl, 4),
            "lwl": round(lwl, 4),
            "sigma": round(sigma, 4),
        },
        "moving_range": {
            "mr_bar": round(mr_bar, 4),
            "ucl_mr": round(mr_bar * 3.267, 4),  # D4 for n=2
        },
        "capability": capability,
        "violations": we_violations,
        "data": data,
        "n": n,
    }


# ── 2. CUSUM Chart ──────────────────────────────────────────

@router.get("/cusum/{instrument_tag}")
def cusum_chart(
    instrument_tag: str,
    time_range: str = Query("-6h"),
    k: float = Query(0.5, description="Slack value (multiples of σ)"),
    h: float = Query(5.0, description="Decision interval (multiples of σ)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """CUSUM (Cumulative Sum) chart for detecting small mean shifts."""
    readings = query_sensor_history(tag=instrument_tag, time_range=time_range)
    if len(readings) < 10:
        return {"error": "Datos insuficientes", "data": []}

    values = [r["value"] for r in readings if r["value"] is not None]
    times = [r["time"] for r in readings if r["value"] is not None]
    n = len(values)
    mean = sum(values) / n
    sigma = math.sqrt(sum((x - mean) ** 2 for x in values) / (n - 1)) if n > 1 else 1

    K = k * sigma
    H = h * sigma
    c_plus = [0.0]
    c_minus = [0.0]
    signals = []

    for i in range(1, n):
        zi = values[i] - mean
        cp = max(0, c_plus[-1] + zi - K)
        cm = max(0, c_minus[-1] - zi - K)
        c_plus.append(cp)
        c_minus.append(cm)
        if cp > H or cm > H:
            signals.append({
                "index": i,
                "time": times[i],
                "type": "upper" if cp > H else "lower",
                "desc": f"CUSUM excede H={'%.2f' % H}",
            })

    data = []
    for i in range(n):
        data.append({
            "time": times[i],
            "value": round(values[i], 4),
            "c_plus": round(c_plus[i], 4),
            "c_minus": round(c_minus[i], 4),
            "signal": c_plus[i] > H or c_minus[i] > H,
        })

    return {
        "params": {"k": k, "h": h, "K_abs": round(K, 4), "H_abs": round(H, 4), "mean": round(mean, 4), "sigma": round(sigma, 4)},
        "signals": signals,
        "data": data,
        "n": n,
    }


# ── 3. EWMA Chart ───────────────────────────────────────────

@router.get("/ewma/{instrument_tag}")
def ewma_chart(
    instrument_tag: str,
    time_range: str = Query("-6h"),
    lam: float = Query(0.2, ge=0.01, le=1.0, description="Smoothing factor λ"),
    L: float = Query(3.0, description="Control limit width (multiples of σ)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """EWMA (Exponentially Weighted Moving Average) chart."""
    readings = query_sensor_history(tag=instrument_tag, time_range=time_range)
    if len(readings) < 10:
        return {"error": "Datos insuficientes", "data": []}

    values = [r["value"] for r in readings if r["value"] is not None]
    times = [r["time"] for r in readings if r["value"] is not None]
    n = len(values)
    mean = sum(values) / n
    sigma = math.sqrt(sum((x - mean) ** 2 for x in values) / (n - 1)) if n > 1 else 1

    ewma = [mean]
    data = []
    signals = []

    for i in range(n):
        if i == 0:
            z = lam * values[0] + (1 - lam) * mean
        else:
            z = lam * values[i] + (1 - lam) * ewma[-1]
        ewma.append(z)

        # Time-varying limits
        factor = math.sqrt((lam / (2 - lam)) * (1 - (1 - lam) ** (2 * (i + 1))))
        ucl_i = mean + L * sigma * factor
        lcl_i = mean - L * sigma * factor
        ooc = z > ucl_i or z < lcl_i

        data.append({
            "time": times[i],
            "value": round(values[i], 4),
            "ewma": round(z, 4),
            "ucl": round(ucl_i, 4),
            "lcl": round(lcl_i, 4),
            "signal": ooc,
        })

        if ooc:
            signals.append({"index": i, "time": times[i], "ewma": round(z, 4)})

    return {
        "params": {"lambda": lam, "L": L, "mean": round(mean, 4), "sigma": round(sigma, 4)},
        "signals": signals,
        "data": data,
        "n": n,
    }


# ── 4. Instruments list for SPC selection ────────────────────

@router.get("/instruments")
def spc_instruments(
    process_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List instruments available for SPC analysis."""
    q = db.query(Instrument).filter(Instrument.is_active == True)
    if process_id:
        q = q.filter(Instrument.process_id == process_id)
    instruments = q.order_by(Instrument.tag).all()
    return [
        {
            "tag": i.tag,
            "description": i.description,
            "type": i.instrument_type,
            "unit": i.unit,
            "area": i.area,
            "sp": i.sp,
            "hi": i.hi,
            "lo": i.lo,
            "hihi": i.hihi,
            "lolo": i.lolo,
        }
        for i in instruments
    ]
