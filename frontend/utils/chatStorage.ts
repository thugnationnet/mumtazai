// Chat history utilities — backed by PostgreSQL via API (ZERO localStorage)
import { v4 as uuidv4 } from 'uuid';

export interface FileAttachment {
  name: string
  size: number
  type: string
  url?: string
  data?: string // Base64 encoded file data
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  feedback?: 'positive' | 'negative' | null
  isStreaming?: boolean
  streamingComplete?: boolean
  attachments?: FileAttachment[]
}

export interface ChatSession {
  id: string;
  name: string;
  messages: ChatMessage[];
  lastUpdated: Date;
}

export interface AgentChatHistory {
  agentId: string;
  sessions: Record<string, ChatSession>;
  activeSessionId: string | null;
}

const MAX_MESSAGES_PER_AGENT = 100;
const MAX_STORAGE_AGE_DAYS = 30;

// ── In-memory cache (hydrated from DB on first access) ───────────
let _cache: Record<string, AgentChatHistory> | null = null;
let _cachePromise: Promise<Record<string, AgentChatHistory>> | null = null;
let _savePending: ReturnType<typeof setTimeout> | null = null;

/**
 * Fetch chat history from database (UserPreferences.chatHistory)
 */
async function fetchFromDb(): Promise<Record<string, AgentChatHistory>> {
  try {
    const res = await fetch('/api/user/preferences', { credentials: 'include' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data?.chatHistory) {
        const raw = json.data.chatHistory;
        for (const agentId of Object.keys(raw)) {
          const h = raw[agentId] as AgentChatHistory;
          if (h.sessions) {
            for (const s of Object.values(h.sessions)) {
              s.lastUpdated = new Date(s.lastUpdated);
              s.messages = (s.messages || []).map((m: any) => ({
                ...m,
                timestamp: new Date(m.timestamp),
              }));
            }
          }
        }
        return raw;
      }
    }
  } catch (err) {
    console.error('[chatStorage] DB fetch failed:', err);
  }
  return {};
}

/**
 * Save chat history to database (debounced 500ms)
 */
function persistToDb(histories: Record<string, AgentChatHistory>): void {
  if (_savePending) clearTimeout(_savePending);
  _savePending = setTimeout(async () => {
    try {
      await fetch('/api/user/preferences', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatHistory: histories }),
      });
    } catch (err) {
      console.error('[chatStorage] DB save failed:', err);
    }
  }, 500);
}

/**
 * Get all chat histories (from memory cache, or fetch from DB)
 */
async function getAllChatHistoriesAsync(): Promise<Record<string, AgentChatHistory>> {
  if (_cache) return _cache;
  if (!_cachePromise) {
    _cachePromise = fetchFromDb().then((data) => {
      _cache = data;
      _cachePromise = null;
      return data;
    });
  }
  return _cachePromise;
}

/**
 * Get histories synchronously (returns cache; empty if not yet loaded)
 */
function getAllChatHistories(): Record<string, AgentChatHistory> {
  return _cache ?? {};
}

/**
 * Save all chat histories — cleans old data, persists to DB
 */
function saveAllChatHistories(histories: Record<string, AgentChatHistory>): void {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - MAX_STORAGE_AGE_DAYS);

  const cleaned: Record<string, AgentChatHistory> = {};

  for (const agentId of Object.keys(histories)) {
    const agentHistory = histories[agentId];
    const activeSessions: Record<string, ChatSession> = {};

    if (agentHistory.sessions) {
      for (const session of Object.values(agentHistory.sessions)) {
        if (new Date(session.lastUpdated) > cutoffDate) {
          const messages = session.messages.slice(-MAX_MESSAGES_PER_AGENT);
          activeSessions[session.id] = { ...session, messages };
        }
      }
    }

    if (Object.keys(activeSessions).length > 0) {
      cleaned[agentId] = { ...agentHistory, sessions: activeSessions };
    } else if (!agentHistory.sessions || Object.keys(agentHistory.sessions).length === 0) {
      cleaned[agentId] = agentHistory;
    }
  }

  _cache = cleaned;
  persistToDb(cleaned);
}

// ── Public API (keeps same signatures — sync where possible) ─────

/**
 * Load chat history for a specific agent and session
 */
export function loadChatHistory(agentId: string, sessionId: string): ChatMessage[] {
  const histories = getAllChatHistories();
  const agentHistory = histories[agentId];
  if (!agentHistory?.sessions?.[sessionId]) return [];
  return agentHistory.sessions[sessionId].messages;
}

/**
 * Save chat history for a specific agent and session
 */
export function saveChatHistory(agentId: string, sessionId: string, messages: ChatMessage[]): void {
  const histories = getAllChatHistories();

  if (!histories[agentId]) {
    histories[agentId] = { agentId, sessions: {}, activeSessionId: sessionId };
  }
  if (!histories[agentId].sessions) {
    histories[agentId].sessions = {};
  }
  if (!histories[agentId].sessions[sessionId]) {
    histories[agentId].sessions[sessionId] = {
      id: sessionId,
      name: `Chat ${new Date().toLocaleString()}`,
      messages: [],
      lastUpdated: new Date(),
    };
  }

  histories[agentId].sessions[sessionId].messages = messages.slice();
  histories[agentId].sessions[sessionId].lastUpdated = new Date();
  histories[agentId].activeSessionId = sessionId;

  saveAllChatHistories(histories);
}

/**
 * Add a single message to an agent's chat history for a specific session
 */
export function addMessageToHistory(agentId: string, sessionId: string, message: ChatMessage): void {
  const currentMessages = loadChatHistory(agentId, sessionId);
  saveChatHistory(agentId, sessionId, [...currentMessages, message]);
}

/**
 * Update a specific message in an agent's chat history for a specific session
 */
export function updateMessageInHistory(agentId: string, sessionId: string, messageId: string, updates: Partial<ChatMessage>): void {
  const currentMessages = loadChatHistory(agentId, sessionId);
  const updatedMessages = currentMessages.map(msg =>
    msg.id === messageId ? { ...msg, ...updates } : msg
  );
  saveChatHistory(agentId, sessionId, updatedMessages);
}

/**
 * Clear chat history for a specific session
 */
export function clearChatHistory(agentId: string, sessionId: string): void {
  const histories = getAllChatHistories();
  if (histories[agentId]?.sessions?.[sessionId]) {
    histories[agentId].sessions[sessionId].messages = [];
    histories[agentId].sessions[sessionId].lastUpdated = new Date();
    saveAllChatHistories(histories);
  }
}

/**
 * Clear all chat histories for a specific agent
 */
export function clearAgentChatHistory(agentId: string): void {
  const histories = getAllChatHistories();
  delete histories[agentId];
  saveAllChatHistories(histories);
}

/**
 * Get all sessions for an agent
 */
export function getAgentSessions(agentId: string): ChatSession[] {
  const histories = getAllChatHistories();
  const agentHistory = histories[agentId];
  return agentHistory?.sessions
    ? Object.values(agentHistory.sessions).sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
    : [];
}

/**
 * Get the active session ID for an agent
 */
export function getActiveSessionId(agentId: string): string | null {
  const histories = getAllChatHistories();
  const agentHistory = histories[agentId];
  if (agentHistory?.activeSessionId && agentHistory.sessions?.[agentHistory.activeSessionId]) {
    return agentHistory.activeSessionId;
  }
  if (agentHistory?.sessions && Object.keys(agentHistory.sessions).length > 0) {
    const sorted = Object.values(agentHistory.sessions).sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
    return sorted[0].id;
  }
  return null;
}

/**
 * Create a new chat session for an agent
 */
export function createNewSession(agentId: string, initialMessage?: ChatMessage): ChatSession {
  const histories = getAllChatHistories();
  if (!histories[agentId]) {
    histories[agentId] = { agentId, sessions: {}, activeSessionId: null };
  }
  if (!histories[agentId].sessions) {
    histories[agentId].sessions = {};
  }

  const newSessionId = uuidv4();
  const newSession: ChatSession = {
    id: newSessionId,
    name: `New Chat ${Object.keys(histories[agentId].sessions).length + 1}`,
    messages: initialMessage ? [initialMessage] : [],
    lastUpdated: new Date(),
  };

  histories[agentId].sessions[newSessionId] = newSession;
  histories[agentId].activeSessionId = newSessionId;
  saveAllChatHistories(histories);
  return newSession;
}

/**
 * Delete a chat session for an agent
 */
export function deleteSession(agentId: string, sessionId: string): void {
  const histories = getAllChatHistories();
  if (histories[agentId]?.sessions?.[sessionId]) {
    delete histories[agentId].sessions[sessionId];
    if (histories[agentId].activeSessionId === sessionId) {
      const remaining = Object.values(histories[agentId].sessions).sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
      histories[agentId].activeSessionId = remaining.length > 0 ? remaining[0].id : null;
    }
    saveAllChatHistories(histories);
  }
}

/**
 * Rename a chat session for an agent
 */
export function renameSession(agentId: string, sessionId: string, newName: string): void {
  const histories = getAllChatHistories();
  if (histories[agentId]?.sessions?.[sessionId]) {
    histories[agentId].sessions[sessionId].name = newName;
    histories[agentId].sessions[sessionId].lastUpdated = new Date();
    saveAllChatHistories(histories);
  }
}

/**
 * Clear all chat histories
 */
export function clearAllChatHistories(): void {
  _cache = {};
  persistToDb({});
}

/**
 * Get storage usage statistics
 */
export function getChatStorageInfo(): {
  totalAgents: number
  totalMessages: number
  totalSessions: number
  storageSize: number
} {
  const histories = getAllChatHistories();
  const totalAgents = Object.keys(histories).length;
  let totalMessages = 0;
  let totalSessions = 0;

  for (const agentHistory of Object.values(histories)) {
    if (agentHistory.sessions) {
      totalSessions += Object.keys(agentHistory.sessions).length;
      for (const session of Object.values(agentHistory.sessions)) {
        totalMessages += session.messages.length;
      }
    }
  }

  const blob = new Blob([JSON.stringify(histories)]);
  return { totalAgents, totalMessages, totalSessions, storageSize: blob.size };
}

/**
 * Export chat history for backup or sharing
 */
export function exportChatHistory(agentId?: string): string {
  const all = getAllChatHistories();
  if (agentId && all[agentId]) {
    return JSON.stringify({ [agentId]: all[agentId] }, null, 2);
  }
  return JSON.stringify(all, null, 2);
}

/**
 * Import chat history from backup
 */
export function importChatHistory(jsonData: string): boolean {
  try {
    const imported = JSON.parse(jsonData);
    const current = getAllChatHistories();

    for (const agentId in imported) {
      const agentData = imported[agentId];
      if (agentData?.sessions) {
        if (!current[agentId]) {
          current[agentId] = { agentId, sessions: {}, activeSessionId: null };
        }
        for (const sessionId in agentData.sessions) {
          const s = agentData.sessions[sessionId];
          if (s?.id && s?.messages) {
            current[agentId].sessions[sessionId] = {
              ...s,
              lastUpdated: new Date(s.lastUpdated),
              messages: s.messages.map((m: any) => ({
                ...m,
                timestamp: new Date(m.timestamp),
              })),
            };
          }
        }
        if (agentData.activeSessionId) {
          current[agentId].activeSessionId = agentData.activeSessionId;
        }
      }
    }

    saveAllChatHistories(current);
    return true;
  } catch (error) {
    console.error('Error importing chat history:', error);
    return false;
  }
}

/**
 * Initialize cache from DB — call on app load
 */
export async function initChatStorage(): Promise<void> {
  await getAllChatHistoriesAsync();
}