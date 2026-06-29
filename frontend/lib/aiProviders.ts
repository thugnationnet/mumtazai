import type { AIProvider } from '../app/agents/agent-registry';

export interface ProviderModelOption {
  provider: AIProvider;
  label: string;
  models: {
    value: string;
    label: string;
  }[];
}

// ===============================================================================
// UNIFIED AI PROVIDER CONFIG - Simple cascade, no per-agent complexity
// ===============================================================================
//
// CASCADE ORDER: anthropic -> openai -> mistral -> xai -> groq -> cerebras
//
// The backend handles ALL fallback logic automatically:
// 1. Starts with Anthropic Claude (primary - best quality)
// 2. If Anthropic fails -> tries OpenAI GPT-4o
// 3. If OpenAI fails -> tries Mistral Large
// 4. If Mistral fails -> tries xAI Grok
// 5. If xAI fails -> tries Groq Llama
// 6. If Groq fails -> tries Cerebras Llama
//
// If a provider hits its token limit mid-response, the NEXT provider
// automatically continues from where the previous one stopped.
//
// Users do not need to select providers - it is fully automatic.
// The system NEVER fails until ALL 6 providers are exhausted.
// ===============================================================================

// Universal provider options (shown in settings UI if needed)
export const PROVIDER_MODEL_OPTIONS: ProviderModelOption[] = [
  {
    provider: 'anthropic',
    label: 'Claude AI (Primary)',
    models: [
      { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
    ],
  },
  {
    provider: 'openai',
    label: 'GPT-4o',
    models: [
      { value: 'gpt-4o', label: 'GPT-4o' },
    ],
  },
  {
    provider: 'mistral',
    label: 'Mistral AI',
    models: [
      { value: 'mistral-large-latest', label: 'Mistral Large' },
    ],
  },
  {
    provider: 'xai',
    label: 'Grok AI',
    models: [
      { value: 'grok-2-latest', label: 'Grok 2' },
    ],
  },
  {
    provider: 'groq',
    label: 'Fast Response',
    models: [
      { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B' },
    ],
  },
  {
    provider: 'cerebras',
    label: 'Code Builder',
    models: [
      { value: 'llama-3.3-70b', label: 'Llama 3.3 70B' },
    ],
  },
];

// All agents use the same universal provider options - no per-agent duplication
export function getAgentProviderOptions(_agentId: string): ProviderModelOption[] {
  return PROVIDER_MODEL_OPTIONS;
}

// ===============================================================================
// CANVAS BUILD PROVIDERS
// ===============================================================================
export function getAgentCanvasProviders(_agentId: string, _agentName?: string): Record<string, { name: string; models: { id: string; name: string }[] }> {
  return {
    anthropic: {
      name: 'Smart Code',
      models: [{ id: 'auto', name: 'Auto (Best Available)' }],
    },
    xai: {
      name: 'Planner',
      models: [{ id: 'auto', name: 'Auto (Best Available)' }],
    },
    cerebras: {
      name: 'Fast Code',
      models: [{ id: 'auto', name: 'Auto (Best Available)' }],
    },
    gemini: {
      name: 'Designer',
      models: [{ id: 'auto', name: 'Auto (Best Available)' }],
    },
  };
}

export function getCanvasDefaultProvider(): string {
  return 'anthropic';
}

export function getCanvasDefaultModel(): string {
  return 'auto';
}

// Agent display name helper
export function getAgentDisplayName(agentId: string): string {
  const names: Record<string, string> = {
    'einstein': 'Albert Einstein',
    'chess-player': 'Chess Player',
    'comedy-king': 'Comedy King',
    'drama-queen': 'Drama Queen',
    'lazy-pawn': 'Lazy Pawn',
    'knight-logic': 'Knight Logic',
    'rook-jokey': 'Rook Jokey',
    'bishop-burger': 'Bishop Burger',
    'emma-emotional': 'Emma Emotional',
    'julie-girlfriend': 'Julie Girlfriend',
    'mrs-boss': 'Mrs Boss',
    'professor-astrology': 'Professor Astrology',
    'nid-gaming': 'Nid Gaming',
    'chef-biew': 'Chef Biew',
    'ben-sega': 'Ben Sega',
    'tech-wizard': 'Tech Wizard',
    'fitness-guru': 'Fitness Guru',
    'travel-buddy': 'Travel Buddy',
  };
  return names[agentId] || 'AI Assistant';
}

// Legacy export for backward compatibility
export const LEGACY_PROVIDER_OPTIONS = PROVIDER_MODEL_OPTIONS;
