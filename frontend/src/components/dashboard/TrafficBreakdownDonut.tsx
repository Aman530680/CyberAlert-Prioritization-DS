/**
 * OmniSentinel Traffic Breakdown by Type Donut Card
 * Recharts donut (inner radius 62%, paddingAngle 2) with center total,
 * hover segment dimming, and custom divided legend.
 */

import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import { SimulationState } from '../../hooks/useSimulation';

interface TrafficBreakdownDonutProps {
  breakdown: SimulationState['trafficBreakdown'];
}

export const TrafficBreakdownDonut: React.FC<TrafficBreakdownDonutProps> = ({ breakdown }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const total = breakdown.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="p-4 rounded-card bg-card border border-border flex flex-col justify-between card-highlight">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <PieIcon className="w-4 h-4 text-orange" strokeWidth={1.5} />
          <span className="text-card-label text-text-3 font-medium">
            TRAFFIC BREAKDOWN BY TYPE
          </span>
        </div>
      </div>

      {/* Donut Chart with Center Total */}
      <div className="relative w-full h-[190px] flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={breakdown}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              stroke="#101013"
              strokeWidth={2}
              onMouseEnter={(_, idx) => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {breakdown.map((entry, index) => {
                const isHovered = hoveredIdx === index;
                const isOtherHovered = hoveredIdx !== null && !isHovered;
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    opacity={isOtherHovered ? 0.35 : 1}
                    className="transition-opacity duration-base cursor-pointer"
                  />
                );
              })}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Total */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-mono text-[22px] font-semibold text-text-1 tabular-nums leading-none">
            {total.toLocaleString()}
          </span>
          <span className="text-[9px] font-mono tracking-widest text-text-4 uppercase mt-1">
            TOTAL FLOW
          </span>
        </div>
      </div>

      {/* Divided Legend Rows */}
      <div className="space-y-1.5 pt-2">
        {breakdown.map((item, idx) => (
          <div
            key={item.name}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            className={`flex items-center justify-between py-1 px-1.5 rounded-btn border-b border-border/50 transition-colors cursor-pointer ${
              hoveredIdx === idx ? 'bg-white/[0.04]' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[13px] text-text-2 font-normal">
                {item.name}
              </span>
            </div>

            <div className="flex items-center gap-2 font-mono text-[12px] tabular-nums">
              <span className="text-text-4">{item.value.toLocaleString()}</span>
              <span style={{ color: item.color }} className="font-semibold w-9 text-right">
                {item.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
