/**
 * ============================================================================
 * CANVAS EDITOR SYSTEM - INDEX
 * ============================================================================
 * 
 * Main exports for the Canvas Editor system including:
 * - VirtualFileSystem: Multi-file project management
 * - EditorBridge: AI ↔ Editor communication
 * - useEditorBridge: React hook for integration
 * - AgentTools: AI tool definitions for code editing
 */

// Virtual File System
export {
  VirtualFileSystem,
  getFileSystem,
  resetFileSystem,
  detectFileType,
  getMonacoLanguage,
  type VirtualFile,
  type VirtualFolder,
  type FileType,
  type ProjectTree,
  type FileHistory,
  type FileSystemState,
} from './VirtualFileSystem';

// Editor Bridge
export {
  EditorBridge,
  createEditorBridge,
  type CursorPosition,
  type SelectionRange,
  type TextEdit,
  type InsertResult,
  type UpdateResult,
  type FileInfo,
  type SearchResult,
  type MonacoEditorInstance,
} from './EditorBridge';

// React Hook
export {
  useEditorBridge,
  type UseEditorBridgeOptions,
  type UseEditorBridgeReturn,
} from './useEditorBridge';

// Agent Tools
export {
  AgentTools,
  createAgentToolsForBridge,
  type AgentTool,
  type ToolResult,
  type ToolParameter,
} from './AgentTools';
