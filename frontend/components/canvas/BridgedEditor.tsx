/**
 * ============================================================================
 * BRIDGED EDITOR COMPONENT
 * ============================================================================
 * 
 * Monaco Editor integrated with EditorBridge for AI-powered editing.
 * Features:
 * - Multi-file tab support
 * - File tree sidebar
 * - Cursor/selection tracking
 * - AI tool integration
 * - Undo/redo support
 */

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  XMarkIcon,
  FolderIcon,
  DocumentIcon,
  PlusIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  TrashIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import type { ProjectTree } from '../../lib/canvas/VirtualFileSystem';
import { getMonacoLanguage, detectFileType } from '../../lib/canvas/VirtualFileSystem';
import type { UseEditorBridgeReturn, FileInfo } from '../../lib/canvas/useEditorBridge';

// Lazy load Monaco Editor
const MonacoEditor = dynamic(
  () =>
    import('@monaco-editor/react').then((mod) => {
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

// File icon mapping
const FILE_ICONS: Record<string, string> = {
  html: '🌐',
  css: '🎨',
  js: '📜',
  ts: '📘',
  tsx: '⚛️',
  jsx: '⚛️',
  json: '📋',
  md: '📝',
  svg: '🎯',
  image: '🖼️',
  other: '📄',
};

interface BridgedEditorProps {
  bridge: UseEditorBridgeReturn;
  onEditorReady?: () => void;
  readOnly?: boolean;
  height?: string;
  showTabs?: boolean;
  showTree?: boolean;
  theme?: 'vs-dark' | 'light';
}

export function BridgedEditor({
  bridge,
  onEditorReady,
  readOnly = false,
  height = '100%',
  showTabs = true,
  showTree = true,
  theme = 'vs-dark',
}: BridgedEditorProps) {
  const editorRef = useRef<any>(null);
  const [treeWidth, setTreeWidth] = useState(200);
  const [isResizing, setIsResizing] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const {
    projectTree,
    openFiles,
    activeFile,
    setEditorInstance,
    openFile,
    closeFile,
    setActiveFile,
    createFile,
    deleteFile,
    renameFile,
    updateFile,
    toggleFolder,
    createFolder,
  } = bridge;

  // Handle editor mount
  const handleEditorDidMount = useCallback((editor: any) => {
    editorRef.current = editor;
    setEditorInstance(editor);
    onEditorReady?.();
  }, [setEditorInstance, onEditorReady]);

  // Handle content change
  const handleEditorChange = useCallback((value: string | undefined) => {
    if (activeFile && value !== undefined) {
      updateFile(activeFile.path, value);
    }
  }, [activeFile, updateFile]);

  // File tree item renderer
  const renderTreeItem = (node: ProjectTree, depth: number = 0) => {
    const isFolder = node.type === 'folder';
    const isExpanded = node.isExpanded;
    const icon = isFolder ? '📁' : FILE_ICONS[node.fileType || 'other'] || '📄';
    const isActive = activeFile?.path === node.path;
    const isRenaming = renamingPath === node.path;

    return (
      <div key={node.path}>
        <div
          className={`
            flex items-center gap-1 px-2 py-1 cursor-pointer text-sm
            hover:bg-slate-100 transition-colors
            ${isActive ? 'bg-cyan-500/20 text-cyan-300' : 'text-gray-300'}
          `}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => {
            if (isFolder) {
              toggleFolder(node.path);
            } else {
              openFile(node.path);
            }
          }}
        >
          {isFolder && (
            <span className="w-4 h-4 flex items-center justify-center text-gray-500">
              {isExpanded ? (
                <ChevronDownIcon className="w-3 h-3" />
              ) : (
                <ChevronRightIcon className="w-3 h-3" />
              )}
            </span>
          )}
          {!isFolder && <span className="w-4" />}
          <span className="text-xs">{icon}</span>
          
          {isRenaming ? (
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={() => {
                if (renameValue && renameValue !== node.name) {
                  const parentPath = node.path.split('/').slice(0, -1).join('/') || '/';
                  const newPath = `${parentPath}/${renameValue}`;
                  renameFile(node.path, newPath);
                }
                setRenamingPath(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                } else if (e.key === 'Escape') {
                  setRenamingPath(null);
                }
              }}
              className="flex-1 bg-transparent border border-cyan-500 rounded px-1 text-xs outline-none"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="flex-1 truncate">{node.name}</span>
          )}
          
          {/* Context actions on hover */}
          {!isRenaming && node.path !== '/' && (
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setRenameValue(node.name);
                  setRenamingPath(node.path);
                }}
                className="p-0.5 hover:bg-slate-200 rounded"
              >
                <PencilIcon className="w-3 h-3 text-gray-400" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete ${node.name}?`)) {
                    deleteFile(node.path);
                  }
                }}
                className="p-0.5 hover:bg-red-500/20 rounded"
              >
                <TrashIcon className="w-3 h-3 text-red-400" />
              </button>
            </div>
          )}
        </div>
        
        {isFolder && isExpanded && node.children?.map((child) => 
          renderTreeItem(child, depth + 1)
        )}
      </div>
    );
  };

  // Handle new file creation
  const handleCreateFile = () => {
    if (newFileName.trim()) {
      const path = newFileName.startsWith('/') ? newFileName : `/${newFileName}`;
      createFile(path, '');
      openFile(path);
      setNewFileName('');
      setIsCreatingFile(false);
    }
  };

  return (
    <div className="flex h-full bg-[#0a0a0f]" style={{ height }}>
      {/* File Tree Sidebar */}
      {showTree && (
        <>
          <div
            className="h-full overflow-hidden flex flex-col border-r border-slate-300"
            style={{ width: treeWidth }}
          >
            {/* Tree Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-300">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Files
              </span>
              <button
                onClick={() => setIsCreatingFile(true)}
                className="p-1 hover:bg-slate-200 rounded transition-colors"
                title="New File"
              >
                <PlusIcon className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            
            {/* New File Input */}
            {isCreatingFile && (
              <div className="px-2 py-2 border-b border-slate-300">
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder="filename.html"
                    className="flex-1 bg-slate-100 border border-cyan-500 rounded px-2 py-1 text-xs text-slate-900 outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateFile();
                      if (e.key === 'Escape') {
                        setIsCreatingFile(false);
                        setNewFileName('');
                      }
                    }}
                    autoFocus
                  />
                  <button
                    onClick={handleCreateFile}
                    className="p-1 bg-cyan-500/20 hover:bg-cyan-500/30 rounded"
                  >
                    <PlusIcon className="w-4 h-4 text-cyan-400" />
                  </button>
                </div>
              </div>
            )}
            
            {/* Tree Content */}
            <div className="flex-1 overflow-y-auto py-1">
              {projectTree.children && projectTree.children.length > 0 ? (
                projectTree.children.map((child) => renderTreeItem(child))
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500 text-xs">
                  <FolderIcon className="w-8 h-8 mb-2 opacity-30" />
                  <p>No files yet</p>
                  <button
                    onClick={() => setIsCreatingFile(true)}
                    className="mt-2 text-cyan-400 hover:underline"
                  >
                    Create a file
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Resizer */}
          <div
            className="w-1 cursor-col-resize hover:bg-cyan-500/50 transition-colors"
            onMouseDown={() => setIsResizing(true)}
          />
        </>
      )}
      
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tabs */}
        {showTabs && openFiles.length > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 border-b border-slate-300 bg-[#0d0d12] overflow-x-auto">
            {openFiles.map((file) => (
              <div
                key={file.path}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-t text-xs cursor-pointer
                  border border-b-0 transition-colors group
                  ${activeFile?.path === file.path
                    ? 'bg-slate-100[#1e1e2e] border-slate-300 text-slate-900'
                    : 'bg-transparent border-transparent text-gray-400 hover:text-gray-200'
                  }
                `}
                onClick={() => setActiveFile(file.path)}
              >
                <span>{FILE_ICONS[file.type] || '📄'}</span>
                <span className="max-w-[120px] truncate">{file.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeFile(file.path);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-200 rounded"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          {activeFile ? (
            <MonacoEditor
              height="100%"
              language={getMonacoLanguage(detectFileType(activeFile.name))}
              theme={theme}
              value={activeFile.content}
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              options={{
                readOnly,
                minimap: { enabled: false },
                lineNumbers: 'on',
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                fontSize: 13,
                padding: { top: 12, bottom: 12 },
                automaticLayout: true,
                tabSize: 2,
                insertSpaces: true,
                formatOnPaste: true,
                formatOnType: true,
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <DocumentIcon className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">No file open</p>
              <p className="text-xs text-gray-600 mt-1">
                Select a file from the tree or create a new one
              </p>
            </div>
          )}
        </div>
        
        {/* Status Bar */}
        <div className="flex items-center justify-between px-3 py-1 bg-[#0d0d12] border-t border-slate-300 text-xs text-gray-500">
          <div className="flex items-center gap-4">
            {activeFile && (
              <>
                <span>{activeFile.path}</span>
                <span>•</span>
                <span>{activeFile.lineCount} lines</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            {activeFile && (
              <span className="uppercase">{activeFile.type}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BridgedEditor;
