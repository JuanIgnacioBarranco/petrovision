// ============================================================
// PetroVision — Shared ISA 5.1 SVG Components for P&ID
// ============================================================
// Reusable SVG sub-components used by ProcessFlowDiagram
// and DigitalTwin modules.
// ============================================================

// ── Palette ─────────────────────────────────────────────────
export const C = {
  bg:          '#07090f',
  gridLine:    'rgba(255,255,255,0.03)',
  title:       '#e2e8f0',
  subtitle:    '#64748b',
  border:      '#1e293b',
  processLine: '#3b82f6',
  steamLine:   '#f87171',
  coolantLine: '#38bdf8',
  utilityLine: '#94a3b8',
  productLine: '#34d399',
  signalLine:  '#fbbf24',
  vesselFill:  '#0f172a',
  vesselStroke:'#334155',
  reactorStk:  '#7c3aed',
  exchangerStk:'#ea580c',
  columnStk:   '#0284c7',
  pumpStk:     '#16a34a',
  filterStk:   '#9333ea',
  evapStk:     '#d97706',
  crystStk:    '#0891b2',
  instFill:    '#0a1628',
  instStroke:  '#60a5fa',
  instText:    '#cbd5e1',
  ok:          '#22c55e',
  warn:        '#f59e0b',
  alarm:       '#ef4444',
  muted:       '#475569',
  tagBg:       'rgba(7,9,15,0.88)',
};

export function vCol(v?: number, lo?: number, hi?: number, lolo?: number, hihi?: number) {
  if (v == null) return C.muted;
  if ((hihi != null && v >= hihi) || (lolo != null && v <= lolo)) return C.alarm;
  if ((hi  != null && v >= hi)   || (lo  != null && v <= lo))   return C.warn;
  return C.ok;
}

export function FlowDots({ path, color = C.processLine, n = 4, dur = 4 }: {
  path: string; color?: string; n?: number; dur?: number;
}) {
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <circle key={i} r={2.2} fill={color} opacity={0.75}>
          <animateMotion path={path} dur={`${dur}s`} begin={`${(i * dur) / n}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </>
  );
}

export function InstrBubble({
  x, y, code, tag, value, unit, lo, hi, lolo, hihi, type = 'dcs', r = 16,
}: {
  x: number; y: number; code: string; tag: string;
  value?: number; unit?: string; lo?: number; hi?: number; lolo?: number; hihi?: number;
  type?: 'field' | 'dcs' | 'safety'; r?: number;
}) {
  const col = vCol(value, lo, hi, lolo, hihi);
  const displayVal = value != null ? value.toFixed(1) : '---';
  return (
    <g style={{ cursor: 'pointer' }}>
      <circle cx={x} cy={y} r={r + 1} fill="rgba(0,0,0,0.5)" />
      <circle cx={x} cy={y} r={r} fill={C.instFill} stroke={col} strokeWidth={1.5} />
      {type === 'dcs' && (
        <circle cx={x} cy={y} r={r - 5} fill="none" stroke={col} strokeWidth={0.7} strokeDasharray="2 1.5" opacity={0.6} />
      )}
      {type === 'safety' && (
        <circle cx={x} cy={y} r={r - 4} fill="none" stroke={C.alarm} strokeWidth={1.2} />
      )}
      <line x1={x - r + 3} y1={y} x2={x + r - 3} y2={y} stroke={col} strokeWidth={0.5} opacity={0.4} />
      <text x={x} y={y - 3} textAnchor="middle" dominantBaseline="middle"
        fill={col} fontSize={7} fontWeight={700} fontFamily="monospace">{code}</text>
      <text x={x} y={y + 7} textAnchor="middle" dominantBaseline="middle"
        fill={col} fontSize={6.5} fontFamily="monospace">{displayVal}</text>
      <text x={x} y={y + r + 8} textAnchor="middle"
        fill={C.subtitle} fontSize={5.5} fontFamily="monospace">{tag}</text>
      {unit && (
        <text x={x} y={y + r + 15} textAnchor="middle"
          fill={C.muted} fontSize={5} fontFamily="monospace">{unit}</text>
      )}
    </g>
  );
}

export function SignalLine({ d, color = C.signalLine }: { d: string; color?: string }) {
  return (
    <path d={d} fill="none" stroke={color} strokeWidth={0.8}
      strokeDasharray="4 3" opacity={0.5} />
  );
}

export function Pipe({ d, color = C.processLine, w = 2, dash }: {
  d: string; color?: string; w?: number; dash?: string;
}) {
  return (
    <path d={d} fill="none" stroke={color} strokeWidth={w}
      strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} />
  );
}

export function ArrowMarker({ id, color }: { id: string; color: string }) {
  return (
    <marker id={id} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
      <path d="M0,0 L6,3 L0,6 Z" fill={color} />
    </marker>
  );
}

export function StreamNum({ x, y, n }: { x: number; y: number; n: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={7} fill="#1e293b" stroke={C.muted} strokeWidth={0.8} />
      <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
        fill={C.title} fontSize={5.5} fontFamily="monospace" fontWeight={700}>{n}</text>
    </g>
  );
}

export function CondTag({ x, y, items }: { x: number; y: number; items: string[] }) {
  const h = items.length * 10 + 4;
  return (
    <g>
      <rect x={x - 28} y={y - 4} width={56} height={h} rx={3}
        fill="rgba(7,9,15,0.9)" stroke={C.border} strokeWidth={0.6} />
      {items.map((item, i) => (
        <text key={i} x={x} y={y + 4 + i * 10} textAnchor="middle"
          fill={C.subtitle} fontSize={5.8} fontFamily="monospace">{item}</text>
      ))}
    </g>
  );
}

export function AreaZone({ x, y, w, h, label }: {
  x: number; y: number; w: number; h: number; label: string;
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8}
        fill="rgba(255,255,255,0.012)" stroke="rgba(255,255,255,0.07)"
        strokeWidth={0.8} strokeDasharray="6 4" />
      <text x={x + 8} y={y + 14} fill={C.subtitle} fontSize={7.5} fontWeight={600}
        letterSpacing="0.08em" opacity={0.6}>{label}</text>
    </g>
  );
}

// ─── Vertical Vessel ─────────────────────────────────────────
export function Vessel({ x, y, w, h, tag, name, color = C.vesselStroke, fillLevel, id }: {
  x: number; y: number; w: number; h: number;
  tag: string; name: string; color?: string; fillLevel?: number; id?: string;
}) {
  const ey  = Math.max(6, w * 0.22);
  const lev = Math.max(0, Math.min(100, fillLevel ?? 50));
  const fillH = (h - ey) * lev / 100;
  const gid = id || `vg_${tag.replace(/[^a-z0-9]/gi, '_')}`;
  return (
    <g>
      <defs>
        <linearGradient id={`${gid}_side`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor={color} stopOpacity={0.15} />
          <stop offset="40%"  stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0.08} />
        </linearGradient>
        <clipPath id={`${gid}_clip`}>
          <rect x={x + 1} y={y - ey + 2} width={w - 2} height={h + ey * 2 - 4} />
        </clipPath>
      </defs>
      {fillLevel != null && (
        <rect x={x + 1} y={y + (h - ey) - fillH} width={w - 2} height={fillH + ey / 2}
          fill="rgba(59,130,246,0.15)" clipPath={`url(#${gid}_clip)`}>
          <animate attributeName="opacity" values="0.6;0.9;0.6" dur="4s" repeatCount="indefinite" />
        </rect>
      )}
      <rect x={x} y={y} width={w} height={h}
        fill={`url(#${gid}_side)`} stroke={color} strokeWidth={1.5} />
      <ellipse cx={x + w / 2} cy={y + h} rx={w / 2} ry={ey}
        fill={C.vesselFill} stroke={color} strokeWidth={1.5} />
      <ellipse cx={x + w / 2} cy={y} rx={w / 2} ry={ey}
        fill={C.vesselFill} stroke={color} strokeWidth={1.5} />
      <rect x={x + w * 0.15} y={y} width={w * 0.12} height={h} fill="rgba(255,255,255,0.04)" />
      <text x={x + w / 2} y={y - ey - 8} textAnchor="middle"
        fill={C.title} fontSize={8} fontWeight={700} fontFamily="monospace">{tag}</text>
      <text x={x + w / 2} y={y + h + ey + 10} textAnchor="middle"
        fill={C.subtitle} fontSize={6}>{name}</text>
    </g>
  );
}

// ─── Fixed-bed Reactor ─────────────────────────────────────
export function Reactor({ x, y, w, h, tag, name }: {
  x: number; y: number; w: number; h: number; tag: string; name: string;
}) {
  const ey  = w * 0.22;
  const tid = tag.replace(/[^a-z0-9]/gi, '_');
  return (
    <g>
      <defs>
        <linearGradient id={`rg_${tid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor={C.reactorStk} stopOpacity={0.2} />
          <stop offset="40%"  stopColor={C.reactorStk} stopOpacity={0.4} />
          <stop offset="100%" stopColor={C.reactorStk} stopOpacity={0.1} />
        </linearGradient>
      </defs>
      <rect x={x - 5} y={y + 20} width={w + 10} height={h - 40}
        fill="none" stroke={C.reactorStk} strokeWidth={1} strokeDasharray="3 2" opacity={0.35} rx={2} />
      <rect x={x} y={y} width={w} height={h}
        fill={`url(#rg_${tid})`} stroke={C.reactorStk} strokeWidth={1.8} />
      <ellipse cx={x + w / 2} cy={y + h} rx={w / 2} ry={ey}
        fill={C.vesselFill} stroke={C.reactorStk} strokeWidth={1.5} />
      <ellipse cx={x + w / 2} cy={y} rx={w / 2} ry={ey}
        fill={C.vesselFill} stroke={C.reactorStk} strokeWidth={1.5} />
      <rect x={x + 6} y={y + h * 0.25} width={w - 12} height={h * 0.5}
        fill="rgba(124,58,237,0.12)" stroke={C.reactorStk} strokeWidth={0.8} rx={2} />
      {Array.from({ length: 12 }).map((_, i) => (
        <circle key={i}
          cx={x + 10 + (i % 4) * (w - 20) / 3}
          cy={y + h * 0.3 + Math.floor(i / 4) * (h * 0.4 / 3)}
          r={2} fill={C.reactorStk} opacity={0.35} />
      ))}
      <circle cx={x + w / 2} cy={y + h / 2} r={5} fill={C.reactorStk} opacity={0.15}>
        <animate attributeName="r" values="4;9;4" dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.1;0.4;0.1" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <rect x={x + w * 0.15} y={y} width={w * 0.1} height={h} fill="rgba(255,255,255,0.04)" />
      <text x={x + w / 2} y={y - ey - 8} textAnchor="middle"
        fill={C.title} fontSize={8} fontWeight={700} fontFamily="monospace">{tag}</text>
      <text x={x + w / 2} y={y + h + ey + 10} textAnchor="middle" fill={C.subtitle} fontSize={6}>
        {name.split(' ').slice(0, 2).join(' ')}
      </text>
      <text x={x + w / 2} y={y + h + ey + 18} textAnchor="middle" fill={C.subtitle} fontSize={6}>
        {name.split(' ').slice(2).join(' ')}
      </text>
    </g>
  );
}

// ─── Distillation Column ───────────────────────────────────
export function Column({ x, y, w, h, tag, name, stages = 8, color = C.columnStk }: {
  x: number; y: number; w: number; h: number;
  tag: string; name: string; stages?: number; color?: string;
}) {
  const ey     = w * 0.30;
  const stageH = (h - 16) / stages;
  const tid    = tag.replace(/[^a-z0-9]/gi, '_');
  return (
    <g>
      <defs>
        <linearGradient id={`col_${tid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor={color} stopOpacity={0.12} />
          <stop offset="35%"  stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0.06} />
        </linearGradient>
      </defs>
      <rect x={x} y={y} width={w} height={h}
        fill={`url(#col_${tid})`} stroke={color} strokeWidth={1.8} />
      <ellipse cx={x + w / 2} cy={y + h} rx={w / 2} ry={ey}
        fill={C.vesselFill} stroke={color} strokeWidth={1.5} />
      <ellipse cx={x + w / 2} cy={y} rx={w / 2} ry={ey}
        fill={C.vesselFill} stroke={color} strokeWidth={1.5} />
      {Array.from({ length: stages - 1 }).map((_, i) => (
        <line key={i}
          x1={x + 3} y1={y + 8 + (i + 1) * stageH}
          x2={x + w - 3} y2={y + 8 + (i + 1) * stageH}
          stroke={color} strokeWidth={0.7} opacity={0.3} />
      ))}
      {[0, 1, 2].map((i) => (
        <circle key={`b${i}`} cx={x + w / 3 + i * w / 5} r={1.5} fill={color} opacity={0.3}>
          <animate attributeName="cy" values={`${y + h - 14};${y + 14}`}
            dur={`${3 + i * 0.8}s`} repeatCount="indefinite" />
        </circle>
      ))}
      <text x={x + w / 2} y={y - ey - 8} textAnchor="middle"
        fill={C.title} fontSize={8} fontWeight={700} fontFamily="monospace">{tag}</text>
      <text x={x + w / 2} y={y + h + ey + 10} textAnchor="middle"
        fill={C.subtitle} fontSize={6}>{name}</text>
    </g>
  );
}

// ─── Shell & Tube Heat Exchanger ──────────────────────────
export function HeatExchanger({ x, y, w, h, tag, name, color = C.exchangerStk }: {
  x: number; y: number; w: number; h: number; tag: string; name: string; color?: string;
}) {
  const cx1 = x + w * 0.38;
  const cx2 = x + w * 0.62;
  const cy  = y + h / 2;
  const r   = Math.min(w, h) * 0.42;
  const tid = tag.replace(/[^a-z0-9]/gi, '_');
  return (
    <g>
      <defs>
        <linearGradient id={`hex_${tid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0.05} />
        </linearGradient>
      </defs>
      <circle cx={cx1} cy={cy} r={r}
        fill={`url(#hex_${tid})`} stroke={color} strokeWidth={1.5} />
      <circle cx={cx2} cy={cy} r={r}
        fill={`url(#hex_${tid})`} stroke={color} strokeWidth={1.5} />
      {[-1, 0, 1].map((i) => (
        <line key={i}
          x1={cx1 - r + 2} y1={cy + i * 4} x2={cx2 + r - 2} y2={cy + i * 4}
          stroke={color} strokeWidth={0.6} opacity={0.25} />
      ))}
      <line x1={(cx1 + cx2) / 2} y1={cy - r} x2={(cx1 + cx2) / 2} y2={cy + r}
        stroke={color} strokeWidth={0.8} opacity={0.4} />
      <text x={x + w / 2} y={y - 8} textAnchor="middle"
        fill={C.title} fontSize={8} fontWeight={700} fontFamily="monospace">{tag}</text>
      <text x={x + w / 2} y={y + h + 10} textAnchor="middle"
        fill={C.subtitle} fontSize={6}>{name}</text>
    </g>
  );
}

// ─── Centrifugal Pump ─────────────────────────────────────
export function Pump({ x, y, tag, color = C.pumpStk }: {
  x: number; y: number; tag: string; color?: string;
}) {
  return (
    <g>
      <circle cx={x} cy={y} r={12} fill={C.vesselFill} stroke={color} strokeWidth={1.5} />
      {[0, 60, 120, 180, 240, 300].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <line key={deg} x1={x} y1={y}
            x2={x + 8 * Math.cos(rad)} y2={y + 8 * Math.sin(rad)}
            stroke={color} strokeWidth={1} opacity={0.5}>
            <animateTransform attributeName="transform" type="rotate"
              from={`0 ${x} ${y}`} to={`360 ${x} ${y}`} dur="1.2s" repeatCount="indefinite" />
          </line>
        );
      })}
      <text x={x} y={y + 20} textAnchor="middle"
        fill={C.title} fontSize={6.5} fontWeight={600} fontFamily="monospace">{tag}</text>
    </g>
  );
}

// ─── Control Valve (ISA bowtie) ───────────────────────────
export function ControlValve({ x, y, tag, color = C.processLine, actuatorType = 'FO' }: {
  x: number; y: number; tag?: string; color?: string; actuatorType?: string;
}) {
  return (
    <g>
      <line x1={x} y1={y - 7} x2={x} y2={y - 14} stroke={color} strokeWidth={0.8} />
      <circle cx={x} cy={y - 18} r={4} fill={C.vesselFill} stroke={color} strokeWidth={0.8} />
      <text x={x} y={y - 17} textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize={4.5} fontFamily="monospace">{actuatorType}</text>
      <polygon points={`${x - 6},${y - 5} ${x + 6},${y - 5} ${x},${y + 5}`}
        fill="none" stroke={color} strokeWidth={1.2} />
      <polygon points={`${x - 6},${y + 5} ${x + 6},${y + 5} ${x},${y - 5}`}
        fill="none" stroke={color} strokeWidth={1.2} />
      {tag && (
        <text x={x + 12} y={y + 3} fill={C.muted} fontSize={5.5} fontFamily="monospace">{tag}</text>
      )}
    </g>
  );
}

// ─── PSV Relief Valve ─────────────────────────────────────
export function PSV({ x, y, tag }: { x: number; y: number; tag: string }) {
  return (
    <g>
      <polygon points={`${x - 6},${y} ${x},${y - 10} ${x + 6},${y}`}
        fill="rgba(239,68,68,0.15)" stroke={C.alarm} strokeWidth={1.2} />
      <polygon points={`${x - 6},${y} ${x},${y + 10} ${x + 6},${y}`}
        fill="rgba(239,68,68,0.15)" stroke={C.alarm} strokeWidth={1.2} />
      <line x1={x} y1={y - 10} x2={x} y2={y - 18} stroke={C.alarm} strokeWidth={1} />
      <text x={x} y={y - 22} textAnchor="middle"
        fill={C.alarm} fontSize={5.5} fontFamily="monospace">{tag}</text>
    </g>
  );
}

// ─── Filter ──────────────────────────────────────────────
export function Filter({ x, y, w, h, tag, name, color = C.filterStk }: {
  x: number; y: number; w: number; h: number; tag: string; name: string; color?: string;
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={3}
        fill="rgba(147,51,234,0.1)" stroke={color} strokeWidth={1.5} />
      {Array.from({ length: 5 }).map((_, i) => (
        <line key={i}
          x1={x + 4 + i * (w - 8) / 4} y1={y + 4}
          x2={x + 4 + i * (w - 8) / 4} y2={y + h - 4}
          stroke={color} strokeWidth={0.5} opacity={0.35} />
      ))}
      <line x1={x + 4} y1={y + h / 2} x2={x + w - 4} y2={y + h / 2}
        stroke={color} strokeWidth={0.5} opacity={0.35} />
      <text x={x + w / 2} y={y - 8} textAnchor="middle"
        fill={C.title} fontSize={8} fontWeight={700} fontFamily="monospace">{tag}</text>
      <text x={x + w / 2} y={y + h + 10} textAnchor="middle"
        fill={C.subtitle} fontSize={6}>{name}</text>
    </g>
  );
}

// ─── Evaporator ──────────────────────────────────────────
export function Evaporator({ x, y, w, h, tag, name }: {
  x: number; y: number; w: number; h: number; tag: string; name: string;
}) {
  const color = C.evapStk;
  const ey    = w * 0.22;
  const tid   = tag.replace(/[^a-z0-9]/gi, '_');
  return (
    <g>
      <defs>
        <linearGradient id={`ev_${tid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor={color} stopOpacity={0.15} />
          <stop offset="40%"  stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0.08} />
        </linearGradient>
      </defs>
      <rect x={x} y={y} width={w} height={h}
        fill={`url(#ev_${tid})`} stroke={color} strokeWidth={1.5} />
      <ellipse cx={x + w / 2} cy={y + h} rx={w / 2} ry={ey}
        fill={C.vesselFill} stroke={color} strokeWidth={1.5} />
      <ellipse cx={x + w / 2} cy={y} rx={w / 2} ry={ey}
        fill={C.vesselFill} stroke={color} strokeWidth={1.5} />
      {Array.from({ length: 3 }).map((_, i) => (
        <ellipse key={i} cx={x + w / 2} cy={y + h * 0.65 + i * 8}
          rx={w / 2 - 8} ry={4}
          fill="none" stroke={color} strokeWidth={0.7} opacity={0.25} />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} cx={x + 10 + i * (w - 12) / 3} r={2} fill={color} opacity={0.2}>
          <animate attributeName="cy" values={`${y + h - 10};${y + 8}`}
            dur={`${1.8 + i * 0.4}s`} repeatCount="indefinite" />
          <animate attributeName="r" values="1.5;3;1.5"
            dur={`${1.8 + i * 0.4}s`} repeatCount="indefinite" />
        </circle>
      ))}
      <text x={x + w / 2} y={y - ey - 8} textAnchor="middle"
        fill={C.title} fontSize={8} fontWeight={700} fontFamily="monospace">{tag}</text>
      <text x={x + w / 2} y={y + h + ey + 10} textAnchor="middle"
        fill={C.subtitle} fontSize={6}>{name}</text>
    </g>
  );
}

// ─── Crystallizer ────────────────────────────────────────
export function Crystallizer({ x, y, w, h, tag, name }: {
  x: number; y: number; w: number; h: number; tag: string; name: string;
}) {
  const color = C.crystStk;
  const ex    = h * 0.25;
  const tid   = tag.replace(/[^a-z0-9]/gi, '_');
  return (
    <g>
      <defs>
        <linearGradient id={`cr_${tid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0.07} />
        </linearGradient>
      </defs>
      <rect x={x - 4} y={y - 4} width={w + 8} height={h + 8} rx={8}
        fill="none" stroke={C.coolantLine} strokeWidth={0.8} strokeDasharray="3 2" opacity={0.35} />
      <rect x={x} y={y} width={w} height={h}
        fill={`url(#cr_${tid})`} stroke={color} strokeWidth={1.5} rx={4} />
      <ellipse cx={x} cy={y + h / 2} rx={ex} ry={h / 2}
        fill={C.vesselFill} stroke={color} strokeWidth={1.5} />
      <ellipse cx={x + w} cy={y + h / 2} rx={ex} ry={h / 2}
        fill={C.vesselFill} stroke={color} strokeWidth={1.5} />
      {[0, 1, 2, 3, 4].map((i) => (
        <polygon key={i}
          points={`${x + 15 + i * (w - 20) / 4},${y + h / 2 - 4} ${x + 19 + i * (w - 20) / 4},${y + h / 2 + 4} ${x + 11 + i * (w - 20) / 4},${y + h / 2 + 4}`}
          fill="none" stroke={color} strokeWidth={0.7} opacity={0.35}>
          <animate attributeName="opacity" values="0.15;0.5;0.15"
            dur={`${1.5 + i * 0.3}s`} repeatCount="indefinite" />
        </polygon>
      ))}
      <text x={x + w / 2} y={y - 10} textAnchor="middle"
        fill={C.title} fontSize={8} fontWeight={700} fontFamily="monospace">{tag}</text>
      <text x={x + w / 2} y={y + h + 12} textAnchor="middle"
        fill={C.subtitle} fontSize={6}>{name}</text>
    </g>
  );
}

// ─── Centrifuge ──────────────────────────────────────────
export function Centrifuge({ x, y, r = 18, tag, name }: {
  x: number; y: number; r?: number; tag: string; name: string;
}) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={C.vesselFill} stroke="#14b8a6" strokeWidth={1.5} />
      <ellipse cx={x} cy={y} rx={r - 5} ry={r / 3}
        fill="none" stroke="#14b8a6" strokeWidth={1}>
        <animateTransform attributeName="transform" type="rotate"
          from={`0 ${x} ${y}`} to={`360 ${x} ${y}`} dur="0.7s" repeatCount="indefinite" />
      </ellipse>
      {[0, 90, 180, 270].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <line key={deg} x1={x} y1={y}
            x2={x + (r - 5) * Math.cos(rad)} y2={y + (r - 5) * Math.sin(rad)}
            stroke="#14b8a6" strokeWidth={0.7} opacity={0.3}>
            <animateTransform attributeName="transform" type="rotate"
              from={`0 ${x} ${y}`} to={`360 ${x} ${y}`} dur="0.7s" repeatCount="indefinite" />
          </line>
        );
      })}
      <text x={x} y={y - r - 8} textAnchor="middle"
        fill={C.title} fontSize={8} fontWeight={700} fontFamily="monospace">{tag}</text>
      <text x={x} y={y + r + 10} textAnchor="middle"
        fill={C.subtitle} fontSize={6}>{name}</text>
    </g>
  );
}

// ─── Dryer ───────────────────────────────────────────────
export function Dryer({ x, y, w, h, tag, name }: {
  x: number; y: number; w: number; h: number; tag: string; name: string;
}) {
  const color = '#f43f5e';
  const ey    = w * 0.22;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h}
        fill="rgba(244,63,94,0.08)" stroke={color} strokeWidth={1.5} />
      <ellipse cx={x + w / 2} cy={y + h} rx={w / 2} ry={ey}
        fill={C.vesselFill} stroke={color} strokeWidth={1.5} />
      <ellipse cx={x + w / 2} cy={y} rx={w / 2} ry={ey}
        fill={C.vesselFill} stroke={color} strokeWidth={1.5} />
      {[0, 1, 2].map((i) => (
        <line key={i}
          x1={x + 8 + i * (w - 16) / 2} y1={y + h - 8}
          x2={x + 8 + i * (w - 16) / 2} y2={y + 8}
          stroke={color} strokeWidth={0.6} opacity={0.3}>
          <animate attributeName="opacity" values="0.15;0.45;0.15"
            dur={`${1.5 + i * 0.3}s`} repeatCount="indefinite" />
        </line>
      ))}
      <text x={x + w / 2} y={y - ey - 8} textAnchor="middle"
        fill={C.title} fontSize={8} fontWeight={700} fontFamily="monospace">{tag}</text>
      <text x={x + w / 2} y={y + h + ey + 10} textAnchor="middle"
        fill={C.subtitle} fontSize={6}>{name}</text>
    </g>
  );
}

// ─── Compressor / Blower ────────────────────────────────
export function Compressor({ x, y, w, h, tag, name }: {
  x: number; y: number; w: number; h: number; tag: string; name: string;
}) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const ir = 5;
  const or = Math.min(w, h) / 2 - 4;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={4}
        fill="rgba(22,163,74,0.1)" stroke={C.pumpStk} strokeWidth={1.5} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <line key={deg}
            x1={cx + ir * Math.cos(rad)} y1={cy + ir * Math.sin(rad)}
            x2={cx + or * Math.cos(rad)} y2={cy + or * Math.sin(rad)}
            stroke={C.pumpStk} strokeWidth={1} opacity={0.4}>
            <animateTransform attributeName="transform" type="rotate"
              from={`0 ${cx} ${cy}`} to={`360 ${cx} ${cy}`} dur="1.5s" repeatCount="indefinite" />
          </line>
        );
      })}
      <text x={cx} y={y - 8} textAnchor="middle"
        fill={C.title} fontSize={8} fontWeight={700} fontFamily="monospace">{tag}</text>
      <text x={cx} y={y + h + 10} textAnchor="middle"
        fill={C.subtitle} fontSize={6}>{name}</text>
    </g>
  );
}
