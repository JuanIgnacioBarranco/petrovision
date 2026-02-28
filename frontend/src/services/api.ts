// ============================================================
// PetroVision — API Service (Axios)
// ============================================================

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

// ── Interceptor: attach JWT token ───────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Interceptor: handle 401 ─────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ────────────────────────────────────────────────────
export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  me: () => api.get('/auth/me'),
  listUsers: () => api.get('/auth/users'),
};

// ── Processes ───────────────────────────────────────────────
export const processAPI = {
  list: () => api.get('/processes'),
  get: (id: number) => api.get(`/processes/${id}`),
  create: (data: unknown) => api.post('/processes', data),
};

// ── Instruments ─────────────────────────────────────────────
export const instrumentAPI = {
  list: (processId?: number) =>
    api.get('/instruments', { params: processId ? { process_id: processId } : {} }),
  get: (tag: string) => api.get(`/instruments/${tag}`),
};

// ── Equipment ───────────────────────────────────────────────
export const equipmentAPI = {
  list: (processId?: number) =>
    api.get('/equipment', { params: processId ? { process_id: processId } : {} }),
};

// ── PID Loops ───────────────────────────────────────────────
export const pidAPI = {
  list: (processId?: number) =>
    api.get('/pid-loops', { params: processId ? { process_id: processId } : {} }),
  changeSetpoint: (tag: string, setpoint: number) =>
    api.patch(`/pid-loops/${tag}/setpoint`, { setpoint }),
  changeMode: (tag: string, mode: string) =>
    api.patch(`/pid-loops/${tag}/mode`, { mode }),
};

// ── Alarms ──────────────────────────────────────────────────
export const alarmAPI = {
  list: (params?: Record<string, unknown>) => api.get('/alarms', { params }),
  active: () => api.get('/alarms/active'),
  acknowledge: (id: number) => api.post(`/alarms/${id}/acknowledge`),
  summary: (processId?: number) =>
    api.get('/alarms/summary', { params: processId ? { process_id: processId } : {} }),
};

// ── Batches ─────────────────────────────────────────────────
export const batchAPI = {
  list: (params?: Record<string, unknown>) => api.get('/batches', { params }),
  get: (id: number) => api.get(`/batches/${id}`),
  create: (data: unknown) => api.post('/batches', data),
  start: (id: number) => api.post(`/batches/${id}/start`),
  complete: (id: number, data?: unknown) => api.post(`/batches/${id}/complete`, data),
};

// ── ML ──────────────────────────────────────────────────────
export const mlAPI = {
  listModels: () => api.get('/ml/models'),
  predict: (data: unknown) => api.post('/ml/predict', data),
  listPredictions: (params?: Record<string, unknown>) =>
    api.get('/ml/predictions', { params }),
  retrain: (modelName: string) => api.post(`/ml/retrain/${modelName}`),
};

// ── Readings (Time Series) ──────────────────────────────────
export const readingsAPI = {
  get: (instrument: string, range: string = '-1h', downsample?: string) =>
    api.get('/readings', { params: { instrument, range, downsample } }),
  query: (params: { instrument_tag: string; time_range?: string; downsample?: string }) =>
    api.get('/readings', {
      params: {
        instrument: params.instrument_tag,
        // InfluxDB range must be negative: "-1h". Strip leading dash if already present.
        range: params.time_range
          ? (params.time_range.startsWith('-') ? params.time_range : `-${params.time_range}`)
          : '-1h',
        downsample: params.downsample,
      },
    }),
};

// ── Audit Log ────────────────────────────────────────────────
export const auditAPI = {
  list: (params?: Record<string, unknown>) => api.get('/audit', { params }),
};

// ── Digital Twin ────────────────────────────────────────────
export const digitalTwinAPI = {
  snapshot: (processId: number) => api.get(`/digital-twin/${processId}/snapshot`),
};

// ── SPC ─────────────────────────────────────────────────────
export const spcAPI = {
  instruments: (processId?: number) =>
    api.get('/spc/instruments', { params: processId ? { process_id: processId } : {} }),
  shewhart: (tag: string, timeRange: string = '-6h', downsample?: string) =>
    api.get(`/spc/shewhart/${tag}`, { params: { time_range: timeRange, downsample } }),
  cusum: (tag: string, timeRange: string = '-6h', k: number = 0.5, h: number = 5.0) =>
    api.get(`/spc/cusum/${tag}`, { params: { time_range: timeRange, k, h } }),
  ewma: (tag: string, timeRange: string = '-6h', lam: number = 0.2, L: number = 3.0) =>
    api.get(`/spc/ewma/${tag}`, { params: { time_range: timeRange, lam, L } }),
};

// ── Reports ─────────────────────────────────────────────────
export const reportsAPI = {
  generate: (processId: number, reportType: string, periodsBack: number = 1) =>
    api.get('/reports/generate', { params: { process_id: processId, report_type: reportType, periods_back: periodsBack } }),
  history: (processId: number, reportType?: string) =>
    api.get('/reports/history', { params: { process_id: processId, report_type: reportType } }),
  detail: (reportId: number) =>
    api.get(`/reports/history/${reportId}`),
  exportExcel: (processId: number, reportType: string, periodsBack: number = 1) =>
    api.get('/reports/export/excel', {
      params: { process_id: processId, report_type: reportType, periods_back: periodsBack },
      responseType: 'blob',
    }),
  summary: (processId: number) =>
    api.get('/reports/summary', { params: { process_id: processId } }),
};

export default api;
