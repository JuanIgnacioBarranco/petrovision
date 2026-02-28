// ============================================================
// PetroVision — Alarm Console (ISA 18.2)
// ============================================================

import { useEffect, useState } from 'react';
import {
  AlertTriangle, Bell, BellOff, CheckCircle2, Filter, RefreshCw,
} from 'lucide-react';
import { useProcess } from '@/hooks/useProcess';
import { alarmAPI } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import type { Alarm } from '@/types';

const PRIORITY_COLORS: Record<string, string> = {
  CRITICA: 'var(--color-emergency)',
  ALTA: 'var(--color-high)',
  MEDIA: 'var(--color-medium)',
  BAJA: 'var(--color-low)',
};

const STATE_LABELS: Record<string, string> = {
  UNACK_ACTIVE: 'Sin Reconocer',
  ACK_ACTIVE: 'Reconocida',
  UNACK_CLEAR: 'Pendiente',
  ACK_CLEAR: 'Resuelta',
};

export default function AlarmConsole() {
  const { user } = useAuth();
  const { activeAlarms, setActiveAlarms } = useProcess();
  const [allAlarms, setAllAlarms] = useState<Alarm[]>([]);
  const [showActive, setShowActive] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  const fetchAlarms = async () => {
    setLoading(true);
    try {
      if (showActive) {
        const { data } = await alarmAPI.active();
        setActiveAlarms(data);
        setAllAlarms(data);
      } else {
        const { data } = await alarmAPI.list();
        setAllAlarms(data);
      }
    } catch (err) {
      console.error('Error fetching alarms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlarms();
  }, [showActive]);

  const handleAck = async (alarmId: number) => {
    try {
      await alarmAPI.acknowledge(alarmId);
      fetchAlarms();
    } catch (err) {
      console.error('Error acknowledging alarm:', err);
    }
  };

  const filtered = allAlarms.filter((a) => {
    return priorityFilter === 'all' || a.priority === priorityFilter;
  });

  // Summary counts
  const summary = {
    critica: allAlarms.filter((a) => a.priority === 'CRITICA').length,
    alta: allAlarms.filter((a) => a.priority === 'ALTA').length,
    media: allAlarms.filter((a) => a.priority === 'MEDIA').length,
    baja: allAlarms.filter((a) => a.priority === 'BAJA').length,
    unack: allAlarms.filter((a) => a.state === 'UNACK_ACTIVE').length,
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Consola de Alarmas</h1>
          <p className="text-sm text-muted">Gestión ISA 18.2 — ciclo de vida de alarmas</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchAlarms} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-pulse' : ''} />
          Actualizar
        </button>
      </div>

      {/* Summary Badges */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <SummaryBadge label="Crítica" count={summary.critica} color="var(--color-emergency)" />
        <SummaryBadge label="Alta" count={summary.alta} color="var(--color-high)" />
        <SummaryBadge label="Media" count={summary.media} color="var(--color-medium)" />
        <SummaryBadge label="Baja" count={summary.baja} color="var(--color-low)" />
        <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: 12 }}>
          <SummaryBadge label="Sin reconocer" count={summary.unack} color="var(--accent-red)" />
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <button
          className={`btn btn-sm ${showActive ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setShowActive(true)}
        >
          <Bell size={14} />
          Activas
        </button>
        <button
          className={`btn btn-sm ${!showActive ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setShowActive(false)}
        >
          <BellOff size={14} />
          Historial
        </button>
        <select
          className="select"
          style={{ width: 160 }}
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="all">Todas las prioridades</option>
          <option value="CRITICA">Crítica</option>
          <option value="ALTA">Alta</option>
          <option value="MEDIA">Media</option>
          <option value="BAJA">Baja</option>
        </select>
      </div>

      {/* Alarm Table */}
      <div className="card">
        <div className="table-container" style={{ maxHeight: 'calc(100vh - 320px)', overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: 8 }}></th>
                <th>Tag</th>
                <th>Tipo</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th>Descripción</th>
                <th>Valor</th>
                <th>Límite</th>
                <th>Hora</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((alarm) => (
                <tr
                  key={alarm.id}
                  style={{
                    background:
                      alarm.state === 'UNACK_ACTIVE'
                        ? `${PRIORITY_COLORS[alarm.priority]}08`
                        : undefined,
                  }}
                >
                  <td>
                    <div
                      style={{
                        width: 4,
                        height: 28,
                        borderRadius: 2,
                        background: PRIORITY_COLORS[alarm.priority] || 'var(--text-muted)',
                      }}
                    />
                  </td>
                  <td className="mono" style={{ fontWeight: 600 }}>{alarm.instrument_tag}</td>
                  <td className="text-xs">{alarm.alarm_type}</td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background: `${PRIORITY_COLORS[alarm.priority]}20`,
                        color: PRIORITY_COLORS[alarm.priority],
                      }}
                    >
                      {alarm.priority}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs">{STATE_LABELS[alarm.state] || alarm.state}</span>
                  </td>
                  <td className="text-sm">{alarm.message || '-'}</td>
                  <td className="mono text-sm">{alarm.value?.toFixed(2) ?? '-'}</td>
                  <td className="mono text-sm text-muted">{alarm.limit?.toFixed(2) ?? '-'}</td>
                  <td className="mono text-xs text-muted">
                    {alarm.triggered_at
                      ? new Date(alarm.triggered_at).toLocaleTimeString('es-AR')
                      : '-'}
                  </td>
                  <td>
                    {alarm.state === 'UNACK_ACTIVE' && (
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleAck(alarm.id)}
                      >
                        <CheckCircle2 size={12} />
                        ACK
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    <AlertTriangle size={24} style={{ marginBottom: 8, opacity: 0.3 }} />
                    <br />
                    No hay alarmas {showActive ? 'activas' : ''}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryBadge({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 'var(--radius-md)',
        background: `${color}10`,
        border: `1px solid ${color}30`,
      }}
    >
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color, fontSize: '1rem' }}>
        {count}
      </span>
      <span className="text-xs text-muted">{label}</span>
    </div>
  );
}
