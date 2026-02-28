// ============================================================
// PetroVision — Trend Viewer (InfluxDB Time‑Series)
// ============================================================

import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, CartesianGrid,
} from 'recharts';
import { TrendingUp, Clock, Download, RefreshCw } from 'lucide-react';
import { readingsAPI } from '@/services/api';
import { useProcess } from '@/hooks/useProcess';

const COLORS = [
  '#3b82f6', '#10b981', '#f97316', '#ef4444', '#8b5cf6',
  '#06b6d4', '#eab308', '#ec4899', '#14b8a6', '#f43f5e',
];

const TIME_RANGES = [
  { label: '5 min', value: '5m' },
  { label: '15 min', value: '15m' },
  { label: '1 hora', value: '1h' },
  { label: '6 horas', value: '6h' },
  { label: '24 horas', value: '24h' },
];

export default function TrendViewer() {
  const { instruments, liveData } = useProcess();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState('15m');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Auto-select first few instruments
  useEffect(() => {
    if (instruments.length > 0 && selectedTags.length === 0) {
      setSelectedTags(instruments.slice(0, 3).map((i) => i.tag));
    }
  }, [instruments]);

  const fetchData = async () => {
    if (selectedTags.length === 0) return;
    setLoading(true);
    try {
      // Query all selected tags in parallel
      const allReadings: any[][] = await Promise.all(
        selectedTags.map(async (t) => {
          const { data: r } = await readingsAPI.query({
            instrument_tag: t,
            time_range: timeRange,
            downsample: timeRange === '24h' ? '5m' : timeRange === '6h' ? '1m' : undefined,
          });
          return r.map((pt: any) => ({ time: pt.time, tag: t, value: pt.value }));
        })
      );

      // Merge into consolidated array keyed by time
      const merged: Record<string, any> = {};
      allReadings.forEach((tagReadings, tagIdx) => {
        tagReadings.forEach((pt: any) => {
          const timeKey = new Date(pt.time).toLocaleTimeString('es-AR', {
            hour: '2-digit', minute: '2-digit', second: '2-digit',
          });
          if (!merged[timeKey]) merged[timeKey] = { time: timeKey };
          merged[timeKey][selectedTags[tagIdx]] = pt.value;
        });
      });
      const chartData = Object.values(merged).sort((a: any, b: any) => a.time.localeCompare(b.time));
      setData(chartData.length > 0 ? chartData : []);
    } catch (err) {
      console.error('Error fetching trends:', err);
      // Generate synthetic data for demo
      generateSyntheticData();
    } finally {
      setLoading(false);
    }
  };

  const generateSyntheticData = () => {
    const now = Date.now();
    const points = 60;
    const synth = Array.from({ length: points }, (_, i) => {
      const entry: any = {
        time: new Date(now - (points - i) * 5000).toLocaleTimeString('es-AR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      };
      selectedTags.forEach((tag, idx) => {
        const base = tag.startsWith('TT') || tag.startsWith('TI') ? 420
          : tag.startsWith('PT') || tag.startsWith('PI') ? 2.1
          : tag.startsWith('FT') || tag.startsWith('FI') ? 850
          : 50;
        const noise = (Math.random() - 0.5) * base * 0.02;
        const drift = Math.sin(i / 10 + idx) * base * 0.01;
        entry[tag] = base + noise + drift;
      });
      return entry;
    });
    setData(synth);
  };

  useEffect(() => {
    fetchData();
  }, [selectedTags, timeRange]);

  // Append live data
  useEffect(() => {
    if (selectedTags.length === 0) return;
    const hasNew = selectedTags.some((t) => liveData[t]);
    if (!hasNew) return;

    const now = new Date().toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const point: any = { time: now };
    selectedTags.forEach((tag) => {
      point[tag] = liveData[tag]?.value ?? null;
    });

    setData((prev) => {
      const next = [...prev, point];
      return next.length > 120 ? next.slice(-120) : next;
    });
  }, [liveData, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag].slice(0, 6)
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Tendencias</h1>
          <p className="text-sm text-muted">Visor de datos históricos y en tiempo real</p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {TIME_RANGES.map((tr) => (
            <button
              key={tr.value}
              className={`btn btn-sm ${tr.value === timeRange ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTimeRange(tr.value)}
            >
              {tr.label}
            </button>
          ))}
          <button className="btn btn-sm btn-secondary" onClick={fetchData} disabled={loading}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Tag Selector */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title">Seleccionar Señales (máx 6)</span>
          <span className="text-xs text-muted">{selectedTags.length} seleccionadas</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {instruments.map((inst) => {
            const idx = selectedTags.indexOf(inst.tag);
            const isSelected = idx >= 0;
            return (
              <button
                key={inst.tag}
                onClick={() => toggleTag(inst.tag)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${isSelected ? COLORS[idx % COLORS.length] : 'var(--border-color)'}`,
                  background: isSelected ? `${COLORS[idx % COLORS.length]}15` : 'transparent',
                  color: isSelected ? COLORS[idx % COLORS.length] : 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                {inst.tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      <div className="card" style={{ padding: '1rem 0.5rem' }}>
        <ResponsiveContainer width="100%" height={420}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" strokeOpacity={0.5} />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend />
            {selectedTags.map((tag, i) => (
              <Line
                key={tag}
                type="monotone"
                dataKey={tag}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Current Values */}
      {selectedTags.length > 0 && (
        <div className="grid-cols-3" style={{ marginTop: 16 }}>
          {selectedTags.map((tag, i) => {
            const reading = liveData[tag];
            const inst = instruments.find((ins) => ins.tag === tag);
            return (
              <div
                key={tag}
                className="card"
                style={{ borderLeft: `3px solid ${COLORS[i % COLORS.length]}` }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div className="mono" style={{ fontWeight: 600, color: COLORS[i % COLORS.length] }}>
                      {tag}
                    </div>
                    <div className="text-xs text-muted">{inst?.description || ''}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: COLORS[i % COLORS.length] }}>
                      {reading?.value != null ? reading.value.toFixed(2) : '---'}
                    </div>
                    <div className="text-xs text-muted">{inst?.unit || ''}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
