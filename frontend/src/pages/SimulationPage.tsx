/**
 * OmniSentinel Simulation Page
 * Interactive tuning console for attack scenarios, packet burst multipliers,
 * and red-team replay parameters.
 */

import React from 'react';
import { Cpu, Play, Pause, FastForward, RotateCcw, Sliders } from 'lucide-react';
import { useSimulation } from '../hooks/useSimulation';

export const SimulationPage: React.FC = () => {
  const { isPlaying, togglePlay, speed, setSpeed, scenario, setScenario, state } = useSimulation();

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-[20px] font-semibold text-text-1">Red-Team Simulation Environment</h1>
        <p className="text-[12px] text-text-4 font-mono mt-0.5">Configure live attack parameters and dataset replay mechanics</p>
      </div>

      {/* Control Panel */}
      <div className="p-6 rounded-card bg-card border border-border card-highlight space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber" />
            <span className="text-card-label text-text-3 font-medium">REPLAY CONTROLLER</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="px-3 py-1.5 rounded-btn bg-amber text-[#1a1205] text-[12px] font-semibold flex items-center gap-1.5 hover:bg-amber/90 transition-colors"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pause Simulation' : 'Resume Simulation'}</span>
            </button>
          </div>
        </div>

        {/* Scenario Selection */}
        <div className="space-y-2">
          <span className="text-[11px] font-mono text-text-4 uppercase">ACTIVE ATTACK VECTOR</span>
          <div className="grid grid-cols-3 gap-3">
            {(['DDOS', 'BRUTE FORCE', 'PORT SCAN'] as const).map(sc => (
              <button
                key={sc}
                onClick={() => setScenario(sc)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  scenario === sc
                    ? 'bg-amber-dim border-amber text-amber font-semibold shadow-glow-amber'
                    : 'bg-inset border-border text-text-3 hover:text-text-1 hover:border-border-strong'
                }`}
              >
                <div className="text-[13px]">{sc}</div>
                <div className="text-[10px] font-mono text-text-4 mt-1">
                  {sc === 'DDOS' ? 'Volumetric SYN flood exhaust' : sc === 'BRUTE FORCE' ? 'High-frequency credential spray' : 'Reconnaissance sweep across ports'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Speed Multiplier */}
        <div className="space-y-2">
          <span className="text-[11px] font-mono text-text-4 uppercase">CLOCK MULTIPLIER</span>
          <div className="flex items-center gap-3">
            {[1, 2, 4].map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-4 py-2 rounded-btn font-mono text-[12px] border transition-colors ${
                  speed === s
                    ? 'bg-cyan/15 border-cyan text-cyan font-semibold'
                    : 'bg-inset border-border text-text-3 hover:text-text-1'
                }`}
              >
                {s}x Normal Speed
              </button>
            ))}
          </div>
        </div>

        {/* Current State Summary */}
        <div className="p-4 rounded-lg bg-inset border border-border grid grid-cols-3 gap-4 text-[12px] font-mono">
          <div>
            <span className="text-text-4">Current Phase:</span>
            <div className="text-amber font-semibold mt-1">{state.phase} (Step T+{state.step % 36})</div>
          </div>
          <div>
            <span className="text-text-4">Simulated Packets:</span>
            <div className="text-cyan font-semibold mt-1">{state.kpis.packetsPerSec.toLocaleString()} pps</div>
          </div>
          <div>
            <span className="text-text-4">Target Host:</span>
            <div className="text-text-1 font-semibold mt-1">{state.threatStatus.targetIp}:{state.threatStatus.targetPort}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
