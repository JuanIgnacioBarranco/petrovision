// ============================================================
// PetroVision — ML / AI Dashboard (Professional Edition)
// ============================================================
// Comprehensive ML monitoring dashboard with:
//   - 6 model cards with live metrics & architecture info
//   - Interactive inference panel with feature inputs
//   - Rich result display (interpretation, recommendations,
//     confidence intervals, Weibull curves, anomaly breakdown)
//   - Prediction history with trend charts
//   - Model comparison table
//   - Feature importance visualization
// ============================================================

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Brain, Cpu, Target, AlertTriangle, Wrench, TrendingUp,
  BarChart3, RefreshCw, Play, Activity, ChevronDown, ChevronUp,
  Zap, Shield, ThermometerSun, FlaskConical, Gauge, Settings2,
  CheckCircle2, XCircle, Clock, Database, GitBranch, Eye,
  Layers, Sparkles, Info,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, BarChart, Bar, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area,
  Cell, PieChart, Pie, Legend,
} from 'recharts';
import { mlAPI } from '@/services/api';
import type { MLModel, Prediction } from '@/types';

// ── Constants ───────────────────────────────────────────────

const MODEL_META: Record<string, {
  icon: any; color: string; label: string; shortDesc: string; category: string;
}> = {
  temperature_predictor: {
    icon: ThermometerSun, color: '#f97316', label: 'Predicción de Temperatura',
    shortDesc: 'Forecast LSTM multi-horizonte para temperatura del reactor',
    category: 'Predicción',
  },
  yield_optimizer: {
    icon: Target, color: '#22c55e', label: 'Optimizador de Rendimiento',
    shortDesc: 'Modelo Response Surface + XGBoost para maximizar yield',
    category: 'Optimización',
  },
  anomaly_detector: {
    icon: AlertTriangle, color: '#ef4444', label: 'Detector de Anomalías',
    shortDesc: 'Isolation Forest multivariable con severidad ISA 18.2',
    category: 'Detección',
  },
  maintenance_predictor: {
    icon: Wrench, color: '#a855f7', label: 'Mantenimiento Predictivo',
    shortDesc: 'Análisis de supervivencia Weibull + Random Forest',
    category: 'Mantenimiento',
  },
  quality_predictor: {
    icon: FlaskConical, color: '#06b6d4', label: 'Predicción de Calidad',
    shortDesc: 'Gaussian Process para predicción de pureza de producto',
    category: 'Calidad',
  },
  energy_optimizer: {
    icon: Zap, color: '#eab308', label: 'Optimización Energética',
    shortDesc: 'Optimización multi-objetivo Pareto para consumo energético',
    category: 'Optimización',
  },
};

// ── Feature configs per model (for user input forms) ────────

const MODEL_FEATURES: Record<string, Array<{
  key: string; label: string; unit: string; default: number; min: number; max: number; step: number;
}>> = {
  temperature_predictor: [
    { key: 'current_value', label: 'Temperatura actual', unit: '°C', default: 420, min: 380, max: 460, step: 0.5 },
    { key: 'setpoint', label: 'Setpoint', unit: '°C', default: 420, min: 380, max: 460, step: 0.5 },
    { key: 'flow', label: 'Flujo alimentación', unit: 'kg/h', default: 340, min: 200, max: 500, step: 5 },
    { key: 'pressure', label: 'Presión reactor', unit: 'bar', default: 2.1, min: 1.5, max: 3.0, step: 0.05 },
  ],
  yield_optimizer: [
    { key: 'temperature', label: 'Temperatura', unit: '°C', default: 420, min: 380, max: 460, step: 0.5 },
    { key: 'pressure', label: 'Presión', unit: 'bar', default: 2.1, min: 1.5, max: 3.0, step: 0.05 },
    { key: 'flow', label: 'Flujo n-butano', unit: 'kg/h', default: 340, min: 200, max: 500, step: 5 },
    { key: 'catalyst_age_hours', label: 'Edad catalizador', unit: 'h', default: 2000, min: 0, max: 12000, step: 100 },
    { key: 'o2_ratio', label: 'Relación O₂', unit: ':1', default: 3.5, min: 2.5, max: 5.0, step: 0.1 },
  ],
  anomaly_detector: [
    { key: 'current_value', label: 'Valor actual', unit: '', default: 420, min: 0, max: 1000, step: 1 },
    { key: 'setpoint', label: 'Setpoint', unit: '', default: 420, min: 0, max: 1000, step: 1 },
    { key: 'rate_of_change', label: 'Tasa de cambio', unit: '/min', default: 0.2, min: -10, max: 10, step: 0.1 },
  ],
  maintenance_predictor: [
    { key: 'operating_hours', label: 'Horas operación', unit: 'h', default: 2000, min: 0, max: 15000, step: 100 },
    { key: 'temperature', label: 'Temperatura', unit: '°C', default: 420, min: 350, max: 500, step: 1 },
    { key: 'vibration', label: 'Vibración', unit: 'mm/s', default: 2.5, min: 0, max: 10, step: 0.1 },
    { key: 'load_pct', label: 'Carga', unit: '%', default: 75, min: 0, max: 100, step: 1 },
    { key: 'last_maintenance_days', label: 'Días desde mtto.', unit: 'días', default: 60, min: 0, max: 365, step: 1 },
  ],
  quality_predictor: [
    { key: 'temperature', label: 'Temperatura', unit: '°C', default: 420, min: 380, max: 460, step: 0.5 },
    { key: 'pressure', label: 'Presión', unit: 'bar', default: 2.1, min: 1.5, max: 3.0, step: 0.05 },
    { key: 'flow', label: 'Flujo', unit: 'kg/h', default: 340, min: 200, max: 500, step: 5 },
    { key: 'residence_time', label: 'Tiempo residencia', unit: 's', default: 4.5, min: 2, max: 8, step: 0.1 },
  ],
  energy_optimizer: [
    { key: 'current_power_kw', label: 'Consumo actual', unit: 'kW', default: 285, min: 100, max: 500, step: 5 },
    { key: 'temperature', label: 'Temperatura', unit: '°C', default: 420, min: 380, max: 460, step: 0.5 },
    { key: 'throughput_kg_h', label: 'Throughput', unit: 'kg/h', default: 340, min: 200, max: 500, step: 5 },
  ],
};

const HORIZONS = [5, 10, 15, 30, 60];

// ── Helper components ───────────────────────────────────────

function MetricBadge({ value, label, color, suffix = '' }: { value: number | string; label: string; color: string; suffix?: string }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 56 }}>
      <div className="mono" style={{ fontSize: '0.95rem', fontWeight: 700, color }}>{typeof value === 'number' ? value.toFixed(3) : value}{suffix}</div>
      <div className="text-xs text-muted" style={{ marginTop: 2 }}>{label}</div>
    </div>
  );
}

function ConfidenceBar({ value, height = 6 }: { value: number; height?: number }) {
  const pct = Math.min(100, Math.max(0, value * 100));
  const color = pct >= 90 ? '#22c55e' : pct >= 75 ? '#eab308' : '#ef4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
      <div style={{ flex: 1, height, background: 'rgba(255,255,255,0.06)', borderRadius: height / 2, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: height / 2, transition: 'width 0.5s' }} />
      </div>
      <span className="mono text-xs" style={{ color, minWidth: 40, textAlign: 'right' }}>{pct.toFixed(1)}%</span>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const color = status === 'DEPLOYED' ? '#22c55e' : status === 'TRAINED' ? '#3b82f6' : status === 'FAILED' ? '#ef4444' : '#64748b';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase',
      color, letterSpacing: '0.04em',
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}40` }} />
      {status}
    </span>
  );
}

function SectionHeader({ title, icon: Icon, count }: { title: string; icon: any; count?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, marginTop: 8 }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: 'rgba(6,182,212,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={14} color="#06b6d4" />
      </div>
      <h2 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>{title}</h2>
      {count != null && (
        <span className="badge badge-default" style={{ fontSize: '0.6rem' }}>{count}</span>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────

export default function MLDashboard() {
  const [models, setModels] = useState<MLModel[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [selectedModel, setSelectedModel] = useState<MLModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [predResult, setPredResult] = useState<any>(null);
  const [featureValues, setFeatureValues] = useState<Record<string, number>>({});
  const [horizon, setHorizon] = useState(30);
  const [expandedModel, setExpandedModel] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'inference' | 'history' | 'comparison'>('inference');
  const [retrainStatus, setRetrainStatus] = useState<Record<string, string>>({});

  // ── Load data ─────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const [modRes, predRes] = await Promise.all([
          mlAPI.listModels(),
          mlAPI.listPredictions(),
        ]);
        setModels(modRes.data);
        setPredictions(predRes.data);
        if (modRes.data.length > 0) {
          setSelectedModel(modRes.data[0]);
          initFeatures(modRes.data[0].name);
        }
      } catch (err) {
        console.error('Error loading ML data:', err);
      }
    })();
  }, []);

  const initFeatures = useCallback((modelName: string) => {
    const feats = MODEL_FEATURES[modelName] || [];
    const vals: Record<string, number> = {};
    feats.forEach(f => { vals[f.key] = f.default; });
    setFeatureValues(vals);
    setPredResult(null);
  }, []);

  const handleSelectModel = useCallback((model: MLModel) => {
    setSelectedModel(model);
    initFeatures(model.name);
  }, [initFeatures]);

  // ── Predict ───────────────────────────────────────────────

  const handlePredict = async () => {
    if (!selectedModel) return;
    setPredicting(true);
    try {
      const { data } = await mlAPI.predict({
        model_name: selectedModel.name,
        features: featureValues,
        horizon_minutes: horizon,
        target_tag: selectedModel.name.includes('temperature') ? 'TI-101' :
                    selectedModel.name.includes('anomaly') ? 'TI-101' : undefined,
      });
      setPredResult(data);
      const { data: preds } = await mlAPI.listPredictions();
      setPredictions(preds);
    } catch (err: any) {
      console.error('Prediction error:', err);
      setPredResult({ error_msg: err?.response?.data?.detail || 'Error ejecutando inferencia' });
    } finally {
      setPredicting(false);
    }
  };

  // ── Retrain ───────────────────────────────────────────────

  const handleRetrain = async (modelName: string) => {
    setRetrainStatus(s => ({ ...s, [modelName]: 'TRAINING' }));
    try {
      await mlAPI.retrain(modelName);
      setRetrainStatus(s => ({ ...s, [modelName]: 'QUEUED' }));
      setTimeout(() => setRetrainStatus(s => ({ ...s, [modelName]: '' })), 4000);
      const { data: mods } = await mlAPI.listModels();
      setModels(mods);
    } catch (err) {
      setRetrainStatus(s => ({ ...s, [modelName]: 'ERROR' }));
      console.error('Retrain error:', err);
    }
  };

  // ── Derived data ──────────────────────────────────────────

  const predChart = useMemo(() =>
    predictions
      .filter(p => p.model_id === selectedModel?.id)
      .slice(-40)
      .reverse()
      .map(p => ({
        time: new Date(p.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        pred: p.predicted_value,
        actual: p.actual_value,
        conf: p.confidence,
      })),
    [predictions, selectedModel],
  );

  const modelComparisonData = useMemo(() =>
    models.map(m => {
      const metrics = m.metrics || {};
      return {
        name: (MODEL_META[m.name]?.label || m.name).replace('Predicción de ', '').replace('Optimizador de ', '').replace('Detector de ', '').replace('Mantenimiento ', '').replace('Predicción de ', '').replace('Optimización ', ''),
        r2: metrics.r2 || 0,
        precision: metrics.precision || 0,
        recall: metrics.recall || 0,
        rmse: metrics.rmse || 0,
        samples: m.training_samples || 0,
        color: MODEL_META[m.name]?.color || '#3b82f6',
      };
    }),
    [models],
  );

  const meta = selectedModel ? MODEL_META[selectedModel.name] : null;
  const featureConfig = selectedModel ? (MODEL_FEATURES[selectedModel.name] || []) : [];

  // ════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════

  return (
    <div>
      {/* ── Header ───────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.1))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(139,92,246,0.2)',
            }}>
              <Brain size={18} color="#a855f7" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Inteligencia Artificial & ML</h1>
              <p className="text-sm text-muted" style={{ margin: 0 }}>
                {models.length} modelos desplegados · {predictions.length} predicciones registradas
              </p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['inference', 'history', 'comparison'].map(tab => (
            <button key={tab} className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab(tab as any)}
              style={{ textTransform: 'capitalize', fontSize: '0.7rem' }}>
              {tab === 'inference' ? '🔬 Inferencia' : tab === 'history' ? '📊 Historial' : '📈 Comparación'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Model Cards Grid ─────────────────────────────── */}
      <SectionHeader title="Modelos Desplegados" icon={Layers} count={models.length} />
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 12,
        marginBottom: 24,
      }}>
        {models.map(model => {
          const m = MODEL_META[model.name] || { icon: Brain, color: '#3b82f6', label: model.name, shortDesc: '', category: '–' };
          const Icon = m.icon;
          const metrics = model.metrics || {};
          const isSelected = selectedModel?.id === model.id;
          const isExpanded = expandedModel === model.id;
          const retrainSt = retrainStatus[model.name];

          return (
            <div
              key={model.id}
              className="card"
              onClick={() => handleSelectModel(model)}
              style={{
                cursor: 'pointer',
                borderColor: isSelected ? m.color : 'var(--border-color)',
                borderWidth: isSelected ? 2 : 1,
                transition: 'border-color 0.2s, transform 0.15s, box-shadow 0.2s',
                transform: isSelected ? 'translateY(-2px)' : 'none',
                boxShadow: isSelected ? `0 4px 20px ${m.color}15` : 'none',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Accent strip */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: isSelected ? m.color : 'transparent', transition: 'background 0.2s' }} />

              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: `${m.color}12`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: m.color, border: `1px solid ${m.color}25`,
                  }}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.82rem', lineHeight: 1.2 }}>{m.label}</div>
                    <div className="text-xs text-muted" style={{ marginTop: 2 }}>{m.category} · v{model.version}</div>
                  </div>
                </div>
                <StatusDot status={model.status} />
              </div>

              {/* Algorithm & Description */}
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)', marginBottom: 10, lineHeight: 1.4 }}>
                <span className="mono" style={{ color: m.color, fontWeight: 600 }}>{model.algorithm}</span>
                {' — '}{m.shortDesc}
              </div>

              {/* Key Metrics */}
              <div style={{
                display: 'flex', gap: 8, justifyContent: 'space-between', flexWrap: 'wrap',
                padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.05)',
              }}>
                {Object.entries(metrics).slice(0, 4).map(([key, val]) => (
                  <MetricBadge key={key} value={val as number} label={key.toUpperCase()} color={m.color} />
                ))}
              </div>

              {/* Training Info */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '6px 0 2px', borderTop: '1px solid rgba(255,255,255,0.04)',
                fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Database size={10} /> {(model.training_samples || 0).toLocaleString()} muestras
                </span>
                {model.trained_at && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Clock size={10} /> {new Date(model.trained_at).toLocaleDateString('es-AR')}
                  </span>
                )}
                {model.drift_detected && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#eab308' }}>
                    <AlertTriangle size={10} /> Drift
                  </span>
                )}
              </div>

              {/* Expandable details */}
              <button
                className="btn btn-sm btn-secondary"
                onClick={(e) => { e.stopPropagation(); setExpandedModel(isExpanded ? null : model.id); }}
                style={{ marginTop: 8, width: '100%', fontSize: '0.65rem', justifyContent: 'center' }}
              >
                {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {isExpanded ? 'Ocultar detalles' : 'Ver arquitectura'}
              </button>

              {isExpanded && (
                <div style={{
                  marginTop: 8, padding: '10px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)',
                  fontSize: '0.7rem', lineHeight: 1.6,
                }}>
                  {(model as any).description && (
                    <p style={{ margin: '0 0 8px', color: 'rgba(255,255,255,0.5)' }}>{(model as any).description}</p>
                  )}
                  <div className="mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    <strong style={{ color: m.color }}>Features:</strong>{' '}
                    {((model as any).features_used || []).join(', ') || '—'}
                  </div>
                  {(model as any).hyperparameters && (
                    <div className="mono" style={{ color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                      <strong style={{ color: m.color }}>Hiperparámetros:</strong>{' '}
                      {Object.entries((model as any).hyperparameters).map(([k, v]) => `${k}=${v}`).join(', ')}
                    </div>
                  )}
                  <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                    <button className="btn btn-sm btn-secondary" onClick={(e) => { e.stopPropagation(); handleRetrain(model.name); }}
                      disabled={!!retrainSt}
                      style={{ fontSize: '0.6rem', flex: 1 }}
                    >
                      <RefreshCw size={11} className={retrainSt === 'TRAINING' ? 'animate-spin' : ''} />
                      {retrainSt === 'QUEUED' ? '✓ Encolado' : retrainSt === 'TRAINING' ? 'Entrenando...' : 'Re-entrenar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ════════════════════════════════════════════════════ */}
      {/* TAB: INFERENCE */}
      {/* ════════════════════════════════════════════════════ */}

      {activeTab === 'inference' && selectedModel && meta && (
        <>
          <SectionHeader title={`Inferencia — ${meta.label}`} icon={Cpu} />
          <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16, marginBottom: 24 }}>

            {/* ── Feature Inputs Panel ────────────────────── */}
            <div className="card" style={{ borderColor: `${meta.color}30` }}>
              <div className="card-header" style={{ marginBottom: 12 }}>
                <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Settings2 size={14} color={meta.color} /> Parámetros de Entrada
                </span>
              </div>

              {featureConfig.map(feat => (
                <div key={feat.key} style={{ marginBottom: 12 }}>
                  <label className="text-xs" style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                    marginBottom: 4, color: 'rgba(255,255,255,0.4)',
                    textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.6rem', fontWeight: 600,
                  }}>
                    <span>{feat.label}</span>
                    <span className="mono" style={{ color: meta.color }}>
                      {(featureValues[feat.key] ?? feat.default).toFixed(feat.step < 1 ? 2 : 0)} {feat.unit}
                    </span>
                  </label>
                  <input
                    type="range"
                    min={feat.min} max={feat.max} step={feat.step}
                    value={featureValues[feat.key] ?? feat.default}
                    onChange={e => setFeatureValues(v => ({ ...v, [feat.key]: parseFloat(e.target.value) }))}
                    style={{ width: '100%', accentColor: meta.color }}
                  />
                  <div className="text-xs text-muted" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 1 }}>
                    <span>{feat.min}</span><span>{feat.max}</span>
                  </div>
                </div>
              ))}

              {/* Horizon selector */}
              <div style={{ marginBottom: 14 }}>
                <label className="text-xs" style={{
                  display: 'block', marginBottom: 6, color: 'rgba(255,255,255,0.4)',
                  textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.6rem', fontWeight: 600,
                }}>
                  Horizonte de Predicción
                </label>
                <div style={{ display: 'flex', gap: 4 }}>
                  {HORIZONS.map(h => (
                    <button key={h}
                      className={`btn btn-sm ${horizon === h ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setHorizon(h)}
                      style={{ flex: 1, fontSize: '0.65rem', padding: '4px 0' }}
                    >
                      {h}m
                    </button>
                  ))}
                </div>
              </div>

              <button
                className="btn btn-primary"
                onClick={handlePredict}
                disabled={predicting}
                style={{
                  width: '100%', padding: '10px',
                  fontSize: '0.82rem', fontWeight: 600,
                  background: `linear-gradient(135deg, ${meta.color}, ${meta.color}cc)`,
                  boxShadow: `0 4px 15px ${meta.color}30`,
                }}
              >
                {predicting ? (
                  <><RefreshCw size={14} className="animate-spin" /> Procesando...</>
                ) : (
                  <><Play size={14} /> Ejecutar Inferencia</>
                )}
              </button>
            </div>

            {/* ── Result Panel ─────────────────────────────── */}
            <div className="card" style={{ borderColor: predResult ? `${meta.color}30` : 'var(--border-color)' }}>
              <div className="card-header" style={{ marginBottom: 12 }}>
                <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={14} color={meta.color} /> Resultado de Inferencia
                </span>
                {predResult?.model_version && (
                  <span className="mono text-xs text-muted">v{predResult.model_version} · {predResult.algorithm}</span>
                )}
              </div>

              {!predResult ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  height: 200, color: 'rgba(255,255,255,0.2)',
                }}>
                  <Brain size={40} strokeWidth={1} />
                  <p className="text-sm" style={{ marginTop: 12 }}>Configure los parámetros y ejecute la inferencia</p>
                </div>
              ) : predResult.error_msg ? (
                <div style={{
                  padding: '1rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 8, color: '#f87171',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <XCircle size={16} /> <strong>Error</strong>
                  </div>
                  <p className="text-sm">{predResult.error_msg}</p>
                </div>
              ) : (
                <div>
                  {/* Main prediction value */}
                  <div style={{
                    display: 'flex', alignItems: 'baseline', gap: 12,
                    padding: '12px 16px', borderRadius: 10,
                    background: `${meta.color}08`, border: `1px solid ${meta.color}20`,
                    marginBottom: 14,
                  }}>
                    <div>
                      <div className="text-xs text-muted" style={{ marginBottom: 2 }}>Valor Predicho</div>
                      <div className="mono" style={{ fontSize: '2rem', fontWeight: 800, color: meta.color, lineHeight: 1 }}>
                        {predResult.predicted_value != null ? predResult.predicted_value.toFixed(3) : '—'}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="text-xs text-muted" style={{ marginBottom: 4 }}>Confianza</div>
                      <ConfidenceBar value={predResult.confidence || 0} height={8} />
                    </div>
                  </div>

                  {/* Prediction interval (if available) */}
                  {predResult.prediction_lower != null && (
                    <div style={{
                      display: 'flex', gap: 12, marginBottom: 12,
                      padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8,
                      fontSize: '0.75rem',
                    }}>
                      <div>
                        <div className="text-xs text-muted">Límite Inferior (95%)</div>
                        <div className="mono" style={{ color: '#3b82f6', fontWeight: 600 }}>{predResult.prediction_lower}</div>
                      </div>
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <div className="text-xs text-muted">Intervalo</div>
                        <div className="mono" style={{ color: meta.color }}>
                          [{predResult.prediction_lower} — {predResult.prediction_upper}]
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="text-xs text-muted">Límite Superior (95%)</div>
                        <div className="mono" style={{ color: '#f97316', fontWeight: 600 }}>{predResult.prediction_upper}</div>
                      </div>
                    </div>
                  )}

                  {/* Interpretation */}
                  {predResult.interpretation && (
                    <div style={{
                      padding: '10px 14px', borderRadius: 8,
                      background: 'rgba(6,182,212,0.04)', border: '1px solid rgba(6,182,212,0.12)',
                      marginBottom: 12, display: 'flex', gap: 8,
                    }}>
                      <Info size={16} color="#06b6d4" style={{ flexShrink: 0, marginTop: 2 }} />
                      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.5 }}>
                        {predResult.interpretation}
                      </p>
                    </div>
                  )}

                  {/* Model-specific extras presented as grid */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, marginBottom: 12,
                  }}>
                    {/* Health Index (maintenance) */}
                    {predResult.health_index != null && (
                      <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, textAlign: 'center' }}>
                        <div className="text-xs text-muted">Salud del Equipo</div>
                        <div className="mono" style={{
                          fontSize: '1.5rem', fontWeight: 700,
                          color: predResult.health_index > 70 ? '#22c55e' : predResult.health_index > 40 ? '#eab308' : '#ef4444',
                        }}>{predResult.health_index}%</div>
                      </div>
                    )}
                    {/* RUL (maintenance) */}
                    {predResult.rul_days != null && (
                      <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, textAlign: 'center' }}>
                        <div className="text-xs text-muted">Vida Útil Restante</div>
                        <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 700, color: '#a855f7' }}>
                          {predResult.rul_days} días
                        </div>
                        <div className="text-xs text-muted">{predResult.rul_hours}h</div>
                      </div>
                    )}
                    {/* Urgency (maintenance) */}
                    {predResult.urgency && (
                      <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, textAlign: 'center' }}>
                        <div className="text-xs text-muted">Urgencia</div>
                        <div className="mono" style={{
                          fontSize: '0.85rem', fontWeight: 700,
                          color: predResult.urgency === 'CRITICO' ? '#ef4444' : predResult.urgency === 'ALTO' ? '#f97316' :
                            predResult.urgency === 'MEDIO' ? '#eab308' : '#22c55e',
                        }}>{predResult.urgency}</div>
                      </div>
                    )}
                    {/* Severity (anomaly) */}
                    {predResult.severity && (
                      <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, textAlign: 'center' }}>
                        <div className="text-xs text-muted">Severidad ISA 18.2</div>
                        <div className="mono" style={{
                          fontSize: '0.95rem', fontWeight: 700, color: predResult.severity_color || '#eab308',
                        }}>{predResult.severity}</div>
                      </div>
                    )}
                    {/* Is anomaly flag */}
                    {predResult.is_anomaly !== undefined && (
                      <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, textAlign: 'center' }}>
                        <div className="text-xs text-muted">¿Anomalía?</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 4 }}>
                          {predResult.is_anomaly
                            ? <><AlertTriangle size={18} color="#ef4444" /> <span className="mono" style={{ color: '#ef4444', fontWeight: 700 }}>SÍ</span></>
                            : <><CheckCircle2 size={18} color="#22c55e" /> <span className="mono" style={{ color: '#22c55e', fontWeight: 700 }}>NO</span></>}
                        </div>
                      </div>
                    )}
                    {/* Yield gap */}
                    {predResult.yield_gap != null && (
                      <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, textAlign: 'center' }}>
                        <div className="text-xs text-muted">Gap vs Óptimo</div>
                        <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 700, color: predResult.yield_gap > 3 ? '#ef4444' : '#22c55e' }}>
                          -{predResult.yield_gap}pp
                        </div>
                      </div>
                    )}
                    {/* Catalyst activity */}
                    {predResult.catalyst_activity_pct != null && (
                      <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, textAlign: 'center' }}>
                        <div className="text-xs text-muted">Actividad Catalizador</div>
                        <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 700, color: '#22c55e' }}>
                          {predResult.catalyst_activity_pct}%
                        </div>
                      </div>
                    )}
                    {/* Purity spec */}
                    {predResult.in_spec !== undefined && (
                      <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, textAlign: 'center' }}>
                        <div className="text-xs text-muted">Especificación</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 4 }}>
                          {predResult.in_spec
                            ? <><CheckCircle2 size={18} color="#22c55e" /> <span className="mono" style={{ color: '#22c55e', fontWeight: 700 }}>DENTRO</span></>
                            : <><XCircle size={18} color="#ef4444" /> <span className="mono" style={{ color: '#ef4444', fontWeight: 700 }}>FUERA</span></>}
                        </div>
                      </div>
                    )}
                    {/* Energy savings */}
                    {predResult.savings_pct != null && (
                      <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, textAlign: 'center' }}>
                        <div className="text-xs text-muted">Ahorro Potencial</div>
                        <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 700, color: '#eab308' }}>
                          {predResult.savings_pct}%
                        </div>
                        <div className="text-xs text-muted">{predResult.savings_kw} kW</div>
                      </div>
                    )}
                  </div>

                  {/* Feature Importance (yield optimizer) */}
                  {predResult.feature_importance && (
                    <div style={{ marginBottom: 12 }}>
                      <div className="text-xs text-muted" style={{ marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Importancia de Features
                      </div>
                      {Object.entries(predResult.feature_importance as Record<string, number>)
                        .sort(([, a], [, b]) => b - a)
                        .map(([key, val]) => (
                          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span className="mono text-xs" style={{ width: 100, color: 'rgba(255,255,255,0.4)' }}>{key}</span>
                            <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${val * 100}%`, height: '100%', background: meta.color, borderRadius: 3, transition: 'width 0.5s' }} />
                            </div>
                            <span className="mono text-xs" style={{ color: meta.color, width: 40, textAlign: 'right' }}>{(val * 100).toFixed(0)}%</span>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Anomaly Score Breakdown */}
                  {predResult.score_breakdown && (
                    <div style={{ marginBottom: 12 }}>
                      <div className="text-xs text-muted" style={{ marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Desglose del Score de Anomalía
                      </div>
                      {Object.entries(predResult.score_breakdown as Record<string, number>)
                        .sort(([, a], [, b]) => b - a)
                        .map(([key, val]) => {
                          const barColor = val > 0.6 ? '#ef4444' : val > 0.3 ? '#eab308' : '#22c55e';
                          return (
                            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span className="mono text-xs" style={{ width: 130, color: 'rgba(255,255,255,0.4)' }}>{key.replace(/_/g, ' ')}</span>
                              <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ width: `${val * 100}%`, height: '100%', background: barColor, borderRadius: 3 }} />
                              </div>
                              <span className="mono text-xs" style={{ color: barColor, width: 40, textAlign: 'right' }}>{val.toFixed(3)}</span>
                            </div>
                          );
                        })}
                      {predResult.root_cause && (
                        <div style={{
                          marginTop: 8, padding: '8px 10px', borderRadius: 6,
                          background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)',
                          fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)',
                        }}>
                          <strong style={{ color: '#ef4444' }}>Causa raíz probable:</strong> {predResult.root_cause}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Risk Factors (maintenance) */}
                  {predResult.risk_factors && predResult.risk_factors.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div className="text-xs text-muted" style={{ marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Factores de Riesgo
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {predResult.risk_factors.map((rf: any, i: number) => (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '6px 10px', borderRadius: 6,
                            background: 'rgba(255,255,255,0.02)',
                          }}>
                            <span style={{
                              fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                              background: rf.impact === 'ALTO' ? 'rgba(239,68,68,0.12)' : rf.impact === 'MEDIO' ? 'rgba(234,179,8,0.12)' : 'rgba(34,197,94,0.12)',
                              color: rf.impact === 'ALTO' ? '#ef4444' : rf.impact === 'MEDIO' ? '#eab308' : '#22c55e',
                            }}>{rf.impact}</span>
                            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)', flex: 1 }}>{rf.factor}</span>
                            <span className="mono text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{rf.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations (yield optimizer) */}
                  {predResult.recommendations && predResult.recommendations.length > 0 && (
                    <div style={{
                      padding: '10px 14px', borderRadius: 8,
                      background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.12)',
                    }}>
                      <div className="text-xs" style={{ color: '#22c55e', fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Target size={12} /> Recomendaciones de Optimización
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 16 }}>
                        {predResult.recommendations.map((r: string, i: number) => (
                          <li key={i} className="text-sm" style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendation (maintenance) */}
                  {predResult.recommendation && !predResult.recommendations && (
                    <div style={{
                      padding: '10px 14px', borderRadius: 8,
                      background: predResult.urgency === 'CRITICO' ? 'rgba(239,68,68,0.06)' : 'rgba(34,197,94,0.04)',
                      border: `1px solid ${predResult.urgency === 'CRITICO' ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.12)'}`,
                    }}>
                      <div className="text-xs" style={{
                        color: predResult.urgency === 'CRITICO' ? '#ef4444' : '#22c55e',
                        fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        <Wrench size={12} /> Recomendación
                      </div>
                      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                        {predResult.recommendation}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════ */}
      {/* TAB: HISTORY */}
      {/* ════════════════════════════════════════════════════ */}

      {activeTab === 'history' && (
        <>
          <SectionHeader title="Historial de Predicciones" icon={BarChart3} count={predictions.length} />

          {/* Chart */}
          {predChart.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header">
                <span className="card-title">Tendencia — {meta?.label || 'Modelo'}</span>
                <span className="mono text-xs text-muted">{predChart.length} puntos</span>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={predChart}>
                  <defs>
                    <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={meta?.color || '#06b6d4'} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={meta?.color || '#06b6d4'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" strokeOpacity={0.3} />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                      borderRadius: 8, fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="pred" stroke={meta?.color || '#06b6d4'} fill="url(#predGrad)"
                    strokeWidth={2} dot={false} name="Predicción" />
                  <Line type="monotone" dataKey="actual" stroke="#22c55e" strokeWidth={1.5}
                    dot={false} strokeDasharray="5 5" name="Real" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Table */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Predicciones Recientes</span>
            </div>
            <div className="table-container" style={{ maxHeight: 350, overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Modelo</th>
                    <th>Predicción</th>
                    <th>Confianza</th>
                    <th>Horizonte</th>
                    <th>Real</th>
                    <th>Error</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.slice(0, 30).map(p => {
                    const model = models.find(m => m.id === p.model_id);
                    const pm = MODEL_META[model?.name || ''];
                    const err = p.actual_value != null && p.predicted_value != null
                      ? Math.abs(p.actual_value - p.predicted_value) : null;
                    return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{
                              width: 6, height: 6, borderRadius: '50%',
                              background: pm?.color || '#3b82f6',
                            }} />
                            <span className="mono text-sm">{pm?.label?.replace(/Predicción de |Optimizador de |Detector de |Mantenimiento /g, '') || model?.name}</span>
                          </div>
                        </td>
                        <td className="mono" style={{ color: pm?.color || '#06b6d4', fontWeight: 600 }}>
                          {p.predicted_value?.toFixed(4) ?? '—'}
                        </td>
                        <td style={{ minWidth: 100 }}>
                          <ConfidenceBar value={p.confidence || 0} />
                        </td>
                        <td className="text-sm">{p.horizon_minutes != null ? `${p.horizon_minutes} min` : '—'}</td>
                        <td className="mono text-sm">{p.actual_value?.toFixed(3) ?? '—'}</td>
                        <td className="mono text-sm" style={{ color: err != null ? (err > 1 ? '#ef4444' : '#eab308') : 'var(--text-muted)' }}>
                          {err != null ? err.toFixed(4) : '—'}
                        </td>
                        <td className="mono text-xs text-muted">
                          {new Date(p.created_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════ */}
      {/* TAB: COMPARISON */}
      {/* ════════════════════════════════════════════════════ */}

      {activeTab === 'comparison' && (
        <>
          <SectionHeader title="Comparación de Modelos" icon={GitBranch} count={models.length} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {/* Radar chart */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Performance Radar</span>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={[
                  ...modelComparisonData.filter(d => d.r2 > 0 || d.precision > 0).map(d => ({
                    metric: d.name.slice(0, 12),
                    r2: d.r2 * 100,
                    precision: d.precision * 100,
                    recall: d.recall * 100,
                  })),
                ]}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 8 }} />
                  <Radar name="R²" dataKey="r2" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.15} />
                  <Radar name="Precision" dataKey="precision" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} />
                  <Radar name="Recall" dataKey="recall" stroke="#f97316" fill="#f97316" fillOpacity={0.1} />
                  <Legend wrapperStyle={{ fontSize: '0.7rem' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Training samples bar chart */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Muestras de Entrenamiento</span>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={modelComparisonData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" strokeOpacity={0.3} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }} width={100} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="samples" radius={[0, 4, 4, 0]} name="Muestras">
                    {modelComparisonData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} fillOpacity={0.7} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Full comparison table */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Tabla Comparativa Completa</span>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Modelo</th>
                    <th>Algoritmo</th>
                    <th>Tipo</th>
                    <th>Versión</th>
                    <th>Muestras</th>
                    <th>Métricas Clave</th>
                    <th>Estado</th>
                    <th>En Producción</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map(m => {
                    const pm = MODEL_META[m.name];
                    const metrics = m.metrics || {};
                    const topMetric = Object.entries(metrics).sort(([, a], [, b]) => (b as number) - (a as number))[0];
                    return (
                      <tr key={m.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{
                              width: 8, height: 8, borderRadius: '50%',
                              background: pm?.color || '#3b82f6',
                              boxShadow: `0 0 6px ${pm?.color || '#3b82f6'}40`,
                            }} />
                            <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{pm?.label || m.name}</span>
                          </div>
                        </td>
                        <td className="mono text-sm" style={{ color: pm?.color || '#06b6d4' }}>{m.algorithm}</td>
                        <td className="text-sm">{pm?.category || m.model_type}</td>
                        <td className="mono text-sm">v{m.version}</td>
                        <td className="mono text-sm">{(m.training_samples || 0).toLocaleString()}</td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {Object.entries(metrics).slice(0, 3).map(([k, v]) => (
                              <span key={k} className="mono" style={{
                                fontSize: '0.65rem', padding: '1px 5px', borderRadius: 4,
                                background: `${pm?.color || '#3b82f6'}10`,
                                color: pm?.color || '#3b82f6',
                              }}>
                                {k}={typeof v === 'number' ? v.toFixed(3) : v}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td><StatusDot status={m.status} /></td>
                        <td style={{ textAlign: 'center' }}>
                          {m.is_production
                            ? <CheckCircle2 size={16} color="#22c55e" />
                            : <XCircle size={16} color="rgba(255,255,255,0.2)" />}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
