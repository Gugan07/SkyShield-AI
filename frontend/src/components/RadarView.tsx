import React, { useRef, useEffect } from 'react';
import { Detection } from '../types/detection';

interface RadarViewProps {
  targets: Detection[];
  activeTarget: Detection | null;
  maxRangeMeters?: number;
}

export const RadarView: React.FC<RadarViewProps> = ({
  targets,
  activeTarget,
  maxRangeMeters = 200,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sweepAngleRef = useRef<number>(0);

  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(centerX, centerY) - 25;

      // Clear with dark tactical background
      ctx.fillStyle = '#060a12';
      ctx.fillRect(0, 0, width, height);

      // Radar Screen Outer Glow
      const screenGrad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, radius);
      screenGrad.addColorStop(0, 'rgba(6, 182, 212, 0.05)');
      screenGrad.addColorStop(0.8, 'rgba(6, 182, 212, 0.02)');
      screenGrad.addColorStop(1, 'rgba(15, 23, 42, 0.6)');
      ctx.fillStyle = screenGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Range Rings (50m, 100m, 150m, 200m)
      const ringSteps = [50, 100, 150, 200];
      ctx.lineWidth = 1;
      ringSteps.forEach((rng) => {
        const r = (rng / maxRangeMeters) * radius;
        ctx.strokeStyle = rng === maxRangeMeters ? 'rgba(6, 182, 212, 0.4)' : 'rgba(30, 41, 59, 0.7)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.stroke();

        // Range Label
        ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
        ctx.font = '10px monospace';
        ctx.fillText(`${rng}m`, centerX + 4, centerY - r + 12);
      });

      // Azimuth radial grid lines (every 45 degrees)
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.6)';
      for (let deg = 0; deg < 360; deg += 45) {
        const rad = (deg * Math.PI) / 180;
        const x = centerX + Math.cos(rad) * radius;
        const y = centerY + Math.sin(rad) * radius;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();

        // Degree numbers on border
        const labelX = centerX + Math.cos(rad) * (radius + 14);
        const labelY = centerY + Math.sin(rad) * (radius + 14);
        ctx.fillStyle = 'rgba(100, 116, 139, 0.8)';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${deg.toString().padStart(3, '0')}°`, labelX, labelY);
      }

      // Sweep Beam (Phosphor fading cone)
      sweepAngleRef.current = (sweepAngleRef.current + 0.02) % (Math.PI * 2);
      const sweepAngle = sweepAngleRef.current;

      const sweepGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      sweepGrad.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
      sweepGrad.addColorStop(1, 'rgba(6, 182, 212, 0.0)');

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, sweepAngle - 0.35, sweepAngle, false);
      ctx.closePath();
      ctx.fillStyle = sweepGrad;
      ctx.fill();

      // Main beam leading line
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.9)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + Math.cos(sweepAngle) * radius, centerY + Math.sin(sweepAngle) * radius);
      ctx.stroke();
      ctx.restore();

      // Draw Target Blips
      const renderTargets = targets.slice(0, 10);
      renderTargets.forEach((tgt, index) => {
        const isCurrent = activeTarget?.target_id === tgt.target_id || index === 0;
        const tgtRange = Math.min(tgt.range_m, maxRangeMeters);
        const rPos = (tgtRange / maxRangeMeters) * radius;
        const azDeg = tgt.azimuth_deg ?? (index * 47) % 360;
        const azRad = (azDeg * Math.PI) / 180;

        const bx = centerX + Math.cos(azRad) * rPos;
        const by = centerY + Math.sin(azRad) * rPos;

        // Color based on target classification
        let color = '#f59e0b'; // Amber unknown
        let glowColor = 'rgba(245, 158, 11, 0.4)';
        if (tgt.classification === 'DRONE') {
          color = '#ef4444'; // Threat Red
          glowColor = 'rgba(239, 68, 68, 0.5)';
        } else if (tgt.classification === 'BIRD') {
          color = '#06b6d4'; // Cyan
          glowColor = 'rgba(6, 182, 212, 0.5)';
        }

        // Blip Outer Glow
        ctx.fillStyle = glowColor;
        ctx.beginPath();
        ctx.arc(bx, by, isCurrent ? 9 : 6, 0, Math.PI * 2);
        ctx.fill();

        // Blip Center
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(bx, by, isCurrent ? 4.5 : 3, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing Ring for current active target
        if (isCurrent) {
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(bx, by, 12, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Target Tag Label
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`${tgt.target_id} [${tgt.classification}]`, bx + 10, by - 4);
        ctx.fillStyle = 'rgba(148, 163, 184, 0.9)';
        ctx.font = '9px monospace';
        ctx.fillText(`${tgt.range_m}m | ${tgt.velocity_ms}m/s`, bx + 10, by + 8);
      });

      // Simulation Mode Watermark
      ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText('SIMULATION MODE – PPI RADAR SCOPE', width - 15, 15);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [targets, activeTarget, maxRangeMeters]);

  return (
    <div className="defense-card p-4 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-mono">
        <span className="text-cyan-400 font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          PPI SCOPE (24 GHz FMCW)
        </span>
        <span className="text-slate-400">
          MAX RANGE: <strong className="text-white">{maxRangeMeters}m</strong>
        </span>
      </div>

      <div className="relative my-2 w-full max-w-[460px] aspect-square flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={460}
          height={460}
          className="w-full h-full rounded-full border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.15)]"
        />
      </div>

      {/* Target Status Legend */}
      <div className="w-full pt-3 border-t border-slate-800/80 flex items-center justify-around text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          <span className="text-slate-300">DRONE (Blade Flash)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          <span className="text-slate-300">BIRD (Flapping)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
          <span className="text-slate-300">UNKNOWN / CLUTTER</span>
        </div>
      </div>
    </div>
  );
};
