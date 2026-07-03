import React, { useState } from 'react';

interface Props {
  onClose?: () => void;
  onRunTool?: (msg: string) => void;
  onPreviewContent?: (c: any) => void;
}

const ProjectManagementPanel: React.FC<Props> = ({ onClose, onRunTool }) => {
  const [activeTab, setActiveTab] = useState<'projects' | 'tasks' | 'sprints' | 'gantt' | 'resources'>('projects');

  const runTool = (tool: string, desc: string) => onRunTool?.(`Use the ${tool} tool: ${desc}`);

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-300 dark:border-slate-700">
        <h2 className="text-sm font-semibold flex items-center gap-2">📋 Project Management</h2>
        <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-lg">&times;</button>
      </div>
      <div className="flex border-b border-slate-300 dark:border-slate-700 overflow-x-auto">
        {([['projects', '🏗️'], ['tasks', '✅'], ['sprints', '🏃'], ['gantt', '📊'], ['resources', '👥']] as const).map(([tab, icon]) => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-2 text-xs font-medium whitespace-nowrap px-2 ${activeTab === tab ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
            {icon}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeTab === 'projects' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Create and manage projects.</p>
            <button onClick={() => runTool('project_create', 'Create a new project (action: create)')} className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium">+ New Project</button>
            <button onClick={() => runTool('project_create', 'List all projects (action: list)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📋 List Projects</button>
          </>
        )}
        {activeTab === 'tasks' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Manage tasks and assignments.</p>
            <button onClick={() => runTool('task_manage', 'Create a new task (action: create)')} className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm font-medium">+ New Task</button>
            <button onClick={() => runTool('task_manage', 'List all tasks (action: list)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📋 List Tasks</button>
            <button onClick={() => runTool('deadline_track', 'Check deadlines and upcoming due dates (action: check)')} className="w-full py-2 bg-red-600/20 hover:bg-red-600/30 rounded text-sm border border-red-500/30 text-red-300">⏰ Deadlines</button>
          </>
        )}
        {activeTab === 'sprints' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Plan and track agile sprints.</p>
            <button onClick={() => runTool('sprint_plan', 'Create a new sprint (action: create)')} className="w-full py-2 bg-purple-600 hover:bg-purple-500 rounded text-sm font-medium">+ New Sprint</button>
            <button onClick={() => runTool('sprint_plan', 'List sprints (action: list)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📋 List Sprints</button>
          </>
        )}
        {activeTab === 'gantt' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Generate Gantt charts and track milestones.</p>
            <button onClick={() => runTool('gantt_generate', 'Generate Gantt chart in mermaid format (action: generate, format: mermaid)')} className="w-full py-2 bg-orange-600 hover:bg-orange-500 rounded text-sm font-medium">📊 Generate Gantt</button>
            <button onClick={() => runTool('milestone_track', 'List all milestones (action: list)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">🏁 Milestones</button>
          </>
        )}
        {activeTab === 'resources' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Allocate and manage resources.</p>
            <button onClick={() => runTool('resource_allocate', 'Allocate resources (action: allocate)')} className="w-full py-2 bg-teal-600 hover:bg-teal-500 rounded text-sm font-medium">+ Allocate</button>
            <button onClick={() => runTool('resource_allocate', 'View resource utilization (action: utilization)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📊 Utilization</button>
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectManagementPanel;
