import React from 'react';
import { AlertDetail } from '../services/api';
import { X, ShieldAlert, Cpu, Sparkles, Terminal, Activity, Server, Clock } from 'lucide-react';

interface AlertDetailModalProps {
  alert: AlertDetail | null;
  onClose: () => void;
}

export const AlertDetailModal: React.FC<AlertDetailModalProps> = ({ alert, onClose }) => {
  if (!alert) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-soc-cardBorder p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-lg font-bold text-white font-mono">{alert.alert_id}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                  alert.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 glow-critical' :
                  alert.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                  alert.priority === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' :
                  'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}>
                  PRIORITY: {alert.priority}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-slate-800 text-gray-300 border border-slate-700">
                  {alert.severity.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Detected by <span className="text-gray-200">{alert.source}</span> at{' '}
                <span className="font-mono text-cyan-300">{alert.timestamp.replace('T', ' ')}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] uppercase font-mono text-gray-400">ML Incident Likelihood</span>
            <div className="text-xl font-bold font-mono text-rose-400 mt-0.5">
              {(alert.incident_probability * 100).toFixed(1)}%
            </div>
            <span className="text-[10px] text-gray-400">Random Forest prediction</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] uppercase font-mono text-gray-400">Operational Noise Score</span>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
              {alert.noise_score}%
            </div>
            <span className="text-[10px] text-gray-400">Tier: {alert.noise_level}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] uppercase font-mono text-gray-400">Historical Repetitions</span>
            <div className="text-xl font-bold font-mono text-cyan-400 mt-0.5">
              {alert.related_alerts_count}x
            </div>
            <span className="text-[10px] text-gray-400">Triplet occurrences</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] uppercase font-mono text-gray-400">Type Incident Rate</span>
            <div className="text-xl font-bold font-mono text-purple-400 mt-0.5">
              {alert.historical_incident_rate}%
            </div>
            <span className="text-[10px] text-gray-400">{alert.alert_type}</span>
          </div>
        </div>

        {/* Explainability Breakdown */}
        <div className="mb-5 p-4 rounded-xl bg-slate-900/70 border border-cyan-500/20">
          <div className="flex items-center space-x-2 text-cyan-400 mb-2">
            <Sparkles className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Model Explanation & Priority Justification</h4>
          </div>
          <p className="text-xs text-gray-200 leading-relaxed font-sans mb-3">
            {alert.explanation || 'Alert flagged based on high severity weighting and asset vulnerability.'}
          </p>

          {alert.top_contributing_features && alert.top_contributing_features.length > 0 && (
            <div>
              <span className="text-[10px] font-mono uppercase text-gray-400 block mb-1.5">Top Contributing Features:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {alert.top_contributing_features.map((feat, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/80 text-xs">
                    <span className="font-mono text-gray-300 truncate max-w-[200px]">{feat.feature}</span>
                    <span className={`font-mono text-[11px] font-bold ${feat.direction === 'INCREASES_RISK' ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {feat.contribution > 0 ? `+${feat.contribution}` : feat.contribution}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Detailed Attribute Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 text-xs">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <h4 className="font-bold text-gray-300 uppercase tracking-wider text-[11px] mb-2 flex items-center space-x-1.5">
              <Server className="w-3.5 h-3.5 text-cyan-400" />
              <span>Target & Infrastructure</span>
            </h4>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-gray-400">Affected System:</span>
              <span className="font-mono text-white">{alert.affected_system}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-gray-400">Asset Category:</span>
              <span className="text-white">{alert.asset_category}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-gray-400">Source IP:</span>
              <span className="font-mono text-white">{alert.src_ip || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-400">Destination IP:</span>
              <span className="font-mono text-white">{alert.dst_ip || 'N/A'}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <h4 className="font-bold text-gray-300 uppercase tracking-wider text-[11px] mb-2 flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5 text-purple-400" />
              <span>Telemetry & MITRE Mapping</span>
            </h4>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-gray-400">Event Domain:</span>
              <span className="font-mono text-white">{alert.event_type}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-gray-400">Threat Category:</span>
              <span className="text-white">{alert.category}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-gray-400">MITRE Technique:</span>
              <span className="font-mono text-amber-400">{alert.mitre_technique || 'None'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-400">Behavioral Anomaly:</span>
              <span className={alert.is_anomaly ? 'text-rose-400 font-bold' : 'text-gray-400'}>
                {alert.is_anomaly ? 'YES (FLAGGED)' : 'NO'}
              </span>
            </div>
          </div>
        </div>

        {/* CEF Raw Log Snippet */}
        {alert.raw_log && (
          <div className="p-4 rounded-xl bg-black border border-slate-800">
            <div className="flex items-center space-x-2 text-gray-400 mb-2">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-mono uppercase text-gray-400">Raw SIEM CEF Log:</span>
            </div>
            <pre className="text-[11px] font-mono text-emerald-400/90 whitespace-pre-wrap break-all bg-slate-950 p-2.5 rounded-lg border border-slate-900">
              {alert.raw_log}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
