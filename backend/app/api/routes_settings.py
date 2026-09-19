from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any
from app.core.database import get_db

router = APIRouter(prefix="/settings", tags=["Settings"])

class SettingsUpdate(BaseModel):
    currency: str = "₹"
    tariff_per_kwh: float = 7.50
    fixed_charge: float = 50.0
    use_slab: bool = True
    monthly_target_kwh: float = 260.0
    emission_factor: float = 0.82
    wastage_timeout_mins: int = 15

@router.get("")
def get_settings():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT key, value FROM settings;")
        rows = cursor.fetchall()
        settings_dict = {r["key"]: r["value"] for r in rows}
        
        return {
            "currency": settings_dict.get("currency", "₹"),
            "tariff_per_kwh": float(settings_dict.get("tariff_per_kwh", 7.50)),
            "fixed_charge": float(settings_dict.get("fixed_charge", 50.0)),
            "use_slab": settings_dict.get("use_slab", "true").lower() == "true",
            "monthly_target_kwh": float(settings_dict.get("monthly_target_kwh", 260.0)),
            "emission_factor": float(settings_dict.get("emission_factor", 0.82)),
            "wastage_timeout_mins": int(settings_dict.get("wastage_timeout_mins", 15)),
            "simulation_mode": settings_dict.get("simulation_mode", "ACTIVE")
        }

@router.put("")
def update_settings(payload: SettingsUpdate):
    with get_db() as conn:
        cursor = conn.cursor()
        updates = {
            "currency": payload.currency,
            "tariff_per_kwh": str(payload.tariff_per_kwh),
            "fixed_charge": str(payload.fixed_charge),
            "use_slab": "true" if payload.use_slab else "false",
            "monthly_target_kwh": str(payload.monthly_target_kwh),
            "emission_factor": str(payload.emission_factor),
            "wastage_timeout_mins": str(payload.wastage_timeout_mins)
        }
        for k, v in updates.items():
            cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?);", (k, v))
        conn.commit()

    return {"status": "success", "settings": payload}
