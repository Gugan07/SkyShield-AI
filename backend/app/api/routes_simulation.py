from fastapi import APIRouter, Body
from app.websocket.live_stream import live_stream_manager
from app.models.schemas import SimulationStatus

router = APIRouter(prefix="/simulation", tags=["Simulation"])

@router.post("/start", response_model=SimulationStatus)
async def start_simulation():
    await live_stream_manager.start_simulation()
    return live_stream_manager.get_simulation_status()

@router.post("/pause", response_model=SimulationStatus)
async def pause_simulation():
    await live_stream_manager.pause_simulation()
    return live_stream_manager.get_simulation_status()

@router.post("/stop", response_model=SimulationStatus)
async def stop_simulation():
    await live_stream_manager.stop_simulation()
    return live_stream_manager.get_simulation_status()

@router.post("/reset", response_model=SimulationStatus)
async def reset_simulation():
    await live_stream_manager.reset_simulation()
    return live_stream_manager.get_simulation_status()

@router.post("/speed", response_model=SimulationStatus)
async def change_speed(speed: str = Body(..., embed=True)):
    live_stream_manager.set_speed(speed)
    return live_stream_manager.get_simulation_status()

@router.get("/status", response_model=SimulationStatus)
def get_simulation_status():
    return live_stream_manager.get_simulation_status()
