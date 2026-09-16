"""
SkyShield AI - Intelligent Micro-Doppler Based Drone and Bird Classification System
Main FastAPI Application Entry Point
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import time

from app.core.config import settings
from app.db.database import init_db, SessionLocal
from app.db.models import Detection
from app.api.routes_system import router as system_router
from app.api.routes_simulation import router as simulation_router
from app.api.routes_detection import router as detection_router
from app.api.routes_model import router as model_router
from app.websocket.live_stream import live_stream_manager
from app.services.detection_service import detection_service
from app.utils.logger import logger

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables
    logger.info("Initializing SkyShield AI SQLite Database...")
    init_db()
    
    # Pre-seed initial historical samples if database is empty so analytics and history look great on launch
    db = SessionLocal()
    try:
        count = db.query(Detection).count()
        if count == 0:
            logger.info("Database is empty. Pre-seeding initial baseline detections...")
            for _ in range(12):
                detection_service.process_frame(db=db)
            logger.info("Baseline detections seeded successfully.")
    except Exception as e:
        logger.warning(f"Could not pre-seed detections: {e}")
    finally:
        db.close()

    logger.info("SkyShield AI Backend initialized and ready.")
    yield
    # Shutdown
    logger.info("Shutting down SkyShield AI Backend...")
    await live_stream_manager.stop_simulation()

app = FastAPI(
    title="SkyShield AI – Micro-Doppler Classification Engine",
    description="FMCW Radar + STFT Signal Processing + Micro-Doppler Spectrogram AI Classification",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global safe error handling (Section 23: Never show raw stack traces to user)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred while processing the radar signal.",
            "path": request.url.path
        }
    )

# Register REST API Routers
app.include_router(system_router, prefix=settings.API_V1_STR)
app.include_router(simulation_router, prefix=settings.API_V1_STR)
app.include_router(detection_router, prefix=settings.API_V1_STR)
app.include_router(model_router, prefix=settings.API_V1_STR)

# WebSocket Endpoint
@app.websocket("/ws/live")
async def websocket_live_endpoint(websocket: WebSocket):
    await live_stream_manager.connect(websocket)
    try:
        while True:
            # Keep receiving incoming client control commands or heartbeats
            data = await websocket.receive_text()
            try:
                msg = websocket.json() if hasattr(websocket, 'json') else None
            except Exception:
                pass
    except WebSocketDisconnect:
        live_stream_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket client communication error: {e}")
        live_stream_manager.disconnect(websocket)

if __name__ == "__main__":
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
