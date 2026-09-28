/**
 * OmniSentinel Pipeline Architecture Page
 * Custom high-resolution SVG diagram representing the 9 pipeline stages
 * from streaming ingestion to frontend SOC interface.
 */

import React from 'react';
import { Layers, CheckCircle2, ShieldCheck, Database, Cpu, Brain, Activity, Terminal } from 'lucide-react';

const STAGES = [
  { id: 1, name: 'Raw Ingestion', desc: '100,000 JSONL records streamed via readline', icon: Terminal, status: 'Active' },
  { id: 2, name: 'Validation & Normalization', desc: '100% Schema audit, asset identity mapping', icon: ShieldCheck, status: 'Audited' },
  { id: 3, name: 'Feature Engineering', desc: '58 temporal, frequency & burst features', icon: Cpu, status: 'Engineered' },
  { id: 4, name: 'MySQL 8.0 Database', desc: 'cyberalert_db with indexed B-Trees', icon: Database, status: 'Populated' },
  { id: 5, name: 'Explainable Noise Scoring', desc: 'Multi-signal noise engine (0-100)', icon: Activity, status: 'Active' },
  { id: 6, name: 'Random Forest Training', desc: '150 trees, chronological 80/20 split', icon: Brain, status: 'Trained' },
  { id: 7, name: 'Model Evaluation', desc: '92.16% Acc, 0.8018 ROC-AUC, 92.9% reduction', icon: CheckCircle2, status: 'Evaluated' },
  { id: 8, name: 'Alert Prioritization', desc: 'CRITICAL, HIGH, MEDIUM, LOW tiers', icon: Layers, status: 'Calibrated' },
  { id: 9, name: 'FastAPI & React SOC UI', desc: 'Sub-20ms REST APIs & OmniSentinel Console', icon: ShieldCheck, status: 'Online' },
];

export const ArchitecturePage: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-[20px] font-semibold text-text-1">Platform Architecture & 9 Pipeline Stages</h1>
        <p className="text-[12px] text-text-4 font-mono mt-0.5">End-to-End Enterprise SOC Prioritization Lifecycle</p>
      </div>

      {/* Interactive Flow Diagram */}
      <div className="p-6 rounded-card bg-card border border-border card-highlight overflow-x-auto">
        <div className="min-w-[840px] flex flex-col gap-6">
          <div className="grid grid-cols-3 gap-6">
            {STAGES.slice(0, 3).map(stage => {
              const Icon = stage.icon;
              return (
                <div key={stage.id} className="relative p-4 rounded-lg bg-inset border border-border flex items-start gap-3 card-highlight">
                  <div className="w-8 h-8 rounded-btn bg-amber-dim border border-amber/30 text-amber flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-text-4">STAGE 0{stage.id}</span>
                      <span className="px-1.5 py-0.2 rounded-badge bg-green/10 text-green text-[9px] font-mono">{stage.status}</span>
                    </div>
                    <div className="text-[13px] font-semibold text-text-1 mt-0.5">{stage.name}</div>
                    <div className="text-[11px] text-text-3 mt-1">{stage.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Flow Indicator Down/Across */}
          <div className="grid grid-cols-3 gap-6">
            {STAGES.slice(3, 6).map(stage => {
              const Icon = stage.icon;
              return (
                <div key={stage.id} className="relative p-4 rounded-lg bg-inset border border-border flex items-start gap-3 card-highlight">
                  <div className="w-8 h-8 rounded-btn bg-cyan/15 border border-cyan/30 text-cyan flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-text-4">STAGE 0{stage.id}</span>
                      <span className="px-1.5 py-0.2 rounded-badge bg-green/10 text-green text-[9px] font-mono">{stage.status}</span>
                    </div>
                    <div className="text-[13px] font-semibold text-text-1 mt-0.5">{stage.name}</div>
                    <div className="text-[11px] text-text-3 mt-1">{stage.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-6">
            {STAGES.slice(6, 9).map(stage => {
              const Icon = stage.icon;
              return (
                <div key={stage.id} className="relative p-4 rounded-lg bg-inset border border-border flex items-start gap-3 card-highlight">
                  <div className="w-8 h-8 rounded-btn bg-blue/15 border border-blue/30 text-blue flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-text-4">STAGE 0{stage.id}</span>
                      <span className="px-1.5 py-0.2 rounded-badge bg-green/10 text-green text-[9px] font-mono">{stage.status}</span>
                    </div>
                    <div className="text-[13px] font-semibold text-text-1 mt-0.5">{stage.name}</div>
                    <div className="text-[11px] text-text-3 mt-1">{stage.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
