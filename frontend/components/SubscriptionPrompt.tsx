'use client';

import { useState } from 'react';
import Link from 'next/link';

interface SubscriptionPromptProps {
  agentName: string;
  agentSlug: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function SubscriptionPrompt({
  agentName,
  agentSlug,
  isOpen,
  onClose,
}: SubscriptionPromptProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-400 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card-dark max-w-lg w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-slate-900"
        >
          ✕
        </button>

        <div className="text-center mb-6">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold mb-3">
            Subscribe to Access {agentName}
          </h2>
          <p className="text-neutral-300">
            To chat with {agentName}, you need an active subscription. Choose
            from our simple pricing options.
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-neutral-800 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-bold text-lg">$1</span>
                <span className="text-neutral-400 ml-2">per day</span>
              </div>
              <span className="text-sm text-neutral-400">Daily</span>
            </div>
          </div>
          <div className="bg-neutral-800 rounded-lg p-4 ring-2 ring-blue-500">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-bold text-lg text-blue-400">$5</span>
                <span className="text-neutral-400 ml-2">per week</span>
              </div>
              <span className="text-sm bg-blue-500 text-slate-900 px-2 py-1 rounded">
                Popular
              </span>
            </div>
          </div>
          <div className="bg-neutral-800 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-bold text-lg">$15</span>
                <span className="text-neutral-400 ml-2">per month</span>
              </div>
              <span className="text-sm text-neutral-400">Best Value</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
          <p className="text-blue-200 text-sm">
            ✨ Each agent is a separate one-time purchase. Buy as many agents as
            you need!
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-6 bg-neutral-700 hover:bg-neutral-600 rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
          <Link
            href={`/subscribe?agent=${encodeURIComponent(
              agentName
            )}&slug=${agentSlug}`}
            className="flex-1 py-3 px-6 bg-blue-500 hover:bg-blue-600 text-center rounded-lg font-semibold transition-colors"
          >
            Choose Plan
          </Link>
        </div>
      </div>
    </div>
  );
}
