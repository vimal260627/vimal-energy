import React, { useState, useEffect } from 'react';
import { Zap, Search, Filter, Power, Activity, DollarSign, Clock, ShieldCheck } from 'lucide-react';
import { Appliance } from '../types';
import { api } from '../api/client';

interface AppliancesPageProps {
  onSelectAppliance: (id: string) => void;
}

export const AppliancesPage: React.FC<AppliancesPageProps> = ({ onSelectAppliance }) => {
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchAppliances = async () => {
    try {
      const data = await api.getAppliances();
      setAppliances(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppliances();
  }, []);

  const handleToggle = async (app: Appliance, e: React.MouseEvent) => {
    e.stopPropagation();
    setTogglingId(app.id);
    try {
      await api.toggleAppliance(app.id);
      await fetchAppliances();
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingId(null);
    }
  };

  const categories = ['ALL', 'HVAC', 'Motor', 'Lighting', 'Kitchen', 'Entertainment', 'Appliance'];

  const filtered = appliances.filter((a) => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) || (a.room_name || '').toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || a.category.toUpperCase() === selectedCategory.toUpperCase();
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Appliance-Level Energy Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Individual load telemetry, virtual relay switching, baseline deviation, and efficiency ratings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search appliance or room..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-56"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Appliances Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 text-sm">Loading appliances telemetry...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400 text-sm">No appliances match your filter.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((app) => {
            const isON = app.status === 'ON';
            return (
              <div
                key={app.id}
                onClick={() => onSelectAppliance(app.id)}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 cursor-pointer transition-all duration-200 flex flex-col justify-between group shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="truncate mr-2">
                      <h4 className="text-sm font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                        {app.name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">{app.room_name} • {app.category}</p>
                    </div>

                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      isON ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1 ${isON ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                      {app.status}
                    </span>
                  </div>

                  {/* Power & Cost Metrics */}
                  <div className="grid grid-cols-2 gap-2 mt-4 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase">Live Power</span>
                      <p className="text-sm font-extrabold text-white mt-0.5">
                        {app.current_power_w.toFixed(0)} <span className="text-[10px] font-normal text-slate-400">W</span>
                      </p>
                      <p className="text-[10px] text-slate-500">Rated: {app.rated_power_w} W</p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase">Month Energy</span>
                      <p className="text-sm font-extrabold text-emerald-400 mt-0.5">
                        {app.this_month_kwh?.toFixed(1)} <span className="text-[10px] font-normal text-slate-400">kWh</span>
                      </p>
                      <p className="text-[10px] text-amber-400">₹{app.estimated_monthly_cost?.toFixed(0)}</p>
                    </div>
                  </div>
                </div>

                {/* Footer Controls & Efficiency Badge */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    app.efficiency_status === 'EFFICIENT'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : app.efficiency_status === 'NORMAL'
                      ? 'bg-slate-800 text-slate-300'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {app.efficiency_status}
                  </span>

                  <button
                    onClick={(e) => handleToggle(app, e)}
                    disabled={togglingId === app.id}
                    className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      isON
                        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25'
                        : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    <span>{togglingId === app.id ? '...' : (isON ? 'Relay OFF' : 'Relay ON')}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
