// ============================================================
// PetroVision — Process View
// ============================================================

import { useEffect, useState, useCallback } from 'react';
import { FlaskConical, Atom, DollarSign, Thermometer, Gauge, RefreshCw } from 'lucide-react';
import { useProcess } from '@/hooks/useProcess';
import { processAPI } from '@/services/api';
import type { ChemicalProcess } from '@/types';

export default function ProcessView() {
  const { processes, setProcesses, activeProcessId, setActiveProcess } = useProcess();
  const [selected, setSelected] = useState<ChemicalProcess | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProcesses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await processAPI.list();
      setProcesses(r.data);
    } catch (err) {
      console.error(err);
      setError('No se pudo conectar al servidor. Verifica que el backend esté activo.');
    } finally {
      setLoading(false);
    }
  }, [setProcesses]);

  useEffect(() => {
    // Only fetch if store is empty (MainLayout may have populated it already)
    if (processes.length === 0) fetchProcesses();
  }, []);

  useEffect(() => {
    const p = processes.find((p) => p.id === activeProcessId) || processes[0] || null;
    setSelected(p);
    if (p && !activeProcessId) setActiveProcess(p.id);
  }, [processes, activeProcessId]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
        <RefreshCw size={24} style={{ marginBottom: 12, animation: 'spin 1s linear infinite' }} />
        <br />Cargando procesos...
      </div>
    );
  }

  if (error || (!loading && processes.length === 0)) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
        <FlaskConical size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
        <br />
        {error || 'No se encontraron procesos configurados.'}
        <br /><br />
        <button className="btn btn-primary" onClick={fetchProcesses} disabled={loading}>
          <RefreshCw size={14} /> Reintentar
        </button>
      </div>
    );
  }

  if (!selected) return null;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Procesos Químicos</h1>
          <p className="text-sm text-muted">Configuración y parámetros de los procesos</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {processes.map((p) => (
            <button
              key={p.id}
              className={`btn ${p.id === selected.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => {
                setSelected(p);
                setActiveProcess(p.id);
              }}
            >
              {p.code}
            </button>
          ))}
        </div>
      </div>

      {/* Process Header Card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 'var(--radius-lg)',
              background: 'var(--gradient-purple)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <FlaskConical size={28} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 4 }}>{selected.name}</h2>
            <div className="mono text-sm text-muted" style={{ marginBottom: 8 }}>{selected.code}</div>
            {selected.reaction_equation && (
              <div
                style={{
                  background: 'rgba(139,92,246,0.08)',
                  border: '1px solid rgba(139,92,246,0.2)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.5rem 0.75rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                  color: 'var(--accent-purple)',
                }}
              >
                {selected.reaction_equation}
              </div>
            )}
          </div>
          <span className={`badge ${selected.is_active ? 'badge-success' : 'badge-default'}`}>
            {selected.is_active ? 'ACTIVO' : 'INACTIVO'}
          </span>
        </div>
      </div>

      {/* Parameters Grid */}
      <div className="grid-cols-3" style={{ marginBottom: 20 }}>
        {/* Operating Conditions */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Condiciones de Operación</span>
            <Thermometer size={16} color="var(--accent-orange)" />
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <ParamRow label="Temperatura SP" value={`${selected.temperature_sp} °C`} icon={<Thermometer size={14} />} />
            <ParamRow label="Presión SP" value={`${selected.pressure_sp} bar`} icon={<Gauge size={14} />} />
            {selected.catalyst && (
              <ParamRow label="Catalizador" value={selected.catalyst} icon={<Atom size={14} />} />
            )}
          </div>
        </div>

        {/* Performance Targets */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Metas de Rendimiento</span>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <ParamRow
              label="Conversión Target"
              value={`${((selected.conversion ?? 0) * 100).toFixed(1)}%`}
              color="var(--accent-green)"
            />
            <ParamRow
              label="Selectividad Target"
              value={`${((selected.selectivity ?? 0) * 100).toFixed(1)}%`}
              color="var(--accent-blue)"
            />
            <ParamRow
              label="Rendimiento Global"
              value={`${((selected.yield_global ?? 0) * 100).toFixed(1)}%`}
              color="var(--accent-cyan)"
            />
          </div>
        </div>

        {/* Economics */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Información Económica</span>
            <DollarSign size={16} color="var(--accent-green)" />
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <ParamRow label="Materia Prima" value={selected.feed_material || '-'} />
            <ParamRow label="Producto Principal" value={selected.product_name || '-'} />
            {selected.product_price_per_kg != null && (
              <ParamRow label="Precio Producto" value={`USD ${selected.product_price_per_kg}/kg`} color="var(--accent-green)" />
            )}
          </div>
        </div>
      </div>

      {/* Stoichiometry */}
      {selected.stoichiometry && selected.stoichiometry.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Estequiometría</span>
            <Atom size={16} color="var(--accent-purple)" />
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Componente</th>
                  <th>Fórmula</th>
                  <th>Coeficiente</th>
                  <th>Rol</th>
                </tr>
              </thead>
              <tbody>
                {selected.stoichiometry.map((s, i) => (
                  <tr key={i}>
                    <td>{s.name}</td>
                    <td className="mono">{s.formula}</td>
                    <td className="mono" style={{ color: 'var(--accent-cyan)' }}>{s.coefficient}</td>
                    <td>
                      <span className={`badge ${s.role === 'reactant' ? 'badge-warning' : s.role === 'product' ? 'badge-success' : 'badge-info'}`}>
                        {s.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ParamRow({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  color?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className="mono text-sm" style={{ color: color || 'var(--text-primary)', fontWeight: 600 }}>
        {value}
      </span>
    </div>
  );
}
