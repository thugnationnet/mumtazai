/**
 * ToastContainer — Floating toast notifications for agent feedback.
 */
'use client';

import React, { useEffect, useState } from 'react';
import { Info, CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react';
import type { Toast } from '../types/canvas-agent-protocol';

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export default function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => onDismiss(toast.id), 200);
  };

  const config = getToastConfig(toast.level);

  return (
    <div
      className={`pointer-events-auto flex items-start gap-2 px-4 py-3 rounded-lg shadow-lg border transition-all duration-200 ${
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
      } ${config.bg} ${config.border}`}
    >
      <span className={`flex-shrink-0 mt-0.5 ${config.iconColor}`}>{config.icon}</span>
      <p className="text-sm text-zinc-200 flex-1">{toast.text}</p>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 p-0.5 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function getToastConfig(level: Toast['level']) {
  switch (level) {
    case 'success':
      return {
        icon: <CheckCircle className="w-4 h-4" />,
        iconColor: 'text-green-400',
        bg: 'bg-green-950/90',
        border: 'border-green-800/50',
      };
    case 'warning':
      return {
        icon: <AlertTriangle className="w-4 h-4" />,
        iconColor: 'text-yellow-400',
        bg: 'bg-yellow-950/90',
        border: 'border-yellow-800/50',
      };
    case 'error':
      return {
        icon: <XCircle className="w-4 h-4" />,
        iconColor: 'text-red-400',
        bg: 'bg-red-950/90',
        border: 'border-red-800/50',
      };
    case 'info':
    default:
      return {
        icon: <Info className="w-4 h-4" />,
        iconColor: 'text-blue-400',
        bg: 'bg-blue-950/90',
        border: 'border-blue-800/50',
      };
  }
}
