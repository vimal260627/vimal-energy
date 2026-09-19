import React from 'react';
import { X, Play, AlertTriangle, Zap, CheckCircle2, Sliders, RefreshCw, Layers } from 'lucide-react';

interface SimulationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerScenario: (scenario: string) => void;
  onReset: () => void;
  currentScenario: string;
}

export const SimulationDrawer: React.FC<SimulationDrawerProps> = ({
  isOpen,
  onClose,
  onTriggerScenario,
  onReset,
  currentScenario,
}) => {
  if (!isOpen) return null;

  const scenarios = [
    {
      id: 'normal',
      title: 'Scenario 1: Normal Day',
      desc: 'Nominal household schedule. Morning fan, afternoon cooling, steady refrigeration.',
      icon: Play,
      color: 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10',
    },
    {
      id: 'empty_room',
      title: 'Scenario 2: Empty Room Wastage',
      desc: 'Occupancy drops to 0 in Living Room while lights & fans remain ON -> triggers wastage alarm.',
      icon: AlertTriangle,
      color: 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10',
    },
    {
      id: 'high_ac_anomaly',
      title: 'Scenario 3: High AC Consumption Anomaly',
      desc: 'AC compressor surges to 1780W (+48%). Isolation Forest flags out-of-distribution anomaly.',
      icon: Zap,
      color: 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10',
    },
    {
      id: 'high_monthly',
      title: 'Scenario 4: High Monthly Target Overrun',
      desc: 'Month-to-date consumption spikes to 276 kWh, triggering target overrun warning banner.',
      icon: Layers,
      color: 'border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10',
    },
    {
      id: 'auto_saving',
      title: 'Scenario 5: Automatic Smart Saving',
      desc: 'Virtual Relay cuts off idle loads in empty rooms; logs verified power diff in savings ledger.',
      icon: CheckCircle2,
      color: 'border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-all">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-2.5">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="font-bold text-white text-base">Demo Simulation Control</h3>
              <p className="text-xs text-slate-400">Live Virtual Environment Controller</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-300">Active Virtual State</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase">
                {currentScenario.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Use these pre-packaged scenarios during evaluations to demonstrate real-time telemetry changes, anomaly detection, empty-room wastage, and savings verification.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Evaluation Scenarios</p>
            {scenarios.map((sc) => {
              const Icon = sc.icon;
              const isSelected = currentScenario === sc.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => {
                    onTriggerScenario(sc.id);
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${sc.color} ${
                    isSelected ? 'ring-2 ring-cyan-500/50 bg-slate-800/80 shadow-md' : 'bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg bg-slate-800 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white">{sc.title}</span>
                        {isSelected && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-400 text-slate-950 font-extrabold">
                            LIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-normal">{sc.desc}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={onReset}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Database Seed</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
