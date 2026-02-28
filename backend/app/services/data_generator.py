# ============================================================
# PetroVision — Synthetic Data Generator (Simulates PLC/OPC-UA)
# ============================================================
# Generates realistic sensor data using thermodynamic models
# with Gaussian noise, drift, and occasional faults.
# Writes to InfluxDB + broadcasts via WebSocket.
# ============================================================

import asyncio
import math
import random
from datetime import datetime, timezone
from loguru import logger

from app.core.config import get_settings
from app.core.influxdb import write_sensor_reading
from app.api.endpoints.websocket import manager

settings = get_settings()

# ── Alarm state tracking (avoid duplicate alarm spam) ────────
# key: (tag, alarm_type)  value: True if currently in alarm
_active_alarm_states: dict[tuple, bool] = {}


def _check_and_create_alarms(db_session, process_id_code: str, tag: str, value: float):
    """
    Compare sensor value against DB instrument limits and create/clear alarms.
    Follows ISA 18.2 lifecycle: UNACK_ACTIVE → ACK_ACTIVE → ACK_CLEAR.
    """
    try:
        from app.models.instrument import Instrument
        from app.models.alarm import Alarm
        from app.core.database import SessionLocal

        with SessionLocal() as db:
            inst = db.query(Instrument).filter(Instrument.tag == tag).first()
            if not inst:
                return

            now = datetime.now(timezone.utc)

            def maybe_create(alarm_type: str, limit: float | None, priority: str, msg_tpl: str):
                if limit is None:
                    return
                key = (tag, alarm_type)
                triggered = (
                    alarm_type.endswith("_HI") and value >= limit
                ) or (
                    alarm_type.endswith("_LO") and value <= limit
                )
                was_active = _active_alarm_states.get(key, False)

                if triggered and not was_active:
                    # Create new alarm
                    _active_alarm_states[key] = True
                    alarm = Alarm(
                        instrument_tag=tag,
                        process_id=inst.process_id,
                        area=inst.area,
                        priority=priority,
                        alarm_type=alarm_type,
                        message=msg_tpl.format(tag=tag, value=round(value, 2), limit=limit, unit=inst.unit or ""),
                        value=round(value, 2),
                        limit=limit,
                        unit=inst.unit,
                        state="UNACK_ACTIVE",
                        triggered_at=now,
                    )
                    db.add(alarm)
                    db.commit()
                    logger.warning(f"ALARM [{priority}] {tag}: {alarm_type} value={value:.2f} limit={limit}")

                elif not triggered and was_active:
                    # Clear the alarm
                    _active_alarm_states[key] = False
                    active = db.query(Alarm).filter(
                        Alarm.instrument_tag == tag,
                        Alarm.alarm_type == alarm_type,
                        Alarm.state.in_(["UNACK_ACTIVE", "ACK_ACTIVE"]),
                    ).first()
                    if active:
                        active.state = "UNACK_CLEAR" if active.state == "UNACK_ACTIVE" else "ACK_CLEAR"
                        active.cleared_at = now
                        db.commit()

            maybe_create("HIHI", inst.hihi, "CRITICA", "⛔ {tag}: HIHI — {value} {unit} ≥ {limit}")
            maybe_create("HI",   inst.hi,   "ALTA",    "⚠ {tag}: HI — {value} {unit} ≥ {limit}")
            maybe_create("LO",   inst.lo,   "MEDIA",   "⬇ {tag}: LO — {value} {unit} ≤ {limit}")
            maybe_create("LOLO", inst.lolo, "CRITICA", "⛔ {tag}: LOLO — {value} {unit} ≤ {limit}")

    except Exception as exc:
        logger.debug(f"Alarm check skipped for {tag}: {exc}")


class ProcessSimulator:
    """
    Simulates a chemical process with realistic sensor behavior.
    Supports multiple process configurations (generic).
    """

    def __init__(self, process_config: dict):
        self.config = process_config
        self.time_step = 0
        self.state = {}
        self._init_state()

    def _init_state(self):
        """Initialize process state from config."""
        for tag, spec in self.config.get("instruments", {}).items():
            self.state[tag] = {
                "value": spec.get("sp", 0),
                "sp": spec.get("sp", 0),
                "drift": 0.0,
                "noise_scale": spec.get("noise_scale", 1.0),
            }

    def step(self) -> dict[str, float]:
        """
        Advance simulation by one time step.
        Returns dict of {tag: value} for all instruments.
        """
        self.time_step += 1
        readings = {}

        for tag, state in self.state.items():
            spec = self.config["instruments"].get(tag, {})

            # Base: mean-reverting process around setpoint
            sp = state["sp"]
            prev = state["value"]
            noise = random.gauss(0, state["noise_scale"])

            # Mean reversion (Ornstein-Uhlenbeck-like)
            theta = spec.get("mean_reversion", 0.1)  # reversion speed
            new_val = prev + theta * (sp - prev) + noise

            # Slow sinusoidal drift (simulates ambient changes)
            drift_amplitude = spec.get("drift_amplitude", 0)
            drift_period = spec.get("drift_period", 300)  # steps
            if drift_amplitude > 0:
                new_val += drift_amplitude * math.sin(2 * math.pi * self.time_step / drift_period)

            # Occasional spike (simulates transient disturbance)
            if random.random() < 0.002:  # 0.2% chance per step
                spike = random.choice([-1, 1]) * state["noise_scale"] * 5
                new_val += spike
                logger.debug(f"Spike on {tag}: {spike:+.2f}")

            # Clamp to physical range
            range_min = spec.get("range_min", new_val - 100)
            range_max = spec.get("range_max", new_val + 100)
            new_val = max(range_min, min(range_max, new_val))

            state["value"] = new_val
            readings[tag] = round(new_val, 4)

        return readings


# ── Process Configurations ───────────────────────────────────

MALEIC_ANHYDRIDE_CONFIG = {
    "process_id": "MA-100",
    "name": "Anhídrido Maleico — Oxidación de n-Butano",
    "instruments": {
        "TI-101": {"sp": 420, "noise_scale": 1.5, "mean_reversion": 0.08, "drift_amplitude": 2.0, "drift_period": 400, "range_min": 350, "range_max": 500, "unit": "°C", "area": "Reactor"},
        "TI-102": {"sp": 420, "noise_scale": 1.8, "mean_reversion": 0.07, "drift_amplitude": 2.5, "drift_period": 350, "range_min": 350, "range_max": 500, "unit": "°C", "area": "Reactor"},
        "TI-103": {"sp": 60, "noise_scale": 1.0, "mean_reversion": 0.1, "drift_amplitude": 1.0, "drift_period": 500, "range_min": 20, "range_max": 120, "unit": "°C", "area": "Enfriamiento"},
        "TI-104": {"sp": 50, "noise_scale": 0.8, "mean_reversion": 0.12, "drift_amplitude": 0.5, "drift_period": 600, "range_min": 10, "range_max": 100, "unit": "°C", "area": "Enfriamiento"},
        "TI-105": {"sp": 25, "noise_scale": 0.5, "mean_reversion": 0.15, "drift_amplitude": 0.3, "drift_period": 700, "range_min": 5, "range_max": 60, "unit": "°C", "area": "Absorción"},
        "TI-106": {"sp": 140, "noise_scale": 1.2, "mean_reversion": 0.09, "drift_amplitude": 1.5, "drift_period": 450, "range_min": 100, "range_max": 200, "unit": "°C", "area": "Destilación"},
        "TI-107": {"sp": 180, "noise_scale": 1.4, "mean_reversion": 0.08, "drift_amplitude": 1.8, "drift_period": 380, "range_min": 120, "range_max": 250, "unit": "°C", "area": "Destilación"},
        "TI-108": {"sp": 202, "noise_scale": 0.6, "mean_reversion": 0.1, "drift_amplitude": 0.5, "drift_period": 500, "range_min": 180, "range_max": 230, "unit": "°C", "area": "Fundición"},
        "PI-101": {"sp": 2.1, "noise_scale": 0.03, "mean_reversion": 0.1, "drift_amplitude": 0.02, "drift_period": 500, "range_min": 0, "range_max": 5.0, "unit": "bar", "area": "Reactor"},
        "PI-102": {"sp": 1.8, "noise_scale": 0.02, "mean_reversion": 0.12, "drift_amplitude": 0.01, "drift_period": 600, "range_min": 0, "range_max": 4.0, "unit": "bar", "area": "Absorción"},
        "PI-103": {"sp": 0.8, "noise_scale": 0.015, "mean_reversion": 0.1, "drift_amplitude": 0.01, "drift_period": 550, "range_min": 0, "range_max": 2.0, "unit": "bar", "area": "Destilación"},
        "PI-104": {"sp": 1.0, "noise_scale": 0.01, "mean_reversion": 0.15, "drift_amplitude": 0.005, "drift_period": 700, "range_min": 0, "range_max": 3.0, "unit": "bar", "area": "Fundición"},
        "FI-101": {"sp": 340.18, "noise_scale": 5.0, "mean_reversion": 0.1, "drift_amplitude": 3.0, "drift_period": 400, "range_min": 0, "range_max": 700, "unit": "kg/h", "area": "Alimentación"},
        "FI-102": {"sp": 1200, "noise_scale": 15.0, "mean_reversion": 0.08, "drift_amplitude": 10.0, "drift_period": 350, "range_min": 0, "range_max": 2500, "unit": "kg/h", "area": "Alimentación"},
        "FI-103": {"sp": 220.95, "noise_scale": 4.0, "mean_reversion": 0.09, "drift_amplitude": 2.0, "drift_period": 450, "range_min": 0, "range_max": 500, "unit": "kg/h", "area": "Producto"},
        "LI-101": {"sp": 60, "noise_scale": 2.0, "mean_reversion": 0.05, "drift_amplitude": 1.5, "drift_period": 600, "range_min": 0, "range_max": 100, "unit": "%", "area": "Absorción"},
        "LI-102": {"sp": 45, "noise_scale": 1.5, "mean_reversion": 0.06, "drift_amplitude": 1.0, "drift_period": 550, "range_min": 0, "range_max": 100, "unit": "%", "area": "Destilación"},
        "LI-103": {"sp": 70, "noise_scale": 1.0, "mean_reversion": 0.08, "drift_amplitude": 0.8, "drift_period": 500, "range_min": 0, "range_max": 100, "unit": "%", "area": "Tanque"},
        "AI-101": {"sp": 99.5, "noise_scale": 0.15, "mean_reversion": 0.12, "drift_amplitude": 0.1, "drift_period": 800, "range_min": 95, "range_max": 100, "unit": "%", "area": "Calidad"},
        "AI-102": {"sp": 7.0, "noise_scale": 0.05, "mean_reversion": 0.15, "drift_amplitude": 0.03, "drift_period": 900, "range_min": 0, "range_max": 14, "unit": "pH", "area": "Calidad"},
        "VI-101": {"sp": 2.5, "noise_scale": 0.3, "mean_reversion": 0.1, "drift_amplitude": 0.2, "drift_period": 400, "range_min": 0, "range_max": 10, "unit": "mm/s", "area": "Reactor"},
    },
}

TARTARIC_ACID_CONFIG = {
    "process_id": "AT-200",
    "name": "Ácido Tartárico — Extracción de Residuos Vitivinícolas",
    "instruments": {
        "TI-201": {"sp": 85, "noise_scale": 0.8, "mean_reversion": 0.1, "drift_amplitude": 1.0, "drift_period": 500, "range_min": 20, "range_max": 120, "unit": "°C", "area": "Desulfitación"},
        "TI-202": {"sp": 70, "noise_scale": 0.6, "mean_reversion": 0.12, "drift_amplitude": 0.8, "drift_period": 450, "range_min": 20, "range_max": 100, "unit": "°C", "area": "Evaporador 1°"},
        "TI-203": {"sp": 80, "noise_scale": 0.7, "mean_reversion": 0.11, "drift_amplitude": 0.9, "drift_period": 480, "range_min": 20, "range_max": 105, "unit": "°C", "area": "Evaporador 2°"},
        "TI-204": {"sp": 30, "noise_scale": 0.4, "mean_reversion": 0.15, "drift_amplitude": 0.3, "drift_period": 600, "range_min": 5, "range_max": 50, "unit": "°C", "area": "Condensador"},
        "TI-205": {"sp": 5, "noise_scale": 0.2, "mean_reversion": 0.2, "drift_amplitude": 0.1, "drift_period": 700, "range_min": -5, "range_max": 20, "unit": "°C", "area": "Enfriador"},
        "PI-201": {"sp": 1.0, "noise_scale": 0.02, "mean_reversion": 0.12, "drift_amplitude": 0.01, "drift_period": 550, "range_min": 0, "range_max": 3.0, "unit": "bar", "area": "Evaporador"},
        "FI-201": {"sp": 71.4, "noise_scale": 2.0, "mean_reversion": 0.1, "drift_amplitude": 1.5, "drift_period": 400, "range_min": 0, "range_max": 200, "unit": "kg/h", "area": "Alimentación"},
        "FI-202": {"sp": 2.08, "noise_scale": 0.1, "mean_reversion": 0.12, "drift_amplitude": 0.05, "drift_period": 500, "range_min": 0, "range_max": 10, "unit": "kg/h", "area": "Producto"},
        "LI-201": {"sp": 55, "noise_scale": 2.0, "mean_reversion": 0.06, "drift_amplitude": 1.5, "drift_period": 500, "range_min": 0, "range_max": 100, "unit": "%", "area": "Tanque MP"},
        "AI-201": {"sp": 99.2, "noise_scale": 0.2, "mean_reversion": 0.1, "drift_amplitude": 0.15, "drift_period": 700, "range_min": 95, "range_max": 100, "unit": "%", "area": "Calidad"},
        "AI-202": {"sp": 3.2, "noise_scale": 0.05, "mean_reversion": 0.15, "drift_amplitude": 0.03, "drift_period": 800, "range_min": 2.0, "range_max": 5.0, "unit": "pH", "area": "Calidad"},
    },
}


# ── Simulation Runner ────────────────────────────────────────

_simulators: dict[str, ProcessSimulator] = {}


def get_simulator(process_id: str) -> ProcessSimulator:
    """Get or create a simulator for a given process."""
    if process_id not in _simulators:
        configs = {
            "MA-100": MALEIC_ANHYDRIDE_CONFIG,
            "AT-200": TARTARIC_ACID_CONFIG,
        }
        config = configs.get(process_id, MALEIC_ANHYDRIDE_CONFIG)
        _simulators[process_id] = ProcessSimulator(config)
    return _simulators[process_id]


# ── Alarm Generation ────────────────────────────────────────

# Track which (tag, alarm_type) combos are currently active to avoid duplication
_active_alarm_keys: set[str] = set()


def _check_and_create_alarms(db, process_id: str, tag: str, value: float, spec: dict):
    """
    Compare value against hi/hihi/lo/lolo limits and create Alarm rows.
    Reuses information from the process DB records.
    """
    if db is None:
        return

    from app.models.alarm import Alarm
    from app.models.process import ChemicalProcess
    from app.models.instrument import Instrument as InstrumentModel

    # Quick lookup of process DB id
    proc = db.query(ChemicalProcess).filter(ChemicalProcess.code == process_id).first()
    if not proc:
        return

    inst = db.query(InstrumentModel).filter(InstrumentModel.tag == tag).first()
    if not inst:
        return

    checks = [
        ("hihi", inst.hihi, "CRITICA", "HH"),
        ("lolo", inst.lolo, "CRITICA", "LL"),
        ("hi",   inst.hi,   "ALTA",    "H"),
        ("lo",   inst.lo,   "BAJA",    "L"),
    ]

    for limit_name, limit_val, priority, alarm_type in checks:
        if limit_val is None:
            continue

        active_key = f"{tag}:{alarm_type}"

        if limit_name in ("hihi", "hi") and value >= limit_val:
            if active_key not in _active_alarm_keys:
                _active_alarm_keys.add(active_key)
                alarm = Alarm(
                    instrument_tag=tag,
                    process_id=proc.id,
                    area=inst.area,
                    priority=priority,
                    alarm_type=alarm_type,
                    message=f"{tag} {alarm_type}: {value:.2f} {inst.unit} ≥ {limit_val} {inst.unit}",
                    value=value,
                    limit=limit_val,
                    unit=inst.unit,
                    state="UNACK_ACTIVE",
                )
                db.add(alarm)
                try:
                    db.flush()
                    _broadcast_alarm_sync(alarm, tag, priority, alarm_type, value, limit_val, inst.unit, proc.id)
                except Exception:
                    db.rollback()
        elif limit_name in ("lolo", "lo") and value <= limit_val:
            if active_key not in _active_alarm_keys:
                _active_alarm_keys.add(active_key)
                alarm = Alarm(
                    instrument_tag=tag,
                    process_id=proc.id,
                    area=inst.area,
                    priority=priority,
                    alarm_type=alarm_type,
                    message=f"{tag} {alarm_type}: {value:.2f} {inst.unit} ≤ {limit_val} {inst.unit}",
                    value=value,
                    limit=limit_val,
                    unit=inst.unit,
                    state="UNACK_ACTIVE",
                )
                db.add(alarm)
                try:
                    db.flush()
                    _broadcast_alarm_sync(alarm, tag, priority, alarm_type, value, limit_val, inst.unit, proc.id)
                except Exception:
                    db.rollback()
        else:
            # Value is back in range — remove from active set
            _active_alarm_keys.discard(active_key)

    try:
        db.commit()
    except Exception:
        db.rollback()


def _broadcast_alarm_sync(alarm, tag, priority, alarm_type, value, limit, unit, process_id):
    """Schedule alarm broadcast on the event loop + send push notifications."""
    import asyncio
    from datetime import datetime, timezone
    payload = {
        "channel": "alarms",
        "data": {
            "id": alarm.id if hasattr(alarm, 'id') and alarm.id else 0,
            "instrument_tag": tag,
            "process_id": process_id,
            "priority": priority,
            "alarm_type": alarm_type,
            "message": alarm.message,
            "value": value,
            "limit": limit,
            "unit": unit,
            "state": "UNACK_ACTIVE",
            "triggered_at": datetime.now(timezone.utc).isoformat(),
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.ensure_future(manager.broadcast("alarms", payload))
    except Exception:
        pass

    # ── Send Web Push for critical alarms ────────────────────
    if priority in ("CRITICA", "ALTA"):
        try:
            from app.services.push_service import send_alarm_push
            from app.core.database import SessionLocal
            push_db = SessionLocal()
            try:
                send_alarm_push(push_db, payload["data"])
            finally:
                push_db.close()
        except Exception as ex:
            logger.debug(f"Push notification skipped: {ex}")


async def run_simulation_loop():
    """
    Main simulation loop — runs continuously, generating data every N seconds.
    Writes to InfluxDB and broadcasts via WebSocket.
    """
    logger.info(f"Starting simulation loop (interval: {settings.SIMULATION_INTERVAL_SECONDS}s)")

    # Initialize simulators for all configured processes
    for process_id in ["MA-100", "AT-200"]:
        get_simulator(process_id)

    # Keep a DB session for alarm creation
    from app.core.database import SessionLocal
    while True:
        db = SessionLocal()
        try:
            for process_id, sim in _simulators.items():
                readings = sim.step()
                config = sim.config

                # Write each reading to InfluxDB and check alarms
                for tag, value in readings.items():
                    spec = config["instruments"].get(tag, {})
                    try:
                        write_sensor_reading(
                            measurement=spec.get("unit", "value").replace("°", "deg").replace("/", "_").replace("%", "pct"),
                            tag=tag,
                            value=value,
                            process_id=process_id,
                            area=spec.get("area", "General"),
                        )
                    except Exception:
                        pass

                    # Alarm check (every tick)
                    _check_and_create_alarms(db, process_id, tag, value, config["instruments"].get(tag, {}))

                # Broadcast via WebSocket — format matches frontend LiveDataMessage
                now_iso = datetime.now(timezone.utc).isoformat()
                ws_payload = {
                    "channel": "live-data",
                    "process": process_id,
                    "timestamp": now_iso,
                    "data": [
                        {
                            "tag": tag,
                            "value": value,
                            "unit": config["instruments"][tag].get("unit", ""),
                            "sp": config["instruments"][tag].get("sp", 0),
                            "quality": "GOOD",
                            "timestamp": now_iso,
                        }
                        for tag, value in readings.items()
                    ],
                }
                await manager.broadcast("live-data", ws_payload)

        except Exception as e:
            logger.error(f"Simulation loop error: {e}")
        finally:
            db.close()

        await asyncio.sleep(settings.SIMULATION_INTERVAL_SECONDS)


def get_latest_readings() -> dict[str, dict]:
    """
    Return the most recent simulated value for every known instrument tag.
    Used by the /instruments/live REST endpoint.
    """
    out: dict[str, dict] = {}
    for process_id, sim in _simulators.items():
        config = sim.config
        for tag, state in sim.state.items():
            spec = config["instruments"].get(tag, {})
            out[tag] = {
                "tag": tag,
                "value": round(state["value"], 4),
                "sp": spec.get("sp", 0),
                "unit": spec.get("unit", ""),
                "quality": "GOOD",
                "process_id": process_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
    return out