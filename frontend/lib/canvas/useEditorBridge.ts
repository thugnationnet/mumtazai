/**
 * ============================================================================
 * USE EDITOR BRIDGE HOOK
 * ============================================================================
 * 
 * React hook for integrating the EditorBridge with components.
 * Provides reactive state, file operations, and Monaco integration.
 */

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  VirtualFileSystem,
  VirtualFile,
  ProjectTree,
  getMonacoLanguage,
} from './VirtualFileSystem';
import {
  EditorBridge,
  createEditorBridge,
  CursorPosition,
  SelectionRange,
  FileInfo,
  MonacoEditorInstance,
} from './EditorBridge';

export interface UseEditorBridgeOptions {
  projectName?: string;
  initialFiles?: Array<{ path: string; content: string }>;
  onFileChange?: (path: string, content: string) => void;
  onActiveFileChange?: (file: FileInfo | null) => void;
}

export interface UseEditorBridgeReturn {
  // Bridge instance
  bridge: EditorBridge;
  fileSystem: VirtualFileSystem;
  
  // State
  projectTree: ProjectTree;
  openFiles: FileInfo[];
  activeFile: FileInfo | null;
  cursor: CursorPosition | null;
  selection: { range: SelectionRange; text: string } | null;
  isDirty: boolean;
  
  // File operations
  getFile: (path: string) => FileInfo | null;
  updateFile: (path: string, content: string) => boolean;
  createFile: (path: string, content?: string) => FileInfo | null;
  deleteFile: (path: string) => boolean;
  renameFile: (oldPath: string, newPath: string) => boolean;
  moveFile: (fromPath: string, toPath: string) => boolean;
  copyFile: (fromPath: string, toPath: string) => FileInfo | null;
  
  // Editor operations
  insertAt: (cursor: CursorPosition, text: string) => boolean;
  replaceSelection: (text: string) => boolean;
  replaceRange: (range: SelectionRange, text: string) => boolean;
  goToLine: (line: number) => void;
  
  // Tab operations
  openFile: (path: string) => void;
  closeFile: (path: string) => void;
  setActiveFile: (path: string) => void;
  
  // Folder operations
  createFolder: (path: string) => void;
  toggleFolder: (path: string) => void;
  deleteFolder: (path: string) => boolean;
  listFolders: (path?: string) => Array<{ path: string; name: string }>;
  listFiles: (path?: string) => FileInfo[];
  
  // Undo/Redo
  undo: () => boolean;
  redo: () => boolean;
  canUndo: boolean;
  canRedo: boolean;
  
  // Monaco integration
  setEditorInstance: (editor: MonacoEditorInstance) => void;
  getEditorContent: () => string;
  setEditorContent: (content: string) => void;
  
  // Project operations
  setProjectName: (name: string) => void;
  exportProject: () => string;
  importProject: (json: string) => boolean;
  clearProject: () => void;
  
  // Search
  search: (query: string) => Array<{
    path: string;
    line: number;
    column: number;
    match: string;
    context: string;
  }>;
  
  // Metadata
  getFileMetadata: (path: string) => {
    path: string;
    name: string;
    type: string;
    size: number;
    mimeType: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  getFileSize: (path: string) => number | null;
  getFileType: (path: string) => string | null;
  getMimeType: (path: string) => string | null;
  
  // User interaction
  askUser: (question: string, options?: { type?: 'confirm' | 'prompt'; defaultValue?: string }) => Promise<string | boolean | null>;
  sendMessage: (text: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  showProgress: (percent: number, message?: string) => void;
  requestApproval: (action: string, details?: string) => Promise<boolean>;
  checkPermission: (action: string, path?: string) => { allowed: boolean; reason?: string };
  setUserCallbacks: (callbacks: {
    askUser?: (question: string, options?: { type?: 'confirm' | 'prompt'; defaultValue?: string }) => Promise<string | boolean | null>;
    sendMessage?: (text: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
    showProgress?: (percent: number, message?: string) => void;
    requestApproval?: (action: string, details?: string) => Promise<boolean>;
  }) => void;
  
  // Download/Upload
  generateDownloadLink: (path: string) => { url: string; filename: string } | null;
  downloadFile: (path: string) => boolean;
  uploadFile: (filename: string, content: string, targetPath?: string) => FileInfo | null;
  downloadProject: () => boolean;
  
  // Image operations
  readImage: (path: string) => { dataUrl: string; width?: number; height?: number } | null;
  resizeImage: (path: string, width: number, height: number) => Promise<{ dataUrl: string; width: number; height: number } | null>;
  convertImage: (path: string, format: 'png' | 'jpeg' | 'webp') => Promise<{ dataUrl: string; format: string } | null>;
  compressImage: (path: string, quality?: number) => Promise<{ dataUrl: string; quality: number } | null>;
  
  // Zip operations
  createZip: (folderPath?: string) => string;
  extractZip: (bundleJson: string, targetFolder?: string) => { success: boolean; filesCreated: number };
  
  // Utility
  refresh: () => void;
}

export function useEditorBridge(
  options: UseEditorBridgeOptions = {}
): UseEditorBridgeReturn {
  const {
    projectName = 'Untitled Project',
    initialFiles = [],
    onFileChange,
    onActiveFileChange,
  } = options;

  // Refs for stable instances
  const fileSystemRef = useRef<VirtualFileSystem | null>(null);
  const bridgeRef = useRef<EditorBridge | null>(null);
  const editorRef = useRef<MonacoEditorInstance | null>(null);
  const isInitialized = useRef(false);

  // Lazy initialization - only initialize on client side
  const initializeIfNeeded = useCallback(() => {
    if (typeof window === 'undefined') return; // Don't initialize on server
    
    if (!isInitialized.current) {
      isInitialized.current = true;
      fileSystemRef.current = new VirtualFileSystem(projectName);
      bridgeRef.current = createEditorBridge(fileSystemRef.current);
      
      // Create initial files
      for (const file of initialFiles) {
        fileSystemRef.current.createFile(file.path, file.content);
      }
    }
  }, [projectName, initialFiles]);

  // Initialize on first render (client-side only)
  useEffect(() => {
    initializeIfNeeded();
  }, [initializeIfNeeded]);

  // Call initialization immediately for hooks that need it (client-side only)
  if (typeof window !== 'undefined') {
    initializeIfNeeded();
  }

  const fileSystem = fileSystemRef.current;
  const bridge = bridgeRef.current;

  // State - use null-safe defaults
  const [projectTree, setProjectTree] = useState<ProjectTree>({
    name: 'root',
    path: '/',
    type: 'folder',
    children: [],
    isExpanded: true,
  });
  const [openFiles, setOpenFiles] = useState<FileInfo[]>([]);
  const [activeFile, setActiveFileState] = useState<FileInfo | null>(null);
  const [cursor, setCursor] = useState<CursorPosition | null>(null);
  const [selection, setSelection] = useState<{ range: SelectionRange; text: string } | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [, forceUpdate] = useState({});

  // Force a refresh
  const refresh = useCallback(() => {
    if (!fileSystem || !bridge) return;
    setProjectTree(fileSystem.getProjectTree());
    setOpenFiles(bridge.getOpenFiles());
    setActiveFileState(bridge.getActiveFileInfo());
    forceUpdate({});
  }, [fileSystem, bridge]);

  // Subscribe to file system changes
  useEffect(() => {
    if (!fileSystem) return;
    const unsubscribe = fileSystem.subscribe(() => {
      refresh();
    });
    return unsubscribe;
  }, [fileSystem, refresh]);

  // Handle active file changes
  useEffect(() => {
    onActiveFileChange?.(activeFile);
  }, [activeFile, onActiveFileChange]);

  // ============================================================================
  // FILE OPERATIONS
  // ============================================================================

  const getFile = useCallback((path: string): FileInfo | null => {
    if (!bridge) return null;
    return bridge.getFile(path);
  }, [bridge]);

  const updateFile = useCallback((path: string, content: string): boolean => {
    if (!bridge) return false;
    const result = bridge.updateFile(path, content);
    if (result.success) {
      onFileChange?.(path, content);
      setIsDirty(true);
    }
    return result.success;
  }, [bridge, onFileChange]);

  const createFile = useCallback((path: string, content: string = ''): FileInfo | null => {
    if (!bridge) return null;
    return bridge.createFile(path, content);
  }, [bridge]);

  const deleteFile = useCallback((path: string): boolean => {
    if (!bridge) return false;
    return bridge.deleteFile(path);
  }, [bridge]);

  const renameFile = useCallback((oldPath: string, newPath: string): boolean => {
    if (!bridge) return false;
    return bridge.renameFile(oldPath, newPath);
  }, [bridge]);

  // ============================================================================
  // EDITOR OPERATIONS
  // ============================================================================

  const insertAt = useCallback((cursorPos: CursorPosition, text: string): boolean => {
    if (!bridge) return false;
    const result = bridge.insertAt(cursorPos, text);
    if (result.success) {
      onFileChange?.(result.path, result.newContent || '');
      setIsDirty(true);
    }
    return result.success;
  }, [bridge, onFileChange]);

  const replaceSelection = useCallback((text: string): boolean => {
    if (!bridge) return false;
    const sel = bridge.getSelection();
    if (!sel) return false;
    
    const result = bridge.replaceRange(sel.range, text);
    if (result.success) {
      onFileChange?.(result.path, result.newContent || '');
      setIsDirty(true);
    }
    return result.success;
  }, [bridge, onFileChange]);

  const replaceRange = useCallback((range: SelectionRange, text: string): boolean => {
    if (!bridge) return false;
    const result = bridge.replaceRange(range, text);
    if (result.success) {
      onFileChange?.(result.path, result.newContent || '');
      setIsDirty(true);
    }
    return result.success;
  }, [bridge, onFileChange]);

  const goToLine = useCallback((line: number): void => {
    if (!bridge) return;
    bridge.goToLine(line);
  }, [bridge]);

  const moveFile = useCallback((fromPath: string, toPath: string): boolean => {
    if (!bridge) return false;
    return bridge.moveFile(fromPath, toPath);
  }, [bridge]);

  const copyFile = useCallback((fromPath: string, toPath: string): FileInfo | null => {
    if (!bridge) return null;
    return bridge.copyFile(fromPath, toPath);
  }, [bridge]);

  // ============================================================================
  // TAB OPERATIONS
  // ============================================================================

  const openFile = useCallback((path: string): void => {
    if (!bridge) return;
    bridge.openFile(path);
    refresh();
  }, [bridge, refresh]);

  const closeFile = useCallback((path: string): void => {
    if (!fileSystem) return;
    fileSystem.closeFile(path);
    refresh();
  }, [fileSystem, refresh]);

  const setActiveFile = useCallback((path: string): void => {
    if (!fileSystem || !bridge) return;
    fileSystem.setActiveFile(path);
    const file = bridge.getFile(path);
    if (file && editorRef.current) {
      editorRef.current.setValue(file.content);
    }
    refresh();
  }, [fileSystem, bridge, refresh]);

  // ============================================================================
  // FOLDER OPERATIONS
  // ============================================================================

  const createFolder = useCallback((path: string): void => {
    if (!fileSystem) return;
    fileSystem.createFolder(path);
  }, [fileSystem]);

  const toggleFolder = useCallback((path: string): void => {
    if (!fileSystem) return;
    fileSystem.toggleFolder(path);
  }, [fileSystem]);

  const deleteFolder = useCallback((path: string): boolean => {
    if (!bridge) return false;
    return bridge.deleteFolder(path);
  }, [bridge]);

  const listFolders = useCallback((path: string = '/'): Array<{ path: string; name: string }> => {
    if (!bridge) return [];
    return bridge.listFolders(path);
  }, [bridge]);

  const listFiles = useCallback((path: string = '/'): FileInfo[] => {
    if (!bridge) return [];
    return bridge.listFiles(path);
  }, [bridge]);

  // ============================================================================
  // UNDO/REDO
  // ============================================================================

  const undo = useCallback((): boolean => {
    if (!bridge) return false;
    return bridge.undo();
  }, [bridge]);

  const redo = useCallback((): boolean => {
    if (!bridge) return false;
    return bridge.redo();
  }, [bridge]);

  // ============================================================================
  // MONACO INTEGRATION
  // ============================================================================

  const setEditorInstance = useCallback((editor: MonacoEditorInstance): void => {
    if (!bridge) return;
    editorRef.current = editor;
    bridge.setEditor(editor);

    // Sync cursor/selection state
    const updateCursorState = () => {
      const pos = editor.getPosition();
      if (pos) {
        setCursor({ line: pos.lineNumber, column: pos.column });
      }
      setSelection(bridge.getSelection());
    };

    // Initial sync
    updateCursorState();
  }, [bridge]);

  const getEditorContent = useCallback((): string => {
    return editorRef.current?.getValue() || '';
  }, []);

  const setEditorContent = useCallback((content: string): void => {
    if (editorRef.current) {
      editorRef.current.setValue(content);
    }
  }, []);

  // ============================================================================
  // PROJECT OPERATIONS
  // ============================================================================

  const setProjectName = useCallback((name: string): void => {
    if (!fileSystem) return;
    fileSystem.setProjectName(name);
  }, [fileSystem]);

  const exportProject = useCallback((): string => {
    if (!fileSystem) return '{}';
    return fileSystem.exportProject();
  }, [fileSystem]);

  const importProject = useCallback((json: string): boolean => {
    if (!fileSystem) return false;
    const success = fileSystem.importProject(json);
    if (success) {
      refresh();
      setIsDirty(false);
    }
    return success;
  }, [fileSystem, refresh]);

  const clearProject = useCallback((): void => {
    if (!fileSystem) return;
    fileSystem.clear();
    setIsDirty(false);
    refresh();
  }, [fileSystem, refresh]);

  // ============================================================================
  // SEARCH
  // ============================================================================

  const search = useCallback((query: string) => {
    if (!bridge) return [];
    return bridge.searchInProject(query);
  }, [bridge]);

  // ============================================================================
  // METADATA
  // ============================================================================

  const getFileMetadata = useCallback((path: string) => {
    if (!bridge) return null;
    return bridge.getFileMetadata(path);
  }, [bridge]);

  const getFileSize = useCallback((path: string): number | null => {
    if (!bridge) return null;
    return bridge.getFileSize(path);
  }, [bridge]);

  const getFileType = useCallback((path: string): string | null => {
    if (!bridge) return null;
    return bridge.getFileType(path);
  }, [bridge]);

  const getMimeType = useCallback((path: string): string | null => {
    if (!bridge) return null;
    return bridge.getMimeType(path);
  }, [bridge]);

  // ============================================================================
  // USER INTERACTION
  // ============================================================================

  const askUser = useCallback(async (question: string, options?: { type?: 'confirm' | 'prompt'; defaultValue?: string }) => {
    if (!bridge) return null;
    return bridge.askUser(question, options);
  }, [bridge]);

  const sendMessage = useCallback((text: string, type?: 'info' | 'success' | 'warning' | 'error') => {
    if (!bridge) return;
    bridge.sendMessage(text, type);
  }, [bridge]);

  const showProgress = useCallback((percent: number, message?: string) => {
    if (!bridge) return;
    bridge.showProgress(percent, message);
  }, [bridge]);

  const requestApproval = useCallback(async (action: string, details?: string): Promise<boolean> => {
    if (!bridge) return false;
    return bridge.requestApproval(action, details);
  }, [bridge]);

  const checkPermission = useCallback((action: string, path?: string) => {
    if (!bridge) return { allowed: false, reason: 'Bridge not initialized' };
    return bridge.checkPermission(action, path);
  }, [bridge]);

  const setUserCallbacks = useCallback((callbacks: {
    askUser?: (question: string, options?: { type?: 'confirm' | 'prompt'; defaultValue?: string }) => Promise<string | boolean | null>;
    sendMessage?: (text: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
    showProgress?: (percent: number, message?: string) => void;
    requestApproval?: (action: string, details?: string) => Promise<boolean>;
  }) => {
    if (!bridge) return;
    bridge.setUserCallbacks(callbacks);
  }, [bridge]);

  // ============================================================================
  // DOWNLOAD/UPLOAD
  // ============================================================================

  const generateDownloadLink = useCallback((path: string) => {
    if (!bridge) return null;
    return bridge.generateDownloadLink(path);
  }, [bridge]);

  const downloadFile = useCallback((path: string): boolean => {
    if (!bridge) return false;
    return bridge.downloadFile(path);
  }, [bridge]);

  const uploadFile = useCallback((filename: string, content: string, targetPath?: string): FileInfo | null => {
    if (!bridge) return null;
    return bridge.uploadFile(filename, content, targetPath);
  }, [bridge]);

  const downloadProject = useCallback((): boolean => {
    if (!bridge) return false;
    return bridge.downloadProject();
  }, [bridge]);

  // ============================================================================
  // IMAGE OPERATIONS
  // ============================================================================

  const readImage = useCallback((path: string) => {
    if (!bridge) return null;
    return bridge.readImage(path);
  }, [bridge]);

  const resizeImage = useCallback(async (path: string, width: number, height: number) => {
    if (!bridge) return null;
    return bridge.resizeImage(path, width, height);
  }, [bridge]);

  const convertImage = useCallback(async (path: string, format: 'png' | 'jpeg' | 'webp') => {
    if (!bridge) return null;
    return bridge.convertImage(path, format);
  }, [bridge]);

  const compressImage = useCallback(async (path: string, quality?: number) => {
    if (!bridge) return null;
    return bridge.compressImage(path, quality);
  }, [bridge]);

  // ============================================================================
  // ZIP OPERATIONS
  // ============================================================================

  const createZip = useCallback((folderPath?: string): string => {
    if (!bridge) return '{}';
    return bridge.createZip(folderPath);
  }, [bridge]);

  const extractZip = useCallback((bundleJson: string, targetFolder?: string) => {
    if (!bridge) return { success: false, filesCreated: 0 };
    return bridge.extractZip(bundleJson, targetFolder);
  }, [bridge]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  
  const canUndo = useMemo(() => {
    if (!fileSystem) return false;
    const activeFilePath = fileSystem.getActiveFile()?.path;
    if (!activeFilePath) return false;
    return fileSystem.canUndo(activeFilePath);
  }, [fileSystem, projectTree]); // Depends on projectTree to re-compute after changes
  
  const canRedo = useMemo(() => {
    if (!fileSystem) return false;
    const activeFilePath = fileSystem.getActiveFile()?.path;
    if (!activeFilePath) return false;
    return fileSystem.canRedo(activeFilePath);
  }, [fileSystem, projectTree]); // Depends on projectTree to re-compute after changes

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    bridge: bridge!,
    fileSystem: fileSystem!,
    projectTree,
    openFiles,
    activeFile,
    cursor,
    selection,
    isDirty,
    canUndo,
    canRedo,
    getFile,
    updateFile,
    createFile,
    deleteFile,
    renameFile,
    moveFile,
    copyFile,
    insertAt,
    replaceSelection,
    replaceRange,
    goToLine,
    openFile,
    closeFile,
    setActiveFile,
    createFolder,
    toggleFolder,
    deleteFolder,
    listFolders,
    listFiles,
    undo,
    redo,
    setEditorInstance,
    getEditorContent,
    setEditorContent,
    setProjectName,
    exportProject,
    importProject,
    clearProject,
    search,
    getFileMetadata,
    getFileSize,
    getFileType,
    getMimeType,
    askUser,
    sendMessage,
    showProgress,
    requestApproval,
    checkPermission,
    setUserCallbacks,
    generateDownloadLink,
    downloadFile,
    uploadFile,
    downloadProject,
    readImage,
    resizeImage,
    convertImage,
    compressImage,
    createZip,
    extractZip,
    refresh,
  };
}

// Export types
export type { FileInfo, CursorPosition, SelectionRange, ProjectTree };
