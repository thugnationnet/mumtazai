'use client';

import React from 'react';
import { PhoneXMarkIcon } from '@heroicons/react/24/outline';

interface RealtimeVoiceChatProps {
  isOpen: boolean;
  onClose: () => void;
  agentName: string;
  agentId?: string;
  agentIcon?: string;
  systemPrompt?: string;
}

export default function RealtimeVoiceChat({
  isOpen,
  onClose,
  agentName,
  agentIcon,
}: RealtimeVoiceChatProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-purple-900/30 backdrop-blur-sm">
      <div className="rounded-2xl p-8 max-w-md w-full mx-4 text-center border-2 border-white/60" style={{ background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(20px) saturate(150%)' }}>
        {/* Agent Icon */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center mx-auto mb-4 text-4xl">
          {agentIcon || '🤖'}
        </div>
        
        <h2 className="text-xl font-bold text-slate-800 mb-2">{agentName}</h2>
        
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-amber-700 font-medium mb-1">🔇 Voice Chat Unavailable</p>
          <p className="text-slate-600 text-sm">
            Live voice communication is not available in the demo version.
            Sign up at{' '}
            <a href="https://onelastai.co" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
              onelastai.co
            </a>{' '}
            for full voice chat access.
          </p>
        </div>

        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
        >
          <PhoneXMarkIcon className="w-5 h-5" />
          Close
        </button>
      </div>
    </div>
  );
}
