# Backend Services – Complete Service Layer

## Overview
`backend/services/` contains **40+ business logic services** used by canvas-app, API routes, and other services.

## Export File
`backend/services/index.js` exports all services for convenient importing.

## Canvas-App Usage

Canvas-app can import any service it needs:

```javascript
// Import from centralized index
import { 
  buildService, 
  videoEditorService, 
  orchestrator,
  codeGenerationAgent,
  databaseService,
  gitService 
} from '../../backend/services/index.js';

// OR import directly
import buildService from '../../backend/services/buildService.js';
```

## Service Categories

### Core Orchestration (2)
- `orchestrator.js` - Main agent orchestration engine
- `agentCollectionHub.js` - Agent collection management

### Canvas IDE Services (6)
- `buildService.js` - Build pipeline orchestration
- `terminalService.js` - Sandboxed terminal execution
- `editorBridge.js` - Editor state sync & management
- `deploymentService.js` - Multi-platform deployment
- `projectBundler.js` - Project bundling & packaging
- `gitService.js` - Git operations

### Video & Media (4)
- `videoEditorService.js` - AI video editor orchestration
- `videoGenerationService.js` - Video generation (RunwayML, etc)
- `mediaService.js` - Media processing
- `speechService.js` - Text-to-speech

### Database & Storage (5)
- `databaseService.js` - Database schema & queries
- `canvasFileManager.js` - Canvas project file management
- `canvasS3FilesService.js` - S3 storage operations
- `assetService.js` - Asset management
- `sandboxService.js` - Sandbox environment management

### AI & LLM (5)
- `aiProviderService.js` - LLM provider (Claude, GPT, Gemini)
- `aiServices.js` - AI utility functions
- `langgraphService.js` - LangGraph integration
- `langchainService.js` - LangChain integration
- `ragEngine.js` - RAG (Retrieval Augmented Generation)

### Canvas Apps & Monitoring (2)
- `canvasAppsService.js` - Canvas apps registry & management
- `monitoringService.js` - Performance & health monitoring

### Agents – Specialized AI Workers (9)
These are autonomous AI agents for specific tasks:
- `codeGenerationAgent.js` - Generate code from description
- `refactorAgent.js` - Refactor existing code
- `debugAgent.js` - Find & fix bugs
- `testAgent.js` - Generate tests
- `buildAgent.js` - Handle builds & compilation
- `deployAgent.js` - Deploy to platforms
- `documentationAgent.js` - Generate documentation
- `filesystemAgent.js` - File system operations
- `uiAgent.js` - UI/UX improvements

### Utilities & Infrastructure (9)
- `codeExecutionService.js` - Execute code safely
- `sandboxLoader.js` - Load sandbox environment
- `agentService.js` - Agent lifecycle management
- `permissionSystem.js` - Access control
- `pluginSdk.js` - Plugin development SDK
- `emailService.js` - Email sending
- `subscriptionCron.js` - Subscription management cron

## Usage Pattern

### From Canvas-App
```typescript
// hooks/useBuild.ts
import { buildService } from '../../backend/services/index.js';

export function useBuild() {
  const triggerBuild = async (projectId: string) => {
    const result = await buildService.startBuild({ projectId, files: {...} });
    return result;
  };
}
```

### From API Routes
```javascript
// routes/canvas-routes.js
import { orchestrator, buildService, videoEditorService } from '../services/index.js';

router.post('/canvas/agent-stream', async (req, res) => {
  const result = await orchestrator.execute({
    prompt: req.body.prompt,
    context: req.body.context,
    tools: [buildService, videoEditorService, /* ... */]
  });
});
```

### From Other Services
```javascript
// services/deploymentService.js
import { gitService, buildService } from './index.js';

export async function deploy(project) {
  await buildService.startBuild(project);
  await gitService.commit(`Deploy: ${project.name}`);
}
```

## Service Boundaries

| Service | Exports | Used By |
|---------|---------|---------|
| `buildService` | `startBuild()`, `getStatus()` | canvas-app, routes |
| `orchestrator` | `execute()`, `plan()` | routes, agents |
| `videoEditorService` | `upload()`, `plan()`, `execute()` | canvas-app, routes |
| `databaseService` | `query()`, `migrate()` | routes, services |
| `aiProviderService` | `generateCode()`, `chat()` | routes, agents |
| `gitService` | `clone()`, `commit()`, `push()` | buildService, deploymentService |

## Adding New Services

1. Create `backend/services/newService.js`
2. Export from `backend/services/index.js`
3. Import in canvas-app or routes:
   ```javascript
   import { newService } from '../../backend/services/index.js';
   ```

## Architecture

```
backend/services/ (40+)
├── orchestrator.js (main entry point for canvas AI)
├── agents/ (9 autonomous AI workers)
├── canvas-specific/ (6 IDE services)
├── video-media/ (4 video/media services)
├── database-storage/ (5 database/storage services)
├── ai-llm/ (5 AI/LLM services)
└── utilities/ (9 utility services)

canvas-app/
├── hooks/ (useBuild, useEditor, useTerminal, useVideoEditor)
│   └── import from backend/services/index.js
├── components/
│   └── import from backend/services/index.js
└── stores/
    └── import from backend/services/index.js
```

## Current Canvas-App Usage
Canvas-app currently uses:
- ✅ buildService
- ✅ editorBridge
- ✅ terminalService
- ✅ videoEditorService

Can now use:
- 🔓 All 40 other services (orchestrator, agents, etc)

## Next Steps
Canvas-app can now:
1. Use agent services directly (codeGeneration, refactor, debug)
2. Access database service for project persistence
3. Use RAG engine for code context
4. Access git service for version control
5. Use deployment service within the IDE
6. And much more...
