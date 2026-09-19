import React, { useState } from 'react';
import { Play, Sliders, Bell, Sparkles, CheckCircle, RefreshCw } from 'lucide-react';

interface HeaderProps {
  onOpenSimControls: () => void;
  onStartDemoTour: () => void;
  currentScenario: string;
  onReset: () => void;
  activeNotificationsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSimControls,
  onStartDemoTour,
  currentScenario,
  onReset,
  activeNotificationsCount,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Title & Status Badges */}
      <div className="flex items-center space-x-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-200">
            AI-Based Smart Energy Saver & Intelligent Management System
          </h2>
          <div className="flex items-center space-x-2 mt-0.5">
            {/* Simulation Mode Badge */}
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-1.5 animate-pulse" />
              SIMULATION MODE
            </span>
            {/* Current Scenario Badge */}
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
              Scenario: <span className="font-semibold text-emerald-400 ml-1 capitalize">{currentScenario.replace(/_/g, ' ')}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center space-x-3">
        {/* Quick Demo Tour */}
        <button
          onClick={onStartDemoTour}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-500/10 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive Demo Tour</span>
        </button>

        {/* Simulation Controls Drawer Trigger */}
        <button
          onClick={onOpenSimControls}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-all"
        >
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span>Sim Controls</span>
        </button>

        {/* Quick Reset */}
        <button
          onClick={onReset}
          title="Reset Simulation Data"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all relative"
          >
            <Bell className="w-4 h-4" />
            {activeNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-900" />
            )}
          </button>

          {/* Quick Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
                <span className="text-xs font-bold text-slate-200">Alerts & System Events</span>
                <span className="text-[10px] text-emerald-400 font-medium">Real-Time</span>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300">
                  <p className="font-semibold">High AC Anomaly Detected</p>
                  <p className="text-[11px] text-rose-400/90 mt-0.5">Living Room AC drawing 1780W (48% above baseline).</p>
                </div>
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
                  <p className="font-semibold">Unoccupied Room Wastage</p>
                  <p className="text-[11px] text-amber-400/90 mt-0.5">Living room light active 42m with 0 occupancy.</p>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                  <p className="font-semibold">Verified Smart Saving</p>
                  <p className="text-[11px] text-emerald-400/90 mt-0.5">Auto-relays cut 1200W load. Saved ₹5.25.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
