/**
 * OmniSentinel Alerts Queue Page
 * Prioritized SOC alert queue loaded directly from real dataset chunks.
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Filter, Search, Terminal, Eye, ShieldAlert } from 'lucide-react';
import { dataLoader } from '../data/loader';
import { NormalizedAlert, MappedSeverity } from '../types/alert';
import { AlertExplorerTable } from '../components/analytics/AlertExplorerTable';

export const AlertsQueuePage: React.FC = () => {
  const [alerts, setAlerts] = useState<NormalizedAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dataLoader.getAlertsChunk(0)
      .then(chunk => {
        setAlerts(chunk || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-text-1">Prioritized Alert Queue</h1>
          <p className="text-[12px] text-text-4 font-mono mt-0.5">Triage workbench sorted by multi-factor ML priority score</p>
        </div>
      </div>

      <AlertExplorerTable alerts={alerts} totalRows={100000} />
    </div>
  );
};
