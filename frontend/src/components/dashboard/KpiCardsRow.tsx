/**
 * OmniSentinel KPI Cards Row
 * 4 metric cards with 2px colored top accent borders, glow accents,
 * tabular numbers, captions, hover tooltips, and bottom-right sparklines.
 */

import React from 'react';
import { ShieldAlert, Zap, TrendingUp, Network, HelpCircle } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { SimulationState } from '../../hooks/useSimulation';

interface KpiCardsRowProps {
  kpis: SimulationState['kpis'];
  history: SimulationState['trafficHistory'];
}

export const KpiCardsRow: React.FC<KpiCardsRowProps> = ({ kpis, history }) => {
  const cards = [
    {
      id: 'network-risk',
      title: 'NETWORK RISK',
      value: kpis.networkRisk,
      tag: `${kpis.riskDelta >= 0 ? `+${kpis.riskDelta}` : kpis.riskDelta} PROJECTED`,
      caption: `Severity: `,
      captionHighlight: kpis.severityLabel,
      captionColor:
        kpis.severity === 'CRITICAL'
          ? 'text-red'
          : kpis.severity === 'HIGH'
          ? 'text-orange'
          : kpis.severity === 'MEDIUM'
          ? 'text-cyan'
          : 'text-green',
      icon: ShieldAlert,
      color: '#d4a03c',
      glow: 'rgba(212,160,60,0.15)',
      tooltip: 'Composite real-time network attack exposure score based on alert density and active telemetry.',
      points: history.map(h => h.risk),
    },
    {
      id: 'anomaly-score',
      title: 'ANOMALY SCORE',
      value: kpis.anomalyScore,
      tag: 'STABLE',
      caption: `Trajectory: `,
      captionHighlight: kpis.anomalyTrajectory,
      captionColor: kpis.anomalyTrajectory === 'Rising' ? 'text-red' : 'text-green',
      icon: Zap,
      color: '#06b6d4',
      glow: 'rgba(6,182,212,0.15)',
      tooltip: 'Baseline deviation calculated via behavioral sequence entropy and frequency analysis.',
      points: history.map(h => Math.round(h.risk * 0.58)),
    },
    {
      id: 'forecast-risk',
      title: 'FORECAST RISK',
      value: kpis.forecastRisk,
      tag: `${kpis.forecastConfidence}% CONF.`,
      caption: 'Window: 5 minutes',
      captionHighlight: '',
      captionColor: 'text-text-3',
      icon: TrendingUp,
      color: '#3b82f6',
      glow: 'rgba(59,130,246,0.15)',
      tooltip: 'Predictive risk forecast for the next 5-minute operational window using Random Forest priors.',
      points: history.map(h => Math.min(100, h.risk + 3)),
    },
    {
      id: 'packets-per-sec',
      title: 'PACKETS / SEC',
      value: kpis.packetsPerSec.toLocaleString(),
      tag: 'NORMAL',
      caption: `Protocol: `,
      captionHighlight: kpis.protocol,
      captionColor: 'text-cyan',
      icon: Network,
      color: '#22c55e',
      glow: 'rgba(34,197,94,0.15)',
      tooltip: 'Current network ingress rate across monitored perimeter firewalls and IDS interfaces.',
      points: history.map(h => h.packetsPerSec),
    },
  ];

  return (
    <Tooltip.Provider delayDuration={300}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(card => {
          const Icon = card.icon;

          // Simple SVG sparkline
          const maxVal = Math.max(...card.points, 1);
          const minVal = Math.min(...card.points, 0);
          const range = maxVal - minVal || 1;
          const svgPoints = card.points
            .map((val, idx) => {
              const x = (idx / Math.max(1, card.points.length - 1)) * 64;
              const y = 22 - ((val - minVal) / range) * 20;
              return `${x},${y}`;
            })
            .join(' ');

          return (
            <div
              key={card.id}
              className="relative p-4 rounded-card bg-card border border-border hover:border-border-strong transition-all duration-base hover:-translate-y-[1px] card-highlight overflow-hidden group"
              style={{
                borderTop: `2px solid ${card.color}`,
                boxShadow: `0 4px 20px ${card.glow}`,
              }}
            >
              {/* Header: Icon + Card Label + Tag */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5" style={{ color: card.color }} strokeWidth={1.5} />
                  <span className="text-card-label text-text-3 font-medium">
                    {card.title}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className="px-1.5 py-0.5 rounded-badge border text-[10px] font-mono leading-none tracking-wider font-semibold"
                    style={{
                      borderColor: `${card.color}40`,
                      backgroundColor: `${card.color}15`,
                      color: card.color,
                    }}
                  >
                    {card.tag}
                  </span>

                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <button aria-label="Metric details" className="text-text-4 hover:text-text-2 transition-colors">
                        <HelpCircle className="w-3 h-3" />
                      </button>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        side="top"
                        sideOffset={6}
                        className="z-50 max-w-xs px-2.5 py-1.5 rounded-btn bg-[#0c0c0f] border border-border-strong text-[11px] text-text-2 shadow-xl"
                      >
                        {card.tooltip}
                        <Tooltip.Arrow className="fill-[#1c1c22]" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </div>
              </div>

              {/* Main Metric Value & Caption */}
              <div className="flex items-baseline justify-between mt-1">
                <div>
                  <div className="text-kpi font-mono text-text-1 tabular-nums font-semibold tracking-tight">
                    {card.value}
                  </div>
                  <div className="text-[12px] text-text-3 mt-1.5 flex items-center gap-1">
                    <span>{card.caption}</span>
                    <span className={`font-semibold ${card.captionColor}`}>
                      {card.captionHighlight}
                    </span>
                  </div>
                </div>

                {/* Bottom-right Sparkline */}
                {card.points.length > 2 && (
                  <div className="opacity-40 group-hover:opacity-80 transition-opacity">
                    <svg width="68" height="24" className="overflow-visible">
                      <polyline
                        fill="none"
                        stroke={card.color}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={svgPoints}
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Tooltip.Provider>
  );
};
