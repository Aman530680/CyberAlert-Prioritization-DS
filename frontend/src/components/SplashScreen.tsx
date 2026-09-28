/**
 * OmniSentinel Splash Screen
 * Deep navy background with SVG watermark graphics, non-linear progress calibration,
 * animated stats count-up, status cycler, and background data prefetch.
 */

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { dataLoader } from '../data/loader';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SPLASH_DURATION_MS = 7000;

const STATUS_MESSAGES = [
  'INITIALIZING SECURITY OPERATIONS CENTER…',
  'LOADING THREAT INTELLIGENCE…',
  'CALIBRATING ANOMALY MODELS…',
  'SYNCING MITRE ATT&CK MATRIX…',
  'SOC READY',
];

const CHIPS = [
  'Anomaly Detection',
  'Risk Forecasting',
  'MITRE ATT&CK',
  'Scenario Simulation',
];

const STATS = [
  { target: 3, label: 'ATTACK SCENARIOS' },
  { target: 9, label: 'PIPELINE STAGES' },
  { target: 36, label: 'STEPS / SCENARIO' },
  { target: 10, label: 'PHASE TRANSITIONS' },
];

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const [statValues, setStatValues] = useState([0, 0, 0, 0]);
  const [isExiting, setIsExiting] = useState(false);
  const animFrameRef = useRef<number | null>(null);

  // Prefetch data in background while splash plays
  useEffect(() => {
    Promise.allSettled([
      dataLoader.getSummary(),
      dataLoader.getTimeseries(),
      dataLoader.getDistributions(),
      dataLoader.getTopEntities(),
      dataLoader.getHeatmap(),
      dataLoader.getInsights(),
    ]).catch(() => {});
  }, []);

  // Check prefers-reduced-motion
  const prefersReducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration = prefersReducedMotion ? 1500 : SPLASH_DURATION_MS;

  useEffect(() => {
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);

      // Non-linear natural progress curve:
      // Fast to 30%, slow at 60%, small pause, quick finish
      let curve: number;
      if (t < 0.35) {
        curve = (t / 0.35) * 0.42;
      } else if (t < 0.7) {
        curve = 0.42 + ((t - 0.35) / 0.35) * 0.32;
      } else if (t < 0.85) {
        curve = 0.74 + ((t - 0.7) / 0.15) * 0.08;
      } else {
        curve = 0.82 + ((t - 0.85) / 0.15) * 0.18;
      }

      setProgress(Math.min(100, Math.round(curve * 100)));

      // Status text cycler: 5 stages
      const msgIndex = Math.min(
        STATUS_MESSAGES.length - 1,
        Math.floor(t * (STATUS_MESSAGES.length - 0.2))
      );
      setStatusIndex(msgIndex);

      // Stat numbers count-up with ease-out
      const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
      const statProgress = easeOut(Math.min(1, t * 1.2));
      setStatValues(STATS.map(s => Math.round(s.target * statProgress)));

      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        setProgress(100);
        setIsExiting(true);
        setTimeout(() => {
          onComplete();
        }, 500);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [duration, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1, scale: 1 }}
      animate={isExiting ? { opacity: 0, scale: 1.02 } : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden select-none bg-[#040812]"
      style={{
        background: 'radial-gradient(ellipse 90% 70% at 50% 30%, #06202b 0%, #061423 45%, #040812 100%)',
      }}
    >
      {/* 48px Faint Grid with Radial Mask */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 65% 55% at 50% 50%, black 20%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 65% 55% at 50% 50%, black 20%, transparent 80%)',
        }}
      />

      {/* Background SVG Watermark: Isometric Server Rack (left) & Monitor (right) */}
      <svg
        className="absolute left-8 top-1/4 w-[360px] h-[360px] pointer-events-none opacity-[0.07] blur-[1px]"
        viewBox="0 0 200 200"
        fill="none"
        stroke="#3b82f6"
        strokeWidth="1.2"
      >
        <path d="M100 20 L160 55 L160 145 L100 180 L40 145 L40 55 Z" />
        <path d="M100 20 L100 180" />
        <path d="M40 55 L100 90 L160 55" />
        <path d="M40 85 L100 120 L160 85" />
        <path d="M40 115 L100 150 L160 115" />
        <circle cx="55" cy="70" r="1.5" fill="#3b82f6" />
        <circle cx="65" cy="76" r="1.5" fill="#06b6d4" />
        <circle cx="55" cy="100" r="1.5" fill="#3b82f6" />
        <circle cx="65" cy="106" r="1.5" fill="#06b6d4" />
      </svg>

      <svg
        className="absolute right-12 bottom-12 w-[340px] h-[340px] pointer-events-none opacity-[0.06] blur-[1px]"
        viewBox="0 0 200 200"
        fill="none"
        stroke="#06b6d4"
        strokeWidth="1.2"
      >
        <rect x="25" y="35" width="150" height="100" rx="8" />
        <path d="M45 100 L70 85 L95 110 L125 65 L155 85" />
        <line x1="100" y1="135" x2="100" y2="165" />
        <line x1="75" y1="165" x2="125" y2="165" />
      </svg>

      {/* Main Content Layout */}
      <div className="relative z-10 w-full max-w-[1080px] px-8 flex items-center justify-between gap-12">
        {/* LEFT BLOCK: Branding, Tagline, Chips, Progress, Status */}
        <div className="flex-1 max-w-[560px]">
          {/* Pill Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="inline-flex items-center gap-2 px-3 h-[24px] rounded-full border border-blue-500/30 bg-blue-500/10 text-[10px] font-mono tracking-[0.18em] text-blue-400 mb-6 uppercase"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
            <span>Cybersecurity SOC Platform</span>
          </motion.div>

          {/* Logo & Platform Name */}
          <div className="flex items-center gap-5 mb-3">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="relative w-16 h-16 rounded-2xl border border-blue-500/40 bg-blue-950/30 backdrop-blur-md flex items-center justify-center shadow-glow-blue"
            >
              <div className="absolute inset-0 rounded-2xl bg-blue-500/10 blur-sm pointer-events-none" />
              <ShieldCheck className="w-7 h-7 text-blue-400 relative z-10" strokeWidth={1.5} />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-[56px] font-bold tracking-[-0.03em] leading-none bg-gradient-to-b from-white to-[#9ca3af] bg-clip-text text-transparent font-sans"
            >
              OmniSentinel
            </motion.h1>
          </div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-[16px] text-text-2 mb-6 font-normal tracking-normal"
          >
            Network Threat Intelligence & Simulation SOC Platform
          </motion.p>

          {/* 4 Feature Chips */}
          <div className="flex flex-wrap gap-2.5 mb-8">
            {CHIPS.map((chip, index) => (
              <motion.div
                key={chip}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.25 + index * 0.08 }}
                className="h-[28px] px-3.5 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-sm text-[12px] text-text-2 flex items-center hover:border-white/20 transition-colors"
              >
                {chip}
              </motion.div>
            ))}
          </div>

          {/* 1px Divider */}
          <div className="w-full h-[1px] bg-white/[0.08] mb-4" />

          {/* Progress Bar (2px height, gradient fill with glowing head) */}
          <div className="relative w-full h-[2px] bg-white/[0.06] rounded-full overflow-visible mb-3">
            <motion.div
              className="h-full bg-gradient-to-r from-blue to-cyan rounded-full relative"
              style={{ width: `${progress}%` }}
            >
              {/* Glowing head */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-cyan shadow-[0_0_8px_#06b6d4]" />
            </motion.div>
          </div>

          {/* Status Line with Vertical Swap & Blinking Cursor */}
          <div className="h-5 flex items-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={statusIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="text-[10px] font-mono tracking-[0.2em] text-text-4 uppercase flex items-center"
              >
                <span>{STATUS_MESSAGES[statusIndex]}</span>
                <span className="inline-block w-1.5 h-3 ml-1 bg-text-4 animate-pulse">_</span>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT BLOCK: 4 Stacked Stat Cards */}
        <div className="flex flex-col gap-3">
          {STATS.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.15 + idx * 0.1 }}
              className="w-[160px] h-[72px] rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-3 flex flex-col justify-between hover:border-white/15 transition-colors card-highlight"
            >
              <div className="text-right font-mono text-[26px] font-semibold text-cyan leading-none tabular-nums">
                {statValues[idx]}
              </div>
              <div className="text-[9px] font-medium tracking-[0.14em] text-text-3 uppercase leading-tight">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Tiny Footer */}
      <div className="absolute bottom-6 left-8 text-[10px] font-mono text-text-4 tracking-wider">
        v2.4.1 · Build 8f3c2a1
      </div>
    </motion.div>
  );
};
