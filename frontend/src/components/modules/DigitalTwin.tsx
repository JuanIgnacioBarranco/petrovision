// ============================================================
// PetroVision — Digital Twin P&ID with Overlay Layers
// ============================================================
// Interactive process twin with toggleable overlay layers:
//   🟢 Health    — equipment health rings + RUL badges
//   🔵 Streams   — real-time flow values on each stream
//   🟠 Divergence — model vs plant deviation indicators
//   🟣 PID       — control valve output bars + mode color
// ============================================================

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useProcess } from '@/hooks/useProcess';
import { digitalTwinAPI } from '@/services/api';
import type { DigitalTwinSnapshot, DTEquipmentHealth, DTPIDStatus } from '@/types';
import {
  Cpu, Heart, Waves, GitCompareArrows, SlidersHorizontal,
  RefreshCw, ZoomIn, ZoomOut, Maximize2, Minimize2,
  Move, RotateCcw, X, Activity, Gauge, Thermometer,
  Clock, AlertTriangle, Wrench, ChevronRight,
} from 'lucide-react';
import {
  C, vCol, FlowDots, InstrBubble, SignalLine, Pipe, ArrowMarker,
  StreamNum, CondTag, AreaZone, Vessel, Reactor, Column,
  HeatExchanger, Pump, ControlValve, PSV, Filter,
  Evaporator, Crystallizer, Centrifuge, Dryer, Compressor,
} from './pid/SVGComponents';

// ── Overlay layer definitions ───────────────────────────────
type OverlayKey = 'health' | 'streams' | 'divergence' | 'pid';

const OVERLAYS: { key: OverlayKey; label: string; icon: typeof Heart; color: string; description: string }[] = [
  { key: 'health',     label: 'Salud',       icon: Heart,             color: '#22c55e', description: 'Health index & RUL de equipos' },
  { key: 'streams',    label: 'Corrientes',  icon: Waves,             color: '#3b82f6', description: 'Valores reales en corrientes' },
  { key: 'divergence', label: 'Divergencia', icon: GitCompareArrows,  color: '#f97316', description: 'Desviación modelo vs. planta' },
  { key: 'pid',        label: 'PID',         icon: SlidersHorizontal, color: '#a855f7', description: 'Estado de lazos de control' },
];

// ── Equipment position maps for overlay rendering ───────────
const MA100_EQUIPMENT: Record<string, { x: number; y: number; type: string }> = {
  'TK-101': { x: 60, y: 260, type: 'tank' },
  'C-101':  { x: 160, y: 230, type: 'compressor' },
  'P-101':  { x: 125, y: 390, type: 'pump' },
  'E-101':  { x: 280, y: 260, type: 'exchanger' },
  'R-101':  { x: 440, y: 180, type: 'reactor' },
  'E-102':  { x: 600, y: 260, type: 'exchanger' },
  'T-101':  { x: 750, y: 150, type: 'column' },
  'T-102':  { x: 940, y: 150, type: 'column' },
  'K-101':  { x: 1080, y: 260, type: 'vessel' },
  'F-101':  { x: 1180, y: 260, type: 'filter' },
  'TK-102': { x: 1280, y: 260, type: 'tank' },
};

const AT200_EQUIPMENT: Record<string, { x: number; y: number; type: string }> = {
  'TK-201': { x: 60, y: 220, type: 'tank' },
  'P-201':  { x: 140, y: 370, type: 'pump' },
  'R-201':  { x: 280, y: 180, type: 'reactor' },
  'F-201':  { x: 440, y: 250, type: 'filter' },
  'E-201':  { x: 570, y: 230, type: 'exchanger' },
  'EV-201': { x: 700, y: 160, type: 'evaporator' },
  'EV-202': { x: 820, y: 160, type: 'evaporator' },
  'CR-201': { x: 960, y: 240, type: 'crystallizer' },
  'C-201':  { x: 1080, y: 280, type: 'centrifuge' },
  'D-201':  { x: 1170, y: 200, type: 'dryer' },
  'TK-202': { x: 1280, y: 220, type: 'tank' },
};

// Stream → flow instrument tag mapping
const MA100_STREAMS: Record<number, string> = {
  1: 'FI-101', 2: 'FI-102', 3: 'FI-103', 4: 'FI-101',
};
const AT200_STREAMS: Record<number, string> = {
  1: 'FI-201', 2: 'FI-202', 3: 'FI-201',
};

// ── Health ring colors ──────────────────────────────────────
function healthColor(index: number): string {
  if (index >= 0.8) return '#22c55e';
  if (index >= 0.5) return '#f59e0b';
  return '#ef4444';
}

function urgencyBadge(u: string): { bg: string; fg: string } {
  switch (u) {
    case 'critical': return { bg: '#ef4444', fg: '#fff' };
    case 'high':     return { bg: '#f97316', fg: '#fff' };
    case 'medium':   return { bg: '#f59e0b', fg: '#000' };
    default:         return { bg: '#22c55e', fg: '#000' };
  }
}

function modeColor(mode: string): string {
  switch (mode) {
    case 'AUTO':    return '#22c55e';
    case 'MANUAL':  return '#f59e0b';
    case 'CASCADE': return '#a855f7';
    default:        return '#64748b';
  }
}

// =============================================================
// MAIN COMPONENT
// =============================================================
export default function DigitalTwin() {
  const { processes, instruments, liveData, activeProcessId, setActiveProcess } = useProcess();

  // ── State ─────────────────────────────────────────────────
  const [selectedProcessId, setSelectedProcessId] = useState<number | null>(null);
  const [activeOverlays, setActiveOverlays] = useState<Set<OverlayKey>>(new Set(['health']));
  const [snapshot, setSnapshot] = useState<DigitalTwinSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timeSinceUpdate, setTimeSinceUpdate] = useState('--');

  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // ── Initialize process ────────────────────────────────────
  useEffect(() => {
    if (activeProcessId) setSelectedProcessId(activeProcessId);
    else if (processes.length > 0) setSelectedProcessId(processes[0].id);
  }, [activeProcessId, processes]);

  // ── Fetch snapshot ────────────────────────────────────────
  const fetchSnapshot = useCallback(async () => {
    if (!selectedProcessId) return;
    setLoading(true);
    try {
      const res = await digitalTwinAPI.snapshot(selectedProcessId);
      setSnapshot(res.data);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Digital Twin snapshot error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedProcessId]);

  useEffect(() => { fetchSnapshot(); }, [fetchSnapshot]);

  // ── Auto-refresh every 5s ─────────────────────────────────
  useEffect(() => {
    const iv = setInterval(fetchSnapshot, 5000);
    return () => clearInterval(iv);
  }, [fetchSnapshot]);

  // ── Time since last update ticker ─────────────────────────
  useEffect(() => {
    const iv = setInterval(() => {
      if (lastUpdate) {
        const secs = Math.round((Date.now() - lastUpdate.getTime()) / 1000);
        setTimeSinceUpdate(secs < 60 ? `${secs}s` : `${Math.floor(secs / 60)}m ${secs % 60}s`);
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [lastUpdate]);

  // ── Overlay toggle ────────────────────────────────────────
  const toggleOverlay = (key: OverlayKey) => {
    setActiveOverlays((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // ── Fullscreen ────────────────────────────────────────────
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);
  const toggleFullscreen = () => {
    if (!wrapperRef.current) return;
    if (!document.fullscreenElement) wrapperRef.current.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  };

  // ── Zoom & Pan ────────────────────────────────────────────
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

  // ── Derived data ──────────────────────────────────────────
  const selectedProcess = useMemo(
    () => processes.find((p) => p.id === selectedProcessId),
    [processes, selectedProcessId]
  );
  const processCode = selectedProcess?.code || 'MA-100';
  const procInstruments = useMemo(
    () => instruments.filter((i) => i.process_id === selectedProcessId),
    [instruments, selectedProcessId]
  );
  const equipMap = processCode === 'AT-200' ? AT200_EQUIPMENT : MA100_EQUIPMENT;
  const streamMap = processCode === 'AT-200' ? AT200_STREAMS : MA100_STREAMS;

  const activeCnt = procInstruments.filter((i) => liveData[i.tag] != null).length;
  const alarmedCnt = procInstruments.filter((i) => {
    const v = liveData[i.tag]?.value;
    if (v == null) return false;
    return (i.hihi != null && v >= i.hihi) || (i.lolo != null && v <= i.lolo);
  }).length;
  const eqHealthy = snapshot
    ? Object.values(snapshot.equipment_health).filter((e) => e.health_index >= 0.8).length
    : 0;
  const eqTotal = snapshot ? Object.keys(snapshot.equipment_health).length : 0;

  // ── Equipment detail data ─────────────────────────────────
  const selEqData: DTEquipmentHealth | null = useMemo(() => {
    if (!selectedEquipment || !snapshot) return null;
    return snapshot.equipment_health[selectedEquipment] || null;
  }, [selectedEquipment, snapshot]);

  const selPidData: DTPIDStatus | null = useMemo(() => {
    if (!selectedEquipment || !snapshot) return null;
    // Find PID loop whose cv_tag matches equipment or whose tag relates
    for (const [tag, pid] of Object.entries(snapshot.pid_status)) {
      if (pid.cv_tag === selectedEquipment || tag.includes(selectedEquipment.replace(/[A-Z]-/, ''))) {
        return pid;
      }
    }
    return null;
  }, [selectedEquipment, snapshot]);

  // =============================================================
  // RENDER
  // =============================================================
  return (
    <div ref={wrapperRef}
      style={isFullscreen ? {
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'var(--bg-primary, #07090f)',
        padding: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column',
      } : undefined}
    >
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexShrink: 0, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h1 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cpu size={18} style={{ color: 'var(--accent-cyan)' }} />
            Digital Twin — Gemelo Digital P&amp;ID
          </h1>
          <p className="text-sm text-muted">
            Capas interactivas sobre el P&amp;ID en tiempo real · Salud · Corrientes · Divergencia · PID
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Refresh indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: 8, padding: '4px 10px', fontSize: '0.72rem',
          }}>
            <Clock size={12} style={{ color: 'var(--accent-cyan)' }} />
            <span className="mono text-muted">Actualizado hace {timeSinceUpdate}</span>
            <button onClick={fetchSnapshot} className="btn btn-secondary" style={{ padding: '2px 6px' }}
              title="Refrescar ahora" disabled={loading}>
              <RefreshCw size={11} className={loading ? 'spin' : ''} />
            </button>
          </div>

          {/* Zoom controls */}
          <div style={{
            display: 'flex', gap: 4, alignItems: 'center',
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: 8, padding: '4px 8px',
          }}>
            <button onClick={() => setZoom(z => Math.max(0.2, +(z - 0.1).toFixed(2)))}
              className="btn btn-secondary" style={{ padding: '2px 8px' }}>
              <ZoomOut size={12} />
            </button>
            <span className="mono text-xs" style={{ minWidth: 40, textAlign: 'center' }}>
              {(zoom * 100).toFixed(0)}%
            </span>
            <button onClick={() => setZoom(z => Math.min(4, +(z + 0.1).toFixed(2)))}
              className="btn btn-secondary" style={{ padding: '2px 8px' }}>
              <ZoomIn size={12} />
            </button>
            <div style={{ width: 1, height: 16, background: 'var(--border-color)' }} />
            <button onClick={resetView} className="btn btn-secondary" style={{ padding: '2px 8px' }}>
              <RotateCcw size={12} />
            </button>
            <button onClick={toggleFullscreen} className="btn btn-secondary" style={{ padding: '2px 8px' }}>
              {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            </button>
          </div>

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

      {/* ── Overlay Toggle Bar ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {OVERLAYS.map(({ key, label, icon: Icon, color, description }) => {
          const active = activeOverlays.has(key);
          return (
            <button key={key}
              onClick={() => toggleOverlay(key)}
              title={description}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600,
                border: `1.5px solid ${active ? color : 'var(--border-color)'}`,
                background: active ? `${color}18` : 'var(--bg-card)',
                color: active ? color : 'var(--text-muted)',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              <Icon size={14} />
              {label}
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: active ? color : 'transparent',
                border: `1.5px solid ${active ? color : 'var(--border-color)'}`,
                transition: 'all 0.2s',
              }} />
            </button>
          );
        })}

        {/* KPIs mini strip */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
          {[
            { icon: <Gauge size={13} color="var(--accent-blue)" />, label: 'Instrumentos', value: `${activeCnt}/${procInstruments.length}` },
            { icon: <Heart size={13} color="var(--accent-green)" />, label: 'Equipos sanos', value: `${eqHealthy}/${eqTotal}` },
            { icon: <AlertTriangle size={13} color={alarmedCnt > 0 ? 'var(--accent-red)' : 'var(--accent-green)'} />, label: 'Alarmas', value: `${alarmedCnt}` },
          ].map(({ icon, label, value }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {icon}
              <div>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{label}</div>
                <div className="mono" style={{ fontSize: '0.78rem', fontWeight: 700 }}>{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Diagram Area ── */}
      <div style={{ display: 'flex', gap: 0, flex: isFullscreen ? 1 : undefined, minHeight: isFullscreen ? 0 : undefined }}>
        {/* SVG P&ID + Overlays */}
        <div className="card" ref={containerRef}
          style={{
            flex: 1, padding: 0, overflow: 'hidden', position: 'relative',
            cursor: isPanning ? 'grabbing' : 'grab',
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
            <svg
              viewBox={processCode === 'AT-200' ? '0 0 1380 640' : '0 0 1380 660'}
              width="100%"
              style={{ display: 'block' }}
            >
              {/* Base P&ID rendered from live data (reusing store's liveData) */}
              <BaseDiagram
                processCode={processCode}
                liveData={liveData}
                instruments={procInstruments}
                onSelectEquipment={setSelectedEquipment}
              />

              {/* ── OVERLAY: Health ── */}
              {activeOverlays.has('health') && snapshot && (
                <g className="overlay-health">
                  {Object.entries(snapshot.equipment_health).map(([tag, eq]) => {
                    const pos = equipMap[tag];
                    if (!pos) return null;
                    const col = healthColor(eq.health_index);
                    const { bg, fg } = urgencyBadge(eq.urgency);
                    return (
                      <g key={`h-${tag}`} style={{ cursor: 'pointer' }} onClick={() => setSelectedEquipment(tag)}>
                        {/* Health ring */}
                        <circle cx={pos.x} cy={pos.y} r={24} fill="none" stroke={col}
                          strokeWidth={2.5} strokeDasharray={`${eq.health_index * 151} 151`}
                          opacity={0.85} transform={`rotate(-90 ${pos.x} ${pos.y})`}>
                          <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" />
                        </circle>
                        {/* Health % label */}
                        <rect x={pos.x + 18} y={pos.y - 28} width={36} height={14} rx={4}
                          fill={col} opacity={0.9} />
                        <text x={pos.x + 36} y={pos.y - 19} textAnchor="middle"
                          fill="#000" fontSize={7} fontWeight={700} fontFamily="monospace">
                          {(eq.health_index * 100).toFixed(0)}%
                        </text>
                        {/* RUL badge */}
                        <rect x={pos.x + 18} y={pos.y - 12} width={36} height={12} rx={3}
                          fill="rgba(0,0,0,0.7)" stroke={col} strokeWidth={0.5} />
                        <text x={pos.x + 36} y={pos.y - 4} textAnchor="middle"
                          fill={col} fontSize={5.5} fontFamily="monospace">
                          RUL {eq.rul_days}d
                        </text>
                        {/* Status dot */}
                        <circle cx={pos.x - 20} cy={pos.y - 22} r={4} fill={bg} />
                        <text x={pos.x - 20} y={pos.y - 21} textAnchor="middle" dominantBaseline="central"
                          fill={fg} fontSize={4} fontWeight={700}>
                          {eq.urgency[0].toUpperCase()}
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}

              {/* ── OVERLAY: Streams ── */}
              {activeOverlays.has('streams') && (
                <g className="overlay-streams">
                  {Object.entries(streamMap).map(([nStr, fiTag]) => {
                    const n = parseInt(nStr);
                    const val = liveData[fiTag]?.value;
                    const unit = liveData[fiTag]?.unit || 'kg/h';
                    // Position streams near their StreamNum circles (approximate)
                    const sx = processCode === 'AT-200'
                      ? 60 + n * 110
                      : 50 + n * 100;
                    const sy = processCode === 'AT-200' ? 590 : 610;
                    return (
                      <g key={`s-${n}`}>
                        <rect x={sx - 24} y={sy - 8} width={48} height={16} rx={4}
                          fill="rgba(59,130,246,0.15)" stroke="#3b82f6" strokeWidth={0.8} />
                        <text x={sx} y={sy + 3} textAnchor="middle"
                          fill="#93c5fd" fontSize={6.5} fontWeight={600} fontFamily="monospace">
                          {val != null ? `${val.toFixed(1)} ${unit}` : '---'}
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}

              {/* ── OVERLAY: Divergence ── */}
              {activeOverlays.has('divergence') && snapshot && (
                <g className="overlay-divergence">
                  {Object.entries(snapshot.live_readings).map(([tag, reading]) => {
                    if (reading.value == null || reading.sp == null) return null;
                    const deviation = Math.abs(reading.value - reading.sp);
                    const pctDev = reading.sp !== 0
                      ? (deviation / Math.abs(reading.sp)) * 100
                      : 0;
                    if (pctDev < 5) return null; // only show significant deviations
                    const inst = procInstruments.find((i) => i.tag === tag);
                    if (!inst) return null;
                    // Find instrument bubble position (approximation based on tag index)
                    const idx = procInstruments.indexOf(inst);
                    const bx = 100 + (idx % 8) * 150;
                    const by = 80 + Math.floor(idx / 8) * 140;
                    const isAlarm = pctDev > 15;
                    return (
                      <g key={`div-${tag}`}>
                        <circle cx={bx} cy={by} r={20} fill="none"
                          stroke={isAlarm ? '#ef4444' : '#f97316'}
                          strokeWidth={isAlarm ? 2 : 1.5}
                          strokeDasharray="3 2"
                          opacity={0.8}>
                          <animate attributeName="r" values="18;22;18" dur="1.5s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" />
                        </circle>
                        <rect x={bx + 14} y={by - 22} width={40} height={12} rx={3}
                          fill={isAlarm ? 'rgba(239,68,68,0.85)' : 'rgba(249,115,22,0.85)'} />
                        <text x={bx + 34} y={by - 14} textAnchor="middle"
                          fill="#fff" fontSize={6} fontWeight={700} fontFamily="monospace">
                          {'\u0394'} {pctDev.toFixed(1)}%
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}

              {/* ── OVERLAY: PID ── */}
              {activeOverlays.has('pid') && snapshot && (
                <g className="overlay-pid">
                  {Object.entries(snapshot.pid_status).map(([tag, pid]) => {
                    // Find approximate position by finding the CV tag in equipment map
                    const cvPos = equipMap[pid.cv_tag];
                    if (!cvPos) return null;
                    const px = cvPos.x;
                    const py = cvPos.y + 35;
                    const barW = 40;
                    const barH = 6;
                    const fillW = Math.min(barW, barW * ((pid.output ?? 0) / 100));
                    const mc = modeColor(pid.mode);
                    return (
                      <g key={`pid-${tag}`}>
                        {/* Output bar background */}
                        <rect x={px - barW / 2} y={py} width={barW} height={barH} rx={2}
                          fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth={0.5} />
                        {/* Output bar fill */}
                        <rect x={px - barW / 2} y={py} width={fillW} height={barH} rx={2}
                          fill={mc} opacity={0.7} />
                        {/* Mode badge */}
                        <rect x={px - 14} y={py + barH + 2} width={28} height={10} rx={3}
                          fill={mc} opacity={0.85} />
                        <text x={px} y={py + barH + 9} textAnchor="middle"
                          fill="#000" fontSize={5.5} fontWeight={700} fontFamily="monospace">
                          {pid.mode}
                        </text>
                        {/* SP / PV */}
                        <text x={px} y={py - 3} textAnchor="middle"
                          fill="var(--text-muted)" fontSize={5} fontFamily="monospace">
                          SP:{pid.setpoint?.toFixed(1)} PV:{pid.pv?.toFixed(1) ?? '---'}
                        </text>
                        {/* Tag */}
                        <text x={px} y={py + barH + 16} textAnchor="middle"
                          fill="var(--text-muted)" fontSize={4.5} fontFamily="monospace" opacity={0.7}>
                          {tag}
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}
            </svg>
          </div>

          {/* Loading indicator */}
          {loading && (
            <div style={{
              position: 'absolute', top: 8, right: 8,
              background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
              borderRadius: 6, padding: '3px 8px', fontSize: '0.7rem', color: '#93c5fd',
            }}>
              Actualizando...
            </div>
          )}
        </div>

        {/* ── Equipment Detail Sidebar ── */}
        {selectedEquipment && selEqData && (
          <div style={{
            width: 320, flexShrink: 0, marginLeft: 0,
            background: 'var(--bg-card)', borderLeft: '1px solid var(--border-color)',
            display: 'flex', flexDirection: 'column', overflow: 'auto',
          }}>
            {/* Sidebar header */}
            <div style={{
              padding: '12px 16px', borderBottom: '1px solid var(--border-color)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Wrench size={14} style={{ color: healthColor(selEqData.health_index) }} />
                  {selectedEquipment}
                </div>
                <div className="text-xs text-muted">{selEqData.name}</div>
              </div>
              <button onClick={() => setSelectedEquipment(null)} className="btn btn-secondary" style={{ padding: '3px 6px' }}>
                <X size={14} />
              </button>
            </div>

            {/* Status & type */}
            <div style={{ padding: '12px 16px' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <span style={{
                  padding: '3px 10px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600,
                  background: selEqData.status === 'RUNNING' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                  color: selEqData.status === 'RUNNING' ? '#22c55e' : '#ef4444',
                  border: `1px solid ${selEqData.status === 'RUNNING' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                }}>
                  {selEqData.status}
                </span>
                <span style={{
                  padding: '3px 10px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600,
                  background: 'rgba(99,102,241,0.12)', color: '#818cf8',
                  border: '1px solid rgba(99,102,241,0.25)',
                }}>
                  {selEqData.type}
                </span>
              </div>

              {/* Health gauge */}
              <div style={{ marginBottom: 16 }}>
                <div className="text-xs text-muted" style={{ marginBottom: 6 }}>Índice de Salud</div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <div style={{ flex: 1, height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{
                      width: `${selEqData.health_index * 100}%`, height: '100%',
                      borderRadius: 5, background: healthColor(selEqData.health_index),
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                  <span className="mono" style={{
                    fontWeight: 700, fontSize: '1rem',
                    color: healthColor(selEqData.health_index),
                  }}>
                    {(selEqData.health_index * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Key metrics cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                {[
                  { label: 'RUL', value: `${selEqData.rul_days} días`, color: healthColor(selEqData.health_index) },
                  { label: 'P(falla)', value: `${(selEqData.failure_prob * 100).toFixed(1)}%`, color: selEqData.failure_prob > 0.1 ? '#ef4444' : '#22c55e' },
                  { label: 'Horas Op.', value: `${(selEqData.operating_hours ?? 0).toLocaleString()}h`, color: 'var(--accent-cyan)' },
                  { label: 'Urgencia', value: selEqData.urgency.toUpperCase(), color: urgencyBadge(selEqData.urgency).bg },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{
                    padding: '8px 10px', borderRadius: 8,
                    background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
                  }}>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                    <div className="mono" style={{ fontSize: '0.82rem', fontWeight: 700, color }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Maintenance info */}
              <div style={{
                padding: '10px 12px', borderRadius: 8,
                background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)',
                marginBottom: 16,
              }}>
                <div className="text-xs" style={{ fontWeight: 600, color: '#c084fc', marginBottom: 6 }}>
                  <Wrench size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  Mantenimiento
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: '0.72rem' }}>
                  <div>
                    <div className="text-muted" style={{ fontSize: '0.6rem' }}>Último</div>
                    <div className="mono">{selEqData.last_maintenance ? new Date(selEqData.last_maintenance).toLocaleDateString() : 'N/D'}</div>
                  </div>
                  <div>
                    <div className="text-muted" style={{ fontSize: '0.6rem' }}>Próximo</div>
                    <div className="mono">{selEqData.next_maintenance ? new Date(selEqData.next_maintenance).toLocaleDateString() : 'N/D'}</div>
                  </div>
                </div>
              </div>

              {/* PID info if available */}
              {selPidData && (
                <div style={{
                  padding: '10px 12px', borderRadius: 8,
                  background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)',
                  marginBottom: 16,
                }}>
                  <div className="text-xs" style={{ fontWeight: 600, color: modeColor(selPidData.mode), marginBottom: 6 }}>
                    <SlidersHorizontal size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    Lazo PID — {selPidData.mode}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, fontSize: '0.72rem' }}>
                    <div>
                      <div className="text-muted" style={{ fontSize: '0.6rem' }}>SP</div>
                      <div className="mono">{selPidData.setpoint?.toFixed(1)}</div>
                    </div>
                    <div>
                      <div className="text-muted" style={{ fontSize: '0.6rem' }}>PV</div>
                      <div className="mono">{selPidData.pv?.toFixed(1) ?? '---'}</div>
                    </div>
                    <div>
                      <div className="text-muted" style={{ fontSize: '0.6rem' }}>Output</div>
                      <div className="mono">{selPidData.output?.toFixed(1)}%</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, fontSize: '0.72rem', marginTop: 6 }}>
                    <div>
                      <div className="text-muted" style={{ fontSize: '0.6rem' }}>Kp</div>
                      <div className="mono">{selPidData.kp}</div>
                    </div>
                    <div>
                      <div className="text-muted" style={{ fontSize: '0.6rem' }}>Ti</div>
                      <div className="mono">{selPidData.ti}s</div>
                    </div>
                    <div>
                      <div className="text-muted" style={{ fontSize: '0.6rem' }}>Td</div>
                      <div className="mono">{selPidData.td}s</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Legend ── */}
      <div className="card" style={{ marginTop: 10, padding: '0.5rem 1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            CAPAS DIGITAL TWIN:
          </span>
          {OVERLAYS.map(({ key, label, color }) => (
            <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: activeOverlays.has(key) ? color : 'transparent',
                border: `1.5px solid ${color}`,
              }} />
              <span className="text-xs text-muted">{label}</span>
            </span>
          ))}
          <span style={{ width: 1, height: 14, background: 'var(--border-color)' }} />
          <span className="text-xs text-muted">
            <Move size={10} style={{ verticalAlign: 'middle' }} /> Arrastrar · Ctrl+Rueda = Zoom · Click equipo = Detalle
          </span>
        </div>
      </div>
    </div>
  );
}


// =============================================================
// Base Diagram Wrapper — delegates to MA100 or AT200 from PFD
// =============================================================
// Since the MA100Diagram and AT200Diagram are internal to
// ProcessFlowDiagram, we re-render the P&ID using the same
// store data (liveData + instruments). The actual SVG content
// comes from importing ProcessFlowDiagram's sub-components
// through the shared pid/SVGComponents module.
//
// For the Digital Twin, we embed a reference to the full PFD
// to avoid duplicating 500+ lines of diagram SVG paths.
// =============================================================

function BaseDiagram({ processCode, liveData, instruments, onSelectEquipment }: {
  processCode: string;
  liveData: Record<string, any>;
  instruments: any[];
  onSelectEquipment: (tag: string) => void;
}) {
  const getInst = (tag: string) => instruments.find((i: any) => i.tag === tag) || {};
  const val     = (tag: string) => liveData[tag]?.value;
  const inst    = (tag: string) => {
    const i = getInst(tag);
    return { value: val(tag), lo: i.lo, hi: i.hi, lolo: i.lolo, hihi: i.hihi, unit: i.unit };
  };

  if (processCode === 'AT-200') {
    return <AT200Base liveData={liveData} instruments={instruments} onSelectEquipment={onSelectEquipment} />;
  }
  return <MA100Base liveData={liveData} instruments={instruments} onSelectEquipment={onSelectEquipment} />;
}

// =============================================================
// Minimal P&ID bases — simplified renderings that show the
// core equipment layout. The full diagram details come from
// the shared SVG components (vessels, reactors, columns, etc.)
// =============================================================

function MA100Base({ liveData, instruments, onSelectEquipment }: {
  liveData: Record<string, any>; instruments: any[];
  onSelectEquipment: (tag: string) => void;
}) {
  const getInst = (tag: string) => instruments.find((i: any) => i.tag === tag) || {};
  const val     = (tag: string) => liveData[tag]?.value;
  const inst    = (tag: string) => {
    const i = getInst(tag);
    return { value: val(tag), lo: i.lo, hi: i.hi, lolo: i.lolo, hihi: i.hihi, unit: i.unit };
  };
  const fillLevel = (tag: string) => {
    const v = val(tag);
    const i = getInst(tag);
    if (v == null || !i.range_max) return 50;
    return Math.min(100, Math.max(0, ((v - (i.range_min || 0)) / (i.range_max - (i.range_min || 0))) * 100));
  };

  return (
    <>
      {/* Background & grid */}
      <rect width="1380" height="660" fill={C.bg} />
      {Array.from({ length: 28 }).map((_, i) => (
        <line key={`vg${i}`} x1={i * 50} y1={0} x2={i * 50} y2={660} stroke={C.gridLine} />
      ))}
      {Array.from({ length: 14 }).map((_, i) => (
        <line key={`hg${i}`} x1={0} y1={i * 50} x2={1380} y2={i * 50} stroke={C.gridLine} />
      ))}

      <defs>
        <ArrowMarker id="dt_arrow_proc" color={C.processLine} />
        <ArrowMarker id="dt_arrow_prod" color={C.productLine} />
      </defs>

      {/* Area zones */}
      <AreaZone x={10}  y={30}  w={200} h={600} label="SECC. 100 — ALIMENTACIÓN" />
      <AreaZone x={220} y={30}  w={290} h={600} label="SECC. 200 — REACCIÓN" />
      <AreaZone x={520} y={30}  w={150} h={600} label="SECC. 300 — ENFRIAMIENTO" />
      <AreaZone x={680} y={30}  w={200} h={600} label="SECC. 400 — SEPARACIÓN" />
      <AreaZone x={890} y={30}  w={200} h={600} label="SECC. 500 — PURIFICACIÓN" />
      <AreaZone x={1100} y={30} w={270} h={600} label="SECC. 600 — PRODUCTO FINAL" />

      {/* Equipment */}
      <g onClick={() => onSelectEquipment('TK-101')} style={{ cursor: 'pointer' }}>
        <Vessel x={40} y={200} w={40} h={120} tag="TK-101" name="Tanque Butano"
          fillLevel={fillLevel('LI-101')} color={C.processLine} />
      </g>
      <g onClick={() => onSelectEquipment('C-101')} style={{ cursor: 'pointer' }}>
        <Compressor x={140} y={180} w={40} h={40} tag="C-101" name="Compresor Aire" />
      </g>
      <g onClick={() => onSelectEquipment('P-101')} style={{ cursor: 'pointer' }}>
        <Pump x={125} y={390} tag="P-101" />
      </g>
      <g onClick={() => onSelectEquipment('E-101')} style={{ cursor: 'pointer' }}>
        <HeatExchanger x={250} y={230} w={60} h={50} tag="E-101" name="Precalentador" />
      </g>
      <g onClick={() => onSelectEquipment('R-101')} style={{ cursor: 'pointer' }}>
        <Reactor x={400} y={130} w={60} h={190} tag="R-101" name="Reactor Lecho Fijo V₂O₅" />
      </g>
      <PSV x={470} y={120} tag="PSV-101" />
      <g onClick={() => onSelectEquipment('E-102')} style={{ cursor: 'pointer' }}>
        <HeatExchanger x={560} y={230} w={60} h={50} tag="E-102" name="Enfriador Gas" />
      </g>
      <g onClick={() => onSelectEquipment('T-101')} style={{ cursor: 'pointer' }}>
        <Column x={720} y={100} w={40} h={220} tag="T-101" name="Columna Absorción" stages={7} />
      </g>
      <g onClick={() => onSelectEquipment('T-102')} style={{ cursor: 'pointer' }}>
        <Column x={920} y={100} w={40} h={220} tag="T-102" name="Columna Destilación" stages={9} />
      </g>
      <g onClick={() => onSelectEquipment('K-101')} style={{ cursor: 'pointer' }}>
        <Vessel x={1060} y={200} w={40} h={100} tag="K-101" name="Fundidor"
          color={C.exchangerStk} />
      </g>
      <g onClick={() => onSelectEquipment('F-101')} style={{ cursor: 'pointer' }}>
        <Filter x={1160} y={220} w={30} h={50} tag="F-101" name="Filtro Producto" />
      </g>
      <g onClick={() => onSelectEquipment('TK-102')} style={{ cursor: 'pointer' }}>
        <Vessel x={1260} y={200} w={40} h={120} tag="TK-102" name="Tanque Producto"
          fillLevel={fillLevel('LI-103')} color={C.productLine} />
      </g>

      {/* Main process piping (simplified) */}
      <Pipe d="M80,290 L125,290 L125,378" color={C.processLine} />
      <Pipe d="M125,402 L125,430 L250,430 L250,280" color={C.processLine} />
      <Pipe d="M310,255 L400,255 L400,225" color={C.processLine} />
      <Pipe d="M460,225 L560,255" color={C.processLine} />
      <Pipe d="M620,255 L720,255 L720,320" color={C.processLine} />
      <Pipe d="M760,210 L920,210" color={C.processLine} />
      <Pipe d="M960,210 L1060,250" color={C.productLine} />
      <Pipe d="M1100,250 L1160,245" color={C.productLine} />
      <Pipe d="M1190,245 L1260,260" color={C.productLine} />

      {/* Flow dots */}
      <FlowDots path="M80,290 L125,290 L125,378" color={C.processLine} n={3} dur={3} />
      <FlowDots path="M460,225 L560,255" color={C.processLine} n={3} dur={3} />
      <FlowDots path="M960,210 L1060,250" color={C.productLine} n={3} dur={3.5} />

      {/* Stream numbers */}
      <StreamNum x={100} y={280} n={1} />
      <StreamNum x={300} y={420} n={2} />
      <StreamNum x={480} y={220} n={3} />
      <StreamNum x={640} y={245} n={4} />
      <StreamNum x={850} y={200} n={5} />
      <StreamNum x={1020} y={240} n={6} />
      <StreamNum x={1220} y={235} n={7} />

      {/* Instrument bubbles */}
      <InstrBubble x={60} y={170} code="LI" tag="LI-101" {...inst('LI-101')} type="field" />
      <InstrBubble x={160} y={160} code="FI" tag="FI-101" {...inst('FI-101')} type="field" />
      <InstrBubble x={280} y={200} code="TI" tag="TI-102" {...inst('TI-102')} />
      <InstrBubble x={430} y={100} code="TIC" tag="TI-101" {...inst('TI-101')} />
      <InstrBubble x={480} y={160} code="PI" tag="PI-101" {...inst('PI-101')} type="field" />
      <InstrBubble x={590} y={200} code="TI" tag="TI-103" {...inst('TI-103')} type="field" />
      <InstrBubble x={740} y={80} code="TI" tag="TI-104" {...inst('TI-104')} />
      <InstrBubble x={940} y={80} code="TI" tag="TI-105" {...inst('TI-105')} />
      <InstrBubble x={1080} y={170} code="TI" tag="TI-106" {...inst('TI-106')} type="field" />
      <InstrBubble x={1280} y={170} code="LI" tag="LI-103" {...inst('LI-103')} type="field" />

      {/* Signal lines */}
      <SignalLine d="M430,116 L430,130" />
      <SignalLine d="M480,176 L480,190" />

      {/* Title block */}
      <g>
        <rect x={1080} y={560} width={290} height={90} rx={4}
          fill="rgba(7,9,15,0.92)" stroke={C.border} strokeWidth={1} />
        <text x={1225} y={578} textAnchor="middle" fill={C.title} fontSize={8} fontWeight={700}>
          MA-PFD-001 — MALEIC ANHYDRIDE P&amp;ID
        </text>
        <text x={1225} y={592} textAnchor="middle" fill={C.subtitle} fontSize={6}>
          Digital Twin View · Tesis 2026 UTN FRM
        </text>
        <text x={1225} y={606} textAnchor="middle" fill={C.muted} fontSize={5.5}>
          C₄H₁₀ + 3.5 O₂ → C₄H₂O₃ + 4 H₂O | Cat: V₂O₅/TiO₂
        </text>
        <text x={1225} y={618} textAnchor="middle" fill={C.muted} fontSize={5}>
          ISA 5.1 · Rev.A · Capas: Salud / Corrientes / Divergencia / PID
        </text>
      </g>
    </>
  );
}

function AT200Base({ liveData, instruments, onSelectEquipment }: {
  liveData: Record<string, any>; instruments: any[];
  onSelectEquipment: (tag: string) => void;
}) {
  const getInst = (tag: string) => instruments.find((i: any) => i.tag === tag) || {};
  const val     = (tag: string) => liveData[tag]?.value;
  const inst    = (tag: string) => {
    const i = getInst(tag);
    return { value: val(tag), lo: i.lo, hi: i.hi, lolo: i.lolo, hihi: i.hihi, unit: i.unit };
  };
  const fillLevel = (tag: string) => {
    const v = val(tag);
    const i = getInst(tag);
    if (v == null || !i.range_max) return 50;
    return Math.min(100, Math.max(0, ((v - (i.range_min || 0)) / (i.range_max - (i.range_min || 0))) * 100));
  };

  return (
    <>
      {/* Background & grid */}
      <rect width="1380" height="640" fill={C.bg} />
      {Array.from({ length: 28 }).map((_, i) => (
        <line key={`vg${i}`} x1={i * 50} y1={0} x2={i * 50} y2={640} stroke={C.gridLine} />
      ))}
      {Array.from({ length: 13 }).map((_, i) => (
        <line key={`hg${i}`} x1={0} y1={i * 50} x2={1380} y2={i * 50} stroke={C.gridLine} />
      ))}

      <defs>
        <ArrowMarker id="dt_a_proc2" color={C.processLine} />
        <ArrowMarker id="dt_a_prod2" color={C.productLine} />
      </defs>

      {/* Area zones */}
      <AreaZone x={10}   y={30} w={180} h={580} label="SECC. 201 — MATERIA PRIMA" />
      <AreaZone x={200}  y={30} w={190} h={580} label="SECC. 202 — DESULFITACIÓN" />
      <AreaZone x={400}  y={30} w={140} h={580} label="SECC. 203 — FILTRACIÓN" />
      <AreaZone x={550}  y={30} w={140} h={580} label="SECC. 204 — INTERCAMBIO" />
      <AreaZone x={700}  y={30} w={200} h={580} label="SECC. 205 — EVAPORACIÓN" />
      <AreaZone x={910}  y={30} w={160} h={580} label="SECC. 206 — CRISTALIZACIÓN" />
      <AreaZone x={1080} y={30} w={290} h={580} label="SECC. 207 — PRODUCTO" />

      {/* Equipment */}
      <g onClick={() => onSelectEquipment('TK-201')} style={{ cursor: 'pointer' }}>
        <Vessel x={40} y={160} w={40} h={120} tag="TK-201" name="Tanque Orujo"
          fillLevel={fillLevel('LI-201')} color={C.processLine} />
      </g>
      <g onClick={() => onSelectEquipment('P-201')} style={{ cursor: 'pointer' }}>
        <Pump x={140} y={370} tag="P-201" />
      </g>
      <g onClick={() => onSelectEquipment('R-201')} style={{ cursor: 'pointer' }}>
        <Reactor x={250} y={120} w={55} h={170} tag="R-201" name="Reactor Desulfitación H₂SO₄" />
      </g>
      <g onClick={() => onSelectEquipment('F-201')} style={{ cursor: 'pointer' }}>
        <Filter x={420} y={200} w={35} h={55} tag="F-201" name="Filtro Prensa" />
      </g>
      <g onClick={() => onSelectEquipment('E-201')} style={{ cursor: 'pointer' }}>
        <Column x={570} y={140} w={35} h={180} tag="E-201" name="Intercambio Iónico" stages={5} color="#0d9488" />
      </g>
      <g onClick={() => onSelectEquipment('EV-201')} style={{ cursor: 'pointer' }}>
        <Evaporator x={700} y={120} w={35} h={130} tag="EV-201" name="Evaporador I" />
      </g>
      <g onClick={() => onSelectEquipment('EV-202')} style={{ cursor: 'pointer' }}>
        <Evaporator x={810} y={120} w={35} h={130} tag="EV-202" name="Evaporador II" />
      </g>
      <g onClick={() => onSelectEquipment('CR-201')} style={{ cursor: 'pointer' }}>
        <Crystallizer x={930} y={210} w={85} h={45} tag="CR-201" name="Cristalizador" />
      </g>
      <g onClick={() => onSelectEquipment('C-201')} style={{ cursor: 'pointer' }}>
        <Centrifuge x={1100} y={280} tag="C-201" name="Centrífuga" />
      </g>
      <g onClick={() => onSelectEquipment('D-201')} style={{ cursor: 'pointer' }}>
        <Dryer x={1160} y={140} w={30} h={100} tag="D-201" name="Secador" />
      </g>
      <g onClick={() => onSelectEquipment('TK-202')} style={{ cursor: 'pointer' }}>
        <Vessel x={1260} y={160} w={40} h={120} tag="TK-202" name="Tanque Producto"
          fillLevel={70} color={C.productLine} />
      </g>

      {/* Main process piping */}
      <Pipe d="M80,250 L140,250 L140,358" color={C.processLine} />
      <Pipe d="M140,382 L140,420 L250,420 L250,290" color={C.processLine} />
      <Pipe d="M305,225 L420,225" color={C.processLine} />
      <Pipe d="M455,225 L570,230" color={C.processLine} />
      <Pipe d="M605,230 L700,185" color={C.processLine} />
      <Pipe d="M735,185 L810,185" color={C.processLine} />
      <Pipe d="M845,185 L930,232" color={C.processLine} />
      <Pipe d="M1015,232 L1082,280" color={C.productLine} />
      <Pipe d="M1118,280 L1160,190" color={C.productLine} />
      <Pipe d="M1190,190 L1260,220" color={C.productLine} />

      {/* Flow dots */}
      <FlowDots path="M80,250 L140,250 L140,358" color={C.processLine} n={3} dur={3} />
      <FlowDots path="M735,185 L810,185" color={C.processLine} n={2} dur={2} />
      <FlowDots path="M1082,280 L1160,190 L1260,220" color={C.productLine} n={3} dur={4} />

      {/* Stream numbers */}
      <StreamNum x={100} y={240} n={1} />
      <StreamNum x={200} y={410} n={2} />
      <StreamNum x={370} y={215} n={3} />
      <StreamNum x={510} y={215} n={4} />
      <StreamNum x={660} y={210} n={5} />
      <StreamNum x={780} y={175} n={6} />
      <StreamNum x={890} y={210} n={7} />
      <StreamNum x={1050} y={260} n={8} />
      <StreamNum x={1230} y={200} n={9} />

      {/* Instrument bubbles */}
      <InstrBubble x={60} y={130} code="LI" tag="LI-201" {...inst('LI-201')} type="field" />
      <InstrBubble x={160} y={340} code="FI" tag="FI-201" {...inst('FI-201')} type="field" />
      <InstrBubble x={280} y={90} code="TIC" tag="TI-201" {...inst('TI-201')} />
      <InstrBubble x={335} y={160} code="PI" tag="PI-201" {...inst('PI-201')} type="field" />
      <InstrBubble x={590} y={110} code="AI" tag="AI-201" {...inst('AI-201')} />
      <InstrBubble x={720} y={90} code="TI" tag="TI-202" {...inst('TI-202')} type="field" />
      <InstrBubble x={830} y={90} code="TI" tag="TI-203" {...inst('TI-203')} type="field" />
      <InstrBubble x={950} y={180} code="TIC" tag="TI-204" {...inst('TI-204')} />
      <InstrBubble x={1100} y={240} code="AI" tag="AI-202" {...inst('AI-202')} />
      <InstrBubble x={1175} y={110} code="TI" tag="TI-205" {...inst('TI-205')} type="field" />

      {/* Signal lines */}
      <SignalLine d="M280,106 L280,120" />
      <SignalLine d="M950,196 L950,210" />

      {/* Title block */}
      <g>
        <rect x={1080} y={530} width={290} height={90} rx={4}
          fill="rgba(7,9,15,0.92)" stroke={C.border} strokeWidth={1} />
        <text x={1225} y={548} textAnchor="middle" fill={C.title} fontSize={8} fontWeight={700}>
          AT-PFD-001 — TARTARIC ACID P&amp;ID
        </text>
        <text x={1225} y={562} textAnchor="middle" fill={C.subtitle} fontSize={6}>
          Digital Twin View · Tesis 2026 UTN FRM
        </text>
        <text x={1225} y={576} textAnchor="middle" fill={C.muted} fontSize={5.5}>
          CaC₄H₄O₆ + H₂SO₄ → C₄H₆O₆ + CaSO₄ | ≥99.5% pureza
        </text>
        <text x={1225} y={588} textAnchor="middle" fill={C.muted} fontSize={5}>
          ISA 5.1 · Rev.A · Capas: Salud / Corrientes / Divergencia / PID
        </text>
      </g>
    </>
  );
}
