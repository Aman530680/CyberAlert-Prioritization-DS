/**
 * OmniSentinel Auto-Generated Insights Card
 * Renders algorithmic analytical findings derived directly from the dataset
 * with contextual trigger actions ('Filter to this').
 */

import React from 'react';
import { Lightbulb, ShieldAlert, Network, Clock, ArrowRight } from 'lucide-react';
import { AutoInsight } from '../../types/alert';

interface AutoInsightsListProps {
  insights: AutoInsight[];
  onApplyInsightFilter: (filterKey?: string, filterValue?: string) => void;
}

export const AutoInsightsList: React.FC<AutoInsightsListProps> = ({
  insights,
  onApplyInsightFilter,
}) => {
  const getIcon = (type: AutoInsight['type']) => {
    switch (type) {
      case 'critical':
        return <ShieldAlert className="w-4 h-4 text-red" />;
      case 'network':
        return <Network className="w-4 h-4 text-cyan" />;
      case 'volume':
        return <Clock className="w-4 h-4 text-amber" />;
      default:
        return <Lightbulb className="w-4 h-4 text-orange" />;
    }
  };

  return (
    <div className="p-4 rounded-card bg-card border border-border flex flex-col justify-between card-highlight">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber" strokeWidth={1.5} />
          <span className="text-card-label text-text-3 font-medium">
            COMPUTED SOC INTELLIGENCE INSIGHTS
          </span>
        </div>
        <span className="text-[10px] font-mono text-text-4">
          Empirical Data-Driven
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {insights.map(item => (
          <div
            key={item.id}
            className="p-3 rounded-lg bg-inset border border-border flex flex-col justify-between space-y-2 card-highlight"
          >
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded bg-white/[0.04] shrink-0 mt-0.5">
                {getIcon(item.type)}
              </div>
              <div>
                <div className="text-[13px] font-semibold text-text-1">
                  {item.title}
                </div>
                <div className="text-[12px] text-text-3 leading-relaxed mt-0.5">
                  {item.description}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[11px] font-mono">
              <span className="text-text-4">{item.metric}</span>
              {item.filterKey && item.filterValue && (
                <button
                  onClick={() => onApplyInsightFilter(item.filterKey, item.filterValue)}
                  className="text-amber hover:text-amber/80 flex items-center gap-1 transition-colors"
                >
                  <span>Filter to this</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
