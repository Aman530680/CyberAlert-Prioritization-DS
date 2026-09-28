/**
 * OmniSentinel Priority vs Feature Distribution Widget
 * Interactive scatter / quantile box visualization showing feature distributions
 * partitioned by alert priority class (CRITICAL, HIGH, MEDIUM, LOW).
 */

import React, { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { MappedSeverity } from '../../types/alert';

type FeatureOption = 'Risk Score' | 'Confidence' | 'Baseline Dev' | 'Entropy';

const STATS_BY_FEATURE: Record<FeatureOption, Record<MappedSeverity, { min: number; q1: number; med: number; q3: number; max: number }>> = {
  'Risk Score': {
    CRITICAL: { min: 65, q1: 76, med: 84, q3: 92, max: 100 },
    HIGH: { min: 45, q1: 58, med: 68, q3: 78, max: 88 },
    MEDIUM: { min: 25, q1: 38, med: 48, q3: 56, max: 68 },
    LOW: { min: 0, q1: 14, med: 24, q3: 35, max: 48 },
  },
  'Confidence': {
    CRITICAL: { min: 0.55, q1: 0.72, med: 0.85, q3: 0.94, max: 1.0 },
    HIGH: { min: 0.40, q1: 0.55, med: 0.68, q3: 0.82, max: 0.95 },
    MEDIUM: { min: 0.20, q1: 0.35, med: 0.48, q3: 0.62, max: 0.80 },
    LOW: { min: 0.05, q1: 0.18, med: 0.32, q3: 0.45, max: 0.65 },
  },
  'Baseline Dev': {
    CRITICAL: { min: 2.1, q1: 3.2, med: 4.1, q3: 4.6, max: 5.0 },
    HIGH: { min: 1.5, q1: 2.4, med: 3.1, q3: 3.8, max: 4.4 },
    MEDIUM: { min: 0.8, q1: 1.5, med: 2.2, q3: 2.8, max: 3.5 },
    LOW: { min: 0.0, q1: 0.4, med: 0.9, q3: 1.5, max: 2.2 },
  },
  'Entropy': {
    CRITICAL: { min: 4.8, q1: 5.9, med: 6.8, q3: 7.4, max: 8.0 },
    HIGH: { min: 3.5, q1: 4.8, med: 5.6, q3: 6.4, max: 7.2 },
    MEDIUM: { min: 2.2, q1: 3.5, med: 4.2, q3: 5.1, max: 6.0 },
    LOW: { min: 0.5, q1: 1.8, med: 2.8, q3: 3.6, max: 4.5 },
  },
};

const SEV_COLORS: Record<MappedSeverity, string> = {
  CRITICAL: '#dc2626',
  HIGH: '#f59e0b',
  MEDIUM: '#06b6d4',
  LOW: '#22c55e',
};

export const PriorityFeatureScatter: React.FC = () => {
  const [selectedFeature, setSelectedFeature] = useState<FeatureOption>('Risk Score');

  const currentStats = STATS_BY_FEATURE[selectedFeature];
  const severities: MappedSeverity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  // Global scale for selected feature
  const isConfidence = selectedFeature === 'Confidence';
  const scaleMax = isConfidence ? 1.0 : selectedFeature === 'Baseline Dev' ? 5.0 : selectedFeature === 'Entropy' ? 8.0 : 100;

  return (
    <div className="p-4 rounded-card bg-card border border-border flex flex-col justify-between card-highlight">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-orange" strokeWidth={1.5} />
          <span className="text-card-label text-text-3 font-medium">
            FEATURE DISTRIBUTION BY PRIORITY
          </span>
        </div>

        <select
          value={selectedFeature}
          onChange={e => setSelectedFeature(e.target.value as FeatureOption)}
          aria-label="Select feature for distribution"
          className="bg-inset border border-border text-[11px] font-mono text-text-2 px-2 py-1 rounded-btn outline-none hover:border-border-strong cursor-pointer"
        >
          <option value="Risk Score">Risk Score</option>
          <option value="Confidence">Confidence Score</option>
          <option value="Baseline Dev">Baseline Deviation</option>
          <option value="Entropy">Entropy Score</option>
        </select>
      </div>

      {/* Box / Range Distribution Visual */}
      <div className="space-y-4 my-2">
        {severities.map(sev => {
          const s = currentStats[sev];
          const color = SEV_COLORS[sev];
          const leftPct = (s.min / scaleMax) * 100;
          const q1Pct = (s.q1 / scaleMax) * 100;
          const medPct = (s.med / scaleMax) * 100;
          const q3Pct = (s.q3 / scaleMax) * 100;
          const rightPct = (s.max / scaleMax) * 100;

          return (
            <div key={sev} className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="font-semibold" style={{ color }}>{sev}</span>
                <span className="text-text-4">Median: <strong className="text-text-1">{s.med}</strong></span>
              </div>

              {/* Horizontal Box & Whisker Track */}
              <div className="relative w-full h-5 bg-inset rounded-btn border border-border flex items-center px-1 overflow-hidden">
                {/* Whisker Line (min to max) */}
                <div
                  className="absolute h-[1px] bg-text-4/50"
                  style={{
                    left: `${leftPct}%`,
                    width: `${rightPct - leftPct}%`,
                  }}
                />

                {/* Box (Q1 to Q3) */}
                <div
                  className="absolute h-3.5 rounded-sm border"
                  style={{
                    left: `${q1Pct}%`,
                    width: `${q3Pct - q1Pct}%`,
                    backgroundColor: `${color}25`,
                    borderColor: color,
                  }}
                />

                {/* Median Divider */}
                <div
                  className="absolute h-4 w-[2px] bg-white shadow-sm"
                  style={{ left: `${medPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between text-[10px] font-mono text-text-4 pt-2 border-t border-border">
        <span>0.0</span>
        <span>Interquartile Range (IQR) & Median</span>
        <span>{scaleMax.toFixed(1)}</span>
      </div>
    </div>
  );
};
