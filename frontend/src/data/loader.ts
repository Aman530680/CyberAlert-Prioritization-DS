/**
 * Typed Data Loader service for OmniSentinel SOC.
 * Loads pre-computed dataset aggregates and alert chunks from /data/ or API.
 */

import {
  DatasetSummary,
  TimeseriesPoint,
  DistributionsData,
  TopEntitiesData,
  HeatmapCell,
  CorrelationMatrixItem,
  AutoInsight,
  NormalizedAlert,
} from '../types/alert';

const BASE_URL = import.meta.env.BASE_URL || '/';

async function fetchJson<T>(fileName: string): Promise<T> {
  const url = `${BASE_URL}data/${fileName}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load ${fileName}: ${res.statusText}`);
  }
  return res.json();
}

export const dataLoader = {
  getSummary: (): Promise<DatasetSummary> => fetchJson<DatasetSummary>('summary.json'),
  getTimeseries: (): Promise<TimeseriesPoint[]> => fetchJson<TimeseriesPoint[]>('timeseries.json'),
  getDistributions: (): Promise<DistributionsData> => fetchJson<DistributionsData>('distributions.json'),
  getTopEntities: (): Promise<TopEntitiesData> => fetchJson<TopEntitiesData>('top-entities.json'),
  getHeatmap: (): Promise<HeatmapCell[]> => fetchJson<HeatmapCell[]>('heatmap.json'),
  getCorrelations: (): Promise<CorrelationMatrixItem[]> => fetchJson<CorrelationMatrixItem[]>('correlations.json'),
  getInsights: (): Promise<AutoInsight[]> => fetchJson<AutoInsight[]>('insights.json'),
  getAlertsChunk: (index: number): Promise<NormalizedAlert[]> => {
    const chunkName = `alerts-${String(index).padStart(3, '0')}.json`;
    return fetchJson<NormalizedAlert[]>(chunkName);
  },
  getSchema: (): Promise<any> => fetchJson<any>('schema.json'),
};
