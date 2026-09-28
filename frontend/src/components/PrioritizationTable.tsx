import React, { useState } from 'react';
import { AlertItem, PaginatedAlerts, FilterOptions } from '../services/api';
import { Search, Filter, ChevronLeft, ChevronRight, Eye, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';

interface PrioritizationTableProps {
  alertsData: PaginatedAlerts | null;
  filterOptions: FilterOptions | null;
  currentFilters: any;
  onFilterChange: (filters: any) => void;
  onSelectAlert: (alertId: string) => void;
  loading: boolean;
}

export const PrioritizationTable: React.FC<PrioritizationTableProps> = ({
  alertsData,
  filterOptions,
  currentFilters,
  onFilterChange,
  onSelectAlert,
  loading
}) => {
  const [searchInput, setSearchInput] = useState(currentFilters.search || '');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ ...currentFilters, search: searchInput, page: 1 });
  };

  const handleSelectChange = (key: string, value: string) => {
    onFilterChange({ ...currentFilters, [key]: value || undefined, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    onFilterChange({ ...currentFilters, page: newPage });
  };

  const clearFilters = () => {
    setSearchInput('');
    onFilterChange({ page: 1, page_size: currentFilters.page_size || 25 });
  };

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 glow-critical';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'emergency':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'critical':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'high':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      case 'low':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
  };

  return (
    <div className="glass-panel rounded-2xl border border-soc-cardBorder p-5 mb-6">
      {/* Title & Filter Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-wide">SOC Alert Prioritization Engine</h2>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Real-time ranked alert queue powered by Random Forest ML incident estimation and noise suppression
          </p>
        </div>

        {/* Global Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Alert ID, System, Type..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 w-64"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/40 text-xs font-medium transition-all"
          >
            Filter
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white border border-slate-700 text-xs transition-all"
            title="Reset Filters"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Filter Selectors Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        <div>
          <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1">Priority</label>
          <select
            value={currentFilters.priority || ''}
            onChange={(e) => handleSelectChange('priority', e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Priorities</option>
            {filterOptions?.priorities.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1">Severity</label>
          <select
            value={currentFilters.severity || ''}
            onChange={(e) => handleSelectChange('severity', e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Severities</option>
            {filterOptions?.severities.map((s) => (
              <option key={s} value={s}>{s.toUpperCase()}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1">Alert Type</label>
          <select
            value={currentFilters.alert_type || ''}
            onChange={(e) => handleSelectChange('alert_type', e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Alert Types</option>
            {filterOptions?.alert_types.slice(0, 30).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1">Source SIEM</label>
          <select
            value={currentFilters.source || ''}
            onChange={(e) => handleSelectChange('source', e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Sources</option>
            {filterOptions?.sources.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1">Noise Level</label>
          <select
            value={currentFilters.noise_level || ''}
            onChange={(e) => handleSelectChange('noise_level', e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Noise Levels</option>
            <option value="LOW">LOW Noise</option>
            <option value="MEDIUM">MEDIUM Noise</option>
            <option value="HIGH">HIGH (Tuning)</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1">Page Size</label>
          <select
            value={currentFilters.page_size || 25}
            onChange={(e) => onFilterChange({ ...currentFilters, page_size: Number(e.target.value), page: 1 })}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
          >
            <option value={15}>15 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900/90 text-gray-400 font-mono text-[11px] border-b border-slate-800">
              <th className="py-3 px-3">Alert ID</th>
              <th className="py-3 px-3">Timestamp</th>
              <th className="py-3 px-3">Priority</th>
              <th className="py-3 px-3">Severity</th>
              <th className="py-3 px-3">Alert Type</th>
              <th className="py-3 px-3">Affected System</th>
              <th className="py-3 px-3">Source SIEM</th>
              <th className="py-3 px-3 text-right">ML Prob</th>
              <th className="py-3 px-3 text-right">Noise Score</th>
              <th className="py-3 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {loading ? (
              [...Array(10)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={10} className="py-4 px-3 bg-slate-900/30 h-10" />
                </tr>
              ))
            ) : alertsData && alertsData.items.length > 0 ? (
              alertsData.items.map((alert) => (
                <tr
                  key={alert.alert_id}
                  onClick={() => onSelectAlert(alert.alert_id)}
                  className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <td className="py-2.5 px-3 font-mono text-cyan-300 font-medium">
                    {alert.alert_id.slice(0, 8)}...
                  </td>
                  <td className="py-2.5 px-3 text-gray-400 whitespace-nowrap">
                    {alert.timestamp.slice(0, 19).replace('T', ' ')}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${getPriorityBadge(alert.priority)}`}>
                      {alert.priority}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${getSeverityBadge(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-white max-w-[180px] truncate">
                    {alert.alert_type}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-gray-300 max-w-[150px] truncate">
                    {alert.affected_system}
                  </td>
                  <td className="py-2.5 px-3 text-gray-400 max-w-[140px] truncate">
                    {alert.source}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-rose-400">
                    {(alert.incident_probability * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-gray-300">
                    {alert.noise_score}%
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAlert(alert.alert_id);
                      }}
                      className="p-1 rounded bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-400 text-gray-400 transition-colors"
                      title="Inspect Alert"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="py-8 text-center text-gray-500">
                  No alerts match the selected filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {alertsData && alertsData.total > 0 && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800 text-xs text-gray-400">
          <div>
            Showing <span className="font-mono text-white font-semibold">{((alertsData.page - 1) * alertsData.page_size) + 1}</span> to{' '}
            <span className="font-mono text-white font-semibold">{Math.min(alertsData.page * alertsData.page_size, alertsData.total)}</span> of{' '}
            <span className="font-mono text-white font-semibold">{alertsData.total.toLocaleString()}</span> alerts
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(alertsData.page - 1)}
              disabled={alertsData.page <= 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-gray-300 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono px-2">
              Page {alertsData.page} of {alertsData.total_pages}
            </span>
            <button
              onClick={() => handlePageChange(alertsData.page + 1)}
              disabled={alertsData.page >= alertsData.total_pages}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-gray-300 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
