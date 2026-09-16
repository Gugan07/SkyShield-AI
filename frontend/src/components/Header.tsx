import React, { useState, useEffect } from 'react';
import { Shield, Radio, Cpu, Activity, AlertTriangle } from 'lucide-react';
import { StatusIndicator } from './StatusIndicator';
import { SystemStatus } from '../types/detection';

interface HeaderProps {
  systemStatus: SystemStatus | null;
  wsConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({ systemStatus, wsConnected }) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour12: false }) + ' UTC');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const radarStatus = systemStatus?.radar.status || 'ONLINE';
  const aiStatus = systemStatus?.ai_model.status || 'ONLINE';

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40 px-6 py-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand & Subtitle */}
        <div className="flex items-center space-x-3.5">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <Shield className="w-5 h-5 text-cyan-400" />
            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                SkyShield <span className="text-cyan-400 font-mono">AI</span>
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                SIMULATION MODE – DATA IS SYNTHETIC
              </span>
            </div>
            <p className="text-xs text-slate-400 tracking-wide">
              Micro-Doppler Based Aerial Target Classification Prototype
            </p>
          </div>
        </div>

        {/* System Subsystems & Real-time Status */}
        <div className="flex items-center flex-wrap gap-3">
          <StatusIndicator
            status={radarStatus as any}
            label="Radar Online"
          />
          <StatusIndicator
            status={aiStatus as any}
            label="AI Model Ready"
          />
          <StatusIndicator
            status={wsConnected ? 'ONLINE' : 'OFFLINE'}
            label={wsConnected ? 'WebSocket Connected' : 'WS Reconnecting...'}
          />

          <div className="hidden lg:flex items-center pl-3 border-l border-slate-800 font-mono text-xs text-cyan-300/80 bg-slate-900/50 px-3 py-1 rounded-md">
            <Activity className="w-3.5 h-3.5 text-cyan-400 mr-2 animate-pulse" />
            {timeStr}
          </div>
        </div>
      </div>
    </header>
  );
};
