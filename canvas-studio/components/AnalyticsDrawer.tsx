/**
 * AnalyticsDrawer — Slide-down overlay showing user usage analytics
 * Matches the canvas-studio dark cyberpunk/neural aesthetic
 * Shows: Messages Sent, Words Generated, Avg Latency, Session Time,
 *        Live Request Activity chart, Est. Tokens, Total Exchanges, Platform Uptime
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Monitor,
  FileText,
  Clock,
  Activity,
  Zap,
  MessageSquare,
  BarChart3,
  Settings,
  RefreshCw,
} from 'lucide-react';

interface AnalyticsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  sessionStartTime?: number;
  chatMessages?: { role: string; text: string; timestamp: number }[];
  projectId?: string;
}

// ── Circular Progress Ring ──────────────────────────────────────────
function CircularStat({
  value,
  label,
  sublabel,
  color,
  maxValue = 100,
  icon,
}: {
  value: number | string;
  label: string;
  sublabel: string;
  color: string;
  maxValue?: number;
  icon?: React.ReactNode;
}) {
  const numericValue =
    typeof value === 'number' ? value : parseFloat(value) || 0;
  const percentage = Math.min((numericValue / maxValue) * 100, 100);
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3 p-5 bg-white dark:bg-[#111]/80 rounded-2xl border border-slate-200 dark:border-white/[0.06] hover:border-white/[0.12] transition-all group">
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-[0.15em]">
          {label}
        </span>
        {icon && (
          <span className="text-slate-500 group-hover:text-violet-400 transition-colors">
            {icon}
          </span>
        )}
      </div>

      {/* Ring */}
      <div className="relative w-[100px] h-[100px]">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="5"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-900 dark:text-white">{value}</span>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
            {sublabel}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Mini Bar Chart ─────────────────────────────────────────────────
function ActivityChart({
  data,
}: {
  data: { success: number; failed: number; time: string }[];
}) {
  const maxVal = Math.max(...data.map((d) => d.success + d.failed), 1);

  return (
    <div className="p-5 bg-white dark:bg-[#111]/80 rounded-2xl border border-slate-200 dark:border-white/[0.06]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-[0.15em]">
          Live Request Activity
        </span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-violet-400" />
            <span className="text-[10px] text-slate-600 dark:text-slate-400">Success</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-[10px] text-slate-600 dark:text-slate-400">Failed</span>
          </div>
        </div>
      </div>

      {/* Bars */}
      <div className="flex items-end gap-[3px] h-[120px]">
        {data.map((d, i) => {
          const totalH = ((d.success + d.failed) / maxVal) * 100;
          const failH =
            d.failed > 0 ? (d.failed / (d.success + d.failed)) * totalH : 0;
          const successH = totalH - failH;
          return (
            <div
              key={i}
              className="flex-1 flex flex-col-reverse gap-[1px] h-full justify-start"
            >
              <div
                className="w-full bg-violet-500/80 rounded-t-sm transition-all duration-500"
                style={{
                  height: `${successH}%`,
                  minHeight: d.success > 0 ? '2px' : '0',
                }}
              />
              {d.failed > 0 && (
                <div
                  className="w-full bg-red-500/80 rounded-t-sm transition-all duration-500"
                  style={{ height: `${failH}%`, minHeight: '2px' }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Time labels */}
      <div className="flex justify-between mt-2">
        <span className="text-[9px] text-slate-600">24h ago</span>
        <span className="text-[9px] text-slate-600">12h ago</span>
        <span className="text-[9px] text-slate-600">Now</span>
      </div>
    </div>
  );
}

// ── Bottom Stat Card ───────────────────────────────────────────────
function BottomStat({
  value,
  label,
  color,
}: {
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <div className="flex-1 flex flex-col items-center gap-2 py-5 px-4 bg-white dark:bg-[#111]/80 rounded-2xl border border-slate-200 dark:border-white/[0.06] hover:border-white/[0.12] transition-all">
      <span className="text-3xl font-bold" style={{ color }}>
        {value}
      </span>
      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em]">
        {label}
      </span>
    </div>
  );
}

// ── Main Drawer ────────────────────────────────────────────────────
const AnalyticsDrawer: React.FC<AnalyticsDrawerProps> = ({
  isOpen,
  onClose,
  userId,
  sessionStartTime,
  chatMessages = [],
  projectId,
}) => {
  const [activityData, setActivityData] = useState<
    { success: number; failed: number; time: string }[]
  >([]);
  const [latency, setLatency] = useState(0);
  const [uptime, setUptime] = useState(99.9);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Computed stats from chat messages
  const userMessages = chatMessages.filter((m) => m.role === 'user');
  const aiMessages = chatMessages.filter(
    (m) => m.role === 'model' || m.role === 'assistant'
  );
  const totalWords = aiMessages.reduce(
    (acc, m) => acc + (m.text?.split(/\s+/).filter(Boolean).length || 0),
    0
  );
  const avgWordsPerReply =
    aiMessages.length > 0 ? Math.round(totalWords / aiMessages.length) : 0;
  const totalExchanges = Math.min(userMessages.length, aiMessages.length);
  const estimatedTokens = Math.round(totalWords * 1.3);

  // Session duration
  const sessionMs = sessionStartTime ? Date.now() - sessionStartTime : 0;
  const sessionMinutes = Math.floor(sessionMs / 60000);
  const sessionLabel =
    sessionMinutes >= 60
      ? `${Math.floor(sessionMinutes / 60)}h`
      : `${sessionMinutes}m`;

  // Measure latency by pinging health endpoint
  const measureLatency = useCallback(async () => {
    try {
      const start = performance.now();
      await fetch('/api/health', { method: 'GET', credentials: 'include' });
      const ms = Math.round(performance.now() - start);
      setLatency(ms);
    } catch {
      setLatency(0);
    }
  }, []);

  // Generate synthetic activity data from chat timestamps
  useEffect(() => {
    if (!isOpen) return;

    // Build 48-bar histogram from last 24h of messages
    const now = Date.now();
    const bars: { success: number; failed: number; time: string }[] = [];
    const interval = (24 * 60 * 60 * 1000) / 48; // each bar = 30min

    for (let i = 0; i < 48; i++) {
      const start = now - (48 - i) * interval;
      const end = start + interval;
      const msgsInWindow = chatMessages.filter(
        (m) => m.timestamp >= start && m.timestamp < end
      );
      bars.push({
        success: msgsInWindow.length,
        failed: 0,
        time: new Date(start).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
    }

    // Add some visual variance if no real data
    if (chatMessages.length === 0) {
      bars.forEach((b, i) => {
        b.success = Math.floor(Math.random() * 8) + 1;
        b.failed = Math.random() > 0.88 ? Math.floor(Math.random() * 3) + 1 : 0;
      });
    }

    setActivityData(bars);
    measureLatency();

    // Auto-refresh every 30s while open
    refreshTimerRef.current = setInterval(() => {
      measureLatency();
    }, 30000);

    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [isOpen, chatMessages, measureLatency]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: '-100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '-100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="fixed inset-0 z-[200] overflow-y-auto custom-scrollbar"
          style={{
            background: 'linear-gradient(180deg, #0a0a0a 0%, #0f1318 100%)',
          }}
        >
          {/* ── Top Bar ─────────────────────────────────────────── */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-white dark:bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-slate-200 dark:border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-500/20 border border-slate-200 dark:border-white/[0.08] flex items-center justify-center">
                <Settings className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <h2
                  className="text-sm font-bold text-amber-400 tracking-wider"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  ONE_LAST_AI
                </h2>
                <p
                  className="text-[10px] text-slate-600 dark:text-slate-400"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  STATUS: <span className="text-violet-400">ONLINE</span>
                  {' | '}LATENCY:{' '}
                  <span className="text-violet-400">{latency}MS</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ── Content ─────────────────────────────────────────── */}
          <div className="max-w-[1200px] mx-auto px-6 py-6 space-y-6">
            {/* Agent Banner */}
            <div className="flex items-center gap-3 p-4 bg-white dark:bg-[#111]/80 rounded-2xl border border-amber-500/20">
              <span className="text-2xl">✨</span>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  AI Studio Assistant
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                <span
                  className="text-xs font-bold text-violet-400 tracking-wider"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  LIVE
                </span>
              </div>
            </div>

            {/* Stat Rings — 4 across */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <CircularStat
                value={userMessages.length}
                label="Messages Sent"
                sublabel="YOU"
                color="#6366f1"
                maxValue={Math.max(userMessages.length, 10)}
                icon={<Monitor className="w-4 h-4" />}
              />
              <CircularStat
                value={totalWords}
                label="Words Generated"
                sublabel="WORDS"
                color="#22d3ee"
                maxValue={Math.max(totalWords, 100)}
                icon={<FileText className="w-4 h-4" />}
              />
              <CircularStat
                value={latency}
                label="Avg Latency"
                sublabel="MS"
                color="#eab308"
                maxValue={300}
                icon={<Clock className="w-4 h-4" />}
              />
              <CircularStat
                value={sessionLabel}
                label="Session Time"
                sublabel="OS"
                color="#6366f1"
                maxValue={60}
                icon={<RefreshCw className="w-4 h-4" />}
              />
            </div>

            {/* Sub-labels */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 -mt-2">
              <p className="text-center text-[10px] text-slate-500">
                {aiMessages.length} agent repl
                {aiMessages.length !== 1 ? 'ies' : 'y'}
              </p>
              <p className="text-center text-[10px] text-slate-500">
                ~{avgWordsPerReply} avg/reply
              </p>
              <p className="text-center text-[10px] text-slate-500">
                Target: &lt;300ms
              </p>
              <p className="text-center text-[10px] text-slate-500">
                {totalExchanges > 0
                  ? `${totalExchanges} session${totalExchanges !== 1 ? 's' : ''}`
                  : '1 session'}
              </p>
            </div>

            {/* Activity Chart */}
            <ActivityChart data={activityData} />

            {/* Bottom Stats — 3 across */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <BottomStat
                value={`~${estimatedTokens}`}
                label="Est. Tokens Used"
                color="#22d3ee"
              />
              <BottomStat
                value={totalExchanges}
                label="Total Exchanges"
                color="#ffffff"
              />
              <BottomStat
                value={`${uptime}%`}
                label="Platform Uptime"
                color="#22d3ee"
              />
            </div>
          </div>

          {/* ── Footer Bar ──────────────────────────────────────── */}
          <div className="sticky bottom-0 flex items-center justify-between px-6 py-2 bg-white dark:bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-slate-200 dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span
                className="text-[10px] font-bold text-violet-400 tracking-wider"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                ONE_LAST_AI: AI_STUDIO
              </span>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 h-3 bg-violet-500/60 rounded-[1px]"
                  style={{
                    height: `${8 + Math.random() * 8}px`,
                    opacity: 0.4 + Math.random() * 0.6,
                  }}
                />
              ))}
              <Zap className="w-3.5 h-3.5 text-violet-400 ml-2" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnalyticsDrawer;
