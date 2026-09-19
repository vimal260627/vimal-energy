import React, { useState, useEffect } from 'react';
import { Sliders, Sparkles, TrendingDown, DollarSign, Leaf, Zap, RefreshCw } from 'lucide-react';
import { WhatIfResponse } from '../types';
import { api } from '../api/client';

export const WhatIfSimulatorPage: React.FC = () => {
  const [acHours, setAcHours] = useState<number>(1.5);
  const [autoOff, setAutoOff] = useState<boolean>(true);
  const [bldcFan, setBldcFan] = useState<boolean>(true);
  const [efficientPump, setEfficientPump] = useState<boolean>(false);
  const [setpoint, setSetpoint] = useState<number>(1.0);

  const [result, setResult] = useState<WhatIfResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setLoading(true);
    try {
      const res = await api.calculateWhatIf({
        ac_reduction_hours: acHours,
        auto_off_empty_rooms: autoOff,
        replace_fan_bldc: bldcFan,
        replace_old_pump: efficientPump,
        temp_setpoint_adjustment: setpoint,
      });
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculate();
  }, [acHours, autoOff, bldcFan, efficientPump, setpoint]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <span>Interactive What-If Energy Simulator</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Test operational adjustments, schedule cutoffs, and equipment retrofits to compute instant monthly & annual savings.
          </p>
        </div>

        <button
          onClick={() => {
            setAcHours(1.0);
            setAutoOff(true);
            setBldcFan(false);
            setEfficientPump(false);
            setSetpoint(1.0);
          }}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Sliders</span>
        </button>
      </div>

      {/* Simulator Inputs & Projected Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders & Controls Column */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">
              Operational & Behavior Adjustments
            </h3>

            {/* Slider 1: AC Runtime Reduction */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Reduce AC Runtime</span>
                <span className="font-extrabold text-emerald-400">{acHours} hours / day</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={acHours}
                onChange={(e) => setAcHours(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0 hrs (No change)</span>
                <span>2.5 hrs</span>
                <span>5.0 hrs / day</span>
              </div>
            </div>

            {/* Slider 2: Thermostat Setpoint */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Thermostat Setpoint Increase</span>
                <span className="font-extrabold text-cyan-400">+{setpoint}°C (e.g. 23°C → {23 + setpoint}°C)</span>
              </div>
              <input
                type="range"
                min="0"
                max="4"
                step="0.5"
                value={setpoint}
                onChange={(e) => setSetpoint(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Baseline</span>
                <span>+2.0°C</span>
                <span>+4.0°C</span>
              </div>
            </div>

            {/* Toggles & Retrofit Checkboxes */}
            <div className="pt-3 border-t border-slate-800/80 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Automation & Equipment Upgrades
              </h4>

              <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={autoOff}
                  onChange={(e) => setAutoOff(e.target.checked)}
                  className="mt-0.5 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-bold text-white block">Automated Empty-Room Smart Cutoff</span>
                  <span className="text-[11px] text-slate-400">
                    Auto-switch relays when room occupancy = 0 for &gt;15 min (eliminates ~14.5 kWh/mo)
                  </span>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={bldcFan}
                  onChange={(e) => setBldcFan(e.target.checked)}
                  className="mt-0.5 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-bold text-white block">Upgrade Fans to 5-Star BLDC Motors</span>
                  <span className="text-[11px] text-slate-400">
                    Replace 75W induction motors with 28W BLDC motors (saves 62% fan energy)
                  </span>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={efficientPump}
                  onChange={(e) => setEfficientPump(e.target.checked)}
                  className="mt-0.5 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-bold text-white block">Replace Old Water Pump with Inverter Model</span>
                  <span className="text-[11px] text-slate-400">
                    Reduces pumping load from 750W to 500W for overhead water lifting
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Dynamic Simulation Results Column */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/40 border border-emerald-500/30 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Projected Output</span>
                <h3 className="text-base font-extrabold text-white">Projected Energy & Cost Optimization</h3>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                Live Calculated
              </span>
            </div>

            {/* High-Level Comparison Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Monthly Consumption</span>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-2xl font-extrabold text-emerald-400">
                    {result?.projected_monthly_kwh}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">kWh</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Baseline: <span className="line-through text-slate-400">{result?.baseline_monthly_kwh} kWh</span>
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Monthly Bill Savings</span>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-2xl font-extrabold text-amber-400">
                    ₹{result?.monthly_cost_saved.toFixed(0)}
                  </span>
                  <span className="text-xs text-emerald-400 font-bold">
                    (-{result ? Math.round((result.monthly_saved_kwh / result.baseline_monthly_kwh) * 100) : 0}%)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Saved: {result?.monthly_saved_kwh} kWh / month
                </p>
              </div>
            </div>

            {/* Annualized Big Impact Callouts */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-emerald-300 font-medium">Annual Financial Savings</span>
                <p className="text-2xl font-extrabold text-white mt-1">
                  ₹{result?.annual_cost_saved.toFixed(0)}
                  <span className="text-xs text-emerald-400 font-normal ml-1">/ year</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Direct tariff bill reduction</p>
              </div>

              <div>
                <span className="text-xs text-cyan-300 font-medium">Annual Carbon Avoided</span>
                <p className="text-2xl font-extrabold text-cyan-300 mt-1">
                  {result?.annual_co2_avoided_kg}
                  <span className="text-xs text-slate-400 font-normal ml-1">kg CO2e</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Equivalent to ~{result ? Math.round(result.annual_co2_avoided_kg / 21) : 0} trees planted
                </p>
              </div>
            </div>

            {/* Breakdown of Savings by Strategy */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-300">Savings Contribution Breakdown</span>
              <div className="space-y-2">
                {result && Object.entries(result.breakdown_by_action).map(([action, kwh]) => (
                  <div key={action} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{action}</span>
                    <div className="text-right">
                      <span className="font-bold text-emerald-400">{kwh} kWh</span>
                      <span className="text-slate-500 text-[10px] ml-1.5">(₹{(kwh * 7.5).toFixed(0)})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
