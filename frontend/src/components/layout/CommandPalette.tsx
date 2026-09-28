/**
 * OmniSentinel Command Palette (Cmd/Ctrl + K)
 * Accessible search and quick actions launcher powered by cmdk.
 */

import React, { useEffect } from 'react';
import { Command } from 'cmdk';
import {
  LayoutDashboard,
  Activity,
  Radar,
  TrendingUp,
  Crosshair,
  AlertTriangle,
  Search,
  BarChart3,
  Bell,
  Cpu,
  Layers,
  Settings,
  Play,
  Pause,
  Download,
  ShieldAlert,
} from 'lucide-react';
import { NavRoute } from './Sidebar';
import { ScenarioType } from './SubBar';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRouteChange: (route: NavRoute) => void;
  onScenarioChange: (scenario: ScenarioType) => void;
  onTogglePlay: () => void;
  isPlaying: boolean;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onOpenChange,
  onRouteChange,
  onScenarioChange,
  onTogglePlay,
  isPlaying,
}) => {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName))) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24 p-4 animate-in fade-in duration-150"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-[560px] rounded-xl bg-[#0c0c0f] border border-border-strong shadow-2xl overflow-hidden card-highlight"
        onClick={e => e.stopPropagation()}
      >
        <Command label="Global Command Palette" className="w-full">
          <div className="flex items-center px-3.5 border-b border-border">
            <Search className="w-4 h-4 text-text-4 mr-2.5 shrink-0" strokeWidth={1.5} />
            <Command.Input
              autoFocus
              placeholder="Type a command, page, or search alerts..."
              className="w-full h-11 bg-transparent text-[13px] text-text-1 placeholder-text-4 outline-none font-sans"
            />
          </div>

          <Command.List className="max-h-[320px] overflow-y-auto p-2 space-y-1 font-sans text-[13px]">
            <Command.Empty className="py-6 text-center text-text-4 text-[12px]">
              No matching commands found.
            </Command.Empty>

            <Command.Group heading="NAVIGATION" className="px-2 py-1 text-[10px] font-mono text-text-4 tracking-wider uppercase">
              <Command.Item
                onSelect={() => { onRouteChange('dashboard'); onOpenChange(false); }}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-btn text-text-2 hover:text-text-1 hover:bg-white/[0.05] cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4 text-amber" />
                <span>Dashboard Overview</span>
              </Command.Item>
              <Command.Item
                onSelect={() => { onRouteChange('analytics'); onOpenChange(false); }}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-btn text-text-2 hover:text-text-1 hover:bg-white/[0.05] cursor-pointer"
              >
                <BarChart3 className="w-4 h-4 text-cyan" />
                <span>SOC Analytics & Heatmaps</span>
              </Command.Item>
              <Command.Item
                onSelect={() => { onRouteChange('alerts'); onOpenChange(false); }}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-btn text-text-2 hover:text-text-1 hover:bg-white/[0.05] cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4 text-orange" />
                <span>Prioritized Alerts Queue</span>
              </Command.Item>
              <Command.Item
                onSelect={() => { onRouteChange('attack-analysis'); onOpenChange(false); }}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-btn text-text-2 hover:text-text-1 hover:bg-white/[0.05] cursor-pointer"
              >
                <Crosshair className="w-4 h-4 text-red" />
                <span>MITRE ATT&CK Matrix</span>
              </Command.Item>
              <Command.Item
                onSelect={() => { onRouteChange('architecture'); onOpenChange(false); }}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-btn text-text-2 hover:text-text-1 hover:bg-white/[0.05] cursor-pointer"
              >
                <Layers className="w-4 h-4 text-blue" />
                <span>9-Stage Pipeline Architecture</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="SIMULATION SCENARIOS" className="px-2 py-1 text-[10px] font-mono text-text-4 tracking-wider uppercase mt-2">
              <Command.Item
                onSelect={() => { onScenarioChange('DDOS'); onOpenChange(false); }}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-btn text-text-2 hover:text-text-1 hover:bg-white/[0.05] cursor-pointer"
              >
                <Cpu className="w-4 h-4 text-amber" />
                <span>Switch Scenario: Distributed Denial of Service (DDoS)</span>
              </Command.Item>
              <Command.Item
                onSelect={() => { onScenarioChange('BRUTE FORCE'); onOpenChange(false); }}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-btn text-text-2 hover:text-text-1 hover:bg-white/[0.05] cursor-pointer"
              >
                <Cpu className="w-4 h-4 text-orange" />
                <span>Switch Scenario: Credential Brute Force & Stuffing</span>
              </Command.Item>
              <Command.Item
                onSelect={() => { onScenarioChange('PORT SCAN'); onOpenChange(false); }}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-btn text-text-2 hover:text-text-1 hover:bg-white/[0.05] cursor-pointer"
              >
                <Cpu className="w-4 h-4 text-cyan" />
                <span>Switch Scenario: Lateral Reconnaissance & Port Scan</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="QUICK ACTIONS" className="px-2 py-1 text-[10px] font-mono text-text-4 tracking-wider uppercase mt-2">
              <Command.Item
                onSelect={() => { onTogglePlay(); onOpenChange(false); }}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-btn text-text-2 hover:text-text-1 hover:bg-white/[0.05] cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4 text-amber" /> : <Play className="w-4 h-4 text-green" />}
                <span>{isPlaying ? 'Pause Simulation Replay' : 'Resume Simulation Replay'}</span>
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  window.location.search = '?splash=1';
                }}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-btn text-text-2 hover:text-text-1 hover:bg-white/[0.05] cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4 text-blue" />
                <span>Replay Splash Screen (?splash=1)</span>
              </Command.Item>
            </Command.Group>
          </Command.List>

          <div className="px-3 py-2 border-t border-border flex items-center justify-between text-[11px] font-mono text-text-4 bg-[#09090b]">
            <div className="flex items-center gap-2">
              <span>Use <kbd className="px-1 py-0.5 rounded bg-white/[0.05] border border-border">↑</kbd> <kbd className="px-1 py-0.5 rounded bg-white/[0.05] border border-border">↓</kbd> to navigate</span>
              <span><kbd className="px-1 py-0.5 rounded bg-white/[0.05] border border-border">ESC</kbd> to close</span>
            </div>
            <span>OmniSentinel v2.4</span>
          </div>
        </Command>
      </div>
    </div>
  );
};
