import type {
  DashboardData,
  Appliance,
  MonthlyComparisonData,
  Anomaly,
  WastageEvent,
  SavingEvent,
  ForecastData,
  Recommendation,
  WhatIfResponse,
  ChartDataPoint
} from '../types';

const API_BASE = 'https://vimal-energy.onrender.com/api';

export const api = {
  // Dashboard
  getDashboard: async (): Promise<DashboardData> => {
    const res = await fetch(`${API_BASE}/dashboard`);
    if (!res.ok) throw new Error('Failed to fetch dashboard data');
    return res.json();
  },

  // Appliances
  getAppliances: async (): Promise<Appliance[]> => {
    const res = await fetch(`${API_BASE}/appliances`);
    if (!res.ok) throw new Error('Failed to fetch appliances');
    return res.json();
  },

  getApplianceDetails: async (id: string) => {
    const res = await fetch(`${API_BASE}/appliances/${id}`);
    if (!res.ok) throw new Error('Failed to fetch appliance details');
    return res.json();
  },

  toggleAppliance: async (id: string, status?: 'ON' | 'OFF') => {
    const res = await fetch(`${API_BASE}/appliances/${id}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to toggle appliance');
    return res.json();
  },

  setApplianceMode: async (id: string, mode: 'MANUAL' | 'SMART' | 'RECOMMENDATION') => {
    const res = await fetch(`${API_BASE}/appliances/${id}/mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode })
    });
    if (!res.ok) throw new Error('Failed to update appliance mode');
    return res.json();
  },

  // Energy & Analytics
  getChartData: async (granularity: 'hourly' | 'daily' | 'weekly' | 'monthly'): Promise<ChartDataPoint[]> => {
    const res = await fetch(`${API_BASE}/energy/chart?granularity=${granularity}`);
    if (!res.ok) throw new Error('Failed to fetch chart data');
    return res.json();
  },

  getMonthlyHistory: async () => {
    const res = await fetch(`${API_BASE}/energy/monthly`);
    if (!res.ok) throw new Error('Failed to fetch monthly history');
    return res.json();
  },

  getMonthlyComparison: async (y1 = 2026, m1 = 8, y2 = 2026, m2 = 9): Promise<MonthlyComparisonData> => {
    const res = await fetch(`${API_BASE}/energy/comparison?year1=${y1}&month1=${m1}&year2=${y2}&month2=${m2}`);
    if (!res.ok) throw new Error('Failed to fetch monthly comparison');
    return res.json();
  },

  getBudgets: async () => {
    const res = await fetch(`${API_BASE}/energy/budgets`);
    if (!res.ok) throw new Error('Failed to fetch appliance budgets');
    return res.json();
  },

  getSavings: async (): Promise<{ total_saved_kwh: number; total_cost_saved: number; verified_actions_count: number; events: SavingEvent[] }> => {
    const res = await fetch(`${API_BASE}/energy/savings`);
    if (!res.ok) throw new Error('Failed to fetch savings verification');
    return res.json();
  },

  getTariffBill: async () => {
    const res = await fetch(`${API_BASE}/energy/tariff-bill`);
    if (!res.ok) throw new Error('Failed to fetch tariff bill');
    return res.json();
  },

  // AI & ML
  getForecast: async (): Promise<ForecastData> => {
    const res = await fetch(`${API_BASE}/ai/forecast`);
    if (!res.ok) throw new Error('Failed to fetch AI forecast');
    return res.json();
  },

  getAnomalies: async (): Promise<Anomaly[]> => {
    const res = await fetch(`${API_BASE}/ai/anomalies`);
    if (!res.ok) throw new Error('Failed to fetch anomalies');
    return res.json();
  },

  getWastageEvents: async (): Promise<WastageEvent[]> => {
    const res = await fetch(`${API_BASE}/ai/wastage`);
    if (!res.ok) throw new Error('Failed to fetch wastage events');
    return res.json();
  },

  resolveWastage: async (eventId: number) => {
    const res = await fetch(`${API_BASE}/ai/wastage/${eventId}/resolve`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to resolve wastage');
    return res.json();
  },

  getRecommendations: async (): Promise<Recommendation[]> => {
    const res = await fetch(`${API_BASE}/ai/recommendations`);
    if (!res.ok) throw new Error('Failed to fetch recommendations');
    return res.json();
  },

  calculateWhatIf: async (params: {
    ac_reduction_hours: number;
    auto_off_empty_rooms: boolean;
    replace_fan_bldc: boolean;
    replace_old_pump: boolean;
    temp_setpoint_adjustment: number;
  }): Promise<WhatIfResponse> => {
    const res = await fetch(`${API_BASE}/ai/what-if`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error('Failed to calculate what-if scenario');
    return res.json();
  },

  // Simulation Controls & Scenarios
  getSimulationStatus: async () => {
    const res = await fetch(`${API_BASE}/simulation/status`);
    if (!res.ok) throw new Error('Failed to fetch simulation status');
    return res.json();
  },

  triggerScenario: async (scenario: string) => {
    const res = await fetch(`${API_BASE}/simulation/scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario })
    });
    if (!res.ok) throw new Error('Failed to trigger scenario');
    return res.json();
  },

  resetSimulation: async () => {
    const res = await fetch(`${API_BASE}/simulation/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset simulation');
    return res.json();
  },

  // Reports
  getMonthlyReport: async (year = 2026, month = 9) => {
    const res = await fetch(`${API_BASE}/reports/monthly?year=${year}&month=${month}`);
    if (!res.ok) throw new Error('Failed to fetch monthly report');
    return res.json();
  },

  // Settings
  getSettings: async () => {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  updateSettings: async (payload: any) => {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  }
};
