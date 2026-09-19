import React, { useState, useEffect } from 'react';
import { Leaf, ShieldCheck, Zap, Trees, Globe, Wind } from 'lucide-react';
import { api } from '../api/client';

export const EnvironmentalPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard()
      .then((d) => setData(d))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return <div className="text-center py-20 text-slate-400 text-sm">Computing grid emissions audit...</div>;
  }

  const kpis = data.kpis;
  const emissionFactor = 0.82; // kg CO2 / kWh
  const totalEmissionsKg = Math.round(kpis.this_month_energy_kwh * emissionFactor);
  const avoidedEmissionsKg = Math.round(kpis.energy_saved_kwh * emissionFactor);
  const treesEquiv = Math.round(avoidedEmissionsKg / 1.8); // monthly tree equivalent

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Leaf className="w-5 h-5 text-emerald-400" />
            <span>Environmental Impact & Carbon Footprint Audit</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Conversion of electricity consumption to greenhouse gas emissions based on national grid emission factors.
          </p>
        </div>

        <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-mono">
          Factor: 0.82 kg CO2e / kWh
        </span>
      </div>

      {/* Hero Environmental Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-b from-emerald-500/10 to-slate-900 border border-emerald-500/30">
          <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Avoided Carbon Emissions</span>
          <p className="text-3xl font-extrabold text-white mt-1.5">
            {avoidedEmissionsKg} <span className="text-sm font-normal text-emerald-400">kg CO2e</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Through {kpis.energy_saved_kwh} kWh of verified energy saved
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Monthly Emissions</span>
          <p className="text-3xl font-extrabold text-slate-300 mt-1.5">
            {totalEmissionsKg} <span className="text-sm font-normal text-slate-400">kg CO2e</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Derived from {kpis.this_month_energy_kwh} kWh grid energy consumed
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Ecological Tree Equivalent</span>
          <div className="flex items-center space-x-2 mt-1.5">
            <Trees className="w-7 h-7 text-emerald-400" />
            <span className="text-3xl font-extrabold text-emerald-400">{treesEquiv} Trees</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Carbon absorption equivalent over equivalent timeframe
          </p>
        </div>
      </div>

      {/* Methodology & Future Clean Energy Extensions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-2 flex items-center space-x-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>Methodology & Emission Factor Standards</span>
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Emissions are estimated using the Central Electricity Authority (CEA) baseline carbon emission database for regional electrical grids:
          </p>
          <div className="mt-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 font-mono text-xs text-emerald-400">
            {"Emissions (kg CO2e) = Energy (kWh) × 0.82 kg/kWh"}
          </div>
          <p className="text-[11px] text-slate-500 mt-3">
            Note: All values are estimates designed to inform sustainability decisions.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-2 flex items-center space-x-2">
            <Wind className="w-4 h-4 text-emerald-400" />
            <span>Future Clean Energy Integration Ready</span>
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            The software architecture includes schema hooks for future hardware and rooftop solar inverters:
          </p>
          <ul className="mt-3 space-y-2 text-xs text-slate-300">
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Rooftop Solar PV Generation Telemetry</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Net-metering export & zero-carbon self-consumption</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Battery Energy Storage System (BESS) dispatch algorithms</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
