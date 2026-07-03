import React, { useState } from 'react';

interface Props {
  onClose?: () => void;
  onRunTool?: (msg: string) => void;
  onPreviewContent?: (c: any) => void;
}

const WorkflowPanel: React.FC<Props> = ({ onClose, onRunTool }) => {
  const [name, setName] = useState('');
  const [steps, setSteps] = useState('');
  const [activeTab, setActiveTab] = useState<'create' | 'list' | 'schedule'>('create');

  const runTool = (tool: string, desc: string) => {
    onRunTool?.(`Use the ${tool} tool: ${desc}`);
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-300 dark:border-slate-700">
        <h2 className="text-sm font-semibold flex items-center gap-2">⚡ Workflows</h2>
        <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-lg">&times;</button>
      </div>
      <div className="flex border-b border-slate-300 dark:border-slate-700">
        {(['create', 'list', 'schedule'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 text-xs font-medium ${activeTab === tab ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-cyan-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
            {tab === 'create' ? '+ Create' : tab === 'list' ? '📋 List' : '🕐 Schedule'}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeTab === 'create' && (
          <>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Workflow name..." className="w-full bg-white dark:bg-slate-800 rounded px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 focus:border-indigo-500 outline-none" />
            <textarea value={steps} onChange={e => setSteps(e.target.value)} placeholder="Describe workflow steps (one per line)..." rows={4} className="w-full bg-white dark:bg-slate-800 rounded px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 focus:border-indigo-500 outline-none resize-none" />
            <button onClick={() => runTool('workflow_create', `Create a workflow named "${name}" with steps: ${steps}`)} className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-sm font-medium">Create Workflow</button>
          </>
        )}
        {activeTab === 'list' && (
          <>
            <button onClick={() => runTool('workflow_create', 'List all my workflows (operation: list)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">Load Workflows</button>
            <button onClick={() => runTool('workflow_visualize', 'Visualize the latest workflow as a mermaid diagram')} className="w-full py-2 bg-purple-600/20 hover:bg-purple-600/30 rounded text-sm border border-purple-500/30 text-purple-300">📊 Visualize</button>
            <button onClick={() => runTool('workflow_optimize', 'Analyze and optimize the latest workflow')} className="w-full py-2 bg-green-600/20 hover:bg-green-600/30 rounded text-sm border border-violet-500/30 text-green-300">🔧 Optimize</button>
          </>
        )}
        {activeTab === 'schedule' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Schedule a workflow to run automatically at set intervals.</p>
            <button onClick={() => runTool('workflow_schedule', 'Schedule the latest workflow to run every hour')} className="w-full py-2 bg-orange-600/20 hover:bg-orange-600/30 rounded text-sm border border-orange-500/30 text-orange-300">⏰ Schedule Hourly</button>
            <button onClick={() => runTool('workflow_schedule', 'Schedule the latest workflow to run daily at midnight')} className="w-full py-2 bg-orange-600/20 hover:bg-orange-600/30 rounded text-sm border border-orange-500/30 text-orange-300">📅 Schedule Daily</button>
          </>
        )}
      </div>
    </div>
  );
};

export default WorkflowPanel;
