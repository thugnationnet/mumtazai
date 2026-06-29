/**
 * ============================================================================
 * EDITOR BRIDGE CONTEXT
 * ============================================================================
 * 
 * React Context for sharing EditorBridge across components.
 * Provides the bridge, file system, and agent tools to the entire canvas app.
 */

'use client';

import React, { createContext, useContext, useMemo, useCallback, useState, useEffect } from 'react';
import { useEditorBridge, type UseEditorBridgeReturn } from '../lib/canvas/useEditorBridge';
import { AgentTools, createAgentToolsForBridge } from '../lib/canvas/AgentTools';

interface EditorBridgeContextValue extends UseEditorBridgeReturn {
  agentTools: AgentTools;
  executeAgentTool: (toolName: string, params: Record<string, unknown>) => Promise<{
    success: boolean;
    message: string;
    data?: unknown;
    error?: string;
  }>;
  getToolsForAI: () => Array<{
    type: 'function';
    function: {
      name: string;
      description: string;
      parameters: any;
    };
  }>;
}

const EditorBridgeContext = createContext<EditorBridgeContextValue | null>(null);

interface EditorBridgeProviderProps {
  children: React.ReactNode;
  projectName?: string;
  initialFiles?: Array<{ path: string; content: string }>;
  onFileChange?: (path: string, content: string) => void;
}

export function EditorBridgeProvider({
  children,
  projectName = 'Canvas Project',
  initialFiles,
  onFileChange,
}: EditorBridgeProviderProps) {
  // Use the editor bridge hook
  const bridgeReturn = useEditorBridge({
    projectName,
    initialFiles,
    onFileChange,
  });

  // Create agent tools
  const agentTools = useMemo(
    () => new AgentTools(bridgeReturn.bridge),
    [bridgeReturn.bridge]
  );

  // Execute agent tool
  const executeAgentTool = useCallback(
    async (toolName: string, params: Record<string, unknown>) => {
      return agentTools.execute(toolName, params);
    },
    [agentTools]
  );

  // Get tools for AI (OpenAI format)
  const getToolsForAI = useCallback(() => {
    return agentTools.getOpenAITools();
  }, [agentTools]);

  // Context value
  const value: EditorBridgeContextValue = useMemo(
    () => ({
      ...bridgeReturn,
      agentTools,
      executeAgentTool,
      getToolsForAI,
    }),
    [bridgeReturn, agentTools, executeAgentTool, getToolsForAI]
  );

  return (
    <EditorBridgeContext.Provider value={value}>
      {children}
    </EditorBridgeContext.Provider>
  );
}

// Hook to use the editor bridge context
export function useEditorBridgeContext(): EditorBridgeContextValue {
  const context = useContext(EditorBridgeContext);
  if (!context) {
    throw new Error('useEditorBridgeContext must be used within an EditorBridgeProvider');
  }
  return context;
}

// Optional hook that returns null if not in provider (for optional usage)
export function useOptionalEditorBridge(): EditorBridgeContextValue | null {
  return useContext(EditorBridgeContext);
}
