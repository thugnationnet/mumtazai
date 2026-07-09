# Canvas Studio — Documentation

> AI-powered web app builder with real-time code generation, live preview, and deployment.

**Version:** 5.2.0  
**Last Updated:** February 20, 2026  
**Status:** Production Ready 🚀 · Phase 8 Agentic IDE ✅ · 268 Backend Tools (39 Categories) ✅ · 21 Languages ✅ · Dual-Path Architecture (JSON Agent + SSE Stream) ✅ · Image Processing (30 Filters) ✅ · Video Processing (11 Tools) ✅ · Archive Processing (9 Tools) ✅ · Backend Processing (11 Tools) ✅ · Cloud Sandbox (AWS ECS Fargate) ✅ · S3 Signed URLs ✅ · Azure AI Vision ✅ · Speech (OpenAI TTS) ✅ · Video Generation (fal.ai) ✅ · AES-256-GCM Credentials ✅

---

## Table of Contents

- [What It Is](#what-it-is)
- [Architecture](#architecture)
- [SSE Event Protocol](#sse-event-protocol)
- [Components](#components)
- [Hooks](#hooks)
- [Services](#services)
- [Tech Stack](#tech-stack)
- [AI Engine](#ai-engine)
- [Multi-Language Support](#multi-language-support)
- [Key Features](#key-features)
- [File Structure](#file-structure)
- [Backend Tools Headquarters](#backend-tools-headquarters)
- [What's Done](#whats-done)
- [What's Next](#whats-next)

---

## What It Is

Canvas Studio is a browser-based AI app builder. Users describe what they want in natural language, and the AI generates full working code — HTML, CSS, JavaScript, React, Python, and more. It features:

- **Live preview** with device frames (desktop, tablet, mobile) + **Cloud Preview** via AWS ECS Fargate sandboxes
- **Real-time collaboration** via WebSocket server (cursor sync, file change broadcasting, collaborator presence)
- **Sandpack runtime** for in-browser code execution (React, HTML, Python)
- **Dual-path architecture** — JSON agent for tool execution + SSE stream for real-time generation
- **268 backend tools** across 39 categories with native Anthropic tool calling
- **One-click deployment** to cloud providers
- **Speech** via OpenAI TTS + browser fallback
- **Video generation** via fal.ai Minimax
- **AES-256-GCM encrypted** credential storage

---

## Architecture

Canvas Studio uses a **dual-path architecture** — two distinct communication patterns between frontend and backend:

### Path 1: JSON Agent (Primary)

```
User prompt → POST /api/canvas/agent (JSON request/response)
  → useAgent.ts sends { prompt, files, conversationHistory, userId, model }
  → Backend runs tool loop with ALL_TOOLS from toolsHeadquarters.js
  → Returns actions array: file writes, tool results, messages
  → useAgent.ts dispatches 24+ action types to update state
  → useEditorBridge applies file changes to editor state
```

### Path 2: SSE Stream (Real-Time Generation)

```
User prompt → POST /api/canvas/stream (SSE streaming)
  → Anthropic Claude Sonnet 4 with native tool_use
  → Backend defines tools → Model chooses → Backend executes
  → SSE events stream to frontend in real-time
  → React state updates files via useEditorBridge
  → Sandpack preview auto-refreshes
```

### Backend Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/canvas/agent` | JSON agent — tool calling with action dispatch |
| POST | `/api/canvas/stream` | SSE stream — real-time generation with tool events |
| POST | `/api/canvas/generate` | Legacy generation endpoint |
| POST | `/api/canvas/detect-intent` | Intent detection for prompt routing |
| POST | `/api/canvas/chat` | Simple chat (no tools) |
| POST | `/api/canvas/exec` | Execute commands in project sandbox |
| GET | `/api/canvas/health` | Health check |

**State Management:** React `useState`/`useRef` hooks (no external store). User ID persisted in `localStorage`.

---

## SSE Event Protocol

The frontend sends `POST /api/canvas/stream` and receives SSE events:

| Event Type | Fields | Description |
|---|---|---|
| `status` | `message` | Progress updates ("Analyzing...", "Writing files...") |
| `text` | `content` | Streaming assistant text (markdown) |
| `tool_start` | `tool`, `input` | Tool invocation begins |
| `tool_result` | `tool`, `success`, `summary` | Tool execution result |
| `file_write` | `path`, `content` | File written by agent |
| `file_delete` | `path` | File deleted by agent |
| `command_output` | `content` | Shell command output |
| `image_result` | `type`, `width`, `height`, `format`, `imageUrl` | Image tool result (signed S3 URL) |
| `video_result` | `type`, `videoUrl`, `videoUrls`, `thumbnailUrl`, `duration`, `width`, `height`, `format` | Video tool result (S3 signed URL) |
| `archive_result` | `type`, `archiveUrl`, `operation`, `format`, `sizeFormatted`, `entryCount` | Archive tool result |
| `backend_result` | `type`, `operation`, `action`, `fileCount`, `files`, `message` | Backend code generation result |
| `code_result` | `type`, `output` | Code execution result |
| `done` | `projectFiles`, `summary` | Generation complete with final file state |
| `error` | `error` | Error message |

---

## Components

**21 component files** | **8,323 total lines**

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| **Preview** | `Preview.tsx` | 1,018 | Sandpack-based live preview — HTML, React/JSX/TSX, Python execution. Sub-components: SandpackEditor, CodeExecutionPreview. Device frames (desktop/tablet/mobile) |
| **DeployPanel** | `DeployPanel.tsx` | 882 | Full deploy workflow — Vercel/Netlify/GitHub Pages/custom, environment config, build settings, deploy history |
| **VideoPanel** | `VideoPanel.tsx` | 775 | AI video generation panel — prompt-based video creation, preview, download via fal.ai |
| **Dashboard** | `Dashboard.tsx` | 649 | Analytics dashboard — project stats, usage metrics, recent activity, charts |
| **ChatBox** | `ChatBox.tsx` | 532 | AI chat interface — message list, streaming text, tool event bubbles, session management, language selector, hljs code highlighting |
| **ProjectExplorer** | `ProjectExplorer.tsx` | 515 | VS Code-style file tree browser with FileTreeItem sub-component, drag & drop, context menus |
| **CloudPreview** | `CloudPreview.tsx` | 438 | AWS ECS Sandbox preview — real npm/build/dev-server execution via sandboxService |
| **CredentialsPanel** | `CredentialsPanel.tsx` | 417 | Deploy credential management with AES-256-GCM encryption — GitHub, Vercel, Netlify, AWS tokens |
| **CollaborationPanel** | `CollaborationPanel.tsx` | 326 | Real-time collaboration UI — collaborator list, invite, permissions |
| **AssetsPanel** | `AssetsPanel.tsx` | 236 | Asset management — upload, browse, organize project assets |
| **DatabasePanel** | `DatabasePanel.tsx` | 217 | Database management — create/browse databases, connection info |
| **CodeView** | `CodeView.tsx` | 209 | CodeMirror 6 editor — 21 language syntax highlighting, One Dark theme, multi-file tabs |
| **BillingPanel** | `BillingPanel.tsx` | 199 | Stripe checkout & subscription management |
| **BuildPanel** | `BuildPanel.tsx` | 168 | Build log viewer — build output and status |
| **AIPanel** | `AIPanel.tsx` | 155 | AI code analysis panel — error analysis, test generation, refactoring |
| **Overlay** | `Overlay.tsx` | 98 | Animated splash screen on app launch |
| **ErrorBoundary** | `ErrorBoundary.tsx` | 92 | React error boundary with fallback UI |
| **CollaboratorsBar** | `CollaboratorsBar.tsx` | 64 | Compact avatar bar showing active collaborators |
| **ProjectPanel** | `ProjectPanel.tsx` | 59 | Simple project metadata panel (name, description) |
| **AutoSaveIndicator** | `AutoSaveIndicator.tsx` | 43 | Status badge showing auto-save state (idle/saving/saved/error) |

---

## Hooks

**5 hook files** | **1,346 total lines**

| Hook | File | Lines | Purpose |
|------|------|-------|---------|
| **useAgent** | `useAgent.ts` | 743 | Agent brain — resolves async tool sentinels, routes tool calls to backend endpoints, orchestrates multi-tool execution, handles tool results, dispatches 24+ action types |
| **useGeneration** | `useGeneration.ts` | 290 | Generation orchestration — SSE streaming, conversation mode, build requirements gathering, model selection |
| **useEditorBridge** | `useEditorBridge.ts` | 123 | In-memory virtual file system — Map of files, open/close/active file tracking, cursor position |
| **useAutoSave** | `useAutoSave.ts` | 117 | Debounced auto-save — saves project files to `/api/workspace/projects/:slug/save` with 2s debounce |
| **useCollaboration** | `useCollaboration.ts` | 73 | WebSocket collaboration — collaborator presence, cursor sync, file change broadcasting |

---

## Services

**1 service file** | **343 total lines**

| Service | File | Lines | Purpose |
|---------|------|-------|---------|
| **SandboxService** | `sandboxService.ts` | 343 | AWS ECS Fargate sandbox client — `SandboxService` class manages sandbox sessions (start/stop), file sync, command execution, build, dev server, WebSocket output streaming. Endpoints: `/api/sandbox/*` |

**Note:** Additional services (`editorBridge`, `toolRegistry`, `cloudDeploy`, `speechService`, `workspaceService`, `collaborationService`) are imported from `@shared/api` rather than being local to canvas-studio.

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React + TypeScript | 19.0.0 | UI framework |
| **Bundler** | Vite | 6.2.0 | Dev server & build |
| **Code Editor** | CodeMirror 6 + One Dark | 6.0.2+ | 21-language syntax highlighting |
| **Runtime** | Sandpack (CodeSandbox) | 2.20.0 | In-browser code execution |
| **Cloud Runtime** | AWS ECS Fargate | — | Real server execution (npm install, build, run) |
| **Collaboration** | WebSocket + Yjs | 13.6.29 | Real-time collaboration via `/ws/collab` WebSocket server |
| **AI** | Anthropic Claude (via backend) | — | Code generation with native tool_use |
| **Speech** | OpenAI TTS + Web Speech API | — | Text-to-speech (voice: nova) |
| **Video Gen** | fal.ai Minimax | — | AI video generation |
| **Icons** | Lucide React | 0.400.0 | UI icons |
| **Compression** | JSZip, lz-string | 3.10.1 | Project export |
| **Syntax** | highlight.js | 11.10.0 | Chat code block rendering |

### Full Dependencies (package.json)

| Package | Version |
|---------|---------|
| `react` | ^19.0.0 |
| `react-dom` | ^19.0.0 |
| `codemirror` | ^6.0.2 |
| `@codemirror/view` | ^6.39.13 |
| `@codemirror/state` | ^6.5.4 |
| `@codemirror/autocomplete` | ^6.20.0 |
| `@codemirror/commands` | ^6.10.2 |
| `@codemirror/search` | ^6.6.0 |
| `@codemirror/theme-one-dark` | ^6.1.3 |
| `@codemirror/lang-javascript` | ^6.2.4 |
| `@codemirror/lang-html` | ^6.4.11 |
| `@codemirror/lang-css` | ^6.3.1 |
| `@codemirror/lang-python` | ^6.2.1 |
| `@codemirror/lang-php` | ^6.0.2 |
| `@codemirror/lang-go` | ^6.0.1 |
| `@codemirror/lang-java` | ^6.0.2 |
| `@codemirror/lang-cpp` | ^6.0.3 |
| `@codemirror/lang-rust` | ^6.0.2 |
| `@codemirror/lang-sql` | ^6.10.0 |
| `@codemirror/lang-markdown` | ^6.5.0 |
| `@codemirror/legacy-modes` | ^6.5.2 |
| `@lezer/highlight` | ^1.2.3 |
| `@codesandbox/sandpack-client` | ^2.19.8 |
| `@codesandbox/sandpack-react` | ^2.20.0 |
| `@codesandbox/sandpack-themes` | ^2.0.21 |
| `@google/genai` | ^1.34.0 |
| `highlight.js` | ^11.10.0 |
| `jszip` | ^3.10.1 |
| `lucide-react` | ^0.400.0 |
| `lz-string` | ^1.5.0 |
| `y-protocols` | ^1.0.7 |
| `y-websocket` | ^3.0.0 |
| `yjs` | ^13.6.29 |

**Dev:** `vite` ^6.2.0, `@vitejs/plugin-react` ^5.0.0, `typescript` ~5.8.2

---

## AI Engine

### Dual-Path Architecture

| Path | Endpoint | Hook | Protocol | Use Case |
|------|----------|------|----------|----------|
| **JSON Agent** | `/api/canvas/agent` | `useAgent.ts` | JSON POST/response | Tool execution, file operations |
| **SSE Stream** | `/api/canvas/stream` | `useGeneration.ts` | Server-Sent Events | Real-time generation, streaming text |

### Models Available

| Provider | Models |
|----------|--------|
| **Anthropic** | Claude Sonnet 4 (default), Claude Opus 4 (thinking mode), Claude Haiku |
| **Mistral** | Mistral Large (`mistral-large-2501`), Codestral (`codestral-latest`) |
| **xAI** | Grok 3, Grok 3 Mini |

### Tool System

Backend **Tools Headquarters** (toolsHeadquarters.js) provides **268 unique tools across 39 categories**:

| Version | Categories | Tools |
|---------|-----------|-------|
| **Core** | File System, Canvas, Image, Video, Archive, Backend, Code, Editor, Agent Control, Agent Memory, Agent Safety, Agent UI | ~80 |
| **V2** | Core Utility, Document Parsing, Developer, Web Frontend, Database, API Integration, AI/ML, Security, Content Markdown, Analytics, File System | ~55 |
| **V3** | Deployment Docker, Communication, Data Processing, Testing QA, Cloud Infrastructure, Workflow Automation, Collaboration | ~46 |
| **V4** | Workflow Orchestration, Knowledge Graph, Business Growth, Team Collaboration, Advanced AI, Data Science, Geo Location, Cloud Control, Advanced Security | ~46 |
| **Total** | **39 categories** | **268 tools** |

---

## Multi-Language Support

**21 languages** with full CodeMirror 6 syntax highlighting:

| Language | CM6 Package | Extensions |
|----------|------------|------------|
| JavaScript | `lang-javascript` | .js, .jsx, .mjs |
| TypeScript | `lang-javascript` (ts) | .ts, .tsx |
| HTML | `lang-html` | .html, .htm |
| CSS/SCSS | `lang-css` | .css, .scss, .less |
| Python | `lang-python` | .py |
| PHP | `lang-php` | .php |
| Go | `lang-go` | .go |
| Java | `lang-java` | .java |
| C/C++ | `lang-cpp` | .c, .h, .cpp, .cc, .cxx, .hpp |
| Rust | `lang-rust` | .rs |
| SQL | `lang-sql` | .sql |
| Markdown | `lang-markdown` | .md |
| JSON | auto-detected | .json |
| YAML | auto-detected | .yml, .yaml |
| C# | `legacy-modes/clike` | .cs |
| Kotlin | `legacy-modes/clike` | .kt, .kts |
| Shell/Bash | `legacy-modes/shell` | .sh, .bash, .zsh |
| Ruby | `legacy-modes/ruby` | .rb |
| Swift | `legacy-modes/swift` | .swift |
| XML | auto-detected | .xml |
| TOML | auto-detected | .toml |

---

## Key Features

- **SSE Streaming** — Real-time token-by-token AI responses with 14 event types
- **Dual-Path Agent** — JSON agent (useAgent) + SSE stream (useGeneration)
- **Sandpack Preview** — In-browser hot-reload preview for React/HTML/Python
- **Cloud Sandbox** — AWS ECS Fargate for real npm install, build, run
- **VS Code File Explorer** — Drag & drop, context menus, nested folders
- **CodeMirror 6** — 21 languages, One Dark theme, multi-file tabs
- **Video Generation** — fal.ai Minimax video creation panel
- **Collaboration** — Yjs CRDT packages installed (connection ready for premium)
- **Auto-Save** — 2-second debounced project persistence
- **Cloud Deploy** — Vercel, Netlify, GitHub Pages, custom deployment
- **Credential Encryption** — AES-256-GCM server-side for deploy tokens
- **AI Code Analysis** — Error detection, test generation, refactoring
- **268 Backend Tools** — 39 categories accessible via tool calling
- **ZIP Export** — JSZip project export for download
- **Speech** — OpenAI TTS with browser fallback

---

## File Structure

```
frontend/canvas-studio/                  (~15,074 lines source)
├── App.tsx                         3,127 lines — Main app (18 panels, dual-path agent)
├── constants.ts                    1,421 lines — Templates, presets, constants
├── types.ts                          396 lines — TypeScript type definitions
├── index.tsx                          19 lines — React entry point
├── index.html                        138 lines — HTML shell
├── highlight-theme.css               118 lines — Syntax highlighting theme
├── nginx-canvas-hosting.conf         221 lines — Nginx hosting config
├── vite.config.ts                     30 lines — Vite config (base: /canvas-studio/)
├── tsconfig.json                      31 lines — TypeScript config
├── package.json                       53 lines — Dependencies
├── metadata.json                       7 lines — App metadata
│
├── components/                      (8,323 lines — 21 files)
│   ├── Preview.tsx                    1,018 — Sandpack live preview + device frames
│   ├── DeployPanel.tsx                  882 — Multi-provider deployment workflow
│   ├── VideoPanel.tsx                   775 — AI video generation (fal.ai)
│   ├── Dashboard.tsx                    649 — Analytics dashboard
│   ├── ChatBox.tsx                      532 — AI chat + tool event bubbles
│   ├── ProjectExplorer.tsx              515 — VS Code-style file tree
│   ├── CloudPreview.tsx                 438 — AWS ECS sandbox preview
│   ├── CredentialsPanel.tsx             417 — AES-256-GCM token management
│   ├── CollaborationPanel.tsx           326 — Real-time collaboration UI
│   ├── AssetsPanel.tsx                  236 — Asset management
│   ├── DatabasePanel.tsx                217 — Database management
│   ├── CodeView.tsx                     209 — CodeMirror 6 (21 languages)
│   ├── BillingPanel.tsx                 199 — Stripe billing
│   ├── BuildPanel.tsx                   168 — Build log viewer
│   ├── AIPanel.tsx                      155 — AI code analysis
│   ├── Overlay.tsx                       98 — Splash screen
│   ├── ErrorBoundary.tsx                 92 — Error boundary
│   ├── CollaboratorsBar.tsx              64 — Active collaborators bar
│   ├── ProjectPanel.tsx                  59 — Project metadata
│   └── AutoSaveIndicator.tsx             43 — Auto-save status
│
├── hooks/                           (1,346 lines — 5 files)
│   ├── useAgent.ts                     743 — JSON agent orchestration
│   ├── useGeneration.ts                290 — SSE streaming generation
│   ├── useEditorBridge.ts              123 — Virtual file system hook
│   ├── useAutoSave.ts                  117 — Debounced auto-save
│   └── useCollaboration.ts              73 — WebSocket collaboration
│
├── services/                          (343 lines — 1 file)
│   └── sandboxService.ts               343 — AWS ECS sandbox client
│
└── public/
    ├── logo.png
    ├── logo.svg
    └── mumtazai-logo.jpg
```

---

## Backend Tools Headquarters

The shared backend at `/backend/services/toolsHeadquarters.js` (828 lines) merges **268 unique tools from 39 categories**. All canvas apps share this same tool system.

### Tool Categories (39)

| # | Category | Module | Tools |
|---|----------|--------|-------|
| 1 | Core (File, Git, Terminal, HTTP) | tools.js (3,273 lines) | ~55 |
| 2 | Canvas (Workspace, Project) | canvasTools.js (1,045) | 15 |
| 3 | Image Processing | imageTools.js (1,129) | 10 |
| 4 | Video Processing | videoTools.js (873) | 11 |
| 5 | Archive Processing | archiveTools.js (687) | 9 |
| 6 | Backend Generation | backendTools.js (685) | 11 |
| 7 | Code Execution | codeTools.js (324) | 4 |
| 8 | Editor Tools | editorTools.js (447) | 6 |
| 9 | Agent Control | agentControlTools.js (537) | 4 |
| 10 | Agent Memory | agentMemoryTools.js (223) | 4 |
| 11 | Agent Safety | agentSafetyTools.js (341) | 3 |
| 12 | Agent UI | agentUITools.js (347) | 4 |
| 13 | Core Utility | coreUtilityTools.js (323) | 5 |
| 14 | Document Parsing | documentParsingTools.js (763) | 7 |
| 15 | Developer Tools | devTools.js (803) | 8 |
| 16 | Web Frontend | webFrontendTools.js (1,090) | 7 |
| 17 | Database | databaseTools.js (558) | 6 |
| 18 | API Integration | apiTools.js (706) | 7 |
| 19 | AI/ML | aiMlTools.js (499) | 5 |
| 20 | Security | securityTools.js (555) | 6 |
| 21 | Content Markdown | contentMarkdownTools.js (587) | 5 |
| 22 | Analytics | analyticsTools.js (563) | 5 |
| 23 | File System | fileSystemTools.js (296) | 2 |
| 24 | Deployment Docker | deploymentDockerTools.js (931) | 5 |
| 25 | Communication | communicationTools.js (595) | 4 |
| 26 | Data Processing | dataProcessingTools.js (853) | 5 |
| 27 | Testing QA | testingQATools.js (793) | 5 |
| 28 | Cloud Infrastructure | cloudInfraTools.js (707) | 5 |
| 29 | Workflow Automation | workflowAutomationTools.js (960) | 5 |
| 30 | Collaboration | collaborationTools.js (732) | 5 |
| 31 | Workflow Orchestration | workflowOrchestratorTools.js (888) | 5 |
| 32 | Knowledge Graph | knowledgeGraphTools.js (1,055) | 5 |
| 33 | Business Growth | businessGrowthTools.js (1,145) | 6 |
| 34 | Team Collaboration | teamCollaborationTools.js (848) | 5 |
| 35 | Advanced AI | advancedAITools.js (1,300) | 7 |
| 36 | Data Science | dataScienceTools.js (933) | 5 |
| 37 | Geo Location | geoLocationTools.js (701) | 4 |
| 38 | Cloud Control | cloudControlTools.js (1,037) | 5 |
| 39 | Advanced Security | advancedSecurityTools.js (1,008) | 4 |

### Database Models (Prisma — 3,048 lines, 89 models)

The backend uses PostgreSQL via Prisma ORM with 89 models covering: User management, credits/billing, chat sessions, projects, deployments, hosted apps, credentials, admin analytics, agent state/memory, assets, video generation, Docker builds, CI/CD pipelines, data processing, testing, cloud infrastructure, workflows, knowledge graphs, business growth, team collaboration, AI operations, data science, geo records, and security.

---

## Project Templates (6)

Built-in multi-file project templates in `constants.ts`:

| Template | Description |
|----------|-------------|
| Python Flask API | REST API with Flask |
| React TypeScript App | React + TS starter |
| Node.js Express API | Express REST API |
| HTML Landing Page | Single-page HTML/CSS/JS |
| Next.js Full Stack | Next.js with API routes |
| MERN Full Stack | MongoDB + Express + React + Node |

---

## What's Done

| Phase | Status | Description |
|-------|--------|-------------|
| Core UI | Done | React UI, CodeMirror 6, Sandpack, 21 components |
| Dual-Path Agent | Done | JSON agent + SSE streaming, 268 backend tools |
| Cloud Sandbox | Done | AWS ECS Fargate with WebSocket streaming |
| Image Processing | Done | 30 filters via Sharp, S3 signed URLs |
| Video Processing | Done | 11 FFmpeg tools, fal.ai generation panel |
| Archive Processing | Done | 9 tools (create, extract, edit, inspect, security) |
| Backend Processing | Done | 11 tools (API, auth, rate limit, webhooks, jobs) |
| Collaboration | Done | Yjs CRDTs installed, connection ready |
| Deploy | Done | Vercel, Netlify, GitHub Pages, custom |
| Credentials | Done | AES-256-GCM encrypted storage |
| Auto-Save | Done | 2-second debounced persistence |
| Speech | Done | OpenAI TTS with browser fallback |
| V4 Tools | Done | 9 new categories, 46 tools (business, AI, data science, etc.) |

---

## What's Next

- [x] WebSocket collaboration (cursor sync, file changes, collaborator presence)
- [ ] Full Yjs CRDT document sync (planned enhancement)
- [ ] Monaco Editor integration (alternative to CodeMirror)
- [ ] Terminal emulator (xterm.js)
- [ ] Git panel
- [ ] More project templates
- [ ] Plugin/extension system

---

> **Canvas Studio — Build anything. Ship everywhere.**
