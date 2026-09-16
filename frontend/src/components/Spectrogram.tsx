import React, { useRef, useEffect, useState } from 'react';
import { SpectrogramData, TargetType } from '../types/detection';
import { defenseRadarColormap, plasmaColormap } from '../utils/colormaps';
import { Activity, Sliders, Info } from 'lucide-react';

interface SpectrogramProps {
  data?: SpectrogramData;
  targetType?: TargetType;
  title?: string;
  colormapType?: 'defense' | 'plasma';
}

export const Spectrogram: React.FC<SpectrogramProps> = ({
  data,
  targetType = 'DRONE',
  title = 'Micro-Doppler Signature',
  colormapType = 'defense',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoverInfo, setHoverInfo] = useState<{
    time: number;
    freq: number;
    val: number;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || !data.matrix || data.matrix.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const numFreqBins = data.matrix.length;
    const numTimeBins = data.matrix[0].length;

    const width = canvas.width;
    const height = canvas.height;

    // Create offscreen image data
    const imgData = ctx.createImageData(width, height);
    const colormapFn = colormapType === 'plasma' ? plasmaColormap : defenseRadarColormap;

    // Map each screen pixel to the downsampled matrix with bilinear/nearest interpolation
    for (let py = 0; py < height; py++) {
      // Invert Y so highest frequency is at the top, lowest at bottom
      const freqIdx = Math.floor(((height - 1 - py) / height) * numFreqBins);
      const clampedFreqIdx = Math.min(numFreqBins - 1, Math.max(0, freqIdx));

      for (let px = 0; px < width; px++) {
        const timeIdx = Math.floor((px / width) * numTimeBins);
        const clampedTimeIdx = Math.min(numTimeBins - 1, Math.max(0, timeIdx));

        const intensity = data.matrix[clampedFreqIdx][clampedTimeIdx] ?? 0;
        const [r, g, b] = colormapFn(intensity);

        const pixelIndex = (py * width + px) * 4;
        imgData.data[pixelIndex] = r;
        imgData.data[pixelIndex + 1] = g;
        imgData.data[pixelIndex + 2] = b;
        imgData.data[pixelIndex + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);

    // Draw zero-Doppler horizontal centerline
    const zeroY = height / 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, zeroY);
    ctx.lineTo(width, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Visual annotations based on target type
    if (targetType === 'DRONE') {
      // Highlight high-frequency propeller blade harmonics
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      // Upper blade flash harmonic line
      ctx.beginPath();
      ctx.moveTo(0, zeroY - height * 0.3);
      ctx.lineTo(width, zeroY - height * 0.3);
      ctx.stroke();
      // Lower blade flash harmonic line
      ctx.beginPath();
      ctx.moveTo(0, zeroY + height * 0.3);
      ctx.lineTo(width, zeroY + height * 0.3);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (targetType === 'BIRD') {
      // Highlight slow sinusoidal wing-flapping envelope
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let px = 0; px < width; px++) {
        const wave = Math.sin((px / width) * Math.PI * 4) * (height * 0.18);
        const py = zeroY + wave;
        if (px === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  }, [data, targetType, colormapType]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !data || !data.freq_bins || !data.time_bins) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const numFreqBins = data.matrix.length;
    const numTimeBins = data.matrix[0].length;

    const timeRatio = Math.max(0, Math.min(1, x / rect.width));
    const freqRatio = Math.max(0, Math.min(1, (rect.height - y) / rect.height));

    const timeIdx = Math.floor(timeRatio * (numTimeBins - 1));
    const freqIdx = Math.floor(freqRatio * (numFreqBins - 1));

    const time = data.time_bins[timeIdx] ?? 0;
    const freq = data.freq_bins[freqIdx] ?? 0;
    const val = data.matrix[freqIdx]?.[timeIdx] ?? 0;

    setHoverInfo({ time, freq, val, x, y });
  };

  const handleMouseLeave = () => {
    setHoverInfo(null);
  };

  return (
    <div className="defense-card p-5 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-800 gap-2">
        <div className="flex items-center space-x-2.5">
          <Activity className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              {title}
              {targetType && (
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                    targetType === 'DRONE'
                      ? 'bg-red-500/10 text-red-400 border-red-500/30'
                      : targetType === 'BIRD'
                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {targetType} PATTERN
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">
              STFT Time-Frequency Heatmap: Window: Hann (256-pt) | Overlap: 75% | PRF: 2 kHz
            </p>
          </div>
        </div>

        {/* Dynamic Pattern Annotation Callout */}
        <div className="text-right font-mono text-xs">
          {targetType === 'DRONE' ? (
            <span className="text-red-400 font-medium">
              ● Propeller Blade Harmonics (~100-300 Hz)
            </span>
          ) : targetType === 'BIRD' ? (
            <span className="text-cyan-400 font-medium">
              ● Sinusoidal Wing Flapping (~3-5 Hz)
            </span>
          ) : (
            <span className="text-amber-400 font-medium">
              ● Diffuse Noise / Non-Periodic
            </span>
          )}
        </div>
      </div>

      {/* Spectrogram Canvas and Axes */}
      <div className="flex gap-2">
        {/* Y-Axis Label & Ticks */}
        <div className="flex flex-col justify-between items-end text-[10px] font-mono text-slate-400 w-16 py-1 select-none">
          <span>+1000 Hz</span>
          <span>+500 Hz</span>
          <span className="text-cyan-400 font-bold">0 Hz (Body)</span>
          <span>-500 Hz</span>
          <span>-1000 Hz</span>
        </div>

        {/* Canvas Area */}
        <div className="relative flex-1 aspect-[16/7] bg-slate-950 rounded-lg overflow-hidden border border-slate-800 shadow-inner">
          {data ? (
            <canvas
              ref={canvasRef}
              width={640}
              height={280}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="w-full h-full cursor-crosshair"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-xs">
              <Activity className="w-8 h-8 mb-2 animate-pulse text-slate-600" />
              <span>Awaiting radar signal frame for STFT processing...</span>
            </div>
          )}

          {/* Hover Crosshair Inspector Tooltip */}
          {hoverInfo && (
            <div
              className="absolute pointer-events-none bg-slate-950/95 border border-cyan-500/40 rounded px-2.5 py-1.5 text-[11px] font-mono shadow-2xl text-slate-200 z-20"
              style={{
                left: Math.min(hoverInfo.x + 12, 450),
                top: Math.max(hoverInfo.y - 45, 10),
              }}
            >
              <div>Time: <strong className="text-white">{hoverInfo.time.toFixed(3)}s</strong></div>
              <div>Doppler: <strong className="text-cyan-400">{hoverInfo.freq.toFixed(1)} Hz</strong></div>
              <div>Normalized Power: <strong className="text-emerald-400">{(hoverInfo.val * 100).toFixed(0)}%</strong></div>
            </div>
          )}
        </div>

        {/* Colorbar Intensity Legend */}
        <div className="flex flex-col items-center justify-between text-[9px] font-mono text-slate-400 w-8 py-1 select-none">
          <span>0 dB</span>
          <div className="w-2.5 h-full rounded-full bg-gradient-to-t from-[#0a1428] via-[#06b6d4] to-[#ffea75] my-1 border border-slate-700/50" />
          <span>-45 dB</span>
        </div>
      </div>

      {/* X-Axis Time Ticks */}
      <div className="flex justify-between pl-16 pr-10 pt-1 text-[10px] font-mono text-slate-400 select-none">
        <span>0.00s</span>
        <span>0.10s</span>
        <span>0.20s</span>
        <span>0.30s</span>
        <span>0.40s</span>
        <span>0.51s (Observation Duration)</span>
      </div>

      {/* Footer Pipeline Info */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400">
        <span className="flex items-center gap-1.5 text-slate-400">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          STFT Algorithm: <span className="text-slate-300">scipy.signal.stft()</span>
        </span>
        <span className="text-cyan-300/80">
          Normalized Log-Magnitude Spectrum (dB)
        </span>
      </div>
    </div>
  );
};
