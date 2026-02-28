// ============================================================
// PetroVision — Batch Tracker
// ============================================================

import { useEffect, useState, useCallback } from 'react';
import { Package, Play, CheckCircle2, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { batchAPI } from '@/services/api';
import { useProcess } from '@/hooks/useProcess';
import type { Batch } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  PLANNED: 'var(--text-muted)',
  IN_PROGRESS: 'var(--accent-blue)',
  COMPLETED: 'var(--accent-green)',
  APPROVED: 'var(--accent-cyan)',
  REJECTED: 'var(--accent-red)',
};

const STATUS_BADGES: Record<string, string> = {
  PLANNED: 'badge-default',
  IN_PROGRESS: 'badge-info',
  COMPLETED: 'badge-success',
  APPROVED: 'badge-success',
  REJECTED: 'badge-danger',
};

export default function BatchTracker() {
  const { processes } = useProcess();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const firstProcessId = processes.length > 0 ? processes[0].id : 1;
  const [form, setForm] = useState({ batch_number: '', process_id: firstProcessId, notes: '' });

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await batchAPI.list();
      setBatches(data);
    } catch (err) {
      console.error('Error fetching batches:', err);
      setError('No se pudieron cargar los lotes. Verifica la conexión.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const handleCreate = async () => {
    try {
      await batchAPI.create(form);
      setShowForm(false);
      setForm({ batch_number: '', process_id: 1, notes: '' });
      fetchBatches();
    } catch (err) {
      console.error('Error creating batch:', err);
    }
  };

  const handleStart = async (id: number) => {
    try {
      await batchAPI.start(id);
      fetchBatches();
    } catch (err) {
      console.error('Error starting batch:', err);
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await batchAPI.complete(id, {});
      fetchBatches();
    } catch (err) {
      console.error('Error completing batch:', err);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Seguimiento de Lotes</h1>
          <p className="text-sm text-muted">Control de producción por lotes (ISA-88)</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={fetchBatches} disabled={loading}>
            <RefreshCw size={14} /> Actualizar
          </button>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            <Plus size={14} /> Nuevo Lote
          </button>
        </div>
      </div>

      {/* New Batch Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <span className="card-title">Crear Nuevo Lote</span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>
                Número de Lote
              </label>
              <input
                className="input"
                placeholder="LOT-2026-001"
                value={form.batch_number}
                onChange={(e) => setForm({ ...form, batch_number: e.target.value })}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>
                Proceso
              </label>
              <select
                className="input"
                value={form.process_id}
                onChange={(e) => setForm({ ...form, process_id: Number(e.target.value) })}
              >
                {processes.map((p) => (
                  <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
                ))}
                {processes.length === 0 && <option value={1}>MA-100</option>}
              </select>
            </div>
            <div style={{ flex: 2 }}>
              <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>
                Notas
              </label>
              <input
                className="input"
                placeholder="Notas opcionales..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <button className="btn btn-primary" onClick={handleCreate}>
              Crear
            </button>
          </div>
        </div>
      )}

      {/* Batch Cards */}
      <div className="grid-cols-2">
        {batches.map((batch) => (
          <div
            key={batch.id}
            className="card"
            style={{ borderLeft: `3px solid ${STATUS_COLORS[batch.status] || 'var(--border-color)'}` }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div className="mono" style={{ fontSize: '1rem', fontWeight: 700 }}>
                  {batch.batch_number}
                </div>
                <div className="text-xs text-muted">
                  Proceso ID: {batch.process_id}
                </div>
              </div>
              <span className={`badge ${STATUS_BADGES[batch.status] || 'badge-default'}`}>
                {batch.status}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
              <InfoRow label="Inicio" value={batch.actual_start ? new Date(batch.actual_start).toLocaleString('es-AR') : 'Pendiente'} />
              <InfoRow label="Fin" value={batch.actual_end ? new Date(batch.actual_end).toLocaleString('es-AR') : '-'} />
              {batch.feed_amount_kg != null && (
                <InfoRow label="Alimentación" value={`${batch.feed_amount_kg} kg`} />
              )}
              {batch.product_amount_kg != null && (
                <InfoRow label="Producto" value={`${batch.product_amount_kg} kg`} />
              )}
            </div>

            {batch.notes && (
              <div className="text-xs text-muted" style={{ marginBottom: 8 }}>
                {batch.notes}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              {batch.status === 'PLANNED' && (
                <button className="btn btn-sm btn-primary" onClick={() => handleStart(batch.id)}>
                  <Play size={12} /> Iniciar
                </button>
              )}
              {batch.status === 'IN_PROGRESS' && (
                <button className="btn btn-sm btn-secondary" onClick={() => handleComplete(batch.id)}>
                  <CheckCircle2 size={12} /> Completar
                </button>
              )}
            </div>
          </div>
        ))}
        {!loading && batches.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            {error
              ? <AlertCircle size={32} style={{ marginBottom: 8, opacity: 0.5, color: 'var(--accent-red)' }} />
              : <Package size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
            }
            <br />
            {error || 'No hay lotes registrados.'}
            <br /><br />
            <button className="btn btn-secondary" onClick={fetchBatches} disabled={loading}>
              <RefreshCw size={14} /> Reintentar
            </button>
          </div>
        )}
        {loading && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} style={{ marginBottom: 8, animation: 'spin 1s linear infinite' }} />
            <br />Cargando lotes...
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.03em' }}>
        {label}
      </div>
      <div className="text-sm mono">{value}</div>
    </div>
  );
}
