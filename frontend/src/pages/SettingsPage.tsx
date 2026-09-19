import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, RotateCcw } from 'lucide-react';
import { api } from '../api/client';

export const SettingsPage: React.FC = () => {
  const [currency, setCurrency] = useState('₹');
  const [tariff, setTariff] = useState(7.50);
  const [fixedCharge, setFixedCharge] = useState(50.0);
  const [useSlab, setUseSlab] = useState(true);
  const [monthlyTarget, setMonthlyTarget] = useState(260.0);
  const [emissionFactor, setEmissionFactor] = useState(0.82);
  const [wastageTimeout, setWastageTimeout] = useState(15);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    api.getSettings()
      .then((s) => {
        setCurrency(s.currency);
        setTariff(s.tariff_per_kwh);
        setFixedCharge(s.fixed_charge);
        setUseSlab(s.use_slab);
        setMonthlyTarget(s.monthly_target_kwh);
        setEmissionFactor(s.emission_factor);
        setWastageTimeout(s.wastage_timeout_mins);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateSettings({
        currency,
        tariff_per_kwh: Number(tariff),
        fixed_charge: Number(fixedCharge),
        use_slab: useSlab,
        monthly_target_kwh: Number(monthlyTarget),
        emission_factor: Number(emissionFactor),
        wastage_timeout_mins: Number(wastageTimeout),
      });
      setMessage('Settings persisted successfully in SQLite database.');
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      console.error(err);
      setMessage('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Settings className="w-5 h-5 text-slate-400" />
            <span>Platform Configuration & Tariffs</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage billing parameters, utility tariffs, energy targets, and environmental factors.
          </p>
        </div>

        {message && (
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>{message}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Financial & Tariff Settings */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
            Utility Tariff & Financial Preferences
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Currency Symbol</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="₹">₹ (Indian Rupee - INR)</option>
                <option value="$">$ (US Dollar - USD)</option>
                <option value="€">€ (Euro - EUR)</option>
                <option value="£">£ (British Pound - GBP)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Base Tariff Rate (per kWh)</label>
              <input
                type="number"
                step="0.1"
                value={tariff}
                onChange={(e) => setTariff(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Fixed Monthly Meter Charge ({currency})</label>
              <input
                type="number"
                step="1"
                value={fixedCharge}
                onChange={(e) => setFixedCharge(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5 flex flex-col justify-end">
              <label className="flex items-center space-x-2.5 cursor-pointer p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                <input
                  type="checkbox"
                  checked={useSlab}
                  onChange={(e) => setUseSlab(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0 w-4 h-4"
                />
                <span className="text-slate-300 font-medium">Apply Tiered Slab Calculation</span>
              </label>
            </div>
          </div>
        </div>

        {/* Operational & Environmental Parameters */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
            Energy Targets & Sensor Parameters
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Monthly Energy Target (kWh)</label>
              <input
                type="number"
                step="5"
                value={monthlyTarget}
                onChange={(e) => setMonthlyTarget(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[11px] text-slate-500">Triggers overrun warnings in forecasting view</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Wastage Vacancy Timeout (Minutes)</label>
              <input
                type="number"
                step="1"
                value={wastageTimeout}
                onChange={(e) => setWastageTimeout(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[11px] text-slate-500">Delay before unoccupied room load triggers wastage</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Grid Emission Factor (kg CO2e / kWh)</label>
              <input
                type="number"
                step="0.01"
                value={emissionFactor}
                onChange={(e) => setEmissionFactor(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[11px] text-slate-500">Regional power grid carbon intensity</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end space-x-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
