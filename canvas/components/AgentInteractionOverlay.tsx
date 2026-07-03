import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, CheckCircle, AlertTriangle, XCircle, Info, ShieldCheck, MessageSquare } from 'lucide-react';
import { fetchWithCredentials } from '../fetchUtil';

// ============================================================================
// TYPES
// ============================================================================

interface Toast {
  id: string;
  level: 'info' | 'warning' | 'error' | 'success';
  content: string;
  timestamp: number;
}

interface ApprovalRequest {
  interactionId: string;
  action: string;
  details: string;
  level: string;
}

interface UserQuestion {
  interactionId: string;
  question: string;
  questionType: 'confirm' | 'prompt';
  defaultValue: string;
}

// ============================================================================
// TOAST COMPONENT
// ============================================================================

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const icon = {
    info: <Info size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />,
    success: <CheckCircle size={16} className="text-emerald-400 shrink-0" />,
    warning: <AlertTriangle size={16} className="text-amber-400 shrink-0" />,
    error: <XCircle size={16} className="text-red-400 shrink-0" />,
  }[toast.level];

  const borderColor = {
    info: 'border-indigo-500/40',
    success: 'border-emerald-500/40',
    warning: 'border-amber-500/40',
    error: 'border-red-500/40',
  }[toast.level];

  return (
    <div className={`flex items-start gap-2.5 px-4 py-3 rounded-lg bg-zinc-900/95 border ${borderColor} backdrop-blur-sm shadow-lg animate-slide-in-right max-w-sm`}>
      {icon}
      <span className="text-sm text-slate-800 dark:text-slate-200 leading-snug flex-1">{toast.content}</span>
      <button onClick={() => onDismiss(toast.id)} className="text-gray-500 hover:text-slate-700 dark:text-slate-300 shrink-0">
        <X size={14} />
      </button>
    </div>
  );
}

// ============================================================================
// APPROVAL MODAL
// ============================================================================

function ApprovalModal({ request, onRespond }: { request: ApprovalRequest; onRespond: (approved: boolean) => void }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-400 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-amber-500/30 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800 bg-amber-500/5">
          <ShieldCheck size={20} className="text-amber-400" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Approval Required</h3>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-start gap-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-0.5 shrink-0 w-14">Action</span>
            <span className="text-sm text-slate-900 dark:text-white font-medium">{request.action}</span>
          </div>
          {request.details && (
            <div className="flex items-start gap-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-0.5 shrink-0 w-14">Details</span>
              <span className="text-sm text-slate-700 dark:text-slate-300">{request.details}</span>
            </div>
          )}
        </div>
        <div className="flex gap-3 px-5 py-4 border-t border-zinc-800 bg-zinc-900/50">
          <button
            onClick={() => onRespond(false)}
            className="flex-1 px-4 py-2 rounded-lg border border-zinc-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            Deny
          </button>
          <button
            onClick={() => onRespond(true)}
            className="flex-1 px-4 py-2 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors"
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ASK USER MODAL
// ============================================================================

function AskUserModal({ question, onRespond }: { question: UserQuestion; onRespond: (data: { answer?: string; confirmed?: boolean }) => void }) {
  const [inputValue, setInputValue] = useState(question.defaultValue || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (question.questionType === 'confirm') {
      onRespond({ confirmed: true });
    } else {
      onRespond({ answer: inputValue });
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-400 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-indigo-500/30 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800 bg-cyan-500/5">
          <MessageSquare size={20} className="text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Agent Question</h3>
        </div>
        <div className="px-5 py-4 space-y-4">
          <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">{question.question}</p>
          {question.questionType === 'prompt' && (
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Type your answer..."
              className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-slate-900 dark:text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-cyan-500/30"
            />
          )}
        </div>
        <div className="flex gap-3 px-5 py-4 border-t border-zinc-800 bg-zinc-900/50">
          {question.questionType === 'confirm' ? (
            <>
              <button
                onClick={() => onRespond({ confirmed: false })}
                className="flex-1 px-4 py-2 rounded-lg border border-zinc-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-zinc-800 transition-colors"
              >
                No
              </button>
              <button
                onClick={() => onRespond({ confirmed: true })}
                className="flex-1 px-4 py-2 rounded-lg bg-cyan-500 text-black text-sm font-semibold hover:bg-cyan-400 transition-colors"
              >
                Yes
              </button>
            </>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!inputValue.trim()}
              className="flex-1 px-4 py-2 rounded-lg bg-cyan-500 text-black text-sm font-semibold hover:bg-cyan-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Submit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN OVERLAY CONTROLLER
// ============================================================================

interface AgentInteractionOverlayProps {
  // parent calls these imperatively via ref
}

export interface AgentInteractionHandle {
  showToast: (level: Toast['level'], content: string) => void;
  showApproval: (event: any) => void;
  showQuestion: (event: any) => void;
}

const AgentInteractionOverlay = React.forwardRef<AgentInteractionHandle, AgentInteractionOverlayProps>((_props, ref) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [approval, setApproval] = useState<ApprovalRequest | null>(null);
  const [question, setQuestion] = useState<UserQuestion | null>(null);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((level: Toast['level'], content: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts(prev => [...prev.slice(-4), { id, level, content, timestamp: Date.now() }]);
  }, []);

  const showApproval = useCallback((event: any) => {
    setApproval({
      interactionId: event.interactionId,
      action: event.action || 'Unknown action',
      details: event.details || '',
      level: event.level || 'confirm',
    });
  }, []);

  const showQuestion = useCallback((event: any) => {
    setQuestion({
      interactionId: event.interactionId,
      question: event.question || 'The agent has a question',
      questionType: event.questionType || 'prompt',
      defaultValue: event.defaultValue || '',
    });
  }, []);

  const handleApprovalRespond = useCallback(async (approved: boolean) => {
    if (!approval) return;
    const id = approval.interactionId;
    setApproval(null);
    try {
      await fetchWithCredentials(`/api/canvas/agent-respond/${encodeURIComponent(id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ approved }),
      });
    } catch (e) {
      console.error('[AgentUI] Failed to send approval response:', e);
    }
  }, [approval]);

  const handleQuestionRespond = useCallback(async (data: { answer?: string; confirmed?: boolean }) => {
    if (!question) return;
    const id = question.interactionId;
    setQuestion(null);
    try {
      await fetchWithCredentials(`/api/canvas/agent-respond/${encodeURIComponent(id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.error('[AgentUI] Failed to send question response:', e);
    }
  }, [question]);

  React.useImperativeHandle(ref, () => ({
    showToast,
    showApproval,
    showQuestion,
  }));

  return (
    <>
      {/* Toast Stack */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-[9998] flex flex-col gap-2 pointer-events-auto">
          {toasts.map(t => (
            <ToastItem key={t.id} toast={t} onDismiss={dismissToast} />
          ))}
        </div>
      )}

      {/* Approval Modal */}
      {approval && <ApprovalModal request={approval} onRespond={handleApprovalRespond} />}

      {/* Question Modal */}
      {question && <AskUserModal question={question} onRespond={handleQuestionRespond} />}
    </>
  );
});

AgentInteractionOverlay.displayName = 'AgentInteractionOverlay';
export default AgentInteractionOverlay;
