'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '@/contexts/AuthContext';
import {
  Send,
  MessageCircle,
  HelpCircle,
  Users,
  Mail,
  Facebook,
  Instagram,
  Github,
  X,
  MessageSquare,
  Copy,
  DownloadCloud,
  Loader,
  CheckCircle,
  Clock,
  Moon,
  Sparkles,
  ChevronDown,
  AlertTriangle,
  ArrowRight,
  Star,
  FileText,
  RefreshCw,
  Ticket,
  CreditCard,
  User,
  Shield,
  PanelRightClose,
  PanelRightOpen,
  Search,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

// Luna Avatar
const LunaAvatar = ({ size = 'md', isTyping = false, mood = 'happy' }: {
  size?: 'sm' | 'md' | 'lg';
  isTyping?: boolean;
  mood?: 'happy' | 'thinking' | 'concerned';
}) => {
  const s = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-16 h-16' }[size];
  const ring = {
    happy: 'from-violet-500 to-fuchsia-500',
    thinking: 'from-blue-500 to-violet-500',
    concerned: 'from-amber-400 to-rose-400',
  }[mood];

  return (
    <div className="relative flex-shrink-0">
      <div className={`${s} rounded-full bg-gradient-to-br ${ring} p-[2px] ${isTyping ? 'animate-pulse' : ''}`}>
        <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-900 to-violet-950 flex items-center justify-center overflow-hidden">
          <Moon className="w-1/2 h-1/2 text-amber-200" />
        </div>
      </div>
      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${isTyping ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
    </div>
  );
};

// Typing indicator
const TypingIndicator = () => (
  <div className="flex items-start gap-2.5 animate-fade-in">
    <LunaAvatar size="sm" isTyping mood="thinking" />
    <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        <span className="text-xs text-gray-400 ml-2 italic">Luna is typing...</span>
      </div>
    </div>
  </div>
);

// Quick Suggestion Pills
const QuickSuggestions = ({ onSelect }: { onSelect: (s: string) => void }) => {
  const suggestions = [
    { icon: CreditCard, text: 'Billing & Payments' },
    { icon: User, text: 'Account Issues' },
    { icon: AlertTriangle, text: 'Report a Bug' },
    { icon: Star, text: 'Agent Recommendations' },
    { icon: Search, text: 'How to get started' },
    { icon: Shield, text: 'Refund Request' },
  ];
  return (
    <div className="flex flex-wrap gap-2 justify-center max-w-xl mx-auto">
      {suggestions.map((s) => (
        <button
          key={s.text}
          onClick={() => onSelect(s.text)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-sm text-gray-600 hover:border-violet-300 hover:text-violet-700 hover:bg-violet-50 transition-all duration-200 shadow-sm"
        >
          <s.icon size={14} />
          {s.text}
        </button>
      ))}
    </div>
  );
};

// Helpers
function getTimeGreeting(name: string) {
  const h = new Date().getHours();
  const n = name || 'there';
  if (h >= 5 && h < 12) return `Good morning, ${n}! I'm Luna \u2014 how can I help you today?`;
  if (h >= 12 && h < 17) return `Good afternoon, ${n}! I'm Luna, your support assistant. What can I do for you?`;
  if (h >= 17 && h < 21) return `Good evening, ${n}! I'm Luna \u2014 ready to help with anything you need.`;
  return `Hey ${n}! It's late but I'm here for you. I'm Luna \u2014 what do you need help with?`;
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Interfaces
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface TicketSummary {
  ticketId: string;
  ticketNumber: number;
  subject: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
}

const SOCIAL_LINKS = [
  { icon: Facebook, href: 'https://www.facebook.com/profile.php?id=61555473113271', label: 'Facebook' },
  { icon: Instagram, href: 'https://instagram.com/mumtazai', label: 'Instagram' },
  { icon: Github, href: 'https://github.com/aidigitalfriend', label: 'GitHub' },
  { icon: X, href: 'https://x.com/mumtazai', label: 'X' },
  { icon: MessageSquare, href: 'https://line.me/ti/p/@mumtazai', label: 'LINE' },
  { icon: MessageCircle, href: 'https://t.me/mumtazai', label: 'Telegram' },
];

// MAIN COMPONENT
export default function LiveSupportPage() {
  const auth = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [copied, setCopied] = useState(false);

  // Default sidebar open on desktop, closed on mobile
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    setSidebarOpen(mq.matches);
    const handler = (e: MediaQueryListEvent) => setSidebarOpen(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const [userProfile, setUserProfile] = useState<any>(null);
  const [userContext, setUserContext] = useState<any>(null);

  const [ticketSuggested, setTicketSuggested] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<TicketSummary | null>(null);
  const [previousTickets, setPreviousTickets] = useState<TicketSummary[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, []);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setShowScrollButton(!atBottom);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // Fetch profile
  const fetchUserProfile = useCallback(async () => {
    try {
      const userId = auth.state.user?.id;
      if (!userId) return;

      const [profileRes, subRes] = await Promise.all([
        fetch('/api/user/profile', { credentials: 'include' }),
        fetch(`/api/subscriptions/${userId}`, { credentials: 'include' }),
      ]);

      let subscriptions: any[] = [];
      let activeCount = 0;
      if (subRes.ok) {
        const subData = await subRes.json();
        if (subData.subscriptions?.length > 0) {
          subscriptions = subData.subscriptions.filter(
            (s: any) => s.status === 'active' && new Date(s.expiryDate) > new Date()
          );
          activeCount = subscriptions.length;
        }
      }

      setUserProfile({
        name: auth.state.user?.name || 'User',
        email: auth.state.user?.email,
        subscription: activeCount > 0 ? 'Active' : 'Free',
        activeAgents: activeCount,
        subscriptionDetails: subscriptions,
        joinedDate: auth.state.user?.createdAt,
      });
    } catch {
      setUserProfile({
        name: auth.state.user?.name || 'User',
        email: auth.state.user?.email,
        subscription: 'Free',
        activeAgents: 0,
        subscriptionDetails: [],
        joinedDate: auth.state.user?.createdAt,
      });
    }
  }, [auth.state.user]);

  // Fetch previous tickets
  const fetchTickets = useCallback(async () => {
    try {
      const userId = auth.state.user?.id;
      if (!userId) return;
      setTicketsLoading(true);
      const res = await fetch(`/api/live-support/tickets?userId=${encodeURIComponent(userId)}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setPreviousTickets(data.tickets?.slice(0, 5) || []);
      }
    } catch { /* silent */ } finally {
      setTicketsLoading(false);
    }
  }, [auth.state.user?.id]);

  // Initialize
  useEffect(() => {
    if (auth.state.isAuthenticated && auth.state.user) {
      fetchUserProfile();
      fetchTickets();
      const greeting = getTimeGreeting(auth.state.user?.name || '');
      setMessages([{
        id: '0',
        role: 'assistant',
        content: greeting,
        timestamp: new Date(),
      }]);
    }
  }, [auth.state.isAuthenticated, auth.state.user, fetchUserProfile, fetchTickets]);

  // Send message
  const sendMessage = async (text?: string) => {
    const msg = text || inputText.trim();
    if (!msg || isLoading) return;
    if (!auth.state.isAuthenticated) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: msg,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setIsStreaming(true);
    setTicketSuggested(false);

    try {
      const response = await fetch('/api/live-support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          userId: auth.state.user?.id,
          userEmail: auth.state.user?.email,
          userName: auth.state.user?.name,
          chatId,
          conversationHistory: messages.slice(-10),
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      let fullResponse = '';
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          for (const line of chunk.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'context') {
                if (data.chatId) setChatId(data.chatId);
                if (data.userContext) setUserContext(data.userContext);
              }
              if (data.content) {
                fullResponse += data.content;
                setMessages((prev) => {
                  const u = [...prev];
                  u[u.length - 1] = { ...u[u.length - 1], content: fullResponse };
                  return u;
                });
              }
              if (data.type === 'done' && data.chatId) setChatId(data.chatId);
            } catch { /* parse error */ }
          }
        }
      }

      if (/escalat|create.*ticket|human.*team|support.*team/i.test(fullResponse)) {
        setTicketSuggested(true);
      }

      setMessages((prev) => {
        const u = [...prev];
        u[u.length - 1] = { ...u[u.length - 1], isStreaming: false };
        return u;
      });
    } catch {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: 'Something went wrong. Please try again or email us at support@mumtaz.ai',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  };

  // Create ticket
  const createTicket = async () => {
    try {
      const issue = messages.filter((m) => m.role === 'user').map((m) => m.content).join('\n');
      const res = await fetch('/api/live-support/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          chatId,
          userId: auth.state.user?.id,
          userEmail: auth.state.user?.email,
          userName: auth.state.user?.name || userProfile?.name,
          subject: issue.slice(0, 80) || 'Support request from live chat',
          description: issue || 'Support request from live chat',
          category: 'general',
          priority: 'medium',
          messages,
        }),
      });

      if (!res.ok) throw new Error('Failed to create ticket');
      const data = await res.json();
      const ticket = data.ticket;
      setCreatedTicket(ticket);
      setTicketSuggested(false);

      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: 'system',
        content: `Ticket #${ticket.ticketNumber} created successfully! Our team will review and respond to ${auth.state.user?.email} within 24-48 hours. Track it from your dashboard.`,
        timestamp: new Date(),
      }]);

      fetchTickets();
    } catch {
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: 'system',
        content: 'Failed to create ticket. Please try again or email support@mumtaz.ai directly.',
        timestamp: new Date(),
      }]);
    }
  };

  // Utilities
  const downloadChat = () => {
    const text = messages.map((m) => `[${m.role.toUpperCase()} ${formatTime(m.timestamp)}]\n${m.content}`).join('\n\n---\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `luna-support-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const copyChat = async () => {
    const text = messages.map((m) => `[${m.role.toUpperCase()}] ${m.content}`).join('\n\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'open': return 'bg-blue-100 text-blue-700';
      case 'in_progress': return 'bg-amber-100 text-amber-700';
      case 'resolved': return 'bg-emerald-100 text-emerald-700';
      case 'closed': return 'bg-gray-100 text-gray-500';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // LOGIN PROMPT
  if (!auth.state.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 themed-section-bg">
        <div className="max-w-sm w-full">
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl border border-white/60 shadow-lg p-8 text-center">
            <div className="flex justify-center mb-5">
              <LunaAvatar size="lg" mood="happy" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Meet Luna</h1>
            <p className="text-gray-500 text-sm mb-6">
              Sign in to get personalized support. Luna will have full context of your account, subscriptions, and history.
            </p>
            <Link
              href="/auth/login"
              className="block w-full px-5 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/20 transition-all text-center"
            >
              Sign In
            </Link>
            <p className="text-xs text-gray-400 mt-4">
              No account?{' '}
              <Link href="/auth/signup" className="text-violet-600 hover:underline">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // MAIN CHAT UI
  return (
    <div className="h-[100dvh] flex overflow-hidden relative themed-section-bg">
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.25s ease-out forwards; }
      `}</style>

      {/* Mobile sidebar overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-300 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Chat Panel */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header */}
        <header className="bg-white/60 backdrop-blur-lg border-b border-white/60 px-3 sm:px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <LunaAvatar size="md" isTyping={isStreaming} mood={isStreaming ? 'thinking' : 'happy'} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-gray-900">Luna</h1>
                <span className="text-[10px] font-medium px-1.5 py-0.5 bg-violet-100 text-violet-600 rounded-full">AI Support</span>
              </div>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {isStreaming ? 'Responding...' : 'Online'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={downloadChat} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/50 transition-colors" title="Download chat">
              <DownloadCloud size={18} />
            </button>
            <button onClick={copyChat} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/50 transition-colors" title="Copy chat">
              {copied ? <CheckCircle size={18} className="text-emerald-500" /> : <Copy size={18} />}
            </button>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/50 transition-colors" title="Toggle sidebar">
              {sidebarOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
            </button>
          </div>
        </header>

        {/* Messages */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-6 space-y-4"
        >
          {messages.length <= 1 && (
            <div className="text-center pt-8 pb-6 animate-fade-in">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <LunaAvatar size="lg" mood="happy" />
                  <Sparkles className="absolute -top-1 -right-2 w-5 h-5 text-amber-400" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">How can I help you today?</h2>
              <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                I have access to your account details, subscriptions, and support history for personalized help.
              </p>
              <QuickSuggestions onSelect={(s) => sendMessage(s)} />
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              {message.role === 'assistant' && (
                <div className="mr-2 mt-1 flex-shrink-0">
                  <LunaAvatar size="sm" mood="happy" />
                </div>
              )}
              <div className={`max-w-[75%] lg:max-w-xl ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-2xl rounded-br-md shadow-md shadow-violet-500/10'
                  : message.role === 'system'
                  ? 'bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl'
                  : 'bg-white/60 backdrop-blur-sm border border-white/60 text-gray-800 rounded-2xl rounded-bl-md shadow-sm'
              } px-4 py-3 ${message.isStreaming ? 'ring-2 ring-violet-200' : ''}`}>
                <div className={`text-sm break-words leading-relaxed prose prose-sm max-w-none ${message.role === 'user' ? 'prose-invert' : ''}`}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                      a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="noopener noreferrer" className={`underline underline-offset-2 ${message.role === 'user' ? 'text-white/90 hover:text-slate-900' : 'text-violet-600 hover:text-violet-800'}`}>
                          {children}
                        </a>
                      ),
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      em: ({ children }) => <em>{children}</em>,
                      ul: ({ children }) => <ul className="list-disc pl-4 mb-1.5 space-y-0.5">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 mb-1.5 space-y-0.5">{children}</ol>,
                      li: ({ children }) => <li className="text-sm">{children}</li>,
                      code: ({ children }) => <code className="px-1 py-0.5 bg-black/10 rounded text-xs font-mono">{children}</code>,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
                <p className={`text-[10px] mt-1.5 ${message.role === 'user' ? 'text-white/60' : 'text-gray-400'}`}>
                  {formatTime(message.timestamp)}
                  {message.isStreaming && <span className="ml-1 inline-block w-1 h-3 bg-violet-500 animate-pulse rounded-sm" />}
                </p>
              </div>
            </div>
          ))}

          {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to bottom */}
        {showScrollButton && (
          <div className="sticky bottom-24 flex justify-center z-10 pointer-events-none">
          <div className="pointer-events-auto">
            <button
              onClick={scrollToBottom}
              className="flex items-center gap-1 px-3 py-1.5 bg-white/60 backdrop-blur-sm border border-white/60 rounded-full shadow-lg text-xs text-gray-600 hover:bg-white/80 transition-all"
            >
              <ChevronDown size={14} /> New messages
            </button>
          </div>
          </div>
        )}

        {/* Ticket suggestion banner */}
        {ticketSuggested && !createdTicket && (
          <div className="mx-4 sm:mx-6 mb-2 p-3 bg-violet-50 border border-violet-200 rounded-xl flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <Ticket size={18} className="text-violet-600" />
              <span className="text-sm text-violet-800">Want to escalate this to our human support team?</span>
            </div>
            <button onClick={createTicket} className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 rounded-lg text-sm font-medium text-white transition-colors">
              Create Ticket
            </button>
          </div>
        )}

        {/* Input */}
        <div className="bg-white/60 backdrop-blur-lg border-t border-white/60 px-4 sm:px-6 py-4 flex-shrink-0">
          <div className="flex gap-2 items-end">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent disabled:opacity-50 transition-all"
            />
            <button
              onClick={() => sendMessage()}
              disabled={isLoading || !inputText.trim()}
              className="px-4 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md shadow-violet-500/20"
            >
              {isLoading ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 text-center">
            Luna has access to your account info for personalized support. Press Enter to send.
          </p>
        </div>
      </div>

      {/* Right Sidebar */}
      <aside className={`${
        sidebarOpen
          ? 'fixed right-0 top-0 bottom-0 w-[300px] sm:w-80 z-50 lg:z-auto lg:relative lg:w-80'
          : 'w-0 border-l-0'
      } transition-all duration-300 overflow-hidden border-l border-white/60 bg-white/60 backdrop-blur-lg flex-shrink-0`}>
        <div className="w-[300px] sm:w-80 h-full flex flex-col overscroll-contain">
          {/* Close button — mobile only */}
          <div className="flex justify-end lg:hidden px-3 pt-2">
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/50 transition-colors"
            >
              <PanelRightClose size={18} />
            </button>
          </div>

          {/* User Card — compact, fixed at top */}
          {userProfile && (
            <div className="flex-shrink-0 px-4 pt-3 pb-2">
              <div className="bg-white/30 backdrop-blur-sm border border-white/50 rounded-xl p-3">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold text-xs flex-shrink-0 flex items-center justify-center">
                    {(userProfile.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-xs truncate">{userProfile.name}</p>
                    <p className="text-[11px] text-gray-500 truncate">{userProfile.email}</p>
                  </div>
                </div>
                <div className="flex gap-1.5 text-[11px]">
                  <div className="bg-white/50 backdrop-blur-sm rounded-md px-2 py-1 flex-1">
                    <span className="text-gray-400">Plan </span>
                    <span className="font-semibold text-gray-800">{userProfile.subscription}</span>
                  </div>
                  <div className="bg-white/50 backdrop-blur-sm rounded-md px-2 py-1 flex-1">
                    <span className="text-gray-400">Agents </span>
                    <span className="font-semibold text-gray-800">{userProfile.activeAgents}</span>
                  </div>
                  <div className="bg-white/50 backdrop-blur-sm rounded-md px-2 py-1 flex-1">
                    <span className="text-gray-400">Since </span>
                    <span className="font-semibold text-gray-800">
                      {userProfile.joinedDate ? new Date(userProfile.joinedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '\u2014'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Scrollable middle area */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-2 space-y-3">

          {/* Active Subscriptions */}
          {userProfile?.subscriptionDetails?.length > 0 && (
            <div>
              <p className="text-[10px] uppercase font-semibold text-violet-500 mb-1">Active Subscriptions</p>
              <div className="space-y-1">
                {userProfile.subscriptionDetails.map((sub: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-purple-50/60 backdrop-blur-sm rounded-md px-2 py-1 border border-purple-100/60">
                    <span className="text-gray-700 font-medium truncate">{sub.agentName || sub.agentId}</span>
                    <span className="text-gray-400">{sub.plan}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Created Ticket */}
          {createdTicket && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle size={14} className="text-emerald-600" />
                <h3 className="font-semibold text-xs text-emerald-800">Ticket #{createdTicket.ticketNumber}</h3>
                <span className="text-[10px] text-emerald-600 ml-auto">{createdTicket.status} · {createdTicket.priority}</span>
              </div>
              <Link
                href="/dashboard/support-tickets"
                className="flex items-center justify-center gap-1 w-full px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-md text-[11px] font-medium text-white transition-colors"
              >
                View My Tickets <ArrowRight size={11} />
              </Link>
            </div>
          )}

          {/* Previous Tickets */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[10px] font-semibold uppercase text-gray-400">Recent Tickets</h3>
              <button onClick={fetchTickets} disabled={ticketsLoading} className="p-1 rounded hover:bg-white/50 text-gray-400 transition-colors">
                <RefreshCw size={12} className={ticketsLoading ? 'animate-spin' : ''} />
              </button>
            </div>
            {previousTickets.length > 0 ? (
              <div className="space-y-1">
                {previousTickets.map((t) => (
                  <div key={t.ticketId} className="p-2 bg-white/40 backdrop-blur-sm rounded-md border border-white/60 hover:border-purple-200 transition-colors">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-[11px] font-medium text-gray-800 truncate">{t.subject}</p>
                      <span className={`text-[9px] font-medium px-1 py-0.5 rounded-full whitespace-nowrap ${statusColor(t.status)}`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400">
                      #{t.ticketNumber} · {new Date(t.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-gray-400 text-center py-2">No tickets yet</p>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-semibold uppercase text-gray-400 mb-1">Quick Links</h3>
            <div className="space-y-0.5">
              {[
                { icon: Mail, label: 'Contact Us', href: '/support/contact-us' },
                { icon: HelpCircle, label: 'Help Center', href: '/support/help-center' },
                { icon: Users, label: 'Community', href: '/community' },
                { icon: FileText, label: 'My Tickets', href: '/dashboard/support-tickets' },
              ].map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-gray-600 hover:bg-white/50 hover:text-gray-900 transition-colors group"
                >
                  <link.icon size={14} className="text-gray-400 group-hover:text-violet-500 transition-colors" />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-xs font-semibold uppercase text-gray-400 mb-1">Connect With Us</h3>
            <div className="flex gap-1.5 flex-wrap">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-white/40 hover:bg-white/60 text-gray-500 hover:text-gray-700 transition-colors"
                  title={s.label}
                >
                  <s.icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Support Hours */}
          <div className="bg-white/40 backdrop-blur-sm rounded-lg p-3 border border-white/60">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={12} className="text-violet-500" />
              <h3 className="text-[11px] font-semibold text-gray-700">Support Hours</h3>
            </div>
            <p className="text-[11px] text-gray-500">
              Luna <span className="font-medium text-gray-700">24/7</span> · Human: Mon-Fri 9AM-6PM EST
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">support@mumtaz.ai</p>
          </div>

          </div>{/* end scrollable middle */}
        </div>
      </aside>
    </div>
  );
}
