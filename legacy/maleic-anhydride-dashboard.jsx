import { useState, useEffect, useMemo } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ReferenceLine,
  ScatterChart, Scatter
} from "recharts";

// ═══════════════════════════════════════════════════════════════════
// ANHÍDRIDO MALEICO - Dashboard de Producción Industrial
// Reacción: C4H10 + 3.5 O2 → C4H2O3 + 4 H2O
// ═══════════════════════════════════════════════════════════════════

// CONSTANTES ESTEQUIOMÉTRICAS
const MOLECULAR_WEIGHTS = {
  nButane: 58.12,      // g/mol (C4H10)
  oxygen: 32.00,       // g/mol (O2)
  maleicAnhydride: 98.06, // g/mol (C4H2O3)
  water: 18.02,        // g/mol (H2O)
};

const STOICH_RATIOS = {
  oxygenToButane: 3.5,    // moles O2 / moles C4H10
  maleicToButane: 1.0,    // moles C4H2O3 / moles C4H10
  waterToButane: 4.0,     // moles H2O / moles C4H10
};

// DATOS DE PRODUCCIÓN
const PRODUCTION_DATA = {
  nButaneVolume: 1000,        // Litros de n-butano
  nButaneDensity: 0.573,      // kg/L a 25°C
  reactionYield: 68,          // % rendimiento real
  theoreticalYield: 100,      // % rendimiento teórico
  temperature: 420,           // °C temperatura del reactor
  pressure: 2.1,              // bar presión del reactor
  oxygenExcess: 15,           // % exceso de oxígeno
  catalystType: "V2O5-MoO3",  // Catalizador
  conversionRate: 95,         // % conversión de butano
};

// CÁLCULOS ESTEQUIOMÉTRICOS
const calculateProduction = () => {
  // 1. Masa de n-butano
  const massButane = PRODUCTION_DATA.nButaneVolume * PRODUCTION_DATA.nButaneDensity; // kg
  const massButaneGrams = massButane * 1000; // g
  
  // 2. Moles de n-butano
  const molesButane = massButaneGrams / MOLECULAR_WEIGHTS.nButane;
  
  // 3. Moles teóricas de anhídrido maleico
  const molesMATheoretical = molesButane * STOICH_RATIOS.maleicToButane;
  
  // 4. Masa teórica de anhídrido maleico
  const massMATheoretical = molesMATheoretical * MOLECULAR_WEIGHTS.maleicAnhydride;
  
  // 5. Masa real considerando conversión y rendimiento
  const massMAReal = massMATheoretical * 
                     (PRODUCTION_DATA.conversionRate / 100) * 
                     (PRODUCTION_DATA.reactionYield / 100);
  
  // 6. Oxígeno requerido (teórico)
  const molesO2Theoretical = molesButane * STOICH_RATIOS.oxygenToButane;
  const molesO2Real = molesO2Theoretical * (1 + PRODUCTION_DATA.oxygenExcess / 100);
  const massO2Real = molesO2Real * MOLECULAR_WEIGHTS.oxygen;
  
  // 7. Agua producida
  const molesWater = molesButane * STOICH_RATIOS.waterToButane * (PRODUCTION_DATA.conversionRate / 100);
  const massWater = molesWater * MOLECULAR_WEIGHTS.water;
  
  return {
    input: {
      butaneMass: massButane,
      butaneMoles: molesButane,
      oxygenMass: massO2Real / 1000, // kg
      oxygenMoles: molesO2Real,
    },
    output: {
      maleicAnhydrideMass: massMAReal / 1000, // kg
      maleicAnhydrideMoles: (massMAReal / MOLECULAR_WEIGHTS.maleicAnhydride),
      waterMass: massWater / 1000, // kg
      waterMoles: molesWater,
    },
    theoretical: {
      maleicAnhydrideMass: massMATheoretical / 1000, // kg
    },
    yields: {
      conversion: PRODUCTION_DATA.conversionRate,
      selectivity: PRODUCTION_DATA.reactionYield,
      overall: (PRODUCTION_DATA.conversionRate * PRODUCTION_DATA.reactionYield) / 100,
    }
  };
};

const CALC = calculateProduction();

// DATOS DE MONITOREO DEL REACTOR (24h histórico)
const generateReactorData = () => {
  const data = [];
  for (let h = 0; h < 24; h++) {
    const noise = () => (Math.random() - 0.5) * 2;
    data.push({
      hour: `${h}:00`,
      temperature: 420 + noise() * 8,
      pressure: 2.1 + noise() * 0.15,
      butaneFlow: 42 + noise() * 3,
      oxygenFlow: 147 + noise() * 8,
      yield: 68 + noise() * 4,
      conversion: 95 + noise() * 2,
    });
  }
  return data;
};

const REACTOR_HISTORY = generateReactorData();

// ETAPAS DEL PROCESO
const PROCESS_STAGES = [
  { name: "Vaporización", temp: 150, pressure: 1.0, energy: 85, efficiency: 98, status: "normal" },
  { name: "Mezclado", temp: 180, pressure: 1.2, energy: 45, efficiency: 99, status: "normal" },
  { name: "Precalentador", temp: 280, pressure: 1.8, energy: 120, efficiency: 96, status: "normal" },
  { name: "Reactor Catalítico", temp: 420, pressure: 2.1, energy: 450, efficiency: 95, status: "normal" },
  { name: "Enfriamiento 1°", temp: 250, pressure: 1.9, energy: 180, efficiency: 97, status: "normal" },
  { name: "Enfriamiento 2°", temp: 120, pressure: 1.5, energy: 150, efficiency: 98, status: "normal" },
  { name: "Absorción", temp: 50, pressure: 1.1, energy: 95, efficiency: 94, status: "warning" },
  { name: "Destilación", temp: 200, pressure: 0.5, energy: 280, efficiency: 92, status: "normal" },
  { name: "Purificación", temp: 165, pressure: 0.3, energy: 220, efficiency: 90, status: "normal" },
  { name: "Cristalización", temp: 60, pressure: 1.0, energy: 110, efficiency: 96, status: "normal" },
  { name: "Secado", temp: 85, pressure: 0.8, energy: 140, efficiency: 97, status: "normal" },
  { name: "Almacenamiento", temp: 25, pressure: 1.0, energy: 15, efficiency: 100, status: "normal" },
];

// ANÁLISIS DE CALIDAD DEL PRODUCTO
const QUALITY_DATA = [
  { batch: "MA-2026-001", purity: 99.5, color: "Blanco", moisture: 0.05, yield: 68.2, status: "Aprobado" },
  { batch: "MA-2026-002", purity: 99.7, color: "Blanco", moisture: 0.03, yield: 69.1, status: "Aprobado" },
  { batch: "MA-2026-003", purity: 99.3, color: "Amarillo claro", moisture: 0.08, yield: 66.5, status: "Rechazado" },
  { batch: "MA-2026-004", purity: 99.6, color: "Blanco", moisture: 0.04, yield: 68.8, status: "Aprobado" },
  { batch: "MA-2026-005", purity: 99.8, color: "Blanco", moisture: 0.02, yield: 70.2, status: "Aprobado" },
];

// DISTRIBUCIÓN DE PRODUCTOS
const PRODUCT_DISTRIBUTION = [
  { name: "Anhídrido Maleico", value: CALC.output.maleicAnhydrideMass, color: "#3b82f6" },
  { name: "Agua (subproducto)", value: CALC.output.waterMass, color: "#06b6d4" },
  { name: "CO/CO2 (gases)", value: CALC.input.butaneMass * 0.08, color: "#64748b" },
  { name: "n-Butano sin reaccionar", value: CALC.input.butaneMass * (1 - CALC.yields.conversion / 100), color: "#f59e0b" },
];

// ANÁLISIS ECONÓMICO
const ECONOMIC_DATA = {
  butanePrice: 0.85,              // USD/kg
  oxygenPrice: 0.12,              // USD/kg
  maleicAnhydridePrice: 2.45,     // USD/kg
  energyCost: 0.08,               // USD/kWh
  catalystCost: 450,              // USD/batch
  laborCost: 850,                 // USD/batch
  maintenanceCost: 320,           // USD/batch
};

const calculateEconomics = () => {
  const butaneCost = CALC.input.butaneMass * ECONOMIC_DATA.butanePrice;
  const oxygenCost = CALC.input.oxygenMass * ECONOMIC_DATA.oxygenPrice;
  const totalEnergy = PROCESS_STAGES.reduce((sum, s) => sum + s.energy, 0);
  const energyCost = totalEnergy * ECONOMIC_DATA.energyCost;
  
  const totalCost = butaneCost + oxygenCost + energyCost + 
                    ECONOMIC_DATA.catalystCost + 
                    ECONOMIC_DATA.laborCost + 
                    ECONOMIC_DATA.maintenanceCost;
  
  const revenue = CALC.output.maleicAnhydrideMass * ECONOMIC_DATA.maleicAnhydridePrice;
  const profit = revenue - totalCost;
  const profitMargin = (profit / revenue) * 100;
  
  return {
    costs: {
      butane: butaneCost,
      oxygen: oxygenCost,
      energy: energyCost,
      catalyst: ECONOMIC_DATA.catalystCost,
      labor: ECONOMIC_DATA.laborCost,
      maintenance: ECONOMIC_DATA.maintenanceCost,
      total: totalCost,
    },
    revenue: revenue,
    profit: profit,
    profitMargin: profitMargin,
    costPerKg: totalCost / CALC.output.maleicAnhydrideMass,
  };
};

const ECONOMICS = calculateEconomics();

// PROYECCIÓN DE PRODUCCIÓN (12 meses)
const PRODUCTION_FORECAST = Array.from({ length: 12 }, (_, i) => ({
  month: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"][i],
  production: CALC.output.maleicAnhydrideMass * (22 + Math.random() * 4), // batches/mes
  yield: 68 + (Math.random() - 0.5) * 6,
  quality: 99.5 + (Math.random() - 0.5) * 0.8,
}));

// ═══════════════════════════════════════════════════════
// COMPONENTES UI
// ═══════════════════════════════════════════════════════

const C = {
  // Tema industrial petroquímico
  bg: "#0a0e1a",
  card: "#111827",
  border: "#1f2937",
  primary: "#3b82f6",      // Azul tecnológico
  secondary: "#06b6d4",    // Cyan
  success: "#10b981",      // Verde
  warning: "#f59e0b",      // Ámbar
  danger: "#ef4444",       // Rojo
  text: "#f3f4f6",
  textMuted: "#9ca3af",
  accent1: "#8b5cf6",      // Violeta
  accent2: "#ec4899",      // Rosa
};

const Stat = ({ label, value, unit, trend, icon, color = C.primary }) => (
  <div className="stat-card" style={{
    background: `linear-gradient(135deg, ${C.card} 0%, ${color}15 100%)`,
    border: `1px solid ${color}40`,
    borderRadius: "12px",
    padding: "20px",
    position: "relative",
    overflow: "hidden",
    transition: "all 0.3s ease",
  }}>
    <div style={{ position: "relative", zIndex: 1 }}>
      <div style={{ 
        fontSize: "13px", 
        color: C.textMuted, 
        marginBottom: "8px",
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.5px"
      }}>
        {icon && <span style={{ marginRight: "6px" }}>{icon}</span>}
        {label}
      </div>
      <div style={{ 
        fontSize: "28px", 
        fontWeight: 700, 
        color: color,
        fontFamily: "monospace"
      }}>
        {value}
        {unit && <span style={{ fontSize: "16px", marginLeft: "6px", color: C.textMuted }}>{unit}</span>}
      </div>
      {trend !== undefined && (
        <div style={{ 
          marginTop: "8px", 
          fontSize: "12px",
          color: trend >= 0 ? C.success : C.danger,
          fontWeight: 600
        }}>
          {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
        </div>
      )}
    </div>
  </div>
);

const Section = ({ title, children, icon }) => (
  <div style={{ marginBottom: "32px" }}>
    <h2 style={{ 
      fontSize: "20px", 
      fontWeight: 700, 
      marginBottom: "16px",
      color: C.text,
      borderLeft: `4px solid ${C.primary}`,
      paddingLeft: "12px",
      display: "flex",
      alignItems: "center",
      gap: "8px"
    }}>
      {icon && <span>{icon}</span>}
      {title}
    </h2>
    {children}
  </div>
);

const Badge = ({ children, variant = "default" }) => {
  const colors = {
    default: { bg: C.primary, text: "#fff" },
    success: { bg: C.success, text: "#fff" },
    warning: { bg: C.warning, text: "#000" },
    danger: { bg: C.danger, text: "#fff" },
    info: { bg: C.secondary, text: "#fff" },
  };
  const c = colors[variant] || colors.default;
  return (
    <span style={{
      padding: "4px 12px",
      borderRadius: "6px",
      fontSize: "11px",
      fontWeight: 700,
      backgroundColor: c.bg,
      color: c.text,
      textTransform: "uppercase",
      letterSpacing: "0.5px"
    }}>
      {children}
    </span>
  );
};

// ═══════════════════════════════════════════════════════
// DASHBOARD PRINCIPAL
// ═══════════════════════════════════════════════════════

const MaleicAnhydrideDashboard = () => {
  const [activeView, setActiveView] = useState("production");
  const [liveData, setLiveData] = useState(REACTOR_HISTORY[REACTOR_HISTORY.length - 1]);

  useEffect(() => {
    const interval = setInterval(() => {
      const noise = () => (Math.random() - 0.5) * 2;
      setLiveData({
        hour: new Date().toLocaleTimeString(),
        temperature: 420 + noise() * 8,
        pressure: 2.1 + noise() * 0.15,
        butaneFlow: 42 + noise() * 3,
        oxygenFlow: 147 + noise() * 8,
        yield: 68 + noise() * 4,
        conversion: 95 + noise() * 2,
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const renderNavigation = () => (
    <div style={{ 
      display: "flex", 
      gap: "12px", 
      marginBottom: "24px",
      borderBottom: `2px solid ${C.border}`,
      paddingBottom: "12px"
    }}>
      {[
        { id: "production", label: "🏭 Producción", icon: "⚗️" },
        { id: "reactor", label: "⚛️ Reactor", icon: "🔥" },
        { id: "quality", label: "✓ Calidad", icon: "📊" },
        { id: "economics", label: "💰 Economía", icon: "💵" },
      ].map(view => (
        <button
          key={view.id}
          onClick={() => setActiveView(view.id)}
          style={{
            padding: "12px 24px",
            background: activeView === view.id 
              ? `linear-gradient(135deg, ${C.primary} 0%, ${C.accent1} 100%)`
              : C.card,
            border: `1px solid ${activeView === view.id ? C.primary : C.border}`,
            borderRadius: "8px",
            color: C.text,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "14px",
            transition: "all 0.3s ease",
            boxShadow: activeView === view.id ? `0 4px 12px ${C.primary}40` : "none",
          }}
        >
          <span style={{ marginRight: "6px" }}>{view.icon}</span>
          {view.label}
        </button>
      ))}
    </div>
  );

  const renderProduction = () => (
    <div>
      <Section title="Balance de Materia" icon="⚖️">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          <Stat 
            label="n-Butano Alimentado" 
            value={PRODUCTION_DATA.nButaneVolume} 
            unit="L"
            icon="🛢️"
            color={C.warning}
          />
          <Stat 
            label="Masa de n-Butano" 
            value={CALC.input.butaneMass.toFixed(1)} 
            unit="kg"
            icon="⚖️"
            color={C.warning}
          />
          <Stat 
            label="Oxígeno Requerido" 
            value={CALC.input.oxygenMass.toFixed(1)} 
            unit="kg"
            icon="💨"
            color={C.secondary}
          />
          <Stat 
            label="Anhídrido Maleico Obtenido" 
            value={CALC.output.maleicAnhydrideMass.toFixed(2)} 
            unit="kg"
            icon="⭐"
            color={C.primary}
            trend={2.3}
          />
        </div>

        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          marginTop: "24px" 
        }}>
          <div style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: "12px",
            padding: "20px"
          }}>
            <h3 style={{ color: C.text, marginBottom: "16px", fontSize: "16px", fontWeight: 600 }}>
              📊 Distribución de Productos
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={PRODUCT_DISTRIBUTION}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(entry) => `${entry.name}: ${entry.value.toFixed(1)} kg`}
                  labelLine={{ stroke: C.textMuted, strokeWidth: 1 }}
                >
                  {PRODUCT_DISTRIBUTION.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: C.card, 
                    border: `1px solid ${C.border}`,
                    borderRadius: "8px",
                    color: C.text
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: "12px",
            padding: "20px"
          }}>
            <h3 style={{ color: C.text, marginBottom: "16px", fontSize: "16px", fontWeight: 600 }}>
              🎯 Rendimientos del Proceso
            </h3>
            <div style={{ marginTop: "24px" }}>
              {[
                { label: "Conversión de n-Butano", value: CALC.yields.conversion, color: C.primary },
                { label: "Selectividad a MA", value: CALC.yields.selectivity, color: C.secondary },
                { label: "Rendimiento Global", value: CALC.yields.overall.toFixed(1), color: C.success },
              ].map((item, idx) => (
                <div key={idx} style={{ marginBottom: "20px" }}>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    marginBottom: "8px",
                    color: C.text,
                    fontSize: "13px",
                    fontWeight: 500
                  }}>
                    <span>{item.label}</span>
                    <span style={{ color: item.color, fontWeight: 700, fontFamily: "monospace" }}>
                      {item.value}%
                    </span>
                  </div>
                  <div style={{
                    width: "100%",
                    height: "8px",
                    background: C.border,
                    borderRadius: "4px",
                    overflow: "hidden"
                  }}>
                    <div style={{
                      width: `${item.value}%`,
                      height: "100%",
                      background: `linear-gradient(90deg, ${item.color} 0%, ${item.color}dd 100%)`,
                      transition: "width 0.5s ease"
                    }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: "24px",
              padding: "16px",
              background: `${C.primary}15`,
              borderLeft: `4px solid ${C.primary}`,
              borderRadius: "8px"
            }}>
              <div style={{ fontSize: "12px", color: C.textMuted, marginBottom: "4px" }}>
                PRODUCCIÓN TEÓRICA MÁXIMA
              </div>
              <div style={{ fontSize: "20px", fontWeight: 700, color: C.primary }}>
                {CALC.theoretical.maleicAnhydrideMass.toFixed(2)} kg
              </div>
              <div style={{ fontSize: "11px", color: C.textMuted, marginTop: "4px" }}>
                Rendimiento real: {CALC.yields.overall.toFixed(1)}% del teórico
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Reacción Química" icon="⚗️">
        <div style={{
          background: `linear-gradient(135deg, ${C.card} 0%, ${C.primary}10 100%)`,
          border: `1px solid ${C.primary}40`,
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "20px"
        }}>
          <div style={{ 
            textAlign: "center", 
            fontSize: "20px", 
            fontFamily: "monospace",
            color: C.text,
            fontWeight: 600,
            letterSpacing: "1px"
          }}>
            C₄H₁₀ + 3.5 O₂ → C₄H₂O₃ + 4 H₂O
          </div>
          <div style={{ 
            textAlign: "center", 
            fontSize: "13px", 
            color: C.textMuted,
            marginTop: "12px"
          }}>
            <div>n-Butano + Oxígeno → Anhídrido Maleico + Agua</div>
            <div style={{ marginTop: "8px" }}>
              Catalizador: <Badge variant="info">{PRODUCTION_DATA.catalystType}</Badge>
              {" | "}
              T = <Badge variant="danger">{PRODUCTION_DATA.temperature}°C</Badge>
              {" | "}
              P = <Badge variant="warning">{PRODUCTION_DATA.pressure} bar</Badge>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Diagrama de Proceso" icon="🔄">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={PROCESS_STAGES}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis 
              dataKey="name" 
              stroke={C.textMuted} 
              angle={-45}
              textAnchor="end"
              height={100}
              tick={{ fill: C.textMuted, fontSize: 11 }}
            />
            <YAxis stroke={C.textMuted} tick={{ fill: C.textMuted }} />
            <Tooltip 
              contentStyle={{ 
                background: C.card, 
                border: `1px solid ${C.border}`,
                borderRadius: "8px",
                color: C.text
              }}
            />
            <Legend />
            <Bar dataKey="temp" fill={C.danger} name="Temperatura (°C)" />
            <Bar dataKey="energy" fill={C.warning} name="Energía (kW)" />
            <Bar dataKey="efficiency" fill={C.success} name="Eficiencia (%)" />
          </BarChart>
        </ResponsiveContainer>
      </Section>

      <Section title="Pronóstico de Producción (12 meses)" icon="📈">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={PRODUCTION_FORECAST}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="month" stroke={C.textMuted} tick={{ fill: C.textMuted }} />
            <YAxis yAxisId="left" stroke={C.textMuted} tick={{ fill: C.textMuted }} />
            <YAxis yAxisId="right" orientation="right" stroke={C.textMuted} tick={{ fill: C.textMuted }} />
            <Tooltip 
              contentStyle={{ 
                background: C.card, 
                border: `1px solid ${C.border}`,
                borderRadius: "8px",
                color: C.text
              }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="production" fill={C.primary} name="Producción (kg)" />
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="yield" 
              stroke={C.success} 
              strokeWidth={3}
              name="Rendimiento (%)"
              dot={{ fill: C.success, r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Section>
    </div>
  );

  const renderReactor = () => (
    <div>
      <Section title="Monitoreo en Tiempo Real" icon="📡">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          <Stat 
            label="Temperatura" 
            value={liveData.temperature.toFixed(1)} 
            unit="°C"
            icon="🌡️"
            color={C.danger}
          />
          <Stat 
            label="Presión" 
            value={liveData.pressure.toFixed(2)} 
            unit="bar"
            icon="🔘"
            color={C.warning}
          />
          <Stat 
            label="Flujo n-Butano" 
            value={liveData.butaneFlow.toFixed(1)} 
            unit="kg/h"
            icon="⛽"
            color={C.secondary}
          />
          <Stat 
            label="Flujo Oxígeno" 
            value={liveData.oxygenFlow.toFixed(1)} 
            unit="kg/h"
            icon="💨"
            color={C.primary}
          />
          <Stat 
            label="Rendimiento" 
            value={liveData.yield.toFixed(1)} 
            unit="%"
            icon="🎯"
            color={C.success}
          />
          <Stat 
            label="Conversión" 
            value={liveData.conversion.toFixed(1)} 
            unit="%"
            icon="⚡"
            color={C.accent1}
          />
        </div>
      </Section>

      <Section title="Histórico de Operación (24h)" icon="📊">
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={REACTOR_HISTORY}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="hour" stroke={C.textMuted} tick={{ fill: C.textMuted }} />
            <YAxis yAxisId="left" stroke={C.textMuted} tick={{ fill: C.textMuted }} />
            <YAxis yAxisId="right" orientation="right" stroke={C.textMuted} tick={{ fill: C.textMuted }} />
            <Tooltip 
              contentStyle={{ 
                background: C.card, 
                border: `1px solid ${C.border}`,
                borderRadius: "8px",
                color: C.text
              }}
            />
            <Legend />
            <Area 
              yAxisId="left"
              type="monotone" 
              dataKey="temperature" 
              fill={`${C.danger}40`}
              stroke={C.danger}
              strokeWidth={2}
              name="Temperatura (°C)"
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="yield" 
              stroke={C.success}
              strokeWidth={3}
              name="Rendimiento (%)"
              dot={false}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="conversion" 
              stroke={C.primary}
              strokeWidth={3}
              name="Conversión (%)"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Section>

      <Section title="Estado de Equipos" icon="⚙️">
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "12px" 
        }}>
          {PROCESS_STAGES.map((stage, idx) => (
            <div
              key={idx}
              style={{
                background: C.card,
                border: `1px solid ${
                  stage.status === "normal" ? C.success :
                  stage.status === "warning" ? C.warning : C.danger
                }`,
                borderRadius: "8px",
                padding: "16px",
                transition: "all 0.3s ease",
              }}
            >
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px"
              }}>
                <span style={{ color: C.text, fontWeight: 600, fontSize: "14px" }}>
                  {stage.name}
                </span>
                <Badge variant={
                  stage.status === "normal" ? "success" :
                  stage.status === "warning" ? "warning" : "danger"
                }>
                  {stage.status === "normal" ? "✓ OK" : "⚠ Alert"}
                </Badge>
              </div>
              <div style={{ fontSize: "12px", color: C.textMuted }}>
                <div>Temp: <span style={{ color: C.danger }}>{stage.temp}°C</span></div>
                <div>Presión: <span style={{ color: C.warning }}>{stage.pressure} bar</span></div>
                <div>Eficiencia: <span style={{ color: C.success }}>{stage.efficiency}%</span></div>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );

  const renderQuality = () => (
    <div>
      <Section title="Control de Calidad - Lotes Recientes" icon="🔬">
        <div style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: "12px",
          overflow: "hidden"
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.primary, color: "#fff" }}>
                <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", fontWeight: 600 }}>Lote</th>
                <th style={{ padding: "12px", textAlign: "center", fontSize: "13px", fontWeight: 600 }}>Pureza (%)</th>
                <th style={{ padding: "12px", textAlign: "center", fontSize: "13px", fontWeight: 600 }}>Color</th>
                <th style={{ padding: "12px", textAlign: "center", fontSize: "13px", fontWeight: 600 }}>Humedad (%)</th>
                <th style={{ padding: "12px", textAlign: "center", fontSize: "13px", fontWeight: 600 }}>Rendimiento (%)</th>
                <th style={{ padding: "12px", textAlign: "center", fontSize: "13px", fontWeight: 600 }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {QUALITY_DATA.map((row, idx) => (
                <tr 
                  key={idx}
                  style={{ 
                    borderBottom: `1px solid ${C.border}`,
                    background: idx % 2 === 0 ? C.card : `${C.primary}05`
                  }}
                >
                  <td style={{ padding: "12px", color: C.text, fontFamily: "monospace", fontSize: "12px" }}>
                    {row.batch}
                  </td>
                  <td style={{ padding: "12px", textAlign: "center", color: C.primary, fontWeight: 700 }}>
                    {row.purity}
                  </td>
                  <td style={{ padding: "12px", textAlign: "center", color: C.textMuted }}>
                    {row.color}
                  </td>
                  <td style={{ padding: "12px", textAlign: "center", color: C.secondary }}>
                    {row.moisture}
                  </td>
                  <td style={{ padding: "12px", textAlign: "center", color: C.success, fontWeight: 600 }}>
                    {row.yield}
                  </td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <Badge variant={row.status === "Aprobado" ? "success" : "danger"}>
                      {row.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Distribución de Pureza" icon="📊">
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis 
              type="number" 
              dataKey="yield" 
              name="Rendimiento"
              unit="%"
              stroke={C.textMuted}
              tick={{ fill: C.textMuted }}
            />
            <YAxis 
              type="number" 
              dataKey="purity" 
              name="Pureza"
              unit="%"
              stroke={C.textMuted}
              tick={{ fill: C.textMuted }}
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ 
                background: C.card, 
                border: `1px solid ${C.border}`,
                borderRadius: "8px",
                color: C.text
              }}
            />
            <Scatter 
              data={QUALITY_DATA} 
              fill={C.primary}
              name="Lotes"
            >
              {QUALITY_DATA.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.status === "Aprobado" ? C.success : C.danger} 
                />
              ))}
            </Scatter>
            <ReferenceLine 
              y={99.5} 
              stroke={C.success} 
              strokeDasharray="3 3"
              label={{ value: "Mínimo Aprobado", fill: C.success, fontSize: 12 }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </Section>

      <Section title="Especificaciones del Producto" icon="📋">
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "16px"
        }}>
          {[
            { label: "Pureza Mínima", value: "99.5%", spec: "≥ 99.5%", status: "success" },
            { label: "Humedad Máxima", value: "0.08%", spec: "≤ 0.1%", status: "success" },
            { label: "Color", value: "Blanco", spec: "Blanco cristalino", status: "success" },
            { label: "Punto de Fusión", value: "52.8°C", spec: "52-53°C", status: "success" },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                background: `${C[item.status]}10`,
                border: `1px solid ${C[item.status]}`,
                borderRadius: "10px",
                padding: "18px"
              }}
            >
              <div style={{ fontSize: "12px", color: C.textMuted, marginBottom: "6px" }}>
                {item.label}
              </div>
              <div style={{ fontSize: "20px", fontWeight: 700, color: C[item.status], marginBottom: "4px" }}>
                {item.value}
              </div>
              <div style={{ fontSize: "11px", color: C.textMuted }}>
                Especificación: {item.spec}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );

  const renderEconomics = () => (
    <div>
      <Section title="Análisis Económico del Batch" icon="💰">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          <Stat 
            label="Ingresos Totales" 
            value={ECONOMICS.revenue.toFixed(2)} 
            unit="USD"
            icon="💵"
            color={C.success}
          />
          <Stat 
            label="Costos Totales" 
            value={ECONOMICS.costs.total.toFixed(2)} 
            unit="USD"
            icon="💸"
            color={C.danger}
          />
          <Stat 
            label="Beneficio Neto" 
            value={ECONOMICS.profit.toFixed(2)} 
            unit="USD"
            icon="💰"
            color={C.primary}
            trend={5.2}
          />
          <Stat 
            label="Margen de Beneficio" 
            value={ECONOMICS.profitMargin.toFixed(1)} 
            unit="%"
            icon="📈"
            color={C.accent1}
          />
        </div>
      </Section>

      <Section title="Desglose de Costos" icon="📊">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: "12px",
            padding: "20px"
          }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: "n-Butano", value: ECONOMICS.costs.butane, color: C.warning },
                    { name: "Oxígeno", value: ECONOMICS.costs.oxygen, color: C.secondary },
                    { name: "Energía", value: ECONOMICS.costs.energy, color: C.danger },
                    { name: "Catalizador", value: ECONOMICS.costs.catalyst, color: C.accent1 },
                    { name: "Mano de Obra", value: ECONOMICS.costs.labor, color: C.primary },
                    { name: "Mantenimiento", value: ECONOMICS.costs.maintenance, color: C.success },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(entry) => `${entry.name}: $${entry.value.toFixed(0)}`}
                  labelLine={{ stroke: C.textMuted, strokeWidth: 1 }}
                >
                  {[C.warning, C.secondary, C.danger, C.accent1, C.primary, C.success].map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: C.card, 
                    border: `1px solid ${C.border}`,
                    borderRadius: "8px",
                    color: C.text
                  }}
                  formatter={(value) => `$${value.toFixed(2)}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: "12px",
            padding: "20px"
          }}>
            <h3 style={{ color: C.text, marginBottom: "20px", fontSize: "16px", fontWeight: 600 }}>
              Detalle de Costos
            </h3>
            {[
              { label: "n-Butano", value: ECONOMICS.costs.butane, icon: "⛽", color: C.warning },
              { label: "Oxígeno", value: ECONOMICS.costs.oxygen, icon: "💨", color: C.secondary },
              { label: "Energía", value: ECONOMICS.costs.energy, icon: "⚡", color: C.danger },
              { label: "Catalizador", value: ECONOMICS.costs.catalyst, icon: "🧪", color: C.accent1 },
              { label: "Mano de Obra", value: ECONOMICS.costs.labor, icon: "👷", color: C.primary },
              { label: "Mantenimiento", value: ECONOMICS.costs.maintenance, icon: "🔧", color: C.success },
            ].map((item, idx) => (
              <div 
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px",
                  marginBottom: "8px",
                  background: `${item.color}10`,
                  borderLeft: `4px solid ${item.color}`,
                  borderRadius: "6px"
                }}
              >
                <span style={{ color: C.text, fontSize: "13px" }}>
                  <span style={{ marginRight: "8px" }}>{item.icon}</span>
                  {item.label}
                </span>
                <span style={{ color: item.color, fontWeight: 700, fontFamily: "monospace" }}>
                  ${item.value.toFixed(2)}
                </span>
              </div>
            ))}
            <div style={{
              marginTop: "16px",
              paddingTop: "16px",
              borderTop: `2px solid ${C.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <span style={{ color: C.text, fontWeight: 700, fontSize: "15px" }}>
                TOTAL
              </span>
              <span style={{ color: C.primary, fontWeight: 700, fontSize: "18px", fontFamily: "monospace" }}>
                ${ECONOMICS.costs.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Métricas de Rentabilidad" icon="📈">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px" }}>
          {[
            { 
              label: "Costo por kg de MA", 
              value: `$${ECONOMICS.costPerKg.toFixed(2)}`,
              desc: "Costo unitario de producción",
              color: C.warning 
            },
            { 
              label: "Precio de Venta", 
              value: `$${ECONOMIC_DATA.maleicAnhydridePrice.toFixed(2)}`,
              desc: "Por kg en el mercado",
              color: C.success 
            },
            { 
              label: "Beneficio por kg", 
              value: `$${(ECONOMIC_DATA.maleicAnhydridePrice - ECONOMICS.costPerKg).toFixed(2)}`,
              desc: "Margen unitario",
              color: C.primary 
            },
            { 
              label: "ROI del Batch", 
              value: `${((ECONOMICS.profit / ECONOMICS.costs.total) * 100).toFixed(1)}%`,
              desc: "Retorno sobre inversión",
              color: C.accent1 
            },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                background: `linear-gradient(135deg, ${C.card} 0%, ${item.color}15 100%)`,
                border: `1px solid ${item.color}40`,
                borderRadius: "10px",
                padding: "20px"
              }}
            >
              <div style={{ fontSize: "12px", color: C.textMuted, marginBottom: "8px", textTransform: "uppercase" }}>
                {item.label}
              </div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: item.color, marginBottom: "6px" }}>
                {item.value}
              </div>
              <div style={{ fontSize: "11px", color: C.textMuted }}>
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Comparación de Escenarios" icon="🔄">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart 
            data={[
              { scenario: "Actual (68%)", revenue: ECONOMICS.revenue, costs: ECONOMICS.costs.total, profit: ECONOMICS.profit },
              { scenario: "Optimizado (75%)", revenue: ECONOMICS.revenue * 1.1, costs: ECONOMICS.costs.total, profit: ECONOMICS.profit * 1.5 },
              { scenario: "Máximo (82%)", revenue: ECONOMICS.revenue * 1.2, costs: ECONOMICS.costs.total * 1.05, profit: ECONOMICS.profit * 1.8 },
            ]}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="scenario" stroke={C.textMuted} tick={{ fill: C.textMuted }} />
            <YAxis stroke={C.textMuted} tick={{ fill: C.textMuted }} />
            <Tooltip 
              contentStyle={{ 
                background: C.card, 
                border: `1px solid ${C.border}`,
                borderRadius: "8px",
                color: C.text
              }}
              formatter={(value) => `$${value.toFixed(2)}`}
            />
            <Legend />
            <Bar dataKey="revenue" fill={C.success} name="Ingresos (USD)" />
            <Bar dataKey="costs" fill={C.danger} name="Costos (USD)" />
            <Bar dataKey="profit" fill={C.primary} name="Beneficio (USD)" />
          </BarChart>
        </ResponsiveContainer>
      </Section>
    </div>
  );

  return (
    <div style={{ 
      background: C.bg,
      minHeight: "100vh",
      padding: "24px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: C.text
    }}>
      <div style={{ maxWidth: "1600px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ 
          marginBottom: "32px",
          borderBottom: `3px solid ${C.primary}`,
          paddingBottom: "20px"
        }}>
          <h1 style={{ 
            fontSize: "36px", 
            fontWeight: 800,
            background: `linear-gradient(135deg, ${C.primary} 0%, ${C.secondary} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: "8px"
          }}>
            ⚗️ PRODUCCIÓN DE ANHÍDRIDO MALEICO
          </h1>
          <p style={{ color: C.textMuted, fontSize: "14px" }}>
            Sistema de Monitoreo y Control Industrial | Oxidación Catalítica de n-Butano
          </p>
        </div>

        {/* Navigation */}
        {renderNavigation()}

        {/* Content */}
        {activeView === "production" && renderProduction()}
        {activeView === "reactor" && renderReactor()}
        {activeView === "quality" && renderQuality()}
        {activeView === "economics" && renderEconomics()}
      </div>
    </div>
  );
};

export default MaleicAnhydrideDashboard;
