import React from 'react';
import { OverviewStats } from '../services/api';
import { ShieldAlert, Flame, AlertTriangle, BellOff, CheckCircle2, TrendingUp } from 'lucide-react';

interface OverviewCardsProps {
  stats: OverviewStats | null;
  loading: boolean;
}

export const OverviewCards: React.FC<OverviewCardsProps> = ({ stats, loading }) => {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass-panel p-4 rounded-xl border border-soc-cardBorder animate-pulse h-28" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Alerts Ingested',
      value: stats.total_alerts.toLocaleString(),
      subtext: `Telemetry: ${stats.date_range_start.slice(0, 10)} to ${stats.date_range_end.slice(0, 10)}`,
      icon: ShieldAlert,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30'
    },
    {
      title: 'Confirmed Incidents',
      value: stats.total_incidents.toLocaleString(),
      subtext: `${stats.incident_rate}% True Escalation Rate`,
      icon: Flame,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/30',
      badge: `${stats.incident_rate}% Rate`
    },
    {
      title: 'Critical Severity Alerts',
      value: stats.critical_alerts.toLocaleString(),
      subtext: `${roundPct(stats.critical_alerts, stats.total_alerts)}% of Total Volume`,
      icon: AlertTriangle,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30'
    },
    {
      title: 'High/Critical Priority',
      value: stats.high_priority_alerts.toLocaleString(),
      subtext: `${roundPct(stats.high_priority_alerts, stats.total_alerts)}% Requiring Triage`,
      icon: TrendingUp,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      badge: 'Actionable'
    },
    {
      title: 'High Noise Alerts',
      value: stats.high_noise_alerts.toLocaleString(),
      subtext: `${roundPct(stats.high_noise_alerts, stats.total_alerts)}% Tuning Candidates`,
      icon: BellOff,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      badge: 'Suppressible'
    },
    {
      title: 'Random Forest Accuracy',
      value: `${stats.model_accuracy}%`,
      subtext: `ROC-AUC: ${stats.model_roc_auc}`,
      icon: CheckCircle2,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      badge: 'Validated'
    },
  ];

  function roundPct(count: number, total: number) {
    if (!total) return '0.0';
    return ((count / total) * 100).toFixed(1);
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`glass-panel p-4 rounded-xl border ${card.borderColor} flex flex-col justify-between transition-all hover:translate-y-[-2px] hover:shadow-lg`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-gray-400 tracking-wider uppercase truncate">
                {card.title}
              </span>
              <div className={`p-1.5 rounded-lg ${card.bgColor} ${card.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="my-1">
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold font-mono text-white tracking-tight">{card.value}</span>
                {card.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${card.bgColor} ${card.color}`}>
                    {card.badge}
                  </span>
                )}
              </div>
            </div>

            <p className="text-[11px] text-gray-400 truncate mt-1">{card.subtext}</p>
          </div>
        );
      })}
    </div>
  );
};
