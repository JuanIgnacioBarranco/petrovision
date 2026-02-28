# ============================================================
# PetroVision — Database Seed (Initial Data)
# ============================================================
# Populates the database with:
# - Default users (admin, operator, engineer, etc.)
# - Both chemical process configurations
# - All instruments, equipment, PID loops, and interlocks
# ============================================================

from sqlalchemy.orm import Session
from loguru import logger

from app.core.security import hash_password
from app.models.user import User
from app.models.process import ChemicalProcess, ProcessParameter
from app.models.instrument import Instrument, Equipment, PIDLoop, Interlock
from app.models.ml_model import MLModel
from app.models.batch import Batch


def seed_database(db: Session):
    """Seed the database with initial data if empty."""
    if db.query(User).count() > 0:
        logger.info("Database already seeded, skipping.")
        return

    logger.info("Seeding database...")

    # ── Users ────────────────────────────────────────────────
    users = [
        User(username="admin", email="admin@petrovision.com", full_name="Administrador del Sistema",
             hashed_password=hash_password("admin2026"), role="admin"),
        User(username="operador1", email="operador1@petrovision.com", full_name="Carlos Mendoza",
             hashed_password=hash_password("operador2026"), role="operador", area="Reactor", shift="Mañana"),
        User(username="operador2", email="operador2@petrovision.com", full_name="María López",
             hashed_password=hash_password("operador2026"), role="operador", area="Destilación", shift="Tarde"),
        User(username="ing_quimico", email="iquimico@petrovision.com", full_name="Dr. Roberto García",
             hashed_password=hash_password("ingeniero2026"), role="ingeniero_quimico"),
        User(username="data_scientist", email="ds@petrovision.com", full_name="Sofía Barrancos",
             hashed_password=hash_password("datascience2026"), role="data_scientist"),
        User(username="supervisor", email="supervisor@petrovision.com", full_name="Ing. Pedro Sánchez",
             hashed_password=hash_password("supervisor2026"), role="supervisor"),
    ]
    db.add_all(users)
    db.flush()

    # ── Chemical Process: Maleic Anhydride ───────────────────
    ma = ChemicalProcess(
        name="Producción de Anhídrido Maleico",
        code="MA-100",
        description="Oxidación catalítica de n-butano para producir anhídrido maleico. Reactor tubular de lecho fijo con catalizador V₂O₅-MoO₃/TiO₂.",
        reaction_equation="C₄H₁₀ + 3.5 O₂ → C₄H₂O₃ + 4 H₂O",
        catalyst="V₂O₅-MoO₃/TiO₂",
        temperature_sp=420,
        pressure_sp=2.1,
        conversion=0.77,
        selectivity=0.80,
        yield_global=0.616,
        feed_material="n-Butano",
        feed_rate_kg_h=340.18,
        feed_density=0.573,
        product_name="Anhídrido Maleico",
        product_mw=98.06,
        product_rate_kg_h=220.95,
        feed_cost_per_kg=0.85,
        product_price_per_kg=2.45,
        stoichiometry=[
            {"name": "n-Butano", "formula": "C₄H₁₀", "mw": 58.12, "coeff": -1, "role": "reactant"},
            {"name": "Oxígeno", "formula": "O₂", "mw": 32.00, "coeff": -3.5, "role": "reactant"},
            {"name": "Anhídrido Maleico", "formula": "C₄H₂O₃", "mw": 98.06, "coeff": 1, "role": "product"},
            {"name": "Agua", "formula": "H₂O", "mw": 18.02, "coeff": 4, "role": "product"},
        ],
    )
    db.add(ma)
    db.flush()

    # ── Chemical Process: Tartaric Acid ──────────────────────
    at = ChemicalProcess(
        name="Extracción de Ácido Tartárico",
        code="AT-200",
        description="Extracción de ácido tartárico a partir de residuos vitivinícolas (orujo y borras de vino). Proceso de intercambio iónico, evaporación y cristalización.",
        reaction_equation="CaC₄H₄O₆ + H₂SO₄ → C₄H₆O₆ + CaSO₄",
        catalyst=None,
        temperature_sp=85,
        pressure_sp=1.0,
        conversion=0.85,
        selectivity=0.92,
        yield_global=0.04,
        feed_material="Residuos vitivinícolas (orujo + borras)",
        feed_rate_kg_h=71.4,
        feed_density=1.05,
        product_name="Ácido Tartárico",
        product_mw=150.09,
        product_rate_kg_h=2.08,
        feed_cost_per_kg=0.08,
        product_price_per_kg=4.80,
        stoichiometry=[
            {"name": "Tartrato de Calcio", "formula": "CaC₄H₄O₆", "mw": 188.18, "coeff": -1, "role": "reactant"},
            {"name": "Ácido Sulfúrico", "formula": "H₂SO₄", "mw": 98.08, "coeff": -1, "role": "reactant"},
            {"name": "Ácido Tartárico", "formula": "C₄H₆O₆", "mw": 150.09, "coeff": 1, "role": "product"},
            {"name": "Sulfato de Calcio", "formula": "CaSO₄", "mw": 136.14, "coeff": 1, "role": "product"},
        ],
    )
    db.add(at)
    db.flush()

    # ── MA-100 Instruments ───────────────────────────────────
    ma_instruments = [
        Instrument(process_id=ma.id, tag="TI-101", description="Temperatura reactor zona 1", instrument_type="temperature", unit="°C", area="Reactor", sp=420, lo=400, hi=440, lolo=380, hihi=450, range_min=0, range_max=600),
        Instrument(process_id=ma.id, tag="TI-102", description="Temperatura reactor zona 2", instrument_type="temperature", unit="°C", area="Reactor", sp=420, lo=400, hi=440, lolo=380, hihi=450, range_min=0, range_max=600),
        Instrument(process_id=ma.id, tag="TI-103", description="Temperatura salida enfriador", instrument_type="temperature", unit="°C", area="Enfriamiento", sp=60, lo=40, hi=80, lolo=30, hihi=90, range_min=0, range_max=200),
        Instrument(process_id=ma.id, tag="TI-104", description="Temperatura intercambiador", instrument_type="temperature", unit="°C", area="Enfriamiento", sp=50, lo=35, hi=65, lolo=25, hihi=75, range_min=0, range_max=150),
        Instrument(process_id=ma.id, tag="TI-105", description="Temperatura agua absorción", instrument_type="temperature", unit="°C", area="Absorción", sp=25, lo=15, hi=35, lolo=10, hihi=40, range_min=0, range_max=80),
        Instrument(process_id=ma.id, tag="TI-106", description="Temperatura fondo columna", instrument_type="temperature", unit="°C", area="Destilación", sp=140, lo=120, hi=160, lolo=100, hihi=170, range_min=0, range_max=250),
        Instrument(process_id=ma.id, tag="TI-107", description="Temperatura cabeza columna", instrument_type="temperature", unit="°C", area="Destilación", sp=180, lo=160, hi=200, lolo=150, hihi=210, range_min=0, range_max=300),
        Instrument(process_id=ma.id, tag="TI-108", description="Temperatura fundición MA", instrument_type="temperature", unit="°C", area="Fundición", sp=202, lo=195, hi=210, lolo=190, hihi=215, range_min=0, range_max=300),
        Instrument(process_id=ma.id, tag="PI-101", description="Presión reactor", instrument_type="pressure", unit="bar", area="Reactor", sp=2.1, lo=1.8, hi=2.4, lolo=1.5, hihi=2.7, range_min=0, range_max=5),
        Instrument(process_id=ma.id, tag="PI-102", description="Presión absorción", instrument_type="pressure", unit="bar", area="Absorción", sp=1.8, lo=1.5, hi=2.1, lolo=1.2, hihi=2.3, range_min=0, range_max=4),
        Instrument(process_id=ma.id, tag="PI-103", description="Presión destilación", instrument_type="pressure", unit="bar", area="Destilación", sp=0.8, lo=0.5, hi=1.1, lolo=0.3, hihi=1.3, range_min=0, range_max=2),
        Instrument(process_id=ma.id, tag="PI-104", description="Presión fundición", instrument_type="pressure", unit="bar", area="Fundición", sp=1.0, lo=0.8, hi=1.2, lolo=0.6, hihi=1.4, range_min=0, range_max=3),
        Instrument(process_id=ma.id, tag="FI-101", description="Flujo n-butano", instrument_type="flow", unit="kg/h", area="Alimentación", sp=340.18, lo=300, hi=380, lolo=250, hihi=400, range_min=0, range_max=700),
        Instrument(process_id=ma.id, tag="FI-102", description="Flujo oxígeno", instrument_type="flow", unit="kg/h", area="Alimentación", sp=1200, lo=1000, hi=1400, lolo=800, hihi=1500, range_min=0, range_max=2500),
        Instrument(process_id=ma.id, tag="FI-103", description="Flujo producto MA", instrument_type="flow", unit="kg/h", area="Producto", sp=220.95, lo=180, hi=260, lolo=150, hihi=280, range_min=0, range_max=500),
        Instrument(process_id=ma.id, tag="LI-101", description="Nivel tanque absorción", instrument_type="level", unit="%", area="Absorción", sp=60, lo=30, hi=80, lolo=20, hihi=90, range_min=0, range_max=100),
        Instrument(process_id=ma.id, tag="LI-102", description="Nivel columna destilación", instrument_type="level", unit="%", area="Destilación", sp=45, lo=25, hi=65, lolo=15, hihi=75, range_min=0, range_max=100),
        Instrument(process_id=ma.id, tag="LI-103", description="Nivel tanque producto", instrument_type="level", unit="%", area="Tanque", sp=70, lo=30, hi=85, lolo=20, hihi=95, range_min=0, range_max=100),
        Instrument(process_id=ma.id, tag="AI-101", description="Pureza anhídrido maleico", instrument_type="analyzer", unit="%", area="Calidad", sp=99.5, lo=99.0, hi=100, lolo=98.5, hihi=100, range_min=95, range_max=100),
        Instrument(process_id=ma.id, tag="AI-102", description="pH agua proceso", instrument_type="analyzer", unit="pH", area="Calidad", sp=7.0, lo=6.5, hi=7.5, lolo=6.0, hihi=8.0, range_min=0, range_max=14),
        Instrument(process_id=ma.id, tag="VI-101", description="Vibración bomba P-101", instrument_type="vibration", unit="mm/s", area="Reactor", sp=2.5, lo=0, hi=5.0, lolo=0, hihi=7.5, range_min=0, range_max=10),
    ]
    db.add_all(ma_instruments)

    # ── MA-100 Equipment ─────────────────────────────────────
    ma_equipment = [
        Equipment(process_id=ma.id, tag="R-101", name="Reactor Tubular de Lecho Fijo", equipment_type="reactor", area="Reactor", specs={"material": "SS316L", "tubes": 5000, "length_m": 3.5, "capacity_m3": 15}),
        Equipment(process_id=ma.id, tag="E-101", name="Precalentador de Alimentación", equipment_type="heat_exchanger", area="Alimentación", specs={"type": "shell_and_tube", "area_m2": 25}),
        Equipment(process_id=ma.id, tag="E-102", name="Enfriador de Gas de Reacción", equipment_type="heat_exchanger", area="Enfriamiento", specs={"type": "shell_and_tube", "area_m2": 40}),
        Equipment(process_id=ma.id, tag="E-103", name="Intercambiador Producto", equipment_type="heat_exchanger", area="Enfriamiento"),
        Equipment(process_id=ma.id, tag="T-101", name="Columna de Absorción", equipment_type="column", area="Absorción", specs={"height_m": 12, "diameter_m": 1.5, "stages": 20}),
        Equipment(process_id=ma.id, tag="T-102", name="Columna de Destilación", equipment_type="column", area="Destilación", specs={"height_m": 15, "diameter_m": 1.2, "stages": 30}),
        Equipment(process_id=ma.id, tag="P-101", name="Bomba de Alimentación n-Butano", equipment_type="pump", area="Alimentación", specs={"power_kw": 15, "flow_m3h": 0.6}),
        Equipment(process_id=ma.id, tag="P-102", name="Bomba de Recirculación", equipment_type="pump", area="Absorción", specs={"power_kw": 7.5, "flow_m3h": 5}),
        Equipment(process_id=ma.id, tag="C-101", name="Compresor de Aire", equipment_type="compressor", area="Alimentación", specs={"power_kw": 75, "flow_nm3h": 800}),
        Equipment(process_id=ma.id, tag="TK-101", name="Tanque de Almacenamiento n-Butano", equipment_type="tank", area="Almacenamiento", specs={"capacity_m3": 50, "material": "carbon_steel"}),
        Equipment(process_id=ma.id, tag="TK-102", name="Tanque de Producto MA", equipment_type="tank", area="Almacenamiento", specs={"capacity_m3": 30, "heated": True}),
        Equipment(process_id=ma.id, tag="K-101", name="Horno de Fundición MA", equipment_type="furnace", area="Fundición", specs={"power_kw": 50, "temp_max_c": 250}),
        Equipment(process_id=ma.id, tag="F-101", name="Filtro de Partículas", equipment_type="filter", area="Producto"),
        Equipment(process_id=ma.id, tag="V-101", name="Válvula de Seguridad PSV-101", equipment_type="safety_valve", area="Reactor"),
    ]
    db.add_all(ma_equipment)

    # ── MA-100 PID Loops ─────────────────────────────────────
    ma_pid_loops = [
        PIDLoop(process_id=ma.id, tag="TIC-101", description="Control temperatura reactor zona 1", pv_tag="TI-101", cv_tag="TV-101", kp=2.5, ti=120, td=15, mode="AUTO", setpoint=420),
        PIDLoop(process_id=ma.id, tag="PIC-101", description="Control presión reactor", pv_tag="PI-101", cv_tag="PV-101", kp=1.8, ti=60, td=5, mode="AUTO", setpoint=2.1),
        PIDLoop(process_id=ma.id, tag="FIC-101", description="Control flujo n-butano", pv_tag="FI-101", cv_tag="FV-101", kp=1.2, ti=30, td=0, mode="CASCADE", setpoint=340.18),
        PIDLoop(process_id=ma.id, tag="FIC-102", description="Control flujo oxígeno", pv_tag="FI-102", cv_tag="FV-102", kp=1.0, ti=25, td=0, mode="AUTO", setpoint=1200),
        PIDLoop(process_id=ma.id, tag="TIC-104", description="Control temperatura enfriador", pv_tag="TI-104", cv_tag="TV-104", kp=2.0, ti=90, td=10, mode="AUTO", setpoint=50),
        PIDLoop(process_id=ma.id, tag="LIC-102", description="Control nivel destilación", pv_tag="LI-102", cv_tag="LV-102", kp=1.5, ti=180, td=0, mode="AUTO", setpoint=45),
        PIDLoop(process_id=ma.id, tag="TIC-107", description="Control temperatura destilación", pv_tag="TI-107", cv_tag="TV-107", kp=2.2, ti=100, td=12, mode="MANUAL", setpoint=180),
        PIDLoop(process_id=ma.id, tag="TIC-108", description="Control temperatura fundición", pv_tag="TI-108", cv_tag="TV-108", kp=3.0, ti=60, td=8, mode="AUTO", setpoint=202),
    ]
    db.add_all(ma_pid_loops)

    # ── MA-100 Interlocks ────────────────────────────────────
    ma_interlocks = [
        Interlock(process_id=ma.id, tag="SIS-001", description="Sobre-temperatura reactor: shutdown alimentación", trigger_tag="TI-101", trigger_condition=">450", trigger_value=450, action="Cerrar FV-101 y FV-102, abrir PSV-101, activar dilución N₂", sil_level=2),
        Interlock(process_id=ma.id, tag="SIS-002", description="Sobre-presión reactor: venteo de emergencia", trigger_tag="PI-101", trigger_condition=">2.7", trigger_value=2.7, action="Abrir PSV-101, cerrar alimentación, activar alarma", sil_level=2),
        Interlock(process_id=ma.id, tag="SIS-003", description="Bajo flujo n-butano: parada reactor", trigger_tag="FI-101", trigger_condition="<250", trigger_value=250, action="Cerrar válvula O₂, reducir temperatura gradualmente", sil_level=1),
        Interlock(process_id=ma.id, tag="SIS-004", description="Alto nivel absorción: desvío", trigger_tag="LI-101", trigger_condition=">90", trigger_value=90, action="Activar bomba P-102 respaldo, abrir desvío al tanque de emergencia", sil_level=1),
        Interlock(process_id=ma.id, tag="SIS-005", description="Alta vibración bomba: parada automática", trigger_tag="VI-101", trigger_condition=">7.5", trigger_value=7.5, action="Detener P-101, activar P-101B (respaldo)", sil_level=1),
        Interlock(process_id=ma.id, tag="SIS-006", description="Falla energía: parada segura", trigger_tag="EI-001", trigger_condition="==0", trigger_value=0, action="Secuencia de parada segura: cerrar válvulas, ventear reactor, activar UPS", sil_level=3),
    ]
    db.add_all(ma_interlocks)

    # ── ML Models (registry) ─────────────────────────────────
    ml_models = [
        MLModel(name="temperature_predictor", version="2.1.0", algorithm="LSTM (4-layer)", model_type="prediction",
                metrics={"rmse": 1.2, "mae": 0.8, "r2": 0.963, "mape": 0.28}, status="DEPLOYED", is_production=True,
                training_samples=50000, features_used=["TI_101", "PI_101", "FI_101", "FI_102"],
                hyperparameters={"layers": "64>32>16>1", "epochs": 500, "learning_rate": 0.001, "dropout": 0.2, "optimizer": "Adam"},
                description="Predicción de temperatura del reactor usando red LSTM multi-capa con ventana temporal de 60 pasos."),
        MLModel(name="yield_optimizer", version="2.0.0", algorithm="XGBoost", model_type="optimization",
                metrics={"rmse": 0.8, "r2": 0.941, "mae": 0.5, "mape": 0.74}, status="DEPLOYED", is_production=True,
                training_samples=10000, features_used=["TI_101", "PI_101", "FI_101", "FI_103", "AI_101", "catalyst_age"],
                hyperparameters={"n_estimators": 200, "max_depth": 8, "learning_rate": 0.05, "subsample": 0.8},
                description="Optimizador de rendimiento basado en modelo Response Surface + XGBoost. Incluye recomendaciones de operación."),
        MLModel(name="anomaly_detector", version="2.0.0", algorithm="Isolation Forest", model_type="anomaly",
                metrics={"precision": 0.925, "recall": 0.887, "f1": 0.906, "auc_roc": 0.953}, status="DEPLOYED", is_production=True,
                training_samples=100000, features_used=["TI_101", "TI_102", "PI_101", "FI_101", "LI_101", "AI_101", "VI_101"],
                hyperparameters={"n_estimators": 100, "contamination": 0.05, "max_features": 0.8},
                description="Detección de anomalías multivariable con clasificación de severidad ISA 18.2 y análisis de causa raíz."),
        MLModel(name="maintenance_predictor", version="2.0.0", algorithm="Random Forest + Weibull", model_type="classification",
                metrics={"accuracy": 0.921, "precision": 0.903, "recall": 0.887, "f1": 0.895}, status="DEPLOYED", is_production=True,
                training_samples=5000, features_used=["VI_101", "TI_101", "operating_hours", "last_maintenance_days", "load_pct"],
                hyperparameters={"n_estimators": 150, "max_depth": 12, "weibull_beta": 2.5, "weibull_eta": 8000},
                description="Predicción de mantenimiento con modelo Weibull de supervivencia. Calcula RUL, índice de salud y factores de riesgo."),
        MLModel(name="quality_predictor", version="1.0.0", algorithm="Gaussian Process", model_type="prediction",
                metrics={"rmse": 0.12, "r2": 0.978, "mae": 0.08}, status="DEPLOYED", is_production=True,
                training_samples=8000, features_used=["TI_101", "PI_101", "FI_101", "residence_time"],
                hyperparameters={"kernel": "RBF + WhiteNoise", "alpha": 1e-10, "n_restarts": 5},
                description="Predicción de pureza del producto usando Gaussian Process Regression con incertidumbre calibrada."),
        MLModel(name="energy_optimizer", version="1.0.0", algorithm="Multi-Objective (Pareto)", model_type="optimization",
                metrics={"savings_avg_pct": 8.3, "r2": 0.934, "mae": 2.1}, status="DEPLOYED", is_production=True,
                training_samples=15000, features_used=["power_kw", "TI_101", "throughput_kg_h", "ambient_temp"],
                hyperparameters={"objectives": ["min_energy", "max_throughput"], "pop_size": 100, "generations": 50},
                description="Optimización energética multi-objetivo. Minimiza consumo específico manteniendo throughput."),
    ]
    db.add_all(ml_models)

    db.commit()
    logger.info(f"Database seeded: {len(users)} users, 2 processes, {len(ma_instruments)} MA instruments, {len(ma_equipment)} equipment, {len(ma_pid_loops)} PID loops, {len(ma_interlocks)} interlocks, {len(ml_models)} ML models")


# ============================================================
# seed_missing_data — Idempotent pass that fills gaps
# (runs every startup; skips items that already exist)
# ============================================================

def seed_missing_data(db: Session):
    """
    Idempotent seeding pass.
    Adds AT-200 instruments, equipment, PID loops, and demo batches
    if they are not already present.
    """
    from datetime import datetime, timezone, timedelta

    # ── Locate processes ────────────────────────────────────
    at = db.query(ChemicalProcess).filter(ChemicalProcess.code == "AT-200").first()
    ma = db.query(ChemicalProcess).filter(ChemicalProcess.code == "MA-100").first()

    # ── AT-200 instruments ──────────────────────────────────
    if at and db.query(Instrument).filter(Instrument.process_id == at.id).count() == 0:
        at_instruments = [
            Instrument(process_id=at.id, tag="TI-201", description="Temperatura desulfitación", instrument_type="temperature", unit="°C", area="Desulfitación", sp=85, lo=70, hi=100, lolo=60, hihi=110, range_min=0, range_max=150),
            Instrument(process_id=at.id, tag="TI-202", description="Temperatura evaporador 1°", instrument_type="temperature", unit="°C", area="Evaporador 1°", sp=70, lo=55, hi=85, lolo=45, hihi=95, range_min=0, range_max=120),
            Instrument(process_id=at.id, tag="TI-203", description="Temperatura evaporador 2°", instrument_type="temperature", unit="°C", area="Evaporador 2°", sp=80, lo=65, hi=95, lolo=55, hihi=105, range_min=0, range_max=130),
            Instrument(process_id=at.id, tag="TI-204", description="Temperatura condensador", instrument_type="temperature", unit="°C", area="Condensador", sp=30, lo=20, hi=40, lolo=15, hihi=50, range_min=0, range_max=80),
            Instrument(process_id=at.id, tag="TI-205", description="Temperatura enfriador cristalización", instrument_type="temperature", unit="°C", area="Enfriador", sp=5, lo=0, hi=15, lolo=-5, hihi=20, range_min=-10, range_max=30),
            Instrument(process_id=at.id, tag="PI-201", description="Presión evaporador", instrument_type="pressure", unit="bar", area="Evaporador", sp=1.0, lo=0.7, hi=1.3, lolo=0.5, hihi=1.5, range_min=0, range_max=3),
            Instrument(process_id=at.id, tag="FI-201", description="Flujo orujo alimentación", instrument_type="flow", unit="kg/h", area="Alimentación", sp=71.4, lo=50, hi=90, lolo=30, hihi=100, range_min=0, range_max=200),
            Instrument(process_id=at.id, tag="FI-202", description="Flujo ácido tartárico producto", instrument_type="flow", unit="kg/h", area="Producto", sp=2.08, lo=1.5, hi=2.8, lolo=1.0, hihi=3.2, range_min=0, range_max=10),
            Instrument(process_id=at.id, tag="LI-201", description="Nivel tanque materia prima", instrument_type="level", unit="%", area="Tanque MP", sp=55, lo=25, hi=80, lolo=15, hihi=90, range_min=0, range_max=100),
            Instrument(process_id=at.id, tag="AI-201", description="Pureza ácido tartárico", instrument_type="analyzer", unit="%", area="Calidad", sp=99.2, lo=98.5, hi=100, lolo=98.0, hihi=100, range_min=95, range_max=100),
            Instrument(process_id=at.id, tag="AI-202", description="pH solución tartárica", instrument_type="analyzer", unit="pH", area="Calidad", sp=3.2, lo=2.8, hi=3.6, lolo=2.5, hihi=4.0, range_min=2, range_max=5),
        ]
        db.add_all(at_instruments)
        logger.info(f"Seeded {len(at_instruments)} AT-200 instruments")

    # ── AT-200 equipment ────────────────────────────────────
    if at and db.query(Equipment).filter(Equipment.process_id == at.id).count() == 0:
        at_equipment = [
            Equipment(process_id=at.id, tag="TK-201", name="Tanque Materia Prima (Orujo)", equipment_type="tank", area="Almacenamiento", specs={"capacity_m3": 25}),
            Equipment(process_id=at.id, tag="R-201", name="Reactor Desulfitación", equipment_type="reactor", area="Desulfitación", specs={"capacity_m3": 8, "material": "SS316L"}),
            Equipment(process_id=at.id, tag="F-201", name="Filtro Prensa", equipment_type="filter", area="Separación", specs={"area_m2": 10}),
            Equipment(process_id=at.id, tag="E-201", name="Intercambiador Iónico", equipment_type="ion_exchanger", area="Purificación"),
            Equipment(process_id=at.id, tag="EV-201", name="Evaporador 1° Efecto", equipment_type="evaporator", area="Evaporador 1°", specs={"area_m2": 15, "vacuum": True}),
            Equipment(process_id=at.id, tag="EV-202", name="Evaporador 2° Efecto", equipment_type="evaporator", area="Evaporador 2°", specs={"area_m2": 12}),
            Equipment(process_id=at.id, tag="CR-201", name="Cristalizador por Enfriamiento", equipment_type="crystallizer", area="Cristalización", specs={"capacity_m3": 5}),
            Equipment(process_id=at.id, tag="C-201", name="Centrífuga", equipment_type="centrifuge", area="Secado", specs={"speed_rpm": 1800}),
            Equipment(process_id=at.id, tag="D-201", name="Secador de Lecho Fluidizado", equipment_type="dryer", area="Secado", specs={"temp_max_c": 60}),
            Equipment(process_id=at.id, tag="TK-202", name="Tanque Producto Terminado", equipment_type="tank", area="Almacenamiento", specs={"capacity_m3": 10}),
        ]
        db.add_all(at_equipment)
        logger.info(f"Seeded {len(at_equipment)} AT-200 equipment")

    # ── AT-200 PID loops ────────────────────────────────────
    if at and db.query(PIDLoop).filter(PIDLoop.process_id == at.id).count() == 0:
        at_pid_loops = [
            PIDLoop(process_id=at.id, tag="TIC-201", description="Control temperatura desulfitación", pv_tag="TI-201", cv_tag="TV-201", kp=2.0, ti=120, td=10, mode="AUTO", setpoint=85),
            PIDLoop(process_id=at.id, tag="TIC-202", description="Control temperatura evaporador 1°", pv_tag="TI-202", cv_tag="TV-202", kp=1.8, ti=90, td=8, mode="AUTO", setpoint=70),
            PIDLoop(process_id=at.id, tag="TIC-203", description="Control temperatura evaporador 2°", pv_tag="TI-203", cv_tag="TV-203", kp=1.8, ti=90, td=8, mode="AUTO", setpoint=80),
            PIDLoop(process_id=at.id, tag="FIC-201", description="Control flujo alimentación", pv_tag="FI-201", cv_tag="FV-201", kp=1.0, ti=30, td=0, mode="CASCADE", setpoint=71.4),
            PIDLoop(process_id=at.id, tag="LIC-201", description="Control nivel tanque MP", pv_tag="LI-201", cv_tag="LV-201", kp=1.2, ti=150, td=0, mode="AUTO", setpoint=55),
            PIDLoop(process_id=at.id, tag="PIC-201", description="Control presión evaporador", pv_tag="PI-201", cv_tag="PV-201", kp=1.5, ti=45, td=3, mode="AUTO", setpoint=1.0),
        ]
        db.add_all(at_pid_loops)
        logger.info(f"Seeded {len(at_pid_loops)} AT-200 PID loops")

    # ── Demo batches ────────────────────────────────────────
    if db.query(Batch).count() == 0:
        now = datetime.now(timezone.utc)
        batches = []
        if ma:
            batches += [
                Batch(process_id=ma.id, batch_number="MA-2026-0215-001", status="COMPLETED",
                      planned_start=now - timedelta(days=6),
                      actual_start=now - timedelta(days=6, hours=0, minutes=30),
                      actual_end=now - timedelta(days=5, hours=14),
                      feed_amount_kg=500, feed_material="n-Butano (99.5%)", product_amount_kg=321.4,
                      product_name="Anhídrido Maleico", purity=99.6, yield_actual=63.5,
                      yield_predicted=64.1, quality_grade="A", avg_temperature=418.7,
                      avg_pressure=2.08, production_cost=1820.0, revenue=786.43,
                      operator_id=2, notes="Batch completado sin incidencias. Catalizador en buen estado."),
                Batch(process_id=ma.id, batch_number="MA-2026-0216-001", status="COMPLETED",
                      planned_start=now - timedelta(days=5),
                      actual_start=now - timedelta(days=5, hours=1),
                      actual_end=now - timedelta(days=4, hours=12),
                      feed_amount_kg=480, feed_material="n-Butano (99.5%)", product_amount_kg=309.2,
                      product_name="Anhídrido Maleico", purity=99.4, yield_actual=62.8,
                      yield_predicted=63.5, quality_grade="A", avg_temperature=421.2,
                      avg_pressure=2.12, production_cost=1748.0, revenue=757.54,
                      operator_id=3, notes="Ligera desviación en temperatura zona 2 al inicio, corregida."),
                Batch(process_id=ma.id, batch_number="MA-2026-0217-001", status="COMPLETED",
                      planned_start=now - timedelta(days=4),
                      actual_start=now - timedelta(days=4, hours=0, minutes=15),
                      actual_end=now - timedelta(days=3, hours=13),
                      feed_amount_kg=502, feed_material="n-Butano (99.5%)", product_amount_kg=318.6,
                      product_name="Anhídrido Maleico", purity=99.7, yield_actual=63.1,
                      yield_predicted=63.8, quality_grade="A", avg_temperature=419.9,
                      avg_pressure=2.09, production_cost=1831.0, revenue=780.57,
                      operator_id=2, notes="Mejor calidad del turno."),
                Batch(process_id=ma.id, batch_number="MA-2026-0218-001", status="APPROVED",
                      planned_start=now - timedelta(days=3),
                      actual_start=now - timedelta(days=3, hours=0, minutes=45),
                      actual_end=now - timedelta(days=2, hours=11),
                      feed_amount_kg=495, feed_material="n-Butano (99.5%)", product_amount_kg=308.0,
                      product_name="Anhídrido Maleico", purity=99.3, yield_actual=62.0,
                      yield_predicted=63.2, quality_grade="B", avg_temperature=422.5,
                      avg_pressure=2.15, production_cost=1802.0, revenue=754.6,
                      operator_id=3, notes="Aprobado por supervisión. Pureza dentro de especificación."),
                Batch(process_id=ma.id, batch_number="MA-2026-0219-001", status="IN_PROGRESS",
                      planned_start=now - timedelta(hours=8),
                      actual_start=now - timedelta(hours=7, minutes=55),
                      feed_amount_kg=500, feed_material="n-Butano (99.5%)",
                      product_name="Anhídrido Maleico", yield_predicted=63.5,
                      avg_temperature=420.1, avg_pressure=2.1, operator_id=2,
                      notes="En proceso. Condiciones nominales."),
                Batch(process_id=ma.id, batch_number="MA-2026-0220-001", status="PLANNED",
                      planned_start=now + timedelta(hours=4), feed_amount_kg=500,
                      feed_material="n-Butano (99.5%)", product_name="Anhídrido Maleico",
                      yield_predicted=63.5, operator_id=3),
            ]
        if at:
            batches += [
                Batch(process_id=at.id, batch_number="AT-2026-0217-001", status="COMPLETED",
                      planned_start=now - timedelta(days=4),
                      actual_start=now - timedelta(days=4, hours=1),
                      actual_end=now - timedelta(days=2, hours=6),
                      feed_amount_kg=1200, feed_material="Orujo vitivinícola",
                      product_amount_kg=46.8, product_name="Ácido Tartárico",
                      purity=99.3, yield_actual=3.9, yield_predicted=4.0,
                      quality_grade="A", avg_temperature=84.5, avg_pressure=0.98,
                      production_cost=458.4, revenue=224.64,
                      operator_id=2, notes="Extracción completa. Alta pureza obtenida."),
                Batch(process_id=at.id, batch_number="AT-2026-0219-001", status="IN_PROGRESS",
                      planned_start=now - timedelta(hours=12),
                      actual_start=now - timedelta(hours=11, minutes=40),
                      feed_amount_kg=1200, feed_material="Orujo vitivinícola",
                      product_name="Ácido Tartárico", yield_predicted=4.0,
                      avg_temperature=85.2, avg_pressure=1.01, operator_id=3,
                      notes="Proceso en curso. Etapa evaporación 1°."),
                Batch(process_id=at.id, batch_number="AT-2026-0220-001", status="PLANNED",
                      planned_start=now + timedelta(days=1), feed_amount_kg=1200,
                      feed_material="Orujo vitivinícola (cosecha 2025)",
                      product_name="Ácido Tartárico", yield_predicted=4.1),
            ]
        db.add_all(batches)
        logger.info(f"Seeded {len(batches)} batches")

    db.commit()
    logger.info("seed_missing_data complete")
