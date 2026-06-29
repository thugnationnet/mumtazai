/**
 * Gemini Service - Direct client-side Gemini API integration
 * 
 * Uses dynamic import of @google/genai to avoid build failures
 * when the package isn't installed. Falls back gracefully.
 * 
 * For standard chat, use chatService.ts (backend API) instead.
 */

import { SettingsState, CanvasState } from "../types";

// Tool declarations (inline, no SDK type dependency)
const navigatePortalTool = {
  name: 'navigate_portal',
  parameters: {
    type: 'OBJECT',
    description: 'Opens a specific URL in the user\'s Neural Portal.',
    properties: {
      url: { type: 'STRING', description: 'The full URL to navigate to.' },
      reason: { type: 'STRING', description: 'Explanation.' }
    },
    required: ['url'],
  },
};

const updateCanvasTool = {
  name: 'update_canvas',
  parameters: {
    type: 'OBJECT',
    description: 'Updates the content of the Neural Canvas workspace.',
    properties: {
      content: { type: 'STRING', description: 'The content or source URL for the canvas.' },
      type: { type: 'STRING', enum: ['text', 'code', 'html', 'video', 'image'], description: 'The type of content being synchronized.' },
      language: { type: 'STRING', description: 'If type is code, specify the language (e.g., javascript, python).' },
      title: { type: 'STRING', description: 'A title for this canvas state.' }
    },
    required: ['content', 'type'],
  },
};

export const callGemini = async (
  prompt: string, 
  settings: SettingsState
): Promise<{ 
  text: string; 
  isImage?: boolean; 
  urls?: string[]; 
  navigationUrl?: string;
  canvasUpdate?: Partial<CanvasState>;
}> => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) return { text: "ERROR: GEMINI_API_KEY not provisioned." };

  // Dynamic import — avoids build failure when @google/genai isn't installed
  let GoogleGenAI: any;
  try {
    const genai = await import('@google/genai');
    GoogleGenAI = genai.GoogleGenAI;
  } catch {
    return { text: "ERROR: @google/genai package not available. Use backend chat API instead." };
  }

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    let modelToUse = settings.model;
    const config: any = {
      systemInstruction: settings.customPrompt + `
\n\nWORKSPACE_CAPABILITIES:
1. NEURAL_PORTAL: Use 'navigate_portal' to open sites/media.
2. CANVAS_SYNC: Use 'update_canvas' to manage the shared workspace. This tab supports:
   - 'text': Collaborative documents.
   - 'code': Programming with syntax support.
   - 'html': Live rendered web layouts.
   - 'video': Embedded video streams (provide URL).
   - 'image': Full-screen visual assets (provide URL/Base64).
If the user mentions a document, file, or media they want to "work on", push it to the Canvas Sync tab immediately.`,
      temperature: settings.temperature,
      maxOutputTokens: settings.maxTokens,
      tools: [{ functionDeclarations: [navigatePortalTool, updateCanvasTool] }]
    };

    if (settings.activeTool === 'web_search' || settings.activeTool === 'browser' || settings.activeTool === 'deep_research') {
      config.tools = [{ googleSearch: {} }];
      modelToUse = 'gemini-3-pro-preview'; 
    }

    if (settings.activeTool === 'thinking') {
      config.thinkingConfig = { thinkingBudget: 1024 };
    }

    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: prompt,
      config: config
    });

    const functionCalls = response.functionCalls;
    let navigationUrl: string | undefined;
    let canvasUpdate: Partial<CanvasState> | undefined;
    
    if (functionCalls) {
      for (const call of functionCalls) {
        if (call.name === 'navigate_portal') {
          navigationUrl = call.args.url as string;
        } else if (call.name === 'update_canvas') {
          canvasUpdate = {
            content: call.args.content as string,
            type: call.args.type as any,
            language: call.args.language as string,
            title: (call.args.title as string) || settings.canvas.title
          };
        }
      }
    }

    const urls = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web?.uri)
      .filter(Boolean);

    let textResponse = response.text || "";
    if (navigationUrl) textResponse += `\n\n[SYSTEM_ACTION]: Portal initialized at ${navigationUrl}`;
    if (canvasUpdate) textResponse += `\n\n[SYSTEM_ACTION]: Workspace synchronized with ${canvasUpdate.title}`;

    return { 
      text: textResponse || "Command processed successfully.", 
      urls: urls,
      navigationUrl,
      canvasUpdate
    };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return { text: `CRITICAL_ERROR: ${error.message || "Uplink failure"}` };
  }
};