
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, ChatAttachment, FileOperation } from '../types';
import { speak } from '../services/speechService';

interface ChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, attachments?: ChatAttachment[]) => void;
  isGenerating: boolean;
  streamingText?: string;

  fileOperations?: FileOperation[];
  onNewChat?: () => void;
  onStopGeneration?: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = 'image/*,.pdf,.txt,.md,.csv,.json,.js,.ts,.tsx,.jsx,.html,.css,.py,.java,.rb,.go,.rs,.c,.cpp,.h,.xml,.yaml,.yml,.toml,.sql,.sh';

// Render inline markdown: bold, italic, bold+italic, inline code
const renderInline = (line: string, kp: string): React.ReactNode => {
  const result: React.ReactNode[] = [];
  const regex = /(\*\*\*[^*\n]+?\*\*\*|\*\*[^*\n]+?\*\*|\*[^*\n]+?\*|_[^_\n]+?_|`[^`\n]+?`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let idx = 0;
  while ((match = regex.exec(line)) !== null) {
    if (match.index > last) result.push(<span key={`${kp}t${idx++}`}>{line.slice(last, match.index)}</span>);
    const m = match[0];
    if (m.startsWith('***')) result.push(<strong key={`${kp}bi${idx++}`}><em>{m.slice(3, -3)}</em></strong>);
    else if (m.startsWith('**')) result.push(<strong key={`${kp}b${idx++}`} className="font-semibold text-slate-900 dark:text-white">{m.slice(2, -2)}</strong>);
    else if (m.startsWith('*') || (m.startsWith('_') && m.endsWith('_'))) result.push(<em key={`${kp}e${idx++}`} className="italic text-slate-800 dark:text-slate-200">{m.slice(1, -1)}</em>);
    else if (m.startsWith('`')) result.push(<code key={`${kp}c${idx++}`} className="px-1 py-0.5 bg-slate-400 dark:bg-black/50 rounded text-violet-300 font-mono text-[10px]">{m.slice(1, -1)}</code>);
    last = match.index + m.length;
  }
  if (last < line.length) result.push(<span key={`${kp}tail`}>{line.slice(last)}</span>);
  return <>{result}</>;
};

// Full markdown renderer: headings, lists, code blocks, blockquotes, hr, inline formatting
const renderMarkdown = (text: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  const lines = String(text ?? '').split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) { codeLines.push(lines[i]); i++; }
      parts.push(
        <pre key={parts.length} className="my-2 p-3 bg-slate-400 dark:bg-black/60 rounded-lg border border-slate-800 overflow-x-auto">
          <code className="text-[11px] font-mono text-slate-800 dark:text-slate-200">{codeLines.join('\n')}</code>
        </pre>
      );
      i++; continue;
    }

    // Headings
    const h3 = line.match(/^###\s+(.+)$/);
    const h2 = line.match(/^##\s+(.+)$/);
    const h1 = line.match(/^#\s+(.+)$/);
    if (h3) { parts.push(<div key={parts.length} className="text-xs font-semibold text-slate-900 dark:text-white mt-2 mb-0.5">{renderInline(h3[1], `h3-${parts.length}-`)}</div>); i++; continue; }
    if (h2) { parts.push(<div key={parts.length} className="text-xs font-bold text-slate-900 dark:text-white mt-3 mb-1 border-b border-violet-900/40 pb-0.5">{renderInline(h2[1], `h2-${parts.length}-`)}</div>); i++; continue; }
    if (h1) { parts.push(<div key={parts.length} className="text-sm font-bold text-slate-900 dark:text-white mt-3 mb-1">{renderInline(h1[1], `h1-${parts.length}-`)}</div>); i++; continue; }

    // Horizontal rule
    if (/^(---+|\*\*\*+|___+)$/.test(line.trim())) {
      parts.push(<hr key={parts.length} className="my-2 border-slate-700" />); i++; continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      parts.push(
        <div key={parts.length} className="border-l-2 border-violet-500/50 pl-3 my-1 text-slate-600 dark:text-slate-400 italic">
          {renderInline(line.slice(2), `bq-${parts.length}-`)}
        </div>
      ); i++; continue;
    }

    // Unordered list
    const ul = line.match(/^(\s*)[-*+]\s+(.+)$/);
    if (ul) {
      const depth = Math.floor(ul[1].length / 2);
      parts.push(
        <div key={parts.length} className="flex items-start gap-1.5 my-0.5" style={{ paddingLeft: `${depth * 12 + 4}px` }}>
          <span className="text-violet-400 flex-shrink-0 mt-0.5">•</span>
          <span>{renderInline(ul[2], `ul-${parts.length}-`)}</span>
        </div>
      ); i++; continue;
    }

    // Ordered list
    const ol = line.match(/^(\s*)(\d+)\.\s+(.+)$/);
    if (ol) {
      const depth = Math.floor(ol[1].length / 2);
      parts.push(
        <div key={parts.length} className="flex items-start gap-1.5 my-0.5" style={{ paddingLeft: `${depth * 12 + 4}px` }}>
          <span className="text-violet-400 flex-shrink-0 mt-0.5 min-w-[14px]">{ol[2]}.</span>
          <span>{renderInline(ol[3], `ol-${parts.length}-`)}</span>
        </div>
      ); i++; continue;
    }

    // Empty line → spacer
    if (line.trim() === '') {
      if (parts.length > 0) parts.push(<div key={parts.length} className="h-1.5" />);
      i++; continue;
    }

    // Regular text with inline formatting
    parts.push(<span key={parts.length}>{renderInline(line, `p-${parts.length}-`)}</span>);
    const nextLine = lines[i + 1];
    const nextIsBlock = !nextLine || nextLine.trim() === '' ||
      nextLine.match(/^#{1,3}\s/) || nextLine.match(/^\s*[-*+]\s/) ||
      nextLine.match(/^\s*\d+\.\s/) || nextLine.startsWith('```') ||
      nextLine.startsWith('> ') || /^(---+|\*\*\*+|___+)$/.test(nextLine.trim());
    if (i < lines.length - 1 && !nextIsBlock) parts.push(<br key={`br-${parts.length}`} />);
    i++;
  }

  return parts;
};

const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  onSendMessage,
  isGenerating,
  streamingText,

  fileOperations = [],
  onNewChat,
  onStopGeneration,
}) => {
  const [input, setInput] = useState('');
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const baseInputRef = useRef('');
  const stoppedByUserRef = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingText]);

  // Auto-resize textarea up to 5 lines
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      const lineHeight = 18;
      const maxHeight = lineHeight * 5 + 24; // 5 lines + padding
      ta.style.height = Math.min(ta.scrollHeight, maxHeight) + 'px';
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || attachments.length > 0) && !isGenerating) {
      onSendMessage(input, attachments.length > 0 ? attachments : undefined);
      setInput('');
      setAttachments([]);
    }
  };

  // ── Speech-to-text ──
  const toggleSpeechToText = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    if (isListening && recognitionRef.current) {
      stoppedByUserRef.current = true;
      recognitionRef.current.abort();
      recognitionRef.current = null;
      setIsListening(false);
      return;
    }

    stoppedByUserRef.current = false;
    baseInputRef.current = input;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let fullTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript;
      }
      const base = baseInputRef.current;
      const separator = base && !base.endsWith(' ') ? ' ' : '';
      setInput(base + separator + fullTranscript);
    };

    recognition.onend = () => {
      // Auto-restart unless user clicked stop
      if (!stoppedByUserRef.current && recognitionRef.current) {
        try {
          recognition.start();
        } catch {
          setIsListening(false);
          recognitionRef.current = null;
        }
        return;
      }
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') return; // ignore silence, keep listening
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }, [isListening, input]);

  // ── File upload ──
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        alert(`File "${file.name}" is too large (max 10MB).`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setAttachments((prev) => [
          ...prev,
          { name: file.name, type: file.type, size: file.size, dataUrl },
        ]);
      };

      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        // For text/code files, read as text and wrap in a data URL
        const textReader = new FileReader();
        textReader.onload = () => {
          const text = textReader.result as string;
          const dataUrl = `data:${file.type || 'text/plain'};base64,${btoa(unescape(encodeURIComponent(text)))}`;
          setAttachments((prev) => [
            ...prev,
            { name: file.name, type: file.type || 'text/plain', size: file.size, dataUrl },
          ]);
        };
        textReader.readAsText(file);
      }
    });

    // Reset input so same file can be re-selected
    e.target.value = '';
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSpeak = async (text: string, idx: number) => {
    setSpeakingIdx(idx);
    await speak(text);
    setSpeakingIdx(null);
  };

  const fileOpIcon = (op: string) => {
    switch (op) {
      case 'create': return '📁';
      case 'edit': return '✏️';
      case 'delete': return '🗑️';
      case 'terminal': return '💻';
      case 'dependency': return '📦';
      default: return '🔧';
    }
  };

  const fileOpLabel = (op: string) => {
    switch (op) {
      case 'create': return 'Created';
      case 'edit': return 'Edited';
      case 'delete': return 'Deleted';
      case 'terminal': return 'Ran';
      case 'dependency': return 'Added';
      default: return 'Used';
    }
  };

  const FileOpsDisplay: React.FC<{ ops: FileOperation[] }> = ({ ops }) => (
    <div className="space-y-1 my-2">
      {ops.map((fop, i) => (
        <div
          key={i}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
            fop.status === 'done'
              ? 'bg-violet-500/10 border border-violet-500/20 text-violet-400'
              : 'bg-violet-500/10 border border-violet-500/20 text-violet-400 animate-pulse'
          }`}
        >
          <span>{fileOpIcon(fop.op)}</span>
          <span className={fop.status === 'done' ? '' : 'italic'}>
            {fop.status === 'done' ? fileOpLabel(fop.op) : `${fileOpLabel(fop.op).replace(/d$/, 'ing')}...`}
          </span>
          <span className="text-slate-600 dark:text-slate-400 truncate flex-1 text-right font-mono">{fop.path}</span>
          {fop.status === 'done' && <span className="text-violet-400">✓</span>}
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0a0a0a] w-full overflow-hidden">
      <div className="flex items-center justify-end px-4 py-2 border-b border-violet-900/20 bg-white dark:bg-[#0a0a0a]">
        <div className="flex items-center gap-2">
          {onNewChat && (
            <button
              onClick={onNewChat}
              className="p-1.5 rounded-lg text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 border border-transparent hover:border-violet-500/20 transition-all"
              title="New chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-violet-500/20 text-violet-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">How can I help?</p>
            <p className="text-xs text-slate-500 leading-relaxed">Ask me to add animations, change colors, or add complex functionality to your app.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`group relative max-w-[90%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-gradient-to-r from-violet-500 to-violet-500 text-slate-900 dark:text-white rounded-tr-none shadow-md shadow-cyan-500/20' 
                : 'bg-white dark:bg-[#111] text-slate-700 dark:text-slate-300 rounded-tl-none border border-violet-900/30'
            }`}>
              {/* Attachment thumbnails */}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {msg.attachments.map((att, ai) => (
                    att.type.startsWith('image/') ? (
                      <img key={ai} src={att.dataUrl} alt={att.name} className="w-16 h-16 rounded-lg object-cover border border-white/20" />
                    ) : (
                      <div key={ai} className="flex items-center gap-1 px-2 py-1 bg-slate-200 dark:bg-black/20 rounded-lg text-[9px]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <span className="truncate max-w-[60px]">{att.name}</span>
                      </div>
                    )
                  ))}
                </div>
              )}
              {msg.role === 'model' ? renderMarkdown(msg.text) : msg.text}
              
              {/* File operation notifications for this message */}
              {msg.fileOps && msg.fileOps.length > 0 && (
                <FileOpsDisplay ops={msg.fileOps} />
              )}
              
              {msg.role === 'model' && (
                <button 
                  onClick={() => handleSpeak(msg.text, i)}
                  className={`absolute -right-8 top-1 p-1 text-slate-500 hover:text-violet-400 transition-opacity ${speakingIdx === i ? 'opacity-100 animate-pulse' : 'opacity-0 group-hover:opacity-100'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                </button>
              )}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 px-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        ))}



        {/* Live file operations during generation */}
        {isGenerating && fileOperations.length > 0 && (
          <div className="flex flex-col items-start">
            <div className="max-w-[90%]">
              <FileOpsDisplay ops={fileOperations} />
            </div>
          </div>
        )}

        {/* Streaming text */}
        {isGenerating && streamingText && (
          <div className="flex flex-col items-start">
            <div className="max-w-[90%] px-4 py-3 rounded-2xl text-xs leading-relaxed bg-white dark:bg-[#111] text-slate-700 dark:text-slate-300 rounded-tl-none border border-violet-900/30">
              {renderMarkdown(streamingText)}
              <span className="inline-block w-1.5 h-3.5 bg-violet-400 ml-0.5 animate-pulse" />
            </div>
          </div>
        )}
        {isGenerating && !streamingText && (
          <div className="flex items-center gap-2 text-violet-400 text-[10px] px-2 font-bold uppercase tracking-widest italic animate-pulse">
            <span className="flex gap-1">
              <span className="w-1 h-1 bg-violet-400 rounded-full"></span>
              <span className="w-1 h-1 bg-violet-400 rounded-full animate-bounce"></span>
              <span className="w-1 h-1 bg-violet-400 rounded-full animate-bounce delay-150"></span>
            </span>
            Processing...
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="px-3 pt-2 pb-2 border-t border-violet-900/30 bg-white dark:bg-[#0a0a0a]">
        {/* Attachment previews */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {attachments.map((att, i) => (
              <div key={i} className="relative group flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-[#111] border border-violet-900/30 rounded-lg text-[10px] text-slate-600 dark:text-slate-400">
                {att.type.startsWith('image/') ? (
                  <img src={att.dataUrl} alt={att.name} className="w-6 h-6 rounded object-cover" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                )}
                <span className="truncate max-w-[80px]">{att.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(i)}
                  className="ml-0.5 text-slate-600 hover:text-red-400 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons row */}
        <div className="flex items-center gap-1 mb-1.5 px-1">
          {/* Speech-to-text */}
          <button
            type="button"
            onClick={toggleSpeechToText}
            disabled={isGenerating}
            className={`p-1.5 rounded-lg transition-all ${
              isListening
                ? 'text-red-400 bg-red-500/10 border border-red-500/30 animate-pulse'
                : 'text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 border border-transparent hover:border-violet-500/20'
            } disabled:opacity-30`}
            title={isListening ? 'Stop listening' : 'Speech to text'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>

          {/* File upload */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isGenerating}
            className="p-1.5 rounded-lg text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 border border-transparent hover:border-violet-500/20 transition-all disabled:opacity-30"
            title="Upload files or images"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_TYPES}
            onChange={handleFileSelect}
            className="hidden"
          />

          {isListening && (
            <span className="text-[9px] text-red-400 uppercase tracking-widest font-bold animate-pulse">● Listening...</span>
          )}
        </div>

        <div className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            rows={1}
            disabled={isGenerating}
            placeholder="Describe changes..."
            className="w-full pl-4 pr-12 py-3 text-xs bg-white dark:bg-[#111] border border-violet-900/30 rounded-2xl focus:ring-2 focus:ring-violet-500 outline-none transition-all placeholder:text-slate-600 text-slate-700 dark:text-slate-300 resize-none overflow-y-auto leading-[18px]"
            style={{ maxHeight: '114px' }}
          />
          {isGenerating && onStopGeneration ? (
            <button
              type="button"
              onClick={onStopGeneration}
              className="absolute right-2 bottom-2 p-2 bg-red-500 hover:bg-red-600 text-slate-900 dark:text-white rounded-xl transition-colors shadow-sm active:scale-95"
              title="Stop generation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          ) : (
            <button type="submit" disabled={(!input.trim() && attachments.length === 0) || isGenerating} className="absolute right-2 bottom-2 p-2 bg-gradient-to-r from-violet-500 to-violet-500 text-slate-900 dark:text-white rounded-xl disabled:opacity-50 transition-colors shadow-sm active:scale-95">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ChatBox;
