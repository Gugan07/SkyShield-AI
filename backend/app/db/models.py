from sqlalchemy import Column, String, Float, DateTime, Text, Integer
from datetime import datetime, timezone
import json
from app.db.database import Base

class Detection(Base):
    __tablename__ = "detections"

    id = Column(String(50), primary_key=True, index=True)
    target_type = Column(String(20), nullable=False, index=True)  # drone, bird, unknown
    confidence = Column(Float, nullable=False)
    range_m = Column(Float, nullable=False)
    velocity_ms = Column(Float, nullable=False)
    azimuth_deg = Column(Float, default=0.0)
    signal_strength_db = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    mode = Column(String(20), default="simulation")  # simulation, real
    
    # Store probability distribution and micro-Doppler features as JSON strings
    probabilities_json = Column(Text, nullable=True)
    features_json = Column(Text, nullable=True)

    def to_dict(self):
        probs = {}
        if self.probabilities_json:
            try:
                probs = json.loads(self.probabilities_json)
            except Exception:
                pass
        
        feats = {}
        if self.features_json:
            try:
                feats = json.loads(self.features_json)
            except Exception:
                pass

        return {
            "id": self.id,
            "target_type": self.target_type,
            "confidence": self.confidence,
            "range_m": round(self.range_m, 2),
            "velocity_ms": round(self.velocity_ms, 2),
            "azimuth_deg": round(self.azimuth_deg, 1) if self.azimuth_deg is not None else 0.0,
            "signal_strength_db": round(self.signal_strength_db, 2),
            "timestamp": self.timestamp.isoformat() if self.timestamp else datetime.now(timezone.utc).isoformat(),
            "mode": self.mode,
            "probabilities": probs,
            "features": feats
        }
