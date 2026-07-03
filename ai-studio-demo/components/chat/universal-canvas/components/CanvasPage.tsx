'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
// AI provider is hardcoded to Mistral — no user selection needed
import {
  useCanvasProjects,
  type CanvasProject,
} from '../hooks/useCanvasProjects';
import { useDeployment } from '../hooks/useDeployment';
import { useCanvasAgent } from '../hooks/useCanvasAgent';
import { useEditorBridge } from '../hooks/useEditorBridge';
import { useEditorStateSync } from '../hooks/useEditorStateSync';
import { useAuth } from '@/contexts/AuthContext';
// Subscription check removed — provider selection simplified
import ProjectFileTree from './ProjectFileTree';
import DeploymentPanel from './DeploymentPanel';
import DeployCredentialsPanel from './DeployCredentialsPanel';
import SearchPanel from './SearchPanel';
import DiffViewer from './DiffViewer';
import TerminalPanel from './TerminalPanel';
import ApprovalModal from './ApprovalModal';
import ToastContainer from './ToastContainer';
import type {
  ProjectFile,
  ProjectPage,
} from '../types/canvas-types';
import {
  getMonacoLanguage,
  FILE_ICONS,
} from '../types/canvas-types';
import {
  XMarkIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  ArrowDownTrayIcon,
  DocumentDuplicateIcon,
  ArrowTopRightOnSquareIcon,
  DevicePhoneMobileIcon,
  DeviceTabletIcon,
  ComputerDesktopIcon,
  FolderIcon,
  DocumentIcon,
  PhotoIcon,
  ArrowUpTrayIcon,
  XCircleIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  CodeBracketIcon,
  EyeIcon,
  ChevronDownIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  EllipsisHorizontalIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  Squares2X2Icon,
  RectangleGroupIcon,
  RocketLaunchIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';

// Lazy load Monaco Editor with proper error handling
const MonacoEditor = dynamic(
  () =>
    import('@monaco-editor/react').then((mod) => {
      // Configure loader after module loads
      mod.loader.config({
        paths: {
          vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs',
        },
      });
      return mod.default;
    }),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center h-full bg-[#0a0a0f]">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm text-gray-400">Loading code editor...</p>
      </div>
    ),
  }
);

// =============================================================================
// MARKDOWN RENDERER
// =============================================================================

const renderMarkdown = (text: string): string => {
  if (!text) return '';
  return (
    text
      // Bold: **text** or __text__
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      // Italic: *text* or _text_
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/_([^_]+)_/g, '<em>$1</em>')
      // Code: `text`
      .replace(
        /`([^`]+)`/g,
        '<code class="bg-slate-200 dark:bg-white/10 px-1 py-0.5 rounded text-cyan-300">$1</code>'
      )
      // Links: [text](url)
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" class="text-cyan-400 underline" target="_blank">$1</a>'
      )
      // Line breaks
      .replace(/\n/g, '<br />')
  );
};

// HTML extraction now handled by useCanvasAgent hook's processAgentResponse()

// =============================================================================
// TYPES
// =============================================================================

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: FileAttachment[];
  isStreaming?: boolean;
}

interface FileAttachment {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
}

// GeneratedFile is now ProjectFile from canvas-types.ts

interface HistoryEntry {
  id: string;
  name: string;
  prompt: string;
  code: string;
  timestamp: number;
}

interface CanvasModeProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly theme?: 'default' | 'neural';
  readonly agentId?: string;
  readonly agentName?: string;
}

// =============================================================================
// TEMPLATES (Quick prompts for AI generation)
// =============================================================================

const TEMPLATES = [
  {
    id: 't1',
    name: 'SaaS Landing',
    category: 'Landing',
    icon: '🚀',
    prompt:
      'Create a modern SaaS landing page with hero section, features grid, pricing cards, testimonials, and CTA. Use gradient backgrounds and smooth animations.',
  },
  {
    id: 't2',
    name: 'Portfolio',
    category: 'Landing',
    icon: '👨‍💼',
    prompt:
      'Build a creative portfolio website with about section, project gallery with hover effects, skills section, and contact form. Modern dark theme.',
  },
  {
    id: 't3',
    name: 'Analytics Dashboard',
    category: 'Dashboard',
    icon: '📊',
    prompt:
      'Create an analytics dashboard with stats cards, line chart placeholder, bar chart, recent activity list, and sidebar navigation. Dark theme.',
  },
  {
    id: 't4',
    name: 'Admin Panel',
    category: 'Dashboard',
    icon: '⚙️',
    prompt:
      'Build an admin panel with user management table, search/filter, pagination, sidebar menu, and top navbar with notifications.',
  },
  {
    id: 't5',
    name: 'E-commerce Store',
    category: 'E-commerce',
    icon: '🛒',
    prompt:
      'Create an e-commerce product grid with filter sidebar, product cards with hover effects, cart icon, and sorting dropdown.',
  },
  {
    id: 't6',
    name: 'Product Page',
    category: 'E-commerce',
    icon: '📦',
    prompt:
      'Build a product detail page with image gallery, size/color selectors, add to cart button, reviews section, and related products.',
  },
  {
    id: 't7',
    name: 'Login Form',
    category: 'Components',
    icon: '🔐',
    prompt:
      'Create a beautiful login/signup form with social login buttons, input validation styling, and forgot password link. Glassmorphism style.',
  },
  {
    id: 't8',
    name: 'Pricing Table',
    category: 'Components',
    icon: '💎',
    prompt:
      'Build a 3-tier pricing table with feature comparison, popular badge, monthly/yearly toggle, and CTA buttons.',
  },
  {
    id: 't9',
    name: 'Contact Form',
    category: 'Components',
    icon: '✉️',
    prompt:
      'Design a contact form with name, email, subject, message fields, and submit button. Include form validation styling.',
  },
  {
    id: 't10',
    name: 'Blog Layout',
    category: 'Creative',
    icon: '📝',
    prompt:
      'Create a blog homepage with featured post hero, recent articles grid, categories sidebar, and newsletter signup.',
  },
  {
    id: 't11',
    name: 'Event Page',
    category: 'Creative',
    icon: '🎉',
    prompt:
      'Design an event landing page with countdown timer, speaker profiles, schedule timeline, and ticket purchase section.',
  },
  {
    id: 't12',
    name: 'Restaurant',
    category: 'Creative',
    icon: '🍽️',
    prompt:
      'Create a restaurant website with hero image, menu sections, reservation form, gallery, and location map placeholder.',
  },
];

// =============================================================================
// BUILT-IN TEMPLATES (Ready-to-use HTML templates - no AI needed)
// =============================================================================

const BUILTIN_TEMPLATES = [
  {
    id: 'bt1',
    name: 'Modern Landing Page',
    category: 'Landing',
    icon: '🚀',
    description:
      'A clean, modern landing page with hero, features, and CTA sections.',
    thumbnail: '🌐',
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Modern Landing Page</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; }
    .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .glass { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); }
  </style>
</head>
<body class="bg-gray-900 text-slate-900 dark:text-white">
  <!-- Navigation -->
  <nav class="fixed w-full z-50 glass border-b border-slate-300 dark:border-white/10">
    <div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
      <div class="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Brand</div>
      <div class="hidden md:flex gap-8">
        <a href="#features" class="hover:text-purple-400 transition">Features</a>
        <a href="#pricing" class="hover:text-purple-400 transition">Pricing</a>
        <a href="#about" class="hover:text-purple-400 transition">About</a>
        <a href="#contact" class="hover:text-purple-400 transition">Contact</a>
      </div>
      <button class="gradient-bg px-6 py-2 rounded-full font-medium hover:opacity-90 transition">Get Started</button>
    </div>
  </nav>

  <!-- Hero Section -->
  <section class="min-h-screen flex items-center justify-center pt-20 px-6">
    <div class="max-w-4xl text-center">
      <span class="inline-block px-4 py-2 rounded-full bg-purple-500/20 text-purple-300 text-sm font-medium mb-6">✨ New Feature Released</span>
      <h1 class="text-5xl md:text-7xl font-bold mb-6 leading-tight">
        Build Amazing
        <span class="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent"> Products</span>
        Faster
      </h1>
      <p class="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
        The all-in-one platform to design, develop, and deploy your next big idea. Start building today with our powerful tools.
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <button class="gradient-bg px-8 py-4 rounded-full font-semibold text-lg hover:opacity-90 transition shadow-lg shadow-purple-500/25">
          Start Free Trial
        </button>
        <button class="px-8 py-4 rounded-full font-semibold text-lg border border-white/20 hover:bg-slate-100 dark:hover:bg-white/5 transition">
          Watch Demo →
        </button>
      </div>
    </div>
  </section>

  <!-- Features Section -->
  <section id="features" class="py-24 px-6">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold mb-4">Powerful Features</h2>
        <p class="text-gray-400 text-lg">Everything you need to succeed</p>
      </div>
      <div class="grid md:grid-cols-3 gap-8">
        <div class="p-8 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 hover:border-purple-500/50 transition group">
          <div class="w-14 h-14 rounded-xl gradient-bg flex items-center justify-center mb-6 text-2xl">⚡</div>
          <h3 class="text-xl font-semibold mb-3">Lightning Fast</h3>
          <p class="text-gray-400">Optimized performance for the best user experience. Load times under 100ms.</p>
        </div>
        <div class="p-8 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 hover:border-purple-500/50 transition group">
          <div class="w-14 h-14 rounded-xl gradient-bg flex items-center justify-center mb-6 text-2xl">🔒</div>
          <h3 class="text-xl font-semibold mb-3">Secure by Default</h3>
          <p class="text-gray-400">Enterprise-grade security with end-to-end encryption and compliance.</p>
        </div>
        <div class="p-8 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 hover:border-purple-500/50 transition group">
          <div class="w-14 h-14 rounded-xl gradient-bg flex items-center justify-center mb-6 text-2xl">🎨</div>
          <h3 class="text-xl font-semibold mb-3">Beautiful Design</h3>
          <p class="text-gray-400">Modern, responsive designs that look great on any device.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA Section -->
  <section class="py-24 px-6">
    <div class="max-w-4xl mx-auto text-center gradient-bg rounded-3xl p-12">
      <h2 class="text-4xl font-bold mb-4">Ready to Get Started?</h2>
      <p class="text-slate-900 dark:text-white/80 text-lg mb-8">Join thousands of users already building amazing things.</p>
      <button class="bg-white text-purple-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition">
        Start Your Free Trial
      </button>
    </div>
  </section>

  <!-- Footer -->
  <footer class="border-t border-slate-300 dark:border-white/10 py-12 px-6">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
      <div class="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Brand</div>
      <p class="text-gray-500">© 2024 Brand. All rights reserved.</p>
    </div>
  </footer>
</body>
</html>`,
  },
  {
    id: 'bt2',
    name: 'Dashboard UI',
    category: 'Dashboard',
    icon: '📊',
    description:
      'Analytics dashboard with stats cards, charts placeholder, and sidebar.',
    thumbnail: '📈',
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Analytics Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; }
    .gradient-card { background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%); }
  </style>
</head>
<body class="bg-gray-950 text-slate-900 dark:text-white min-h-screen">
  <div class="flex">
    <!-- Sidebar -->
    <aside class="w-64 min-h-screen bg-gray-900 border-r border-gray-800 p-6 fixed">
      <div class="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-8">Dashboard</div>
      <nav class="space-y-2">
        <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-lg bg-indigo-500/20 text-indigo-400">
          <span>📊</span> Overview
        </a>
        <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-gray-400">
          <span>📈</span> Analytics
        </a>
        <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-gray-400">
          <span>👥</span> Users
        </a>
        <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-gray-400">
          <span>💳</span> Billing
        </a>
        <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-gray-400">
          <span>⚙️</span> Settings
        </a>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="ml-64 flex-1 p-8">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold">Welcome back, Alex!</h1>
          <p class="text-gray-500 mt-1">Here's what's happening with your projects.</p>
        </div>
        <div class="flex items-center gap-4">
          <button class="p-3 rounded-lg bg-gray-800 hover:bg-gray-700">🔔</button>
          <div class="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"></div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-4 gap-6 mb-8">
        <div class="p-6 rounded-2xl bg-gray-900 border border-gray-800">
          <div class="flex justify-between items-start mb-4">
            <span class="text-gray-500">Total Revenue</span>
            <span class="text-green-400 text-sm">+12.5%</span>
          </div>
          <div class="text-3xl font-bold">$45,231</div>
          <div class="text-gray-500 text-sm mt-1">vs last month</div>
        </div>
        <div class="p-6 rounded-2xl bg-gray-900 border border-gray-800">
          <div class="flex justify-between items-start mb-4">
            <span class="text-gray-500">Active Users</span>
            <span class="text-green-400 text-sm">+8.2%</span>
          </div>
          <div class="text-3xl font-bold">2,345</div>
          <div class="text-gray-500 text-sm mt-1">vs last month</div>
        </div>
        <div class="p-6 rounded-2xl bg-gray-900 border border-gray-800">
          <div class="flex justify-between items-start mb-4">
            <span class="text-gray-500">Conversion Rate</span>
            <span class="text-red-400 text-sm">-2.1%</span>
          </div>
          <div class="text-3xl font-bold">3.42%</div>
          <div class="text-gray-500 text-sm mt-1">vs last month</div>
        </div>
        <div class="p-6 rounded-2xl bg-gray-900 border border-gray-800">
          <div class="flex justify-between items-start mb-4">
            <span class="text-gray-500">Avg. Session</span>
            <span class="text-green-400 text-sm">+5.8%</span>
          </div>
          <div class="text-3xl font-bold">4m 32s</div>
          <div class="text-gray-500 text-sm mt-1">vs last month</div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-2 gap-6 mb-8">
        <div class="p-6 rounded-2xl bg-gray-900 border border-gray-800">
          <h3 class="text-lg font-semibold mb-4">Revenue Overview</h3>
          <div class="h-64 flex items-end justify-around gap-2">
            <div class="w-12 bg-indigo-500/50 rounded-t" style="height: 40%"></div>
            <div class="w-12 bg-indigo-500/50 rounded-t" style="height: 65%"></div>
            <div class="w-12 bg-indigo-500/50 rounded-t" style="height: 45%"></div>
            <div class="w-12 bg-indigo-500/50 rounded-t" style="height: 80%"></div>
            <div class="w-12 bg-indigo-500/50 rounded-t" style="height: 55%"></div>
            <div class="w-12 bg-indigo-500 rounded-t" style="height: 90%"></div>
            <div class="w-12 bg-indigo-500/50 rounded-t" style="height: 70%"></div>
          </div>
          <div class="flex justify-around text-gray-500 text-sm mt-4">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>
        <div class="p-6 rounded-2xl bg-gray-900 border border-gray-800">
          <h3 class="text-lg font-semibold mb-4">Traffic Sources</h3>
          <div class="space-y-4">
            <div>
              <div class="flex justify-between text-sm mb-2"><span>Direct</span><span class="text-gray-500">45%</span></div>
              <div class="h-2 bg-gray-800 rounded-full"><div class="h-full w-[45%] bg-indigo-500 rounded-full"></div></div>
            </div>
            <div>
              <div class="flex justify-between text-sm mb-2"><span>Organic Search</span><span class="text-gray-500">32%</span></div>
              <div class="h-2 bg-gray-800 rounded-full"><div class="h-full w-[32%] bg-purple-500 rounded-full"></div></div>
            </div>
            <div>
              <div class="flex justify-between text-sm mb-2"><span>Social Media</span><span class="text-gray-500">18%</span></div>
              <div class="h-2 bg-gray-800 rounded-full"><div class="h-full w-[18%] bg-pink-500 rounded-full"></div></div>
            </div>
            <div>
              <div class="flex justify-between text-sm mb-2"><span>Referral</span><span class="text-gray-500">5%</span></div>
              <div class="h-2 bg-gray-800 rounded-full"><div class="h-full w-[5%] bg-cyan-500 rounded-full"></div></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="p-6 rounded-2xl bg-gray-900 border border-gray-800">
        <h3 class="text-lg font-semibold mb-4">Recent Activity</h3>
        <div class="space-y-4">
          <div class="flex items-center gap-4 p-4 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5">
            <div class="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">💰</div>
            <div class="flex-1">
              <p class="font-medium">New sale completed</p>
              <p class="text-sm text-gray-500">Order #12345 - $299.00</p>
            </div>
            <span class="text-gray-500 text-sm">2 min ago</span>
          </div>
          <div class="flex items-center gap-4 p-4 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5">
            <div class="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">👤</div>
            <div class="flex-1">
              <p class="font-medium">New user registered</p>
              <p class="text-sm text-gray-500">john.doe@example.com</p>
            </div>
            <span class="text-gray-500 text-sm">15 min ago</span>
          </div>
          <div class="flex items-center gap-4 p-4 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5">
            <div class="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">📊</div>
            <div class="flex-1">
              <p class="font-medium">Report generated</p>
              <p class="text-sm text-gray-500">Monthly analytics report</p>
            </div>
            <span class="text-gray-500 text-sm">1 hour ago</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</body>
</html>`,
  },
  {
    id: 'bt3',
    name: 'Portfolio Site',
    category: 'Portfolio',
    icon: '👨‍💼',
    description:
      'Creative portfolio with project gallery, about section, and contact form.',
    thumbnail: '🎨',
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Creative Portfolio</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Space Grotesk', sans-serif; }
    .gradient-text { background: linear-gradient(135deg, #f97316, #ec4899, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .card-hover:hover { transform: translateY(-8px); }
  </style>
</head>
<body class="bg-black text-slate-900 dark:text-white">
  <!-- Navigation -->
  <nav class="fixed w-full z-50 bg-black/80 backdrop-blur-lg border-b border-slate-300 dark:border-white/10">
    <div class="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
      <div class="text-2xl font-bold gradient-text">JD.</div>
      <div class="hidden md:flex gap-8">
        <a href="#work" class="hover:text-orange-400 transition">Work</a>
        <a href="#about" class="hover:text-orange-400 transition">About</a>
        <a href="#skills" class="hover:text-orange-400 transition">Skills</a>
        <a href="#contact" class="hover:text-orange-400 transition">Contact</a>
      </div>
    </div>
  </nav>

  <!-- Hero -->
  <section class="min-h-screen flex items-center px-6 pt-20">
    <div class="max-w-6xl mx-auto">
      <p class="text-orange-400 text-lg mb-4">Hello, I'm</p>
      <h1 class="text-6xl md:text-8xl font-bold mb-6">
        John <span class="gradient-text">Designer</span>
      </h1>
      <p class="text-xl text-gray-400 max-w-xl mb-8">
        A creative designer & developer crafting beautiful digital experiences that bring ideas to life.
      </p>
      <div class="flex gap-4">
        <a href="#work" class="px-8 py-4 bg-white text-black rounded-full font-semibold hover:bg-gray-200 transition">View Work</a>
        <a href="#contact" class="px-8 py-4 border border-white/30 rounded-full font-semibold hover:bg-slate-200 dark:hover:bg-white/10 transition">Get in Touch</a>
      </div>
    </div>
  </section>

  <!-- Projects -->
  <section id="work" class="py-24 px-6">
    <div class="max-w-6xl mx-auto">
      <h2 class="text-4xl font-bold mb-12">Featured <span class="gradient-text">Work</span></h2>
      <div class="grid md:grid-cols-2 gap-8">
        <div class="group card-hover transition-all duration-300">
          <div class="aspect-[4/3] rounded-2xl bg-gradient-to-br from-orange-500/20 to-pink-500/20 border border-slate-300 dark:border-white/10 overflow-hidden mb-4">
            <div class="w-full h-full flex items-center justify-center text-6xl">🎨</div>
          </div>
          <h3 class="text-xl font-semibold group-hover:text-orange-400 transition">Brand Identity Design</h3>
          <p class="text-gray-500">Branding, UI/UX</p>
        </div>
        <div class="group card-hover transition-all duration-300">
          <div class="aspect-[4/3] rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-slate-300 dark:border-white/10 overflow-hidden mb-4">
            <div class="w-full h-full flex items-center justify-center text-6xl">📱</div>
          </div>
          <h3 class="text-xl font-semibold group-hover:text-orange-400 transition">Mobile App Design</h3>
          <p class="text-gray-500">UI/UX, Prototyping</p>
        </div>
        <div class="group card-hover transition-all duration-300">
          <div class="aspect-[4/3] rounded-2xl bg-gradient-to-br from-cyan-500/20 to-green-500/20 border border-slate-300 dark:border-white/10 overflow-hidden mb-4">
            <div class="w-full h-full flex items-center justify-center text-6xl">🌐</div>
          </div>
          <h3 class="text-xl font-semibold group-hover:text-orange-400 transition">E-commerce Website</h3>
          <p class="text-gray-500">Web Design, Development</p>
        </div>
        <div class="group card-hover transition-all duration-300">
          <div class="aspect-[4/3] rounded-2xl bg-gradient-to-br from-pink-500/20 to-red-500/20 border border-slate-300 dark:border-white/10 overflow-hidden mb-4">
            <div class="w-full h-full flex items-center justify-center text-6xl">📊</div>
          </div>
          <h3 class="text-xl font-semibold group-hover:text-orange-400 transition">Dashboard UI Kit</h3>
          <p class="text-gray-500">UI Design, Components</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Skills -->
  <section id="skills" class="py-24 px-6 bg-slate-100 dark:bg-white/5">
    <div class="max-w-6xl mx-auto">
      <h2 class="text-4xl font-bold mb-12">My <span class="gradient-text">Skills</span></h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div class="p-6 rounded-2xl bg-black border border-slate-300 dark:border-white/10 text-center hover:border-orange-500/50 transition">
          <div class="text-4xl mb-3">🎨</div>
          <p class="font-medium">UI/UX Design</p>
        </div>
        <div class="p-6 rounded-2xl bg-black border border-slate-300 dark:border-white/10 text-center hover:border-orange-500/50 transition">
          <div class="text-4xl mb-3">⚛️</div>
          <p class="font-medium">React</p>
        </div>
        <div class="p-6 rounded-2xl bg-black border border-slate-300 dark:border-white/10 text-center hover:border-orange-500/50 transition">
          <div class="text-4xl mb-3">🎭</div>
          <p class="font-medium">Figma</p>
        </div>
        <div class="p-6 rounded-2xl bg-black border border-slate-300 dark:border-white/10 text-center hover:border-orange-500/50 transition">
          <div class="text-4xl mb-3">💻</div>
          <p class="font-medium">TypeScript</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Contact -->
  <section id="contact" class="py-24 px-6">
    <div class="max-w-2xl mx-auto text-center">
      <h2 class="text-4xl font-bold mb-4">Let's <span class="gradient-text">Connect</span></h2>
      <p class="text-gray-400 mb-8">Have a project in mind? Let's create something amazing together.</p>
      <form class="space-y-4">
        <input type="text" placeholder="Your Name" class="w-full px-6 py-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 focus:border-orange-500 outline-none transition">
        <input type="email" placeholder="Your Email" class="w-full px-6 py-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 focus:border-orange-500 outline-none transition">
        <textarea placeholder="Your Message" rows="4" class="w-full px-6 py-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 focus:border-orange-500 outline-none transition resize-none"></textarea>
        <button type="submit" class="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl font-semibold hover:opacity-90 transition">Send Message</button>
      </form>
    </div>
  </section>

  <!-- Footer -->
  <footer class="py-8 border-t border-slate-300 dark:border-white/10 text-center text-gray-500">
    <p>© 2024 John Designer. Built with ❤️</p>
  </footer>
</body>
</html>`,
  },
  {
    id: 'bt4',
    name: 'Pricing Page',
    category: 'Components',
    icon: '💎',
    description: 'Beautiful pricing table with 3 tiers and feature comparison.',
    thumbnail: '💰',
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pricing Plans</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; }
    .popular-glow { box-shadow: 0 0 60px rgba(99, 102, 241, 0.3); }
  </style>
</head>
<body class="bg-gray-950 text-slate-900 dark:text-white min-h-screen py-20 px-6">
  <div class="max-w-6xl mx-auto">
    <!-- Header -->
    <div class="text-center mb-16">
      <span class="inline-block px-4 py-2 rounded-full bg-indigo-500/20 text-indigo-400 text-sm font-medium mb-4">Pricing</span>
      <h1 class="text-5xl font-bold mb-4">Simple, Transparent Pricing</h1>
      <p class="text-xl text-gray-400 max-w-2xl mx-auto">Choose the plan that fits your needs. All plans include a 14-day free trial.</p>
      
      <!-- Toggle -->
      <div class="flex items-center justify-center gap-4 mt-8">
        <span class="text-gray-400">Monthly</span>
        <button class="w-14 h-8 bg-indigo-500 rounded-full relative">
          <div class="w-6 h-6 bg-white rounded-full absolute right-1 top-1"></div>
        </button>
        <span class="text-slate-900 dark:text-white font-medium">Yearly <span class="text-green-400 text-sm">Save 20%</span></span>
      </div>
    </div>

    <!-- Pricing Cards -->
    <div class="grid md:grid-cols-3 gap-8">
      <!-- Starter -->
      <div class="p-8 rounded-3xl bg-gray-900 border border-gray-800 hover:border-gray-700 transition">
        <div class="text-gray-400 font-medium mb-2">Starter</div>
        <div class="flex items-baseline gap-2 mb-6">
          <span class="text-5xl font-bold">$9</span>
          <span class="text-gray-500">/month</span>
        </div>
        <p class="text-gray-400 mb-8">Perfect for individuals and small projects.</p>
        <button class="w-full py-4 rounded-xl border border-gray-700 font-semibold hover:bg-slate-100 dark:hover:bg-white/5 transition">Get Started</button>
        <div class="mt-8 space-y-4">
          <div class="flex items-center gap-3 text-gray-300">
            <span class="text-green-400">✓</span> 5 Projects
          </div>
          <div class="flex items-center gap-3 text-gray-300">
            <span class="text-green-400">✓</span> 10GB Storage
          </div>
          <div class="flex items-center gap-3 text-gray-300">
            <span class="text-green-400">✓</span> Basic Analytics
          </div>
          <div class="flex items-center gap-3 text-gray-500">
            <span>✗</span> Priority Support
          </div>
          <div class="flex items-center gap-3 text-gray-500">
            <span>✗</span> Custom Domain
          </div>
        </div>
      </div>

      <!-- Pro (Popular) -->
      <div class="p-8 rounded-3xl bg-gradient-to-b from-indigo-900/50 to-gray-900 border-2 border-indigo-500 popular-glow relative transform scale-105">
        <div class="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-500 rounded-full text-sm font-medium">Most Popular</div>
        <div class="text-indigo-400 font-medium mb-2">Pro</div>
        <div class="flex items-baseline gap-2 mb-6">
          <span class="text-5xl font-bold">$29</span>
          <span class="text-gray-500">/month</span>
        </div>
        <p class="text-gray-400 mb-8">Best for growing teams and businesses.</p>
        <button class="w-full py-4 rounded-xl bg-indigo-500 font-semibold hover:bg-indigo-400 transition">Get Started</button>
        <div class="mt-8 space-y-4">
          <div class="flex items-center gap-3 text-gray-300">
            <span class="text-green-400">✓</span> Unlimited Projects
          </div>
          <div class="flex items-center gap-3 text-gray-300">
            <span class="text-green-400">✓</span> 100GB Storage
          </div>
          <div class="flex items-center gap-3 text-gray-300">
            <span class="text-green-400">✓</span> Advanced Analytics
          </div>
          <div class="flex items-center gap-3 text-gray-300">
            <span class="text-green-400">✓</span> Priority Support
          </div>
          <div class="flex items-center gap-3 text-gray-500">
            <span>✗</span> Custom Domain
          </div>
        </div>
      </div>

      <!-- Enterprise -->
      <div class="p-8 rounded-3xl bg-gray-900 border border-gray-800 hover:border-gray-700 transition">
        <div class="text-gray-400 font-medium mb-2">Enterprise</div>
        <div class="flex items-baseline gap-2 mb-6">
          <span class="text-5xl font-bold">$99</span>
          <span class="text-gray-500">/month</span>
        </div>
        <p class="text-gray-400 mb-8">For large teams with advanced needs.</p>
        <button class="w-full py-4 rounded-xl border border-gray-700 font-semibold hover:bg-slate-100 dark:hover:bg-white/5 transition">Contact Sales</button>
        <div class="mt-8 space-y-4">
          <div class="flex items-center gap-3 text-gray-300">
            <span class="text-green-400">✓</span> Unlimited Everything
          </div>
          <div class="flex items-center gap-3 text-gray-300">
            <span class="text-green-400">✓</span> 1TB Storage
          </div>
          <div class="flex items-center gap-3 text-gray-300">
            <span class="text-green-400">✓</span> Custom Analytics
          </div>
          <div class="flex items-center gap-3 text-gray-300">
            <span class="text-green-400">✓</span> 24/7 Dedicated Support
          </div>
          <div class="flex items-center gap-3 text-gray-300">
            <span class="text-green-400">✓</span> Custom Domain + SSL
          </div>
        </div>
      </div>
    </div>

    <!-- FAQ Teaser -->
    <div class="mt-20 text-center">
      <p class="text-gray-400">Have questions? <a href="#" class="text-indigo-400 hover:underline">Check our FAQ</a> or <a href="#" class="text-indigo-400 hover:underline">contact support</a></p>
    </div>
  </div>
</body>
</html>`,
  },
  {
    id: 'bt5',
    name: 'Login / Signup Form',
    category: 'Components',
    icon: '🔐',
    description: 'Glassmorphism login form with social login options.',
    thumbnail: '🔑',
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; }
    .glass { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(20px); }
    .gradient-border { background: linear-gradient(135deg, #6366f1, #a855f7, #ec4899); padding: 1px; }
  </style>
</head>
<body class="min-h-screen bg-gray-950 flex items-center justify-center p-6 relative overflow-hidden">
  <!-- Background Decoration -->
  <div class="absolute top-0 left-0 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
  <div class="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

  <!-- Login Card -->
  <div class="gradient-border rounded-3xl">
    <div class="glass rounded-3xl p-8 w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 mb-4">
          <span class="text-3xl">✨</span>
        </div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Welcome Back</h1>
        <p class="text-gray-400 mt-2">Sign in to continue to your account</p>
      </div>

      <!-- Social Login -->
      <div class="flex gap-4 mb-6">
        <button class="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 transition text-slate-900 dark:text-white">
          <svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Google
        </button>
        <button class="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 transition text-slate-900 dark:text-white">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
          GitHub
        </button>
      </div>

      <!-- Divider -->
      <div class="flex items-center gap-4 mb-6">
        <div class="flex-1 h-px bg-slate-200 dark:bg-white/10"></div>
        <span class="text-gray-500 text-sm">or continue with email</span>
        <div class="flex-1 h-px bg-slate-200 dark:bg-white/10"></div>
      </div>

      <!-- Form -->
      <form class="space-y-4">
        <div>
          <label class="text-sm text-gray-400 block mb-2">Email Address</label>
          <input type="email" placeholder="you@example.com" class="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 focus:border-indigo-500 outline-none text-slate-900 dark:text-white placeholder-gray-500 transition">
        </div>
        <div>
          <div class="flex justify-between items-center mb-2">
            <label class="text-sm text-gray-400">Password</label>
            <a href="#" class="text-sm text-indigo-400 hover:text-indigo-300">Forgot password?</a>
          </div>
          <input type="password" placeholder="••••••••" class="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 focus:border-indigo-500 outline-none text-slate-900 dark:text-white placeholder-gray-500 transition">
        </div>
        <div class="flex items-center gap-2">
          <input type="checkbox" id="remember" class="w-4 h-4 rounded bg-slate-100 dark:bg-white/5 border-slate-300 dark:border-white/10 text-indigo-500 focus:ring-indigo-500">
          <label for="remember" class="text-sm text-gray-400">Remember me for 30 days</label>
        </div>
        <button type="submit" class="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 font-semibold text-slate-900 dark:text-white hover:opacity-90 transition">
          Sign In
        </button>
      </form>

      <!-- Sign Up Link -->
      <p class="text-center text-gray-400 mt-6">
        Don't have an account? <a href="#" class="text-indigo-400 hover:text-indigo-300 font-medium">Sign up</a>
      </p>
    </div>
  </div>
</body>
</html>`,
  },
];

const BUILTIN_TEMPLATE_CATEGORIES = [
  'All',
  ...Array.from(new Set(BUILTIN_TEMPLATES.map((t) => t.category))),
];

// FILE_ICONS imported from canvas-types.ts

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function CanvasMode({
  isOpen,
  onClose,
  theme = 'neural',
  agentId = 'default',
  agentName = 'AI Assistant',
}: CanvasModeProps) {
  const previewRef = useRef<HTMLIFrameElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasLoadedMessages = useRef(false);

  // Auth context for user-scoped storage
  const { state: authState } = useAuth();
  const userId = authState.user?.id ?? null;

  // Canvas Projects Hook for persistent storage (user/session-scoped)
  // Now properly scoped: authenticated users by userId, guests by unique sessionId + agentId
  const {
    projects: canvasProjects,
    isLoading: isLoadingProjects,
    saveProject,
    deleteProject: deleteCanvasProject,
    updateProject,
    sessionId,
  } = useCanvasProjects({ userId, agentId });

  // Deployment Hook for Vercel, Railway, Netlify, Cloudflare, OneLast AI
  const {
    credentials: deployCredentials,
    isLoadingCredentials,
    saveCredential,
    deleteCredential,
    validateCredential,
    deployments,
    activeDeployment,
    deploy: deployProject,
    undeploy: undeployProject,
    isDeploying,
    deployError,
    clearError: clearDeployError,
  } = useDeployment(userId);

  // Canvas Agent Hook — file ops, build validation, deploy, auto-fix
  // NOTE: processAgentResponse is no longer used — backend handles tool calling now
  const {
    applyFileOps,
    extractFilesFromHtml,
    validateBuild,
    requestDeploy,
    autoFixErrors,
    isProcessing: isAgentProcessing,
    lastActions: agentActions,
    currentBuild,
  } = useCanvasAgent({
    agentId,
    agentName,
    onPreviewUpdate: (html: string) => {
      // Update the iframe preview when agent produces HTML
      updatePreview(html);
    },
  });

  // User/session-scoped key generators for DB-backed persistence
  // Uses sessionId for guests to ensure isolation between browser sessions
  const getMessagesStorageKey = useCallback(() => {
    const baseId = userId || sessionId;
    if (agentId && agentId !== 'default') {
      return `canvasMessages_${agentId}_${baseId}`;
    }
    return `canvasMessages_${baseId}`;
  }, [userId, sessionId, agentId]);

  const getSidebarAnimatedKey = useCallback(() => {
    const baseId = userId || sessionId;
    if (agentId && agentId !== 'default') {
      return `canvas_sidebar_animated_${agentId}_${baseId}`;
    }
    return `canvas_sidebar_animated_${baseId}`;
  }, [userId, sessionId, agentId]);

  // Convert projects to history entries format
  const historyEntries = useMemo<HistoryEntry[]>(
    () =>
      canvasProjects.map((p) => ({
        id: p.id,
        name: p.name,
        prompt: p.prompt,
        code: p.code,
        timestamp: p.timestamp,
      })),
    [canvasProjects]
  );

  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [generatedFiles, setGeneratedFiles] = useState<ProjectFile[]>([]);
  const [projectPages, setProjectPages] = useState<ProjectPage[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<FileAttachment[]>([]);

  // UI State
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [previewDevice, setPreviewDevice] = useState<
    'desktop' | 'tablet' | 'mobile'
  >('desktop');
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [copySuccess, setCopySuccess] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<
    'idle' | 'generating' | 'success' | 'error'
  >('idle');
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [showChatPanel, setShowChatPanel] = useState(true);
  const [showFilesPanel, setShowFilesPanel] = useState(true);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [showDeployPanel, setShowDeployPanel] = useState(false);
  const [showCredentialsPanel, setShowCredentialsPanel] = useState(false);
  const [showNavOverlay, setShowNavOverlay] = useState(false);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [openHistoryMenuId, setOpenHistoryMenuId] = useState<string | null>(
    null
  );
  const [activePane, setActivePane] = useState<
    | 'chat'
    | 'files'
    | 'preview'
    | 'templates'
    | 'code'
    | 'history'
    | 'settings'
    | 'deploy'
    | 'credentials'
    | 'search'
    | 'terminal'
    | 'diff'
  >('chat');
  const [splitView, setSplitView] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [showBuiltinTemplatesPanel, setShowBuiltinTemplatesPanel] =
    useState(false);
  const [builtinTemplateCategory, setBuiltinTemplateCategory] =
    useState<string>('All');
  const [showRotatePrompt, setShowRotatePrompt] = useState(false);
  const [isMobilePortrait, setIsMobilePortrait] = useState(false);
  const [quickResponseMode, setQuickResponseMode] = useState(false);

  // Sidebar discovery animation state
  const [sidebarHighlightIndex, setSidebarHighlightIndex] = useState<
    number | null
  >(null);
  const [hasSeenSidebarAnimation, setHasSeenSidebarAnimation] = useState(false);

  // AI provider hardcoded to Mistral (primary) — backend handles fallback automatically
  const selectedProvider = 'mistral';
  const selectedModel = 'auto';
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(4096);

  // Editor Bridge Hook — provides all 43 bridge tools to the agent
  const editorBridge = useEditorBridge({
    files: generatedFiles,
    pages: projectPages,
    framework: 'html',
    errors: currentBuild?.errors || [],
    onFilesChange: setGeneratedFiles,
    onPagesChange: setProjectPages,
    onFrameworkChange: () => {}, // framework is auto-detected
    onPreviewUpdate: (html: string) => updatePreview(html),
    onSelectFile: (file: ProjectFile) => setSelectedFile(file),
  });

  // Sync editor cursor/selection state to backend for the editor_select agent tool
  useEditorStateSync({
    editorRef: editorBridge.editorRef,
    editorReady: editorBridge.editorReady,
    userId,
    activeFilePath: selectedFile?.path ?? null,
  });

  // Debounce timer ref for DB saves
  const dbSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoadRef = useRef(true);

  // Restore chat messages once when opened — DB only (no localStorage)
  useEffect(() => {
    if (!isOpen || hasLoadedMessages.current) return;
    hasLoadedMessages.current = true;
    if (typeof window === 'undefined') return;

    const loadMessages = async () => {
      const effectiveAgentId = agentId && agentId !== 'default' ? agentId : 'default';

      // Load from DB (authenticated users)
      try {
        const res = await fetch(`/api/user/preferences/canvas-messages/${effectiveAgentId}`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.messages) && data.messages.length > 0) {
            const parsed: ChatMessage[] = data.messages.map((m: any) => ({
              ...m,
              timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
            }));
            isInitialLoadRef.current = false;
            setMessages(parsed);
            return;
          }
        }
      } catch { /* DB unavailable */ }

      // Seed with welcome message
      isInitialLoadRef.current = false;
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: `Hey there! 👋 I'm super excited to help you build something awesome today!\n\nSo what's on your mind? Got a cool idea brewing? Whether it's a slick landing page, a fancy dashboard, or even just a quick component - I'm all ears! 🎨\n\nOh and pro tip: you can also drop a screenshot of any design and I'll turn it into code for you! ✨\n\nWhat are we creating?`,
          timestamp: new Date(),
        },
      ]);
    };

    loadMessages();
  }, [isOpen]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mobile orientation detection - show rotate prompt on portrait mobile
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    const checkOrientation = () => {
      const isMobile =
        window.innerWidth < 768 ||
        (window.innerWidth < 1024 && 'ontouchstart' in window);
      const isPortrait = window.innerHeight > window.innerWidth;

      setIsMobilePortrait(isMobile && isPortrait);

      // Show rotate prompt only on first load in portrait mode on mobile
      if (isMobile && isPortrait) {
        setShowRotatePrompt(true);
      } else {
        setShowRotatePrompt(false);
      }
    };

    // Check on mount
    checkOrientation();

    // Listen to orientation/resize changes
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, [isOpen]);

  // Sidebar discovery animation - runs once on first canvas open (DB only)
  useEffect(() => {
    if (!isOpen) return;

    const sidebarKey = getSidebarAnimatedKey();

    // Check DB first
    const checkAndAnimate = async () => {
      // Check DB
      try {
        const res = await fetch('/api/user/preferences', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const flags = data?.data?.uiFlags || {};
          if (flags[sidebarKey]) {
            setHasSeenSidebarAnimation(true);
            return;
          }
        }
      } catch { /* fall through */ }

      // Run animation
      const totalItems = 13;
      let currentIndex = 0;

      const animateNext = () => {
        if (currentIndex < totalItems) {
          setSidebarHighlightIndex(currentIndex);
          currentIndex++;
          setTimeout(animateNext, 400);
        } else {
          setSidebarHighlightIndex(null);
          setHasSeenSidebarAnimation(true);
          // Save to DB
          fetch('/api/user/preferences/ui-flags', {
            method: 'PUT', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [sidebarKey]: true }),
          }).catch(() => {});
        }
      };

      setTimeout(() => animateNext(), 1500);
    };

    checkAndAnimate();
  }, [isOpen]);

  // =============================================================================
  // BRAND THEME STYLES
  // =============================================================================

  const brandColors = {
    gradientPrimary:
      'bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500',
    gradientText:
      'bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent',
    bgMain: 'bg-[#0a0a0f]',
    bgPanel: 'bg-[#12121a]/95 backdrop-blur-xl',
    bgSecondary: 'bg-[#1a1a24]/80',
    bgInput: 'bg-[#1e1e2a]',
    bgHover: 'hover:bg-[#252530]',
    border: 'border-[#2a2a3a]',
    borderAccent: 'border-cyan-500/30',
    text: 'text-gray-100',
    textSecondary: 'text-gray-400',
    textMuted: 'text-gray-500',
    accentCyan: 'text-cyan-400',
    accentPurple: 'text-purple-400',
    btnPrimary:
      'bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-slate-900 dark:text-white shadow-lg shadow-cyan-500/25',
    btnSecondary: 'bg-[#2a2a3a] hover:bg-[#353545] text-gray-200',
  };

  // Helper function for sidebar discovery animation highlight
  const getSidebarHighlightClass = (index: number) => {
    if (sidebarHighlightIndex === index && !hasSeenSidebarAnimation) {
      return 'ring-2 ring-cyan-400 ring-opacity-75 scale-110 animate-pulse shadow-lg shadow-cyan-500/50';
    }
    return '';
  };

  // Categories
  const categories = [
    'All',
    ...Array.from(new Set(TEMPLATES.map((t) => t.category))),
  ];
  const filteredTemplates =
    selectedCategory === 'All'
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.category === selectedCategory);

  // Sync pane selection with visible panels and modes
  useEffect(() => {
    const chatActive = activePane === 'chat' || activePane === 'templates';
    // Files panel only shows for 'files' pane (not 'code')
    const filesActive = activePane === 'files';
    const historyActive = activePane === 'history';
    const settingsActive = activePane === 'settings';
    const deployActive = activePane === 'deploy';
    const credentialsActive = activePane === 'credentials';
    setShowChatPanel(chatActive);
    setShowFilesPanel(filesActive);
    setShowHistoryPanel(historyActive || settingsActive);
    setShowDeployPanel(deployActive);
    setShowCredentialsPanel(credentialsActive);
    setShowTemplates(activePane === 'templates');

    if (activePane === 'preview') {
      setViewMode('preview');
    }
    // Code pane shows code view without the files panel
    if (activePane === 'code') {
      setViewMode('code');
    }
    // Files pane shows files panel with code view
    if (activePane === 'files' && generatedFiles.length > 0) {
      setViewMode('code');
    }
  }, [activePane, generatedFiles.length]);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const normalizeCode = useCallback((code: string) => {
    let cleaned = code.trim();
    // Remove leading markdown code blocks (```html, ```HTML, etc.)
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/gim, '');
    // Remove trailing markdown code blocks
    cleaned = cleaned.replace(/\n?```\s*$/gim, '');
    // Also handle case where ``` appears in the middle (shouldn't happen but just in case)
    cleaned = cleaned.replace(/```\s*$/gm, '');
    return cleaned.trim();
  }, []);

  const summarizePrompt = useCallback((prompt: string) => {
    const clean = prompt.trim();
    if (!clean) return 'Untitled build';
    const firstLine = clean.split('\n')[0];
    return firstLine.length > 80 ? `${firstLine.slice(0, 77)}...` : firstLine;
  }, []);

  // Note: History is now loaded via useCanvasProjects hook (backend sync)
  // The historyEntries is derived from canvasProjects in the hook

  // Persist chat messages to DB (debounced 1s — no localStorage)
  useEffect(() => {
    if (typeof window === 'undefined' || isInitialLoadRef.current) return;
    const serializedMessages = messages.map((m) => ({
      ...m,
      timestamp:
        m.timestamp instanceof Date
          ? m.timestamp.toISOString()
          : m.timestamp,
    }));

    // Debounced: DB save (1 second)
    if (dbSaveTimerRef.current) clearTimeout(dbSaveTimerRef.current);
    dbSaveTimerRef.current = setTimeout(() => {
      const effectiveAgentId = agentId && agentId !== 'default' ? agentId : 'default';
      fetch(`/api/user/preferences/canvas-messages/${effectiveAgentId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: serializedMessages }),
      }).catch(() => { /* silent */ });
    }, 1000);
  }, [messages, getMessagesStorageKey, agentId]);

  const updatePreview = useCallback((code: string) => {
    if (previewRef.current) {
      // Comprehensive CSS fix for icons and layout issues
      const iconFixCSS = `
<style>
  /* CRITICAL: Fix for oversized icons - constrain ALL SVGs aggressively */
  svg:not([width]):not([class*="w-"]):not(.chart):not(.graph) { 
    width: 24px !important; 
    height: 24px !important;
    max-width: 48px !important;
    max-height: 48px !important;
    display: inline-block !important;
  }
  
  /* Force constrain all Lucide icons */
  [data-lucide], i[data-lucide], .lucide { 
    width: 24px !important; 
    height: 24px !important;
    max-width: 32px !important;
    max-height: 32px !important;
    display: inline-block !important;
    vertical-align: middle !important;
  }
  
  [data-lucide] svg, i[data-lucide] svg, .lucide svg { 
    width: 100% !important; 
    height: 100% !important;
    max-width: 32px !important;
    max-height: 32px !important;
  }
  
  /* Icons in buttons, links, spans should be constrained */
  button svg, a svg, span svg, div svg, p svg { 
    max-width: 32px !important; 
    max-height: 32px !important; 
  }
  
  /* Hero/feature icons can be slightly larger but still constrained */
  .hero svg, .feature svg, .icon-lg svg, [class*="icon"] svg {
    max-width: 64px !important;
    max-height: 64px !important;
  }
  
  /* Ensure body doesn't have overflowing SVGs */
  body > svg:not([class]) {
    display: none !important;
  }
  
  /* Reset any SVG that might be positioned absolutely and taking full screen */
  svg[style*="position: absolute"], svg[style*="position:absolute"] {
    max-width: 100px !important;
    max-height: 100px !important;
  }
</style>
`;
      // Insert CSS fix before </head> if head exists, otherwise before </body>
      let fixedCode = code;
      if (code.includes('</head>')) {
        fixedCode = code.replace('</head>', iconFixCSS + '</head>');
      } else if (code.includes('</body>')) {
        fixedCode = code.replace('</body>', iconFixCSS + '</body>');
      } else {
        // No head or body tag found, prepend the CSS
        fixedCode = iconFixCSS + code;
      }

      // Also try to initialize Lucide if it's being used
      const lucideInit = `
<script>
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    document.addEventListener('DOMContentLoaded', function() { 
      lucide.createIcons(); 
      // After icons are created, ensure they're sized properly
      document.querySelectorAll('[data-lucide]').forEach(function(el) {
        el.style.width = '24px';
        el.style.height = '24px';
      });
    });
    setTimeout(function() { 
      if (lucide.createIcons) {
        lucide.createIcons(); 
        document.querySelectorAll('[data-lucide]').forEach(function(el) {
          el.style.width = '24px';
          el.style.height = '24px';
        });
      }
    }, 100);
  }
</script>
`;
      if (fixedCode.includes('lucide') || fixedCode.includes('data-lucide')) {
        fixedCode = fixedCode.replace('</body>', lucideInit + '</body>');
      }

      // Use doc.write() with allow-same-origin sandbox (required for external CDN requests)
      const doc = previewRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(fixedCode);
        doc.close();
      }
    }
  }, []);

  useEffect(() => {
    if (viewMode !== 'preview' && !splitView) return;
    const htmlContent =
      selectedFile?.language === 'html' ? selectedFile.content : generatedCode;
    if (htmlContent) {
      updatePreview(htmlContent);
    }
  }, [viewMode, selectedFile, generatedCode, updatePreview, splitView]);

  // Extract files from generated code - delegates to useCanvasAgent hook
  const extractFiles = useCallback(
    (code: string): ProjectFile[] => {
      return extractFilesFromHtml(code);
    },
    [extractFilesFromHtml]
  );

  const handleTemplateSelect = useCallback(
    (template: (typeof TEMPLATES)[0]) => {
      setChatInput(template.prompt);
      setShowTemplates(false);
      // Auto-submit
      setTimeout(() => {
        const submitBtn = document.getElementById('canvas-submit-btn');
        if (submitBtn) submitBtn.click();
      }, 100);
    },
    []
  );

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const newFile: FileAttachment = {
            id: Date.now().toString() + Math.random(),
            name: file.name,
            type: file.type,
            url: event.target?.result as string,
            size: file.size,
          };
          setUploadedFiles((prev) => [...prev, newFile]);
        };
        reader.readAsDataURL(file);
      });
    },
    []
  );

  const removeUploadedFile = useCallback((fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!chatInput.trim() || isGenerating) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date(),
      attachments: uploadedFiles.length > 0 ? [...uploadedFiles] : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    const userPrompt = chatInput.trim();
    setChatInput('');
    setUploadedFiles([]);
    setIsGenerating(true);
    setShowTemplates(false);
    setGenerationStatus('generating');

    // Add streaming placeholder
    const streamingMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      {
        id: streamingMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      },
    ]);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      // ═══════════════════════════════════════════════════════════════
      // Single-Agent tool calling
      // Backend defines tools → LLM decides → Backend executes
      // Frontend just renders tokens + applies file updates
      // ═══════════════════════════════════════════════════════════════

      const endpoint = '/api/canvas/agent-stream';

      const requestBody = {
            prompt: userPrompt,
            provider: selectedProvider,
            modelId: selectedModel,
            source: 'universal-canvas',
            agentId: agentId || undefined,
            files: generatedFiles.map((f) => ({
              path: f.path,
              name: f.name,
              content: f.content,
              language: f.language,
            })),
            framework: 'html',
            editorContext: editorBridge.getEditorContext(),
            agentMode: editorBridge.agentMode,
            history: messages
              .filter((m) => !m.isStreaming)
              .slice(-10)
              .map((m) => ({ role: m.role, content: m.content })),
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: controller.signal,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to generate');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let streamedText = '';
      let buffer = '';
      let updatedFiles = [...generatedFiles];
      let toolActions: string[] = [];

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;

            try {
              const event = JSON.parse(data);

              // ── Text token: stream to chat message ──
              if (event.token) {
                streamedText += event.token;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === streamingMsgId
                      ? { ...m, content: streamedText }
                      : m
                  )
                );
              }

              // ── Tool execution started ──
              if (event.tool_start) {
                const { name } = event.tool_start;
                toolActions.push(name);
              }

              // ── Tool result received ──
              // (result logged in backend, not needed client-side)

              // ── Files updated by tool execution ──
              if (event.files) {
                // Backend already executed the tool — apply file state directly
                const serverFiles = event.files;
                updatedFiles = serverFiles.map(
                  (sf: {
                    path: string;
                    name?: string;
                    content: string;
                    language?: string;
                    size?: number;
                  }) => {
                    // Find existing file to preserve client-side IDs
                    const existing = updatedFiles.find(
                      (f) => f.path === sf.path
                    );
                    return {
                      id:
                        existing?.id ||
                        `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                      name: sf.name || sf.path.split('/').pop() || 'untitled',
                      path: sf.path,
                      language: sf.language || 'plaintext',
                      content: sf.content || '',
                      size: sf.size || (sf.content || '').length,
                      isEntryPoint:
                        sf.path === '/index.html' ||
                        sf.path === '/src/main.tsx',
                      createdAt: existing?.createdAt || Date.now(),
                      updatedAt: Date.now(),
                    };
                  }
                );

                setGeneratedFiles(updatedFiles);

                // Update preview with entry file
                const entryFile =
                  updatedFiles.find(
                    (f: { isEntryPoint?: boolean }) => f.isEntryPoint
                  ) ||
                  updatedFiles.find(
                    (f: { language?: string }) => f.language === 'html'
                  );
                if (entryFile) {
                  const cleaned = normalizeCode(entryFile.content);
                  setGeneratedCode(cleaned);
                  updatePreview(cleaned);
                }
              }

              // ── Stream complete ──
              if (event.done) {
                // Apply final file state
                if (event.files) {
                  const finalFiles = event.files.map(
                    (sf: {
                      path: string;
                      name?: string;
                      content: string;
                      language?: string;
                      size?: number;
                    }) => {
                      const existing = updatedFiles.find(
                        (f) => f.path === sf.path
                      );
                      return {
                        id:
                          existing?.id ||
                          `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                        name: sf.name || sf.path.split('/').pop() || 'untitled',
                        path: sf.path,
                        language: sf.language || 'plaintext',
                        content: sf.content || '',
                        size: sf.size || (sf.content || '').length,
                        isEntryPoint:
                          sf.path === '/index.html' ||
                          sf.path === '/src/main.tsx',
                        createdAt: existing?.createdAt || Date.now(),
                        updatedAt: Date.now(),
                      };
                    }
                  );
                  updatedFiles = finalFiles;
                  setGeneratedFiles(finalFiles);
                }
              }

              // ── Error ──
              if (event.error) {
                throw new Error(event.error);
              }
            } catch (parseError) {
              if (
                parseError instanceof Error &&
                parseError.message !== 'Failed to generate'
              ) {
                // Skip JSON parse errors from partial chunks
                if (data && !data.startsWith('{')) {
                  streamedText += data;
                }
              } else {
                throw parseError;
              }
            }
          }
        }
      }

      // ── Finalize ──
      const hasFiles = updatedFiles.length > 0;
      const hasHtmlFile = updatedFiles.some(
        (f) =>
          f.language === 'html' &&
          (f.content?.includes('<!DOCTYPE') || f.content?.includes('<html'))
      );

      if (hasFiles && hasHtmlFile) {
        // Show preview
        const entryFile =
          updatedFiles.find((f) => f.isEntryPoint) ||
          updatedFiles.find((f) => f.language === 'html');
        if (entryFile) {
          const cleaned = normalizeCode(entryFile.content);
          setGeneratedCode(cleaned);
          updatePreview(cleaned);
        }

        setViewMode('preview');
        setGenerationStatus('success');

        // Save to backend
        saveProject({
          name: summarizePrompt(userPrompt),
          prompt: userPrompt,
          code:
            updatedFiles.find((f) => f.isEntryPoint)?.content ||
            updatedFiles[0]?.content ||
            '',
          timestamp: Date.now(),
          chatHistory: messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp:
              m.timestamp instanceof Date
                ? m.timestamp.toISOString()
                : String(m.timestamp),
          })),
        });

        // Build action summary from tool calls
        const actionSummary =
          toolActions.length > 0
            ? '\n\n**Actions performed:**\n' +
              toolActions
                .map((a) => `• ${a.replace('canvas_', '').replace(/_/g, ' ')}`)
                .join('\n')
            : '';
        const chatMessage =
          streamedText.trim() ||
          '✨ Done! Your design is ready.\n\nCheck the Preview or Code tab.';

        setMessages((prev) =>
          prev.map((m) =>
            m.id === streamingMsgId
              ? {
                  ...m,
                  content: chatMessage + actionSummary,
                  isStreaming: false,
                }
              : m
          )
        );
      } else if (streamedText.trim()) {
        // Conversational response
        setGenerationStatus('idle');
        setMessages((prev) =>
          prev.map((m) =>
            m.id === streamingMsgId
              ? { ...m, content: streamedText, isStreaming: false }
              : m
          )
        );
      } else {
        throw new Error('No response received');
      }
    } catch (error: unknown) {
      const isAborted =
        error instanceof DOMException && error.name === 'AbortError';
      const errorMsg = isAborted
        ? 'Stopped by user'
        : error instanceof Error
          ? error.message
          : 'Unknown error';
      setGenerationStatus('error');
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamingMsgId
            ? {
                ...m,
                content: isAborted
                  ? '⏹️ Generation stopped by user.'
                  : `❌ Error: ${errorMsg}\n\nPlease try again.`,
                isStreaming: false,
              }
            : m
        )
      );
    } finally {
      setIsGenerating(false);
      setAbortController(null);
    }
  }, [
    chatInput,
    isGenerating,
    uploadedFiles,
    generatedCode,
    generatedFiles,
    messages,
    updatePreview,
    summarizePrompt,
    selectedProvider,
    selectedModel,
    normalizeCode,
    saveProject,
    editorBridge,
  ]);

  const handleStopGeneration = useCallback(() => {
    if (abortController) {
      abortController.abort();
    }
  }, [abortController]);

  const handleDeleteHistoryEntry = useCallback(
    async (id: string) => {
      await deleteCanvasProject(id);
      if (openHistoryMenuId === id) setOpenHistoryMenuId(null);
    },
    [openHistoryMenuId, deleteCanvasProject]
  );

  const handleRenameHistoryEntry = useCallback(
    async (id: string) => {
      const entry = historyEntries.find((e) => e.id === id);
      if (!entry) return;
      const newName = window.prompt(
        'Rename build',
        entry.name || 'Untitled build'
      );
      if (!newName) return;
      await updateProject(id, { name: newName.trim() || entry.name });
      setOpenHistoryMenuId(null);
    },
    [historyEntries, updateProject]
  );

  const handleDownloadHistoryEntry = useCallback((entry: HistoryEntry) => {
    const blob = new Blob([entry.code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entry.name || 'universal-canvas'}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setOpenHistoryMenuId(null);
  }, []);

  const handleShareHistoryEntry = useCallback(async (entry: HistoryEntry) => {
    try {
      if (navigator.share) {
        await navigator.share({ title: entry.name, text: entry.code });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(entry.code);
        alert('Code copied to clipboard');
      } else {
        alert('Sharing is not supported in this browser');
      }
    } catch (err) {
      console.error('Share failed', err);
    } finally {
      setOpenHistoryMenuId(null);
    }
  }, []);

  // Start a new conversation - clears chat and code
  const handleNewConversation = useCallback(() => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Hey! 👋 Fresh canvas, endless possibilities!\n\nWhat are we building this time? I'm ready for anything - websites, dashboards, portfolios, you name it! 🚀\n\nGot a design screenshot? Drop it in and I'll recreate it in code!`,
        timestamp: new Date(),
      },
    ]);
    setGeneratedCode('');
    setGeneratedFiles([]);
    setProjectPages([]);
    setSelectedFile(null);
    setUploadedFiles([]);
    setChatInput('');
    setActivePane('chat');
  }, []);

  // Load a built-in template directly (no AI interaction)
  const handleLoadBuiltinTemplate = useCallback(
    (template: (typeof BUILTIN_TEMPLATES)[0]) => {
      // Set the code directly
      const normalizedCode = normalizeCode(template.code);
      setGeneratedCode(normalizedCode);

      // Extract files
      const files = extractFiles(normalizedCode);
      setGeneratedFiles(files);
      if (files.length > 0) {
        setSelectedFile(files[0]);
      }

      // Update preview
      updatePreview(normalizedCode);

      // Add a message to chat about the loaded template
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: `✅ Loaded **${template.name}** template!\n\n${template.description}\n\nYou can now:\n- View and edit the code\n- See it in the preview\n- Ask me to customize it (change colors, add sections, etc.)\n\nWhat would you like to modify?`,
          timestamp: new Date(),
        },
      ]);

      // Save to history via hook (syncs to backend)
      saveProject({
        name: template.name,
        prompt: `Loaded template: ${template.name}`,
        code: normalizedCode,
        timestamp: Date.now(),
      });

      // Close the templates panel and switch to preview
      setShowBuiltinTemplatesPanel(false);
      setShowChatPanel(false);
      setShowFilesPanel(false);
      setShowHistoryPanel(false);
      setActivePane('preview');
      setGenerationStatus('success');
    },
    [normalizeCode, extractFiles, updatePreview, saveProject]
  );

  // Filter built-in templates by category
  const filteredBuiltinTemplates =
    builtinTemplateCategory === 'All'
      ? BUILTIN_TEMPLATES
      : BUILTIN_TEMPLATES.filter((t) => t.category === builtinTemplateCategory);

  // Filtered history entries based on search
  const filteredHistoryEntries = historySearchQuery.trim()
    ? historyEntries.filter(
        (entry) =>
          entry.name
            ?.toLowerCase()
            .includes(historySearchQuery.toLowerCase()) ||
          entry.prompt?.toLowerCase().includes(historySearchQuery.toLowerCase())
      )
    : historyEntries;

  const handleDownload = useCallback(() => {
    if (!generatedCode) return;
    const blob = new Blob([generatedCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'canvas-project.html';
    a.click();
    URL.revokeObjectURL(url);
  }, [generatedCode]);

  const handleCopyCode = useCallback(() => {
    const contentToCopy = selectedFile?.content || generatedCode;
    if (contentToCopy) {
      navigator.clipboard.writeText(contentToCopy);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  }, [generatedCode, selectedFile]);

  const handleOpenInNewTab = useCallback(() => {
    if (!generatedCode) return;
    const blob = new Blob([generatedCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }, [generatedCode]);

  // Device styles
  const deviceStyles = {
    desktop: 'w-full h-full',
    tablet: 'w-[768px] h-full mx-auto',
    mobile: 'w-[375px] h-full mx-auto',
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex ${brandColors.bgMain}`}>
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }}
        />
      </div>

      {/* =========== MOBILE ROTATE PROMPT =========== */}
      {showRotatePrompt && isMobilePortrait && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-lg">
          {/* Small dismiss arrow at top right */}
          <button
            onClick={() => setShowRotatePrompt(false)}
            className="absolute top-6 right-6 p-2 text-gray-500 hover:text-slate-900 dark:hover:text-white transition"
            aria-label="Dismiss"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="text-center p-4">
            {/* Large Animated Rotating Phone */}
            <div className="relative w-48 h-48 mx-auto mb-8">
              {/* Phone that rotates */}
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  animation: 'phoneRotate 3s ease-in-out infinite',
                }}
              >
                {/* Phone body */}
                <div className="w-20 h-36 bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl border-4 border-cyan-400 shadow-lg shadow-cyan-500/30 relative">
                  {/* Screen */}
                  <div className="absolute inset-2 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl overflow-hidden">
                    {/* Screen content lines */}
                    <div className="mt-4 mx-2 space-y-2">
                      <div className="h-2 bg-white/30 rounded w-3/4" />
                      <div className="h-2 bg-slate-300 dark:bg-white/20 rounded w-1/2" />
                      <div className="h-2 bg-slate-300 dark:bg-white/20 rounded w-2/3" />
                    </div>
                  </div>
                  {/* Top notch/speaker */}
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-gray-700 rounded-full" />
                  {/* Home button/bar */}
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-600 rounded-full" />
                </div>
              </div>

              {/* Circular rotation arrows */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="w-48 h-48 text-purple-500/40"
                  style={{ animation: 'spinArrow 4s linear infinite' }}
                  viewBox="0 0 100 100"
                >
                  {/* Circular arrow path */}
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="120 60"
                    d="M 50 10 A 40 40 0 1 1 10 50"
                  />
                  {/* Arrow head */}
                  <polygon
                    fill="currentColor"
                    points="8,42 18,50 8,58"
                    style={{
                      transform: 'rotate(-20deg)',
                      transformOrigin: '50% 50%',
                    }}
                  />
                </svg>
              </div>
            </div>

            {/* Simple text */}
            <p className="text-xl text-slate-900 dark:text-white font-medium mb-2">
              Rotate for best experience
            </p>
            <p className="text-gray-500 text-sm">📱 ➡️ 📱</p>
          </div>
        </div>
      )}

      {/* =========== LEFT TOOLBAR =========== */}
      <div
        className={`${showNavOverlay ? 'w-60 items-start' : 'w-14 items-center'} flex flex-col gap-2 py-4 ${brandColors.bgPanel} ${brandColors.border} border-r relative z-20 transition-all duration-300 overflow-y-auto overflow-x-hidden custom-scrollbar`}
      >
        <button
          onClick={() => setShowNavOverlay((v) => !v)}
          className={`p-1.5 rounded-lg bg-slate-200 dark:bg-white/10 ${showNavOverlay ? 'ml-2' : ''} hover:bg-white/20 hover:scale-105 transition-all duration-300 flex items-center gap-2 flex-shrink-0 ${getSidebarHighlightClass(0)}`}
          title={showNavOverlay ? 'Close navigation' : 'Open navigation'}
        >
          <Image
            src="/images/logos/company-logo.png"
            alt="One Last AI logo"
            width={28}
            height={28}
            className="w-7 h-7 object-contain rounded-lg"
            priority
          />
          {showNavOverlay && (
            <span className={`text-sm font-semibold ${brandColors.text}`}>
              Navigation
            </span>
          )}
        </button>
        <div className="flex flex-col gap-2 w-full px-2 mt-2 flex-shrink-0">
          {/* New Conversation Button */}
          <button
            onClick={handleNewConversation}
            className={`p-2 rounded-lg flex items-center ${showNavOverlay ? 'justify-start gap-3 px-3' : 'justify-center'} transition-all duration-300 ${brandColors.btnPrimary} hover:scale-105 ${getSidebarHighlightClass(1)}`}
            title="New conversation"
          >
            <PlusIcon className="w-5 h-5" />
            {showNavOverlay && (
              <span className={`text-sm ${brandColors.text}`}>New</span>
            )}
          </button>
          <div className="h-px w-full bg-slate-200 dark:bg-white/10 my-1" />
          <button
            onClick={() =>
              setActivePane((prev) => (prev === 'chat' ? 'preview' : 'chat'))
            }
            className={`p-2 rounded-lg flex items-center ${showNavOverlay ? 'justify-start gap-3 px-3' : 'justify-center'} transition-all duration-300 ${
              activePane === 'chat'
                ? brandColors.btnPrimary
                : `${brandColors.bgSecondary} ${brandColors.textSecondary} ${brandColors.bgHover}`
            } ${getSidebarHighlightClass(2)}`}
            title="Chat"
          >
            <ChatBubbleLeftRightIcon className="w-5 h-5" />
            {showNavOverlay && (
              <span className={`text-sm ${brandColors.text}`}>Chat</span>
            )}
          </button>
          {/* Templates Button - Opens Built-in Templates Side Panel */}
          <button
            onClick={() => {
              setShowBuiltinTemplatesPanel(!showBuiltinTemplatesPanel);
              if (!showBuiltinTemplatesPanel) {
                // Close other panels when opening templates
                setShowChatPanel(false);
                setShowFilesPanel(false);
                setShowHistoryPanel(false);
              }
            }}
            className={`p-2 rounded-lg flex items-center ${showNavOverlay ? 'justify-start gap-3 px-3' : 'justify-center'} transition-all duration-300 ${
              showBuiltinTemplatesPanel
                ? brandColors.btnPrimary
                : `${brandColors.bgSecondary} ${brandColors.textSecondary} ${brandColors.bgHover}`
            } ${getSidebarHighlightClass(3)}`}
            title="Built-in Templates"
          >
            <RectangleGroupIcon className="w-5 h-5" />
            {showNavOverlay && (
              <span className={`text-sm ${brandColors.text}`}>Templates</span>
            )}
          </button>
          <button
            onClick={() =>
              setActivePane((prev) => (prev === 'files' ? 'preview' : 'files'))
            }
            className={`p-2 rounded-lg flex items-center ${showNavOverlay ? 'justify-start gap-3 px-3' : 'justify-center'} transition-all duration-300 ${
              activePane === 'files'
                ? brandColors.btnPrimary
                : `${brandColors.bgSecondary} ${brandColors.textSecondary} ${brandColors.bgHover}`
            } ${getSidebarHighlightClass(4)}`}
            title="Files"
          >
            <FolderIcon className="w-5 h-5" />
            {showNavOverlay && (
              <span className={`text-sm ${brandColors.text}`}>Files</span>
            )}
          </button>
          <button
            onClick={() =>
              setActivePane((prev) =>
                prev === 'preview' ? 'preview' : 'preview'
              )
            }
            className={`p-2 rounded-lg flex items-center ${showNavOverlay ? 'justify-start gap-3 px-3' : 'justify-center'} transition-all duration-300 ${
              activePane === 'preview'
                ? brandColors.btnPrimary
                : `${brandColors.bgSecondary} ${brandColors.textSecondary} ${brandColors.bgHover}`
            } ${getSidebarHighlightClass(5)}`}
            title="Preview"
          >
            <EyeIcon className="w-5 h-5" />
            {showNavOverlay && (
              <span className={`text-sm ${brandColors.text}`}>Preview</span>
            )}
          </button>
          <div className="h-px w-full bg-slate-100 dark:bg-white/5 my-1" />
          <button
            onClick={() => {
              setActivePane('preview');
              setPreviewDevice('desktop');
            }}
            className={`p-2 rounded-lg flex items-center ${showNavOverlay ? 'justify-start gap-3 px-3' : 'justify-center'} transition-all duration-300 ${
              activePane === 'preview' && previewDevice === 'desktop'
                ? brandColors.btnPrimary
                : `${brandColors.bgSecondary} ${brandColors.textSecondary} ${brandColors.bgHover}`
            } ${getSidebarHighlightClass(6)}`}
            title="Desktop preview"
          >
            <ComputerDesktopIcon className="w-5 h-5" />
            {showNavOverlay && (
              <span className={`text-sm ${brandColors.text}`}>Desktop</span>
            )}
          </button>
          <button
            onClick={() => {
              setActivePane('preview');
              setPreviewDevice('tablet');
            }}
            className={`p-2 rounded-lg flex items-center ${showNavOverlay ? 'justify-start gap-3 px-3' : 'justify-center'} transition-all duration-300 ${
              activePane === 'preview' && previewDevice === 'tablet'
                ? brandColors.btnPrimary
                : `${brandColors.bgSecondary} ${brandColors.textSecondary} ${brandColors.bgHover}`
            } ${getSidebarHighlightClass(7)}`}
            title="Tablet preview"
          >
            <DeviceTabletIcon className="w-5 h-5" />
            {showNavOverlay && (
              <span className={`text-sm ${brandColors.text}`}>Tablet</span>
            )}
          </button>
          <button
            onClick={() => {
              setActivePane('preview');
              setPreviewDevice('mobile');
            }}
            className={`p-2 rounded-lg flex items-center ${showNavOverlay ? 'justify-start gap-3 px-3' : 'justify-center'} transition-all duration-300 ${
              activePane === 'preview' && previewDevice === 'mobile'
                ? brandColors.btnPrimary
                : `${brandColors.bgSecondary} ${brandColors.textSecondary} ${brandColors.bgHover}`
            } ${getSidebarHighlightClass(8)}`}
            title="Mobile preview"
          >
            <DevicePhoneMobileIcon className="w-5 h-5" />
            {showNavOverlay && (
              <span className={`text-sm ${brandColors.text}`}>Mobile</span>
            )}
          </button>
          <button
            onClick={() =>
              setActivePane((prev) => (prev === 'code' ? 'preview' : 'code'))
            }
            className={`p-2 rounded-lg flex items-center ${showNavOverlay ? 'justify-start gap-3 px-3' : 'justify-center'} transition-all duration-300 ${
              activePane === 'code'
                ? brandColors.btnPrimary
                : `${brandColors.bgSecondary} ${brandColors.textSecondary} ${brandColors.bgHover}`
            } ${getSidebarHighlightClass(9)}`}
            title="Code"
          >
            <CodeBracketIcon className="w-5 h-5" />
            {showNavOverlay && (
              <span className={`text-sm ${brandColors.text}`}>Code</span>
            )}
          </button>
          {/* Split View Button */}
          <button
            onClick={() => setSplitView((prev) => !prev)}
            className={`p-2 rounded-lg flex items-center ${showNavOverlay ? 'justify-start gap-3 px-3' : 'justify-center'} transition-all duration-300 ${
              splitView
                ? brandColors.btnPrimary
                : `${brandColors.bgSecondary} ${brandColors.textSecondary} ${brandColors.bgHover}`
            } ${getSidebarHighlightClass(10)}`}
            title="Split view (Code + Preview)"
          >
            <Squares2X2Icon className="w-5 h-5" />
            {showNavOverlay && (
              <span className={`text-sm ${brandColors.text}`}>Split</span>
            )}
          </button>
          <div className="h-px w-full bg-slate-200 dark:bg-white/10 my-1" />
          <button
            onClick={() =>
              setActivePane((prev) =>
                prev === 'history' ? 'preview' : 'history'
              )
            }
            className={`p-2 rounded-lg flex items-center ${showNavOverlay ? 'justify-start gap-3 px-3' : 'justify-center'} transition-all duration-300 ${
              activePane === 'history'
                ? brandColors.btnPrimary
                : `${brandColors.bgSecondary} ${brandColors.textSecondary} ${brandColors.bgHover}`
            } ${getSidebarHighlightClass(11)}`}
            title="History"
          >
            <ClockIcon className="w-5 h-5" />
            {showNavOverlay && (
              <span className={`text-sm ${brandColors.text}`}>History</span>
            )}
          </button>
          <button
            onClick={() =>
              setActivePane((prev) =>
                prev === 'settings' ? 'preview' : 'settings'
              )
            }
            className={`p-2 rounded-lg flex items-center ${showNavOverlay ? 'justify-start gap-3 px-3' : 'justify-center'} transition-all duration-300 ${
              activePane === 'settings'
                ? brandColors.btnPrimary
                : `${brandColors.bgSecondary} ${brandColors.textSecondary} ${brandColors.bgHover}`
            } ${getSidebarHighlightClass(12)}`}
            title="Settings"
          >
            <Cog6ToothIcon className="w-5 h-5" />
            {showNavOverlay && (
              <span className={`text-sm ${brandColors.text}`}>Settings</span>
            )}
          </button>
          <div className="h-px w-full bg-slate-100 dark:bg-white/5 my-1" />
          {/* Deploy Button */}
          <button
            onClick={() =>
              setActivePane((prev) =>
                prev === 'deploy' ? 'preview' : 'deploy'
              )
            }
            className={`p-2 rounded-lg flex items-center ${showNavOverlay ? 'justify-start gap-3 px-3' : 'justify-center'} transition-all duration-300 ${
              activePane === 'deploy'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-900 dark:text-white'
                : `${brandColors.bgSecondary} ${brandColors.textSecondary} ${brandColors.bgHover}`
            } ${getSidebarHighlightClass(13)}`}
            title="Deploy"
          >
            <RocketLaunchIcon className="w-5 h-5" />
            {showNavOverlay && (
              <span className={`text-sm ${brandColors.text}`}>Deploy</span>
            )}
            {isDeploying && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
            )}
          </button>
          {/* Credentials Button */}
          <button
            onClick={() =>
              setActivePane((prev) =>
                prev === 'credentials' ? 'preview' : 'credentials'
              )
            }
            className={`p-2 rounded-lg flex items-center ${showNavOverlay ? 'justify-start gap-3 px-3' : 'justify-center'} transition-all duration-300 ${
              activePane === 'credentials'
                ? brandColors.btnPrimary
                : `${brandColors.bgSecondary} ${brandColors.textSecondary} ${brandColors.bgHover}`
            } ${getSidebarHighlightClass(14)}`}
            title="Deploy Credentials"
          >
            <KeyIcon className="w-5 h-5" />
            {showNavOverlay && (
              <span className={`text-sm ${brandColors.text}`}>Credentials</span>
            )}
            {deployCredentials.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500" />
            )}
          </button>
          <div className="h-px w-full bg-slate-100 dark:bg-white/5 my-1" />
          {/* Search Button */}
          <button
            onClick={() =>
              setActivePane((prev) =>
                prev === 'search' ? 'preview' : 'search'
              )
            }
            className={`p-2 rounded-lg flex items-center ${showNavOverlay ? 'justify-start gap-3 px-3' : 'justify-center'} transition-all duration-300 ${
              activePane === 'search'
                ? brandColors.btnPrimary
                : `${brandColors.bgSecondary} ${brandColors.textSecondary} ${brandColors.bgHover}`
            }`}
            title="Search in files"
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
            {showNavOverlay && (
              <span className={`text-sm ${brandColors.text}`}>Search</span>
            )}
          </button>
          {/* Terminal Button */}
          <button
            onClick={() =>
              setActivePane((prev) =>
                prev === 'terminal' ? 'preview' : 'terminal'
              )
            }
            className={`p-2 rounded-lg flex items-center ${showNavOverlay ? 'justify-start gap-3 px-3' : 'justify-center'} transition-all duration-300 ${
              activePane === 'terminal'
                ? brandColors.btnPrimary
                : `${brandColors.bgSecondary} ${brandColors.textSecondary} ${brandColors.bgHover}`
            }`}
            title="Terminal"
          >
            <CodeBracketIcon className="w-5 h-5" />
            {showNavOverlay && (
              <span className={`text-sm ${brandColors.text}`}>Terminal</span>
            )}
            {editorBridge.terminalHistory.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400" />
            )}
          </button>
        </div>
      </div>

      {/* =========== LEFT PANEL: AI CHAT =========== */}
      <div
        className={`${showChatPanel ? 'w-[320px]' : 'w-0'} flex flex-col ${brandColors.bgPanel} ${showChatPanel ? `${brandColors.border} border-r` : 'border-transparent'} relative z-10 transition-all duration-300 overflow-hidden`}
      >
        {/* Demo Restriction Overlay */}
        {showChatPanel && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="w-8 h-8 text-slate-900 dark:text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 text-center">
              🚫 Agent Chat Panel is not available in the demo
            </h3>
            <p className="text-gray-300 text-sm text-center mb-4 leading-relaxed">
              The AI Canvas Builder agent chat is a premium feature.
            </p>
            <p className="text-gray-300 text-sm text-center mb-5">
              Visit{' '}
              <a
                href="https://www.mumtaz.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline font-semibold"
              >
                www.mumtaz.ai
              </a>{' '}
              and sign up for full access.
            </p>
            <a
              href="https://www.mumtaz.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-slate-900 dark:text-white font-semibold hover:from-purple-600 hover:to-pink-600 transition-all text-center text-sm"
            >
              Sign Up Free 🚀
            </a>
          </div>
        )}
        {/* Header */}
        <div
          className={`flex items-center justify-between px-4 py-3 ${brandColors.border} border-b`}
        >
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${brandColors.gradientPrimary}`}>
              <SparklesIcon className="w-4 h-4 text-slate-900 dark:text-white" />
            </div>
            {showChatPanel && (
              <span className={`font-semibold ${brandColors.gradientText}`}>
                AI Canvas
              </span>
            )}
          </div>
          {showChatPanel && (
            <button
              onClick={() => {
                setActivePane('templates');
                setShowTemplates(true);
              }}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 ${
                showTemplates
                  ? brandColors.btnPrimary
                  : `${brandColors.bgSecondary} ${brandColors.textSecondary} ${brandColors.bgHover}`
              }`}
            >
              Temp
              <ChevronDownIcon
                className={`w-3 h-3 transition-transform ${showTemplates ? 'rotate-180' : ''}`}
              />
            </button>
          )}
        </div>

        {/* Templates Dropdown */}
        {showTemplates && showChatPanel && (
          <div
            className={`${brandColors.border} border-b max-h-80 overflow-hidden flex flex-col`}
          >
            {/* Category Tabs */}
            <div
              className={`flex overflow-x-auto p-2 gap-1 ${brandColors.border} border-b flex-shrink-0`}
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? brandColors.btnPrimary
                      : `${brandColors.textSecondary} ${brandColors.bgHover}`
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Templates Grid */}
            <div className="p-2 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-2">
                {filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className={`p-2.5 rounded-xl text-left transition-all hover:scale-[1.02] ${brandColors.bgSecondary} ${brandColors.bgHover} border ${brandColors.border} hover:border-cyan-500/50 group`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg group-hover:scale-110 transition-transform">
                        {template.icon}
                      </span>
                      <div>
                        <p
                          className={`text-xs font-medium ${brandColors.text}`}
                        >
                          {template.name}
                        </p>
                        <p className={`text-[10px] ${brandColors.textMuted}`}>
                          {template.category}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        {showChatPanel && (
          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-4 py-2.5 ${
                    msg.role === 'user'
                      ? brandColors.btnPrimary
                      : `${brandColors.bgSecondary} ${brandColors.text} border ${brandColors.border}`
                  }`}
                >
                  {msg.isStreaming ? (
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div
                          className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"
                          style={{ animationDelay: '0ms' }}
                        />
                        <div
                          className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"
                          style={{ animationDelay: '150ms' }}
                        />
                        <div
                          className="w-2 h-2 rounded-full bg-pink-400 animate-bounce"
                          style={{ animationDelay: '300ms' }}
                        />
                      </div>
                      <span className={`text-xs ${brandColors.textSecondary}`}>
                        Creating...
                      </span>
                    </div>
                  ) : (
                    <div
                      className="text-sm prose-invert"
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdown(msg.content),
                      }}
                    />
                  )}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {msg.attachments.map((file) => (
                        <span
                          key={file.id}
                          className="text-xs bg-slate-300 dark:bg-white/20 px-2 py-0.5 rounded"
                        >
                          📎 {file.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        )}

        {/* Uploaded Files - Image-to-Code indicator */}
        {uploadedFiles.length > 0 && showChatPanel && (
          <div className={`px-3 py-2 ${brandColors.border} border-t`}>
            {/* Show Image-to-Code badge if images uploaded */}
            {uploadedFiles.some((f) => f.type.startsWith('image/')) && (
              <div className="flex items-center gap-2 mb-2 px-2 py-1.5 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-lg border border-cyan-500/30">
                <SparklesIcon className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-cyan-300 font-medium">
                  🎨 Image-to-Code mode - I&apos;ll recreate this design!
                </span>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg ${brandColors.bgSecondary} text-xs border ${file.type.startsWith('image/') ? 'border-cyan-500/50' : brandColors.border}`}
                >
                  {file.type.startsWith('image/') ? (
                    <>
                      {/* Show image thumbnail */}
                      <Image
                        src={file.url}
                        alt={file.name}
                        width={32}
                        height={32}
                        className="object-cover rounded"
                      />
                      <span className={brandColors.text}>
                        {file.name.length > 15
                          ? file.name.slice(0, 12) + '...'
                          : file.name}
                      </span>
                    </>
                  ) : (
                    <>
                      <PhotoIcon className="w-3 h-3 text-cyan-400" />
                      <span className={brandColors.text}>
                        {file.name.slice(0, 12)}...
                      </span>
                    </>
                  )}
                  <button
                    onClick={() => removeUploadedFile(file.id)}
                    className="text-red-400 hover:text-red-300 ml-1"
                  >
                    <XCircleIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat Input */}
        {showChatPanel && (
          <div className={`p-3 ${brandColors.border} border-t`}>
            <div
              className={`flex items-end gap-2 rounded-xl ${brandColors.bgInput} p-2 border ${brandColors.border} focus-within:border-cyan-500/50 transition-colors`}
            >
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`p-2 rounded-lg ${brandColors.textSecondary} ${brandColors.bgHover} transition-colors`}
                title="Upload image"
              >
                <ArrowUpTrayIcon className="w-5 h-5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />

              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Describe what you want to create..."
                className={`flex-1 resize-none bg-transparent outline-none text-sm ${brandColors.text} placeholder-gray-500`}
                rows={2}
              />

              {isGenerating ? (
                <button
                  onClick={handleStopGeneration}
                  className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                  title="Stop generation"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              ) : (
                <button
                  id="canvas-submit-btn"
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim()}
                  className={`p-2 rounded-lg transition-all ${
                    chatInput.trim()
                      ? brandColors.btnPrimary
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* =========== TEMPLATES SIDE PANEL =========== */}
      <div
        className={`${showBuiltinTemplatesPanel ? 'w-[320px]' : 'w-0'} flex flex-col ${brandColors.bgPanel} ${showBuiltinTemplatesPanel ? `${brandColors.border} border-r` : 'border-transparent'} relative z-10 transition-all duration-300 overflow-hidden`}
      >
        {/* Panel Header */}
        <div
          className={`flex items-center justify-between px-4 py-3 ${brandColors.border} border-b flex-shrink-0`}
        >
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${brandColors.gradientPrimary}`}>
              <RectangleGroupIcon className="w-4 h-4 text-slate-900 dark:text-white" />
            </div>
            <span className={`font-semibold ${brandColors.gradientText}`}>
              Templates
            </span>
          </div>
          <button
            onClick={() => setShowBuiltinTemplatesPanel(false)}
            className={`p-1.5 rounded-lg ${brandColors.bgSecondary} ${brandColors.textSecondary} ${brandColors.bgHover}`}
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Category Tabs - Horizontal Scrollable */}
        <div
          className={`flex overflow-x-auto px-3 py-2 gap-1.5 ${brandColors.border} border-b flex-shrink-0 custom-scrollbar`}
        >
          {BUILTIN_TEMPLATE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setBuiltinTemplateCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                builtinTemplateCategory === cat
                  ? brandColors.btnPrimary
                  : `${brandColors.bgSecondary} ${brandColors.textSecondary} ${brandColors.bgHover}`
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Templates List - Scrollable */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          {filteredBuiltinTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleLoadBuiltinTemplate(template)}
              className={`group w-full p-3 rounded-xl text-left transition-all hover:scale-[1.01] ${brandColors.bgSecondary} border ${brandColors.border} hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10`}
            >
              {/* Template Preview Thumbnail */}
              <div
                className={`aspect-video rounded-lg mb-3 flex items-center justify-center text-3xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border ${brandColors.border} group-hover:border-cyan-500/30 transition`}
              >
                {template.thumbnail}
              </div>
              <div className="flex items-start gap-2">
                <span className="text-xl group-hover:scale-110 transition-transform">
                  {template.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <h3
                    className={`text-sm font-semibold ${brandColors.text} group-hover:text-cyan-400 transition truncate`}
                  >
                    {template.name}
                  </h3>
                  <p
                    className={`text-xs ${brandColors.textSecondary} mt-0.5 line-clamp-2`}
                  >
                    {template.description}
                  </p>
                  <span
                    className={`inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full ${brandColors.bgInput} ${brandColors.textMuted}`}
                  >
                    {template.category}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Panel Footer */}
        <div
          className={`px-3 py-2 ${brandColors.border} border-t flex-shrink-0`}
        >
          <p className={`text-[10px] ${brandColors.textMuted} text-center`}>
            💡 Click to load instantly, then customize with AI!
          </p>
        </div>
      </div>

      {/* =========== CENTER PANEL: FILES / HISTORY / SETTINGS / DEPLOY / CREDENTIALS / SEARCH / TERMINAL =========== */}
      <div
        className={`${showFilesPanel || showHistoryPanel || showDeployPanel || showCredentialsPanel || activePane === 'search' || activePane === 'terminal' ? 'w-[280px]' : 'w-0'} flex flex-col ${brandColors.bgPanel} ${showFilesPanel || showHistoryPanel || showDeployPanel || showCredentialsPanel || activePane === 'search' || activePane === 'terminal' ? `${brandColors.border} border-r` : 'border-transparent'} relative z-10 transition-all duration-300 overflow-hidden`}
      >
        <div
          className={`flex items-center gap-2 px-3 py-3 ${brandColors.border} border-b`}
        >
          {activePane === 'history' ? (
            <ClockIcon className={`w-4 h-4 ${brandColors.accentCyan}`} />
          ) : activePane === 'settings' ? (
            <Cog6ToothIcon className={`w-4 h-4 ${brandColors.accentCyan}`} />
          ) : activePane === 'deploy' ? (
            <RocketLaunchIcon className={`w-4 h-4 text-cyan-400`} />
          ) : activePane === 'credentials' ? (
            <KeyIcon className={`w-4 h-4 text-cyan-400`} />
          ) : activePane === 'search' ? (
            <MagnifyingGlassIcon className={`w-4 h-4 text-cyan-400`} />
          ) : activePane === 'terminal' ? (
            <CodeBracketIcon className={`w-4 h-4 text-green-400`} />
          ) : (
            <FolderIcon className={`w-4 h-4 ${brandColors.accentCyan}`} />
          )}
          {(showFilesPanel ||
            showHistoryPanel ||
            showDeployPanel ||
            showCredentialsPanel ||
            activePane === 'search' ||
            activePane === 'terminal') && (
            <span className={`text-sm font-medium ${brandColors.text}`}>
              {activePane === 'history'
                ? 'History'
                : activePane === 'settings'
                  ? 'Settings'
                  : activePane === 'deploy'
                    ? 'Deploy'
                    : activePane === 'credentials'
                      ? 'Credentials'
                      : activePane === 'search'
                        ? 'Search'
                        : activePane === 'terminal'
                          ? 'Terminal'
                          : 'Files'}
            </span>
          )}
          {generatedFiles.length > 0 &&
            showFilesPanel &&
            activePane !== 'history' && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${brandColors.gradientPrimary} text-slate-900 dark:text-white`}
              >
                {generatedFiles.length}
              </span>
            )}
        </div>

        {activePane === 'settings' && showHistoryPanel ? (
          /* =========== SETTINGS PANEL CONTENT =========== */
          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar space-y-4">
            {/* Agent Name Display */}
            <div
              className={`${brandColors.bgSecondary} border ${brandColors.border} rounded-xl p-4`}
            >
              <div
                className={`flex items-center gap-2 mb-2 ${brandColors.text}`}
              >
                <SparklesIcon className="w-4 h-4 text-purple-400" />
                <span className="font-semibold text-sm">Canvas Agent</span>
              </div>
              <div
                className={`text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent`}
              >
                {agentName || 'AI Assistant'}
              </div>
              <p className={`text-xs mt-1 ${brandColors.textSecondary}`}>
                Opened from this agent&apos;s chat
              </p>
            </div>

            {/* Fine-tune Best Practices */}
            <div
              className={`${brandColors.bgSecondary} border ${brandColors.border} rounded-xl p-4`}
            >
              <div
                className={`flex items-center gap-2 mb-3 ${brandColors.text}`}
              >
                <SparklesIcon className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold text-sm">
                  Fine-tune best practices
                </span>
              </div>
              <ul
                className={`space-y-2 text-xs ${brandColors.textSecondary} leading-relaxed`}
              >
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  Write one focused change request at a time.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  Share constraints: stack, style, data shapes, limits.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-400">•</span>
                  Provide examples: good/bad snippets and target tone.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  State outputs you need: code, plan, tests, or diffs.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  Call out blockers early (auth, CORS, missing APIs).
                </li>
              </ul>
            </div>

            {/* Quick Response Toggle */}
            <div
              className={`${brandColors.bgSecondary} border ${brandColors.border} rounded-xl p-4`}
            >
              <div
                className={`flex items-center justify-between ${brandColors.text}`}
              >
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-cyan-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span className="font-semibold text-sm">Quick Response</span>
                </div>
                <button
                  onClick={() => setQuickResponseMode(!quickResponseMode)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                    quickResponseMode
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500'
                      : `${brandColors.bgInput}`
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                      quickResponseMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <p className={`text-xs mt-2 ${brandColors.textSecondary}`}>
                {quickResponseMode
                  ? '⚡ Faster responses with smaller model'
                  : '🧠 Smarter responses with larger model'}
              </p>
            </div>

            {/* Temperature Setting */}
            <div
              className={`${brandColors.bgSecondary} border ${brandColors.border} rounded-xl p-4`}
            >
              <div
                className={`flex items-center justify-between mb-3 ${brandColors.text}`}
              >
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-pink-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <span className="font-semibold text-sm">Temperature</span>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${brandColors.bgInput} ${brandColors.textSecondary}`}
                >
                  {temperature.toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                title="Adjust temperature"
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500"
                style={{
                  background: `linear-gradient(to right, #06b6d4 0%, #a855f7 ${(temperature / 2) * 100}%, #1e1e2a ${(temperature / 2) * 100}%)`,
                }}
              />
              <div
                className={`flex justify-between text-[10px] mt-1 ${brandColors.textMuted}`}
              >
                <span>Precise</span>
                <span>Balanced</span>
                <span>Creative</span>
              </div>
            </div>

            {/* Max Tokens Setting */}
            <div
              className={`${brandColors.bgSecondary} border ${brandColors.border} rounded-xl p-4`}
            >
              <div
                className={`flex items-center justify-between mb-3 ${brandColors.text}`}
              >
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-cyan-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="font-semibold text-sm">Max Tokens</span>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${brandColors.bgInput} ${brandColors.textSecondary}`}
                >
                  {maxTokens.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="1024"
                max="16384"
                step="512"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                title="Adjust max tokens"
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #06b6d4 0%, #a855f7 ${((maxTokens - 1024) / (16384 - 1024)) * 100}%, #1e1e2a ${((maxTokens - 1024) / (16384 - 1024)) * 100}%)`,
                }}
              />
              <div
                className={`flex justify-between text-[10px] mt-1 ${brandColors.textMuted}`}
              >
                <span>1K</span>
                <span>8K</span>
                <span>16K</span>
              </div>
            </div>
          </div>
        ) : activePane === 'history' && showHistoryPanel ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* History Search Bar */}
            <div className={`p-2 ${brandColors.border} border-b flex-shrink-0`}>
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg ${brandColors.bgInput} border ${brandColors.border}`}
              >
                <MagnifyingGlassIcon
                  className={`w-4 h-4 ${brandColors.textMuted}`}
                />
                <input
                  type="text"
                  placeholder="Search history..."
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  className={`flex-1 bg-transparent text-sm ${brandColors.text} placeholder:${brandColors.textMuted} outline-none`}
                />
                {historySearchQuery && (
                  <button
                    onClick={() => setHistorySearchQuery('')}
                    className={`${brandColors.textSecondary} hover:${brandColors.text}`}
                  >
                    <XCircleIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            {/* History List */}
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-2">
              {filteredHistoryEntries.length === 0 ? (
                <div
                  className={`text-center py-8 ${brandColors.textSecondary}`}
                >
                  <ClockIcon className="w-8 h-8 opacity-50 mx-auto mb-2" />
                  <p className="text-xs">
                    {historySearchQuery
                      ? 'No matching results'
                      : 'No history yet'}
                  </p>
                  <p className={`text-[10px] mt-1 ${brandColors.textMuted}`}>
                    {historySearchQuery
                      ? 'Try a different search term'
                      : 'Generate something to see it here'}
                  </p>
                </div>
              ) : (
                filteredHistoryEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className={`border ${brandColors.border} rounded-lg p-2 ${brandColors.bgSecondary} ${brandColors.bgHover} transition-all relative`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-col">
                        <span
                          className={`text-sm font-medium ${brandColors.text}`}
                        >
                          {entry.name || 'Untitled build'}
                        </span>
                        <span
                          className={`text-[11px] ${brandColors.textMuted}`}
                        >
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setGeneratedCode(entry.code);
                            setViewMode('code');
                            setActivePane('code');
                            setOpenHistoryMenuId(null);
                          }}
                          className={`text-xs ${brandColors.accentCyan} hover:text-cyan-300 px-2 py-1 rounded-lg ${brandColors.bgHover}`}
                        >
                          Open
                        </button>
                        <div className="relative">
                          <button
                            onClick={() =>
                              setOpenHistoryMenuId((prev) =>
                                prev === entry.id ? null : entry.id
                              )
                            }
                            className={`p-1 rounded-lg ${brandColors.bgHover} ${brandColors.textSecondary} hover:${brandColors.text}`}
                            title="More options"
                          >
                            <EllipsisHorizontalIcon className="w-5 h-5" />
                          </button>
                          {openHistoryMenuId === entry.id && (
                            <div
                              className={`absolute right-0 mt-2 w-36 rounded-lg border ${brandColors.border} ${brandColors.bgPanel} shadow-lg z-10`}
                            >
                              <button
                                onClick={() =>
                                  handleRenameHistoryEntry(entry.id)
                                }
                                className={`w-full text-left px-3 py-2 text-sm ${brandColors.text} ${brandColors.bgHover}`}
                              >
                                Rename
                              </button>
                              <button
                                onClick={() =>
                                  handleDownloadHistoryEntry(entry)
                                }
                                className={`w-full text-left px-3 py-2 text-sm ${brandColors.text} ${brandColors.bgHover}`}
                              >
                                Download
                              </button>
                              <button
                                onClick={() => handleShareHistoryEntry(entry)}
                                className={`w-full text-left px-3 py-2 text-sm ${brandColors.text} ${brandColors.bgHover}`}
                              >
                                Share
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteHistoryEntry(entry.id)
                                }
                                className={`w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 ${brandColors.bgHover}`}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className={`text-xs mt-2 ${brandColors.textSecondary}`}>
                      {entry.prompt}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          showFilesPanel && (
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              {generatedFiles.length > 0 ? (
                <div className="space-y-1">
                  {generatedFiles.map((file) => (
                    <button
                      key={file.id}
                      onClick={() => {
                        setSelectedFile(file);
                        setViewMode('code');
                      }}
                      className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-all group ${
                        selectedFile?.id === file.id
                          ? `${brandColors.btnPrimary}`
                          : `${brandColors.bgSecondary} ${brandColors.bgHover} border ${brandColors.border} hover:border-cyan-500/30`
                      }`}
                    >
                      <span className="text-sm group-hover:scale-110 transition-transform">
                        {FILE_ICONS[file.language] || FILE_ICONS.plaintext}
                      </span>
                      <span
                        className={`text-xs truncate ${selectedFile?.id === file.id ? 'text-slate-900 dark:text-white' : brandColors.text}`}
                      >
                        {file.name}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div
                  className={`text-center py-8 ${brandColors.textSecondary}`}
                >
                  <div
                    className={`w-10 h-10 mx-auto rounded-lg ${brandColors.bgSecondary} flex items-center justify-center mb-2`}
                  >
                    <DocumentIcon className="w-5 h-5 opacity-50" />
                  </div>
                  <p className="text-xs">No files yet</p>
                  <p className={`text-[10px] mt-1 ${brandColors.textMuted}`}>
                    AI will create files here
                  </p>
                </div>
              )}
            </div>
          )
        )}

        {/* ===== DEPLOY PANEL ===== */}
        {activePane === 'deploy' && showDeployPanel && (
          <div className="flex-1 overflow-hidden">
            <DeploymentPanel
              files={generatedFiles}
              projectName={historyEntries[0]?.name || 'canvas-project'}
              framework="html"
              credentials={deployCredentials}
              activeDeployment={activeDeployment}
              deployments={deployments}
              isDeploying={isDeploying}
              deployError={deployError}
              onDeploy={deployProject}
              onUndeploy={undeployProject}
              onOpenCredentials={() => setActivePane('credentials')}
              onClearError={clearDeployError}
            />
          </div>
        )}

        {/* ===== CREDENTIALS PANEL ===== */}
        {activePane === 'credentials' && showCredentialsPanel && (
          <div className="flex-1 overflow-hidden">
            <DeployCredentialsPanel
              credentials={deployCredentials}
              onSave={saveCredential}
              onDelete={deleteCredential}
              onValidate={validateCredential}
              isLoading={isLoadingCredentials}
              onClose={() => setActivePane('deploy')}
            />
          </div>
        )}

        {/* ===== SEARCH PANEL ===== */}
        {activePane === 'search' && (
          <div className="flex-1 overflow-hidden">
            <SearchPanel
              onSearch={editorBridge.searchInFiles}
              onNavigate={(path, line) => {
                editorBridge.openFile(path, line);
                setActivePane('code');
              }}
              onClose={() => setActivePane('preview')}
            />
          </div>
        )}

        {/* ===== TERMINAL PANEL ===== */}
        {activePane === 'terminal' && (
          <div className="flex-1 overflow-hidden">
            <TerminalPanel
              history={editorBridge.terminalHistory}
              onRunCommand={editorBridge.runCommand}
              onClear={editorBridge.clearTerminal}
              onClose={() => setActivePane('preview')}
            />
          </div>
        )}

        {/* ===== DIFF VIEWER ===== */}
        {editorBridge.diffState && (
          <div className="absolute inset-0 z-50">
            <DiffViewer
              path={editorBridge.diffState.path}
              originalContent={editorBridge.diffState.originalContent}
              modifiedContent={editorBridge.diffState.modifiedContent}
              description={editorBridge.diffState.description}
              onApply={() => {
                editorBridge.applyDiff(
                  editorBridge.diffState!.path,
                  editorBridge.diffState!.modifiedContent
                );
              }}
              onReject={() => editorBridge.closeDiff()}
            />
          </div>
        )}

        {/* Generation Status */}
        {isGenerating && showFilesPanel && activePane !== 'history' && (
          <div className={`px-3 py-2 ${brandColors.border} border-t`}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className={`text-xs ${brandColors.accentCyan}`}>
                Generating...
              </span>
            </div>
          </div>
        )}
      </div>

      {/* =========== RIGHT PANEL: CODE / PREVIEW =========== */}
      <div className="flex-1 min-w-0 flex flex-col relative z-10 overflow-hidden">
        {/* Toolbar */}
        <div
          className={`flex items-center justify-between px-4 py-2 ${brandColors.border} border-b ${brandColors.bgSecondary}`}
        >
          <div className="flex items-center">
            <span
              className={`text-sm font-semibold ${brandColors.gradientText}`}
            >
              One Last AI
            </span>
          </div>
          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopyCode}
              disabled={!generatedCode}
              className={`p-2 rounded-lg transition-all ${brandColors.textSecondary} ${brandColors.bgHover} disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Copy code"
            >
              {copySuccess ? (
                <CheckCircleIcon className="w-4 h-4 text-green-400" />
              ) : (
                <DocumentDuplicateIcon className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={handleOpenInNewTab}
              disabled={!generatedCode}
              className={`p-2 rounded-lg ${brandColors.textSecondary} ${brandColors.bgHover} disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Open in new tab"
            >
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              disabled={!generatedCode}
              className={`p-2 rounded-lg ${brandColors.textSecondary} ${brandColors.bgHover} disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Download"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
            </button>
            <div className={`w-px h-6 ${brandColors.bgSecondary} mx-1`} />
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
              title="Close"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className={`flex-1 overflow-hidden ${brandColors.bgMain}`}>
          {splitView ? (
            /* ===== SPLIT VIEW: Code + Preview Side by Side ===== */
            <div className="flex w-full h-full">
              {/* Left: Code Editor */}
              <div className={`w-1/2 h-full border-r ${brandColors.border}`}>
                {selectedFile || generatedCode ? (
                  <div className="h-full">
                    <MonacoEditor
                      height="100%"
                      defaultLanguage="html"
                      language={
                        selectedFile
                          ? getMonacoLanguage(selectedFile.language)
                          : 'html'
                      }
                      theme="vs-dark"
                      value={selectedFile?.content || generatedCode}
                      onMount={editorBridge.handleEditorMount}
                      onChange={(value) => {
                        if (selectedFile && value !== undefined) {
                          editorBridge.writeFile(selectedFile.path, value);
                        }
                      }}
                      options={{
                        readOnly: false,
                        minimap: { enabled: false },
                        lineNumbers: 'on',
                        wordWrap: 'on',
                        scrollBeyondLastLine: false,
                        fontSize: 12,
                        padding: { top: 8, bottom: 8 },
                      }}
                      loading={
                        <div
                          className={`flex flex-col items-center justify-center h-full ${brandColors.bgMain}`}
                        >
                          <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-2" />
                          <p className={`text-xs ${brandColors.textSecondary}`}>
                            Loading...
                          </p>
                        </div>
                      }
                    />
                  </div>
                ) : (
                  <div
                    className={`flex flex-col items-center justify-center h-full ${brandColors.textSecondary}`}
                  >
                    <CodeBracketIcon className="w-10 h-10 opacity-30 mb-2" />
                    <p className="text-xs">No code yet</p>
                  </div>
                )}
              </div>
              {/* Right: Preview */}
              <div className="w-1/2 h-full p-2 overflow-auto">
                {generatedCode ? (
                  <div className="w-full h-full bg-white rounded-lg overflow-hidden">
                    <iframe
                      ref={previewRef}
                      title="Preview"
                      className="w-full h-full border-none"
                      sandbox="allow-scripts allow-same-origin allow-modals allow-forms allow-popups"
                    />
                  </div>
                ) : (
                  <div
                    className={`flex flex-col items-center justify-center h-full ${brandColors.textSecondary} relative overflow-hidden`}
                  >
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" />
                      <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                    </div>
                    <p className="text-[10px] opacity-30 tracking-widest uppercase relative z-10">Canvas Preview</p>
                  </div>
                )}
              </div>
            </div>
          ) : viewMode === 'preview' ? (
            /* ===== PREVIEW VIEW ===== */
            <div className="w-full h-full overflow-auto">
              {generatedCode ? (
                <div
                  className={`${deviceStyles[previewDevice]} bg-white rounded-xl overflow-hidden transition-all duration-300`}
                  style={{
                    boxShadow:
                      '0 0 60px rgba(34, 211, 238, 0.15), 0 0 30px rgba(168, 85, 247, 0.1)',
                  }}
                >
                  <iframe
                    ref={previewRef}
                    title="Preview"
                    className="w-full h-full border-none"
                    sandbox="allow-scripts allow-same-origin allow-modals allow-forms allow-popups"
                  />
                </div>
              ) : (
                <div
                  className={`flex items-center justify-center w-full h-full ${brandColors.textSecondary} relative overflow-hidden`}
                >
                  {/* Animated background effects */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-cyan-500/8 rounded-full blur-[100px] animate-pulse" />
                    <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-purple-500/8 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1.5s' }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '3s' }} />
                  </div>
                  {/* ASCII Art - Full Screen */}
                  <pre className="w-full h-full font-mono select-none whitespace-pre overflow-hidden flex items-center justify-center text-[0.55vw] leading-[0.7vw] opacity-[0.18] bg-gradient-to-b from-cyan-400/80 via-purple-400/60 to-pink-400/80 bg-clip-text text-transparent">
{`.==========================================================================================================.
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%#@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@#*@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@#*@%%%%%@@@@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@%@@%%%%%%%%%@@@@@%@@@%*@@@@%@@@@@%%%%%%%%@@@%@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%@#==#@@%%%%@@@*=++@@*-@##@@#@@@   @@@@%%%@@@==+@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%@%#@@=@@@@@%=@@#+++@@@@@   @@@#%#@@**@@@@@+%@@#@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%@%++=#@*%#%@+==@++*@@@@     @   @#+=@@#%#%@==+*@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%@%%@#++%@++=++@%+%%@@@   @=@   @@@#+=++#@+++%@%@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%@@=%@+*++++*@-#@@@@@@   %%#   @@@@=@@+++++++@=+@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%@%*%@+*+++@*%@@@%@@@   ###   @ @@@@@=@%++*++@+#@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@%+@+++@%*@@%%%@@@   #@@   %-  @@@@@%#@++++@=@@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%@@@@@@@#@++@%@@@@%%@@@   #@@  -@%%*  @@@@@@*@+++@#@@@@@@%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%##%%%%%@#===@+=++***++==#%%@#   #@#           @@+=+++*#++==@%===@%%%%%%*%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%%%%%%%%%%%%=
=%%%%%%%%%%@@@       -@@= @@@@@@ -@@ :      +@@@@@@. @@@@@@@@@@@@=+@@@@@@@..      @+   .:    %@%%%%%%%%%%%%=
=%%%%%%%%%%@@  -   -  #@    @@@@  @@  @@@@@=@@%%%@@  @@%%%%%%@@=    @@@%@  #@@@@*-@+  -      %@%%%%%%%%%%%%=
=%%%%%%%%%%@@  @@@@@+ @@: @   @@  @@        -@%%%@@  @@%%%%%@@%  @@  @@@@        +@@@@@  @@@@@@%%%%%%%%%%%%=
=%%%%%%%%%%@@  @@@@@@ @@. @@@     @@ @@@@@@@@@%%%@@  @@@@@@@@=  @     %@@@@@@@@@  @@%%@  #@%%%%%%%%%%%%%%%%=
=%%%%%%%%%%@@         #@  :@@@@   @@         @%%%%@        @   @@@@@@   @         @@%%@   @%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%%%@@@@@%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%++%%%%%%#+=*@#+***********+++**#++####+=****+++************@%=++@%%%%%#=#%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%@@%%%%%%@@=@@%%@@@@@@@@%#@@@@%=@@%**=@=@@%+@@@@@*@@@@@@@@@#@@*#@%%%%%%@@@%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%@@@%%@#=+%=##+@@@%%@%==#@%**+@@=++@%%%@@%*@=++=+@@%%@@%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@@%=+@+%@+#@@@%@@@@@@@@@@@@@@@%@@@=@@+*%=+@@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@@@=+@+@=@++@@@@@%%%%%%%%%@@@@%=@#+#@*=#@@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@@%%@=##=%%=+#%@@@@@@@@@#*=#@++@++@=@@@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@@@@@@@%@%+**++@@=@+@@+@=#@%+**+*@@%@@@@@@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=%%%=%@@@@@@*@+%=#@++@@++@*#@@@@@@@=%%@=#%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@@@%%*@%%%%@@@=@*+@*+++@#+@+#@%@%%%@##%@@@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%@@@%%%%@@@@%%%%#+@@@@@@%###@@@@@@@=@%%%%@@@@%%%%@@@%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%#=%%%%%#=%%%%%%#+@%%%%%@@@@@%%%%%%=@%%%%%+=%%%%%+=@%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%@@@%%%%@@@%%%%%@@%%%%%%@*+@%%%%%%@@@%%%%%@@@%%%%@@@%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@%#@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
.==========================================================================================================.`}
                  </pre>
                  {isGenerating && (
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-xs text-cyan-300 z-10">
                      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      <span>Generating preview...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* ===== CODE VIEW ===== */
            <div className="w-full h-full overflow-hidden">
              {selectedFile || generatedCode ? (
                <div className="h-full">
                  <MonacoEditor
                    height="100%"
                    defaultLanguage="html"
                    language={
                      selectedFile
                        ? getMonacoLanguage(selectedFile.language)
                        : 'html'
                    }
                    theme="vs-dark"
                    value={selectedFile?.content || generatedCode}
                    onMount={editorBridge.handleEditorMount}
                    onChange={(value) => {
                      if (selectedFile && value !== undefined) {
                        editorBridge.writeFile(selectedFile.path, value);
                      }
                    }}
                    options={{
                      readOnly: false,
                      minimap: { enabled: false },
                      lineNumbers: 'on',
                      wordWrap: 'on',
                      scrollBeyondLastLine: false,
                      fontSize: 13,
                      padding: { top: 12, bottom: 12 },
                    }}
                    loading={
                      <div
                        className={`flex flex-col items-center justify-center h-full ${brandColors.bgMain}`}
                      >
                        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3" />
                        <p className={`text-sm ${brandColors.textSecondary}`}>
                          Loading editor...
                        </p>
                      </div>
                    }
                  />
                </div>
              ) : (
                <div
                  className={`flex flex-col items-center justify-center h-full ${brandColors.textSecondary}`}
                >
                  <CodeBracketIcon className="w-12 h-12 opacity-30 mb-3" />
                  <p className="text-sm">No code yet</p>
                  <p className={`text-xs ${brandColors.textMuted}`}>
                    Generated code will appear here
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div
          className={`flex items-center justify-between px-4 py-2 ${brandColors.border} border-t ${brandColors.bgSecondary}`}
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {generationStatus === 'generating' && (
                <>
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className={`text-xs ${brandColors.accentCyan}`}>
                    Generating...
                  </span>
                </>
              )}
              {generationStatus === 'success' && (
                <>
                  <CheckCircleIcon className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-green-400">Ready</span>
                </>
              )}
              {generationStatus === 'error' && (
                <>
                  <ExclamationCircleIcon className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-red-400">Error</span>
                </>
              )}
              {generationStatus === 'idle' && (
                <>
                  <span
                    className={`w-2 h-2 rounded-full ${brandColors.bgSecondary}`}
                  />
                  <span className={`text-xs ${brandColors.textMuted}`}>
                    Waiting
                  </span>
                </>
              )}
            </div>
            {selectedFile && viewMode === 'code' && (
              <span className={`text-xs ${brandColors.textSecondary}`}>
                {selectedFile.name} • {(selectedFile.size / 1024).toFixed(1)} KB
              </span>
            )}
          </div>
          <span className={`text-xs ${brandColors.gradientText}`}>
            Powered by AI Canvas ✨
          </span>
        </div>
      </div>

      {/* ===== TOAST NOTIFICATIONS ===== */}
      <ToastContainer
        toasts={editorBridge.toasts}
        onDismiss={editorBridge.dismissToast}
      />

      {/* ===== APPROVAL MODAL ===== */}
      {editorBridge.pendingApproval && (
        <ApprovalModal
          approval={editorBridge.pendingApproval}
          onApprove={() => editorBridge.resolveApproval(true)}
          onReject={() => editorBridge.resolveApproval(false)}
        />
      )}

      {/* Custom scrollbar styles and animations */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(34, 211, 238, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(34, 211, 238, 0.5);
        }
        @keyframes phoneRotate {
          0%,
          100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(-15deg);
          }
          50% {
            transform: rotate(-90deg) scale(1.1);
          }
          75% {
            transform: rotate(-75deg);
          }
        }
        @keyframes spinArrow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
