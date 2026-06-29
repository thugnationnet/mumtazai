
import { SettingsState, NavItem } from './types';

/**
 * PROVIDER_CONFIG - All 7 AI providers supported by backend
 * 
 * No API keys needed here - all calls go through secure backend
 * Backend route: /api/studio/chat
 */
export const PROVIDER_CONFIG = [
  {
    id: 'anthropic',
    name: 'Anthropic',
    icon: '🅰️',
    models: ['claude-sonnet-4-20250514', 'claude-3-opus', 'claude-3-haiku'],
    status: 'active'
  },
  {
    id: 'mistral',
    name: 'Mistral',
    icon: '🌀',
    models: ['mistral-large-2411', 'mistral-medium', 'mixtral-8x7b'],
    status: 'active'
  },
  {
    id: 'xai',
    name: 'xAI',
    icon: '✖️',
    models: ['grok-3', 'grok-2-mini'],
    status: 'active'
  },
  {
    id: 'cerebras',
    name: 'Cerebras',
    icon: '🧠',
    models: ['llama-3.3-70b'],
    status: 'active'
  },
  {
    id: 'groq',
    name: 'Groq',
    icon: '⚡',
    models: ['llama-3.3-70b-specdec', 'mixtral-8x7b', 'gemma-7b'],
    status: 'active'
  },
  {
    id: 'openai',
    name: 'OpenAI',
    icon: '🤖',
    models: ['gpt-4.1', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    status: 'active'
  },
  {
    id: 'gemini',
    name: 'Gemini',
    icon: '💎',
    models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-ultra'],
    status: 'active'
  }
];

export const DEFAULT_SETTINGS: SettingsState = {
  customPrompt: "You are a helpful assistant.",
  agentName: "Neural Companion",
  temperature: 0.7,
  maxTokens: 2048,
  provider: 'anthropic',  // Default to Anthropic (Claude) - reliable and fast
  model: "claude-sonnet-4-20250514",
  activeTool: 'none',
  workspaceMode: 'CHAT',
  portalUrl: 'https://www.google.com/search?igu=1',
  canvas: {
    content: "// AGENT_DIRECTIVE: Collaborative workspace active.\n\nReady for synthesis.",
    type: 'text',
    title: 'Neural_Canvas_01'
  }
};

export const NAV_ITEMS: NavItem[] = [
  { label: 'Create Image', icon: '🎨', tool: 'image_gen', description: 'Visual synthesis module' },
  { label: 'Thinking', icon: '💡', tool: 'thinking', description: 'Chain-of-thought processing' },
  { label: 'Deep Research', icon: '🔭', tool: 'deep_research', description: 'Multi-layer semantic analysis' },
  { label: 'Web Portal', icon: '🌐', tool: 'browser', description: 'Interactive web integration' },
  { label: 'Study and Learn', icon: '📚', tool: 'study', description: 'Pedagogical core enabled' },
  { label: 'Web Search', icon: '🔍', tool: 'web_search', description: 'Real-time global grounding' },
  { label: 'Canvas', icon: '🖌️', tool: 'canvas', description: 'Creative writing workspace' },
  { label: 'Quizzes', icon: '📝', tool: 'quizzes', description: 'Knowledge testing protocol' },
  { label: 'Canvas App', icon: '💻', tool: 'canvas_app', description: 'Full-stack code generation studio' }
];

export const NEURAL_PRESETS: Record<string, { prompt: string; temp: number }> = {
  educational: { prompt: "You are an educational mentor. Use clear logic and analogies.", temp: 0.5 },
  professional: { prompt: "You are a professional business advisor. Use formal language and precise data.", temp: 0.3 },
  creative: { prompt: "You are a creative visionary. Generate imaginative and novel thoughts.", temp: 1.5 },
  coding: { prompt: "You are a senior software engineer. Provide clean, documented code.", temp: 0.4 }
};
