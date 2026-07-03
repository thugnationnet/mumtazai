import React, { useState } from 'react';

interface Props {
  onClose?: () => void;
  onRunTool?: (msg: string) => void;
  onPreviewContent?: (c: any) => void;
}

const BusinessGrowthPanel: React.FC<Props> = ({ onClose, onRunTool }) => {
  const [activeTab, setActiveTab] = useState<'funnel' | 'pricing' | 'ab' | 'leads' | 'campaigns'>('funnel');

  const runTool = (tool: string, desc: string) => onRunTool?.(`Use the ${tool} tool: ${desc}`);

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-300 dark:border-slate-700">
        <h2 className="text-sm font-semibold flex items-center gap-2">📈 Business & Growth</h2>
        <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-lg">&times;</button>
      </div>
      <div className="flex border-b border-slate-300 dark:border-slate-700 overflow-x-auto">
        {([['funnel', '📊'], ['pricing', '💰'], ['ab', '🧪'], ['leads', '👥'], ['campaigns', '📣']] as const).map(([tab, icon]) => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-2 text-xs font-medium whitespace-nowrap px-2 ${activeTab === tab ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
            {icon}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeTab === 'funnel' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Analyze growth funnels, churn, and conversions.</p>
            <button onClick={() => runTool('growth_analyze', 'Create a new growth funnel (operation: create_funnel)')} className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm font-medium">+ New Funnel</button>
            <button onClick={() => runTool('growth_analyze', 'List all growth funnels (operation: list)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📋 List Funnels</button>
          </>
        )}
        {activeTab === 'pricing' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Simulate pricing models and revenue projections.</p>
            <button onClick={() => runTool('pricing_simulate', 'Create a new pricing simulation (operation: create)')} className="w-full py-2 bg-yellow-600 hover:bg-yellow-500 rounded text-sm font-medium">+ New Simulation</button>
            <button onClick={() => runTool('pricing_simulate', 'Run 12-month revenue projection for the latest simulation (operation: simulate)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📊 Run Projection</button>
          </>
        )}
        {activeTab === 'ab' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Run and analyze A/B test experiments.</p>
            <button onClick={() => runTool('ab_test_run', 'Create a new A/B test experiment (operation: create)')} className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium">+ New Test</button>
            <button onClick={() => runTool('ab_test_run', 'List all A/B tests (operation: list)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📋 List Tests</button>
            <button onClick={() => runTool('ab_test_analyze', 'Analyze the latest A/B test results with 95% confidence')} className="w-full py-2 bg-purple-600/20 hover:bg-purple-600/30 rounded text-sm border border-purple-500/30 text-purple-300">📊 Analyze Results</button>
          </>
        )}
        {activeTab === 'leads' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Manage and score sales leads.</p>
            <button onClick={() => runTool('lead_enrich', 'Create a new lead (operation: create)')} className="w-full py-2 bg-orange-600 hover:bg-orange-500 rounded text-sm font-medium">+ Add Lead</button>
            <button onClick={() => runTool('lead_enrich', 'List all leads sorted by score (operation: list)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📋 List Leads</button>
            <button onClick={() => runTool('lead_enrich', 'Search for leads (operation: search)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">🔍 Search</button>
          </>
        )}
        {activeTab === 'campaigns' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Generate and manage marketing campaigns.</p>
            <button onClick={() => runTool('campaign_generate', 'Create a new email campaign (operation: create, type: email)')} className="w-full py-2 bg-pink-600 hover:bg-pink-500 rounded text-sm font-medium">+ New Campaign</button>
            <button onClick={() => runTool('campaign_generate', 'List all campaigns (operation: list)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📋 List Campaigns</button>
          </>
        )}
      </div>
    </div>
  );
};

export default BusinessGrowthPanel;
