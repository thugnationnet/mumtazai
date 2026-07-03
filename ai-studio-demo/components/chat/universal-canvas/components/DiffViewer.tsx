/**
 * DiffViewer — Monaco-based diff editor with approve/reject controls.
 * Shows a side-by-side diff of original vs modified content for a given file.
 */
'use client';

import React, { useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { X, Check, RotateCcw, FileText } from 'lucide-react';

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-slate-100 dark:bg-[#1e1e2e] flex items-center justify-center text-zinc-500">
        Loading Diff…
      </div>
    ),
  }
);

interface DiffViewerProps {
  path: string;
  originalContent: string;
  modifiedContent: string;
  description?: string;
  onApply: () => void;
  onReject: () => void;
}

export default function DiffViewer({
  path,
  originalContent,
  modifiedContent,
  description,
  onApply,
  onReject,
}: DiffViewerProps) {
  // Compute basic diff stats
  const originalLines = originalContent.split('\n');
  const modifiedLines = modifiedContent.split('\n');
  const added = modifiedLines.filter((l) => !originalLines.includes(l)).length;
  const removed = originalLines.filter(
    (l) => !modifiedLines.includes(l)
  ).length;

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-[#1e1e2e]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#181825] border-b border-zinc-800">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span className="text-sm text-zinc-300 font-medium truncate">
            {path}
          </span>
          {description && (
            <span className="text-xs text-zinc-500 truncate ml-2">
              — {description}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs">
            <span className="text-green-400">+{added}</span>
            <span className="text-zinc-600 mx-1">/</span>
            <span className="text-red-400">-{removed}</span>
          </span>
          <button
            onClick={onReject}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reject
          </button>
          <button
            onClick={onApply}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-green-600 hover:bg-green-500 text-slate-900 dark:text-white transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Apply
          </button>
          <button
            onClick={onReject}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Close diff"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Monaco Diff Editor */}
      <div className="flex-1">
        <MonacoEditor
          height="100%"
          language={getLanguageFromPath(path)}
          theme="vs-dark"
          value={modifiedContent}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 13,
            lineNumbers: 'on',
            wordWrap: 'on',
          }}
        />
      </div>
    </div>
  );
}

function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescriptreact',
    js: 'javascript',
    jsx: 'javascriptreact',
    json: 'json',
    css: 'css',
    scss: 'scss',
    html: 'html',
    md: 'markdown',
    py: 'python',
    yaml: 'yaml',
    yml: 'yaml',
    toml: 'plaintext',
    prisma: 'plaintext',
    sql: 'sql',
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    env: 'plaintext',
    graphql: 'graphql',
    go: 'go',
    java: 'java',
    php: 'php',
    c: 'c',
    h: 'c',
    cpp: 'cpp',
    cc: 'cpp',
    cxx: 'cpp',
    hpp: 'cpp',
    hxx: 'cpp',
    rb: 'ruby',
    rs: 'rust',
  };
  return map[ext] || 'plaintext';
}
