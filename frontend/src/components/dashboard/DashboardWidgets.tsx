/**
 * OmniSentinel Dashboard Analytics Widgets
 * 'TOP 5 SOURCE IPs' and 'SEVERITY MIX (LAST 24H OF DATA)'
 * Both link to /analytics with pre-applied filter presets.
 */

import React, { useState } from 'react';
import { Network, BarChart2, ArrowRight, Copy, Check } from 'lucide-react';
import { SimulationState } from '../../hooks/useSimulation';
import { MappedSeverity } from '../../types/alert';

interface DashboardWidgetsProps {
  topSources: SimulationState['topSources'];
  severityMix: SimulationState['severityMix24h'];
  onNavigateToAnalytics: (filterKey?: string, filterValue?: string) => void;
}

export const DashboardWidgets: React.FC<DashboardWidgetsProps> = ({
  topSources,
  severityMix,
  onNavigateToAnalytics,
}) => {
  const [copiedIp, setCopiedIp] = useState<string | null>(null);

  const copyIp = (e: React.MouseEvent, ip: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 1800);
  };

  const totalMix = severityMix.critical + severityMix.high + severityMix.medium + severityMix.low || 1;
  const critPct = ((severityMix.critical / totalMix) * 100).toFixed(1);
  const highPct = ((severityMix.high / totalMix) * 100).toFixed(1);
  const medPct = ((severityMix.medium / totalMix) * 100).toFixed(1);
  const lowPct = ((severityMix.low / totalMix) * 100).toFixed(1);

  const getSeverityBadge = (sev: MappedSeverity) => {
    switch (sev) {
      case 'CRITICAL':
        return <span className="px-1.5 py-0.5 rounded-badge bg-red/15 text-red text-[9px] font-mono font-bold">CRIT</span>;
      case 'HIGH':
        return <span className="px-1.5 py-0.5 rounded-badge bg-orange/15 text-orange text-[9px] font-mono font-bold">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-1.5 py-0.5 rounded-badge bg-cyan/15 text-cyan text-[9px] font-mono font-bold">MED</span>;
      case 'LOW':
      default:
        return <span className="px-1.5 py-0.5 rounded-badge bg-green/15 text-green text-[9px] font-mono font-bold">LOW</span>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Widget 1: TOP 5 SOURCE IPs */}
      <div className="p-4 rounded-card bg-card border border-border flex flex-col justify-between card-highlight">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-cyan" strokeWidth={1.5} />
            <span className="text-card-label text-text-3 font-medium">
              TOP 5 SOURCE IPs
            </span>
          </div>

          <button
            onClick={() => onNavigateToAnalytics('source', 'top')}
            className="text-[11px] font-mono text-cyan hover:text-cyan/80 flex items-center gap-1 transition-colors"
          >
            <span>View Analytics</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-2.5">
          {topSources.map((item, idx) => (
            <div
              key={item.ip}
              onClick={() => onNavigateToAnalytics('srcIp', item.ip)}
              className="group p-2 rounded-btn bg-inset border border-border/50 hover:border-border-strong hover:bg-white/[0.03] transition-colors cursor-pointer flex items-center justify-between gap-3 text-[12px]"
            >
              <div className="flex items-center gap-2.5 min-w-[140px]">
                <span className="font-mono text-[10px] text-text-4 w-4">
                  #{idx + 1}
                </span>
                <span className="font-mono text-text-1 group-hover:text-amber transition-colors">
                  {item.ip}
                </span>
                <button
                  onClick={e => copyIp(e, item.ip)}
                  aria-label="Copy IP"
                  className="text-text-4 hover:text-text-2 transition-colors"
                >
                  {copiedIp === item.ip ? (
                    <Check className="w-3 h-3 text-green" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>

              {/* Inline Progress Bar */}
              <div className="flex-1 max-w-[140px] hidden sm:block">
                <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-cyan"
                    style={{ width: `${item.percentage * 2.8}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-[11px] text-text-3 tabular-nums">
                  {item.count.toLocaleString()}
                </span>
                {getSeverityBadge(item.severity)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Widget 2: SEVERITY MIX (LAST 24H OF DATA) */}
      <div className="p-4 rounded-card bg-card border border-border flex flex-col justify-between card-highlight">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-amber" strokeWidth={1.5} />
            <span className="text-card-label text-text-3 font-medium">
              SEVERITY MIX (LAST 24H OF DATA)
            </span>
          </div>

          <button
            onClick={() => onNavigateToAnalytics('severity', 'all')}
            className="text-[11px] font-mono text-amber hover:text-amber/80 flex items-center gap-1 transition-colors"
          >
            <span>Inspect All</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Stacked Horizontal Bar */}
        <div className="my-2">
          <div className="w-full h-3 rounded-full bg-inset border border-border flex overflow-hidden">
            <div style={{ width: `${critPct}%` }} className="bg-red h-full" title={`Critical: ${critPct}%`} />
            <div style={{ width: `${highPct}%` }} className="bg-orange h-full" title={`High: ${highPct}%`} />
            <div style={{ width: `${medPct}%` }} className="bg-cyan h-full" title={`Medium: ${medPct}%`} />
            <div style={{ width: `${lowPct}%` }} className="bg-green h-full" title={`Low: ${lowPct}%`} />
          </div>
        </div>

        {/* 4 Stat Boxes Below */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
          <div
            onClick={() => onNavigateToAnalytics('severity', 'CRITICAL')}
            className="p-2 rounded-btn bg-inset border border-border/60 hover:border-red/40 transition-colors cursor-pointer text-center"
          >
            <span className="text-[10px] font-mono text-red font-semibold uppercase">CRITICAL</span>
            <div className="text-[16px] font-mono text-text-1 font-semibold tabular-nums mt-0.5">
              {severityMix.critical.toLocaleString()}
            </div>
            <span className="text-[9px] font-mono text-text-4">{critPct}%</span>
          </div>

          <div
            onClick={() => onNavigateToAnalytics('severity', 'HIGH')}
            className="p-2 rounded-btn bg-inset border border-border/60 hover:border-orange/40 transition-colors cursor-pointer text-center"
          >
            <span className="text-[10px] font-mono text-orange font-semibold uppercase">HIGH</span>
            <div className="text-[16px] font-mono text-text-1 font-semibold tabular-nums mt-0.5">
              {severityMix.high.toLocaleString()}
            </div>
            <span className="text-[9px] font-mono text-text-4">{highPct}%</span>
          </div>

          <div
            onClick={() => onNavigateToAnalytics('severity', 'MEDIUM')}
            className="p-2 rounded-btn bg-inset border border-border/60 hover:border-cyan/40 transition-colors cursor-pointer text-center"
          >
            <span className="text-[10px] font-mono text-cyan font-semibold uppercase">MEDIUM</span>
            <div className="text-[16px] font-mono text-text-1 font-semibold tabular-nums mt-0.5">
              {severityMix.medium.toLocaleString()}
            </div>
            <span className="text-[9px] font-mono text-text-4">{medPct}%</span>
          </div>

          <div
            onClick={() => onNavigateToAnalytics('severity', 'LOW')}
            className="p-2 rounded-btn bg-inset border border-border/60 hover:border-green/40 transition-colors cursor-pointer text-center"
          >
            <span className="text-[10px] font-mono text-green font-semibold uppercase">LOW / INFO</span>
            <div className="text-[16px] font-mono text-text-1 font-semibold tabular-nums mt-0.5">
              {severityMix.low.toLocaleString()}
            </div>
            <span className="text-[9px] font-mono text-text-4">{lowPct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
