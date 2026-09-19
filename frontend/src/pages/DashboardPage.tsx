import React, { useState, useEffect } from 'react';
import {
  Zap,
  Calendar,
  DollarSign,
  ShieldCheck,
  Activity,
  Cpu,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  Users,
  Thermometer,
  Sun
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { KPICard } from '../components/KPICard';
import { DashboardData, Appliance } from '../types';
import { api } from '../api/client';

const COLORS = ['#10b981', '#06b6d4', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];

interface DashboardPageProps {
  onSelectAppliance: (id: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onSelectAppliance,
  onNavigateTab,
}) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartGranularity, setChartGranularity] = useState<'hourly' | 'daily' | 'weekly' | 'monthly'>('hourly');
  const [chartData, setChartData] = useState<any[]>([]);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const d = await api.getDashboard();
      setData(d);
      setChartData(d.recent_trend);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleGranularityChange = async (gran: 'hourly' | 'daily' | 'weekly' | 'monthly') => {
    setChartGranularity(gran);
    try {
      const res = await api.getChartData(gran);
      setChartData(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickToggle = async (app: Appliance, e: React.MouseEvent) => {
    e.stopPropagation();
    setTogglingId(app.id);
    try {
      await api.toggleAppliance(app.id);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingId(null);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-400">
        <div className="flex flex-col items-center space-y-2">
          <Activity className="w-8 h-8 text-emerald-400 animate-spin" />
          <p className="text-sm">Connecting to virtual smart energy environment...</p>
        </div>
      </div>
    );
  }

  const { kpis, rooms, appliance_breakdown, active_appliances_list, quick_recommendation } = data;

  return (
    <div className="space-y-6">
      {/* Top Welcome / Status Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Energy Management Command Center</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Score: {kpis.energy_score}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time appliance monitoring, predictive load dispatch, and automated wastage mitigation.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <span className="text-[11px] text-slate-400">Monthly Target (260 kWh)</span>
            <div className="flex items-center space-x-2 mt-0.5">
              <div className="w-32 bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    kpis.target_percentage_used > 85 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min(100, kpis.target_percentage_used)}%` }}
                />
              </div>
              <span className="text-xs font-bold text-white">{kpis.target_percentage_used}%</span>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('what-if')}
            className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold transition-all"
          >
            Run What-If
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <KPICard
          title="Today's Energy"
          value={kpis.today_energy_kwh}
          unit="kWh"
          subtitle="Nominal daily cycle"
          icon={Zap}
          variant="emerald"
        />
        <KPICard
          title="This Month"
          value={kpis.this_month_energy_kwh}
          unit="kWh"
          subtitle={`Projected: ${kpis.projected_month_end_kwh} kWh`}
          icon={Calendar}
          variant="cyan"
        />
        <KPICard
          title="Estimated Cost"
          value={`₹${kpis.estimated_cost.toFixed(0)}`}
          subtitle="Slab rate calculation"
          icon={DollarSign}
          variant="amber"
        />
        <KPICard
          title="Energy Saved"
          value={kpis.energy_saved_kwh}
          unit="kWh"
          subtitle="Verified by auto-relays"
          icon={ShieldCheck}
          variant="emerald"
        />
        <KPICard
          title="Peak Power"
          value={kpis.peak_power_kw}
          unit="kW"
          subtitle="Maximum instantaneous load"
          icon={Activity}
          variant="rose"
        />
        <KPICard
          title="Active Loads"
          value={kpis.active_appliances}
          subtitle="Connected to Virtual Relay"
          icon={Cpu}
          variant="indigo"
        />
      </div>

      {/* Main Interactive Chart & Appliance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>Electricity Consumption Profile</span>
                <span className="text-[10px] text-emerald-400 font-normal px-2 py-0.5 rounded bg-emerald-500/10">
                  Live Sim Data
                </span>
              </h3>
              <p className="text-xs text-slate-400">Total active load curve & energy consumption</p>
            </div>

            {/* Granularity switch buttons */}
            <div className="flex space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              {(['hourly', 'daily', 'weekly', 'monthly'] as const).map((gran) => (
                <button
                  key={gran}
                  onClick={() => handleGranularityChange(gran)}
                  className={`px-2.5 py-1 rounded font-medium capitalize transition-all ${
                    chartGranularity === gran
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {gran}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="mainEnergyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#475569" fontSize={11} />
                <YAxis stroke="#475569" fontSize={11} unit=" kWh" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  formatter={(val: any) => [`${val} kWh`, 'Energy']}
                />
                <Area type="monotone" dataKey="energy_kwh" stroke="#10b981" strokeWidth={2} fill="url(#mainEnergyGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Appliance Share Donut */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
          <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Appliance Consumption Share</h3>
            <button
              onClick={() => onNavigateTab('appliances')}
              className="text-xs text-emerald-400 hover:underline"
            >
              View All
            </button>
          </div>

          <div className="h-48 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={appliance_breakdown.slice(0, 6)}
                  dataKey="energy_kwh"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {appliance_breakdown.slice(0, 6).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  formatter={(val: any) => [`${val} kWh`, 'Consumed']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
            {appliance_breakdown.slice(0, 4).map((item, idx) => (
              <div key={item.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 truncate">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-slate-300 truncate">{item.name}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-semibold text-white">{item.energy_kwh} kWh</span>
                  <span className="text-[10px] text-slate-500 ml-1.5">({item.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Appliances Grid & Rooms Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Appliances Quick Relay Toggle */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>Active Loads & Virtual Relays</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                  {active_appliances_list.length} Online
                </span>
              </h3>
              <p className="text-xs text-slate-400">Click to inspect or toggle virtual relay state directly</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-4">
            {active_appliances_list.map((app) => (
              <div
                key={app.id}
                onClick={() => onSelectAppliance(app.id)}
                className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-emerald-500/40 cursor-pointer transition-all flex flex-col justify-between group"
              >
                <div className="flex items-start justify-between">
                  <div className="truncate mr-2">
                    <p className="text-xs font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                      {app.name}
                    </p>
                    <p className="text-[11px] text-slate-400">{app.room_name}</p>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0 mt-1" />
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-900 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">Live Load</span>
                    <p className="text-sm font-extrabold text-white">
                      {app.current_power_w.toFixed(0)} <span className="text-[10px] text-slate-400 font-normal">W</span>
                    </p>
                  </div>

                  <button
                    onClick={(e) => handleQuickToggle(app, e)}
                    disabled={togglingId === app.id}
                    className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-semibold transition-all"
                  >
                    {togglingId === app.id ? '...' : 'Turn OFF'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Room Environmental Telemetry */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">Virtual Sensor Array</h3>
            <p className="text-xs text-slate-400">Real-time room occupancy & ambient conditions</p>
          </div>

          <div className="space-y-3 pt-3">
            {rooms.map((r) => (
              <div key={r.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200">{r.name}</span>
                  <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-1">
                    <span className="flex items-center space-x-1">
                      <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                      <span>{r.current_temperature}°C</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Sun className="w-3.5 h-3.5 text-yellow-400" />
                      <span>{r.light_lux.toFixed(0)} Lux</span>
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                    r.occupancy > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                  }`}>
                    <Users className="w-3 h-3 mr-1" />
                    {r.occupancy > 0 ? 'Occupied' : 'Vacant'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick AI Tip */}
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-xs">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Operational Insight</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-normal">{quick_recommendation}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
