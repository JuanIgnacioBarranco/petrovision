// ============================================================
// PetroVision — Professional P&ID / Process Flow Diagram
// ============================================================
// ISA 5.1 compliant symbols: instrument bubbles, control loops,
// PID signal lines, proper vessel geometry, stream numbers.
// ============================================================

import { useState, useEffect, useMemo, useRef } from 'react';
import { useProcess } from '@/hooks/useProcess';
import {
  Activity, Gauge, Thermometer, Wind, FlaskConical,
  ZoomIn, ZoomOut, Maximize2, Minimize2, Move, RotateCcw,
} from 'lucide-react';
import EquipmentDetailPanel from './EquipmentDetail3D';
import {
  C, vCol, FlowDots, InstrBubble, SignalLine, Pipe, ArrowMarker,
  StreamNum, CondTag, AreaZone, Vessel, Reactor, Column,
  HeatExchanger, Pump, ControlValve, PSV, Filter,
  Evaporator, Crystallizer, Centrifuge, Dryer, Compressor,
} from './pid/SVGComponents';

// =============================================================
// MA-100 DIAGRAM  —  Maleic Anhydride
// =============================================================
function MA100Diagram({ liveData, instruments, onSelectEquipment }: {
  liveData: Record<string, any>; instruments: any[];
  onSelectEquipment?: (tag: string) => void;
}) {
  const getInst = (tag: string) => instruments.find((i: any) => i.tag === tag) || {};
  const val     = (tag: string) => liveData[tag]?.value;
  const inst    = (tag: string) => {
    const i = getInst(tag);
    return { value: val(tag), lo: i.lo, hi: i.hi, lolo: i.lolo, hihi: i.hihi, unit: i.unit };
  };

  return (
    <svg viewBox="0 0 1380 660" width="100%"
      style={{ background: C.bg, borderRadius: 12, display: 'block' }}>
      <defs>
        <ArrowMarker id="am_proc" color={C.processLine} />
        <ArrowMarker id="am_stm"  color={C.steamLine} />
        <ArrowMarker id="am_cool" color={C.coolantLine} />
        <ArrowMarker id="am_prod" color={C.productLine} />
        <pattern id="grd_ma" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke={C.gridLine} strokeWidth="0.5" />
        </pattern>
      </defs>

      {/* Background */}
      <rect width="1380" height="660" fill="url(#grd_ma)" />
      <rect x={8} y={8} width={1364} height={644} rx={6}
        fill="none" stroke={C.border} strokeWidth={1.5} />

      {/* ── Title Block ── */}
      <rect x={8} y={608} width={1364} height={44} fill="rgba(14,20,35,0.97)" stroke={C.border} strokeWidth={1} />
      <line x1={8} y1={621} x2={1372} y2={621} stroke={C.border} strokeWidth={0.5} />
      <text x={500} y={616} textAnchor="middle" fill={C.title} fontSize={10} fontWeight={700} letterSpacing="0.06em">
        MA-100 — PRODUCCIÓN DE ANHÍDRIDO MALEICO
      </text>
      <text x={500} y={630} textAnchor="middle" fill={C.subtitle} fontSize={7}>
        C₄H₁₀ + 3.5 O₂ → C₄H₂O₃ + 4 H₂O  |  Reactor Lecho Fijo  |  Cat: V₂O₅-MoO₃/TiO₂  |  ISA 5.1
      </text>
      <text x={500} y={643} textAnchor="middle" fill={C.muted} fontSize={6}>
        P&ID — PetroVision RTIC  |  Tesis 2026  |  Rev.A  |  Escala: 1/NTS
      </text>
      {/* Revision block */}
      <line x1={870} y1={608} x2={870} y2={652} stroke={C.border} strokeWidth={0.5} />
      <text x={962} y={619} textAnchor="middle" fill={C.muted} fontSize={7}>Nro. Plano: MA-PFD-001</text>
      <text x={962} y={631} textAnchor="middle" fill={C.muted} fontSize={7}>Rev: A  |  2026-01</text>
      <text x={962} y={643} textAnchor="middle" fill={C.muted} fontSize={7}>PetroVision Tesis 2026</text>
      {/* Line legend */}
      <line x1={1052} y1={608} x2={1052} y2={652} stroke={C.border} strokeWidth={0.5} />
      <line x1={1060} y1={618} x2={1105} y2={618} stroke={C.processLine} strokeWidth={2} />
      <text x={1110} y={621} fill={C.muted} fontSize={5.5} fontFamily="monospace">Proceso</text>
      <line x1={1060} y1={628} x2={1105} y2={628} stroke={C.steamLine}   strokeWidth={1.5} strokeDasharray="5 3" />
      <text x={1110} y={631} fill={C.muted} fontSize={5.5} fontFamily="monospace">Vapor</text>
      <line x1={1060} y1={638} x2={1105} y2={638} stroke={C.coolantLine} strokeWidth={1.5} strokeDasharray="3 1" />
      <text x={1110} y={641} fill={C.muted} fontSize={5.5} fontFamily="monospace">Refrig.</text>
      <line x1={1155} y1={618} x2={1200} y2={618} stroke={C.signalLine}  strokeWidth={0.8} strokeDasharray="2 2" />
      <text x={1205} y={621} fill={C.muted} fontSize={5.5} fontFamily="monospace">Señal</text>
      <line x1={1155} y1={628} x2={1200} y2={628} stroke={C.productLine} strokeWidth={2} />
      <text x={1205} y={631} fill={C.muted} fontSize={5.5} fontFamily="monospace">Producto</text>
      <line x1={1155} y1={638} x2={1200} y2={638} stroke={C.utilityLine} strokeWidth={1} strokeDasharray="2 2" />
      <text x={1205} y={641} fill={C.muted} fontSize={5.5} fontFamily="monospace">Utilidades</text>

      {/* ── Area Zones ── */}
      <AreaZone x={18}   y={30} w={185} h={568} label="SECC. 100 — ALIMENTACIÓN" />
      <AreaZone x={210}  y={30} w={265} h={568} label="SECC. 200 — REACCIÓN" />
      <AreaZone x={482}  y={30} w={158} h={568} label="SECC. 300 — ENFRIAMIENTO" />
      <AreaZone x={647}  y={30} w={217} h={568} label="SECC. 400 — SEPARACIÓN" />
      <AreaZone x={871}  y={30} w={200} h={568} label="SECC. 500 — PURIFICACIÓN" />
      <AreaZone x={1078} y={30} w={294} h={568} label="SECC. 600 — PRODUCTO FINAL" />

      {/* ══ PROCESS LINES ══ */}

      {/* S01: TK-101 → P-101 */}
      <Pipe d="M 100,305 L 100,358" />
      <FlowDots path="M 100,305 L 100,358" n={3} dur={5} />
      <StreamNum x={112} y={329} n={1} />

      {/* S02: P-101 → E-101 / FCV-101 */}
      <Pipe d="M 100,383 L 100,426 L 245,426 L 245,358" />
      <FlowDots path="M 100,383 L 100,426 L 245,426 L 245,358" n={3} dur={5} />
      <StreamNum x={172} y={416} n={2} />

      {/* S03: E-101 → R-101 (hot feed) */}
      <Pipe d="M 245,313 L 245,248 L 315,248" color="#f87171" />
      <FlowDots path="M 245,313 L 245,248 L 315,248" n={3} dur={4} color="#f87171" />
      <StreamNum x={268} y={268} n={3} />

      {/* S04: C-101 → R-101 (air) */}
      <Pipe d="M 194,175 L 315,175" color={C.utilityLine} />
      <FlowDots path="M 194,175 L 315,175" n={3} dur={3} color={C.utilityLine} />
      <StreamNum x={254} y={164} n={4} />
      <Pipe d="M 142,175 L 168,175" color={C.utilityLine} />
      <text x={130} y={178} fill={C.muted} fontSize={6.5} textAnchor="middle" fontFamily="monospace">AIR IN</text>

      {/* S05: R-101 → E-102 (hot effluent) */}
      <Pipe d="M 395,248 L 500,248" color="#f87171" />
      <FlowDots path="M 395,248 L 500,248" n={4} dur={2.5} color="#f87171" />
      <StreamNum x={447} y={237} n={5} />
      <CondTag x={447} y={256} items={['T≈420°C','P=2.1bar']} />

      {/* S06: E-102 → T-101 */}
      <Pipe d="M 580,248 L 660,248 L 660,182" />
      <FlowDots path="M 580,248 L 660,248 L 660,182" n={3} dur={3} />
      <StreamNum x={620} y={237} n={6} />

      {/* T-101 overhead vent */}
      <Pipe d="M 660,77 L 660,48" color={C.utilityLine} w={1.2} />
      <text x={660} y={42} textAnchor="middle" fill={C.muted} fontSize={6} fontFamily="monospace">Vent</text>

      {/* T-101 coolant */}
      <Pipe d="M 708,150 L 742,150" color={C.coolantLine} w={1.2} dash="3 2" />
      <text x={756} y={153} fill={C.coolantLine} fontSize={6} fontFamily="monospace">CW ret.</text>
      <Pipe d="M 708,205 L 742,205" color={C.coolantLine} w={1.2} dash="3 2" />
      <text x={756} y={208} fill={C.coolantLine} fontSize={6} fontFamily="monospace">CW sup.</text>

      {/* S07: T-101 btm → T-102 */}
      <Pipe d="M 685,412 L 685,452 L 808,452 L 808,414" />
      <FlowDots path="M 685,412 L 685,452 L 808,452 L 808,414" n={3} dur={3} />
      <StreamNum x={746} y={442} n={7} />

      {/* S08: T-102 btm → K-101 */}
      <Pipe d="M 835,168 L 895,168 L 895,225" />
      <FlowDots path="M 835,168 L 895,168 L 895,225" n={3} dur={3} />
      <StreamNum x={862} y={157} n={8} />

      {/* S09: K-101 → F-101 */}
      <Pipe d="M 933,265 L 1012,265" />
      <FlowDots path="M 933,265 L 1012,265" n={3} dur={3} />
      <StreamNum x={972} y={254} n={9} />

      {/* S10: F-101 → TK-102 (product) */}
      <Pipe d="M 1072,265 L 1182,265" color={C.productLine} />
      <FlowDots path="M 1072,265 L 1182,265" n={3} dur={3} color={C.productLine} />
      <StreamNum x={1127} y={254} n={10} />

      {/* Product out */}
      <Pipe d="M 1247,300 L 1247,382 L 1362,382" color={C.productLine} />
      <FlowDots path="M 1247,300 L 1247,382 L 1362,382" n={3} dur={4} color={C.productLine} />
      <text x={1366} y={385} fill={C.productLine} fontSize={7} fontFamily="monospace">► MA Prod.</text>
      <CondTag x={1297} y={393} items={['≥99% MA','220 kg/h']} />

      {/* Steam to E-101 */}
      <Pipe d="M 225,280 L 205,280 L 205,398" color={C.steamLine} w={1.2} dash="5 3" />
      <text x={192} y={404} fill={C.steamLine} fontSize={6} textAnchor="middle" fontFamily="monospace">LP Stm</text>

      {/* Coolant to E-102 */}
      <Pipe d="M 535,212 L 512,212" color={C.coolantLine} w={1.2} dash="3 1" />
      <Pipe d="M 535,285 L 512,285" color={C.coolantLine} w={1.2} dash="3 1" />
      <text x={500} y={210} fill={C.coolantLine} fontSize={6} textAnchor="end" fontFamily="monospace">CW in</text>
      <text x={500} y={288} fill={C.coolantLine} fontSize={6} textAnchor="end" fontFamily="monospace">CW out</text>

      {/* ══ EQUIPMENT ══ */}
      <g className="equip-interactive" onClick={(e) => { e.stopPropagation(); onSelectEquipment?.('TK-101'); }}>
        <Vessel x={65}   y={167} w={70} h={138} tag="TK-101" name="Tanque n-Butano"
          fillLevel={val('LI-101') ?? 55} id="tk101ma" />
      </g>
      <g className="equip-interactive" onClick={(e) => { e.stopPropagation(); onSelectEquipment?.('P-101'); }}>
        <Pump x={100} y={370} tag="P-101" />
      </g>
      <ControlValve x={245} y={426} actuatorType="FO" />
      <g className="equip-interactive" onClick={(e) => { e.stopPropagation(); onSelectEquipment?.('E-101'); }}>
        <HeatExchanger x={215} y={313} w={60}  h={45}  tag="E-101" name="Precalentador" />
      </g>
      <g className="equip-interactive" onClick={(e) => { e.stopPropagation(); onSelectEquipment?.('C-101'); }}>
        <Compressor    x={142} y={152} w={52}  h={46}  tag="C-101" name="Compresor Aire" />
      </g>
      <g className="equip-interactive" onClick={(e) => { e.stopPropagation(); onSelectEquipment?.('R-101'); }}>
        <Reactor       x={315} y={150} w={80}  h={195} tag="R-101" name="Reactor Lecho Fijo V₂O₅" />
      </g>
      <PSV x={378} y={150} tag="PSV-101" />
      <g className="equip-interactive" onClick={(e) => { e.stopPropagation(); onSelectEquipment?.('E-102'); }}>
        <HeatExchanger x={500} y={212} w={80}  h={73}  tag="E-102" name="Enfriador Gas" color={C.coolantLine} />
      </g>
      <g className="equip-interactive" onClick={(e) => { e.stopPropagation(); onSelectEquipment?.('T-101'); }}>
        <Column        x={638} y={77}  w={48}  h={335} tag="T-101" name="Absorción"     stages={7} />
      </g>
      <g className="equip-interactive" onClick={(e) => { e.stopPropagation(); onSelectEquipment?.('T-102'); }}>
        <Column        x={785} y={90}  w={48}  h={325} tag="T-102" name="Destilación"   stages={9} color="#8b5cf6" />
      </g>
      <g className="equip-interactive" onClick={(e) => { e.stopPropagation(); onSelectEquipment?.('K-101'); }}>
        <HeatExchanger x={857} y={225} w={75}  h={75}  tag="K-101" name="Fundidora"     color={C.steamLine} />
      </g>
      <g className="equip-interactive" onClick={(e) => { e.stopPropagation(); onSelectEquipment?.('F-101'); }}>
        <Filter        x={1012} y={236} w={60} h={56}  tag="F-101" name="Filtro Prod." />
      </g>
      <g className="equip-interactive" onClick={(e) => { e.stopPropagation(); onSelectEquipment?.('TK-102'); }}>
        <Vessel x={1182} y={202} w={65} h={98} tag="TK-102" name="Tanque Producto" color={C.productLine}
          fillLevel={val('LI-103') ?? 65} id="tk102ma" />
      </g>

      {/* ══ CONTROL LOOPS ══ */}

      {/* TIC-101: reactor mid-temperature */}
      <line x1={315} y1={248} x2={282} y2={248} stroke={C.processLine} strokeWidth={0.6} />
      <InstrBubble x={263} y={248} code="TIC" tag="TI-101" unit="°C" {...inst('TI-101')} type="dcs" />
      <SignalLine d="M 263,264 L 263,318 L 310,318" />
      <ControlValve x={310} y={318} color={C.signalLine} actuatorType="FC" />

      {/* TI-102: reactor top T */}
      <line x1={395} y1={193} x2={424} y2={193} stroke={C.processLine} strokeWidth={0.6} />
      <InstrBubble x={441} y={193} code="TI" tag="TI-102" unit="°C" {...inst('TI-102')} type="field" />

      {/* PIC-101: reactor pressure */}
      <line x1={355} y1={150} x2={355} y2={118} stroke={C.processLine} strokeWidth={0.6} />
      <InstrBubble x={355} y={100} code="PIC" tag="PI-101" unit="bar" {...inst('PI-101')} type="dcs" />

      {/* FIC-101: butane feed flow */}
      <line x1={100} y1={426} x2={60} y2={426} stroke={C.processLine} strokeWidth={0.6} />
      <InstrBubble x={42} y={426} code="FIC" tag="FI-101" unit="kg/h" {...inst('FI-101')} type="dcs" />
      <SignalLine d="M 42,442 L 42,490 L 245,490 L 245,439" />

      {/* FIC-102: air flow */}
      <line x1={168} y1={175} x2={168} y2={138} stroke={C.processLine} strokeWidth={0.6} />
      <InstrBubble x={168} y={120} code="FIC" tag="FI-102" unit="kg/h" {...inst('FI-102')} type="dcs" />

      {/* TI-103: E-102 outlet T */}
      <line x1={580} y1={248} x2={614} y2={282} stroke={C.processLine} strokeWidth={0.6} />
      <InstrBubble x={630} y={298} code="TI" tag="TI-103" unit="°C" {...inst('TI-103')} type="field" />

      {/* TI-104: T-101 top T */}
      <line x1={686} y1={100} x2={720} y2={100} stroke={C.processLine} strokeWidth={0.6} />
      <InstrBubble x={738} y={100} code="TI" tag="TI-104" unit="°C" {...inst('TI-104')} type="field" />

      {/* PI-102: T-101 pressure */}
      <line x1={638} y1={142} x2={606} y2={142} stroke={C.processLine} strokeWidth={0.6} />
      <InstrBubble x={588} y={142} code="PI" tag="PI-102" unit="bar" {...inst('PI-102')} type="field" />

      {/* LIC-101: TK-101 level */}
      <line x1={65} y1={236} x2={36} y2={236} stroke={C.processLine} strokeWidth={0.6} />
      <InstrBubble x={20} y={236} code="LIC" tag="LI-101" unit="%" {...inst('LI-101')} type="dcs" />

      {/* TI-106: T-102 top T */}
      <line x1={833} y1={130} x2={870} y2={130} stroke={C.processLine} strokeWidth={0.6} />
      <InstrBubble x={887} y={130} code="TI" tag="TI-106" unit="°C" {...inst('TI-106')} type="field" />

      {/* TI-107: K-101 temperature */}
      <line x1={857} y1={263} x2={836} y2={290} stroke={C.processLine} strokeWidth={0.6} />
      <InstrBubble x={820} y={306} code="TI" tag="TI-107" unit="°C" {...inst('TI-107')} type="field" />

      {/* AI-101: product purity */}
      <line x1={1072} y1={265} x2={1072} y2={326} stroke={C.processLine} strokeWidth={0.6} />
      <InstrBubble x={1072} y={342} code="AI" tag="AI-101" unit="%" {...inst('AI-101')} type="dcs" />

      {/* FI-103: product flow */}
      <line x1={1152} y1={265} x2={1152} y2={306} stroke={C.processLine} strokeWidth={0.6} />
      <InstrBubble x={1152} y={322} code="FI" tag="FI-103" unit="kg/h" {...inst('FI-103')} type="field" />

      {/* LIC-103: TK-102 level */}
      <line x1={1182} y1={251} x2={1152} y2={251} stroke={C.processLine} strokeWidth={0.6} />
      <InstrBubble x={1135} y={251} code="LIC" tag="LI-103" unit="%" {...inst('LI-103')} type="dcs" />
    </svg>
  );
}


// =============================================================
// AT-200 DIAGRAM  —  Tartaric Acid
// =============================================================
function AT200Diagram({ liveData, instruments, onSelectEquipment }: {
  liveData: Record<string, any>; instruments: any[];
  onSelectEquipment?: (tag: string) => void;
}) {
  const getInst = (tag: string) => instruments.find((i: any) => i.tag === tag) || {};
  const val     = (tag: string) => liveData[tag]?.value;
  const inst    = (tag: string) => {
    const i = getInst(tag);
    return { value: val(tag), lo: i.lo, hi: i.hi, lolo: i.lolo, hihi: i.hihi, unit: i.unit };
  };

  return (
    <svg viewBox="0 0 1380 640" width="100%"
      style={{ background: C.bg, borderRadius: 12, display: 'block' }}>
      <defs>
        <ArrowMarker id="at_proc" color={C.processLine} />
        <ArrowMarker id="at_prod" color={C.productLine} />
        <pattern id="grd_at" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke={C.gridLine} strokeWidth="0.5" />
        </pattern>
      </defs>

      <rect width="1380" height="640" fill="url(#grd_at)" />
      <rect x={8} y={8} width={1364} height={624} rx={6}
        fill="none" stroke={C.border} strokeWidth={1.5} />

      {/* ── Title Block ── */}
      <rect x={8} y={590} width={1364} height={44} fill="rgba(14,20,35,0.97)" stroke={C.border} strokeWidth={1} />
      <line x1={8} y1={603} x2={1372} y2={603} stroke={C.border} strokeWidth={0.5} />
      <text x={500} y={598} textAnchor="middle" fill={C.title} fontSize={10} fontWeight={700} letterSpacing="0.06em">
        AT-200 — EXTRACCIÓN DE ÁCIDO TARTÁRICO
      </text>
      <text x={500} y={611} textAnchor="middle" fill={C.subtitle} fontSize={7}>
        CaC₄H₄O₆ + H₂SO₄ → C₄H₆O₆ + CaSO₄  |  Residuos Vitivinícolas  |  Cristalización  |  ISA 5.1
      </text>
      <text x={500} y={624} textAnchor="middle" fill={C.muted} fontSize={6}>
        P&ID — PetroVision RTIC  |  Tesis 2026  |  Rev.A  |  Escala: 1/NTS
      </text>
      <line x1={870} y1={590} x2={870} y2={634} stroke={C.border} strokeWidth={0.5} />
      <text x={962} y={601} textAnchor="middle" fill={C.muted} fontSize={7}>Nro. Plano: AT-PFD-001</text>
      <text x={962} y={613} textAnchor="middle" fill={C.muted} fontSize={7}>Rev: A  |  2026-01</text>
      <text x={962} y={625} textAnchor="middle" fill={C.muted} fontSize={7}>PetroVision Tesis 2026</text>
      <line x1={1052} y1={590} x2={1052} y2={634} stroke={C.border} strokeWidth={0.5} />
      <line x1={1060} y1={600} x2={1105} y2={600} stroke={C.processLine} strokeWidth={2} />
      <text x={1110} y={603} fill={C.muted} fontSize={5.5} fontFamily="monospace">Proceso</text>
      <line x1={1060} y1={610} x2={1105} y2={610} stroke={C.steamLine}   strokeWidth={1.5} strokeDasharray="5 3" />
      <text x={1110} y={613} fill={C.muted} fontSize={5.5} fontFamily="monospace">Vapor</text>
      <line x1={1060} y1={620} x2={1105} y2={620} stroke={C.coolantLine} strokeWidth={1.5} strokeDasharray="3 1" />
      <text x={1110} y={623} fill={C.muted} fontSize={5.5} fontFamily="monospace">Refrig.</text>
      <line x1={1155} y1={600} x2={1200} y2={600} stroke={C.signalLine}  strokeWidth={0.8} strokeDasharray="2 2" />
      <text x={1205} y={603} fill={C.muted} fontSize={5.5} fontFamily="monospace">Señal</text>
      <line x1={1155} y1={610} x2={1200} y2={610} stroke={C.productLine} strokeWidth={2} />
      <text x={1205} y={613} fill={C.muted} fontSize={5.5} fontFamily="monospace">Producto</text>

      {/* ── Area Zones ── */}
      <AreaZone x={18}   y={30} w={170} h={549} label="SECC. 201 — MATERIA PRIMA" />
      <AreaZone x={195}  y={30} w={195} h={549} label="SECC. 202 — DESULFITACIÓN" />
      <AreaZone x={397}  y={30} w={148} h={549} label="SECC. 203 — FILTRACIÓN" />
      <AreaZone x={552}  y={30} w={177} h={549} label="SECC. 204 — INTERCAMBIO" />
      <AreaZone x={736}  y={30} w={213} h={549} label="SECC. 205 — EVAPORACIÓN" />
      <AreaZone x={956}  y={30} w={178} h={549} label="SECC. 206 — CRISTALIZACIÓN" />
      <AreaZone x={1141} y={30} w={231} h={549} label="SECC. 207 — PRODUCTO" />

      {/* ══ PROCESS LINES ══ */}

      {/* S01: TK-201 → P-201 */}
      <Pipe d="M 100,312 L 100,365" />
      <FlowDots path="M 100,312 L 100,365" n={3} dur={5} />
      <StreamNum x={112} y={336} n={1} />

      {/* S02: P-201 → R-201 */}
      <Pipe d="M 100,390 L 100,427 L 232,427 L 232,378" />
      <FlowDots path="M 100,390 L 100,427 L 232,427 L 232,378" n={3} dur={5} />
      <StreamNum x={166} y={417} n={2} />

      {/* H2SO4 into R-201 */}
      <Pipe d="M 207,320 L 232,320 L 232,258" color={C.steamLine} w={1.2} />
      <text x={188} y={316} fill={C.steamLine} fontSize={6} fontFamily="monospace">H₂SO₄</text>

      {/* S03: R-201 → F-201 */}
      <Pipe d="M 312,320 L 412,320" />
      <FlowDots path="M 312,320 L 412,320" n={3} dur={4} />
      <StreamNum x={362} y={309} n={3} />

      {/* Cake from F-201 */}
      <Pipe d="M 466,350 L 466,400 L 510,400" color={C.muted} w={1} />
      <text x={515} y={403} fill={C.muted} fontSize={6} fontFamily="monospace">CaSO₄ →</text>

      {/* S04: F-201 → E-201 */}
      <Pipe d="M 544,320 L 592,320" />
      <FlowDots path="M 544,320 L 592,320" n={3} dur={3} />
      <StreamNum x={568} y={309} n={4} />

      {/* S05: E-201 → EV-201 */}
      <Pipe d="M 672,320 L 737,320" />
      <FlowDots path="M 672,320 L 737,320" n={3} dur={3} color="#f59e0b" />
      <StreamNum x={704} y={309} n={5} />
      <CondTag x={704} y={332} items={['T≈85°C','pH≈2']} />

      {/* Steam to EV-201 */}
      <Pipe d="M 757,272 L 757,254 L 784,254" color={C.steamLine} w={1.2} dash="5 3" />
      <text x={788} y={257} fill={C.steamLine} fontSize={6} fontFamily="monospace">Vapor</text>

      {/* S06: EV-201 → EV-202 */}
      <Pipe d="M 837,320 L 880,320" />
      <FlowDots path="M 837,320 L 880,320" n={3} dur={3} color="#f59e0b" />
      <StreamNum x={858} y={309} n={6} />

      {/* Condensate EV-201 */}
      <Pipe d="M 797,272 L 797,230 L 737,230" color={C.coolantLine} w={1} dash="3 2" />
      <text x={732} y={225} fill={C.coolantLine} fontSize={6} textAnchor="end" fontFamily="monospace">Cond.</text>

      {/* Steam to EV-202 */}
      <Pipe d="M 900,272 L 900,254 L 928,254" color={C.steamLine} w={1.2} dash="5 3" />
      <text x={932} y={257} fill={C.steamLine} fontSize={6} fontFamily="monospace">Vapor</text>

      {/* S07: EV-202 → CR-201 */}
      <Pipe d="M 960,320 L 994,320" color="#06b6d4" />
      <FlowDots path="M 960,320 L 994,320" n={3} dur={3} color="#06b6d4" />
      <StreamNum x={977} y={309} n={7} />
      <CondTag x={977} y={332} items={['Conc.40%','T≈70°C']} />

      {/* Cooling CR-201 */}
      <Pipe d="M 1022,286 L 1022,258 L 1067,258" color={C.coolantLine} w={1.2} dash="3 1" />
      <text x={1071} y={261} fill={C.coolantLine} fontSize={6} fontFamily="monospace">CW in</text>
      <Pipe d="M 1117,286 L 1117,258 L 1162,258" color={C.coolantLine} w={1.2} dash="3 1" />
      <text x={1166} y={261} fill={C.coolantLine} fontSize={6} fontFamily="monospace">CW out</text>

      {/* S08: CR-201 → C-201 */}
      <Pipe d="M 1114,320 L 1177,320 L 1177,262" />
      <FlowDots path="M 1114,320 L 1177,320 L 1177,262" n={3} dur={3} color="#14b8a6" />
      <StreamNum x={1146} y={309} n={8} />

      {/* Mother liquor recycle */}
      <Pipe d="M 1177,300 L 1177,465 L 880,465 L 880,382" color={C.muted} w={1} dash="4 3" />
      <text x={1022} y={474} fill={C.muted} fontSize={6} textAnchor="middle" fontFamily="monospace">Reciclo licor madre</text>

      {/* S09: C-201 → D-201 */}
      <Pipe d="M 1199,238 L 1252,238" color="#f43f5e" />
      <FlowDots path="M 1199,238 L 1252,238" n={3} dur={2.5} color="#f43f5e" />
      <StreamNum x={1226} y={228} n={9} />

      {/* S10: D-201 → product out */}
      <Pipe d="M 1302,264 L 1302,308 L 1344,308" color={C.productLine} />
      <FlowDots path="M 1302,264 L 1302,308 L 1344,308" n={3} dur={3} color={C.productLine} />
      <StreamNum x={1318} y={297} n={10} />
      <text x={1348} y={311} fill={C.productLine} fontSize={7} fontFamily="monospace">► Ác. Tartárico</text>
      <CondTag x={1312} y={322} items={['≥99.5%','2.08 kg/h']} />

      {/* ══ EQUIPMENT ══ */}
      <g className="equip-interactive" onClick={(e) => { e.stopPropagation(); onSelectEquipment?.('TK-201'); }}>
        <Vessel x={65}   y={162} w={70} h={150} tag="TK-201" name="Tanque MP Orujo"
          fillLevel={val('LI-201') ?? 55} id="tk201at" />
      </g>
      <g className="equip-interactive" onClick={(e) => { e.stopPropagation(); onSelectEquipment?.('P-201'); }}>
        <Pump x={100} y={377} tag="P-201" />
      </g>
      <ControlValve x={232} y={427} actuatorType="FO" />
      <g className="equip-interactive" onClick={(e) => { e.stopPropagation(); onSelectEquipment?.('R-201'); }}>
        <Reactor x={232} y={188} w={80} h={190} tag="R-201" name="Reactor Desulfitación H₂SO₄" />
      </g>
      <g className="equip-interactive" onClick={(e) => { e.stopPropagation(); onSelectEquipment?.('F-201'); }}>
        <Filter x={412} y={292} w={132} h={56} tag="F-201" name="Filtro Prensa" />
      </g>

      {/* E-201: Ion exchange */}
      <g className="equip-interactive" onClick={(e) => { e.stopPropagation(); onSelectEquipment?.('E-201'); }}>
        <defs>
          <linearGradient id="ie201g" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <rect x={592} y={290} width={80} height={60} rx={5}
          fill="url(#ie201g)" stroke="#8b5cf6" strokeWidth={1.5} />
        <text x={632} y={317} textAnchor="middle" fill="#8b5cf6" fontSize={14} fontFamily="monospace">⇌</text>
        <text x={632} y={334} textAnchor="middle" fill="#8b5cf6" fontSize={6} fontFamily="monospace">H⁺ / Ca²⁺</text>
        <text x={632} y={278} textAnchor="middle" fill={C.title} fontSize={8} fontWeight={700} fontFamily="monospace">E-201</text>
        <text x={632} y={362} textAnchor="middle" fill={C.subtitle} fontSize={6}>Acidulación</text>
      </g>

      <g className="equip-interactive" onClick={(e) => { e.stopPropagation(); onSelectEquipment?.('EV-201'); }}>
        <Evaporator x={737} y={200} w={60} h={145} tag="EV-201" name="Evaporador 1°" />
      </g>
      <g className="equip-interactive" onClick={(e) => { e.stopPropagation(); onSelectEquipment?.('EV-202'); }}>
        <Evaporator x={880} y={200} w={60} h={145} tag="EV-202" name="Evaporador 2°" />
      </g>
      <g className="equip-interactive" onClick={(e) => { e.stopPropagation(); onSelectEquipment?.('CR-201'); }}>
        <Crystallizer x={994} y={298} w={120} h={56} tag="CR-201" name="Cristalizador" />
      </g>
      <g className="equip-interactive" onClick={(e) => { e.stopPropagation(); onSelectEquipment?.('C-201'); }}>
        <Centrifuge x={1177} y={238} r={22} tag="C-201" name="Centrífuga" />
      </g>
      <g className="equip-interactive" onClick={(e) => { e.stopPropagation(); onSelectEquipment?.('D-201'); }}>
        <Dryer x={1252} y={200} w={50} h={64} tag="D-201" name="Secador" />
      </g>
      <g className="equip-interactive" onClick={(e) => { e.stopPropagation(); onSelectEquipment?.('TK-202'); }}>
        <Vessel x={1306} y={342} w={58} h={80} tag="TK-202" name="Producto Final" color={C.productLine}
          fillLevel={75} id="tk202at" />
      </g>

      {/* ══ CONTROL LOOPS ══ */}

      {/* TIC-201: reactor T controller */}
      <line x1={232} y1={285} x2={202} y2={285} stroke={C.processLine} strokeWidth={0.6} />
      <InstrBubble x={185} y={285} code="TIC" tag="TI-201" unit="°C" {...inst('TI-201')} type="dcs" />
      <SignalLine d="M 185,301 L 185,447 L 232,447" />

      {/* FIC-201: feed flow */}
      <line x1={100} y1={427} x2={62} y2={427} stroke={C.processLine} strokeWidth={0.6} />
      <InstrBubble x={44} y={427} code="FIC" tag="FI-201" unit="kg/h" {...inst('FI-201')} type="dcs" />
      <SignalLine d="M 44,443 L 44,496 L 232,496 L 232,441" />

      {/* LIC-201: TK-201 level */}
      <line x1={65} y1={237} x2={36} y2={237} stroke={C.processLine} strokeWidth={0.6} />
      <InstrBubble x={20} y={237} code="LIC" tag="LI-201" unit="%" {...inst('LI-201')} type="dcs" />

      {/* PIC-201: evaporator pressure */}
      <line x1={737} y1={272} x2={712} y2={248} stroke={C.processLine} strokeWidth={0.6} />
      <InstrBubble x={696} y={232} code="PIC" tag="PI-201" unit="bar" {...inst('PI-201')} type="dcs" />

      {/* TI-202: EV-201 T */}
      <line x1={797} y1={272} x2={824} y2={257} stroke={C.processLine} strokeWidth={0.6} />
      <InstrBubble x={840} y={244} code="TI" tag="TI-202" unit="°C" {...inst('TI-202')} type="field" />

      {/* TI-203: EV-202 T */}
      <line x1={940} y1={272} x2={967} y2={257} stroke={C.processLine} strokeWidth={0.6} />
      <InstrBubble x={982} y={244} code="TI" tag="TI-203" unit="°C" {...inst('TI-203')} type="field" />

      {/* TIC-205: crystallizer T */}
      <line x1={1054} y1={354} x2={1054} y2={400} stroke={C.processLine} strokeWidth={0.6} />
      <InstrBubble x={1054} y={416} code="TIC" tag="TI-205" unit="°C" {...inst('TI-205')} type="dcs" />

      {/* AI-201: product purity */}
      <line x1={1302} y1={263} x2={1302} y2={394} stroke={C.processLine} strokeWidth={0.6} />
      <InstrBubble x={1302} y={410} code="AI" tag="AI-201" unit="%" {...inst('AI-201')} type="dcs" />

      {/* AI-202: pH analyzer */}
      <line x1={592} y1={320} x2={567} y2={372} stroke={C.processLine} strokeWidth={0.6} />
      <InstrBubble x={552} y={388} code="AI" tag="AI-202" unit="pH" {...inst('AI-202')} type="field" />

      {/* FI-202: product flow */}
      <line x1={1344} y1={308} x2={1366} y2={308} stroke={C.processLine} strokeWidth={0.6} />
      <InstrBubble x={1363} y={292} code="FI" tag="FI-202" unit="kg/h" {...inst('FI-202')} type="field" />
    </svg>
  );
}


// =============================================================
// MAIN COMPONENT
// =============================================================
export default function ProcessFlowDiagram() {
  const { processes, instruments, liveData, activeProcessId, setActiveProcess } = useProcess();
  const [selectedProcessId, setSelectedProcessId] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeProcessId) setSelectedProcessId(activeProcessId);
    else if (processes.length > 0) setSelectedProcessId(processes[0].id);
  }, [activeProcessId, processes]);

  // ── Fullscreen ──
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = () => {
    if (!wrapperRef.current) return;
    if (!document.fullscreenElement) {
      wrapperRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // ── Wheel zoom ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      setZoom((z) => Math.min(4, Math.max(0.2, +(z + delta).toFixed(2))));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // ── Pan handlers ──
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!isPanning) return;
    setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  };
  const onPointerUp = () => setIsPanning(false);

  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const selectedProcess = useMemo(
    () => processes.find((p) => p.id === selectedProcessId),
    [processes, selectedProcessId]
  );

  const procInstruments = useMemo(
    () => instruments.filter((i) => i.process_id === selectedProcessId),
    [instruments, selectedProcessId]
  );

  const processCode  = selectedProcess?.code || 'MA-100';
  const activeCnt    = procInstruments.filter((i) => liveData[i.tag] != null).length;
  const alarmedCnt   = procInstruments.filter((i) => {
    const v = liveData[i.tag]?.value;
    if (v == null) return false;
    return (i.hihi != null && v >= i.hihi) || (i.lolo != null && v <= i.lolo);
  }).length;

  const tR = processCode === 'MA-100' ? liveData['TI-101']?.value : liveData['TI-201']?.value;
  const pR = processCode === 'MA-100' ? liveData['PI-101']?.value : liveData['PI-201']?.value;

  return (
    <div ref={wrapperRef}
      style={isFullscreen ? {
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'var(--bg-primary, #07090f)',
        padding: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column',
      } : undefined}
    >
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={18} />
            Diagrama P&amp;ID en Tiempo Real
          </h1>
          <p className="text-sm text-muted">
            Simbología ISA 5.1 · Lazos PID · Corrientes etiquetadas · Block de título ingenieril
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Zoom & view controls */}
          <div style={{
            display: 'flex', gap: 4, alignItems: 'center',
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: 8, padding: '4px 8px',
          }}>
            <button onClick={() => setZoom(z => Math.max(0.2, +(z - 0.1).toFixed(2)))}
              className="btn btn-secondary" style={{ padding: '2px 8px' }} title="Alejar">
              <ZoomOut size={12} />
            </button>
            <span className="mono text-xs" style={{ minWidth: 40, textAlign: 'center' }}>
              {(zoom * 100).toFixed(0)}%
            </span>
            <button onClick={() => setZoom(z => Math.min(4, +(z + 0.1).toFixed(2)))}
              className="btn btn-secondary" style={{ padding: '2px 8px' }} title="Acercar">
              <ZoomIn size={12} />
            </button>
            <div style={{ width: 1, height: 16, background: 'var(--border-color)' }} />
            <button onClick={resetView} className="btn btn-secondary"
              style={{ padding: '2px 8px' }} title="Restablecer vista">
              <RotateCcw size={12} />
            </button>
            <button onClick={toggleFullscreen} className="btn btn-secondary"
              style={{ padding: '2px 8px' }} title={isFullscreen ? 'Salir pantalla completa' : 'Pantalla completa'}>
              {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            </button>
          </div>
          {/* Pan hint */}
          <span className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Move size={10} /> Arrastrar · Ctrl+Rueda = Zoom
          </span>
          {/* Process selector */}
          {processes.map((p) => (
            <button key={p.id}
              className={`btn ${p.id === selectedProcessId ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setSelectedProcessId(p.id); setActiveProcess(p.id); }}>
              {p.code}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 12 }}>
        {([
          { icon: <FlaskConical size={15} color="var(--accent-purple)" />, label: 'Proceso',   value: processCode,                           color: 'var(--text-primary)'  },
          { icon: <Gauge        size={15} color="var(--accent-blue)"   />, label: 'Activos',   value: `${activeCnt}/${procInstruments.length}`,color: 'var(--accent-blue)'   },
          { icon: <Thermometer  size={15} color="var(--accent-green)"  />, label: 'T Reactor', value: `${tR?.toFixed(1) ?? '---'} °C`,        color: 'var(--accent-green)'  },
          { icon: <Wind         size={15} color="var(--accent-cyan)"   />, label: 'P Reactor', value: `${pR?.toFixed(2) ?? '---'} bar`,        color: 'var(--accent-cyan)'   },
          {
            icon:  <Activity size={15} color={alarmedCnt > 0 ? 'var(--accent-red)' : 'var(--accent-green)'} />,
            label: 'En Alarma',
            value: `${alarmedCnt} instr.`,
            color: alarmedCnt > 0 ? 'var(--accent-red)' : 'var(--accent-green)',
          },
        ] as const).map(({ icon, label, value, color }) => (
          <div key={label} className="card" style={{ padding: '0.6rem 0.75rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            {icon}
            <div>
              <div className="text-xs text-muted">{label}</div>
              <div className="mono" style={{ fontWeight: 700, color }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Diagram ── */}
      <div className="card" ref={containerRef}
        style={{
          padding: 0, overflow: 'hidden', position: 'relative',
          cursor: isPanning ? 'grabbing' : 'grab',
          ...(isFullscreen ? { flex: 1, minHeight: 0 } : {}),
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          transition: isPanning ? 'none' : 'transform 0.15s ease',
          willChange: 'transform',
        }}>
          {processCode === 'AT-200'
            ? <AT200Diagram liveData={liveData} instruments={procInstruments} onSelectEquipment={setSelectedEquipment} />
            : <MA100Diagram liveData={liveData} instruments={procInstruments} onSelectEquipment={setSelectedEquipment} />}
        </div>

        {/* Equipment Detail Panel */}
        {selectedEquipment && (
          <EquipmentDetailPanel
            tag={selectedEquipment}
            liveData={liveData}
            instruments={procInstruments}
            onClose={() => setSelectedEquipment(null)}
          />
        )}
      </div>

      {/* ── Legend ── */}
      <div className="card" style={{ marginTop: 10, padding: '0.6rem 1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'center' }}>
          <span className="text-xs" style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.7rem' }}>
            LEYENDA ISA 5.1:
          </span>

          {/* DCS bubble */}
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width={26} height={26}>
              <circle cx={13} cy={13} r={11} fill="#0a1628" stroke="#22c55e" strokeWidth={1.5} />
              <circle cx={13} cy={13} r={6}  fill="none"   stroke="#22c55e" strokeWidth={0.7} strokeDasharray="2 1.5" opacity={0.6} />
              <line x1={2} y1={13} x2={24} y2={13} stroke="#22c55e" strokeWidth={0.4} opacity={0.4} />
              <text x={13} y={11} textAnchor="middle" fill="#22c55e" fontSize={5} fontFamily="monospace">TIC</text>
              <text x={13} y={18} textAnchor="middle" fill="#22c55e" fontSize={4.5} fontFamily="monospace">420.1</text>
            </svg>
            <span className="text-xs text-muted">DCS (interior)</span>
          </span>

          {/* Field bubble */}
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width={26} height={26}>
              <circle cx={13} cy={13} r={11} fill="#0a1628" stroke="#22c55e" strokeWidth={1.5} />
              <line x1={2} y1={13} x2={24} y2={13} stroke="#22c55e" strokeWidth={0.4} opacity={0.4} />
              <text x={13} y={11} textAnchor="middle" fill="#22c55e" fontSize={5} fontFamily="monospace">FI</text>
              <text x={13} y={18} textAnchor="middle" fill="#22c55e" fontSize={4.5} fontFamily="monospace">220.5</text>
            </svg>
            <span className="text-xs text-muted">Campo</span>
          </span>

          {/* Status */}
          {(['#22c55e','Normal'],['#f59e0b','Warning'],['#ef4444','Alarma']).map(([c, l]) => (
            <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: c, display: 'inline-block' }} />
              <span className="text-xs text-muted">{l}</span>
            </span>
          ))}

          {/* Line types */}
          {([
            ['#3b82f6', '',    'Proceso'],
            ['#f87171', '5 3','Vapor'],
            ['#38bdf8', '3 1','Refrig.'],
            ['#fbbf24', '3 2','Señal'],
            ['#34d399', '',   'Producto'],
            ['#94a3b8', '2 2','Utilidades'],
          ] as [string,string,string][]).map(([stroke, dash, label]) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width={26} height={8}>
                <line x1={0} y1={4} x2={26} y2={4} stroke={stroke} strokeWidth={1.8}
                  strokeDasharray={dash || 'none'} />
              </svg>
              <span className="text-xs text-muted">{label}</span>
            </span>
          ))}

          {/* Stream number */}
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width={16} height={16}>
              <circle cx={8} cy={8} r={7} fill="#1e293b" stroke="#475569" strokeWidth={0.8} />
              <text x={8} y={9} textAnchor="middle" fill="#e2e8f0" fontSize={5.5} fontFamily="monospace">3</text>
            </svg>
            <span className="text-xs text-muted">Nro. corriente</span>
          </span>
        </div>
      </div>
    </div>
  );
}
