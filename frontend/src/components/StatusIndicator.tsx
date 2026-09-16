import React from 'react';

interface StatusIndicatorProps {
  status: 'ONLINE' | 'OFFLINE' | 'WARNING' | 'STANDBY';
  label: string;
  size?: 'sm' | 'md';
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, label, size = 'sm' }) => {
  const getColors = () => {
    switch (status) {
      case 'ONLINE':
        return {
          dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]',
          ping: 'bg-emerald-400',
          text: 'text-emerald-400',
        };
      case 'WARNING':
        return {
          dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]',
          ping: 'bg-amber-400',
          text: 'text-amber-400',
        };
      case 'STANDBY':
        return {
          dot: 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]',
          ping: 'bg-cyan-400',
          text: 'text-cyan-400',
        };
      case 'OFFLINE':
      default:
        return {
          dot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]',
          ping: 'bg-rose-500',
          text: 'text-rose-400',
        };
    }
  };

  const colors = getColors();

  return (
    <div className="flex items-center space-x-2 bg-slate-900/60 px-2.5 py-1 rounded-full border border-slate-800">
      <span className="relative flex h-2 w-2">
        {status === 'ONLINE' && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors.ping} opacity-75`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${colors.dot}`} />
      </span>
      <span className={`text-xs font-mono font-medium ${colors.text}`}>
        {label}
      </span>
    </div>
  );
};
