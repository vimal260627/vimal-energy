export interface Room {
  id: string;
  name: string;
  floor: string;
  icon: string;
  target_temperature: number;
  current_temperature: number;
  occupancy: number;
  light_lux: number;
}

export interface Appliance {
  id: string;
  name: string;
  room_id: string;
  room_name?: string;
  category: string;
  rated_power_w: number;
  current_power_w: number;
  status: 'ON' | 'OFF';
  control_mode: 'MANUAL' | 'SMART' | 'RECOMMENDATION';
  operating_hours_today: number;
  baseline_power_w: number;
  baseline_monthly_kwh: number;
  monthly_budget_kwh: number;
  efficiency_status: 'EFFICIENT' | 'NORMAL' | 'NEEDS_ATTENTION';
  virtual_relay_state: number;
  last_active_time?: string;
  today_kwh?: number;
  this_month_kwh?: number;
  estimated_monthly_cost?: number;
}

export interface KPICards {
  today_energy_kwh: number;
  this_month_energy_kwh: number;
  estimated_cost: number;
  energy_saved_kwh: number;
  peak_power_kw: number;
  active_appliances: number;
  monthly_target_kwh: number;
  target_percentage_used: number;
  projected_month_end_kwh: number;
  energy_score: 'Efficient' | 'Normal' | 'Needs Attention';
  simulation_mode: string;
}

export interface ChartDataPoint {
  time: string;
  energy_kwh: number;
  power_w?: number;
  cost?: number;
}

export interface ApplianceBreakdownItem {
  id: string;
  name: string;
  room: string;
  energy_kwh: number;
  percentage: number;
  cost: number;
  category: string;
}

export interface DashboardData {
  kpis: KPICards;
  recent_trend: ChartDataPoint[];
  appliance_breakdown: ApplianceBreakdownItem[];
  active_appliances_list: Appliance[];
  rooms: Room[];
  quick_recommendation?: string;
  active_anomalies_count: number;
  active_wastage_count: number;
}

export interface MonthlyComparisonItem {
  appliance_id: string;
  appliance_name: string;
  room_name: string;
  category: string;
  month1_kwh: number;
  month2_kwh: number;
  diff_kwh: number;
  percentage_change: number;
}

export interface MonthlyComparisonData {
  month1: {
    year: number;
    month: number;
    month_name: string;
    total_energy_kwh: number;
    total_cost: number;
    peak_power_w: number;
    avg_daily_kwh: number;
    energy_saved_kwh: number;
    co2_emissions_kg: number;
  };
  month2: {
    year: number;
    month: number;
    month_name: string;
    total_energy_kwh: number;
    total_cost: number;
    peak_power_w: number;
    avg_daily_kwh: number;
    energy_saved_kwh: number;
    co2_emissions_kg: number;
  };
  appliance_comparison: MonthlyComparisonItem[];
  ai_explanation: string;
  highest_increase_appliance?: string;
  highest_saving_appliance?: string;
}

export interface Anomaly {
  id: number;
  timestamp: string;
  appliance_id: string;
  room_name: string;
  appliance_name: string;
  detected_power_w: number;
  baseline_power_w: number;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  status: 'ACTIVE' | 'RESOLVED' | 'DISMISSED';
}

export interface WastageEvent {
  id: number;
  timestamp: string;
  room_id: string;
  room_name: string;
  appliance_id: string;
  appliance_name: string;
  duration_minutes: number;
  wasted_kwh: number;
  estimated_cost: number;
  action_taken: string;
  status: 'DETECTED' | 'RESOLVED';
}

export interface SavingEvent {
  id: number;
  timestamp: string;
  appliance_id: string;
  appliance_name: string;
  action_type: string;
  power_before_w: number;
  power_after_w: number;
  power_diff_w: number;
  energy_saved_kwh: number;
  cost_saved: number;
  verified: number;
}

export interface ForecastPoint {
  label: string;
  predicted_kwh: number;
  lower_bound_kwh: number;
  upper_bound_kwh: number;
}

export interface ForecastData {
  next_24h: ForecastPoint[];
  next_7d: ForecastPoint[];
  end_of_month_projected_kwh: number;
  target_kwh: number;
  projected_exceedance_kwh: number;
  confidence_score: number;
  insights: string[];
}

export interface Recommendation {
  id: number;
  timestamp: string;
  category: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH';
  title: string;
  description: string;
  potential_saving_kwh: number;
  potential_saving_cost: number;
  status: string;
}

export interface WhatIfResponse {
  baseline_monthly_kwh: number;
  projected_monthly_kwh: number;
  monthly_saved_kwh: number;
  monthly_cost_saved: number;
  annual_cost_saved: number;
  annual_co2_avoided_kg: number;
  breakdown_by_action: Record<string, number>;
}
