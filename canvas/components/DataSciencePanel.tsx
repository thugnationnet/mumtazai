import React, { useState } from 'react';

interface Props {
  onClose?: () => void;
  onRunTool?: (msg: string) => void;
  onPreviewContent?: (c: any) => void;
}

const DataSciencePanel: React.FC<Props> = ({ onClose, onRunTool }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'clean' | 'viz' | 'ml'>('profile');

  const runTool = (tool: string, desc: string) => onRunTool?.(`Use the ${tool} tool: ${desc}`);

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-300 dark:border-slate-700">
        <h2 className="text-sm font-semibold flex items-center gap-2">📊 Data Science</h2>
        <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-lg">&times;</button>
      </div>
      <div className="flex border-b border-slate-300 dark:border-slate-700">
        {([['profile', '🔍'], ['clean', '🧹'], ['viz', '📈'], ['ml', '🤖']] as const).map(([tab, icon]) => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-2 text-xs font-medium ${activeTab === tab ? 'text-teal-400 border-b-2 border-teal-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
            {icon}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeTab === 'profile' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Profile datasets — stats, distributions, missing values.</p>
            <button onClick={() => runTool('data_profile', 'Profile the current dataset (operation: profile)')} className="w-full py-2 bg-teal-600 hover:bg-teal-500 rounded text-sm font-medium">📊 Profile Data</button>
            <button onClick={() => runTool('data_profile', 'List all data profiles (operation: list)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📋 View Profiles</button>
          </>
        )}
        {activeTab === 'clean' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Clean and transform datasets.</p>
            <button onClick={() => runTool('data_clean', 'Clean the dataset — remove nulls and duplicates (operation: clean)')} className="w-full py-2 bg-teal-600 hover:bg-teal-500 rounded text-sm font-medium">🧹 Auto Clean</button>
            <button onClick={() => runTool('data_clean', 'List previous clean jobs (operation: list)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📋 History</button>
          </>
        )}
        {activeTab === 'viz' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Generate data visualizations.</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => runTool('data_visualize', 'Create a bar chart (operation: create, type: bar)')} className="py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded text-xs border border-blue-500/30 text-blue-300">📊 Bar</button>
              <button onClick={() => runTool('data_visualize', 'Create a line chart (operation: create, type: line)')} className="py-2 bg-green-600/20 hover:bg-green-600/30 rounded text-xs border border-violet-500/30 text-green-300">📈 Line</button>
              <button onClick={() => runTool('data_visualize', 'Create a scatter plot (operation: create, type: scatter)')} className="py-2 bg-purple-600/20 hover:bg-purple-600/30 rounded text-xs border border-purple-500/30 text-purple-300">⚬ Scatter</button>
              <button onClick={() => runTool('data_visualize', 'Create a pie chart (operation: create, type: pie)')} className="py-2 bg-pink-600/20 hover:bg-pink-600/30 rounded text-xs border border-pink-500/30 text-pink-300">🥧 Pie</button>
            </div>
            <button onClick={() => runTool('data_visualize', 'List all visualizations (operation: list)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📋 List Charts</button>
          </>
        )}
        {activeTab === 'ml' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Feature engineering and model comparison.</p>
            <button onClick={() => runTool('feature_engineer', 'Auto-generate features from the current dataset')} className="w-full py-2 bg-orange-600 hover:bg-orange-500 rounded text-sm font-medium">⚙️ Auto Features</button>
            <button onClick={() => runTool('model_compare', 'Register a new ML model (operation: register)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">+ Register Model</button>
            <button onClick={() => runTool('model_compare', 'List all registered models (operation: list)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📋 List Models</button>
          </>
        )}
      </div>
    </div>
  );
};

export default DataSciencePanel;
