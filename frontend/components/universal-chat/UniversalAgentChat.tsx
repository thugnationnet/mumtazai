'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import hljs from 'highlight.js';
import {
  PaperAirplaneIcon,
  MicrophoneIcon,
  PaperClipIcon,
  PhoneIcon,
  StopIcon,
  ChatBubbleLeftIcon,
  PhotoIcon,
  CodeBracketIcon,
  MagnifyingGlassIcon,
  FilmIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/solid';
import {
  HandThumbUpIcon,
  HandThumbDownIcon,
  ClipboardDocumentIcon,
  ShareIcon,
  SpeakerWaveIcon,
  ArrowPathIcon,
  PencilIcon,
  XMarkIcon,
  SparklesIcon,
  MapPinIcon,
  BookmarkIcon,
} from '@heroicons/react/24/outline';
import {
  MapPinIcon as MapPinSolidIcon,
  BookmarkIcon as BookmarkSolidIcon,
} from '@heroicons/react/24/solid';
import EnhancedChatLayout, { useChatTheme } from './EnhancedChatLayout';
import Overlay from './components/Overlay';
import { AgentSettings } from './ChatSettingsPanel';
import QuickActionsPanel from './QuickActionsPanel';
import type { MemorySettings, AutoMemory } from './QuickActionsPanel';
import RealtimeVoiceChat from './RealtimeVoiceChat';
// CodeBlock type (was in realtimeChatService.ts)
interface CodeBlock {
  language: string;
  code: string;
  filename?: string;
}
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptions } from '@/contexts/SubscriptionContext';
// Image import removed — using native <img> for external URLs (DALL-E, S3) to avoid Next.js proxy issues
import { FormattedTime } from '@/components/FormattedDateTime';
import { FileOperationsPanel, detectLanguage } from './FilePreviewPanel';
import type { FileOperation } from './FilePreviewPanel';
import type { ResearchTab } from './ResearchPanel';
import type { MapTab } from './MapPanel';

interface MessageAttachment {
  name: string;
  type: string;
  url?: string;
  preview?: string; // For displaying image thumbnail
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  codeBlocks?: CodeBlock[];
  attachments?: MessageAttachment[]; // Store attachments separately for display
  fileOperations?: FileOperation[]; // File operations from tool calls
}

interface ChatSession {
  id: string;
  name: string;
  messages: Message[];
  lastMessage?: string;
  messageCount?: number;
  updatedAt?: Date;
}

interface ChatAttachment {
  name: string;
  type: string;
  url?: string;
  data?: string;
}

export interface AgentChatConfig {
  id: string;
  name: string;
  icon: string;
  description?: string;
  systemPrompt: string;
  welcomeMessage: string;
  specialties?: string[];
  color?: string;
  aiProvider?: {
    primary:
      | 'openai'
      | 'anthropic'
      | 'gemini'
      | 'cohere'
      | 'mistral'
      | 'xai'
      | 'huggingface'
      | 'groq'
      | 'cerebras';
    fallbacks: string[];
    model: string;
    reasoning?: string;
  };
}

interface UniversalAgentChatProps {
  agent: AgentChatConfig;
}

const getSpeechRecognition = () => {
  if (typeof window === 'undefined') return null;
  const SR =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;
  return SR || null;
};

// Helper function to extract text content from React children
// This fixes the [object Object] issue when copying code blocks
const extractTextFromChildren = (children: React.ReactNode): string => {
  if (typeof children === 'string') {
    return children;
  }
  if (typeof children === 'number') {
    return String(children);
  }
  if (Array.isArray(children)) {
    return children.map(extractTextFromChildren).join('');
  }
  if (children && typeof children === 'object' && 'props' in children) {
    const element = children as React.ReactElement;
    return extractTextFromChildren(element.props?.children);
  }
  return '';
};

// Helper function to extract base64 images from markdown content
// This prevents markdown parsers from choking on very long data URLs
interface ExtractedImage {
  src: string;
  alt: string;
}

// Generate a short topic title from a user message (max 50 chars, trimmed to word boundary)
const generateSessionTitle = (messageText: string): string => {
  // Strip markdown, extra whitespace, and common prefixes
  const cleaned = messageText
    .replace(/[#*_~`>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return 'New Chat';

  // If short enough, use as-is
  if (cleaned.length <= 50) return cleaned;

  // Trim to 50 chars at word boundary
  const truncated = cleaned.slice(0, 50);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 20 ? truncated.slice(0, lastSpace) : truncated) + '…';
};

// Normalize code fences so ReactMarkdown parses them correctly.
// Some AI models use 4+ backticks for safety (when HTML may contain ```).
// CommonMark requires the closing fence to have >= the opening count,
// Protect code blocks from text processing by extracting them as placeholders.
// Uses a line-by-line state machine (like CommonMark) instead of the fragile
// regex split /(```[\s\S]*?```)/ that breaks when HTML code contains ``` sequences
// (e.g. in JS template literals), causing the split to misalign and HTML tags
// in the code to be stripped by downstream processors.
const protectCodeBlocks = (content: string): { text: string; blocks: string[] } => {
  const lines = content.split('\n');
  const output: string[] = [];
  const blocks: string[] = [];
  let inFence = false;
  let fenceLen = 0;
  let blockLines: string[] = [];

  const mdSignals = [
    /\*\*[^*]+\*\*/,
    /^\s*[-*]\s+/,
    /^\s*#{1,4}\s+/,
    /^\s*\d+\.\s+/,
    /[🌟🔮✨💡🎯🚀📁🎮💻⭐🔧✅❌🌙🔭🌠🌌🎆🎪🏆💎🔥⚡🌈]/,
  ];

  for (const line of lines) {
    if (!inFence) {
      // Opening fence: 0-3 leading spaces, 3+ backticks, optional language tag
      const open = line.match(/^ {0,3}(`{3,})\s*(\w*)\s*$/);
      if (open) {
        inFence = true;
        fenceLen = open[1].length;
        blockLines = [open[2] || '']; // store language tag as first element
        continue;
      }
      output.push(line);
    } else {
      // Closing fence: 0-3 leading spaces, backticks >= opening count
      const close = line.match(/^ {0,3}(`{3,})\s*$/);
      if (close && close[1].length >= fenceLen) {
        inFence = false;
        const lang = blockLines[0];
        const inner = blockLines.slice(1);

        // Detect whole-response markdown wrapper: bare ``` (no language) wrapping
        // content with >15% markdown signals — unwrap instead of treating as code
        if (!lang && inner.length > 0) {
          const mdCount = inner.filter(l => mdSignals.some(r => r.test(l))).length;
          if (mdCount / inner.length > 0.15) {
            output.push(...inner);
            blockLines = [];
            continue;
          }
        }

        // Real code block — store with normalized 3-backtick fences
        const block = '```' + lang + '\n' + inner.join('\n') + '\n```';
        blocks.push(block);
        output.push(`___CODEBLOCK_${blocks.length - 1}___`);
        blockLines = [];
        continue;
      }
      blockLines.push(line);
    }
  }

  // Close any unclosed fence (e.g. during streaming)
  if (inFence && blockLines.length > 0) {
    const lang = blockLines[0];
    const inner = blockLines.slice(1);
    if (inner.length > 0) {
      const block = '```' + lang + '\n' + inner.join('\n') + '\n```';
      blocks.push(block);
      output.push(`___CODEBLOCK_${blocks.length - 1}___`);
    }
  }

  return { text: output.join('\n'), blocks };
};

const restoreCodeBlocks = (text: string, blocks: string[]): string => {
  return text.replace(/___CODEBLOCK_(\d+)___/g, (_, i) => blocks[parseInt(i)]);
};

// Remove roleplay action text (like *shifts slightly*, *Throws hands dramatically*, etc.)
// These are the AI's internal "brain" actions that shouldn't be shown to users
const cleanRoleplayActions = (content: string): string => {
  // Strip ALL tool notification markers — tools run silently in background
  let cleaned = content
    .replace(/🔧\s*\*{1,2}Using\s+[^*\n]+?\.\.\.\*{1,2}\s*/g, '')   // 🔧 *Using tool...* or 🔧 **Using tool...**
    .replace(/🔧\s*\*{1,2}[^*\n]+?\*{1,2}\s*/g, '')                   // Any other 🔧 *text* or 🔧 **text**
    .replace(/[✅❌]\s*\*{0,2}[\w_]+\*{0,2}\s*(completed|failed)\s*/g, '') // ✅ **tool_name** completed / ❌ tool failed
    .replace(/\n{3,}/g, '\n\n');                                        // Clean up blank lines left behind

  // Split content to protect code blocks from being modified
  const parts = cleaned.split(/(```[\s\S]*?```)/g);

  // Comprehensive list of action/roleplay verbs (lowercase) — covers all common stage directions
  const actionVerbs = new Set([
    'shifts', 'looks', 'sighs', 'gasps', 'laughs', 'nods', 'waves', 'pauses',
    'smiles', 'grins', 'winks', 'clears', 'leans', 'stands', 'sits', 'walks',
    'turns', 'adjusts', 'gestures', 'chuckles', 'whispers', 'shrugs', 'snaps',
    'claps', 'rolls', 'raises', 'crosses', 'taps', 'scratches', 'stretches',
    'flexes', 'cracks', 'throws', 'dramatically', 'flourishes', 'strikes',
    'bows', 'curtsies', 'twirls', 'spins', 'dances', 'jumps', 'leaps',
    'gasping', 'laughing', 'smiling', 'grinning', 'winking', 'nodding',
    'waving', 'pointing', 'gazing', 'staring', 'glancing', 'peeking',
    'sobbing', 'crying', 'weeping', 'sniffling', 'beaming', 'blushing',
    'frowning', 'scowling', 'pouting', 'squealing', 'giggling', 'cackling',
    'screaming', 'yelling', 'shouting', 'whispering', 'murmuring', 'muttering',
    'exclaims', 'excitedly', 'nervously', 'proudly', 'sadly', 'happily',
    'angrily', 'softly', 'gently', 'firmly', 'playfully', 'mischievously',
    'thoughtfully', 'carefully', 'eagerly', 'enthusiastically', 'passionately',
    'grabs', 'holds', 'clutches', 'hugs', 'embraces', 'squeezes', 'pats',
    'rubs', 'strokes', 'caresses', 'pulls', 'pushes', 'tugs', 'yanks',
    'places', 'puts', 'sets', 'drops', 'picks', 'lifts', 'reaches',
    'steps', 'moves', 'rushes', 'runs', 'dashes', 'charges', 'strides',
    'stumbles', 'trips', 'falls', 'slides', 'glides', 'floats', 'flies',
    'poses', 'posing', 'posed', 'cape', 'heart', 'hands', 'eyes', 'hair',
    'chest', 'chin', 'hand', 'finger', 'fist', 'arm', 'arms',
  ]);

  return parts
    .map((part, i) => {
      // Odd-indexed parts are code blocks — leave them untouched
      if (i % 2 === 1) return part;

      // Remove roleplay *action text* — single asterisk italic (not **bold** or ***bold-italic***)
      // Match *word word word* patterns (2-15 words inside single asterisks)
      return part
        .replace(
          /(?<!\*)\*(?!\*)([^*\n]{2,120})(?<!\*)\*(?!\*)/g,
          (match, inner: string) => {
            const trimmed = inner.trim();
            // Skip if it looks like inline code reference or single word emphasis
            if (!trimmed.includes(' ')) return match;
            
            const words = trimmed.split(/\s+/);
            const lowerWords = words.map(w => w.toLowerCase().replace(/[^a-z]/g, ''));

            // Check 1: Starts with a capital letter (stage directions typically do)
            const startsWithCapital = /^[A-Z]/.test(trimmed);

            // Check 2: Contains any known action/roleplay verb
            const hasActionVerb = lowerWords.some(w => actionVerbs.has(w));

            // Check 3: Contains adverbs ending in -ly (dramatically, excitedly, etc.)
            const hasAdverb = lowerWords.some(w => w.endsWith('ly') && w.length > 3);

            // Check 4: Contains verb+ing pattern (gasping, laughing, etc.)
            const hasGerund = lowerWords.some(w => w.endsWith('ing') && w.length > 4);

            // Strip if: has action verbs, OR starts with capital + has adverb/gerund
            if (hasActionVerb || (startsWithCapital && (hasAdverb || hasGerund))) {
              return '';
            }

            return match; // Keep legitimate italic text
          }
        )
        .replace(/  +/g, ' ') // Collapse multiple spaces
        .replace(/^\s*\n/gm, ''); // Remove blank lines left by stripped actions
    })
    .join('');
};

// Strip raw HTML tags from AI responses (outside of code blocks)
// AI should use markdown only — raw HTML renders as ugly unformatted text
const stripRawHTML = (content: string): string => {
  // Unwrap whole-response code block wrapper: if the AI wrapped the entire
  // response in ``` ... ``` (no language), strip the outer backticks so
  // ReactMarkdown can render inner content (including real code blocks) properly.
  const trimmed = content.trim();
  const lines = trimmed.split('\n');
  if (
    lines.length >= 3 &&
    /^```\s*$/.test(lines[0]) &&
    /^```\s*$/.test(lines[lines.length - 1])
  ) {
    // Check if the wrapped content contains markdown signals
    const inner = lines.slice(1, -1);
    const mdSignals = [
      /\*\*[^*]+\*\*/,
      /^\s*[-*]\s+/,
      /^\s*#{1,4}\s+/,
      /^\s*\d+\.\s+/,
      /[🌟🔮✨💡🎯🚀📁🎮💻⭐🔧✅❌🌙🔭🌠🌌🎆🎪🏆💎🔥⚡🌈]/,
    ];
    const mdCount = inner.filter(l => mdSignals.some(r => r.test(l))).length;
    if (inner.length > 0 && mdCount / inner.length > 0.15) {
      content = inner.join('\n');
    }
  }

  // Split on real code blocks to protect them from HTML stripping
  const parts = content.split(/(```[\s\S]*?```)/g);
  return parts
    .map((part, i) => {
      // Odd-indexed parts are code blocks — leave untouched
      if (i % 2 === 1) return part;

      // Strip <script>...</script> and <style>...</style> blocks entirely
      let cleaned = part.replace(/<script[\s\S]*?<\/script>/gi, '');
      cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, '');

      // Convert HTML formatting tags to markdown equivalents (preserve content)
      cleaned = cleaned.replace(/<\/?b>/gi, '**');
      cleaned = cleaned.replace(/<\/?strong>/gi, '**');
      cleaned = cleaned.replace(/<\/?i>/gi, '*');
      cleaned = cleaned.replace(/<\/?em>/gi, '*');
      cleaned = cleaned.replace(/<\/?u>/gi, '');
      cleaned = cleaned.replace(/<\/?s>/gi, '~~');
      cleaned = cleaned.replace(/<\/?del>/gi, '~~');
      cleaned = cleaned.replace(/<\/?mark>/gi, '');
      cleaned = cleaned.replace(/<\/?code>/gi, '`');
      cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n');
      cleaned = cleaned.replace(/<hr\s*\/?>/gi, '\n---\n');
      cleaned = cleaned.replace(/<\/p>/gi, '\n\n');
      cleaned = cleaned.replace(/<p[^>]*>/gi, '');

      // Convert <a href="url">text</a> to [text](url)
      cleaned = cleaned.replace(/<a\s+[^>]*href\s*=\s*["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');

      // Strip font/color tags — keep inner text
      cleaned = cleaned.replace(/<\/?font[^>]*>/gi, '');
      cleaned = cleaned.replace(/<\/?center>/gi, '');
      cleaned = cleaned.replace(/<\/?small>/gi, '');
      cleaned = cleaned.replace(/<\/?big>/gi, '');
      cleaned = cleaned.replace(/<\/?sub>/gi, '');
      cleaned = cleaned.replace(/<\/?sup>/gi, '');
      cleaned = cleaned.replace(/<\/?abbr[^>]*>/gi, '');
      cleaned = cleaned.replace(/<\/?details[^>]*>/gi, '');
      cleaned = cleaned.replace(/<\/?summary[^>]*>/gi, '');

      // Strip block-level and dangerous HTML tags (keep inner text)
      cleaned = cleaned.replace(/<\/?(div|span|button|table|thead|tbody|tr|td|th|iframe|form|input|select|option|textarea|label|section|article|header|footer|nav|main|aside|figure|figcaption|canvas|video|audio|source|link|meta|img|svg|path|circle|rect|line|polyline|polygon|ellipse|g|defs|use|symbol|clipPath|mask|pattern|linearGradient|radialGradient|stop|text|tspan)(\s[^>]*)?\/?>/gi, '');

      // Strip any remaining tags with inline style attributes (widget attempts)
      cleaned = cleaned.replace(/<[a-z][a-z0-9]*\s+[^>]*style\s*=\s*["'][^"']*["'][^>]*>/gi, '');
      cleaned = cleaned.replace(/<\/[a-z][a-z0-9]*>/gi, '');

      // Clean up stray triple backticks (no language) left after unwrapping
      cleaned = cleaned.replace(/^```\s*$/gm, '');

      // Clean up excessive whitespace left behind
      cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n');
      return cleaned;
    })
    .join('');
};

// Inline collapsible code panel — rendered directly inside ReactMarkdown flow
// No regex needed: ReactMarkdown parses code blocks, this component renders them
function InlineCodePanel({ code, language, lineCount, defaultExpanded }: {
  code: string;
  language: string;
  lineCount: number;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded ?? false);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Determine if this code can be previewed (HTML, CSS, JS, or mixed web code)
  const isPreviewable = /^(html|htm|css|javascript|js|jsx|tsx|svg|xml)$/i.test(language) ||
    (language === 'code' && (code.includes('<') && code.includes('>')));

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  // Build a full HTML document for the sandboxed preview
  const getPreviewHtml = () => {
    const lang = language.toLowerCase();
    if (lang === 'css') {
      return `<!DOCTYPE html><html><head><style>${code}</style></head><body><p>CSS preview — add HTML to see styled content.</p></body></html>`;
    }
    if (lang === 'javascript' || lang === 'js') {
      return `<!DOCTYPE html><html><head><style>body{background:#111;color:#e5e7eb;font-family:monospace;padding:12px}pre{white-space:pre-wrap}</style></head><body><pre id="out"></pre><script>
const _origLog=console.log;const _out=document.getElementById('out');
console.log=function(){_origLog.apply(console,arguments);_out.textContent+=Array.from(arguments).map(a=>typeof a==='object'?JSON.stringify(a,null,2):String(a)).join(' ')+'\\n';};
try{${code}}catch(e){_out.textContent+='Error: '+e.message+'\\n';}</script></body></html>`;
    }
    if (lang === 'svg' || lang === 'xml') {
      return `<!DOCTYPE html><html><head><style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#111}</style></head><body>${code}</body></html>`;
    }
    // HTML (or unknown with HTML tags) — render as-is; wrap in doctype if needed
    if (code.trim().toLowerCase().startsWith('<!doctype') || code.trim().toLowerCase().startsWith('<html')) {
      return code;
    }
    return `<!DOCTYPE html><html><head><style>body{background:#111;color:#e5e7eb;font-family:system-ui,sans-serif;padding:12px}</style></head><body>${code}</body></html>`;
  };

  return (
    <div className="my-3 rounded-xl border border-white/80 overflow-hidden shadow-sm bg-[#0f0f0f]">
      {/* Header bar — always visible */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer select-none bg-[#1a1a2e] border-b border-white/10"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-3.5 h-3.5 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-xs font-mono text-cyan-400">{language}</span>
          <span className="text-[10px] text-gray-500">{lineCount} lines</span>
        </div>
        <div className="flex items-center gap-1">
          {isPreviewable && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(true); setShowPreview(!showPreview); }}
              className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
                showPreview ? 'text-cyan-400 bg-cyan-400/10' : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
              title={showPreview ? 'Show code' : 'Preview'}
            >
              {showPreview ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Code
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Run
                </>
              )}
            </button>
          )}
          <button
            onClick={handleCopy}
            className="px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors text-gray-400 hover:text-white hover:bg-white/10"
            title="Copy code"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
      </div>
      {/* Code content — collapsible with internal scrolling */}
      {expanded && !showPreview && (
        <pre className="p-3 overflow-x-auto overflow-y-auto text-sm leading-relaxed" style={{ color: '#E5E7EB', maxHeight: '500px' }}>
          <code
            className={`hljs language-${language}`}
            style={{ whiteSpace: 'pre', display: 'block' }}
            dangerouslySetInnerHTML={{
              __html: (() => {
                try {
                  if (language && language !== 'code' && hljs.getLanguage(language)) {
                    return hljs.highlight(code, { language }).value;
                  }
                  return hljs.highlightAuto(code).value;
                } catch {
                  return code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                }
              })()
            }}
          />
        </pre>
      )}
      {/* Live preview — sandboxed iframe */}
      {expanded && showPreview && (
        <div className="relative">
          <iframe
            srcDoc={getPreviewHtml()}
            sandbox="allow-scripts"
            className="w-full border-0 bg-white rounded-b-xl"
            style={{ minHeight: '200px', maxHeight: '500px', height: '300px' }}
            title="Code preview"
          />
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 text-[10px] text-cyan-400 font-mono">
            LIVE PREVIEW
          </div>
        </div>
      )}
    </div>
  );
}

const extractMediaImages = (
  content: string
): { cleanContent: string; images: ExtractedImage[] } => {
  const images: ExtractedImage[] = [];
  let cleanContent = content;

  // Match all markdown images: ![alt](url)
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;

  while ((match = imageRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    const alt = match[1];
    const src = match[2];

    // Extract S3 URLs (production path)
    if (src.includes('.s3.') && src.includes('amazonaws.com')) {
      images.push({ src, alt });
      cleanContent = cleanContent.replace(fullMatch, '');
      continue;
    }

    // Extract DALL-E direct URLs
    if (src.includes('oaidalleapiprodscus.blob.core.windows.net') || src.includes('dalle')) {
      images.push({ src, alt });
      cleanContent = cleanContent.replace(fullMatch, '');
      continue;
    }

    // Extract any other remote image URL (https:// ending in image extension or containing image-related paths)
    if (src.startsWith('https://') && (
      /\.(png|jpg|jpeg|gif|webp|svg|bmp)(\?|$)/i.test(src) ||
      src.includes('/images/') || src.includes('/generated/') || src.includes('/uploads/')
    )) {
      images.push({ src, alt });
      cleanContent = cleanContent.replace(fullMatch, '');
      continue;
    }

    // Extract large base64 images (legacy/fallback path)
    if (src.startsWith('data:image/') && src.length > 1000) {
      images.push({ src, alt });
      cleanContent = cleanContent.replace(fullMatch, '');
      continue;
    }
  }

  // Safety: strip any remaining raw base64 data URLs that aren't inside markdown image syntax
  cleanContent = cleanContent.replace(
    /data:image\/[a-zA-Z+]+;base64,[A-Za-z0-9+/=]{200,}/g,
    '[image data]'
  );

  // === AGGRESSIVE URL STRIPPING ===
  // Strip ALL long URLs (100+ chars) — these are always generated asset URLs, never useful user-facing links
  cleanContent = cleanContent.replace(
    /https?:\/\/[^\s]{100,}/g,
    ''
  );

  // Strip specific known image-hosting URLs of any length
  cleanContent = cleanContent.replace(
    /https?:\/\/[^\s)>\]]*\.s3\.[^\s)>\]]+/g,
    ''
  );
  cleanContent = cleanContent.replace(
    /https?:\/\/oaidalleapiprodscus[^\s)>\]]*/g,
    ''
  );

  // Strip documentation/reference URLs (documentation sites, API docs, etc.)
  // These look professional in docs but break conversation flow
  cleanContent = cleanContent.replace(
    /https?:\/\/(cloud\.|aws\.|\w+\.)?\w+\.(?:com|io|org|net)\/[^\s)>)]+(?:docs?|api|getting-started|quickstart|reference|tutorial|guide|help)[^\s)>)]*\b/gi,
    ''
  );
  
  // Strip any remaining standalone URLs in parentheses or as bare text (but preserve markdown links)
  // Match: http(s)://... followed by space, newline, or punctuation (but not inside [text](url))
  // Only strip if not inside [] or () already
  cleanContent = cleanContent.replace(
    /(?:^|\s)(https?:\/\/[^\s\)>]+)(?=[\s\n\.\,\;]|$)/gm,
    ' '
  );

  // Strip ALL markdown links that contain image/asset URLs
  // Matches [any text](https://...s3...) or [any text](https://oaidalleapiprodscus...)
  cleanContent = cleanContent.replace(
    /\[[^\]]*\]\(https?:\/\/[^)]*(?:s3\.|oaidalleapiprodscus|blob\.core\.windows)[^)]*\)/g,
    ''
  );

  // Strip markdown download links for images (e.g., [📥 Download Image](url))
  cleanContent = cleanContent.replace(
    /\[📥[^\]]*\]\([^)]+\)/g,
    ''
  );

  // Strip any remaining markdown links to image files
  cleanContent = cleanContent.replace(
    /\[[^\]]*(?:Download|View|Open|Image)[^\]]*\]\(https?:\/\/[^)]+\)/gi,
    ''
  );

  // Clean up leftover empty lines and excessive whitespace
  cleanContent = cleanContent.replace(/\n{3,}/g, '\n\n').trim();

  return { cleanContent, images };
};

// Helper function to generate user-friendly error messages with actionable prompts
interface ErrorInfo {
  message: string;
  isCapabilityError: boolean;
  suggestModelChange: boolean;
  errorType: 'image' | 'model' | 'capability' | 'network' | 'generic';
}

const getErrorInfo = (error: Error | string): ErrorInfo => {
  const errorMessage = error instanceof Error ? error.message : error;
  const lowerMessage = errorMessage.toLowerCase();

  // Image generation errors
  if (
    lowerMessage.includes('image') &&
    (lowerMessage.includes('generat') ||
      lowerMessage.includes('failed') ||
      lowerMessage.includes('create'))
  ) {
    return {
      message: `❌ **Image Generation Failed**\n\nImage generation is temporarily unavailable or the request could not be processed.\n\n💡 **What you can do:**\n• Try again in a moment\n• Rephrase your request to be more specific about the image you want\n• Start a new conversation and try again`,
      isCapabilityError: true,
      suggestModelChange: false,
      errorType: 'image',
    };
  }

  // Model capability errors
  if (
    lowerMessage.includes('not support') ||
    lowerMessage.includes('capability') ||
    lowerMessage.includes('cannot perform') ||
    lowerMessage.includes('unable to')
  ) {
    return {
      message: `❌ **Request Not Supported**\n\nThis type of request could not be processed right now.\n\n💡 **Try these solutions:**\n• Rephrase your request or break it into smaller steps\n• Try a different approach to your task\n• Start a new conversation and try again`,
      isCapabilityError: true,
      suggestModelChange: false,
      errorType: 'capability',
    };
  }

  // Model-specific errors (rate limits, token limits, etc.)
  if (
    lowerMessage.includes('rate limit') ||
    lowerMessage.includes('quota') ||
    lowerMessage.includes('token limit') ||
    lowerMessage.includes('context length')
  ) {
    return {
      message: `❌ **Limit Reached**\n\n${errorMessage}\n\n💡 **What you can do:**\n• Wait a moment and try again\n• Consider upgrading your plan for higher limits\n• Try shortening your message or starting a new conversation`,
      isCapabilityError: false,
      suggestModelChange: false,
      errorType: 'model',
    };
  }

  // Network/connection errors
  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('connection') ||
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('fetch')
  ) {
    return {
      message: `❌ **Connection Error**\n\nCouldn't reach the AI service. This might be a temporary issue.\n\n💡 **Try:**\n• Check your internet connection\n• Wait a moment and try again\n• Refresh the page if the problem persists`,
      isCapabilityError: false,
      suggestModelChange: false,
      errorType: 'network',
    };
  }

  // Generic fallback
  return {
    message: `❌ **Something went wrong**\n\n${errorMessage}\n\n💡 **Suggestions:**\n• Try rephrasing your request\n• Open **Settings** (⚙️) to try a different AI model\n• Start a new conversation if errors persist`,
    isCapabilityError: false,
    suggestModelChange: true,
    errorType: 'generic',
  };
};

// Categorize an auto-extracted memory fact by keyword matching
function categorizeMemory(fact: string): AutoMemory['category'] {
  const f = fact.toLowerCase();
  if (f.match(/\b(name is|i'm |i am |called |my name)\b/)) return 'personal';
  if (f.match(/\b(work|job|role|company|team|career|profession|developer|engineer|designer)\b/)) return 'personal';
  if (f.match(/\b(prefer|like|favorite|always use|style|format|usually)\b/)) return 'preference';
  if (f.match(/\b(project|building|app|website|product|startup|repo)\b/)) return 'project';
  if (f.match(/\b(interest|learn|study|topic|curious|explore)\b/)) return 'topic';
  if (f.match(/\b(tone|formal|casual|concise|detailed|verbose|brief)\b/)) return 'style';
  return 'general';
}

// ═══════════════════════════════════════════════════════════════════
// AGENT ROUTING
// Each agent has a dedicated backend (ports 4001-4018).
//
// Agent subdomain  (e.g. ben-sega.mumtaz.ai):
//   → /api/agent/chat-stream   → nginx $backend_port map → port 4002
//
// Main domain (mumtaz.ai) with per-agent nginx blocks:
//   → /api/agent/ben-sega/chat-stream → nginx location → port 4002
// ═══════════════════════════════════════════════════════════════════
const AGENT_PORTS: Record<string, number> = {
  'comedy-king': 4001, 'ben-sega': 4002, 'bishop-burger': 4003,
  'drama-queen': 4004, 'chess-player': 4005, 'emma-emotional': 4006,
  'julie-girlfriend': 4007, 'mrs-boss': 4008, 'knight-logic': 4009,
  'lazy-pawn': 4010, 'nid-gaming': 4011, 'professor-astrology': 4012,
  'rook-jokey': 4013, 'einstein': 4014, 'chef-biew': 4015,
  'tech-wizard': 4016, 'travel-buddy': 4017, 'fitness-guru': 4018,
};

const NON_AGENT_SUBDOMAINS = new Set([
  'www', 'chat', 'studio', 'build', 'apps', 'demo', 'editor', 'lab', 'tools', 'community', 'support',
]);

function isOnAgentSubdomain(): boolean {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  if (!hostname.endsWith('.mumtaz.ai')) return false;
  const sub = hostname.replace('.mumtaz.ai', '');
  return !NON_AGENT_SUBDOMAINS.has(sub);
}

function getChatStreamUrl(agentId: string, mode?: string): string {
  // All modes (chat, code, images) share the same /api/agent/chat-stream endpoint.
  // The mode is passed as a body parameter — there are no separate code-stream/images-stream routes.
  // Only 'search' has its own dedicated endpoint (/api/agent/search).
  if (isOnAgentSubdomain()) {
    if (mode === 'search') return '/api/agent/search';
    return '/api/agent/chat-stream';
  }
  if (agentId in AGENT_PORTS) {
    if (mode === 'search') return `/api/agent/${agentId}/search`;
    return `/api/agent/${agentId}/chat-stream`;
  }
  return '/api/agent/chat-stream';
}

export default function UniversalAgentChat({ agent }: UniversalAgentChatProps) {
  // Auth
  const { state: authState } = useAuth();
  // Theme
  const { isNeural: isDarkMode } = useChatTheme();
  // Overlay
  const [isOverlayActive, setIsOverlayActive] = useState(true);

  // Sessions state
  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: 'session-1',
      name: 'Welcome Conversation',
      messages: [
        {
          id: 'msg-1',
          role: 'assistant',
          content: agent.welcomeMessage,
          timestamp: new Date(),
        },
      ],
      lastMessage: `Chat with ${agent.name}`,
      messageCount: 1,
      updatedAt: new Date(),
    },
  ]);

  const [activeSessionId, setActiveSessionId] = useState<string>('session-1');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatMode, setChatMode] = useState<'chat' | 'images' | 'code' | 'search' | 'video'>('chat');
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const modeMenuRef = useRef<HTMLDivElement>(null);
  const [isQuickActionsCollapsed, setIsQuickActionsCollapsed] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasSpeechRecognition, setHasSpeechRecognition] = useState(false);

  // Which panel is open above input: 'quick-actions' | 'stats' | 'memory' | null (collapsed)
  const [activePanel, setActivePanel] = useState<'quick-actions' | 'stats' | 'memory' | 'export' | 'shortcuts' | 'emoji' | null>(null);

  // Research Panel — agent-controlled (auto-opens when agent fetches URLs)
  const [researchPanelOpen, setResearchPanelOpen] = useState(false);
  const [researchTabs, setResearchTabs] = useState<ResearchTab[]>([]);
  const [activeResearchTabId, setActiveResearchTabId] = useState<string | null>(null);

  // Map Panel — agent-controlled (auto-opens when agent uses geo tools)
  const [mapPanelOpen, setMapPanelOpen] = useState(false);
  const [mapTabs, setMapTabs] = useState<MapTab[]>([]);
  const [activeMapTabId, setActiveMapTabId] = useState<string | null>(null);

  // Memory settings — loaded from DB only (no localStorage)
  const [memorySettings, setMemorySettings] = useState<MemorySettings>({
    enabled: true, userName: '', language: '', gender: '', dateOfBirth: '', memories: [],
  });

  // Load memory from database on mount
  const memoryLoadedRef = useRef(false);
  useEffect(() => {
    if (memoryLoadedRef.current) return;
    memoryLoadedRef.current = true;
    (async () => {
      try {
        const res = await fetch('/api/user/memory', { credentials: 'include' });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const dbSettings: MemorySettings = {
              enabled: json.data.enabled ?? true,
              userName: json.data.userName ?? '',
              language: json.data.language ?? '',
              gender: json.data.gender ?? '',
              dateOfBirth: json.data.dateOfBirth ?? '',
              memories: Array.isArray(json.data.memories) ? json.data.memories : [],
            };
            setMemorySettings(dbSettings);
          }
        }
      } catch {
        // Keep defaults
      }
    })();
  }, []);

  // Debounced save to database
  const memorySaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveMemoryToDb = useCallback((settings: MemorySettings) => {
    // Debounce DB save (500ms)
    if (memorySaveTimerRef.current) clearTimeout(memorySaveTimerRef.current);
    memorySaveTimerRef.current = setTimeout(async () => {
      try {
        await fetch('/api/user/memory', {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings),
        });
      } catch {
        // Silent fail
      }
    }, 500);
  }, []);

  const handleMemoryChange = (newSettings: MemorySettings) => {
    // Enforce 18+ age requirement for date of birth
    if (newSettings.dateOfBirth) {
      const dob = new Date(newSettings.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      if (age < 18) {
        // Strip invalid DOB and don't save
        newSettings = { ...newSettings, dateOfBirth: '' };
      }
    }
    setMemorySettings(newSettings);
    saveMemoryToDb(newSettings);
  };

  // Auto-extract reference keywords/topics from a user message and save as memories
  const autoExtractUserMemory = useCallback((userMessage: string, sessionId: string) => {
    if (!memorySettings.enabled) return;
    if (!userMessage || userMessage.length < 5) return;

    const newMemories: AutoMemory[] = [];
    const msg = userMessage.trim();

    // 1. Detect personal introductions (high-value)
    const nameMatch = msg.match(/(?:my name is|i'm |i am |call me |this is )\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
    if (nameMatch) {
      newMemories.push({
        id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        fact: `User's name is ${nameMatch[1].trim()}`,
        category: 'personal',
        createdAt: Date.now(),
        sessionId,
      });
    }

    // 2. Detect profession/role
    const roleMatch = msg.match(/(?:i work as|i'm a|i am a|my job is|my role is|i work at|i work for|i'm an|i am an)\s+(.{3,60}?)(?:\.|,|$)/i);
    if (roleMatch) {
      newMemories.push({
        id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        fact: `Works as: ${roleMatch[1].trim()}`,
        category: 'personal',
        createdAt: Date.now(),
        sessionId,
      });
    }

    // 3. Detect preferences and likes/dislikes
    const prefMatch = msg.match(/(?:i (?:love|like|prefer|enjoy|use|always use|hate|dislike))\s+(.{3,80}?)(?:\.|,|!|$)/i);
    if (prefMatch) {
      const verb = msg.match(/i (love|like|prefer|enjoy|use|always use|hate|dislike)/i)?.[1] || 'likes';
      newMemories.push({
        id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        fact: `User ${verb}: ${prefMatch[1].trim()}`,
        category: 'preference',
        createdAt: Date.now(),
        sessionId,
      });
    }

    // 4. Detect projects / what they're building
    const projectMatch = msg.match(/(?:i'm building|i'm working on|my project|my app|my website|i'm developing|i'm creating)\s+(.{3,80}?)(?:\.|,|!|$)/i);
    if (projectMatch) {
      newMemories.push({
        id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        fact: `Working on: ${projectMatch[1].trim()}`,
        category: 'project',
        createdAt: Date.now(),
        sessionId,
      });
    }

    // 5. Detect goals
    const goalMatch = msg.match(/(?:i want to|i need to|my goal is|i'm trying to|help me)\s+(.{5,80}?)(?:\.|,|!|$)/i);
    if (goalMatch) {
      newMemories.push({
        id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        fact: `Goal: ${goalMatch[1].trim()}`,
        category: 'topic',
        createdAt: Date.now(),
        sessionId,
      });
    }

    // 6. Extract key topic reference words (nouns > 4 chars, not stop words)
    const topicStopWords = new Set([
      'about', 'after', 'again', 'being', 'below', 'between', 'could', 'doing',
      'during', 'every', 'first', 'found', 'going', 'great', 'having', 'hello',
      'inside', 'know', 'large', 'later', 'maybe', 'might', 'never', 'other',
      'please', 'quite', 'really', 'should', 'since', 'still', 'thanks', 'their',
      'there', 'these', 'thing', 'think', 'those', 'through', 'today', 'under',
      'until', 'using', 'value', 'want', 'where', 'which', 'while', 'would',
      'write', 'your', 'have', 'with', 'this', 'that', 'what', 'when',
      'from', 'they', 'been', 'some', 'them', 'than', 'each', 'make',
      'like', 'just', 'also', 'very', 'much', 'many', 'most', 'more',
      'does', 'will', 'can', 'how', 'its', 'don', 'not', 'but', 'are',
      'was', 'were', 'had', 'has', 'for', 'the', 'and', 'all',
    ]);
    const words = msg.toLowerCase().match(/\b[a-z]{5,}\b/g) || [];
    const significantWords = words.filter(w => !topicStopWords.has(w));
    // Extract unique significant words (at most 5)
    const uniqueTopics = [...new Set(significantWords)].slice(0, 5);
    if (uniqueTopics.length >= 2) {
      newMemories.push({
        id: `mem-${Date.now()}-kw-${Math.random().toString(36).slice(2, 8)}`,
        fact: `Discussed topics: ${uniqueTopics.join(', ')}`,
        category: 'topic',
        createdAt: Date.now(),
        sessionId,
      });
    }

    // Deduplicate against existing memories
    if (newMemories.length > 0) {
      const existingFacts = new Set(memorySettings.memories.map(m => m.fact.toLowerCase()));
      const unique = newMemories.filter(m => !existingFacts.has(m.fact.toLowerCase()));
      if (unique.length > 0) {
        const updated = { ...memorySettings, memories: [...memorySettings.memories, ...unique].slice(-100) };
        handleMemoryChange(updated);
      }
    }
  }, [memorySettings, handleMemoryChange]);

  // Delete memories associated with a specific session
  const deleteSessionMemories = useCallback((sessionId: string) => {
    const filtered = memorySettings.memories.filter(m => m.sessionId !== sessionId);
    if (filtered.length !== memorySettings.memories.length) {
      handleMemoryChange({ ...memorySettings, memories: filtered });
    }
  }, [memorySettings, handleMemoryChange]);

  // Extract auto-memories from AI response (parses <!--MEMORY_EXTRACT:...-->)
  const extractAndSaveMemories = useCallback((responseText: string, sessionId?: string): string => {
    if (!memorySettings.enabled) return responseText;
    const regex = /<!--MEMORY_EXTRACT:([\s\S]*?)-->/g;
    let cleaned = responseText;
    const newMemories: AutoMemory[] = [];

    let match;
    while ((match = regex.exec(responseText)) !== null) {
      cleaned = cleaned.replace(match[0], '');
      try {
        const extracted = JSON.parse(match[1]);
        if (Array.isArray(extracted)) {
          for (const item of extracted) {
            if (typeof item === 'string' && item.trim()) {
              newMemories.push({
                id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                fact: item.trim(),
                category: categorizeMemory(item),
                createdAt: Date.now(),
                sessionId,
              });
            } else if (typeof item === 'object' && item.fact) {
              newMemories.push({
                id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                fact: item.fact.trim(),
                category: item.category || categorizeMemory(item.fact),
                createdAt: Date.now(),
                sessionId,
              });
            }
          }
        }
      } catch {
        // If not valid JSON, try splitting by | or newlines
        const parts = match[1].split(/[|\n]/).map((s: string) => s.trim()).filter(Boolean);
        for (const part of parts) {
          newMemories.push({
            id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            fact: part,
            category: categorizeMemory(part),
            createdAt: Date.now(),
            sessionId,
          });
        }
      }
    }

    if (newMemories.length > 0) {
      // Deduplicate against existing memories (simple overlap check)
      const existingFacts = new Set(memorySettings.memories.map(m => m.fact.toLowerCase()));
      const unique = newMemories.filter(m => !existingFacts.has(m.fact.toLowerCase()));
      if (unique.length > 0) {
        const updated = { ...memorySettings, memories: [...memorySettings.memories, ...unique].slice(-100) };
        handleMemoryChange(updated);
      }
    }

    return cleaned.trim();
  }, [memorySettings]);

  // Build memory context string to inject into system prompts
  const buildMemoryContext = (): string => {
    if (!memorySettings.enabled) return '';
    const parts: string[] = [];

    // Profile info
    if (memorySettings.userName) parts.push(`The user's name is "${memorySettings.userName}". Address them by name when appropriate.`);
    if (memorySettings.language) parts.push(`The user's preferred language is ${memorySettings.language}. Respond in ${memorySettings.language} unless they ask otherwise.`);
    if (memorySettings.gender) parts.push(`The user's gender is ${memorySettings.gender}.`);
    if (memorySettings.dateOfBirth) {
      const dob = new Date(memorySettings.dateOfBirth);
      const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      parts.push(`The user's date of birth is ${memorySettings.dateOfBirth} (age ~${age}).`);
    }

    // Include saved memories (from ALL sessions)
    if (memorySettings.memories.length > 0) {
      parts.push('');
      parts.push('Key facts learned about this user from past conversations (persisted across all sessions):');
      for (const mem of memorySettings.memories.slice(-30)) { // Last 30 memories in prompt
        parts.push(`- ${mem.fact}`);
      }
    }

    // Memory extraction instruction (hidden from user, tells AI to output memory markers)
    parts.push('');
    parts.push('[MEMORY EXTRACTION - INTERNAL INSTRUCTION]');
    parts.push('If you notice any NEW notable facts about the user during this conversation (their name, profession, skills, projects, preferences, tools they use, important dates, goals, etc.), append this invisible marker at the very end of your response:');
    parts.push('<!--MEMORY_EXTRACT:["fact 1","fact 2"]-->');
    parts.push('Rules: Maximum 3 facts per response. Only genuinely useful long-term facts. Do NOT repeat facts already listed above. Do NOT include this marker if nothing new is worth remembering. The marker must be the absolute last thing in your response.');

    return parts.length > 0 ? '\n\n[USER MEMORY & PREFERENCES]\n' + parts.join('\n') : '';
  };

  // Live analytics state for the slim bar
  const [streamAnalytics, setStreamAnalytics] = useState<{
    tokenCount: number;
    charCount: number;
    requestActive: boolean;
    toolsUsed: number;
    startTime: number | null;
    elapsedMs: number;
  }>({ tokenCount: 0, charCount: 0, requestActive: false, toolsUsed: 0, startTime: null, elapsedMs: 0 });

  // Per-session cumulative stats (keyed by session ID)
  const [sessionStats, setSessionStats] = useState<Record<string, {
    totalRequests: number;
    totalTokens: number;
    totalToolsUsed: number;
    totalMessages: number;
    totalAttachments: number;
    startedAt: number;
    imagesUploaded: number;
    docsUploaded: number;
    otherUploaded: number;
    filesGenerated: number;
    imagesGenerated: number;
    codeGenerated: number;
    documentsGenerated: number;
    videosGenerated: number;
    toolTypes: Record<string, number>;
  }>>({});

  // Helpers to classify tool calls into generation categories
  const IMAGE_GEN_TOOLS = new Set(['generate_image', 'generate_logo', 'view_image', 'ocr_image', 'image_generate', 'enhance_image']);
  const CODE_GEN_TOOLS = new Set(['write_file', 'create_file', 'execute_code', 'run_code', 'execute_python', 'execute_javascript', 'code_execute']);
  const DOC_GEN_TOOLS = new Set(['create_document', 'generate_document', 'write_document', 'generate_pdf', 'create_spreadsheet', 'generate_csv']);
  const VIDEO_GEN_TOOLS = new Set(['generate_video', 'create_video', 'video_generate']);

  const classifyToolAsGenerated = (toolName: string): { isGen: boolean; type: 'image' | 'code' | 'document' | 'video' | null } => {
    if (IMAGE_GEN_TOOLS.has(toolName)) return { isGen: true, type: 'image' };
    if (CODE_GEN_TOOLS.has(toolName)) return { isGen: true, type: 'code' };
    if (DOC_GEN_TOOLS.has(toolName)) return { isGen: true, type: 'document' };
    if (VIDEO_GEN_TOOLS.has(toolName)) return { isGen: true, type: 'video' };
    return { isGen: false, type: null };
  };

  const EMPTY_SESSION_STATS = {
    totalRequests: 0, totalTokens: 0, totalToolsUsed: 0, totalMessages: 0, totalAttachments: 0, startedAt: Date.now(),
    imagesUploaded: 0, docsUploaded: 0, otherUploaded: 0,
    filesGenerated: 0, imagesGenerated: 0, codeGenerated: 0, documentsGenerated: 0, videosGenerated: 0,
    toolTypes: {} as Record<string, number>,
  };

  const [messageFeedback, setMessageFeedback] = useState<
    Record<string, 'up' | 'down' | null>
  >({});
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  // Per-session pinned/saved messages stored in database (keyed by sessionId in local state)
  const [allPinnedMessages, setAllPinnedMessages] = useState<Record<string, string[]>>({});
  const [allSavedMessages, setAllSavedMessages] = useState<Record<string, string[]>>({});
  // Derived sets for the active session
  const pinnedMessages = new Set(allPinnedMessages[activeSessionId] || []);
  const savedMessages = new Set(allSavedMessages[activeSessionId] || []);
  const [showPinnedPanel, setShowPinnedPanel] = useState(false);
  const [showSavedPanel, setShowSavedPanel] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);
  const [pendingLink, setPendingLink] = useState<{
    url: string;
    text: string;
  } | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(
    null
  );
  const [isVoiceChatOpen, setIsVoiceChatOpen] = useState(false);
  const [showVoiceUpgradeModal, setShowVoiceUpgradeModal] = useState(false);
  const { hasActiveSubscription } = useSubscriptions();
  const isAgentSubscribed = hasActiveSubscription(agent.id);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const recognitionRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const ttsAbortControllerRef = useRef<AbortController | null>(null);
  const ttsStoppedIntentionallyRef = useRef<boolean>(false);

  // Settings state - default to agent's configured provider/model
  const [settings, setSettings] = useState<AgentSettings>({
    temperature: 0.7,
    maxTokens: 4096,
    mode: 'balanced',
    systemPrompt: '',
    provider: agent.aiProvider?.primary || 'openai',
    model: agent.aiProvider?.model || 'gpt-4o',
  });

  // Load persisted settings per agent (from DB only — no localStorage)
  const settingsLoadedRef = useRef(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setHasSpeechRecognition(!!getSpeechRecognition());

    // Load from DB
    if (!settingsLoadedRef.current) {
      settingsLoadedRef.current = true;
      (async () => {
        try {
          const res = await fetch('/api/user/preferences', { credentials: 'include' });
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.data?.agentSettings?.[agent.id]) {
              const dbSettings = json.data.agentSettings[agent.id];
              const { provider: _p, model: _m, ...safeSettings } = dbSettings;
              setSettings((prev) => ({ ...prev, ...safeSettings }));
            }
            // Also load message feedback from DB
            if (json.success && json.data?.messageFeedback) {
              setMessageFeedback(json.data.messageFeedback);
            }
          }
        } catch {
          // Keep defaults
        }
      })();
    }
  }, [agent.id]);

  // Close mode menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modeMenuRef.current && !modeMenuRef.current.contains(e.target as Node)) {
        setModeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Persist settings (debounced DB save only — no localStorage)
  const settingsSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Debounced DB save
    if (settingsSaveTimerRef.current) clearTimeout(settingsSaveTimerRef.current);
    settingsSaveTimerRef.current = setTimeout(async () => {
      try {
        await fetch(`/api/user/preferences/agent-settings/${encodeURIComponent(agent.id)}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings),
        });
      } catch {
        // Silent fail
      }
    }, 800);
  }, [settings, agent.id]);

  // Live timer for stream analytics elapsed time
  useEffect(() => {
    if (!streamAnalytics.requestActive || !streamAnalytics.startTime) return;
    const interval = setInterval(() => {
      setStreamAnalytics(prev => ({
        ...prev,
        elapsedMs: Date.now() - (prev.startTime || Date.now()),
      }));
    }, 100);
    return () => clearInterval(interval);
  }, [streamAnalytics.requestActive, streamAnalytics.startTime]);

  const handleUpdateSettings = useCallback((next: Partial<AgentSettings>) => {
    setSettings((prev) => ({ ...prev, ...next }));
  }, []);

  const handleResetSettings = useCallback(() => {
    setSettings({
      temperature: 0.7,
      maxTokens: 4096,
      mode: 'balanced',
      systemPrompt: '',
      provider: agent.aiProvider?.primary || 'openai',
      model: agent.aiProvider?.model || 'gpt-4o',
    });
  }, [agent.aiProvider]);

  // Initialize browser Speech-to-Text
  useEffect(() => {
    const SR = getSpeechRecognition();
    if (!SR) {
      setIsRecording(false);
      return;
    }
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += text;
        } else {
          interimTranscript += text;
        }
      }
      // Only append final (committed) transcripts to avoid duplication
      if (finalTranscript) {
        setInputValue((prev) => `${prev.trim()} ${finalTranscript}`.trim());
      }
    };

    recognition.onerror = (e: any) => {
      console.error('[Speech] Error:', e.error);
      setIsRecording(false);
    };
    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  // Handle microphone toggle
  const handleMicrophoneToggle = useCallback(async () => {
    if (!hasSpeechRecognition) {
      alert(
        'Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.'
      );
      return;
    }

    const recognition = recognitionRef.current;
    if (!recognition) {
      alert('Speech recognition failed to initialize.');
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      // Request microphone permission first
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        // Stop the stream immediately - we just needed to get permission
        stream.getTracks().forEach((track) => track.stop());
      } catch (permissionError) {
        console.error(
          '[Speech] Microphone permission denied:',
          permissionError
        );
        alert(
          'Microphone access denied. Please allow microphone access in your browser settings to use voice input.'
        );
        return;
      }

      try {
        recognition.start();
        setIsRecording(true);
      } catch (err) {
        console.error('[Speech] Start failed:', err);
        alert('Failed to start speech recognition. Please try again.');
        setIsRecording(false);
      }
    }
  }, [isRecording, hasSpeechRecognition]);

  const isValidObjectId = useCallback(
    (value: string) => /^[0-9a-fA-F]{24}$/.test(value),
    []
  );

  const fetchSessionMessages = useCallback(
    async (sessionId: string) => {
      // Skip API call for the default local session that hasn't been saved to database
      if (sessionId === 'session-1') {
        return;
      }

      try {
        const resp = await fetch(`/api/chat/sessions/${sessionId}`, {
          credentials: 'include',
        });
        if (!resp.ok) return;
        const data = await resp.json();
        if (data.success && data.session) {
          let msgs = (data.session.messages || []).map((msg: any) => {
            const base: any = {
              id: msg.id || `msg-${Date.now()}-${Math.random()}`,
              role: msg.role,
              content: msg.content,
              timestamp: new Date(msg.timestamp || msg.createdAt),
            };
            // Restore fileOperations from metadata if present
            if (msg.metadata?.fileOperations?.length > 0) {
              base.fileOperations = msg.metadata.fileOperations.map((op: any, idx: number) => ({
                id: `fileop-restored-${msg.id}-${idx}`,
                tool: op.tool,
                filename: op.filename,
                path: op.path,
                folder: op.folder,
                content: op.content || '',
                language: op.language || detectLanguage(op.filename || 'file'),
                success: true,
                timestamp: new Date(msg.timestamp || msg.createdAt),
              }));
            }
            return base;
          });

          // Ensure there's always a welcome message at the start
          // Check if first message is already a welcome/greeting from assistant
          const hasWelcomeMessage =
            msgs.length > 0 &&
            msgs[0].role === 'assistant' &&
            !msgs[0].content.toLowerCase().includes('you are') &&
            !msgs[0].content.toLowerCase().includes('system');

          if (!hasWelcomeMessage) {
            // Prepend welcome message
            const welcomeMsg = {
              id: `welcome-${sessionId}`,
              role: 'assistant' as const,
              content: agent.welcomeMessage,
              timestamp: new Date(data.session.createdAt || Date.now()),
            };
            msgs = [welcomeMsg, ...msgs];
          }

          setSessions((prev) =>
            prev.map((s) =>
              s.id === sessionId
                ? {
                    ...s,
                    messages: msgs,
                    messageCount: msgs.length,
                    updatedAt: new Date(),
                  }
                : s
            )
          );

          // Extract pinned/saved message IDs from DB response
          const pinnedIds = (data.session.messages || [])
            .filter((msg: any) => msg.isPinned)
            .map((msg: any) => msg.id);
          const savedIds = (data.session.messages || [])
            .filter((msg: any) => msg.isSaved)
            .map((msg: any) => msg.id);
          if (pinnedIds.length > 0) {
            setAllPinnedMessages((prev) => ({ ...prev, [sessionId]: pinnedIds }));
          } else {
            setAllPinnedMessages((prev) => {
              const next = { ...prev };
              delete next[sessionId];
              return next;
            });
          }
          if (savedIds.length > 0) {
            setAllSavedMessages((prev) => ({ ...prev, [sessionId]: savedIds }));
          } else {
            setAllSavedMessages((prev) => {
              const next = { ...prev };
              delete next[sessionId];
              return next;
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch session messages', err);
      }
    },
    [agent.welcomeMessage]
  );

  // Load sessions from database
  const loadSessions = useCallback(async () => {
    // Wait for authentication to be determined
    if (authState.isLoading) {
      return;
    }

    if (!authState.isAuthenticated || !authState.user) {
      // For non-authenticated users, keep default session
      return;
    }

    try {
      // Always include agentId in query to ensure agent-specific sessions
      const query = `?agentId=${encodeURIComponent(agent.id)}`;
      const response = await fetch(`/api/chat/sessions${query}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.sessions.length > 0) {
          // Deduplicate sessions by id (in case of any DB-level duplicates)
          const seen = new Set<string>();
          const formattedSessions = data.sessions
            .filter((session: any) => {
              if (seen.has(session.id)) return false;
              seen.add(session.id);
              return true;
            })
            .map((session: any) => ({
              id: session.id,
              name: session.name,
              messages: session.messages
                ? session.messages.map((msg: any) => ({
                    id: msg.id || `msg-${Date.now()}-${Math.random()}`,
                    role: msg.role,
                    content: msg.content,
                    timestamp: new Date(msg.timestamp || msg.createdAt),
                  }))
                : [],
              lastMessage: session.lastMessage,
              messageCount: session.messageCount,
              updatedAt: new Date(session.updatedAt),
            }));

          setSessions(formattedSessions);
          setActiveSessionId(formattedSessions[0].id);

          // load messages for the first session
          const firstId = formattedSessions[0]?.id;
          if (firstId) {
            await fetchSessionMessages(firstId);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  }, [
    authState.isAuthenticated,
    authState.user,
    authState.isLoading,
    agent.id,
    fetchSessionMessages,
  ]);

  // Save message to session in database
  const saveMessageToSession = useCallback(
    async (sessionId: string, message: Message) => {
      if (!authState.isAuthenticated || !authState.user) {
        return;
      }

      try {
        const response = await fetch(`/api/chat/sessions/${sessionId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            role: message.role,
            content: message.content,
            agentId: agent.id, // Always include agentId for proper session association
          }),
        });

        if (!response.ok) {
          console.error('Failed to save message to session');
        }
      } catch (error) {
        console.error('Error saving message:', error);
      }
    },
    [authState.isAuthenticated, authState.user, agent.id]
  );

  // Load sessions on mount and when auth state changes
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages]);

  // ─── Research Panel Handlers ───────────────────────────────────
  const handleWebData = useCallback((webData: { url: string; title: string; content: string; tool: string }) => {
    const tabId = `research-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newTab: ResearchTab = {
      id: tabId,
      url: webData.url,
      title: webData.title || webData.url,
      content: webData.content,
      summary: webData.content?.substring(0, 200),
      toolName: webData.tool,
      timestamp: new Date(),
    };
    setResearchTabs(prev => [...prev, newTab]);
    setActiveResearchTabId(tabId);
    setResearchPanelOpen(true);
  }, []);

  const handleCloseResearchPanel = useCallback(() => {
    setResearchPanelOpen(false);
  }, []);

  const handleSelectResearchTab = useCallback((id: string) => {
    setActiveResearchTabId(id);
  }, []);

  const handleCloseResearchTab = useCallback((id: string) => {
    setResearchTabs(prev => {
      const updated = prev.filter(t => t.id !== id);
      if (updated.length === 0) {
        setResearchPanelOpen(false);
        setActiveResearchTabId(null);
      } else if (activeResearchTabId === id) {
        setActiveResearchTabId(updated[updated.length - 1].id);
      }
      return updated;
    });
  }, [activeResearchTabId]);

  // ─── Map Panel Handlers ────────────────────────────────────────
  const handleGeoData = useCallback((geoData: { type: string; title: string; locations: any[]; route?: any; rawData?: string; tool: string }) => {
    const tabId = `map-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newTab: MapTab = {
      id: tabId,
      type: geoData.type as MapTab['type'],
      title: geoData.title || 'Map',
      locations: geoData.locations || [],
      route: geoData.route,
      rawData: geoData.rawData,
      toolName: geoData.tool,
      timestamp: new Date(),
    };
    setMapTabs(prev => [...prev, newTab]);
    setActiveMapTabId(tabId);
    setMapPanelOpen(true);
  }, []);

  const handleCloseMapPanel = useCallback(() => {
    setMapPanelOpen(false);
  }, []);

  const handleSelectMapTab = useCallback((id: string) => {
    setActiveMapTabId(id);
  }, []);

  const handleCloseMapTab = useCallback((id: string) => {
    setMapTabs(prev => {
      const updated = prev.filter(t => t.id !== id);
      if (updated.length === 0) {
        setMapPanelOpen(false);
        setActiveMapTabId(null);
      } else if (activeMapTabId === id) {
        setActiveMapTabId(updated[updated.length - 1].id);
      }
      return updated;
    });
  }, [activeMapTabId]);

  // Handlers
  const handleNewSession = useCallback(async () => {
    try {
      const body: Record<string, any> = {
        name: 'New Chat',
        agentId: agent.id, // Always include agentId for proper separation
      };

      const resp = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        console.error('Failed to create session');
        return;
      }
      const data = await resp.json();
      if (data.success && data.session) {
        // Create welcome message for new session
        const welcomeMessage: Message = {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: agent.welcomeMessage,
          timestamp: new Date(),
        };

        const session: ChatSession = {
          id: data.session.id,
          name: data.session.name,
          messages: [welcomeMessage],
          lastMessage: agent.welcomeMessage.slice(0, 50),
          messageCount: 1,
          updatedAt: new Date(data.session.updatedAt || Date.now()),
        };
        setSessions((prev) => [session, ...prev]);
        setActiveSessionId(session.id);

        // Don't save welcome message to database - keep it local only
        // await saveMessageToSession(session.id, welcomeMessage);
      }
    } catch (err) {
      console.error('Error creating session', err);
    }
  }, [agent.id, agent.welcomeMessage, sessions.length, saveMessageToSession]);

  const handleSelectSession = useCallback(
    (id: string) => {
      setActiveSessionId(id);
      fetchSessionMessages(id);
      // Close pinned/saved panels when switching sessions
      setShowPinnedPanel(false);
      setShowSavedPanel(false);
    },
    [fetchSessionMessages]
  );

  const handleDeleteSession = useCallback(
    async (id: string) => {
      try {
        // Call API to delete database session
        if (id.startsWith('session-')) {
          const response = await fetch(
            `/api/chat/sessions/${encodeURIComponent(id)}`,
            {
              method: 'DELETE',
              credentials: 'include',
            }
          );

          if (!response.ok) {
            console.error('Failed to delete session');
            return;
          }
        }

        // Delete memories associated with this session
        deleteSessionMemories(id);

        // Update local state after successful deletion
        setSessions((prev) => {
          const filtered = prev.filter((s) => s.id !== id);
          if (activeSessionId === id && filtered.length > 0) {
            setActiveSessionId(filtered[0].id);
          }
          return filtered;
        });
      } catch (error) {
        console.error('Error deleting session:', error);
      }
    },
    [activeSessionId]
  );

  const handleRenameSession = useCallback(async (id: string, newName: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name: newName } : s))
    );

    // Persist rename to backend
    try {
      await fetch(`/api/chat/sessions/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: newName }),
      });
    } catch (err) {
      console.error('Failed to persist session rename:', err);
    }
  }, []);

  const handleFeedback = useCallback(
    (messageId: string, type: 'up' | 'down') => {
      const newValue = messageFeedback[messageId] === type ? null : type;
      setMessageFeedback((prev) => ({
        ...prev,
        [messageId]: newValue,
      }));
      // Persist to DB
      fetch('/api/user/preferences/message-feedback', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, feedback: newValue }),
      }).catch(() => {});
    },
    [messageFeedback]
  );

  const handleCopyMessage = useCallback(async (id: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(id);
      setTimeout(() => setCopiedMessageId(null), 1200);
    } catch (err) {
      console.error('Failed to copy message', err);
    }
  }, []);

  const handleTogglePinMessage = useCallback((messageId: string) => {
    // Optimistic update
    setAllPinnedMessages((prev) => {
      const sessionPins = prev[activeSessionId] || [];
      const exists = sessionPins.includes(messageId);
      const updated = {
        ...prev,
        [activeSessionId]: exists
          ? sessionPins.filter((id) => id !== messageId)
          : [...sessionPins, messageId],
      };
      if (updated[activeSessionId].length === 0) delete updated[activeSessionId];
      return updated;
    });
    // Persist to DB
    fetch(`/api/chat/messages/${messageId}/pin`, {
      method: 'PATCH',
      credentials: 'include',
    }).catch((err) => console.error('Failed to toggle pin', err));
  }, [activeSessionId]);

  const handleToggleSaveMessage = useCallback((messageId: string) => {
    // Optimistic update
    setAllSavedMessages((prev) => {
      const sessionSaves = prev[activeSessionId] || [];
      const exists = sessionSaves.includes(messageId);
      const updated = {
        ...prev,
        [activeSessionId]: exists
          ? sessionSaves.filter((id) => id !== messageId)
          : [...sessionSaves, messageId],
      };
      if (updated[activeSessionId].length === 0) delete updated[activeSessionId];
      return updated;
    });
    // Persist to DB
    fetch(`/api/chat/messages/${messageId}/save`, {
      method: 'PATCH',
      credentials: 'include',
    }).catch((err) => console.error('Failed to toggle save', err));
  }, [activeSessionId]);

  // Scroll to a pinned/saved message and highlight it briefly
  const scrollToMessage = useCallback((messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMessageId(messageId);
      setTimeout(() => setHighlightedMessageId(null), 2000);
    }
  }, []);

  // Regenerate the last assistant response
  const handleRegenerateMessage = useCallback(
    async (messageId: string) => {
      if (!activeSession || isLoading) return;

      // Find the index of the message to regenerate
      const messageIndex = activeSession.messages.findIndex(
        (m) => m.id === messageId
      );
      if (messageIndex === -1) return;

      // Get the user message before this assistant message
      const userMessageIndex = messageIndex - 1;
      if (
        userMessageIndex < 0 ||
        activeSession.messages[userMessageIndex]?.role !== 'user'
      )
        return;

      const userMessage = activeSession.messages[userMessageIndex];

      // Remove the assistant message being regenerated
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, messages: s.messages.slice(0, messageIndex) }
            : s
        )
      );

      setIsLoading(true);
      setStreamAnalytics({ tokenCount: 0, charCount: 0, requestActive: true, toolsUsed: 0, startTime: Date.now(), elapsedMs: 0 });

      const conversationHistory = activeSession.messages
        .slice(0, userMessageIndex)
        .filter((m) => m.role !== 'assistant' || !m.isStreaming)
        .map((m) => ({ role: m.role, content: m.content }));

      const assistantMessageId = `asst-${Date.now()}`;
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? {
                ...s,
                messages: [...s.messages, assistantMessage],
                updatedAt: new Date(),
              }
            : s
        )
      );

      const regenToolNames: string[] = [];

      try {
        abortControllerRef.current = new AbortController();

        const response = await fetch(getChatStreamUrl(agent.id), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessage.content,
            agentId: agent.id,
            agentName: agent.name,
            conversationHistory,
            settings: {
              temperature: settings.temperature,
              maxTokens: settings.maxTokens,
              systemPrompt: (settings.systemPrompt || agent.systemPrompt) + buildMemoryContext(),
              provider: settings.provider,
              model: settings.model,
            },
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let fullContent = '';
        let buffer = '';
        const regenFileOps: FileOperation[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);

                if (parsed.error) {
                  throw new Error(parsed.error);
                }

                if (parsed.token) {
                  fullContent += parsed.token;
                  setStreamAnalytics(prev => ({ ...prev, tokenCount: prev.tokenCount + 1, charCount: fullContent.length }));
                  setSessions((prev) =>
                    prev.map((s) =>
                      s.id === activeSessionId
                        ? {
                            ...s,
                            messages: s.messages.map((m) =>
                              m.id === assistantMessageId
                                ? { ...m, content: fullContent }
                                : m
                            ),
                          }
                        : s
                    )
                  );
                }

                // Handle tool call events in regenerate
                if (parsed.event === 'tool_call') {
                  setStreamAnalytics(prev => ({ ...prev, toolsUsed: prev.toolsUsed + 1 }));
                  if (parsed.tool_name) regenToolNames.push(parsed.tool_name);
                  // Tool usage runs silently — no visible text to user
                }

                // Handle tool_result events (with file_data capture)
                if (parsed.event === 'tool_result') {
                  // Tool results run silently — no visible text to user

                  // Capture file operation data for preview panel
                  if (parsed.file_data && parsed.success) {
                    const fd = parsed.file_data;
                    regenFileOps.push({
                      id: `fileop-${Date.now()}-${regenFileOps.length}`,
                      tool: fd.tool || parsed.tool_name,
                      filename: fd.filename || 'file',
                      path: fd.path,
                      folder: fd.folder,
                      content: fd.content || '',
                      language: detectLanguage(fd.filename || 'file'),
                      success: true,
                      timestamp: new Date(),
                    });
                  }

                  // Auto-open Research Panel for web tools
                  if (parsed.web_data && parsed.success) {
                    handleWebData(parsed.web_data);
                  }

                  setSessions((prev) =>
                    prev.map((s) =>
                      s.id === activeSessionId
                        ? {
                            ...s,
                            messages: s.messages.map((m) =>
                              m.id === assistantMessageId
                                ? { ...m, content: fullContent, fileOperations: [...regenFileOps] }
                                : m
                            ),
                          }
                        : s
                    )
                  );
                }

                if (parsed.event === 'follow_up') {
                  fullContent += parsed.content || '';
                  setSessions((prev) =>
                    prev.map((s) =>
                      s.id === activeSessionId
                        ? {
                            ...s,
                            messages: s.messages.map((m) =>
                              m.id === assistantMessageId
                                ? { ...m, content: fullContent }
                                : m
                            ),
                          }
                        : s
                    )
                  );
                }

                if (parsed.event === 'error') {
                  const errorInfo = `\n\n❌ **Error:** ${parsed.message}`;
                  fullContent += errorInfo;
                  setSessions((prev) =>
                    prev.map((s) =>
                      s.id === activeSessionId
                        ? {
                            ...s,
                            messages: s.messages.map((m) =>
                              m.id === assistantMessageId
                                ? { ...m, content: fullContent }
                                : m
                            ),
                          }
                        : s
                    )
                  );
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }

        // Extract auto-memories and clean response
        const regenCleanContent = extractAndSaveMemories(fullContent, activeSessionId || undefined);

        // Finalize message with file operations
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === assistantMessageId
                      ? {
                          ...m,
                          content: regenCleanContent,
                          isStreaming: false,
                          fileOperations: regenFileOps.length > 0 ? [...regenFileOps] : m.fileOperations,
                        }
                      : m
                  ),
                  lastMessage: regenCleanContent.slice(0, 50),
                }
              : s
          )
        );
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Regenerate failed:', error);
          setSessions((prev) =>
            prev.map((s) =>
              s.id === activeSessionId
                ? {
                    ...s,
                    messages: s.messages.map((m) =>
                      m.id === assistantMessageId
                        ? {
                            ...m,
                            content:
                              'Sorry, regeneration failed. Please try again.',
                            isStreaming: false,
                          }
                        : m
                    ),
                  }
                : s
            )
          );
        }
      } finally {
        setIsLoading(false);
        setStreamAnalytics(prev => {
          const final = { ...prev, requestActive: false, elapsedMs: prev.startTime ? Date.now() - prev.startTime : 0 };
          setSessionStats(ss => {
            const sid = activeSessionId;
            const cur = ss[sid] || { ...EMPTY_SESSION_STATS };
            const toolTypes = { ...cur.toolTypes };
            let imgGen = 0, codeGen = 0, docGen = 0, vidGen = 0;
            for (const tn of regenToolNames) {
              toolTypes[tn] = (toolTypes[tn] || 0) + 1;
              const cls = classifyToolAsGenerated(tn);
              if (cls.type === 'image') imgGen++;
              else if (cls.type === 'code') codeGen++;
              else if (cls.type === 'document') docGen++;
              else if (cls.type === 'video') vidGen++;
            }
            const filesGen = imgGen + codeGen + docGen + vidGen;
            return { ...ss, [sid]: { ...cur, totalRequests: cur.totalRequests + 1, totalTokens: cur.totalTokens + final.tokenCount, totalToolsUsed: cur.totalToolsUsed + final.toolsUsed, filesGenerated: cur.filesGenerated + filesGen, imagesGenerated: cur.imagesGenerated + imgGen, codeGenerated: cur.codeGenerated + codeGen, documentsGenerated: cur.documentsGenerated + docGen, videosGenerated: cur.videosGenerated + vidGen, toolTypes } };
          });
          return final;
        });
        abortControllerRef.current = null;
      }
    },
    [
      activeSession,
      activeSessionId,
      isLoading,
      agent.id,
      agent.name,
      agent.systemPrompt,
      settings,
    ]
  );

  // Start editing a user message
  const handleStartEdit = useCallback((messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditingContent(content);
  }, []);

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null);
    setEditingContent('');
  }, []);

  // Save edited message and regenerate response
  const handleSaveEdit = useCallback(
    async (messageId: string) => {
      if (!activeSession || isLoading || !editingContent.trim()) return;

      const messageIndex = activeSession.messages.findIndex(
        (m) => m.id === messageId
      );
      if (messageIndex === -1) return;

      // Update the user message and remove all messages after it
      const updatedMessages = activeSession.messages
        .slice(0, messageIndex + 1)
        .map((m) =>
          m.id === messageId ? { ...m, content: editingContent.trim() } : m
        );

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId ? { ...s, messages: updatedMessages } : s
        )
      );

      setEditingMessageId(null);
      setEditingContent('');
      setIsLoading(true);
      setStreamAnalytics({ tokenCount: 0, charCount: 0, requestActive: true, toolsUsed: 0, startTime: Date.now(), elapsedMs: 0 });

      const conversationHistory = updatedMessages
        .slice(0, -1)
        .filter((m) => m.role !== 'assistant' || !m.isStreaming)
        .map((m) => ({ role: m.role, content: m.content }));

      const assistantMessageId = `asst-${Date.now()}`;
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? {
                ...s,
                messages: [...s.messages, assistantMessage],
                updatedAt: new Date(),
              }
            : s
        )
      );

      const editToolNames: string[] = [];

      try {
        abortControllerRef.current = new AbortController();

        const response = await fetch(getChatStreamUrl(agent.id), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: editingContent.trim(),
            agentId: agent.id,
            agentName: agent.name,
            conversationHistory,
            settings: {
              temperature: settings.temperature,
              maxTokens: settings.maxTokens,
              systemPrompt: (settings.systemPrompt || agent.systemPrompt) + buildMemoryContext(),
              provider: settings.provider,
              model: settings.model,
            },
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let fullContent = '';
        let buffer = '';
        const editFileOps: FileOperation[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);

                if (parsed.error) {
                  throw new Error(parsed.error);
                }

                if (parsed.token) {
                  fullContent += parsed.token;
                  setSessions((prev) =>
                    prev.map((s) =>
                      s.id === activeSessionId
                        ? {
                            ...s,
                            messages: s.messages.map((m) =>
                              m.id === assistantMessageId
                                ? { ...m, content: fullContent }
                                : m
                            ),
                          }
                        : s
                    )
                  );
                }

                // Handle tool events
                if (parsed.event === 'tool_call') {
                  if (parsed.tool_name) editToolNames.push(parsed.tool_name);
                  // Tool usage runs silently — no visible text to user
                }

                if (parsed.event === 'tool_result') {
                  // Tool results run silently — no visible text to user

                  if (parsed.file_data && parsed.success) {
                    const fd = parsed.file_data;
                    editFileOps.push({
                      id: `fileop-${Date.now()}-${editFileOps.length}`,
                      tool: fd.tool || parsed.tool_name,
                      filename: fd.filename || 'file',
                      path: fd.path,
                      folder: fd.folder,
                      content: fd.content || '',
                      language: detectLanguage(fd.filename || 'file'),
                      success: true,
                      timestamp: new Date(),
                    });
                  }

                  // Auto-open Research Panel for web tools
                  if (parsed.web_data && parsed.success) {
                    handleWebData(parsed.web_data);
                  }

                  setSessions((prev) =>
                    prev.map((s) =>
                      s.id === activeSessionId
                        ? {
                            ...s,
                            messages: s.messages.map((m) =>
                              m.id === assistantMessageId
                                ? { ...m, content: fullContent, fileOperations: [...editFileOps] }
                                : m
                            ),
                          }
                        : s
                    )
                  );
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }

        // Extract auto-memories and clean response
        const editCleanContent = extractAndSaveMemories(fullContent, activeSessionId || undefined);

        // Finalize message with file operations
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === assistantMessageId
                      ? {
                          ...m,
                          content: editCleanContent,
                          isStreaming: false,
                          fileOperations: editFileOps.length > 0 ? [...editFileOps] : m.fileOperations,
                        }
                      : m
                  ),
                  lastMessage: editCleanContent.slice(0, 50),
                }
              : s
          )
        );
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Edit and regenerate failed:', error);
          setSessions((prev) =>
            prev.map((s) =>
              s.id === activeSessionId
                ? {
                    ...s,
                    messages: s.messages.map((m) =>
                      m.id === assistantMessageId
                        ? {
                            ...m,
                            content:
                              'Sorry, regeneration failed. Please try again.',
                            isStreaming: false,
                          }
                        : m
                    ),
                  }
                : s
            )
          );
        }
      } finally {
        setIsLoading(false);
        setStreamAnalytics(prev => {
          const final = { ...prev, requestActive: false, elapsedMs: prev.startTime ? Date.now() - prev.startTime : 0 };
          setSessionStats(ss => {
            const sid = activeSessionId;
            const cur = ss[sid] || { ...EMPTY_SESSION_STATS };
            const toolTypes = { ...cur.toolTypes };
            let imgGen = 0, codeGen = 0, docGen = 0, vidGen = 0;
            for (const tn of editToolNames) {
              toolTypes[tn] = (toolTypes[tn] || 0) + 1;
              const cls = classifyToolAsGenerated(tn);
              if (cls.type === 'image') imgGen++;
              else if (cls.type === 'code') codeGen++;
              else if (cls.type === 'document') docGen++;
              else if (cls.type === 'video') vidGen++;
            }
            const filesGen = imgGen + codeGen + docGen + vidGen;
            return { ...ss, [sid]: { ...cur, totalRequests: cur.totalRequests + 1, totalTokens: cur.totalTokens + final.tokenCount, totalToolsUsed: cur.totalToolsUsed + final.toolsUsed, filesGenerated: cur.filesGenerated + filesGen, imagesGenerated: cur.imagesGenerated + imgGen, codeGenerated: cur.codeGenerated + codeGen, documentsGenerated: cur.documentsGenerated + docGen, videosGenerated: cur.videosGenerated + vidGen, toolTypes } };
          });
          return final;
        });
        abortControllerRef.current = null;
      }
    },
    [
      activeSession,
      activeSessionId,
      isLoading,
      editingContent,
      agent.id,
      agent.name,
      agent.systemPrompt,
      settings,
    ]
  );

  // Copy user message
  const handleCopyUserMessage = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (err) {
      console.error('Failed to copy message', err);
    }
  }, []);

  const handleShareMessage = useCallback(
    async (content: string) => {
      try {
        if (navigator.share) {
          await navigator.share({ title: agent.name, text: content });
        } else {
          await navigator.clipboard.writeText(content);
        }
      } catch (err) {
        console.error('Failed to share message', err);
      }
    },
    [agent.name]
  );

  const handleFilesSelected = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;

      const MAX_FILES_PER_UPLOAD = 10;
      const MAX_TOTAL_ATTACHMENTS = 20;
      const maxFileSizeMb = Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE) || 25;
      const maxBytes = maxFileSizeMb * 1024 * 1024;
      const ALLOWED_TYPES = new Set([
        'image/jpeg','image/png','image/gif','image/webp','image/svg+xml','image/bmp','image/tiff',
        'application/pdf','text/plain','text/markdown','text/csv','application/json',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/html','text/css','text/javascript','application/javascript',
        'audio/mpeg','audio/wav','audio/webm','audio/ogg','audio/mp4',
        'video/mp4','video/webm','video/ogg',
        'application/zip','application/x-zip-compressed',
      ]);

      if (fileList.length > MAX_FILES_PER_UPLOAD) {
        alert(`You can upload at most ${MAX_FILES_PER_UPLOAD} files at once.`);
        return;
      }

      if (attachments.length >= MAX_TOTAL_ATTACHMENTS) {
        alert(`Maximum ${MAX_TOTAL_ATTACHMENTS} attachments reached. Remove some before adding more.`);
        return;
      }

      const rejectedFiles: string[] = [];

      const readPreview = (file: File) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string) || '');
          reader.onerror = () => reject(new Error('File read failed'));
          if (
            file.type.startsWith('text/') ||
            file.type === 'application/json'
          ) {
            reader.readAsText(file);
          } else {
            reader.readAsDataURL(file);
          }
        });

      const newAttachments: ChatAttachment[] = [];

      for (const file of Array.from(fileList)) {
        if (attachments.length + newAttachments.length >= MAX_TOTAL_ATTACHMENTS) break;

        const fileType = file.type || 'application/octet-stream';
        if (!ALLOWED_TYPES.has(fileType) && !fileType.startsWith('text/')) {
          rejectedFiles.push(`${file.name} (unsupported type: ${fileType})`);
          continue;
        }

        if (file.size > maxBytes) {
          rejectedFiles.push(`${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB exceeds ${maxFileSizeMb} MB limit)`);
          continue;
        }

        try {
          const presignResp = await fetch('/api/uploads/presign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: file.name,
              contentType: fileType,
              size: file.size,
            }),
          });

          if (!presignResp.ok) {
            let reason = 'Upload not allowed';
            try {
              const body = await presignResp.json();
              reason = body.message || reason;
            } catch {
              reason = await presignResp.text() || reason;
            }
            rejectedFiles.push(`${file.name} — ${reason}`);
            continue;
          }

          const { uploadUrl, fileUrl } = await presignResp.json();

          const uploadResp = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': file.type || 'application/octet-stream',
            },
            body: file,
          });

          if (!uploadResp.ok) {
            rejectedFiles.push(`${file.name} — Upload failed (${uploadResp.status}). Please try again.`);
            continue;
          }

          let preview: string | undefined;
          try {
            const result = await readPreview(file);
            const trimmed =
              result.length > 4000 ? `${result.slice(0, 4000)}...` : result;
            preview = trimmed;
          } catch (err) {
            console.warn(
              'Preview read failed, skipping preview for',
              file.name
            );
          }

          newAttachments.push({
            name: file.name,
            type: file.type,
            url: fileUrl,
            data: preview || `File available at ${fileUrl}`,
          });
        } catch (err) {
          rejectedFiles.push(`${file.name} — Could not be uploaded. Please check your connection and try again.`);
        }
      }

      if (rejectedFiles.length > 0) {
        alert(`Some files could not be uploaded:\n\n${rejectedFiles.join('\n')}`);
      }

      if (newAttachments.length > 0) {
        setAttachments((prev) => [...prev, ...newAttachments]);
        if (!inputValue) {
          setInputValue('');
        }
      }
    },
    [inputValue, attachments]
  );

  const handleExportSession = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!activeSession) return;

    const exportLines = [
      `# ${agent.name} Chat Export`,
      `Session: ${activeSession.name}`,
      `Date: ${new Date().toISOString()}`,
      '',
      '---',
      '',
      ...activeSession.messages.map((m) => {
        const prefix = m.role === 'user' ? 'User' : 'Assistant';
        return `**${prefix}:** ${m.content}`;
      }),
    ];

    const blob = new Blob([exportLines.join('\n')], {
      type: 'text/markdown',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${agent.name.replace(/\s+/g, '-').toLowerCase()}-${activeSession.id}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }, [activeSession, agent.name]);

  const handleExportChat = useCallback((format: 'markdown' | 'json' | 'text') => {
    if (typeof window === 'undefined' || !activeSession) return;

    let content: string;
    let mimeType: string;
    let ext: string;

    if (format === 'json') {
      const data = {
        agent: agent.name,
        session: activeSession.name,
        exportedAt: new Date().toISOString(),
        messages: activeSession.messages.map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp || null,
        })),
      };
      content = JSON.stringify(data, null, 2);
      mimeType = 'application/json';
      ext = 'json';
    } else if (format === 'text') {
      content = activeSession.messages
        .map((m) => {
          const prefix = m.role === 'user' ? 'You' : agent.name;
          return `${prefix}: ${m.content}`;
        })
        .join('\n\n');
      mimeType = 'text/plain';
      ext = 'txt';
    } else {
      content = [
        `# ${agent.name} Chat Export`,
        `**Session:** ${activeSession.name}`,
        `**Date:** ${new Date().toISOString()}`,
        '',
        '---',
        '',
        ...activeSession.messages.map((m) => {
          const prefix = m.role === 'user' ? '**You**' : `**${agent.name}**`;
          return `${prefix}:\n${m.content}`;
        }),
      ].join('\n\n');
      mimeType = 'text/markdown';
      ext = 'md';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${agent.name.replace(/\s+/g, '-').toLowerCase()}-chat.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  }, [activeSession, agent.name]);

  const handleInsertEmoji = useCallback((emoji: string) => {
    setInputValue((prev) => prev + emoji);
  }, []);

  // Ref to track playing audio for TTS
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  // Use ref for immediate state tracking (avoids stale closure)
  const speakingMessageIdRef = useRef<string | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    speakingMessageIdRef.current = speakingMessageId;
  }, [speakingMessageId]);

  // Stop TTS function - immediately stops all audio and cancels pending requests
  const stopTTS = useCallback(() => {
    // Mark as intentionally stopped to prevent fallback TTS
    ttsStoppedIntentionallyRef.current = true;

    // FIRST: Abort any pending TTS fetch requests
    if (ttsAbortControllerRef.current) {
      ttsAbortControllerRef.current.abort();
      ttsAbortControllerRef.current = null;
    }

    // Stop HTML5 Audio
    if (ttsAudioRef.current) {
      // Remove event listeners before stopping to prevent onerror from firing
      ttsAudioRef.current.onerror = null;
      ttsAudioRef.current.onended = null;
      ttsAudioRef.current.oncanplaythrough = null;
      ttsAudioRef.current.pause();
      ttsAudioRef.current.currentTime = 0;
      ttsAudioRef.current.src = '';
      ttsAudioRef.current = null;
    }
    // Stop browser speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMessageId(null);
    speakingMessageIdRef.current = null;
  }, []);

  const handleListenMessage = useCallback(
    async (content: string, messageId: string) => {
      if (typeof window === 'undefined') return;

      // Use ref for immediate state check (avoids stale closure)
      const currentlySpeaking = speakingMessageIdRef.current;

      // If ANY audio is speaking, stop it first
      if (currentlySpeaking) {
        stopTTS();
        // If clicking the same message, just stop (don't restart)
        if (currentlySpeaking === messageId) {
          return;
        }
        // Small delay to ensure audio is fully stopped before starting new
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const cleanText = cleanRoleplayActions(content) // Remove *action text* first
        .replace(/\*\*(.*?)\*\*/g, '$1') // Bold to plain
        .replace(/```[\s\S]*?```/g, '') // Remove code blocks
        .replace(/`(.*?)`/g, '$1') // Inline code to plain
        .replace(/^#+\s/gm, '') // Remove headers
        .replace(/^[•-]\s/gm, '') // Remove bullet points
        .replace(/>\s/g, ''); // Remove blockquotes

      if (!cleanText.trim()) {
        console.warn('No text to speak');
        return;
      }

      // Set this message as speaking (both state and ref)
      setSpeakingMessageId(messageId);
      speakingMessageIdRef.current = messageId;

      // Create abort controller for this TTS request
      ttsAbortControllerRef.current = new AbortController();
      const currentAbortController = ttsAbortControllerRef.current;

      // Try ElevenLabs first, fall back to browser TTS
      try {
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: cleanText }),
          signal: currentAbortController.signal,
        });

        // Check if request was aborted while waiting
        if (currentAbortController.signal.aborted) {
          return;
        }

        if (response.ok) {
          const audioBlob = await response.blob();

          // Check again if aborted during blob read
          if (currentAbortController.signal.aborted) {
            return;
          }

          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          ttsAudioRef.current = audio;

          // Reset the intentional stop flag since we're starting new audio
          ttsStoppedIntentionallyRef.current = false;

          // Add better error handling - but DON'T fallback if intentionally stopped
          audio.onerror = (e) => {
            console.error('Audio playback error:', e);
            URL.revokeObjectURL(audioUrl);
            ttsAudioRef.current = null;

            // Only fallback to browser TTS if NOT intentionally stopped
            if (!ttsStoppedIntentionallyRef.current) {
              setSpeakingMessageId(null);
              speakingMessageIdRef.current = null;
              if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(cleanText);
                utterance.onend = () => {
                  setSpeakingMessageId(null);
                  speakingMessageIdRef.current = null;
                };
                utterance.onerror = () => {
                  setSpeakingMessageId(null);
                  speakingMessageIdRef.current = null;
                };
                window.speechSynthesis.speak(utterance);
              }
            } else {
              // Intentionally stopped — don't fallback
            }
          };

          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            ttsAudioRef.current = null;
            setSpeakingMessageId(null);
            speakingMessageIdRef.current = null;
          };

          audio.oncanplaythrough = () => {
            // Ready to play
          };

          try {
            await audio.play();
            return;
          } catch (playError) {
            console.error('Audio play() failed:', playError);
            URL.revokeObjectURL(audioUrl);
            ttsAudioRef.current = null;
            // This usually happens due to autoplay policy - need user interaction
            // Fallback to browser TTS which doesn't have this restriction
          }
        } else {
          const errorData = await response
            .json()
            .catch(() => ({ message: 'Unknown error' }));
          console.warn('ElevenLabs TTS failed:', response.status, errorData);
          setSpeakingMessageId(null);
          speakingMessageIdRef.current = null;
        }
      } catch (err: any) {
        // Don't treat abort as an error - it's intentional
        if (err?.name === 'AbortError') {
          return;
        }
        console.warn('ElevenLabs TTS error:', err);
        setSpeakingMessageId(null);
        speakingMessageIdRef.current = null;
      }

      // Fallback to browser speechSynthesis
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.lang = 'en-US';

        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event);
          setSpeakingMessageId(null);
          speakingMessageIdRef.current = null;
        };

        utterance.onend = () => {
          setSpeakingMessageId(null);
          speakingMessageIdRef.current = null;
        };

        window.speechSynthesis.speak(utterance);
      } else {
        console.error('Speech synthesis not supported in this browser');
        setSpeakingMessageId(null);
        speakingMessageIdRef.current = null;
      }
    },
    [stopTTS]
  ); // Removed speakingMessageId - using ref instead

  // Core message sending function - used by both typed input and voice
  const sendMessageWithText = useCallback(
    async (messageText: string, messageAttachments: ChatAttachment[] = [], mode: 'chat' | 'images' | 'code' | 'search' = 'chat') => {
      if (!messageText.trim() && messageAttachments.length === 0) return;
      if (!activeSession || isLoading) return;

      // Only create a new DB session if this is a purely local session
      // (e.g., the default "session-1" that hasn't been saved to DB yet).
      // Sessions loaded from DB already exist — do NOT re-create them,
      // even if their messages haven't been fetched into local state yet.
      const hasLocalId = /^session-\d+$/.test(activeSession.id);
      const isNewLocalSession = hasLocalId;

      let sessionIdToUse = activeSession.id;
      if (authState.isAuthenticated && isNewLocalSession) {
        // Generate topic title from the first user message
        const topicTitle = generateSessionTitle(messageText);

        try {
          const resp = await fetch('/api/chat/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              name: topicTitle,
              agentId: agent.id,
            }),
          });
          if (resp.ok) {
            const data = await resp.json();
            if (data.success && data.session) {
              sessionIdToUse = data.session.id;
              // Update local session with the DB ID and topic-based name
              setSessions((prev) =>
                prev.map((s) =>
                  s.id === activeSession.id ? { ...s, id: data.session.id, name: topicTitle } : s
                )
              );
              setActiveSessionId(data.session.id);
            }
          }
        } catch (err) {
          console.error('Failed to create DB session:', err);
        }
      }

      // Store attachments for display (images show as thumbnails)
      const displayAttachments: MessageAttachment[] = messageAttachments.map(
        (file) => ({
          name: file.name,
          type: file.type,
          url: file.url,
          preview: file.type.startsWith('image/')
            ? file.url || file.data
            : undefined,
        })
      );

      // Build display content (clean, without raw URLs/base64)
      const displayContent =
        messageText.trim() ||
        (messageAttachments.length > 0 ? '📎 Sent attachment(s)' : '');

      // Build API content with attachment info for the AI
      const attachmentTextForApi =
        messageAttachments.length > 0
          ? messageAttachments
              .map((file) => {
                const parts = [
                  `Attachment: ${file.name}${file.type ? ` (${file.type})` : ''}`,
                ];
                if (file.url) {
                  parts.push(`URL: ${file.url}`);
                }
                if (file.data) {
                  parts.push(String(file.data));
                }
                return parts.join('\n');
              })
              .join('\n\n') + '\n\n'
          : '';

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: displayContent,
        timestamp: new Date(),
        attachments:
          displayAttachments.length > 0 ? displayAttachments : undefined,
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionIdToUse
            ? {
                ...s,
                messages: [...s.messages, userMessage],
                lastMessage: displayContent.slice(0, 50),
                messageCount: s.messages.length + 1,
                updatedAt: new Date(),
              }
            : s
        )
      );

      const userInput = `${attachmentTextForApi}${messageText}`.trim();

      // Auto-extract memory from every user message (proactive learning)
      autoExtractUserMemory(messageText, sessionIdToUse);

      setIsLoading(true);
      setStreamAnalytics({ tokenCount: 0, charCount: 0, requestActive: true, toolsUsed: 0, startTime: Date.now(), elapsedMs: 0 });

      // ═══════════════════════════════════════════════════════════════
      // MODE PRE-PROCESSING — Images & Search fetch extra data first,
      // then the results are sent alongside the streaming chat request
      // so the AI can provide context-aware responses with full history.
      // ═══════════════════════════════════════════════════════════════
      let modeContext = '';

      if (mode === 'images') {
        // Pre-generate image via DALL-E, then include the result in the streaming request
        try {
          const imgRes = await fetch('/api/media/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ prompt: messageText, size: '1024x1024', quality: 'standard', style: 'vivid' }),
          });
          const imgData = await imgRes.json();
          if (imgData.success) {
            const imageUrl = imgData.url || imgData.data?.[0]?.url || '';
            const revisedPrompt = imgData.revisedPrompt || imgData.revised_prompt || '';
            modeContext = `[IMAGE_GENERATED]\nImage URL: ${imageUrl}\nOriginal prompt: ${messageText}\n${revisedPrompt ? `Revised prompt: ${revisedPrompt}` : ''}\n[/IMAGE_GENERATED]\n\nThe image has been generated successfully. Please present it beautifully to the user using markdown, describe what was created, and offer follow-up suggestions.`;
          } else {
            modeContext = `[IMAGE_GENERATION_FAILED]\nError: ${imgData.error || 'Unknown error'}\nPrompt: ${messageText}\n[/IMAGE_GENERATION_FAILED]\n\nThe image generation failed. Explain the error to the user and suggest how to fix the prompt.`;
          }
        } catch (imgErr: any) {
          modeContext = `[IMAGE_GENERATION_FAILED]\nError: ${imgErr.message || 'Network error'}\nPrompt: ${messageText}\n[/IMAGE_GENERATION_FAILED]\n\nThe image generation failed due to a network error. Let the user know.`;
        }
      }

      if (mode === 'search') {
        // Pre-fetch web search results, then include them in the streaming request for AI synthesis
        try {
          const _isAgentSubSearch = typeof window !== 'undefined' &&
            window.location.hostname.endsWith('.mumtaz.ai') &&
            !['www','chat','studio','build','apps','demo','editor','lab','tools','community','support']
              .some(s => window.location.hostname.startsWith(s + '.'));
          const _searchUrl = _isAgentSubSearch
            ? '/api/agent/search'
            : `/api/agent/${agent.id}/search`;
          const searchRes = await fetch(_searchUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ query: messageText, agentId: agent.id }),
          });
          const searchData = await searchRes.json();
          if (searchData.success && searchData.summary) {
            modeContext = `[SEARCH_RESULTS]\n${searchData.summary}\n[/SEARCH_RESULTS]\n\nAbove are fresh web search results for the user's query. Synthesize these results into a comprehensive, well-structured answer. Cite sources where relevant. Add your own analysis and context from the conversation history.`;
          } else {
            modeContext = `[SEARCH_FAILED]\nNo results found for: ${messageText}\n[/SEARCH_FAILED]\n\nThe web search returned no results. Help the user by answering from your own knowledge and suggest refined search terms.`;
          }
        } catch (searchErr: any) {
          modeContext = `[SEARCH_FAILED]\nError: ${searchErr.message || 'Network error'}\n[/SEARCH_FAILED]\n\nThe web search failed due to a network error. Answer the user's question from your own knowledge instead.`;
        }
      }

      const conversationHistory =
        sessions
          .find((s) => s.id === sessionIdToUse)
          ?.messages.filter((m) => m.role !== 'assistant' || !m.isStreaming)
          .map((m) => ({
            role: m.role,
            content: m.content,
          })) || [];

      const assistantMessageId = `asst-${Date.now()}`;
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionIdToUse
            ? {
                ...s,
                messages: [...s.messages, assistantMessage],
                messageCount: s.messages.length + 1,
                updatedAt: new Date(),
              }
            : s
        )
      );

      const sendToolNames: string[] = [];

      try {
        abortControllerRef.current = new AbortController();

        // Build the message to send — for images/search modes, append the pre-fetched context
        const messageToSend = modeContext ? `${userInput}\n\n${modeContext}` : userInput;

        const streamStartTime = Date.now();
        const response = await fetch(getChatStreamUrl(agent.id, mode), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: messageToSend,
            conversationHistory,
            agentId: agent.id,
            agentName: agent.name,
            mode: mode !== 'chat' ? mode : undefined,
            settings: {
              temperature: mode === 'code' ? 0.3 : settings.temperature,
              maxTokens: mode === 'code' ? 8192 : settings.maxTokens,
              systemPrompt: (settings.systemPrompt || agent.systemPrompt) + buildMemoryContext(),
              provider: settings.provider,
              model: settings.model,
            },
            attachments: messageAttachments,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to send message');
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response stream');

        const decoder = new TextDecoder();
        let fullContent = '';
        let buffer = '';
        const fileOps: FileOperation[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.error) {
                  throw new Error(data.error);
                }

                if (data.token) {
                  fullContent += data.token;
                  setStreamAnalytics(prev => ({ ...prev, tokenCount: prev.tokenCount + 1, charCount: fullContent.length }));
                  setSessions((prev) =>
                    prev.map((s) =>
                      s.id === sessionIdToUse
                        ? {
                            ...s,
                            messages: s.messages.map((m) =>
                              m.id === assistantMessageId
                                ? { ...m, content: fullContent }
                                : m
                            ),
                          }
                        : s
                    )
                  );
                }

                // Handle structured tool events from backend
                if (data.event === 'tool_call') {
                  setStreamAnalytics(prev => ({ ...prev, toolsUsed: prev.toolsUsed + 1 }));
                  if (data.tool_name) sendToolNames.push(data.tool_name);
                  // Tool usage runs silently — no visible text to user
                }

                if (data.event === 'tool_result') {
                  // Tool results run silently — no visible text to user

                  // Capture file operation data for preview panel
                  if (data.file_data && data.success) {
                    const fd = data.file_data;
                    fileOps.push({
                      id: `fileop-${Date.now()}-${fileOps.length}`,
                      tool: fd.tool || data.tool_name,
                      filename: fd.filename || 'file',
                      path: fd.path,
                      folder: fd.folder,
                      content: fd.content || '',
                      language: detectLanguage(fd.filename || 'file'),
                      success: true,
                      timestamp: new Date(),
                    });
                  }

                  // Auto-open Research Panel for web tools
                  if (data.web_data && data.success) {
                    handleWebData(data.web_data);
                  }

                  // Auto-open Map Panel for geo tools
                  if (data.geo_data && data.success) {
                    handleGeoData(data.geo_data);
                  }

                  setSessions((prev) =>
                    prev.map((s) =>
                      s.id === sessionIdToUse
                        ? {
                            ...s,
                            messages: s.messages.map((m) =>
                              m.id === assistantMessageId
                                ? { ...m, content: fullContent, fileOperations: [...fileOps] }
                                : m
                            ),
                          }
                        : s
                    )
                  );
                }

                if (data.done) {
                  // Extract memories and strip markers before finalizing
                  const doneCleanContent = extractAndSaveMemories(fullContent, sessionIdToUse);
                  fullContent = doneCleanContent;
                  setSessions((prev) =>
                    prev.map((s) =>
                      s.id === sessionIdToUse
                        ? {
                            ...s,
                            messages: s.messages.map((m) =>
                              m.id === assistantMessageId
                                ? {
                                    ...m,
                                    content: doneCleanContent,
                                    isStreaming: false,
                                    fileOperations: fileOps.length > 0 ? [...fileOps] : undefined,
                                  }
                                : m
                            ),
                            lastMessage: doneCleanContent.slice(0, 50),
                          }
                        : s
                    )
                  );
                }
              } catch (parseError) {
                // Skip invalid JSON lines
              }
            }
          }
        }

        // Process any remaining buffer data (e.g., if stream closed without trailing newline)
        if (buffer.startsWith('data: ')) {
          try {
            const data = JSON.parse(buffer.slice(6));
            if (data.event === 'tool_result' && data.file_data && data.success) {
              const fd = data.file_data;
              fileOps.push({
                id: `fileop-${Date.now()}-${fileOps.length}`,
                tool: fd.tool || data.tool_name,
                filename: fd.filename || 'file',
                path: fd.path,
                folder: fd.folder,
                content: fd.content || '',
                language: detectLanguage(fd.filename || 'file'),
                success: true,
                timestamp: new Date(),
              });
            }
            // Also handle web_data in remaining buffer
            if (data.event === 'tool_result' && data.web_data && data.success) {
              handleWebData(data.web_data);
            }
            // Also handle geo_data in remaining buffer
            if (data.event === 'tool_result' && data.geo_data && data.success) {
              handleGeoData(data.geo_data);
            }
          } catch {
            // Skip invalid remaining buffer
          }
        }

        // Extract auto-memories and clean response (strip <!--MEMORY_EXTRACT:...--> markers)
        const sendCleanContent = extractAndSaveMemories(fullContent, sessionIdToUse);
        fullContent = sendCleanContent; // Update for downstream return

        // Safety net: ensure message is finalized with fileOperations even if 'done' event was missed
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionIdToUse
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === assistantMessageId
                      ? {
                          ...m,
                          content: sendCleanContent,
                          isStreaming: false,
                          fileOperations: fileOps.length > 0 ? [...fileOps] : m.fileOperations,
                        }
                      : m
                  ),
                  lastMessage: sendCleanContent.slice(0, 50),
                }
              : s
          )
        );

        // Save to database - only if we have valid content, authenticated, and a real session ID
        if (
          authState.isAuthenticated &&
          sessionIdToUse &&
          !/^session-\d+$/.test(sessionIdToUse)
        ) {
          try {
            // Only save messages with actual content
            const messagesToSave = [];
            if (displayContent && displayContent.trim()) {
              messagesToSave.push({
                role: 'user',
                content: displayContent.trim(),
              });
            }
            if (fullContent && fullContent.trim()) {
              messagesToSave.push({
                role: 'assistant',
                content: fullContent.trim(),
                latencyMs: Date.now() - streamStartTime,
                ...(fileOps.length > 0 ? { metadata: { fileOperations: fileOps.map(op => ({ tool: op.tool, filename: op.filename, path: op.path, folder: op.folder, content: op.content, language: op.language })) } } : {}),
              });
            }

            if (messagesToSave.length > 0) {
              const saveResp = await fetch(
                `/api/chat/sessions/${sessionIdToUse}/messages`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ messages: messagesToSave }),
                }
              );
              if (saveResp.ok) {
                // Sync DB IDs back into local state so pin/save uses correct IDs
                const saveData = await saveResp.json();
                if (saveData.success && saveData.messages?.length > 0) {
                  const dbMessages = saveData.messages;
                  // Map: local IDs in order → DB IDs in order (user first, then assistant)
                  const idMap: Record<string, string> = {};
                  let idx = 0;
                  if (displayContent && displayContent.trim() && dbMessages[idx]) {
                    idMap[userMessage.id] = dbMessages[idx].id;
                    idx++;
                  }
                  if (fullContent && fullContent.trim() && dbMessages[idx]) {
                    idMap[assistantMessageId] = dbMessages[idx].id;
                  }
                  if (Object.keys(idMap).length > 0) {
                    setSessions((prev) =>
                      prev.map((s) =>
                        s.id === sessionIdToUse
                          ? {
                              ...s,
                              messages: s.messages.map((m) =>
                                idMap[m.id] ? { ...m, id: idMap[m.id] } : m
                              ),
                            }
                          : s
                      )
                    );
                  }
                }
              } else {
                console.error(
                  'Failed to save messages:',
                  await saveResp.text()
                );
              }
            }
          } catch (saveError) {
            console.error('Failed to save messages:', saveError);
          }
        }

        return fullContent; // Return the response for voice chat to speak
      } catch (error: any) {
        if (error.name === 'AbortError') {
          // Handle abort
          setSessions((prev) =>
            prev.map((s) =>
              s.id === sessionIdToUse
                ? {
                    ...s,
                    messages: s.messages.map((m) =>
                      m.id === assistantMessageId
                        ? {
                            ...m,
                            content: m.content + '\n\n[Generation stopped]',
                            isStreaming: false,
                          }
                        : m
                    ),
                  }
                : s
            )
          );
        } else {
          console.error('Send message error:', error);
          const errorInfo = getErrorInfo(error);
          setSessions((prev) =>
            prev.map((s) =>
              s.id === sessionIdToUse
                ? {
                    ...s,
                    messages: s.messages.map((m) =>
                      m.id === assistantMessageId
                        ? {
                            ...m,
                            content: errorInfo.message,
                            isStreaming: false,
                          }
                        : m
                    ),
                  }
                : s
            )
          );
        }
      } finally {
        setIsLoading(false);
        setStreamAnalytics(prev => {
          const final = { ...prev, requestActive: false, elapsedMs: prev.startTime ? Date.now() - prev.startTime : 0 };
          const sid = sessions.find(s => s.id === activeSessionId) ? activeSessionId : activeSessionId;
          setSessionStats(ss => {
            const cur = ss[sid] || { ...EMPTY_SESSION_STATS };
            const toolTypes = { ...cur.toolTypes };
            let imgGen = 0, codeGen = 0, docGen = 0, vidGen = 0;
            for (const tn of sendToolNames) {
              toolTypes[tn] = (toolTypes[tn] || 0) + 1;
              const cls = classifyToolAsGenerated(tn);
              if (cls.type === 'image') imgGen++;
              else if (cls.type === 'code') codeGen++;
              else if (cls.type === 'document') docGen++;
              else if (cls.type === 'video') vidGen++;
            }
            const filesGen = imgGen + codeGen + docGen + vidGen;
            return { ...ss, [sid]: { ...cur, totalRequests: cur.totalRequests + 1, totalTokens: cur.totalTokens + final.tokenCount, totalToolsUsed: cur.totalToolsUsed + final.toolsUsed, filesGenerated: cur.filesGenerated + filesGen, imagesGenerated: cur.imagesGenerated + imgGen, codeGenerated: cur.codeGenerated + codeGen, documentsGenerated: cur.documentsGenerated + docGen, videosGenerated: cur.videosGenerated + vidGen, toolTypes } };
          });
          return final;
        });
        abortControllerRef.current = null;
      }
    },
    [
      activeSession,
      activeSessionId,
      isLoading,
      agent.id,
      agent.name,
      settings,
      authState.isAuthenticated,
      sessions,
    ]
  );

  const handleSendMessage = useCallback(async () => {
    if (
      (!inputValue.trim() && attachments.length === 0) ||
      !activeSession ||
      isLoading
    )
      return;

    const text = inputValue.trim();
    const currentAttachments = [...attachments];

    setInputValue('');
    setAttachments([]);
    // Reset textarea height to single line
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
    }

    // All modes flow through the unified sendMessageWithText pipeline
    // which handles DB sessions, history, system prompt, attachments,
    // saving, analytics, and memory extraction for every mode.
    await sendMessageWithText(text, currentAttachments, chatMode);
  }, [inputValue, attachments, activeSession, isLoading, sendMessageWithText, chatMode]);

  // Stop generation function
  const handleStopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return (
    <>
    <Overlay active={isOverlayActive} onActivate={() => setIsOverlayActive(false)} />
    <EnhancedChatLayout
      agentId={agent.id}
      agentName={agent.name}
      agentIcon={agent.icon}
      sessions={sessions}
      activeSessionId={activeSessionId}
      onNewSession={handleNewSession}
      onSelectSession={handleSelectSession}
      onDeleteSession={handleDeleteSession}
      onRenameSession={handleRenameSession}
      onExportSession={handleExportSession}
      settings={settings}
      onUpdateSettings={handleUpdateSettings}
      onResetSettings={handleResetSettings}
      externalUrl="https://mumtaz.ai/dashboard/overview"
      researchPanelOpen={researchPanelOpen}
      researchTabs={researchTabs}
      activeResearchTabId={activeResearchTabId}
      onCloseResearchPanel={handleCloseResearchPanel}
      onSelectResearchTab={handleSelectResearchTab}
      onCloseResearchTab={handleCloseResearchTab}
      mapPanelOpen={mapPanelOpen}
      mapTabs={mapTabs}
      activeMapTabId={activeMapTabId}
      onCloseMapPanel={handleCloseMapPanel}
      onSelectMapTab={handleSelectMapTab}
      onCloseMapTab={handleCloseMapTab}
    >
      <div className="flex flex-col h-full">
        {/* Pinned & Saved Messages Panel */}
        {(pinnedMessages.size > 0 || savedMessages.size > 0) && (
          <div className="border-b border-white/80 bg-gradient-to-r from-slate-50/80 to-white/80 backdrop-blur-sm">
            {/* Panel Toggle Buttons */}
            <div className="flex items-center gap-1 px-3 py-1.5">
              {pinnedMessages.size > 0 && (
                <button
                  onClick={() => { setShowPinnedPanel(!showPinnedPanel); setShowSavedPanel(false); }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    showPinnedPanel
                      ? 'bg-blue-100 text-blue-700 shadow-sm'
                      : 'text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <MapPinSolidIcon className="w-3.5 h-3.5" />
                  <span>{pinnedMessages.size} Pinned</span>
                  {showPinnedPanel ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
                </button>
              )}
              {savedMessages.size > 0 && (
                <button
                  onClick={() => { setShowSavedPanel(!showSavedPanel); setShowPinnedPanel(false); }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    showSavedPanel
                      ? 'bg-amber-100 text-amber-700 shadow-sm'
                      : 'text-amber-600 hover:bg-amber-50'
                  }`}
                >
                  <BookmarkSolidIcon className="w-3.5 h-3.5" />
                  <span>{savedMessages.size} Saved</span>
                  {showSavedPanel ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
                </button>
              )}
            </div>

            {/* Pinned Messages Dropdown */}
            {showPinnedPanel && pinnedMessages.size > 0 && (
              <div className="max-h-48 overflow-y-auto px-3 pb-2 space-y-1.5 custom-scrollbar">
                {activeSession?.messages
                  .filter((m) => pinnedMessages.has(m.id))
                  .map((msg) => (
                    <button
                      key={`pin-${msg.id}`}
                      onClick={() => { scrollToMessage(msg.id); setShowPinnedPanel(false); }}
                      className="w-full flex items-start gap-2 p-2 rounded-lg hover:bg-blue-50 transition-all text-left group"
                    >
                      <MapPinSolidIcon className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`text-[10px] font-semibold uppercase tracking-wide ${
                            msg.role === 'user' ? 'text-blue-600' : 'text-slate-400'
                          }`}>
                            {msg.role === 'user' ? 'You' : agent.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            <FormattedTime date={msg.timestamp} />
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 group-hover:text-blue-700 transition-colors">
                          {msg.content.replace(/[#*_`~>\[\]()!]/g, '').slice(0, 120)}{msg.content.length > 120 ? '...' : ''}
                        </p>
                      </div>
                      <ChevronDownIcon className="w-3 h-3 text-slate-400 mt-0.5 -rotate-90 group-hover:text-blue-500 flex-shrink-0" />
                    </button>
                  ))}
              </div>
            )}

            {/* Saved Messages Dropdown */}
            {showSavedPanel && savedMessages.size > 0 && (
              <div className="max-h-48 overflow-y-auto px-3 pb-2 space-y-1.5 custom-scrollbar">
                {activeSession?.messages
                  .filter((m) => savedMessages.has(m.id))
                  .map((msg) => (
                    <button
                      key={`save-${msg.id}`}
                      onClick={() => { scrollToMessage(msg.id); setShowSavedPanel(false); }}
                      className="w-full flex items-start gap-2 p-2 rounded-lg hover:bg-amber-50 transition-all text-left group"
                    >
                      <BookmarkSolidIcon className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`text-[10px] font-semibold uppercase tracking-wide ${
                            msg.role === 'user' ? 'text-blue-600' : 'text-slate-400'
                          }`}>
                            {msg.role === 'user' ? 'You' : agent.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            <FormattedTime date={msg.timestamp} />
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 group-hover:text-amber-700 transition-colors">
                          {msg.content.replace(/[#*_`~>\[\]()!]/g, '').slice(0, 120)}{msg.content.length > 120 ? '...' : ''}
                        </p>
                      </div>
                      <ChevronDownIcon className="w-3 h-3 text-slate-400 mt-0.5 -rotate-90 group-hover:text-amber-500 flex-shrink-0" />
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {activeSession?.messages.map((message) => {
            // Extract media images once per message (avoid double-processing on every render)
            const { cleanContent: messageCleanContent, images: messageImages } = extractMediaImages(message.content);

            return (
            <div
              id={`msg-${message.id}`}
              key={message.id}
              className={`flex flex-col ${
                message.role === 'user' ? 'items-end' : 'items-start'
              } ${highlightedMessageId === message.id ? 'animate-pulse' : ''}`}
            >
              {/* Pinned / Saved indicator */}
              {(pinnedMessages.has(message.id) || savedMessages.has(message.id)) && (
                <div className={`flex items-center gap-1.5 mb-1 text-xs ${message.role === 'user' ? 'mr-1' : 'ml-1'}`}>
                  {pinnedMessages.has(message.id) && (
                    <span className="flex items-center gap-0.5 text-blue-500">
                      <MapPinSolidIcon className="w-3 h-3" />
                      <span>Pinned</span>
                    </span>
                  )}
                  {savedMessages.has(message.id) && (
                    <span className="flex items-center gap-0.5 text-amber-500">
                      <BookmarkSolidIcon className="w-3 h-3" />
                      <span>Saved</span>
                    </span>
                  )}
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                    : 'bg-white border border-white/80 text-slate-700'
                } ${pinnedMessages.has(message.id) ? 'ring-1 ring-blue-300' : ''} ${highlightedMessageId === message.id ? 'ring-2 ring-blue-400 shadow-lg shadow-blue-200/50' : ''}`}
              >
                <div
                  className={`prose prose-sm max-w-none ${
                    message.role === 'user'
                      ? 'prose-invert prose-p:text-white prose-headings:text-white prose-strong:text-white prose-a:text-white/90 prose-li:text-white prose-em:text-white/80'
                      : ''
                  }`}
                  style={
                    message.role !== 'user'
                      ? {
                          // Use CSS custom properties so prose children inherit readable colors
                          '--tw-prose-body': isDarkMode ? '#d1d5db' : '#374151',
                          '--tw-prose-headings': isDarkMode ? '#f3f4f6' : '#111827',
                          '--tw-prose-bold': isDarkMode ? '#f9fafb' : '#111827',
                          '--tw-prose-links': isDarkMode ? '#60a5fa' : '#0284c7',
                          '--tw-prose-counters': isDarkMode ? '#9ca3af' : '#6b7280',
                          '--tw-prose-bullets': isDarkMode ? '#9ca3af' : '#6b7280',
                          '--tw-prose-quotes': isDarkMode ? '#d1d5db' : '#374151',
                        } as React.CSSProperties
                      : undefined
                  }
                >
                  {/* Display attachments (images as thumbnails) */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mb-3 space-y-2">
                      {message.attachments.map((attachment, idx) => (
                        <div key={idx}>
                          {attachment.type.startsWith('image/') &&
                          attachment.preview ? (
                            <div className="relative group">
                              {/* Use native img for S3 presigned URLs (they have query params that break next/image) */}
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={attachment.preview}
                                alt={attachment.name}
                                className="rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity max-w-[200px] max-h-[200px]"
                                onClick={() =>
                                  attachment.url &&
                                  window.open(attachment.url, '_blank')
                                }
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity truncate">
                                {attachment.name}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 p-2 bg-black/10 rounded-lg text-sm">
                              <span>📎</span>
                              <span className="truncate">
                                {attachment.name}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Render extracted media images (S3 URLs or DALL-E URLs) */}
                  {(() => {
                    if (messageImages.length === 0) return null;

                    return (
                      <div className="mb-3 space-y-3">
                        {messageImages.map((image, idx) => (
                          <div key={idx} className="relative group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={image.src}
                              alt={image.alt || 'Generated image'}
                              className="rounded-lg shadow-lg cursor-pointer hover:opacity-95 transition-opacity max-w-full"
                              style={{ maxHeight: '400px', objectFit: 'contain' }}
                              onClick={() =>
                                setPreviewImage({
                                  src: image.src,
                                  alt: image.alt,
                                })
                              }
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (!target.dataset.retried) {
                                  target.dataset.retried = 'true';
                                  if (target.src.includes('amazonaws.com') && !target.src.includes('?')) {
                                    target.src = target.src + '?t=' + Date.now();
                                  }
                                }
                              }}
                            />
                            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                              <button
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const filename =
                                    image.alt ||
                                    `generated-image-${Date.now()}.png`;
                                  try {
                                    // Method 1: Direct base64 to blob conversion (most reliable for data URLs)
                                    if (image.src.startsWith('data:')) {
                                      const [header, base64Data] =
                                        image.src.split(',');
                                      const mimeMatch =
                                        header.match(/data:([^;]+)/);
                                      const mimeType = mimeMatch
                                        ? mimeMatch[1]
                                        : 'image/png';
                                      const byteCharacters = atob(base64Data);
                                      const byteNumbers = new Array(
                                        byteCharacters.length
                                      );
                                      for (
                                        let i = 0;
                                        i < byteCharacters.length;
                                        i++
                                      ) {
                                        byteNumbers[i] =
                                          byteCharacters.charCodeAt(i);
                                      }
                                      const byteArray = new Uint8Array(
                                        byteNumbers
                                      );
                                      const blob = new Blob([byteArray], {
                                        type: mimeType,
                                      });
                                      const url =
                                        window.URL.createObjectURL(blob);
                                      const a = document.createElement('a');
                                      a.href = url;
                                      a.download = filename;
                                      a.style.display = 'none';
                                      document.body.appendChild(a);
                                      a.click();
                                      setTimeout(() => {
                                        document.body.removeChild(a);
                                        window.URL.revokeObjectURL(url);
                                      }, 100);
                                      return;
                                    }

                                    // Method 2: Use fetch for remote URLs
                                    const response = await fetch(image.src);
                                    const blob = await response.blob();
                                    const url =
                                      window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = filename;
                                    a.style.display = 'none';
                                    document.body.appendChild(a);
                                    a.click();
                                    setTimeout(() => {
                                      document.body.removeChild(a);
                                      window.URL.revokeObjectURL(url);
                                    }, 100);
                                  } catch (err) {
                                    console.error('Download failed:', err);
                                    // Fallback: Open in new tab
                                    window.open(image.src, '_blank');
                                  }
                                }}
                                className="bg-black/70 hover:bg-black/90 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 shadow-lg"
                                title="Download image"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                  />
                                </svg>
                                Download
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewImage({
                                    src: image.src,
                                    alt: image.alt,
                                  });
                                }}
                                className="bg-black/70 hover:bg-black/90 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 shadow-lg"
                                title="Open full size"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                  />
                                </svg>
                                Open
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  <div
                    style={
                      message.role !== 'user'
                        ? {
                            color: isDarkMode ? '#e5e7eb' : '#374151',
                            fontSize: '14px',
                            lineHeight: '1.5',
                          }
                        : undefined
                    }
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        // Custom image renderer with download button and modal preview
                        img({ src, alt, ...props }) {
                          const handleDownload = async (
                            e: React.MouseEvent
                          ) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!src) return;

                            const filename =
                              alt || `generated-image-${Date.now()}.png`;

                            try {
                              // Handle base64 data URLs directly (no proxy needed)
                              if (src.startsWith('data:')) {
                                // Extract the base64 data and create a blob
                                const [header, base64Data] = src.split(',');
                                const mimeMatch = header.match(/data:([^;]+)/);
                                const mimeType = mimeMatch
                                  ? mimeMatch[1]
                                  : 'image/png';

                                const byteCharacters = atob(base64Data);
                                const byteNumbers = new Array(
                                  byteCharacters.length
                                );
                                for (
                                  let i = 0;
                                  i < byteCharacters.length;
                                  i++
                                ) {
                                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                                }
                                const byteArray = new Uint8Array(byteNumbers);
                                const blob = new Blob([byteArray], {
                                  type: mimeType,
                                });

                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = filename;
                                a.style.display = 'none';
                                document.body.appendChild(a);
                                a.click();
                                setTimeout(() => {
                                  document.body.removeChild(a);
                                  window.URL.revokeObjectURL(url);
                                }, 100);
                                return;
                              }

                              // Use our proxy endpoint to bypass CORS for remote URLs
                              const proxyUrl = `/api/uploads/proxy-download?url=${encodeURIComponent(src)}&filename=${encodeURIComponent(filename)}`;

                              const response = await fetch(proxyUrl);
                              if (!response.ok) throw new Error('Proxy failed');

                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = filename;
                              a.style.display = 'none';
                              document.body.appendChild(a);
                              a.click();
                              setTimeout(() => {
                                document.body.removeChild(a);
                                window.URL.revokeObjectURL(url);
                              }, 100);
                            } catch (error) {
                              console.error('Download failed:', error);
                              // Last resort: open image in new tab for manual save
                              window.open(src, '_blank');
                            }
                          };

                          return (
                            <div className="relative group my-3">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={src}
                                alt={alt || 'Generated image'}
                                className="rounded-lg shadow-lg cursor-pointer hover:opacity-95 transition-opacity max-w-full"
                                style={{ maxHeight: '400px', objectFit: 'contain' }}
                                onClick={() =>
                                  setPreviewImage({
                                    src: src || '',
                                    alt: alt || '',
                                  })
                                }
                              />
                              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <button
                                  onClick={handleDownload}
                                  className="bg-black/70 hover:bg-black/90 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 shadow-lg"
                                  title="Download image"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                    />
                                  </svg>
                                  Download
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Open in the existing preview modal instead of new browser tab
                                    setPreviewImage({
                                      src: src || '',
                                      alt: alt || '',
                                    });
                                  }}
                                  className="bg-black/70 hover:bg-black/90 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 shadow-lg"
                                  title="View full size"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                                    />
                                  </svg>
                                  View
                                </button>
                              </div>
                            </div>
                          );
                        },
                        // Custom ordered list with bright numbers
                        ol({ children, ...props }) {
                          return (
                            <ol className="list-none space-y-2 my-3" {...props}>
                              {children}
                            </ol>
                          );
                        },
                        // Custom list item with colorful number badge
                        li({ children, ...props }: any) {
                          // Check if parent is ordered list by looking at context
                          const isOrdered =
                            (props as any).node?.parent?.tagName === 'ol';
                          if (isOrdered) {
                            const num =
                              (props as any).node?.position?.start?.line ||
                              0;
                            return (
                              <li className="flex items-start gap-3" {...props}>
                                <span className="flex-shrink-0 w-7 h-7 rounded-full neu-icon text-blue-600 font-bold text-sm flex items-center justify-center">
                                  {num}
                                </span>
                                <div className="flex-1 pt-0.5">{children}</div>
                              </li>
                            );
                          }
                          return (
                            <li
                              className="flex items-start gap-3 my-2"
                              {...props}
                            >
                              <span className="flex-shrink-0 w-2.5 h-2.5 mt-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"></span>
                              <div className={`flex-1 ${isDarkMode ? 'text-gray-200' : 'text-slate-500'}`}>
                                {children}
                              </div>
                            </li>
                          );
                        },
                        // Custom strong/bold text – theme-aware
                        strong({ children, ...props }) {
                          return (
                            <strong
                              className={`font-semibold ${isDarkMode ? 'text-white' : 'text-blue-600'}`}
                              {...props}
                            >
                              {children}
                            </strong>
                          );
                        },
                        // Custom link styling for readability in both themes
                        // File download links trigger direct download; others show confirmation dialog
                        a({ children, href, ...props }: any) {
                          if (!href) {
                            return <span {...props}>{children}</span>;
                          }
                          // Detect any download-like URL (including hallucinated domains)
                          // Patterns: /api/agents/files/download, api.agents.com/files/download, etc.
                          const downloadPattern = /files\/download\?/i;
                          let resolvedHref = href;
                          let isFileDownload = href.includes('/api/agents/files/download') || href.includes('/api/uploads/');
                          // Fix hallucinated external download URLs → rewrite to local relative path
                          if (!isFileDownload && downloadPattern.test(href)) {
                            const qIdx = href.indexOf('files/download?');
                            if (qIdx !== -1) {
                              resolvedHref = '/api/agents/' + href.slice(qIdx);
                              isFileDownload = true;
                            }
                          }
                          href = resolvedHref;
                          if (isFileDownload) {
                            const filename = new URLSearchParams(href.split('?')[1] || '').get('path')?.split('/').pop() || 'download';
                            return (
                              <button
                                onClick={async () => {
                                  try {
                                    const res = await fetch(href);
                                    const blob = await res.blob();
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = filename;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                  } catch (err) {
                                    console.error('Download failed:', err);
                                  }
                                }}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition cursor-pointer border-none"
                                title={`Download ${filename}`}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                📥 Download {filename}
                              </button>
                            );
                          }
                          return (
                            <button
                              onClick={() => {
                                setPendingLink({
                                  url: href,
                                  text: typeof children === 'string' ? children : String(children),
                                });
                              }}
                              className="text-blue-600 hover:underline font-medium cursor-pointer bg-none border-none p-0"
                              title={href}
                              {...props}
                            >
                              {children}
                            </button>
                          );
                        },
                        // Custom paragraph with better spacing
                        p({ children, ...props }) {
                          return (
                            <p
                              className={`my-2 leading-relaxed ${isDarkMode ? 'text-gray-200' : 'text-slate-500'}`}
                              {...props}
                            >
                              {children}
                            </p>
                          );
                        },
                        // Custom headings — dark-mode aware
                        h1({ children, ...props }) {
                          return (
                            <h1
                              className={`text-xl font-bold my-3 ${isDarkMode ? 'text-gray-100' : 'text-slate-700'}`}
                              {...props}
                            >
                              {children}
                            </h1>
                          );
                        },
                        h2({ children, ...props }) {
                          return (
                            <h2
                              className={`text-lg font-bold my-2.5 ${isDarkMode ? 'text-gray-100' : 'text-slate-700'}`}
                              {...props}
                            >
                              {children}
                            </h2>
                          );
                        },
                        h3({ children, ...props }) {
                          return (
                            <h3
                              className={`text-base font-semibold my-2 ${isDarkMode ? 'text-gray-200' : 'text-slate-700'}`}
                              {...props}
                            >
                              {children}
                            </h3>
                          );
                        },
                        code({ className, children, node, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          const codeString = extractTextFromChildren(
                            children
                          ).replace(/\n$/, '');
                          const isInline =
                            !match && !String(children).includes('\n');

                          // Inline code — small colored badge (adapt to message role + theme)
                          if (isInline) {
                            const isUserMsg = message.role === 'user';
                            const inlineCodeStyle = isUserMsg
                              ? {
                                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                  color: '#ffffff',
                                  border: '1px solid rgba(255, 255, 255, 0.3)',
                                }
                              : isDarkMode
                                ? {
                                    backgroundColor: 'rgba(96, 165, 250, 0.15)',
                                    color: '#93c5fd',
                                    border: '1px solid rgba(96, 165, 250, 0.25)',
                                  }
                                : {
                                    backgroundColor: '#f0f7ff',
                                    color: '#0284c7',
                                    border: '1px solid rgba(2, 132, 199, 0.2)',
                                  };
                            return (
                              <code
                                className={`px-1.5 py-0.5 rounded ${className || ''}`}
                                style={inlineCodeStyle}
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          }

                          // Block code — collapsible panel (inline in message flow)
                          const lang = match ? match[1] : 'code';
                          const lineCount = codeString.split('\n').length;
                          const isStreaming = message.isStreaming;

                          return (
                            <InlineCodePanel
                              code={codeString}
                              language={lang}
                              lineCount={lineCount}
                              defaultExpanded={isStreaming}
                            />
                          );
                        },
                        // Custom pre element - pass through since code() handles block rendering
                        pre({ children, ...props }) {
                          return <>{children}</>;
                        },
                        // Custom table styling for theme awareness
                        table({ children, ...props }) {
                          return (
                            <div className="overflow-x-auto my-4">
                              <table
                                className={`min-w-full border-collapse rounded-lg overflow-hidden shadow-sm border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-white/80'}`}
                                {...props}
                              >
                                {children}
                              </table>
                            </div>
                          );
                        },
                        thead({ children, ...props }) {
                          return (
                            <thead className={isDarkMode ? 'bg-gray-800' : 'bg-blue-50'} {...props}>
                              {children}
                            </thead>
                          );
                        },
                        tbody({ children, ...props }) {
                          return (
                            <tbody
                              className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-slate-100'}`}
                              {...props}
                            >
                              {children}
                            </tbody>
                          );
                        },
                        tr({ children, ...props }) {
                          return (
                            <tr className={isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-blue-50/50'} {...props}>
                              {children}
                            </tr>
                          );
                        },
                        th({ children, ...props }) {
                          return (
                            <th
                              className={`px-4 py-3 text-left text-sm font-semibold ${isDarkMode ? 'text-gray-100' : 'text-slate-700'}`}
                              {...props}
                            >
                              {children}
                            </th>
                          );
                        },
                        td({ children, ...props }) {
                          return (
                            <td
                              className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-slate-500'}`}
                              {...props}
                            >
                              {children}
                            </td>
                          );
                        },
                      }}
                    >
                      {(() => {
                        if (message.role !== 'assistant') return messageCleanContent;
                        const { text, blocks } = protectCodeBlocks(messageCleanContent);
                        const final = restoreCodeBlocks(
                          stripRawHTML(cleanRoleplayActions(text)),
                          blocks
                        );
                        // DEBUG: trace code block rendering pipeline
                        if (blocks.length > 0 && !message.isStreaming) {
                          console.log('[CodeBlock Debug]', {
                            blocksFound: blocks.length,
                            placeholdersInText: (text.match(/___CODEBLOCK_\d+___/g) || []).length,
                            firstBlockPreview: blocks[0]?.substring(0, 100),
                            textAroundPlaceholder: text.substring(
                              Math.max(0, text.indexOf('___CODEBLOCK_0___') - 30),
                              text.indexOf('___CODEBLOCK_0___') + 50
                            ),
                            finalPreview: final.substring(0, 300),
                          });
                        }
                        return final;
                      })()}
                    </ReactMarkdown>
                  </div>
                  {/* Blinking cursor during streaming */}
                  {message.isStreaming && (
                    <span className="inline-block w-2 h-5 ml-1 bg-current animate-pulse rounded-sm" />
                  )}
                </div>

                {/* File operation preview panels */}
                {message.role === 'assistant' && message.fileOperations && message.fileOperations.length > 0 && (
                  <FileOperationsPanel
                    fileOps={message.fileOperations}
                    onOpenFile={(fileOp) => {
                      // Open file in a new browser tab for viewing/editing
                      const blob = new Blob([fileOp.content], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      window.open(url, '_blank');
                      // Also try to open in canvas editor if available
                      const canvasUrl = `/apps/canvas?file=${encodeURIComponent(fileOp.path || fileOp.filename)}`;
                      window.open(canvasUrl, 'canvas-editor');
                    }}
                  />
                )}



                <div
                  className={`text-xs mt-2 ${
                    message.role === 'user'
                      ? 'text-white/60'
                      : 'text-slate-400'
                  }`}
                >
                  <FormattedTime date={message.timestamp} />
                </div>

                {message.role === 'assistant' && (
                  <div className="flex items-center space-x-1 mt-2 pt-2 border-t relative z-50 border-white/80">
                    <button
                      onClick={() => handleFeedback(message.id, 'up')}
                      className={`p-1.5 rounded-lg transition-all ${
                        messageFeedback[message.id] === 'up'
                          ? 'bg-green-100 text-green-600'
                          : 'hover:bg-blue-50 text-slate-400 hover:text-blue-600'
                      }`}
                      title="Good response"
                    >
                      <HandThumbUpIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleFeedback(message.id, 'down')}
                      className={`p-1.5 rounded-lg transition-all ${
                        messageFeedback[message.id] === 'down'
                          ? 'bg-red-100 text-red-600'
                          : 'hover:bg-blue-50 text-slate-400 hover:text-blue-600'
                      }`}
                      title="Poor response"
                    >
                      <HandThumbDownIcon className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 mx-1 bg-slate-200" />
                    <button
                      onClick={() =>
                        handleCopyMessage(message.id, message.content)
                      }
                      className={`p-1.5 rounded-lg transition-all ${
                        copiedMessageId === message.id
                          ? 'bg-blue-50 text-blue-600'
                          : 'hover:bg-blue-50 text-slate-400 hover:text-blue-600'
                      }`}
                      title={
                        copiedMessageId === message.id
                          ? 'Copied!'
                          : 'Copy message'
                      }
                    >
                      <ClipboardDocumentIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleShareMessage(message.content)}
                      className="p-1.5 rounded-lg transition-all hover:bg-blue-50 text-slate-400 hover:text-blue-600"
                      title="Share message"
                    >
                      <ShareIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        handleListenMessage(message.content, message.id)
                      }
                      className={`p-1.5 rounded-lg transition-all ${speakingMessageId === message.id ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : 'hover:bg-blue-50 text-slate-400 hover:text-blue-600'}`}
                      title={
                        speakingMessageId === message.id
                          ? 'Stop speaking'
                          : 'Listen to message'
                      }
                    >
                      {speakingMessageId === message.id ? (
                        <StopIcon className="w-4 h-4" />
                      ) : (
                        <SpeakerWaveIcon className="w-4 h-4" />
                      )}
                    </button>
                    <div className="w-px h-4 mx-1 bg-slate-200" />
                    <button
                      onClick={() => handleRegenerateMessage(message.id)}
                      disabled={isLoading}
                      className={`p-1.5 rounded-lg transition-all ${
                        isLoading
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-blue-50 text-slate-400 hover:text-blue-600'
                      }`}
                      title="Regenerate response"
                    >
                      <ArrowPathIcon className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 mx-1 bg-slate-200" />
                    <button
                      onClick={() => handleTogglePinMessage(message.id)}
                      className={`p-1.5 rounded-lg transition-all ${
                        pinnedMessages.has(message.id)
                          ? 'bg-blue-50 text-blue-600'
                          : 'hover:bg-blue-50 text-slate-400 hover:text-blue-600'
                      }`}
                      title={pinnedMessages.has(message.id) ? 'Unpin message' : 'Pin message'}
                    >
                      {pinnedMessages.has(message.id) ? (
                        <MapPinSolidIcon className="w-4 h-4" />
                      ) : (
                        <MapPinIcon className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleToggleSaveMessage(message.id)}
                      className={`p-1.5 rounded-lg transition-all ${
                        savedMessages.has(message.id)
                          ? 'bg-amber-50 text-amber-600'
                          : 'hover:bg-blue-50 text-slate-400 hover:text-blue-600'
                      }`}
                      title={savedMessages.has(message.id) ? 'Unsave message' : 'Save message'}
                    >
                      {savedMessages.has(message.id) ? (
                        <BookmarkSolidIcon className="w-4 h-4" />
                      ) : (
                        <BookmarkIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}

                {/* User message actions */}
                {message.role === 'user' && (
                  <>
                    {editingMessageId === message.id ? (
                      <div className="mt-2 space-y-2">
                        <textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          placeholder="Edit your message..."
                          className="w-full p-2 rounded-lg bg-white/10 text-white text-sm resize-none border border-white/20 focus:border-indigo-400 focus:outline-none"
                          rows={3}
                          autoFocus
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-1 text-xs text-white/70 hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(message.id)}
                            disabled={isLoading || !editingContent.trim()}
                            className="px-3 py-1 text-xs bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors disabled:opacity-50"
                          >
                            Save & Regenerate
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end space-x-1 mt-2 pt-2 border-t border-white/10 relative">
                        <button
                          onClick={() => handleCopyUserMessage(message.content)}
                          className="p-1.5 rounded-lg transition-all text-white/60 hover:text-white hover:bg-white/10"
                          title="Copy message"
                        >
                          <ClipboardDocumentIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleStartEdit(message.id, message.content)
                          }
                          disabled={isLoading}
                          className={`p-1.5 rounded-lg transition-all text-white/60 hover:text-white hover:bg-white/10 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title="Edit message"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <div className="w-px h-4 mx-0.5 bg-white/20" />
                        <button
                          onClick={() => handleTogglePinMessage(message.id)}
                          className={`p-1.5 rounded-lg transition-all ${
                            pinnedMessages.has(message.id)
                              ? 'text-white bg-white/20'
                              : 'text-white/60 hover:text-white hover:bg-white/10'
                          }`}
                          title={pinnedMessages.has(message.id) ? 'Unpin message' : 'Pin message'}
                        >
                          {pinnedMessages.has(message.id) ? (
                            <MapPinSolidIcon className="w-4 h-4" />
                          ) : (
                            <MapPinIcon className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleToggleSaveMessage(message.id)}
                          className={`p-1.5 rounded-lg transition-all ${
                            savedMessages.has(message.id)
                              ? 'text-amber-300 bg-white/20'
                              : 'text-white/60 hover:text-white hover:bg-white/10'
                          }`}
                          title={savedMessages.has(message.id) ? 'Unsave message' : 'Save message'}
                        >
                          {savedMessages.has(message.id) ? (
                            <BookmarkSolidIcon className="w-4 h-4" />
                          ) : (
                            <BookmarkIcon className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
          })}

          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-4 py-3 shadow-sm bg-white border border-white/80">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div
                      className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <div
                      className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <div
                      className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                  <span className="text-xs text-slate-400">
                    {agent.name} is thinking...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions Panel */}
        <QuickActionsPanel
          onSelectAction={(prompt) => setInputValue(prompt)}
          theme={'default'}
          isCollapsed={activePanel !== 'quick-actions'}
          onToggleCollapse={() =>
            setActivePanel(activePanel === 'quick-actions' ? null : 'quick-actions')
          }
          onMicToggle={handleMicrophoneToggle}
          onFileUpload={() => fileInputRef.current?.click()}
          onVoiceCall={() => {
            if (isAgentSubscribed) {
              setIsVoiceChatOpen(true);
            } else {
              setShowVoiceUpgradeModal(true);
            }
          }}
          isRecording={isRecording}
          hasSpeechRecognition={hasSpeechRecognition}
          streamAnalytics={streamAnalytics}
          activePanel={activePanel}
          onToggleMemory={() =>
            setActivePanel(activePanel === 'memory' ? null : 'memory')
          }
          onToggleStats={() =>
            setActivePanel(activePanel === 'stats' ? null : 'stats')
          }
          onToggleExport={() =>
            setActivePanel(activePanel === 'export' ? null : 'export')
          }
          onToggleShortcuts={() =>
            setActivePanel(activePanel === 'shortcuts' ? null : 'shortcuts')
          }
          onToggleEmoji={() =>
            setActivePanel(activePanel === 'emoji' ? null : 'emoji')
          }
          onExportChat={handleExportChat}
          onInsertEmoji={handleInsertEmoji}
          memorySettings={memorySettings}
          onMemoryChange={handleMemoryChange}
          sessionStats={(() => {
            const s = activeSession;
            const cumulative = sessionStats[activeSessionId] || { ...EMPTY_SESSION_STATS };
            const totalMessages = s ? s.messages.length : 0;
            const totalAttachments = s ? s.messages.reduce((acc, m) => acc + (m.attachments?.length || 0), 0) : 0;
            // Compute upload type breakdown from session messages
            let imagesUploaded = 0, docsUploaded = 0, otherUploaded = 0;
            if (s) {
              for (const m of s.messages) {
                if (m.attachments) {
                  for (const att of m.attachments) {
                    if (att.type?.startsWith('image/')) imagesUploaded++;
                    else if (att.type?.match(/pdf|document|spreadsheet|presentation|text\/|json|xml|csv|markdown/)) docsUploaded++;
                    else otherUploaded++;
                  }
                }
              }
            }
            return { ...cumulative, totalMessages, totalAttachments, imagesUploaded, docsUploaded, otherUploaded };
          })()}
        />

        {/* Input Area */}
        <div className="flex-shrink-0 px-4 py-1.5 border-t border-white/80 bg-white/90 backdrop-blur-sm">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            aria-label="File upload"
            multiple
            accept="image/*,audio/*,video/mp4,video/webm,.pdf,.txt,.md,.csv,.json,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.html,.css,.js,.ts,.py,.zip"
            onChange={(e) => {
              handleFilesSelected(e.target.files);
              e.target.value = '';
            }}
          />

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 px-1 pb-2">
              {attachments.map((file, idx) => (
                <div
                  key={`${file.name}-${idx}`}
                  className="flex items-center space-x-2 rounded-lg px-2 py-1 text-xs bg-slate-50 text-slate-600 border border-white/80"
                >
                  <span
                    className="font-medium truncate max-w-[140px]"
                    title={`${file.name} (${file.type || 'file'})`}
                  >
                    {file.name}
                  </span>
                  <button
                    type="button"
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() =>
                      setAttachments((prev) => prev.filter((_, i) => i !== idx))
                    }
                    aria-label={`Remove ${file.name}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2"
          >
            {/* Mode Selector Dropdown */}
            <div className="relative flex-shrink-0" ref={modeMenuRef}>
              <button
                type="button"
                onClick={() => setModeMenuOpen(!modeMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/80 bg-white hover:bg-slate-50 text-slate-600 transition-all text-sm font-medium h-[40px]"
                title="Switch chat mode"
              >
                {chatMode === 'chat' && <ChatBubbleLeftIcon className="w-4 h-4 text-blue-600" />}
                {chatMode === 'images' && <PhotoIcon className="w-4 h-4 text-purple-600" />}
                {chatMode === 'code' && <CodeBracketIcon className="w-4 h-4 text-emerald-600" />}
                {chatMode === 'search' && <MagnifyingGlassIcon className="w-4 h-4 text-blue-600" />}
                {chatMode === 'video' && <FilmIcon className="w-4 h-4 text-rose-600" />}
                <span className="hidden sm:inline">
                  {chatMode === 'chat' ? 'Agent' : chatMode === 'images' ? 'Images' : chatMode === 'code' ? 'Code' : chatMode === 'search' ? 'Search' : 'Video'}
                </span>
                <ChevronDownIcon className={`w-3 h-3 transition-transform ${modeMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {modeMenuOpen && (
                <div className="absolute bottom-full left-0 mb-1 w-56 glass-card z-[100] overflow-hidden ring-1 ring-black/5 backdrop-blur-none"
                  style={{ boxShadow: '0 -4px 24px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)' }}
                >
                  {[
                    { id: 'chat' as const, icon: ChatBubbleLeftIcon, label: 'Agent', desc: 'AI-powered assistant', color: 'text-blue-600', bgActive: 'bg-blue-50' },
                    { id: 'images' as const, icon: PhotoIcon, label: 'Images', desc: 'DALL-E 3 generation', color: 'text-purple-600', bgActive: 'bg-purple-50' },
                    { id: 'code' as const, icon: CodeBracketIcon, label: 'Code', desc: 'Codestral optimized for code', color: 'text-emerald-600', bgActive: 'bg-emerald-50' },
                    { id: 'search' as const, icon: MagnifyingGlassIcon, label: 'Search', desc: 'Web search + AI summary', color: 'text-blue-600', bgActive: 'bg-blue-50' },
                    { id: 'video' as const, icon: FilmIcon, label: 'Video', desc: 'RunwayML AI video generation', color: 'text-rose-600', bgActive: 'bg-rose-50' },
                  ].map(mode => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => { setChatMode(mode.id); setModeMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50 transition-colors ${chatMode === mode.id ? mode.bgActive : ''}`}
                    >
                      <mode.icon className={`w-5 h-5 ${mode.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                          {mode.label}
                          {mode.id === 'chat' && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">Recommended</span>}
                        </div>
                        <div className="text-[11px] text-slate-400">{mode.desc}</div>
                      </div>
                      {chatMode === mode.id && <div className={`w-1.5 h-1.5 rounded-full ${mode.color.replace('text-', 'bg-')}`} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  // Auto-resize: reset to 1 row then grow up to 10 lines
                  const ta = e.target;
                  ta.style.height = 'auto';
                  const lineHeight = 24; // ~1.5rem per line
                  const maxH = lineHeight * 10 + 16; // 10 lines + padding
                  ta.style.height = Math.min(ta.scrollHeight, maxH) + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (inputValue.trim() && !isLoading) handleSendMessage();
                  }
                }}
                placeholder={
                  chatMode === 'chat' ? `Message ${agent.name}...` :
                  chatMode === 'images' ? 'Describe the image you want to generate...' :
                  chatMode === 'code' ? 'Describe the code you need...' :
                  chatMode === 'video' ? 'Describe the video you want to generate...' :
                  'What would you like to search for?'
                }
                className={`w-full px-4 py-2.5 pr-12 rounded-xl border bg-white text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:border-transparent transition-all resize-none leading-6 overflow-y-auto ${
                  chatMode === 'chat' ? 'border-white/80 focus:ring-blue-500' :
                  chatMode === 'images' ? 'border-purple-200 focus:ring-purple-500' :
                  chatMode === 'code' ? 'border-emerald-200 focus:ring-emerald-500' :
                  chatMode === 'video' ? 'border-rose-200 focus:ring-rose-500' :
                  'border-blue-200 focus:ring-blue-500'
                }`}
                style={{ height: '40px', maxHeight: '256px' }}
                rows={1}
                disabled={isLoading}
              />
              {isLoading ? (
                <button
                  type="button"
                  onClick={handleStopGeneration}
                  className="absolute right-2 bottom-2 p-2 rounded-lg bg-gradient-to-r from-red-500 to-rose-600 text-white transition-all hover:from-red-600 hover:to-rose-700"
                  title="Stop generating"
                >
                  <StopIcon className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="absolute right-2 bottom-2 p-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:from-blue-700 hover:to-indigo-700 shadow-sm"
                  title="Send message"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </form>

          {!hasSpeechRecognition && (
            <p className="mt-0.5 text-[11px] text-slate-400">
              Speech recognition not available in this browser.
            </p>
          )}

          <div className="mt-1 pb-1 text-center">
            <p className="text-[10px] text-slate-400 leading-tight">
              AI digital friend can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative flex flex-col items-center max-w-[90vw] max-h-[90vh]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage.src}
              alt={previewImage.alt}
              className="rounded-lg shadow-2xl max-w-full max-h-[80vh] object-contain"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => {
                // If image fails to load (expired DALL-E URL, etc.), show a fallback
                const target = e.target as HTMLImageElement;
                if (!target.dataset.retried) {
                  target.dataset.retried = 'true';
                  // Try adding a cache-buster for S3 URLs
                  if (target.src.includes('amazonaws.com') && !target.src.includes('?')) {
                    target.src = target.src + '?t=' + Date.now();
                  }
                }
              }}
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  const filename =
                    previewImage.alt || `generated-image-${Date.now()}.png`;
                  try {
                    // Handle base64 data URLs directly (no proxy needed)
                    if (previewImage.src.startsWith('data:')) {
                      const [header, base64Data] = previewImage.src.split(',');
                      const mimeMatch = header.match(/data:([^;]+)/);
                      const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';

                      const byteCharacters = atob(base64Data);
                      const byteNumbers = new Array(byteCharacters.length);
                      for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                      }
                      const byteArray = new Uint8Array(byteNumbers);
                      const blob = new Blob([byteArray], { type: mimeType });

                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = filename;
                      a.style.display = 'none';
                      document.body.appendChild(a);
                      a.click();
                      setTimeout(() => {
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                      }, 100);
                      return;
                    }

                    // Use proxy for remote URLs
                    const proxyUrl = `/api/uploads/proxy-download?url=${encodeURIComponent(previewImage.src)}&filename=${encodeURIComponent(filename)}`;
                    const response = await fetch(proxyUrl);
                    if (!response.ok) throw new Error('Proxy failed');
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    a.style.display = 'none';
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(() => {
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(url);
                    }, 100);
                  } catch (error) {
                    console.error('Download failed:', error);
                    // Last resort: open image in new tab for manual save
                    window.open(previewImage.src, '_blank');
                  }
                }}
                className="bg-white/90 hover:bg-white text-gray-800 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg"
                title="Download image"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download
              </button>
              <button
                onClick={() => setPreviewImage(null)}
                className="bg-white/90 hover:bg-white text-gray-800 p-2 rounded-lg shadow-lg"
                title="Close preview"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <p className="text-center text-white/70 text-sm mt-3">
              Click outside or press close to exit preview
            </p>
          </div>
        </div>
      )}

      {/* Link Confirmation Dialog — file downloads get Download button, external links get Open */}
      {pendingLink && (() => {
        const isFileDownload = pendingLink.url.includes('/api/agents/files/download') || pendingLink.url.includes('/api/uploads/') || /files\/download\?/i.test(pendingLink.url);
        const filename = isFileDownload
          ? new URLSearchParams(pendingLink.url.split('?')[1] || '').get('path')?.split('/').pop() || 'file'
          : '';
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-2xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {isFileDownload ? '📥 Download File?' : '🔗 Open External Link?'}
              </h3>
              <div className="bg-gray-50 rounded-lg p-3 mb-4 border border-gray-200 break-all">
                <p className="text-sm font-mono text-gray-600">
                  {isFileDownload ? filename : pendingLink.url}
                </p>
              </div>
              <p className="text-gray-600 text-sm mb-6">
                {isFileDownload
                  ? `Download ${filename} to your device?`
                  : 'This will open in a new tab. Are you sure you want to continue?'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setPendingLink(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                {isFileDownload ? (
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch(pendingLink.url);
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = filename;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      } catch (err) {
                        console.error('Download failed:', err);
                      }
                      setPendingLink(null);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                  >
                    📥 Download File
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (pendingLink.url) {
                        window.open(pendingLink.url, '_blank', 'noopener,noreferrer');
                      }
                      setPendingLink(null);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                  >
                    Open Link
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Voice Chat Upgrade Modal */}
      {showVoiceUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 border border-gray-700 shadow-2xl">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <PhoneIcon className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                🎤 Real-time Voice Chat
              </h2>
              <p className="text-gray-300 mb-6">
                Experience natural conversations with AI - just like a phone
                call! Speak naturally and get instant voice responses.
              </p>

              <div className="bg-gray-800/50 rounded-xl p-4 mb-6 text-left">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <SparklesIcon className="w-5 h-5 text-yellow-400" />
                  Premium Features Include:
                </h3>
                <ul className="text-gray-300 text-sm space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> Real-time
                    speech-to-speech
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> Natural voice
                    conversations
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> Interrupt anytime
                    (barge-in)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> Unique voices per
                    agent
                  </li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowVoiceUpgradeModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-700 transition-all"
                >
                  Maybe Later
                </button>
                <a
                  href="https://mumtaz.ai/pricing"
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-600 hover:to-pink-600 transition-all text-center"
                >
                  View Plans 🚀
                </a>
              </div>
            </div>

            <button
              onClick={() => setShowVoiceUpgradeModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              title="Close"
              aria-label="Close modal"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Realtime Voice Chat (True Speech-to-Speech) */}
      <RealtimeVoiceChat
        isOpen={isVoiceChatOpen}
        onClose={() => setIsVoiceChatOpen(false)}
        agentName={agent.name}
        agentId={agent.id}
        agentIcon={agent.icon}
        systemPrompt={
          agent.systemPrompt || `You are ${agent.name}, a helpful AI assistant.`
        }
      />
    </EnhancedChatLayout>
    </>
  );
}
