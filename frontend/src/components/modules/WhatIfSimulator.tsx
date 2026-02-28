// ============================================================
// PetroVision — What-If Process Simulator
// ============================================================
// Simulates steady-state process behavior using simplified
// thermodynamic & kinetic models. Users can tweak operating
// variables and see predicted impact on conversion, yield,
// production rate, economics, and alarm risk.
// ============================================================

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
  BarChart, Bar, Cell, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import {
  FlaskConical, Play, RotateCcw, AlertTriangle, TrendingUp,
  DollarSign, Thermometer, Gauge, Droplets, Zap, Download,
  ChevronDown, ChevronUp, Beaker, Activity, BarChart3, Target,
} from 'lucide-react';
import { useProcess } from '@/hooks/useProcess';

// ── Process kinetic models ──────────────────────────────────
// Simplified Arrhenius & mass balance correlations based on
// real process parameters from seed data.

interface SimVariable {
  key: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  default: number;
  category: 'temperature' | 'pressure' | 'flow' | 'composition';
  icon: typeof Thermometer;
  description: string;
}

interface SimResult {
  conversion: number;
  selectivity: number;
  yieldGlobal: number;
  productionRate: number;
  productPurity: number;
  feedRate: number;
  energyCost: number;
  rawMaterialCost: number;
  revenue: number;
  profit: number;
  alarmRisk: number;          // 0-1
  hotspotRisk: number;        // 0-1
  catalystLife: number;       // hours remaining
  specificEnergy: number;     // kWh/kg product
  co2Emission: number;        // kg CO₂/kg product
  warnings: string[];
}

// ── MA-100 variables ────────────────────────────────────────
const MA100_VARS: SimVariable[] = [
  { key: 'T_reactor', label: 'Temperatura Reactor', unit: '°C', min: 350, max: 480, step: 1, default: 420, category: 'temperature', icon: Thermometer, description: 'Temperatura del reactor de lecho fijo. Afecta conversión y selectividad.' },
  { key: 'P_reactor', label: 'Presión Reactor', unit: 'bar', min: 1.0, max: 3.5, step: 0.05, default: 2.1, category: 'pressure', icon: Gauge, description: 'Presión operativa del reactor. Afecta tiempo de residencia y conversión.' },
  { key: 'F_butano', label: 'Flujo n-Butano', unit: 'kg/h', min: 200, max: 500, step: 5, default: 340.18, category: 'flow', icon: Droplets, description: 'Caudal de alimentación de n-butano al reactor.' },
  { key: 'F_aire', label: 'Flujo Aire', unit: 'kg/h', min: 800, max: 1600, step: 10, default: 1200, category: 'flow', icon: Droplets, description: 'Caudal de aire (O₂) al reactor. Relación estequiométrica crítica.' },
  { key: 'T_coolant', label: 'Temp. Refrigerante', unit: '°C', min: 30, max: 80, step: 1, default: 50, category: 'temperature', icon: Thermometer, description: 'Temperatura del medio enfriante. Controla remoción de calor.' },
  { key: 'T_distill', label: 'Temp. Destilación', unit: '°C', min: 140, max: 220, step: 1, default: 180, category: 'temperature', icon: Thermometer, description: 'Temperatura cabeza columna destilación. Afecta pureza.' },
  { key: 'catalyst_age', label: 'Edad Catalizador', unit: 'días', min: 0, max: 365, step: 5, default: 60, category: 'composition', icon: Beaker, description: 'Días desde la última carga de catalizador V₂O₅-MoO₃/TiO₂.' },
];

// ── AT-200 variables ────────────────────────────────────────
const AT200_VARS: SimVariable[] = [
  { key: 'T_desulf', label: 'Temp. Desulfitación', unit: '°C', min: 60, max: 110, step: 1, default: 85, category: 'temperature', icon: Thermometer, description: 'Temperatura de la etapa de desulfitación del orujo.' },
  { key: 'T_evap1', label: 'Temp. Evaporador 1°', unit: '°C', min: 50, max: 100, step: 1, default: 70, category: 'temperature', icon: Thermometer, description: 'Temperatura del primer efecto de evaporación.' },
  { key: 'T_evap2', label: 'Temp. Evaporador 2°', unit: '°C', min: 55, max: 105, step: 1, default: 80, category: 'temperature', icon: Thermometer, description: 'Temperatura del segundo efecto de evaporación.' },
  { key: 'T_crystal', label: 'Temp. Cristalización', unit: '°C', min: -5, max: 20, step: 0.5, default: 5, category: 'temperature', icon: Thermometer, description: 'Temperatura de cristalización. Menor T → mayor pureza pero menor velocidad.' },
  { key: 'P_evap', label: 'Presión Evaporador', unit: 'bar', min: 0.3, max: 1.5, step: 0.05, default: 1.0, category: 'pressure', icon: Gauge, description: 'Presión del sistema de evaporación. Vacío mejora eficiencia.' },
  { key: 'F_orujo', label: 'Flujo Orujo', unit: 'kg/h', min: 30, max: 120, step: 2, default: 71.4, category: 'flow', icon: Droplets, description: 'Caudal de materia prima (orujo + borras vitivinícolas).' },
  { key: 'acid_conc', label: 'Conc. H₂SO₄', unit: '%', min: 5, max: 40, step: 1, default: 20, category: 'composition', icon: Beaker, description: 'Concentración de ácido sulfúrico para la reacción de tartrato.' },
  { key: 'tartrate_content', label: 'Contenido Tartrato', unit: '%', min: 2, max: 8, step: 0.5, default: 5, category: 'composition', icon: Beaker, description: '% de tartrato de calcio en la materia prima (varía por cosecha).' },
];

// ── Kinetic model: MA-100 ───────────────────────────────────
function simulateMA100(vars: Record<string, number>): SimResult {
  const T = vars.T_reactor;       // °C
  const P = vars.P_reactor;       // bar
  const Fb = vars.F_butano;       // kg/h
  const Fair = vars.F_aire;       // kg/h
  const Tcool = vars.T_coolant;   // °C
  const Tdist = vars.T_distill;   // °C
  const catAge = vars.catalyst_age; // days

  const warnings: string[] = [];

  // Arrhenius-like conversion: peaks around 420°C
  const Ea = 85000;    // J/mol (activation energy)
  const R = 8.314;
  const Tref = 420 + 273.15;
  const Tk = T + 273.15;
  const kRatio = Math.exp((Ea / R) * (1 / Tref - 1 / Tk));

  // Molar ratio: need 3.5 mol O₂ per mol C₄H₁₀
  const molC4 = Fb / 58.12;             // mol/h butane
  const molO2 = (Fair * 0.21) / 32;     // mol/h O₂ (21% of air)
  const ratio = molO2 / (molC4 * 3.5);  // ideal = 1.0

  // Base conversion with temperature effect
  let conversion = 0.77 * kRatio;

  // Excess O₂ helps, but diminishing returns
  const ratioFactor = ratio < 0.8 ? ratio / 0.8 : Math.min(1.0, 0.85 + 0.15 * Math.min(ratio, 2));
  conversion *= ratioFactor;

  // Pressure effect: higher P → more residence time → higher conversion
  conversion *= Math.pow(P / 2.1, 0.25);

  // Catalyst deactivation: loses ~0.05%/day
  const catFactor = Math.max(0.7, 1 - catAge * 0.0005);
  conversion *= catFactor;

  // Clamp conversion
  conversion = Math.max(0.1, Math.min(0.95, conversion));

  // Selectivity: decreases at very high T (over-oxidation to CO₂)
  let selectivity = 0.80;
  if (T > 440) selectivity -= (T - 440) * 0.005;
  if (T < 390) selectivity -= (390 - T) * 0.003;  // too cold → side reactions
  selectivity *= (ratio < 0.9 ? 0.9 + 0.1 * ratio : ratio > 1.5 ? 1.05 - 0.05 * (ratio - 1.5) : 1.0);
  selectivity = Math.max(0.3, Math.min(0.95, selectivity));

  // Yield
  const yieldGlobal = conversion * selectivity;

  // Production rate
  const productionRate = Fb * yieldGlobal * (98.06 / 58.12);

  // Purity: affected by distillation temp
  let purity = 99.5;
  if (Tdist < 170) purity -= (170 - Tdist) * 0.1;
  if (Tdist > 200) purity -= (Tdist - 200) * 0.05;
  purity = Math.max(95, Math.min(99.9, purity));

  // Energy cost: reactor heating + cooling + compression + distillation
  const heatDuty = Fb * 2.0 * Math.max(0, T - Tcool);     // kJ/h simplified
  const energyCost = (heatDuty * 0.00003 + Fair * 0.0001 + 15) * 24; // $/day

  // Raw material cost
  const rawMaterialCost = Fb * 0.85 * 24;  // $/day

  // Revenue
  const revenue = productionRate * 2.45 * 24; // $/day

  // Profit
  const profit = revenue - rawMaterialCost - energyCost;

  // Alarm risk
  let alarmRisk = 0;
  if (T > 450) { alarmRisk += 0.4; warnings.push('⛔ T reactor > 450°C: riesgo de runaway térmico'); }
  if (T > 440) { alarmRisk += 0.2; warnings.push('⚠ T reactor > 440°C: zona de sobre-oxidación'); }
  if (P > 2.7) { alarmRisk += 0.3; warnings.push('⛔ P reactor > 2.7 bar: riesgo de sobre-presión'); }
  if (ratio < 0.8) { alarmRisk += 0.2; warnings.push('⚠ Ratio O₂/C₄H₁₀ bajo: conversión reducida'); }
  if (ratio > 2.0) { alarmRisk += 0.15; warnings.push('⚠ Exceso de O₂: riesgo de combustión total'); }
  alarmRisk = Math.min(1, alarmRisk);

  // Hotspot risk
  let hotspotRisk = 0;
  if (T > 430) hotspotRisk += (T - 430) * 0.02;
  if (Tcool > 60) hotspotRisk += (Tcool - 60) * 0.01;
  hotspotRisk = Math.min(1, Math.max(0, hotspotRisk));
  if (hotspotRisk > 0.5) warnings.push('🔥 Riesgo de hot-spot en reactor');

  // Catalyst life
  const catalystLife = Math.max(0, (365 - catAge) * 24);
  if (catAge > 300) warnings.push('⚠ Catalizador cerca del fin de vida útil');

  // Specific energy
  const specificEnergy = productionRate > 0 ? (heatDuty * 0.000278) / productionRate : 0;

  // CO₂ emissions (simplified)
  const co2Emission = productionRate > 0 ? (Fb * (1 - selectivity) * conversion * 4 * 44 / 58.12) / productionRate : 0;

  return {
    conversion: conversion * 100,
    selectivity: selectivity * 100,
    yieldGlobal: yieldGlobal * 100,
    productionRate,
    productPurity: purity,
    feedRate: Fb,
    energyCost,
    rawMaterialCost,
    revenue,
    profit,
    alarmRisk,
    hotspotRisk,
    catalystLife,
    specificEnergy,
    co2Emission,
    warnings,
  };
}

// ── Kinetic model: AT-200 ───────────────────────────────────
function simulateAT200(vars: Record<string, number>): SimResult {
  const Tdes = vars.T_desulf;
  const Tev1 = vars.T_evap1;
  const Tev2 = vars.T_evap2;
  const Tcry = vars.T_crystal;
  const Pev = vars.P_evap;
  const Foru = vars.F_orujo;
  const acidConc = vars.acid_conc;
  const tartContent = vars.tartrate_content;

  const warnings: string[] = [];

  // Extraction conversion: temperature and acid concentration dependent
  const Tdes_optimal = 85;
  let conversion = 0.85;
  conversion *= Math.exp(-Math.pow((Tdes - Tdes_optimal) / 30, 2));  // Gaussian around optimal
  conversion *= Math.min(1.0, acidConc / 20);                        // needs enough acid  
  conversion *= (tartContent / 5.0);                                   // linear with tartrate content
  conversion = Math.max(0.1, Math.min(0.98, conversion));

  // Selectivity: affected by acid concentration (too much → degradation)
  let selectivity = 0.92;
  if (acidConc > 25) selectivity -= (acidConc - 25) * 0.008;
  if (acidConc < 10) selectivity -= (10 - acidConc) * 0.01;
  if (Tdes > 100) selectivity -= (Tdes - 100) * 0.003;              // thermal degradation
  selectivity = Math.max(0.5, Math.min(0.98, selectivity));

  // Evaporation efficiency: vacuum helps
  const evapEfficiency = Pev < 0.5 ? 0.95 : Pev < 1.0 ? 0.85 + 0.1 * (1 - Pev) : 0.75 + 0.1 * (1.5 - Pev);

  // Crystal purity: strong function of crystallization temperature
  let purity = 99.2;
  if (Tcry < 0) purity += 0.3;      // very cold → high purity crystals
  if (Tcry < 5) purity += 0.2;
  if (Tcry > 10) purity -= (Tcry - 10) * 0.15;
  if (Tcry > 15) purity -= (Tcry - 15) * 0.2;
  purity = Math.max(94, Math.min(99.9, purity));

  // Crystallization yield: cold helps but too cold freezes water
  let crystalYield = 0.90;
  if (Tcry < 0) crystalYield = 0.87;   // ice formation
  if (Tcry < 3) crystalYield = 0.92;
  if (Tcry > 10) crystalYield -= (Tcry - 10) * 0.02;

  // Overall yield
  const yieldGlobal = conversion * selectivity * evapEfficiency * crystalYield;

  // Production rate
  const tartrateMass = Foru * (tartContent / 100);
  const productionRate = tartrateMass * yieldGlobal * (150.09 / 188.18);

  // Economics
  const rawMaterialCost = Foru * 0.08 * 24 + (acidConc / 100) * Foru * 0.35 * 24;
  const energyCost = (
    Foru * 0.5 * Math.max(0, Tdes - 20) +           // heating
    Foru * 0.3 * Math.max(0, Tev1 - 20) +           // evaporator 1
    Foru * 0.3 * Math.max(0, Tev2 - 20) +           // evaporator 2
    Foru * 0.8 * Math.max(0, 20 - Tcry)             // cooling
  ) * 0.00005 * 24;
  const revenue = productionRate * 4.80 * 24;
  const profit = revenue - rawMaterialCost - energyCost;

  // Risks
  let alarmRisk = 0;
  if (Tdes > 105) { alarmRisk += 0.3; warnings.push('⚠ T desulfitación > 105°C: degradación térmica'); }
  if (Tev1 > 90) { alarmRisk += 0.15; warnings.push('⚠ T evaporador 1° alta'); }
  if (acidConc > 30) { alarmRisk += 0.2; warnings.push('⚠ H₂SO₄ excesivo: degradación del ácido tartárico'); }
  if (Tcry < -3) { alarmRisk += 0.15; warnings.push('⚠ T cristalización muy baja: formación de hielo'); }
  alarmRisk = Math.min(1, alarmRisk);

  const hotspotRisk = Tdes > 100 ? Math.min(1, (Tdes - 100) * 0.05) : 0;
  if (hotspotRisk > 0.3) warnings.push('🔥 Riesgo de degradación térmica en desulfitación');

  const catalystLife = 0; // no catalyst
  const specificEnergy = productionRate > 0 ? (energyCost / 24 / 0.12) / productionRate : 0;
  const co2Emission = productionRate > 0 ? (energyCost * 0.001) / productionRate : 0;

  return {
    conversion: conversion * 100,
    selectivity: selectivity * 100,
    yieldGlobal: yieldGlobal * 100,
    productionRate,
    productPurity: purity,
    feedRate: Foru,
    energyCost,
    rawMaterialCost,
    revenue,
    profit,
    alarmRisk,
    hotspotRisk,
    catalystLife,
    specificEnergy,
    co2Emission,
    warnings,
  };
}


// ── Sensitivity sweep ───────────────────────────────────────
function sensitivitySweep(
  vars: Record<string, number>,
  sweepKey: string,
  sweepVar: SimVariable,
  simulate: (v: Record<string, number>) => SimResult,
  points = 30,
): { name: string; conversion: number; selectivity: number; yield: number; production: number; profit: number }[] {
  const data: any[] = [];
  const range = sweepVar.max - sweepVar.min;
  for (let i = 0; i <= points; i++) {
    const val = sweepVar.min + (range * i) / points;
    const res = simulate({ ...vars, [sweepKey]: val });
    data.push({
      name: val.toFixed(sweepVar.step < 1 ? 1 : 0),
      conversion: +res.conversion.toFixed(2),
      selectivity: +res.selectivity.toFixed(2),
      yield: +res.yieldGlobal.toFixed(2),
      production: +res.productionRate.toFixed(2),
      profit: +res.profit.toFixed(0),
    });
  }
  return data;
}


// ============================================================
// Main Component
// ============================================================
export default function WhatIfSimulator() {
  const { processes, activeProcessId, setActiveProcess } = useProcess();
  const [processCode, setProcessCode] = useState<'MA-100' | 'AT-200'>('MA-100');
  const [vars, setVars] = useState<Record<string, number>>({});
  const [baselineVars, setBaselineVars] = useState<Record<string, number>>({});
  const [sweepKey, setSweepKey] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [history, setHistory] = useState<{ step: number; result: SimResult; vars: Record<string, number> }[]>([]);
  const stepRef = useRef(0);

  // Pick config based on process
  const processVars = processCode === 'MA-100' ? MA100_VARS : AT200_VARS;
  const simulate = processCode === 'MA-100' ? simulateMA100 : simulateAT200;

  // Init defaults
  useEffect(() => {
    const defaults: Record<string, number> = {};
    processVars.forEach((v) => { defaults[v.key] = v.default; });
    setVars(defaults);
    setBaselineVars(defaults);
    setSweepKey(processVars[0].key);
    setHistory([]);
    stepRef.current = 0;
  }, [processCode]);

  // Sync with global active process
  useEffect(() => {
    const p = processes.find((pr) => pr.id === activeProcessId);
    if (p) setProcessCode(p.code as any);
  }, [activeProcessId, processes]);

  // Current simulation
  const result = useMemo(() => {
    if (Object.keys(vars).length === 0) return null;
    return simulate(vars);
  }, [vars, processCode]);

  // Baseline (default conditions)
  const baseline = useMemo(() => {
    if (Object.keys(baselineVars).length === 0) return null;
    return simulate(baselineVars);
  }, [baselineVars, processCode]);

  // Sensitivity data
  const sweepVarDef = processVars.find((v) => v.key === sweepKey);
  const sweepData = useMemo(() => {
    if (!sweepVarDef || Object.keys(vars).length === 0) return [];
    return sensitivitySweep(vars, sweepKey, sweepVarDef, simulate);
  }, [vars, sweepKey, processCode]);

  // Run scenario (add to history)
  const runScenario = useCallback(() => {
    if (!result) return;
    stepRef.current += 1;
    setHistory((prev) => [...prev.slice(-19), { step: stepRef.current, result, vars: { ...vars } }]);
  }, [result, vars]);

  // Reset to defaults
  const resetVars = useCallback(() => {
    const defaults: Record<string, number> = {};
    processVars.forEach((v) => { defaults[v.key] = v.default; });
    setVars(defaults);
  }, [processVars]);

  // Slider change
  const handleVar = useCallback((key: string, value: number) => {
    setVars((prev) => ({ ...prev, [key]: value }));
  }, []);

  if (!result || !baseline) return null;

  // Diff calculations
  const diff = (curr: number, base: number) => {
    const d = curr - base;
    const pct = base !== 0 ? (d / base) * 100 : 0;
    return { d, pct };
  };

  // Radar data
  const radarData = [
    { metric: 'Conversión', current: result.conversion, baseline: baseline.conversion },
    { metric: 'Selectividad', current: result.selectivity, baseline: baseline.selectivity },
    { metric: 'Rendimiento', current: result.yieldGlobal, baseline: baseline.yieldGlobal },
    { metric: 'Pureza', current: result.productPurity, baseline: baseline.productPurity },
    { metric: 'Seguridad', current: (1 - result.alarmRisk) * 100, baseline: (1 - baseline.alarmRisk) * 100 },
  ];

  const historyChartData = history.map((h) => ({
    step: `#${h.step}`,
    conversion: +h.result.conversion.toFixed(1),
    yield: +h.result.yieldGlobal.toFixed(1),
    profit: +h.result.profit.toFixed(0),
  }));

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={20} />
            Simulador What-If
          </h1>
          <p className="text-sm text-muted">Analiza el impacto de cambios operativos antes de implementarlos</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['MA-100', 'AT-200'] as const).map((code) => (
            <button
              key={code}
              className={`btn ${processCode === code ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => {
                setProcessCode(code);
                const p = processes.find((pr) => pr.code === code);
                if (p) setActiveProcess(p.id);
              }}
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16 }}>
        {/* ── LEFT PANEL: Variables ──────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Controls */}
          <div className="card" style={{ padding: '0.75rem' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={runScenario} style={{ flex: 1 }}>
                <Play size={14} /> Ejecutar Escenario
              </button>
              <button className="btn btn-secondary" onClick={resetVars} title="Restaurar valores nominales">
                <RotateCcw size={14} />
              </button>
            </div>
          </div>

          {/* Variable Sliders */}
          <div className="card" style={{ padding: '0.75rem', maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
            <div className="card-header" style={{ marginBottom: 8 }}>
              <span className="card-title" style={{ fontSize: '0.8rem' }}>Variables de Proceso</span>
              <span className="text-xs text-muted">{processCode}</span>
            </div>
            {processVars.map((v) => {
              const val = vars[v.key] ?? v.default;
              const isChanged = Math.abs(val - v.default) > v.step * 0.5;
              const Icon = v.icon;
              return (
                <div key={v.key} style={{ marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Icon size={12} color={isChanged ? 'var(--accent-blue)' : 'var(--text-muted)'} />
                      <span className="text-xs" style={{ fontWeight: 600, color: isChanged ? 'var(--accent-blue)' : 'var(--text-primary)' }}>
                        {v.label}
                      </span>
                    </div>
                    <span className="mono text-xs" style={{ color: isChanged ? 'var(--accent-blue)' : 'var(--text-muted)', fontWeight: 700 }}>
                      {val.toFixed(v.step < 1 ? (v.step < 0.1 ? 2 : 1) : 0)} {v.unit}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={v.min}
                    max={v.max}
                    step={v.step}
                    value={val}
                    onChange={(e) => handleVar(v.key, parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: isChanged ? 'var(--accent-blue)' : 'var(--text-muted)' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-xs text-muted">{v.min}</span>
                    <span className="text-xs text-muted" style={{ opacity: 0.5 }}>
                      nominal: {v.default} {v.unit}
                    </span>
                    <span className="text-xs text-muted">{v.max}</span>
                  </div>
                  {isChanged && (
                    <div className="text-xs" style={{ marginTop: 2, color: 'var(--accent-blue)', fontStyle: 'italic' }}>
                      Δ {(val - v.default) >= 0 ? '+' : ''}{(val - v.default).toFixed(v.step < 1 ? 1 : 0)} {v.unit}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT PANEL: Results ──────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            <KPICard label="Conversión" value={result.conversion} unit="%" baseline={baseline.conversion} icon={<Target size={16} />} color="var(--accent-blue)" />
            <KPICard label="Selectividad" value={result.selectivity} unit="%" baseline={baseline.selectivity} icon={<Activity size={16} />} color="var(--accent-cyan)" />
            <KPICard label="Rendimiento" value={result.yieldGlobal} unit="%" baseline={baseline.yieldGlobal} icon={<TrendingUp size={16} />} color="var(--accent-green)" />
            <KPICard label="Producción" value={result.productionRate} unit="kg/h" baseline={baseline.productionRate} icon={<FlaskConical size={16} />} color="var(--accent-purple)" decimals={1} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            <KPICard label="Pureza" value={result.productPurity} unit="%" baseline={baseline.productPurity} icon={<Beaker size={16} />} color="var(--accent-cyan)" />
            <KPICard label="Beneficio" value={result.profit} unit="$/día" baseline={baseline.profit} icon={<DollarSign size={16} />} color={result.profit >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'} decimals={0} />
            <KPICard label="Riesgo Alarma" value={result.alarmRisk * 100} unit="%" baseline={baseline.alarmRisk * 100} icon={<AlertTriangle size={16} />} color={result.alarmRisk > 0.3 ? 'var(--accent-red)' : 'var(--accent-green)'} invertDelta />
            <KPICard label="Energía Específ." value={result.specificEnergy} unit="kWh/kg" baseline={baseline.specificEnergy} icon={<Zap size={16} />} color="var(--accent-orange)" decimals={2} invertDelta />
          </div>

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="card" style={{ padding: '0.75rem', borderLeft: '3px solid var(--accent-red)', background: 'rgba(239,68,68,0.05)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--accent-red)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={14} /> Advertencias del Escenario
              </div>
              {result.warnings.map((w, i) => (
                <div key={i} className="text-sm" style={{ color: 'var(--text-primary)', marginBottom: 2 }}>{w}</div>
              ))}
            </div>
          )}

          {/* Charts row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Radar comparison */}
            <div className="card" style={{ padding: '0.75rem' }}>
              <div className="card-header" style={{ marginBottom: 4 }}>
                <span className="card-title" style={{ fontSize: '0.8rem' }}>Comparación vs Nominal</span>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--border-color)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <PolarRadiusAxis tick={{ fontSize: 8, fill: 'var(--text-muted)' }} domain={[0, 100]} />
                  <Radar name="Nominal" dataKey="baseline" stroke="#475569" fill="#475569" fillOpacity={0.15} strokeDasharray="3 3" />
                  <Radar name="Simulado" dataKey="current" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Sensitivity sweep */}
            <div className="card" style={{ padding: '0.75rem' }}>
              <div className="card-header" style={{ marginBottom: 4 }}>
                <span className="card-title" style={{ fontSize: '0.8rem' }}>Análisis de Sensibilidad</span>
                <select
                  className="select"
                  style={{ width: 160, fontSize: '0.7rem', padding: '2px 6px' }}
                  value={sweepKey}
                  onChange={(e) => setSweepKey(e.target.value)}
                >
                  {processVars.map((v) => (
                    <option key={v.key} value={v.key}>{v.label}</option>
                  ))}
                </select>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={sweepData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" strokeOpacity={0.5} />
                  <XAxis dataKey="name" tick={{ fontSize: 8, fill: 'var(--text-muted)' }} label={{ value: sweepVarDef?.unit || '', position: 'insideBottom', offset: -2, fontSize: 9, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 8, fill: 'var(--text-muted)' }} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <ReferenceLine x={vars[sweepKey]?.toFixed(sweepVarDef && sweepVarDef.step < 1 ? 1 : 0)} stroke="#f97316" strokeDasharray="5 5" label={{ value: 'Actual', fontSize: 9, fill: '#f97316' }} />
                  <Line type="monotone" dataKey="conversion" stroke="#3b82f6" name="Conversión %" dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="selectivity" stroke="#06b6d4" name="Selectividad %" dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="yield" stroke="#22c55e" name="Rendimiento %" dot={false} strokeWidth={1.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Economics bar chart */}
          <div className="card" style={{ padding: '0.75rem' }}>
            <div className="card-header" style={{ marginBottom: 4 }}>
              <span className="card-title" style={{ fontSize: '0.8rem' }}>Impacto Económico ($/día)</span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={[
                { name: 'Materia Prima', nominal: -baseline.rawMaterialCost, simulado: -result.rawMaterialCost },
                { name: 'Energía', nominal: -baseline.energyCost, simulado: -result.energyCost },
                { name: 'Ingreso', nominal: baseline.revenue, simulado: result.revenue },
                { name: 'Beneficio', nominal: baseline.profit, simulado: result.profit },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" strokeOpacity={0.5} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 8, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="nominal" name="Nominal" fill="#475569" radius={[4, 4, 0, 0]} />
                <Bar dataKey="simulado" name="Simulado" radius={[4, 4, 0, 0]}>
                  {[0, 1, 2, 3].map((i) => (
                    <Cell key={i} fill={i === 3 ? (result.profit >= baseline.profit ? '#22c55e' : '#ef4444') : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Advanced: expand for scenario history */}
          <div className="card" style={{ padding: '0.75rem' }}>
            <button
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'space-between' }}
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <BarChart3 size={14} /> Historial de Escenarios ({history.length})
              </span>
              {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showAdvanced && history.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={historyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" strokeOpacity={0.5} />
                    <XAxis dataKey="step" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                    <YAxis yAxisId="pct" tick={{ fontSize: 8, fill: 'var(--text-muted)' }} domain={[0, 100]} />
                    <YAxis yAxisId="money" orientation="right" tick={{ fontSize: 8, fill: 'var(--text-muted)' }} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Line yAxisId="pct" type="monotone" dataKey="conversion" stroke="#3b82f6" name="Conversión %" dot />
                    <Line yAxisId="pct" type="monotone" dataKey="yield" stroke="#22c55e" name="Rendimiento %" dot />
                    <Line yAxisId="money" type="monotone" dataKey="profit" stroke="#f97316" name="Beneficio $/d" dot />
                  </LineChart>
                </ResponsiveContainer>

                {/* Scenario table */}
                <div className="table-container" style={{ maxHeight: 200, overflowY: 'auto', marginTop: 8 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Conv. %</th>
                        <th>Select. %</th>
                        <th>Rend. %</th>
                        <th>Prod. kg/h</th>
                        <th>Pureza %</th>
                        <th>Beneficio $/d</th>
                        <th>Riesgo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((h) => (
                        <tr key={h.step}>
                          <td className="mono">{h.step}</td>
                          <td className="mono">{h.result.conversion.toFixed(1)}</td>
                          <td className="mono">{h.result.selectivity.toFixed(1)}</td>
                          <td className="mono">{h.result.yieldGlobal.toFixed(1)}</td>
                          <td className="mono">{h.result.productionRate.toFixed(1)}</td>
                          <td className="mono">{h.result.productPurity.toFixed(1)}</td>
                          <td className="mono" style={{ color: h.result.profit >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                            {h.result.profit.toFixed(0)}
                          </td>
                          <td>
                            <span className={`badge ${h.result.alarmRisk > 0.3 ? 'badge-danger' : h.result.alarmRisk > 0.1 ? 'badge-warning' : 'badge-success'}`}>
                              {(h.result.alarmRisk * 100).toFixed(0)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {showAdvanced && history.length === 0 && (
              <div className="text-sm text-muted" style={{ padding: '1rem', textAlign: 'center' }}>
                Presioná "Ejecutar Escenario" para registrar combinaciones y compararlas aquí.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


// ── KPI Card with delta ─────────────────────────────────────
function KPICard({
  label, value, unit, baseline, icon, color, decimals = 1, invertDelta = false,
}: {
  label: string; value: number; unit: string; baseline: number;
  icon: React.ReactNode; color: string; decimals?: number; invertDelta?: boolean;
}) {
  const delta = value - baseline;
  const pct = baseline !== 0 ? (delta / baseline) * 100 : 0;
  const isGood = invertDelta ? delta <= 0 : delta >= 0;

  return (
    <div className="card" style={{ padding: '0.65rem 0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ color }}>{icon}</span>
        <span className="text-xs text-muted" style={{ fontWeight: 600 }}>{label}</span>
      </div>
      <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 700, color }}>
        {value.toFixed(decimals)}
        <span className="text-xs text-muted" style={{ fontWeight: 400 }}> {unit}</span>
      </div>
      {Math.abs(delta) > 0.01 && (
        <div className="text-xs mono" style={{ color: isGood ? 'var(--accent-green)' : 'var(--accent-red)', marginTop: 2 }}>
          {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(decimals)} ({pct >= 0 ? '+' : ''}{pct.toFixed(1)}%)
        </div>
      )}
      {Math.abs(delta) <= 0.01 && (
        <div className="text-xs text-muted" style={{ marginTop: 2 }}>= nominal</div>
      )}
    </div>
  );
}
