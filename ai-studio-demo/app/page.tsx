'use client';

import { useState, useEffect } from 'react';
import UniversalAgentChat from '@/components/chat/UniversalAgentChat';
import type { AgentChatConfig } from '@/components/chat/UniversalAgentChat';

const demoAgentConfig: AgentChatConfig = {
  id: 'ai-studio-demo',
  name: 'AI Studio Demo',
  icon: '✨',
  description: 'Free AI assistant demo — chat with multiple AI providers. No login required.',
  systemPrompt: `You are AI Studio Demo Assistant, a helpful and knowledgeable AI powered by One Last AI. You should:
- Be helpful, accurate, and conversational
- Assist with coding, writing, research, and creative tasks
- Provide clear explanations and examples
- Be friendly but professional
- Help users explore and learn new topics

IMPORTANT: This is a DEMO with limited features. If users ask about advanced features (voice chat, image generation, canvas builder, etc.), let them know these are available in the full version at mumtaz.ai.

You are a general-purpose assistant that can help with a wide variety of tasks.`,
  welcomeMessage: `✨ **Welcome to AI Studio Demo!**

I'm your free AI assistant — here to help with **coding**, **writing**, **research**, and **problem solving**.

> 💡 **Demo Mode**: You have **20 messages** per session. Refresh to start fresh. For unlimited access, visit [mumtaz.ai](https://mumtaz.ai).

*What would you like to explore today?*`,
  specialties: [
    'Coding',
    'Writing',
    'Research',
    'Problem Solving',
    'Creative Tasks',
  ],
  aiProvider: {
    primary: 'anthropic',
    fallbacks: ['xai', 'openai', 'mistral', 'gemini', 'groq', 'cerebras'],
    model: 'claude-sonnet-4-20250514',
    reasoning: 'Anthropic Claude provides the best quality responses for general assistance',
  },
};

export default function DemoPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: 'linear-gradient(135deg, #e8e0f0 0%, #d5d0e8 25%, #c8bfdd 50%, #ddd8ec 75%, #eae5f3 100%)' }}>
        <div className="animate-pulse text-purple-600/60 text-lg">Loading AI Studio Demo...</div>
      </div>
    );
  }

  return <UniversalAgentChat agent={demoAgentConfig} />;
}
