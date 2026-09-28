/**
 * OmniSentinel 7x24 Alert Heatmap SVG Component
 * 7 Days of the Week x 24 Hours of the Day intensity grid
 * with Amber color scale, hover tooltips, and day/hour labels.
 */

import React, { useState } from 'react';
import { HeatmapCell } from '../../types/alert';
import { Calendar } from 'lucide-react';

interface AlertHeatmapSvgProps {
  data: HeatmapCell[];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }).map((_, i) => String(i).padStart(2, '0'));

export const AlertHeatmapSvg: React.FC<AlertHeatmapSvgProps> = ({ data }) => {
  const [hoveredCell, setHoveredCell] = useState<{ day: number; hour: number; count: number; crit: number; x: number; y: number } | null>(null);

  const maxCount = Math.max(...data.map(d => d.count), 1);

  // Cell dimensions
  const cellWidth = 24;
  const cellHeight = 22;
  const gap = 3;
  const offsetX = 36;
  const offsetY = 20;

  return (
    <div className="p-4 rounded-card bg-card border border-border flex flex-col justify-between card-highlight relative">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber" strokeWidth={1.5} />
          <span className="text-card-label text-text-3 font-medium">
            ALERT DENSITY HEATMAP (WEEKDAY × HOUR UTC)
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-text-4">
          <span>Low</span>
          <div className="w-16 h-2 rounded bg-gradient-to-r from-amber/10 to-amber" />
          <span>Peak</span>
        </div>
      </div>

      <div className="overflow-x-auto py-2">
        <svg
          width={offsetX + 24 * (cellWidth + gap)}
          height={offsetY + 7 * (cellHeight + gap) + 10}
          className="select-none"
        >
          {/* Hour labels on top (every 2 hours) */}
          {HOURS.map((h, i) => {
            if (i % 2 !== 0 && i !== 23) return null;
            return (
              <text
                key={h}
                x={offsetX + i * (cellWidth + gap) + cellWidth / 2}
                y={12}
                textAnchor="middle"
                className="fill-text-4 text-[9px] font-mono"
              >
                {h}
              </text>
            );
          })}

          {/* Day labels on left */}
          {DAYS.map((d, dayIdx) => (
            <text
              key={d}
              x={24}
              y={offsetY + dayIdx * (cellHeight + gap) + cellHeight / 2 + 3}
              textAnchor="end"
              className="fill-text-4 text-[10px] font-mono"
            >
              {d}
            </text>
          ))}

          {/* Grid cells */}
          {DAYS.map((_, dayIdx) =>
            HOURS.map((_, hourIdx) => {
              const cell = data.find(c => c.day === dayIdx && c.hour === hourIdx) || { count: 0, criticalCount: 0 };
              const ratio = cell.count / maxCount;
              // Intensity between 0.05 and 0.95
              const alpha = Math.max(0.04, Math.min(0.95, ratio * 1.1));
              const x = offsetX + hourIdx * (cellWidth + gap);
              const y = offsetY + dayIdx * (cellHeight + gap);

              return (
                <rect
                  key={`${dayIdx}-${hourIdx}`}
                  x={x}
                  y={y}
                  width={cellWidth}
                  height={cellHeight}
                  rx={3}
                  fill={`rgba(212, 160, 60, ${alpha})`}
                  stroke={cell.count > 0 ? 'rgba(212, 160, 60, 0.2)' : '#1c1c22'}
                  strokeWidth={0.8}
                  className="cursor-pointer transition-opacity hover:opacity-100"
                  onMouseEnter={e => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHoveredCell({
                      day: dayIdx,
                      hour: hourIdx,
                      count: cell.count,
                      crit: cell.criticalCount,
                      x: rect.x + rect.width / 2,
                      y: rect.y - 10,
                    });
                  }}
                  onMouseLeave={() => setHoveredCell(null)}
                />
              );
            })
          )}
        </svg>
      </div>

      {/* Floating Tooltip */}
      {hoveredCell && (
        <div
          className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-full px-2.5 py-1.5 rounded-btn bg-[#09090b] border border-border-strong text-[11px] font-mono text-text-1 shadow-2xl card-highlight"
          style={{ left: hoveredCell.x, top: hoveredCell.y }}
        >
          <div className="text-text-4 text-[10px] pb-1 border-b border-border">
            {DAYS[hoveredCell.day]} @ {HOURS[hoveredCell.hour]}:00 UTC
          </div>
          <div className="flex items-center justify-between gap-4 mt-1">
            <span className="text-text-3">Total Ingress:</span>
            <span className="text-amber font-semibold tabular-nums">{hoveredCell.count.toLocaleString()}</span>
          </div>
          {hoveredCell.crit > 0 && (
            <div className="flex items-center justify-between gap-4 text-red">
              <span>Critical:</span>
              <span className="font-semibold tabular-nums">{hoveredCell.crit.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
