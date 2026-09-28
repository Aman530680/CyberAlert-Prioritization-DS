import React from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { Shield, Server, BellOff, Radio } from 'lucide-react';

interface ThreatIntelligenceProps {
  typesData: any[];
  severityData: any[];
  sourcesData: any[];
  systemsData: any[];
  noiseData: any;
  loading: boolean;
}

export const ThreatIntelligenceCharts: React.FC<ThreatIntelligenceProps> = ({
  typesData,
  severityData,
  sourcesData,
  systemsData,
  noiseData,
  loading
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="glass-panel p-6 rounded-2xl border border-soc-cardBorder animate-pulse h-80" />
        <div className="glass-panel p-6 rounded-2xl border border-soc-cardBorder animate-pulse h-80" />
      </div>
    );
  }

  // Prepare Noise Level Pie Data
  const noiseDist = noiseData?.noise_level_distribution || {};
  const noisePieData = [
    { name: 'Low Noise (Investigate)', value: noiseDist['LOW']?.count || 0, color: '#10b981' },
    { name: 'Medium Noise (Standard)', value: noiseDist['MEDIUM']?.count || 0, color: '#eab308' },
    { name: 'High Noise (Tuning Candidate)', value: noiseDist['HIGH']?.count || 0, color: '#ef4444' }
  ];

  return (
    <div className="space-y-6 mb-6">
      {/* REQUIRED VISUALS 1 & 3 ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* REQUIRED VISUAL 1: Alert Type Distribution */}
        <div className="glass-panel p-5 rounded-2xl border border-soc-cardBorder">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Alert Type Distribution & Frequency</h3>
                <p className="text-xs text-gray-400">Core Visual #1: Top attack vectors across 100,000 telemetry events</p>
              </div>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
              Taxonomy
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typesData.slice(0, 10)} layout="vertical" margin={{ top: 10, right: 30, left: 60, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="alert_type" stroke="#64748b" tick={{ fontSize: 9 }} width={75} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  itemStyle={{ color: '#f8fafc' }}
                  formatter={(val: any) => [`${val.toLocaleString()} alerts`, 'Volume']}
                />
                <Bar dataKey="total_alerts" fill="#06b6d4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* REQUIRED VISUAL 3: Severity vs System Impact Analysis */}
        <div className="glass-panel p-5 rounded-2xl border border-soc-cardBorder">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Severity Level vs. Incident Conversion Rate</h3>
                <p className="text-xs text-gray-400">Core Visual #3: Severity classification vs empirical true threat escalation</p>
              </div>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
              Impact vs Reality
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="severity" stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(s) => s.toUpperCase()} />
                <YAxis yAxisId="left" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" tick={{ fontSize: 10 }} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar yAxisId="left" dataKey="total_alerts" name="Total Alerts" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="incident_rate" name="Incident Conversion (%)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SYSTEMS & NOISE ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Affected Systems */}
        <div className="glass-panel p-5 rounded-2xl border border-soc-cardBorder lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">System Intelligence & High-Target Assets</h3>
                <p className="text-xs text-gray-400">Top entities subject to high-frequency telemetry and incidents</p>
              </div>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-300 border border-slate-700">
              Entity Risk
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={systemsData.slice(0, 8)} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="affected_system" stroke="#64748b" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" interval={0} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  itemStyle={{ color: '#f8fafc' }}
                  formatter={(val: any, name: any, item: any) => [
                    `${val} alerts (${item.payload.incident_count} incidents) - Category: ${item.payload.asset_category}`,
                    name
                  ]}
                />
                <Bar dataKey="total_alerts" name="Total Alerts" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="incident_count" name="Incidents" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Explainable Noise Analysis Distribution */}
        <div className="glass-panel p-5 rounded-2xl border border-soc-cardBorder flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
                  <BellOff className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Operational Noise Engine</h3>
                  <p className="text-xs text-gray-400">Explainable multi-signal noise scoring</p>
                </div>
              </div>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={noisePieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                  >
                    {noisePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                    itemStyle={{ color: '#f8fafc' }}
                    formatter={(val: any) => [`${val.toLocaleString()} alerts`, 'Count']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 text-xs border-t border-slate-800 pt-3">
            {noisePieData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-300">{item.name}</span>
                </div>
                <span className="font-mono text-white font-semibold">{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
