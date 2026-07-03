import { EDITOR_API_BASE } from './apiConfig';
import { fetchWithCredentials } from '../fetchUtil';

// AI Agent Service - SSE streaming via /canvas/stream backend endpoint
export interface AIAgentCallbacks {
  onToken: (token: string) => void;
  onComplete: (fullResponse: string) => void;
  onError: (error: Error) => void;
  onFileOperation?: (operation: FileOperation) => void;
  onTerminalCommand?: (command: string, output: string) => void;
  onToolStart?: (tool: string, input: any) => void;
  onToolResult?: (tool: string, success: boolean, summary: string) => void;
}

export interface FileOperation {
  type: 'create' | 'edit' | 'delete' | 'read' | 'rename';
  path: string;
  content?: string;
  oldContent?: string;
  newName?: string;
}

export interface AIAgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: string[];  // Base64 data URLs for images
}

export interface ProjectFile {
  path: string;
  content: string;
  language?: string;
}

export interface StreamResult {
  content: string;
  projectFiles?: ProjectFile[];
  tokens?: { input: number; output: number };
  latencyMs?: number;
}

class AIAgentService {
  private isStreaming: boolean = false;
  private abortController: AbortController | null = null;
  
  /**
   * Stream AI response via SSE to the /canvas/stream endpoint.
   * This is the primary method — uses the backend tool-calling loop.
   */
  async streamChat(
    messages: AIAgentMessage[],
    callbacks: AIAgentCallbacks,
    provider: string = 'anthropic',
    model: string = 'claude-sonnet-4-20250514'
  ): Promise<void> {
    if (this.isStreaming) {
      callbacks.onError(new Error('Already streaming'));
      return;
    }
    
    this.isStreaming = true;
    this.abortController = new AbortController();
    
    const url = `${EDITOR_API_BASE}/canvas/stream`;
    
    // Build the request payload matching the backend's expected shape
    const lastUserMsg = messages.filter(m => m.role === 'user').pop();
    const prompt = lastUserMsg?.content || '';
    
    // Build history (exclude current user message)
    const history = messages.slice(0, -1).map(m => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const response = await fetchWithCredentials(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          history,
          projectFiles: [],
          editorContext: { provider, model },
        }),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Stream error ${response.status}: ${errText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No readable stream');

      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // keep incomplete last line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const dataStr = line.slice(6).trim();
          if (!dataStr || dataStr === '[DONE]') continue;

          try {
            const event = JSON.parse(dataStr);

            switch (event.type) {
              case 'text':
                fullContent += event.content || '';
                callbacks.onToken(event.content || '');
                break;

              case 'status':
                // Optional status updates (e.g. "Thinking...")
                break;

              case 'tool_start':
                callbacks.onToolStart?.(event.tool, event.input);
                // Show tool usage indicator
                if (event.tool === 'write_file' && event.input?.path) {
                  callbacks.onFileOperation?.({
                    type: 'create',
                    path: event.input.path,
                    content: event.input.content || '',
                  });
                }
                break;

              case 'tool_result':
                callbacks.onToolResult?.(event.tool, event.success, event.summary);
                break;

              case 'done':
                fullContent = event.content || fullContent;
                // If backend returns updated project files
                if (event.projectFiles) {
                  for (const pf of event.projectFiles) {
                    callbacks.onFileOperation?.({
                      type: 'create',
                      path: pf.path,
                      content: pf.content || '',
                    });
                  }
                }
                break;

              case 'error':
                callbacks.onError(new Error(event.error || 'Stream error'));
                this.isStreaming = false;
                return;
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }

      // Complete
      this.isStreaming = false;
      callbacks.onComplete(fullContent);

    } catch (err: any) {
      this.isStreaming = false;
      if (err.name === 'AbortError') {
        callbacks.onComplete('' );
      } else {
        callbacks.onError(err instanceof Error ? err : new Error(String(err)));
      }
    }
  }
  
  /**
   * Send message via REST (non-streaming fallback).
   */
  async sendMessage(
    messages: AIAgentMessage[],
    provider: string = 'anthropic',
    model: string = 'claude-sonnet-4-20250514'
  ): Promise<{ response: string; operations: FileOperation[]; commands: string[] }> {
    const lastUserMsg = messages.filter(m => m.role === 'user').pop();
    const prompt = lastUserMsg?.content || '';
    const history = messages.slice(0, -1).map(m => ({ role: m.role, content: m.content }));

    const response = await fetchWithCredentials(`${EDITOR_API_BASE}/canvas/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        history,
        projectFiles: [],
        editorContext: { provider, model },
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${error}`);
    }

    // For non-streaming, collect full SSE response
    const text = await response.text();
    const lines = text.split('\n');
    let fullContent = '';
    const operations: FileOperation[] = [];

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const dataStr = line.slice(6).trim();
      if (!dataStr || dataStr === '[DONE]') continue;
      try {
        const event = JSON.parse(dataStr);
        if (event.type === 'text') fullContent += event.content || '';
        if (event.type === 'done' && event.projectFiles) {
          for (const pf of event.projectFiles) {
            operations.push({ type: 'create', path: pf.path, content: pf.content });
          }
        }
        if (event.type === 'tool_start' && event.tool === 'write_file' && event.input?.path) {
          operations.push({ type: 'create', path: event.input.path, content: event.input.content || '' });
        }
      } catch { /* skip */ }
    }

    return { response: fullContent, operations, commands: [] };
  }
  
  // Cancel current stream
  cancelStream(): void {
    this.abortController?.abort();
    this.isStreaming = false;
    this.abortController = null;
  }
  
  // Check if currently streaming
  isCurrentlyStreaming(): boolean {
    return this.isStreaming;
  }
}

// Export singleton
export const aiAgentService = new AIAgentService();

// Also export class for testing
export { AIAgentService };
