import React from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { ModelMetrics, FeatureImportance } from '../services/api';
import { Cpu, CheckCircle2, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

interface MLPerformanceProps {
  metrics: ModelMetrics | null;
  features: FeatureImportance[];
  loading: boolean;
}

export const MLPerformanceView: React.FC<MLPerformanceProps> = ({ metrics, features, loading }) => {
  if (loading || !metrics) {
    return (
      <div className="space-y-6">
        <div className="glass-panel p-6 rounded-2xl border border-soc-cardBorder animate-pulse h-72" />
        <div className="glass-panel p-6 rounded-2xl border border-soc-cardBorder animate-pulse h-72" />
      </div>
    );
  }

  const m = metrics.metrics;
  const cm = metrics.confusion_matrix;
  const impact = metrics.soc_operational_impact;

  const metricCards = [
    { title: 'Test Accuracy', value: `${(m.accuracy * 100).toFixed(2)}%`, sub: 'Out-of-time holdout' },
    { title: 'Incident Recall', value: `${(m.recall * 100).toFixed(2)}%`, sub: 'Threat capture rate' },
    { title: 'Precision', value: `${(m.precision * 100).toFixed(2)}%`, sub: 'True positive fidelity' },
    { title: 'F1-Score', value: `${(m.f1_score * 100).toFixed(2)}%`, sub: 'Harmonic balance' },
    { title: 'ROC-AUC', value: m.roc_auc.toFixed(4), sub: 'Discrimination capacity' },
    { title: 'Workload Reduction', value: `${impact.analyst_workload_reduction_pct}%`, sub: 'Fatigue eliminated' }
  ];

  return (
    <div className="space-y-6 mb-6">
      {/* ML KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metricCards.map((c, idx) => (
          <div key={idx} className="glass-panel p-4 rounded-xl border border-soc-cardBorder flex flex-col justify-between">
            <span className="text-[11px] font-medium text-gray-400 tracking-wider uppercase">{c.title}</span>
            <div className="text-xl font-bold font-mono text-cyan-400 my-1">{c.value}</div>
            <span className="text-[10px] text-gray-400">{c.sub}</span>
          </div>
        ))}
      </div>

      {/* CONFUSION MATRIX & OPERATIONAL IMPACT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confusion Matrix */}
        <div className="glass-panel p-5 rounded-2xl border border-soc-cardBorder">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Confusion Matrix (20,000 Out-of-Time Test Set)</h3>
                <p className="text-xs text-gray-400">Chronological validation without temporal leakage</p>
              </div>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-blue-300 border border-slate-700">
              Holdout
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/30 flex flex-col items-center justify-center">
              <span className="text-xs font-semibold text-emerald-400 mb-1">True Negatives (TN)</span>
              <span className="text-2xl font-bold font-mono text-white">{cm.true_negatives.toLocaleString()}</span>
              <span className="text-[10px] text-gray-400 mt-1">Benign alerts correctly deprioritized</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/30 flex flex-col items-center justify-center">
              <span className="text-xs font-semibold text-amber-400 mb-1">False Positives (FP)</span>
              <span className="text-2xl font-bold font-mono text-white">{cm.false_positives.toLocaleString()}</span>
              <span className="text-[10px] text-gray-400 mt-1">Benign alerts escalated for triage</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-rose-500/40 flex flex-col items-center justify-center">
              <span className="text-xs font-semibold text-rose-400 mb-1">False Negatives (FN)</span>
              <span className="text-2xl font-bold font-mono text-white">{cm.false_negatives.toLocaleString()}</span>
              <span className="text-[10px] text-gray-400 mt-1">Missed incident alerts</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/40 flex flex-col items-center justify-center">
              <span className="text-xs font-semibold text-cyan-400 mb-1">True Positives (TP)</span>
              <span className="text-2xl font-bold font-mono text-white">{cm.true_positives.toLocaleString()}</span>
              <span className="text-[10px] text-gray-400 mt-1">Confirmed threats successfully intercepted</span>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-gray-300">
            <span className="font-semibold text-cyan-300">SOC Assessment: </span>
            {impact.assessment}
          </div>
        </div>

        {/* ROC & PR Curves */}
        <div className="glass-panel p-5 rounded-2xl border border-soc-cardBorder">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">ROC Curve (AUC = {m.roc_auc.toFixed(4)})</h3>
                <p className="text-xs text-gray-400">True Positive Rate vs. False Positive Rate across thresholds</p>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.roc_curve} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="fpr" stroke="#64748b" tick={{ fontSize: 10 }} label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#64748b' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Line type="monotone" dataKey="tpr" stroke="#06b6d4" strokeWidth={2.5} dot={false} name="Model ROC" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* GLOBAL FEATURE IMPORTANCE */}
      <div className="glass-panel p-5 rounded-2xl border border-soc-cardBorder">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Random Forest Global Feature Importance (Top 15)</h3>
              <p className="text-xs text-gray-400">Gini impurity reduction across all 150 decision trees</p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-purple-300 border border-slate-700">
            Explainability
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={features.slice(0, 15)} layout="vertical" margin={{ top: 10, right: 30, left: 110, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="feature" stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} width={120} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                itemStyle={{ color: '#f8fafc' }}
                formatter={(val: any) => [`${(val * 100).toFixed(2)}%`, 'Relative Weight']}
              />
              <Bar dataKey="importance" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
