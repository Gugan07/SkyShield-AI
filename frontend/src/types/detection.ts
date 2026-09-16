export type TargetType = 'DRONE' | 'BIRD' | 'UNKNOWN';

export interface Probabilities {
  drone: number;
  bird: number;
  unknown: number;
}

export interface MicroDopplerFeatures {
  spectral_centroid_hz: number;
  spectral_bandwidth_hz: number;
  harmonic_energy_ratio: number;
  modulation_frequency_hz: number;
  peak_doppler_spread_hz: number;
  temporal_variance: number;
}

export interface SpectrogramData {
  time_bins: number[];
  freq_bins: number[];
  matrix: number[][];
  sample_rate_hz: number;
  nfft: number;
  window: string;
}

export interface Detection {
  target_id: string;
  classification: TargetType;
  confidence: number;
  range_m: number;
  velocity_ms: number;
  azimuth_deg?: number;
  signal_strength_db: number;
  timestamp: string;
  mode: string;
  probabilities: Probabilities;
  features?: MicroDopplerFeatures;
  spectrogram?: SpectrogramData;
  model_type?: string;
}

export interface DetectionSummary {
  id: string;
  target_type: string;
  confidence: number;
  range_m: number;
  velocity_ms: number;
  azimuth_deg: number;
  signal_strength_db: number;
  timestamp: string;
  mode: string;
}

export interface PaginatedDetections {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  items: DetectionSummary[];
}

export interface Statistics {
  total_detections: number;
  drones_detected: number;
  birds_detected: number;
  unknown_targets: number;
  average_confidence: number;
  false_alarm_rate_percent: number;
}

export interface SubsystemStatus {
  status: 'ONLINE' | 'OFFLINE' | 'WARNING' | 'STANDBY';
  details: string;
}

export interface SystemStatus {
  radar: SubsystemStatus;
  ai_model: SubsystemStatus;
  backend: SubsystemStatus;
  websocket: SubsystemStatus;
  database: SubsystemStatus;
  simulation: SubsystemStatus;
  mode_banner: string;
  timestamp: string;
}

export interface SimulationStatus {
  is_running: boolean;
  is_paused: boolean;
  speed: 'slow' | 'normal' | 'fast';
  interval_sec: number;
  target_count: number;
  mode: string;
  connected_clients?: number;
}

export interface ModelInfo {
  model_name: string;
  model_type: string;
  status: string;
  input_resolution: string;
  classes: string[];
  pipeline: string[];
  architecture_summary: string;
  is_trained: boolean;
}

export interface ModelMetrics {
  is_experimental: boolean;
  notice: string;
  accuracy: number;
  precision: Record<string, number>;
  recall: Record<string, number>;
  f1_score: Record<string, number>;
  confusion_matrix: Record<string, Record<string, number>>;
}
