/**
 * useCanvasAgent Hook
 *
 * Provides canvas project utilities:
 * - Apply file operations (create/edit/delete/rename)
 * - Build validation (client-side checks + server-side)
 * - Deploy to any provider
 * - Auto-fix build errors
 * - Generate project scaffolding
 * - Extract files from HTML
 *
 * NOTE: Tool calling is now handled server-side by /api/canvas/agent-stream.
 * This hook no longer parses agent responses — the backend executes tools
 * and streams structured results directly to the frontend.
 */
'use client';

import { useState, useCallback, useRef } from 'react';
import type {
  ProjectFile,
  ProjectPage,
  BuildInfo,
  BuildError,
  DeploymentInfo,
  AgentAction,
  AgentFileOp,
  AgentDeployCommand,
  ProjectFramework,
  DeployProvider,
} from '../types/canvas-types';
import { getFileLanguage } from '../types/canvas-types';

// =============================================================================
// HOOK
// =============================================================================

interface UseCanvasAgentOptions {
  agentId?: string;
  agentName?: string;
  onFilesChanged?: (files: ProjectFile[]) => void;
  onPagesChanged?: (pages: ProjectPage[]) => void;
  onBuildStart?: () => void;
  onBuildComplete?: (result: BuildInfo) => void;
  onDeployStart?: (provider: DeployProvider) => void;
  onDeployComplete?: (result: DeploymentInfo) => void;
  onPreviewUpdate?: (html: string) => void;
}

interface UseCanvasAgentResult {
  // State
  isProcessing: boolean;
  lastActions: AgentAction[];
  currentBuild: BuildInfo | null;
  currentDeployment: DeploymentInfo | null;

  // Methods
  applyFileOps: (
    ops: AgentFileOp[],
    existingFiles: ProjectFile[]
  ) => ProjectFile[];
  validateBuild: (
    files: ProjectFile[],
    framework: ProjectFramework
  ) => Promise<BuildInfo>;
  requestDeploy: (
    config: AgentDeployCommand,
    files: ProjectFile[],
    credentials: Record<string, string>
  ) => Promise<DeploymentInfo>;
  autoFixErrors: (
    errors: BuildError[],
    files: ProjectFile[]
  ) => Promise<{ fixedFiles: ProjectFile[]; remainingErrors: BuildError[] }>;

  // Utils
  generateProjectStructure: (
    framework: ProjectFramework,
    name: string
  ) => ProjectFile[];
  extractFilesFromHtml: (html: string) => ProjectFile[];
  abort: () => void;
}

export function useCanvasAgent(
  options: UseCanvasAgentOptions = {}
): UseCanvasAgentResult {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastActions, setLastActions] = useState<AgentAction[]>([]);
  const [currentBuild, setCurrentBuild] = useState<BuildInfo | null>(null);
  const [currentDeployment, setCurrentDeployment] =
    useState<DeploymentInfo | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Apply file operations to existing files
  const applyFileOps = useCallback(
    (ops: AgentFileOp[], existingFiles: ProjectFile[]): ProjectFile[] => {
      let files = [...existingFiles];
      const now = Date.now();

      for (const op of ops) {
        switch (op.action) {
          case 'create': {
            const existingIdx = files.findIndex((f) => f.path === op.path);
            const newFile: ProjectFile = {
              id: `file-${now}-${Math.random().toString(36).slice(2, 8)}`,
              name: op.path.split('/').pop() || 'untitled',
              path: op.path,
              language: op.language || getFileLanguage(op.path),
              content: op.content || '',
              size: new Blob([op.content || '']).size,
              isEntryPoint:
                op.path === '/index.html' ||
                op.path === '/src/main.tsx' ||
                op.path === '/src/App.tsx',
              createdAt: now,
              updatedAt: now,
            };
            if (existingIdx >= 0) {
              // Overwrite existing file
              files[existingIdx] = {
                ...newFile,
                id: files[existingIdx].id,
                createdAt: files[existingIdx].createdAt,
              };
            } else {
              files.push(newFile);
            }
            break;
          }
          case 'edit': {
            files = files.map((f) =>
              f.path === op.path
                ? {
                    ...f,
                    content: op.content || f.content,
                    size: new Blob([op.content || f.content]).size,
                    updatedAt: now,
                    isModified: true,
                  }
                : f
            );
            break;
          }
          case 'delete': {
            files = files.filter((f) => f.path !== op.path);
            break;
          }
          case 'rename': {
            files = files.map((f) =>
              f.path === op.path
                ? {
                    ...f,
                    path: op.newPath || f.path,
                    name: (op.newPath || f.path).split('/').pop() || f.name,
                    updatedAt: now,
                  }
                : f
            );
            break;
          }
        }
      }

      return files;
    },
    []
  );

  // Validate build (client-side checks + optional server validation)
  const validateBuild = useCallback(
    async (
      files: ProjectFile[],
      framework: ProjectFramework
    ): Promise<BuildInfo> => {
      setIsProcessing(true);
      const build: BuildInfo = {
        id: `build-${Date.now()}`,
        status: 'validating',
        version: 1,
        startedAt: Date.now(),
        logs: ['🔍 Validating project...'],
        errors: [],
        warnings: [],
      };
      setCurrentBuild(build);
      options.onBuildStart?.();

      try {
        const errors: BuildError[] = [];
        const warnings: BuildError[] = [];

        // Check for entry point
        const hasEntryPoint = files.some(
          (f) =>
            f.path === '/index.html' ||
            f.path === '/src/main.tsx' ||
            f.path === '/src/App.tsx' ||
            f.path === '/src/index.tsx'
        );
        if (!hasEntryPoint) {
          errors.push({
            id: `err-${Date.now()}-1`,
            file: '/',
            message:
              'No entry point found. Create an index.html or src/main.tsx file.',
            severity: 'error',
            autoFixable: true,
            suggestion: 'Create a basic index.html entry point',
          });
        }

        // Check HTML files for basic validity
        for (const file of files.filter((f) => f.language === 'html')) {
          if (
            file.content.includes('<html') &&
            !file.content.includes('</html>')
          ) {
            errors.push({
              id: `err-${Date.now()}-${file.id}`,
              file: file.path,
              message: 'Unclosed <html> tag',
              severity: 'error',
              autoFixable: true,
              suggestion: 'Add closing </html> tag',
            });
          }
          if (
            !file.content.includes('<!DOCTYPE') &&
            !file.content.includes('<!doctype')
          ) {
            warnings.push({
              id: `warn-${Date.now()}-${file.id}`,
              file: file.path,
              message: 'Missing <!DOCTYPE html> declaration',
              severity: 'warning',
              autoFixable: true,
              suggestion: 'Add <!DOCTYPE html> at the top',
            });
          }
        }

        // Check for empty files
        for (const file of files) {
          if (!file.content.trim()) {
            warnings.push({
              id: `warn-empty-${file.id}`,
              file: file.path,
              message: `File is empty: ${file.path}`,
              severity: 'warning',
            });
          }
        }

        // Server-side validation (if available)
        try {
          const response = await fetch('/api/canvas/build-validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              files: files.map((f) => ({
                path: f.path,
                content: f.content,
                language: f.language,
              })),
              framework,
              source: 'universal-canvas',
            }),
          });
          if (response.ok) {
            const data = await response.json();
            if (data.errors) errors.push(...data.errors);
            if (data.warnings) warnings.push(...data.warnings);
          }
        } catch {
          // Server validation optional — continue with client-side results
        }

        const result: BuildInfo = {
          ...build,
          status: errors.length > 0 ? 'failed' : 'success',
          completedAt: Date.now(),
          duration: Math.round(
            (Date.now() - (build.startedAt || Date.now())) / 1000
          ),
          errors,
          warnings,
          logs: [
            ...build.logs,
            `📁 ${files.length} files checked`,
            errors.length > 0
              ? `❌ ${errors.length} error(s) found`
              : '✅ No errors',
            warnings.length > 0 ? `⚠️ ${warnings.length} warning(s)` : '',
          ].filter(Boolean),
        };

        setCurrentBuild(result);
        options.onBuildComplete?.(result);
        return result;
      } finally {
        setIsProcessing(false);
      }
    },
    [options]
  );

  // Deploy project
  const requestDeploy = useCallback(
    async (
      config: AgentDeployCommand,
      files: ProjectFile[],
      credentials: Record<string, string>
    ): Promise<DeploymentInfo> => {
      setIsProcessing(true);
      const deployment: DeploymentInfo = {
        id: `deploy-${Date.now()}`,
        provider: config.provider,
        status: 'preparing',
        buildLogs: [],
        deployLogs: ['🚀 Preparing deployment...'],
        errors: [],
        envVars: config.envVars || {},
        startedAt: Date.now(),
      };
      setCurrentDeployment(deployment);
      options.onDeployStart?.(config.provider);

      try {
        const response = await fetch('/api/canvas/deploy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            provider: config.provider,
            projectName: config.projectName,
            credential: credentials[config.provider],
            source: 'universal-canvas',
            files: files.map((f) => ({
              path: f.path,
              content: f.content,
              language: f.language,
            })),
            envVars: config.envVars,
            autoFix: config.autoFix,
          }),
        });

        if (!response.ok) {
          const errData = await response
            .json()
            .catch(() => ({ message: 'Deployment failed' }));
          throw new Error(errData.message || `HTTP ${response.status}`);
        }

        // Handle SSE stream for deployment progress
        if (
          response.headers.get('content-type')?.includes('text/event-stream')
        ) {
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();

          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    if (data.status) {
                      deployment.status = data.status;
                    }
                    if (data.log) {
                      deployment.deployLogs.push(data.log);
                    }
                    if (data.url) {
                      deployment.url = data.url;
                    }
                    if (data.error) {
                      deployment.errors.push({
                        id: `deploy-err-${Date.now()}`,
                        file: data.file || '',
                        message: data.error,
                        severity: 'error',
                      });
                    }
                    setCurrentDeployment({ ...deployment });
                  } catch {
                    // Skip invalid JSON
                  }
                }
              }
            }
          }
        } else {
          // Regular JSON response
          const data = await response.json();
          deployment.status = data.success ? 'live' : 'failed';
          deployment.url = data.url;
          deployment.previewUrl = data.previewUrl;
          deployment.providerProjectId = data.projectId;
          deployment.providerDeployId = data.deploymentId;
          if (data.logs) deployment.deployLogs.push(...data.logs);
          if (data.error) {
            deployment.errors.push({
              id: `deploy-err-${Date.now()}`,
              file: '',
              message: data.error,
              severity: 'error',
            });
            deployment.status = 'failed';
          }
        }

        deployment.completedAt = Date.now();
        setCurrentDeployment({ ...deployment });
        options.onDeployComplete?.(deployment);
        return deployment;
      } catch (error) {
        deployment.status = 'failed';
        deployment.completedAt = Date.now();
        deployment.errors.push({
          id: `deploy-err-${Date.now()}`,
          file: '',
          message: error instanceof Error ? error.message : 'Deployment failed',
          severity: 'error',
        });
        setCurrentDeployment({ ...deployment });
        return deployment;
      } finally {
        setIsProcessing(false);
      }
    },
    [options]
  );

  // Auto-fix build errors using AI
  const autoFixErrors = useCallback(
    async (
      errors: BuildError[],
      files: ProjectFile[]
    ): Promise<{
      fixedFiles: ProjectFile[];
      remainingErrors: BuildError[];
    }> => {
      const fixableErrors = errors.filter((e) => e.autoFixable);
      const nonFixableErrors = errors.filter((e) => !e.autoFixable);
      let fixedFiles = [...files];

      for (const error of fixableErrors) {
        const file = fixedFiles.find((f) => f.path === error.file);
        if (!file) continue;

        // Simple auto-fixes
        if (error.message.includes('Missing <!DOCTYPE html>')) {
          fixedFiles = fixedFiles.map((f) =>
            f.path === error.file
              ? {
                  ...f,
                  content: '<!DOCTYPE html>\n' + f.content,
                  updatedAt: Date.now(),
                }
              : f
          );
          continue;
        }

        if (error.message.includes('Unclosed <html> tag')) {
          fixedFiles = fixedFiles.map((f) =>
            f.path === error.file
              ? {
                  ...f,
                  content: f.content + '\n</html>',
                  updatedAt: Date.now(),
                }
              : f
          );
          continue;
        }

        if (error.message.includes('No entry point found')) {
          fixedFiles.push({
            id: `file-fix-${Date.now()}`,
            name: 'index.html',
            path: '/index.html',
            language: 'html',
            content:
              '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>My App</title>\n</head>\n<body>\n  <h1>Welcome</h1>\n</body>\n</html>',
            size: 0,
            isEntryPoint: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          continue;
        }
      }

      return { fixedFiles, remainingErrors: nonFixableErrors };
    },
    []
  );

  // Generate project structure for a framework
  const generateProjectStructure = useCallback(
    (framework: ProjectFramework, name: string): ProjectFile[] => {
      const now = Date.now();
      const makeFile = (
        path: string,
        content: string,
        entry = false
      ): ProjectFile => ({
        id: `file-${now}-${Math.random().toString(36).slice(2, 8)}`,
        name: path.split('/').pop() || '',
        path,
        language: getFileLanguage(path),
        content,
        size: new Blob([content]).size,
        isEntryPoint: entry,
        createdAt: now,
        updatedAt: now,
      });

      switch (framework) {
        case 'html':
          return [
            makeFile(
              '/index.html',
              `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>${name}</title>\n  <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n  <h1>${name}</h1>\n  <script src="script.js"></script>\n</body>\n</html>`,
              true
            ),
            makeFile(
              '/styles.css',
              `* {\n  margin: 0;\n  padding: 0;\n  box-sizing: border-box;\n}\n\nbody {\n  font-family: system-ui, sans-serif;\n  line-height: 1.6;\n  color: #333;\n}\n`
            ),
            makeFile(
              '/script.js',
              `// ${name}\nconsole.log('${name} loaded');\n`
            ),
          ];

        case 'vite_react':
          return [
            makeFile(
              '/index.html',
              `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>${name}</title>\n</head>\n<body>\n  <div id="root"></div>\n  <script type="module" src="/src/main.tsx"></script>\n</body>\n</html>`,
              true
            ),
            makeFile(
              '/src/main.tsx',
              `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);\n`
            ),
            makeFile(
              '/src/App.tsx',
              `export default function App() {\n  return (\n    <div className="app">\n      <h1>${name}</h1>\n      <p>Welcome to your new app</p>\n    </div>\n  );\n}\n`
            ),
            makeFile(
              '/src/index.css',
              `* {\n  margin: 0;\n  padding: 0;\n  box-sizing: border-box;\n}\n\nbody {\n  font-family: system-ui, sans-serif;\n}\n`
            ),
            makeFile(
              '/package.json',
              JSON.stringify(
                {
                  name: name.toLowerCase().replace(/\s+/g, '-'),
                  private: true,
                  version: '0.1.0',
                  type: 'module',
                  scripts: {
                    dev: 'vite',
                    build: 'vite build',
                    preview: 'vite preview',
                  },
                  dependencies: { react: '^18.3.0', 'react-dom': '^18.3.0' },
                  devDependencies: {
                    '@types/react': '^18.3.0',
                    '@types/react-dom': '^18.3.0',
                    '@vitejs/plugin-react': '^4.3.0',
                    typescript: '^5.5.0',
                    vite: '^5.4.0',
                  },
                },
                null,
                2
              )
            ),
            makeFile(
              '/vite.config.ts',
              `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\nexport default defineConfig({\n  plugins: [react()],\n});\n`
            ),
            makeFile(
              '/tsconfig.json',
              JSON.stringify(
                {
                  compilerOptions: {
                    target: 'ES2020',
                    useDefineForClassFields: true,
                    lib: ['ES2020', 'DOM', 'DOM.Iterable'],
                    module: 'ESNext',
                    skipLibCheck: true,
                    moduleResolution: 'bundler',
                    jsx: 'react-jsx',
                    strict: true,
                    esModuleInterop: true,
                  },
                  include: ['src'],
                },
                null,
                2
              )
            ),
          ];

        case 'nextjs':
          return [
            makeFile(
              '/src/app/layout.tsx',
              `export const metadata = { title: '${name}', description: '${name} - Built with AI' };\n\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang="en">\n      <body>{children}</body>\n    </html>\n  );\n}\n`
            ),
            makeFile(
              '/src/app/page.tsx',
              `export default function Home() {\n  return (\n    <main>\n      <h1>${name}</h1>\n      <p>Welcome to your Next.js app</p>\n    </main>\n  );\n}\n`,
              true
            ),
            makeFile(
              '/src/app/globals.css',
              `* {\n  margin: 0;\n  padding: 0;\n  box-sizing: border-box;\n}\n`
            ),
            makeFile(
              '/package.json',
              JSON.stringify(
                {
                  name: name.toLowerCase().replace(/\s+/g, '-'),
                  version: '0.1.0',
                  private: true,
                  scripts: {
                    dev: 'next dev',
                    build: 'next build',
                    start: 'next start',
                  },
                  dependencies: {
                    next: '^14.0.0',
                    react: '^18.3.0',
                    'react-dom': '^18.3.0',
                  },
                },
                null,
                2
              )
            ),
            makeFile(
              '/next.config.js',
              `/** @type {import('next').NextConfig} */\nconst nextConfig = {};\nmodule.exports = nextConfig;\n`
            ),
          ];

        default:
          return [
            makeFile(
              '/index.html',
              `<!DOCTYPE html>\n<html><head><title>${name}</title></head>\n<body><h1>${name}</h1></body></html>`,
              true
            ),
          ];
      }
    },
    []
  );

  // Extract multiple files from a single HTML response
  const extractFilesFromHtml = useCallback((html: string): ProjectFile[] => {
    const now = Date.now();
    const files: ProjectFile[] = [];

    // Main HTML file
    files.push({
      id: `file-${now}-html`,
      name: 'index.html',
      path: '/index.html',
      language: 'html',
      content: html,
      size: new Blob([html]).size,
      isEntryPoint: true,
      createdAt: now,
      updatedAt: now,
    });

    // Extract inline CSS into separate file
    const styleMatches = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
    if (styleMatches?.length) {
      const css = styleMatches
        .map((m) => m.replace(/<\/?style[^>]*>/gi, ''))
        .join('\n');
      if (css.trim().length > 50) {
        files.push({
          id: `file-${now}-css`,
          name: 'styles.css',
          path: '/styles.css',
          language: 'css',
          content: css.trim(),
          size: new Blob([css]).size,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    // Extract inline JS into separate file
    const scriptMatches = html.match(
      /<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi
    );
    if (scriptMatches?.length) {
      const js = scriptMatches
        .map((m) => m.replace(/<\/?script[^>]*>/gi, ''))
        .join('\n');
      if (js.trim().length > 50) {
        files.push({
          id: `file-${now}-js`,
          name: 'script.js',
          path: '/script.js',
          language: 'javascript',
          content: js.trim(),
          size: new Blob([js]).size,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return files;
  }, []);

  // Abort current operation
  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsProcessing(false);
  }, []);

  return {
    isProcessing,
    lastActions,
    currentBuild,
    currentDeployment,
    applyFileOps,
    validateBuild,
    requestDeploy,
    autoFixErrors,
    generateProjectStructure,
    extractFilesFromHtml,
    abort,
  };
}
