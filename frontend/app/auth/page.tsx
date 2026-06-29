'use client';

import Link from 'next/link';
import {
  UserIcon,
  LockClosedIcon,
  ArrowRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

export default function AuthPage() {
  return (
    <div className="min-h-full themed-section-bg">
      {/* Hero Section - Glass Pillar Glassmorphism */}
      <section className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        {/* Glass pillar/ribbon decorations */}
        <div className="absolute -top-20 -left-10 w-[200px] h-[600px] rotate-[25deg] rounded-[100px] bg-gradient-to-b from-white/60 via-purple-300/30 to-transparent backdrop-blur-sm border border-white/40" />
        <div className="absolute -top-32 right-[10%] w-[180px] h-[700px] rotate-[-20deg] rounded-[100px] bg-gradient-to-b from-transparent via-violet-400/25 to-white/50 backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-40 left-[30%] w-[160px] h-[500px] rotate-[35deg] rounded-[100px] bg-gradient-to-t from-white/50 via-fuchsia-300/20 to-transparent backdrop-blur-sm border border-white/30" />
        <div className="absolute -bottom-20 -right-10 w-[220px] h-[550px] rotate-[-30deg] rounded-[100px] bg-gradient-to-t from-transparent via-indigo-300/25 to-white/60 backdrop-blur-sm border border-white/40" />
        <div className="absolute top-[10%] left-[45%] w-[120px] h-[400px] rotate-[15deg] rounded-[80px] bg-gradient-to-b from-white/40 via-purple-200/20 to-white/30 backdrop-blur-sm border border-white/25" />
        {/* Chrome shine sweep */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10 text-center px-4">
          <div className="bg-white/30 backdrop-blur-2xl border border-white/50 rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-500/10 border border-purple-300/40 rounded-full text-purple-700 text-xs font-bold uppercase tracking-wider mb-5">
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              Mumtaz AI Platform
            </div>
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-white/40 border border-white/60 rounded-2xl shadow-lg">
                <SparklesIcon className="w-10 h-10 text-purple-600" />
              </div>
            </div>
            <h1 className="text-3xl md:text-5xl font-black mb-4 bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent leading-tight">
              Welcome to AI Agents
            </h1>
            <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Join our platform to access powerful AI agents, save your
              conversations, and unlock personalized experiences tailored just
              for you.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">

          {/* Authentication Options */}
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto mb-12">
            {/* Sign Up Card */}
            <div className="relative glass-card p-8 hover:shadow-[0_12px_50px_rgba(139,92,246,0.15)] transition-all duration-300 hover:-translate-y-1">
              <div className="flex justify-center mb-6">
                <div className="p-3 bg-white/40 border border-white/60 rounded-2xl shadow-lg">
                  <UserIcon className="w-8 h-8 text-purple-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4">
                Create Account
              </h2>
              <p className="text-slate-400 mb-6">
                New to our platform? Sign up to start your AI journey with
                personalized agents and saved conversations.
              </p>
              <Link
                href="/auth/signup"
                className="group w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all duration-300 hover:scale-105"
              >
                Get Started
                <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <p className="text-sm text-slate-400 mt-4">
                Paid per-agent access • Starting at $5/day
              </p>
            </div>

            {/* Login Card */}
            <div className="relative glass-card p-8 hover:shadow-[0_12px_50px_rgba(139,92,246,0.15)] transition-all duration-300 hover:-translate-y-1">
              <div className="flex justify-center mb-6">
                <div className="p-3 bg-white/40 border border-white/60 rounded-2xl shadow-lg">
                  <LockClosedIcon className="w-8 h-8 text-indigo-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-4">
                Welcome Back
              </h2>
              <p className="text-slate-400 mb-6">
                Already have an account? Sign in to continue your conversations
                and access your personalized AI agents.
              </p>
              <Link
                href="/auth/login"
                className="group w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all duration-300 hover:scale-105"
              >
                Sign In
                <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <p className="text-sm text-slate-400 mt-4">Secure • Fast • Easy</p>
            </div>
          </div>

          {/* Features Preview */}
          <div className="relative glass-card p-8 mb-8">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent mb-6">
              What you'll get with an account
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100/70 border border-blue-200/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💬</span>
                </div>
                <h4 className="font-semibold text-slate-700 mb-2">
                  Saved Conversations
                </h4>
                <p className="text-sm text-slate-400">
                  Your chat history persists across sessions
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100/70 border border-purple-200/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🤖</span>
                </div>
                <h4 className="font-semibold text-slate-700 mb-2">
                  18 AI Agents
                </h4>
                <p className="text-sm text-slate-400">
                  Access to all specialized AI assistants
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100/70 border border-green-200/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚡</span>
                </div>
                <h4 className="font-semibold text-slate-700 mb-2">
                  Personalized Experience
                </h4>
                <p className="text-sm text-slate-400">
                  Tailored recommendations and preferences
                </p>
              </div>
            </div>
          </div>

          {/* Additional Links */}
          <div className="text-center space-x-6">
            <Link
              href="/auth/reset-password"
              className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Forgot Password?
            </Link>
            <span className="text-slate-300">•</span>
            <Link
              href="/legal"
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              Terms & Privacy
            </Link>
            <span className="text-slate-300">•</span>
            <Link
              href="/support"
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              Need Help?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
