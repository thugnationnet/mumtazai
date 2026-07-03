import React, { useState } from 'react';

interface Props {
  onClose?: () => void;
  onRunTool?: (msg: string) => void;
  onPreviewContent?: (c: any) => void;
}

const AdvancedAiPanel: React.FC<Props> = ({ onClose, onRunTool }) => {
  const [activeTab, setActiveTab] = useState<'router' | 'guardrails' | 'agents' | 'eval'>('router');
  const [prompt, setPrompt] = useState('');

  const runTool = (tool: string, desc: string) => onRunTool?.(`Use the ${tool} tool: ${desc}`);

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-300 dark:border-slate-700">
        <h2 className="text-sm font-semibold flex items-center gap-2">🤖 Advanced AI</h2>
        <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-lg">&times;</button>
      </div>
      <div className="flex border-b border-slate-300 dark:border-slate-700">
        {([['router', '🔀'], ['guardrails', '🛡️'], ['agents', '🤖'], ['eval', '📊']] as const).map(([tab, icon]) => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-2 text-xs font-medium ${activeTab === tab ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
            {icon}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeTab === 'router' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Route prompts to the best LLM model.</p>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Enter prompt to route..." rows={3} className="w-full bg-white dark:bg-slate-800 rounded px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 focus:border-blue-500 outline-none resize-none" />
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => runTool('llm_router', `Route this prompt with "cheapest" strategy: ${prompt}`)} className="py-2 bg-green-600/20 hover:bg-green-600/30 rounded text-xs border border-violet-500/30 text-green-300">💲 Cheapest</button>
              <button onClick={() => runTool('llm_router', `Route this prompt with "best_quality" strategy: ${prompt}`)} className="py-2 bg-purple-600/20 hover:bg-purple-600/30 rounded text-xs border border-purple-500/30 text-purple-300">✨ Best</button>
              <button onClick={() => runTool('llm_router', `Route this prompt with "fastest" strategy: ${prompt}`)} className="py-2 bg-yellow-600/20 hover:bg-yellow-600/30 rounded text-xs border border-yellow-500/30 text-yellow-300">⚡ Fastest</button>
              <button onClick={() => runTool('llm_router', `Route this prompt with "balanced" strategy: ${prompt}`)} className="py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded text-xs border border-blue-500/30 text-blue-300">⚖️ Balanced</button>
            </div>
            <button onClick={() => runTool('llm_cost_optimize', 'Analyze LLM usage costs and give recommendations (operation: analyze)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">💰 Cost Analysis</button>
          </>
        )}
        {activeTab === 'guardrails' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Apply safety guardrails to LLM content.</p>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Text to check..." rows={3} className="w-full bg-white dark:bg-slate-800 rounded px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 focus:border-red-500 outline-none resize-none" />
            <button onClick={() => runTool('llm_guardrail', `Check this text for PII and safety issues: ${prompt}`)} className="w-full py-2 bg-red-600 hover:bg-red-500 rounded text-sm font-medium">🛡️ Check Safety</button>
            <button onClick={() => runTool('llm_guardrail', 'List all available guardrail rules (operation: list_rules)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📋 List Rules</button>
          </>
        )}
        {activeTab === 'agents' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Spawn and manage AI agent instances.</p>
            <button onClick={() => runTool('agent_spawn', 'Spawn a new researcher agent (operation: spawn, role: researcher)')} className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium">+ Spawn Agent</button>
            <button onClick={() => runTool('agent_spawn', 'List all agent instances (operation: list)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📋 List Agents</button>
            <button onClick={() => runTool('agent_reflect', 'Review recent agent task performance (operation: performance)')} className="w-full py-2 bg-purple-600/20 hover:bg-purple-600/30 rounded text-sm border border-purple-500/30 text-purple-300">📊 Performance</button>
          </>
        )}
        {activeTab === 'eval' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Evaluate LLM output quality.</p>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="LLM response to evaluate..." rows={3} className="w-full bg-white dark:bg-slate-800 rounded px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 focus:border-blue-500 outline-none resize-none" />
            <button onClick={() => runTool('llm_evaluate', `Evaluate this response for coherence, relevance, and completeness: ${prompt}`)} className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium">📊 Evaluate</button>
          </>
        )}
      </div>
    </div>
  );
};

export default AdvancedAiPanel;
