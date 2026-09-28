/**
 * OmniSentinel Simulation Engine Hook
 * Replays real dataset chunks or falls back to synthetic high-fidelity simulation.
 * Driven by a 2000ms base tick (modulated by 1x/2x/4x speed).
 * Computes live KPIs, dynamic 270° gauge scores, line-chart sliding window,
 * event feeds, and threat entity parameters.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { NormalizedAlert, MappedSeverity } from '../types/alert';
import { dataLoader } from '../data/loader';
import { ScenarioType } from '../components/layout/SubBar';

export type SimulationPhase = 'Normal' | 'Recon' | 'Escalation' | 'Peak' | 'Mitigation';

export interface TrafficHistoryPoint {
  time: string;
  timestamp: number;
  packetsPerSec: number;
  synFloodRate: number;
  risk: number;
}

export interface SignalEvent {
  id: string;
  title: string;
  subTitle: string;
  severity: MappedSeverity;
  timestamp: string;
  sourceIp: string;
  targetIp: string;
  targetPort: number;
  protocol: string;
  rawLog?: string;
  mitreTechnique?: string;
}

export interface SimulationState {
  isPlaying: boolean;
  speed: number;
  scenario: ScenarioType;
  phase: SimulationPhase;
  step: number;
  isRealDataReplay: boolean;
  kpis: {
    networkRisk: number;
    riskDelta: number;
    forecastRisk: number;
    forecastConfidence: number;
    anomalyScore: number;
    anomalyTrajectory: 'Stable' | 'Rising' | 'Declining';
    packetsPerSec: number;
    protocol: string;
    severity: MappedSeverity;
    severityLabel: string;
  };
  threatStatus: {
    scenarioName: string;
    level: MappedSeverity;
    sourceIp: string;
    targetIp: string;
    targetPort: number;
    protocol: string;
    phase: string;
    trajectory: string;
    mitreTechnique: string;
  };
  trafficHistory: TrafficHistoryPoint[];
  trafficBreakdown: {
    name: string;
    value: number;
    percentage: number;
    color: string;
  }[];
  recentSignals: SignalEvent[];
  topSources: {
    ip: string;
    count: number;
    percentage: number;
    severity: MappedSeverity;
  }[];
  severityMix24h: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export function useSimulation() {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);
  const [scenario, setScenario] = useState<ScenarioType>('DDOS');
  const [step, setStep] = useState<number>(0);
  const [phase, setPhase] = useState<SimulationPhase>('Normal');

  // Loaded real dataset cache
  const [realAlerts, setRealAlerts] = useState<NormalizedAlert[]>([]);
  const [isRealDataReplay, setIsRealDataReplay] = useState<boolean>(true);
  const currentChunkIndexRef = useRef<number>(0);
  const alertPointerRef = useRef<number>(0);

  // Initial KPIs matching reference specs:
  // NETWORK RISK 14 (+2 PROJECTED, Severity: LOW)
  // ANOMALY SCORE 8 (STABLE)
  // FORECAST RISK 16 (12% CONF.)
  // PACKETS / SEC 820 (NORMAL, Protocol: TCP)
  const [state, setState] = useState<SimulationState>({
    isPlaying: true,
    speed: 1,
    scenario: 'DDOS',
    phase: 'Normal',
    step: 0,
    isRealDataReplay: true,
    kpis: {
      networkRisk: 14,
      riskDelta: 2,
      forecastRisk: 16,
      forecastConfidence: 12,
      anomalyScore: 8,
      anomalyTrajectory: 'Stable',
      packetsPerSec: 820,
      protocol: 'TCP',
      severity: 'LOW',
      severityLabel: 'LOW',
    },
    threatStatus: {
      scenarioName: 'DDoS SYN Flood',
      level: 'LOW',
      sourceIp: '192.168.1.105',
      targetIp: '10.0.0.41',
      targetPort: 443,
      protocol: 'TCP',
      phase: 'Normal',
      trajectory: 'Stable',
      mitreTechnique: 'T1498 Network DoS',
    },
    trafficHistory: [
      { time: '12:00:00', timestamp: 1719998400000, packetsPerSec: 780, synFloodRate: 180, risk: 12 },
      { time: '12:00:02', timestamp: 1719998402000, packetsPerSec: 810, synFloodRate: 210, risk: 13 },
      { time: '12:00:04', timestamp: 1719998404000, packetsPerSec: 820, synFloodRate: 240, risk: 14 },
    ],
    trafficBreakdown: [
      { name: 'Packets / sec', value: 820, percentage: 48, color: '#06b6d4' },
      { name: 'SYN Flood Rate', value: 240, percentage: 26, color: '#d4a03c' },
      { name: 'Flow Count', value: 165, percentage: 16, color: '#3b82f6' },
      { name: 'Active Conn', value: 92, percentage: 10, color: '#22c55e' },
    ],
    recentSignals: [],
    topSources: [
      { ip: '10.0.0.41', count: 1240, percentage: 28, severity: 'CRITICAL' },
      { ip: '192.168.1.105', count: 910, percentage: 21, severity: 'HIGH' },
      { ip: '172.16.0.22', count: 680, percentage: 16, severity: 'HIGH' },
      { ip: '10.0.0.18', count: 490, percentage: 12, severity: 'MEDIUM' },
      { ip: '192.168.2.14', count: 320, percentage: 8, severity: 'LOW' },
    ],
    severityMix24h: {
      critical: 20231,
      high: 20496,
      medium: 20639,
      low: 38634,
    },
  });

  // Load first alert chunks for replay
  useEffect(() => {
    dataLoader.getAlertsChunk(0)
      .then(chunk => {
        if (chunk && chunk.length > 0) {
          setRealAlerts(chunk);
          setIsRealDataReplay(true);
        }
      })
      .catch(() => {
        setIsRealDataReplay(false);
      });
  }, []);

  // Compute Phase from Step & Risk trajectory (36 steps total, 10 transitions)
  const determinePhase = useCallback((currentStep: number, risk: number): SimulationPhase => {
    const cycleStep = currentStep % 36;
    if (cycleStep < 6) return 'Normal';
    if (cycleStep < 14) return 'Recon';
    if (cycleStep < 24) return 'Escalation';
    if (cycleStep < 30) return 'Peak';
    return 'Mitigation';
  }, []);

  // Simulation Tick (every 2000ms / speed)
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = Math.max(250, Math.round(2000 / speed));
    const timer = setInterval(() => {
      setStep(prevStep => {
        const nextStep = prevStep + 1;
        const now = new Date();
        const timeStr = now.toTimeString().slice(0, 8);

        // Consume next batch of 2-4 alerts from real dataset
        let consumedAlerts: NormalizedAlert[] = [];
        if (realAlerts.length > 0) {
          const ptr = alertPointerRef.current;
          consumedAlerts = realAlerts.slice(ptr, ptr + 3);
          alertPointerRef.current = (ptr + 3) % realAlerts.length;

          // If reached end of current chunk, fetch next chunk
          if (alertPointerRef.current + 10 >= realAlerts.length) {
            currentChunkIndexRef.current = (currentChunkIndexRef.current + 1) % 10;
            dataLoader.getAlertsChunk(currentChunkIndexRef.current).then(newChunk => {
              if (newChunk && newChunk.length > 0) setRealAlerts(newChunk);
            }).catch(() => {});
          }
        }

        // Calculate dynamic metrics based on scenario and phase
        const currentCycle = nextStep % 36;
        let riskBase = 14;
        let ppsBase = 820;
        let synBase = 240;

        if (scenario === 'DDOS') {
          if (currentCycle >= 14 && currentCycle < 30) {
            // Escalation & Peak
            riskBase = Math.min(94, 35 + (currentCycle - 14) * 4 + Math.round(Math.random() * 6));
            ppsBase = 1400 + (currentCycle - 14) * 85 + Math.round(Math.random() * 120);
            synBase = 580 + (currentCycle - 14) * 45 + Math.round(Math.random() * 60);
          } else if (currentCycle >= 6 && currentCycle < 14) {
            // Recon
            riskBase = 22 + (currentCycle - 6) * 2;
            ppsBase = 920 + Math.round(Math.random() * 80);
            synBase = 310 + Math.round(Math.random() * 40);
          } else if (currentCycle >= 30) {
            // Mitigation
            riskBase = Math.max(16, 85 - (currentCycle - 30) * 12);
            ppsBase = Math.max(830, 2200 - (currentCycle - 30) * 220);
            synBase = Math.max(250, 950 - (currentCycle - 30) * 110);
          }
        } else if (scenario === 'BRUTE FORCE') {
          if (currentCycle >= 14 && currentCycle < 30) {
            riskBase = Math.min(88, 40 + (currentCycle - 14) * 3);
            ppsBase = 950 + Math.round(Math.random() * 90);
            synBase = 420 + Math.round(Math.random() * 50);
          }
        } else {
          // PORT SCAN
          if (currentCycle >= 6 && currentCycle < 24) {
            riskBase = Math.min(68, 25 + (currentCycle - 6) * 2.5);
            ppsBase = 890 + Math.round(Math.random() * 60);
            synBase = 320 + Math.round(Math.random() * 30);
          }
        }

        const calculatedPhase = determinePhase(nextStep, riskBase);
        setPhase(calculatedPhase);

        // Derive Severity from Risk
        let sev: MappedSeverity = 'LOW';
        if (riskBase >= 70) sev = 'CRITICAL';
        else if (riskBase >= 45) sev = 'HIGH';
        else if (riskBase >= 25) sev = 'MEDIUM';

        // Format new signals from consumed real records
        const newSignals: SignalEvent[] = consumedAlerts.map((a, i) => ({
          id: a.id || `sig-${nextStep}-${i}`,
          title: a.alertType,
          subTitle: `${a.srcIp} · Step T+${currentCycle}`,
          severity: a.severity,
          timestamp: timeStr,
          sourceIp: a.srcIp,
          targetIp: a.dstIp,
          targetPort: a.dstPort || 443,
          protocol: a.protocol,
          rawLog: a.rawLog,
          mitreTechnique: a.mitreTechnique || (scenario === 'DDOS' ? 'T1498 Network DoS' : scenario === 'BRUTE FORCE' ? 'T1110 Brute Force' : 'T1046 Network Service Discovery'),
        }));

        setState(prev => {
          const nextHistory = [
            ...prev.trafficHistory.slice(-19),
            {
              time: timeStr,
              timestamp: Date.now(),
              packetsPerSec: ppsBase,
              synFloodRate: synBase,
              risk: riskBase,
            },
          ];

          const updatedSignals = [...newSignals, ...prev.recentSignals].slice(0, 16);

          const leadAlert = consumedAlerts[0];
          const srcIp = leadAlert?.srcIp || (scenario === 'DDOS' ? '192.168.1.105' : '10.0.0.88');
          const dstIp = leadAlert?.dstIp || '10.0.0.41';

          return {
            ...prev,
            step: nextStep,
            phase: calculatedPhase,
            isRealDataReplay,
            kpis: {
              networkRisk: riskBase,
              riskDelta: riskBase - prev.kpis.networkRisk,
              forecastRisk: Math.min(100, riskBase + (calculatedPhase === 'Escalation' ? 8 : calculatedPhase === 'Peak' ? 2 : -3)),
              forecastConfidence: calculatedPhase === 'Peak' ? 88 : 74,
              anomalyScore: Math.round(riskBase * 0.58),
              anomalyTrajectory: calculatedPhase === 'Escalation' || calculatedPhase === 'Peak' ? 'Rising' : calculatedPhase === 'Mitigation' ? 'Declining' : 'Stable',
              packetsPerSec: ppsBase,
              protocol: leadAlert?.protocol || 'TCP',
              severity: sev,
              severityLabel: sev,
            },
            threatStatus: {
              scenarioName: scenario === 'DDOS' ? 'DDoS SYN Flood' : scenario === 'BRUTE FORCE' ? 'Credential Stuffing' : 'Lateral Port Scan',
              level: sev,
              sourceIp: srcIp,
              targetIp: dstIp,
              targetPort: leadAlert?.dstPort || (scenario === 'DDOS' ? 443 : scenario === 'BRUTE FORCE' ? 22 : 8080),
              protocol: leadAlert?.protocol || 'TCP',
              phase: calculatedPhase,
              trajectory: calculatedPhase === 'Escalation' ? 'Elevating' : calculatedPhase === 'Peak' ? 'Critical Peak' : calculatedPhase === 'Mitigation' ? 'Mitigating' : 'Nominal',
              mitreTechnique: scenario === 'DDOS' ? 'T1498 Network DoS' : scenario === 'BRUTE FORCE' ? 'T1110 Brute Force' : 'T1046 Network Service Discovery',
            },
            trafficHistory: nextHistory,
            trafficBreakdown: [
              { name: 'Packets / sec', value: ppsBase, percentage: 46, color: '#06b6d4' },
              { name: 'SYN Flood Rate', value: synBase, percentage: 28, color: '#d4a03c' },
              { name: 'Flow Count', value: Math.round(ppsBase * 0.22), percentage: 16, color: '#3b82f6' },
              { name: 'Active Conn', value: Math.round(ppsBase * 0.12), percentage: 10, color: '#22c55e' },
            ],
            recentSignals: updatedSignals,
          };
        });

        return nextStep;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, speed, scenario, realAlerts, isRealDataReplay, determinePhase]);

  const togglePlay = () => setIsPlaying(p => !p);

  return {
    state,
    isPlaying,
    togglePlay,
    speed,
    setSpeed,
    scenario,
    setScenario,
    phase,
    step,
  };
}
