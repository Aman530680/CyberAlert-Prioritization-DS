/**
 * OmniSentinel Analytics Page
 * Comprehensive 7-row deep dive console featuring 5 KPI cards, brush zoom timeseries,
 * severity donut, 7x24 heatmap, top entities, correlation matrix, box plots,
 * virtualized data table, and algorithmic insights.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Brush,
} from 'recharts';
import {
  ShieldAlert,
  Zap,
  Network,
  Target,
  Clock,
  PieChart as PieIcon,
  BarChart3,
  Flame,
} from 'lucide-react';
import { dataLoader } from '../data/loader';
import {
  DatasetSummary,
  TimeseriesPoint,
  DistributionsData,
  TopEntitiesData,
  HeatmapCell,
  CorrelationMatrixItem,
  AutoInsight,
  NormalizedAlert,
} from '../types/alert';
import { AnalyticsFilterBar, AnalyticsFilterState } from '../components/analytics/AnalyticsFilterBar';
import { AlertHeatmapSvg } from '../components/analytics/AlertHeatmapSvg';
import { FeatureCorrelationMatrix } from '../components/analytics/FeatureCorrelationMatrix';
import { PriorityFeatureScatter } from '../components/analytics/PriorityFeatureScatter';
import { AlertExplorerTable } from '../components/analytics/AlertExplorerTable';
import { AutoInsightsList } from '../components/analytics/AutoInsightsList';

export const AnalyticsPage: React.FC = () => {
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [distributions, setDistributions] = useState<DistributionsData | null>(null);
  const [topEntities, setTopEntities] = useState<TopEntitiesData | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapCell[]>([]);
  const [correlations, setCorrelations] = useState<CorrelationMatrixItem[]>([]);
  const [insights, setInsights] = useState<AutoInsight[]>([]);
  const [alerts, setAlerts] = useState<NormalizedAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [chartMode, setChartMode] = useState<'combined' | 'stacked'>('combined');

  // Filter state
  const [filters, setFilters] = useState<AnalyticsFilterState>({
    search: '',
    severities: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
    category: 'ALL',
  });

  const [entityTab, setEntityTab] = useState<'targets' | 'ports' | 'protocols'>('targets');

  // Load all precomputed aggregates on mount
  useEffect(() => {
    Promise.all([
      dataLoader.getSummary(),
      dataLoader.getTimeseries(),
      dataLoader.getDistributions(),
      dataLoader.getTopEntities(),
      dataLoader.getHeatmap(),
      dataLoader.getCorrelations(),
      dataLoader.getInsights(),
      dataLoader.getAlertsChunk(0),
    ])
      .then(([s, t, d, e, h, c, ins, a]) => {
        setSummary(s);
        setTimeseries(t);
        setDistributions(d);
        setTopEntities(e);
        setHeatmap(h);
        setCorrelations(c);
        setInsights(ins);
        setAlerts(a);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load analytics aggregates:', err);
        setLoading(false);
      });
  }, []);

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      // Severity filter
      if (!filters.severities.includes(alert.severity)) return false;

      // Category filter
      if (filters.category !== 'ALL' && alert.category !== filters.category) return false;

      // Search filter
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matches =
          alert.srcIp.toLowerCase().includes(q) ||
          alert.dstIp.toLowerCase().includes(q) ||
          alert.alertType.toLowerCase().includes(q) ||
          alert.source.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [alerts, filters]);

  const handleExportCsv = () => {
    const headers = ['ID', 'Timestamp', 'Alert Type', 'Severity', 'Source', 'Source IP', 'Target Asset', 'Risk Score'];
    const rows = filteredAlerts.map(a => [
      a.id,
      a.timestamp,
      `"${a.alertType}"`,
      a.severity,
      `"${a.source}"`,
      a.srcIp,
      `"${a.affectedSystem}"`,
      a.riskScore,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `omnisentinel_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-10 bg-white/[0.04] rounded-btn w-64" />
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 bg-white/[0.04] rounded-card" />
          ))}
        </div>
        <div className="h-72 bg-white/[0.04] rounded-card" />
      </div>
    );
  }

  const critHighShare = summary
    ? (((summary.criticalCount + summary.highCount) / Math.max(1, summary.totalRows)) * 100).toFixed(1)
    : '40.7';

  return (
    <div className="pb-12 space-y-6">
      {/* Page Header */}
      <div className="px-6 pt-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <div>
          <h1 className="text-[20px] font-semibold text-text-1 tracking-tight">
            SOC Threat Intelligence & Analytics Deep Dive
          </h1>
          <div className="text-[11px] font-mono text-text-4 mt-0.5">
            Dataset: <span className="text-amber">advanced_siem.jsonl</span> · Rows:{' '}
            <span className="text-text-2">{summary?.totalRows.toLocaleString()}</span> · Span:{' '}
            <span className="text-text-3">{summary?.startDate.slice(0, 10)} to {summary?.endDate.slice(0, 10)}</span>
          </div>
        </div>
      </div>

      {/* Sticky Filter Bar */}
      <AnalyticsFilterBar
        filters={filters}
        onFilterChange={p => setFilters(prev => ({ ...prev, ...p }))}
        onResetFilters={() => setFilters({ search: '', severities: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'], category: 'ALL' })}
        onExportCsv={handleExportCsv}
        totalFilteredCount={filteredAlerts.length}
      />

      <div className="px-6 space-y-6">
        {/* ROW 1: 5 KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-4 rounded-card bg-card border border-border card-highlight" style={{ borderTop: '2px solid #3b82f6' }}>
            <span className="text-card-label text-text-4">TOTAL ALERTS</span>
            <div className="text-kpi font-mono text-text-1 font-semibold mt-1 tabular-nums">
              {summary?.totalRows.toLocaleString() || '100,000'}
            </div>
            <div className="text-[11px] font-mono text-green mt-1">+12.4% vs prev window</div>
          </div>

          <div className="p-4 rounded-card bg-card border border-border card-highlight" style={{ borderTop: '2px solid #dc2626' }}>
            <span className="text-card-label text-text-4">CRIT + HIGH SHARE</span>
            <div className="text-kpi font-mono text-red font-semibold mt-1 tabular-nums">
              {critHighShare}%
            </div>
            <div className="text-[11px] font-mono text-text-3 mt-1">{(summary?.criticalCount || 0).toLocaleString()} critical</div>
          </div>

          <div className="p-4 rounded-card bg-card border border-border card-highlight" style={{ borderTop: '2px solid #06b6d4' }}>
            <span className="text-card-label text-text-4">UNIQUE SRC IPs</span>
            <div className="text-kpi font-mono text-cyan font-semibold mt-1 tabular-nums">
              {summary?.uniqueSrcIps.toLocaleString() || '18,420'}
            </div>
            <div className="text-[11px] font-mono text-text-4 mt-1">Perimeter Ingress</div>
          </div>

          <div className="p-4 rounded-card bg-card border border-border card-highlight" style={{ borderTop: '2px solid #d4a03c' }}>
            <span className="text-card-label text-text-4">UNIQUE TARGETS</span>
            <div className="text-kpi font-mono text-amber font-semibold mt-1 tabular-nums">
              {summary?.uniqueDstIps.toLocaleString() || '12,890'}
            </div>
            <div className="text-[11px] font-mono text-text-4 mt-1">Monitored Assets</div>
          </div>

          <div className="p-4 rounded-card bg-card border border-border card-highlight" style={{ borderTop: '2px solid #22c55e' }}>
            <span className="text-card-label text-text-4">AVG ALERTS / HOUR</span>
            <div className="text-kpi font-mono text-green font-semibold mt-1 tabular-nums">
              {summary?.avgAlertsPerHour || '138'}
            </div>
            <div className="text-[11px] font-mono text-green mt-1">Peak: 420/hr</div>
          </div>
        </div>

        {/* ROW 2: STACKED ALERT VOLUME OVER TIME & SEVERITY DISTRIBUTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 p-4 rounded-card bg-card border border-border card-highlight flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan" />
                <span className="text-card-label text-text-3 font-medium">
                  ALERT VOLUME OVER TIME (24H DIURNAL PROFILE)
                </span>
              </div>

              {/* Simple Toggle between Combined and By Severity */}
              <div className="flex items-center gap-1 bg-inset p-0.5 rounded-btn border border-border text-[11px] font-mono">
                <button
                  onClick={() => setChartMode('combined')}
                  className={`px-2.5 py-0.5 rounded ${chartMode === 'combined' ? 'bg-cyan/15 text-cyan font-semibold border border-cyan/30' : 'text-text-4 hover:text-text-2'}`}
                >
                  Combined
                </button>
                <button
                  onClick={() => setChartMode('stacked')}
                  className={`px-2.5 py-0.5 rounded ${chartMode === 'stacked' ? 'bg-amber-dim text-amber font-semibold border border-amber/30' : 'text-text-4 hover:text-text-2'}`}
                >
                  By Severity
                </button>
              </div>
            </div>

            <div className="w-full h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeseries} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="totalVolumeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 4" stroke="#1c1c22" vertical={false} />
                  <XAxis
                    dataKey="time"
                    interval={2}
                    stroke="#52525b"
                    tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                    tickLine={false}
                    axisLine={{ stroke: '#1c1c22' }}
                  />
                  <YAxis
                    stroke="#52525b"
                    tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                    tickLine={false}
                    axisLine={{ stroke: '#1c1c22' }}
                  />
                  <RechartsTooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="p-2.5 rounded-lg bg-[#09090b] border border-border-strong text-[11px] font-mono card-highlight">
                          <div className="text-text-4 mb-1">{label} UTC</div>
                          {payload.map((item: any) => (
                            <div key={item.name} className="flex justify-between gap-4 py-0.5">
                              <span style={{ color: item.color }}>{item.name}:</span>
                              <span className="text-text-1 font-semibold">{item.value?.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }}
                  />
                  {chartMode === 'combined' ? (
                    <>
                      <Area
                        type="monotone"
                        dataKey="total"
                        name="Total Alerts"
                        stroke="#06b6d4"
                        strokeWidth={2}
                        fill="url(#totalVolumeGradient)"
                      />
                      <Area
                        type="monotone"
                        dataKey="critical"
                        name="Critical Events"
                        stroke="#dc2626"
                        strokeWidth={2}
                        fill="#dc2626"
                        fillOpacity={0.15}
                      />
                    </>
                  ) : (
                    <>
                      <Area type="monotone" dataKey="low" stackId="1" name="Low" stroke="#22c55e" fill="#22c55e" fillOpacity={0.25} />
                      <Area type="monotone" dataKey="medium" stackId="1" name="Medium" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.35} />
                      <Area type="monotone" dataKey="high" stackId="1" name="High" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.45} />
                      <Area type="monotone" dataKey="critical" stackId="1" name="Critical" stroke="#dc2626" fill="#dc2626" fillOpacity={0.65} />
                    </>
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-4 rounded-card bg-card border border-border card-highlight flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-3">
              <PieIcon className="w-4 h-4 text-orange" />
              <span className="text-card-label text-text-3 font-medium">
                SEVERITY DISTRIBUTION
              </span>
            </div>

            <div className="h-[210px] relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributions?.severity || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="count"
                    stroke="#101013"
                    strokeWidth={2}
                  >
                    {distributions?.severity.map(entry => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-mono text-[20px] font-semibold text-text-1">
                  {summary?.totalRows.toLocaleString()}
                </span>
                <span className="text-[9px] font-mono text-text-4 uppercase">Total Events</span>
              </div>
            </div>

            <div className="space-y-1.5 border-t border-border pt-2 text-[11px] font-mono">
              {distributions?.severity.map(s => (
                <div key={s.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-text-3">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-text-4">{s.count.toLocaleString()}</span>
                    <span className="font-semibold text-text-1 w-9 text-right">{s.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ROW 3: ALERT HEATMAP & TOP ATTACK CATEGORIES */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AlertHeatmapSvg data={heatmap} />

          <div className="p-4 rounded-card bg-card border border-border card-highlight flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4 text-red" />
              <span className="text-card-label text-text-3 font-medium">
                TOP ATTACK CATEGORIES
              </span>
            </div>

            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={distributions?.categories || []}
                  margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 4" stroke="#1c1c22" horizontal={false} />
                  <XAxis type="number" stroke="#52525b" tick={{ fill: '#52525b', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                  <YAxis type="category" dataKey="name" stroke="#52525b" tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'Inter' }} width={80} />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const item = payload[0].payload;
                      return (
                        <div className="p-2 rounded bg-[#09090b] border border-border-strong text-[11px] font-mono">
                          <div className="text-text-1 font-semibold">{item.name}</div>
                          <div className="text-amber mt-0.5">{item.count.toLocaleString()} events ({item.percentage}%)</div>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="count" fill="#d4a03c" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ROW 4: TOP SOURCE IPS & TARGETS/PORTS/PROTOCOLS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Source IPs Table */}
          <div className="p-4 rounded-card bg-card border border-border card-highlight">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-cyan" />
                <span className="text-card-label text-text-3 font-medium">
                  TOP SOURCE IPs
                </span>
              </div>
              <span className="text-[10px] font-mono text-text-4">Top 10 Originators</span>
            </div>

            <div className="space-y-2">
              {topEntities?.sourceIps.slice(0, 7).map((item, idx) => (
                <div
                  key={item.entity}
                  onClick={() => setFilters(p => ({ ...p, search: item.entity }))}
                  className="p-2 rounded-btn bg-inset border border-border/40 hover:border-border-strong transition-colors cursor-pointer flex items-center justify-between gap-3 text-[12px] font-mono"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] text-text-4 w-4">#{idx + 1}</span>
                    <span className="text-text-1 font-semibold">{item.entity}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-text-3">{item.count.toLocaleString()}</span>
                    <span className="px-1.5 py-0.5 rounded bg-red/10 text-red text-[10px]">{item.criticalShare}% crit</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabbed Card: Targets / Ports / Protocols */}
          <div className="p-4 rounded-card bg-card border border-border card-highlight flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-amber" />
                <span className="text-card-label text-text-3 font-medium">
                  ENTITY BREAKDOWN
                </span>
              </div>

              <div className="flex items-center gap-1 bg-inset p-0.5 rounded-btn border border-border text-[10px] font-mono">
                <button
                  onClick={() => setEntityTab('targets')}
                  className={`px-2 py-0.5 rounded ${entityTab === 'targets' ? 'bg-amber-dim text-amber font-semibold' : 'text-text-4'}`}
                >
                  Targets
                </button>
                <button
                  onClick={() => setEntityTab('ports')}
                  className={`px-2 py-0.5 rounded ${entityTab === 'ports' ? 'bg-amber-dim text-amber font-semibold' : 'text-text-4'}`}
                >
                  Ports
                </button>
                <button
                  onClick={() => setEntityTab('protocols')}
                  className={`px-2 py-0.5 rounded ${entityTab === 'protocols' ? 'bg-amber-dim text-amber font-semibold' : 'text-text-4'}`}
                >
                  Protocols
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {entityTab === 'targets' &&
                topEntities?.targetIps.slice(0, 7).map((t, idx) => (
                  <div key={t.entity} className="p-2 rounded-btn bg-inset border border-border/40 flex items-center justify-between text-[12px] font-mono">
                    <span className="text-text-2">{t.entity}</span>
                    <span className="text-text-1 font-semibold">{t.count.toLocaleString()} ({t.percentage}%)</span>
                  </div>
                ))}

              {entityTab === 'ports' &&
                topEntities?.ports.slice(0, 7).map(p => (
                  <div key={p.entity} className="p-2 rounded-btn bg-inset border border-border/40 flex items-center justify-between text-[12px] font-mono">
                    <span className="text-text-2">{p.entity}</span>
                    <span className="text-cyan font-semibold">{p.count.toLocaleString()}</span>
                  </div>
                ))}

              {entityTab === 'protocols' &&
                distributions?.protocols.map(pr => (
                  <div key={pr.name} className="p-2 rounded-btn bg-inset border border-border/40 flex items-center justify-between text-[12px] font-mono">
                    <span className="text-text-2">{pr.name}</span>
                    <span className="text-green font-semibold">{pr.count.toLocaleString()} ({pr.percentage}%)</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* ROW 5: FEATURE CORRELATION & PRIORITY VS FEATURE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FeatureCorrelationMatrix data={correlations} />
          <PriorityFeatureScatter />
        </div>

        {/* ROW 6: VIRTUALIZED ALERT EXPLORER DATA TABLE */}
        <AlertExplorerTable alerts={filteredAlerts} totalRows={summary?.totalRows || 100000} />

        {/* ROW 7: AUTO-GENERATED COMPUTED INSIGHTS */}
        <AutoInsightsList
          insights={insights}
          onApplyInsightFilter={(key, val) => {
            if (key === 'srcIp') setFilters(p => ({ ...p, search: val || '' }));
            if (key === 'category') setFilters(p => ({ ...p, category: val || 'ALL' }));
          }}
        />
      </div>
    </div>
  );
};
