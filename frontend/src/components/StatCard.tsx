import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'cyan' | 'red' | 'green' | 'amber' | 'blue';
  badge?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'cyan',
  badge,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'red':
        return {
          border: 'border-red-500/20 hover:border-red-500/40',
          iconBg: 'bg-red-500/10 text-red-400 border border-red-500/20',
          glow: 'group-hover:shadow-[0_0_20px_rgba(239,68,68,0.15)]',
          badge: 'bg-red-500/10 text-red-400 border-red-500/30',
        };
      case 'green':
        return {
          border: 'border-emerald-500/20 hover:border-emerald-500/40',
          iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
          glow: 'group-hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]',
          badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        };
      case 'amber':
        return {
          border: 'border-amber-500/20 hover:border-amber-500/40',
          iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
          glow: 'group-hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]',
          badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        };
      case 'blue':
        return {
          border: 'border-blue-500/20 hover:border-blue-500/40',
          iconBg: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
          glow: 'group-hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]',
          badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        };
      case 'cyan':
      default:
        return {
          border: 'border-cyan-500/20 hover:border-cyan-500/40',
          iconBg: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
          glow: 'group-hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]',
          badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className={`group defense-card p-4 transition-all duration-200 ${styles.border} ${styles.glow}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {title}
          </p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-white">
              {value}
            </span>
            {badge && (
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${styles.badge}`}
              >
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-[11px] text-slate-400 tracking-tight">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg ${styles.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
