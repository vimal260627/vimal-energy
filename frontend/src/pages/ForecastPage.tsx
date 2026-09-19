import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, ShieldAlert, Sparkles, BarChart3, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import { ForecastData } from '../types';
import { api } from '../api/client';

export const ForecastPage: React.FC = () => {
  const [data, setData] = useState<ForecastData | null>(null);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getForecast(), api.getBudgets()])
      .then(([f, b]) => {
        setData(f);
        setBudgets(b);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="text-center py-24 text-slate-400 text-sm">
        Running ML forecasting algorithms and feature regressions...
      </div>
    );
  }

  const isOverTarget = data.projected_exceedance_kwh > 0;
  const targetPct = Math.round((data.end_of_month_projected_kwh / data.target_kwh) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <span>AI Energy Forecasting & Target Tracking</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Predictive machine learning models trained on time-series history, occupancy rhythms, and ambient thermal curves.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-400">Model Confidence:</span>
          <span className="font-bold text-emerald-400">{Math.round(data.confidence_score * 100)}%</span>
        </div>
      </div>

      {/* Target Progress & Month-End Projection Banner */}
      <div className={`p-5 rounded-2xl border ${
        isOverTarget
          ? 'bg-gradient-to-r from-slate-900 via-slate-900/90 to-rose-950/40 border-rose-500/30'
          : 'bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 border-emerald-500/30'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Target className={`w-5 h-5 ${isOverTarget ? 'text-rose-400' : 'text-emerald-400'}`} />
              <h3 className="text-base font-bold text-white">
                Monthly Target vs End-of-Month Projected Demand
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Target: <strong className="text-white">{data.target_kwh} kWh</strong> • Projected: <strong className={isOverTarget ? 'text-rose-400' : 'text-emerald-400'}>{data.end_of_month_projected_kwh} kWh</strong>
            </p>
          </div>

          <div className="text-right">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
              isOverTarget ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              {isOverTarget ? `Over Target by +${data.projected_exceedance_kwh} kWh` : 'Within Configured Target'}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                targetPct > 100 ? 'bg-rose-500' : targetPct > 85 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, targetPct)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 mt-1.5">
            <span>0 kWh</span>
            <span>Target: {data.target_kwh} kWh</span>
            <span className={isOverTarget ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
              {targetPct}% Expected Usage
            </span>
          </div>
        </div>

        {/* Forecast Insights */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-300">
          {data.insights.map((ins, idx) => (
            <div key={idx} className="flex items-start space-x-2">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>{ins}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 24-Hour Predictive Curve & 7-Day Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next 24 Hours Hourly Curve */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">Next 24-Hour Diurnal Load Forecast</h3>
            <p className="text-xs text-slate-400">Predicted hourly curve with upper and lower 90% confidence bounds</p>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.next_24h}>
                <defs>
                  <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" stroke="#475569" fontSize={11} />
                <YAxis stroke="#475569" fontSize={11} unit=" kWh" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  formatter={(val: any, name: any) => [
                    `${val} kWh`,
                    name === 'predicted_kwh' ? 'Predicted' : name === 'upper_bound_kwh' ? 'Upper Bound' : 'Lower Bound'
                  ]}
                />
                <Area type="monotone" dataKey="upper_bound_kwh" stroke="#334155" strokeDasharray="3 3" fill="none" />
                <Area type="monotone" dataKey="predicted_kwh" stroke="#06b6d4" strokeWidth={2} fill="url(#predGrad)" />
                <Area type="monotone" dataKey="lower_bound_kwh" stroke="#334155" strokeDasharray="3 3" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Next 7 Days Forecast */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">Next 7 Days Daily Projections</h3>
            <p className="text-xs text-slate-400">Anticipated daily consumption based on day-of-week weights</p>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.next_7d}>
                <XAxis dataKey="label" stroke="#475569" fontSize={11} />
                <YAxis stroke="#475569" fontSize={11} unit=" kWh" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  formatter={(val: any) => [`${val} kWh`, 'Expected Consumption']}
                />
                <Bar dataKey="predicted_kwh" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Appliance Budgets vs Actuals */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Configured Appliance Monthly Budgets</h3>
            <p className="text-xs text-slate-400">Track appliance allocations and detect budget overruns early</p>
          </div>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-semibold">Appliance</th>
                <th className="pb-3 font-semibold">Room & Category</th>
                <th className="pb-3 font-semibold text-right">Budget (kWh)</th>
                <th className="pb-3 font-semibold text-right">Actual (kWh)</th>
                <th className="pb-3 font-semibold text-right">Remaining (kWh)</th>
                <th className="pb-3 font-semibold text-right">% Used</th>
                <th className="pb-3 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {budgets.map((b) => (
                <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 font-bold text-white">{b.name}</td>
                  <td className="py-3 text-slate-400">{b.room} • {b.category}</td>
                  <td className="py-3 text-right font-medium text-slate-300">{b.budget_kwh}</td>
                  <td className="py-3 text-right font-bold text-white">{b.actual_kwh}</td>
                  <td className={`py-3 text-right font-bold ${b.remaining_kwh < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {b.remaining_kwh}
                  </td>
                  <td className="py-3 text-right font-semibold text-slate-200">{b.percentage_used}%</td>
                  <td className="py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                      b.status === 'EXCEEDED'
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : b.status === 'WARNING'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
