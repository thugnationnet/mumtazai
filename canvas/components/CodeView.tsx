
import React, { useEffect, useRef, useCallback } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import { css } from '@codemirror/lang-css';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { php } from '@codemirror/lang-php';
import { go } from '@codemirror/lang-go';
import { rust } from '@codemirror/lang-rust';
import { cpp } from '@codemirror/lang-cpp';
import { sql } from '@codemirror/lang-sql';
import { markdown } from '@codemirror/lang-markdown';
import { StreamLanguage } from '@codemirror/language';
import { shell } from '@codemirror/legacy-modes/mode/shell';
import { swift } from '@codemirror/legacy-modes/mode/swift';
import { ruby } from '@codemirror/legacy-modes/mode/ruby';
import { csharp, kotlin } from '@codemirror/legacy-modes/mode/clike';

interface CodeViewProps {
  code: string;
  files?: Map<string, string>;
  activeFile?: string;
  fileList?: string[];
  onFileSelect?: (path: string) => void;
  onCodeChange?: (code: string) => void;
}

// ============================================================================
// FILE EXTENSION → DOT COLOR  (tab indicator)
// ============================================================================
const EXT_COLORS: Record<string, string> = {
  // Web
  html: 'bg-orange-500', htm: 'bg-orange-500',
  css: 'bg-blue-500', scss: 'bg-pink-500',
  // JavaScript / TypeScript
  js: 'bg-yellow-500', jsx: 'bg-yellow-400', mjs: 'bg-yellow-500',
  ts: 'bg-blue-400', tsx: 'bg-blue-300',
  json: 'bg-green-500',
  // Python
  py: 'bg-emerald-500',
  // Java / Kotlin
  java: 'bg-red-500', kt: 'bg-purple-400', kts: 'bg-purple-400',
  // C / C++
  c: 'bg-gray-400', h: 'bg-gray-400',
  cpp: 'bg-rose-500', cc: 'bg-rose-500', cxx: 'bg-rose-500', hpp: 'bg-rose-400',
  // C#
  cs: 'bg-violet-500',
  // Go
  go: 'bg-cyan-400',
  // Rust
  rs: 'bg-orange-600',
  // PHP
  php: 'bg-indigo-400',
  // Ruby
  rb: 'bg-red-400',
  // Swift
  swift: 'bg-orange-400',
  // SQL
  sql: 'bg-amber-400',
  // Shell / Bash
  sh: 'bg-lime-500', bash: 'bg-lime-500', zsh: 'bg-lime-500',
  // Docs
  md: 'bg-gray-400', txt: 'bg-gray-500',
  // Config
  yml: 'bg-pink-400', yaml: 'bg-pink-400', toml: 'bg-gray-400',
  env: 'bg-gray-600',
  // Docker / Makefile
  dockerfile: 'bg-sky-500',
};

// ============================================================================
// FILE EXTENSION → CODEMIRROR 6 LANGUAGE EXTENSION
// 💻 Supports: JS, TS, Python, PHP, Go, Java, C/C++, Bash, SQL + extras
// ============================================================================
const getLangExtension = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  // Handle extensionless files
  const base = filename.split('/').pop()?.toLowerCase() || '';
  if (base === 'makefile' || base === 'dockerfile') return StreamLanguage.define(shell);

  switch (ext) {
    // Web
    case 'html': case 'htm': return html();
    case 'css': case 'scss': return css();
    // JavaScript / TypeScript
    case 'js': case 'jsx': case 'mjs': return javascript({ jsx: true });
    case 'ts': case 'tsx': return javascript({ jsx: true, typescript: true });
    case 'json': return javascript();
    // Python
    case 'py': return python();
    // PHP
    case 'php': return php();
    // Go
    case 'go': return go();
    // Java
    case 'java': return java();
    // C / C++
    case 'c': case 'h': case 'cpp': case 'cc': case 'cxx': case 'hpp': return cpp();
    // C#
    case 'cs': return StreamLanguage.define(csharp);
    // Kotlin
    case 'kt': case 'kts': return StreamLanguage.define(kotlin);
    // Rust
    case 'rs': return rust();
    // SQL
    case 'sql': return sql();
    // Shell / Bash
    case 'sh': case 'bash': case 'zsh': return StreamLanguage.define(shell);
    // Ruby
    case 'rb': return StreamLanguage.define(ruby);
    // Swift
    case 'swift': return StreamLanguage.define(swift);
    // Markdown
    case 'md': case 'mdx': return markdown();
    // Config
    case 'yml': case 'yaml': case 'toml': case 'env': return StreamLanguage.define(shell);
    // Default
    default: return javascript();
  }
};

const CodeView: React.FC<CodeViewProps> = ({ code, files, activeFile, fileList = [], onFileSelect, onCodeChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  const currentFile = activeFile || fileList[0] || 'index.html';
  const currentCode = files?.get(currentFile) ?? code;

  useEffect(() => {
    if (!editorRef.current) return;
    if (viewRef.current) { viewRef.current.destroy(); viewRef.current = null; }

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged && onCodeChange) {
        onCodeChange(update.state.doc.toString());
      }
    });

    const theme = EditorView.theme({
      '&': { height: '100%', fontSize: '13px' },
      '.cm-scroller': { fontFamily: '"JetBrains Mono", "Fira Code", monospace', overflow: 'auto' },
      '.cm-gutters': { background: '#0a0a0a', border: 'none' },
      '.cm-activeLineGutter': { background: '#1a1a2e' },
    });

    const state = EditorState.create({
      doc: currentCode || '',
      extensions: [basicSetup, oneDark, theme, getLangExtension(currentFile), updateListener],
    });

    viewRef.current = new EditorView({ state, parent: editorRef.current });
    return () => { viewRef.current?.destroy(); viewRef.current = null; };
  }, [currentFile]);

  // Update doc content if code changes externally
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== currentCode) {
      view.dispatch({ changes: { from: 0, to: current.length, insert: currentCode || '' } });
    }
  }, [currentCode]);

  if (!code && fileList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 bg-slate-300 dark:bg-black/40 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg m-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-20 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
        <p className="text-sm font-bold text-cyan-500/80 uppercase tracking-widest">Code_Output_Pending</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-slate-50 dark:bg-[#0d0d0d] flex flex-col">
      {/* File tabs */}
      {fileList.length > 1 && (
        <div className="flex items-center gap-0.5 px-2 py-1 bg-black/80 border-b border-slate-200 dark:border-slate-800 overflow-x-auto shrink-0" style={{ scrollbarWidth: 'none' }}>
          {fileList.map((file) => {
            const ext = file.split('.').pop()?.toLowerCase() || '';
            const dotColor = EXT_COLORS[ext] || 'bg-gray-500';
            const isActive = file === currentFile;
            return (
              <button
                key={file}
                onClick={() => onFileSelect?.(file)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono rounded-t whitespace-nowrap transition-all ${
                  isActive ? 'bg-slate-100 dark:bg-[#1e1e2e] text-indigo-600 dark:text-indigo-400 border-t border-x border-indigo-500/30' : 'text-gray-500 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                {file}
              </button>
            );
          })}
        </div>
      )}
      <div ref={editorRef} className="flex-1 min-h-0 overflow-hidden" />
    </div>
  );
};

export default CodeView;
