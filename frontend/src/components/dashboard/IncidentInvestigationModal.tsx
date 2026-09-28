/**
 * OmniSentinel Incident Investigation Modal / Drawer
 * Full incident timeline, MITRE technique tags (e.g. T1498 Network DoS),
 * telemetry evidence, raw CEF log, and analyst response actions (Acknowledge, Escalate, False Positive).
 */

import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, ShieldAlert, CheckCircle, ArrowUpRight, Copy, Terminal, Clock, Server } from 'lucide-react';
import { SimulationState } from '../../hooks/useSimulation';

interface IncidentInvestigationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  threatStatus: SimulationState['threatStatus'];
  kpis: SimulationState['kpis'];
}

export const IncidentInvestigationModal: React.FC<IncidentInvestigationModalProps> = ({
  open,
  onOpenChange,
  threatStatus,
  kpis,
}) => {
  const [copied, setCopied] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const rawCefSample = `CEF:0|OmniSentinel|IDS-Sensor|2.4.1|SIG-8841|${threatStatus.scenarioName}|9|src=${threatStatus.sourceIp} dst=${threatStatus.targetIp} spt=51244 dpt=${threatStatus.targetPort} proto=${threatStatus.protocol} cs1Label=MitreTechnique cs1=${threatStatus.mitreTechnique} cn1Label=RiskScore cn1=${kpis.networkRisk}`;

  const copyCef = () => {
    navigator.clipboard.writeText(rawCefSample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAction = (act: string) => {
    setActionNotice(`Incident status updated: ${act.toUpperCase()}`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200" />
        <Dialog.Content className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[620px] bg-[#0c0c0f] border-l border-border-strong shadow-2xl p-6 overflow-y-auto card-highlight animate-in slide-in-from-right duration-250 flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-border">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-badge bg-red/15 border border-red/30 text-red text-[10px] font-mono font-semibold uppercase">
                    {threatStatus.level} INCIDENT
                  </span>
                  <span className="text-[11px] font-mono text-text-4">
                    INC-2025-0914-A
                  </span>
                </div>
                <Dialog.Title className="text-[20px] font-semibold text-text-1">
                  {threatStatus.scenarioName}
                </Dialog.Title>
                <Dialog.Description className="text-[12px] text-text-3 mt-1">
                  Automated Tier-2 Incident Escalation & Response Workbench
                </Dialog.Description>
              </div>

              <Dialog.Close asChild>
                <button
                  aria-label="Close dialog"
                  className="w-7 h-7 rounded-btn flex items-center justify-center text-text-3 hover:text-text-1 hover:bg-white/[0.05] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </Dialog.Close>
            </div>

            {/* Action Feedback Banner */}
            {actionNotice && (
              <div className="my-4 p-2.5 rounded-lg bg-green/10 border border-green/30 text-green font-mono text-[12px] flex items-center gap-2 animate-in fade-in">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{actionNotice}</span>
              </div>
            )}

            {/* Entity Parameter Grid */}
            <div className="my-5 grid grid-cols-2 gap-3 text-[12px]">
              <div className="p-3 rounded-lg bg-inset border border-border">
                <span className="text-micro text-text-4">ATTACK ORIGIN (SRC)</span>
                <div className="font-mono text-text-1 font-semibold text-[13px] mt-1">
                  {threatStatus.sourceIp}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-inset border border-border">
                <span className="text-micro text-text-4">TARGET ASSET (DST)</span>
                <div className="font-mono text-text-1 font-semibold text-[13px] mt-1">
                  {threatStatus.targetIp}:{threatStatus.targetPort}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-inset border border-border">
                <span className="text-micro text-text-4">TRANSPORT PROTOCOL</span>
                <div className="font-mono text-cyan font-semibold text-[13px] mt-1">
                  {threatStatus.protocol}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-inset border border-border">
                <span className="text-micro text-text-4">MITRE ATT&CK TECHNIQUE</span>
                <div className="font-mono text-amber font-semibold text-[13px] mt-1 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{threatStatus.mitreTechnique}</span>
                </div>
              </div>
            </div>

            {/* Incident Chronology Timeline */}
            <div className="my-5 space-y-3">
              <span className="text-card-label text-text-3 font-medium block">
                CORRELATION TIMELINE
              </span>

              <div className="space-y-2 border-l border-border pl-3 ml-1 font-mono text-[11px]">
                <div className="relative pl-3">
                  <div className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-cyan" />
                  <div className="text-text-4">T-180s · Ingress Detection</div>
                  <div className="text-text-2">Initial port sweep detected across port {threatStatus.targetPort}.</div>
                </div>

                <div className="relative pl-3">
                  <div className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-amber" />
                  <div className="text-text-4">T-60s · Volume Escalation</div>
                  <div className="text-text-2">Ingress rate surged past 800 packets/sec baseline with SYN flags.</div>
                </div>

                <div className="relative pl-3">
                  <div className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-red" />
                  <div className="text-text-4">T-0s · Critical SOC Alert</div>
                  <div className="text-text-1 font-semibold">Automated correlation confirmed active attack vector. Risk score {kpis.networkRisk}/100.</div>
                </div>
              </div>
            </div>

            {/* Raw CEF Log Box */}
            <div className="my-5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-card-label text-text-3 font-medium flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  COMMON EVENT FORMAT (CEF) PAYLOAD
                </span>
                <button
                  onClick={copyCef}
                  className="text-[11px] font-mono text-text-3 hover:text-text-1 flex items-center gap-1 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copied ? 'Copied' : 'Copy CEF'}</span>
                </button>
              </div>

              <div className="p-3 rounded-lg bg-[#070709] border border-border text-[11px] font-mono text-text-3 break-all leading-relaxed max-h-[110px] overflow-y-auto">
                {rawCefSample}
              </div>
            </div>
          </div>

          {/* Action Footer Buttons */}
          <div className="pt-4 border-t border-border flex items-center gap-2.5">
            <button
              onClick={() => handleAction('Acknowledged')}
              className="flex-1 h-9 rounded-btn bg-white/[0.05] border border-border hover:bg-white/[0.08] text-text-2 text-[12px] font-medium transition-colors"
            >
              Acknowledge
            </button>
            <button
              onClick={() => handleAction('False Positive')}
              className="flex-1 h-9 rounded-btn bg-white/[0.05] border border-border hover:bg-white/[0.08] text-text-3 text-[12px] font-medium transition-colors"
            >
              Mark False Positive
            </button>
            <button
              onClick={() => handleAction('Escalated to Tier 3 CIRT')}
              className="flex-1 h-9 rounded-btn bg-red border border-red/50 hover:bg-red/90 text-white text-[12px] font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Escalate CIRT</span>
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
