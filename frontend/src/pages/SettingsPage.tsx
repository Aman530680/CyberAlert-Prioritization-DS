/**
 * OmniSentinel Settings & Dataset Ingestion Page
 * Includes in-browser JSONL dropzone loader, session cache management,
 * and API endpoint configurations.
 */

import React, { useState } from 'react';
import { Upload, CheckCircle2, AlertTriangle, FileText, Database, RefreshCw } from 'lucide-react';
import { AggregationEngine } from '../lib/aggregate';

export const SettingsPage: React.FC = () => {
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadedRows, setUploadedRows] = useState<number>(0);
  const [parsing, setParsing] = useState<boolean>(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);
    setUploadStatus('Reading JSONL file stream…');

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n');
        const engine = new AggregationEngine();
        let valid = 0;

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const raw = JSON.parse(line);
            if (engine.ingest(raw)) valid++;
          } catch {}
        }

        setUploadedRows(valid);
        setUploadStatus(`Successfully parsed ${valid.toLocaleString()} records for this session.`);
        setParsing(false);
      } catch (err: any) {
        setUploadStatus(`Error parsing JSONL: ${err.message}`);
        setParsing(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-[20px] font-semibold text-text-1">Platform Settings & Telemetry Ingestion</h1>
        <p className="text-[12px] text-text-4 font-mono mt-0.5">Manage data sources, API connectivity, and browser cache</p>
      </div>

      {/* Dataset Dropzone */}
      <div className="p-6 rounded-card bg-card border border-border card-highlight space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-amber" />
          <span className="text-card-label text-text-3 font-medium">IN-BROWSER JSONL DATASET INGESTION</span>
        </div>

        <p className="text-[12px] text-text-3 leading-relaxed">
          Upload any SIEM JSONL dataset directly in the browser. The in-memory aggregation engine will parse records and re-index analytics for your active session without altering local storage.
        </p>

        <div className="relative p-8 rounded-lg border-2 border-dashed border-border hover:border-amber/40 transition-colors flex flex-col items-center justify-center bg-inset text-center cursor-pointer group">
          <input
            type="file"
            accept=".jsonl,.json"
            onChange={handleFileUpload}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <Upload className="w-8 h-8 text-text-4 group-hover:text-amber transition-colors mb-2" />
          <span className="text-[13px] font-medium text-text-1">Drop .jsonl dataset file here or click to browse</span>
          <span className="text-[11px] font-mono text-text-4 mt-1">Supports standard Common Event Format (CEF) and SIEM JSON lines</span>
        </div>

        {parsing && (
          <div className="p-3 rounded bg-blue/10 border border-blue/30 text-blue font-mono text-[12px] flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>{uploadStatus}</span>
          </div>
        )}

        {!parsing && uploadStatus && (
          <div className="p-3 rounded bg-green/10 border border-green/30 text-green font-mono text-[12px] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{uploadStatus}</span>
          </div>
        )}
      </div>

      {/* API Connectivity */}
      <div className="p-6 rounded-card bg-card border border-border card-highlight space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan" />
          <span className="text-card-label text-text-3 font-medium">BACKEND API CONNECTIVITY</span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-[12px] font-mono">
          <div className="p-3 rounded bg-inset border border-border">
            <span className="text-text-4">FastAPI Endpoint:</span>
            <div className="text-text-1 font-semibold mt-1">http://127.0.0.1:8000</div>
          </div>
          <div className="p-3 rounded bg-inset border border-border">
            <span className="text-text-4">MySQL Database:</span>
            <div className="text-green font-semibold mt-1">cyberalert_db (Port 3306)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
