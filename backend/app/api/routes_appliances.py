from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.core.database import get_db
from app.core.config import settings
from app.models.schemas import ApplianceSchema, ApplianceToggleRequest, ApplianceModeRequest
from app.simulation.engine import simulation_engine

router = APIRouter(prefix="/appliances", tags=["Appliances"])

@router.get("", response_model=List[ApplianceSchema])
def get_all_appliances():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT a.*, r.name as room_name,
               COALESCE(am.total_energy_kwh, a.baseline_monthly_kwh) as this_month_kwh,
               COALESCE(am.total_cost, a.baseline_monthly_kwh * 7.5) as estimated_monthly_cost
        FROM appliances a
        JOIN rooms r ON a.room_id = r.id
        LEFT JOIN appliance_monthly am ON (a.id = am.appliance_id AND am.year = 2026 AND am.month = 9);
        """)
        rows = cursor.fetchall()
        
        appliances = []
        for r in rows:
            d = dict(r)
            # Estimate today's consumption proportional to monthly
            d["today_kwh"] = round(d["this_month_kwh"] / 19.0 * 1.05, 2)
            appliances.append(ApplianceSchema(**d))
            
        return appliances

@router.get("/{appliance_id}")
def get_appliance_details(appliance_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT a.*, r.name as room_name,
               COALESCE(am.total_energy_kwh, a.baseline_monthly_kwh) as this_month_kwh,
               COALESCE(am.total_cost, a.baseline_monthly_kwh * 7.5) as estimated_monthly_cost
        FROM appliances a
        JOIN rooms r ON a.room_id = r.id
        LEFT JOIN appliance_monthly am ON (a.id = am.appliance_id AND am.year = 2026 AND am.month = 9)
        WHERE a.id = ?;
        """, (appliance_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Appliance not found")

        app_data = dict(row)
        app_data["today_kwh"] = round(app_data["this_month_kwh"] / 19.0 * 1.05, 2)

        # Fetch previous month consumption (August)
        cursor.execute("""
        SELECT total_energy_kwh, total_cost 
        FROM appliance_monthly 
        WHERE appliance_id = ? AND year = 2026 AND month = 8;
        """, (appliance_id,))
        prev_row = cursor.fetchone()
        app_data["prev_month_kwh"] = round(prev_row["total_energy_kwh"], 2) if prev_row else round(app_data["this_month_kwh"] * 0.9, 2)
        app_data["prev_month_cost"] = round(prev_row["total_cost"], 2) if prev_row else round(app_data["prev_month_kwh"] * 7.5, 2)

        # Fetch 24-hour readings for historical graph
        cursor.execute("""
        SELECT timestamp, power_w, energy_kwh, status 
        FROM energy_readings 
        WHERE appliance_id = ? AND timestamp LIKE '2026-09-19%'
        ORDER BY timestamp ASC;
        """, (appliance_id,))
        readings = [dict(r) for r in cursor.fetchall()]

        # Baseline comparison & saving potential
        baseline_w = app_data["baseline_power_w"]
        curr_w = app_data["current_power_w"]
        power_diff_pct = round(((curr_w - baseline_w) / baseline_w) * 100, 1) if baseline_w > 0 else 0.0

        potential_saving_kwh = round(max(0.0, (app_data["this_month_kwh"] - app_data["monthly_budget_kwh"])), 2)
        potential_saving_cost = round(potential_saving_kwh * settings.DEFAULT_TARIFF_PER_KWH, 2)

        return {
            "appliance": app_data,
            "readings_24h": readings,
            "power_diff_pct": power_diff_pct,
            "potential_saving_kwh": potential_saving_kwh,
            "potential_saving_cost": potential_saving_cost
        }

@router.post("/{appliance_id}/toggle")
def toggle_appliance(appliance_id: str, req: ApplianceToggleRequest = None):
    target = req.status if req else None
    try:
        res = simulation_engine.toggle_appliance(appliance_id, target)
        return res
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{appliance_id}/mode")
def set_mode(appliance_id: str, req: ApplianceModeRequest):
    try:
        res = simulation_engine.set_appliance_mode(appliance_id, req.mode)
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
