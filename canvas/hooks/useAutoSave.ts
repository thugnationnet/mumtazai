import { useState, useCallback, useRef, useEffect } from 'react';
import { fetchWithCredentials } from '../fetchUtil';

export interface WSProjectFile {
  path: string;
  content: string;
  language: string;
  isOpen?: boolean;
}

export interface AutoSaveResult {
  fileCount: number;
  savedAt: string;
}

export interface AutoSaveOptions {
  slug: string | null;
  debounceMs?: number;
  enabled?: boolean;
  onSave?: (result: AutoSaveResult) => void;
  onError?: (error: Error) => void;
}

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface AutoSaveReturn {
  status: AutoSaveStatus;
  setSlug: (slug: string) => void;
  markChanged: () => void;
  save: () => Promise<void>;
}

export function useAutoSave(
  getFiles: () => WSProjectFile[],
  getEditorState: () => any,
  getMainFile: () => string,
  options: AutoSaveOptions
): AutoSaveReturn {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const slugRef = useRef<string | null>(options.slug);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const changedRef = useRef(false);

  const setSlug = useCallback((slug: string) => {
    slugRef.current = slug;
  }, []);

  const save = useCallback(async () => {
    if (!slugRef.current || !options.enabled) return;

    try {
      setStatus('saving');
      const files = getFiles();

      // Send save request to backend
      const response = await fetchWithCredentials(`${window.location.origin}/api/workspace/projects/${slugRef.current}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          files,
          editorState: getEditorState(),
          mainFile: getMainFile(),
          sourceApp: 'canvas-studio',
        }),
      });

      if (response.ok) {
        const result: AutoSaveResult = {
          fileCount: files.length,
          savedAt: new Date().toISOString(),
        };
        setStatus('saved');
        options.onSave?.(result);

        // Reset to idle after 2 seconds
        setTimeout(() => setStatus('idle'), 2000);
      } else {
        throw new Error(`Save failed: ${response.status}`);
      }
    } catch (err) {
      setStatus('error');
      options.onError?.(err instanceof Error ? err : new Error(String(err)));
      setTimeout(() => setStatus('idle'), 3000);
    }

    changedRef.current = false;
  }, [getFiles, getEditorState, getMainFile, options]);

  const markChanged = useCallback(() => {
    changedRef.current = true;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      if (changedRef.current && options.enabled) {
        save();
      }
    }, options.debounceMs || 2000);
  }, [save, options.debounceMs, options.enabled]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Update slug ref when option changes
  useEffect(() => {
    slugRef.current = options.slug;
  }, [options.slug]);

  return { status, setSlug, markChanged, save };
}

export default useAutoSave;
