// ============================================================
// PetroVision — Instrument List Module
// ============================================================

import { useEffect, useState } from 'react';
import { Gauge, Search, Filter } from 'lucide-react';
import { useProcess } from '@/hooks/useProcess';
import api, { instrumentAPI } from '@/services/api';

export default function InstrumentList() {
  const { instruments, setInstruments, liveData, updateBulkReadings } = useProcess();
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    // Load instrument list
    instrumentAPI.list().then((r) => setInstruments(r.data)).catch(console.error);

    // Bootstrap live data via REST (before first WS tick)
    api.get('/instruments/live').then((r) => {
      const bulk: Record<string, any> = {};
      Object.entries(r.data).forEach(([tag, reading]: [string, any]) => {
        bulk[tag] = reading;
      });
      if (Object.keys(bulk).length > 0) updateBulkReadings(bulk);
    }).catch(() => {}); // silently ignore if sim hasn't started yet
  }, []);

  const types = [...new Set(instruments.map((i) => i.instrument_type))].sort();

  const filtered = instruments.filter((inst) => {
    const matchText =
      inst.tag.toLowerCase().includes(filter.toLowerCase()) ||
      inst.description?.toLowerCase().includes(filter.toLowerCase());
    const matchType = typeFilter === 'all' || inst.instrument_type === typeFilter;
    return matchText && matchType;
  });

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Instrumentos</h1>
        <p className="text-sm text-muted">Lista ISA de instrumentación de campo</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input"
            style={{ paddingLeft: 32 }}
            placeholder="Buscar por tag o descripción..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <select
          className="select"
          style={{ width: 180 }}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">Todos los tipos</option>
          {types.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <div className="text-sm text-muted" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Filter size={14} />
          {filtered.length} de {instruments.length}
        </div>
      </div>

      {/* Instruments Table */}
      <div className="card">
        <div className="table-container" style={{ maxHeight: 'calc(100vh - 260px)', overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}></th>
                <th>Tag ISA</th>
                <th>Tipo</th>
                <th>Descripción</th>
                <th>Área</th>
                <th>Valor Actual</th>
                <th>Unidad</th>
                <th>Rango</th>
                <th>SP</th>
                <th>Alarmas</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inst) => {
                const reading = liveData[inst.tag];
                const value = reading?.value;
                const inAlarm =
                  value != null &&
                  ((inst.hihi != null && value >= inst.hihi) ||
                    (inst.lolo != null && value <= inst.lolo));
                const inWarning =
                  !inAlarm &&
                  value != null &&
                  ((inst.hi != null && value >= inst.hi) ||
                    (inst.lo != null && value <= inst.lo));

                return (
                  <tr key={inst.tag}>
                    <td>
                      <span
                        className={`led ${
                          reading ? (inAlarm ? 'led-red' : inWarning ? 'led-yellow' : 'led-green') : 'led-gray'
                        }`}
                      />
                    </td>
                    <td className="mono" style={{ fontWeight: 600 }}>{inst.tag}</td>
                    <td>
                      <span className="badge badge-info">{inst.instrument_type}</span>
                    </td>
                    <td className="text-sm">{inst.description || '-'}</td>
                    <td className="mono text-xs text-muted">{inst.area || '-'}</td>
                    <td
                      className="mono"
                      style={{
                        fontWeight: 700,
                        color: inAlarm
                          ? 'var(--accent-red)'
                          : inWarning
                          ? 'var(--accent-yellow)'
                          : 'var(--accent-cyan)',
                      }}
                    >
                      {value != null ? value.toFixed(2) : '---'}
                    </td>
                    <td className="text-muted text-xs">{inst.unit}</td>
                    <td className="mono text-xs text-muted">
                      {inst.range_min != null && inst.range_max != null
                        ? `${inst.range_min} – ${inst.range_max}`
                        : '-'}
                    </td>
                    <td className="mono text-sm">{inst.sp != null ? inst.sp.toFixed(1) : '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {inst.lolo != null && (
                          <span className="text-xs mono" style={{ color: 'var(--accent-red)' }} title="LoLo">
                            LL:{inst.lolo}
                          </span>
                        )}
                        {inst.lo != null && (
                          <span className="text-xs mono" style={{ color: 'var(--accent-yellow)' }} title="Lo">
                            L:{inst.lo}
                          </span>
                        )}
                        {inst.hi != null && (
                          <span className="text-xs mono" style={{ color: 'var(--accent-yellow)' }} title="Hi">
                            H:{inst.hi}
                          </span>
                        )}
                        {inst.hihi != null && (
                          <span className="text-xs mono" style={{ color: 'var(--accent-red)' }} title="HiHi">
                            HH:{inst.hihi}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No se encontraron instrumentos.
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
