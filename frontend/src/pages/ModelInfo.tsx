import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ModelInfo as ModelInfoType, ModelMetrics } from '../types/detection';
import { Cpu, Layers, Network, Terminal, CheckCircle2, AlertCircle } from 'lucide-react';

export const ModelInfo: React.FC = () => {
  const [modelInfo, setModelInfo] = useState<ModelInfoType | null>(null);
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);

  useEffect(() => {
    Promise.all([api.getModelInfo(), api.getModelMetrics()])
      .then(([info, met]) => {
        setModelInfo(info);
        setMetrics(met);
      })
      .catch((err) => console.error('Model info fetch error:', err));
  }, []);

  const layers = [
    { name: 'Input Layer', desc: '224 × 224 × 1 Normalized Grayscale STFT Matrix', type: 'Input' },
    { name: 'Conv Block 1', desc: 'Conv2D (32 filters, 3x3) → BatchNorm → ReLU → MaxPool (2x2)', type: 'Feature Extractor' },
    { name: 'Conv Block 2', desc: 'Conv2D (64 filters, 3x3) → BatchNorm → ReLU → MaxPool (2x2)', type: 'Feature Extractor' },
    { name: 'Conv Block 3', desc: 'Conv2D (128 filters, 3x3) → ReLU → MaxPool (2x2)', type: 'Feature Extractor' },
    { name: 'Flatten', desc: 'Reshapes 128 × 28 × 28 feature maps to 100,352-D vector', type: 'Reshape' },
    { name: 'Dense Layer', desc: 'Dense (128 units, ReLU activation) + Dropout (p = 0.5)', type: 'Regularization' },
    { name: 'Output Head', desc: 'Dense (3 units) + Softmax (Drone, Bird, Unknown)', type: 'Classifier' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            AI Model Architecture & Deep Learning Specification
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Convolutional Neural Network (CNN) for Micro-Doppler Time-Frequency Classification
          </p>
        </div>

        {/* Model Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-slate-300">
            {modelInfo?.status || 'Model Status: Prototype Classifier'}
          </span>
        </div>
      </div>

      {/* Model Spec Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="defense-card p-4 space-y-2">
          <span className="text-xs font-mono uppercase text-slate-400">Target Classes</span>
          <div className="flex gap-2">
            <span className="px-2 py-1 rounded bg-red-950/70 border border-red-800 text-red-300 text-xs font-mono font-bold">
              0: DRONE
            </span>
            <span className="px-2 py-1 rounded bg-cyan-950/70 border border-cyan-800 text-cyan-300 text-xs font-mono font-bold">
              1: BIRD
            </span>
            <span className="px-2 py-1 rounded bg-amber-950/70 border border-amber-800 text-amber-300 text-xs font-mono font-bold">
              2: UNKNOWN
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Softmax output probabilities over the 3 target categories.
          </p>
        </div>

        <div className="defense-card p-4 space-y-2">
          <span className="text-xs font-mono uppercase text-slate-400">Input Specification</span>
          <div className="text-lg font-mono font-bold text-white">
            224 × 224 × 1
          </div>
          <p className="text-[11px] text-slate-400">
            Grayscale STFT spectrogram magnitude, normalized to [0.0, 1.0].
          </p>
        </div>

        <div className="defense-card p-4 space-y-2">
          <span className="text-xs font-mono uppercase text-slate-400">Active Classification Mode</span>
          <div className="text-sm font-mono font-bold text-cyan-300">
            {modelInfo?.model_type || 'Prototype / Simulation Model'}
          </div>
          <p className="text-[11px] text-slate-400">
            Physics heuristics calculate calibrated probabilities; extensible to trained PyTorch weights.
          </p>
        </div>
      </div>

      {/* CNN Layer-by-Layer Architecture Table */}
      <div className="defense-card p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
          <Layers className="w-4 h-4 text-cyan-400" />
          CNN ARCHITECTURE LAYER SPECIFICATION
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Layer</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Parameters / Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {layers.map((l, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 font-bold text-white">{l.name}</td>
                  <td className="py-2.5 px-3 text-cyan-400">{l.type}</td>
                  <td className="py-2.5 px-3 text-slate-300">{l.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pipeline Diagram & Training Instructions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pipeline Diagram */}
        <div className="defense-card p-5 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
            <Network className="w-4 h-4 text-cyan-400" />
            END-TO-END SIGNAL PIPELINE
          </h3>
          <ol className="space-y-2 text-xs font-mono text-slate-300">
            <li className="p-2 rounded bg-slate-950/60 border border-slate-800">
              1. FMCW Baseband Dechirped Beat Signal (24 GHz K-Band)
            </li>
            <li className="p-2 rounded bg-slate-950/60 border border-slate-800">
              2. Hann Windowing (256-pt segment) & DC Bias Removal
            </li>
            <li className="p-2 rounded bg-slate-950/60 border border-slate-800">
              3. Centered STFT (scipy.signal.stft, 75% overlap)
            </li>
            <li className="p-2 rounded bg-slate-950/60 border border-slate-800">
              4. Log dB Dynamic Range Scaling & [0, 1] Normalization
            </li>
            <li className="p-2 rounded bg-slate-950/60 border border-slate-800">
              5. 224×224 Resizing & Feature Engineering
            </li>
            <li className="p-2 rounded bg-slate-950/60 border border-slate-800">
              6. CNN Inference / Heuristic Scoring → Softmax Probabilities
            </li>
          </ol>
        </div>

        {/* Training Guide */}
        <div className="defense-card p-5 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
            <Terminal className="w-4 h-4 text-cyan-400" />
            HOW TO TRAIN THE CNN WITH REAL DATASETS
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            The project includes a standalone training script <code className="text-cyan-400">backend/app/ml/train_cnn.py</code> configured for PyTorch. You can train the ConvNet on public micro-Doppler radar benchmarks (such as <strong>RadProc</strong> or <strong>DIAT-µSat</strong>):
          </p>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-cyan-300/90 overflow-x-auto space-y-1">
            <p className="text-slate-500"># 1. Install PyTorch</p>
            <p>pip install torch torchvision</p>
            <p className="text-slate-500 mt-2"># 2. Train CNN on synthetic or real spectrograms</p>
            <p>python -m app.ml.train_cnn --epochs 15 --samples 600</p>
            <p className="text-slate-500 mt-2"># 3. Model weights saved to weights/micro_doppler_cnn.pt</p>
          </div>
          <div className="flex items-start gap-2 p-2.5 rounded bg-cyan-950/30 border border-cyan-800/40 text-[11px] text-cyan-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-cyan-400 mt-0.5" />
            <span>
              Once weights are generated, set <code className="text-white">MODEL_MODE=cnn</code> in backend <code className="text-white">.env</code> to activate deep learning inference automatically.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
