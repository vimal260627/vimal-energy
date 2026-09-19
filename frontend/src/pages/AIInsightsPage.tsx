import React, { useState, useEffect } from 'react';
import { BrainCircuit, AlertTriangle, ShieldAlert, Sparkles, CheckCircle2, ChevronRight, Activity } from 'lucide-react';
import { Anomaly, Recommendation } from '../types';
import { api } from '../api/client';

export const AIInsightsPage: React.FC = () => {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('ALL');

  useEffect(() => {
    Promise.all([api.getAnomalies(), api.getRecommendations()])
      .then(([anom, recs]) => {
        setAnomalies(anom);
        setRecommendations(recs);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredAnomalies = anomalies.filter(
    (a) => severityFilter === 'ALL' || a.severity === severityFilter
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <BrainCircuit className="w-5 h-5 text-indigo-400" />
            <span>AI Energy Insights & Anomaly Detection</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Machine learning unsupervised Isolation Forest models, learned operational baselines, and data-grounded recommendations.
          </p>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((s) => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                severityFilter === s
                  ? s === 'HIGH'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : s === 'MEDIUM'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Model Overview Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start space-x-3">
          <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white">Isolation Forest Algorithm</span>
            <p className="text-[11px] text-slate-400 mt-1 leading-normal">
              Continuously scores active loads against diurnal distributions to isolate unusual mechanical or electrical draws.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start space-x-3">
          <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white">Baseline Deviation</span>
            <p className="text-[11px] text-slate-400 mt-1 leading-normal">
              Identifies compressors, motors, and cooling coils drawing &gt;15% above empirical baseline power curves.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start space-x-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white">Actionable Recommendations</span>
            <p className="text-[11px] text-slate-400 mt-1 leading-normal">
              Cross-references temperature, occupancy, and tariffs to formulate targeted savings opportunities.
            </p>
          </div>
        </div>
      </div>

      {/* Isolation Forest Anomaly Detection Log */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Detected Electrical Anomalies</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {filteredAnomalies.length} Records
              </span>
            </h3>
            <p className="text-xs text-slate-400">Flagged when instantaneous draw exceeds learned operational bounds</p>
          </div>
        </div>

        <div className="space-y-3 mt-4">
          {loading ? (
            <div className="text-center py-10 text-slate-400 text-xs">Scanning historical readings...</div>
          ) : filteredAnomalies.length === 0 ? (
            <div className="text-center py-10 text-emerald-400 text-xs flex items-center justify-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>No anomalies detected matching severity filter. All equipment nominal.</span>
            </div>
          ) : (
            filteredAnomalies.map((anom) => {
              const isHigh = anom.severity === 'HIGH';
              const isMed = anom.severity === 'MEDIUM';
              const badgeStyle = isHigh
                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                : isMed
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';

              return (
                <div
                  key={anom.id}
                  className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${badgeStyle}`}>
                        {anom.severity} SEVERITY
                      </span>
                      <h4 className="text-sm font-bold text-white">{anom.appliance_name}</h4>
                      <span className="text-xs text-slate-400">• {anom.room_name}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-normal">{anom.description}</p>
                    <div className="flex items-center space-x-4 text-[11px] text-slate-400 pt-1">
                      <span>Detected: <strong className="text-white">{anom.detected_power_w} W</strong></span>
                      <span>Learned Baseline: <strong className="text-slate-300">{anom.baseline_power_w} W</strong></span>
                      <span>Timestamp: <span className="font-mono text-slate-400">{anom.timestamp}</span></span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                      anom.status === 'ACTIVE'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {anom.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* AI Recommendations Feed */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Prioritized AI Energy Saving Recommendations</span>
            </h3>
            <p className="text-xs text-slate-400">Contextual optimizations to reduce grid demand and power bills</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-emerald-500/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                    {rec.category}
                  </span>
                  <span className="text-xs font-bold text-emerald-400">
                    Save ~{rec.potential_saving_kwh} kWh/mo
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white mt-2">{rec.title}</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{rec.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  Estimated Financial Value: <strong className="text-amber-400">₹{rec.potential_saving_cost.toFixed(0)}/mo</strong>
                </span>
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center">
                  Recommended <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
