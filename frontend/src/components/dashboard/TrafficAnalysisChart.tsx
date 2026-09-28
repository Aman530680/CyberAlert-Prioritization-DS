/**
 * OmniSentinel Scenario Traffic & Risk Analysis Chart
 * High-precision Recharts line chart tracking Packets/sec (cyan) and SYN Flood Rate (amber)
 * with dashed hairline grids, monotone curves, custom tooltip, and clickable legend.
 */

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Activity } from 'lucide-react';
import { TrafficHistoryPoint } from '../../hooks/useSimulation';

interface TrafficAnalysisChartProps {
  data: TrafficHistoryPoint[];
  isRealDataReplay?: boolean;
}

export const TrafficAnalysisChart: React.FC<TrafficAnalysisChartProps> = ({
  data,
  isRealDataReplay = true,
}) => {
  const [showPackets, setShowPackets] = useState(true);
  const [showSynFlood, setShowSynFlood] = useState(true);

  // Auto-scale Y maximum
  const maxVal = Math.max(...data.map(d => Math.max(d.packetsPerSec, d.synFloodRate, 500)));
  const yDomainMax = Math.ceil(maxVal / 250) * 250;

  return (
    <div className="p-4 rounded-card bg-card border border-border flex flex-col justify-between card-highlight">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan" strokeWidth={1.5} />
          <span className="text-card-label text-text-3 font-medium">
            SCENARIO TRAFFIC & RISK ANALYSIS
          </span>
        </div>

        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-badge bg-green/10 border border-green/30 text-[10px] font-mono text-green leading-none">
          <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
          {isRealDataReplay ? 'DATASET REPLAY' : 'SIMULATION'}
        </span>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-[260px] relative">
        {data.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-text-4 font-mono text-[12px]">
            <span>Waiting for signal…</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 4"
                stroke="#1c1c22"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                stroke="#52525b"
                tick={{ fill: '#52525b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                tickLine={false}
                axisLine={{ stroke: '#1c1c22' }}
              />
              <YAxis
                domain={[0, yDomainMax]}
                stroke="#52525b"
                tick={{ fill: '#52525b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                tickLine={false}
                axisLine={{ stroke: '#1c1c22' }}
                width={50}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  return (
                    <div className="p-2.5 rounded-lg bg-[#09090b] border border-border-strong shadow-2xl text-[12px] font-mono card-highlight">
                      <div className="text-text-4 text-[10px] mb-1.5 pb-1 border-b border-border">
                        {label} UTC
                      </div>
                      {payload.map((item: any) => (
                        <div key={item.name} className="flex items-center justify-between gap-4 py-0.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-sm"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-text-3">{item.name}:</span>
                          </div>
                          <span className="text-text-1 font-semibold tabular-nums">
                            {item.value?.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              {showPackets && (
                <Line
                  type="monotone"
                  dataKey="packetsPerSec"
                  name="Packets / sec"
                  stroke="#06b6d4"
                  strokeWidth={1.5}
                  dot={{ r: 2.5, fill: '#06b6d4', stroke: '#101013', strokeWidth: 1.5 }}
                  activeDot={{ r: 5, fill: '#06b6d4', stroke: '#ffffff', strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              )}
              {showSynFlood && (
                <Line
                  type="monotone"
                  dataKey="synFloodRate"
                  name="SYN Flood Rate"
                  stroke="#d4a03c"
                  strokeWidth={1.5}
                  dot={{ r: 2.5, fill: '#d4a03c', stroke: '#101013', strokeWidth: 1.5 }}
                  activeDot={{ r: 5, fill: '#d4a03c', stroke: '#ffffff', strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Clickable Legend at Bottom */}
      <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-border">
        <button
          onClick={() => setShowPackets(p => !p)}
          className={`flex items-center gap-2 text-[12px] font-mono transition-opacity ${
            showPackets ? 'opacity-100 text-text-2' : 'opacity-40 text-text-4 line-through'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-cyan" />
          <span>Packets / sec</span>
        </button>

        <button
          onClick={() => setShowSynFlood(p => !p)}
          className={`flex items-center gap-2 text-[12px] font-mono transition-opacity ${
            showSynFlood ? 'opacity-100 text-text-2' : 'opacity-40 text-text-4 line-through'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-amber" />
          <span>SYN Flood Rate</span>
        </button>
      </div>
    </div>
  );
};
