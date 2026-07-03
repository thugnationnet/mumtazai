import React, { useState } from 'react';

interface Props {
  onClose?: () => void;
  onRunTool?: (msg: string) => void;
  onPreviewContent?: (c: any) => void;
}

const HrRecruitingPanel: React.FC<Props> = ({ onClose, onRunTool }) => {
  const [activeTab, setActiveTab] = useState<'resumes' | 'jobs' | 'interviews' | 'payroll' | 'reviews'>('resumes');

  const runTool = (tool: string, desc: string) => onRunTool?.(`Use the ${tool} tool: ${desc}`);

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-300 dark:border-slate-700">
        <h2 className="text-sm font-semibold flex items-center gap-2">👥 HR & Recruiting</h2>
        <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-lg">&times;</button>
      </div>
      <div className="flex border-b border-slate-300 dark:border-slate-700 overflow-x-auto">
        {([['resumes', '📄'], ['jobs', '💼'], ['interviews', '🎯'], ['payroll', '💰'], ['reviews', '⭐']] as const).map(([tab, icon]) => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-2 text-xs font-medium whitespace-nowrap px-2 ${activeTab === tab ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
            {icon}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeTab === 'resumes' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Parse and analyze resumes.</p>
            <button onClick={() => runTool('resume_parse', 'Parse a resume (action: parse)')} className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium">📄 Parse Resume</button>
            <button onClick={() => runTool('resume_parse', 'Search parsed resumes (action: search)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">🔍 Search</button>
          </>
        )}
        {activeTab === 'jobs' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Create and manage job postings.</p>
            <button onClick={() => runTool('job_post', 'Create a new job posting (action: create)')} className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm font-medium">+ New Job Post</button>
            <button onClick={() => runTool('job_post', 'List all job postings (action: list)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📋 List Jobs</button>
          </>
        )}
        {activeTab === 'interviews' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Schedule and manage interviews.</p>
            <button onClick={() => runTool('interview_schedule', 'Schedule an interview (action: schedule)')} className="w-full py-2 bg-purple-600 hover:bg-purple-500 rounded text-sm font-medium">+ Schedule Interview</button>
            <button onClick={() => runTool('interview_schedule', 'List scheduled interviews (action: list)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📋 List Interviews</button>
            <button onClick={() => runTool('employee_onboard', 'Generate onboarding checklist (action: generate)')} className="w-full py-2 bg-teal-600/20 hover:bg-teal-600/30 rounded text-sm border border-teal-500/30 text-teal-300">📝 Onboarding</button>
          </>
        )}
        {activeTab === 'payroll' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Calculate payroll and compensation.</p>
            <button onClick={() => runTool('payroll_calculate', 'Calculate payroll for an employee (action: calculate)')} className="w-full py-2 bg-yellow-600 hover:bg-yellow-500 rounded text-sm font-medium">🧮 Calculate Payroll</button>
            <button onClick={() => runTool('payroll_calculate', 'Run batch payroll calculation (action: batch)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📊 Batch Payroll</button>
          </>
        )}
        {activeTab === 'reviews' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Manage performance reviews and org charts.</p>
            <button onClick={() => runTool('performance_review', 'Create a performance review (action: create)')} className="w-full py-2 bg-orange-600 hover:bg-orange-500 rounded text-sm font-medium">+ New Review</button>
            <button onClick={() => runTool('performance_review', 'List performance reviews (action: list)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📋 List Reviews</button>
            <button onClick={() => runTool('org_chart', 'Generate org chart (action: generate, format: mermaid)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">🏢 Org Chart</button>
          </>
        )}
      </div>
    </div>
  );
};

export default HrRecruitingPanel;
