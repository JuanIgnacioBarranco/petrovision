// ============================================================
// PetroVision — Equipment 3D Detail Panel
// ============================================================
// Interactive slide-in panel with CSS 3D rotating equipment
// visualizations, live sensor data, and specifications.
// ============================================================

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  X, Gauge, Thermometer, Droplets, Activity, Box, Zap,
  AlertTriangle, Wind, Eye, RotateCcw,
} from 'lucide-react';

// ── Equipment Info Database ────────────────────────────────
interface EquipmentInfo {
  tag: string;
  name: string;
  type: 'vessel' | 'reactor' | 'column' | 'pump' | 'exchanger' | 'filter' |
        'evaporator' | 'crystallizer' | 'centrifuge' | 'dryer' | 'compressor';
  process: string;
  description: string;
  specs: Record<string, string>;
  instruments: string[];
  color: string;
}

const EQUIPMENT: Record<string, EquipmentInfo> = {
  // ── MA-100 ──────────────────────────────────────────────
  'TK-101': {
    tag: 'TK-101', name: 'Tanque de Almacenamiento n-Butano', type: 'vessel', process: 'MA-100',
    color: '#334155',
    description: 'Tanque vertical de almacenamiento de n-butano líquido bajo presión. Alimentación principal del proceso de producción de anhídrido maleico. Operación FIFO con control de nivel automatizado.',
    specs: { 'Volumen': '50 m³', 'Material': 'SA-516 Gr 70', 'Presión diseño': '5 barg', 'Temperatura': '25°C', 'Fluido': 'n-Butano (C₄H₁₀)', 'Código': 'ASME VIII Div 1' },
    instruments: ['LI-101', 'FI-101'],
  },
  'P-101': {
    tag: 'P-101', name: 'Bomba Centrífuga de Alimentación', type: 'pump', process: 'MA-100',
    color: '#16a34a',
    description: 'Bomba centrífuga de accionamiento eléctrico para transferencia de n-butano desde el tanque de almacenamiento hacia el precalentador E-101. Motor IP55 apto para zona clasificada.',
    specs: { 'Caudal': '850 kg/h', 'Head': '45 m', 'Potencia': '5.5 kW', 'RPM': '2960', 'Tipo': 'Centrífuga API 610', 'Material': 'CS / SS316 impulsor' },
    instruments: ['FI-101'],
  },
  'E-101': {
    tag: 'E-101', name: 'Precalentador de Alimentación', type: 'exchanger', process: 'MA-100',
    color: '#ea580c',
    description: 'Intercambiador de calor tipo casco y tubos para precalentar la corriente de n-butano antes del ingreso al reactor. Utiliza vapor de baja presión como fluido calefactor.',
    specs: { 'Tipo': 'Shell & Tube', 'Área': '15 m²', 'Servicio': 'LP Steam / n-Butano', 'U': '250 W/m²K', 'Material': 'CS / CS', 'Código': 'TEMA BEM' },
    instruments: ['TI-101'],
  },
  'C-101': {
    tag: 'C-101', name: 'Compresor de Aire', type: 'compressor', process: 'MA-100',
    color: '#16a34a',
    description: 'Compresor centrífugo multietapa para suministro de aire de proceso al reactor. Proporciona oxígeno estequiométrico para la oxidación parcial del n-butano.',
    specs: { 'Caudal': '3200 Nm³/h', 'Presión': '2.5 barg', 'Potencia': '75 kW', 'Etapas': '2', 'Tipo': 'Centrífugo', 'Material': 'CS / Inox' },
    instruments: ['FI-102'],
  },
  'R-101': {
    tag: 'R-101', name: 'Reactor de Lecho Fijo (V₂O₅-MoO₃/TiO₂)', type: 'reactor', process: 'MA-100',
    color: '#7c3aed',
    description: 'Reactor multitubular de lecho fijo cargado con catalizador V₂O₅-MoO₃/TiO₂. Realiza la oxidación parcial selectiva del n-butano a anhídrido maleico. Operación exotérmica con enfriamiento por sal fundida.',
    specs: { 'Volumen': '18 m³', 'Tubos': '4200 × 25mm OD', 'Catalizador': 'V₂O₅-MoO₃/TiO₂', 'T operación': '380–440 °C', 'P operación': '1.8–2.5 bar', 'Conversión': '82–85%', 'Selectividad': '~58%', 'WHSV': '2.5 h⁻¹' },
    instruments: ['TI-101', 'TI-102', 'PI-101'],
  },
  'E-102': {
    tag: 'E-102', name: 'Enfriador de Gas de Proceso', type: 'exchanger', process: 'MA-100',
    color: '#38bdf8',
    description: 'Intercambiador de calor para enfriamiento rápido (quench) del gas efluente del reactor. Recupera energía térmica y reduce la temperatura a condiciones de absorción.',
    specs: { 'Tipo': 'Shell & Tube', 'Área': '45 m²', 'Servicio': 'Gas caliente / CW', 'T in': '420°C', 'T out': '180°C', 'Material': 'SS304 / CS' },
    instruments: ['TI-103'],
  },
  'T-101': {
    tag: 'T-101', name: 'Columna de Absorción', type: 'column', process: 'MA-100',
    color: '#0284c7',
    description: 'Columna empacada para absorción del anhídrido maleico gaseoso en solvente orgánico (DBP). Operación a contracorriente con 7 etapas de empaque estructurado.',
    specs: { 'Diámetro': '1.8 m', 'Altura': '12 m', 'Etapas': '7', 'Empaque': 'Mellapak 250Y', 'Solvente': 'DBP', 'Eficiencia': '>98%', 'Material': 'SS316L' },
    instruments: ['TI-104', 'PI-102'],
  },
  'T-102': {
    tag: 'T-102', name: 'Columna de Destilación', type: 'column', process: 'MA-100',
    color: '#8b5cf6',
    description: 'Columna de destilación para separación del anhídrido maleico del solvente. Operación al vacío parcial con reboiler externo y condensador total.',
    specs: { 'Diámetro': '1.2 m', 'Altura': '14 m', 'Etapas': '9', 'Platos': 'Valve Trays', 'Reflujo': '2.5:1', 'P operación': '100 mbar', 'Material': 'SS304' },
    instruments: ['TI-106'],
  },
  'K-101': {
    tag: 'K-101', name: 'Fundidora / Melter', type: 'exchanger', process: 'MA-100',
    color: '#f87171',
    description: 'Unidad de fusión del anhídrido maleico crudo procedente de destilación. Mantiene el producto en estado fundido para facilitar su filtración y almacenamiento.',
    specs: { 'Tipo': 'Kettle', 'Capacidad': '500 kg/batch', 'T operación': '55–60 °C', 'Calefacción': 'LP Steam', 'Material': 'SS316' },
    instruments: ['TI-107'],
  },
  'F-101': {
    tag: 'F-101', name: 'Filtro de Producto', type: 'filter', process: 'MA-100',
    color: '#9333ea',
    description: 'Filtro de producto final para remoción de impurezas y partículas del anhídrido maleico fundido. Mejora la pureza del producto antes del almacenamiento.',
    specs: { 'Tipo': 'Presión / Canasta', 'Malla': '25 μm', 'Material': 'SS316', 'ΔP máx': '2 bar' },
    instruments: ['AI-101', 'FI-103'],
  },
  'TK-102': {
    tag: 'TK-102', name: 'Tanque de Producto MA', type: 'vessel', process: 'MA-100',
    color: '#34d399',
    description: 'Tanque de almacenamiento del anhídrido maleico purificado (≥99%). Mantenido a temperatura controlada para preservar el producto en estado fundido.',
    specs: { 'Volumen': '30 m³', 'Material': 'SS316L', 'T almacenamiento': '55–65 °C', 'Producto': 'MA ≥99%', 'Código': 'ASME VIII' },
    instruments: ['LI-103'],
  },
  // ── AT-200 ──────────────────────────────────────────────
  'TK-201': {
    tag: 'TK-201', name: 'Tanque de Materia Prima (Orujo)', type: 'vessel', process: 'AT-200',
    color: '#334155',
    description: 'Tanque de recepción y acondicionamiento de residuos vitivinícolas (orujo de uva). Contiene tartrato de calcio (CaC₄H₄O₆) como materia prima principal.',
    specs: { 'Volumen': '25 m³', 'Material': 'CS epoxy-lined', 'T almacenamiento': 'Ambiente', 'Contenido sólido': '20–30%', 'Agitación': 'Hélice marina' },
    instruments: ['LI-201', 'FI-201'],
  },
  'P-201': {
    tag: 'P-201', name: 'Bomba de Alimentación', type: 'pump', process: 'AT-200',
    color: '#16a34a',
    description: 'Bomba centrífuga para transferencia de la pulpa de orujo acondicionada hacia el reactor de desulfitación.',
    specs: { 'Caudal': '120 kg/h', 'Head': '25 m', 'Potencia': '2.2 kW', 'Tipo': 'Centrífuga sanitaria', 'Material': 'SS316' },
    instruments: ['FI-201'],
  },
  'R-201': {
    tag: 'R-201', name: 'Reactor de Desulfitación', type: 'reactor', process: 'AT-200',
    color: '#7c3aed',
    description: 'Reactor agitado para la reacción de desulfitación: CaC₄H₄O₆ + H₂SO₄ → C₄H₆O₆ + CaSO₄. Precipita sulfato de calcio y libera ácido tartárico en solución.',
    specs: { 'Volumen': '5 m³', 'Agitación': 'Turbina Rushton', 'T operación': '70–85 °C', 'Tiempo residencia': '60 min', 'pH objetivo': '2.0–2.5', 'Material': 'SS316L epoxy' },
    instruments: ['TI-201', 'FI-201'],
  },
  'F-201': {
    tag: 'F-201', name: 'Filtro Prensa', type: 'filter', process: 'AT-200',
    color: '#9333ea',
    description: 'Filtro prensa de placas para separación del precipitado de CaSO₄ de la solución de ácido tartárico. Torta de descarte → CaSO₄ sólido.',
    specs: { 'Tipo': 'Placas y marcos', 'Área filtración': '10 m²', 'Presión': '6 bar', 'Placas': '20', 'Material': 'PP / SS316' },
    instruments: [],
  },
  'E-201': {
    tag: 'E-201', name: 'Columna de Intercambio Iónico', type: 'exchanger', process: 'AT-200',
    color: '#8b5cf6',
    description: 'Columna de resina de intercambio catiónico fuerte para la acidulación y purificación de la solución de ácido tartárico. Intercambio H⁺/Ca²⁺.',
    specs: { 'Resina': 'Amberlite IR120 H⁺', 'Volumen lecho': '0.8 m³', 'Capacidad': '2.0 eq/L', 'Regenerante': 'HCl 5%', 'Material': 'PP / SS316' },
    instruments: ['AI-202'],
  },
  'EV-201': {
    tag: 'EV-201', name: 'Evaporador de Efecto 1°', type: 'evaporator', process: 'AT-200',
    color: '#d97706',
    description: 'Primer efecto del tren de evaporación. Concentra la solución de ácido tartárico eliminando agua por evaporación al vacío. Calefacción con vapor vivo.',
    specs: { 'Tipo': 'Calandria', 'Área': '8 m²', 'Presión': '0.5 bar abs', 'T ebullición': '80°C', 'Concentración out': '25%', 'Material': 'SS316' },
    instruments: ['PI-201', 'TI-202'],
  },
  'EV-202': {
    tag: 'EV-202', name: 'Evaporador de Efecto 2°', type: 'evaporator', process: 'AT-200',
    color: '#d97706',
    description: 'Segundo efecto del tren de evaporación. Utiliza el vapor flash del primer efecto como calefacción. Concentra hasta ~40% para alimentar el cristalizador.',
    specs: { 'Tipo': 'Calandria', 'Área': '6 m²', 'Presión': '0.3 bar abs', 'T ebullición': '68°C', 'Concentración out': '40%', 'Material': 'SS316' },
    instruments: ['TI-203'],
  },
  'CR-201': {
    tag: 'CR-201', name: 'Cristalizador por Enfriamiento', type: 'crystallizer', process: 'AT-200',
    color: '#0891b2',
    description: 'Cristalizador horizontal con chaqueta de enfriamiento para la cristalización controlada del ácido tartárico. Enfriamiento lento programado para maximizar tamaño de cristal.',
    specs: { 'Volumen': '3 m³', 'T inicio': '70°C', 'T final': '15°C', 'Tiempo ciclo': '8 h', 'Rendimiento': '>85%', 'Enfriamiento': 'CW / Glycol', 'Material': 'SS316L' },
    instruments: ['TI-205'],
  },
  'C-201': {
    tag: 'C-201', name: 'Centrífuga de Canasta', type: 'centrifuge', process: 'AT-200',
    color: '#14b8a6',
    description: 'Centrífuga de canasta para la separación de cristales de ácido tartárico del licor madre. El licor madre se recicla a la etapa de evaporación.',
    specs: { 'Tipo': 'Canasta perforada', 'RPM': '1200', 'Diámetro': '1.0 m', 'Capacidad': '200 kg/batch', 'Material': 'SS316L' },
    instruments: [],
  },
  'D-201': {
    tag: 'D-201', name: 'Secador Rotativo', type: 'dryer', process: 'AT-200',
    color: '#f43f5e',
    description: 'Secador rotativo de aire caliente para reducir la humedad de los cristales de ácido tartárico. Produce cristales secos (≤0.5% humedad) listos para envasado.',
    specs: { 'Tipo': 'Rotativo tubular', 'T aire': '60–80°C', 'Humedad entrada': '8%', 'Humedad salida': '<0.5%', 'Tiempo': '45 min', 'Material': 'SS316' },
    instruments: ['AI-201'],
  },
  'TK-202': {
    tag: 'TK-202', name: 'Tanque de Producto Final', type: 'vessel', process: 'AT-200',
    color: '#34d399',
    description: 'Tanque de almacenamiento del ácido tartárico cristalino purificado (≥99.5%). Producto final listo para envasado y comercialización.',
    specs: { 'Volumen': '5 m³', 'Material': 'SS316L', 'Producto': 'Ác. Tartárico ≥99.5%', 'Forma': 'Cristal blanco', 'Código': 'GMP / farmacéutico' },
    instruments: ['FI-202'],
  },
};

// ── 3D CSS Face helper ─────────────────────────────────────
const F = {
  pos: { position: 'absolute' as const },
  face: (w: number, h: number, transform: string, bg: string, brd: string): React.CSSProperties => ({
    position: 'absolute',
    width: w,
    height: h,
    transform,
    background: bg,
    border: `1.5px solid ${brd}`,
    left: '50%',
    top: '50%',
    marginLeft: -w / 2,
    marginTop: -h / 2,
  }),
};

// ── 3D Equipment Models ────────────────────────────────────

function VesselModel3D({ color, fillLevel = 50 }: { color: string; fillLevel?: number }) {
  const W = 80, H = 140, D = 50;
  return (
    <>
      {/* Front */}
      <div style={{
        ...F.face(W, H, `translateZ(${D / 2}px)`, `linear-gradient(180deg, ${color}35, ${color}12)`, `${color}70`),
        borderRadius: '16px 16px 6px 6px',
        overflow: 'hidden',
      }}>
        {/* Fill level */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: `${fillLevel}%`,
          background: `linear-gradient(to top, ${color}55, ${color}20)`,
          borderTop: `1px solid ${color}50`,
          transition: 'height 1s ease',
        }} />
        {/* Highlight strip */}
        <div style={{
          position: 'absolute', left: '20%', top: 0, width: '10%', height: '100%',
          background: 'rgba(255,255,255,0.05)',
        }} />
      </div>
      {/* Back */}
      <div style={{
        ...F.face(W, H, `translateZ(-${D / 2}px) rotateY(180deg)`, `linear-gradient(180deg, ${color}25, ${color}08)`, `${color}50`),
        borderRadius: '16px 16px 6px 6px',
      }} />
      {/* Right */}
      <div style={F.face(D, H, `rotateY(90deg) translateZ(${W / 2}px)`, `linear-gradient(180deg, ${color}20, ${color}06)`, `${color}40`)} />
      {/* Left */}
      <div style={F.face(D, H, `rotateY(-90deg) translateZ(${W / 2}px)`, `linear-gradient(180deg, ${color}30, ${color}10)`, `${color}55`)} />
      {/* Top ellipse */}
      <div style={{
        ...F.face(W, D, `rotateX(90deg) translateZ(${H / 2}px)`, `radial-gradient(ellipse, ${color}30, ${color}10)`, `${color}60`),
        borderRadius: '50%',
      }} />
      {/* Bottom */}
      <div style={{
        ...F.face(W, D, `rotateX(-90deg) translateZ(${H / 2}px)`, `radial-gradient(ellipse, ${color}20, ${color}05)`, `${color}40`),
        borderRadius: '50%',
      }} />
    </>
  );
}

function ReactorModel3D({ color }: { color: string }) {
  const W = 70, H = 160, D = 50;
  return (
    <>
      {/* Front */}
      <div style={{
        ...F.face(W, H, `translateZ(${D / 2}px)`, `linear-gradient(180deg, ${color}40, ${color}15)`, `${color}70`),
        borderRadius: '14px 14px 6px 6px',
        overflow: 'hidden',
      }}>
        {/* Catalyst bed */}
        <div style={{
          position: 'absolute', top: '25%', left: '10%', right: '10%', height: '50%',
          background: `repeating-linear-gradient(0deg, ${color}25 0px, ${color}25 4px, transparent 4px, transparent 8px)`,
          border: `1px solid ${color}40`,
          borderRadius: 4,
        }} />
        {/* Core glow */}
        <div style={{
          position: 'absolute', top: '40%', left: '30%', width: '40%', height: '20%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}80, transparent)`,
          animation: 'pulse3d 2.5s ease-in-out infinite',
        }} />
      </div>
      {/* Back */}
      <div style={{
        ...F.face(W, H, `translateZ(-${D / 2}px) rotateY(180deg)`, `linear-gradient(180deg, ${color}25, ${color}08)`, `${color}50`),
        borderRadius: '14px 14px 6px 6px',
      }} />
      {/* Right */}
      <div style={F.face(D, H, `rotateY(90deg) translateZ(${W / 2}px)`, `linear-gradient(180deg, ${color}18, ${color}06)`, `${color}40`)} />
      {/* Left */}
      <div style={F.face(D, H, `rotateY(-90deg) translateZ(${W / 2}px)`, `linear-gradient(180deg, ${color}28, ${color}09)`, `${color}50`)} />
      {/* Jacket lines */}
      <div style={{
        ...F.face(W + 16, H * 0.55, `translateZ(${D / 2 + 2}px) translateY(${-H * 0.02}px)`,
          'transparent', `${color}30`),
        borderStyle: 'dashed',
        borderRadius: 4,
      }} />
      {/* Top */}
      <div style={{
        ...F.face(W, D, `rotateX(90deg) translateZ(${H / 2}px)`, `radial-gradient(ellipse, ${color}30, ${color}10)`, `${color}60`),
        borderRadius: '50%',
      }} />
    </>
  );
}

function ColumnModel3D({ color, stages = 8 }: { color: string; stages?: number }) {
  const W = 50, H = 180, D = 40;
  return (
    <>
      {/* Front */}
      <div style={{
        ...F.face(W, H, `translateZ(${D / 2}px)`, `linear-gradient(180deg, ${color}35, ${color}10)`, `${color}65`),
        borderRadius: '12px 12px 4px 4px',
        overflow: 'hidden',
      }}>
        {/* Trays */}
        {Array.from({ length: stages - 1 }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute', left: 4, right: 4,
            top: `${12 + (i + 1) * (76 / stages)}%`,
            height: 1,
            background: `${color}40`,
          }} />
        ))}
        {/* Rising vapor effect */}
        <div style={{
          position: 'absolute', bottom: 10, left: '40%', width: 6, height: 6,
          borderRadius: '50%', background: `${color}50`,
          animation: 'rise3d 2.5s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: 10, left: '55%', width: 5, height: 5,
          borderRadius: '50%', background: `${color}40`,
          animation: 'rise3d 3.2s ease-in-out infinite 0.5s',
        }} />
      </div>
      {/* Back */}
      <div style={{
        ...F.face(W, H, `translateZ(-${D / 2}px) rotateY(180deg)`, `linear-gradient(180deg, ${color}22, ${color}06)`, `${color}45`),
        borderRadius: '12px 12px 4px 4px',
      }} />
      {/* Right */}
      <div style={F.face(D, H, `rotateY(90deg) translateZ(${W / 2}px)`, `linear-gradient(180deg, ${color}15, ${color}05)`, `${color}35`)} />
      {/* Left */}
      <div style={F.face(D, H, `rotateY(-90deg) translateZ(${W / 2}px)`, `linear-gradient(180deg, ${color}25, ${color}08)`, `${color}45`)} />
      {/* Top */}
      <div style={{
        ...F.face(W, D, `rotateX(90deg) translateZ(${H / 2}px)`, `radial-gradient(ellipse, ${color}35, ${color}12)`, `${color}60`),
        borderRadius: '50%',
      }} />
    </>
  );
}

function ExchangerModel3D({ color }: { color: string }) {
  const W = 110, H = 60, D = 50;
  return (
    <>
      {/* Main body front */}
      <div style={{
        ...F.face(W, H, `translateZ(${D / 2}px)`, `linear-gradient(90deg, ${color}35, ${color}12)`, `${color}60`),
        borderRadius: 8,
        overflow: 'hidden',
      }}>
        {/* Tube bundle */}
        {[0.25, 0.4, 0.55, 0.75].map((pct, i) => (
          <div key={i} style={{
            position: 'absolute', left: '8%', right: '8%', top: `${pct * 100}%`,
            height: 2, background: `${color}30`, borderRadius: 1,
          }} />
        ))}
      </div>
      {/* Back */}
      <div style={{
        ...F.face(W, H, `translateZ(-${D / 2}px) rotateY(180deg)`, `linear-gradient(90deg, ${color}22, ${color}06)`, `${color}40`),
        borderRadius: 8,
      }} />
      {/* Right channel head */}
      <div style={{
        ...F.face(D, H, `rotateY(90deg) translateZ(${W / 2}px)`, `radial-gradient(circle, ${color}35, ${color}12)`, `${color}55`),
        borderRadius: '50%',
      }} />
      {/* Left channel head */}
      <div style={{
        ...F.face(D, H, `rotateY(-90deg) translateZ(${W / 2}px)`, `radial-gradient(circle, ${color}28, ${color}08)`, `${color}45`),
        borderRadius: '50%',
      }} />
      {/* Top */}
      <div style={F.face(W, D, `rotateX(90deg) translateZ(${H / 2}px)`, `linear-gradient(90deg, ${color}20, ${color}06)`, `${color}35`)} />
    </>
  );
}

function PumpModel3D({ color }: { color: string }) {
  const R = 46;
  return (
    <>
      {/* Main casing — front circle */}
      <div style={{
        ...F.face(R * 2, R * 2, `translateZ(18px)`, `radial-gradient(circle at 40% 40%, ${color}40, ${color}10)`, `${color}65`),
        borderRadius: '50%',
        overflow: 'hidden',
      }}>
        {/* Impeller lines */}
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <div key={deg} style={{
            position: 'absolute', top: '50%', left: '50%', width: '38%', height: 2,
            background: `${color}50`, transformOrigin: '0 50%',
            transform: `rotate(${deg}deg)`,
            animation: `spinImpeller 1.5s linear infinite`,
          }} />
        ))}
        {/* Center hub */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', width: 18, height: 18,
          marginLeft: -9, marginTop: -9, borderRadius: '50%',
          background: `${color}45`, border: `2px solid ${color}60`,
        }} />
      </div>
      {/* Back circle */}
      <div style={{
        ...F.face(R * 2, R * 2, `translateZ(-18px) rotateY(180deg)`, `radial-gradient(circle, ${color}25, ${color}06)`, `${color}45`),
        borderRadius: '50%',
      }} />
      {/* Discharge pipe (top) */}
      <div style={{
        position: 'absolute', left: '50%', top: 0, width: 20, height: 20,
        marginLeft: -10,
        background: `${color}20`, border: `1.5px solid ${color}50`,
        borderRadius: '4px 4px 0 0',
        transform: 'translateZ(10px)',
      }} />
    </>
  );
}

function FilterModel3D({ color }: { color: string }) {
  const W = 90, H = 70, D = 40;
  return (
    <>
      <div style={{
        ...F.face(W, H, `translateZ(${D / 2}px)`, `linear-gradient(180deg, ${color}30, ${color}10)`, `${color}55`),
        borderRadius: 6, overflow: 'hidden',
      }}>
        {/* Grid pattern */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={`v${i}`} style={{
            position: 'absolute', top: 4, bottom: 4, left: `${10 + i * 16}%`, width: 1,
            background: `${color}35`,
          }} />
        ))}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={`h${i}`} style={{
            position: 'absolute', left: 4, right: 4, top: `${25 + i * 25}%`, height: 1,
            background: `${color}35`,
          }} />
        ))}
      </div>
      <div style={{
        ...F.face(W, H, `translateZ(-${D / 2}px) rotateY(180deg)`, `linear-gradient(180deg, ${color}20, ${color}05)`, `${color}35`),
        borderRadius: 6,
      }} />
      <div style={F.face(D, H, `rotateY(90deg) translateZ(${W / 2}px)`, `${color}15`, `${color}35`)} />
      <div style={F.face(D, H, `rotateY(-90deg) translateZ(${W / 2}px)`, `${color}22`, `${color}42`)} />
      <div style={{
        ...F.face(W, D, `rotateX(90deg) translateZ(${H / 2}px)`, `${color}18`, `${color}40`),
        borderRadius: 4,
      }} />
    </>
  );
}

function EvaporatorModel3D({ color }: { color: string }) {
  const W = 60, H = 150, D = 45;
  return (
    <>
      <div style={{
        ...F.face(W, H, `translateZ(${D / 2}px)`, `linear-gradient(180deg, ${color}38, ${color}12)`, `${color}65`),
        borderRadius: '12px 12px 4px 4px', overflow: 'hidden',
      }}>
        {/* Steam bubbles */}
        {[1, 2, 3].map((i) => (
          <div key={i} style={{
            position: 'absolute', bottom: '15%',
            left: `${15 + i * 20}%`, width: 6, height: 6,
            borderRadius: '50%', background: `${color}45`,
            animation: `rise3d ${1.5 + i * 0.4}s ease-in-out infinite ${i * 0.3}s`,
          }} />
        ))}
        {/* Calandria tubes */}
        {[0.6, 0.68, 0.76].map((pct, i) => (
          <div key={i} style={{
            position: 'absolute', left: 8, right: 8, top: `${pct * 100}%`,
            height: 3, borderRadius: '50%',
            background: `${color}15`, border: `0.5px solid ${color}25`,
          }} />
        ))}
      </div>
      <div style={{
        ...F.face(W, H, `translateZ(-${D / 2}px) rotateY(180deg)`, `linear-gradient(180deg, ${color}22, ${color}06)`, `${color}45`),
        borderRadius: '12px 12px 4px 4px',
      }} />
      <div style={F.face(D, H, `rotateY(90deg) translateZ(${W / 2}px)`, `${color}15`, `${color}35`)} />
      <div style={F.face(D, H, `rotateY(-90deg) translateZ(${W / 2}px)`, `${color}25`, `${color}48`)} />
      <div style={{
        ...F.face(W, D, `rotateX(90deg) translateZ(${H / 2}px)`, `radial-gradient(ellipse, ${color}30, ${color}10)`, `${color}55`),
        borderRadius: '50%',
      }} />
    </>
  );
}

function CrystallizerModel3D({ color }: { color: string }) {
  const W = 120, H = 60, D = 50;
  return (
    <>
      <div style={{
        ...F.face(W, H, `translateZ(${D / 2}px)`, `linear-gradient(180deg, ${color}30, ${color}10)`, `${color}55`),
        borderRadius: 8, overflow: 'hidden',
      }}>
        {/* Crystal particles */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${10 + (i * 11) % 80}%`,
            top: `${30 + (i * 17) % 50}%`,
            width: 4 + (i % 3) * 2, height: 4 + (i % 3) * 2,
            background: `${color}55`, transform: `rotate(${i * 45}deg)`,
            animation: `crystal3d ${2 + i * 0.3}s ease-in-out infinite ${i * 0.2}s`,
          }} />
        ))}
        {/* Cooling jacket dash */}
        <div style={{
          position: 'absolute', inset: -4, border: `1.5px dashed ${color}30`, borderRadius: 12,
        }} />
      </div>
      <div style={{
        ...F.face(W, H, `translateZ(-${D / 2}px) rotateY(180deg)`, `${color}18`, `${color}35`),
        borderRadius: 8,
      }} />
      <div style={{
        ...F.face(D, H, `rotateY(90deg) translateZ(${W / 2}px)`, `radial-gradient(circle, ${color}25, ${color}08)`, `${color}45`),
        borderRadius: '50%',
      }} />
      <div style={{
        ...F.face(D, H, `rotateY(-90deg) translateZ(${W / 2}px)`, `radial-gradient(circle, ${color}20, ${color}05)`, `${color}38`),
        borderRadius: '50%',
      }} />
    </>
  );
}

function CentrifugeModel3D({ color }: { color: string }) {
  return (
    <>
      {/* Main drum */}
      <div style={{
        ...F.face(90, 90, `translateZ(22px)`, `radial-gradient(circle at 40% 40%, ${color}35, ${color}10)`, `${color}65`),
        borderRadius: '50%', overflow: 'hidden',
      }}>
        {/* Basket perforations */}
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * 30 * Math.PI) / 180;
          const r2 = 30;
          return (
            <div key={i} style={{
              position: 'absolute',
              left: `calc(50% + ${Math.cos(a) * r2}px - 2px)`,
              top: `calc(50% + ${Math.sin(a) * r2}px - 2px)`,
              width: 4, height: 4, borderRadius: '50%',
              background: `${color}30`,
            }} />
          );
        })}
        {/* Spinning inner disc */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', width: 50, height: 50,
          marginLeft: -25, marginTop: -25, borderRadius: '50%',
          border: `2px solid ${color}50`,
          animation: 'spinImpeller 0.8s linear infinite',
        }}>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1.5, background: `${color}40` }} />
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1.5, background: `${color}40` }} />
        </div>
      </div>
      <div style={{
        ...F.face(90, 90, `translateZ(-22px) rotateY(180deg)`, `radial-gradient(circle, ${color}20, ${color}05)`, `${color}40`),
        borderRadius: '50%',
      }} />
      {/* Depth ring */}
      <div style={{
        ...F.face(44, 44, `translateZ(0px)`, 'transparent', `${color}25`),
        borderRadius: '50%',
      }} />
    </>
  );
}

function DryerModel3D({ color }: { color: string }) {
  const W = 70, H = 110, D = 45;
  return (
    <>
      <div style={{
        ...F.face(W, H, `translateZ(${D / 2}px)`, `linear-gradient(180deg, ${color}35, ${color}10)`, `${color}60`),
        borderRadius: '10px 10px 4px 4px', overflow: 'hidden',
      }}>
        {/* Heat wave lines */}
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            position: 'absolute', left: `${20 + i * 25}%`, bottom: '10%',
            width: 2, height: '70%',
            background: `linear-gradient(to top, ${color}40, transparent)`,
            animation: `heatWave3d ${1.5 + i * 0.3}s ease-in-out infinite ${i * 0.2}s`,
          }} />
        ))}
      </div>
      <div style={{
        ...F.face(W, H, `translateZ(-${D / 2}px) rotateY(180deg)`, `${color}18`, `${color}38`),
        borderRadius: '10px 10px 4px 4px',
      }} />
      <div style={F.face(D, H, `rotateY(90deg) translateZ(${W / 2}px)`, `${color}12`, `${color}30`)} />
      <div style={F.face(D, H, `rotateY(-90deg) translateZ(${W / 2}px)`, `${color}20`, `${color}42`)} />
      <div style={{
        ...F.face(W, D, `rotateX(90deg) translateZ(${H / 2}px)`, `radial-gradient(ellipse, ${color}25, ${color}08)`, `${color}50`),
        borderRadius: '50%',
      }} />
    </>
  );
}

function CompressorModel3D({ color }: { color: string }) {
  const W = 80, H = 70, D = 50;
  return (
    <>
      <div style={{
        ...F.face(W, H, `translateZ(${D / 2}px)`, `linear-gradient(135deg, ${color}30, ${color}10)`, `${color}55`),
        borderRadius: 8, overflow: 'hidden',
      }}>
        {/* Blade visualization */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', width: 40, height: 40,
          marginLeft: -20, marginTop: -20,
          animation: 'spinImpeller 1.2s linear infinite',
        }}>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <div key={deg} style={{
              position: 'absolute', top: '50%', left: '50%',
              width: 16, height: 2, marginTop: -1,
              background: `${color}50`, transformOrigin: '0 50%',
              transform: `rotate(${deg}deg)`,
            }} />
          ))}
        </div>
      </div>
      <div style={{
        ...F.face(W, H, `translateZ(-${D / 2}px) rotateY(180deg)`, `${color}15`, `${color}35`),
        borderRadius: 8,
      }} />
      <div style={F.face(D, H, `rotateY(90deg) translateZ(${W / 2}px)`, `${color}12`, `${color}30`)} />
      <div style={F.face(D, H, `rotateY(-90deg) translateZ(${W / 2}px)`, `${color}20`, `${color}40`)} />
      <div style={{
        ...F.face(W, D, `rotateX(90deg) translateZ(${H / 2}px)`, `${color}18`, `${color}40`),
      }} />
    </>
  );
}

// ── Model Selector ─────────────────────────────────────────
function Equipment3DModel({ type, color, liveData, instruments: instTags }: {
  type: string; color: string;
  liveData: Record<string, any>; instruments: string[];
}) {
  const fillLevel = useMemo(() => {
    const lvl = instTags.find(t => t.startsWith('LI'));
    return lvl ? liveData[lvl]?.value ?? 50 : 50;
  }, [instTags, liveData]);

  switch (type) {
    case 'vessel':       return <VesselModel3D color={color} fillLevel={fillLevel} />;
    case 'reactor':      return <ReactorModel3D color={color} />;
    case 'column':       return <ColumnModel3D color={color} />;
    case 'exchanger':    return <ExchangerModel3D color={color} />;
    case 'pump':         return <PumpModel3D color={color} />;
    case 'filter':       return <FilterModel3D color={color} />;
    case 'evaporator':   return <EvaporatorModel3D color={color} />;
    case 'crystallizer': return <CrystallizerModel3D color={color} />;
    case 'centrifuge':   return <CentrifugeModel3D color={color} />;
    case 'dryer':        return <DryerModel3D color={color} />;
    case 'compressor':   return <CompressorModel3D color={color} />;
    default:             return <VesselModel3D color={color} fillLevel={50} />;
  }
}


// ── 3D Scene Container ─────────────────────────────────────
function Equipment3DScene({ equipment, liveData }: {
  equipment: EquipmentInfo; liveData: Record<string, any>;
}) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [rotY, setRotY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const dragStartRef = useRef({ x: 0, startRot: 0 });
  const autoTimerRef = useRef<number>(0);

  // Auto-rotation
  useEffect(() => {
    if (!autoRotate || isDragging) return;
    const id = requestAnimationFrame(function tick() {
      setRotY(r => (r + 0.3) % 360);
      autoTimerRef.current = requestAnimationFrame(tick);
    });
    autoTimerRef.current = id;
    return () => cancelAnimationFrame(autoTimerRef.current);
  }, [autoRotate, isDragging]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    setAutoRotate(false);
    dragStartRef.current = { x: e.clientX, startRot: rotY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [rotY]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const delta = (e.clientX - dragStartRef.current.x) * 0.5;
    setRotY(dragStartRef.current.startRot + delta);
  }, [isDragging]);

  const onPointerUp = useCallback(() => {
    setIsDragging(false);
    // Resume auto-rotation after 3s of inactivity
    setTimeout(() => setAutoRotate(true), 3000);
  }, []);

  return (
    <div
      ref={sceneRef}
      style={{
        perspective: 600,
        width: '100%',
        height: 240,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Ambient glow behind model */}
      <div style={{
        position: 'absolute',
        width: 150, height: 150,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${equipment.color}25, transparent 70%)`,
        filter: 'blur(20px)',
      }} />

      {/* Turntable platform */}
      <div style={{
        position: 'absolute', bottom: 20,
        width: 160, height: 20,
        borderRadius: '50%',
        background: `radial-gradient(ellipse, rgba(255,255,255,0.06), transparent)`,
        border: '1px solid rgba(255,255,255,0.05)',
        transform: 'rotateX(60deg)',
      }} />

      {/* 3D Model */}
      <div style={{
        transformStyle: 'preserve-3d',
        transform: `rotateX(-12deg) rotateY(${rotY}deg)`,
        transition: isDragging ? 'none' : 'transform 0.05s linear',
        willChange: 'transform',
        position: 'relative',
        width: 140, height: 180,
      }}>
        <Equipment3DModel
          type={equipment.type}
          color={equipment.color}
          liveData={liveData}
          instruments={equipment.instruments}
        />
      </div>

      {/* Drag hint */}
      <div style={{
        position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: 4,
        fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)',
      }}>
        <RotateCcw size={8} /> Arrastrar para rotar
      </div>
    </div>
  );
}


// ── Live Instrument Reading ────────────────────────────────
function LiveReading({ tag, liveData, instr }: {
  tag: string; liveData: Record<string, any>; instr: any;
}) {
  const reading = liveData[tag];
  const value = reading?.value;
  const quality = reading?.quality || 'UNKNOWN';
  const isAlarm = instr && value != null && (
    (instr.hihi != null && value >= instr.hihi) ||
    (instr.lolo != null && value <= instr.lolo)
  );
  const isWarn = !isAlarm && instr && value != null && (
    (instr.hi != null && value >= instr.hi) ||
    (instr.lo != null && value <= instr.lo)
  );

  const icon = tag.startsWith('TI') || tag.startsWith('TT') ? <Thermometer size={13} /> :
               tag.startsWith('PI') || tag.startsWith('PT') ? <Gauge size={13} /> :
               tag.startsWith('FI') || tag.startsWith('FT') ? <Wind size={13} /> :
               tag.startsWith('LI') || tag.startsWith('LT') ? <Droplets size={13} /> :
               tag.startsWith('AI')                          ? <Zap size={13} /> :
               <Activity size={13} />;

  const statusColor = isAlarm ? 'var(--accent-red)' :
                      isWarn  ? 'var(--accent-yellow)' :
                      value != null ? 'var(--accent-green)' : 'var(--text-muted)';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 12px', borderRadius: 8,
      background: isAlarm ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.02)',
      border: `1px solid ${isAlarm ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.05)'}`,
      transition: 'all 0.3s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ color: statusColor }}>{icon}</div>
        <div>
          <div style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.85rem' }}>{tag}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{instr?.description || ''}</div>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{
          fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem', color: statusColor,
        }}>
          {value != null ? value.toFixed(2) : '---'}
          <span style={{ fontSize: '0.65rem', fontWeight: 400, marginLeft: 3, color: 'var(--text-muted)' }}>
            {instr?.unit || ''}
          </span>
        </div>
        <div style={{
          fontSize: '0.55rem', color: statusColor,
          display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end',
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: '50%', background: statusColor,
            display: 'inline-block',
            boxShadow: isAlarm ? `0 0 6px ${statusColor}` : 'none',
            animation: isAlarm ? 'pulse3d 1s ease-in-out infinite' : 'none',
          }} />
          {isAlarm ? 'ALARMA' : isWarn ? 'WARNING' : quality}
        </div>
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════
// MAIN EXPORT: Equipment Detail Panel
// ══════════════════════════════════════════════════════════════
export default function EquipmentDetailPanel({
  tag,
  liveData,
  instruments,
  onClose,
}: {
  tag: string;
  liveData: Record<string, any>;
  instruments: any[];
  onClose: () => void;
}) {
  const equipment = EQUIPMENT[tag];
  if (!equipment) return null;

  const relatedInstruments = useMemo(
    () => equipment.instruments.map(iTag => ({
      tag: iTag,
      info: instruments.find(i => i.tag === iTag),
    })),
    [equipment, instruments]
  );

  const typeLabels: Record<string, string> = {
    vessel: 'Recipiente / Tanque',
    reactor: 'Reactor',
    column: 'Columna',
    pump: 'Bomba',
    exchanger: 'Intercambiador / IX',
    filter: 'Filtro',
    evaporator: 'Evaporador',
    crystallizer: 'Cristalizador',
    centrifuge: 'Centrífuga',
    dryer: 'Secador',
    compressor: 'Compresor',
  };

  const typeIcon: Record<string, React.ReactNode> = {
    vessel: <Box size={16} />,
    reactor: <Zap size={16} />,
    column: <Activity size={16} />,
    pump: <Wind size={16} />,
    exchanger: <Thermometer size={16} />,
    filter: <Eye size={16} />,
    evaporator: <Droplets size={16} />,
    crystallizer: <Box size={16} />,
    centrifuge: <Activity size={16} />,
    dryer: <Thermometer size={16} />,
    compressor: <Wind size={16} />,
  };

  return (
    <div
      className="equipment-detail-panel"
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: 380,
        height: '100%',
        background: 'rgba(17, 24, 39, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        overflow: 'hidden',
        animation: 'slideInRight 0.35s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: '-10px 0 40px rgba(0,0,0,0.5)',
      }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.05))',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{
              fontFamily: 'monospace', fontSize: '1.2rem', fontWeight: 700,
              color: equipment.color,
              textShadow: `0 0 20px ${equipment.color}40`,
            }}>
              {equipment.tag}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              {equipment.name}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: 6, color: 'var(--text-muted)',
              cursor: 'pointer', display: 'flex',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Type + Process badge */}
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 10px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 600,
            background: `${equipment.color}15`, color: equipment.color,
            border: `1px solid ${equipment.color}30`,
          }}>
            {typeIcon[equipment.type]}
            {typeLabels[equipment.type] || equipment.type}
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 10px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 600,
            background: 'rgba(59,130,246,0.1)', color: 'var(--accent-blue)',
            border: '1px solid rgba(59,130,246,0.25)',
          }}>
            {equipment.process}
          </span>
        </div>
      </div>

      {/* Scrollable Content */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>

        {/* 3D Model Section */}
        <div style={{
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(0,0,0,0.2)',
        }}>
          <Equipment3DScene equipment={equipment} liveData={liveData} />
        </div>

        {/* Live Readings */}
        {equipment.instruments.length > 0 && (
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{
              fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Activity size={12} /> Instrumentación en Vivo
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {relatedInstruments.map(({ tag: iTag, info }) => (
                <LiveReading key={iTag} tag={iTag} liveData={liveData} instr={info} />
              ))}
            </div>
          </div>
        )}

        {/* Specifications */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{
            fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Gauge size={12} /> Especificaciones
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
            {Object.entries(equipment.specs).map(([key, val]) => (
              <div key={key} style={{
                padding: '6px 8px', borderRadius: 6,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
              }}>
                <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{key}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, fontFamily: 'monospace', color: 'var(--text-primary)' }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        <div style={{ padding: '16px 20px' }}>
          <div style={{
            fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Eye size={12} /> Descripción
          </div>
          <p style={{
            fontSize: '0.78rem', lineHeight: 1.6, color: 'var(--text-secondary)',
          }}>
            {equipment.description}
          </p>
        </div>
      </div>
    </div>
  );
}

// Re-export for use in PFD
export { EQUIPMENT };
