import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Statistics, ModelMetrics } from '../types/detection';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ZAxis,
} from 'recharts';
import { BarChart3, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';

export const Analytics: React.FC = () => {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [historyItems, setHistoryItems] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      api.getStatistics(),
      api.getModelMetrics(),
      api.getDetections({ page: 1, page_size: 50 }),
    ])
      .then(([s, m, h]) => {
        setStats(s);
        setMetrics(m);
        setHistoryItems(h.items);
      })
      .catch((err) => console.error('Analytics load error:', err));
  }, []);

  // 1. Drone vs Bird Pie Data
  const classDistData = [
    { name: 'Drone', value: stats?.drones_detected || 1, color: '#ef4444' },
    { name: 'Bird', value: stats?.birds_detected || 1, color: '#06b6d4' },
    { name: 'Unknown', value: stats?.unknown_targets || 1, color: '#f59e0b' },
  ];

  // 2. Confidence Distribution Bins
  const confBins = [
    { range: '50-60%', count: 0 },
    { range: '60-70%', count: 0 },
    { range: '70-80%', count: 0 },
    { range: '80-90%', count: 0 },
    { range: '90-100%', count: 0 },
  ];
  historyItems.forEach((item) => {
    const c = item.confidence * 100;
    if (c < 60) confBins[0].count++;
    else if (c < 70) confBins[1].count++;
    else if (c < 80) confBins[2].count++;
    else if (c < 90) confBins[3].count++;
    else confBins[4].count++;
  });

  // 3. Temporal Trend Data (reverse items so oldest is first)
  const temporalData = [...historyItems].reverse().map((item, idx) => ({
    index: idx + 1,
    id: item.id,
    range: item.range_m,
    velocity: item.velocity_ms,
    confidence: Math.round(item.confidence * 100),
    type: item.target_type,
  }));

  // 4. Kinematics Scatter Data
  const scatterDataDrone = historyItems
    .filter((i) => i.target_type === 'DRONE')
    .map((i) => ({ range: i.range_m, velocity: i.velocity_ms, name: i.id }));

  const scatterDataBird = historyItems
    .filter((i) => i.target_type === 'BIRD')
    .map((i) => ({ range: i.range_m, velocity: i.velocity_ms, name: i.id }));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            Radar Telemetry & AI Analytics
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Statistical distribution of classified aerial tracks and model performance
          </p>
        </div>

        {/* Scientific Disclaimer Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Demo / Experimental Metrics – Simulated Data</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Chart 1: Class Distribution */}
        <div className="defense-card p-4 space-y-3">
          <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
            1. Target Class Distribution
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={classDistData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {classDistData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Confidence Distribution */}
        <div className="defense-card p-4 space-y-3">
          <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
            2. Confidence Score Distribution
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={confBins}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="range" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Detection Confidence Over Time */}
        <div className="defense-card p-4 space-y-3">
          <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
            3. Detection Confidence Over Time
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={temporalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="index" stroke="#64748b" fontSize={10} label={{ value: 'Observation Index', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#64748b' }} />
                <YAxis stroke="#64748b" fontSize={10} domain={[40, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px' }}
                />
                <Line type="monotone" dataKey="confidence" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Target Range Over Observations */}
        <div className="defense-card p-4 space-y-3">
          <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
            4. Target Range (Meters)
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={temporalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="index" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px' }}
                />
                <Line type="monotone" dataKey="range" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5: Target Velocity vs Range Scatter */}
        <div className="defense-card p-4 space-y-3">
          <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
            5. Range vs Radial Velocity Scatter
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="range" name="Range" unit="m" stroke="#64748b" fontSize={10} />
                <YAxis dataKey="velocity" name="Velocity" unit="m/s" stroke="#64748b" fontSize={10} />
                <ZAxis range={[30, 30]} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                <Scatter name="Drone" data={scatterDataDrone} fill="#ef4444" />
                <Scatter name="Bird" data={scatterDataBird} fill="#06b6d4" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 6: Prototype Confusion Matrix & Accuracy */}
        <div className="defense-card p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
              6. Classification Accuracy Matrix
            </h3>
            <span className="text-xs font-mono font-bold text-emerald-400">
              Acc: {((metrics?.accuracy ?? 0.962) * 100).toFixed(1)}%
            </span>
          </div>

          <div className="overflow-x-auto pt-2">
            <table className="w-full text-center text-[11px] font-mono border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="p-1.5 text-left">Actual \ Pred</th>
                  <th className="p-1.5 text-red-400">Drone</th>
                  <th className="p-1.5 text-cyan-400">Bird</th>
                  <th className="p-1.5 text-amber-400">Unknown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                <tr>
                  <td className="p-1.5 text-left font-bold text-red-400">Drone</td>
                  <td className="p-1.5 bg-red-950/40 font-bold text-white">121</td>
                  <td className="p-1.5 text-slate-400">3</td>
                  <td className="p-1.5 text-slate-400">1</td>
                </tr>
                <tr>
                  <td className="p-1.5 text-left font-bold text-cyan-400">Bird</td>
                  <td className="p-1.5 text-slate-400">2</td>
                  <td className="p-1.5 bg-cyan-950/40 font-bold text-white">125</td>
                  <td className="p-1.5 text-slate-400">3</td>
                </tr>
                <tr>
                  <td className="p-1.5 text-left font-bold text-amber-400">Unknown</td>
                  <td className="p-1.5 text-slate-400">1</td>
                  <td className="p-1.5 text-slate-400">2</td>
                  <td className="p-1.5 bg-amber-950/40 font-bold text-white">42</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-[10px] text-slate-500 font-mono mt-2">
            *Experimental simulated benchmark dataset validation.
          </p>
        </div>
      </div>
    </div>
  );
};
