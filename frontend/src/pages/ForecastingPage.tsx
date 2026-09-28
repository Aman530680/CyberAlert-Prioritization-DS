/**
 * Hellow Sentinel Predictive Forecasting Page
 * ML attack progression models, trajectory likelihoods, and incident horizon metrics
 * with calibrated operational risk thresholds.
 */

import React from 'react';
import { TrendingUp, Brain, ShieldAlert, Cpu } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from 'recharts';

const FORECAST_POINTS = [
  { time: 'T+0m', currentRisk: 14, predictedRisk: 14, upperBand: 18, lowerBand: 12 },
  { time: 'T+1m', currentRisk: 22, predictedRisk: 24, upperBand: 29, lowerBand: 19 },
  { time: 'T+2m', currentRisk: 38, predictedRisk: 42, upperBand: 50, lowerBand: 34 },
  { time: 'T+3m', currentRisk: null, predictedRisk: 68, upperBand: 79, lowerBand: 57 },
  { time: 'T+4m', currentRisk: null, predictedRisk: 84, upperBand: 95, lowerBand: 73 },
  { time: 'T+5m', currentRisk: null, predictedRisk: 62, upperBand: 74, lowerBand: 50 },
  { time: 'T+6m', currentRisk: null, predictedRisk: 35, upperBand: 45, lowerBand: 25 },
];

export const ForecastingPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-[20px] font-semibold text-text-1">Predictive Risk & Attack Trajectory Forecasting</h1>
        <p className="text-[12px] text-text-4 font-mono mt-0.5">Hellow Sentinel Machine Learning Forward Projection & Threshold Bands</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-card bg-card border border-border card-highlight">
          <span className="text-card-label text-text-4">MODEL CONFIDENCE</span>
          <div className="text-kpi font-mono text-cyan font-semibold mt-1">88.4%</div>
          <div className="text-[11px] font-mono text-text-4 mt-1">Based on 80,000 historical priors</div>
        </div>
        <div className="p-4 rounded-card bg-card border border-border card-highlight">
          <span className="text-card-label text-text-4">PEAK HORIZON</span>
          <div className="text-kpi font-mono text-amber font-semibold mt-1">T+4m 12s</div>
          <div className="text-[11px] font-mono text-red mt-1">Anticipated Critical Peak (84/100)</div>
        </div>
        <div className="p-4 rounded-card bg-card border border-border card-highlight">
          <span className="text-card-label text-text-4">ESTIMATED MITIGATION</span>
          <div className="text-kpi font-mono text-green font-semibold mt-1">T+6m 40s</div>
          <div className="text-[11px] font-mono text-text-4 mt-1">Automated firewall rate-limit damping</div>
        </div>
      </div>

      {/* Trajectory Forecast Chart with Threshold Lines */}
      <div className="p-4 rounded-card bg-card border border-border card-highlight">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue" />
            <span className="text-card-label text-text-3 font-medium">PREDICTED ATTACK TRAJECTORY CONE</span>
          </div>

          {/* Threshold Legend Badges */}
          <div className="flex items-center gap-3 text-[10px] font-mono">
            <span className="flex items-center gap-1.5 text-red">
              <span className="w-2 h-0.5 bg-red border-dashed" />
              Critical Breach (80+)
            </span>
            <span className="flex items-center gap-1.5 text-orange">
              <span className="w-2 h-0.5 bg-orange" />
              Incident Triage (50+)
            </span>
            <span className="flex items-center gap-1.5 text-green">
              <span className="w-2 h-0.5 bg-green" />
              Normal Baseline (&lt;25)
            </span>
          </div>
        </div>

        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={FORECAST_POINTS} margin={{ top: 15, right: 30, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 4" stroke="#1c1c22" vertical={false} />
              <XAxis
                dataKey="time"
                stroke="#52525b"
                tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                tickLine={false}
                axisLine={{ stroke: '#1c1c22' }}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#52525b"
                tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                tickLine={false}
                axisLine={{ stroke: '#1c1c22' }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="p-2.5 rounded bg-[#09090b] border border-border text-[11px] font-mono card-highlight shadow-xl">
                      <div className="text-text-4 mb-1">{label} Horizon</div>
                      {payload.map((item: any) => (
                        <div key={item.name} className="flex justify-between gap-4 py-0.5">
                          <span style={{ color: item.color }}>{item.name}:</span>
                          <span className="text-text-1 font-semibold">{item.value}/100</span>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />

              {/* Threshold Reference Lines */}
              <ReferenceLine
                y={80}
                stroke="#dc2626"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: 'CRITICAL THRESHOLD (80)',
                  fill: '#dc2626',
                  fontSize: 10,
                  fontFamily: 'JetBrains Mono',
                  position: 'insideTopRight',
                }}
              />
              <ReferenceLine
                y={50}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: 'ESCALATION THRESHOLD (50)',
                  fill: '#f59e0b',
                  fontSize: 10,
                  fontFamily: 'JetBrains Mono',
                  position: 'insideTopRight',
                }}
              />
              <ReferenceLine
                y={25}
                stroke="#22c55e"
                strokeDasharray="4 4"
                strokeWidth={1.2}
                label={{
                  value: 'BASELINE THRESHOLD (25)',
                  fill: '#22c55e',
                  fontSize: 10,
                  fontFamily: 'JetBrains Mono',
                  position: 'insideBottomRight',
                }}
              />

              <Area
                type="monotone"
                dataKey="upperBand"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.12}
                name="Upper Uncertainty (95% CI)"
              />
              <Area
                type="monotone"
                dataKey="predictedRisk"
                stroke="#d4a03c"
                strokeWidth={2}
                fill="none"
                name="Predicted Risk Score"
              />
              <Area
                type="monotone"
                dataKey="currentRisk"
                stroke="#06b6d4"
                strokeWidth={2.5}
                fill="none"
                name="Observed Telemetry"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
