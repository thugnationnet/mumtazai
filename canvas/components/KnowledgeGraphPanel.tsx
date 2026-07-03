import React, { useState } from 'react';

interface Props {
  onClose?: () => void;
  onRunTool?: (msg: string) => void;
  onPreviewContent?: (c: any) => void;
}

const KnowledgeGraphPanel: React.FC<Props> = ({ onClose, onRunTool }) => {
  const [entityName, setEntityName] = useState('');
  const [entityType, setEntityType] = useState('concept');
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'create' | 'query' | 'visualize'>('create');

  const runTool = (tool: string, desc: string) => onRunTool?.(`Use the ${tool} tool: ${desc}`);

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-300 dark:border-slate-700">
        <h2 className="text-sm font-semibold flex items-center gap-2">🧠 Knowledge Graph</h2>
        <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-lg">&times;</button>
      </div>
      <div className="flex border-b border-slate-300 dark:border-slate-700">
        {(['create', 'query', 'visualize'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 text-xs font-medium ${activeTab === tab ? 'text-violet-400 border-b-2 border-violet-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
            {tab === 'create' ? '+ Entity' : tab === 'query' ? '🔍 Query' : '📊 Graph'}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeTab === 'create' && (
          <>
            <input value={entityName} onChange={e => setEntityName(e.target.value)} placeholder="Entity name..." className="w-full bg-white dark:bg-slate-800 rounded px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 focus:border-violet-500 outline-none" />
            <select value={entityType} onChange={e => setEntityType(e.target.value)} className="w-full bg-white dark:bg-slate-800 rounded px-3 py-2 text-sm border border-slate-300 dark:border-slate-700">
              <option value="concept">Concept</option>
              <option value="person">Person</option>
              <option value="organization">Organization</option>
              <option value="event">Event</option>
              <option value="technology">Technology</option>
            </select>
            <button onClick={() => runTool('kg_create', `Create entity "${entityName}" of type "${entityType}"`)} className="w-full py-2 bg-violet-600 hover:bg-violet-500 rounded text-sm font-medium">Add Entity</button>
          </>
        )}
        {activeTab === 'query' && (
          <>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search entities..." className="w-full bg-white dark:bg-slate-800 rounded px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 focus:border-violet-500 outline-none" />
            <button onClick={() => runTool('kg_query', `Search the knowledge graph for: ${query}`)} className="w-full py-2 bg-violet-600 hover:bg-violet-500 rounded text-sm font-medium">Search</button>
            <button onClick={() => runTool('kg_merge', 'Find and merge duplicate entities in the knowledge graph')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">🔗 Find Duplicates</button>
            <button onClick={() => runTool('kg_reason', 'Analyze the knowledge graph and suggest new relations')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">💡 Suggest Relations</button>
          </>
        )}
        {activeTab === 'visualize' && (
          <>
            <button onClick={() => runTool('kg_visualize', 'Visualize the entire knowledge graph as a mermaid diagram')} className="w-full py-2 bg-violet-600/20 hover:bg-violet-600/30 rounded text-sm border border-violet-500/30 text-violet-300">📊 Full Graph</button>
            <button onClick={() => runTool('kg_visualize', 'Visualize the knowledge graph focused on the most connected entities')} className="w-full py-2 bg-violet-600/20 hover:bg-violet-600/30 rounded text-sm border border-violet-500/30 text-violet-300">🌟 Top Entities</button>
          </>
        )}
      </div>
    </div>
  );
};

export default KnowledgeGraphPanel;
