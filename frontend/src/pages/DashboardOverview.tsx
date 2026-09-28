/**
 * OmniSentinel Main Dashboard Overview
 * Matches /reference/dashboard.png layout with 1px hairline borders,
 * custom SVG 270° gauge, high-precision Recharts line chart, threat status 2x3 box grid,
 * traffic donut, live scenario event feed, and bottom analytics widgets.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { SimulationState } from '../hooks/useSimulation';
import { KpiCardsRow } from '../components/dashboard/KpiCardsRow';
import { RiskAssessmentGauge } from '../components/dashboard/RiskAssessmentGauge';
import { TrafficAnalysisChart } from '../components/dashboard/TrafficAnalysisChart';
import { ThreatStatusCard } from '../components/dashboard/ThreatStatusCard';
import { TrafficBreakdownDonut } from '../components/dashboard/TrafficBreakdownDonut';
import { ScenarioEventFeed } from '../components/dashboard/ScenarioEventFeed';
import { DashboardWidgets } from '../components/dashboard/DashboardWidgets';

interface DashboardOverviewProps {
  simulationState: SimulationState;
  onNavigateToAnalytics: (filterKey?: string, filterValue?: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  simulationState,
  onNavigateToAnalytics,
}) => {
  const { kpis, threatStatus, trafficHistory, trafficBreakdown, recentSignals, topSources, severityMix24h, isRealDataReplay } = simulationState;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
      className="p-6 space-y-4"
    >
      {/* ROW 1: 4 KPI Cards */}
      <KpiCardsRow kpis={kpis} history={trafficHistory} />

      {/* ROW 2: Primary Operational Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column (2 Cards: Risk Gauge & Traffic Line Chart) */}
        <div className="space-y-4">
          <RiskAssessmentGauge
            currentRisk={kpis.networkRisk}
            forecastRisk={kpis.forecastRisk}
            riskDelta={kpis.riskDelta}
          />

          <TrafficBreakdownDonut breakdown={trafficBreakdown} />
        </div>

        {/* Center Column (Traffic Line Chart & Threat Status Grid) */}
        <div className="space-y-4">
          <TrafficAnalysisChart
            data={trafficHistory}
            isRealDataReplay={isRealDataReplay}
          />

          <ThreatStatusCard
            threatStatus={threatStatus}
            kpis={kpis}
          />
        </div>

        {/* Right Column: Scenario Event Feed */}
        <div className="space-y-4">
          <ScenarioEventFeed signals={recentSignals} />
        </div>
      </div>

      {/* ROW 3: Dashboard Analytics Widgets (Top 5 IPs & Severity Mix) */}
      <DashboardWidgets
        topSources={topSources}
        severityMix={severityMix24h}
        onNavigateToAnalytics={onNavigateToAnalytics}
      />
    </motion.div>
  );
};
