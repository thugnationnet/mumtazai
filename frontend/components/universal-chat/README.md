# Universal Chat Component

A complete, professional chat interface with real AI integration, session management, and canvas mode for code editing.

## 📁 Files Overview

| File                                     | Description                                                           |
| ---------------------------------------- | --------------------------------------------------------------------- |
| `UniversalAgentChat.tsx`                 | Main chat component - the primary export                              |
| `EnhancedChatLayout.tsx`                 | Layout wrapper with sidebars and theme support                        |
| `ChatSessionSidebar.tsx`                 | Left sidebar for session management                                   |
| `ChatSettingsPanel.tsx`                  | Settings panel with AI presets                                        |
| `ChatRightPanel.tsx`                     | Right panel with Canvas button                                        |
| `QuickActionsPanel.tsx`                  | Quick action buttons for common tasks                                 |
| `canvas-build/CanvasMode.tsx`            | Canvas shim export (imports `canvas-build/components/CanvasPage.tsx`) |
| `canvas-build/components/CanvasPage.tsx` | Full-screen code editor with preview (Canvas overlay)                 |
| `realtimeChatService.ts`                 | API service for AI chat                                               |
| `types.ts`                               | TypeScript type definitions                                           |
| `aiProviders.ts`                         | AI provider configurations                                            |
| `index.ts`                               | Clean exports                                                         |

## 🚀 Usage

```tsx
import {
  UniversalAgentChat,
  AgentChatConfig,
} from '@/components/universal-chat';

const agentConfig: AgentChatConfig = {
  id: 'my-agent',
  name: 'My Agent',
  icon: '🤖',
  description: 'A helpful AI assistant',
  systemPrompt: 'You are a helpful AI assistant.',
  welcomeMessage: 'Hello! How can I help you today?',
  specialties: ['General Knowledge', 'Coding', 'Writing'],
};

export default function MyAgentPage() {
  return <UniversalAgentChat agent={agentConfig} />;
}
```

> Canvas docs now live alongside the component in `canvas-build/README.md`.

## ✨ Features

- **Real AI Integration** - Connects to Mistral API via `/api/studio/chat`
- **Session Management** - Create, rename, delete, export chat sessions
- **Theme Support** - Light (default) and Neural (dark cyber) themes
- **Quick Actions** - Pre-built prompts for common tasks
- **Canvas Mode** - Full-screen code editor with live preview
- **Streaming Responses** - Simulated streaming for better UX
- **Message Actions** - Copy, share, listen (text-to-speech), feedback
- **Settings Panel** - Temperature, max tokens, model selection
- **AI Presets** - Educational, Professional, Creative, Coding modes

## 🎨 Themes

### Default Theme

Clean, light design with indigo/purple gradients.

### Neural Theme

Dark cyber theme with cyan/purple accents and grid background.

Toggle via the sparkles/sun icon in the header.

## 📦 Dependencies

- `@heroicons/react` - Icons
- React 18+
- Next.js 14+
- Tailwind CSS

## 🔧 API Endpoint

The chat service expects an endpoint at:

- Production: `https://mumtaz.ai/api/studio/chat`
- Development: `http://localhost:3000/api/studio/chat`

Expected request body:

```json
{
  "message": "User message",
  "conversationHistory": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "agentConfig": {
    "systemPrompt": "...",
    "model": "mistral-large-latest",
    "temperature": 0.7,
    "maxTokens": 2000
  }
}
```

## 📄 License

Part of the MumtazAI platform.
