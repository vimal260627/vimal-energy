import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, Zap, DollarSign, Activity, History, Clock } from 'lucide-react';
import { SavingEvent } from '../types';
import { api } from '../api/client';

export const SavingsVerificationPage: React.FC = () => {
  const [data, setData] = useState<{
    total_saved_kwh: number;
    total_cost_saved: number;
    verified_actions_count: number;
    events: SavingEvent[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSavings()
      .then((res) => setData(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Energy Savings Verification Ledger</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographically timestamped proof-of-savings auditing before & after power delta measurements.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>100% Audit Verified</span>
          </span>
        </div>
      </div>

      {/* Critical Principle Callout (Requirement 59) */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start space-x-3 text-xs">
        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-slate-200">Measurement & Verification (M&V) Protocol</span>
          <p className="text-slate-400 mt-0.5 leading-relaxed">
            This ledger records <strong>Actual Verified Saved Energy</strong> measured immediately following virtual relay state changes {"(ΔP = P_before - P_after)"}. This is strictly differentiated from theoretical or potential future savings.
          </p>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold">Total Verified Savings</span>
            <p className="text-2xl font-extrabold text-emerald-400 mt-1">
              {data?.total_saved_kwh.toFixed(3)} <span className="text-sm font-normal text-slate-400">kWh</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Direct load shedding</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold">Verified Cost Saved</span>
            <p className="text-2xl font-extrabold text-amber-400 mt-1">
              ₹{data?.total_cost_saved.toFixed(2)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Calculated at current tariff</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold">Verified Actions</span>
            <p className="text-2xl font-extrabold text-white mt-1">
              {data?.verified_actions_count}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Virtual relay cutoff events</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
            <History className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Verification Ledger Table */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Verified Savings History & Power Delta</h3>
          <span className="text-xs text-slate-400 font-mono">{data?.events.length || 0} Events Recorded</span>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-semibold">Timestamp</th>
                <th className="pb-3 font-semibold">Appliance</th>
                <th className="pb-3 font-semibold">Optimization Mechanism</th>
                <th className="pb-3 font-semibold text-right">Power Before</th>
                <th className="pb-3 font-semibold text-right">Power After</th>
                <th className="pb-3 font-semibold text-right">Δ Power</th>
                <th className="pb-3 font-semibold text-right">Verified Saved</th>
                <th className="pb-3 font-semibold text-right">Cost Saved</th>
                <th className="pb-3 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400">Loading ledger...</td>
                </tr>
              ) : !data || data.events.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400">No savings events recorded yet.</td>
                </tr>
              ) : (
                data.events.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 font-mono text-slate-400">{e.timestamp}</td>
                    <td className="py-3.5 font-bold text-white">{e.appliance_name}</td>
                    <td className="py-3.5 text-slate-300">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                        {e.action_type}
                      </span>
                    </td>
                    <td className="py-3.5 text-right font-medium text-slate-300">{e.power_before_w} W</td>
                    <td className="py-3.5 text-right font-medium text-slate-400">{e.power_after_w} W</td>
                    <td className="py-3.5 text-right font-bold text-emerald-400">-{e.power_diff_w} W</td>
                    <td className="py-3.5 text-right font-bold text-emerald-300">{e.energy_saved_kwh.toFixed(3)} kWh</td>
                    <td className="py-3.5 text-right font-bold text-amber-400">₹{e.cost_saved.toFixed(2)}</td>
                    <td className="py-3.5 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Verified
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
