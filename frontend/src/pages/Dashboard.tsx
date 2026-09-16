import React from 'react';
import { useLiveDetection } from '../hooks/useLiveDetection';
import { StatCard } from '../components/StatCard';
import { TargetCard } from '../components/TargetCard';
import { RadarView } from '../components/RadarView';
import { Spectrogram } from '../components/Spectrogram';
import { SimulationControls } from '../components/SimulationControls';
import {
  ShieldAlert,
  Bird,
  HelpCircle,
  Percent,
  AlertOctagon,
  Radar as RadarIcon,
  Activity,
  History,
} from 'lucide-react';
import { formatConfidence } from '../utils/formatters';

export const Dashboard: React.FC = () => {
  const {
    latestDetection,
    recentDetections,
    simulationStatus,
    statistics,
    isLoading,
    startSimulation,
    pauseSimulation,
    stopSimulation,
    resetSimulation,
    changeSpeed,
    triggerSingleFrame,
  } = useLiveDetection();

  const totalDetections = statistics?.total_detections ?? 0;
  const dronesDetected = statistics?.drones_detected ?? 0;
  const birdsDetected = statistics?.birds_detected ?? 0;
  const unknownTargets = statistics?.unknown_targets ?? 0;
  const avgConfidence = statistics?.average_confidence ? formatConfidence(statistics.average_confidence) : '0.0%';
  const falseAlarmRate = statistics ? `${statistics.false_alarm_rate_percent.toFixed(1)}%` : '0.0%';

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Simulation Engine Controls Bar */}
      <SimulationControls
        status={simulationStatus}
        onStart={startSimulation}
        onPause={pauseSimulation}
        onStop={stopSimulation}
        onReset={resetSimulation}
        onSpeedChange={changeSpeed}
        onTriggerSingle={triggerSingleFrame}
        isLoading={isLoading}
      />

      {/* Statistics Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Detections"
          value={totalDetections}
          icon={RadarIcon}
          variant="cyan"
          subtitle="All radar scans"
        />
        <StatCard
          title="Drones Detected"
          value={dronesDetected}
          icon={ShieldAlert}
          variant="red"
          badge="High Threat"
          subtitle="Blade micro-Doppler"
        />
        <StatCard
          title="Birds Detected"
          value={birdsDetected}
          icon={Bird}
          variant="green"
          badge="Biological"
          subtitle="Wing-flapping motion"
        />
        <StatCard
          title="Unknown Targets"
          value={unknownTargets}
          icon={HelpCircle}
          variant="amber"
          badge="Low Conf"
          subtitle="Clutter / ambiguous"
        />
        <StatCard
          title="Avg Confidence"
          value={avgConfidence}
          icon={Percent}
          variant="blue"
          subtitle="Classifier certainty"
        />
        <StatCard
          title="False Alarm Rate"
          value={falseAlarmRate}
          icon={AlertOctagon}
          variant="amber"
          subtitle="Clutter ratio"
        />
      </div>

      {/* Main Dual-Column Operational Section: Radar Scope & Target Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Radar View (PPI Scope) */}
        <div className="lg:col-span-7">
          <RadarView
            targets={recentDetections}
            activeTarget={latestDetection}
            maxRangeMeters={200}
          />
        </div>

        {/* Live Target Card */}
        <div className="lg:col-span-5">
          <TargetCard detection={latestDetection} isLoading={isLoading} />
        </div>
      </div>

      {/* Micro-Doppler Spectrogram Section */}
      <div>
        <Spectrogram
          data={latestDetection?.spectrogram}
          targetType={latestDetection?.classification}
          title="Real-Time Micro-Doppler Time-Frequency Signature"
          colormapType="defense"
        />
      </div>

      {/* Recent Detections Quick Ticker */}
      <div className="defense-card p-4">
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800 text-xs font-mono">
          <span className="text-cyan-400 font-semibold flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            LIVE TELEMETRY STREAM (LAST 5 OBSERVATIONS)
          </span>
          <span className="text-slate-400">
            AUTO-STREAMING VIA WEBSOCKET
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {recentDetections.slice(0, 5).map((det) => (
            <div
              key={det.target_id}
              className={`p-3 rounded-lg border text-xs font-mono bg-slate-950/60 ${
                det.classification === 'DRONE'
                  ? 'border-red-500/30 text-red-300'
                  : det.classification === 'BIRD'
                  ? 'border-cyan-500/30 text-cyan-300'
                  : 'border-amber-500/30 text-amber-300'
              }`}
            >
              <div className="flex justify-between items-center font-bold">
                <span>{det.target_id}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900">
                  {det.classification}
                </span>
              </div>
              <div className="mt-2 space-y-0.5 text-slate-400 text-[11px]">
                <div>Conf: <strong className="text-white">{(det.confidence * 100).toFixed(1)}%</strong></div>
                <div>Range: <strong className="text-white">{det.range_m}m</strong></div>
                <div>Vel: <strong className="text-white">{det.velocity_ms}m/s</strong></div>
              </div>
            </div>
          ))}
          {recentDetections.length === 0 && (
            <div className="col-span-5 text-center py-4 text-xs text-slate-500">
              Start simulation to view live incoming target stream.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
