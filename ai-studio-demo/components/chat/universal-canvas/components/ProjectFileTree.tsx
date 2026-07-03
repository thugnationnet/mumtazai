/**
 * ProjectFileTree
 * 
 * Interactive file tree for multi-file canvas projects.
 * Supports folders, file icons by language, CRUD operations,
 * drag-and-drop (future), and context menus.
 */
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  FolderIcon,
  FolderOpenIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  DocumentPlusIcon,
  FolderPlusIcon,
} from '@heroicons/react/24/outline';
import type { ProjectFile, ProjectFolder, FileLanguage } from '../types/canvas-types';
import { buildFileTree, FILE_ICONS, getFileLanguage } from '../types/canvas-types';

// =============================================================================
// TYPES
// =============================================================================

interface ProjectFileTreeProps {
  files: ProjectFile[];
  activeFileId?: string;
  onFileSelect: (file: ProjectFile) => void;
  onFileCreate?: (path: string, language: FileLanguage) => void;
  onFileRename?: (fileId: string, newName: string) => void;
  onFileDelete?: (fileId: string) => void;
  onFolderCreate?: (path: string) => void;
  onFolderDelete?: (path: string) => void;
  isReadOnly?: boolean;
  className?: string;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  target: { type: 'file' | 'folder' | 'root'; item?: ProjectFile | ProjectFolder };
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function ProjectFileTree({
  files,
  activeFileId,
  onFileSelect,
  onFileCreate,
  onFileRename,
  onFileDelete,
  onFolderCreate,
  onFolderDelete,
  isReadOnly = false,
  className = '',
}: ProjectFileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/']));
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    target: { type: 'root' },
  });
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [creating, setCreating] = useState<{
    parentPath: string;
    type: 'file' | 'folder';
  } | null>(null);
  const [createValue, setCreateValue] = useState('');
  const treeRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const createInputRef = useRef<HTMLInputElement>(null);

  // Build hierarchical tree from flat files
  const tree = buildFileTree(files);

  // Auto-focus inputs
  useEffect(() => {
    if (renaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renaming]);

  useEffect(() => {
    if (creating && createInputRef.current) {
      createInputRef.current.focus();
    }
  }, [creating]);

  // Close context menu on click outside
  useEffect(() => {
    if (!contextMenu.visible) return;
    const handleClick = () => setContextMenu(prev => ({ ...prev, visible: false }));
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [contextMenu.visible]);

  // Toggle folder expansion
  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  // Context menu handler
  const handleContextMenu = useCallback(
    (e: React.MouseEvent, type: 'file' | 'folder' | 'root', item?: ProjectFile | ProjectFolder) => {
      if (isReadOnly) return;
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        target: { type, item },
      });
    },
    [isReadOnly]
  );

  // Start rename
  const startRename = useCallback((fileId: string, currentName: string) => {
    setRenaming(fileId);
    setRenameValue(currentName);
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  // Confirm rename
  const confirmRename = useCallback(() => {
    if (renaming && renameValue.trim() && onFileRename) {
      onFileRename(renaming, renameValue.trim());
    }
    setRenaming(null);
    setRenameValue('');
  }, [renaming, renameValue, onFileRename]);

  // Start creating file/folder
  const startCreate = useCallback((parentPath: string, type: 'file' | 'folder') => {
    setCreating({ parentPath, type });
    setCreateValue('');
    setContextMenu(prev => ({ ...prev, visible: false }));
    // Expand parent folder
    setExpandedFolders(prev => new Set([...prev, parentPath]));
  }, []);

  // Confirm create
  const confirmCreate = useCallback(() => {
    if (!creating || !createValue.trim()) {
      setCreating(null);
      return;
    }

    const newPath = `${creating.parentPath === '/' ? '' : creating.parentPath}/${createValue.trim()}`;

    if (creating.type === 'file' && onFileCreate) {
      const lang = getFileLanguage(createValue.trim());
      onFileCreate(newPath, lang);
    } else if (creating.type === 'folder' && onFolderCreate) {
      onFolderCreate(newPath);
    }

    setCreating(null);
    setCreateValue('');
  }, [creating, createValue, onFileCreate, onFolderCreate]);

  // Delete handler
  const handleDelete = useCallback(
    (type: 'file' | 'folder', item: ProjectFile | ProjectFolder) => {
      setContextMenu(prev => ({ ...prev, visible: false }));
      if (type === 'file' && onFileDelete && 'id' in item) {
        onFileDelete(item.id);
      } else if (type === 'folder' && onFolderDelete) {
        onFolderDelete(item.path);
      }
    },
    [onFileDelete, onFolderDelete]
  );

  // ==========================================================================
  // RENDERERS
  // ==========================================================================

  const renderFile = (file: ProjectFile, depth: number) => {
    const isActive = file.id === activeFileId;
    const isRenaming = renaming === file.id;
    const icon = FILE_ICONS[file.language] || '📄';

    return (
      <div
        key={file.id}
        className={`group flex items-center gap-1.5 px-2 py-1 cursor-pointer text-xs transition-colors rounded-sm ${
          isActive
            ? 'bg-cyan-500/20 text-cyan-300 border-l-2 border-cyan-400'
            : 'text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-gray-200 border-l-2 border-transparent'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => !isRenaming && onFileSelect(file)}
        onContextMenu={(e) => handleContextMenu(e, 'file', file)}
        title={file.path}
      >
        <span className="text-[11px] flex-shrink-0">{icon}</span>

        {isRenaming ? (
          <input
            ref={renameInputRef}
            className="flex-1 bg-slate-200 dark:bg-white/10 border border-cyan-500/50 rounded px-1 py-0.5 text-xs text-slate-900 dark:text-white outline-none"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirmRename();
              if (e.key === 'Escape') {
                setRenaming(null);
                setRenameValue('');
              }
            }}
            onBlur={confirmRename}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <>
            <span className="flex-1 truncate">{file.name}</span>
            {file.isModified && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" title="Unsaved changes" />
            )}
          </>
        )}
      </div>
    );
  };

  const renderFolder = (folder: ProjectFolder, depth: number) => {
    const isExpanded = expandedFolders.has(folder.path);

    return (
      <div key={folder.path}>
        <div
          className="group flex items-center gap-1.5 px-2 py-1 cursor-pointer text-xs text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-gray-100 transition-colors rounded-sm"
          style={{ paddingLeft: `${depth * 16 + 4}px` }}
          onClick={() => toggleFolder(folder.path)}
          onContextMenu={(e) => handleContextMenu(e, 'folder', folder)}
        >
          {isExpanded ? (
            <ChevronDownIcon className="w-3 h-3 flex-shrink-0 text-gray-500" />
          ) : (
            <ChevronRightIcon className="w-3 h-3 flex-shrink-0 text-gray-500" />
          )}
          {isExpanded ? (
            <FolderOpenIcon className="w-3.5 h-3.5 flex-shrink-0 text-yellow-400/70" />
          ) : (
            <FolderIcon className="w-3.5 h-3.5 flex-shrink-0 text-yellow-400/60" />
          )}
          <span className="flex-1 truncate font-medium">{folder.name}</span>
          <span className="text-[10px] text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
            {folder.children.length}
          </span>
        </div>

        {isExpanded && (
          <div>
            {/* Show create input inside this folder if creating here */}
            {creating && creating.parentPath === folder.path && (
              <div
                className="flex items-center gap-1.5 px-2 py-1"
                style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
              >
                <span className="text-[11px]">{creating.type === 'file' ? '📄' : '📁'}</span>
                <input
                  ref={createInputRef}
                  className="flex-1 bg-slate-200 dark:bg-white/10 border border-cyan-500/50 rounded px-1.5 py-0.5 text-xs text-slate-900 dark:text-white outline-none placeholder-gray-500"
                  value={createValue}
                  placeholder={creating.type === 'file' ? 'filename.ext' : 'folder-name'}
                  onChange={(e) => setCreateValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmCreate();
                    if (e.key === 'Escape') setCreating(null);
                  }}
                  onBlur={confirmCreate}
                />
              </div>
            )}
            {folder.children.map((child) =>
              'children' in child
                ? renderFolder(child, depth + 1)
                : renderFile(child as ProjectFile, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  const renderTreeItem = (item: ProjectFile | ProjectFolder, depth: number) => {
    if ('children' in item) {
      return renderFolder(item, depth);
    }
    return renderFile(item as ProjectFile, depth);
  };

  // ==========================================================================
  // MAIN RENDER
  // ==========================================================================

  return (
    <div
      ref={treeRef}
      className={`flex flex-col h-full bg-[#0a0a12] ${className}`}
      onContextMenu={(e) => handleContextMenu(e, 'root')}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-white/5">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Files
        </span>
        {!isReadOnly && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => startCreate('/', 'file')}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-gray-400 hover:text-cyan-400 transition-colors"
              title="New file"
            >
              <DocumentPlusIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => startCreate('/', 'folder')}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-gray-400 hover:text-cyan-400 transition-colors"
              title="New folder"
            >
              <FolderPlusIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-white/10">
        {/* Root-level create input */}
        {creating && creating.parentPath === '/' && (
          <div className="flex items-center gap-1.5 px-2 py-1" style={{ paddingLeft: '8px' }}>
            <span className="text-[11px]">{creating.type === 'file' ? '📄' : '📁'}</span>
            <input
              ref={createInputRef}
              className="flex-1 bg-slate-200 dark:bg-white/10 border border-cyan-500/50 rounded px-1.5 py-0.5 text-xs text-slate-900 dark:text-white outline-none placeholder-gray-500"
              value={createValue}
              placeholder={creating.type === 'file' ? 'filename.ext' : 'folder-name'}
              onChange={(e) => setCreateValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmCreate();
                if (e.key === 'Escape') setCreating(null);
              }}
              onBlur={confirmCreate}
            />
          </div>
        )}

        {tree.length > 0 ? (
          tree.map((item) => renderTreeItem(item, 0))
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <FolderIcon className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-xs">No files yet</p>
            {!isReadOnly && (
              <button
                onClick={() => startCreate('/', 'file')}
                className="mt-2 text-xs text-cyan-500 hover:text-cyan-400 transition-colors"
              >
                Create a file
              </button>
            )}
          </div>
        )}
      </div>

      {/* File count footer */}
      <div className="px-3 py-1.5 border-t border-slate-200 dark:border-white/5 text-[10px] text-gray-600">
        {files.length} file{files.length !== 1 ? 's' : ''}
        {files.filter(f => f.isModified).length > 0 && (
          <span className="text-amber-500 ml-2">
            • {files.filter(f => f.isModified).length} modified
          </span>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          className="fixed z-[9999] min-w-[160px] bg-slate-50 dark:bg-[#1a1a2e] border border-slate-300 dark:border-white/10 rounded-lg shadow-2xl py-1 backdrop-blur-xl"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* New File */}
          <button
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-300 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors"
            onClick={() => {
              const parentPath =
                contextMenu.target.type === 'folder'
                  ? contextMenu.target.item!.path
                  : contextMenu.target.type === 'file'
                  ? contextMenu.target.item!.path.substring(
                      0,
                      contextMenu.target.item!.path.lastIndexOf('/')
                    ) || '/'
                  : '/';
              startCreate(parentPath, 'file');
            }}
          >
            <DocumentPlusIcon className="w-3.5 h-3.5 text-cyan-400" />
            New File
          </button>

          {/* New Folder */}
          <button
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-300 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors"
            onClick={() => {
              const parentPath =
                contextMenu.target.type === 'folder'
                  ? contextMenu.target.item!.path
                  : contextMenu.target.type === 'file'
                  ? contextMenu.target.item!.path.substring(
                      0,
                      contextMenu.target.item!.path.lastIndexOf('/')
                    ) || '/'
                  : '/';
              startCreate(parentPath, 'folder');
            }}
          >
            <FolderPlusIcon className="w-3.5 h-3.5 text-yellow-400" />
            New Folder
          </button>

          {/* Divider */}
          {contextMenu.target.type !== 'root' && (
            <>
              <div className="my-1 border-t border-slate-200 dark:border-white/5" />

              {/* Rename (file only) */}
              {contextMenu.target.type === 'file' && (
                <button
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-300 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors"
                  onClick={() => {
                    const file = contextMenu.target.item as ProjectFile;
                    startRename(file.id, file.name);
                  }}
                >
                  <PencilIcon className="w-3.5 h-3.5 text-blue-400" />
                  Rename
                </button>
              )}

              {/* Delete */}
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                onClick={() => {
                  if (contextMenu.target.item) {
                    handleDelete(
                      contextMenu.target.type as 'file' | 'folder',
                      contextMenu.target.item
                    );
                  }
                }}
              >
                <TrashIcon className="w-3.5 h-3.5" />
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
