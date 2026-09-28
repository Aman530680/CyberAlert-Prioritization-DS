/**
 * OmniSentinel Threat Status Card
 * Features scenario title, level badge, 2x3 entity parameter grid with copyable IPs,
 * and primary amber 'Investigate Incident' button with hover chevron animation.
 */

import React, { useState } from 'react';
import { Eye, ChevronRight, Copy, Check } from 'lucide-react';
import { SimulationState } from '../../hooks/useSimulation';
import { IncidentInvestigationModal } from './IncidentInvestigationModal';

interface ThreatStatusCardProps {
  threatStatus: SimulationState['threatStatus'];
  kpis: SimulationState['kpis'];
}

export const ThreatStatusCard: React.FC<ThreatStatusCardProps> = ({
  threatStatus,
  kpis,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIp(text);
    setTimeout(() => setCopiedIp(null), 1800);
  };

  const levelColor =
    threatStatus.level === 'CRITICAL'
      ? 'text-red bg-red/10 border-red/30'
      : threatStatus.level === 'HIGH'
      ? 'text-orange bg-orange/10 border-orange/30'
      : threatStatus.level === 'MEDIUM'
      ? 'text-cyan bg-cyan/10 border-cyan/30'
      : 'text-green bg-green/10 border-green/30';

  return (
    <div className="p-4 rounded-card bg-card border border-border flex flex-col justify-between card-highlight">
      {/* Header: Level Badge & Scenario Title */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-card-label text-text-3 font-medium">
            THREAT STATUS
          </span>
          <span
            className={`px-2 py-0.5 rounded-badge border text-[10px] font-mono font-semibold uppercase ${levelColor}`}
          >
            {threatStatus.level}
          </span>
        </div>

        <h2 className="text-[22px] font-semibold text-text-1 tracking-tight">
          {threatStatus.scenarioName}
        </h2>
      </div>

      {/* 2x3 Grid of Bordered Boxes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 my-4">
        {/* Source IP */}
        <div className="p-2.5 rounded-btn bg-inset border border-border flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-micro text-text-4">SOURCE IP</span>
            <button
              onClick={() => copyToClipboard(threatStatus.sourceIp)}
              aria-label="Copy Source IP"
              className="text-text-4 group-hover:text-text-2 hover:text-amber transition-colors"
            >
              {copiedIp === threatStatus.sourceIp ? (
                <Check className="w-3 h-3 text-green" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
          <div className="font-mono text-[13px] text-text-1 mt-1 truncate">
            {threatStatus.sourceIp}
          </div>
        </div>

        {/* Target IP */}
        <div className="p-2.5 rounded-btn bg-inset border border-border flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-micro text-text-4">TARGET IP</span>
            <button
              onClick={() => copyToClipboard(threatStatus.targetIp)}
              aria-label="Copy Target IP"
              className="text-text-4 group-hover:text-text-2 hover:text-amber transition-colors"
            >
              {copiedIp === threatStatus.targetIp ? (
                <Check className="w-3 h-3 text-green" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
          <div className="font-mono text-text-1 text-[13px] mt-1 truncate">
            {threatStatus.targetIp}
          </div>
        </div>

        {/* Target Port */}
        <div className="p-2.5 rounded-btn bg-inset border border-border flex flex-col justify-between">
          <span className="text-micro text-text-4">TARGET PORT</span>
          <div className="font-mono text-text-1 text-[13px] mt-1">
            {threatStatus.targetPort}
          </div>
        </div>

        {/* Protocol */}
        <div className="p-2.5 rounded-btn bg-inset border border-border flex flex-col justify-between">
          <span className="text-micro text-text-4">PROTOCOL</span>
          <div className="font-mono text-cyan text-[13px] mt-1">
            {threatStatus.protocol}
          </div>
        </div>

        {/* Phase */}
        <div className="p-2.5 rounded-btn bg-inset border border-border flex flex-col justify-between">
          <span className="text-micro text-text-4">PHASE</span>
          <div className="font-mono text-amber text-[13px] mt-1">
            {threatStatus.phase}
          </div>
        </div>

        {/* Trajectory */}
        <div className="p-2.5 rounded-btn bg-inset border border-border flex flex-col justify-between">
          <span className="text-micro text-text-4">TRAJECTORY</span>
          <div className="font-mono text-text-1 text-[13px] mt-1">
            {threatStatus.trajectory}
          </div>
        </div>
      </div>

      {/* Full Width Primary Amber Button */}
      <button
        onClick={() => setModalOpen(true)}
        className="group relative w-full h-[36px] rounded-btn bg-amber hover:bg-[#e0ab44] active:scale-[0.98] transition-all duration-base text-[#1a1205] font-semibold text-[13px] flex items-center justify-center gap-2 focus:ring-2 focus:ring-amber/50"
      >
        <Eye className="w-4 h-4 text-[#1a1205]" strokeWidth={2} />
        <span>Investigate Incident</span>
        <ChevronRight
          className="w-4 h-4 text-[#1a1205] transition-transform duration-base group-hover:translate-x-[2px]"
          strokeWidth={2}
        />
      </button>

      {/* Incident Modal */}
      <IncidentInvestigationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        threatStatus={threatStatus}
        kpis={kpis}
      />
    </div>
  );
};
