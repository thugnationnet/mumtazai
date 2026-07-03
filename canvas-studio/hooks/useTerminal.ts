/**
 * useTerminal — Terminal session management hook
 * BROWSER SPA: Uses fetch to call backend /api/sandbox/* endpoints
 */
import { useCallback } from 'react';
import { useTerminalStore } from '../stores/terminalStore';

const API_BASE = (import.meta as any).env?.VITE_API_URL || '';

export function useTerminal() {
  const store = useTerminalStore();

  const createTerminal = useCallback((name?: string) => {
    return store.createSession(name);
  }, [store]);

  const executeCommand = useCallback(async (terminalId: string, command: string) => {
    store.addOutput(terminalId, { terminalId, type: 'stdout', text: `$ ${command}` });

    try {
      // Get or start a sandbox session
      let sessionId = store.sandboxSessionId;

      if (!sessionId) {
        // Start a new sandbox session
        const startRes = await fetch(`${API_BASE}/api/sandbox/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({}),
        });
        const startData = await startRes.json();
        sessionId = startData.data?.sessionId || startData.sessionId;
        if (sessionId) {
          store.setSandboxSessionId(sessionId);
        }
      }

      if (!sessionId) {
        store.addOutput(terminalId, { terminalId, type: 'stderr', text: 'Error: Could not start sandbox session' });
        return;
      }

      // Execute command in sandbox: POST /api/sandbox/exec/:sessionId
      const response = await fetch(`${API_BASE}/api/sandbox/exec/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ command }),
      });

      const result = await response.json();
      const output = result.data?.output || result.output || '';
      const exitCode = result.data?.exitCode ?? result.exitCode ?? 0;

      if (output) {
        const outputType = exitCode === 0 ? 'stdout' : 'stderr';
        store.addOutput(terminalId, { terminalId, type: outputType, text: output });
      }

      // Show source indicator
      const duration = result.data?.duration || result.duration;
      if (duration) {
        store.addOutput(terminalId, {
          terminalId,
          type: 'system',
          text: `[sandbox ${duration}ms]`,
        });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Execution error';
      store.addOutput(terminalId, { terminalId, type: 'stderr', text: `Error: ${msg}` });
    }
  }, [store]);

  const writeToTerminal = useCallback((terminalId: string, text: string, type: 'stdout' | 'stderr' | 'system' = 'stdout') => {
    store.addOutput(terminalId, { terminalId, type, text });
  }, [store]);

  const connectSandbox = useCallback(async (sandboxId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/sandbox/status/${sandboxId}`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        store.setSandboxSessionId(sandboxId);
      }
      return data;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }, [store]);

  const isSandboxConnected = useCallback(() => {
    return !!store.sandboxSessionId;
  }, [store]);

  return {
    sessions: store.sessions,
    activeSessionId: store.activeSessionId,
    outputs: store.outputs,
    isVisible: store.isVisible,
    height: store.height,
    createTerminal,
    closeTerminal: store.closeSession,
    setActiveSession: store.setActiveSession,
    executeCommand,
    writeToTerminal,
    clearOutput: store.clearOutput,
    toggleVisible: store.toggleVisible,
    setHeight: store.setHeight,
    renameSession: store.renameSession,
    connectSandbox,
    isSandboxConnected,
  };
}
