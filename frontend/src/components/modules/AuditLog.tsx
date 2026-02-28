// ============================================================
// PetroVision — Audit Log Module
// ============================================================

import { useEffect, useState } from 'react';
import { Shield, Search, Download, RefreshCw } from 'lucide-react';
import { auditAPI } from '@/services/api';

interface AuditEntry {
  id: number;
  timestamp: string;
  username: string;
  action: string;
  resource_type: string;
  resource_id: string;
  description: string;
  ip_address: string;
}

const MOCK_LOGS: AuditEntry[] = [
  { id: 1, timestamp: new Date().toISOString(), username: 'admin', action: 'LOGIN', resource_type: 'session', resource_id: '-', description: 'Inicio de sesión exitoso', ip_address: '192.168.1.100' },
  { id: 2, timestamp: new Date(Date.now() - 300000).toISOString(), username: 'operador1', action: 'ACK_ALARM', resource_type: 'alarm', resource_id: '1', description: 'Alarma reconocida: TI-101 [ALTA]', ip_address: '192.168.1.101' },
  { id: 3, timestamp: new Date(Date.now() - 600000).toISOString(), username: 'ing_quimico', action: 'CHANGE_SETPOINT', resource_type: 'pid_loop', resource_id: 'TIC-101', description: 'SP: 420 → 425 °C', ip_address: '192.168.1.102' },
  { id: 4, timestamp: new Date(Date.now() - 900000).toISOString(), username: 'data_scientist', action: 'RUN_PREDICTION', resource_type: 'ml_model', resource_id: 'temperature_predictor', description: 'Inferencia ejecutada, resultado: 422.5', ip_address: '192.168.1.103' },
  { id: 5, timestamp: new Date(Date.now() - 1200000).toISOString(), username: 'admin', action: 'CREATE_BATCH', resource_type: 'batch', resource_id: 'MA-2026-0219-001', description: 'Lote creado para proceso MA-100', ip_address: '192.168.1.100' },
  { id: 6, timestamp: new Date(Date.now() - 1500000).toISOString(), username: 'operador2', action: 'START_BATCH', resource_type: 'batch', resource_id: 'MA-2026-0219-001', description: 'Lote iniciado', ip_address: '192.168.1.104' },
  { id: 7, timestamp: new Date(Date.now() - 1800000).toISOString(), username: 'supervisor', action: 'CHANGE_MODE', resource_type: 'pid_loop', resource_id: 'TIC-201', description: 'Modo: AUTO → MANUAL', ip_address: '192.168.1.105' },
  { id: 8, timestamp: new Date(Date.now() - 2100000).toISOString(), username: 'data_scientist', action: 'RETRAIN_MODEL', resource_type: 'ml_model', resource_id: 'anomaly_detector', description: 'Reentrenamiento completado, accuracy: 0.95', ip_address: '192.168.1.103' },
];

export default function AuditLog() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data } = await auditAPI.list({ limit: 200 });
      if (Array.isArray(data) && data.length > 0) {
        setLogs(data.map((e: any) => ({
          id: e.id,
          timestamp: e.timestamp,
          username: e.username || '—',
          action: e.action,
          resource_type: e.resource_type || '—',
          resource_id: e.resource_id || '—',
          description: e.description || '—',
          ip_address: e.ip_address || '—',
        })));
      } else {
        setLogs(MOCK_LOGS);
      }
    } catch {
      // 403 means no role access — show mock for demo
      setLogs(MOCK_LOGS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const actions = [...new Set(logs.map((l) => l.action))];

  const ACTION_COLORS: Record<string, string> = {
    LOGIN: 'var(--accent-blue)',
    LOGOUT: 'var(--text-muted)',
    ACK_ALARM: 'var(--accent-yellow)',
    CHANGE_SETPOINT: 'var(--accent-orange)',
    CHANGE_MODE: 'var(--accent-purple)',
    RUN_PREDICTION: 'var(--accent-cyan)',
    CREATE_BATCH: 'var(--accent-green)',
    START_BATCH: 'var(--accent-green)',
    RETRAIN_MODEL: 'var(--accent-purple)',
  };

  const filtered = logs.filter((log) => {
    const textMatch =
      (log.username || '').toLowerCase().includes(filter.toLowerCase()) ||
      (log.description || '').toLowerCase().includes(filter.toLowerCase()) ||
      (log.resource_id || '').toLowerCase().includes(filter.toLowerCase());
    const actionMatch = actionFilter === 'all' || log.action === actionFilter;
    return textMatch && actionMatch;
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Auditoría</h1>
          <p className="text-sm text-muted">Registro de acciones del sistema (21 CFR Part 11)</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={fetchLogs} disabled={loading}>
            <RefreshCw size={14} />{loading ? ' Cargando...' : ' Actualizar'}
          </button>
          <button className="btn btn-secondary">
            <Download size={14} /> Exportar CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input"
            style={{ paddingLeft: 32 }}
            placeholder="Buscar por usuario, recurso o detalle..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <select
          className="select"
          style={{ width: 200 }}
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          <option value="all">Todas las acciones</option>
          {actions.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Audit Table */}
      <div className="card">
        <div className="table-container" style={{ maxHeight: 'calc(100vh - 260px)', overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: 50 }}>#</th>
                <th>Fecha/Hora</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Recurso</th>
                <th>ID Recurso</th>
                <th>Detalles</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id}>
                  <td className="text-xs text-muted">{log.id}</td>
                  <td className="mono text-xs">
                    <div>{new Date(log.timestamp).toLocaleDateString('es-AR')}</div>
                    <div className="text-muted">{new Date(log.timestamp).toLocaleTimeString('es-AR')}</div>
                  </td>
                  <td>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(59,130,246,0.08)',
                      }}
                    >
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: 'var(--gradient-blue)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          color: 'white',
                        }}
                      >
                      {log.username?.charAt(0)?.toUpperCase() ?? '?'}
                      </div>
                      <span className="text-sm mono">{log.username}</span>
                    </div>
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background: `${ACTION_COLORS[log.action] || 'var(--text-muted)'}15`,
                        color: ACTION_COLORS[log.action] || 'var(--text-muted)',
                      }}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="text-xs text-muted">{log.resource_type}</td>
                  <td className="mono text-xs">{log.resource_id}</td>
                  <td className="text-sm">{log.description}</td>
                  <td className="mono text-xs text-muted">{log.ip_address}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No se encontraron registros.
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
