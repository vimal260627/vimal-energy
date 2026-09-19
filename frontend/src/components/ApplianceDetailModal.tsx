import React, { useState, useEffect } from 'react';
import { X, Zap, Activity, Clock, DollarSign, TrendingUp, ShieldCheck, Power } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { api } from '../api/client';

interface ApplianceDetailModalProps {
  applianceId: string | null;
  onClose: () => void;
  onApplianceUpdated: () => void;
}

export const ApplianceDetailModal: React.FC<ApplianceDetailModalProps> = ({
  applianceId,
  onClose,
  onApplianceUpdated,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!applianceId) return;
    setLoading(true);
    api.getApplianceDetails(applianceId)
      .then((res) => setData(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [applianceId]);

  if (!applianceId) return null;

  const handleToggle = async () => {
    if (!data) return;
    setToggling(true);
    try {
      await api.toggleAppliance(applianceId);
      const updated = await api.getApplianceDetails(applianceId);
      setData(updated);
      onApplianceUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setToggling(false);
    }
  };

  const handleModeChange = async (newMode: 'MANUAL' | 'SMART' | 'RECOMMENDATION') => {
    try {
      await api.setApplianceMode(applianceId, newMode);
      const updated = await api.getApplianceDetails(applianceId);
      setData(updated);
      onApplianceUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const app = data?.appliance;
  const isON = app?.status === 'ON';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isON ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
            }`}>
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">{app?.name || 'Loading Appliance...'}</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
                  {app?.room_name} • {app?.category}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Rated Power: {app?.rated_power_w} W • Baseline: {app?.baseline_power_w} W
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {loading || !app ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading telemetry metrics...</div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Top Quick Metrics & Relay Switch */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Live Power</span>
                <p className="text-xl font-extrabold text-white mt-1">
                  {app.current_power_w.toFixed(1)} <span className="text-xs font-normal text-slate-400">W</span>
                </p>
                <div className="flex items-center space-x-1 text-[11px] mt-1">
                  <span className={data.power_diff_pct > 15 ? 'text-rose-400' : 'text-emerald-400'}>
                    {data.power_diff_pct > 0 ? `+${data.power_diff_pct}%` : `${data.power_diff_pct}%`}
                  </span>
                  <span className="text-slate-500">vs baseline</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Today / Month</span>
                <p className="text-xl font-extrabold text-emerald-400 mt-1">
                  {app.today_kwh} <span className="text-xs font-normal text-slate-400">/ {app.this_month_kwh} kWh</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Prev Month: {app.prev_month_kwh} kWh
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Monthly Cost</span>
                <p className="text-xl font-extrabold text-amber-400 mt-1">
                  ₹{app.estimated_monthly_cost.toFixed(0)}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Budget: {app.monthly_budget_kwh} kWh
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Virtual Relay</span>
                <button
                  onClick={handleToggle}
                  disabled={toggling}
                  className={`mt-1 flex items-center justify-center space-x-2 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                    isON
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{isON ? 'Turn OFF' : 'Turn ON'}</span>
                </button>
              </div>
            </div>

            {/* Operating Mode Selector */}
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200">Control Mode</span>
                <p className="text-[11px] text-slate-400">Determines how the AI system interacts with this appliance</p>
              </div>
              <div className="flex space-x-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
                {(['MANUAL', 'SMART', 'RECOMMENDATION'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => handleModeChange(m)}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                      app.control_mode === m
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* 24-Hour Telemetry Graph */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300">24-Hour Power Telemetry (Watts)</span>
                <span className="text-[11px] text-slate-500">15-minute sampling interval</span>
              </div>
              <div className="h-52 w-full bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.readings_24h}>
                    <defs>
                      <linearGradient id="appPowerGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(ts) => ts.slice(11, 16)}
                      stroke="#475569"
                      fontSize={11}
                    />
                    <YAxis stroke="#475569" fontSize={11} unit="W" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                      labelFormatter={(ts) => `Time: ${ts}`}
                      formatter={(val: any) => [`${val} W`, 'Power']}
                    />
                    <Area type="monotone" dataKey="power_w" stroke="#10b981" strokeWidth={2} fill="url(#appPowerGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Energy Saving Potential Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/20 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-400">Optimization & Saving Potential</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Adhering to baseline and smart shutoffs could save up to ~{data.potential_saving_kwh} kWh/month (₹{data.potential_saving_cost}).
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                {app.efficiency_status}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
