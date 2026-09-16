from typing import List
import os

try:
    from pydantic_settings import BaseSettings
except ImportError:
    try:
        from pydantic import BaseSettings
    except ImportError:
        from pydantic import BaseModel as BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "SkyShield AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    # Radar Signal Processing Defaults
    RADAR_CARRIER_FREQ_GHZ: float = 24.0   # 24 GHz K-band FMCW
    RADAR_SAMPLING_RATE_HZ: int = 2000      # 2 kHz slow-time PRF
    STFT_WINDOW_SIZE: int = 256            # STFT nperseg
    STFT_OVERLAP_SIZE: int = 192           # 75% overlap
    STFT_NFFT: int = 256
    
    # Simulation Timing
    SIMULATION_INTERVAL_SEC: float = 1.5   # Default update cadence
    SIMULATION_MODE_SPEEDS: dict = {
        "slow": 3.0,
        "normal": 1.5,
        "fast": 0.7
    }
    
    # Database
    DATABASE_URL: str = "sqlite:///./skyshield.db"
    
    # Classification Model mode: "prototype" | "cnn"
    MODEL_MODE: str = "prototype"
    MODEL_WEIGHTS_PATH: str = "weights/micro_doppler_cnn.pt"

    class Config:
        case_sensitive = True
        extra = "allow"

settings = Settings()
