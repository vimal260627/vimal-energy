import React from 'react';
import {
  LayoutDashboard,
  Zap,
  ArrowLeftRight,
  BrainCircuit,
  AlertTriangle,
  TrendingUp,
  Sliders,
  ShieldCheck,
  Receipt,
  Leaf,
  FileText,
  Settings
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  anomaliesCount: number;
  wastageCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  anomaliesCount,
  wastageCount,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'appliances', label: 'Appliances', icon: Zap },
    { id: 'comparison', label: 'Month Comparison', icon: ArrowLeftRight },
    { id: 'ai-insights', label: 'AI Insights & Anomalies', icon: BrainCircuit, badge: anomaliesCount },
    { id: 'wastage', label: 'Wastage Detection', icon: AlertTriangle, badge: wastageCount, badgeColor: 'bg-rose-500' },
    { id: 'forecast', label: 'Forecast & Targets', icon: TrendingUp },
    { id: 'what-if', label: 'What-If Simulator', icon: Sliders },
    { id: 'savings', label: 'Savings Verification', icon: ShieldCheck },
    { id: 'billing', label: 'Electricity Bill', icon: Receipt },
    { id: 'environmental', label: 'Environmental Impact', icon: Leaf },
    { id: 'reports', label: 'Reports & Audits', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800/80 flex flex-col shrink-0 h-screen sticky top-0 z-30">
      {/* Brand & Logo */}
      <div className="p-5 border-b border-slate-800/80 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-white text-base leading-tight tracking-tight">VimalEnergy AI</h1>
          <p className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">Smart Grid 2026</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full text-white ${item.badgeColor || 'bg-amber-500'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Hardware Migration Footnote */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-300">IoT Architecture Ready</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-normal">
          Software simulation active. Compatible with ESP32 & MQTT telemetry payloads.
        </p>
      </div>
    </aside>
  );
};
