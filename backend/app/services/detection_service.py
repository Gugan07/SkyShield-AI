"""
Detection Orchestration and Persistence Service
Coordinates signal processing, classification, database storage, and statistics aggregation.
"""
import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.db.models import Detection
from app.db.database import SessionLocal
from app.services.radar_simulator import radar_simulator
from app.services.signal_processor import signal_processor
from app.services.spectrogram_service import spectrogram_service
from app.services.classifier import get_classifier
from app.models.schemas import DetectionResponse, PaginatedDetections, DetectionSummary, StatisticsResponse
from app.utils.logger import logger

class DetectionService:
    def process_frame(
        self,
        target_type_hint: Optional[str] = None,
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        """
        Executes the complete detection & classification pipeline:
        1. Acquire radar frame
        2. Signal Preprocessing & STFT
        3. Spectrogram generation
        4. Feature extraction
        5. Classification
        6. Database storage
        7. Format payload for WebSocket & REST
        """
        should_close_db = False
        if db is None:
            db = SessionLocal()
            should_close_db = True

        try:
            # 1. Acquire radar frame
            raw_signal, metadata = radar_simulator.acquire_frame(target_type_hint=target_type_hint)
            
            # 2. STFT Processing
            f, t, spec_db, spec_norm = signal_processor.compute_stft(raw_signal)
            
            # 3. Spectrogram serialization
            spec_payload = spectrogram_service.format_for_transmission(f, t, spec_norm)
            
            # 4. Feature Extraction
            features = signal_processor.extract_features(f, t, spec_norm, raw_signal)
            
            # 5. AI Classification
            classifier = get_classifier()
            classification_result = classifier.classify(spec_norm, features, metadata)
            
            # 6. Database persistence
            new_detection = Detection(
                id=metadata["id"],
                target_type=classification_result["prediction"].lower(),
                confidence=classification_result["confidence"],
                range_m=metadata["range_m"],
                velocity_ms=metadata["velocity_ms"],
                azimuth_deg=metadata["azimuth_deg"],
                signal_strength_db=metadata["signal_strength_db"],
                timestamp=datetime.now(timezone.utc),
                mode=metadata["mode"],
                probabilities_json=json.dumps(classification_result["probabilities"]),
                features_json=json.dumps(features)
            )
            db.add(new_detection)
            db.commit()
            db.refresh(new_detection)

            # 7. Construct response payload
            payload = {
                "target_id": new_detection.id,
                "classification": new_detection.target_type.upper(),
                "confidence": new_detection.confidence,
                "range_m": new_detection.range_m,
                "velocity_ms": new_detection.velocity_ms,
                "azimuth_deg": new_detection.azimuth_deg,
                "signal_strength_db": new_detection.signal_strength_db,
                "timestamp": new_detection.timestamp.isoformat(),
                "mode": new_detection.mode,
                "probabilities": classification_result["probabilities"],
                "features": features,
                "spectrogram": spec_payload,
                "model_type": classification_result["model_type"]
            }
            return payload
        finally:
            if should_close_db:
                db.close()

    def get_paginated_detections(
        self,
        db: Session,
        page: int = 1,
        page_size: int = 15,
        target_type: Optional[str] = None,
        min_confidence: Optional[float] = None,
        search: Optional[str] = None
    ) -> PaginatedDetections:
        query = db.query(Detection)

        if target_type and target_type.lower() != "all":
            query = query.filter(Detection.target_type == target_type.lower())
            
        if min_confidence is not None:
            query = query.filter(Detection.confidence >= min_confidence)
            
        if search:
            query = query.filter(Detection.id.ilike(f"%{search}%"))

        total = query.count()
        total_pages = max(1, (total + page_size - 1) // page_size)
        offset = (page - 1) * page_size

        items = query.order_by(desc(Detection.timestamp)).offset(offset).limit(page_size).all()

        summaries = [
            DetectionSummary(
                id=item.id,
                target_type=item.target_type.upper(),
                confidence=round(item.confidence, 4),
                range_m=round(item.range_m, 1),
                velocity_ms=round(item.velocity_ms, 1),
                azimuth_deg=round(item.azimuth_deg, 1) if item.azimuth_deg is not None else 0.0,
                signal_strength_db=round(item.signal_strength_db, 1),
                timestamp=item.timestamp.isoformat() if item.timestamp else datetime.now(timezone.utc).isoformat(),
                mode=item.mode
            )
            for item in items
        ]

        return PaginatedDetections(
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            items=summaries
        )

    def get_statistics(self, db: Session) -> StatisticsResponse:
        total = db.query(func.count(Detection.id)).scalar() or 0
        drones = db.query(func.count(Detection.id)).filter(Detection.target_type == "drone").scalar() or 0
        birds = db.query(func.count(Detection.id)).filter(Detection.target_type == "bird").scalar() or 0
        unknowns = db.query(func.count(Detection.id)).filter(Detection.target_type == "unknown").scalar() or 0
        
        avg_conf = db.query(func.avg(Detection.confidence)).scalar() or 0.0
        
        # False alarm indicator: percentage of unknown / low-confidence detections or clutter
        false_alarm_rate = (unknowns / total * 100.0) if total > 0 else 0.0

        return StatisticsResponse(
            total_detections=total,
            drones_detected=drones,
            birds_detected=birds,
            unknown_targets=unknowns,
            average_confidence=round(float(avg_conf), 4),
            false_alarm_rate_percent=round(float(false_alarm_rate), 2)
        )

detection_service = DetectionService()
