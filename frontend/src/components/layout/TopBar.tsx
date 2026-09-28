/**
 * OmniSentinel Top Bar Component
 * 56px header with dynamic route breadcrumbs, sentinel health indicator,
 * simulation chip, command palette trigger (⌘K), and analyst profile badge.
 */

import React from 'react';
import { Bell, Command, ShieldCheck } from 'lucide-react';
import { NavRoute } from './Sidebar';

interface TopBarProps {
  currentRoute: NavRoute;
  isRealDataReplay?: boolean;
  onOpenCommandPalette: () => void;
  onOpenNotifications?: () => void;
}

const ROUTE_META: Record<NavRoute, { section: string; title: string }> = {
  dashboard: { section: 'EXECUTIVE SOC', title: 'Dashboard Overview' },
  'live-monitor': { section: 'INTELLIGENCE', title: 'Live Stream Telemetry' },
  'threat-intel': { section: 'INTELLIGENCE', title: 'Threat Intelligence Feeds' },
  forecasting: { section: 'PREDICTIVE ML', title: 'Attack Trajectory Forecasting' },
  'attack-analysis': { section: 'MITRE FRAMEWORK', title: 'Attack Vector Analysis' },
  alerts: { section: 'OPERATIONS', title: 'Prioritized Alert Queue' },
  investigation: { section: 'OPERATIONS', title: 'Incident Investigation Canvas' },
  analytics: { section: 'DEEP DIVE', title: 'SOC Analytics & Heatmaps' },
  notifications: { section: 'COMMUNICATIONS', title: 'System Notifications' },
  simulation: { section: 'RED TEAM', title: 'Attack Simulation Engine' },
  architecture: { section: 'PLATFORM', title: 'Pipeline Architecture (9 Stages)' },
  settings: { section: 'CONFIGURATION', title: 'Platform Settings & Ingestion' },
};

export const TopBar: React.FC<TopBarProps> = ({
  currentRoute,
  isRealDataReplay = true,
  onOpenCommandPalette,
  onOpenNotifications,
}) => {
  const meta = ROUTE_META[currentRoute] || { section: 'EXECUTIVE SOC', title: 'Dashboard Overview' };

  return (
    <header className="h-[56px] px-6 bg-app/90 backdrop-blur-md border-b border-border flex items-center justify-between select-none z-20 sticky top-0">
      {/* Left: Section Micro Label & Page Title */}
      <div className="flex flex-col justify-center">
        <span className="text-micro text-text-4 font-mono leading-none">
          {meta.section}
        </span>
        <h1 className="text-title text-text-1 font-semibold leading-tight mt-0.5">
          {meta.title}
        </h1>
      </div>

      {/* Right Controls Group */}
      <div className="flex items-center gap-3">
        {/* Active Sentinel Health Status */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green/10 border border-green/20 text-[11px] font-mono text-green">
          <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
          <span className="font-medium">Active Sentinel</span>
        </div>

        {/* Mode Chip: DATASET REPLAY / SIMULATION */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue/12 border border-blue/30 text-[10px] font-mono text-blue uppercase tracking-wider">
          <ShieldCheck className="w-3 h-3 text-blue" strokeWidth={1.5} />
          <span>{isRealDataReplay ? 'DATASET REPLAY' : 'SIMULATION'}</span>
        </div>

        {/* Command Palette Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-btn bg-inset border border-border hover:border-border-strong text-[12px] text-text-3 hover:text-text-1 transition-colors"
        >
          <Command className="w-3.5 h-3.5 text-text-4" strokeWidth={1.5} />
          <span>Search or command...</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[10px] font-mono text-text-3 border border-border">
            ⌘K
          </kbd>
        </button>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          aria-label="Notifications"
          className="relative w-8 h-8 rounded-btn flex items-center justify-center text-text-3 hover:text-text-1 hover:bg-white/[0.05] transition-colors"
        >
          <Bell className="w-4 h-4" strokeWidth={1.5} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red" />
        </button>

        {/* 1px Vertical Divider */}
        <div className="w-[1px] h-5 bg-border mx-1" />

        {/* User Avatar & Identity */}
        <div className="flex items-center gap-2.5 pl-1">
          <div className="w-7 h-7 rounded-full bg-amber-dim border border-amber/40 text-amber font-mono font-semibold text-[11px] flex items-center justify-center">
            SA
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-[12px] font-medium text-text-1 leading-none">
              SOC Analyst
            </span>
            <span className="text-[10px] text-text-4 leading-none mt-0.5">
              Enterprise Admin
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
