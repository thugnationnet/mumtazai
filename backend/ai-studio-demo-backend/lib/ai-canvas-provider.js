/**
 * AI Canvas Provider Service
 * Shared AI client initialization and generation functions
 * Used by both canvas-routes.js (Quick Mode) and canvas-builder-routes.js (Builder Mode)
 * Providers: Mistral (default), xAI (fallback), OpenAI (fallback)
 */

import OpenAI from 'openai';

// ============================================
// LAZY AI CLIENT INITIALIZATION
// ============================================

let openaiClient = null;
let mistralClient = null;
let xaiClient = null;

export function getOpenAIClient() {
  if (!openaiClient && process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

export function getMistralClient() {
  if (!mistralClient && process.env.MISTRAL_API_KEY) {
    mistralClient = new OpenAI({
      apiKey: process.env.MISTRAL_API_KEY,
      baseURL: 'https://api.mistral.ai/v1',
    });
  }
  return mistralClient;
}

export function getXAIClient() {
  if (!xaiClient && process.env.XAI_API_KEY) {
    xaiClient = new OpenAI({
      apiKey: process.env.XAI_API_KEY,
      baseURL: 'https://api.x.ai/v1',
    });
  }
  return xaiClient;
}

// ============================================
// GENERATE WITH ANY PROVIDER
// ============================================

/**
 * Generate code using any configured AI provider
 * @param {string} provider - Provider name (mistral, xai, openai)
 * @param {string} modelId - Model identifier
 * @param {string} prompt - User prompt
 * @param {string} systemPrompt - System prompt
 * @returns {Promise<string>} Generated code
 */
export async function generateWithProvider(provider, modelId, prompt, systemPrompt) {
  let generatedCode = '';

  switch (provider) {
    case 'mistral': {
      const client = getMistralClient();
      if (!client) throw new Error('Mistral not configured');
      const completion = await client.chat.completions.create({
        model: modelId,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        max_tokens: 16000,
        temperature: 0.7,
      });
      generatedCode = completion.choices[0]?.message?.content || '';
      break;
    }

    case 'xai': {
      const client = getXAIClient();
      if (!client) throw new Error('xAI not configured');
      const completion = await client.chat.completions.create({
        model: modelId,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        max_tokens: 16000,
        temperature: 0.7,
      });
      generatedCode = completion.choices[0]?.message?.content || '';
      break;
    }

    case 'openai': {
      const client = getOpenAIClient();
      if (!client) throw new Error('OpenAI not configured');
      const completion = await client.chat.completions.create({
        model: modelId,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        max_tokens: 16000,
        temperature: 0.7,
      });
      generatedCode = completion.choices[0]?.message?.content || '';
      break;
    }

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }

  return generatedCode;
}

// ============================================
// AVAILABLE PROVIDERS
// ============================================

/**
 * Get the first available provider and its default model
 * Priority: Mistral (default) > xAI (fallback) > OpenAI (fallback)
 */
export function getDefaultProvider() {
  const providers = [
    { name: 'mistral', key: 'MISTRAL_API_KEY', model: 'codestral-latest' },
    { name: 'xai', key: 'XAI_API_KEY', model: 'grok-3-mini-fast' },
    { name: 'openai', key: 'OPENAI_API_KEY', model: 'gpt-4o-mini' },
  ];

  for (const p of providers) {
    if (process.env[p.key]) {
      return { provider: p.name, model: p.model };
    }
  }

  throw new Error('No AI provider configured. Set at least one API key.');
}

// ============================================
// MULTI-FILE SYSTEM PROMPT
// ============================================

/**
 * Build a system prompt for multi-file project generation
 * @param {string} framework - Project framework (vite_react, nextjs, html, etc.)
 * @param {Array} existingFiles - Existing project files for context
 * @param {string} mode - Generation mode (create, modify, add-page, add-feature)
 * @returns {string} System prompt
 */
export function getMultiFileSystemPrompt(framework, existingFiles = [], mode = 'create') {
  const frameworkGuide = {
    vite_react: {
      name: 'Vite + React + TypeScript',
      structure: `src/
  main.tsx          — React entry point
  App.tsx           — Root component with router
  index.css         — Global styles (Tailwind or vanilla CSS)
  components/       — Reusable UI components
  pages/            — Page-level components
  hooks/            — Custom React hooks
  services/         — API service layers
  types/            — TypeScript type definitions
index.html          — HTML entry point
package.json        — Dependencies
tsconfig.json       — TypeScript config
vite.config.ts      — Vite config
tailwind.config.js  — Tailwind config (if used)`,
      conventions: `- Use functional React components with TypeScript
- Use React hooks (useState, useEffect, useCallback, useMemo)
- Use react-router-dom for routing
- Use Tailwind CSS for styling (preferred) or CSS modules
- Export components as named exports
- Use arrow functions for components: const MyComp: React.FC<Props> = () => { ... }
- Import React: import React from 'react';`,
    },
    nextjs: {
      name: 'Next.js (App Router)',
      structure: `app/
  layout.tsx        — Root layout
  page.tsx          — Home page
  globals.css       — Global styles
  [route]/
    page.tsx        — Route pages
components/         — Shared components
lib/                — Utilities and helpers
public/             — Static assets`,
      conventions: `- Use the App Router pattern (app/ directory)
- Server Components by default, 'use client' directive for interactive components
- Use Next.js Image, Link, and metadata exports
- TypeScript with strict mode`,
    },
    html: {
      name: 'Vanilla HTML/CSS/JS',
      structure: `index.html          — Main HTML page
styles.css          — Stylesheet
script.js           — JavaScript
assets/             — Images, fonts, etc.`,
      conventions: `- Semantic HTML5 elements
- CSS custom properties for theming
- ES6+ JavaScript (modules if multi-file)
- Mobile-first responsive design`,
    },
    express: {
      name: 'Express.js API',
      structure: `server.js           — Entry point
routes/             — Route handlers
middleware/         — Custom middleware
models/             — Data models
lib/                — Utilities
package.json        — Dependencies`,
      conventions: `- RESTful API design
- Express middleware pattern
- Error handling middleware
- Environment-based config`,
    },
    fastapi: {
      name: 'FastAPI (Python)',
      structure: `main.py             — FastAPI app
routes/             — API routers
models/             — Pydantic models
services/           — Business logic
requirements.txt    — Python dependencies`,
      conventions: `- Pydantic models for validation
- Async endpoints where appropriate
- Type hints throughout
- Auto-generated OpenAPI docs`,
    },
  };

  const fw = frameworkGuide[framework] || frameworkGuide.html;

  let prompt = `You are Nova, an expert full-stack developer at Mumtaz AI. You generate complete, production-ready multi-file projects.

## Framework: ${fw.name}

## Project Structure
${fw.structure}

## Conventions
${fw.conventions}

## Output Format — JSON Action Blocks

You MUST respond with a JSON code block containing file actions. Each action creates or edits a file:

\`\`\`json
{
  "actions": [
    {
      "type": "file.create",
      "payload": {
        "path": "src/App.tsx",
        "content": "import React from 'react';\\n\\nconst App: React.FC = () => {\\n  return <div>Hello</div>;\\n};\\n\\nexport default App;",
        "language": "typescript"
      }
    },
    {
      "type": "file.create",
      "payload": {
        "path": "src/index.css",
        "content": "@tailwind base;\\n@tailwind components;\\n@tailwind utilities;",
        "language": "css"
      }
    },
    {
      "type": "ui.message",
      "payload": {
        "level": "success",
        "text": "Created 2 files for your React app!"
      }
    }
  ]
}
\`\`\`

## Available Action Types
- \`file.create\` — Create a new file: { path, content, language }
- \`file.edit\` — Replace file content: { path, content }
- \`file.delete\` — Delete a file: { path }
- \`ui.message\` — Show notification: { level, text }

## Rules
1. Generate COMPLETE file contents — no placeholders, no "// add your code here", no truncation.
2. Every file must be production-ready and functional.
3. Use realistic placeholder content (names, descriptions, images from picsum.photos).
4. Include proper imports and exports.
5. Include responsive design and hover states.
6. Add TypeScript types where appropriate.
7. Include a brief natural-language message (ui.message) at the end summarizing what you built.
8. For modifications, only include files that need changes (use file.edit).
9. For new projects, include ALL necessary files to run the app.
10. Keep paths relative to the project root (no leading /).`;

  // Add context for existing files
  if (existingFiles.length > 0) {
    prompt += `\n\n## Existing Project Files`;
    for (const file of existingFiles) {
      const preview = (file.content || '').substring(0, 500);
      prompt += `\n\n### ${file.path} (${file.language || 'unknown'})
\`\`\`
${preview}${file.content?.length > 500 ? '\n... (truncated)' : ''}
\`\`\``;
    }
    prompt += `\n\nWhen modifying existing files, use "file.edit" instead of "file.create". Only include files that need changes.`;
  }

  // Mode-specific instructions
  const modeInstructions = {
    create: '\n\n## Task: Create a New Project\nGenerate all necessary files for a complete, runnable project based on the user\'s description.',
    modify: '\n\n## Task: Modify Existing Project\nMake targeted changes to the existing files. Only include files that need modification using "file.edit".',
    'add-page': '\n\n## Task: Add a New Page\nCreate the new page component, add it to the router, and update navigation if applicable.',
    'add-feature': '\n\n## Task: Add a Feature\nImplement the requested feature across all necessary files. Create new files and modify existing ones as needed.',
    translate: '\n\n## Task: Add Translations\nAdd i18n support with the requested languages.',
    'add-api': '\n\n## Task: Add API Endpoint\nCreate the API route handler and any supporting types/models.',
  };

  prompt += modeInstructions[mode] || modeInstructions.create;

  return prompt;
}

/**
 * Parse AI response to extract file actions from JSON code blocks
 * @param {string} response - Raw AI response text
 * @returns {{ actions: Array, message: string }} Parsed actions and any natural language message
 */
export function parseFileActions(response) {
  const actions = [];
  let message = '';

  // Extract text before the JSON block as the message
  const jsonMatch = response.match(/```json\s*\n?([\s\S]*?)\n?\s*```/);
  
  if (jsonMatch) {
    // Get text before JSON block
    const beforeJson = response.substring(0, jsonMatch.index).trim();
    if (beforeJson) {
      message = beforeJson;
    }

    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed.actions && Array.isArray(parsed.actions)) {
        for (const action of parsed.actions) {
          if (action.type === 'ui.message') {
            message = message || action.payload?.text || '';
          } else {
            actions.push(action);
          }
        }
      }
    } catch (parseError) {
      console.error('[AIProvider] Failed to parse JSON actions:', parseError.message);
      // Try to extract individual file blocks as fallback
      const fileBlocks = response.matchAll(/```(\w+)\s*\n([\s\S]*?)```/g);
      for (const block of fileBlocks) {
        if (block[1] !== 'json') {
          actions.push({
            type: 'file.create',
            payload: {
              content: block[2].trim(),
              language: block[1],
            },
          });
        }
      }
    }
  } else {
    // No JSON block found — try legacy agent command format
    const legacyBlocks = response.matchAll(/```agent:(\w+)\s+path="([^"]+)"(?:\s+language="([^"]+)")?\n([\s\S]*?)```/g);
    for (const block of legacyBlocks) {
      const [, command, path, language, content] = block;
      actions.push({
        type: command === 'create_file' ? 'file.create' : command === 'edit_file' ? 'file.edit' : `file.${command}`,
        payload: { path, content: content.trim(), language },
      });
    }
    
    // Get any text as message
    message = response.replace(/```[\s\S]*?```/g, '').trim().substring(0, 500);
  }

  return { actions, message };
}
