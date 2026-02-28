// ============================================================
// PetroVision — SPC Dashboard (Control Estadístico de Procesos)
// ============================================================
// Professional SPC module with:
//   - Shewhart X̄ chart with control limits & zone shading
//   - CUSUM cumulative sum chart for small shift detection
//   - EWMA exponentially weighted moving average chart
//   - Process capability indices (Cp, Cpk, Pp, Ppk)
//   - Western Electric Rules violation table
//   - Multi-instrument selector with process filter
// ============================================================

import { useEffect, useState, useCallback } from 'react';
import {
  BarChart3, Activity, Target, AlertTriangle, TrendingUp,
  RefreshCw, Settings2, ChevronDown, ChevronUp, Info,
  CheckCircle2, XCircle, Gauge, Shield, Layers, Eye, Cpu,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, ReferenceArea, AreaChart, Area,
  ScatterChart, Scatter, Cell, Legend,
} from 'recharts';
import { spcAPI } from '@/services/api';

// ── Types ───────────────────────────────────────────────────

interface SPCInstrument {
  tag: string;
  description: string;
  type: string;
  unit: string;
  area?: string;
  sp?: number;
  hi?: number;
  lo?: number;
  hihi?: number;
  lolo?: number;
}

interface ShewhartPoint {
  time: string;
  value: number;
  zone: string;
  ooc: boolean;
}

interface ShewhartLimits {
  cl: number;
  ucl: number;
  lcl: number;
  uwl: number;
  lwl: number;
  sigma: number;
}

interface Capability {
  cp: number | null;
  cpk: number | null;
  pp: number | null;
  ppk: number | null;
  sigma_within: number | null;
  sigma_overall: number | null;
  mean: number | null;
  usl: number | null;
  lsl: number | null;
  n: number | null;
}

interface Violation {
  index: number;
  rule: number;
  desc: string;
  severity: string;
}

interface CUSUMPoint {
  time: string;
  value: number;
  c_plus: number;
  c_minus: number;
  signal: boolean;
}

interface EWMAPoint {
  time: string;
  value: number;
  ewma: number;
  ucl: number;
  lcl: number;
  signal: boolean;
}

// ── Constants ───────────────────────────────────────────────

const TABS = [
  { id: 'shewhart', label: 'Shewhart X\u0304', icon: BarChart3 },
  { id: 'cusum', label: 'CUSUM', icon: TrendingUp },
  { id: 'ewma', label: 'EWMA', icon: Activity },
] as const;

const RANGE_OPTIONS = [
  { value: '-1h', label: '1 hora' },
  { value: '-6h', label: '6 horas' },
  { value: '-12h', label: '12 horas' },
  { value: '-24h', label: '24 horas' },
  { value: '-3d', label: '3 días' },
  { value: '-7d', label: '7 días' },
];

const SEVERITY_COLORS: Record<string, string> = {
  CRITICA: '#ef4444',
  ALTA: '#f97316',
  MEDIA: '#eab308',
  BAJA: '#3b82f6',
};

const CAPABILITY_THRESHOLDS = [
  { min: 1.33, label: 'Excelente', color: '#22c55e' },
  { min: 1.0, label: 'Capaz', color: '#3b82f6' },
  { min: 0.67, label: 'Marginal', color: '#eab308' },
  { min: 0, label: 'Incapaz', color: '#ef4444' },
];

function getCapColor(val: number | null): string {
  if (val === null) return '#64748b';
  for (const t of CAPABILITY_THRESHOLDS) {
    if (val >= t.min) return t.color;
  }
  return '#ef4444';
}

function getCapLabel(val: number | null): string {
  if (val === null) return '—';
  for (const t of CAPABILITY_THRESHOLDS) {
    if (val >= t.min) return t.label;
  }
  return 'Incapaz';
}

function fmt(v: number | null | undefined, decimals = 2): string {
  if (v === null || v === undefined) return '—';
  return v.toFixed(decimals);
}

function fmtTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return iso;
  }
}

// ── Subcomponents ───────────────────────────────────────────

function SectionHeader({ title, icon: Icon, badge }: { title: string; icon: any; badge?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: 'rgba(6,182,212,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={14} color="#06b6d4" />
      </div>
      <h2 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>{title}</h2>
      {badge && (
        <span style={{
          fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4,
          background: 'rgba(6,182,212,0.12)', color: '#06b6d4',
        }}>{badge}</span>
      )}
    </div>
  );
}

function CapabilityGauge({ label, value, subtitle }: { label: string; value: number | null; subtitle?: string }) {
  const pct = value !== null ? Math.min(value / 2, 1) * 100 : 0;
  const color = getCapColor(value);
  return (
    <div style={{
      background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 16,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 120,
    }}>
      <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <div style={{ position: 'relative', width: 80, height: 80 }}>
        <svg viewBox="0 0 80 80" style={{ width: 80, height: 80 }}>
          <circle cx={40} cy={40} r={34} fill="none" stroke="#1e293b" strokeWidth={6} />
          <circle
            cx={40} cy={40} r={34} fill="none"
            stroke={color} strokeWidth={6}
            strokeDasharray={`${pct * 2.136} 213.6`}
            strokeLinecap="round"
            transform="rotate(-90 40 40)"
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span className="mono" style={{ fontSize: '1.1rem', fontWeight: 800, color }}>{fmt(value, 2)}</span>
        </div>
      </div>
      <span style={{ fontSize: '0.65rem', fontWeight: 600, color }}>{getCapLabel(value)}</span>
      {subtitle && <span style={{ fontSize: '0.6rem', color: '#64748b' }}>{subtitle}</span>}
    </div>
  );
}

function StatCard({ label, value, unit, color = '#e2e8f0' }: { label: string; value: string; unit?: string; color?: string }) {
  return (
    <div style={{
      background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '12px 16px',
      flex: '1 1 140px', minWidth: 140,
    }}>
      <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color }}>{value}</span>
        {unit && <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{unit}</span>}
      </div>
    </div>
  );
}

// ── Custom Tooltip ──────────────────────────────────────────

function ShewhartTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px',
      fontSize: '0.75rem',
    }}>
      <div style={{ color: '#94a3b8', marginBottom: 4 }}>{fmtTime(d.time)}</div>
      <div style={{ fontWeight: 700 }}>
        Valor: <span className="mono" style={{ color: d.ooc ? '#ef4444' : '#22c55e' }}>{fmt(d.value, 4)}</span>
      </div>
      <div>Zona: <span style={{ fontWeight: 600, color: d.zone === 'A' ? '#ef4444' : d.zone === 'B' ? '#eab308' : '#22c55e' }}>{d.zone}</span></div>
      {d.ooc && <div style={{ color: '#ef4444', fontWeight: 700, marginTop: 4 }}>FUERA DE CONTROL</div>}
    </div>
  );
}

function CusumTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px',
      fontSize: '0.75rem',
    }}>
      <div style={{ color: '#94a3b8', marginBottom: 4 }}>{fmtTime(d.time)}</div>
      <div>Valor: <span className="mono" style={{ fontWeight: 700 }}>{fmt(d.value, 4)}</span></div>
      <div>C<sup>+</sup>: <span className="mono" style={{ color: '#22c55e' }}>{fmt(d.c_plus, 4)}</span></div>
      <div>C<sup>−</sup>: <span className="mono" style={{ color: '#ef4444' }}>{fmt(d.c_minus, 4)}</span></div>
      {d.signal && <div style={{ color: '#ef4444', fontWeight: 700, marginTop: 4 }}>SEÑAL DETECTADA</div>}
    </div>
  );
}

function EwmaTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px',
      fontSize: '0.75rem',
    }}>
      <div style={{ color: '#94a3b8', marginBottom: 4 }}>{fmtTime(d.time)}</div>
      <div>Valor: <span className="mono" style={{ fontWeight: 700 }}>{fmt(d.value, 4)}</span></div>
      <div>EWMA: <span className="mono" style={{ color: '#a855f7', fontWeight: 700 }}>{fmt(d.ewma, 4)}</span></div>
      <div>UCL: <span className="mono">{fmt(d.ucl, 4)}</span></div>
      <div>LCL: <span className="mono">{fmt(d.lcl, 4)}</span></div>
      {d.signal && <div style={{ color: '#ef4444', fontWeight: 700, marginTop: 4 }}>FUERA DE LÍMITES</div>}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────

export default function SPCDashboard() {
  const [instruments, setInstruments] = useState<SPCInstrument[]>([]);
  const [selectedTag, setSelectedTag] = useState('');
  const [activeTab, setActiveTab] = useState<'shewhart' | 'cusum' | 'ewma'>('shewhart');
  const [timeRange, setTimeRange] = useState('-6h');
  const [loading, setLoading] = useState(false);

  // Shewhart state
  const [shewhartData, setShewhartData] = useState<ShewhartPoint[]>([]);
  const [limits, setLimits] = useState<ShewhartLimits | null>(null);
  const [capability, setCapability] = useState<Capability | null>(null);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [instrumentInfo, setInstrumentInfo] = useState<any>(null);
  const [movingRange, setMovingRange] = useState<any>(null);

  // CUSUM state
  const [cusumData, setCusumData] = useState<CUSUMPoint[]>([]);
  const [cusumParams, setCusumParams] = useState<any>(null);
  const [cusumSignals, setCusumSignals] = useState<any[]>([]);

  // EWMA state
  const [ewmaData, setEwmaData] = useState<EWMAPoint[]>([]);
  const [ewmaParams, setEwmaParams] = useState<any>(null);
  const [ewmaSignals, setEwmaSignals] = useState<any[]>([]);

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [cusumK, setCusumK] = useState(0.5);
  const [cusumH, setCusumH] = useState(5.0);
  const [ewmaLambda, setEwmaLambda] = useState(0.2);
  const [ewmaL, setEwmaL] = useState(3.0);

  // ── Load instruments ──────────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const res = await spcAPI.instruments();
        setInstruments(res.data);
        if (res.data.length > 0) setSelectedTag(res.data[0].tag);
      } catch (err) {
        console.error('Error loading SPC instruments:', err);
      }
    })();
  }, []);

  // ── Fetch chart data ──────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!selectedTag) return;
    setLoading(true);
    try {
      if (activeTab === 'shewhart') {
        const res = await spcAPI.shewhart(selectedTag, timeRange);
        const d = res.data;
        if (d.error) { setShewhartData([]); setLimits(null); setCapability(null); setViolations([]); return; }
        setShewhartData(d.data || []);
        setLimits(d.limits || null);
        setCapability(d.capability || null);
        setViolations(d.violations || []);
        setInstrumentInfo(d.instrument || null);
        setMovingRange(d.moving_range || null);
      } else if (activeTab === 'cusum') {
        const res = await spcAPI.cusum(selectedTag, timeRange, cusumK, cusumH);
        const d = res.data;
        if (d.error) { setCusumData([]); return; }
        setCusumData(d.data || []);
        setCusumParams(d.params || null);
        setCusumSignals(d.signals || []);
      } else if (activeTab === 'ewma') {
        const res = await spcAPI.ewma(selectedTag, timeRange, ewmaLambda, ewmaL);
        const d = res.data;
        if (d.error) { setEwmaData([]); return; }
        setEwmaData(d.data || []);
        setEwmaParams(d.params || null);
        setEwmaSignals(d.signals || []);
      }
    } catch (err) {
      console.error('SPC fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedTag, activeTab, timeRange, cusumK, cusumH, ewmaLambda, ewmaL]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const selInst = instruments.find(i => i.tag === selectedTag);
  const oocCount = shewhartData.filter(p => p.ooc).length;

  // ── Render ────────────────────────────────────────────────

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1440, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <BarChart3 size={20} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>Control Estadístico de Procesos</h1>
          <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
            Análisis SPC en tiempo real — Shewhart, CUSUM, EWMA &amp; Capacidad de proceso
          </p>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          style={{
            background: showSettings ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.05)',
            border: '1px solid #334155', borderRadius: 8, padding: '6px 12px',
            color: '#e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            fontSize: '0.75rem',
          }}
        >
          <Settings2 size={14} /> Parámetros
        </button>
        <button
          onClick={fetchData}
          disabled={loading}
          style={{
            background: 'rgba(6,182,212,0.15)', border: '1px solid #06b6d4', borderRadius: 8,
            padding: '6px 12px', color: '#06b6d4', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem',
          }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Actualizar
        </button>
      </div>

      {/* Controls Row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Instrument Selector */}
        <div style={{ flex: '1 1 280px' }}>
          <label style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 4 }}>
            INSTRUMENTO
          </label>
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            style={{
              width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 8,
              padding: '8px 12px', color: '#e2e8f0', fontSize: '0.8rem',
            }}
          >
            {instruments.map(i => (
              <option key={i.tag} value={i.tag}>{i.tag} — {i.description} [{i.unit}]</option>
            ))}
          </select>
        </div>

        {/* Time Range */}
        <div style={{ flex: '0 0 auto' }}>
          <label style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 4 }}>
            RANGO TEMPORAL
          </label>
          <div style={{ display: 'flex', gap: 4 }}>
            {RANGE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setTimeRange(opt.value)}
                style={{
                  padding: '6px 10px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600,
                  border: timeRange === opt.value ? '1px solid #06b6d4' : '1px solid #334155',
                  background: timeRange === opt.value ? 'rgba(6,182,212,0.15)' : 'transparent',
                  color: timeRange === opt.value ? '#06b6d4' : '#94a3b8', cursor: 'pointer',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div style={{
          background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 16,
          marginBottom: 16, display: 'flex', gap: 24, flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#06b6d4', marginBottom: 8 }}>CUSUM</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                k (slack):
                <input type="number" value={cusumK} step={0.1} min={0.1} max={2}
                  onChange={(e) => setCusumK(+e.target.value)}
                  style={{ width: 60, marginLeft: 6, background: '#1e293b', border: '1px solid #334155', borderRadius: 4, padding: '4px 6px', color: '#e2e8f0', fontSize: '0.75rem' }}
                />
              </label>
              <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                h (interval):
                <input type="number" value={cusumH} step={0.5} min={1} max={10}
                  onChange={(e) => setCusumH(+e.target.value)}
                  style={{ width: 60, marginLeft: 6, background: '#1e293b', border: '1px solid #334155', borderRadius: 4, padding: '4px 6px', color: '#e2e8f0', fontSize: '0.75rem' }}
                />
              </label>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#a855f7', marginBottom: 8 }}>EWMA</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                {'\u03BB'} (suavizado):
                <input type="number" value={ewmaLambda} step={0.05} min={0.05} max={1}
                  onChange={(e) => setEwmaLambda(+e.target.value)}
                  style={{ width: 60, marginLeft: 6, background: '#1e293b', border: '1px solid #334155', borderRadius: 4, padding: '4px 6px', color: '#e2e8f0', fontSize: '0.75rem' }}
                />
              </label>
              <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                L (ancho):
                <input type="number" value={ewmaL} step={0.5} min={1} max={5}
                  onChange={(e) => setEwmaL(+e.target.value)}
                  style={{ width: 60, marginLeft: 6, background: '#1e293b', border: '1px solid #334155', borderRadius: 4, padding: '4px 6px', color: '#e2e8f0', fontSize: '0.75rem' }}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #1e293b', paddingBottom: 0 }}>
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '10px 20px', borderRadius: '8px 8px 0 0', fontSize: '0.8rem', fontWeight: 600,
                border: 'none', borderBottom: active ? '2px solid #06b6d4' : '2px solid transparent',
                background: active ? 'rgba(6,182,212,0.08)' : 'transparent',
                color: active ? '#06b6d4' : '#64748b', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
              }}
            >
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
          <RefreshCw size={24} className="spin" style={{ marginBottom: 8 }} />
          <div>Calculando análisis SPC...</div>
        </div>
      )}

      {/* ── SHEWHART TAB ─────────────────────────────────── */}
      {activeTab === 'shewhart' && !loading && (
        <div>
          {/* Instrument Info + Stats */}
          {instrumentInfo && limits && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <StatCard label="Media (X\u0304)" value={fmt(limits.cl, 4)} unit={instrumentInfo.unit} color="#06b6d4" />
              <StatCard label="Sigma (\u03C3)" value={fmt(limits.sigma, 4)} unit={instrumentInfo.unit} color="#a855f7" />
              <StatCard label="UCL (+3\u03C3)" value={fmt(limits.ucl, 4)} color="#ef4444" />
              <StatCard label="LCL (-3\u03C3)" value={fmt(limits.lcl, 4)} color="#ef4444" />
              <StatCard label="Muestras" value={String(shewhartData.length)} color="#22c55e" />
              <StatCard
                label="Fuera de Control"
                value={String(oocCount)}
                color={oocCount > 0 ? '#ef4444' : '#22c55e'}
              />
            </div>
          )}

          {/* Shewhart Chart */}
          {shewhartData.length > 0 && limits && (
            <div style={{
              background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12,
              padding: 20, marginBottom: 20,
            }}>
              <SectionHeader title="Carta de Control Shewhart X\u0304" icon={BarChart3} badge={`n=${shewhartData.length}`} />
              <ResponsiveContainer width="100%" height={380}>
                <LineChart data={shewhartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />

                  {/* Zone shading */}
                  <ReferenceArea y1={limits.lwl} y2={limits.uwl} fill="#22c55e" fillOpacity={0.04} />
                  <ReferenceArea y1={limits.uwl} y2={limits.ucl} fill="#eab308" fillOpacity={0.04} />
                  <ReferenceArea y1={limits.lcl} y2={limits.lwl} fill="#eab308" fillOpacity={0.04} />

                  {/* Control lines */}
                  <ReferenceLine y={limits.cl} stroke="#06b6d4" strokeWidth={2} strokeDasharray="8 4" label={{ value: 'CL', position: 'right', fill: '#06b6d4', fontSize: 11 }} />
                  <ReferenceLine y={limits.ucl} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="6 3" label={{ value: 'UCL', position: 'right', fill: '#ef4444', fontSize: 11 }} />
                  <ReferenceLine y={limits.lcl} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="6 3" label={{ value: 'LCL', position: 'right', fill: '#ef4444', fontSize: 11 }} />
                  <ReferenceLine y={limits.uwl} stroke="#eab308" strokeWidth={1} strokeDasharray="4 4" />
                  <ReferenceLine y={limits.lwl} stroke="#eab308" strokeWidth={1} strokeDasharray="4 4" />

                  {/* ISA limits if available */}
                  {instrumentInfo?.sp && (
                    <ReferenceLine y={instrumentInfo.sp} stroke="#22c55e" strokeWidth={1} strokeDasharray="3 6" label={{ value: 'SP', position: 'left', fill: '#22c55e', fontSize: 10 }} />
                  )}

                  <XAxis dataKey="time" tickFormatter={fmtTime} stroke="#475569" fontSize={10} interval="preserveStartEnd" />
                  <YAxis stroke="#475569" fontSize={10} domain={['auto', 'auto']} />
                  <Tooltip content={<ShewhartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#06b6d4"
                    strokeWidth={1.5}
                    dot={(props: any) => {
                      const { cx, cy, payload } = props;
                      if (payload.ooc) {
                        return <circle key={`dot-${props.index}`} cx={cx} cy={cy} r={5} fill="#ef4444" stroke="#fff" strokeWidth={1.5} />;
                      }
                      return <circle key={`dot-${props.index}`} cx={cx} cy={cy} r={2} fill="#06b6d4" />;
                    }}
                    activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Capability Indices */}
          {capability && capability.cp !== null && (
            <div style={{
              background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12,
              padding: 20, marginBottom: 20,
            }}>
              <SectionHeader title="Índices de Capacidad de Proceso" icon={Target} />
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16 }}>
                <CapabilityGauge label="Cp" value={capability.cp} subtitle="Potencial" />
                <CapabilityGauge label="Cpk" value={capability.cpk} subtitle="Rendimiento real" />
                <CapabilityGauge label="Pp" value={capability.pp} subtitle="Global potencial" />
                <CapabilityGauge label="Ppk" value={capability.ppk} subtitle="Global real" />
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                <StatCard label="\u03C3 Within" value={fmt(capability.sigma_within, 4)} color="#a855f7" />
                <StatCard label="\u03C3 Overall" value={fmt(capability.sigma_overall, 4)} color="#3b82f6" />
                <StatCard label="Media" value={fmt(capability.mean, 4)} color="#06b6d4" />
                <StatCard label="USL" value={fmt(capability.usl, 2)} color="#ef4444" />
                <StatCard label="LSL" value={fmt(capability.lsl, 2)} color="#ef4444" />
                <StatCard label="n" value={String(capability.n || 0)} color="#22c55e" />
              </div>

              {/* Capability interpretation */}
              <div style={{
                marginTop: 16, padding: '12px 16px', borderRadius: 8,
                background: `${getCapColor(capability.cpk)}10`,
                border: `1px solid ${getCapColor(capability.cpk)}30`,
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: getCapColor(capability.cpk), marginBottom: 4 }}>
                  <Info size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  Interpretación
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', lineHeight: 1.5 }}>
                  {capability.cpk !== null && capability.cpk >= 1.33
                    ? 'El proceso es capaz y está centrado. Producción dentro de especificación con margen de seguridad adecuado.'
                    : capability.cpk !== null && capability.cpk >= 1.0
                    ? 'El proceso es capaz pero con margen reducido. Se recomienda monitorear la tendencia de centrado.'
                    : capability.cpk !== null && capability.cpk >= 0.67
                    ? 'El proceso tiene capacidad marginal. Se requiere acción correctiva para reducir variabilidad o mejorar centrado.'
                    : 'El proceso no es capaz. Se producen defectos fuera de especificación. Acción inmediata requerida.'}
                </div>
              </div>
            </div>
          )}

          {/* Western Electric Violations */}
          {violations.length > 0 && (
            <div style={{
              background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12,
              padding: 20, marginBottom: 20,
            }}>
              <SectionHeader title="Violaciones de Reglas Western Electric" icon={AlertTriangle} badge={`${violations.length}`} />
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1e293b' }}>
                      {['#', 'Muestra', 'Regla', 'Descripción', 'Severidad'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {violations.slice(0, 50).map((v, i) => (
                      <tr key={`${v.index}-${v.rule}-${i}`} style={{ borderBottom: '1px solid #1e293b08' }}>
                        <td style={{ padding: '6px 12px' }}>{i + 1}</td>
                        <td style={{ padding: '6px 12px' }} className="mono">{v.index}</td>
                        <td style={{ padding: '6px 12px', fontWeight: 700 }}>Regla {v.rule}</td>
                        <td style={{ padding: '6px 12px' }}>{v.desc}</td>
                        <td style={{ padding: '6px 12px' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: '0.65rem',
                            background: `${SEVERITY_COLORS[v.severity] || '#64748b'}20`,
                            color: SEVERITY_COLORS[v.severity] || '#64748b',
                          }}>
                            {v.severity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {shewhartData.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: 60, color: '#475569' }}>
              <BarChart3 size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
              <div style={{ fontWeight: 600 }}>Sin datos suficientes</div>
              <div style={{ fontSize: '0.75rem', marginTop: 4 }}>Seleccione un instrumento y rango temporal con datos disponibles</div>
            </div>
          )}
        </div>
      )}

      {/* ── CUSUM TAB ────────────────────────────────────── */}
      {activeTab === 'cusum' && !loading && (
        <div>
          {cusumParams && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <StatCard label="Media (\u03BC\u2080)" value={fmt(cusumParams.mean, 4)} color="#06b6d4" />
              <StatCard label="Sigma (\u03C3)" value={fmt(cusumParams.sigma, 4)} color="#a855f7" />
              <StatCard label="K (absoluto)" value={fmt(cusumParams.K_abs, 4)} color="#eab308" />
              <StatCard label="H (decisión)" value={fmt(cusumParams.H_abs, 4)} color="#ef4444" />
              <StatCard label="Señales" value={String(cusumSignals.length)} color={cusumSignals.length > 0 ? '#ef4444' : '#22c55e'} />
            </div>
          )}

          {cusumData.length > 0 && cusumParams && (
            <div style={{
              background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12,
              padding: 20, marginBottom: 20,
            }}>
              <SectionHeader title="Carta CUSUM (Suma Acumulativa)" icon={TrendingUp} badge={`n=${cusumData.length}`} />
              <ResponsiveContainer width="100%" height={380}>
                <LineChart data={cusumData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <ReferenceLine y={cusumParams.H_abs} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="6 3" label={{ value: '+H', position: 'right', fill: '#ef4444', fontSize: 11 }} />
                  <ReferenceLine y={-cusumParams.H_abs} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="6 3" label={{ value: '-H', position: 'right', fill: '#ef4444', fontSize: 11 }} />
                  <ReferenceLine y={0} stroke="#475569" strokeWidth={0.5} />
                  <XAxis dataKey="time" tickFormatter={fmtTime} stroke="#475569" fontSize={10} interval="preserveStartEnd" />
                  <YAxis stroke="#475569" fontSize={10} />
                  <Tooltip content={<CusumTooltip />} />
                  <Line type="monotone" dataKey="c_plus" stroke="#22c55e" strokeWidth={2} dot={false} name="C+" />
                  <Line type="monotone" dataKey="c_minus" stroke="#f97316" strokeWidth={2} dot={false} name="C-" />
                  <Legend
                    wrapperStyle={{ fontSize: '0.7rem' }}
                    formatter={(value: string) => <span style={{ color: '#94a3b8' }}>{value}</span>}
                  />
                </LineChart>
              </ResponsiveContainer>

              {/* Description */}
              <div style={{
                marginTop: 12, padding: '10px 14px', borderRadius: 8,
                background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.15)',
                fontSize: '0.7rem', color: '#94a3b8', lineHeight: 1.5,
              }}>
                <Info size={12} style={{ marginRight: 6, verticalAlign: 'middle', color: '#06b6d4' }} />
                <strong>CUSUM</strong> detecta desviaciones pequeñas y sostenidas de la media del proceso.
                C<sup>+</sup> acumula desviaciones positivas, C<sup>-</sup> acumula negativas.
                Cuando alguna supera el umbral H={fmt(cusumParams.H_abs, 2)}, se declara una señal de cambio en la media.
              </div>
            </div>
          )}

          {/* Signals table */}
          {cusumSignals.length > 0 && (
            <div style={{
              background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12,
              padding: 20,
            }}>
              <SectionHeader title="Señales CUSUM Detectadas" icon={AlertTriangle} badge={`${cusumSignals.length}`} />
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1e293b' }}>
                    {['#', 'Muestra', 'Hora', 'Tipo', 'Descripción'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cusumSignals.slice(0, 50).map((s: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1e293b08' }}>
                      <td style={{ padding: '6px 12px' }}>{i + 1}</td>
                      <td style={{ padding: '6px 12px' }} className="mono">{s.index}</td>
                      <td style={{ padding: '6px 12px' }}>{fmtTime(s.time)}</td>
                      <td style={{ padding: '6px 12px' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: '0.65rem',
                          background: s.type === 'upper' ? 'rgba(239,68,68,0.15)' : 'rgba(249,115,22,0.15)',
                          color: s.type === 'upper' ? '#ef4444' : '#f97316',
                        }}>
                          {s.type === 'upper' ? 'SUPERIOR' : 'INFERIOR'}
                        </span>
                      </td>
                      <td style={{ padding: '6px 12px', color: '#94a3b8' }}>{s.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {cusumData.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: 60, color: '#475569' }}>
              <TrendingUp size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
              <div style={{ fontWeight: 600 }}>Sin datos suficientes para CUSUM</div>
              <div style={{ fontSize: '0.75rem', marginTop: 4 }}>Se requieren al menos 10 puntos de datos</div>
            </div>
          )}
        </div>
      )}

      {/* ── EWMA TAB ─────────────────────────────────────── */}
      {activeTab === 'ewma' && !loading && (
        <div>
          {ewmaParams && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <StatCard label="Media (\u03BC\u2080)" value={fmt(ewmaParams.mean, 4)} color="#06b6d4" />
              <StatCard label="Sigma (\u03C3)" value={fmt(ewmaParams.sigma, 4)} color="#a855f7" />
              <StatCard label={'\u03BB (suavizado)'} value={fmt(ewmaParams.lambda, 2)} color="#eab308" />
              <StatCard label="L (ancho)" value={fmt(ewmaParams.L, 1)} color="#3b82f6" />
              <StatCard label="Señales" value={String(ewmaSignals.length)} color={ewmaSignals.length > 0 ? '#ef4444' : '#22c55e'} />
            </div>
          )}

          {ewmaData.length > 0 && ewmaParams && (
            <div style={{
              background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12,
              padding: 20, marginBottom: 20,
            }}>
              <SectionHeader title="Carta EWMA (Media Móvil Ponderada Exponencialmente)" icon={Activity} badge={`n=${ewmaData.length}`} />
              <ResponsiveContainer width="100%" height={380}>
                <LineChart data={ewmaData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <ReferenceLine y={ewmaParams.mean} stroke="#06b6d4" strokeWidth={1.5} strokeDasharray="8 4" label={{ value: 'CL', position: 'right', fill: '#06b6d4', fontSize: 11 }} />
                  <XAxis dataKey="time" tickFormatter={fmtTime} stroke="#475569" fontSize={10} interval="preserveStartEnd" />
                  <YAxis stroke="#475569" fontSize={10} domain={['auto', 'auto']} />
                  <Tooltip content={<EwmaTooltip />} />
                  <Line type="monotone" dataKey="ucl" stroke="#ef4444" strokeWidth={1} strokeDasharray="4 3" dot={false} name="UCL" />
                  <Line type="monotone" dataKey="lcl" stroke="#ef4444" strokeWidth={1} strokeDasharray="4 3" dot={false} name="LCL" />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#475569"
                    strokeWidth={1}
                    dot={{ r: 1.5, fill: '#475569' }}
                    name="Valor"
                  />
                  <Line
                    type="monotone"
                    dataKey="ewma"
                    stroke="#a855f7"
                    strokeWidth={2.5}
                    dot={(props: any) => {
                      const { cx, cy, payload } = props;
                      if (payload.signal) {
                        return <circle key={`ewma-dot-${props.index}`} cx={cx} cy={cy} r={5} fill="#ef4444" stroke="#fff" strokeWidth={1.5} />;
                      }
                      return <circle key={`ewma-dot-${props.index}`} cx={cx} cy={cy} r={0} />;
                    }}
                    name="EWMA"
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '0.7rem' }}
                    formatter={(value: string) => <span style={{ color: '#94a3b8' }}>{value}</span>}
                  />
                </LineChart>
              </ResponsiveContainer>

              {/* Description */}
              <div style={{
                marginTop: 12, padding: '10px 14px', borderRadius: 8,
                background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.15)',
                fontSize: '0.7rem', color: '#94a3b8', lineHeight: 1.5,
              }}>
                <Info size={12} style={{ marginRight: 6, verticalAlign: 'middle', color: '#a855f7' }} />
                <strong>EWMA</strong> con {'\u03BB'}={fmt(ewmaParams.lambda, 2)} suaviza las observaciones dando más peso a datos recientes.
                Los límites de control varían dinámicamente y se estabilizan a medida que se acumulan observaciones.
                Ideal para detectar desplazamientos pequeños (0.5-2.0{'\u03C3'}) en la media del proceso.
              </div>
            </div>
          )}

          {/* Signals table */}
          {ewmaSignals.length > 0 && (
            <div style={{
              background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12,
              padding: 20,
            }}>
              <SectionHeader title="Señales EWMA Detectadas" icon={AlertTriangle} badge={`${ewmaSignals.length}`} />
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1e293b' }}>
                    {['#', 'Muestra', 'Hora', 'EWMA'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ewmaSignals.slice(0, 50).map((s: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1e293b08' }}>
                      <td style={{ padding: '6px 12px' }}>{i + 1}</td>
                      <td style={{ padding: '6px 12px' }} className="mono">{s.index}</td>
                      <td style={{ padding: '6px 12px' }}>{fmtTime(s.time)}</td>
                      <td className="mono" style={{ padding: '6px 12px', color: '#ef4444', fontWeight: 700 }}>{fmt(s.ewma, 4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {ewmaData.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: 60, color: '#475569' }}>
              <Activity size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
              <div style={{ fontWeight: 600 }}>Sin datos suficientes para EWMA</div>
              <div style={{ fontSize: '0.75rem', marginTop: 4 }}>Se requieren al menos 10 puntos de datos</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
