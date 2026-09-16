import React from 'react';
import { Crosshair, Wind, Radio, Clock, ShieldAlert, Cpu } from 'lucide-react';
import { Detection } from '../types/detection';
import { formatRange, formatVelocity, formatConfidence, formatTimestamp, getTargetBadgeColor } from '../utils/formatters';

interface TargetCardProps {
  detection: Detection | null;
  isLoading?: boolean;
}

export const TargetCard: React.FC<TargetCardProps> = ({ detection, isLoading }) => {
  if (!detection) {
    return (
      <div className="defense-card p-6 flex flex-col items-center justify-center min-h-[360px] text-center border-dashed border-slate-800">
        <div className="w-14 h-14 rounded-full bg-slate-800/40 flex items-center justify-center text-slate-500 mb-3 animate-pulse">
          <Crosshair className="w-7 h-7" />
        </div>
        <h3 className="text-sm font-semibold text-slate-300">No Target Tracked</h3>
        <p className="text-xs text-slate-500 max-w-xs mt-1">
          Click <strong className="text-cyan-400">"Start Simulation"</strong> or trigger an observation to detect and classify aerial targets.
        </p>
      </div>
    );
  }

  const badge = getTargetBadgeColor(detection.classification);
  const microDopplerStatus =
    detection.classification === 'DRONE'
      ? 'High-Frequency Propeller Harmonics'
      : detection.classification === 'BIRD'
      ? 'Low-Frequency Wing Flapping'
      : 'No Coherent Micro-Motion';

  return (
    <div className={`defense-card p-5 border relative overflow-hidden transition-all duration-300 ${badge.border}`}>
      {/* Target Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
        <div className="flex items-center space-x-2.5">
          <span className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${badge.dot} opacity-75`} />
            <span className={`relative inline-flex rounded-full h-3 w-3 ${badge.dot}`} />
          </span>
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Active Track ID
            </div>
            <div className="text-sm font-bold font-mono text-white">
              {detection.target_id}
            </div>
          </div>
        </div>

        <div className={`px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase border flex items-center gap-1.5 ${badge.bg} ${badge.text} ${badge.border}`}>
          <ShieldAlert className="w-3.5 h-3.5" />
          {detection.classification}
        </div>
      </div>

      {/* Primary Classification & Confidence */}
      <div className="mb-4">
        <div className="flex justify-between items-end mb-1.5">
          <span className="text-xs font-medium text-slate-400">Classification Confidence</span>
          <span className="text-xl font-bold font-mono text-white">
            {formatConfidence(detection.confidence)}
          </span>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              detection.classification === 'DRONE'
                ? 'bg-gradient-to-r from-red-600 to-rose-400 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                : detection.classification === 'BIRD'
                ? 'bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                : 'bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
            }`}
            style={{ width: `${Math.min(100, Math.max(5, detection.confidence * 100))}%` }}
          />
        </div>
      </div>

      {/* Kinematics Telemetry Grid */}
      <div className="grid grid-cols-2 gap-2.5 my-4">
        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
          <div className="flex items-center text-slate-400 text-[11px] mb-1">
            <Crosshair className="w-3 h-3 text-cyan-400 mr-1.5" />
            Target Range
          </div>
          <div className="text-base font-mono font-bold text-white">
            {formatRange(detection.range_m)}
          </div>
        </div>

        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
          <div className="flex items-center text-slate-400 text-[11px] mb-1">
            <Wind className="w-3 h-3 text-cyan-400 mr-1.5" />
            Radial Velocity
          </div>
          <div className="text-base font-mono font-bold text-white">
            {formatVelocity(detection.velocity_ms)}
          </div>
        </div>

        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
          <div className="flex items-center text-slate-400 text-[11px] mb-1">
            <Radio className="w-3 h-3 text-cyan-400 mr-1.5" />
            Signal Power
          </div>
          <div className="text-base font-mono font-bold text-white">
            {detection.signal_strength_db} dBm
          </div>
        </div>

        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
          <div className="flex items-center text-slate-400 text-[11px] mb-1">
            <Clock className="w-3 h-3 text-cyan-400 mr-1.5" />
            Detection Time
          </div>
          <div className="text-base font-mono font-bold text-white">
            {formatTimestamp(detection.timestamp)}
          </div>
        </div>
      </div>

      {/* Micro-Doppler Motion State */}
      <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-xs space-y-1.5 mb-4">
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            Micro-Doppler State:
          </span>
          <span className="text-[11px] font-mono text-emerald-400 font-semibold">
            DETECTED
          </span>
        </div>
        <p className="text-[11px] font-mono text-slate-300">
          {microDopplerStatus}
        </p>
      </div>

      {/* Softmax Probabilities Breakdown */}
      {detection.probabilities && (
        <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
          <div className="text-[10px] font-mono uppercase text-slate-400">
            Softmax Calibrated Probabilities
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
            <div className="bg-red-950/30 border border-red-800/30 rounded p-1.5">
              <div className="text-[10px] text-red-400">DRONE</div>
              <div className="font-bold text-white">{(detection.probabilities.drone * 100).toFixed(1)}%</div>
            </div>
            <div className="bg-cyan-950/30 border border-cyan-800/30 rounded p-1.5">
              <div className="text-[10px] text-cyan-400">BIRD</div>
              <div className="font-bold text-white">{(detection.probabilities.bird * 100).toFixed(1)}%</div>
            </div>
            <div className="bg-amber-950/30 border border-amber-800/30 rounded p-1.5">
              <div className="text-[10px] text-amber-400">UNKNOWN</div>
              <div className="font-bold text-white">{(detection.probabilities.unknown * 100).toFixed(1)}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
