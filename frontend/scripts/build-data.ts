/**
 * High-performance streaming data aggregator.
 * Reads the 100,000-record JSONL dataset, computes full SOC aggregates,
 * outputs chunked alert files (500 rows per chunk) and summary datasets to public/data/.
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import aggregation engine
import { AggregationEngine } from '../src/lib/aggregate.js';

function resolveDatasetPath(): string {
  const candidates = [
    process.env.DATASET_PATH,
    path.resolve(process.cwd(), '../data/raw/dataset.jsonl'),
    path.resolve(process.cwd(), '../data/raw/advanced_siem_dataset.jsonl'),
    path.resolve(process.cwd(), '../CyberAlert-Prioritizationdataset.jsonl'),
    path.resolve(__dirname, '../../data/raw/dataset.jsonl'),
    path.resolve(__dirname, '../../CyberAlert-Prioritizationdataset.jsonl'),
    'D:\\Data Science Project\\DS\\Day 1\\CyberAlert-Prioritization\\CyberAlert-Prioritizationdataset.jsonl',
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error(`Dataset not found in candidates: ${candidates.join(', ')}`);
}

async function buildData() {
  const startTime = Date.now();
  const filePath = resolveDatasetPath();
  const outputDir = path.resolve(process.cwd(), 'public/data');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`[Data Builder] Streaming dataset from: ${filePath}`);
  console.log(`[Data Builder] Target output directory: ${outputDir}`);

  const engine = new AggregationEngine();
  const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineCount = 0;
  let chunkIndex = 0;
  const CHUNK_SIZE = 500;
  const MAX_CHUNKS_TO_EMIT = 40; // 20,000 records partitioned into 40 clean JSON files for instant browser virtual scroll
  let currentChunk: any[] = [];

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const raw = JSON.parse(line);
      const normalized = engine.ingest(raw);

      if (normalized && chunkIndex < MAX_CHUNKS_TO_EMIT) {
        currentChunk.push(normalized);
        if (currentChunk.length >= CHUNK_SIZE) {
          const chunkFileName = `alerts-${String(chunkIndex).padStart(3, '0')}.json`;
          fs.writeFileSync(path.join(outputDir, chunkFileName), JSON.stringify(currentChunk), 'utf-8');
          chunkIndex++;
          currentChunk = [];
        }
      }
      lineCount++;
    } catch {
      // counted as malformed inside engine
    }

    if (lineCount % 25000 === 0) {
      console.log(`[Data Builder] Processed ${lineCount.toLocaleString()} records...`);
    }
  }

  // Flush remaining rows in last chunk if needed
  if (currentChunk.length > 0 && chunkIndex < MAX_CHUNKS_TO_EMIT) {
    const chunkFileName = `alerts-${String(chunkIndex).padStart(3, '0')}.json`;
    fs.writeFileSync(path.join(outputDir, chunkFileName), JSON.stringify(currentChunk), 'utf-8');
    chunkIndex++;
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  const summary = engine.getSummary(chunkIndex, CHUNK_SIZE);
  const timeseries = engine.getTimeseries();
  const distributions = engine.getDistributions();
  const topEntities = engine.getTopEntities();
  const heatmap = engine.getHeatmap();
  const correlations = engine.getCorrelations();
  const insights = engine.getInsights();

  // Write all JSON aggregates
  fs.writeFileSync(path.join(outputDir, 'summary.json'), JSON.stringify(summary, null, 2), 'utf-8');
  fs.writeFileSync(path.join(outputDir, 'timeseries.json'), JSON.stringify(timeseries, null, 2), 'utf-8');
  fs.writeFileSync(path.join(outputDir, 'distributions.json'), JSON.stringify(distributions, null, 2), 'utf-8');
  fs.writeFileSync(path.join(outputDir, 'top-entities.json'), JSON.stringify(topEntities, null, 2), 'utf-8');
  fs.writeFileSync(path.join(outputDir, 'heatmap.json'), JSON.stringify(heatmap, null, 2), 'utf-8');
  fs.writeFileSync(path.join(outputDir, 'correlations.json'), JSON.stringify(correlations, null, 2), 'utf-8');
  fs.writeFileSync(path.join(outputDir, 'insights.json'), JSON.stringify(insights, null, 2), 'utf-8');

  console.log(`\n======================================================`);
  console.log(`[Data Builder] DATA PIPELINE SUMMARY`);
  console.log(`======================================================`);
  console.table({
    'Total Ingested Rows': summary.totalRows.toLocaleString(),
    'Malformed Records': summary.malformedRows,
    'Date Range Start': summary.startDate.slice(0, 10),
    'Date Range End': summary.endDate.slice(0, 10),
    'Unique Source SIEMs': summary.uniqueSources,
    'Critical + Emergency': summary.criticalCount.toLocaleString(),
    'High Severity': summary.highCount.toLocaleString(),
    'Medium Severity': summary.mediumCount.toLocaleString(),
    'Low / Info Severity': summary.lowCount.toLocaleString(),
    'Chunks Emitted': `${chunkIndex} chunks (${(chunkIndex * CHUNK_SIZE).toLocaleString()} records for virtual UI)`,
    'Processing Time': `${durationSec} seconds`,
  });
}

buildData().catch(err => {
  console.error('[Data Builder] Fatal Error:', err);
  process.exit(1);
});
