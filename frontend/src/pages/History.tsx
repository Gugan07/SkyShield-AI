import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { DetectionSummary, Detection } from '../types/detection';
import { DetectionTable } from '../components/DetectionTable';
import { Spectrogram } from '../components/Spectrogram';
import { TargetCard } from '../components/TargetCard';
import { History as HistoryIcon, X, Filter, RefreshCw } from 'lucide-react';

export const History: React.FC = () => {
  const [items, setItems] = useState<DetectionSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<{
    target_type?: string;
    min_confidence?: number;
    search?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDetections = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getDetections({
        page,
        page_size: pageSize,
        target_type: filters.target_type,
        min_confidence: filters.min_confidence,
        search: filters.search,
      });
      setItems(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (err) {
      console.error('Error fetching detections history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, filters]);

  useEffect(() => {
    fetchDetections();
  }, [fetchDetections]);

  const handleFilterChange = (newFilters: {
    target_type?: string;
    min_confidence?: number;
    search?: string;
  }) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleInspectTarget = async (id: string) => {
    try {
      const det = await api.getDetectionById(id);
      setSelectedDetection(det);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Failed to load target details:', err);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <HistoryIcon className="w-5 h-5 text-cyan-400" />
            Detection Telemetry History
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Persistent SQLite database records of all radar classifications
          </p>
        </div>

        <button
          onClick={fetchDetections}
          disabled={isLoading}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Main Table */}
      <DetectionTable
        items={items}
        total={total}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={setPage}
        onFilterChange={handleFilterChange}
        onInspectTarget={handleInspectTarget}
        isLoading={isLoading}
      />

      {/* Target Inspection Modal */}
      {isModalOpen && selectedDetection && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="defense-card max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 relative border-cyan-500/40 shadow-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 font-mono">
              Observation Snapshot: <span className="text-cyan-400">{selectedDetection.target_id}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start mb-6">
              <TargetCard detection={selectedDetection} />
              
              {/* Features inspection */}
              {selectedDetection.features && (
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
                  <h4 className="text-cyan-400 font-bold border-b border-slate-800 pb-2 uppercase">
                    Micro-Doppler Spectral Kinematics
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                      <span className="text-slate-400">Spectral Centroid:</span>
                      <span className="text-white font-bold">{selectedDetection.features.spectral_centroid_hz} Hz</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                      <span className="text-slate-400">Spectral Bandwidth:</span>
                      <span className="text-white font-bold">{selectedDetection.features.spectral_bandwidth_hz} Hz</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                      <span className="text-slate-400">Harmonic Energy Ratio:</span>
                      <span className="text-cyan-300 font-bold">{selectedDetection.features.harmonic_energy_ratio}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                      <span className="text-slate-400">Modulation Frequency:</span>
                      <span className="text-amber-300 font-bold">{selectedDetection.features.modulation_frequency_hz} Hz</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900 pb-1">
                      <span className="text-slate-400">Peak Doppler Spread:</span>
                      <span className="text-white font-bold">{selectedDetection.features.peak_doppler_spread_hz} Hz</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Spectrogram in modal */}
            {selectedDetection.spectrogram && (
              <Spectrogram
                data={selectedDetection.spectrogram}
                targetType={selectedDetection.classification}
                title={`Historical STFT Signature – ${selectedDetection.target_id}`}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
