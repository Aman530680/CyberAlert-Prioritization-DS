/**
 * OmniSentinel Sub-Bar Component
 * 36px bar featuring live UTC clock, simulation play/pause and speed selector,
 * and a framer-motion sliding segmented control for attack scenarios [DDOS][BRUTE FORCE][PORT SCAN].
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Play, Pause, Server, FastForward } from 'lucide-react';

export type ScenarioType = 'DDOS' | 'BRUTE FORCE' | 'PORT SCAN';

interface SubBarProps {
  currentScenario: ScenarioType;
  onScenarioChange: (scenario: ScenarioType) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
}

const SCENARIOS: ScenarioType[] = ['DDOS', 'BRUTE FORCE', 'PORT SCAN'];

export const SubBar: React.FC<SubBarProps> = ({
  currentScenario,
  onScenarioChange,
  isPlaying,
  onTogglePlay,
  speed,
  onSpeedChange,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toTimeString().slice(0, 8) + ' UTC');
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  // Arrow key navigation for scenarios
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const idx = SCENARIOS.indexOf(currentScenario);
    if (e.key === 'ArrowRight') {
      const next = SCENARIOS[(idx + 1) % SCENARIOS.length];
      onScenarioChange(next);
    } else if (e.key === 'ArrowLeft') {
      const prev = SCENARIOS[(idx - 1 + SCENARIOS.length) % SCENARIOS.length];
      onScenarioChange(prev);
    }
  };

  return (
    <div
      className="h-[36px] px-6 bg-inset border-b border-border flex items-center justify-between select-none z-10 text-[12px]"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Simulation Sub-Bar"
    >
      {/* Left: Security Operations Center Status + Live Time */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
          <span className="text-[12px] font-medium text-text-2">
            Security Operations Center
          </span>
        </div>

        <div className="w-[1px] h-3.5 bg-border" />

        <div className="flex items-center gap-1.5 text-text-3 font-mono text-[11px] tabular-nums">
          <Clock className="w-3.5 h-3.5 text-text-4" strokeWidth={1.5} />
          <span>{currentTime || '12:00:00 UTC'}</span>
        </div>
      </div>

      {/* Right: Simulation Environment Controls & Sliding Scenario Segmented Control */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 text-text-4 font-mono text-[11px]">
          <Server className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>Simulation Environment</span>
        </div>

        {/* Play / Pause Toggle */}
        <button
          onClick={onTogglePlay}
          aria-label={isPlaying ? 'Pause replay' : 'Play replay'}
          className="w-6 h-6 rounded-btn flex items-center justify-center text-text-2 hover:text-text-1 hover:bg-white/[0.06] transition-colors"
        >
          {isPlaying ? (
            <Pause className="w-3 h-3 text-amber" strokeWidth={2} />
          ) : (
            <Play className="w-3 h-3 text-green" strokeWidth={2} />
          )}
        </button>

        {/* Speed Selector (1x / 2x / 4x) */}
        <button
          onClick={() => onSpeedChange(speed === 1 ? 2 : speed === 2 ? 4 : 1)}
          className="px-1.5 py-0.5 rounded-btn bg-white/[0.04] border border-border text-[10px] font-mono text-text-3 hover:text-text-1 flex items-center gap-1"
        >
          <FastForward className="w-2.5 h-2.5" />
          <span>{speed}x</span>
        </button>

        {/* Sliding Segmented Control */}
        <div className="relative flex items-center bg-[#070709] border border-border rounded-btn p-0.5">
          {SCENARIOS.map(sc => {
            const isActive = currentScenario === sc;
            return (
              <button
                key={sc}
                onClick={() => onScenarioChange(sc)}
                className={`relative px-2.5 py-0.5 rounded-btn text-[10px] font-mono tracking-wider transition-colors z-10 ${
                  isActive ? 'text-amber font-semibold' : 'text-text-4 hover:text-text-2'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-scenario-pill"
                    className="absolute inset-0 rounded-btn bg-amber-dim border border-amber/40 shadow-glow-amber -z-10"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                {sc}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
