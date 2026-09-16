import io
import json
import csv
import numpy as np
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import Optional

from app.db.database import get_db
from app.db.models import Detection
from app.services.detection_service import detection_service
from app.services.radar_simulator import radar_simulator
from app.services.signal_processor import signal_processor
from app.services.spectrogram_service import spectrogram_service
from app.services.classifier import get_classifier
from app.models.schemas import (
    DetectionResponse,
    PaginatedDetections,
    StatisticsResponse,
    AnalyzeRequest
)

router = APIRouter(prefix="", tags=["Detection"])

@router.post("/analyze", response_model=DetectionResponse)
def analyze_radar_frame(request: Optional[AnalyzeRequest] = None, db: Session = Depends(get_db)):
    hint = request.target_type_hint.lower() if request and request.target_type_hint else None
    result = detection_service.process_frame(target_type_hint=hint, db=db)
    return result

@router.post("/analyze/upload", response_model=DetectionResponse)
async def analyze_uploaded_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    filename = file.filename or ""
    content_bytes = await file.read()
    
    if len(content_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(content_bytes) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="File size exceeds maximum allowed limit (10MB).")

    raw_signal = None
    target_type_hint = "unknown"
    range_m = 100.0
    velocity_ms = 10.0
    signal_strength_db = -45.0
    snr_db = 15.0
    azimuth_deg = 45.0

    try:
        if filename.endswith(".csv"):
            text = content_bytes.decode("utf-8-sig")
            reader = csv.reader(io.StringIO(text))
            rows = [row for row in reader if row]
            
            samples = []
            for row in rows:
                # Check for metadata headers
                if len(row) >= 2 and row[0].strip().startswith("#"):
                    tag = row[0].strip().lower()
                    val = row[1].strip()
                    if "type" in tag:
                        target_type_hint = val.lower()
                    elif "range" in tag:
                        range_m = float(val)
                    elif "velocity" in tag:
                        velocity_ms = float(val)
                    elif "snr" in tag:
                        snr_db = float(val)
                    continue
                # Numerical sample column
                for item in row:
                    item_clean = item.strip()
                    if item_clean and not item_clean.startswith("#"):
                        try:
                            samples.append(float(item_clean))
                        except ValueError:
                            pass
            
            if len(samples) >= 128:
                raw_signal = np.array(samples[:1024], dtype=np.float64)
            else:
                # If CSV had just metadata rows, generate signal with hint
                if target_type_hint == "drone":
                    raw_signal = radar_simulator.generate_drone_signal(range_m, velocity_ms, snr_db)
                elif target_type_hint == "bird":
                    raw_signal = radar_simulator.generate_bird_signal(range_m, velocity_ms, snr_db)
                else:
                    raw_signal = radar_simulator.generate_unknown_signal(range_m, velocity_ms, snr_db)

        elif filename.endswith(".json"):
            data = json.loads(content_bytes.decode("utf-8"))
            if isinstance(data, dict):
                target_type_hint = data.get("type", data.get("target_type", "unknown")).lower()
                range_m = float(data.get("range_m", 100.0))
                velocity_ms = float(data.get("velocity_ms", 10.0))
                snr_db = float(data.get("snr_db", 15.0))
                signal_strength_db = float(data.get("signal_strength_db", -45.0))
                
                if "samples" in data and isinstance(data["samples"], list) and len(data["samples"]) >= 128:
                    raw_signal = np.array(data["samples"][:1024], dtype=np.float64)
                else:
                    if target_type_hint == "drone":
                        raw_signal = radar_simulator.generate_drone_signal(range_m, velocity_ms, snr_db)
                    elif target_type_hint == "bird":
                        raw_signal = radar_simulator.generate_bird_signal(range_m, velocity_ms, snr_db)
                    else:
                        raw_signal = radar_simulator.generate_unknown_signal(range_m, velocity_ms, snr_db)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload .csv or .json radar data.")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid radar data format: {str(e)}")

    if raw_signal is None or len(raw_signal) < 64:
        raise HTTPException(status_code=400, detail="Could not extract sufficient radar time-series samples.")

    # Process signal through STFT & Classifier
    f, t, spec_db, spec_norm = signal_processor.compute_stft(raw_signal)
    spec_payload = spectrogram_service.format_for_transmission(f, t, spec_norm)
    features = signal_processor.extract_features(f, t, spec_norm, raw_signal)
    
    import uuid
    metadata = {
        "id": f"UPL-{uuid.uuid4().hex[:6].upper()}",
        "simulated_type": target_type_hint,
        "range_m": range_m,
        "velocity_ms": velocity_ms,
        "azimuth_deg": azimuth_deg,
        "signal_strength_db": signal_strength_db,
        "snr_db": snr_db,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "mode": "simulation"
    }
    radar_simulator.target_counter += 1

    classifier = get_classifier()
    classification_result = classifier.classify(spec_norm, features, metadata)

    new_detection = Detection(
        id=metadata["id"],
        target_type=classification_result["prediction"].lower(),
        confidence=classification_result["confidence"],
        range_m=range_m,
        velocity_ms=velocity_ms,
        azimuth_deg=azimuth_deg,
        signal_strength_db=signal_strength_db,
        timestamp=datetime.now(timezone.utc),
        mode="simulation",
        probabilities_json=json.dumps(classification_result["probabilities"]),
        features_json=json.dumps(features)
    )
    db.add(new_detection)
    db.commit()

    return {
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
        "spectrogram": spec_payload
    }

@router.get("/detections", response_model=PaginatedDetections)
def get_detections(
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    target_type: Optional[str] = Query(None),
    min_confidence: Optional[float] = Query(None, ge=0.0, le=1.0),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return detection_service.get_paginated_detections(
        db=db,
        page=page,
        page_size=page_size,
        target_type=target_type,
        min_confidence=min_confidence,
        search=search
    )

@router.get("/detections/{id}")
def get_detection_by_id(id: str, db: Session = Depends(get_db)):
    det = db.query(Detection).filter(Detection.id == id).first()
    if not det:
        raise HTTPException(status_code=404, detail=f"Detection with ID '{id}' not found.")
    return det.to_dict()

@router.get("/statistics", response_model=StatisticsResponse)
def get_detection_statistics(db: Session = Depends(get_db)):
    return detection_service.get_statistics(db=db)
