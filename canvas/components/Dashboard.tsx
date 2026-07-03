import React, { useState, useEffect } from 'react';
import { fetchWithCredentials } from '../fetchUtil';
import { useAuth } from '../contexts/AuthContext';

const scrollbarStyles = `
  .dashboard-scroll {
    overflow-y: auto !important;
    scrollbar-width: thin;
    scrollbar-color: rgba(34, 211, 238, 0.4) transparent;
  }
  .dashboard-scroll::-webkit-scrollbar { width: 8px; }
  .dashboard-scroll::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); border-radius: 4px; }
  .dashboard-scroll::-webkit-scrollbar-thumb { background: rgba(34, 211, 238, 0.4); border-radius: 4px; }
  .dashboard-scroll::-webkit-scrollbar-thumb:hover { background: rgba(34, 211, 238, 0.6); }
`;

interface UsageRecord {
  id: string;
  type: 'generation' | 'edit' | 'api_call' | 'chat';
  model: string;
  provider: string;
  credits: number;
  timestamp: number;
  description: string;
}

interface DashboardProps {
  isDarkMode: boolean;
  onClose: () => void;
}

const PROVIDER_COLORS: Record<string, { icon: string; color: string }> = {
  openai: { icon: '\U0001f916', color: '#10b981' },
  anthropic: { icon: '\U0001f9e0', color: '#ec4899' },
  gemini: { icon: '\u2728', color: '#3b82f6' },
  groq: { icon: '\u26a1', color: '#f59e0b' },
  mistral: { icon: '\U0001f30a', color: '#8b5cf6' },
  cerebras: { icon: '\U0001f680', color: '#ef4444' },
  cohere: { icon: '\U0001f517', color: '#06b6d4' },
  xai: { icon: '\U0001f52c', color: '#f97316' },
};

const TYPE_COLORS: Record<string, string> = {
  generation: '#22d3ee',
  edit: '#a78bfa',
  chat: '#34d399',
  api_call: '#fbbf24',
};

type DashboardTab = 'overview' | 'usage' | 'subscription';

const TABS: { id: DashboardTab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: '\U0001f4c8' },
  { id: 'usage', label: 'Usage', icon: '\u26a1' },
  { id: 'subscription', label: 'Plan', icon: '\u2728' },
];

const Dashboard: React.FC<DashboardProps> = ({ isDarkMode, onClose }) => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [usageHistory, setUsageHistory] = useState<UsageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsage();
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  const fetchUsage = async () => {
    setIsLoading(true);
    try {
      const res = await fetchWithCredentials('/api/billing/usage');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.usage) setUsageHistory(data.usage);
      }
    } catch { /* noop */ }
    setIsLoading(false);
  };

  const totalRequests = usageHistory.length;
  const todayRequests = usageHistory.filter(u => Date.now() - u.timestamp < 86400000).length;
  const weekRequests = usageHistory.filter(u => Date.now() - u.timestamp < 7 * 86400000).length;
  const generationCount = usageHistory.filter(u => u.type === 'generation').length;
  const editCount = usageHistory.filter(u => u.type === 'edit').length;
  const chatCount = usageHistory.filter(u => u.type === 'chat').length;
  const apiCallCount = usageHistory.filter(u => u.type === 'api_call').length;
  const pct = (v: number, t: number) => t > 0 ? (v / t) * 100 : 0;

  const providerBreakdown = Object.entries(
    usageHistory.reduce((acc, u) => {
      const key = (u.provider || 'unknown').toLowerCase();
      if (!acc[key]) acc[key] = 0;
      acc[key]++;
      return acc;
    }, {} as Record<string, number>)
  ).map(([provider, requests]) => ({
    provider, requests,
    ...(PROVIDER_COLORS[provider] || { icon: '?', color: '#6b7280' }),
  })).sort((a, b) => b.requests - a.requests);

  const modelBreakdown = Object.entries(
    usageHistory.reduce((acc, u) => {
      if (!acc[u.model]) acc[u.model] = { requests: 0, provider: u.provider };
      acc[u.model].requests++;
      return acc;
    }, {} as Record<string, { requests: number; provider: string }>)
  ).map(([model, data]) => ({
    model, provider: data.provider, requests: data.requests,
    color: PROVIDER_COLORS[(data.provider || '').toLowerCase()]?.color || '#6b7280',
  })).sort((a, b) => b.requests - a.requests);

  const typeIcon = (type: string) => {
    const m: Record<string, string> = { generation: '\U0001f680', edit: '\u270f\ufe0f', api_call: '\u26a1', chat: '\U0001f4ac' };
    return m[type] || '\U0001f4ca';
  };

  const fmtTime = (ts: number) => {
    const h = Math.floor((Date.now() - ts) / 3600000);
    const d = Math.floor((Date.now() - ts) / 86400000);
    if (h < 1) return 'Just now';
    if (h < 24) return `${h}h ago`;
    if (d < 7) return `${d}d ago`;
    return new Date(ts).toLocaleDateString();
  };

  if (isLoading || authLoading) {
    return (
      <div className={`flex flex-col items-center justify-center h-full ${isDarkMode ? 'bg-white dark:bg-[#111]/95' : 'bg-white'}`}>
        <div className="w-10 h-10 border-3 border-cyan-900 border-t-cyan-400 rounded-full animate-spin mb-4" />
        <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-slate-500 dark:text-slate-400'}`}>Loading dashboard...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={`flex flex-col items-center justify-center h-full ${isDarkMode ? 'bg-white dark:bg-[#111]/95' : 'bg-white'} p-6`}>
        <div className={`w-16 h-16 rounded-2xl ${isDarkMode ? 'bg-cyan-500/10 border border-indigo-500/20' : 'bg-cyan-50 border border-cyan-200'} flex items-center justify-center mb-4`}>
          <span className="text-3xl">\U0001f3a8</span>
        </div>
        <h3 className={`text-base font-bold mb-2 ${isDarkMode ? 'text-slate-900 dark:text-white' : 'text-gray-900'}`}>Welcome to Canvas Build</h3>
        <p className={`text-xs text-center mb-6 max-w-xs ${isDarkMode ? 'text-slate-500 dark:text-slate-400' : 'text-gray-500'}`}>
          Sign in to access your dashboard and track usage analytics.
        </p>
        <div className="flex flex-col gap-2 w-full max-w-[200px]">
          <a href="https://mumtaz.ai/auth/login" className={`w-full py-2.5 text-xs font-bold rounded-lg text-center transition-all ${isDarkMode ? 'bg-cyan-500 hover:bg-cyan-400 text-black' : 'bg-cyan-600 hover:bg-cyan-700 text-slate-900 dark:text-white'}`}>Sign In</a>
          <a href="https://mumtaz.ai/auth/signup" className={`w-full py-2.5 text-xs font-bold rounded-lg text-center border transition-all ${isDarkMode ? 'border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-cyan-500/10' : 'border-cyan-300 text-cyan-700 hover:bg-cyan-50'}`}>Create Account</a>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${isDarkMode ? 'bg-white dark:bg-[#111]/95' : 'bg-white'}`} style={{ height: '100%', maxHeight: '100%', overflow: 'hidden' }}>
      <style>{scrollbarStyles}</style>

      {/* Header */}
      <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-slate-200 dark:border-slate-800/50' : 'border-gray-200'} flex items-center justify-between shrink-0`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-indigo-500/30' : 'bg-cyan-100'}`}>
            <span className="text-lg">\U0001f4ca</span>
          </div>
          <div>
            <h3 className={`text-xs font-bold ${isDarkMode ? 'text-indigo-600 dark:text-indigo-400' : 'text-cyan-600'} uppercase tracking-widest`}>Dashboard</h3>
            <p className={`text-[9px] ${isDarkMode ? 'text-gray-600' : 'text-slate-500 dark:text-slate-400'} uppercase tracking-wider`}>
              {user?.email || 'Canvas Analytics'}
            </p>
          </div>
        </div>
        <button onClick={onClose} className={`p-2 rounded-lg ${isDarkMode ? 'text-gray-600 hover:text-indigo-600 dark:text-indigo-400 hover:bg-cyan-500/10' : 'text-slate-500 dark:text-slate-400 hover:text-cyan-600 hover:bg-cyan-50'} transition-all`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className={`border-b ${isDarkMode ? 'border-slate-200 dark:border-slate-800/50' : 'border-gray-200'} shrink-0`}>
        <div className="flex gap-1 px-3 py-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg whitespace-nowrap transition-all text-[10px] font-bold uppercase tracking-wider ${activeTab === tab.id
                ? isDarkMode ? 'bg-cyan-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30' : 'bg-cyan-100 text-cyan-700 border border-cyan-300'
                : isDarkMode ? 'text-gray-500 hover:text-indigo-600 dark:text-indigo-400 hover:bg-cyan-500/10 border border-transparent' : 'text-gray-500 hover:text-cyan-600 hover:bg-cyan-50 border border-transparent'
              }`}>
              <span className="text-sm">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto dashboard-scroll" style={{ minHeight: 0 }}>
        <div className="p-4 space-y-4 pb-8">

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <>
              <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gradient-to-br from-cyan-900/20 to-emerald-900/20 border-indigo-500/30' : 'bg-gradient-to-br from-cyan-50 to-emerald-50 border-cyan-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[9px] font-bold ${isDarkMode ? 'text-indigo-600 dark:text-indigo-400/60' : 'text-cyan-600'} uppercase tracking-widest`}>Subscription</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-bold text-emerald-400 uppercase">Active</span>
                  </div>
                </div>
                <div className="flex items-end gap-2 mb-1">
                  <span className={`text-3xl font-black ${isDarkMode ? 'text-indigo-600 dark:text-indigo-400' : 'text-cyan-600'}`}>{totalRequests}</span>
                  <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-slate-500 dark:text-slate-400'} mb-1`}>total requests</span>
                </div>
                <p className={`text-[9px] ${isDarkMode ? 'text-gray-600' : 'text-slate-500 dark:text-slate-400'}`}>Included with your Mumtaz AI plan</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Today', value: todayRequests, icon: '\U0001f4c5' },
                  { label: 'This Week', value: weekRequests, icon: '\U0001f4c6' },
                  { label: 'Generations', value: generationCount, icon: '\U0001f680' },
                  { label: 'AI Chats', value: chatCount + apiCallCount, icon: '\U0001f4ac' },
                ].map(s => (
                  <div key={s.label} className={`p-3 rounded-lg border ${isDarkMode ? 'bg-black/30 border-slate-200 dark:border-slate-800' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm">{s.icon}</span>
                      <span className={`text-[8px] font-bold ${isDarkMode ? 'text-gray-600' : 'text-slate-500 dark:text-slate-400'} uppercase tracking-wider`}>{s.label}</span>
                    </div>
                    <div className={`text-lg font-bold ${isDarkMode ? 'text-slate-900 dark:text-white' : 'text-gray-800'}`}>{s.value}</div>
                  </div>
                ))}
              </div>

              {usageHistory.length > 0 && (
                <div>
                  <h4 className={`text-[9px] font-bold ${isDarkMode ? 'text-gray-500' : 'text-slate-500 dark:text-slate-400'} uppercase tracking-widest mb-2`}>Recent Activity</h4>
                  <div className="space-y-2">
                    {usageHistory.slice(0, 5).map(r => (
                      <div key={r.id} className={`p-3 rounded-lg border ${isDarkMode ? 'bg-black/30 border-slate-200 dark:border-slate-800' : 'bg-gray-50 border-gray-200'} flex items-center gap-2`}>
                        <span className="text-base">{typeIcon(r.type)}</span>
                        <div className="flex-1 min-w-0">
                          <div className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-700 dark:text-slate-300' : 'text-gray-700'} truncate`}>{r.description}</div>
                          <div className={`text-[8px] ${isDarkMode ? 'text-gray-600' : 'text-slate-500 dark:text-slate-400'}`}>{r.model} \u00b7 {fmtTime(r.timestamp)}</div>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase" style={{
                          color: TYPE_COLORS[r.type] || '#9ca3af',
                          backgroundColor: (TYPE_COLORS[r.type] || '#6b7280') + '20',
                        }}>{r.type.replace('_', ' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {usageHistory.length === 0 && (
                <div className={`p-6 text-center ${isDarkMode ? 'text-gray-600' : 'text-slate-500 dark:text-slate-400'}`}>
                  <span className="text-3xl block mb-2">\U0001f3a8</span>
                  <p className="text-xs">No activity yet \u2014 start building!</p>
                </div>
              )}
            </>
          )}

          {/* USAGE TAB */}
          {activeTab === 'usage' && (
            <>
              <div>
                <h4 className={`text-[9px] font-bold ${isDarkMode ? 'text-gray-500' : 'text-slate-500 dark:text-slate-400'} uppercase tracking-widest mb-2`}>By Type</h4>
                <div className="space-y-2">
                  {[
                    { type: 'generation', label: 'Generations', icon: '\U0001f680', count: generationCount },
                    { type: 'edit', label: 'Edits', icon: '\u270f\ufe0f', count: editCount },
                    { type: 'chat', label: 'Chats', icon: '\U0001f4ac', count: chatCount },
                    { type: 'api_call', label: 'API Calls', icon: '\u26a1', count: apiCallCount },
                  ].filter(t => t.count > 0).map(t => (
                    <div key={t.type} className={`p-3 rounded-lg border ${isDarkMode ? 'bg-black/30 border-slate-200 dark:border-slate-800' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{t.icon}</span>
                          <span className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-700 dark:text-slate-300' : 'text-gray-700'}`}>{t.label}</span>
                        </div>
                        <span className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-900 dark:text-white' : 'text-gray-800'}`}>{t.count}</span>
                      </div>
                      <div className={`h-1.5 rounded-full ${isDarkMode ? 'bg-white dark:bg-slate-800' : 'bg-gray-200'} overflow-hidden`}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct(t.count, totalRequests)}%`, backgroundColor: TYPE_COLORS[t.type] }} />
                      </div>
                      <div className={`text-[8px] mt-1 ${isDarkMode ? 'text-gray-600' : 'text-slate-500 dark:text-slate-400'}`}>{pct(t.count, totalRequests).toFixed(0)}% of total</div>
                    </div>
                  ))}
                  {totalRequests === 0 && (
                    <div className={`p-4 text-center ${isDarkMode ? 'text-gray-600' : 'text-slate-500 dark:text-slate-400'} text-xs`}>No usage data yet</div>
                  )}
                </div>
              </div>

              {providerBreakdown.length > 0 && (
                <div>
                  <h4 className={`text-[9px] font-bold ${isDarkMode ? 'text-gray-500' : 'text-slate-500 dark:text-slate-400'} uppercase tracking-widest mb-2`}>By Provider</h4>
                  <div className="space-y-2">
                    {providerBreakdown.map(p => (
                      <div key={p.provider} className={`p-3 rounded-lg border ${isDarkMode ? 'bg-black/30 border-slate-200 dark:border-slate-800' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{p.icon}</span>
                            <span className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-700 dark:text-slate-300' : 'text-gray-700'} capitalize`}>{p.provider}</span>
                          </div>
                          <span className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-slate-500 dark:text-slate-400'}`}>{p.requests} ({pct(p.requests, totalRequests).toFixed(0)}%)</span>
                        </div>
                        <div className={`h-1.5 rounded-full ${isDarkMode ? 'bg-white dark:bg-slate-800' : 'bg-gray-200'} overflow-hidden`}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct(p.requests, totalRequests)}%`, backgroundColor: p.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {modelBreakdown.length > 0 && (
                <div>
                  <h4 className={`text-[9px] font-bold ${isDarkMode ? 'text-gray-500' : 'text-slate-500 dark:text-slate-400'} uppercase tracking-widest mb-2`}>By Model</h4>
                  <div className="space-y-2">
                    {modelBreakdown.slice(0, 6).map(m => (
                      <div key={m.model} className={`p-3 rounded-lg border ${isDarkMode ? 'bg-black/30 border-slate-200 dark:border-slate-800' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: m.color }} />
                            <span className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-700 dark:text-slate-300' : 'text-gray-700'}`}>{m.model}</span>
                          </div>
                          <span className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-slate-500 dark:text-slate-400'}`}>{m.requests} ({pct(m.requests, totalRequests).toFixed(0)}%)</span>
                        </div>
                        <div className={`h-1.5 rounded-full ${isDarkMode ? 'bg-white dark:bg-slate-800' : 'bg-gray-200'} overflow-hidden`}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct(m.requests, totalRequests)}%`, backgroundColor: m.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* SUBSCRIPTION TAB */}
          {activeTab === 'subscription' && (
            <>
              <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gradient-to-br from-cyan-900/20 to-emerald-900/20 border-indigo-500/30' : 'bg-gradient-to-br from-cyan-50 to-emerald-50 border-cyan-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">\u2728</span>
                    <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-900 dark:text-white' : 'text-gray-900'}`}>Canvas Build</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-bold text-emerald-400 uppercase">Active</span>
                  </div>
                </div>
                <p className={`text-[9px] ${isDarkMode ? 'text-gray-500' : 'text-slate-500 dark:text-slate-400'}`}>Included with your Mumtaz AI plan</p>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {[{ l: 'Models', v: '7+' }, { l: 'Builds', v: '\u221e' }, { l: 'Projects', v: '\u221e' }].map(c => (
                    <div key={c.l} className={`p-2 rounded-lg text-center ${isDarkMode ? 'bg-black/30 border border-slate-200 dark:border-slate-800' : 'bg-white border border-gray-200'}`}>
                      <div className={`text-lg font-bold ${isDarkMode ? 'text-slate-900 dark:text-white' : 'text-gray-800'}`}>{c.v}</div>
                      <div className={`text-[8px] ${isDarkMode ? 'text-gray-600' : 'text-slate-500 dark:text-slate-400'} uppercase tracking-wider`}>{c.l}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className={`text-[9px] font-bold ${isDarkMode ? 'text-gray-500' : 'text-slate-500 dark:text-slate-400'} uppercase tracking-widest mb-2`}>What's Included</h4>
                <div className="space-y-1.5">
                  {[
                    { icon: '\U0001f680', text: 'AI App Generation' },
                    { icon: '\u270f\ufe0f', text: 'AI Edits & Iteration' },
                    { icon: '\U0001f4ac', text: 'AI Chat Assistant' },
                    { icon: '\U0001f3a8', text: 'Live Preview' },
                    { icon: '\U0001f4e6', text: 'Project Management' },
                    { icon: '\U0001f310', text: 'Deploy & Host' },
                    { icon: '\U0001f9e0', text: '7+ AI Providers' },
                    { icon: '\U0001f4ca', text: 'Usage Analytics' },
                  ].map(f => (
                    <div key={f.text} className={`flex items-center gap-2 p-2 rounded-lg ${isDarkMode ? 'bg-slate-200 dark:bg-black/20' : 'bg-gray-50'}`}>
                      <span className="text-sm">{f.icon}</span>
                      <span className={`text-[10px] ${isDarkMode ? 'text-slate-500 dark:text-slate-400' : 'text-gray-600'}`}>{f.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <a href="https://mumtaz.ai/dashboard/overview"
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${isDarkMode ? 'border-indigo-500/30 hover:border-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/10' : 'border-cyan-200 hover:border-cyan-400 bg-cyan-50 hover:bg-cyan-100'}`}>
                  <span className="text-lg">\U0001f4cb</span>
                  <div>
                    <div className={`text-[10px] font-bold ${isDarkMode ? 'text-indigo-600 dark:text-indigo-400' : 'text-cyan-600'}`}>Go to Dashboard</div>
                    <div className={`text-[8px] ${isDarkMode ? 'text-gray-600' : 'text-slate-500 dark:text-slate-400'}`}>Manage plan & account</div>
                  </div>
                </a>
                <a href="https://mumtaz.ai/overview"
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${isDarkMode ? 'border-slate-200 dark:border-slate-800 hover:border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10' : 'border-gray-200 hover:border-emerald-300 bg-emerald-50 hover:bg-emerald-100'}`}>
                  <span className="text-lg">\U0001f680</span>
                  <div>
                    <div className={`text-[10px] font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>View Plans</div>
                    <div className={`text-[8px] ${isDarkMode ? 'text-gray-600' : 'text-slate-500 dark:text-slate-400'}`}>Compare & upgrade</div>
                  </div>
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
