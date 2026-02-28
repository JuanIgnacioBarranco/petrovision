// ============================================================
// PetroVision — Report Center (Reportes Avanzados y Exportación)
// ============================================================
// Professional reporting module with:
//   - Report type selector (shift/daily/weekly/monthly)
//   - KPI summary cards
//   - Batch detail table
//   - Alarm statistics with priority breakdown
//   - Report history browser
//   - Excel export download
// ============================================================

import { useEffect, useState, useCallback } from 'react';
import {
  FileText, Download, RefreshCw, Calendar, Package, Bell,
  TrendingUp, DollarSign, Activity, Target, CheckCircle2,
  Clock, AlertTriangle, BarChart3, Eye, ChevronDown, ChevronUp,
  Layers, Shield, Info, FlaskConical,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { reportsAPI } from '@/services/api';

// ── Types ───────────────────────────────────────────────────

interface ReportKPIs {
  total_batches: number;
  completed_batches: number;
  planned_batches: number;
  in_progress_batches: number;
  total_production_kg: number;
  total_feed_kg: number;
  avg_yield: number | null;
  avg_purity: number | null;
  total_cost: number;
  total_revenue: number;
  margin: number;
  margin_pct: number | null;
  avg_temperature: number | null;
  avg_pressure: number | null;
  quality_breakdown: Record<string, number>;
  oee: number | null;
  operating_hours: number;
}

interface AlarmStats {
  total: number;
  by_priority: Record<string, number>;
  by_type: Record<string, number>;
  top_instruments: Array<{ tag: string; count: number }>;
  avg_response_time_s: number | null;
  acknowledged_pct: number | null;
  critical: number;
  high: number;
}

interface BatchDetail {
  batch_number: string;
  status: string;
  actual_start: string | null;
  actual_end: string | null;
  feed_kg: number | null;
  product_kg: number | null;
  yield: number | null;
  purity: number | null;
  quality_grade: string | null;
  avg_temp: number | null;
  avg_press: number | null;
  cost: number | null;
  revenue: number | null;
}

interface Report {
  report_id?: number;
  report_type: string;
  period: { start: string; end: string };
  kpis: ReportKPIs;
  alarms: AlarmStats;
  batches: BatchDetail[];
  generated_at: string | null;
  generated_by?: string;
}

interface ReportHistoryItem {
  id: number;
  report_type: string;
  period_start: string | null;
  period_end: string | null;
  total_production_kg: number;
  avg_yield: number | null;
  avg_purity: number | null;
  oee: number | null;
  total_alarms: number;
  critical_alarms: number;
  generated_at: string | null;
}

// ── Constants ───────────────────────────────────────────────

const REPORT_TYPES = [
  { value: 'shift', label: 'Turno (8h)', icon: Clock },
  { value: 'daily', label: 'Diario (24h)', icon: Calendar },
  { value: 'weekly', label: 'Semanal (7d)', icon: Calendar },
  { value: 'monthly', label: 'Mensual (30d)', icon: Calendar },
];

const QUALITY_COLORS: Record<string, string> = {
  A: '#22c55e',
  B: '#3b82f6',
  C: '#eab308',
  'N/A': '#64748b',
};

const PRIORITY_COLORS: Record<string, string> = {
  CRITICA: '#ef4444',
  ALTA: '#f97316',
  MEDIA: '#eab308',
  BAJA: '#3b82f6',
};

const STATUS_COLORS: Record<string, string> = {
  PLANNED: '#64748b',
  IN_PROGRESS: '#3b82f6',
  COMPLETED: '#22c55e',
  APPROVED: '#06b6d4',
  REJECTED: '#ef4444',
};

function fmt(v: number | null | undefined, decimals = 2): string {
  if (v === null || v === undefined) return '\u2014';
  return v.toFixed(decimals);
}

function fmtDate(iso: string | null): string {
  if (!iso) return '\u2014';
  try {
    return new Date(iso).toLocaleString('es-AR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function fmtCurrency(v: number | null): string {
  if (v === null || v === undefined) return '\u2014';
  return '$' + v.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
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

function KPICard({ label, value, unit, icon: Icon, color = '#e2e8f0', subtext }: {
  label: string; value: string; unit?: string; icon: any; color?: string; subtext?: string;
}) {
  return (
    <div style={{
      background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12,
      padding: '16px 20px', flex: '1 1 200px', minWidth: 180,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: `${color}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={16} color={color} />
        </div>
        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span className="mono" style={{ fontSize: '1.5rem', fontWeight: 800, color }}>{value}</span>
        {unit && <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{unit}</span>}
      </div>
      {subtext && <div style={{ fontSize: '0.65rem', color: '#475569', marginTop: 4 }}>{subtext}</div>}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────

export default function ReportCenter() {
  const [reportType, setReportType] = useState('daily');
  const [periodsBack, setPeriodsBack] = useState(1);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [history, setHistory] = useState<ReportHistoryItem[]>([]);
  const [activeView, setActiveView] = useState<'generate' | 'history'>('generate');
  const [expandedBatches, setExpandedBatches] = useState(false);

  // ── Load history on mount ─────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const res = await reportsAPI.history(1);
        setHistory(res.data);
      } catch (err) {
        console.error('Error loading report history:', err);
      }
    })();
  }, []);

  // ── Generate report ───────────────────────────────────────

  const generateReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportsAPI.generate(1, reportType, periodsBack);
      setReport(res.data);
      // Refresh history
      const hRes = await reportsAPI.history(1);
      setHistory(hRes.data);
    } catch (err) {
      console.error('Error generating report:', err);
    } finally {
      setLoading(false);
    }
  }, [reportType, periodsBack]);

  // ── Load from history ─────────────────────────────────────

  const loadReport = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const res = await reportsAPI.detail(id);
      const d = res.data;
      setReport({
        report_type: d.report_type,
        period: { start: d.period_start, end: d.period_end },
        kpis: d.kpis || {},
        alarms: d.alarms || {},
        batches: d.batches || [],
        generated_at: d.generated_at,
      });
      setActiveView('generate');
    } catch (err) {
      console.error('Error loading report:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Download Excel ────────────────────────────────────────

  const downloadExcel = useCallback(async () => {
    setDownloading(true);
    try {
      const res = await reportsAPI.exportExcel(1, reportType, periodsBack);
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PetroVision_Report_${reportType}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading Excel:', err);
    } finally {
      setDownloading(false);
    }
  }, [reportType, periodsBack]);

  const kpis = report?.kpis;
  const alarms = report?.alarms;
  const batches = report?.batches || [];

  // Chart data
  const qualityData = kpis ? Object.entries(kpis.quality_breakdown || {}).map(([g, c]) => ({
    name: `Grado ${g}`, value: c, color: QUALITY_COLORS[g] || '#64748b',
  })) : [];

  const priorityData = alarms ? Object.entries(alarms.by_priority || {}).map(([p, c]) => ({
    name: p, value: c, color: PRIORITY_COLORS[p] || '#64748b',
  })) : [];

  const topInstruments = alarms?.top_instruments || [];

  // ── Render ────────────────────────────────────────────────

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1440, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <FileText size={20} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>Centro de Reportes</h1>
          <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
            Generación y exportación de reportes de producción, alarmas y KPIs
          </p>
        </div>
      </div>

      {/* View Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #1e293b' }}>
        {[
          { id: 'generate', label: 'Generar Reporte', icon: FileText },
          { id: 'history', label: 'Historial', icon: Clock },
        ].map(tab => {
          const active = activeView === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as any)}
              style={{
                padding: '10px 20px', borderRadius: '8px 8px 0 0', fontSize: '0.8rem', fontWeight: 600,
                border: 'none', borderBottom: active ? '2px solid #8b5cf6' : '2px solid transparent',
                background: active ? 'rgba(139,92,246,0.08)' : 'transparent',
                color: active ? '#8b5cf6' : '#64748b', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <Icon size={14} /> {tab.label}
              {tab.id === 'history' && history.length > 0 && (
                <span style={{
                  fontSize: '0.6rem', fontWeight: 700, padding: '1px 5px', borderRadius: 4,
                  background: 'rgba(139,92,246,0.12)', color: '#8b5cf6',
                }}>{history.length}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── GENERATE VIEW ────────────────────────────────── */}
      {activeView === 'generate' && (
        <div>
          {/* Config Bar */}
          <div style={{
            background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12,
            padding: 16, marginBottom: 20,
            display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap',
          }}>
            {/* Report Type */}
            <div>
              <label style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                TIPO DE REPORTE
              </label>
              <div style={{ display: 'flex', gap: 4 }}>
                {REPORT_TYPES.map(rt => {
                  const active = reportType === rt.value;
                  const Icon = rt.icon;
                  return (
                    <button
                      key={rt.value}
                      onClick={() => setReportType(rt.value)}
                      style={{
                        padding: '8px 14px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600,
                        border: active ? '1px solid #8b5cf6' : '1px solid #334155',
                        background: active ? 'rgba(139,92,246,0.15)' : 'transparent',
                        color: active ? '#8b5cf6' : '#94a3b8', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      <Icon size={12} /> {rt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Periods Back */}
            <div>
              <label style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                PERIODOS
              </label>
              <select
                value={periodsBack}
                onChange={(e) => setPeriodsBack(+e.target.value)}
                style={{
                  background: '#1e293b', border: '1px solid #334155', borderRadius: 8,
                  padding: '8px 12px', color: '#e2e8f0', fontSize: '0.8rem',
                }}
              >
                {[1, 2, 3, 5, 7, 10, 12].map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? 'periodo' : 'periodos'}</option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button
                onClick={generateReport}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                  border: 'none', borderRadius: 8, padding: '8px 20px',
                  color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 6,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? <RefreshCw size={14} className="spin" /> : <Eye size={14} />}
                {loading ? 'Generando...' : 'Generar'}
              </button>
              <button
                onClick={downloadExcel}
                disabled={downloading}
                style={{
                  background: 'rgba(34,197,94,0.15)', border: '1px solid #22c55e',
                  borderRadius: 8, padding: '8px 16px', color: '#22c55e',
                  cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 6,
                  opacity: downloading ? 0.7 : 1,
                }}
              >
                <Download size={14} />
                {downloading ? 'Descargando...' : 'Excel'}
              </button>
            </div>
          </div>

          {/* Report Content */}
          {report && kpis && (
            <>
              {/* Period info */}
              <div style={{
                marginBottom: 16, padding: '8px 14px', borderRadius: 8,
                background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)',
                fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Calendar size={14} color="#8b5cf6" />
                <strong style={{ color: '#e2e8f0' }}>{report.report_type.charAt(0).toUpperCase() + report.report_type.slice(1)}</strong>
                &mdash; {fmtDate(report.period.start)} a {fmtDate(report.period.end)}
                {report.generated_at && (
                  <span style={{ marginLeft: 'auto', fontSize: '0.65rem' }}>
                    Generado: {fmtDate(report.generated_at)} por {report.generated_by || 'sistema'}
                  </span>
                )}
              </div>

              {/* KPI Cards */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
                <KPICard icon={Package} label="Producción" value={fmt(kpis.total_production_kg, 0)} unit="kg" color="#22c55e" subtext={`${kpis.completed_batches} lotes completados`} />
                <KPICard icon={Target} label="Rendimiento" value={kpis.avg_yield !== null ? fmt(kpis.avg_yield, 1) : '\u2014'} unit="%" color="#06b6d4" subtext="Promedio del periodo" />
                <KPICard icon={FlaskConical} label="Pureza" value={kpis.avg_purity !== null ? fmt(kpis.avg_purity, 1) : '\u2014'} unit="%" color="#a855f7" subtext="Promedio del periodo" />
                <KPICard icon={Activity} label="OEE" value={kpis.oee !== null ? fmt(kpis.oee, 1) : '\u2014'} unit="%" color="#eab308" subtext={`${fmt(kpis.operating_hours, 1)}h operativas`} />
                <KPICard icon={DollarSign} label="Margen" value={fmtCurrency(kpis.margin)} color={kpis.margin >= 0 ? '#22c55e' : '#ef4444'} subtext={kpis.margin_pct !== null ? `${fmt(kpis.margin_pct, 1)}%` : undefined} />
                <KPICard icon={Bell} label="Alarmas" value={String(alarms?.total || 0)} color={alarms && alarms.critical > 0 ? '#ef4444' : '#22c55e'} subtext={`${alarms?.critical || 0} críticas, ${alarms?.high || 0} altas`} />
              </div>

              {/* Charts Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 20 }}>
                {/* Quality Breakdown Pie */}
                {qualityData.length > 0 && (
                  <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20 }}>
                    <SectionHeader title="Distribución de Calidad" icon={CheckCircle2} />
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={qualityData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          strokeWidth={0}
                        >
                          {qualityData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Legend wrapperStyle={{ fontSize: '0.7rem' }} />
                        <Tooltip
                          contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: '0.75rem' }}
                          formatter={(v: number) => [`${v} lotes`, 'Cantidad']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Alarm Priority Pie */}
                {priorityData.length > 0 && (
                  <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20 }}>
                    <SectionHeader title="Alarmas por Prioridad" icon={AlertTriangle} />
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={priorityData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          strokeWidth={0}
                        >
                          {priorityData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Legend wrapperStyle={{ fontSize: '0.7rem' }} />
                        <Tooltip
                          contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: '0.75rem' }}
                          formatter={(v: number) => [`${v} alarmas`, 'Cantidad']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Top Alarm Instruments Bar */}
                {topInstruments.length > 0 && (
                  <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20 }}>
                    <SectionHeader title="Top Instrumentos (Alarmas)" icon={BarChart3} />
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={topInstruments.slice(0, 8)} layout="vertical" margin={{ left: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis type="number" stroke="#475569" fontSize={10} />
                        <YAxis dataKey="tag" type="category" stroke="#475569" fontSize={10} width={55} />
                        <Tooltip
                          contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: '0.75rem' }}
                          formatter={(v: number) => [`${v}`, 'Alarmas']}
                        />
                        <Bar dataKey="count" fill="#f97316" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Alarm Stats Summary */}
              {alarms && (
                <div style={{
                  background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12,
                  padding: 20, marginBottom: 20,
                }}>
                  <SectionHeader title="Estadísticas de Alarmas" icon={Shield} />
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 140px', minWidth: 140, padding: '8px 12px', borderRadius: 8, background: '#1e293b' }}>
                      <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>TIEMPO RESP. PROMEDIO</div>
                      <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#06b6d4' }}>
                        {alarms.avg_response_time_s !== null ? `${fmt(alarms.avg_response_time_s, 0)}s` : '\u2014'}
                      </div>
                    </div>
                    <div style={{ flex: '1 1 140px', minWidth: 140, padding: '8px 12px', borderRadius: 8, background: '#1e293b' }}>
                      <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>% RECONOCIDAS</div>
                      <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#22c55e' }}>
                        {alarms.acknowledged_pct !== null ? `${fmt(alarms.acknowledged_pct, 1)}%` : '\u2014'}
                      </div>
                    </div>
                    {Object.entries(alarms.by_type || {}).map(([type, count]) => (
                      <div key={type} style={{ flex: '1 1 110px', minWidth: 110, padding: '8px 12px', borderRadius: 8, background: '#1e293b' }}>
                        <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>{type}</div>
                        <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#e2e8f0' }}>{count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Batch Table */}
              {batches.length > 0 && (
                <div style={{
                  background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12,
                  padding: 20, marginBottom: 20,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <SectionHeader title="Detalle de Lotes" icon={Package} badge={`${batches.length}`} />
                    <button
                      onClick={() => setExpandedBatches(!expandedBatches)}
                      style={{
                        background: 'none', border: '1px solid #334155', borderRadius: 6,
                        padding: '4px 10px', color: '#94a3b8', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem',
                      }}
                    >
                      {expandedBatches ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      {expandedBatches ? 'Contraer' : 'Expandir'}
                    </button>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #1e293b' }}>
                          {['Lote', 'Estado', 'Inicio', 'Fin', 'Alimentación', 'Producto', 'Rendimiento', 'Pureza', 'Calidad', 'Costo', 'Ingreso'].map(h => (
                            <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(expandedBatches ? batches : batches.slice(0, 10)).map((b, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #1e293b08' }}>
                            <td className="mono" style={{ padding: '6px 10px', fontWeight: 600, whiteSpace: 'nowrap' }}>{b.batch_number}</td>
                            <td style={{ padding: '6px 10px' }}>
                              <span style={{
                                padding: '2px 7px', borderRadius: 4, fontWeight: 700, fontSize: '0.6rem',
                                background: `${STATUS_COLORS[b.status] || '#64748b'}20`,
                                color: STATUS_COLORS[b.status] || '#64748b',
                              }}>
                                {b.status}
                              </span>
                            </td>
                            <td style={{ padding: '6px 10px', fontSize: '0.7rem' }}>{fmtDate(b.actual_start)}</td>
                            <td style={{ padding: '6px 10px', fontSize: '0.7rem' }}>{fmtDate(b.actual_end)}</td>
                            <td className="mono" style={{ padding: '6px 10px' }}>{b.feed_kg !== null ? `${fmt(b.feed_kg, 0)} kg` : '\u2014'}</td>
                            <td className="mono" style={{ padding: '6px 10px' }}>{b.product_kg !== null ? `${fmt(b.product_kg, 0)} kg` : '\u2014'}</td>
                            <td className="mono" style={{ padding: '6px 10px', color: b.yield !== null && b.yield >= 90 ? '#22c55e' : b.yield !== null && b.yield >= 80 ? '#eab308' : '#ef4444' }}>
                              {b.yield !== null ? `${fmt(b.yield, 1)}%` : '\u2014'}
                            </td>
                            <td className="mono" style={{ padding: '6px 10px' }}>{b.purity !== null ? `${fmt(b.purity, 1)}%` : '\u2014'}</td>
                            <td style={{ padding: '6px 10px' }}>
                              {b.quality_grade && (
                                <span style={{ fontWeight: 700, color: QUALITY_COLORS[b.quality_grade] || '#64748b' }}>{b.quality_grade}</span>
                              )}
                            </td>
                            <td className="mono" style={{ padding: '6px 10px' }}>{fmtCurrency(b.cost)}</td>
                            <td className="mono" style={{ padding: '6px 10px' }}>{fmtCurrency(b.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!expandedBatches && batches.length > 10 && (
                      <div style={{ textAlign: 'center', padding: 8, fontSize: '0.7rem', color: '#64748b' }}>
                        Mostrando 10 de {batches.length} lotes
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Empty state */}
          {!report && !loading && (
            <div style={{ textAlign: 'center', padding: 80, color: '#475569' }}>
              <FileText size={56} style={{ marginBottom: 16, opacity: 0.2 }} />
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#64748b' }}>Generar un Reporte</div>
              <div style={{ fontSize: '0.8rem', marginTop: 8, maxWidth: 400, margin: '8px auto 0' }}>
                Seleccione el tipo de reporte y periodo, luego presione &quot;Generar&quot; para ver el resumen, o &quot;Excel&quot; para descargar directamente.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY VIEW ─────────────────────────────────── */}
      {activeView === 'history' && (
        <div>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#475569' }}>
              <Clock size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
              <div style={{ fontWeight: 600 }}>Sin reportes generados</div>
              <div style={{ fontSize: '0.75rem', marginTop: 4 }}>Los reportes aparecerán aquí una vez generados</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {history.map(r => (
                <div
                  key={r.id}
                  onClick={() => loadReport(r.id)}
                  style={{
                    background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12,
                    padding: 16, cursor: 'pointer', transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#8b5cf6')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1e293b')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: 'rgba(139,92,246,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <FileText size={16} color="#8b5cf6" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                        Reporte {r.report_type.charAt(0).toUpperCase() + r.report_type.slice(1)}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        {fmtDate(r.period_start)} &mdash; {fmtDate(r.period_end)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.6rem', color: '#64748b' }}>Producción</div>
                        <div className="mono" style={{ fontWeight: 700, fontSize: '0.85rem', color: '#22c55e' }}>
                          {fmt(r.total_production_kg, 0)} kg
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.6rem', color: '#64748b' }}>Rendimiento</div>
                        <div className="mono" style={{ fontWeight: 700, fontSize: '0.85rem', color: '#06b6d4' }}>
                          {r.avg_yield !== null ? `${fmt(r.avg_yield, 1)}%` : '\u2014'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.6rem', color: '#64748b' }}>OEE</div>
                        <div className="mono" style={{ fontWeight: 700, fontSize: '0.85rem', color: '#eab308' }}>
                          {r.oee !== null ? `${fmt(r.oee, 1)}%` : '\u2014'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.6rem', color: '#64748b' }}>Alarmas</div>
                        <div className="mono" style={{ fontWeight: 700, fontSize: '0.85rem', color: r.critical_alarms > 0 ? '#ef4444' : '#e2e8f0' }}>
                          {r.total_alarms} ({r.critical_alarms} crit)
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#475569', textAlign: 'right', minWidth: 80 }}>
                      {fmtDate(r.generated_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
