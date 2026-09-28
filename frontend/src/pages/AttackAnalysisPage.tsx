/**
 * OmniSentinel Attack Analysis Page
 * Interactive MITRE ATT&CK Matrix mapping enterprise SIEM alerts to tactics and techniques.
 */

import React, { useState } from 'react';
import { Crosshair, ShieldAlert, ArrowUpRight, Search, ExternalLink } from 'lucide-react';

interface MitreTechnique {
  id: string;
  tactic: string;
  name: string;
  alertCount: number;
  criticalCount: number;
  detectionSource: string;
}

const TECHNIQUES: MitreTechnique[] = [
  { id: 'T1190', tactic: 'Initial Access', name: 'Exploit Public-Facing App', alertCount: 3840, criticalCount: 680, detectionSource: 'Wazuh EDR' },
  { id: 'T1133', tactic: 'Initial Access', name: 'External Remote Services', alertCount: 2410, criticalCount: 390, detectionSource: 'Auth Guard' },
  { id: 'T1059', tactic: 'Execution', name: 'Command & Scripting Interpreter', alertCount: 4210, criticalCount: 520, detectionSource: 'CrowdStrike' },
  { id: 'T1203', tactic: 'Execution', name: 'Exploitation for Client Execution', alertCount: 1950, criticalCount: 310, detectionSource: 'Defender ATP' },
  { id: 'T1078', tactic: 'Persistence', name: 'Valid Accounts Abuse', alertCount: 3120, criticalCount: 440, detectionSource: 'Okta SIEM' },
  { id: 'T1053', tactic: 'Persistence', name: 'Scheduled Task / Cron Job', alertCount: 1680, criticalCount: 180, detectionSource: 'Zeek Sensor' },
  { id: 'T1046', tactic: 'Discovery', name: 'Network Service Discovery', alertCount: 5890, criticalCount: 790, detectionSource: 'Suricata NIDS' },
  { id: 'T1082', tactic: 'Discovery', name: 'System Information Discovery', alertCount: 2210, criticalCount: 140, detectionSource: 'Splunk App' },
  { id: 'T1110', tactic: 'Credential Access', name: 'Brute Force & Stuffing', alertCount: 6420, criticalCount: 1120, detectionSource: 'Sentinel' },
  { id: 'T1498', tactic: 'Impact', name: 'Network Denial of Service (DoS)', alertCount: 7120, criticalCount: 1450, detectionSource: 'Palo Alto FW' },
];

export const AttackAnalysisPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedTactic, setSelectedTactic] = useState('ALL');

  const filtered = TECHNIQUES.filter(t => {
    if (selectedTactic !== 'ALL' && t.tactic !== selectedTactic) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const tactics = ['ALL', 'Initial Access', 'Execution', 'Persistence', 'Discovery', 'Credential Access', 'Impact'];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold text-text-1">MITRE ATT&CK Matrix & Technique Mapping</h1>
          <p className="text-[12px] text-text-4 font-mono mt-0.5">Empirical threat alignment against SIEM events</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-4" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search technique ID..."
              className="w-full h-8 pl-8 pr-2.5 rounded-btn bg-inset border border-border text-[11px] text-text-1 outline-none font-sans"
            />
          </div>
        </div>
      </div>

      {/* Tactic Pills */}
      <div className="flex flex-wrap gap-1.5 p-1 rounded-card bg-inset border border-border">
        {tactics.map(tac => (
          <button
            key={tac}
            onClick={() => setSelectedTactic(tac)}
            className={`px-3 py-1 rounded-btn text-[11px] font-mono transition-colors ${
              selectedTactic === tac ? 'bg-amber-dim text-amber font-semibold border border-amber/30' : 'text-text-4 hover:text-text-2'
            }`}
          >
            {tac}
          </button>
        ))}
      </div>

      {/* Technique Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(tech => (
          <div
            key={tech.id}
            className="p-4 rounded-card bg-card border border-border card-highlight hover:border-border-strong transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded-badge bg-amber-dim border border-amber/30 text-amber font-mono text-[10px] font-bold">
                  {tech.id}
                </span>
                <span className="text-[10px] font-mono text-text-4">{tech.tactic}</span>
              </div>

              <div className="text-[14px] font-semibold text-text-1 mt-1">{tech.name}</div>
              <div className="text-[11px] font-mono text-text-4 mt-1">Source: {tech.detectionSource}</div>
            </div>

            <div className="pt-3 mt-4 border-t border-border flex items-center justify-between text-[11px] font-mono">
              <span className="text-text-3">{tech.alertCount.toLocaleString()} detections</span>
              <span className="text-red font-semibold">{tech.criticalCount.toLocaleString()} critical</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
