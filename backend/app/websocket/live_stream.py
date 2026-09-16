"""
WebSocket Live Streaming Manager for SkyShield AI
Broadcasts real-time radar detections and spectrogram updates to connected frontend clients.
"""
import asyncio
import json
from typing import Set, Dict, Any, Optional
from fastapi import WebSocket, WebSocketDisconnect

from app.services.detection_service import detection_service
from app.core.config import settings
from app.utils.logger import logger

class LiveStreamManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.is_running: bool = False
        self.is_paused: bool = False
        self.speed: str = "normal"  # slow, normal, fast
        self.interval_sec: float = settings.SIMULATION_INTERVAL_SEC
        self.target_count: int = 0
        self._task: Optional[asyncio.Task] = None

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")
        
        # Send initial state
        await self.send_personal_message(
            {
                "type": "connection_established",
                "status": self.get_simulation_status(),
                "message": "Connected to SkyShield AI Live Stream"
            },
            websocket
        )

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket client disconnected. Remaining clients: {len(self.active_connections)}")

    async def send_personal_message(self, message: Dict[str, Any], websocket: WebSocket):
        try:
            await websocket.send_json(message)
        except Exception:
            self.disconnect(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        if not self.active_connections:
            return
            
        disconnected = set()
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.warning(f"Error broadcasting to client: {e}")
                disconnected.add(connection)
                
        for dead_conn in disconnected:
            self.disconnect(dead_conn)

    def get_simulation_status(self) -> Dict[str, Any]:
        return {
            "is_running": self.is_running,
            "is_paused": self.is_paused,
            "speed": self.speed,
            "interval_sec": self.interval_sec,
            "target_count": self.target_count,
            "mode": "simulation",
            "connected_clients": len(self.active_connections)
        }

    def set_speed(self, speed: str):
        if speed in settings.SIMULATION_MODE_SPEEDS:
            self.speed = speed
            self.interval_sec = settings.SIMULATION_MODE_SPEEDS[speed]
            logger.info(f"Simulation speed set to '{speed}' ({self.interval_sec}s)")

    async def start_simulation(self):
        if self.is_running and not self.is_paused:
            return
            
        self.is_running = True
        self.is_paused = False
        logger.info("Radar simulation started.")
        
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(self._simulation_loop())
            
        await self.broadcast({
            "type": "simulation_status",
            "data": self.get_simulation_status()
        })

    async def pause_simulation(self):
        if not self.is_running:
            return
        self.is_paused = not self.is_paused
        logger.info(f"Simulation paused state: {self.is_paused}")
        await self.broadcast({
            "type": "simulation_status",
            "data": self.get_simulation_status()
        })

    async def stop_simulation(self):
        self.is_running = False
        self.is_paused = False
        if self._task and not self._task.done():
            self._task.cancel()
        logger.info("Radar simulation stopped.")
        await self.broadcast({
            "type": "simulation_status",
            "data": self.get_simulation_status()
        })

    async def reset_simulation(self):
        await self.stop_simulation()
        self.target_count = 0
        from app.services.radar_simulator import radar_simulator
        radar_simulator.target_counter = 1
        logger.info("Simulation counter reset.")
        await self.broadcast({
            "type": "simulation_status",
            "data": self.get_simulation_status()
        })

    async def _simulation_loop(self):
        try:
            while self.is_running:
                if not self.is_paused:
                    # Run CPU-bound signal processing in executor to avoid blocking event loop
                    loop = asyncio.get_running_loop()
                    detection_data = await loop.run_in_executor(
                        None,
                        detection_service.process_frame
                    )
                    
                    self.target_count += 1
                    
                    # Broadcast detection packet to all connected clients
                    await self.broadcast({
                        "type": "detection",
                        "data": detection_data
                    })
                
                # Sleep for configured interval
                await asyncio.sleep(self.interval_sec)
        except asyncio.CancelledError:
            logger.info("Simulation loop cancelled.")
        except Exception as e:
            logger.error(f"Unexpected error in simulation loop: {e}", exc_info=True)
            self.is_running = False

live_stream_manager = LiveStreamManager()
