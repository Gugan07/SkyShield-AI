import React, { useState } from 'react';
import { useLiveDetection } from '../hooks/useLiveDetection';
import { RadarView } from '../components/RadarView';
import { TargetCard } from '../components/TargetCard';
import { Spectrogram } from '../components/Spectrogram';
import { SimulationControls } from '../components/SimulationControls';
import { Volume2, VolumeX, Radio, Crosshair, Cpu } from 'lucide-react';

export const LiveDetection: React.FC = () => {
  const {
    latestDetection,
    recentDetections,
    simulationStatus,
    isLoading,
    startSimulation,
    pauseSimulation,
    stopSimulation,
    resetSimulation,
    changeSpeed,
    triggerSingleFrame,
  } = useLiveDetection();

  const [soundEnabled, setSoundEnabled] = useState(false);

  const playDopplerTone = () => {
    if (!latestDetection) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      // Pitch based on target velocity + micro-motion
      const baseFreq = 200 + Math.abs(latestDetection.velocity_ms) * 25;
      osc.type = latestDetection.classification === 'DRONE' ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(baseFreq, audioCtx.currentTime);

      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.warn('Audio tone error:', e);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Tactical Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400" />
            Live Tactical Target Interceptor & Classifier
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            FMCW 24 GHz Beam Tracking | Real-Time Micro-Doppler Feature Extraction
          </p>
        </div>

        {/* Audio Doppler Synthesizer Tone Button */}
        <div className="flex items-center space-x-3">
          <button
            onClick={playDopplerTone}
            disabled={!latestDetection}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-700/50 shadow-sm transition-all disabled:opacity-40"
          >
            <Volume2 className="w-4 h-4 text-cyan-400" />
            <span>Play Doppler Audio Pitch</span>
          </button>
        </div>
      </div>

      {/* Control Toolbar */}
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

      {/* Main Tactical Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Large Radar Scope */}
        <div className="lg:col-span-7">
          <RadarView
            targets={recentDetections}
            activeTarget={latestDetection}
            maxRangeMeters={200}
          />
        </div>

        {/* Target Details & Kinematic Telemetry */}
        <div className="lg:col-span-5 space-y-4">
          <TargetCard detection={latestDetection} isLoading={isLoading} />

          {/* Micro-Doppler Physics Breakdown */}
          {latestDetection?.features && (
            <div className="defense-card p-4 space-y-2.5 text-xs font-mono">
              <div className="flex items-center justify-between text-cyan-400 font-bold border-b border-slate-800 pb-2">
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-4 h-4" /> EXTRACTED SPECTRAL FEATURES
                </span>
                <span className="text-[10px] text-slate-400">PHYSICS HEURISTICS</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                  <span className="text-slate-400">Spectral Centroid:</span>
                  <div className="font-bold text-white mt-0.5">
                    {latestDetection.features.spectral_centroid_hz} Hz
                  </div>
                </div>
                <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                  <span className="text-slate-400">Spectral Bandwidth:</span>
                  <div className="font-bold text-white mt-0.5">
                    {latestDetection.features.spectral_bandwidth_hz} Hz
                  </div>
                </div>
                <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                  <span className="text-slate-400">Harmonic Energy Ratio:</span>
                  <div className="font-bold text-cyan-300 mt-0.5">
                    {latestDetection.features.harmonic_energy_ratio}
                  </div>
                </div>
                <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                  <span className="text-slate-400">Modulation Freq:</span>
                  <div className="font-bold text-amber-300 mt-0.5">
                    {latestDetection.features.modulation_frequency_hz} Hz
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Spectrogram Visualization */}
      <Spectrogram
        data={latestDetection?.spectrogram}
        targetType={latestDetection?.classification}
        title="Micro-Doppler Time-Frequency Signature"
        colormapType="defense"
      />
    </div>
  );
};
