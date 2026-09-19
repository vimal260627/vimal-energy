import React, { useState, useEffect } from 'react';
import { Receipt, DollarSign, Layers, ArrowUpRight, ArrowDownRight, AlertCircle } from 'lucide-react';
import { api } from '../api/client';

export const BillTariffPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTariffBill()
      .then((res) => setData(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return <div className="text-center py-20 text-slate-400 text-sm">Computing dynamic slab tariff estimation...</div>;
  }

  const isMoreThanPrev = data.difference > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-amber-400" />
            <span>Electricity Bill & Dynamic Slab Tariff Estimator</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configurable tiered slab billing, fixed demand charges, and month-to-month variance audits.
          </p>
        </div>
      </div>

      {/* Bill Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-b from-amber-500/10 to-slate-900 border border-amber-500/30">
          <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">Current Month Estimate</span>
          <p className="text-3xl font-extrabold text-white mt-1.5">
            ₹{data.current_estimated_bill.toFixed(2)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Based on {data.current_units_kwh} kWh consumed to date
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Previous Month Bill</span>
          <p className="text-3xl font-extrabold text-slate-300 mt-1.5">
            ₹{data.previous_bill.toFixed(2)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Total August Consumption: {data.previous_units_kwh} kWh
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Month-over-Month Variance</span>
          <div className="flex items-center space-x-2 mt-1.5">
            <span className={`text-3xl font-extrabold ${isMoreThanPrev ? 'text-rose-400' : 'text-emerald-400'}`}>
              {isMoreThanPrev ? `+₹${data.difference.toFixed(2)}` : `-₹${Math.abs(data.difference).toFixed(2)}`}
            </span>
            {isMoreThanPrev ? (
              <ArrowUpRight className="w-6 h-6 text-rose-400" />
            ) : (
              <ArrowDownRight className="w-6 h-6 text-emerald-400" />
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isMoreThanPrev ? 'Surge driven by high afternoon cooling' : 'Efficiency savings achieved'}
          </p>
        </div>
      </div>

      {/* Slab Rates Structure & Fixed Charges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-1">Configured Progressive Slab Structure</h3>
          <p className="text-xs text-slate-400 mb-4">Indian electricity utility tariff structure applied to total units</p>

          <div className="space-y-2.5 text-xs">
            {data.slabs.map((slab: any, idx: number) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">{slab.tier}</span>
                  <span className="text-[11px] text-slate-500">Tier {idx + 1} bracket</span>
                </div>
                <span className="font-mono font-bold text-emerald-400 text-sm">{slab.rate}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Fixed Monthly Charges & Demand Fees</h3>
            <p className="text-xs text-slate-400 mb-4">Mandatory grid interconnection & meter rent fees</p>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Fixed Monthly Grid Meter Charge</span>
                <span className="font-bold text-white">₹{data.fixed_charge.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Electricity Duty / Surcharge (Estimated)</span>
                <span className="font-bold text-white">Included</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-slate-300 font-semibold">Total Baseline Fixed Overhead</span>
                <span className="font-bold text-amber-400">₹{data.fixed_charge.toFixed(2)} / month</span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-xs text-slate-300">
            <span className="font-bold text-emerald-400 block mb-0.5">Slab Optimization Tip</span>
            Keeping monthly consumption below 200 kWh prevents entry into Tier 3 (₹8.00/unit), saving an average of ₹180 per bill cycle.
          </div>
        </div>
      </div>
    </div>
  );
};
