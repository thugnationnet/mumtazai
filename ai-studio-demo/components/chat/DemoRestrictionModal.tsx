'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';

interface DemoRestrictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  description: string;
  icon?: React.ReactNode;
}

export default function DemoRestrictionModal({
  isOpen,
  onClose,
  feature,
  description,
  icon,
}: DemoRestrictionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-purple-900/30 backdrop-blur-sm">
      <div className="rounded-2xl p-8 max-w-md w-full mx-4 border-2 border-white/60 shadow-2xl relative" style={{ background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(20px) saturate(150%)' }}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 transition-colors"
          title="Close"
          aria-label="Close modal"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <div className="text-center">
          {icon && (
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
              {icon}
            </div>
          )}

          <h2 className="text-2xl font-bold text-slate-800 mb-3">
            🚫 {feature}
          </h2>

          <p className="text-slate-600 mb-6 leading-relaxed">
            {description}
          </p>

          <p className="text-slate-600 mb-8">
            Visit{' '}
            <a
              href="https://www.mumtaz.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-500 underline font-semibold"
            >
              www.mumtaz.ai
            </a>{' '}
            and sign up for full access.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-white/60 text-slate-600 hover:bg-white/40 transition-all"
            >
              Got it
            </button>
            <a
              href="https://www.mumtaz.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all text-center shadow-lg shadow-purple-500/20"
            >
              Sign Up Free 🚀
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
