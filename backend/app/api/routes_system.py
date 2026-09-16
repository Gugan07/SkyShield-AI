from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timezone

from app.db.database import get_db
from app.websocket.live_stream import live_stream_manager
from app.services.classifier import get_classifier
from app.models.schemas import SystemStatus, SubsystemStatus

router = APIRouter(prefix="", tags=["System"])

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SkyShield AI Backend",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.get("/system/status", response_model=SystemStatus)
def get_system_status(db: Session = Depends(get_db)):
    classifier = get_classifier()
    
    # Check DB status
    try:
        db.execute(text("SELECT 1"))
        db_status = "ONLINE"
        db_msg = "SQLite operational (SQLAlchemy connected)"
    except Exception as e:
        db_status = "WARNING"
        db_msg = f"Database connectivity issue: {str(e)}"

    sim_status = live_stream_manager.get_simulation_status()

    return SystemStatus(
        radar=SubsystemStatus(
            status="ONLINE",
            details="FMCW Radar Simulator Active (24 GHz K-Band, 2 kHz PRF)"
        ),
        ai_model=SubsystemStatus(
            status="ONLINE",
            details=f"{classifier.get_model_type()} Ready"
        ),
        backend=SubsystemStatus(
            status="ONLINE",
            details="FastAPI Uvicorn Asynchronous Service Operational"
        ),
        websocket=SubsystemStatus(
            status="ONLINE",
            details=f"Live stream active with {sim_status['connected_clients']} subscriber(s)"
        ),
        database=SubsystemStatus(
            status=db_status,
            details=db_msg
        ),
        simulation=SubsystemStatus(
            status="ONLINE" if sim_status["is_running"] else "STANDBY",
            details=f"State: {'RUNNING' if sim_status['is_running'] else 'STOPPED'} | Speed: {sim_status['speed'].upper()}"
        ),
        mode_banner="SIMULATION MODE – DATA IS SYNTHETIC",
        timestamp=datetime.now(timezone.utc).isoformat()
    )
