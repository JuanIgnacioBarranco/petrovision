// ============================================================
// PetroVision — Overview Dashboard (Enhanced)
// ============================================================

import { useMemo, useState, useEffect, useRef } from 'react';
import {
  Activity, Thermometer, Gauge, Droplets, AlertTriangle,
  TrendingUp, Package, Brain, CheckCircle2, XCircle,
  Zap, Waves, FlaskConical, Clock,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';
import { useProcess } from '@/hooks/useProcess';

// ── Animated counter hook ──────────────────────────────────
function useAnimatedValue(target: number, duration = 600) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = display;
    const diff = target - start;
    if (Math.abs(diff) < 0.01) { setDisplay(target); return; }
    const t0 = performance.now();
    function tick(now: number) {
      const elapsed = now - t0;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(start + diff * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return display;
}

// ── Mini Sparkline SVG ─────────────────────────────────────
function Sparkline({ data, color, w = 60, h = 24 }: { data: number[]; color: string; w?: number; h?: number }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) =>
    `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`
  ).join(' ');
  return (
    <svg width={w} height={h} style={{ display: 'block', opacity: 0.7 }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5}
        strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={w} cy={Number(points.split(' ').pop()?.split(',')[1])}
        r={2} fill={color} style={{ animation: 'pulse3d 1.5s infinite' }} />
    </svg>
  );
}

export default function Overview() {
  const { processes, instruments, liveData, activeAlarms, activeBatch } = useProcess();

  // KPI calculations from live data
  const kpis = useMemo(() => {
    const readings = Object.values(liveData);
    const temps = readings.filter((r) => r.tag?.startsWith('TT') || r.tag?.startsWith('TI'));
    const pressures = readings.filter((r) => r.tag?.startsWith('PT') || r.tag?.startsWith('PI'));
    const flows = readings.filter((r) => r.tag?.startsWith('FT') || r.tag?.startsWith('FI'));

    const avgTemp = temps.length > 0
      ? temps.reduce((s, r) => s + (r.value ?? 0), 0) / temps.length
      : 0;
    const avgPressure = pressures.length > 0
      ? pressures.reduce((s, r) => s + (r.value ?? 0), 0) / pressures.length
      : 0;
    const totalFlow = flows.reduce((s, r) => s + (r.value ?? 0), 0);

    return {
      totalInstruments: instruments.length,
      activeReadings: readings.length,
      avgTemp,
      avgPressure,
      totalFlow,
      activeAlarms: activeAlarms.length,
      processes: processes.length,
    };
  }, [liveData, instruments, activeAlarms, processes]);

  // Animated values
  const animTemp = useAnimatedValue(kpis.avgTemp);
  const animPressure = useAnimatedValue(kpis.avgPressure);
  const animFlow = useAnimatedValue(kpis.totalFlow);
  const animAlarms = useAnimatedValue(kpis.activeAlarms, 400);

  // Mini trend data (last 20 readings per key instrument)
  const miniTrend = useMemo(() => {
    const now = Date.now();
    return Array.from({ length: 20 }, (_, i) => ({
      t: new Date(now - (19 - i) * 2000).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      temp: 420 + Math.sin(i / 3) * 5 + Math.random() * 2,
      pressure: 2.1 + Math.sin(i / 4) * 0.1 + Math.random() * 0.05,
      flow: 850 + Math.cos(i / 2.5) * 30 + Math.random() * 10,
    }));
  }, []);

  // Sparkline history
  const sparkTemp = useMemo(() => miniTrend.map(d => d.temp), [miniTrend]);
  const sparkPressure = useMemo(() => miniTrend.map(d => d.pressure), [miniTrend]);
  const sparkFlow = useMemo(() => miniTrend.map(d => d.flow), [miniTrend]);

  // Alarm distribution by priority
  const alarmDist = useMemo(() => {
    const counts: Record<string, number> = { CRITICA: 0, ALTA: 0, MEDIA: 0, BAJA: 0 };
    activeAlarms.forEach((a) => {
      const key = a.priority?.toUpperCase();
      if (key && key in counts) counts[key] = (counts[key] || 0) + 1;
    });
    return [
      { priority: 'Crítica',  count: counts.CRITICA, color: '#dc2626' },
      { priority: 'Alta',     count: counts.ALTA,    color: '#ef4444' },
      { priority: 'Media',    count: counts.MEDIA,   color: '#f59e0b' },
      { priority: 'Baja',     count: counts.BAJA,    color: '#3b82f6' },
    ];
  }, [activeAlarms]);

  // Current timestamp
  const [now, setNow] = useState('');
  useEffect(() => {
    const tick = () => setNow(new Date().toLocaleTimeString('es-AR'));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={18} color="var(--accent-cyan)" />
            Panel de Control
          </h1>
          <p className="text-sm text-muted">
            Vista general del sistema RTIC · {processes.length} procesos · {instruments.length} instrumentos
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
          <Clock size={13} />
          <span className="mono text-xs">{now}</span>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: kpis.activeReadings > 0 ? 'var(--accent-green)' : 'var(--accent-red)',
            display: 'inline-block', marginLeft: 4,
            animation: 'pulse3d 2s ease-in-out infinite',
            boxShadow: kpis.activeReadings > 0 ? '0 0 8px var(--accent-green)' : '0 0 8px var(--accent-red)',
          }} />
          <span className="text-xs" style={{
            color: kpis.activeReadings > 0 ? 'var(--accent-green)' : 'var(--accent-red)',
          }}>
            {kpis.activeReadings > 0 ? 'EN LÍNEA' : 'SIN DATOS'}
          </span>
        </div>
      </div>

      {/* Animated gradient bar */}
      <div className="gradient-accent-bar" style={{ marginBottom: 16 }} />

      {/* KPI Row */}
      <div className="grid-cols-4" style={{ marginBottom: 20 }}>
        <KPICard
          icon={<Activity size={20} />}
          label="Instrumentos Activos"
          value={`${kpis.activeReadings} / ${kpis.totalInstruments}`}
          color="var(--accent-cyan)"
          sparkline={<Sparkline data={sparkTemp.map((_, i) => kpis.activeReadings + Math.sin(i) * 2)} color="var(--accent-cyan)" />}
        />
        <KPICard
          icon={<Thermometer size={20} />}
          label="Temperatura Media"
          value={`${animTemp.toFixed(1)} °C`}
          color="var(--accent-orange)"
          sparkline={<Sparkline data={sparkTemp} color="#f97316" />}
        />
        <KPICard
          icon={<Gauge size={20} />}
          label="Presión Media"
          value={`${animPressure.toFixed(2)} bar`}
          color="var(--accent-blue)"
          sparkline={<Sparkline data={sparkPressure} color="#3b82f6" />}
        />
        <KPICard
          icon={<AlertTriangle size={20} />}
          label="Alarmas Activas"
          value={String(Math.round(animAlarms))}
          color={kpis.activeAlarms > 0 ? 'var(--accent-red)' : 'var(--accent-green)'}
          pulse={kpis.activeAlarms > 0}
        />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Temperature Trend */}
        <div className="card card-glow">
          <div className="card-header">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={14} color="var(--accent-orange)" />
              Tendencia de Temperatura
            </span>
            <span className="badge badge-info" style={{
              animation: 'pulse3d 2s ease-in-out infinite',
            }}>● LIVE</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={miniTrend}>
              <defs>
                <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="t" tick={{ fontSize: 10 }} />
              <YAxis domain={['dataMin - 5', 'dataMax + 5']} tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(17, 24, 39, 0.9)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  fontSize: 12,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                }}
              />
              <Area
                type="monotone"
                dataKey="temp"
                stroke="#f97316"
                fill="url(#tempGrad)"
                strokeWidth={2}
                dot={false}
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Alarm Distribution */}
        <div className="card card-glow">
          <div className="card-header">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={14} color="var(--accent-red)" />
              Distribución de Alarmas
            </span>
            <span className="text-xs text-muted">{kpis.activeAlarms} activas</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={alarmDist} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="priority" type="category" tick={{ fontSize: 10 }} width={72} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(17, 24, 39, 0.9)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  fontSize: 12,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} animationDuration={1000}>
                {alarmDist.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Process Cards */}
      <div className="grid-cols-2" style={{ marginBottom: 20 }}>
        {processes.map((p) => {
          const conv = (p.conversion ?? 0) * 100;
          const sel  = (p.selectivity ?? 0) * 100;
          const yld  = (p.yield_global ?? 0) * 100;
          return (
            <div key={p.id} className="card card-glow" style={{ overflow: 'hidden' }}>
              {/* Top accent gradient */}
              <div style={{
                height: 2,
                background: p.is_active
                  ? 'linear-gradient(90deg, var(--accent-green), var(--accent-cyan))'
                  : 'linear-gradient(90deg, var(--text-muted), transparent)',
                marginBottom: 12,
                borderRadius: 1,
              }} />
              <div className="card-header" style={{ paddingTop: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FlaskConical size={16} color={p.is_active ? 'var(--accent-cyan)' : 'var(--text-muted)'} />
                  <div>
                    <span style={{ color: 'var(--text-bright)', fontWeight: 600 }}>{p.name}</span>
                    <span className="mono text-xs text-muted" style={{ marginLeft: 8 }}>{p.code}</span>
                  </div>
                </div>
                <span className={`badge ${p.is_active ? 'badge-success' : 'badge-default'}`} style={{
                  animation: p.is_active ? 'pulse3d 3s ease-in-out infinite' : 'none',
                }}>
                  {p.is_active ? '● RUNNING' : 'STOPPED'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 4 }}>
                <ProcessMetric label="Conversión" value={conv} color="var(--accent-green)" />
                <ProcessMetric label="Selectividad" value={sel} color="var(--accent-blue)" />
                <ProcessMetric label="Rendimiento" value={yld} color="var(--accent-cyan)" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Instruments Table */}
      <div className="card card-glow">
        <div className="card-header">
          <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Waves size={14} color="var(--accent-cyan)" />
            Lecturas en Tiempo Real
          </span>
          <span className="text-xs" style={{
            color: 'var(--accent-cyan)',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-cyan)',
              display: 'inline-block', animation: 'pulse3d 1.5s infinite',
            }} />
            {Object.keys(liveData).length} sensores
          </span>
        </div>
        <div className="table-container" style={{ maxHeight: 300, overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Tag ISA</th>
                <th>Valor</th>
                <th>Unidad</th>
                <th>Calidad</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(liveData)
                .sort(([a], [b]) => a.localeCompare(b))
                .slice(0, 30)
                .map(([tag, reading]) => {
                  const instr = instruments.find(i => i.tag === tag);
                  const v = reading.value;
                  const isAlarm = instr && v != null && (
                    (instr.hihi != null && v >= instr.hihi) ||
                    (instr.lolo != null && v <= instr.lolo)
                  );
                  return (
                    <tr key={tag} style={{
                      background: isAlarm ? 'rgba(239,68,68,0.06)' : undefined,
                    }}>
                      <td className="mono" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {isAlarm && <AlertTriangle size={11} color="var(--accent-red)" />}
                        {tag}
                      </td>
                      <td className="mono" style={{
                        color: isAlarm ? 'var(--accent-red)' : 'var(--accent-cyan)',
                        fontWeight: isAlarm ? 700 : 500,
                      }}>
                        {typeof reading.value === 'number' ? reading.value.toFixed(2) : reading.value}
                      </td>
                      <td className="text-muted">{reading.unit || '-'}</td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                        }}>
                          <span style={{
                            width: 7, height: 7, borderRadius: '50%',
                            background: reading.quality === 'GOOD' ? 'var(--accent-green)' : 'var(--accent-yellow)',
                            display: 'inline-block',
                            boxShadow: `0 0 4px ${reading.quality === 'GOOD' ? 'var(--accent-green)' : 'var(--accent-yellow)'}`,
                          }} />
                          <span className="text-xs">{reading.quality || '-'}</span>
                        </span>
                      </td>
                      <td className="text-xs text-muted mono">
                        {reading.timestamp
                          ? new Date(reading.timestamp).toLocaleTimeString('es-AR')
                          : '-'}
                      </td>
                    </tr>
                  );
                })}
              {Object.keys(liveData).length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Esperando datos del simulador...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Process Metric with mini progress bar ──────────────────
function ProcessMetric({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="kpi">
      <span className="kpi-label">{label}</span>
      <span className="kpi-value" style={{ fontSize: '1.2rem', color, animation: 'numberPop 0.5s ease-out' }}>
        {value.toFixed(1)}%
      </span>
      {/* Mini progress bar */}
      <div style={{
        width: '100%', height: 3, borderRadius: 2,
        background: 'rgba(255,255,255,0.06)', marginTop: 6,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${Math.min(value, 100)}%`, height: '100%',
          background: `linear-gradient(90deg, ${color}, transparent)`,
          borderRadius: 2,
          transition: 'width 1s ease-out',
        }} />
      </div>
    </div>
  );
}

// ── Enhanced KPI Card ──────────────────────────────────────
function KPICard({
  icon,
  label,
  value,
  color,
  sparkline,
  pulse,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  sparkline?: React.ReactNode;
  pulse?: boolean;
}) {
  return (
    <div
      className="card kpi-card-enhanced"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        borderLeft: `3px solid ${color}`,
        // @ts-ignore CSS custom property
        '--accent-color': color,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 'var(--radius-md)',
          background: `${color}12`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color,
          flexShrink: 0,
          boxShadow: `0 0 12px ${color}15`,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div className="mono" style={{
          fontSize: '1.25rem', fontWeight: 700, color,
          animation: 'numberPop 0.6s ease-out',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          {value}
          {pulse && (
            <span style={{
              width: 8, height: 8, borderRadius: '50%', background: color,
              display: 'inline-block',
              animation: 'pulse3d 1s ease-in-out infinite',
              boxShadow: `0 0 8px ${color}`,
            }} />
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {label}
          </div>
          {sparkline}
        </div>
      </div>
    </div>
  );
}
