/**
 * OmniSentinel Root Application Component
 * Coordinates splash screen gating, full app shell, keyboard shortcuts,
 * routing, command palette, and real-time simulation state.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { SplashScreen } from './components/SplashScreen';
import { Sidebar, NavRoute } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { SubBar } from './components/layout/SubBar';
import { CommandPalette } from './components/layout/CommandPalette';
import { useSimulation } from './hooks/useSimulation';

// Pages
import { DashboardOverview } from './pages/DashboardOverview';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { LiveMonitorPage } from './pages/LiveMonitorPage';
import { ThreatIntelPage } from './pages/ThreatIntelPage';
import { ForecastingPage } from './pages/ForecastingPage';
import { AttackAnalysisPage } from './pages/AttackAnalysisPage';
import { AlertsQueuePage } from './pages/AlertsQueuePage';
import { InvestigationPage } from './pages/InvestigationPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SimulationPage } from './pages/SimulationPage';
import { ArchitecturePage } from './pages/ArchitecturePage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  // Splash Screen Gating
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('splash') === '1') return true;
    return !sessionStorage.getItem('omnisentinel_splash_seen');
  });

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
    sessionStorage.setItem('omnisentinel_splash_seen', 'true');
  }, []);

  // Navigation State
  const [currentRoute, setCurrentRoute] = useState<NavRoute>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);

  // Global Simulation State
  const {
    state: simulationState,
    isPlaying,
    togglePlay,
    speed,
    setSpeed,
    scenario,
    setScenario,
  } = useSimulation();

  // Global Keyboard Shortcuts
  useEffect(() => {
    let keyBuffer: string[] = [];
    let bufferTimer: any = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in form inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      // [ to toggle sidebar
      if (e.key === '[') {
        e.preventDefault();
        setSidebarCollapsed(prev => !prev);
        return;
      }

      // Space to toggle pause/play
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
        return;
      }

      // 1, 2, 3 for scenarios
      if (e.key === '1') {
        setScenario('DDOS');
        return;
      }
      if (e.key === '2') {
        setScenario('BRUTE FORCE');
        return;
      }
      if (e.key === '3') {
        setScenario('PORT SCAN');
        return;
      }

      // Sequence shortcuts (G then D, G then A, G then N)
      keyBuffer.push(e.key.toLowerCase());
      clearTimeout(bufferTimer);
      bufferTimer = setTimeout(() => {
        keyBuffer = [];
      }, 500);

      const seq = keyBuffer.join('');
      if (seq === 'gd') {
        setCurrentRoute('dashboard');
        keyBuffer = [];
      } else if (seq === 'ga') {
        setCurrentRoute('alerts');
        keyBuffer = [];
      } else if (seq === 'gn') {
        setCurrentRoute('analytics');
        keyBuffer = [];
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, setScenario]);

  // Page Content Renderer
  const renderPage = () => {
    switch (currentRoute) {
      case 'dashboard':
        return (
          <DashboardOverview
            simulationState={simulationState}
            onNavigateToAnalytics={() => setCurrentRoute('analytics')}
          />
        );
      case 'analytics':
        return <AnalyticsPage />;
      case 'live-monitor':
        return <LiveMonitorPage />;
      case 'threat-intel':
        return <ThreatIntelPage />;
      case 'forecasting':
        return <ForecastingPage />;
      case 'attack-analysis':
        return <AttackAnalysisPage />;
      case 'alerts':
        return <AlertsQueuePage />;
      case 'investigation':
        return <InvestigationPage />;
      case 'notifications':
        return <NotificationsPage />;
      case 'simulation':
        return <SimulationPage />;
      case 'architecture':
        return <ArchitecturePage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return (
          <DashboardOverview
            simulationState={simulationState}
            onNavigateToAnalytics={() => setCurrentRoute('analytics')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-app text-text-1 bg-noise relative flex overflow-hidden font-sans">
      {/* Top subtle vignette */}
      <div className="absolute inset-0 pointer-events-none top-vignette z-10" />

      {/* Splash Screen */}
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

      {/* App Shell */}
      <div className="flex w-full h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentRoute={currentRoute}
          onRouteChange={setCurrentRoute}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(p => !p)}
          alertCount={simulationState.recentSignals.length || 42}
          notificationCount={5}
          totalDatasetRows={100000}
        />

        {/* Main Content Workspace */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Top Bar (56px) */}
          <TopBar
            currentRoute={currentRoute}
            isRealDataReplay={simulationState.isRealDataReplay}
            onOpenCommandPalette={() => setCommandPaletteOpen(true)}
            onOpenNotifications={() => setCurrentRoute('notifications')}
          />

          {/* Sub-Bar (36px) */}
          <SubBar
            currentScenario={scenario}
            onScenarioChange={setScenario}
            isPlaying={isPlaying}
            onTogglePlay={togglePlay}
            speed={speed}
            onSpeedChange={setSpeed}
          />

          {/* Scrollable Viewport */}
          <main className="flex-1 overflow-y-auto">
            {renderPage()}
          </main>
        </div>
      </div>

      {/* Command Palette (⌘K) */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onRouteChange={setCurrentRoute}
        onScenarioChange={setScenario}
        onTogglePlay={togglePlay}
        isPlaying={isPlaying}
      />
    </div>
  );
};

export default App;
