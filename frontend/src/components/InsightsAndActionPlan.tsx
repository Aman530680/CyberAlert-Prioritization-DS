import React from 'react';
import { InsightItem, ActionPlan } from '../services/api';
import { Sparkles, CheckCircle2, Clock, ShieldCheck, Target, ArrowRight } from 'lucide-react';

interface InsightsProps {
  insights: InsightItem[];
  actionPlan: ActionPlan | null;
  loading: boolean;
}

export const InsightsAndActionPlan: React.FC<InsightsProps> = ({ insights, actionPlan, loading }) => {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass-panel p-6 rounded-2xl border border-soc-cardBorder animate-pulse h-64" />
        <div className="glass-panel p-6 rounded-2xl border border-soc-cardBorder animate-pulse h-64" />
      </div>
    );
  }

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    }
  };

  return (
    <div className="space-y-6 mb-6">
      {/* 5-7 EMPIRICAL DATA-DRIVEN INSIGHTS */}
      <div className="glass-panel p-5 rounded-2xl border border-soc-cardBorder">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Dynamic Empirical Insights & Threat Discoveries</h3>
              <p className="text-xs text-gray-400">Derived directly from the 100,000 alert records in MySQL (zero hardcoded values)</p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
            {insights.length} Key Discoveries
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-cyan-400 font-bold">{item.id}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${getImpactBadge(item.impact)}`}>
                    {item.impact}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white mb-1.5">{item.title}</h4>
                <p className="text-xs text-gray-300 leading-relaxed mb-3">{item.finding}</p>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[10px] font-mono uppercase text-gray-400 block mb-0.5">Recommendation:</span>
                <p className="text-[11px] text-cyan-300 font-medium">{item.recommendation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PRACTICAL SOC ACTION PLAN */}
      {actionPlan && (
        <div className="glass-panel p-5 rounded-2xl border border-soc-cardBorder">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">{actionPlan.title}</h3>
                <p className="text-xs text-gray-400">Actionable recommendations prioritized by operational impact and SLA</p>
              </div>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-300 border border-slate-700">
              Operational Roadmap
            </span>
          </div>

          <div className="space-y-3">
            {actionPlan.action_items.map((step) => (
              <div
                key={step.step}
                className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs shrink-0 border border-emerald-500/30">
                    {step.step}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white">{step.action}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-gray-400 border border-slate-700">
                        {step.phase}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 mt-1">{step.description}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 shrink-0 text-xs">
                  <div className="flex items-center space-x-1.5 text-amber-400 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>SLA: {step.sla}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
