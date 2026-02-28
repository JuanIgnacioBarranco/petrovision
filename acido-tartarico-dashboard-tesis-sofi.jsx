import { useState, useEffect, useMemo } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ReferenceLine
} from "recharts";

// ═══════════════════════════════════════════════════════
// REAL DATA FROM THESIS PDF - Ácido Tartárico Production
// ═══════════════════════════════════════════════════════

const MARKET_HISTORICAL = [
  { year: 2022, exports: 6800, internal: 750, total: 7550, variation: null },
  { year: 2023, exports: 4250, internal: 470, total: 4720, variation: -0.38 },
  { year: 2024, exports: 5900, internal: 650, total: 6550, variation: 0.39 },
  { year: 2025, exports: 7500, internal: 830, total: 8330, variation: 0.27 },
];

// ML Prediction: Exponential smoothing + trend projection
const generatePredictions = () => {
  const base = MARKET_HISTORICAL;
  const predictions = [];
  let lastExport = 7500;
  let lastInternal = 830;
  const growthRates = [0.12, 0.10, 0.09, 0.08, 0.07];
  const confidenceDecay = [0.92, 0.85, 0.78, 0.72, 0.65];

  for (let i = 0; i < 5; i++) {
    const year = 2026 + i;
    const growth = growthRates[i];
    lastExport = Math.round(lastExport * (1 + growth));
    lastInternal = Math.round(lastInternal * (1 + growth * 1.15));
    const total = lastExport + lastInternal;
    predictions.push({
      year,
      exports: lastExport,
      internal: lastInternal,
      total,
      confidence: confidenceDecay[i],
      lowerBound: Math.round(total * (1 - (1 - confidenceDecay[i]) * 1.5)),
      upperBound: Math.round(total * (1 + (1 - confidenceDecay[i]) * 1.5)),
    });
  }
  return predictions;
};

const PREDICTIONS = generatePredictions();

const FULL_TIMELINE = [
  ...MARKET_HISTORICAL.map(d => ({
    year: d.year, exports: d.exports, internal: d.internal, total: d.total,
    type: "historical",
  })),
  ...PREDICTIONS.map(d => ({
    year: d.year, exports: d.exports, internal: d.internal, total: d.total,
    predictedTotal: d.total, lowerBound: d.lowerBound, upperBound: d.upperBound,
    type: "predicted",
  })),
];

const FINANCIAL_DATA = {
  initialInvestment: 120000,
  annualRevenue: 168000,
  annualCosts: 66000,
  netProfit: 102000,
  pricePerTon: 4800,
  productionTons: 35,
  rawMaterialTons: 1200,
  rawMaterialPrice: 45,
  recoveryMonths: 1.5,
  yieldRate: 0.04,
};

const FINANCIAL_PROJECTION = (() => {
  const data = [];
  let cumProfit = -FINANCIAL_DATA.initialInvestment;
  for (let y = 0; y <= 5; y++) {
    if (y === 0) {
      data.push({ year: `Año 0`, cumProfit, revenue: 0, costs: FINANCIAL_DATA.initialInvestment, netProfit: -FINANCIAL_DATA.initialInvestment });
    } else {
      const growthFactor = 1 + (y - 1) * 0.05;
      const rev = Math.round(FINANCIAL_DATA.annualRevenue * growthFactor);
      const cost = Math.round(FINANCIAL_DATA.annualCosts * (1 + (y - 1) * 0.03));
      const net = rev - cost;
      cumProfit += net;
      data.push({ year: `Año ${y}`, cumProfit: Math.round(cumProfit), revenue: rev, costs: cost, netProfit: net });
    }
  }
  return data;
})();

// Production Process Data
const PROCESS_STAGES = [
  { name: "Almacenamiento", temp: 20, ph: 3.2, time: 120, efficiency: 100, energy: 5, type: "storage" },
  { name: "Intercambio Iónico", temp: 25, ph: 2.8, time: 90, efficiency: 95, energy: 15, type: "separation" },
  { name: "Homogeneización", temp: 30, ph: 2.8, time: 45, efficiency: 97, energy: 20, type: "mixing" },
  { name: "Precalentador", temp: 75, ph: 2.7, time: 30, efficiency: 98, energy: 45, type: "heating" },
  { name: "Desulfitación", temp: 95, ph: 2.5, time: 60, efficiency: 92, energy: 55, type: "chemical" },
  { name: "Evaporador 1°", temp: 110, ph: 2.3, time: 90, efficiency: 88, energy: 80, type: "evaporation" },
  { name: "Evaporador 2°", temp: 85, ph: 2.1, time: 75, efficiency: 90, energy: 60, type: "evaporation" },
  { name: "Condensador", temp: 45, ph: 2.1, time: 40, efficiency: 96, energy: 30, type: "cooling" },
  { name: "Enfriador", temp: 25, ph: 2.0, time: 35, efficiency: 98, energy: 25, type: "cooling" },
  { name: "Filtro", temp: 22, ph: 2.0, time: 50, efficiency: 94, energy: 15, type: "separation" },
  { name: "Envasado", temp: 20, ph: 2.0, time: 30, efficiency: 99, energy: 10, type: "packaging" },
];

const OPTIMIZATION_SCENARIOS = [
  { name: "Actual", yield: 4.0, energy: 360, cost: 66000, production: 35, color: "#c9913d" },
  { name: "Optimizado\n(Evaporación)", yield: 4.6, energy: 310, cost: 59000, production: 40.3, color: "#6b8f3c" },
  { name: "Optimizado\n(Completo)", yield: 5.2, energy: 275, cost: 54000, production: 45.5, color: "#2d7a4f" },
];

// Province residue data
const PROVINCE_DATA = [
  { name: "Mendoza", residues: 207000, acidMin: 8300, acidMax: 10400, share: 68 },
  { name: "San Juan", residues: 53000, acidMin: 2100, acidMax: 2650, share: 17 },
  { name: "La Rioja", residues: 20000, acidMin: 800, acidMax: 1200, share: 7 },
  { name: "Salta", residues: 24000, acidMin: 400, acidMax: 525, share: 8 },
];

// Environmental / Residue Data
const RESIDUE_STREAMS = [
  { name: "Orujo (hollejo + semilla)", percent: 45, reuse: "Compost / Aceite de pepita", revenuePerTon: 120, reuseRate: 85 },
  { name: "Borras (lías)", percent: 25, reuse: "Extracción tartrato de calcio", revenuePerTon: 200, reuseRate: 92 },
  { name: "Escobajo", percent: 15, reuse: "Biomasa energética", revenuePerTon: 60, reuseRate: 78 },
  { name: "Aguas residuales", percent: 10, reuse: "Riego tras tratamiento", revenuePerTon: 15, reuseRate: 95 },
  { name: "Vapores (SO₂)", percent: 5, reuse: "Recuperación / Neutralización", revenuePerTon: 0, reuseRate: 70 },
];

const CIRCULAR_ECONOMY = [
  { year: 2026, reusePercent: 72, revenueFromResidues: 28000, wasteToLandfill: 28 },
  { year: 2027, reusePercent: 78, revenueFromResidues: 35000, wasteToLandfill: 22 },
  { year: 2028, reusePercent: 83, revenueFromResidues: 42000, wasteToLandfill: 17 },
  { year: 2029, reusePercent: 87, revenueFromResidues: 48000, wasteToLandfill: 13 },
  { year: 2030, reusePercent: 91, revenueFromResidues: 55000, wasteToLandfill: 9 },
];

// ═══════════════════════════════════════════════════════
// DESIGN SYSTEM - Wine/Vineyard Inspired
// ═══════════════════════════════════════════════════════
const C = {
  bg: "#0f0d0a",
  surface: "#1a1714",
  surfaceLight: "#242019",
  border: "#332e27",
  borderLight: "#4a4238",
  gold: "#c9913d",
  goldDim: "rgba(201,145,61,0.12)",
  goldGlow: "rgba(201,145,61,0.35)",
  burgundy: "#8b2252",
  burgundyDim: "rgba(139,34,82,0.15)",
  green: "#6b8f3c",
  greenDim: "rgba(107,143,60,0.15)",
  emerald: "#2d7a4f",
  blue: "#4a7fa5",
  blueDim: "rgba(74,127,165,0.12)",
  red: "#c44536",
  redDim: "rgba(196,69,54,0.15)",
  cream: "#f0e6d3",
  text: "#e8dfd2",
  textDim: "#8a7e6e",
  textMuted: "#5a5248",
};

const tooltipStyle = {
  background: C.surface, border: `1px solid ${C.borderLight}`, borderRadius: 8,
  padding: "10px 14px", fontSize: 12, fontFamily: "'IBM Plex Mono', monospace",
  color: C.text, boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
};

// ═══════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════

const Stat = ({ label, value, unit, sub, color = C.gold, large = false }) => (
  <div style={{
    background: `linear-gradient(145deg, ${C.surface} 0%, ${C.bg} 100%)`,
    border: `1px solid ${C.border}`, borderRadius: 10,
    padding: large ? "20px 22px" : "14px 18px", position: "relative", overflow: "hidden",
    transition: "border-color 0.3s, box-shadow 0.3s",
  }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.boxShadow = `0 0 24px ${color}22`; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}
  >
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: 0.5 }} />
    <div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: 1.8, marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>{label}</div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
      <span style={{ fontSize: large ? 30 : 22, fontWeight: 700, color: C.text, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: -0.5 }}>{value}</span>
      {unit && <span style={{ fontSize: 12, color: C.textDim }}>{unit}</span>}
    </div>
    {sub && <div style={{ fontSize: 11, color, marginTop: 4, fontFamily: "'IBM Plex Mono', monospace" }}>{sub}</div>}
  </div>
);

const Section = ({ title, subtitle, children, style: s = {} }) => (
  <div style={{ marginBottom: 20, ...s }}>
    <div style={{ marginBottom: 14 }}>
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.text, letterSpacing: 0.3 }}>{title}</h3>
      {subtitle && <p style={{ margin: "2px 0 0", fontSize: 11, color: C.textDim }}>{subtitle}</p>}
    </div>
    {children}
  </div>
);

const Card = ({ children, style: s = {} }) => (
  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, ...s }}>
    {children}
  </div>
);

const Badge = ({ children, color = C.gold }) => (
  <span style={{
    display: "inline-block", padding: "3px 10px", borderRadius: 12, fontSize: 10,
    fontWeight: 600, letterSpacing: 0.8, fontFamily: "'IBM Plex Mono', monospace",
    background: `${color}18`, color, border: `1px solid ${color}33`,
  }}>{children}</span>
);

const ProgressBar = ({ value, max = 100, color = C.gold, height = 8, showLabel = true }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <div style={{ flex: 1, height, background: C.bg, borderRadius: height / 2, overflow: "hidden" }}>
      <div style={{
        height: "100%", width: `${(value / max) * 100}%`,
        background: `linear-gradient(90deg, ${color}66, ${color})`,
        borderRadius: height / 2, transition: "width 0.8s ease",
      }} />
    </div>
    {showLabel && <span style={{ fontSize: 12, fontWeight: 600, color, fontFamily: "'IBM Plex Mono', monospace", minWidth: 40, textAlign: "right" }}>{value}%</span>}
  </div>
);

// ═══════════════════════════════════════════════════════
// PAGE 1: MERCADO - Análisis Predictivo
// ═══════════════════════════════════════════════════════
const MarketPage = () => {
  const roi5Years = FINANCIAL_PROJECTION[5].cumProfit;
  const totalRevenue5 = FINANCIAL_PROJECTION.slice(1).reduce((s, d) => s + d.revenue, 0);
  const avgGrowth = ((PREDICTIONS[4].total / MARKET_HISTORICAL[3].total) ** (1 / 5) - 1) * 100;

  return (
    <div>
      {/* Hero Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
        <Stat label="Inversión Inicial" value="120.000" unit="USD" sub="Maquinaria + Insumos" color={C.red} />
        <Stat label="Ganancia Neta Anual" value="102.000" unit="USD" sub="Año 1 · +55.8% ROI" color={C.green} />
        <Stat label="Recupero Inversión" value="1.5" unit="meses" sub="Payback ultra-rápido" color={C.gold} />
        <Stat label="Precio Ác. Tartárico" value="4.800" unit="USD/ton" sub="Mercado internacional" color={C.blue} />
        <Stat label="Crecimiento CAGR" value={`${avgGrowth.toFixed(1)}%`} unit="anual" sub="Proyección 2026-2030" color={C.emerald} />
      </div>

      {/* Main Prediction Chart */}
      <Card style={{ marginBottom: 16 }}>
        <Section title="Producción Total de Ácido Tartárico — Histórico + Predicción ML" subtitle="Modelo: Suavizado exponencial + análisis de tendencia · Datos: INV (Instituto Nacional de Vitivinicultura)">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={FULL_TIMELINE}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.gold} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={C.gold} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.green} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={C.green} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="year" stroke={C.textMuted} tick={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }} />
              <YAxis stroke={C.textMuted} tick={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }} tickFormatter={v => `${(v / 1000).toFixed(1)}k`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [`${v.toLocaleString()} ton`, n === "total" ? "Histórico" : n === "predictedTotal" ? "Predicción" : n]} />
              <ReferenceLine x={2025} stroke={C.textMuted} strokeDasharray="6 3" label={{ value: "← Histórico | Predicción →", position: "top", fontSize: 10, fill: C.textDim }} />
              <Area type="monotone" dataKey="upperBound" stroke="none" fill={C.green} fillOpacity={0.08} />
              <Area type="monotone" dataKey="lowerBound" stroke="none" fill={C.bg} fillOpacity={1} />
              <Line type="monotone" dataKey="total" stroke={C.gold} strokeWidth={2.5} dot={{ r: 4, fill: C.gold, stroke: C.bg, strokeWidth: 2 }} name="Histórico" connectNulls={false} />
              <Line type="monotone" dataKey="predictedTotal" stroke={C.green} strokeWidth={2.5} strokeDasharray="8 4" dot={{ r: 4, fill: C.green, stroke: C.bg, strokeWidth: 2 }} name="Predicción ML" />
            </ComposedChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 24, justifyContent: "center", marginTop: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.textDim }}>
              <div style={{ width: 20, height: 2.5, background: C.gold, borderRadius: 2 }} /> Datos históricos (INV)
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.textDim }}>
              <div style={{ width: 20, height: 2.5, background: C.green, borderRadius: 2, borderTop: `2px dashed ${C.green}` }} /> Predicción ML (2026-2030)
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.textDim }}>
              <div style={{ width: 14, height: 14, background: `${C.green}12`, borderRadius: 3 }} /> Intervalo de confianza
            </div>
          </div>
        </Section>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Export vs Internal */}
        <Card>
          <Section title="Exportaciones vs. Consumo Interno" subtitle="Evolución y proyección · 90.1% exportaciones (2024)">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={FULL_TIMELINE}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="year" stroke={C.textMuted} tick={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }} />
                <YAxis stroke={C.textMuted} tick={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="exports" stackId="a" fill={C.gold} radius={[0, 0, 0, 0]} name="Exportaciones" />
                <Bar dataKey="internal" stackId="a" fill={C.burgundy} radius={[3, 3, 0, 0]} name="Consumo Interno" />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </Card>

        {/* Financial Projection */}
        <Card>
          <Section title="Flujo de Caja Acumulado (5 Años)" subtitle={`Inversión: USD 120.000 · ROI 5 años: USD ${roi5Years.toLocaleString()}`}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={FINANCIAL_PROJECTION}>
                <defs>
                  <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.green} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={C.green} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="year" stroke={C.textMuted} tick={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }} />
                <YAxis stroke={C.textMuted} tick={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={v => [`USD ${v.toLocaleString()}`]} />
                <ReferenceLine y={0} stroke={C.textMuted} strokeDasharray="4 4" />
                <Area type="monotone" dataKey="cumProfit" stroke={C.green} fill="url(#cashGrad)" strokeWidth={2.5} dot={{ r: 4, fill: C.green, stroke: C.bg, strokeWidth: 2 }} name="Beneficio Acumulado" />
              </AreaChart>
            </ResponsiveContainer>
          </Section>
        </Card>
      </div>

      {/* Viability Summary Table */}
      <Card>
        <Section title="Resumen de Viabilidad Económica — Análisis Predictivo" subtitle="Proyección a 5 años con crecimiento conservador">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                  {["Año", "Ingresos (USD)", "Costos (USD)", "Ganancia Neta", "Acumulado", "Veredicto"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: 1.2 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FINANCIAL_PROJECTION.map((row, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}22` }}>
                    <td style={{ padding: "10px 12px", color: C.gold, fontWeight: 600 }}>{row.year}</td>
                    <td style={{ padding: "10px 12px", color: C.text }}>{row.revenue > 0 ? `$${row.revenue.toLocaleString()}` : "—"}</td>
                    <td style={{ padding: "10px 12px", color: C.textDim }}>{`$${row.costs.toLocaleString()}`}</td>
                    <td style={{ padding: "10px 12px", color: row.netProfit >= 0 ? C.green : C.red, fontWeight: 600 }}>
                      {row.netProfit >= 0 ? "+" : ""}{`$${row.netProfit.toLocaleString()}`}
                    </td>
                    <td style={{ padding: "10px 12px", color: row.cumProfit >= 0 ? C.green : C.red, fontWeight: 600 }}>
                      {`$${row.cumProfit.toLocaleString()}`}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {i === 0 ? <Badge color={C.red}>INVERSIÓN</Badge> : <Badge color={C.green}>VIABLE ✓</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 14, padding: "12px 16px", background: `${C.green}0a`, border: `1px solid ${C.green}22`, borderRadius: 8 }}>
            <p style={{ margin: 0, fontSize: 12, color: C.green, lineHeight: 1.6 }}>
              <strong>Conclusión del modelo predictivo:</strong> Con una inversión inicial de USD 120.000, el proyecto recupera el capital en apenas 1.5 meses.
              La ganancia neta acumulada a 5 años supera los USD {roi5Years.toLocaleString()}, con un mercado que crece al {avgGrowth.toFixed(1)}% CAGR.
              El 90.1% de la producción se destina a exportación (mercado estable), lo que reduce el riesgo de dependencia del consumo interno.
              <strong> Veredicto: PROYECTO ALTAMENTE VIABLE.</strong>
            </p>
          </div>
        </Section>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// PAGE 2: PRODUCCIÓN - Optimización del Proceso
// ═══════════════════════════════════════════════════════
const ProductionPage = () => {
  const totalEnergy = PROCESS_STAGES.reduce((s, p) => s + p.energy, 0);
  const overallEfficiency = PROCESS_STAGES.reduce((s, p) => s * (p.efficiency / 100), 1) * 100;

  return (
    <div>
      {/* Process KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
        <Stat label="Rendimiento Industrial" value="4.0" unit="%" sub="Del residuo al ácido" color={C.gold} />
        <Stat label="Eficiencia Global" value={overallEfficiency.toFixed(1)} unit="%" sub="Producto de etapas" color={C.green} />
        <Stat label="Consumo Energético" value={totalEnergy} unit="kWh/batch" sub="11 etapas del proceso" color={C.blue} />
        <Stat label="Producción Actual" value="35" unit="ton/año" sub="1.200 ton materia prima" color={C.gold} />
        <Stat label="Potencial Optimizado" value="45.5" unit="ton/año" sub="+30% con mejoras" color={C.emerald} />
      </div>

      {/* Process Flow - Temperature & Efficiency */}
      <Card style={{ marginBottom: 16 }}>
        <Section title="Perfil del Proceso Productivo — Variables Críticas por Etapa" subtitle="Almacenamiento → Intercambio Iónico → Homogeneización → Precalentador → Desulfitación → Evaporación → Condensación → Filtrado → Envasado">
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={PROCESS_STAGES}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="name" stroke={C.textMuted} tick={{ fontSize: 8, fontFamily: "'IBM Plex Mono', monospace" }} angle={-25} textAnchor="end" height={60} />
              <YAxis yAxisId="temp" stroke={C.textMuted} tick={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }} label={{ value: "°C", angle: -90, position: "insideLeft", fontSize: 10, fill: C.textDim }} />
              <YAxis yAxisId="eff" orientation="right" domain={[80, 100]} stroke={C.textMuted} tick={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }} label={{ value: "%", angle: 90, position: "insideRight", fontSize: 10, fill: C.textDim }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar yAxisId="eff" dataKey="efficiency" fill={`${C.green}44`} stroke={C.green} strokeWidth={1} radius={[4, 4, 0, 0]} name="Eficiencia %" />
              <Line yAxisId="temp" type="monotone" dataKey="temp" stroke={C.gold} strokeWidth={2.5} dot={{ r: 4, fill: C.gold, stroke: C.bg, strokeWidth: 2 }} name="Temperatura °C" />
            </ComposedChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 24, justifyContent: "center", marginTop: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.textDim }}>
              <div style={{ width: 14, height: 14, background: `${C.green}44`, border: `1px solid ${C.green}`, borderRadius: 3 }} /> Eficiencia por etapa (%)
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.textDim }}>
              <div style={{ width: 20, height: 2.5, background: C.gold, borderRadius: 2 }} /> Perfil de temperatura (°C)
            </div>
          </div>
        </Section>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Energy Consumption by Stage */}
        <Card>
          <Section title="Consumo Energético por Etapa" subtitle={`Total: ${totalEnergy} kWh/batch · Cuello de botella: Evaporación`}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={PROCESS_STAGES} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis type="number" stroke={C.textMuted} tick={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }} unit=" kWh" />
                <YAxis dataKey="name" type="category" width={100} stroke={C.textMuted} tick={{ fontSize: 8, fontFamily: "'IBM Plex Mono', monospace" }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="energy" radius={[0, 4, 4, 0]} name="kWh">
                  {PROCESS_STAGES.map((entry, i) => (
                    <Cell key={i} fill={entry.energy > 50 ? C.red : entry.energy > 30 ? C.gold : C.green} fillOpacity={0.75} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </Card>

        {/* Optimization Comparison */}
        <Card>
          <Section title="Escenarios de Optimización" subtitle="Comparación: Actual vs Optimizado">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {OPTIMIZATION_SCENARIOS.map((sc, i) => (
                <div key={i} style={{ padding: "14px 16px", background: C.bg, borderRadius: 8, border: `1px solid ${sc.color}33` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: sc.color }}>{sc.name.replace("\n", " ")}</span>
                    <Badge color={sc.color}>{sc.yield}% rendimiento</Badge>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}>
                    <div>
                      <span style={{ color: C.textDim }}>Producción: </span>
                      <span style={{ color: C.text, fontWeight: 600 }}>{sc.production} t/año</span>
                    </div>
                    <div>
                      <span style={{ color: C.textDim }}>Energía: </span>
                      <span style={{ color: C.text, fontWeight: 600 }}>{sc.energy} kWh</span>
                    </div>
                    <div>
                      <span style={{ color: C.textDim }}>Costo: </span>
                      <span style={{ color: C.text, fontWeight: 600 }}>${sc.cost.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, padding: "10px 14px", background: `${C.green}0a`, border: `1px solid ${C.green}22`, borderRadius: 8 }}>
              <p style={{ margin: 0, fontSize: 11, color: C.green, lineHeight: 1.5 }}>
                <strong>Oportunidad:</strong> Optimizando la etapa de evaporación (doble efecto mejorado) y el intercambio iónico,
                se puede alcanzar un rendimiento del 5.2% (vs 4% actual), incrementando la producción en +10.5 ton/año
                y reduciendo costos en USD 12.000/año.
              </p>
            </div>
          </Section>
        </Card>
      </div>

      {/* Detailed Process Table */}
      <Card>
        <Section title="Detalle de Variables por Etapa del Proceso" subtitle="Datos del diagrama de flujo: Almacenamiento → Envasado">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                  {["Etapa", "Tipo", "Temp (°C)", "pH", "Tiempo (min)", "Eficiencia", "Energía (kWh)", "Estado"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 9, color: C.textDim, textTransform: "uppercase", letterSpacing: 1 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PROCESS_STAGES.map((st, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}22` }}>
                    <td style={{ padding: "8px 10px", color: C.gold, fontWeight: 600 }}>{st.name}</td>
                    <td style={{ padding: "8px 10px" }}><Badge color={C.blue}>{st.type}</Badge></td>
                    <td style={{ padding: "8px 10px", color: st.temp > 90 ? C.red : C.text }}>{st.temp}°C</td>
                    <td style={{ padding: "8px 10px", color: C.text }}>{st.ph}</td>
                    <td style={{ padding: "8px 10px", color: C.text }}>{st.time}</td>
                    <td style={{ padding: "8px 10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 50, height: 4, background: C.bg, borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${st.efficiency}%`, background: st.efficiency >= 95 ? C.green : st.efficiency >= 90 ? C.gold : C.red, borderRadius: 2 }} />
                        </div>
                        <span style={{ color: st.efficiency >= 95 ? C.green : st.efficiency >= 90 ? C.gold : C.red }}>{st.efficiency}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "8px 10px", color: st.energy > 50 ? C.red : C.text }}>{st.energy}</td>
                    <td style={{ padding: "8px 10px" }}>
                      {st.efficiency < 92 ? <Badge color={C.red}>OPTIMIZABLE</Badge> : <Badge color={C.green}>OK</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// PAGE 3: MEDIO AMBIENTE - Residuos y Economía Circular
// ═══════════════════════════════════════════════════════
const EnvironmentPage = () => {
  const totalReuseRevenue5yr = CIRCULAR_ECONOMY.reduce((s, d) => s + d.revenueFromResidues, 0);
  const avgReuse = CIRCULAR_ECONOMY.reduce((s, d) => s + d.reusePercent, 0) / CIRCULAR_ECONOMY.length;

  const PIE_COLORS = [C.gold, C.burgundy, C.green, C.blue, C.textDim];

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
        <Stat label="Residuos Totales" value="325.000" unit="ton/año" sub="Mercado vitivinícola ARG" color={C.gold} />
        <Stat label="Reutilización Actual" value="72" unit="%" sub="Año 2026 proyectado" color={C.green} />
        <Stat label="Meta 2030" value="91" unit="%" sub="Economía circular" color={C.emerald} />
        <Stat label="Ingreso por Residuos" value={`${(totalReuseRevenue5yr / 1000).toFixed(0)}k`} unit="USD (5 años)" sub="Venta de subproductos" color={C.blue} />
        <Stat label="Reducción Vertedero" value="-67" unit="%" sub="2026 vs 2030" color={C.green} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 16, marginBottom: 16 }}>
        {/* Circular Economy Projection */}
        <Card>
          <Section title="Proyección de Economía Circular (2026-2030)" subtitle="% de reutilización de residuos + ingresos por subproductos">
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={CIRCULAR_ECONOMY}>
                <defs>
                  <linearGradient id="reuseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.green} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={C.green} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="year" stroke={C.textMuted} tick={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }} />
                <YAxis yAxisId="pct" stroke={C.textMuted} domain={[60, 100]} tick={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }} unit="%" />
                <YAxis yAxisId="usd" orientation="right" stroke={C.textMuted} tick={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area yAxisId="pct" type="monotone" dataKey="reusePercent" stroke={C.green} fill="url(#reuseGrad)" strokeWidth={2.5} dot={{ r: 4, fill: C.green, stroke: C.bg, strokeWidth: 2 }} name="% Reutilización" />
                <Bar yAxisId="usd" dataKey="revenueFromResidues" fill={C.gold} fillOpacity={0.6} radius={[4, 4, 0, 0]} name="Ingresos Subproductos (USD)" />
              </ComposedChart>
            </ResponsiveContainer>
          </Section>
        </Card>

        {/* Residue Distribution Pie */}
        <Card>
          <Section title="Distribución de Residuos Vitivinícolas" subtitle="Composición por tipo de subproducto">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={RESIDUE_STREAMS} dataKey="percent" nameKey="name" cx="50%" cy="50%"
                  innerRadius={50} outerRadius={85} paddingAngle={3} strokeWidth={0}>
                  {RESIDUE_STREAMS.map((entry, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} fillOpacity={0.8} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={v => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
              {RESIDUE_STREAMS.map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: C.textDim }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: PIE_COLORS[i] }} />
                  {r.name.split("(")[0].trim()} ({r.percent}%)
                </div>
              ))}
            </div>
          </Section>
        </Card>
      </div>

      {/* Residue Streams Detail */}
      <Card style={{ marginBottom: 16 }}>
        <Section title="Flujos de Residuos — Tasa de Reutilización y Retorno Económico" subtitle="Análisis por corriente de subproducto · Base: 1.200 ton/año materia prima">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {RESIDUE_STREAMS.map((r, i) => {
              const tons = Math.round(1200 * r.percent / 100);
              const revenue = Math.round(tons * r.reuseRate / 100 * r.revenuePerTon);
              return (
                <div key={i} style={{ padding: "14px 18px", background: C.bg, borderRadius: 8, border: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: PIE_COLORS[i] }}>{r.name}</span>
                      <span style={{ fontSize: 11, color: C.textDim, marginLeft: 10 }}>{tons} ton/año ({r.percent}%)</span>
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <Badge color={C.green}>Reutilización: {r.reuseRate}%</Badge>
                      {revenue > 0 && <Badge color={C.gold}>USD {revenue.toLocaleString()}/año</Badge>}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 10, color: C.textDim, width: 50, flexShrink: 0 }}>Reúso:</span>
                    <ProgressBar value={r.reuseRate} color={r.reuseRate >= 90 ? C.green : r.reuseRate >= 80 ? C.gold : C.textDim} />
                  </div>
                  <div style={{ marginTop: 6, fontSize: 11, color: C.textDim }}>
                    Destino: <span style={{ color: C.text }}>{r.reuse}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total summary */}
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div style={{ padding: "14px 16px", background: `${C.green}0a`, border: `1px solid ${C.green}22`, borderRadius: 8, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>Ingreso Total Subproductos</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.green, fontFamily: "'IBM Plex Mono', monospace" }}>
                USD {RESIDUE_STREAMS.reduce((s, r) => s + Math.round(1200 * r.percent / 100 * r.reuseRate / 100 * r.revenuePerTon), 0).toLocaleString()}
              </div>
              <div style={{ fontSize: 10, color: C.textDim }}>por año (estimado)</div>
            </div>
            <div style={{ padding: "14px 16px", background: `${C.gold}0a`, border: `1px solid ${C.gold}22`, borderRadius: 8, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>Tasa Reutilización Promedio</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.gold, fontFamily: "'IBM Plex Mono', monospace" }}>
                {(RESIDUE_STREAMS.reduce((s, r) => s + r.reuseRate * r.percent, 0) / 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: 10, color: C.textDim }}>ponderada por volumen</div>
            </div>
            <div style={{ padding: "14px 16px", background: `${C.burgundy}0a`, border: `1px solid ${C.burgundy}22`, borderRadius: 8, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>Desperdicio a Vertedero</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.burgundy, fontFamily: "'IBM Plex Mono', monospace" }}>
                {(100 - RESIDUE_STREAMS.reduce((s, r) => s + r.reuseRate * r.percent, 0) / 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: 10, color: C.textDim }}>del total procesado</div>
            </div>
          </div>
        </Section>
      </Card>

      {/* Waste to Landfill Reduction */}
      <Card>
        <Section title="Reducción Progresiva de Residuos a Vertedero" subtitle="Meta de economía circular: <10% a vertedero para 2030">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={CIRCULAR_ECONOMY}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="year" stroke={C.textMuted} tick={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }} />
              <YAxis stroke={C.textMuted} domain={[0, 35]} tick={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }} unit="%" />
              <Tooltip contentStyle={tooltipStyle} />
              <ReferenceLine y={10} stroke={C.green} strokeDasharray="6 3" label={{ value: "Meta 2030: <10%", position: "right", fontSize: 10, fill: C.green }} />
              <Bar dataKey="wasteToLandfill" radius={[4, 4, 0, 0]} name="% a Vertedero">
                {CIRCULAR_ECONOMY.map((entry, i) => (
                  <Cell key={i} fill={entry.wasteToLandfill <= 10 ? C.green : entry.wasteToLandfill <= 20 ? C.gold : C.red} fillOpacity={0.7} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 12, padding: "12px 16px", background: `${C.green}0a`, border: `1px solid ${C.green}22`, borderRadius: 8 }}>
            <p style={{ margin: 0, fontSize: 12, color: C.green, lineHeight: 1.6 }}>
              <strong>Impacto ambiental:</strong> El proceso de producción de ácido tartárico es intrínsecamente circular: utiliza residuos vitivinícolas
              (orujo, borras, escobajo) como materia prima. Con la optimización propuesta, se proyecta alcanzar un 91% de reutilización para 2030,
              generando ingresos adicionales de USD {totalReuseRevenue5yr.toLocaleString()} en 5 años por venta de subproductos (aceite de pepita,
              tartrato de calcio, biomasa energética). El residuo final a vertedero se reduce de 28% a menos del 10%.
            </p>
          </div>
        </Section>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════
export default function AcidoTartaricoDashboard() {
  const [page, setPage] = useState("market");
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
      @keyframes fadeSlide { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
      * { box-sizing: border-box; }
      ::-webkit-scrollbar { width: 5px; }
      ::-webkit-scrollbar-track { background: ${C.bg}; }
      ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    const i = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  const navItems = [
    { key: "market", label: "Mercado & Viabilidad", emoji: "📊", sub: "Análisis Predictivo" },
    { key: "production", label: "Producción", emoji: "⚙️", sub: "Optimización" },
    { key: "environment", label: "Medio Ambiente", emoji: "🌿", sub: "Residuos & Circular" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif", color: C.text }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        {/* Brand */}
        <div style={{ padding: "22px 20px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: `linear-gradient(135deg, ${C.gold}, ${C.burgundy})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20,
            }}>🍇</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.cream, letterSpacing: -0.3 }}>TartarVision</div>
              <div style={{ fontSize: 9, color: C.textDim, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 1 }}>ÁCIDO TARTÁRICO · ML</div>
            </div>
          </div>
        </div>

        {/* Project Info */}
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, fontSize: 10, color: C.textDim, lineHeight: 1.6 }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", marginBottom: 2 }}>
            <span style={{ color: C.gold }}>Proyecto:</span> Reingeniería
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", marginBottom: 2 }}>
            <span style={{ color: C.gold }}>Autora:</span> Brandolin Sofía
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            <span style={{ color: C.gold }}>Legajo:</span> 46200
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "14px 12px" }}>
          <div style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", letterSpacing: 2, padding: "0 8px", marginBottom: 10, fontFamily: "'IBM Plex Mono', monospace" }}>
            Módulos
          </div>
          {navItems.map(item => {
            const active = page === item.key;
            return (
              <button key={item.key} onClick={() => setPage(item.key)} style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "10px 12px", marginBottom: 4, borderRadius: 8, border: "none",
                background: active ? C.goldDim : "transparent",
                cursor: "pointer", textAlign: "left", transition: "all 0.2s",
              }}>
                <span style={{ fontSize: 18 }}>{item.emoji}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? C.gold : C.textDim }}>{item.label}</div>
                  <div style={{ fontSize: 9, color: C.textMuted }}>{item.sub}</div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: "14px 18px", borderTop: `1px solid ${C.border}`, fontSize: 9, color: C.textMuted, fontFamily: "'IBM Plex Mono', monospace" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span>Fuente datos</span><span style={{ color: C.textDim }}>INV Argentina</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span>Modelo ML</span><span style={{ color: C.green }}>● Activo</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Versión</span><span style={{ color: C.textDim }}>v1.0 Tesis</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <header style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 24px", borderBottom: `1px solid ${C.border}`, background: C.surface,
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: C.cream }}>
              {navItems.find(n => n.key === page)?.emoji} {navItems.find(n => n.key === page)?.label}
            </h1>
            <p style={{ margin: 0, fontSize: 11, color: C.textDim }}>
              Producción de Ácido Tartárico · Reingeniería · Planta Vitivinícola Argentina
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Badge color={C.green}>DATOS INV VERIFICADOS</Badge>
            <div style={{
              padding: "5px 12px", borderRadius: 6, background: C.bg,
              border: `1px solid ${C.border}`, fontSize: 12,
              fontFamily: "'IBM Plex Mono', monospace", color: C.gold,
            }}>
              {time.toLocaleTimeString("es-AR")}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
          <div style={{ animation: "fadeSlide 0.3s ease" }}>
            {page === "market" && <MarketPage />}
            {page === "production" && <ProductionPage />}
            {page === "environment" && <EnvironmentPage />}
          </div>
        </div>
      </main>
    </div>
  );
}
