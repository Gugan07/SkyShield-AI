import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Radar,
  Activity,
  History,
  BarChart3,
  Cpu,
  Settings,
  ShieldAlert,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Live Detection', path: '/live', icon: Radar },
  { name: 'Spectrogram', path: '/spectrogram', icon: Activity },
  { name: 'Detection History', path: '/history', icon: History },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Model Information', path: '/model', icon: Cpu },
  { name: 'System Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 border-r border-slate-800/80 bg-slate-950/60 backdrop-blur-md flex flex-col justify-between shrink-0 min-h-[calc(100vh-61px)]">
      <div className="p-4 space-y-6">
        <div className="px-3 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
          Tactical Navigation
        </div>
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer System Notice */}
      <div className="p-4 m-3 rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-slate-400 space-y-2">
        <div className="flex items-center space-x-1.5 text-slate-300 font-semibold">
          <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
          <span>Notice & Scope</span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-400">
          Detection and classification prototype only. Strictly no weapon, jamming, or countermeasure capabilities.
        </p>
      </div>
    </aside>
  );
};
