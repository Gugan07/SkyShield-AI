from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime

class Probabilities(BaseModel):
    drone: float = Field(..., ge=0.0, le=1.0)
    bird: float = Field(..., ge=0.0, le=1.0)
    unknown: float = Field(..., ge=0.0, le=1.0)

class MicroDopplerFeatures(BaseModel):
    spectral_centroid_hz: float = 0.0
    spectral_bandwidth_hz: float = 0.0
    harmonic_energy_ratio: float = 0.0
    modulation_frequency_hz: float = 0.0
    peak_doppler_spread_hz: float = 0.0
    temporal_variance: float = 0.0

class SpectrogramPayload(BaseModel):
    time_bins: List[float]
    freq_bins: List[float]
    matrix: List[List[float]]  # normalized 0.0 - 1.0 or dB scale
    sample_rate_hz: int = 2000
    nfft: int = 256
    window: str = "hann"

class TargetObservation(BaseModel):
    id: str
    type: str  # "drone", "bird", "unknown"
    range_m: float
    velocity_ms: float
    azimuth_deg: float = 0.0
    signal_strength_db: float
    timestamp: str
    confidence: float
    mode: str = "simulation"

class DetectionResponse(BaseModel):
    target_id: str
    classification: str  # "DRONE", "BIRD", "UNKNOWN"
    confidence: float
    range_m: float
    velocity_ms: float
    azimuth_deg: float = 0.0
    signal_strength_db: float
    timestamp: str
    mode: str = "simulation"
    probabilities: Probabilities
    features: Optional[MicroDopplerFeatures] = None
    spectrogram: Optional[SpectrogramPayload] = None

class DetectionSummary(BaseModel):
    id: str
    target_type: str
    confidence: float
    range_m: float
    velocity_ms: float
    azimuth_deg: float = 0.0
    signal_strength_db: float
    timestamp: str
    mode: str = "simulation"

class PaginatedDetections(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    items: List[DetectionSummary]

class SimulationConfig(BaseModel):
    speed: str = "normal"  # "slow", "normal", "fast"
    drone_ratio: float = 0.45
    bird_ratio: float = 0.45
    unknown_ratio: float = 0.10

class SimulationStatus(BaseModel):
    is_running: bool
    is_paused: bool
    speed: str
    target_count: int
    interval_sec: float
    mode: str = "simulation"

class SubsystemStatus(BaseModel):
    status: str  # "ONLINE", "OFFLINE", "WARNING"
    details: str

class SystemStatus(BaseModel):
    radar: SubsystemStatus
    ai_model: SubsystemStatus
    backend: SubsystemStatus
    websocket: SubsystemStatus
    database: SubsystemStatus
    simulation: SubsystemStatus
    mode_banner: str = "SIMULATION MODE – DATA IS SYNTHETIC"
    timestamp: str

class StatisticsResponse(BaseModel):
    total_detections: int
    drones_detected: int
    birds_detected: int
    unknown_targets: int
    average_confidence: float
    false_alarm_rate_percent: float

class ModelInfoResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    model_name: str
    model_type: str  # "Prototype / Simulation Model" or "Trained CNN Classifier"
    status: str
    input_resolution: str
    classes: List[str]
    pipeline: List[str]
    architecture_summary: str
    is_trained: bool

class ModelMetricsResponse(BaseModel):
    is_experimental: bool = True
    notice: str = "Demo / Experimental Metrics - Not validated on physical radar sensors"
    accuracy: float
    precision: Dict[str, float]
    recall: Dict[str, float]
    f1_score: Dict[str, float]
    confusion_matrix: Dict[str, Dict[str, int]]

class AnalyzeRequest(BaseModel):
    target_type_hint: Optional[str] = None
    range_m: Optional[float] = None
    velocity_ms: Optional[float] = None
    snr_db: Optional[float] = None
