// ============================================================
// PetroVision — TypeScript Types (matches backend schemas)
// ============================================================

// ── Auth ────────────────────────────────────────────────────

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'operador' | 'ingeniero_quimico' | 'data_scientist' | 'supervisor' | 'admin';
  is_active: boolean;
  area?: string;
  shift?: string;
  last_login?: string;
  created_at?: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  user: User;
}

// ── Chemical Process ────────────────────────────────────────

export interface StoichEntry {
  name: string;
  formula: string;
  mw: number;
  coefficient: number;
  role: 'reactant' | 'product' | 'catalyst' | 'byproduct';
}

export interface ChemicalProcess {
  id: number;
  name: string;
  code: string;
  description?: string;
  reaction_equation?: string;
  catalyst?: string;
  temperature_sp: number;
  pressure_sp: number;
  conversion: number;
  selectivity: number;
  yield_global: number;
  feed_material?: string;
  feed_rate_kg_h?: number;
  product_name?: string;
  product_rate_kg_h?: number;
  feed_cost_per_kg?: number;
  product_price_per_kg?: number;
  stoichiometry?: StoichEntry[];
  is_active: boolean;
  created_at?: string;
}

// ── Instrument ──────────────────────────────────────────────

export interface Instrument {
  id: number;
  process_id: number;
  tag: string;
  description: string;
  instrument_type: string;
  unit: string;
  area?: string;
  lolo?: number;
  lo?: number;
  sp?: number;
  hi?: number;
  hihi?: number;
  range_min?: number;
  range_max?: number;
  is_active: boolean;
  calibration_date?: string;
}

// ── Equipment ───────────────────────────────────────────────

export interface Equipment {
  id: number;
  process_id: number;
  tag: string;
  name: string;
  equipment_type: string;
  area?: string;
  status: string;
  operating_hours: number;
  is_active: boolean;
  specs?: Record<string, unknown>;
  last_maintenance?: string;
  next_maintenance?: string;
}

// ── PID Loop ────────────────────────────────────────────────

export interface PIDLoop {
  id: number;
  process_id: number;
  tag: string;
  description: string;
  pv_tag: string;
  cv_tag?: string;
  kp: number;
  ti: number;
  td: number;
  mode: 'AUTO' | 'MANUAL' | 'CASCADE';
  setpoint: number;
  output?: number;
  output_min: number;
  output_max: number;
  anti_windup: boolean;
  is_active: boolean;
}

// ── Alarm (ISA 18.2) ───────────────────────────────────────

export interface Alarm {
  id: number;
  instrument_tag: string;
  process_id: number;
  area?: string;
  priority: string; // CRITICA | ALTA | MEDIA | BAJA
  alarm_type: string;
  message: string;
  value?: number;
  limit?: number;
  unit?: string;
  state: 'UNACK_ACTIVE' | 'ACK_ACTIVE' | 'UNACK_CLEAR' | 'ACK_CLEAR';
  triggered_at?: string;
  acknowledged_at?: string;
  acknowledged_by?: number;
  cleared_at?: string;
}

// ── Batch ───────────────────────────────────────────────────

export interface Batch {
  id: number;
  process_id: number;
  batch_number: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED' | 'REJECTED';
  planned_start?: string;
  actual_start?: string;
  actual_end?: string;
  feed_amount_kg?: number;
  product_amount_kg?: number;
  purity?: number;
  yield_actual?: number;
  quality_grade?: string;
  notes?: string;
  production_cost?: number;
  revenue?: number;
  created_at?: string;
}

// ── ML ──────────────────────────────────────────────────────

export interface MLModel {
  id: number;
  name: string;
  version: string;
  algorithm: string;
  model_type: string;
  metrics?: Record<string, number>;
  trained_at?: string;
  training_samples?: number;
  status: string;
  is_production: boolean;
  drift_detected: boolean;
  // v2 fields
  description?: string;
  features_used?: string[];
  hyperparameters?: Record<string, unknown>;
}

export interface Prediction {
  id: number;
  model_id: number;
  prediction_type: string;
  target_tag?: string;
  predicted_value?: number;
  actual_value?: number;
  confidence?: number;
  horizon_minutes?: number;
  features?: Record<string, number>;
  error?: number;
  created_at: string;
}

/** Extended prediction result returned by the predict endpoint */
export interface PredictionResult {
  predicted_value: number;
  confidence: number;
  model_version?: string;
  algorithm?: string;
  interpretation?: string;
  error_msg?: string;
  // temperature predictor
  prediction_lower?: number;
  prediction_upper?: number;
  time_constant_min?: number;
  // yield optimizer
  optimal_yield?: number;
  yield_gap?: number;
  feature_importance?: Record<string, number>;
  catalyst_activity_pct?: number;
  recommendations?: string[];
  // anomaly detector
  anomaly_score?: number;
  severity?: string;
  severity_color?: string;
  score_breakdown?: Record<string, number>;
  root_cause?: string;
  is_anomaly?: boolean;
  // maintenance predictor
  failure_prob?: number;
  rul_hours?: number;
  rul_days?: number;
  health_index?: number;
  risk_factors?: Array<{ factor: string; value: string; impact: string }>;
  recommendation?: string;
  urgency?: string;
  // quality predictor
  purity?: number;
  spec_min?: number;
  in_spec?: boolean;
  spec_margin?: number;
  // energy optimizer
  current_consumption_kw?: number;
  optimal_consumption_kw?: number;
  savings_kw?: number;
  savings_pct?: number;
}

// ── Live Data (WebSocket) ───────────────────────────────────

export interface LiveReading {
  tag?: string;
  value: number;
  unit?: string;
  quality?: string;
  timestamp?: string;
}

export interface LiveDataMessage {
  channel: string;
  data: any; // varies by channel: LiveReading[] | Alarm | Prediction
  timestamp?: string;
}

// ── Digital Twin ────────────────────────────────────────────

export interface DTEquipmentHealth {
  name: string;
  type: string;
  status: string;
  operating_hours: number;
  next_maintenance: string | null;
  last_maintenance: string | null;
  health_index: number;
  rul_days: number;
  failure_prob: number;
  urgency: string;
}

export interface DTLiveReading {
  value: number | null;
  time: string | null;
  unit: string;
  sp?: number;
  lo?: number;
  hi?: number;
  lolo?: number;
  hihi?: number;
}

export interface DTPIDStatus {
  description: string;
  mode: 'AUTO' | 'MANUAL' | 'CASCADE';
  setpoint: number;
  pv: number | null;
  output: number;
  kp: number;
  ti: number;
  td: number;
  cv_tag: string;
}

export interface DigitalTwinSnapshot {
  process_id: number;
  instrument_count: number;
  equipment_count: number;
  pid_count: number;
  live_readings: Record<string, DTLiveReading>;
  equipment_health: Record<string, DTEquipmentHealth>;
  pid_status: Record<string, DTPIDStatus>;
}

// ── Time Series ─────────────────────────────────────────────

export interface TimeSeriesPoint {
  time: string;
  value: number;
  instrument?: string;
}
