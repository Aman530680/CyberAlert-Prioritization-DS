/**
 * Strict TypeScript types for OmniSentinel alerts and data aggregates.
 */

export type SeverityLevel = 'emergency' | 'critical' | 'high' | 'medium' | 'low' | 'info';
export type MappedSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface RawSiemRecord {
  event_id: string;
  timestamp: string;
  event_type: string;
  source: string;
  severity: string;
  raw_log: string;
  description?: string;
  additional_info?: string;
  action?: string;
  user?: string;
  src_ip?: string;
  dst_ip?: string;
  protocol?: string;
  bytes?: number;
  alert_type?: string;
  category?: string;
  signature_id?: string;
  cloud_service?: string;
  resource_id?: string;
  device_type?: string;
  device_id?: string;
  firmware_version?: string;
  model_id?: string;
  object?: string;
  process_id?: number;
  parent_process?: string;
  src_port?: number;
  dst_port?: number;
  duration?: number;
  advanced_metadata?: {
    geo_location?: string;
    device_hash?: string;
    user_agent?: string;
    session_id?: string;
    risk_score?: number;
    confidence?: number;
  };
  behavioral_analytics?: {
    baseline_deviation?: number;
    entropy?: number;
    frequency_anomaly?: boolean;
    sequence_anomaly?: boolean;
  };
  // Normalized or derived fields
  affected_system?: string;
  normalized_severity?: MappedSeverity;
}

export interface NormalizedAlert {
  id: string;
  timestamp: string;
  source: string;
  eventType: string;
  alertType: string;
  category: string;
  severity: MappedSeverity;
  rawSeverity: string;
  srcIp: string;
  dstIp: string;
  srcPort?: number;
  dstPort?: number;
  protocol: string;
  affectedSystem: string;
  riskScore: number;
  confidence: number;
  mitreTechnique?: string;
  description: string;
  rawLog: string;
  isAnomaly: boolean;
}

export interface DatasetSummary {
  totalRows: number;
  malformedRows: number;
  startDate: string;
  endDate: string;
  uniqueSources: number;
  uniqueEventTypes: number;
  uniqueSrcIps: number;
  uniqueDstIps: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  avgRiskScore: number;
  avgAlertsPerHour: number;
  chunksCount: number;
  rowsPerChunk: number;
  generatedAt: string;
}

export interface TimeseriesPoint {
  time: string;
  timestamp: number;
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  synFloodRate?: number;
  packetsPerSec?: number;
}

export interface HeatmapCell {
  day: number; // 0-6 (Sun-Sat)
  hour: number; // 0-23
  count: number;
  criticalCount: number;
}

export interface DistributionItem {
  name: string;
  count: number;
  percentage: number;
  color?: string;
}

export interface DistributionsData {
  severity: DistributionItem[];
  eventTypes: DistributionItem[];
  categories: DistributionItem[];
  protocols: DistributionItem[];
  topPorts: DistributionItem[];
}

export interface EntityCount {
  entity: string;
  count: number;
  percentage: number;
  criticalShare: number;
  lastSeen?: string;
  severity: MappedSeverity;
}

export interface TopEntitiesData {
  sourceIps: EntityCount[];
  targetIps: EntityCount[];
  ports: EntityCount[];
  categories: EntityCount[];
}

export interface CorrelationMatrixItem {
  featureA: string;
  featureB: string;
  coefficient: number;
}

export interface AutoInsight {
  id: string;
  type: 'critical' | 'anomaly' | 'volume' | 'network' | 'repetition';
  title: string;
  description: string;
  filterKey?: string;
  filterValue?: string;
  metric?: string;
}
