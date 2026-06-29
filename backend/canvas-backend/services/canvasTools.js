/**
 * CANVAS TOOLS  —  project/workspace management inside Canvas Studio
 * Tools for managing project files, reading state, and controlling the canvas view.
 */

import fs from 'fs';
import path from 'path';

export const CANVAS_TOOL_DEFINITIONS = [
  {
    name: 'canvas_read_file',
    description: 'Read a file from the current project. Returns its content.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path within the project (e.g. "src/App.tsx")' },
      },
      required: ['path'],
    },
  },
  {
    name: 'canvas_write_file',
    description: 'Write or update a file in the current project.',
    input_schema: {
      type: 'object',
      properties: {
        path:    { type: 'string', description: 'File path within the project' },
        content: { type: 'string', description: 'File content to write' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'canvas_list_files',
    description: 'List all files in the current project.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'canvas_delete_file',
    description: 'Delete a file from the current project.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to delete' },
      },
      required: ['path'],
    },
  },
  {
    name: 'canvas_rename_file',
    description: 'Rename or move a file within the current project.',
    input_schema: {
      type: 'object',
      properties: {
        old_path: { type: 'string', description: 'Current file path' },
        new_path: { type: 'string', description: 'New file path' },
      },
      required: ['old_path', 'new_path'],
    },
  },
  {
    name: 'canvas_get_state',
    description: 'Get the current canvas state: active file, language, project structure.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'canvas_switch_file',
    description: 'Switch the active editor file in the canvas view.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File to switch to' },
      },
      required: ['path'],
    },
  },
  {
    name: 'canvas_create_project',
    description: 'Create a new multi-file project structure (scaffold).',
    input_schema: {
      type: 'object',
      properties: {
        name:     { type: 'string', description: 'Project name' },
        template: { type: 'string', enum: ['html','react','nextjs','vue','node','express','python','blank'],
                    description: 'Project template to scaffold' },
        files:    { type: 'object', description: 'Custom file map { "path": "content" } (overrides template)' },
      },
      required: ['name'],
    },
  },
];

// ─────────────────────────────────────────────────── templates ──
const TEMPLATES = {
  html: {
    'index.html': `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Project</title><link rel="stylesheet" href="style.css"></head><body><h1>Hello World</h1><script src="script.js"></script></body></html>`,
    'style.css':  `* { box-sizing: border-box; margin: 0; padding: 0; }\nbody { font-family: sans-serif; padding: 2rem; }`,
    'script.js':  `console.log('Hello World');`,
  },
  react: {
    'src/App.jsx': `import React from 'react';\n\nexport default function App() {\n  return <div className="app"><h1>Hello React</h1></div>;\n}`,
    'src/main.jsx': `import React from 'react';\nimport { createRoot } from 'react-dom/client';\nimport App from './App';\ncreateRoot(document.getElementById('root')).render(<App />);`,
    'index.html': `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>React App</title></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>`,
    'package.json': `{\n  "name": "react-app",\n  "scripts": { "dev": "vite", "build": "vite build" },\n  "dependencies": { "react": "^18.0.0", "react-dom": "^18.0.0" },\n  "devDependencies": { "vite": "^5.0.0", "@vitejs/plugin-react": "^4.0.0" }\n}`,
  },
  node: {
    'index.js':   `const express = require('express');\nconst app = express();\napp.get('/', (req, res) => res.send('Hello World'));\napp.listen(3000, () => console.log('Running on :3000'));`,
    'package.json': `{\n  "name": "node-app",\n  "scripts": { "start": "node index.js" },\n  "dependencies": { "express": "^4.18.0" }\n}`,
  },
  blank: { 'index.js': '// Start coding here\n' },
};

export async function executeCanvasTool(toolName, input, ctx = {}) {
  // ctx.projectFiles is the mutable in-memory project file map { path: content }
  const project = ctx.projectFiles || {};

  try {
    switch (toolName) {
      case 'canvas_read_file': {
        const content = project[input.path];
        if (content === undefined) return { result: JSON.stringify({ status: 'error', error: `File not found: ${input.path}` }) };
        return { result: JSON.stringify({ status: 'success', path: input.path, content }) };
      }

      case 'canvas_write_file': {
        project[input.path] = input.content;
        return {
          result: JSON.stringify({ status: 'success', path: input.path, size: input.content.length }),
          sideEffects: { type: 'file_write', path: input.path, content: input.content },
        };
      }

      case 'canvas_list_files': {
        const files = Object.keys(project).map(p => ({ path: p, size: project[p]?.length || 0 }));
        return { result: JSON.stringify({ status: 'success', files, count: files.length }) };
      }

      case 'canvas_delete_file': {
        if (!(input.path in project)) return { result: JSON.stringify({ status: 'error', error: `File not found: ${input.path}` }) };
        delete project[input.path];
        return { result: JSON.stringify({ status: 'success', deleted: input.path }) };
      }

      case 'canvas_rename_file': {
        if (!(input.old_path in project)) return { result: JSON.stringify({ status: 'error', error: `File not found: ${input.old_path}` }) };
        project[input.new_path] = project[input.old_path];
        delete project[input.old_path];
        return { result: JSON.stringify({ status: 'success', old_path: input.old_path, new_path: input.new_path }) };
      }

      case 'canvas_get_state': {
        const files = Object.keys(project);
        const activeFile = files[0] || null;
        const ext        = activeFile ? activeFile.split('.').pop() : 'js';
        const langMap    = { js:'javascript', ts:'typescript', jsx:'javascript', tsx:'typescript', py:'python', css:'css', html:'html', json:'json', md:'markdown' };
        return { result: JSON.stringify({
          status: 'success',
          file_count: files.length,
          files,
          active_file: activeFile,
          language: langMap[ext] || ext,
        }) };
      }

      case 'canvas_switch_file': {
        if (!(input.path in project)) return { result: JSON.stringify({ status: 'error', error: `File not found: ${input.path}` }) };
        return {
          result: JSON.stringify({ status: 'success', active_file: input.path }),
          sideEffects: { type: 'switch_file', path: input.path },
        };
      }

      case 'canvas_create_project': {
        const tpl   = TEMPLATES[input.template || 'blank'] || TEMPLATES.blank;
        const files = input.files || tpl;
        for (const [p, content] of Object.entries(files)) {
          project[p] = content;
        }
        const fileList = Object.keys(files);
        return {
          result: JSON.stringify({ status: 'success', project: input.name, files: fileList, count: fileList.length }),
          sideEffects: { type: 'project_created', name: input.name, files },
        };
      }

      default:
        return { result: JSON.stringify({ status: 'error', error: `Unknown canvas tool: ${toolName}` }) };
    }
  } catch (err) {
    return { result: JSON.stringify({ status: 'error', error: err.message, tool: toolName }) };
  }
}

export const isCanvasTool = (name) => CANVAS_TOOL_DEFINITIONS.some(t => t.name === name);
