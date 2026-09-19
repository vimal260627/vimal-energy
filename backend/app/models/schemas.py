from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class RoomSchema(BaseModel):
    id: str
    name: str
    floor: str
    icon: str
    target_temperature: float
    current_temperature: float
    occupancy: int
    light_lux: float

class ApplianceSchema(BaseModel):
    id: str
    name: str
    room_id: str
    room_name: Optional[str] = None
    category: str
    rated_power_w: float
    current_power_w: float
    status: str
    control_mode: str
    operating_hours_today: float
    baseline_power_w: float
    baseline_monthly_kwh: float
    monthly_budget_kwh: float
    efficiency_status: str
    virtual_relay_state: int
    last_active_time: Optional[str] = None
    today_kwh: Optional[float] = 0.0
    this_month_kwh: Optional[float] = 0.0
    estimated_monthly_cost: Optional[float] = 0.0

class ApplianceToggleRequest(BaseModel):
    status: Optional[str] = None  # "ON" or "OFF", or toggle if None

class ApplianceModeRequest(BaseModel):
    mode: str  # "MANUAL", "SMART", "RECOMMENDATION"

class KPICards(BaseModel):
    today_energy_kwh: float
    this_month_energy_kwh: float
    estimated_cost: float
    energy_saved_kwh: float
    peak_power_kw: float
    active_appliances: int
    monthly_target_kwh: float
    target_percentage_used: float
    projected_month_end_kwh: float
    energy_score: str  # "Efficient", "Normal", "Needs Attention"
    simulation_mode: str = "ACTIVE"

class ChartDataPoint(BaseModel):
    time: str
    energy_kwh: float
    power_w: Optional[float] = 0.0
    cost: Optional[float] = 0.0

class ApplianceBreakdownItem(BaseModel):
    id: str
    name: str
    room: str
    energy_kwh: float
    percentage: float
    cost: float
    category: str

class DashboardResponse(BaseModel):
    kpis: KPICards
    recent_trend: List[ChartDataPoint]
    appliance_breakdown: List[ApplianceBreakdownItem]
    active_appliances_list: List[ApplianceSchema]
    rooms: List[RoomSchema]
    quick_recommendation: Optional[str] = None
    active_anomalies_count: int = 0
    active_wastage_count: int = 0

class MonthlyComparisonItem(BaseModel):
    appliance_id: str
    appliance_name: str
    room_name: str
    month1_kwh: float
    month2_kwh: float
    diff_kwh: float
    percentage_change: float

class MonthlyComparisonResponse(BaseModel):
    month1: Dict[str, Any]
    month2: Dict[str, Any]
    appliance_comparison: List[MonthlyComparisonItem]
    ai_explanation: str
    highest_increase_appliance: Optional[str] = None
    highest_saving_appliance: Optional[str] = None

class AnomalySchema(BaseModel):
    id: int
    timestamp: str
    appliance_id: str
    room_name: str
    appliance_name: str
    detected_power_w: float
    baseline_power_w: float
    severity: str
    description: str
    status: str

class WastageEventSchema(BaseModel):
    id: int
    timestamp: str
    room_id: str
    room_name: str
    appliance_id: str
    appliance_name: str
    duration_minutes: int
    wasted_kwh: float
    estimated_cost: float
    action_taken: str
    status: str

class SavingEventSchema(BaseModel):
    id: int
    timestamp: str
    appliance_id: str
    appliance_name: str
    action_type: str
    power_before_w: float
    power_after_w: float
    power_diff_w: float
    energy_saved_kwh: float
    cost_saved: float
    verified: int

class RecommendationSchema(BaseModel):
    id: int
    timestamp: str
    category: str
    severity: str
    title: str
    description: str
    potential_saving_kwh: float
    potential_saving_cost: float
    status: str

class ForecastPoint(BaseModel):
    label: str
    predicted_kwh: float
    lower_bound_kwh: float
    upper_bound_kwh: float

class ForecastResponse(BaseModel):
    next_24h: List[ForecastPoint]
    next_7d: List[ForecastPoint]
    end_of_month_projected_kwh: float
    target_kwh: float
    projected_exceedance_kwh: float
    confidence_score: float
    insights: List[str]

class WhatIfRequest(BaseModel):
    ac_reduction_hours: float = 1.0
    auto_off_empty_rooms: bool = True
    replace_fan_bldc: bool = False
    replace_old_pump: bool = False
    temp_setpoint_adjustment: float = 1.0  # +1 degree C saves ~6% AC

class WhatIfResponse(BaseModel):
    baseline_monthly_kwh: float
    projected_monthly_kwh: float
    monthly_saved_kwh: float
    monthly_cost_saved: float
    annual_cost_saved: float
    annual_co2_avoided_kg: float
    breakdown_by_action: Dict[str, float]

class SettingsSchema(BaseModel):
    currency: str
    tariff_per_kwh: float
    fixed_charge: float
    use_slab: bool
    monthly_target_kwh: float
    emission_factor: float
    wastage_timeout_mins: int
    simulation_mode: str
    simulation_speed: float

class NotificationSchema(BaseModel):
    id: int
    timestamp: str
    title: str
    message: str
    severity: str
    is_read: int
    category: str
