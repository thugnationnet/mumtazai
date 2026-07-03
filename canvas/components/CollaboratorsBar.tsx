import React from 'react';

interface Collaborator {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  cursor?: { file: string; line: number; column: number };
}

interface CollaboratorsBarProps {
  collaborators: Collaborator[];
  isConnected: boolean;
  maxVisible?: number;
}

const CollaboratorsBar: React.FC<CollaboratorsBarProps> = ({
  collaborators,
  isConnected,
  maxVisible = 4,
}) => {
  if (!isConnected && collaborators.length === 0) return null;

  const visible = collaborators.slice(0, maxVisible);
  const overflow = collaborators.length - maxVisible;

  return (
    <div className="flex items-center gap-1.5">
      {/* Connection indicator */}
      <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-gray-500'}`} />

      {/* Avatars */}
      <div className="flex -space-x-1.5">
        {visible.map((c) => (
          <div
            key={c.id}
            className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800"
            style={{ backgroundColor: c.color || '#6366f1' }}
            title={c.name}
          >
            {c.avatar ? (
              <img src={c.avatar} alt={c.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              c.name.charAt(0).toUpperCase()
            )}
          </div>
        ))}
        {overflow > 0 && (
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 border border-slate-200 dark:border-slate-800">
            +{overflow}
          </div>
        )}
      </div>

      {collaborators.length > 0 && (
        <span className="text-[9px] text-gray-500 uppercase tracking-wider">
          {collaborators.length} online
        </span>
      )}
    </div>
  );
};

export default CollaboratorsBar;
