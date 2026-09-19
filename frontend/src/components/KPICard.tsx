import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'emerald' | 'amber' | 'rose' | 'cyan' | 'indigo' | 'violet';
  badge?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  variant = 'emerald',
  badge,
}) => {
  const variantStyles = {
    emerald: {
      bg: 'from-emerald-500/10 to-transparent',
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/20 text-emerald-400',
      accentText: 'text-emerald-400',
    },
    cyan: {
      bg: 'from-cyan-500/10 to-transparent',
      border: 'border-cyan-500/20 hover:border-cyan-500/40',
      iconBg: 'bg-cyan-500/20 text-cyan-400',
      accentText: 'text-cyan-400',
    },
    amber: {
      bg: 'from-amber-500/10 to-transparent',
      border: 'border-amber-500/20 hover:border-amber-500/40',
      iconBg: 'bg-amber-500/20 text-amber-400',
      accentText: 'text-amber-400',
    },
    rose: {
      bg: 'from-rose-500/10 to-transparent',
      border: 'border-rose-500/20 hover:border-rose-500/40',
      iconBg: 'bg-rose-500/20 text-rose-400',
      accentText: 'text-rose-400',
    },
    indigo: {
      bg: 'from-indigo-500/10 to-transparent',
      border: 'border-indigo-500/20 hover:border-indigo-500/40',
      iconBg: 'bg-indigo-500/20 text-indigo-400',
      accentText: 'text-indigo-400',
    },
    violet: {
      bg: 'from-violet-500/10 to-transparent',
      border: 'border-violet-500/20 hover:border-violet-500/40',
      iconBg: 'bg-violet-500/20 text-violet-400',
      accentText: 'text-violet-400',
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-b ${style.bg} bg-slate-900/60 backdrop-blur-md border ${style.border} p-4 transition-all duration-200 shadow-sm`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline space-x-1.5 mt-1.5">
            <span className="text-2xl font-extrabold text-white tracking-tight">{value}</span>
            {unit && <span className="text-xs font-semibold text-slate-400">{unit}</span>}
          </div>
          {subtitle && (
            <p className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1">
              <span>{subtitle}</span>
            </p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${style.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {badge && (
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Status</span>
          <span className={`font-semibold ${style.accentText}`}>{badge}</span>
        </div>
      )}
    </div>
  );
};
