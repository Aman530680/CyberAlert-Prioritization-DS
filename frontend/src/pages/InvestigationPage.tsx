/**
 * OmniSentinel Investigation Page
 * Interactive SOC analyst case canvas and entity relationship view.
 */

import React from 'react';
import { Search, ShieldAlert, Terminal, CheckCircle, ArrowUpRight, Network } from 'lucide-react';

export const InvestigationPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-[20px] font-semibold text-text-1">Incident Investigation Canvas</h1>
        <p className="text-[12px] text-text-4 font-mono mt-0.5">Tier-2 triage analysis and host containment sandbox</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-card bg-card border border-border card-highlight space-y-2">
          <span className="text-card-label text-text-4">ACTIVE CASE</span>
          <div className="text-[18px] font-semibold text-text-1">CASE #8841-DDOS</div>
          <div className="text-[11px] font-mono text-amber">Assigned to: SOC Tier-2 Lead</div>
        </div>
        <div className="p-4 rounded-card bg-card border border-border card-highlight space-y-2">
          <span className="text-card-label text-text-4">AFFECTED HOST</span>
          <div className="text-[18px] font-mono text-cyan font-semibold">10.0.0.41 (API Gateway)</div>
          <div className="text-[11px] font-mono text-green">Telemetry: Intercepting Ingress</div>
        </div>
        <div className="p-4 rounded-card bg-card border border-border card-highlight space-y-2">
          <span className="text-card-label text-text-4">CONTAINMENT ACTION</span>
          <div className="text-[18px] font-semibold text-red">RATE LIMIT APPLIED</div>
          <div className="text-[11px] font-mono text-text-4">Rule: DROP tcp from 192.168.1.105</div>
        </div>
      </div>

      {/* Investigation Details */}
      <div className="p-6 rounded-card bg-card border border-border card-highlight space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <Network className="w-4 h-4 text-amber" />
          <span className="text-card-label text-text-3 font-medium">INCIDENT EVIDENCE GRAPH & TIMELINE</span>
        </div>

        <div className="p-4 rounded-lg bg-inset border border-border font-mono text-[12px] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <span className="text-text-4">T-180s: Initial probe detected from 192.168.1.105 on port 443</span>
            <span className="text-cyan">IDS SIG-8841</span>
          </div>
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <span className="text-text-4">T-60s: Volume scaled to 1,420 pps with randomized source ports</span>
            <span className="text-orange">Traffic Spike</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-1">T-0s: Automated mitigation rule pushed to core perimeter firewall</span>
            <span className="text-green font-semibold">Contained</span>
          </div>
        </div>
      </div>
    </div>
  );
};
