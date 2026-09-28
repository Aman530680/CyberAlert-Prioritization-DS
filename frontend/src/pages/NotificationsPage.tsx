/**
 * OmniSentinel Notifications Page
 * Displays real-time operational alerts and escalation notices.
 */

import React from 'react';
import { Bell, ShieldAlert, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

const NOTIFICATIONS = [
  { id: 'NOTIF-1', title: 'Critical Alert Burst Escalation', message: 'Perimeter firewall FW-01 reported 820 pps burst originating from 192.168.1.105.', time: '2m ago', severity: 'CRITICAL' },
  { id: 'NOTIF-2', title: 'Model Calibrated with 100,000 Alerts', message: 'Random Forest classifier re-evaluated: ROC-AUC 0.8018 with 92.9% workload reduction.', time: '14m ago', severity: 'INFO' },
  { id: 'NOTIF-3', title: 'High Noise Rule Detected', message: 'Signature SIG-0419 generated 1,420 repetitive alerts with 0.0% incident conversion rate.', time: '38m ago', severity: 'HIGH' },
  { id: 'NOTIF-4', title: 'CISA IoC Feed Synchronized', message: '310 new zero-day exploitation signatures added to detection registry.', time: '1h ago', severity: 'INFO' },
  { id: 'NOTIF-5', title: 'Automated Rate-Limit Implemented', message: 'Host 10.0.0.41 rate-limiting enabled for inbound TCP SYN traffic.', time: '2h ago', severity: 'HIGH' },
];

export const NotificationsPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-[20px] font-semibold text-text-1">Security Operations Notifications</h1>
        <p className="text-[12px] text-text-4 font-mono mt-0.5">Automated platform escalations and intelligence syncs</p>
      </div>

      <div className="space-y-3">
        {NOTIFICATIONS.map(notif => (
          <div key={notif.id} className="p-4 rounded-card bg-card border border-border card-highlight flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-inset border border-border shrink-0 mt-0.5">
                <Bell className="w-4 h-4 text-amber" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-text-1">{notif.title}</span>
                  <span className="px-1.5 py-0.2 rounded-badge bg-white/[0.05] text-[10px] font-mono text-text-4">{notif.id}</span>
                </div>
                <div className="text-[12px] text-text-3 mt-1 leading-relaxed">{notif.message}</div>
              </div>
            </div>

            <div className="flex flex-col items-end shrink-0 gap-1 text-[11px] font-mono">
              <span className={`px-2 py-0.5 rounded-badge text-[10px] font-bold ${
                notif.severity === 'CRITICAL' ? 'bg-red text-white' : notif.severity === 'HIGH' ? 'bg-orange/20 text-orange' : 'bg-blue/20 text-blue'
              }`}>
                {notif.severity}
              </span>
              <span className="text-text-4 flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3" />
                {notif.time}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
