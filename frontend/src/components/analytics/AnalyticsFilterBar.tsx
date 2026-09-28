/**
 * OmniSentinel Sticky Analytics Filter Bar
 * 44px sticky bar with search, severity multi-select, category dropdown,
 * active filter chips, CSV exporter, and URL query synchronization.
 */

import React from 'react';
import { Search, Filter, RotateCcw, Download, X } from 'lucide-react';
import { MappedSeverity } from '../../types/alert';

export interface AnalyticsFilterState {
  search: string;
  severities: MappedSeverity[];
  category: string;
}

interface AnalyticsFilterBarProps {
  filters: AnalyticsFilterState;
  onFilterChange: (filters: Partial<AnalyticsFilterState>) => void;
  onResetFilters: () => void;
  onExportCsv: () => void;
  totalFilteredCount: number;
}

const ALL_SEVERITIES: MappedSeverity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export const AnalyticsFilterBar: React.FC<AnalyticsFilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  onExportCsv,
  totalFilteredCount,
}) => {
  const toggleSeverity = (sev: MappedSeverity) => {
    const exists = filters.severities.includes(sev);
    const updated = exists
      ? filters.severities.filter(s => s !== sev)
      : [...filters.severities, sev];
    onFilterChange({ severities: updated });
  };

  const hasActiveFilters =
    filters.search !== '' ||
    filters.severities.length < ALL_SEVERITIES.length ||
    filters.category !== 'ALL';

  return (
    <div className="sticky top-[56px] z-20 py-2.5 px-4 bg-app/95 backdrop-blur-md border-b border-border flex flex-wrap items-center justify-between gap-3 text-[12px]">
      {/* Left: Search & Filter Controls */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search Input */}
        <div className="relative w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-4" />
          <input
            type="text"
            value={filters.search}
            onChange={e => onFilterChange({ search: e.target.value })}
            placeholder="Search IP, host, signature..."
            className="w-full h-8 pl-8 pr-3 rounded-btn bg-inset border border-border text-[12px] text-text-1 placeholder-text-4 focus:border-amber/50 outline-none font-sans"
          />
        </div>

        {/* Severity Toggle Pills */}
        <div className="flex items-center gap-1 bg-inset p-0.5 rounded-btn border border-border">
          {ALL_SEVERITIES.map(sev => {
            const active = filters.severities.includes(sev);
            return (
              <button
                key={sev}
                onClick={() => toggleSeverity(sev)}
                className={`px-2 py-0.5 rounded-[4px] text-[10px] font-mono transition-colors ${
                  active
                    ? sev === 'CRITICAL'
                      ? 'bg-red text-white font-semibold'
                      : sev === 'HIGH'
                      ? 'bg-orange/20 text-orange font-semibold border border-orange/40'
                      : sev === 'MEDIUM'
                      ? 'bg-cyan/20 text-cyan font-semibold border border-cyan/40'
                      : 'bg-green/20 text-green font-semibold border border-green/40'
                    : 'text-text-4 hover:text-text-2'
                }`}
              >
                {sev}
              </button>
            );
          })}
        </div>

        {/* Category Select */}
        <select
          value={filters.category}
          onChange={e => onFilterChange({ category: e.target.value })}
          aria-label="Filter by threat category"
          className="h-8 px-2.5 rounded-btn bg-inset border border-border text-text-2 text-[11px] font-mono outline-none hover:border-border-strong cursor-pointer"
        >
          <option value="ALL">All Categories</option>
          <option value="Exploit">Exploit</option>
          <option value="Malware">Malware</option>
          <option value="Recon">Recon</option>
          <option value="Policy">Policy</option>
          <option value="Evasion">Evasion</option>
        </select>

        {/* Reset Filters Ghost Button */}
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-btn text-text-3 hover:text-text-1 hover:bg-white/[0.05] text-[11px] font-mono transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Right: Export CSV & Match Count */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-mono text-text-4">
          <strong className="text-text-2">{totalFilteredCount.toLocaleString()}</strong> events match
        </span>

        <button
          onClick={onExportCsv}
          className="h-8 px-3 rounded-btn bg-white/[0.05] border border-border hover:bg-white/[0.08] text-text-1 text-[11px] font-mono flex items-center gap-1.5 transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-text-3" />
          <span>Export CSV</span>
        </button>
      </div>
    </div>
  );
};
