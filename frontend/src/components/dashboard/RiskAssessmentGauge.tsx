/**
 * OmniSentinel Risk Assessment Card
 * Custom SVG 270° circular gauge with tick marks, ease animation,
 * center score, forecast & delta mini-boxes, and 3-zone segmented bar.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, Activity } from 'lucide-react';

interface RiskAssessmentGaugeProps {
  currentRisk: number;
  forecastRisk: number;
  riskDelta: number;
}

export const RiskAssessmentGauge: React.FC<RiskAssessmentGaugeProps> = ({
  currentRisk,
  forecastRisk,
  riskDelta,
}) => {
  const clampedRisk = Math.max(0, Math.min(100, currentRisk));

  // Determine risk level color & label
  let statusColor = '#22c55e'; // Green
  let statusLabel = 'NORMAL';
  if (clampedRisk >= 67) {
    statusColor = '#dc2626'; // Red
    statusLabel = 'CRITICAL';
  } else if (clampedRisk >= 34) {
    statusColor = '#d4a03c'; // Amber
    statusLabel = 'ELEVATED';
  }

  // 270° Gauge Math:
  // Circle radius 60, circumference = 2 * PI * 60 = 376.99
  // 270° = 3/4 of circle = 282.74 arc length
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const maxArcLength = circumference * 0.75;
  const strokeDashoffset = maxArcLength - (clampedRisk / 100) * maxArcLength;

  // 10 Tick marks around 270°
  const ticks = Array.from({ length: 11 }).map((_, i) => {
    // 270° spans from 135° to 405° (or -225° to 45°)
    const angle = 135 + i * (270 / 10);
    const rad = (angle * Math.PI) / 180;
    const x1 = 100 + (radius + 10) * Math.cos(rad);
    const y1 = 100 + (radius + 10) * Math.sin(rad);
    const x2 = 100 + (radius + 15) * Math.cos(rad);
    const y2 = 100 + (radius + 15) * Math.sin(rad);
    return { x1, y1, x2, y2, val: i * 10 };
  });

  return (
    <div className="p-4 rounded-card bg-card border border-border flex flex-col justify-between card-highlight">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber" strokeWidth={1.5} />
          <span className="text-card-label text-text-3 font-medium">
            RISK ASSESSMENT
          </span>
        </div>
        <span
          className="px-2 py-0.5 rounded-badge border text-[10px] font-mono font-semibold"
          style={{
            borderColor: `${statusColor}40`,
            backgroundColor: `${statusColor}15`,
            color: statusColor,
          }}
        >
          {statusLabel}
        </span>
      </div>

      {/* 270° SVG Gauge */}
      <div className="relative w-full flex items-center justify-center my-2">
        <svg width="200" height="175" viewBox="0 0 200 200" className="overflow-visible">
          {/* Tick marks */}
          {ticks.map((t, idx) => (
            <line
              key={idx}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke="#52525b"
              strokeWidth="1.2"
              opacity="0.4"
            />
          ))}

          {/* Background Track Arc (270°) */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="#1c1c22"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${maxArcLength} ${circumference}`}
            transform="rotate(135 100 100)"
          />

          {/* Value Arc (270°) */}
          <motion.circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={statusColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${maxArcLength} ${circumference}`}
            initial={{ strokeDashoffset: maxArcLength }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            transform="rotate(135 100 100)"
          />

          {/* Center Text */}
          <text
            x="100"
            y="96"
            textAnchor="middle"
            className="fill-text-1 font-mono font-semibold text-[34px] tabular-nums"
          >
            {clampedRisk}
          </text>
          <text
            x="100"
            y="118"
            textAnchor="middle"
            fill={statusColor}
            className="text-[10px] font-mono tracking-[0.16em] uppercase font-semibold"
          >
            {statusLabel}
          </text>
        </svg>
      </div>

      {/* Two Mini Boxes: Forecast Risk & Risk Delta */}
      <div className="grid grid-cols-2 gap-2.5 my-2">
        <div className="p-3 rounded-lg bg-inset border border-border flex flex-col justify-between card-highlight">
          <span className="text-[10px] font-mono text-text-4 tracking-wider uppercase">
            FORECAST RISK
          </span>
          <div className="text-[20px] font-mono font-semibold text-blue mt-1 tabular-nums">
            {forecastRisk}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-inset border border-border flex flex-col justify-between card-highlight">
          <span className="text-[10px] font-mono text-text-4 tracking-wider uppercase">
            RISK DELTA
          </span>
          <div className="flex items-center gap-1 text-[20px] font-mono font-semibold text-amber mt-1 tabular-nums">
            {riskDelta >= 0 ? (
              <ArrowUp className="w-4 h-4 text-amber" />
            ) : (
              <ArrowDown className="w-4 h-4 text-green" />
            )}
            <span>{riskDelta >= 0 ? `+${riskDelta}` : riskDelta}</span>
          </div>
        </div>
      </div>

      {/* 3-Zone Segmented Bar with Marker Triangle */}
      <div className="mt-2 space-y-1">
        <div className="relative w-full h-[6px] flex gap-[2px]">
          <div className="flex-1 bg-green/70 rounded-l-[3px]" />
          <div className="flex-1 bg-amber/70" />
          <div className="flex-1 bg-red/70 rounded-r-[3px]" />

          {/* White Marker Triangle */}
          <div
            className="absolute -top-1.5 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-white transition-all duration-300"
            style={{ left: `calc(${clampedRisk}% - 4px)` }}
          />
        </div>

        <div className="flex justify-between text-[9px] font-mono text-text-4">
          <span>0 SAFE</span>
          <span>50 MOD</span>
          <span>100 CRIT</span>
        </div>
      </div>
    </div>
  );
};
