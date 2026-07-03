/**
 * ApprovalModal — Confirmation dialog for destructive or multi-file agent actions.
 * Shows a summary of pending actions and allows approve/reject.
 */
'use client';

import React from 'react';
import { Shield, Check, FileText, Trash2, Edit, FilePlus, ArrowRight, AlertTriangle } from 'lucide-react';
import type { PendingApproval, AgentBridgeAction } from '../types/canvas-agent-protocol';

interface ApprovalModalProps {
  approval: PendingApproval;
  onApprove: () => void;
  onReject: () => void;
}

export default function ApprovalModal({ approval, onApprove, onReject }: ApprovalModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-400 dark:bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-100 dark:bg-[#1e1e2e] border border-zinc-700 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className={`flex items-center gap-3 px-5 py-4 ${approval.destructive ? 'bg-red-500/10 border-b border-red-500/20' : 'bg-blue-500/10 border-b border-blue-500/20'}`}>
          {approval.destructive ? (
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          ) : (
            <Shield className="w-5 h-5 text-blue-400 flex-shrink-0" />
          )}
          <div>
            <h3 className="text-base font-semibold text-zinc-100">{approval.title}</h3>
            {approval.description && (
              <p className="text-xs text-zinc-400 mt-0.5">{approval.description}</p>
            )}
          </div>
        </div>

        {/* Actions List */}
        <div className="px-5 py-3 max-h-64 overflow-y-auto space-y-1.5">
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
            {approval.actions.length} action{approval.actions.length !== 1 ? 's' : ''} pending
          </div>
          {approval.actions.map((action, i) => (
            <ActionRow key={i} action={action} />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-3 bg-zinc-900/50 border-t border-zinc-800">
          <button
            onClick={onReject}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
          >
            Reject
          </button>
          <button
            onClick={onApprove}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-slate-900 dark:text-white transition-colors ${
              approval.destructive
                ? 'bg-red-600 hover:bg-red-500'
                : 'bg-green-600 hover:bg-green-500'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              Approve
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionRow({ action }: { action: AgentBridgeAction }) {
  const { icon, label, detail, color } = describeAction(action);
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
      <span className={`flex-shrink-0 ${color}`}>{icon}</span>
      <span className="text-sm text-zinc-300">{label}</span>
      {detail && <span className="text-xs text-zinc-500 truncate ml-auto">{detail}</span>}
    </div>
  );
}

function describeAction(action: AgentBridgeAction): {
  icon: React.ReactNode;
  label: string;
  detail?: string;
  color: string;
} {
  switch (action.type) {
    case 'file.create':
      return {
        icon: <FilePlus className="w-4 h-4" />,
        label: `Create file`,
        detail: action.payload.path,
        color: 'text-green-400',
      };
    case 'file.edit':
      return {
        icon: <Edit className="w-4 h-4" />,
        label: `Edit file`,
        detail: action.payload.path,
        color: 'text-blue-400',
      };
    case 'file.delete':
      return {
        icon: <Trash2 className="w-4 h-4" />,
        label: `Delete file`,
        detail: action.payload.path,
        color: 'text-red-400',
      };
    case 'file.rename':
    case 'file.move':
      return {
        icon: <ArrowRight className="w-4 h-4" />,
        label: action.type === 'file.rename' ? 'Rename' : 'Move',
        detail: `${action.payload.from} → ${action.payload.to}`,
        color: 'text-yellow-400',
      };
    case 'exec.run':
      return {
        icon: <span className="text-xs font-mono">$</span>,
        label: `Run command`,
        detail: action.payload.command,
        color: 'text-purple-400',
      };
    default:
      return {
        icon: <FileText className="w-4 h-4" />,
        label: action.type,
        color: 'text-zinc-400',
      };
  }
}
