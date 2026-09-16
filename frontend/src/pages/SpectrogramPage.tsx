import React, { useState } from 'react';
import { useLiveDetection } from '../hooks/useLiveDetection';
import { Spectrogram } from '../components/Spectrogram';
import { Activity, Sliders, Waves, Play, Info, Sparkles } from 'lucide-react';

export const SpectrogramPage: React.FC = () => {
  const { latestDetection, triggerSingleFrame, isLoading } = useLiveDetection();
  const [colormap, setColormap] = useState<'defense' | 'plasma'>('defense');

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            Micro-Doppler Signature Analysis Laboratory
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Time-Frequency Representation via Short-Time Fourier Transform (STFT)
          </p>
        </div>

        {/* Colormap Selector & Test Injections */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <span className="text-slate-400 px-2">Palette:</span>
            <button
              onClick={() => setColormap('defense')}
              className={`px-2.5 py-1 rounded transition-all ${
                colormap === 'defense'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Defense Cyan
            </button>
            <button
              onClick={() => setColormap('plasma')}
              className={`px-2.5 py-1 rounded transition-all ${
                colormap === 'plasma'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Plasma Heatmap
            </button>
          </div>

          <button
            onClick={() => triggerSingleFrame('drone')}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-red-950/70 hover:bg-red-900 text-red-300 border border-red-800/60 transition-all active:scale-95"
          >
            Generate Drone STFT
          </button>
          <button
            onClick={() => triggerSingleFrame('bird')}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/60 transition-all active:scale-95"
          >
            Generate Bird STFT
          </button>
        </div>
      </div>

      {/* Live Spectrogram Canvas */}
      <Spectrogram
        data={latestDetection?.spectrogram}
        targetType={latestDetection?.classification}
        title="Active Observation Micro-Doppler Heatmap"
        colormapType={colormap}
      />

      {/* Physics Concept Comparison: Drone vs Bird Micro-Doppler */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Drone Card */}
        <div className="defense-card p-5 border-l-4 border-l-red-500 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              DRONE Micro-Doppler Dynamics
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
              ROTATING BLADES
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Multi-rotor drones have 2 to 8 rotor hubs rotating at <strong>4,000–9,000 RPM</strong> (80–150 Hz). The rotor blades act as high-speed specular reflectors, generating <strong>periodic blade-flash harmonics</strong> that appear as symmetric, rapid horizontal sideband lines around the target's bulk Doppler frequency.
          </p>
          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 text-[11px] font-mono space-y-1 text-slate-400">
            <div>• Chopping Frequency: <strong className="text-red-400">f_chop = N_blades × f_rot (160–300 Hz)</strong></div>
            <div>• Tip Doppler Spread: <strong className="text-white">Δf = 2 v_tip / λ (up to 400 Hz)</strong></div>
            <div>• Temporal Envelope: <strong className="text-white">Strictly periodic & stationary</strong></div>
          </div>
        </div>

        {/* Bird Card */}
        <div className="defense-card p-5 border-l-4 border-l-cyan-500 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              BIRD Micro-Doppler Dynamics
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              WING FLAPPING
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Birds generate micro-Doppler returns predominantly from periodic <strong>wing flapping motion (2–6 Hz)</strong>. Because biological wing deformation exhibits distinct upstroke and downstroke kinematics, the resulting spectrogram forms a slow, continuous sinusoidal undulating envelope with natural cycle-to-cycle variation.
          </p>
          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 text-[11px] font-mono space-y-1 text-slate-400">
            <div>• Flapping Frequency: <strong className="text-cyan-400">f_flap = 2.5–5.5 Hz</strong></div>
            <div>• Modulation Pattern: <strong className="text-white">Asymmetric sinusoidal oscillation</strong></div>
            <div>• Temporal Envelope: <strong className="text-white">Non-rigid bio-mechanical variance</strong></div>
          </div>
        </div>
      </div>

      {/* Signal Processing Mathematical Pipeline Breakdown */}
      <div className="defense-card p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          Mathematical STFT Micro-Doppler Pipeline
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
            <span className="text-cyan-400 font-bold block mb-1">1. Windowing (Hann)</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Multiplies 256-sample segments by a Hann taper w(n) to suppress spectral leakage across sidelobes.
            </p>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
            <span className="text-cyan-400 font-bold block mb-1">2. STFT Computation</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Computes scipy.signal.stft with 75% overlap (192 samples) for smooth temporal interpolation.
            </p>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
            <span className="text-cyan-400 font-bold block mb-1">3. Log dB Compression</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Converts complex |Z_xx| to 20·log10(|Z_xx| + ε) with dynamic range clipping to the top 45 dB.
            </p>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
            <span className="text-cyan-400 font-bold block mb-1">4. Feature Extraction</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Computes spectral centroid, bandwidth, harmonic ratio, and autocorrelation modulation frequency.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
