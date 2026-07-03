/**
 * useEditorStateSync — Push Monaco editor cursor/selection state to backend via Socket.IO
 *
 * This bridges the gap between the in-browser editor and the backend's
 * `editor_select` agent tool. When the agent calls `editor_select` with
 * `get_selection` or `get_cursor_position`, the backend reads from the
 * `editorStates` Map — this hook keeps that Map up-to-date in real-time.
 *
 * Flow: Monaco events → debounce → Socket.IO 'editor-state' → backend updateEditorState()
 */
'use client';

import { useEffect, useRef } from 'react';
import type { editor as MonacoEditor } from 'monaco-editor';
import { initializeSocket } from '../../../../lib/socket-client';

interface EditorStateSyncOptions {
  /** Ref to the Monaco editor instance (from useEditorBridge) */
  editorRef: React.RefObject<MonacoEditor.IStandaloneCodeEditor | null>;
  /** True once Monaco editor instance is mounted */
  editorReady: boolean;
  /** Authenticated user ID (null = skip syncing) */
  userId: string | null;
  /** Currently active file path in the editor */
  activeFilePath: string | null;
  /** Debounce interval in ms (default: 200) */
  debounceMs?: number;
}

export function useEditorStateSync({
  editorRef,
  editorReady,
  userId,
  activeFilePath,
  debounceMs = 200,
}: EditorStateSyncOptions): void {
  // Keep activeFilePath in a ref so we always emit the latest file path
  // without re-subscribing Monaco listeners on every file change
  const activeFileRef = useRef(activeFilePath);
  activeFileRef.current = activeFilePath;

  useEffect(() => {
    if (!editorReady || !userId) return;
    const editor = editorRef.current;
    if (!editor) return;

    const socket = initializeSocket();
    let debounceTimer: ReturnType<typeof setTimeout>;

    // Debounced push — merges rapid cursor + selection events
    const pushState = (state: Record<string, unknown>) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        socket.emit('editor-state', {
          userId,
          activeFile: activeFileRef.current,
          ...state,
        });
      }, debounceMs);
    };

    // ── Track cursor + selection via onDidChangeCursorSelection ──
    // This fires on BOTH cursor moves and selection changes,
    // so we only need one listener.
    const disposable = editor.onDidChangeCursorSelection((e) => {
      const model = editor.getModel();
      if (!model) return;
      const sel = e.selection;
      const cursorLine = sel.positionLineNumber;
      const cursorCol = sel.positionColumn;

      if (sel.isEmpty()) {
        // Cursor moved, no selection
        pushState({
          cursorLine,
          cursorCol,
          selection: null,
        });
      } else {
        // Active selection
        const text = model.getValueInRange(sel);
        pushState({
          cursorLine,
          cursorCol,
          selection: {
            text,
            startLine: sel.startLineNumber,
            endLine: sel.endLineNumber,
            startCol: sel.startColumn,
            endCol: sel.endColumn,
          },
        });
      }
    });

    // Push initial state immediately
    const pos = editor.getPosition();
    if (pos) {
      pushState({
        cursorLine: pos.lineNumber,
        cursorCol: pos.column,
        selection: null,
      });
    }

    // Cleanup
    return () => {
      disposable.dispose();
      clearTimeout(debounceTimer);
    };
  }, [editorReady, userId, editorRef, debounceMs]);

  // Also push activeFile changes (when user switches tabs but cursor stays)
  useEffect(() => {
    if (!editorReady || !userId || !activeFilePath) return;
    const socket = initializeSocket();
    socket.emit('editor-state', {
      userId,
      activeFile: activeFilePath,
    });
  }, [editorReady, userId, activeFilePath]);
}
