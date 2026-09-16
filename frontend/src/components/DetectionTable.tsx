import React, { useState } from 'react';
import { DetectionSummary } from '../types/detection';
import { Search, Filter, Download, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { formatRange, formatVelocity, formatConfidence, formatTimestamp, getTargetBadgeColor } from '../utils/formatters';

interface DetectionTableProps {
  items: DetectionSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onFilterChange: (filters: {
    target_type?: string;
    min_confidence?: number;
    search?: string;
  }) => void;
  onInspectTarget?: (id: string) => void;
  isLoading?: boolean;
}

export const DetectionTable: React.FC<DetectionTableProps> = ({
  items,
  total,
  page,
  pageSize,
  totalPages,
  onPageChange,
  onFilterChange,
  onInspectTarget,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [minConf, setMinConf] = useState(0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({
      target_type: selectedType === 'ALL' ? undefined : selectedType.toLowerCase(),
      min_confidence: minConf > 0 ? minConf / 100 : undefined,
      search: searchTerm.trim() || undefined,
    });
  };

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    onFilterChange({
      target_type: type === 'ALL' ? undefined : type.toLowerCase(),
      min_confidence: minConf > 0 ? minConf / 100 : undefined,
      search: searchTerm.trim() || undefined,
    });
  };

  const handleExportCSV = () => {
    if (!items.length) return;
    const headers = ['ID', 'Timestamp', 'Target Type', 'Confidence', 'Range (m)', 'Velocity (m/s)', 'Mode'];
    const rows = items.map((i) => [
      i.id,
      i.timestamp,
      i.target_type,
      (i.confidence * 100).toFixed(1) + '%',
      i.range_m,
      i.velocity_ms,
      i.mode,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `skyshield_detections_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="defense-card overflow-hidden">
      {/* Search and Filters Bar */}
      <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/40">
        <form onSubmit={handleSearch} className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Target ID (e.g. TGT-001)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium border border-slate-700"
          >
            Filter
          </button>
        </form>

        {/* Target Type Filter Buttons */}
        <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
          {['ALL', 'DRONE', 'BIRD', 'UNKNOWN'].map((t) => (
            <button
              key={t}
              onClick={() => handleTypeSelect(t)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                selectedType === t
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Confidence Filter Slider */}
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
          <span>Min Conf: {minConf}%</span>
          <input
            type="range"
            min="0"
            max="95"
            step="5"
            value={minConf}
            onChange={(e) => setMinConf(Number(e.target.value))}
            onMouseUp={() =>
              onFilterChange({
                target_type: selectedType === 'ALL' ? undefined : selectedType.toLowerCase(),
                min_confidence: minConf > 0 ? minConf / 100 : undefined,
                search: searchTerm.trim() || undefined,
              })
            }
            className="w-20 accent-cyan-500"
          />
        </div>

        {/* Export CSV */}
        <button
          onClick={handleExportCSV}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700 active:scale-95"
          title="Export records to CSV"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Track ID</th>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Classification</th>
              <th className="py-3 px-4">Confidence</th>
              <th className="py-3 px-4">Range</th>
              <th className="py-3 px-4">Velocity</th>
              <th className="py-3 px-4">Source Mode</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                  {isLoading ? 'Querying detection database...' : 'No detection records matched your criteria.'}
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const badge = getTargetBadgeColor(item.target_type);
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => onInspectTarget?.(item.id)}
                  >
                    <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                      {item.id}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {formatTimestamp(item.timestamp)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        {item.target_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white font-semibold">
                      {formatConfidence(item.confidence)}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {formatRange(item.range_m)}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {formatVelocity(item.velocity_ms)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-400/90 border border-slate-700">
                        {item.mode.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspectTarget?.(item.id);
                        }}
                        className="p-1 rounded bg-slate-800 hover:bg-cyan-600 text-slate-300 hover:text-white transition-colors"
                        title="View Detailed Spectrogram"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400 bg-slate-950/40">
        <div>
          Showing <span className="text-white font-bold">{items.length}</span> of{' '}
          <span className="text-white font-bold">{total}</span> records
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span>
            Page <strong className="text-white">{page}</strong> of{' '}
            <strong className="text-white">{totalPages}</strong>
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
