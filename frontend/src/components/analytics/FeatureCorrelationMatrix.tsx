/**
 * OmniSentinel Feature Correlation Matrix Heatmap
 * Displays Pearson correlation coefficients across numerical attributes
 * using a diverging blue -> neutral -> amber scale.
 */

import React, { useState } from 'react';
import { CorrelationMatrixItem } from '../../types/alert';
import { GitCompare } from 'lucide-react';

interface FeatureCorrelationMatrixProps {
  data: CorrelationMatrixItem[];
}

const FEATURES = ['Risk Score', 'Confidence', 'Baseline Dev', 'Entropy', 'Bytes'];

export const FeatureCorrelationMatrix: React.FC<FeatureCorrelationMatrixProps> = ({ data }) => {
  const [hovered, setHovered] = useState<CorrelationMatrixItem | null>(null);

  const getColor = (coeff: number) => {
    if (coeff >= 0) {
      // 0 to 1 -> Amber
      const alpha = Math.min(1, Math.max(0.1, coeff));
      return `rgba(212, 160, 60, ${alpha})`;
    } else {
      // -1 to 0 -> Blue
      const alpha = Math.min(1, Math.max(0.1, Math.abs(coeff)));
      return `rgba(59, 130, 246, ${alpha})`;
    }
  };

  return (
    <div className="p-4 rounded-card bg-card border border-border flex flex-col justify-between card-highlight">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-cyan" strokeWidth={1.5} />
          <span className="text-card-label text-text-3 font-medium">
            FEATURE CORRELATION MATRIX
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-text-4">
          <span className="text-blue">-1.0 (Neg)</span>
          <div className="w-12 h-2 rounded bg-gradient-to-r from-blue via-[#1c1c22] to-amber" />
          <span className="text-amber">+1.0 (Pos)</span>
        </div>
      </div>

      <div className="overflow-x-auto my-2">
        <div className="grid grid-cols-6 gap-1 min-w-[340px] text-[11px] font-mono">
          {/* Header row */}
          <div className="h-7" />
          {FEATURES.map(f => (
            <div key={f} className="h-7 flex items-center justify-center text-text-4 truncate text-[9px] uppercase px-1">
              {f.split(' ')[0]}
            </div>
          ))}

          {/* Matrix Rows */}
          {FEATURES.map(rowFeature => (
            <React.Fragment key={rowFeature}>
              <div className="h-9 flex items-center text-text-4 truncate text-[10px] pr-2">
                {rowFeature}
              </div>

              {FEATURES.map(colFeature => {
                const item = data.find(
                  d =>
                    (d.featureA === rowFeature && d.featureB === colFeature) ||
                    (d.featureA === colFeature && d.featureB === rowFeature)
                ) || { featureA: rowFeature, featureB: colFeature, coefficient: 0.0 };

                const bg = getColor(item.coefficient);

                return (
                  <div
                    key={`${rowFeature}-${colFeature}`}
                    onMouseEnter={() => setHovered(item)}
                    onMouseLeave={() => setHovered(null)}
                    style={{ backgroundColor: bg }}
                    className="h-9 rounded-btn flex items-center justify-center font-semibold text-[11px] cursor-pointer border border-border/40 hover:border-text-1 transition-all tabular-nums text-text-1"
                  >
                    {item.coefficient > 0 ? `+${item.coefficient}` : item.coefficient}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Tooltip Description */}
      <div className="mt-2 text-[11px] font-mono text-text-4 text-center h-4">
        {hovered ? (
          <span className="text-text-2">
            {hovered.featureA} ↔ {hovered.featureB}: <strong className="text-amber">{hovered.coefficient}</strong> r
          </span>
        ) : (
          <span>Hover a cell to inspect bivariate Pearson correlation</span>
        )}
      </div>
    </div>
  );
};
