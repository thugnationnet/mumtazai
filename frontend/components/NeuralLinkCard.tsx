'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { openNeuralLink, getMaulaUrl } from '@/lib/crossDomainAuth';
import { Zap, ExternalLink, Loader2, Brain, Cpu, Sparkles } from 'lucide-react';

interface NeuralLinkCardProps {
  variant?: 'full' | 'compact' | 'minimal';
  className?: string;
}

export default function NeuralLinkCard({ variant = 'full', className = '' }: NeuralLinkCardProps) {
  const { state } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLaunch = async () => {
    if (!state.user?.id) {
      // Redirect to login if not authenticated
      window.location.href = '/login?redirect=neural-link';
      return;
    }

    setIsLoading(true);
    try {
      const success = await openNeuralLink(state.user.id);
      if (!success) {
        // Fallback: open without auth (will require login on subdomain)
        window.open(getMaulaUrl(), '_blank');
      }
    } catch (error) {
      console.error('Failed to launch Neural Link:', error);
      window.open(getMaulaUrl(), '_blank');
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === 'minimal') {
    return (
      <button
        onClick={handleLaunch}
        disabled={isLoading}
        className={`flex items-center gap-2 px-4 py-2 glass-card 
                   text-slate-900 rounded-lg hover:from-cyan-600 hover:to-purple-700 
                   transition-all disabled:opacity-50 ${className}`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Brain className="w-4 h-4" />
        )}
        Neural Link
        <ExternalLink className="w-3 h-3 opacity-70" />
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`glass-card 
                       rounded-xl p-4 border border-purple-500/30 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg neu-icon">
              <Brain className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Neural Link</h3>
              <p className="text-xs text-gray-400">Multi-Provider AI Platform</p>
            </div>
          </div>
          <button
            onClick={handleLaunch}
            disabled={isLoading}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-slate-900 text-sm 
                       rounded-lg transition-colors flex items-center gap-1.5"
          >
            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Launch'}
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div className={`relative overflow-hidden glass-card 
                     rounded-2xl border border-purple-500/30 shadow-xl ${className}`}>
      {/* Animated background effect */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full 
                        bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] 
                        from-cyan-500/20 via-transparent to-transparent" />
        <div className="absolute bottom-0 right-0 w-full h-full 
                        bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] 
                        from-purple-500/20 via-transparent to-transparent" />
      </div>

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl neu-icon">
              <Brain className="w-8 h-8 text-slate-900" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                Neural Link
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-cyan-500/20 text-cyan-400 rounded-full border border-cyan-500/30">
                  BETA
                </span>
              </h3>
              <p className="text-sm text-gray-400">maula.mumtaz.ai</p>
            </div>
          </div>
          <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
        </div>

        {/* Description */}
        <p className="text-gray-300 mb-4 text-sm leading-relaxed">
          Multi-provider AI chat platform with unified credits. Access Anthropic, OpenAI, 
          Gemini, Mistral, xAI, Groq & Cerebras through one interface.
        </p>

        {/* Features */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          {[
            { icon: Cpu, label: '7 AI Providers' },
            { icon: Zap, label: 'Real-time Voice' },
            { icon: Brain, label: 'Neural Canvas' },
            { icon: Sparkles, label: 'Credits System' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-xs text-gray-400">
              <Icon className="w-3.5 h-3.5 text-purple-400" />
              {label}
            </div>
          ))}
        </div>

        {/* Launch Button */}
        <button
          onClick={handleLaunch}
          disabled={isLoading}
          className="w-full py-3 px-4 glass-card 
                     hover:from-cyan-600 hover:to-purple-700
                     text-slate-900 font-semibold rounded-xl 
                     transition-all duration-200 transform hover:scale-[1.02]
                     shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                     flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              Launch Neural Link
              <ExternalLink className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Footer note */}
        <p className="text-center text-[10px] text-gray-500 mt-3">
          Opens in new tab • Separate billing & credits
        </p>
      </div>
    </div>
  );
}
