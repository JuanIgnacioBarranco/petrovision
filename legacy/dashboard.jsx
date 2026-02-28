import { useState, useEffect, useCallback, useMemo } from "react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { AlertTriangle, Activity, Thermometer, Droplets, Wind, Gauge, TrendingUp, Bell, Settings, LayoutDashboard, BrainCircuit, ClipboardList, History, ChevronRight, ArrowUp, ArrowDown, Minus, Zap, FlaskConical, Factory, Eye } from "lucide-react";

// ─── DATA GENERATORS ───
const generateTimeSeriesData = (points = 24, base, variance, label = "value") => {
  return Array.from({ length: points }, (_, i) => {
    const hour = `${String(i).padStart(2, "0")}:00`;
    const val = base + (Math.random() - 0.5) * variance + Math.sin(i / 4) * (variance * 0.3);
    return { time: hour, [label]: parseFloat(val.toFixed(2)) };
  });
};

const generatePredictionData = () => {
  const data = [];
  for (let i = 0; i < 30; i++) {
    const actual = 85 + Math.random() * 10 + Math.sin(i / 5) * 3;
    const predicted = actual + (Math.random() - 0.5) * 4;
    data.push({
      batch: `L-${String(i + 1).padStart(3, "0")}`,
      actual: parseFloat(actual.toFixed(2)),
      predicted: parseFloat(predicted.toFixed(2)),
      error: parseFloat(Math.abs(actual - predicted).toFixed(2)),
    });
  }
  return data;
};

const generateScatterData = () => {
  return Array.from({ length: 50 }, () => ({
    temperature: 150 + Math.random() * 100,
    yield: 70 + Math.random() * 25 + Math.random() * 5,
  }));
};

const generateRadarData = () => [
  { metric: "Temperatura", value: 88, fullMark: 100 },
  { metric: "Presión", value: 76, fullMark: 100 },
  { metric: "pH", value: 92, fullMark: 100 },
  { metric: "Caudal", value: 81, fullMark: 100 },
  { metric: "Pureza", value: 95, fullMark: 100 },
  { metric: "Rendimiento", value: 84, fullMark: 100 },
];

const ALARMS = [
  { id: 1, severity: "critical", message: "Temperatura reactor R-101 > 280°C", timestamp: "14:23:05", zone: "Reactor Principal", ack: false },
  { id: 2, severity: "warning", message: "Presión columna D-201 cercana a límite", timestamp: "14:18:32", zone: "Destilación", ack: false },
  { id: 3, severity: "info", message: "Mantenimiento programado bomba P-103", timestamp: "13:45:00", zone: "Bombeo", ack: true },
  { id: 4, severity: "warning", message: "pH tanque T-301 fuera de rango (3.2)", timestamp: "13:30:15", zone: "Almacenamiento", ack: false },
  { id: 5, severity: "critical", message: "Flujo en línea L-405 interrumpido", timestamp: "12:55:41", zone: "Transferencia", ack: true },
  { id: 6, severity: "info", message: "Calibración sensor FT-102 completada", timestamp: "12:10:00", zone: "Instrumentación", ack: true },
  { id: 7, severity: "warning", message: "Nivel tanque T-205 al 92%", timestamp: "11:45:22", zone: "Almacenamiento", ack: false },
];

const HISTORY_LOG = [
  { time: "14:23:05", event: "Alarma crítica activada", detail: "Temp. R-101 excede 280°C", user: "Sistema" },
  { time: "14:20:00", event: "Cambio de setpoint", detail: "Presión D-201: 4.5 → 4.8 bar", user: "Op. García" },
  { time: "14:15:30", event: "Inicio de lote", detail: "Lote L-047 iniciado en reactor R-102", user: "Op. Martínez" },
  { time: "14:10:00", event: "Predicción generada", detail: "Rendimiento estimado: 91.3%", user: "ML Engine" },
  { time: "13:55:12", event: "Muestra de laboratorio", detail: "Pureza: 98.2% - Lote L-046", user: "Lab. Pérez" },
  { time: "13:45:00", event: "Orden de mantenimiento", detail: "PM bomba P-103 programada", user: "Mant. López" },
  { time: "13:30:15", event: "Alarma de proceso", detail: "pH T-301 fuera de especificación", user: "Sistema" },
  { time: "13:15:00", event: "Reentrenamiento modelo", detail: "Modelo v2.4 → v2.5, R²=0.94", user: "ML Engine" },
];

// ─── STYLES ───
const colors = {
  bg: "#060b18",
  surface: "#0c1225",
  surfaceHover: "#111a33",
  border: "#1a2744",
  borderLight: "#243354",
  cyan: "#00e5ff",
  cyanDim: "rgba(0,229,255,0.15)",
  cyanGlow: "rgba(0,229,255,0.4)",
  orange: "#ff9100",
  orangeDim: "rgba(255,145,0,0.15)",
  red: "#ff1744",
  redDim: "rgba(255,23,68,0.15)",
  green: "#00e676",
  greenDim: "rgba(0,230,118,0.15)",
  purple: "#d500f9",
  purpleDim: "rgba(213,0,249,0.15)",
  text: "#e0e6f0",
  textDim: "#6b7a99",
  textMuted: "#3d4f6f",
};

// ─── COMPONENTS ───

const GlowDot = ({ color = colors.cyan, size = 8, pulse = false }) => (
  <span style={{
    display: "inline-block", width: size, height: size, borderRadius: "50%",
    background: color, boxShadow: `0 0 ${size}px ${color}`,
    animation: pulse ? "pulse 2s ease-in-out infinite" : "none",
  }} />
);

const KPICard = ({ icon: Icon, label, value, unit, trend, trendValue, color = colors.cyan, mini = false }) => (
  <div style={{
    background: `linear-gradient(135deg, ${colors.surface} 0%, ${colors.bg} 100%)`,
    border: `1px solid ${colors.border}`,
    borderRadius: 12, padding: mini ? "14px 16px" : "20px 24px",
    position: "relative", overflow: "hidden",
    transition: "all 0.3s ease",
  }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.boxShadow = `0 0 20px ${color}33`; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.boxShadow = "none"; }}
  >
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: 0.6 }} />
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: mini ? 4 : 8 }}>
          <Icon size={mini ? 14 : 16} color={color} />
          <span style={{ fontSize: mini ? 11 : 12, color: colors.textDim, textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "'JetBrains Mono', monospace" }}>{label}</span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontSize: mini ? 24 : 32, fontWeight: 700, color: colors.text, fontFamily: "'JetBrains Mono', monospace", letterSpacing: -1 }}>{value}</span>
          <span style={{ fontSize: mini ? 12 : 14, color: colors.textDim }}>{unit}</span>
        </div>
      </div>
      {trend && (
        <div style={{
          display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20,
          background: trend === "up" ? colors.greenDim : trend === "down" ? colors.redDim : colors.cyanDim,
          color: trend === "up" ? colors.green : trend === "down" ? colors.red : colors.cyan,
          fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
        }}>
          {trend === "up" ? <ArrowUp size={12} /> : trend === "down" ? <ArrowDown size={12} /> : <Minus size={12} />}
          {trendValue}
        </div>
      )}
    </div>
  </div>
);

const SectionTitle = ({ icon: Icon, title, subtitle, action }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: colors.cyanDim, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={18} color={colors.cyan} />
      </div>
      <div>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: colors.text }}>{title}</h3>
        {subtitle && <p style={{ margin: 0, fontSize: 12, color: colors.textDim }}>{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

const ChartCard = ({ children, title, icon: Icon = Activity, subtitle, style: s = {} }) => (
  <div style={{
    background: colors.surface, border: `1px solid ${colors.border}`,
    borderRadius: 12, padding: 20, ...s,
  }}>
    <SectionTitle icon={Icon} title={title} subtitle={subtitle} />
    {children}
  </div>
);

const customTooltipStyle = {
  background: colors.surface, border: `1px solid ${colors.borderLight}`,
  borderRadius: 8, padding: "10px 14px", fontSize: 12,
  fontFamily: "'JetBrains Mono', monospace", color: colors.text,
  boxShadow: `0 8px 32px rgba(0,0,0,0.6)`,
};

// ─── PAGES ───

const DashboardPage = ({ data }) => (
  <div>
    {/* KPIs Row */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
      <KPICard icon={Thermometer} label="Temp. Reactor" value="245.8" unit="°C" trend="up" trendValue="+2.3°" color={colors.orange} />
      <KPICard icon={Gauge} label="Presión" value="4.52" unit="bar" trend="stable" trendValue="0.0" color={colors.cyan} />
      <KPICard icon={Droplets} label="pH Proceso" value="6.85" unit="pH" trend="down" trendValue="-0.12" color={colors.green} />
      <KPICard icon={Wind} label="Caudal" value="128.4" unit="L/min" trend="up" trendValue="+5.1" color={colors.purple} />
    </div>

    {/* Charts Row 1 */}
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
      <ChartCard title="Temperatura del Reactor (24h)" icon={Thermometer} subtitle="R-101 · Última lectura: 245.8°C">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data.temperature}>
            <defs>
              <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.orange} stopOpacity={0.3} />
                <stop offset="100%" stopColor={colors.orange} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
            <XAxis dataKey="time" stroke={colors.textMuted} tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} />
            <YAxis stroke={colors.textMuted} tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} domain={["auto", "auto"]} />
            <Tooltip contentStyle={customTooltipStyle} />
            <Area type="monotone" dataKey="value" stroke={colors.orange} fill="url(#tempGrad)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Estado del Proceso" icon={FlaskConical} subtitle="Variables normalizadas">
        <ResponsiveContainer width="100%" height={240}>
          <RadarChart data={data.radar}>
            <PolarGrid stroke={colors.border} />
            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: colors.textDim }} />
            <PolarRadiusAxis tick={false} axisLine={false} />
            <Radar dataKey="value" stroke={colors.cyan} fill={colors.cyan} fillOpacity={0.15} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>

    {/* Charts Row 2 */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <ChartCard title="Presión del Sistema (24h)" icon={Gauge} subtitle="D-201 · Columna de destilación">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data.pressure}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
            <XAxis dataKey="time" stroke={colors.textMuted} tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} />
            <YAxis stroke={colors.textMuted} tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} />
            <Tooltip contentStyle={customTooltipStyle} />
            <Line type="monotone" dataKey="value" stroke={colors.cyan} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Caudal Volumétrico (24h)" icon={Wind} subtitle="FT-102 · Línea principal">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data.flow}>
            <defs>
              <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.purple} stopOpacity={0.3} />
                <stop offset="100%" stopColor={colors.purple} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
            <XAxis dataKey="time" stroke={colors.textMuted} tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} />
            <YAxis stroke={colors.textMuted} tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} />
            <Tooltip contentStyle={customTooltipStyle} />
            <Area type="monotone" dataKey="value" stroke={colors.purple} fill="url(#flowGrad)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  </div>
);

const PredictivePage = ({ data }) => (
  <div>
    {/* Model KPIs */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
      <KPICard icon={BrainCircuit} label="Modelo Activo" value="v2.5" unit="Random Forest" trend="up" trendValue="R²=0.94" color={colors.cyan} />
      <KPICard icon={TrendingUp} label="Predicción Actual" value="91.3" unit="% rendimiento" trend="up" trendValue="+1.2%" color={colors.green} />
      <KPICard icon={Activity} label="MAE" value="1.87" unit="%" trend="down" trendValue="-0.3" color={colors.orange} />
      <KPICard icon={Zap} label="Último Entrenamiento" value="2h" unit="atrás" trend="stable" trendValue="auto" color={colors.purple} />
    </div>

    {/* Prediction Chart */}
    <ChartCard title="Rendimiento Real vs. Predicho" icon={BrainCircuit} subtitle="Últimos 30 lotes · Modelo Random Forest v2.5" style={{ marginBottom: 16 }}>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data.prediction}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
          <XAxis dataKey="batch" stroke={colors.textMuted} tick={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }} interval={2} />
          <YAxis stroke={colors.textMuted} tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} domain={[80, 100]} />
          <Tooltip contentStyle={customTooltipStyle} />
          <Line type="monotone" dataKey="actual" stroke={colors.cyan} strokeWidth={2} dot={{ r: 3, fill: colors.cyan }} name="Real" />
          <Line type="monotone" dataKey="predicted" stroke={colors.orange} strokeWidth={2} strokeDasharray="6 3" dot={{ r: 3, fill: colors.orange }} name="Predicho" />
        </LineChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", gap: 24, justifyContent: "center", marginTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: colors.textDim }}>
          <div style={{ width: 24, height: 2, background: colors.cyan }} /> Real
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: colors.textDim }}>
          <div style={{ width: 24, height: 2, background: colors.orange, borderTop: "2px dashed " + colors.orange }} /> Predicho
        </div>
      </div>
    </ChartCard>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {/* Scatter: Temp vs Yield */}
      <ChartCard title="Correlación Temp. vs Rendimiento" icon={FlaskConical} subtitle="Análisis exploratorio · 50 muestras">
        <ResponsiveContainer width="100%" height={240}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
            <XAxis dataKey="temperature" name="Temperatura" unit="°C" stroke={colors.textMuted} tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} />
            <YAxis dataKey="yield" name="Rendimiento" unit="%" stroke={colors.textMuted} tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={customTooltipStyle} />
            <Scatter data={data.scatter} fill={colors.cyan} fillOpacity={0.7} />
          </ScatterChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Error Distribution */}
      <ChartCard title="Distribución del Error de Predicción" icon={Activity} subtitle="Error absoluto por lote">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data.prediction.slice(0, 15)}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
            <XAxis dataKey="batch" stroke={colors.textMuted} tick={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }} />
            <YAxis stroke={colors.textMuted} tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} />
            <Tooltip contentStyle={customTooltipStyle} />
            <Bar dataKey="error" fill={colors.orange} radius={[4, 4, 0, 0]} name="Error Abs." />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>

    {/* Feature Importance */}
    <div style={{ marginTop: 16, background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20 }}>
      <SectionTitle icon={TrendingUp} title="Importancia de Variables (Feature Importance)" subtitle="Random Forest v2.5 · Top 6 variables" />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          { name: "Temperatura Reactor (°C)", importance: 0.34, color: colors.orange },
          { name: "Presión Columna (bar)", importance: 0.22, color: colors.cyan },
          { name: "Tiempo de Residencia (min)", importance: 0.16, color: colors.green },
          { name: "Concentración Alimentación (%)", importance: 0.12, color: colors.purple },
          { name: "pH del Medio", importance: 0.09, color: colors.cyan },
          { name: "Caudal Recirculación (L/min)", importance: 0.07, color: colors.textDim },
        ].map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 220, fontSize: 12, color: colors.textDim, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>{f.name}</span>
            <div style={{ flex: 1, height: 20, background: colors.bg, borderRadius: 4, overflow: "hidden", position: "relative" }}>
              <div style={{
                height: "100%", width: `${f.importance * 100 / 0.34 * 100}%`,
                maxWidth: "100%",
                background: `linear-gradient(90deg, ${f.color}44, ${f.color})`,
                borderRadius: 4,
                transition: "width 1s ease",
              }} />
            </div>
            <span style={{ width: 48, fontSize: 13, color: colors.text, fontFamily: "'JetBrains Mono', monospace", textAlign: "right", fontWeight: 600 }}>
              {(f.importance * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const AlarmsPage = () => {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? ALARMS : ALARMS.filter(a => a.severity === filter);

  const severityStyle = (s) => ({
    critical: { bg: colors.redDim, color: colors.red, border: `1px solid ${colors.red}44` },
    warning: { bg: colors.orangeDim, color: colors.orange, border: `1px solid ${colors.orange}44` },
    info: { bg: colors.cyanDim, color: colors.cyan, border: `1px solid ${colors.cyan}44` },
  }[s]);

  return (
    <div>
      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <KPICard icon={AlertTriangle} label="Críticas" value="2" unit="activas" color={colors.red} mini />
        <KPICard icon={Bell} label="Advertencias" value="3" unit="activas" color={colors.orange} mini />
        <KPICard icon={Activity} label="Informativas" value="2" unit="total" color={colors.cyan} mini />
        <KPICard icon={Eye} label="Sin Reconocer" value="4" unit="pendientes" color={colors.purple} mini />
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { key: "all", label: "Todas" },
          { key: "critical", label: "Críticas" },
          { key: "warning", label: "Advertencias" },
          { key: "info", label: "Info" },
        ].map(f => (
          <button key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: "6px 16px", borderRadius: 20, border: `1px solid ${filter === f.key ? colors.cyan : colors.border}`,
              background: filter === f.key ? colors.cyanDim : "transparent",
              color: filter === f.key ? colors.cyan : colors.textDim,
              cursor: "pointer", fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
              transition: "all 0.2s",
            }}
          >{f.label}</button>
        ))}
      </div>

      {/* Alarm List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map(alarm => {
          const sev = severityStyle(alarm.severity);
          return (
            <div key={alarm.id} style={{
              background: colors.surface, border: `1px solid ${colors.border}`,
              borderRadius: 10, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16,
              borderLeft: `3px solid ${sev.color}`,
              opacity: alarm.ack ? 0.5 : 1,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: sev.color, boxShadow: alarm.ack ? "none" : `0 0 8px ${sev.color}`, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: colors.text, marginBottom: 4 }}>{alarm.message}</div>
                <div style={{ display: "flex", gap: 16, fontSize: 11, color: colors.textDim, fontFamily: "'JetBrains Mono', monospace" }}>
                  <span>{alarm.timestamp}</span>
                  <span>{alarm.zone}</span>
                </div>
              </div>
              <span style={{
                padding: "3px 10px", borderRadius: 12, fontSize: 10, fontWeight: 600,
                background: sev.bg, color: sev.color, border: sev.border,
                textTransform: "uppercase", letterSpacing: 1, fontFamily: "'JetBrains Mono', monospace",
              }}>
                {alarm.severity === "critical" ? "CRÍTICA" : alarm.severity === "warning" ? "ADVERTENCIA" : "INFO"}
              </span>
              {!alarm.ack && (
                <button style={{
                  padding: "6px 12px", borderRadius: 6, background: "transparent",
                  border: `1px solid ${colors.border}`, color: colors.textDim,
                  cursor: "pointer", fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
                }}>ACK</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const HistoryPage = () => (
  <div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
      <KPICard icon={ClipboardList} label="Eventos Hoy" value="47" unit="registros" color={colors.cyan} mini />
      <KPICard icon={Factory} label="Lotes Procesados" value="12" unit="hoy" color={colors.green} mini />
      <KPICard icon={BrainCircuit} label="Predicciones" value="12" unit="generadas" color={colors.purple} mini />
    </div>

    <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{
        display: "grid", gridTemplateColumns: "100px 1fr 1fr 100px",
        padding: "12px 20px", background: colors.bg, borderBottom: `1px solid ${colors.border}`,
        fontSize: 11, color: colors.textDim, textTransform: "uppercase", letterSpacing: 1.5,
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        <span>Hora</span>
        <span>Evento</span>
        <span>Detalle</span>
        <span>Usuario</span>
      </div>
      {HISTORY_LOG.map((log, i) => (
        <div key={i} style={{
          display: "grid", gridTemplateColumns: "100px 1fr 1fr 100px",
          padding: "14px 20px", borderBottom: `1px solid ${colors.border}`,
          fontSize: 13, color: colors.text, alignItems: "center",
          transition: "background 0.2s",
        }}
          onMouseEnter={e => e.currentTarget.style.background = colors.surfaceHover}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: colors.cyan }}>{log.time}</span>
          <span>{log.event}</span>
          <span style={{ color: colors.textDim, fontSize: 12 }}>{log.detail}</span>
          <span style={{ fontSize: 11, color: colors.textDim }}>{log.user}</span>
        </div>
      ))}
    </div>
  </div>
);

// ─── MAIN APP ───
export default function PlantDashboard() {
  const [page, setPage] = useState("dashboard");
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap');
      @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
      @keyframes slideIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
      * { box-sizing: border-box; }
      ::-webkit-scrollbar { width: 6px; }
      ::-webkit-scrollbar-track { background: ${colors.bg}; }
      ::-webkit-scrollbar-thumb { background: ${colors.border}; border-radius: 3px; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const chartData = useMemo(() => ({
    temperature: generateTimeSeriesData(24, 245, 20),
    pressure: generateTimeSeriesData(24, 4.5, 0.8),
    flow: generateTimeSeriesData(24, 128, 30),
    radar: generateRadarData(),
    prediction: generatePredictionData(),
    scatter: generateScatterData(),
  }), []);

  const navItems = [
    { key: "dashboard", icon: LayoutDashboard, label: "Monitoreo" },
    { key: "predictive", icon: BrainCircuit, label: "Predictivo" },
    { key: "alarms", icon: Bell, label: "Alarmas" },
    { key: "history", icon: History, label: "Historial" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", background: colors.bg, fontFamily: "'Outfit', sans-serif", color: colors.text }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, background: colors.surface, borderRight: `1px solid ${colors.border}`,
        display: "flex", flexDirection: "column", flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: "24px 20px", borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: `linear-gradient(135deg, ${colors.cyan}, ${colors.purple})`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Factory size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.5 }}>PetroVision</div>
              <div style={{ fontSize: 10, color: colors.textDim, fontFamily: "'JetBrains Mono', monospace" }}>SCADA + ML</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 12px" }}>
          {navItems.map(item => {
            const active = page === item.key;
            return (
              <button key={item.key} onClick={() => setPage(item.key)} style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "10px 12px", marginBottom: 4, borderRadius: 8, border: "none",
                background: active ? colors.cyanDim : "transparent",
                color: active ? colors.cyan : colors.textDim,
                cursor: "pointer", fontSize: 13, fontWeight: active ? 600 : 400,
                transition: "all 0.2s", textAlign: "left",
              }}>
                <item.icon size={18} />
                {item.label}
                {item.key === "alarms" && (
                  <span style={{
                    marginLeft: "auto", width: 20, height: 20, borderRadius: "50%",
                    background: colors.redDim, color: colors.red, fontSize: 10,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                  }}>2</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* System status */}
        <div style={{ padding: "16px", borderTop: `1px solid ${colors.border}` }}>
          <div style={{ fontSize: 10, color: colors.textDim, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>
            Estado del Sistema
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { label: "PLC Principal", status: "online" },
              { label: "Base de Datos", status: "online" },
              { label: "ML Engine", status: "online" },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: colors.textDim }}>{s.label}</span>
                <GlowDot color={colors.green} size={6} pulse />
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <header style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 28px", borderBottom: `1px solid ${colors.border}`,
          background: colors.surface,
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
              {navItems.find(n => n.key === page)?.label}
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: colors.textDim }}>
              Planta Petroquímica · Unidad de Procesamiento A
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <GlowDot color={colors.green} pulse />
              <span style={{ fontSize: 12, color: colors.green, fontFamily: "'JetBrains Mono', monospace" }}>EN LÍNEA</span>
            </div>
            <div style={{
              padding: "6px 14px", borderRadius: 8, background: colors.bg,
              border: `1px solid ${colors.border}`,
              fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: colors.cyan,
            }}>
              {time.toLocaleTimeString("es-AR")}
            </div>
          </div>
        </header>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
          <div style={{ animation: "slideIn 0.3s ease" }}>
            {page === "dashboard" && <DashboardPage data={chartData} />}
            {page === "predictive" && <PredictivePage data={chartData} />}
            {page === "alarms" && <AlarmsPage />}
            {page === "history" && <HistoryPage />}
          </div>
        </div>
      </main>
    </div>
  );
}
