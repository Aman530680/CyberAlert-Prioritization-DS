import React from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell
} from 'recharts';
import { Calendar, Clock, BarChart3, AlertOctagon } from 'lucide-react';

interface TrendChartsProps {
  trendsData: any;
  typesData: any[];
  prioritiesData: any[];
  loading: boolean;
}

export const TrendCharts: React.FC<TrendChartsProps> = ({
  trendsData,
  typesData,
  prioritiesData,
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

  // Sample or slice daily trends for clean chart rendering
  const dailyTrends = trendsData?.daily_trends?.slice(-45) || [];
  const hourlyTrends = trendsData?.hourly_trends || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* REQUIRED VISUAL 2: Alert Volume Over Time & Incidents */}
      <div className="glass-panel p-5 rounded-2xl border border-soc-cardBorder">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Alert Volume & Confirmed Incidents Over Time</h3>
              <p className="text-xs text-gray-400">Core Visual #2: Temporal volume velocity vs verified threat escalation</p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
            Daily Timeline
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="alertGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                itemStyle={{ color: '#f8fafc' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
              <Area type="monotone" dataKey="alert_count" name="Total Alerts" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#alertGrad)" />
              <Area type="monotone" dataKey="incident_count" name="Confirmed Incidents" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#incGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* REQUIRED VISUAL 4: Alert Type vs Incident Rate */}
      <div className="glass-panel p-5 rounded-2xl border border-soc-cardBorder">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Alert Type vs. Incident Conversion Rate (%)</h3>
              <p className="text-xs text-gray-400">Core Visual #4: Threat fidelity by attack classification</p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-rose-300 border border-slate-700">
            Top Attack Vectors
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={typesData.slice(0, 8)} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="alert_type" stroke="#64748b" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" interval={0} />
              <YAxis yAxisId="left" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#f43f5e" tick={{ fontSize: 10 }} unit="%" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                itemStyle={{ color: '#f8fafc' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
              <Bar yAxisId="left" dataKey="total_alerts" name="Total Volume" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="incident_rate" name="Incident Rate (%)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ADDITIONAL VISUAL: 24-Hour Diurnal Distribution */}
      <div className="glass-panel p-5 rounded-2xl border border-soc-cardBorder">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">24-Hour Diurnal Alert & Attack Distribution</h3>
              <p className="text-xs text-gray-400">Business hours (08:00 - 18:00) vs. Off-hours stealth bursts</p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
            Hourly Heat
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(h) => `${h}:00`} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                itemStyle={{ color: '#f8fafc' }}
                labelFormatter={(h) => `Time: ${h}:00 - ${h}:59`}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
              <Bar dataKey="alert_count" name="Alerts" fill="#6366f1" radius={[3, 3, 0, 0]} />
              <Bar dataKey="incident_count" name="Incidents" fill="#ef4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ADDITIONAL VISUAL: Triage Priority Distribution */}
      <div className="glass-panel p-5 rounded-2xl border border-soc-cardBorder">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">SOC Triage Queue Priority Allocation</h3>
              <p className="text-xs text-gray-400">Distribution of calibrated priority tiers across 100,000 events</p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-purple-300 border border-slate-700">
            Escalation Ladder
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={prioritiesData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="priority" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 'bold' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                itemStyle={{ color: '#f8fafc' }}
                formatter={(val: any, name: any, item: any) => [
                  `${val.toLocaleString()} alerts (${item.payload.percentage}%) - Mean Prob: ${item.payload.avg_incident_probability}%`,
                  'Volume'
                ]}
              />
              <Bar dataKey="count" name="Alert Count" radius={[0, 4, 4, 0]}>
                {prioritiesData.map((entry, index) => {
                  let color = '#10b981';
                  if (entry.priority === 'CRITICAL') color = '#ef4444';
                  if (entry.priority === 'HIGH') color = '#f97316';
                  if (entry.priority === 'MEDIUM') color = '#eab308';
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
