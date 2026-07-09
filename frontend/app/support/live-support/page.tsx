'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import {
  Send,
  Mic,
  Phone,
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
  AlertCircle,
  CheckCircle,
  Zap,
  Clock,
  Moon,
  Heart,
  Sparkles,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

// Luna's Avatar Component with breathing animation
const LunaAvatar = ({ size = 'md', isTyping = false, mood = 'happy' }: { size?: 'sm' | 'md' | 'lg', isTyping?: boolean, mood?: 'happy' | 'thinking' | 'concerned' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14'
  };
  
  const moodColors = {
    happy: 'from-purple-500 via-pink-500 to-rose-400',
    thinking: 'from-blue-500 via-indigo-500 to-purple-500',
    concerned: 'from-amber-400 via-orange-400 to-pink-400'
  };
  
  return (
    <div className="relative">
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${moodColors[mood]} p-0.5 ${isTyping ? 'animate-pulse' : ''}`}>
        <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center relative overflow-hidden">
          <Moon className="w-1/2 h-1/2 text-amber-200" />
          <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10"></div>
        </div>
      </div>
      {/* Online indicator */}
      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${isTyping ? 'bg-amber-400 animate-pulse' : 'bg-green-500'}`}></div>
      {/* Sparkle effect when typing */}
      {isTyping && (
        <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-amber-400 animate-ping" />
      )}
    </div>
  );
};

// Enhanced typing indicator with personality
const LunaTypingIndicator = () => {
  const [dots, setDots] = useState(1);
  const messages = [
    "Luna is thinking...",
    "Luna is crafting a response...",
    "Luna is here for you...",
    "Let me think about this...",
  ];
  const [message, setMessage] = useState(messages[0]);
  
  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots(d => d >= 3 ? 1 : d + 1);
    }, 500);
    
    const messageInterval = setInterval(() => {
      setMessage(messages[Math.floor(Math.random() * messages.length)]);
    }, 3000);
    
    return () => {
      clearInterval(dotInterval);
      clearInterval(messageInterval);
    };
  }, []);
  
  return (
    <div className="flex items-start gap-3">
      <LunaAvatar size="sm" isTyping={true} mood="thinking" />
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm max-w-xs">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className={`w-2 h-2 bg-indigo-400 rounded-full ${dots >= 1 ? 'opacity-100' : 'opacity-30'} transition-opacity`}></div>
            <div className={`w-2 h-2 bg-purple-400 rounded-full ${dots >= 2 ? 'opacity-100' : 'opacity-30'} transition-opacity`}></div>
            <div className={`w-2 h-2 bg-pink-400 rounded-full ${dots >= 3 ? 'opacity-100' : 'opacity-30'} transition-opacity`}></div>
          </div>
          <span className="text-xs text-indigo-600 italic">{message}</span>
        </div>
      </div>
    </div>
  );
};

// Get contextual greeting based on time
const getTimeBasedGreeting = (userName: string) => {
  const hour = new Date().getHours();
  const name = userName || 'there';
  
  if (hour >= 5 && hour < 12) {
    return `Good morning, ${name}! ☀️ I'm Luna, and I'm so happy you're here. How can I brighten your day?`;
  } else if (hour >= 12 && hour < 17) {
    return `Hey ${name}! 🌸 Luna here~ I hope your afternoon is going well. What brings you by today?`;
  } else if (hour >= 17 && hour < 21) {
    return `Good evening, ${name}! 🌙 I'm Luna. Winding down from the day? I'm here if you need anything!`;
  } else {
    return `Hey ${name}~ 🌙✨ Burning the midnight oil? I'm Luna, and I'm here with you. What can I help with tonight?`;
  }
};

// Social Media Icon component
const SocialIcon = ({ icon: Icon, href, label, color }: any) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={`p-3 rounded-lg transition-all duration-300 hover:scale-110 ${color}`}
    title={label}
    aria-label={label}
  >
    <Icon size={20} />
  </a>
);

// Support button component
const SupportButton = ({ icon: Icon, label, href, onClick }: any) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 text-gray-700 group"
  >
    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
      <Icon size={16} className="text-white" />
    </div>
    <span className="text-sm font-medium">{label}</span>
  </button>
);

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  subscription?: string;
  issue: string;
  status: 'open' | 'in-progress' | 'escalated' | 'resolved';
  createdAt: Date;
  messages: Message[];
}

const SOCIAL_LINKS = [
  {
    icon: Facebook,
    href: 'https://www.facebook.com/profile.php?id=61555473113271',
    label: 'Facebook',
    color: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  {
    icon: Instagram,
    href: 'https://instagram.com/onelastai',
    label: 'Instagram',
    color: 'bg-pink-600 hover:bg-pink-700 text-white',
  },
  {
    icon: Github,
    href: 'https://github.com/aidigitalfriend',
    label: 'GitHub',
    color: 'bg-gray-700 hover:bg-gray-800 text-white',
  },
  {
    icon: X,
    href: 'https://x.com/onelastai',
    label: 'X (Twitter)',
    color: 'bg-black hover:bg-gray-900 text-white',
  },
  {
    icon: MessageSquare,
    href: 'https://line.me/ti/p/@onelastai',
    label: 'LINE',
    color: 'bg-green-500 hover:bg-green-600 text-white',
  },
  {
    icon: MessageCircle,
    href: 'https://t.me/onelastai',
    label: 'Telegram',
    color: 'bg-cyan-500 hover:bg-cyan-600 text-white',
  },
  {
    icon: MessageCircle,
    href: 'https://tiktok.com/@onelastai',
    label: 'TikTok',
    color: 'bg-black hover:bg-gray-900 text-white',
  },
];

export default function LiveSupportPage() {
  const auth = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreamingResponse, setIsStreamingResponse] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(
    !auth.state.isAuthenticated
  );
  const [userProfile, setUserProfile] = useState<any>(null);
  const [supportTicket, setSupportTicket] = useState<SupportTicket | null>(
    null
  );
  const [ticketGenerated, setTicketGenerated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chatId, setChatId] = useState<string | null>(null);
  const [userContext, setUserContext] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 0);
  }, []);

  const fetchUserProfile = useCallback(async () => {
    try {
      const userId = auth.state.user?.id;
      if (!userId) {
        console.error('No user ID available');
        return;
      }

      // Fetch real user profile from backend - cookie auth
      const profileResponse = await fetch(`/api/user/profile`, {
        credentials: 'include',  // Required to send session_id cookie for auth
      });

      // Fetch real subscription data - cookie auth via credentials: include
      console.log('[Live Support] Fetching subscriptions for userId:', userId);
      const subscriptionResponse = await fetch(`/api/subscriptions/${userId}`, {
        credentials: 'include',  // Required to send session_id cookie for auth
      });

      let subscriptionStatus = 'Inactive';  // Default: no active subscriptions
      let activeSubCount = 0;
      let subscriptionDetails: any[] = [];

      console.log('[Live Support] Subscription API response status:', subscriptionResponse.status);
      
      if (subscriptionResponse.ok) {
        const subData = await subscriptionResponse.json();
        console.log('[Live Support] Subscription data:', subData);
        
        if (subData.subscriptions && subData.subscriptions.length > 0) {
          // Find active subscriptions (status active AND not expired)
          const activeSubs = subData.subscriptions.filter(
            (s: any) => s.status === 'active' && new Date(s.expiryDate) > new Date()
          );
          console.log('[Live Support] Active subs after filter:', activeSubs.length);
          activeSubCount = activeSubs.length;
          subscriptionDetails = activeSubs;
          
          if (activeSubCount > 0) {
            subscriptionStatus = 'Active';
          }
        }
      } else {
        console.error('[Live Support] Failed to fetch subscriptions:', subscriptionResponse.status);
      }

      // Set user profile with real data
      setUserProfile({
        name: auth.state.user?.name || 'User',
        email: auth.state.user?.email,
        subscription: subscriptionStatus,
        activeAgents: activeSubCount,
        subscriptionDetails,
        joinedDate: auth.state.user?.createdAt,
        supportTickets: 0,
      });
    } catch (error) {
      console.error('[Live Support] Error fetching user profile:', error);
      // Fallback to basic profile
      setUserProfile({
        name: auth.state.user?.name || 'User',
        email: auth.state.user?.email,
        subscription: 'Inactive',
        activeAgents: 0,
        subscriptionDetails: [],
        joinedDate: auth.state.user?.createdAt,
        supportTickets: 0,
      });
    }
  }, [auth.state.user?.id, auth.state.user?.name, auth.state.user?.email, auth.state.user?.createdAt, setUserProfile]);

  const initializeChat = useCallback(() => {
    const userName = auth.state.user?.name || 'lovely';
    const greeting = getTimeBasedGreeting(userName);
    const welcomeMessage: Message = {
      id: '0',
      role: 'assistant',
      content: greeting,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, [auth.state.user?.name, setMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Fetch user profile data when authenticated
  useEffect(() => {
    if (auth.state.isAuthenticated && auth.state.user) {
      setShowLoginPrompt(false);
      fetchUserProfile();
      initializeChat();
    } else {
      setShowLoginPrompt(true);
    }
  }, [auth.state.isAuthenticated, auth.state.user, fetchUserProfile, initializeChat]);


  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputText.trim()) return;
    if (!auth.state.isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setIsStreamingResponse(true);

    try {
      const response = await fetch('/api/live-support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputText,
          userId: auth.state.user?.id,
          userEmail: auth.state.user?.email,
          userName: auth.state.user?.name,
          chatId: chatId,
          conversationHistory: messages,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      let fullResponse = '';
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      // Streaming response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                // Handle context message (includes chatId)
                if (data.type === 'context' && data.chatId) {
                  setChatId(data.chatId);
                  if (data.userContext) {
                    setUserContext(data.userContext);
                  }
                }
                // Handle content chunks
                if (data.content) {
                  fullResponse += data.content;
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      ...updated[updated.length - 1],
                      content: fullResponse,
                    };
                    return updated;
                  });
                }
                // Handle done message
                if (data.type === 'done' && data.chatId) {
                  setChatId(data.chatId);
                }
                scrollToBottom();
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
      }

      // Check if response suggests escalation
      if (
        fullResponse.toLowerCase().includes('escalat') ||
        fullResponse.toLowerCase().includes('ticket')
      ) {
        setTicketGenerated(true);
      }

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].isStreaming = false;
        return updated;
      });
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content:
          '⚠️ Failed to get response. Please try again or contact support directly.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsStreamingResponse(false);
    }
  };

  const generateTicket = async () => {
    try {
      const issueDescription = messages
        .filter(m => m.role === 'user')
        .map(m => m.content)
        .join('\n\n');

      // Send to backend
      const response = await fetch('/api/live-support/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: chatId,
          userId: auth.state.user?.id,
          userEmail: auth.state.user?.email,
          userName: userProfile?.name || auth.state.user?.name,
          issue: issueDescription || 'Support request from live chat',
          messages: messages,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const ticket = data.ticket;
        
        setSupportTicket({
          id: ticket.ticketId,
          userId: auth.state.user?.id || '',
          userEmail: auth.state.user?.email || '',
          userName: userProfile?.name || '',
          subscription: userProfile?.subscription || 'Monthly',
          issue: issueDescription,
          status: 'open',
          createdAt: new Date(),
          messages: messages,
        });

        const ticketMessage: Message = {
          id: Date.now().toString(),
          role: 'system',
          content: `✅ Support ticket created!\n\n📋 Ticket Number: #${ticket.ticketNumber}\n📝 Ticket ID: ${ticket.ticketId}\n📊 Status: ${ticket.status}\n⏰ Expected Response: Within 48 hours\n\nOur human support team will review your case and contact you at ${auth.state.user?.email}. You can also view and track this ticket in your Dashboard > Support Tickets.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, ticketMessage]);
        setTicketGenerated(false);
      } else {
        throw new Error('Failed to create ticket');
      }
    } catch (error) {
      console.error('Error generating ticket:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'system',
        content: '⚠️ Failed to create support ticket. Please try again or contact us directly at support@onelastai.co',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const downloadChat = () => {
    const chatContent = messages
      .map(
        (m) =>
          `[${m.role.toUpperCase()}] ${m.timestamp.toLocaleTimeString()}\n${
            m.content
          }`
      )
      .join('\n\n');

    const element = document.createElement('a');
    element.setAttribute(
      'href',
      'data:text/plain;charset=utf-8,' + encodeURIComponent(chatContent)
    );
    element.setAttribute('download', `support-chat-${Date.now()}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const copyChat = () => {
    const chatContent = messages
      .map((m) => `[${m.role.toUpperCase()}] ${m.content}`)
      .join('\n\n');
    navigator.clipboard.writeText(chatContent);
  };

  if (showLoginPrompt && !auth.state.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl p-8 border border-purple-200 shadow-xl">
            <div className="mb-6">
              <LunaAvatar size="lg" mood="happy" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">Meet Luna 🌙</h1>
            <p className="text-gray-600 mb-8">
              Hi there! I'm Luna, your personal support companion. Sign in so I can get to know you better and help you with anything you need! 💕
            </p>

            <div className="space-y-3">
              <Link
                href="/auth/login"
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Heart size={18} />
                Sign In to Chat with Luna
              </Link>
              <p className="text-sm text-gray-500">
                Don't have an account?{' '}
                <Link
                  href="/auth/signup"
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  Join the family ✨
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/50 to-pink-50/50">
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
      <div className="flex h-screen overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <LunaAvatar size="md" isTyping={isStreamingResponse} mood={isStreamingResponse ? 'thinking' : 'happy'} />
              <div>
                <h1 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                  Luna
                  <span className="text-xs font-normal px-2 py-0.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-600 rounded-full">AI Companion</span>
                </h1>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  {isStreamingResponse ? 'Thinking of you...' : 'Here for you 💕'}
                </p>
              </div>
            </div>

            {userProfile && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-xl">
                <Heart size={14} className="text-pink-400" />
                <span className="text-sm text-gray-700">
                  <span className="text-gray-500">Welcome,</span>{' '}
                  <span className="font-medium text-purple-700">{userProfile.name}</span>
                </span>
              </div>
            )}
          </div>

          {/* Messages Container */}
          <div
            ref={messageContainerRef}
            className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-purple-50/30 via-transparent to-white/50"
          >
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                } animate-fade-in`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Luna's avatar for assistant messages */}
                {message.role === 'assistant' && (
                  <div className="mr-2 flex-shrink-0">
                    <LunaAvatar size="sm" mood="happy" />
                  </div>
                )}
                <div
                  className={`max-w-lg lg:max-w-xl px-4 py-3 rounded-2xl shadow-sm transition-all duration-300 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-sm'
                      : message.role === 'system'
                      ? 'bg-amber-50 border border-amber-200 text-amber-800'
                      : 'bg-gradient-to-r from-white to-purple-50/50 border border-purple-100 text-gray-800 rounded-bl-sm'
                  } ${message.isStreaming ? 'ring-2 ring-purple-300 ring-opacity-50' : ''}`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                    {message.content}
                  </p>
                  <p className={`text-xs mt-2 flex items-center gap-1 ${message.role === 'user' ? 'text-white/70' : 'text-gray-400'}`}>
                    {message.role === 'assistant' && <Moon size={10} className="text-purple-400" />}
                    {message.timestamp.toLocaleTimeString()}
                    {message.isStreaming && <span className="ml-1 text-purple-500">✨</span>}
                  </p>
                </div>
              </div>
            ))}

            {isStreamingResponse && messages[messages.length - 1]?.role !== 'assistant' && (
              <LunaTypingIndicator />
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-white/80 backdrop-blur-xl border-t border-purple-100 p-6">
            {ticketGenerated && (
              <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Heart size={18} className="text-purple-600" />
                  </div>
                  <span className="text-sm text-purple-800">
                    Luna thinks our human team should take a closer look at this for you 💕
                  </span>
                </div>
                <button
                  onClick={generateTicket}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg text-sm font-medium text-white transition-all shadow-lg shadow-purple-500/25"
                >
                  Create Ticket
                </button>
              </div>
            )}

            <form onSubmit={sendMessage} className="flex gap-3">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Talk to Luna... she's listening 💕"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-purple-50/50 to-pink-50/50 border border-purple-200 rounded-xl px-4 py-3 text-gray-900 placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent disabled:opacity-50 transition-all"
              />
              <button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className="px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-white group"
              >
                {isLoading ? (
                  <Loader size={18} className="animate-spin" />
                ) : (
                  <>
                    <Send size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Action Buttons */}
            <div className="mt-4 flex gap-2 flex-wrap">
              <button
                onClick={downloadChat}
                className="flex items-center gap-2 px-3 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg text-sm text-purple-700 transition-colors"
              >
                <DownloadCloud size={16} />
                Download
              </button>
              <button
                onClick={copyChat}
                className="flex items-center gap-2 px-3 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg text-sm text-purple-700 transition-colors"
              >
                <Copy size={16} />
                Copy
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-gradient-to-b from-white to-purple-50/30 border-l border-purple-100 p-6 overflow-y-auto hidden lg:block">
          {/* Luna's Introduction */}
          <div className="mb-6 p-4 bg-gradient-to-br from-purple-100 via-pink-50 to-indigo-100 rounded-2xl border border-purple-200 text-center">
            <LunaAvatar size="lg" mood="happy" />
            <h3 className="font-bold text-lg text-gray-900 mt-3">Hi, I'm Luna! 🌙</h3>
            <p className="text-sm text-gray-600 mt-1">
              Your personal support companion. I'm here to help with anything about One Last AI!
            </p>
            <div className="flex justify-center gap-2 mt-3">
              <span className="px-2 py-1 bg-white/70 rounded-full text-xs text-purple-600">💕 Caring</span>
              <span className="px-2 py-1 bg-white/70 rounded-full text-xs text-pink-600">✨ Helpful</span>
              <span className="px-2 py-1 bg-white/70 rounded-full text-xs text-indigo-600">🌙 24/7</span>
            </div>
          </div>
          
          {/* User Profile Section */}
          {userProfile && (
            <div className="mb-8 p-4 bg-white rounded-xl border border-purple-100 shadow-sm">
              <h3 className="font-bold mb-3 text-sm uppercase text-purple-500 flex items-center gap-2">
                <Heart size={14} />
                Your Profile
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Name:</span>
                  <p className="text-gray-900 font-medium">{userProfile.name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Email:</span>
                  <p className="text-gray-900 font-medium">{userProfile.email}</p>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <p className="text-gray-900 font-medium flex items-center gap-2">
                    {userProfile.subscription === 'Active' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 text-xs font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                        Inactive
                      </span>
                    )}
                    {userProfile.activeAgents > 0 && (
                      <span className="text-xs text-gray-500">
                        ({userProfile.activeAgents} agent{userProfile.activeAgents > 1 ? 's' : ''})
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Member Since:</span>
                  <p className="text-gray-900 font-medium">
                    {new Date(userProfile.joinedDate).toLocaleDateString()}
                  </p>
                </div>
                {userProfile.subscription === 'Inactive' && (
                  <div className="pt-2 mt-2 border-t border-purple-100">
                    <Link
                      href="/overview/pricing"
                      className="block w-full text-center px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg text-sm font-medium text-white transition-all shadow-lg shadow-purple-500/25"
                    >
                      Browse Agents ✨
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Support Ticket Info */}
          {supportTicket && (
            <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle size={16} className="text-green-600" />
                </div>
                <h3 className="font-bold text-sm uppercase text-green-800">
                  Ticket Generated
                </h3>
              </div>
              <p className="text-sm text-green-700 mb-2">Ticket ID:</p>
              <p className="font-mono text-xs bg-white border border-green-200 p-2 rounded-lg mb-3 break-all text-gray-800">
                {supportTicket.id}
              </p>
              <p className="text-xs text-green-600 mb-3">
                Our human support team will contact you within 48 hours.
              </p>
              <Link
                href="/dashboard/support-tickets"
                className="block w-full text-center px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg text-sm font-medium text-white transition-all shadow-lg shadow-green-500/25"
              >
                View My Tickets
              </Link>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mb-8">
            <h3 className="font-bold mb-3 text-sm uppercase text-gray-500">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <SupportButton
                icon={Mail}
                label="Contact Us"
                href="/support/contact-us"
                onClick={() => (window.location.href = '/support/contact-us')}
              />
              <SupportButton
                icon={HelpCircle}
                label="Help Center"
                href="/support/help-center"
                onClick={() => (window.location.href = '/support/help-center')}
              />
              <SupportButton
                icon={MessageCircle}
                label="Support Page"
                href="/support"
                onClick={() => (window.location.href = '/support')}
              />
              <SupportButton
                icon={Users}
                label="Community"
                href="/community"
                onClick={() => (window.location.href = '/community')}
              />
            </div>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="font-bold mb-3 text-sm uppercase text-gray-500">
              Follow Us
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {SOCIAL_LINKS.map((social) => (
                <SocialIcon
                  key={social.label}
                  icon={social.icon}
                  href={social.href}
                  label={social.label}
                  color={social.color}
                />
              ))}
            </div>
          </div>

          {/* Support Hours */}
          <div className="mt-8 p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <Moon size={16} className="text-purple-600" />
              </div>
              <h3 className="font-bold text-sm text-gray-900">Always Here For You</h3>
            </div>
            <p className="text-xs text-gray-600">
              Luna is available 24/7 💕 Our human team is here Monday-Friday, 9AM-6PM EST
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
