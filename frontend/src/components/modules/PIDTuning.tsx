// ============================================================
// PetroVision — PID Tuning Module
// ============================================================

import { useEffect, useState } from 'react';
import { SlidersHorizontal, Play, Pause, RefreshCw, Settings2 } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts';
import { pidAPI } from '@/services/api';
import { useProcess } from '@/hooks/useProcess';
import type { PIDLoop } from '@/types';

export default function PIDTuning() {
  const { pidLoops, setPIDLoops, liveData } = useProcess();
  const [selected, setSelected] = useState<PIDLoop | null>(null);
  const [setpointInput, setSetpointInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    pidAPI.list().then((r) => {
      setPIDLoops(r.data);
      if (r.data.length > 0) {
        setSelected(r.data[0]);
        setSetpointInput(String(r.data[0].setpoint));
      }
    }).catch(console.error);
  }, []);

  // Simulated PID response curve for selected loop
  const pidResponse = (() => {
    if (!selected) return [];
    const sp = selected.setpoint;
    const kp = selected.kp;
    const ti = selected.ti;
    const points = 60;
    const data = [];
    let pv = sp * 0.85; // start below setpoint
    let integral = 0;
    let prevError = sp - pv;

    for (let i = 0; i < points; i++) {
      const error = sp - pv;
      integral += error * 0.5;
      const derivative = (error - prevError) / 0.5;
      const output = kp * (error + integral / ti + selected.td * derivative);
      pv += output * 0.1 + (Math.random() - 0.5) * sp * 0.005;
      prevError = error;

      data.push({
        t: `${i}s`,
        pv: pv,
        sp: sp,
        output: Math.max(0, Math.min(100, 50 + output)),
      });
    }
    return data;
  })();

  const handleSetpoint = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await pidAPI.changeSetpoint(selected.tag, Number(setpointInput));
      // Refresh
      const { data } = await pidAPI.list();
      setPIDLoops(data);
      const updated = data.find((p: PIDLoop) => p.tag === selected.tag);
      if (updated) setSelected(updated);
    } catch (err) {
      console.error('Setpoint change error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMode = async (mode: string) => {
    if (!selected) return;
    setLoading(true);
    try {
      await pidAPI.changeMode(selected.tag, mode);
      const { data } = await pidAPI.list();
      setPIDLoops(data);
      const updated = data.find((p: PIDLoop) => p.tag === selected.tag);
      if (updated) setSelected(updated);
    } catch (err) {
      console.error('Mode change error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>PID Tuning</h1>
        <p className="text-sm text-muted">Control y sintonización de lazos PID</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
        {/* PID Loops Sidebar */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
            <span className="card-title">Lazos PID</span>
          </div>
          <div style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
            {pidLoops.map((loop) => {
              const pvReading = liveData[loop.pv_tag];
              const isSelected = selected?.pv_tag === loop.pv_tag;
              return (
                <div
                  key={loop.pv_tag}
                  onClick={() => {
                    setSelected(loop);
                    setSetpointInput(String(loop.setpoint));
                  }}
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(42,58,78,0.3)',
                    background: isSelected ? 'rgba(59,130,246,0.08)' : 'transparent',
                    borderLeft: isSelected ? '3px solid var(--accent-blue)' : '3px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="mono text-sm" style={{ fontWeight: 600 }}>{loop.pv_tag}</span>
                    <span className={`badge ${loop.mode === 'AUTO' ? 'badge-success' : loop.mode === 'CASCADE' ? 'badge-info' : 'badge-warning'}`}>
                      {loop.mode}
                    </span>
                  </div>
                  <div className="text-xs text-muted" style={{ marginTop: 2 }}>
                    SP: {loop.setpoint} | PV: {pvReading?.value?.toFixed(1) ?? '---'} | CV: {loop.output?.toFixed(0)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail Panel */}
        {selected ? (
          <div>
            {/* Controls */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header">
                <div>
                  <span style={{ fontWeight: 700, fontSize: '1rem' }}>{selected.pv_tag}</span>
                  <span className="text-sm text-muted" style={{ marginLeft: 8 }}>→ {selected.cv_tag}</span>
                </div>
                <Settings2 size={16} color="var(--accent-blue)" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
                <div className="kpi">
                  <span className="kpi-label">Setpoint</span>
                  <span className="kpi-value" style={{ fontSize: '1.25rem', color: 'var(--accent-blue)' }}>
                    {selected.setpoint}
                  </span>
                </div>
                <div className="kpi">
                  <span className="kpi-label">PV Actual</span>
                  <span className="kpi-value" style={{ fontSize: '1.25rem', color: 'var(--accent-cyan)' }}>
                    {liveData[selected.pv_tag]?.value?.toFixed(2) ?? '---'}
                  </span>
                </div>
                <div className="kpi">
                  <span className="kpi-label">Output (CV)</span>
                  <span className="kpi-value" style={{ fontSize: '1.25rem', color: 'var(--accent-green)' }}>
                    {selected.output?.toFixed(1)}%
                  </span>
                </div>
                <div className="kpi">
                  <span className="kpi-label">Modo</span>
                  <span className="kpi-value" style={{ fontSize: '1.25rem', color: 'var(--accent-orange)' }}>
                    {selected.mode}
                  </span>
                </div>
              </div>

              {/* Tuning Parameters */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                <ParameterBox label="Kp (Ganancia)" value={selected.kp} color="var(--accent-blue)" />
                <ParameterBox label="Ti (Integral)" value={selected.ti} color="var(--accent-green)" unit="s" />
                <ParameterBox label="Td (Derivativo)" value={selected.td} color="var(--accent-orange)" unit="s" />
                <ParameterBox
                  label="Anti-Windup"
                  value={selected.anti_windup ? 'ON' : 'OFF'}
                  color={selected.anti_windup ? 'var(--accent-green)' : 'var(--text-muted)'}
                />
              </div>

              {/* Setpoint Change & Mode */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <input
                  className="input"
                  type="number"
                  step="0.1"
                  value={setpointInput}
                  onChange={(e) => setSetpointInput(e.target.value)}
                  style={{ width: 120 }}
                />
                <button className="btn btn-primary btn-sm" onClick={handleSetpoint} disabled={loading}>
                  Cambiar SP
                </button>
                <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: 12, display: 'flex', gap: 6 }}>
                  {['AUTO', 'MANUAL', 'CASCADE'].map((mode) => (
                    <button
                      key={mode}
                      className={`btn btn-sm ${selected.mode === mode ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleMode(mode)}
                      disabled={loading}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Response Chart */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Respuesta Simulada del PID</span>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={pidResponse}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" strokeOpacity={0.5} />
                  <XAxis dataKey="t" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="pv" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="cv" orientation="right" tick={{ fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <ReferenceLine yAxisId="pv" y={selected.setpoint} stroke="var(--accent-blue)" strokeDasharray="5 5" label="SP" />
                  <Line yAxisId="pv" type="monotone" dataKey="pv" stroke="var(--accent-cyan)" strokeWidth={2} dot={false} name="PV" />
                  <Line yAxisId="cv" type="monotone" dataKey="output" stroke="var(--accent-green)" strokeWidth={1.5} dot={false} name="CV %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Seleccioná un lazo PID
          </div>
        )}
      </div>
    </div>
  );
}

function ParameterBox({ label, value, color, unit }: { label: string; value: any; color: string; unit?: string }) {
  return (
    <div
      style={{
        padding: '8px 12px',
        background: 'var(--bg-input)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
      }}
    >
      <div className="text-xs text-muted" style={{ marginBottom: 2 }}>{label}</div>
      <div className="mono" style={{ fontWeight: 700, color }}>
        {typeof value === 'number' ? value.toFixed(3) : value}
        {unit && <span className="text-xs text-muted" style={{ marginLeft: 2 }}>{unit}</span>}
      </div>
    </div>
  );
}
