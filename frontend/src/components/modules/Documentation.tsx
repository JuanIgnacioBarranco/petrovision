// ============================================================
// PetroVision — Módulo de Documentación Técnica
// ============================================================
// Nomenclatura ISA, códigos de proceso, referencias técnicas,
// glosario y explicaciones del sistema para operadores e ingenieros.
// ============================================================

import { useState } from 'react';
import {
  BookOpen, Search, Tags, Beaker, Gauge, AlertTriangle,
  Users, Settings, Zap, GitBranch, Target, Info,
  ChevronRight, ExternalLink, Download, Filter, Hash,
  Brain, Wrench, FlaskConical, ThermometerSun,
  BarChart3, FileText,
} from 'lucide-react';

const SECTIONS = [
  { id: 'nomenclature', label: 'Nomenclatura ISA', icon: Tags },
  { id: 'processes', label: 'Códigos de Proceso', icon: Beaker },
  { id: 'instruments', label: 'Instrumentación', icon: Gauge },
  { id: 'alarms', label: 'Sistema de Alarmas', icon: AlertTriangle },
  { id: 'roles', label: 'Roles y Permisos', icon: Users },
  { id: 'equipment', label: 'Equipos y Símbolos', icon: Settings },
  { id: 'units', label: 'Unidades y Conversiones', icon: Hash },
  { id: 'standards', label: 'Estándares y Referencias', icon: ExternalLink },
  { id: 'ml', label: 'Módulo ML / IA', icon: Brain },
  { id: 'spc', label: 'Control Estadístico (SPC)', icon: BarChart3 },
  { id: 'reports', label: 'Reportes Avanzados', icon: FileText },
] as const;

// ── Nomenclatura ISA 5.1 ────────────────────────────────────
const ISA_CODES = [
  { code: 'T', name: 'Temperature', desc: 'Temperatura', examples: ['TI-101', 'TT-201', 'TC-301'] },
  { code: 'P', name: 'Pressure', desc: 'Presión', examples: ['PI-101', 'PT-201', 'PC-301', 'PSV-401'] },
  { code: 'F', name: 'Flow', desc: 'Flujo/Caudal', examples: ['FI-101', 'FT-201', 'FC-301', 'FCV-401'] },
  { code: 'L', name: 'Level', desc: 'Nivel', examples: ['LI-101', 'LT-201', 'LC-301', 'LSH-401'] },
  { code: 'A', name: 'Analysis', desc: 'Análisis (pH, %O₂, densidad)', examples: ['AI-101', 'AT-201', 'AC-301'] },
  { code: 'V', name: 'Vibration/Speed', desc: 'Vibración/Velocidad', examples: ['VI-101', 'VSH-201'] },
  { code: 'W', name: 'Weight/Force', desc: 'Peso/Fuerza', examples: ['WI-101', 'WT-201'] },
  { code: 'H', name: 'Hand/Manual', desc: 'Manual/Interfaz humana', examples: ['HIC-101', 'HSV-201'] },
  { code: 'S', name: 'Safety/Switch', desc: 'Seguridad/Interruptor', examples: ['PSL-101', 'TSH-201', 'FSL-301'] },
];

const ISA_SUFFIXES = [
  { suffix: 'I', name: 'Indicator', desc: 'Indicador — Solo muestra valor', color: 'var(--accent-blue)' },
  { suffix: 'T', name: 'Transmitter', desc: 'Transmisor — Envía señal a control', color: 'var(--accent-cyan)' },
  { suffix: 'C', name: 'Controller', desc: 'Controlador — Ejecuta lógica PID', color: 'var(--accent-green)' },
  { suffix: 'R', name: 'Recorder', desc: 'Registrador — Almacena histórico', color: 'var(--accent-purple)' },
  { suffix: 'S', name: 'Switch', desc: 'Interruptor — Acción on/off', color: 'var(--accent-orange)' },
  { suffix: 'V', name: 'Valve', desc: 'Válvula — Elemento final control', color: 'var(--accent-red)' },
  { suffix: 'A', name: 'Alarm', desc: 'Alarma — Notificación de estado', color: 'var(--accent-red)' },
  { suffix: 'H', name: 'High', desc: 'Alto — Límite superior', color: 'var(--accent-red)' },
  { suffix: 'L', name: 'Low', desc: 'Bajo — Límite inferior', color: 'var(--accent-orange)' },
  { suffix: 'HH', name: 'High-High', desc: 'Muy alto — Límite crítico superior', color: 'var(--accent-red)' },
  { suffix: 'LL', name: 'Low-Low', desc: 'Muy bajo — Límite crítico inferior', color: 'var(--accent-red)' },
];

// ── Procesos Químicos ───────────────────────────────────────
const PROCESSES = {
  'MA-100': {
    name: 'Producción de Anhídrido Maleico',
    description: 'Oxidación catalítica de n-butano a anhídrido maleico en reactor de lecho fijo',
    reaction: 'C₄H₁₀ + 3.5 O₂ → C₄H₂O₃ + 4 H₂O',
    catalyst: 'V₂O₅-MoO₃/TiO₂',
    conditions: { temp: '420°C', pressure: '2.1 bar', residence: '2.5 s' },
    yield: '61.6%',
    capacity: '220.95 kg/h',
    areas: [
      'SECC. 100 — Alimentación (TK-101, P-101)',
      'SECC. 200 — Reacción (C-101, R-101, E-101, PSV-101)',
      'SECC. 300 — Enfriamiento (E-102)',
      'SECC. 400 — Separación (T-101)',
      'SECC. 500 — Purificación (T-102, K-101)',
      'SECC. 600 — Producto Final (F-101, TK-102)',
    ],
    equipment: [
      'TK-101: Tanque alimentación n-Butano',
      'P-101: Bomba centrífuga de alimentación',
      'C-101: Compresor de aire',
      'E-101: Precalentador (intercambiador shell & tube)',
      'R-101: Reactor catalítico lecho fijo (V₂O₅-MoO₃/TiO₂)',
      'PSV-101: Válvula de alivio de presión del reactor',
      'E-102: Enfriador de gas de salida',
      'T-101: Columna de absorción (7 etapas)',
      'T-102: Columna de destilación (9 etapas)',
      'K-101: Fundidora / Melter',
      'F-101: Filtro de producto',
      'TK-102: Tanque almacenamiento producto',
    ],
  },
  'AT-200': {
    name: 'Extracción de Ácido Tartárico',
    description: 'Extracción y purificación de ácido tartárico desde residuos vitivinícolas',
    reaction: 'CaC₄H₄O₆ + H₂SO₄ → C₄H₆O₆ + CaSO₄',
    feedstock: 'Orujo + borras vitivinícolas',
    conditions: { temp: '85°C', pressure: '1.0 bar', pH: '1.5-2.0' },
    yield: '4.0%',
    capacity: '2.08 kg/h',
    areas: [
      'SECC. 201 — Materia Prima (TK-201, P-201)',
      'SECC. 202 — Desulfitación (R-201)',
      'SECC. 203 — Filtración (F-201)',
      'SECC. 204 — Intercambio Iónico (E-201)',
      'SECC. 205 — Evaporación (EV-201, EV-202)',
      'SECC. 206 — Cristalización (CR-201)',
      'SECC. 207 — Producto (C-201, D-201, TK-202)',
    ],
    equipment: [
      'TK-201: Tanque materia prima (orujo)',
      'P-201: Bomba centrífuga de alimentación',
      'R-201: Reactor de desulfitación (H₂SO₄)',
      'F-201: Filtro prensa (separación CaSO₄)',
      'E-201: Columna de intercambio iónico (H⁺/Ca²⁺)',
      'EV-201: Evaporador de primer efecto',
      'EV-202: Evaporador de segundo efecto',
      'CR-201: Cristalizador con chaqueta de enfriamiento',
      'C-201: Centrífuga (separación cristales)',
      'D-201: Secador de producto',
      'TK-202: Tanque producto final',
    ],
  },
};

// ── Sistema de Alarmas ISA 18.2 ─────────────────────────────
const ALARM_SYSTEM = {
  priorities: [
    { level: 'ALTA', color: '#ef4444', desc: 'Requiere acción inmediata — Riesgo de parada/seguridad', time: '< 10 min' },
    { level: 'MEDIA', color: '#f97316', desc: 'Requiere atención pronta — Desviación proceso', time: '< 30 min' },
    { level: 'BAJA', color: '#eab308', desc: 'Información/mantenimiento preventivo', time: '< 2 hrs' },
  ],
  states: [
    { state: 'ACTIVA', color: '#ef4444', desc: 'Condición anormal presente', icon: '🔴' },
    { state: 'RECONOCIDA', color: '#f97316', desc: 'Operador informado, aún presente', icon: '🟠' },
    { state: 'NORMALIZADA', color: '#22c55e', desc: 'Condición resuelta automáticamente', icon: '🟢' },
    { state: 'SUPRIMIDA', color: '#6b7280', desc: 'Suprimida temporalmente', icon: '⚫' },
  ],
  types: [
    { type: 'PROCESO', examples: ['TH-101: Temp alta reactor', 'PL-201: Presión baja columna'] },
    { type: 'SEGURIDAD', examples: ['PSV-101: Válvula alivio activada', 'FSL-301: Flujo bajo emergencia'] },
    { type: 'EQUIPOS', examples: ['P-101: Falla bomba', 'K-101: Vibración alta compresor'] },
    { type: 'SISTEMA', examples: ['Pérdida comunicación PLC', 'Falla alimentación UPS'] },
  ],
};

// ── Roles y Matriz de Permisos ──────────────────────────────
const ROLE_MATRIX = [
  { function: 'Ver instrumentos', operador: '✅', ing_quimico: '✅', data_scientist: '✅', supervisor: '✅', admin: '✅' },
  { function: 'Ajustar setpoints', operador: '✅', ing_quimico: '✅', data_scientist: '❌', supervisor: '👁️', admin: '✅' },
  { function: 'Crear instrumentos', operador: '❌', ing_quimico: '✅', data_scientist: '❌', supervisor: '❌', admin: '✅' },
  { function: 'Gestionar procesos', operador: '👁️', ing_quimico: '✅', data_scientist: '👁️', supervisor: '👁️', admin: '✅' },
  { function: 'Entrenar ML', operador: '❌', ing_quimico: '❌', data_scientist: '✅', supervisor: '❌', admin: '✅' },
  { function: 'Ver auditoría', operador: '❌', ing_quimico: '✅', data_scientist: '❌', supervisor: '✅', admin: '✅' },
  { function: 'Gestionar usuarios', operador: '❌', ing_quimico: '❌', data_scientist: '❌', supervisor: '👁️', admin: '✅' },
];

// ── Equipos y Símbolos P&ID ─────────────────────────────────
const EQUIPMENT_SYMBOLS = [
  { symbol: '🛢️', code: 'TK', name: 'Tanque / Vessel', desc: 'Recipiente vertical con cabezales elípticos, indicador de nivel animado. Almacenamiento de líquidos.' },
  { symbol: '⚗️', code: 'R', name: 'Reactor', desc: 'Reactor de lecho fijo con chaqueta térmica, cama de catalizador (puntos) y destello pulsante central.' },
  { symbol: '🏗️', code: 'T', name: 'Columna', desc: 'Columna de destilación/absorción con platos (líneas horizontales), bajantes y burbujas animadas.' },
  { symbol: '🔄', code: 'E', name: 'Intercambiador', desc: 'ISA: dos círculos superpuestos con haz de tubos y placa partición (shell & tube).' },
  { symbol: '⚙️', code: 'P', name: 'Bomba', desc: 'Bomba centrífuga ISA: círculo con impulsor de 6 aspas rotando.' },
  { symbol: '🔧', code: 'K', name: 'Compresor / Fundidora', desc: 'Rectángulo con turbina de 8 aspas girando (compresor) o intercambiador estilo horno (fundidora).' },
  { symbol: '⬛', code: 'F', name: 'Filtro', desc: 'Rectángulo con líneas verticales de tamiz y línea horizontal central. Separación sólido-líquido.' },
  { symbol: '🌪️', code: 'EV', name: 'Evaporador', desc: 'Recipiente vertical con serpentines de calor y burbujas de vapor animadas ascendentes.' },
  { symbol: '❄️', code: 'CR', name: 'Cristalizador', desc: 'Recipiente horizontal con chaqueta de enfriamiento (línea discontinua azul) y cristales poligonales animados.' },
  { symbol: '🌀', code: 'C', name: 'Centrífuga', desc: 'Círculo con elipse rotatoria y líneas radiales a alta velocidad.' },
  { symbol: '🔥', code: 'D', name: 'Secador', desc: 'Recipiente vertical con flechas de aire caliente animadas.' },
  { symbol: '⛑️', code: 'PSV', name: 'Válvula de Alivio', desc: 'Dos triángulos enfrentados (rojo) con línea de venteo. Protección contra sobrepresión.' },
  { symbol: '⋈', code: 'FCV', name: 'Válv. Control (Bowtie)', desc: 'ISA: dos triángulos opuestos (bowtie) + vástago actuador + círculo indicador (FO/FC).' },
];

// ── ML / IA Models Catalogue ────────────────────────────────
const ML_MODELS = [
  {
    id: 'temperature_predictor', name: 'Predicción de Temperatura',
    algorithm: 'LSTM (4 capas)', version: '2.1.0', color: '#f97316',
    icon: ThermometerSun, category: 'Predicción',
    description: 'Red LSTM multi-capa con ventana de 60 pasos que incorpora dinámica térmica, corrección PID y efecto de presión en reacciones exotérmicas.',
    inputs: ['current_value (°C)', 'setpoint (°C)', 'flow (kg/h)', 'pressure (bar)'],
    outputs: ['predicted_value · confidence · prediction_lower/upper (95%CI) · time_constant_min · interpretation'],
    metrics: { RMSE: '1.2 °C', 'R²': '0.963', MAE: '0.8 °C', MAPE: '0.28%' },
    samples: '50 000',
    notes: 'Horizonte configurable 5–60 min. Ruido escala como √t. Óptimo térmico: 420°C SP.',
  },
  {
    id: 'yield_optimizer', name: 'Optimizador de Rendimiento',
    algorithm: 'XGBoost + Response Surface', version: '2.0.0', color: '#22c55e',
    icon: Target, category: 'Optimización',
    description: 'Superficie de respuesta 2do orden con deactivación sigmoide del catalizador V₂O₅. Punto óptimo: T=422°C, P=2.10 bar, Flow=340 kg/h.',
    inputs: ['temperature (°C)', 'pressure (bar)', 'flow (kg/h)', 'catalyst_age_hours (h)', 'o2_ratio (:1)'],
    outputs: ['predicted_value (yield%) · optimal_yield · yield_gap · feature_importance · catalyst_activity_pct · recommendations'],
    metrics: { RMSE: '0.8 pp', 'R²': '0.941', MAE: '0.5 pp', MAPE: '0.74%' },
    samples: '10 000',
    notes: 'Deactivación sigmoide con inflexión en 8 000 h de catalizador.',
  },
  {
    id: 'anomaly_detector', name: 'Detector de Anomalías',
    algorithm: 'Isolation Forest multivariable', version: '2.0.0', color: '#ef4444',
    icon: AlertTriangle, category: 'Detección',
    description: 'Score compuesto de 4 componentes (SP dev 35%, rate-of-change 25%, correlación 20%, distancia estadística 20%). Clasifica severidad ISA 18.2.',
    inputs: ['current_value', 'setpoint', 'rate_of_change (/min)'],
    outputs: ['anomaly_score (0–1) · severity (ISA 18.2) · severity_color · score_breakdown · root_cause · is_anomaly'],
    metrics: { Precision: '92.5%', Recall: '88.7%', F1: '90.6%', 'AUC-ROC': '0.953' },
    samples: '100 000',
    notes: 'Umbral de anomalía: score > 0.35. Severidades: NORMAL / ADVERTENCIA / ALTA / CRÍTICA.',
  },
  {
    id: 'maintenance_predictor', name: 'Mantenimiento Predictivo',
    algorithm: 'Random Forest + Weibull (β=2.5, η=8000h)', version: '2.0.0', color: '#a855f7',
    icon: Wrench, category: 'Mantenimiento',
    description: 'Survival analysis Weibull + Random Forest. Calcula probabilidad de falla acumulada, RUL y factores de riesgo con impacto ALTO/MEDIO/BAJO.',
    inputs: ['operating_hours (h)', 'temperature (°C)', 'vibration (mm/s)', 'load_pct (%)', 'last_maintenance_days'],
    outputs: ['failure_prob · rul_hours · rul_days · health_index (0–100%) · risk_factors[] · recommendation · urgency'],
    metrics: { Accuracy: '92.1%', Precision: '90.3%', Recall: '88.7%', F1: '89.5%' },
    samples: '5 000',
    notes: 'Vida mediana sin factores de severidad ≈ 7 147 h. Urgencias: NORMAL → PREVENTIVO → MEDIO → ALTO → CRÍTICO.',
  },
  {
    id: 'quality_predictor', name: 'Predicción de Calidad',
    algorithm: 'Gaussian Process (kernel RBF + White Noise)', version: '1.0.0', color: '#06b6d4',
    icon: FlaskConical, category: 'Calidad',
    description: 'GPR con incertidumbre calibrada para pureza del producto. Máximo en T=420°C, P=2.1 bar, RT=4.5 s. Especificación mínima: 99.5%.',
    inputs: ['temperature (°C)', 'pressure (bar)', 'flow (kg/h)', 'residence_time (s)'],
    outputs: ['purity (%) · confidence · spec_min · in_spec · spec_margin (pp)'],
    metrics: { RMSE: '0.12 pp', 'R²': '0.978', MAE: '0.08 pp' },
    samples: '8 000',
    notes: 'Kernel RBF provee interpolación suave con incertidumbre calibrada. Nuevo en v1.0.0.',
  },
  {
    id: 'energy_optimizer', name: 'Optimización Energética',
    algorithm: 'Multi-Objetivo Pareto (pop=100, gen=50)', version: '1.0.0', color: '#eab308',
    icon: Zap, category: 'Optimización',
    description: 'Optimización multi-objetivo para minimizar consumo específico (SEC kWh/kg) manteniendo throughput. Frente de Pareto define curva de trade-off energía-productividad.',
    inputs: ['current_power_kw (kW)', 'temperature (°C)', 'throughput_kg_h (kg/h)'],
    outputs: ['current_consumption_kw · optimal_consumption_kw · savings_kw · savings_pct (%)'],
    metrics: { 'Ahorro promedio': '8.3%', 'R²': '0.934', MAE: '2.1 kW' },
    samples: '15 000',
    notes: 'Nuevo en v1.0.0. Objetivos en conflicto: minimizar SEC vs maximizar throughput.',
  },
];

// ── Unidades y Conversiones ─────────────────────────────────
const UNITS = {
  temperature: {
    primary: '°C (Celsius)',
    conversions: ['K = °C + 273.15', '°F = (°C × 9/5) + 32'],
    ranges: ['Ambiente: 20-25°C', 'Proceso MA-100: 350-480°C', 'Proceso AT-200: -5 a 110°C'],
  },
  pressure: {
    primary: 'bar (absoluta)',
    conversions: ['1 bar = 100 kPa = 0.1 MPa', '1 bar = 14.5 psi', '1 atm = 1.013 bar'],
    ranges: ['Atmosférica: 1.013 bar', 'Vacío: 0.3-0.8 bar', 'Proceso: 1-5 bar'],
  },
  flow: {
    primary: 'kg/h (másico)',
    conversions: ['m³/h = kg/h / densidad', 'L/min = m³/h / 60'],
    ranges: ['Laboratorio: 0.1-10 kg/h', 'Piloto: 10-100 kg/h', 'Industrial: 100-10000 kg/h'],
  },
  composition: {
    primary: '% peso/peso',
    conversions: ['ppm = % × 10000', 'mol/mol = (% / PM) / Σ(% / PM)'],
    ranges: ['Trazas: < 0.1%', 'Impurezas: 0.1-5%', 'Producto: > 95%'],
  },
};

export default function Documentation() {
  const [activeSection, setActiveSection] = useState('nomenclature');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredContent = (content: any[]) => {
    if (!searchTerm) return content;
    return content.filter((item) =>
      JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={20} />
            Documentación Técnica
          </h1>
          <p className="text-sm text-muted">Nomenclatura ISA, códigos de proceso y referencias del sistema</p>
        </div>
        <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Download size={14} /> Exportar PDF
        </button>
      </div>

      {/* Search */}
      <div className="card" style={{ padding: '0.75rem', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            className="input"
            placeholder="Buscar en documentación... (ej: TI-101, reactor, alarma)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, border: 'none', background: 'none', fontSize: '0.9rem' }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: 2 }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 16 }}>
        {/* Sidebar Navigation */}
        <div className="card" style={{ padding: '0.75rem', height: 'fit-content' }}>
          <div className="card-title" style={{ fontSize: '0.8rem', marginBottom: 8 }}>Secciones</div>
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`btn ${activeSection === id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveSection(id)}
              style={{ 
                width: '100%', 
                justifyContent: 'flex-start', 
                marginBottom: 4,
                fontSize: '0.8rem',
                padding: '0.5rem 0.75rem'
              }}
            >
              <Icon size={14} />
              <span>{label}</span>
              {activeSection === id && <ChevronRight size={12} />}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="card" style={{ padding: '1rem', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
          {/* Nomenclatura ISA */}
          {activeSection === 'nomenclature' && (
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Tags size={18} color="var(--accent-blue)" />
                Nomenclatura ISA 5.1 — Instrumentación
              </h2>
              <p className="text-sm text-muted" style={{ marginBottom: 16 }}>
                Estándar internacional para identificación de instrumentos en procesos industriales. 
                Formato: <code>[VARIABLE][FUNCIÓN]-[NÚMERO]</code>
              </p>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 8, color: 'var(--accent-blue)' }}>
                  Variables de Proceso (Primera Letra)
                </h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Variable</th>
                        <th>Descripción</th>
                        <th>Ejemplos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContent(ISA_CODES).map((item) => (
                        <tr key={item.code}>
                          <td className="mono" style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>{item.code}</td>
                          <td>{item.name}</td>
                          <td>{item.desc}</td>
                          <td className="mono text-xs">
                            {item.examples.map((ex, i) => (
                              <span key={i} className="badge badge-secondary" style={{ marginRight: 4 }}>{ex}</span>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 8, color: 'var(--accent-green)' }}>
                  Funciones de Instrumento (Sufijos)
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 8 }}>
                  {filteredContent(ISA_SUFFIXES).map((item) => (
                    <div key={item.suffix} className="card" style={{ padding: '0.5rem 0.75rem', borderLeft: `3px solid ${item.color}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="mono" style={{ fontWeight: 700, color: item.color }}>{item.suffix}</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{item.name}</span>
                      </div>
                      <div className="text-xs text-muted" style={{ marginTop: 2 }}>{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card" style={{ marginTop: 16, padding: '0.75rem', background: 'rgba(59,130,246,0.05)', borderLeft: '3px solid var(--accent-blue)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>💡 Ejemplos Prácticos</div>
                <div className="mono text-xs" style={{ lineHeight: 1.6 }}>
                  <strong>TIC-101</strong>: <em>T</em>emperature <em>I</em>ndicator-<em>C</em>ontroller del lazo 101<br />
                  <strong>PSH-201</strong>: <em>P</em>ressure <em>S</em>witch-<em>H</em>igh del punto 201<br />
                  <strong>FCV-301</strong>: <em>F</em>low <em>C</em>ontrol <em>V</em>alve del lazo 301<br />
                  <strong>PSHH-401</strong>: <em>P</em>ressure <em>S</em>witch-<em>H</em>igh-<em>H</em>igh del punto 401
                </div>
              </div>
            </div>
          )}

          {/* Códigos de Proceso */}
          {activeSection === 'processes' && (
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Beaker size={18} color="var(--accent-green)" />
                Códigos de Proceso
              </h2>
              <p className="text-sm text-muted" style={{ marginBottom: 16 }}>
                Identificación y descripción de los procesos químicos implementados en PetroVision.
              </p>

              {Object.entries(PROCESSES).map(([code, process]) => (
                <div key={code} className="card" style={{ marginBottom: 16, padding: '1rem', borderLeft: `4px solid ${code === 'MA-100' ? 'var(--accent-blue)' : 'var(--accent-green)'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <span className="mono" style={{ fontWeight: 700, fontSize: '1.1rem', color: code === 'MA-100' ? 'var(--accent-blue)' : 'var(--accent-green)' }}>
                      {code}
                    </span>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>{process.name}</h3>
                      <p className="text-sm text-muted" style={{ margin: 0 }}>{process.description}</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 12 }}>
                    <div>
                      <div className="text-xs" style={{ color: 'var(--accent-blue)', fontWeight: 600, marginBottom: 2 }}>REACCIÓN QUÍMICA</div>
                      <div className="mono text-sm">{process.reaction}</div>
                    </div>
                    <div>
                      <div className="text-xs" style={{ color: 'var(--accent-green)', fontWeight: 600, marginBottom: 2 }}>CONDICIONES</div>
                      <div className="text-sm">{process.conditions.temp} • {process.conditions.pressure}</div>
                    </div>
                    <div>
                      <div className="text-xs" style={{ color: 'var(--accent-purple)', fontWeight: 600, marginBottom: 2 }}>RENDIMIENTO</div>
                      <div className="text-sm" style={{ fontWeight: 700 }}>{process.yield} → {process.capacity}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs" style={{ color: 'var(--accent-orange)', fontWeight: 600, marginBottom: 4 }}>EQUIPOS PRINCIPALES</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 6 }}>
                      {process.equipment.map((eq, i) => {
                        const [tag, name] = eq.split(': ');
                        return (
                          <div key={i} className="mono text-xs" style={{ padding: '4px 8px', background: 'rgba(0,0,0,0.02)', borderRadius: 4 }}>
                            <span style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>{tag}</span>: {name}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sistema de Alarmas */}
          {activeSection === 'alarms' && (
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={18} color="var(--accent-red)" />
                Sistema de Alarmas ISA 18.2
              </h2>
              <p className="text-sm text-muted" style={{ marginBottom: 16 }}>
                Gestión racional de alarmas según estándar ISA-18.2 para plantas de proceso.
              </p>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 8, color: 'var(--accent-red)' }}>
                  Prioridades de Alarma
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 8 }}>
                  {ALARM_SYSTEM.priorities.map((priority) => (
                    <div key={priority.level} className="card" style={{ padding: '0.75rem', borderLeft: `4px solid ${priority.color}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, color: priority.color }}>{priority.level}</span>
                        <span className="mono text-xs" style={{ background: priority.color, color: 'white', padding: '2px 6px', borderRadius: 4 }}>
                          {priority.time}
                        </span>
                      </div>
                      <div className="text-sm">{priority.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 8, color: 'var(--accent-orange)' }}>
                  Estados de Alarma
                </h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Estado</th>
                        <th>Descripción</th>
                        <th>Acción Requerida</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ALARM_SYSTEM.states.map((state) => (
                        <tr key={state.state}>
                          <td>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: '0.8rem' }}>{state.icon}</span>
                              <span style={{ fontWeight: 600, color: state.color }}>{state.state}</span>
                            </span>
                          </td>
                          <td>{state.desc}</td>
                          <td className="text-sm text-muted">
                            {state.state === 'ACTIVA' && 'Reconocer y diagnosticar causa'}
                            {state.state === 'RECONOCIDA' && 'Tomar acción correctiva'}
                            {state.state === 'NORMALIZADA' && 'Verificar retorno a normal'}
                            {state.state === 'SUPRIMIDA' && 'Monitorear condición'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 8, color: 'var(--accent-purple)' }}>
                  Tipos de Alarma por Categoría
                </h3>
                {ALARM_SYSTEM.types.map((type) => (
                  <div key={type.type} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-purple)', marginBottom: 4 }}>
                      {type.type}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {type.examples.map((example, i) => (
                        <span key={i} className="mono text-xs" style={{ padding: '4px 8px', background: 'rgba(147,51,234,0.1)', borderRadius: 4, border: '1px solid rgba(147,51,234,0.2)' }}>
                          {example}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Roles y Permisos */}
          {activeSection === 'roles' && (
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={18} color="var(--accent-purple)" />
                Roles y Matriz de Permisos
              </h2>
              <p className="text-sm text-muted" style={{ marginBottom: 16 }}>
                Control de acceso basado en roles (RBAC) según responsabilidades operativas.
              </p>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 8, color: 'var(--accent-purple)' }}>
                  Credenciales del Sistema
                </h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Usuario</th>
                        <th>Contraseña</th>
                        <th>Rol</th>
                        <th>Descripción</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="mono">admin</td>
                        <td className="mono">admin2026</td>
                        <td><span className="badge badge-danger">admin</span></td>
                        <td>Control total del sistema</td>
                      </tr>
                      <tr>
                        <td className="mono">operador1</td>
                        <td className="mono">operador2026</td>
                        <td><span className="badge badge-primary">operador</span></td>
                        <td>Personal de turno — Carlos Mendoza</td>
                      </tr>
                      <tr>
                        <td className="mono">ing_quimico</td>
                        <td className="mono">ingeniero2026</td>
                        <td><span className="badge badge-success">ingeniero_quimico</span></td>
                        <td>Supervisión técnica — Dr. Roberto García</td>
                      </tr>
                      <tr>
                        <td className="mono">data_scientist</td>
                        <td className="mono">datascience2026</td>
                        <td><span className="badge badge-info">data_scientist</span></td>
                        <td>Análisis ML/IA — Sofía Barrancos</td>
                      </tr>
                      <tr>
                        <td className="mono">supervisor</td>
                        <td className="mono">supervisor2026</td>
                        <td><span className="badge badge-warning">supervisor</span></td>
                        <td>Supervisión operativa — Ing. Pedro Sánchez</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 8, color: 'var(--accent-purple)' }}>
                  Matriz de Permisos por Función
                </h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Función del Sistema</th>
                        <th>Operador</th>
                        <th>Ing. Químico</th>
                        <th>Data Scientist</th>
                        <th>Supervisor</th>
                        <th>Admin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ROLE_MATRIX.map((row, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{row.function}</td>
                          <td className="text-center">{row.operador}</td>
                          <td className="text-center">{row.ing_quimico}</td>
                          <td className="text-center">{row.data_scientist}</td>
                          <td className="text-center">{row.supervisor}</td>
                          <td className="text-center">{row.admin}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="text-xs text-muted" style={{ marginTop: 8 }}>
                  <strong>Leyenda:</strong> ✅ Control completo | 👁️ Solo lectura | ❌ Sin acceso
                </div>
              </div>
            </div>
          )}

          {/* Equipos y Símbolos */}
          {activeSection === 'equipment' && (
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Settings size={18} color="var(--accent-cyan)" />
                Equipos y Símbolos P&ID
              </h2>
              <p className="text-sm text-muted" style={{ marginBottom: 16 }}>
                Simbología estándar para Diagramas de Tuberías e Instrumentación (P&ID).
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                {filteredContent(EQUIPMENT_SYMBOLS).map((equipment) => (
                  <div key={equipment.code} className="card" style={{ padding: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ fontSize: '1.5rem', lineHeight: 1 }}>{equipment.symbol}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span className="mono" style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{equipment.code}</span>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{equipment.name}</span>
                        </div>
                        <div className="text-xs text-muted">{equipment.desc}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="card" style={{ marginTop: 16, padding: '0.75rem', background: 'rgba(6,182,212,0.05)', borderLeft: '3px solid var(--accent-cyan)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>🏗️ Convenciones de Numeración de Áreas</div>
                <div className="text-sm" style={{ lineHeight: 1.6 }}>
                  <strong>Área 100 (SECC. 100–600):</strong> Proceso MA-100 — Anhídrido Maleico<br />
                  <strong>Área 200 (SECC. 201–207):</strong> Proceso AT-200 — Ácido Tartárico<br />
                  <strong>Área 300:</strong> Utilidades (vapor, agua, aire)<br />
                  <strong>Área 400:</strong> Sistemas de seguridad y alivio<br />
                  <strong>Área 500:</strong> Tratamiento de efluentes
                </div>
              </div>

              <div className="card" style={{ marginTop: 12, padding: '0.75rem', background: 'rgba(251,191,36,0.05)', borderLeft: '3px solid var(--accent-orange)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>📐 Tipos de Línea en P&ID</div>
                <div className="text-sm" style={{ lineHeight: 2 }}>
                  <span style={{ color: '#3b82f6', fontWeight: 700 }}>━━━━━</span> Línea de proceso principal<br />
                  <span style={{ color: '#f87171', fontWeight: 700 }}>- - - - -</span> Vapor (steam line)<br />
                  <span style={{ color: '#38bdf8', fontWeight: 700 }}>· · · · ·</span> Refrigerante / agua de enfriamiento<br />
                  <span style={{ color: '#fbbf24', fontWeight: 700 }}>– – – –</span> Señal de control (PID loop signal)<br />
                  <span style={{ color: '#34d399', fontWeight: 700 }}>━━━━━</span> Producto final<br />
                  <span style={{ color: '#94a3b8', fontWeight: 700 }}>· · · ·</span> Utilidades
                </div>
              </div>

              <div className="card" style={{ marginTop: 12, padding: '0.75rem', background: 'rgba(59,130,246,0.05)', borderLeft: '3px solid var(--accent-blue)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>🔵 Burbujas ISA 5.1 en el P&ID</div>
                <div className="text-sm" style={{ lineHeight: 1.8 }}>
                  Cada instrumento se representa como un círculo ISA 5.1 con:<br />
                  <strong>Mitad superior:</strong> Código de función (TIC, FIC, PIC, AI, LIC, etc.)<br />
                  <strong>Mitad inferior:</strong> Valor en tiempo real + unidad<br />
                  <strong>Debajo:</strong> Tag del instrumento (ej. TI-101)<br />
                  <strong>DCS (anillo punteado interior):</strong> Instrumento controlado desde sistema DCS<br />
                  <strong>Campo (sin anillo):</strong> Instrumento de campo / indicador local<br />
                  <strong>Color:</strong> Verde = normal · Amarillo = warning (H/L) · Rojo = alarma (HH/LL)
                </div>
              </div>
            </div>
          )}

          {/* Unidades y Conversiones */}
          {activeSection === 'units' && (
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Hash size={18} color="var(--accent-orange)" />
                Unidades y Conversiones
              </h2>
              <p className="text-sm text-muted" style={{ marginBottom: 16 }}>
                Sistema internacional de unidades y conversiones utilizadas en los procesos.
              </p>

              {Object.entries(UNITS).map(([category, unit]) => (
                <div key={category} className="card" style={{ marginBottom: 16, padding: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8, textTransform: 'capitalize', color: 'var(--accent-orange)' }}>
                    {category === 'temperature' && '🌡️ Temperatura'}
                    {category === 'pressure' && '⚡ Presión'}
                    {category === 'flow' && '💧 Flujo'}
                    {category === 'composition' && '⚗️ Composición'}
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
                    <div>
                      <div className="text-xs" style={{ color: 'var(--accent-orange)', fontWeight: 600, marginBottom: 4 }}>UNIDAD PRIMARIA</div>
                      <div className="mono" style={{ fontWeight: 700 }}>{unit.primary}</div>
                    </div>
                    <div>
                      <div className="text-xs" style={{ color: 'var(--accent-blue)', fontWeight: 600, marginBottom: 4 }}>CONVERSIONES</div>
                      {unit.conversions.map((conv, i) => (
                        <div key={i} className="mono text-xs" style={{ marginBottom: 2 }}>{conv}</div>
                      ))}
                    </div>
                    <div>
                      <div className="text-xs" style={{ color: 'var(--accent-green)', fontWeight: 600, marginBottom: 4 }}>RANGOS TÍPICOS</div>
                      {unit.ranges.map((range, i) => (
                        <div key={i} className="text-xs" style={{ marginBottom: 2 }}>{range}</div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Estándares y Referencias */}
          {activeSection === 'standards' && (
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ExternalLink size={18} color="var(--accent-purple)" />
                Estándares y Referencias
              </h2>
              <p className="text-sm text-muted" style={{ marginBottom: 16 }}>
                Normativas internacionales y referencias técnicas aplicadas en el sistema.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
                <div className="card" style={{ padding: '1rem', borderLeft: '4px solid var(--accent-blue)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8, color: 'var(--accent-blue)' }}>
                    ISA-5.1 (2009)
                  </h3>
                  <div className="text-sm" style={{ marginBottom: 8 }}>
                    Identification and Symbols for Instrumentation
                  </div>
                  <div className="text-xs text-muted">
                    Estándar para nomenclatura e identificación de instrumentos de proceso. 
                    Define códigos de variables, funciones y numeración de lazos de control.
                  </div>
                </div>

                <div className="card" style={{ padding: '1rem', borderLeft: '4px solid var(--accent-red)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8, color: 'var(--accent-red)' }}>
                    ISA-18.2 (2016)
                  </h3>
                  <div className="text-sm" style={{ marginBottom: 8 }}>
                    Management of Alarm Systems for Process Industries
                  </div>
                  <div className="text-xs text-muted">
                    Gestión racional de alarmas: priorización, filosofía, lifecycle de alarmas 
                    y métricas de desempeño para reducir fatiga de operadores.
                  </div>
                </div>

                <div className="card" style={{ padding: '1rem', borderLeft: '4px solid var(--accent-green)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8, color: 'var(--accent-green)' }}>
                    IEC 61131-3
                  </h3>
                  <div className="text-sm" style={{ marginBottom: 8 }}>
                    Programmable Logic Controllers - Programming Languages
                  </div>
                  <div className="text-xs text-muted">
                    Lenguajes de programación para PLC: Ladder Logic, Function Block Diagram, 
                    Structured Text aplicados en lógicas de control y interlock.
                  </div>
                </div>

                <div className="card" style={{ padding: '1rem', borderLeft: '4px solid var(--accent-orange)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8, color: 'var(--accent-orange)' }}>
                    ANSI/ISA-95
                  </h3>
                  <div className="text-sm" style={{ marginBottom: 8 }}>
                    Enterprise-Control System Integration
                  </div>
                  <div className="text-xs text-muted">
                    Integración entre sistemas MES/ERP y control de planta. 
                    Define jerarquías funcionales y modelos de información.
                  </div>
                </div>

                <div className="card" style={{ padding: '1rem', borderLeft: '4px solid var(--accent-purple)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8, color: 'var(--accent-purple)' }}>
                    OPC UA IEC 62541
                  </h3>
                  <div className="text-sm" style={{ marginBottom: 8 }}>
                    Open Platform Communications Unified Architecture
                  </div>
                  <div className="text-xs text-muted">
                    Protocolo de comunicación segura industria 4.0. 
                    Interoperabilidad entre sistemas SCADA, MES, ERP y Cloud.
                  </div>
                </div>

                <div className="card" style={{ padding: '1rem', borderLeft: '4px solid var(--accent-cyan)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8, color: 'var(--accent-cyan)' }}>
                    IEC 61508/61511
                  </h3>
                  <div className="text-sm" style={{ marginBottom: 8 }}>
                    Functional Safety for Process Industries
                  </div>
                  <div className="text-xs text-muted">
                    Safety Integrity Level (SIL) para sistemas instrumentados de seguridad. 
                    SIS design, verificación y lifecycle de funciones de seguridad.
                  </div>
                </div>
              </div>

              <div className="card" style={{ marginTop: 16, padding: '0.75rem', background: 'rgba(147,51,234,0.05)', borderLeft: '3px solid var(--accent-purple)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>📚 Referencias Adicionales</div>
                <div className="text-sm" style={{ lineHeight: 1.6 }}>
                  <strong>Perry's Chemical Engineers' Handbook:</strong> Propiedades físicas, correlaciones termodinámicas<br />
                  <strong>NIST WebBook:</strong> Datos termoquímicos y constantes de equilibrio<br />
                  <strong>API RP 550/551:</strong> Diseño de sistemas instrumentados de proceso, SIS<br />
                  <strong>ASME B31.3:</strong> Código de tuberías de proceso para plantas químicas
                </div>
              </div>
            </div>
          )}

          {/* ML / IA */}
          {activeSection === 'ml' && (
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Brain size={18} color="#a855f7" />
                Módulo de Inteligencia Artificial & Machine Learning
              </h2>
              <p className="text-sm text-muted" style={{ marginBottom: 4 }}>
                6 modelos productivos desplegados para predicción, optimización, detección de anomalías y mantenimiento predictivo.
                Cada modelo expone <code>predicted_value</code>, <code>confidence</code> e <code>interpretation</code> más campos específicos.
              </p>
              <div className="card" style={{ marginBottom: 16, padding: '0.75rem', background: 'rgba(139,92,246,0.05)', borderLeft: '3px solid #a855f7' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>🔌 Endpoint de Inferencia</div>
                <div className="mono text-xs" style={{ lineHeight: 1.8 }}>
                  <strong style={{ color: '#22c55e' }}>POST</strong> <span style={{ color: '#06b6d4' }}>/api/v1/ml/predict</span><br />
                  Body: <code>{`{ "model_name": "...", "features": {"key": value, ...}, "horizon_minutes": 30 }`}</code><br />
                  Auth: JWT Bearer token obligatorio (cualquier rol).<br />
                  Re-entrenamiento: <strong style={{ color: '#f97316' }}>POST</strong> <span style={{ color: '#06b6d4' }}>/api/v1/ml/retrain/{'{model_name}'}</span> — solo <em>data_scientist</em> o <em>admin</em>.
                </div>
              </div>

              {ML_MODELS.map((model) => {
                const Icon = model.icon;
                return (
                  <div key={model.id} className="card" style={{ marginBottom: 16, padding: '1rem', borderLeft: `4px solid ${model.color}` }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10, gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${model.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: model.color, border: `1px solid ${model.color}25`, flexShrink: 0 }}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{model.name}</div>
                          <div className="mono text-xs" style={{ color: model.color }}>{model.algorithm}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <span className="badge badge-default" style={{ fontSize: '0.6rem' }}>{model.category}</span>
                        <span className="mono" style={{ fontSize: '0.6rem', padding: '2px 7px', borderRadius: 4, background: `${model.color}15`, color: model.color }}>v{model.version}</span>
                        <span className="badge badge-success" style={{ fontSize: '0.6rem' }}>DEPLOYED</span>
                      </div>
                    </div>

                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 12, lineHeight: 1.5 }}>{model.description}</p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
                      <div>
                        <div className="text-xs" style={{ color: model.color, fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Entradas</div>
                        {model.inputs.map((inp, i) => (
                          <div key={i} className="mono text-xs" style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>• {inp}</div>
                        ))}
                      </div>
                      <div>
                        <div className="text-xs" style={{ color: model.color, fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Salidas</div>
                        <div className="mono text-xs" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{model.outputs[0]}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 10 }}>
                      {Object.entries(model.metrics).map(([k, v]) => (
                        <span key={k} className="mono" style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: 4, background: `${model.color}08`, color: model.color, border: `1px solid ${model.color}20` }}>
                          {k}: {v}
                        </span>
                      ))}
                      <span style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: 4, background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)' }}>
                        {model.samples} muestras de entrenamiento
                      </span>
                    </div>

                    <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.02)', fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>
                      <strong style={{ color: model.color }}>Nota técnica:</strong> {model.notes}
                    </div>
                  </div>
                );
              })}

              <div className="card" style={{ padding: '0.75rem', background: 'rgba(6,182,212,0.05)', borderLeft: '3px solid #06b6d4' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>📋 Listado de Endpoints ML</div>
                <div className="mono text-xs" style={{ lineHeight: 2 }}>
                  <span style={{ color: '#06b6d4' }}>GET</span>  /api/v1/ml/models — listado de todos los modelos con métricas<br />
                  <span style={{ color: '#06b6d4' }}>GET</span>  /api/v1/ml/models/{'{id}'} — detalle de un modelo<br />
                  <span style={{ color: '#22c55e' }}>POST</span> /api/v1/ml/predict — ejecutar inferencia<br />
                  <span style={{ color: '#06b6d4' }}>GET</span>  /api/v1/ml/predictions — historial de predicciones<br />
                  <span style={{ color: '#22c55e' }}>POST</span> /api/v1/ml/retrain/{'{model_name}'} — re-entrenar modelo (admin/data_scientist)
                </div>
              </div>
            </div>
          )}

          {/* Instrumentos */}
          {activeSection === 'instruments' && (
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Gauge size={18} color="var(--accent-blue)" />
                Instrumentación del Sistema
              </h2>
              <p className="text-sm text-muted" style={{ marginBottom: 16 }}>
                Catálogo de instrumentos implementados con especificaciones técnicas.
              </p>

              <div className="card" style={{ padding: '0.75rem', background: 'rgba(59,130,246,0.05)', borderLeft: '3px solid var(--accent-blue)', marginBottom: 16 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>📊 Resumen de Instrumentación</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                  <div>
                    <div className="text-xs text-muted">PROCESO MA-100</div>
                    <div style={{ fontWeight: 700, fontSize: '1.5rem', color: 'var(--accent-blue)' }}>21</div>
                    <div className="text-xs">instrumentos</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted">PROCESO AT-200</div>
                    <div style={{ fontWeight: 700, fontSize: '1.5rem', color: 'var(--accent-green)' }}>11</div>
                    <div className="text-xs">instrumentos</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted">TOTAL LAZOS</div>
                    <div style={{ fontWeight: 700, fontSize: '1.5rem', color: 'var(--accent-purple)' }}>32</div>
                    <div className="text-xs">activos</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted">FRECUENCIA</div>
                    <div style={{ fontWeight: 700, fontSize: '1.5rem', color: 'var(--accent-orange)' }}>2s</div>
                    <div className="text-xs">muestreo</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="card" style={{ padding: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8, color: 'var(--accent-blue)' }}>
                    MA-100: Anhídrido Maleico
                  </h3>
                  <div className="text-xs text-muted" style={{ marginBottom: 8 }}>Instrumentos en P&ID (tags reales del sistema)</div>
                  <div className="text-xs" style={{ lineHeight: 1.8 }}>
                    <strong>TIC-101 (TI-101):</strong> Control temp. reactor lecho fijo (350-480°C) — DCS<br />
                    <strong>TI-102:</strong> Temperatura tope reactor — Campo<br />
                    <strong>PIC-101 (PI-101):</strong> Control presión reactor (1-3.5 bar) — DCS<br />
                    <strong>FIC-101 (FI-101):</strong> Control flujo n-butano (200-500 kg/h) — DCS<br />
                    <strong>FIC-102 (FI-102):</strong> Control flujo aire compresor C-101 — DCS<br />
                    <strong>TI-103:</strong> Temperatura salida E-102 — Campo<br />
                    <strong>TI-104:</strong> Temperatura tope T-101 — Campo<br />
                    <strong>PI-102:</strong> Presión columna absorción T-101 — Campo<br />
                    <strong>LIC-101 (LI-101):</strong> Nivel tanque TK-101 (%) — DCS<br />
                    <strong>TI-106:</strong> Temperatura tope T-102 — Campo<br />
                    <strong>TI-107:</strong> Temperatura fundidora K-101 — Campo<br />
                    <strong>AI-101:</strong> Análisis pureza producto (%) — DCS<br />
                    <strong>FI-103:</strong> Flujo producto final — Campo<br />
                    <strong>LIC-103 (LI-103):</strong> Nivel tanque producto TK-102 — DCS
                  </div>
                </div>

                <div className="card" style={{ padding: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8, color: 'var(--accent-green)' }}>
                    AT-200: Ácido Tartárico
                  </h3>
                  <div className="text-xs text-muted" style={{ marginBottom: 8 }}>Instrumentos en P&ID (tags reales del sistema)</div>
                  <div className="text-xs" style={{ lineHeight: 1.8 }}>
                    <strong>TIC-201 (TI-201):</strong> Control temp. reactor desulfitación (60-110°C) — DCS<br />
                    <strong>FIC-201 (FI-201):</strong> Control flujo alimentación (kg/h) — DCS<br />
                    <strong>LIC-201 (LI-201):</strong> Nivel tanque MP TK-201 (%) — DCS<br />
                    <strong>PIC-201 (PI-201):</strong> Control presión evaporador (0.3-1.5 bar) — DCS<br />
                    <strong>TI-202:</strong> Temperatura evaporador EV-201 — Campo<br />
                    <strong>TI-203:</strong> Temperatura evaporador EV-202 — Campo<br />
                    <strong>TIC-205 (TI-205):</strong> Control temp. cristalizador CR-201 — DCS<br />
                    <strong>AI-201:</strong> Pureza producto (%) — DCS<br />
                    <strong>AI-202:</strong> pH post intercambio iónico — Campo<br />
                    <strong>FI-202:</strong> Flujo producto final — Campo
                  </div>
                </div>
              </div>

              <div className="card" style={{ marginTop: 16, padding: '0.75rem', background: 'rgba(34,197,94,0.05)', borderLeft: '3px solid var(--accent-green)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>⚙️ Configuración de Control</div>
                <div className="text-sm" style={{ lineHeight: 1.6 }}>
                  <strong>Algoritmo PID:</strong> Controladores con anti-windup y bumpless transfer<br />
                  <strong>Tiempo de muestreo:</strong> 2 segundos para control de proceso<br />
                  <strong>Filtros digitales:</strong> Filtro pasa-bajos 1er orden (τ = 5s) para señales ruidosas<br />
                  <strong>Alarmas:</strong> Límites HH/H/L/LL configurables por instrumento<br />
                  <strong>Historial:</strong> Retención 30 días en InfluxDB, agregación horaria
                </div>
              </div>
            </div>
          )}

          {/* ── SPC Section ──────────────────────────────── */}
          {activeSection === 'spc' && (
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart3 size={18} color="#06b6d4" />
                Control Estadístico de Procesos (SPC)
              </h2>
              <p className="text-sm text-muted" style={{ marginBottom: 12, lineHeight: 1.5 }}>
                Módulo de análisis estadístico en tiempo real que implementa tres métodos de carta de control
                complementarios, detección de reglas Western Electric e índices de capacidad de proceso.
              </p>

              {/* Endpoints */}
              <div className="card" style={{ marginBottom: 16, padding: '0.75rem', background: 'rgba(6,182,212,0.05)', borderLeft: '3px solid #06b6d4' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>🔌 Endpoints SPC</div>
                <div className="mono text-xs" style={{ lineHeight: 2 }}>
                  <strong style={{ color: '#22c55e' }}>GET</strong> <span style={{ color: '#06b6d4' }}>/api/v1/spc/instruments</span> — Lista instrumentos para análisis<br />
                  <strong style={{ color: '#22c55e' }}>GET</strong> <span style={{ color: '#06b6d4' }}>/api/v1/spc/shewhart/{'{tag}'}?time_range=-6h</span> — Carta Shewhart X̄<br />
                  <strong style={{ color: '#22c55e' }}>GET</strong> <span style={{ color: '#06b6d4' }}>/api/v1/spc/cusum/{'{tag}'}?k=0.5&h=5</span> — Carta CUSUM<br />
                  <strong style={{ color: '#22c55e' }}>GET</strong> <span style={{ color: '#06b6d4' }}>/api/v1/spc/ewma/{'{tag}'}?lam=0.2&L=3</span> — Carta EWMA<br />
                  Auth: JWT Bearer token obligatorio (cualquier rol).
                </div>
              </div>

              {/* Shewhart */}
              <div className="card" style={{ marginBottom: 16, padding: '1rem', borderLeft: '4px solid #06b6d4' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 8, color: '#06b6d4' }}>📊 Carta Shewhart X̄</div>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 10, lineHeight: 1.5 }}>
                  Carta de control clásica para monitorear la media del proceso. Detecta cambios grandes ({'>'}1.5σ) en una sola muestra.
                </p>
                <div className="text-xs" style={{ lineHeight: 1.8 }}>
                  <strong>Línea Central (CL):</strong> X̄ = media aritmética de todas las observaciones<br />
                  <strong>UCL / LCL (±3σ):</strong> Límites de control — 99.73% de las observaciones si el proceso está bajo control<br />
                  <strong>UWL / LWL (±2σ):</strong> Límites de advertencia — zona B, precaución<br />
                  <strong>Zonas:</strong> C (±1σ, verde), B (1-2σ, amarillo), A ({'>'}2σ, rojo)<br />
                  <strong>Moving Range:</strong> MR̄ con D₄=3.267 para subgrupo n=2 (individuales)
                </div>
              </div>

              {/* CUSUM */}
              <div className="card" style={{ marginBottom: 16, padding: '1rem', borderLeft: '4px solid #22c55e' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 8, color: '#22c55e' }}>📈 Carta CUSUM (Suma Acumulativa)</div>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 10, lineHeight: 1.5 }}>
                  Acumula desviaciones desde la media objetivo. Superior para detectar desplazamientos pequeños y sostenidos (0.5-1.5σ).
                </p>
                <div className="text-xs" style={{ lineHeight: 1.8 }}>
                  <strong>C⁺ᵢ:</strong> max(0, C⁺ᵢ₋₁ + (xᵢ - μ₀) - K) — acumula desviaciones positivas<br />
                  <strong>C⁻ᵢ:</strong> max(0, C⁻ᵢ₋₁ - (xᵢ - μ₀) - K) — acumula desviaciones negativas<br />
                  <strong>K (slack):</strong> k × σ — tolerancia de desviación (default k=0.5)<br />
                  <strong>H (decisión):</strong> h × σ — umbral de señal (default h=5.0)<br />
                  <strong>Señal:</strong> Se declara cuando C⁺ o C⁻ excede H
                </div>
              </div>

              {/* EWMA */}
              <div className="card" style={{ marginBottom: 16, padding: '1rem', borderLeft: '4px solid #a855f7' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 8, color: '#a855f7' }}>📉 Carta EWMA (Media Móvil Ponderada)</div>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 10, lineHeight: 1.5 }}>
                  Suaviza observaciones dando mayor peso a datos recientes. Límites de control dinámicos que se estabilizan con el tiempo.
                </p>
                <div className="text-xs" style={{ lineHeight: 1.8 }}>
                  <strong>zᵢ:</strong> λxᵢ + (1-λ)zᵢ₋₁ — valor EWMA suavizado<br />
                  <strong>λ (lambda):</strong> Factor de suavizado (0.05-1.0, default 0.2). Menor λ = más suavización<br />
                  <strong>L:</strong> Multiplicador de σ para límites (default 3.0)<br />
                  <strong>UCL/LCL:</strong> μ₀ ± Lσ√(λ/(2-λ)·(1-(1-λ)²ⁱ)) — varían con cada observación<br />
                  <strong>Ideal para:</strong> Desplazamientos 0.5-2.0σ en la media del proceso
                </div>
              </div>

              {/* Capability */}
              <div className="card" style={{ marginBottom: 16, padding: '1rem', borderLeft: '4px solid #eab308' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 8, color: '#eab308' }}>🎯 Índices de Capacidad de Proceso</div>
                <div className="text-xs" style={{ lineHeight: 1.8 }}>
                  <strong>Cp:</strong> (USL - LSL) / 6σ_within — capacidad potencial (centrado perfecto)<br />
                  <strong>Cpk:</strong> min(CPU, CPL) — capacidad real considerando centrado<br />
                  <strong>Pp:</strong> (USL - LSL) / 6σ_overall — rendimiento potencial a largo plazo<br />
                  <strong>Ppk:</strong> min(PPU, PPL) — rendimiento real a largo plazo<br />
                  <strong>σ_within:</strong> MR̄ / d₂ (d₂=1.128 para n=2) — variación de corto plazo<br />
                  <strong>σ_overall:</strong> Desviación estándar muestral — variación total
                </div>
                <div className="card" style={{ marginTop: 10, padding: '0.5rem', background: 'rgba(234,179,8,0.05)' }}>
                  <div className="text-xs" style={{ lineHeight: 1.6 }}>
                    <strong style={{ color: '#22c55e' }}>Cpk ≥ 1.33:</strong> Excelente — proceso capaz con margen<br />
                    <strong style={{ color: '#3b82f6' }}>1.0 ≤ Cpk {'<'} 1.33:</strong> Capaz — margen reducido<br />
                    <strong style={{ color: '#eab308' }}>0.67 ≤ Cpk {'<'} 1.0:</strong> Marginal — acción correctiva recomendada<br />
                    <strong style={{ color: '#ef4444' }}>Cpk {'<'} 0.67:</strong> Incapaz — acción inmediata requerida
                  </div>
                </div>
              </div>

              {/* Western Electric Rules */}
              <div className="card" style={{ marginBottom: 16, padding: '1rem', borderLeft: '4px solid #ef4444' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 8, color: '#ef4444' }}>⚠️ Reglas Western Electric</div>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 10, lineHeight: 1.5 }}>
                  Detección automática de patrones no aleatorios que indican causas asignables de variación.
                </p>
                <div className="text-xs" style={{ lineHeight: 1.8 }}>
                  <strong style={{ color: '#ef4444' }}>Regla 1 (CRÍTICA):</strong> 1 punto más allá de ±3σ — indicación directa de fuera de control<br />
                  <strong style={{ color: '#f97316' }}>Regla 2 (ALTA):</strong> 9 puntos consecutivos del mismo lado de la media — sesgo<br />
                  <strong style={{ color: '#eab308' }}>Regla 3 (MEDIA):</strong> 6 puntos consecutivos con tendencia monótona — drift<br />
                  <strong style={{ color: '#f97316' }}>Regla 4 (ALTA):</strong> 2 de 3 puntos consecutivos más allá de ±2σ — inestabilidad
                </div>
              </div>
            </div>
          )}

          {/* ── Reports Section ──────────────────────────── */}
          {activeSection === 'reports' && (
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={18} color="#8b5cf6" />
                Reportes Avanzados y Exportación
              </h2>
              <p className="text-sm text-muted" style={{ marginBottom: 12, lineHeight: 1.5 }}>
                Generación de reportes de producción con KPIs, estadísticas de alarmas, detalle de lotes y exportación a Excel.
                Soporta reportes por turno, diarios, semanales y mensuales.
              </p>

              {/* Endpoints */}
              <div className="card" style={{ marginBottom: 16, padding: '0.75rem', background: 'rgba(139,92,246,0.05)', borderLeft: '3px solid #8b5cf6' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>🔌 Endpoints de Reportes</div>
                <div className="mono text-xs" style={{ lineHeight: 2 }}>
                  <strong style={{ color: '#22c55e' }}>GET</strong> <span style={{ color: '#06b6d4' }}>/api/v1/reports/generate?process_id=1&report_type=daily&periods_back=1</span><br />
                  Genera reporte con KPIs, alarmas y lotes. Guarda en DB.<br />
                  <strong style={{ color: '#22c55e' }}>GET</strong> <span style={{ color: '#06b6d4' }}>/api/v1/reports/history?process_id=1</span> — Historial de reportes<br />
                  <strong style={{ color: '#22c55e' }}>GET</strong> <span style={{ color: '#06b6d4' }}>/api/v1/reports/history/{'{id}'}</span> — Detalle de un reporte<br />
                  <strong style={{ color: '#22c55e' }}>GET</strong> <span style={{ color: '#06b6d4' }}>/api/v1/reports/export/excel?process_id=1&report_type=daily</span> — Descarga Excel (.xlsx)<br />
                  <strong style={{ color: '#22c55e' }}>GET</strong> <span style={{ color: '#06b6d4' }}>/api/v1/reports/summary?process_id=1</span> — KPIs rápidos (24h, 7d, 30d)<br />
                  Auth: JWT Bearer token obligatorio.
                </div>
              </div>

              {/* Report Types */}
              <div className="card" style={{ marginBottom: 16, padding: '1rem', borderLeft: '4px solid #8b5cf6' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 8, color: '#8b5cf6' }}>📋 Tipos de Reporte</div>
                <div className="text-xs" style={{ lineHeight: 1.8 }}>
                  <strong>Turno (shift):</strong> Últimas 8 horas — entregado al cambio de turno<br />
                  <strong>Diario (daily):</strong> Últimas 24 horas — resumen de operaciones del día<br />
                  <strong>Semanal (weekly):</strong> Últimos 7 días — tendencia semanal<br />
                  <strong>Mensual (monthly):</strong> Últimos 30 días — análisis de rendimiento mensual<br />
                  <strong>Periodos:</strong> Configurable de 1 a 12 periodos hacia atrás
                </div>
              </div>

              {/* KPIs */}
              <div className="card" style={{ marginBottom: 16, padding: '1rem', borderLeft: '4px solid #22c55e' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 8, color: '#22c55e' }}>📊 KPIs Incluidos</div>
                <div className="text-xs" style={{ lineHeight: 1.8 }}>
                  <strong>Producción:</strong> Total producido (kg), alimentación total (kg)<br />
                  <strong>Rendimiento:</strong> Yield promedio (%), pureza promedio (%)<br />
                  <strong>OEE:</strong> Overall Equipment Effectiveness (%) — horas operativas / periodo<br />
                  <strong>Calidad:</strong> Distribución por grado (A/B/C) con gráfico circular<br />
                  <strong>Económicos:</strong> Costo total, ingreso total, margen ($ y %)<br />
                  <strong>Condiciones:</strong> Temperatura y presión promedio del periodo<br />
                  <strong>Alarmas:</strong> Total, por prioridad (CRITICA/ALTA/MEDIA/BAJA), por tipo, top instrumentos<br />
                  <strong>Tiempo de respuesta:</strong> Promedio de tiempo de reconocimiento de alarmas<br />
                  <strong>Lotes:</strong> Totales, completados, planificados, en progreso
                </div>
              </div>

              {/* Excel Export */}
              <div className="card" style={{ marginBottom: 16, padding: '1rem', borderLeft: '4px solid #eab308' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 8, color: '#eab308' }}>📥 Exportación Excel</div>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 10, lineHeight: 1.5 }}>
                  Genera archivo .xlsx con formato profesional usando openpyxl. El Excel contiene 3 hojas:
                </p>
                <div className="text-xs" style={{ lineHeight: 1.8 }}>
                  <strong>Hoja 1 — KPIs:</strong> Indicadores clave con período y formato Calibri<br />
                  <strong>Hoja 2 — Lotes:</strong> Tabla detallada con estado, rendimiento, pureza, costos<br />
                  <strong>Hoja 3 — Alarmas:</strong> Estadísticas, tiempo de respuesta, top instrumentos<br />
                  <strong>Formato:</strong> Encabezados con fondo #1e3a5f, bordes finos, ancho de columna autoajustado
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
