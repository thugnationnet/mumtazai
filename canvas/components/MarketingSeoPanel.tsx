import React, { useState } from 'react';

interface Props {
  onClose?: () => void;
  onRunTool?: (msg: string) => void;
  onPreviewContent?: (c: any) => void;
}

const MarketingSeoPanel: React.FC<Props> = ({ onClose, onRunTool }) => {
  const [activeTab, setActiveTab] = useState<'seo' | 'keywords' | 'social' | 'campaigns' | 'content'>('seo');

  const runTool = (tool: string, desc: string) => onRunTool?.(`Use the ${tool} tool: ${desc}`);

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-300 dark:border-slate-700">
        <h2 className="text-sm font-semibold flex items-center gap-2">📈 Marketing & SEO</h2>
        <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-lg">&times;</button>
      </div>
      <div className="flex border-b border-slate-300 dark:border-slate-700 overflow-x-auto">
        {([['seo', '🔍'], ['keywords', '🔑'], ['social', '📱'], ['campaigns', '📣'], ['content', '📅']] as const).map(([tab, icon]) => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-2 text-xs font-medium whitespace-nowrap px-2 ${activeTab === tab ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
            {icon}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeTab === 'seo' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Run SEO audits and analyze site performance.</p>
            <button onClick={() => runTool('seo_audit', 'Run full SEO audit (action: audit)')} className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm font-medium">🔍 Full Audit</button>
            <button onClick={() => runTool('seo_audit', 'Check meta tags (action: meta)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">🏷️ Meta Tags</button>
            <button onClick={() => runTool('seo_audit', 'Check structured data (action: structured_data)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📋 Structured Data</button>
          </>
        )}
        {activeTab === 'keywords' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Research keywords, volume, and difficulty.</p>
            <button onClick={() => runTool('keyword_research', 'Research keywords (action: research)')} className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium">🔑 Research</button>
            <button onClick={() => runTool('keyword_research', 'Get keyword suggestions (action: suggest)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">💡 Suggestions</button>
            <button onClick={() => runTool('keyword_research', 'Find long-tail keywords (action: long_tail)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">🔗 Long-Tail</button>
          </>
        )}
        {activeTab === 'social' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Create and schedule social media posts.</p>
            <button onClick={() => runTool('social_post', 'Create a social media post (action: create)')} className="w-full py-2 bg-pink-600 hover:bg-pink-500 rounded text-sm font-medium">+ Create Post</button>
            <button onClick={() => runTool('social_post', 'Schedule a post (action: schedule)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📅 Schedule</button>
            <button onClick={() => runTool('social_post', 'Get trending hashtags (action: hashtags)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700"># Hashtags</button>
            <button onClick={() => runTool('brand_monitor', 'Monitor brand mentions (action: monitor)')} className="w-full py-2 bg-purple-600/20 hover:bg-purple-600/30 rounded text-sm border border-purple-500/30 text-purple-300">👁️ Brand Monitor</button>
          </>
        )}
        {activeTab === 'campaigns' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Track campaigns and run A/B tests.</p>
            <button onClick={() => runTool('campaign_track', 'Create a marketing campaign (action: create)')} className="w-full py-2 bg-orange-600 hover:bg-orange-500 rounded text-sm font-medium">+ New Campaign</button>
            <button onClick={() => runTool('campaign_track', 'Calculate ROI (action: roi)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📊 ROI Analysis</button>
            <button onClick={() => runTool('ab_test', 'Create an A/B test (action: create)')} className="w-full py-2 bg-yellow-600 hover:bg-yellow-500 rounded text-sm font-medium">🧪 A/B Test</button>
            <button onClick={() => runTool('ab_test', 'Analyze A/B test results (action: analyze)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📈 Analyze Results</button>
          </>
        )}
        {activeTab === 'content' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Plan and schedule content with calendars.</p>
            <button onClick={() => runTool('content_calendar', 'Create a content calendar (action: create)')} className="w-full py-2 bg-teal-600 hover:bg-teal-500 rounded text-sm font-medium">+ New Calendar</button>
            <button onClick={() => runTool('content_calendar', 'Add an entry to content calendar (action: add)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">+ Add Entry</button>
            <button onClick={() => runTool('content_calendar', 'List content calendars (action: list)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📋 List Calendars</button>
          </>
        )}
      </div>
    </div>
  );
};

export default MarketingSeoPanel;
