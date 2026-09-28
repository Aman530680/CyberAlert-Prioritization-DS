import React, { useState } from 'react';
import { api, PredictPayload, PredictResult } from '../services/api';
import { X, Cpu, Sparkles, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

interface LivePredictorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LivePredictorModal: React.FC<LivePredictorModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<PredictPayload>({
    event_type: 'ids_alert',
    source: 'Microsoft Sentinel v1.0.0',
    severity: 'critical',
    alert_type: 'Zero-Day Exploit',
    category: 'Exploit',
    affected_system: '10.0.4.15',
    asset_category: 'Target Network Host',
    alert_burst_score: 3.0,
    repeated_alert_count: 5,
    is_anomaly: true,
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.predictAlert(formData);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const loadPreset = (presetName: string) => {
    if (presetName === 'zero_day') {
      setFormData({
        event_type: 'ids_alert',
        source: 'Microsoft Sentinel v1.0.0',
        severity: 'critical',
        alert_type: 'Zero-Day Exploit',
        category: 'Exploit',
        affected_system: '10.0.4.15',
        asset_category: 'Target Network Host',
        alert_burst_score: 3.0,
        repeated_alert_count: 2,
        is_anomaly: true,
      });
    } else if (presetName === 'routine_noise') {
      setFormData({
        event_type: 'network',
        source: 'Zeek v5.0.0',
        severity: 'info',
        alert_type: 'Port Scan',
        category: 'Recon',
        affected_system: '192.168.1.1',
        asset_category: 'Target Network Host',
        alert_burst_score: 0.0,
        repeated_alert_count: 85,
        is_anomaly: false,
      });
    } else if (presetName === 'cloud_mining') {
      setFormData({
        event_type: 'cloud',
        source: 'Wazuh v4.5.0',
        severity: 'high',
        alert_type: 'Crypto Mining',
        category: 'Malware',
        affected_system: 'arn:aws:ec2:us-east-1:prod-cluster',
        asset_category: 'Cloud Resource',
        alert_burst_score: 2.0,
        repeated_alert_count: 4,
        is_anomaly: true,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-soc-cardBorder p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Live Alert Prioritization & ML Inference Simulator</h2>
              <p className="text-xs text-gray-400">Test real-time Random Forest incident probability estimation and triage prioritization</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg bg-slate-800 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="my-4 flex items-center space-x-2 text-xs">
          <span className="text-gray-400">Load Preset:</span>
          <button
            type="button"
            onClick={() => loadPreset('zero_day')}
            className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 transition-all"
          >
            Zero-Day Threat (Critical)
          </button>
          <button
            type="button"
            onClick={() => loadPreset('cloud_mining')}
            className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30 transition-all"
          >
            Cloud Crypto Mining (High)
          </button>
          <button
            type="button"
            onClick={() => loadPreset('routine_noise')}
            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 transition-all"
          >
            Routine Scanner (High Noise)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-gray-400 mb-1">Event Domain</label>
              <select
                value={formData.event_type}
                onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
              >
                <option value="ids_alert">IDS Alert</option>
                <option value="cloud">Cloud Security</option>
                <option value="endpoint">Endpoint Activity</option>
                <option value="ai">AI Model</option>
                <option value="iot">IoT Device</option>
                <option value="auth">Authentication</option>
                <option value="network">Network</option>
                <option value="firewall">Firewall</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 mb-1">Severity</label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono uppercase"
              >
                <option value="emergency">EMERGENCY</option>
                <option value="critical">CRITICAL</option>
                <option value="high">HIGH</option>
                <option value="medium">MEDIUM</option>
                <option value="low">LOW</option>
                <option value="info">INFO</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 mb-1">Alert / Threat Type</label>
              <input
                type="text"
                value={formData.alert_type}
                onChange={(e) => setFormData({ ...formData, alert_type: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1">Detection Tool Source</label>
              <input
                type="text"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1">Affected System ID</label>
              <input
                type="text"
                value={formData.affected_system}
                onChange={(e) => setFormData({ ...formData, affected_system: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1">Asset Category</label>
              <select
                value={formData.asset_category}
                onChange={(e) => setFormData({ ...formData, asset_category: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
              >
                <option value="Target Network Host">Target Network Host</option>
                <option value="Cloud Resource">Cloud Resource</option>
                <option value="AI Model Engine">AI Model Engine</option>
                <option value="IoT Hardware">IoT Hardware</option>
                <option value="Endpoint File/Object">Endpoint File/Object</option>
                <option value="User Identity">User Identity</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 mb-1">Burst Factor (0 - 3.0)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="3"
                value={formData.alert_burst_score || 0}
                onChange={(e) => setFormData({ ...formData, alert_burst_score: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1">Repetition Count</label>
              <input
                type="number"
                min="1"
                value={formData.repeated_alert_count || 1}
                onChange={(e) => setFormData({ ...formData, repeated_alert_count: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
              />
            </div>

            <div className="flex items-center space-x-2 pt-5">
              <input
                type="checkbox"
                id="is_anomaly"
                checked={formData.is_anomaly || false}
                onChange={(e) => setFormData({ ...formData, is_anomaly: e.target.checked })}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500"
              />
              <label htmlFor="is_anomaly" className="text-gray-300 cursor-pointer">
                Behavioral Anomaly Detected
              </label>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
            >
              {loading ? 'Evaluating Model Inference...' : 'Run Prioritization & Inference Engine'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Prediction Results Display */}
        {result && (
          <div className="mt-5 p-4 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white text-xs">Model Prediction Result</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                result.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                result.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                result.priority === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' :
                'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                PRIORITY: {result.priority}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-gray-400 text-[10px] block">Incident Probability</span>
                <span className="text-lg font-bold font-mono text-rose-400">
                  {(result.incident_probability * 100).toFixed(1)}%
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-gray-400 text-[10px] block">Priority Score</span>
                <span className="text-lg font-bold font-mono text-cyan-400">
                  {result.priority_score} / 100
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-gray-400 text-[10px] block">Operational Noise Score</span>
                <span className="text-lg font-bold font-mono text-emerald-400">
                  {result.noise_score}% ({result.noise_level})
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-gray-300">
              <span className="text-cyan-400 font-semibold">Triage Explanation: </span>
              {result.explanation}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
