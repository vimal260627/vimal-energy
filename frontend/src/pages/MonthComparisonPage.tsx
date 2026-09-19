import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Sparkles, TrendingUp, TrendingDown, DollarSign, Zap, Activity, Layers } from 'lucide-react';
import { MonthlyComparisonData } from '../types';
import { api } from '../api/client';

export const MonthComparisonPage: React.FC = () => {
  const [data, setData] = useState<MonthlyComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [month1, setMonth1] = useState(8); // August
  const [month2, setMonth2] = useState(9); // September

  const loadComparison = async (m1: number, m2: number) => {
    setLoading(true);
    try {
      const res = await api.getMonthlyComparison(2026, m1, 2026, m2);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComparison(month1, month2);
  }, [month1, month2]);

  const monthsList = [
    { value: 4, label: 'April 2026' },
    { value: 5, label: 'May 2026' },
    { value: 6, label: 'June 2026' },
    { value: 7, label: 'July 2026' },
    { value: 8, label: 'August 2026' },
    { value: 9, label: 'September 2026 (Current)' },
  ];

  if (loading || !data) {
    return (
      <div className="text-center py-24 text-slate-400 text-sm">
        Computing comparative deltas and generating AI explanation...
      </div>
    );
  }

  const { m1, m2 } = { m1: data.month1, m2: data.month2 };
  const energyDiff = roundToTwo(m2.total_energy_kwh - m1.total_energy_kwh);
  const energyPct = roundToOne(((m2.total_energy_kwh - m1.total_energy_kwh) / m1.total_energy_kwh) * 100);
  const costDiff = roundToTwo(m2.total_cost - m1.total_cost);

  function roundToTwo(num: number) {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }
  function roundToOne(num: number) {
    return Math.round((num + Number.EPSILON) * 10) / 10;
  }

  return (
    <div className="space-y-6">
      {/* Header & Month Selectors */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <ArrowLeftRight className="w-5 h-5 text-emerald-400" />
            <span>Multi-Month Comparative Analytics</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Side-by-side consumption variance, appliance deltas, and automated natural language AI explanations.
          </p>
        </div>

        {/* Selectors */}
        <div className="flex items-center space-x-3 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-medium pl-2">Baseline Month:</span>
            <select
              value={month1}
              onChange={(e) => setMonth1(Number(e.target.value))}
              className="bg-slate-950 text-white text-xs border border-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
            >
              {monthsList.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <span className="text-slate-600 font-bold">vs</span>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-medium">Target Month:</span>
            <select
              value={month2}
              onChange={(e) => setMonth2(Number(e.target.value))}
              className="bg-slate-950 text-white text-xs border border-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
            >
              {monthsList.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Dynamic AI Explanation Card (Requirement 14) */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-emerald-950/40 border border-emerald-500/30 shadow-lg shadow-emerald-500/5">
        <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm mb-2">
          <Sparkles className="w-4 h-4" />
          <span>AI Explanation of Monthly Change</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
            Generated from Live Data
          </span>
        </div>
        <p className="text-sm text-slate-200 leading-relaxed">
          "{data.ai_explanation}"
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-800/80 text-xs">
          {data.highest_increase_appliance && (
            <div className="flex items-center space-x-2 text-rose-300 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
              <TrendingUp className="w-4 h-4 shrink-0 text-rose-400" />
              <span>
                <strong>Highest Surge:</strong> {data.highest_increase_appliance} drove the majority of the monthly energy delta.
              </span>
            </div>
          )}
          {data.highest_saving_appliance && (
            <div className="flex items-center space-x-2 text-emerald-300 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
              <TrendingDown className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>
                <strong>Top Efficiency Performer:</strong> {data.highest_saving_appliance} achieved the greatest consumption drop.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Summary KPI Cards Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 uppercase font-semibold">Total Consumption</span>
          <div className="flex items-baseline justify-between mt-2">
            <div>
              <span className="text-xs text-slate-500 block">{m1.month_name}</span>
              <span className="text-lg font-bold text-white">{m1.total_energy_kwh} kWh</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">{m2.month_name}</span>
              <span className="text-lg font-bold text-emerald-400">{m2.total_energy_kwh} kWh</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-400">Net Delta:</span>
            <span className={energyDiff > 0 ? 'text-rose-400' : 'text-emerald-400'}>
              {energyDiff > 0 ? `+${energyDiff} kWh (+${energyPct}%)` : `${energyDiff} kWh (${energyPct}%)`}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 uppercase font-semibold">Electricity Bill</span>
          <div className="flex items-baseline justify-between mt-2">
            <div>
              <span className="text-xs text-slate-500 block">{m1.month_name}</span>
              <span className="text-lg font-bold text-white">₹{m1.total_cost.toFixed(0)}</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">{m2.month_name}</span>
              <span className="text-lg font-bold text-amber-400">₹{m2.total_cost.toFixed(0)}</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-400">Bill Variance:</span>
            <span className={costDiff > 0 ? 'text-rose-400' : 'text-emerald-400'}>
              {costDiff > 0 ? `+₹${costDiff.toFixed(0)}` : `-₹${Math.abs(costDiff).toFixed(0)}`}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 uppercase font-semibold">Peak Demand</span>
          <div className="flex items-baseline justify-between mt-2">
            <div>
              <span className="text-xs text-slate-500 block">{m1.month_name}</span>
              <span className="text-lg font-bold text-white">{(m1.peak_power_w / 1000).toFixed(2)} kW</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">{m2.month_name}</span>
              <span className="text-lg font-bold text-rose-400">{(m2.peak_power_w / 1000).toFixed(2)} kW</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-400">Daily Average:</span>
            <span className="text-slate-200">{m1.avg_daily_kwh} vs {m2.avg_daily_kwh} kWh/day</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 uppercase font-semibold">Carbon Emissions</span>
          <div className="flex items-baseline justify-between mt-2">
            <div>
              <span className="text-xs text-slate-500 block">{m1.month_name}</span>
              <span className="text-lg font-bold text-white">{m1.co2_emissions_kg} kg</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">{m2.month_name}</span>
              <span className="text-lg font-bold text-cyan-400">{m2.co2_emissions_kg} kg</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-400">CO2 Impact:</span>
            <span className="text-slate-300">{roundToTwo(m2.co2_emissions_kg - m1.co2_emissions_kg)} kg CO2e</span>
          </div>
        </div>
      </div>

      {/* Appliance-by-Appliance Comparison Table */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Appliance-Level Breakdown Comparison</h3>
            <p className="text-xs text-slate-400">Side-by-side consumption analysis with exact numerical changes</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {m1.month_name} vs {m2.month_name}
          </span>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-semibold">Appliance</th>
                <th className="pb-3 font-semibold">Room & Category</th>
                <th className="pb-3 font-semibold text-right">{m1.month_name} (kWh)</th>
                <th className="pb-3 font-semibold text-right">{m2.month_name} (kWh)</th>
                <th className="pb-3 font-semibold text-right">Delta (kWh)</th>
                <th className="pb-3 font-semibold text-right">Percentage Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {data.appliance_comparison.map((item) => {
                const isIncrease = item.diff_kwh > 0;
                return (
                  <tr key={item.appliance_id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 font-bold text-white">{item.appliance_name}</td>
                    <td className="py-3 text-slate-400">{item.room_name} • {item.category}</td>
                    <td className="py-3 text-right font-medium text-slate-300">{item.month1_kwh.toFixed(1)}</td>
                    <td className="py-3 text-right font-bold text-white">{item.month2_kwh.toFixed(1)}</td>
                    <td className={`py-3 text-right font-bold ${isIncrease ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {isIncrease ? `+${item.diff_kwh.toFixed(1)}` : item.diff_kwh.toFixed(1)}
                    </td>
                    <td className="py-3 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                        isIncrease ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {isIncrease ? `+${item.percentage_change}%` : `${item.percentage_change}%`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
