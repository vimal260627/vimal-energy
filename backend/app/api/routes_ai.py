# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from app.models.schemas import ForecastResponse, WhatIfRequest, WhatIfResponse, AnomalySchema, WastageEventSchema, RecommendationSchema
from app.ai.forecaster import forecaster
from app.ai.anomaly_detector import anomaly_detector
from app.ai.wastage_engine import wastage_engine
from app.ai.recommendation_engine import recommendation_engine
from app.core.config import settings
from app.core.database import get_db

router = APIRouter(prefix="/ai", tags=["AI & Machine Learning"])

@router.get("/forecast", response_model=ForecastResponse)
def get_energy_forecast():
    """ML-based consumption forecasting: 24h diurnal load, 7-day projection, month-end vs target."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM settings WHERE key = 'monthly_target_kwh';")
        r = cursor.fetchone()
        target = float(r["value"]) if r else settings.DEFAULT_MONTHLY_TARGET_KWH

    res = forecaster.predict(target_kwh=target)
    return res

@router.get("/anomalies", response_model=List[AnomalySchema])
def get_anomalies():
    """Unsupervised Isolation Forest anomaly detection events."""
    return anomaly_detector.get_all_anomalies()

@router.get("/wastage", response_model=List[WastageEventSchema])
def get_wastage_events():
    """Wastage events detected when occupancy is zero while appliances remain running."""
    return wastage_engine.get_all_wastage_events()

@router.post("/wastage/{event_id}/resolve")
def resolve_wastage(event_id: int):
    """Executes 'Apply Smart Saving': turns virtual appliance OFF and verifies saved power."""
    try:
        return wastage_engine.resolve_wastage(event_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/recommendations")
def get_recommendations():
    """Contextual, prioritized recommendations derived from live and historical telemetry."""
    return recommendation_engine.generate_recommendations()

@router.post("/what-if", response_model=WhatIfResponse)
def calculate_what_if_savings(req: WhatIfRequest):
    """
    Simulates What-If energy scenarios with interactive adjustments:
    - AC hours reduction
    - Auto-off in empty rooms
    - BLDC fan upgrade
    - 5-Star pump upgrade
    - Thermostat setpoint increase (+1°C)
    """
    baseline_monthly = 267.0  # Normalized baseline for current month
    actions_breakdown = {}
    total_saved_kwh = 0.0

    # 1. AC reduction: AC rated ~1200W avg, reducing X hours/day over 30 days
    if req.ac_reduction_hours > 0:
        ac_saved = round(req.ac_reduction_hours * 1.05 * 30.0, 1)  # ~1.05 kWh per hour
        actions_breakdown["Reduce AC Runtime"] = ac_saved
        total_saved_kwh += ac_saved

    # 2. Auto-off in empty rooms
    if req.auto_off_empty_rooms:
        auto_off_saved = 14.5  # Typical monthly lighting + fan empty room leakage
        actions_breakdown["Auto-Off Empty Rooms"] = auto_off_saved
        total_saved_kwh += auto_off_saved

    # 3. BLDC Fan upgrade (75W -> 28W saves 47W over 10h/day * 30 days = 14.1 kWh)
    if req.replace_fan_bldc:
        fan_saved = 14.1
        actions_breakdown["BLDC Energy-Efficient Fan"] = fan_saved
        total_saved_kwh += fan_saved

    # 4. Old Pump upgrade (750W -> 500W saves 250W for 1.5h/day * 30 days = 11.25 kWh)
    if req.replace_old_pump:
        pump_saved = 11.3
        actions_breakdown["5-Star Efficient Water Pump"] = pump_saved
        total_saved_kwh += pump_saved

    # 5. Setpoint adjustment: Each +1°C yields ~6% savings on AC load (~5.4 kWh)
    if req.temp_setpoint_adjustment > 0:
        setpoint_saved = round(req.temp_setpoint_adjustment * 5.4, 1)
        actions_breakdown[f"AC Thermostat (+{req.temp_setpoint_adjustment}°C)"] = setpoint_saved
        total_saved_kwh += setpoint_saved

    total_saved_kwh = round(min(baseline_monthly * 0.70, total_saved_kwh), 1)
    projected_monthly = round(baseline_monthly - total_saved_kwh, 1)
    
    tariff = settings.DEFAULT_TARIFF_PER_KWH
    monthly_cost_saved = round(total_saved_kwh * tariff, 2)
    annual_cost_saved = round(monthly_cost_saved * 12.0, 2)
    annual_co2 = round((total_saved_kwh * 12.0) * settings.GRID_EMISSION_FACTOR_KG_PER_KWH, 1)

    return WhatIfResponse(
        baseline_monthly_kwh=baseline_monthly,
        projected_monthly_kwh=projected_monthly,
        monthly_saved_kwh=total_saved_kwh,
        monthly_cost_saved=monthly_cost_saved,
        annual_cost_saved=annual_cost_saved,
        annual_co2_avoided_kg=annual_co2,
        breakdown_by_action=actions_breakdown
    )
