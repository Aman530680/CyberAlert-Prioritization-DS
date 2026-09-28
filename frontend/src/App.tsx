import React, { useState, useEffect } from 'react';
import {
  api, OverviewStats, FilterOptions, PaginatedAlerts,
  AlertDetail, ModelMetrics, FeatureImportance, InsightItem, ActionPlan
} from './services/api';

import { Navbar } from './components/Navbar';
import { OverviewCards } from './components/OverviewCards';
import { TrendCharts } from './components/TrendCharts';
import { ThreatIntelligenceCharts } from './components/ThreatIntelligenceCharts';
import { MLPerformanceView } from './components/MLPerformanceView';
import { PrioritizationTable } from './components/PrioritizationTable';
import { AlertDetailModal } from './components/AlertDetailModal';
import { LivePredictorModal } from './components/LivePredictorModal';
import { InsightsAndActionPlan } from './components/InsightsAndActionPlan';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [loading, setLoading] = useState<boolean>(true);

  // Data states
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [filters, setFilters] = useState<FilterOptions | null>(null);
  const [alerts, setAlerts] = useState<PaginatedAlerts | null>(null);
  const [currentFilters, setCurrentFilters] = useState<any>({ page: 1, page_size: 25 });
  const [selectedAlert, setSelectedAlert] = useState<AlertDetail | null>(null);
  const [isPredictorOpen, setIsPredictorOpen] = useState<boolean>(false);

  // Analytics states
  const [trends, setTrends] = useState<any>(null);
  const [alertTypes, setAlertTypes] = useState<any[]>([]);
  const [severityData, setSeverityData] = useState<any[]>([]);
  const [sourcesData, setSourcesData] = useState<any[]>([]);
  const [systemsData, setSystemsData] = useState<any[]>([]);
  const [noiseData, setNoiseData] = useState<any>(null);
  const [prioritiesData, setPrioritiesData] = useState<any[]>([]);
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics | null>(null);
  const [modelFeatures, setModelFeatures] = useState<FeatureImportance[]>([]);
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [actionPlan, setActionPlan] = useState<ActionPlan | null>(null);

  // Initial load
  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      try {
        const [
          ov, fl, tr, ty, sv, sc, sy, ns, pr, mm, mf, ins, ap, al
        ] = await Promise.all([
          api.getOverview(),
          api.getFilters(),
          api.getTrends(),
          api.getAlertTypes(15),
          api.getSeverity(),
          api.getSources(15),
          api.getSystems(15),
          api.getNoise(),
          api.getPriorities(),
          api.getModelMetrics(),
          api.getModelFeatures(),
          api.getInsights(),
          api.getActionPlan(),
          api.getAlerts({ page: 1, page_size: 25 })
        ]);

        setOverview(ov);
        setFilters(fl);
        setTrends(tr);
        setAlertTypes(ty);
        setSeverityData(sv);
        setSourcesData(sc);
        setSystemsData(sy);
        setNoiseData(ns);
        setPrioritiesData(pr);
        setModelMetrics(mm);
        setModelFeatures(mf);
        setInsights(ins);
        setActionPlan(ap);
        setAlerts(al);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // Filter change handler
  const handleFilterChange = async (newFilters: any) => {
    setCurrentFilters(newFilters);
    try {
      const res = await api.getAlerts(newFilters);
      setAlerts(res);
    } catch (err) {
      console.error('Failed to apply filters:', err);
    }
  };

  // Inspect alert detail
  const handleSelectAlert = async (alertId: string) => {
    try {
      const detail = await api.getAlertDetail(alertId);
      setSelectedAlert(detail);
    } catch (err) {
      console.error('Failed to fetch alert details:', err);
    }
  };

  return (
    <div className="min-h-screen bg-soc-bg text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenPredictor={() => setIsPredictorOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPI Overview Strip (always present) */}
        <OverviewCards stats={overview} loading={loading} />

        {/* Dynamic Tab Views */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            <TrendCharts
              trendsData={trends}
              typesData={alertTypes}
              prioritiesData={prioritiesData}
              loading={loading}
            />
            <PrioritizationTable
              alertsData={alerts}
              filterOptions={filters}
              currentFilters={currentFilters}
              onFilterChange={handleFilterChange}
              onSelectAlert={handleSelectAlert}
              loading={loading}
            />
          </div>
        )}

        {activeTab === 'prioritization' && (
          <div className="animate-fade-in">
            <PrioritizationTable
              alertsData={alerts}
              filterOptions={filters}
              currentFilters={currentFilters}
              onFilterChange={handleFilterChange}
              onSelectAlert={handleSelectAlert}
              loading={loading}
            />
          </div>
        )}

        {activeTab === 'intelligence' && (
          <div className="animate-fade-in">
            <ThreatIntelligenceCharts
              typesData={alertTypes}
              severityData={severityData}
              sourcesData={sourcesData}
              systemsData={systemsData}
              noiseData={noiseData}
              loading={loading}
            />
          </div>
        )}

        {activeTab === 'machine-learning' && (
          <div className="animate-fade-in">
            <MLPerformanceView
              metrics={modelMetrics}
              features={modelFeatures}
              loading={loading}
            />
          </div>
        )}

        {activeTab === 'action-plan' && (
          <div className="animate-fade-in">
            <InsightsAndActionPlan
              insights={insights}
              actionPlan={actionPlan}
              loading={loading}
            />
          </div>
        )}
      </main>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <AlertDetailModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
        />
      )}

      {/* Live Inference Predictor Simulator Modal */}
      <LivePredictorModal
        isOpen={isPredictorOpen}
        onClose={() => setIsPredictorOpen(false)}
      />

      {/* Footer */}
      <footer className="w-full glass-panel border-t border-soc-cardBorder/80 py-4 text-center text-xs text-gray-500 font-mono">
        CyberAlert Prioritization Platform — Intelligent SOC Alert Analytics & Incident Prediction | Powered by MySQL 8.0 & Random Forest ML
      </footer>
    </div>
  );
};

export default App;
