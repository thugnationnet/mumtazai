import React, { useState } from 'react';

interface Props {
  onClose?: () => void;
  onRunTool?: (msg: string) => void;
  onPreviewContent?: (c: any) => void;
}

const SalesCrmPanel: React.FC<Props> = ({ onClose, onRunTool }) => {
  const [activeTab, setActiveTab] = useState<'leads' | 'pipeline' | 'deals' | 'customers' | 'proposals'>('leads');

  const runTool = (tool: string, desc: string) => onRunTool?.(`Use the ${tool} tool: ${desc}`);

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-300 dark:border-slate-700">
        <h2 className="text-sm font-semibold flex items-center gap-2">🤝 Sales & CRM</h2>
        <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-lg">&times;</button>
      </div>
      <div className="flex border-b border-slate-300 dark:border-slate-700 overflow-x-auto">
        {([['leads', '👤'], ['pipeline', '📊'], ['deals', '💼'], ['customers', '🏢'], ['proposals', '📄']] as const).map(([tab, icon]) => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-2 text-xs font-medium whitespace-nowrap px-2 ${activeTab === tab ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
            {icon}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeTab === 'leads' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Track and score leads.</p>
            <button onClick={() => runTool('lead_track', 'Create a new lead (action: create)')} className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium">+ Add Lead</button>
            <button onClick={() => runTool('lead_track', 'List all leads (action: list)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📋 List Leads</button>
            <button onClick={() => runTool('lead_track', 'Score a lead (action: score)')} className="w-full py-2 bg-purple-600/20 hover:bg-purple-600/30 rounded text-sm border border-purple-500/30 text-purple-300">⭐ Score Lead</button>
          </>
        )}
        {activeTab === 'pipeline' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Manage sales pipeline stages.</p>
            <button onClick={() => runTool('pipeline_manage', 'Create a new pipeline (action: create)')} className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm font-medium">+ New Pipeline</button>
            <button onClick={() => runTool('pipeline_manage', 'View pipeline overview (action: overview)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📊 Overview</button>
          </>
        )}
        {activeTab === 'deals' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Forecast deal outcomes and revenue.</p>
            <button onClick={() => runTool('deal_forecast', 'Create a deal forecast (action: forecast)')} className="w-full py-2 bg-yellow-600 hover:bg-yellow-500 rounded text-sm font-medium">📊 Forecast</button>
            <button onClick={() => runTool('deal_forecast', 'List all deals (action: list)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📋 List Deals</button>
          </>
        )}
        {activeTab === 'customers' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Manage customer profiles.</p>
            <button onClick={() => runTool('customer_profile', 'Create a customer profile (action: create)')} className="w-full py-2 bg-teal-600 hover:bg-teal-500 rounded text-sm font-medium">+ New Customer</button>
            <button onClick={() => runTool('customer_profile', 'List all customers (action: list)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📋 List Customers</button>
            <button onClick={() => runTool('sales_report', 'Generate a sales report (action: generate)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📈 Sales Report</button>
          </>
        )}
        {activeTab === 'proposals' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Generate proposals and contracts.</p>
            <button onClick={() => runTool('proposal_generate', 'Generate a business proposal (action: generate)')} className="w-full py-2 bg-orange-600 hover:bg-orange-500 rounded text-sm font-medium">📄 Generate Proposal</button>
            <button onClick={() => runTool('contract_draft', 'Draft a contract (action: draft)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📝 Draft Contract</button>
          </>
        )}
      </div>
    </div>
  );
};

export default SalesCrmPanel;
