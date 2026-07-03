import React, { useState } from 'react';

interface Props {
  onClose?: () => void;
  onRunTool?: (msg: string) => void;
  onPreviewContent?: (c: any) => void;
}

const CloudPanel: React.FC<Props> = ({ onClose, onRunTool }) => {
  const [activeTab, setActiveTab] = useState<'deploy' | 'scale' | 'logs' | 'cost'>('deploy');

  const runTool = (tool: string, desc: string) => onRunTool?.(`Use the ${tool} tool: ${desc}`);

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-300 dark:border-slate-700">
        <h2 className="text-sm font-semibold flex items-center gap-2">☁️ Cloud Control</h2>
        <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-lg">&times;</button>
      </div>
      <div className="flex border-b border-slate-300 dark:border-slate-700">
        {([['deploy', '🚀'], ['scale', '📊'], ['logs', '📝'], ['cost', '💰']] as const).map(([tab, icon]) => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-2 text-xs font-medium ${activeTab === tab ? 'text-sky-400 border-b-2 border-sky-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
            {icon}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeTab === 'deploy' && (
          <>
            <button onClick={() => runTool('cloud_deploy', 'Create a new deployment (operation: create)')} className="w-full py-2 bg-sky-600 hover:bg-sky-500 rounded text-sm font-medium">+ New Deployment</button>
            <button onClick={() => runTool('cloud_deploy', 'List all deployments (operation: list)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📋 List Deployments</button>
            <button onClick={() => runTool('cloud_secrets', 'List secrets for the latest deployment (operation: list)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">🔐 Manage Secrets</button>
          </>
        )}
        {activeTab === 'scale' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Auto-scaling policies and configuration.</p>
            <button onClick={() => runTool('cloud_scale', 'Configure auto-scaling: min 1, max 10, target CPU 70% (operation: configure)')} className="w-full py-2 bg-sky-600 hover:bg-sky-500 rounded text-sm font-medium">⚙️ Configure Scaling</button>
            <button onClick={() => runTool('cloud_scale', 'List all scaling configs (operation: list)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📋 List Configs</button>
          </>
        )}
        {activeTab === 'logs' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Search and analyze deployment logs.</p>
            <button onClick={() => runTool('cloud_logs', 'Show recent logs (operation: tail)')} className="w-full py-2 bg-sky-600 hover:bg-sky-500 rounded text-sm font-medium">📝 Tail Logs</button>
            <button onClick={() => runTool('cloud_logs', 'Show error-level logs only (operation: search, level: error)')} className="w-full py-2 bg-red-600/20 hover:bg-red-600/30 rounded text-sm border border-red-500/30 text-red-300">❌ Errors Only</button>
            <button onClick={() => runTool('cloud_logs', 'Show log statistics (operation: stats)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📊 Log Stats</button>
          </>
        )}
        {activeTab === 'cost' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Cloud cost analysis and forecasting.</p>
            <button onClick={() => runTool('cloud_cost', 'Analyze current cloud costs (operation: analyze)')} className="w-full py-2 bg-green-600 hover:bg-green-500 rounded text-sm font-medium">💰 Analyze Costs</button>
            <button onClick={() => runTool('cloud_cost', 'Forecast cloud costs for next 3 months (operation: forecast)')} className="w-full py-2 bg-yellow-600/20 hover:bg-yellow-600/30 rounded text-sm border border-yellow-500/30 text-yellow-300">📈 Forecast</button>
            <button onClick={() => runTool('cloud_cost', 'List cost reports (operation: list)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📋 Reports</button>
          </>
        )}
      </div>
    </div>
  );
};

export default CloudPanel;
