/**
 * CyberAlert-Prioritization: Typed Backend API Client
 */

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export interface OverviewStats {
  total_alerts: number;
  total_incidents: number;
  incident_rate: number;
  critical_alerts: number;
  high_priority_alerts: number;
  high_noise_alerts: number;
  model_accuracy: number;
  model_roc_auc: number;
  data_quality_score: number;
  date_range_start: string;
  date_range_end: string;
}

export interface FilterOptions {
  severities: string[];
  priorities: string[];
  alert_types: string[];
  sources: string[];
  noise_levels: string[];
  asset_categories: string[];
}

export interface AlertItem {
  id: number;
  alert_id: string;
  timestamp: string;
  event_type: string;
  source: string;
  severity: string;
  alert_type: string;
  category: string;
  affected_system: string;
  asset_category: string;
  user_id?: string;
  src_ip?: string;
  dst_ip?: string;
  risk_score: number;
  confidence: number;
  geo_location?: string;
  is_anomaly: boolean;
  mitre_technique?: string;
  is_incident: boolean;
  incident_probability: number;
  noise_score: number;
  noise_level: string;
  priority: string;
  resolution_status: string;
  description?: string;
}

export interface AlertDetail extends AlertItem {
  raw_log?: string;
  features?: Record<string, any>;
  explanation?: string;
  top_contributing_features?: Array<{
    feature: string;
    value: any;
    contribution: number;
    direction: string;
  }>;
  related_alerts_count: number;
  historical_incident_rate: number;
}

export interface PaginatedAlerts {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  items: AlertItem[];
}

export interface AlertFilters {
  page?: number;
  page_size?: number;
  severity?: string;
  priority?: string;
  alert_type?: string;
  source?: string;
  affected_system?: string;
  noise_level?: string;
  is_incident?: boolean;
  search?: string;
  date_from?: string;
  date_to?: string;
}

export interface ModelMetrics {
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
    pr_auc: number;
  };
  confusion_matrix: {
    true_negatives: number;
    false_positives: number;
    false_negatives: number;
    true_positives: number;
  };
  soc_operational_impact: {
    incident_recall_pct: number;
    false_negative_rate_pct: number;
    false_positive_rate_pct: number;
    analyst_workload_reduction_pct: number;
    assessment: string;
  };
  roc_curve: Array<{ fpr: number; tpr: number }>;
  pr_curve: Array<{ recall: number; precision: number }>;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

export interface InsightItem {
  id: string;
  category: string;
  title: string;
  finding: string;
  impact: string;
  metric: string;
  recommendation: string;
}

export interface ActionPlan {
  title: string;
  generation_timestamp: string;
  action_items: Array<{
    step: number;
    phase: string;
    action: string;
    description: string;
    sla: string;
    target_entities: string[];
  }>;
}

export interface PredictPayload {
  event_type: string;
  source: string;
  severity: string;
  alert_type: string;
  category: string;
  affected_system: string;
  asset_category: string;
  alert_burst_score?: number;
  repeated_alert_count?: number;
  is_anomaly?: boolean;
}

export interface PredictResult {
  alert_id: string;
  incident_probability: number;
  is_incident_predicted: boolean;
  priority: string;
  priority_score: number;
  priority_reasons: string[];
  noise_score: number;
  noise_level: string;
  severity: string;
  explanation: string;
  contributing_features: Array<{
    feature: string;
    value: any;
    contribution: number;
    direction: string;
  }>;
}

export const api = {
  getOverview: async (): Promise<OverviewStats> => {
    const res = await fetch(`${API_BASE_URL}/overview`);
    if (!res.ok) throw new Error('Failed to fetch overview stats');
    return res.json();
  },

  getFilters: async (): Promise<FilterOptions> => {
    const res = await fetch(`${API_BASE_URL}/filters`);
    if (!res.ok) throw new Error('Failed to fetch filter options');
    return res.json();
  },

  getAlerts: async (filters: AlertFilters = {}): Promise<PaginatedAlerts> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.alert_type) params.append('alert_type', filters.alert_type);
    if (filters.source) params.append('source', filters.source);
    if (filters.affected_system) params.append('affected_system', filters.affected_system);
    if (filters.noise_level) params.append('noise_level', filters.noise_level);
    if (filters.is_incident !== undefined) params.append('is_incident', filters.is_incident.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);

    const res = await fetch(`${API_BASE_URL}/alerts?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch paginated alerts');
    return res.json();
  },

  getAlertDetail: async (alertId: string): Promise<AlertDetail> => {
    const res = await fetch(`${API_BASE_URL}/alerts/${alertId}`);
    if (!res.ok) throw new Error(`Failed to fetch alert ${alertId}`);
    return res.json();
  },

  getTrends: async () => {
    const res = await fetch(`${API_BASE_URL}/alerts/trends`);
    if (!res.ok) throw new Error('Failed to fetch alert trends');
    return res.json();
  },

  getAlertTypes: async (topN: number = 10) => {
    const res = await fetch(`${API_BASE_URL}/alerts/types?top_n=${topN}`);
    if (!res.ok) throw new Error('Failed to fetch alert types');
    return res.json();
  },

  getSeverity: async () => {
    const res = await fetch(`${API_BASE_URL}/alerts/severity`);
    if (!res.ok) throw new Error('Failed to fetch severity analysis');
    return res.json();
  },

  getSources: async (topN: number = 10) => {
    const res = await fetch(`${API_BASE_URL}/alerts/sources?top_n=${topN}`);
    if (!res.ok) throw new Error('Failed to fetch source breakdown');
    return res.json();
  },

  getSystems: async (topN: number = 10) => {
    const res = await fetch(`${API_BASE_URL}/alerts/systems?top_n=${topN}`);
    if (!res.ok) throw new Error('Failed to fetch systems intelligence');
    return res.json();
  },

  getNoise: async () => {
    const res = await fetch(`${API_BASE_URL}/alerts/noise`);
    if (!res.ok) throw new Error('Failed to fetch noise analysis');
    return res.json();
  },

  getModelMetrics: async (): Promise<ModelMetrics> => {
    const res = await fetch(`${API_BASE_URL}/model/metrics`);
    if (!res.ok) throw new Error('Failed to fetch model metrics');
    return res.json();
  },

  getModelFeatures: async (): Promise<FeatureImportance[]> => {
    const res = await fetch(`${API_BASE_URL}/model/features`);
    if (!res.ok) throw new Error('Failed to fetch feature importance');
    return res.json();
  },

  getPriorities: async () => {
    const res = await fetch(`${API_BASE_URL}/priorities`);
    if (!res.ok) throw new Error('Failed to fetch priority distribution');
    return res.json();
  },

  getInsights: async (): Promise<InsightItem[]> => {
    const res = await fetch(`${API_BASE_URL}/insights`);
    if (!res.ok) throw new Error('Failed to fetch dynamic insights');
    return res.json();
  },

  getActionPlan: async (): Promise<ActionPlan> => {
    const res = await fetch(`${API_BASE_URL}/action-plan`);
    if (!res.ok) throw new Error('Failed to fetch SOC action plan');
    return res.json();
  },

  predictAlert: async (payload: PredictPayload): Promise<PredictResult> => {
    const res = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Prediction API failed');
    return res.json();
  },
};
