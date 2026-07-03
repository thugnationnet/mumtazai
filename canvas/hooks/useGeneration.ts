import { useCallback } from 'react';
import {
  GeneratedApp,
  ViewMode,
  GenerationState,
  ChatMessage,
} from '../types';
import { fetchWithCredentials } from '../fetchUtil';

type ActivePanel = 'workspace' | 'assistant' | 'dashboard' | 'files' | 'tools' | 'settings' | 'history' | 'templates' | 'deploy' | null;

export interface UseGenerationDeps {
  genState: GenerationState;
  setGenState: React.Dispatch<React.SetStateAction<GenerationState>>;
  selectedLanguage: string;
  conversationHistory: ChatMessage[];
  setConversationHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  currentApp: GeneratedApp | null;
  setCurrentApp: React.Dispatch<React.SetStateAction<GeneratedApp | null>>;
  history: GeneratedApp[];
  saveHistory: (h: GeneratedApp[]) => void;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
  projectSlug: string | null;
  createProjectIfNeeded: () => Promise<void>;
  conversationMode: boolean;
  setConversationMode: React.Dispatch<React.SetStateAction<boolean>>;
  isReadyToBuild: boolean;
  setIsReadyToBuild: React.Dispatch<React.SetStateAction<boolean>>;
  buildRequirements: string;
  setBuildRequirements: React.Dispatch<React.SetStateAction<string>>;
}

export function useGeneration(deps: UseGenerationDeps) {
  const {
    genState,
    setGenState,
    selectedLanguage,
    conversationHistory,
    setConversationHistory,
    currentApp,
    setCurrentApp,
    history,
    saveHistory,
    setViewMode,
    projectSlug,
    createProjectIfNeeded,
    conversationMode,
    setConversationMode,
    setIsReadyToBuild,
    buildRequirements,
    setBuildRequirements,
  } = deps;

  const handleGenerate = useCallback(async (
    instruction: string,
    isInitial: boolean = false
  ) => {
    if (!instruction.trim() || genState.isGenerating) return;

    setGenState({
      isGenerating: true,
      error: null,
      progressMessage: `Generating...`,
    });

    try {
      const response = await fetchWithCredentials('/api/canvas/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          prompt: instruction,
          currentCode: isInitial ? undefined : currentApp?.code,
          history: isInitial ? [] : currentApp?.history,
          targetLanguage: selectedLanguage === 'auto' ? undefined : selectedLanguage,
          appId: 'canvas-studio', // Credit pool: canvas-studio has its own credits
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate application');
      }

      const code = data.code;
      const detectedLanguage = data.language || 'html';

      const userMsg: ChatMessage = {
        role: 'user',
        text: instruction,
        timestamp: Date.now(),
      };
      const modelMsg: ChatMessage = {
        role: 'model',
        text: isInitial ? 'Application built!' : 'Changes applied.',
        timestamp: Date.now(),
      };

      if (isInitial) {
        const newApp: GeneratedApp = {
          id: Date.now().toString(),
          name: instruction.substring(0, 30) + '...',
          code,
          language: detectedLanguage,
          prompt: instruction,
          timestamp: Date.now(),
          history: [modelMsg],
        };
        setCurrentApp(newApp);
        saveHistory([newApp, ...history].slice(0, 10));

      } else if (currentApp) {
        const updatedApp = {
          ...currentApp,
          code,
          language: detectedLanguage || currentApp.language,
          history: [...currentApp.history, userMsg, modelMsg],
        };
        setCurrentApp(updatedApp);
        saveHistory(
          history.map((a) => (a.id === updatedApp.id ? updatedApp : a))
        );

      }

      setGenState({ isGenerating: false, error: null, progressMessage: '' });
      setViewMode(ViewMode.PREVIEW);

      if (isInitial && !projectSlug) {
        setTimeout(() => createProjectIfNeeded(), 500);
      }

      setConversationMode(true);
      setIsReadyToBuild(false);
    } catch (err: any) {
      setGenState({
        isGenerating: false,
        error: err.message,
        progressMessage: '',
      });
    }
  }, [
    genState.isGenerating,
    selectedLanguage,
    currentApp,
    history,
    projectSlug,
    saveHistory,
    setGenState,
    setCurrentApp,
    setViewMode,
    createProjectIfNeeded,
    setConversationMode,
    setIsReadyToBuild,
  ]);

  // 💬 Legacy Conversational Chat Handler (kept for compatibility)
  const handleConversationalChat = useCallback(async (message: string) => {
    const userMsg: ChatMessage = {
      role: 'user',
      text: message,
      timestamp: Date.now(),
    };
    setConversationHistory(prev => [...prev, userMsg]);

    setGenState({
      isGenerating: true,
      error: null,
      progressMessage: 'Thinking...',
    });

    try {
      const response = await fetchWithCredentials('/api/canvas/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message,
          conversationHistory: conversationHistory,
          templateContext: buildRequirements || undefined,
          appId: 'canvas-studio', // Credit pool: canvas-studio has its own credits
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Chat failed');
      }

      const aiMsg: ChatMessage = {
        role: 'model',
        text: data.message,
        timestamp: Date.now(),
      };
      setConversationHistory(prev => [...prev, aiMsg]);

      if (data.isReadyToBuild) {
        setIsReadyToBuild(true);
        const requirements = conversationHistory
          .filter(m => m.role === 'user')
          .map(m => m.text)
          .join('\n');
        setBuildRequirements(requirements + '\n' + message);
      }

      setGenState({ isGenerating: false, error: null, progressMessage: '' });
    } catch (err: any) {
      setGenState({
        isGenerating: false,
        error: err.message,
        progressMessage: '',
      });

      const errorMsg: ChatMessage = {
        role: 'model',
        text: '⚠️ Sorry, something went wrong. Please try again.',
        timestamp: Date.now(),
      };
      setConversationHistory(prev => [...prev, errorMsg]);
    }
  }, [
    conversationHistory,
    buildRequirements,
    setGenState,
    setConversationHistory,
    setIsReadyToBuild,
    setBuildRequirements,
  ]);

  // 🏗️ Start Building from Conversation
  const handleStartBuilding = useCallback(async () => {
    if (!buildRequirements) return;

    setConversationMode(false);
    await handleGenerate(buildRequirements, true);

    setConversationHistory([]);
    setIsReadyToBuild(false);
    setBuildRequirements('');
    setConversationMode(true);
  }, [
    buildRequirements,
    handleGenerate,
    setConversationMode,
    setConversationHistory,
    setIsReadyToBuild,
    setBuildRequirements,
  ]);

  // 💬 Handle Chat Message - decides between conversation and direct edit
  const handleChatMessage = useCallback(async (message: string) => {
    if (!currentApp && conversationMode) {
      await handleConversationalChat(message);
    } else {
      await handleGenerate(message, false);
    }
  }, [currentApp, conversationMode, handleConversationalChat, handleGenerate]);

  return {
    handleGenerate,
    handleConversationalChat,
    handleStartBuilding,
    handleChatMessage,
  };
}
