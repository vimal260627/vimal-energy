# pyrefly: ignore [missing-import]
from fastapi import APIRouter
# pyrefly: ignore [missing-import]
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.simulation.engine import simulation_engine
from app.simulation.seed_data import generate_seed_data

router = APIRouter(prefix="/simulation", tags=["Simulation Control"])

class ScenarioRequest(BaseModel):
    scenario: str  # "normal", "empty_room", "high_ac_anomaly", "high_monthly", "auto_saving"

@router.get("/status")
def get_simulation_status():
    return {
        "status": "RUNNING" if simulation_engine.is_running else "PAUSED",
        "current_scenario": simulation_engine.current_scenario,
        "speed": simulation_engine.simulation_speed,
        "mode": "SIMULATION_MODE",
        "future_hardware_ready": True,
        "supported_scenarios": [
            {"id": "normal", "name": "1. Normal Operation", "desc": "Virtual home operates within nominal parameters."},
            {"id": "empty_room", "name": "2. Empty Room Wastage", "desc": "Occupancy drops to 0; lights & fan remain ON."},
            {"id": "high_ac_anomaly", "name": "3. High AC Anomaly", "desc": "AC compressor draws 1780W; Isolation Forest flags spike."},
            {"id": "high_monthly", "name": "4. High Monthly Surge", "desc": "Spike causes projected usage to exceed target."},
            {"id": "auto_saving", "name": "5. Auto Smart Saving", "desc": "Smart Virtual Relays auto-shut idle loads with verified savings."}
        ]
    }

@router.post("/scenario")
def trigger_scenario(req: ScenarioRequest):
    return simulation_engine.trigger_scenario(req.scenario)

@router.post("/pause")
def pause_simulation():
    simulation_engine.is_running = False
    return {"status": "PAUSED"}

@router.post("/resume")
def resume_simulation():
    simulation_engine.is_running = True
    return {"status": "RUNNING"}

@router.post("/reset")
def reset_simulation():
    generate_seed_data(force=True)
    return {"status": "RESET", "message": "Database and virtual environment reset to fresh 6-month baseline."}
