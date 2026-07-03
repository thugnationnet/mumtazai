import { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

export interface Collaborator {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  cursor?: { file: string; line: number; column: number };
}

export interface CollaborationOptions {
  projectSlug: string | null;
  userId: string | null;
  userName: string;
  userAvatar?: string;
  enabled?: boolean;
  onSync?: () => void;
  onCollaboratorJoin?: (collaborator: Collaborator) => void;
  onCollaboratorLeave?: (collaborator: Collaborator) => void;
}

export interface CollaborationReturn {
  collaborators: Collaborator[];
  isConnected: boolean;
  sendCursorUpdate: (file: string, line: number, column: number) => void;
  sendFileChange: (path: string, content: string) => void;
  sendTypingStart: () => void;
  sendTypingStop: () => void;
  typingUsers: string[];
}

export function useCollaboration(options: CollaborationOptions): CollaborationReturn {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!options.enabled || !options.projectSlug) {
      setIsConnected(false);
      return;
    }

    const connect = () => {
      // Build WebSocket URL from API base
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      let wsHost: string;
      if (API_BASE && API_BASE.startsWith('http')) {
        wsHost = API_BASE.replace(/^https?:\/\//, '');
      } else {
        wsHost = window.location.host;
      }
      const wsUrl = `${wsProtocol}//${wsHost}/ws/collab`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        // Join the room — userId comes from authenticated session,
        // server also verifies identity from JWT cookie
        ws.send(JSON.stringify({
          type: 'join',
          projectSlug: options.projectSlug,
          userId: options.userId || 'anonymous',
          userName: options.userName,
        }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'collaborators') {
            setCollaborators(msg.collaborators.map((c: any) => ({
              id: c.id, name: c.name, color: c.color, cursor: c.cursor,
            })));
          } else if (msg.type === 'join') {
            const newCollab: Collaborator = { id: msg.id, name: msg.name, color: msg.color };
            setCollaborators(prev => [...prev.filter(c => c.id !== msg.id), newCollab]);
            options.onCollaboratorJoin?.(newCollab);
          } else if (msg.type === 'leave') {
            setCollaborators(prev => {
              const leaving = prev.find(c => c.id === msg.id);
              if (leaving) options.onCollaboratorLeave?.(leaving);
              return prev.filter(c => c.id !== msg.id);
            });
          } else if (msg.type === 'cursor') {
            setCollaborators(prev => prev.map(c =>
              c.id === msg.id ? { ...c, cursor: { file: msg.file, line: msg.line, column: msg.column } } : c
            ));
          } else if (msg.type === 'file-change') {
            options.onSync?.();
          } else if (msg.type === 'typing-start') {
            setTypingUsers(prev => prev.includes(msg.name) ? prev : [...prev, msg.name]);
          } else if (msg.type === 'typing-stop') {
            setTypingUsers(prev => prev.filter(n => n !== msg.name));
          }
        } catch { /* ignore parse errors */ }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setCollaborators([]);
        // Reconnect after 3s
        reconnectTimer.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
      setCollaborators([]);
    };
  }, [options.enabled, options.projectSlug, options.userId]);

  const sendCursorUpdate = useCallback((file: string, line: number, column: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'cursor', file, line, column }));
    }
  }, []);

  const sendFileChange = useCallback((path: string, content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'file-change', path, content }));
    }
  }, []);

  const sendTypingStart = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'typing-start' }));
    }
  }, []);

  const sendTypingStop = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'typing-stop' }));
    }
  }, []);

  return {
    collaborators,
    isConnected,
    sendCursorUpdate,
    sendFileChange,
    sendTypingStart,
    sendTypingStop,
    typingUsers,
  };
}

export default useCollaboration;
