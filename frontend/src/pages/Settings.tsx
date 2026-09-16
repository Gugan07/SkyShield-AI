import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SystemStatus, Detection } from '../types/detection';
import { StatusIndicator } from '../components/StatusIndicator';
import { Spectrogram } from '../components/Spectrogram';
import { TargetCard } from '../components/TargetCard';
import {
  Settings as SettingsIcon,
  Upload,
  Radio,
  Sliders,
  CheckCircle,
  AlertCircle,
  FileText,
  FileCode,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<Detection | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedSource, setSelectedSource] = useState<'simulation' | 'fmcw_hardware'>('simulation');

  useEffect(() => {
    api.getSystemStatus().then(setSystemStatus).catch(console.error);
  }, []);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      const result = await api.uploadRadarFile(uploadFile);
      setUploadResult(result);
    } catch (err: any) {
      setUploadError(err.response?.data?.detail || 'Failed to process uploaded radar file.');
      setUploadResult(null);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-cyan-400" />
          System Settings & Hardware Diagnostics
        </h2>
        <p className="text-xs text-slate-400 font-mono">
          Subsystem health monitors, radar source configuration, and raw data ingestion
        </p>
      </div>

      {/* Subsystem Health Dashboard */}
      <div className="defense-card p-5 space-y-4">
        <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400" />
          Subsystem Diagnostics Matrix
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-slate-300">Radar Front-End</span>
              <StatusIndicator status={(systemStatus?.radar.status as any) || 'ONLINE'} label={systemStatus?.radar.status || 'ONLINE'} />
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              {systemStatus?.radar.details || '24 GHz K-Band FMCW Simulator Active'}
            </p>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-slate-300">AI Classification Engine</span>
              <StatusIndicator status={(systemStatus?.ai_model.status as any) || 'ONLINE'} label={systemStatus?.ai_model.status || 'ONLINE'} />
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              {systemStatus?.ai_model.details || 'DemoClassifier Heuristic Ready'}
            </p>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-slate-300">FastAPI Asynchronous Backend</span>
              <StatusIndicator status={(systemStatus?.backend.status as any) || 'ONLINE'} label={systemStatus?.backend.status || 'ONLINE'} />
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              {systemStatus?.backend.details || 'Uvicorn ASGI Service Running'}
            </p>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-slate-300">WebSocket Live Stream</span>
              <StatusIndicator status={(systemStatus?.websocket.status as any) || 'ONLINE'} label={systemStatus?.websocket.status || 'ONLINE'} />
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              {systemStatus?.websocket.details || 'Live stream ready (/ws/live)'}
            </p>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-slate-300">SQLite SQLAlchemy DB</span>
              <StatusIndicator status={(systemStatus?.database.status as any) || 'ONLINE'} label={systemStatus?.database.status || 'ONLINE'} />
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              {systemStatus?.database.details || 'SQLite persistent storage operational'}
            </p>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-slate-300">Simulation Engine</span>
              <StatusIndicator status={(systemStatus?.simulation.status as any) || 'ONLINE'} label={systemStatus?.simulation.status || 'STANDBY'} />
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              {systemStatus?.simulation.details || 'Ready to start'}
            </p>
          </div>
        </div>
      </div>

      {/* Radar Source Selection & Physical Radar Architecture (Section 26) */}
      <div className="defense-card p-5 space-y-4">
        <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400" />
          Radar Data Source Selection (Modular Architecture)
        </h3>
        <p className="text-xs text-slate-300">
          The backend implements a polymorphic <code className="text-cyan-400">RadarDataSource</code> interface, allowing simulated radar observations to be replaced with physical FMCW radar sensors without modifying frontend logic.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => setSelectedSource('simulation')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              selectedSource === 'simulation'
                ? 'bg-cyan-950/30 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white text-xs font-mono">
                1. SimulatedRadarSource (Active)
              </span>
              <span className="w-3 h-3 rounded-full bg-cyan-400" />
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Physics-based synthetic generator producing baseband dechirped signals with authentic blade chopping harmonics and wing-flapping modulation.
            </p>
          </div>

          <div
            onClick={() => setSelectedSource('fmcw_hardware')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              selectedSource === 'fmcw_hardware'
                ? 'bg-amber-950/30 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white text-xs font-mono">
                2. FMCWRadarSource (Hardware Interface)
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-amber-400">
                DRIVERS READY
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              UART/USB/Ethernet raw ADC streaming interface (TI AWR1843, IWR6843, or SDR). Can be activated when physical sensor is connected.
            </p>
          </div>
        </div>
      </div>

      {/* File Upload Studio (Section 14) */}
      <div className="defense-card p-5 space-y-4">
        <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
          <Upload className="w-4 h-4 text-cyan-400" />
          Raw Radar Data File Upload Studio (.CSV / .JSON)
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Upload recorded FMCW baseband time-series samples or observation files for on-demand validation, STFT spectrogram generation, and AI classification.
        </p>

        <form onSubmit={handleFileUpload} className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept=".csv,.json"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="text-xs font-mono file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-mono file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 cursor-pointer text-slate-400"
            />
            <button
              type="submit"
              disabled={!uploadFile || isUploading}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] active:scale-95"
            >
              {isUploading ? 'Analyzing Radar Data...' : 'Upload & Classify'}
            </button>
          </div>
          {uploadFile && (
            <div className="text-[11px] text-cyan-400 font-mono">
              Selected: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
            </div>
          )}
        </form>

        {uploadError && (
          <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Uploaded File Classification Result */}
        {uploadResult && (
          <div className="mt-4 pt-4 border-t border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold">
              <CheckCircle className="w-4 h-4" />
              <span>RADAR OBSERVATION SUCCESSFULLY PROCESSED</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <TargetCard detection={uploadResult} />
              {uploadResult.spectrogram && (
                <Spectrogram
                  data={uploadResult.spectrogram}
                  targetType={uploadResult.classification}
                  title="Uploaded File STFT Spectrogram"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
