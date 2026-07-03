import React from 'react';

type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface AutoSaveIndicatorProps {
  status: AutoSaveStatus;
}

const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({ status }) => {
  if (status === 'idle') return null;

  const config = {
    saving: {
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
      dot: 'bg-amber-400 animate-pulse',
      label: 'Saving...',
    },
    saved: {
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      dot: 'bg-emerald-400',
      label: 'Saved',
    },
    error: {
      color: 'text-red-400',
      bg: 'bg-red-400/10',
      dot: 'bg-red-400',
      label: 'Save failed',
    },
  }[status] || { color: 'text-slate-500 dark:text-slate-400', bg: 'bg-gray-400/10', dot: 'bg-gray-400', label: '' };

  return (
    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${config.bg}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span className={`text-[9px] uppercase tracking-wider font-medium ${config.color}`}>
        {config.label}
      </span>
    </div>
  );
};

export default AutoSaveIndicator;
