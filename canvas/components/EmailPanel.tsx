import React, { useState } from 'react';

interface Props {
  onClose?: () => void;
  onRunTool?: (msg: string) => void;
  onPreviewContent?: (c: any) => void;
}

const EmailPanel: React.FC<Props> = ({ onClose, onRunTool }) => {
  const [activeTab, setActiveTab] = useState<'draft' | 'templates' | 'newsletter' | 'notifications' | 'calendar'>('draft');

  const runTool = (tool: string, desc: string) => onRunTool?.(`Use the ${tool} tool: ${desc}`);

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-300 dark:border-slate-700">
        <h2 className="text-sm font-semibold flex items-center gap-2">📧 Email & Communication</h2>
        <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-lg">&times;</button>
      </div>
      <div className="flex border-b border-slate-300 dark:border-slate-700 overflow-x-auto">
        {([['draft', '✉️'], ['templates', '📝'], ['newsletter', '📰'], ['notifications', '🔔'], ['calendar', '📅']] as const).map(([tab, icon]) => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-2 text-xs font-medium whitespace-nowrap px-2 ${activeTab === tab ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
            {icon}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeTab === 'draft' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Draft and send emails.</p>
            <button onClick={() => runTool('email_draft', 'Draft a new email (action: draft)')} className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium">+ Draft Email</button>
            <button onClick={() => runTool('email_draft', 'List email drafts (action: list)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📋 List Drafts</button>
          </>
        )}
        {activeTab === 'templates' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Manage email templates.</p>
            <button onClick={() => runTool('email_template', 'Create a new email template (action: create)')} className="w-full py-2 bg-purple-600 hover:bg-purple-500 rounded text-sm font-medium">+ New Template</button>
            <button onClick={() => runTool('email_template', 'List all templates (action: list)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📋 List Templates</button>
          </>
        )}
        {activeTab === 'newsletter' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Create and manage newsletters.</p>
            <button onClick={() => runTool('newsletter_create', 'Create a new newsletter (action: create)')} className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm font-medium">+ New Newsletter</button>
            <button onClick={() => runTool('newsletter_create', 'List newsletters (action: list)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📋 List Newsletters</button>
          </>
        )}
        {activeTab === 'notifications' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Send notifications and SMS.</p>
            <button onClick={() => runTool('notification_send', 'Send a notification (action: send)')} className="w-full py-2 bg-yellow-600 hover:bg-yellow-500 rounded text-sm font-medium">🔔 Send Notification</button>
            <button onClick={() => runTool('sms_send', 'Send SMS message (action: send)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📱 Send SMS</button>
          </>
        )}
        {activeTab === 'calendar' && (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">Manage calendar events and meetings.</p>
            <button onClick={() => runTool('calendar_manage', 'Create a new event (action: create)')} className="w-full py-2 bg-teal-600 hover:bg-teal-500 rounded text-sm font-medium">+ New Event</button>
            <button onClick={() => runTool('meeting_schedule', 'Schedule a meeting (action: schedule)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">🤝 Schedule Meeting</button>
            <button onClick={() => runTool('calendar_manage', 'List upcoming events (action: list)')} className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 rounded text-sm border border-slate-300 dark:border-slate-700">📋 List Events</button>
          </>
        )}
      </div>
    </div>
  );
};

export default EmailPanel;
