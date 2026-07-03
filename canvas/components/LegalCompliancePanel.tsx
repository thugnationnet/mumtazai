import React, { useState } from 'react';

interface Props {
  onClose?: () => void;
  onRunTool?: (msg: string) => void;
  onPreviewContent?: (c: any) => void;
}

const LegalCompliancePanel: React.FC<Props> = ({ onClose, onRunTool }) => {
  const [activeTab, setActiveTab] = useState<'contracts' | 'compliance' | 'nda' | 'terms' | 'privacy'>('contracts');

  const runTool = (tool: string, desc: string) => onRunTool?.(`Use the ${tool} tool: ${desc}`);

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-300 dark:border-slate-700">
        <h2 className="text-sm font-semibold flex items-center gap-2">⚖️ Legal & Compliance</h2>
        <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-lg">&times;</button>
      </div>
      <div className="flex border-b border-slate-300 dark:border-slate-700 overflow-x-auto">
        {([['contracts', '📑'], ['compliance', '✅'], ['nda', '🔒'], ['terms', '📄'], ['privacy', '🛡️']] as const).map(([tab, icon]) => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-2 text-xs font-medium whitespace-nowrap px-2 ${activeTab === tab ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
            {icon}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeTab === 'contracts' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Analyze contracts for risks, obligations, and key terms.</p>
            <button onClick={() => runTool('contract_analyze', 'Analyze a contract for risks (action: analyze)')} className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium">🔍 Analyze Contract</button>
            <button onClick={() => runTool('contract_analyze', 'Extract contract risks (action: risks)')} className="w-full py-2 bg-red-600/20 hover:bg-red-600/30 rounded text-sm border border-red-500/30 text-red-300">⚠️ Risk Analysis</button>
            <button onClick={() => runTool('contract_analyze', 'List obligations (action: obligations)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📋 Obligations</button>
          </>
        )}
        {activeTab === 'compliance' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Check compliance against GDPR, HIPAA, SOC2, PCI-DSS.</p>
            <button onClick={() => runTool('compliance_check', 'Run GDPR compliance check (action: check, framework: gdpr)')} className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm font-medium">🇪🇺 GDPR Check</button>
            <button onClick={() => runTool('compliance_check', 'Run HIPAA compliance check (action: check, framework: hipaa)')} className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium">🏥 HIPAA Check</button>
            <button onClick={() => runTool('compliance_check', 'Run SOC2 compliance check (action: check, framework: soc2)')} className="w-full py-2 bg-purple-600 hover:bg-purple-500 rounded text-sm font-medium">🔐 SOC2 Check</button>
            <button onClick={() => runTool('compliance_check', 'Identify compliance gaps (action: gaps)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📊 Gap Analysis</button>
          </>
        )}
        {activeTab === 'nda' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Generate Non-Disclosure Agreements.</p>
            <button onClick={() => runTool('nda_generate', 'Generate mutual NDA (action: generate, type: mutual)')} className="w-full py-2 bg-teal-600 hover:bg-teal-500 rounded text-sm font-medium">🤝 Mutual NDA</button>
            <button onClick={() => runTool('nda_generate', 'Generate unilateral NDA (action: generate, type: unilateral)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📝 Unilateral NDA</button>
          </>
        )}
        {activeTab === 'terms' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Generate Terms of Service, Privacy Policy, and other documents.</p>
            <button onClick={() => runTool('terms_generate', 'Generate Terms of Service (action: generate, type: tos)')} className="w-full py-2 bg-yellow-600 hover:bg-yellow-500 rounded text-sm font-medium">📄 Terms of Service</button>
            <button onClick={() => runTool('terms_generate', 'Generate Privacy Policy (action: generate, type: privacy_policy)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">🛡️ Privacy Policy</button>
            <button onClick={() => runTool('terms_generate', 'Generate Cookie Policy (action: generate, type: cookie_policy)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">🍪 Cookie Policy</button>
            <button onClick={() => runTool('regulatory_report', 'Generate regulatory report (action: generate)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📊 Regulatory Report</button>
          </>
        )}
        {activeTab === 'privacy' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Audit privacy practices and search IP databases.</p>
            <button onClick={() => runTool('privacy_audit', 'Run privacy audit (action: audit)')} className="w-full py-2 bg-purple-600 hover:bg-purple-500 rounded text-sm font-medium">🔍 Privacy Audit</button>
            <button onClick={() => runTool('privacy_audit', 'Create data map (action: data_map)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">🗺️ Data Map</button>
            <button onClick={() => runTool('ip_search', 'Search IP databases (action: search, type: all)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">🔎 IP Search</button>
          </>
        )}
      </div>
    </div>
  );
};

export default LegalCompliancePanel;
