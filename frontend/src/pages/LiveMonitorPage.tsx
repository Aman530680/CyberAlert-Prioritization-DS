/**
 * OmniSentinel Live Monitor Page
 * Real-time streaming alert feed with packet rate meters and severity toggles.
 */

import React, { useState } from 'react';
import { Activity, ShieldAlert, Pause, Play, Terminal } from 'lucide-react';
import { useSimulation } from '../hooks/useSimulation';

export const LiveMonitorPage: React.FC = () => {
  const { state, isPlaying, togglePlay } = useSimulation();
  const [filterSev, setFilterSev] = useState<string>('ALL');

  const filteredSignals = state.recentSignals.filter(s => {
    if (filterSev !== 'ALL' && s.severity !== filterSev) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-text-1">Live Ingress Telemetry Stream</h1>
          <p className="text-[12px] text-text-4 font-mono mt-0.5">Real-time socket replay of IDS sensors & firewall flows</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="px-3 py-1.5 rounded-btn bg-inset border border-border hover:border-border-strong text-text-2 text-[12px] font-mono flex items-center gap-2"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber" /> : <Play className="w-3.5 h-3.5 text-green" />}
            <span>{isPlaying ? 'Pause Stream' : 'Resume Stream'}</span>
          </button>
        </div>
      </div>

      {/* Stream Controls & Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 rounded-card bg-card border border-border card-highlight">
          <span className="text-card-label text-text-4">CURRENT INGRESS</span>
          <div className="text-kpi font-mono text-cyan font-semibold mt-1">
            {state.kpis.packetsPerSec.toLocaleString()} <span className="text-[14px] text-text-4">pps</span>
          </div>
        </div>
        <div className="p-4 rounded-card bg-card border border-border card-highlight">
          <span className="text-card-label text-text-4">SYN FLOOD RATE</span>
          <div className="text-kpi font-mono text-amber font-semibold mt-1">
            {state.threatStatus.trajectory === 'Critical Peak' ? 640 : 210} <span className="text-[14px] text-text-4">syn/s</span>
          </div>
        </div>
        <div className="p-4 rounded-card bg-card border border-border card-highlight">
          <span className="text-card-label text-text-4">STREAM BUFFER</span>
          <div className="text-kpi font-mono text-text-1 font-semibold mt-1">
            {state.recentSignals.length} <span className="text-[14px] text-text-4">events</span>
          </div>
        </div>
        <div className="p-4 rounded-card bg-card border border-border card-highlight">
          <span className="text-card-label text-text-4">THREAT LEVEL</span>
          <div className="text-kpi font-mono text-red font-semibold mt-1">
            {state.threatStatus.level}
          </div>
        </div>
      </div>

      {/* Live Stream Terminal Table */}
      <div className="p-4 rounded-card bg-card border border-border card-highlight space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-green" />
            <span className="text-card-label text-text-3 font-medium">LIVE TELEMETRY STREAM</span>
          </div>

          <div className="flex items-center gap-1 bg-inset p-0.5 rounded-btn border border-border text-[10px] font-mono">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => (
              <button
                key={sev}
                onClick={() => setFilterSev(sev)}
                className={`px-2 py-0.5 rounded ${filterSev === sev ? 'bg-amber-dim text-amber font-semibold' : 'text-text-4'}`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1 font-mono text-[11px] max-h-[500px] overflow-y-auto">
          {filteredSignals.map(sig => (
            <div key={sig.id} className="p-2 rounded bg-inset border border-border/40 flex items-center justify-between hover:border-border-strong transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-text-4">{sig.timestamp}</span>
                <span className="text-cyan">{sig.sourceIp}</span>
                <span className="text-text-4">→</span>
                <span className="text-text-2">{sig.targetIp}:{sig.targetPort}</span>
                <span className="text-text-1 font-medium">{sig.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber">{sig.mitreTechnique}</span>
                <span className={`px-1.5 py-0.2 rounded-badge text-[9px] font-bold ${
                  sig.severity === 'CRITICAL' ? 'bg-red text-white' : 'bg-white/[0.05] text-text-3'
                }`}>{sig.severity}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
