/**
 * OmniSentinel Sidebar Component
 * 208px expanded / 56px collapsed mode with collapsible sections,
 * active indicator bar, Live Monitor pulse, dynamic alert count badges,
 * and dataset nominal popover footer.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
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
  ChevronLeft,
  ChevronDown,
  Server,
} from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import * as Tooltip from '@radix-ui/react-tooltip';

export type NavRoute =
  | 'dashboard'
  | 'live-monitor'
  | 'threat-intel'
  | 'forecasting'
  | 'attack-analysis'
  | 'alerts'
  | 'investigation'
  | 'analytics'
  | 'notifications'
  | 'simulation'
  | 'architecture'
  | 'settings';

interface SidebarProps {
  currentRoute: NavRoute;
  onRouteChange: (route: NavRoute) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  alertCount?: number;
  notificationCount?: number;
  totalDatasetRows?: number;
}

interface NavItemConfig {
  id: NavRoute;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  badge?: number | string;
  isLive?: boolean;
}

interface NavSection {
  title: string;
  items: NavItemConfig[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onRouteChange,
  collapsed,
  onToggleCollapse,
  alertCount = 42,
  notificationCount = 5,
  totalDatasetRows = 100000,
}) => {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (title: string) => {
    setCollapsedSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const sections: NavSection[] = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'live-monitor', label: 'Live Monitor', icon: Activity, isLive: true },
      ],
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { id: 'threat-intel', label: 'Threat Intel', icon: Radar },
        { id: 'forecasting', label: 'Forecasting', icon: TrendingUp },
        { id: 'attack-analysis', label: 'Attack Analysis', icon: Crosshair },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        { id: 'alerts', label: 'Alerts', icon: AlertTriangle, badge: alertCount },
        { id: 'investigation', label: 'Investigation', icon: Search },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'notifications', label: 'Notifications', icon: Bell, badge: notificationCount },
      ],
    },
    {
      title: 'PLATFORM',
      items: [
        { id: 'simulation', label: 'Simulation', icon: Cpu },
        { id: 'architecture', label: 'Architecture', icon: Layers },
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  return (
    <Tooltip.Provider delayDuration={400}>
      <aside
        className={`h-screen bg-sidebar border-r border-border flex flex-col justify-between select-none transition-[width] duration-slow ease-soc-ease z-30 ${
          collapsed ? 'w-[56px]' : 'w-[208px]'
        }`}
      >
        {/* Header 64px */}
        <div>
          <div className="h-[64px] px-3 flex items-center justify-between border-b border-border">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg border border-amber/40 bg-amber-dim flex items-center justify-center shrink-0 shadow-glow-amber">
                <ShieldAlert className="w-4 h-4 text-amber" strokeWidth={1.5} />
              </div>
              {!collapsed && (
                <div className="flex flex-col overflow-hidden">
                  <span className="text-[14px] font-semibold text-text-1 tracking-tight leading-none">
                    Hellow Sentinel
                  </span>
                  <span className="text-[9px] font-mono text-amber tracking-[0.16em] uppercase mt-1 leading-none">
                    Cybersecurity SOC
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="w-6 h-6 rounded-btn flex items-center justify-center text-text-3 hover:text-text-1 hover:bg-white/[0.04] transition-colors shrink-0"
            >
              <ChevronLeft
                className={`w-4 h-4 transition-transform duration-base ${collapsed ? 'rotate-180' : ''}`}
                strokeWidth={1.5}
              />
            </button>
          </div>

          {/* Navigation Sections */}
          <nav className="p-2 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)]">
            {sections.map(section => {
              const isSectionCollapsed = Boolean(collapsedSections[section.title]);
              return (
                <div key={section.title} className="space-y-1">
                  {!collapsed && (
                    <button
                      onClick={() => toggleSection(section.title)}
                      className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-mono text-text-4 tracking-[0.14em] uppercase hover:text-text-2 transition-colors"
                    >
                      <span>{section.title}</span>
                      <ChevronDown
                        className={`w-3 h-3 transition-transform duration-base ${
                          isSectionCollapsed ? '-rotate-90' : ''
                        }`}
                        strokeWidth={1.5}
                      />
                    </button>
                  )}

                  <AnimatePresence initial={false}>
                    {(!isSectionCollapsed || collapsed) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.18 }}
                        className="space-y-0.5"
                      >
                        {section.items.map(item => {
                          const Icon = item.icon;
                          const isActive = currentRoute === item.id;

                          const navBtn = (
                            <button
                              key={item.id}
                              onClick={() => onRouteChange(item.id)}
                              className={`relative w-full h-[34px] rounded-btn flex items-center gap-2.5 px-2.5 text-[13px] font-sans transition-colors ${
                                isActive
                                  ? 'text-text-1 bg-white/[0.05] border border-border-strong font-medium'
                                  : 'text-text-3 hover:text-text-1 hover:bg-white/[0.04]'
                              } ${collapsed ? 'justify-center px-0' : ''}`}
                            >
                              {/* 2px Amber Active Indicator Bar */}
                              {isActive && (
                                <div className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-amber rounded-r-[2px]" />
                              )}

                              <Icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />

                              {!collapsed && (
                                <span className="flex-1 text-left truncate">{item.label}</span>
                              )}

                              {!collapsed && item.isLive && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-badge bg-green/12 border border-green/30 text-[9px] font-mono text-green leading-none">
                                  <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
                                  LIVE
                                </span>
                              )}

                              {!collapsed && item.badge !== undefined && (
                                <span className="px-1.5 py-0.5 min-w-[18px] h-[18px] rounded-badge bg-amber-dim text-[10px] font-mono text-amber font-semibold flex items-center justify-center leading-none">
                                  {item.badge}
                                </span>
                              )}
                            </button>
                          );

                          if (collapsed) {
                            return (
                              <Tooltip.Root key={item.id}>
                                <Tooltip.Trigger asChild>{navBtn}</Tooltip.Trigger>
                                <Tooltip.Portal>
                                  <Tooltip.Content
                                    side="right"
                                    sideOffset={8}
                                    className="z-50 px-2.5 py-1 rounded-btn bg-[#0c0c0f] border border-border-strong text-[12px] text-text-1 shadow-lg font-sans"
                                  >
                                    {item.label}
                                    <Tooltip.Arrow className="fill-[#1c1c22]" />
                                  </Tooltip.Content>
                                </Tooltip.Portal>
                              </Tooltip.Root>
                            );
                          }

                          return navBtn;
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Footer Card: Nominal Popover */}
        <div className="p-2 border-t border-border">
          <Popover.Root>
            <Popover.Trigger asChild>
              <button
                className={`w-full p-2 rounded-lg bg-inset border border-border hover:border-border-strong transition-colors flex items-center gap-2.5 card-highlight text-left ${
                  collapsed ? 'justify-center p-2' : ''
                }`}
              >
                <div className="relative w-2.5 h-2.5 shrink-0">
                  <span className="absolute inset-0 rounded-full bg-green/40 animate-ping" />
                  <span className="relative block w-2.5 h-2.5 rounded-full bg-green" />
                </div>
                {!collapsed && (
                  <div className="flex-1 truncate">
                    <div className="text-[12px] font-medium text-text-1 leading-tight">
                      SOC Nominal
                    </div>
                    <div className="text-[10px] font-mono text-text-4 leading-tight mt-0.5">
                      CyberOps Alpha
                    </div>
                  </div>
                )}
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                side="right"
                align="end"
                sideOffset={10}
                className="z-50 w-64 p-3 rounded-lg bg-[#0c0c0f] border border-border-strong shadow-2xl text-[12px] text-text-2 font-sans space-y-2 card-highlight"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-border text-text-1 font-semibold text-[13px]">
                  <Server className="w-4 h-4 text-green" strokeWidth={1.5} />
                  SOC Telemetry Node Alpha
                </div>
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-text-4">Status:</span>
                    <span className="text-green font-medium">99.98% Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-4">Region:</span>
                    <span className="text-text-1">us-east-va (SOC-1)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-4">Dataset:</span>
                    <span className="text-amber font-medium">advanced_siem.jsonl</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-4">Loaded Rows:</span>
                    <span className="text-cyan">{totalDatasetRows.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-4">Engine Sync:</span>
                    <span className="text-text-1">2s Interval</span>
                  </div>
                </div>
                <Popover.Arrow className="fill-[#1c1c22]" />
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </div>
      </aside>
    </Tooltip.Provider>
  );
};
