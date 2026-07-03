import { useState, useCallback, useRef } from 'react';

export interface EditorBridgeState {
  openFiles: string[];
}

export interface CursorPosition {
  line: number;
  column: number;
}

export interface EditorBridge {
  files: Map<string, string>;
  fileList: string[];
  activeFile: string;
  cursor: CursorPosition;
  state: EditorBridgeState;
  setFile: (path: string, content: string) => void;
  setActiveFile: (path: string) => void;
  deleteFile: (path: string) => void;
  openFile: (path: string) => void;
  closeFile: (path: string) => void;
}

export function useEditorBridge(_options: Record<string, any> = {}): EditorBridge {
  const filesRef = useRef<Map<string, string>>(new Map([
    ['index.html', '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Canvas Studio App</title>\n  <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n  <div id="app"></div>\n  <script src="index.js"></script>\n</body>\n</html>'],
    ['styles.css', '* { margin: 0; padding: 0; box-sizing: border-box; }\nbody { font-family: system-ui, -apple-system, sans-serif; }'],
    ['index.js', '// Your app code here\nconsole.log("Hello from Canvas Studio!");'],
  ]));

  const [fileList, setFileList] = useState<string[]>(() => [...filesRef.current.keys()]);
  const [activeFile, setActiveFileState] = useState<string>('index.html');
  const [openFiles, setOpenFiles] = useState<string[]>(['index.html']);
  const [cursor, setCursor] = useState<CursorPosition>({ line: 1, column: 1 });
  // Counter to force re-render when files Map changes
  const [, setVersion] = useState(0);

  const setFile = useCallback((path: string, content: string) => {
    filesRef.current.set(path, content);
    setFileList(prev => {
      if (!prev.includes(path)) {
        return [...prev, path];
      }
      return prev;
    });
    // Open file if not already open
    setOpenFiles(prev => {
      if (!prev.includes(path)) {
        return [...prev, path];
      }
      return prev;
    });
    setVersion(v => v + 1);
  }, []);

  const setActiveFile = useCallback((path: string) => {
    setActiveFileState(path);
    setOpenFiles(prev => {
      if (!prev.includes(path)) {
        return [...prev, path];
      }
      return prev;
    });
    setCursor({ line: 1, column: 1 });
  }, []);

  const deleteFile = useCallback((path: string) => {
    filesRef.current.delete(path);
    setFileList(prev => prev.filter(f => f !== path));
    setOpenFiles(prev => {
      const next = prev.filter(f => f !== path);
      return next;
    });
    setActiveFileState(prev => {
      if (prev === path) {
        const remaining = [...filesRef.current.keys()];
        return remaining[0] || '';
      }
      return prev;
    });
    setVersion(v => v + 1);
  }, []);

  const openFile = useCallback((path: string) => {
    setOpenFiles(prev => {
      if (!prev.includes(path)) {
        return [...prev, path];
      }
      return prev;
    });
    setActiveFileState(path);
  }, []);

  const closeFile = useCallback((path: string) => {
    setOpenFiles(prev => {
      const next = prev.filter(f => f !== path);
      return next;
    });
    setActiveFileState(prev => {
      if (prev === path) {
        const remaining = openFiles.filter(f => f !== path);
        return remaining[remaining.length - 1] || [...filesRef.current.keys()][0] || '';
      }
      return prev;
    });
  }, [openFiles]);

  return {
    files: filesRef.current,
    fileList,
    activeFile,
    cursor,
    state: { openFiles },
    setFile,
    setActiveFile,
    deleteFile,
    openFile,
    closeFile,
  };
}

export default useEditorBridge;
