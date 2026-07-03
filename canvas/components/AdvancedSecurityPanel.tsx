import React, { useState } from 'react';

interface Props {
  onClose?: () => void;
  onRunTool?: (msg: string) => void;
  onPreviewContent?: (c: any) => void;
}

const AdvancedSecurityPanel: React.FC<Props> = ({ onClose, onRunTool }) => {
  const [activeTab, setActiveTab] = useState<'scan' | 'policy' | 'threat' | 'incident'>('scan');
  const [code, setCode] = useState('');

  const runTool = (tool: string, desc: string) => onRunTool?.(`Use the ${tool} tool: ${desc}`);

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-300 dark:border-slate-700">
        <h2 className="text-sm font-semibold flex items-center gap-2">🔒 Security</h2>
        <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-lg">&times;</button>
      </div>
      <div className="flex border-b border-slate-300 dark:border-slate-700">
        {([['scan', '🔍'], ['policy', '📜'], ['threat', '⚠️'], ['incident', '🚨']] as const).map(([tab, icon]) => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-2 text-xs font-medium ${activeTab === tab ? 'text-red-400 border-b-2 border-red-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
            {icon}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeTab === 'scan' && (
          <>
            <textarea value={code} onChange={e => setCode(e.target.value)} placeholder="Paste code to scan for vulnerabilities..." rows={4} className="w-full bg-white dark:bg-slate-800 rounded px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 focus:border-red-500 outline-none resize-none font-mono" />
            <button onClick={() => runTool('scan_vulnerabilities', `Scan this code for vulnerabilities: ${code}`)} className="w-full py-2 bg-red-600 hover:bg-red-500 rounded text-sm font-medium">🔍 Scan Code</button>
            <button onClick={() => runTool('scan_vulnerabilities', 'Scan project dependencies for known vulnerabilities (operation: scan, target: dependencies)')} className="w-full py-2 bg-orange-600/20 hover:bg-orange-600/30 rounded text-sm border border-orange-500/30 text-orange-300">📦 Scan Dependencies</button>
            <button onClick={() => runTool('scan_vulnerabilities', 'List previous security scans (operation: list)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📋 Scan History</button>
          </>
        )}
        {activeTab === 'policy' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Create and enforce security policies.</p>
            <button onClick={() => runTool('policy_enforce', 'Create a new access control policy (operation: create, type: access_control)')} className="w-full py-2 bg-red-600 hover:bg-red-500 rounded text-sm font-medium">+ New Policy</button>
            <button onClick={() => runTool('policy_enforce', 'Check current context against all active policies (operation: check)')} className="w-full py-2 bg-yellow-600/20 hover:bg-yellow-600/30 rounded text-sm border border-yellow-500/30 text-yellow-300">✅ Check Compliance</button>
            <button onClick={() => runTool('policy_enforce', 'List all security policies (operation: list)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📋 List Policies</button>
          </>
        )}
        {activeTab === 'threat' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Create and analyze threat models using STRIDE framework.</p>
            <button onClick={() => runTool('threat_model', 'Create a new threat model using STRIDE framework (operation: create, framework: stride)')} className="w-full py-2 bg-red-600 hover:bg-red-500 rounded text-sm font-medium">+ New Threat Model</button>
            <button onClick={() => runTool('threat_model', 'Analyze the latest threat model for threats (operation: analyze)')} className="w-full py-2 bg-purple-600/20 hover:bg-purple-600/30 rounded text-sm border border-purple-500/30 text-purple-300">🔬 Analyze Threats</button>
            <button onClick={() => runTool('threat_model', 'List all threat models (operation: list)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📋 List Models</button>
          </>
        )}
        {activeTab === 'incident' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Track and manage security incidents.</p>
            <button onClick={() => runTool('incident_response', 'Create a new security incident (operation: create)')} className="w-full py-2 bg-red-600 hover:bg-red-500 rounded text-sm font-medium">🚨 Report Incident</button>
            <button onClick={() => runTool('incident_response', 'List all security incidents (operation: list)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📋 List Incidents</button>
          </>
        )}
      </div>
    </div>
  );
};

export default AdvancedSecurityPanel;
