/**
 * OmniSentinel Scenario Event Feed
 * Displays live incoming threat signals with severity badges,
 * left accent bar on hover, click-to-expand details, and bottom fade mask.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, ChevronDown } from 'lucide-react';
import { SignalEvent } from '../../hooks/useSimulation';
import { MappedSeverity } from '../../types/alert';

interface ScenarioEventFeedProps {
  signals: SignalEvent[];
}

export const ScenarioEventFeed: React.FC<ScenarioEventFeedProps> = ({ signals }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getSeverityBadge = (sev: MappedSeverity) => {
    switch (sev) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 rounded-badge bg-red text-white text-[10px] font-mono font-bold">
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded-badge border border-orange/40 bg-orange/10 text-orange text-[10px] font-mono font-semibold">
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 rounded-badge border border-cyan/40 bg-cyan/10 text-cyan text-[10px] font-mono font-semibold">
            MEDIUM
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="px-2 py-0.5 rounded-badge border border-green/40 bg-green/10 text-green text-[10px] font-mono font-semibold">
            LOW
          </span>
        );
    }
  };

  const getAccentColor = (sev: MappedSeverity) => {
    switch (sev) {
      case 'CRITICAL': return '#dc2626';
      case 'HIGH': return '#f59e0b';
      case 'MEDIUM': return '#06b6d4';
      case 'LOW': return '#22c55e';
    }
  };

  return (
    <div className="p-4 rounded-card bg-card border border-border flex flex-col justify-between card-highlight">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-red" strokeWidth={1.5} />
          <span className="text-card-label text-text-3 font-medium">
            SCENARIO EVENT FEED
          </span>
        </div>

        <span className="px-2 py-0.5 rounded-badge bg-white/[0.05] border border-border text-[10px] font-mono text-text-3">
          {signals.length} SIGNALS
        </span>
      </div>

      {/* Feed List with Fade Mask */}
      <div
        className="relative max-h-[360px] overflow-y-auto space-y-1 pr-1"
        style={{
          maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
        }}
      >
        {signals.length === 0 ? (
          <div className="py-12 text-center text-text-4 font-mono text-[12px]">
            <span>Waiting for active telemetry feed…</span>
          </div>
        ) : (
          signals.map(signal => {
            const isExpanded = expandedId === signal.id;
            const accent = getAccentColor(signal.severity);

            return (
              <div
                key={signal.id}
                onClick={() => setExpandedId(isExpanded ? null : signal.id)}
                className="group relative rounded-btn border border-border/40 bg-[#09090b]/60 hover:bg-white/[0.03] transition-colors p-2.5 cursor-pointer overflow-hidden"
              >
                {/* 2px Colored Bar on Hover */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-[2px] opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: accent }}
                />

                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 truncate">
                    <div className="text-[13px] text-text-1 font-medium truncate">
                      {signal.title}
                    </div>
                    <div className="text-[11px] font-mono text-text-4 mt-0.5 flex items-center gap-2">
                      <span>{signal.subTitle}</span>
                      <span>·</span>
                      <span>{signal.timestamp}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {getSeverityBadge(signal.severity)}
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-text-4 transition-transform duration-base ${
                        isExpanded ? 'rotate-180 text-text-1' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 }}
                      className="mt-3 pt-2.5 border-t border-border/60 text-[11px] font-mono space-y-1.5"
                    >
                      <div className="grid grid-cols-2 gap-2 text-text-3">
                        <div>
                          <span className="text-text-4">Target:</span>{' '}
                          <span className="text-text-2">{signal.targetIp}:{signal.targetPort}</span>
                        </div>
                        <div>
                          <span className="text-text-4">Protocol:</span>{' '}
                          <span className="text-cyan">{signal.protocol}</span>
                        </div>
                        {signal.mitreTechnique && (
                          <div className="col-span-2">
                            <span className="text-text-4">MITRE ATT&CK:</span>{' '}
                            <span className="text-amber">{signal.mitreTechnique}</span>
                          </div>
                        )}
                      </div>

                      {signal.rawLog && (
                        <div className="p-2 rounded bg-black/50 border border-border/50 text-[10px] text-text-4 break-all leading-normal">
                          {signal.rawLog.slice(0, 160)}…
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
