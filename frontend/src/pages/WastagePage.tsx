import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldCheck, CheckCircle2, Clock, Zap, DollarSign } from 'lucide-react';
import type { WastageEvent } from '../types';
import { api } from '../api/client';

export const WastagePage: React.FC = () => {
  const [events, setEvents] = useState<WastageEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchWastage = async () => {
    try {
      const data = await api.getWastageEvents();
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWastage();
  }, []);

  const handleResolve = async (eventId: number) => {
    setResolvingId(eventId);
    try {
      const res = await api.resolveWastage(eventId);
      setActionMessage(res.message || 'Smart saving applied successfully.');
      await fetchWastage();
      setTimeout(() => setActionMessage(null), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setResolvingId(null);
    }
  };

  const totalWastedKwh = events.reduce((acc, e) => acc + e.wasted_kwh, 0);
  const totalWastedCost = events.reduce((acc, e) => acc + e.estimated_cost, 0);
  const activeCount = events.filter((e) => e.status === 'DETECTED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span>Energy Wastage Detection & Auto-Mitigation</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Rule-based sensor fusion identifying unoccupied rooms with running loads (&gt;15 min delay threshold).
          </p>
        </div>

        {actionMessage && (
          <div className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center space-x-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>{actionMessage}</span>
          </div>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold">Active Wastage Events</span>
            <p className="text-2xl font-extrabold text-amber-400 mt-1">{activeCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Requiring immediate shut-off</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold">Cumulative Wasted Energy</span>
            <p className="text-2xl font-extrabold text-white mt-1">
              {totalWastedKwh.toFixed(3)} <span className="text-sm font-normal text-slate-400">kWh</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Across detected occurrences</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold">Estimated Avoidable Cost</span>
            <p className="text-2xl font-extrabold text-emerald-400 mt-1">₹{totalWastedCost.toFixed(2)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Calculated at current tariff rate</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Wastage Events Table */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Detected Vacancy Wastage Incidents</h3>
          <span className="text-xs text-slate-400 font-mono">{events.length} Total Logged</span>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-semibold">Timestamp</th>
                <th className="pb-3 font-semibold">Room</th>
                <th className="pb-3 font-semibold">Appliance</th>
                <th className="pb-3 font-semibold text-right">Vacant Duration</th>
                <th className="pb-3 font-semibold text-right">Wasted Energy</th>
                <th className="pb-3 font-semibold text-right">Estimated Cost</th>
                <th className="pb-3 font-semibold text-center">Action Taken</th>
                <th className="pb-3 font-semibold text-right">Resolution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">Loading incidents...</td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-emerald-400">
                    No energy wastage detected. All unoccupied spaces powered down.
                  </td>
                </tr>
              ) : (
                events.map((event) => {
                  const isDetected = event.status === 'DETECTED';
                  return (
                    <tr key={event.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 font-mono text-slate-400">{event.timestamp}</td>
                      <td className="py-3.5 font-semibold text-white">{event.room_name}</td>
                      <td className="py-3.5 font-bold text-slate-200">{event.appliance_name}</td>
                      <td className="py-3.5 text-right text-slate-300 font-semibold">{event.duration_minutes} min</td>
                      <td className="py-3.5 text-right font-bold text-rose-400">{event.wasted_kwh.toFixed(3)} kWh</td>
                      <td className="py-3.5 text-right font-bold text-amber-400">₹{event.estimated_cost.toFixed(2)}</td>
                      <td className="py-3.5 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          event.action_taken === 'AUTO_OFF'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}>
                          {event.action_taken}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        {isDetected ? (
                          <button
                            onClick={() => handleResolve(event.id)}
                            disabled={resolvingId === event.id}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md transition-all"
                          >
                            {resolvingId === event.id ? 'Applying...' : 'Apply Smart Saving'}
                          </button>
                        ) : (
                          <span className="inline-flex items-center text-emerald-400 font-semibold text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Resolved
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
