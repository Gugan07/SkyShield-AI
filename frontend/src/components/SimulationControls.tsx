import React from 'react';
import { Play, Pause, Square, RotateCcw, Zap, Gauge } from 'lucide-react';
import { SimulationStatus } from '../types/detection';

interface SimulationControlsProps {
  status: SimulationStatus | null;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onReset: () => void;
  onSpeedChange: (speed: 'slow' | 'normal' | 'fast') => void;
  onTriggerSingle: (hint?: string) => void;
  isLoading?: boolean;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  status,
  onStart,
  onPause,
  onStop,
  onReset,
  onSpeedChange,
  onTriggerSingle,
  isLoading,
}) => {
  const isRunning = status?.is_running ?? false;
  const isPaused = status?.is_paused ?? false;
  const currentSpeed = status?.speed ?? 'normal';

  return (
    <div className="defense-card p-3.5 flex flex-wrap items-center justify-between gap-3">
      {/* Primary Simulation Controls */}
      <div className="flex items-center space-x-2">
        {!isRunning || isPaused ? (
          <button
            onClick={onStart}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold font-mono tracking-wider uppercase bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all disabled:opacity-50 active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isPaused ? 'Resume' : 'Start Simulation'}</span>
          </button>
        ) : (
          <button
            onClick={onPause}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold font-mono tracking-wider uppercase bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all disabled:opacity-50 active:scale-95"
          >
            <Pause className="w-3.5 h-3.5 fill-current" />
            <span>Pause</span>
          </button>
        )}

        <button
          onClick={onStop}
          disabled={!isRunning || isLoading}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-mono tracking-wider uppercase bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all disabled:opacity-40 active:scale-95"
          title="Stop Simulation Loop"
        >
          <Square className="w-3 h-3 fill-current" />
          <span>Stop</span>
        </button>

        <button
          onClick={onReset}
          disabled={isLoading}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-mono tracking-wider uppercase bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all disabled:opacity-40 active:scale-95"
          title="Reset Target Counter"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Speed Selector */}
      <div className="flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
        <Gauge className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-[11px] font-mono text-slate-400 uppercase">Cadence:</span>
        <div className="flex items-center space-x-1">
          {(['slow', 'normal', 'fast'] as const).map((spd) => (
            <button
              key={spd}
              onClick={() => onSpeedChange(spd)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase transition-all ${
                currentSpeed === spd
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {spd}
            </button>
          ))}
        </div>
      </div>

      {/* Manual Instant Trigger (Drone / Bird / Unknown) */}
      <div className="flex items-center space-x-1.5">
        <span className="text-[11px] font-mono text-slate-400 mr-1 flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" /> Manual Inject:
        </span>
        <button
          onClick={() => onTriggerSingle('drone')}
          disabled={isLoading}
          className="px-2.5 py-1 rounded text-[11px] font-mono font-semibold bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-800/40 transition-all active:scale-95"
        >
          + Drone
        </button>
        <button
          onClick={() => onTriggerSingle('bird')}
          disabled={isLoading}
          className="px-2.5 py-1 rounded text-[11px] font-mono font-semibold bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/40 transition-all active:scale-95"
        >
          + Bird
        </button>
        <button
          onClick={() => onTriggerSingle('unknown')}
          disabled={isLoading}
          className="px-2.5 py-1 rounded text-[11px] font-mono font-semibold bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 border border-amber-800/40 transition-all active:scale-95"
        >
          + Unknown
        </button>
      </div>
    </div>
  );
};
