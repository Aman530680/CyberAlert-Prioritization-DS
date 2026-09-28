/**
 * OmniSentinel Threat Intel Page
 * Displays intelligence feeds, IOC signatures, and global threat actors.
 */

import React from 'react';
import { Radar, ShieldAlert, Globe, Server, Hash } from 'lucide-react';

const INTEL_FEEDS = [
  { id: 'FEED-01', name: 'AlienVault OTX High-Confidence', iocCount: 1420, trustScore: 98, updated: '4m ago' },
  { id: 'FEED-02', name: 'CrowdStrike Falcon Adversary Intel', iocCount: 890, trustScore: 99, updated: '12m ago' },
  { id: 'FEED-03', name: 'CISA Known Exploited Vulnerabilities', iocCount: 310, trustScore: 100, updated: '1h ago' },
  { id: 'FEED-04', name: 'EmergingThreats Pro IDS Rules', iocCount: 4520, trustScore: 95, updated: '22m ago' },
];

const SIGNATURES = [
  { sigId: 'SIG-8841', name: 'SYN Flood Exhaustion Signature', category: 'Exploit', severity: 'CRITICAL', matchCount: 4120 },
  { sigId: 'SIG-7210', name: 'Credential Spraying Kerberos TGT', category: 'Authentication', severity: 'CRITICAL', matchCount: 2980 },
  { sigId: 'SIG-3904', name: 'Lateral SMB Named Pipe Impersonation', category: 'Lateral Movement', severity: 'HIGH', matchCount: 1840 },
  { sigId: 'SIG-1042', name: 'DNS Tunneling TXT Record Exfiltration', category: 'Exfiltration', severity: 'HIGH', matchCount: 940 },
  { sigId: 'SIG-0419', name: 'AWS S3 Bucket Public ACL Modification', category: 'Cloud Infrastructure', severity: 'MEDIUM', matchCount: 520 },
];

export const ThreatIntelPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-[20px] font-semibold text-text-1">Threat Intelligence & Signature Feed</h1>
        <p className="text-[12px] text-text-4 font-mono mt-0.5">Correlated Indicators of Compromise (IoCs) & Rulesets</p>
      </div>

      {/* Intel Feeds Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {INTEL_FEEDS.map(f => (
          <div key={f.id} className="p-4 rounded-card bg-card border border-border card-highlight space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-text-4">
              <span>{f.id}</span>
              <span className="text-green font-semibold">{f.trustScore}% Trust</span>
            </div>
            <div className="text-[13px] font-semibold text-text-1">{f.name}</div>
            <div className="text-[11px] font-mono text-cyan flex justify-between pt-2 border-t border-border">
              <span>{f.iocCount.toLocaleString()} active IoCs</span>
              <span className="text-text-4">{f.updated}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Signatures List */}
      <div className="p-4 rounded-card bg-card border border-border card-highlight">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
          <Hash className="w-4 h-4 text-amber" />
          <span className="text-card-label text-text-3 font-medium">TRIGGERED SIEM SIGNATURES</span>
        </div>

        <div className="space-y-2">
          {SIGNATURES.map(sig => (
            <div key={sig.sigId} className="p-3 rounded-btn bg-inset border border-border/40 flex items-center justify-between font-mono text-[12px]">
              <div className="flex items-center gap-3">
                <span className="text-amber font-semibold">{sig.sigId}</span>
                <span className="text-text-1">{sig.name}</span>
                <span className="text-text-4">({sig.category})</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-text-3">{sig.matchCount.toLocaleString()} matches</span>
                <span className={`px-2 py-0.5 rounded-badge text-[10px] font-bold ${
                  sig.severity === 'CRITICAL' ? 'bg-red text-white' : 'bg-orange/20 text-orange'
                }`}>{sig.severity}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
