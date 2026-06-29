'use client';

import dynamic from 'next/dynamic';
import './neural-chat.css';

// Dynamic import to avoid SSR issues with browser-only APIs (SpeechRecognition, AudioContext, localStorage)
const NeuralChatApp = dynamic(
  () => import('@/components/universal-chat/App'),
  { 
    ssr: false,
    loading: () => (
      <div className="matrix-bg h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <p className="text-gray-500 text-sm font-mono uppercase tracking-widest">Initializing Neural Link...</p>
        </div>
      </div>
    )
  }
);

export default function NeuralChatPage() {
  return <NeuralChatApp />;
}
