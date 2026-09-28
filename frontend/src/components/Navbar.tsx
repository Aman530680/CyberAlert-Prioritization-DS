import React from 'react';
import { ShieldAlert, Activity, Database, Cpu, Sparkles, Sliders, Bell } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenPredictor: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenPredictor }) => {
  const tabs = [
    { id: 'overview', label: 'SOC Dashboard', icon: Activity },
    { id: 'prioritization', label: 'Alert Prioritization', icon: ShieldAlert },
    { id: 'intelligence', label: 'Threat & Noise Intelligence', icon: Sliders },
    { id: 'machine-learning', label: 'ML & Explainability', icon: Cpu },
    { id: 'action-plan', label: 'Insights & Action Plan', icon: Sparkles },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-soc-cardBorder/80 bg-soc-bg/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 text-cyan-400 glow-cyan">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-wide">CyberAlert</span>
                <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  PRIORITIZATION
                </span>
              </div>
              <p className="text-xs text-soc-textMuted hidden sm:block">Intelligent SOC Alert Analytics & Incident Prediction</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Live Simulator & Status Indicator */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenPredictor}
              className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 transition-all shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/40"
            >
              <Cpu className="w-4 h-4" />
              <span>Simulate Alert</span>
            </button>

            <div className="hidden lg:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>MySQL 8.0 Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden flex overflow-x-auto px-4 py-2 space-x-1 border-t border-slate-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 whitespace-nowrap rounded-md text-xs font-medium ${
                isActive ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-gray-400'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
