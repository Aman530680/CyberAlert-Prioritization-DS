/**
 * Inspects the real SIEM dataset JSONL file (first 200 lines).
 * Detects JS types, example values, null rates, cardinality, and semantic tags.
 * Saves the inferred schema to frontend/public/data/schema.json.
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface FieldAnalysis {
  name: string;
  jsType: string;
  semanticType: 'timestamp' | 'ip' | 'port' | 'severity' | 'category' | 'identifier' | 'numeric' | 'boolean' | 'nested' | 'text';
  nullCount: number;
  nullRate: number;
  distinctCount: number;
  distinctValues?: string[];
  min?: number;
  max?: number;
  exampleValues: any[];
}

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

function detectSemanticType(key: string, values: any[]): FieldAnalysis['semanticType'] {
  const k = key.toLowerCase();
  const sample = values.find(v => v !== null && v !== undefined);

  if (k.includes('timestamp') || k.includes('time') || (typeof sample === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(sample))) {
    return 'timestamp';
  }
  if (k.includes('_ip') || k === 'ip' || (typeof sample === 'string' && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(sample))) {
    return 'ip';
  }
  if (k.includes('port')) {
    return 'port';
  }
  if (k.includes('severity') || k.includes('priority')) {
    return 'severity';
  }
  if (k.includes('category') || k.includes('type') || k.includes('action') || k.includes('source') || k.includes('protocol')) {
    return 'category';
  }
  if (k.includes('id') || k.includes('hash') || k.includes('uuid')) {
    return 'identifier';
  }
  if (typeof sample === 'boolean') {
    return 'boolean';
  }
  if (typeof sample === 'number') {
    return 'numeric';
  }
  if (typeof sample === 'object') {
    return 'nested';
  }
  return 'text';
}

async function inspectSchema() {
  const filePath = resolveDatasetPath();
  console.log(`[Schema Inspector] Reading from: ${filePath}`);

  const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineCount = 0;
  const sampleRows: Record<string, any>[] = [];

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const parsed = JSON.parse(line);
      sampleRows.push(parsed);
      lineCount++;
      if (lineCount >= 200) break;
    } catch {
      // ignore
    }
  }

  console.log(`[Schema Inspector] Analyzed ${sampleRows.length} sample rows.`);

  // Collect all fields across all sample rows
  const fieldNames = new Set<string>();
  sampleRows.forEach(row => Object.keys(row).forEach(k => fieldNames.add(k)));

  const fields: FieldAnalysis[] = [];

  for (const field of Array.from(fieldNames)) {
    const rawValues = sampleRows.map(r => r[field]);
    const nonNullValues = rawValues.filter(v => v !== null && v !== undefined);
    const nullCount = sampleRows.length - nonNullValues.length;
    const nullRate = Number((nullCount / sampleRows.length).toFixed(4));
    const distinctSet = new Set(nonNullValues.map(v => typeof v === 'object' ? JSON.stringify(v) : String(v)));
    const distinctCount = distinctSet.size;

    const sample = nonNullValues[0];
    const jsType = sample === undefined ? 'unknown' : typeof sample;
    const semanticType = detectSemanticType(field, nonNullValues);

    const analysis: FieldAnalysis = {
      name: field,
      jsType,
      semanticType,
      nullCount,
      nullRate,
      distinctCount,
      exampleValues: nonNullValues.slice(0, 3),
    };

    if (distinctCount <= 15) {
      analysis.distinctValues = Array.from(distinctSet).slice(0, 15);
    }

    if (jsType === 'number') {
      const numericVals = nonNullValues.filter(v => typeof v === 'number') as number[];
      if (numericVals.length > 0) {
        analysis.min = Math.min(...numericVals);
        analysis.max = Math.max(...numericVals);
      }
    }

    fields.push(analysis);
  }

  // Sort by nullRate ascending
  fields.sort((a, b) => a.nullRate - b.nullRate);

  const outputDir = path.resolve(process.cwd(), 'public/data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'schema.json');
  const schemaSummary = {
    datasetPath: filePath,
    sampleSize: sampleRows.length,
    inferredAt: new Date().toISOString(),
    totalFields: fields.length,
    fields,
  };

  fs.writeFileSync(outputPath, JSON.stringify(schemaSummary, null, 2), 'utf-8');
  console.log(`[Schema Inspector] Saved schema to ${outputPath}`);
  console.log('\nTop 15 Most Common Fields:');
  console.table(fields.slice(0, 15).map(f => ({
    Field: f.name,
    Type: f.jsType,
    Semantic: f.semanticType,
    NullRate: `${(f.nullRate * 100).toFixed(1)}%`,
    Distinct: f.distinctCount,
  })));
}

inspectSchema().catch(err => {
  console.error('[Schema Inspector] Error:', err);
  process.exit(1);
});
