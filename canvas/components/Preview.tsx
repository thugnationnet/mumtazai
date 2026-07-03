import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  SandpackProvider,
  SandpackPreview,
  SandpackCodeEditor,
  useSandpack,
} from '@codesandbox/sandpack-react';
import LZString from 'lz-string';
import { ConsoleLine } from '../types';

interface ProjectFile {
  name: string;
  type: 'file' | 'folder';
  language?: string;
  content?: string;
  children?: ProjectFile[];
}

interface PreviewProps {
  code: string;
  language?: string;
  onCodeChange?: (newCode: string) => void;
  projectFiles?: ProjectFile[];
  onFilesGenerated?: (files: Record<string, string>) => void;
  onConsoleMessage?: (line: ConsoleLine) => void;
}

// Detect what type of project this is based on code content
const detectProjectType = (code: string, language: string): 'html' | 'react' | 'vanilla-js' | 'static' => {
  const lowerLang = language.toLowerCase();
  const lowerCode = code.toLowerCase();

  // Check for React patterns
  if (code.includes('import React') ||
    code.includes('from "react"') ||
    code.includes("from 'react'") ||
    code.includes('useState') ||
    code.includes('useEffect') ||
    code.includes('export default function') ||
    code.includes('export default class') ||
    (code.includes('<') && code.includes('/>') && (lowerLang === 'tsx' || lowerLang === 'jsx' || lowerLang === 'typescript' || lowerLang === 'javascript'))) {
    return 'react';
  }

  // Check for HTML
  if (lowerLang === 'html' || lowerLang === 'htm' ||
    lowerCode.trim().startsWith('<!doctype html') ||
    lowerCode.trim().startsWith('<html')) {
    return 'html';
  }

  // Vanilla JS
  if (lowerLang === 'javascript' || lowerLang === 'js') {
    return 'vanilla-js';
  }

  return 'static';
};

// Parse React code to extract component and dependencies
const parseReactCode = (code: string): { files: Record<string, string>, dependencies: Record<string, string> } => {
  const dependencies: Record<string, string> = {
    'react': '^18.2.0',
    'react-dom': '^18.2.0',
  };

  // Detect common dependencies from imports
  const importMatches = code.matchAll(/import\s+.*\s+from\s+['"]([^'"./][^'"]*)['"]/g);
  for (const match of importMatches) {
    const pkg = match[1].split('/')[0];
    if (pkg && pkg !== 'react' && pkg !== 'react-dom') {
      // Add common versions
      const commonVersions: Record<string, string> = {
        'framer-motion': '^10.16.0',
        'lucide-react': '^0.294.0',
        '@heroicons/react': '^2.0.18',
        'axios': '^1.6.0',
        'zustand': '^4.4.0',
        '@tanstack/react-query': '^5.0.0',
        'react-router-dom': '^6.20.0',
        'clsx': '^2.0.0',
        'tailwind-merge': '^2.0.0',
        'date-fns': '^2.30.0',
        'recharts': '^2.10.0',
        '@radix-ui/react-dialog': '^1.0.5',
        '@radix-ui/react-dropdown-menu': '^2.0.6',
        '@radix-ui/react-slot': '^1.0.2',
      };
      dependencies[pkg] = commonVersions[pkg] || 'latest';
    }
  }

  // Check if code has a default export, if not wrap it
  let mainCode = code;
  if (!code.includes('export default')) {
    // Try to find the main component name
    const componentMatch = code.match(/(?:function|const|class)\s+([A-Z][a-zA-Z0-9]*)/);
    if (componentMatch) {
      mainCode = code + `\n\nexport default ${componentMatch[1]};`;
    }
  }

  const files: Record<string, string> = {
    '/App.tsx': mainCode,
    '/index.tsx': `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
    '/styles.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #0a0a0a;
  color: #ffffff;
  min-height: 100vh;
}`,
    '/public/index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>App Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
  };

  return { files, dependencies };
};

// Sandpack editor component for code changes
const SandpackEditor: React.FC<{ onCodeChange?: (code: string) => void }> = ({ onCodeChange }) => {
  const { sandpack } = useSandpack();

  useEffect(() => {
    if (onCodeChange && sandpack.files['/App.tsx']) {
      onCodeChange(sandpack.files['/App.tsx'].code);
    }
  }, [sandpack.files, onCodeChange]);

  return null;
};

// Helper to flatten project files into Sandpack file format
const buildSandpackFiles = (projectFiles: ProjectFile[], basePath: string = ''): Record<string, string> => {
  const files: Record<string, string> = {};

  const processFiles = (items: ProjectFile[], currentPath: string) => {
    for (const item of items) {
      if (item.type === 'folder' && item.children) {
        processFiles(item.children, `${currentPath}/${item.name}`);
      } else if (item.type === 'file' && item.content) {
        // Convert path to Sandpack format (add leading slash, use src/ for components)
        let filePath = `${currentPath}/${item.name}`;
        if (!filePath.startsWith('/')) filePath = '/' + filePath;
        // For React files in components/ folder, put them in /src/components/
        if (filePath.includes('/components/')) {
          filePath = filePath.replace('/components/', '/components/');
        }
        files[filePath] = item.content;
      }
    }
  };

  processFiles(projectFiles, basePath);
  return files;
};

// Live commentary messages shown while building
const BUILD_COMMENTARY = [
  '🔧 Polishing pixels to perfection...',
  '🎨 Teaching colors to cooperate...',
  '⚡ Convincing electrons to move faster...',
  '🧙 Casting component spells...',
  '🍕 Ordering pizza for the build server...',
  '🎸 The code is learning to play guitar...',
  '🦄 Summoning unicorn-grade components...',
  '🏗️ Stacking divs like a pro architect...',
  '🎪 The CSS circus is setting up...',
  '🚀 Fueling the render rocket...',
  '🧊 Keeping state cool under pressure...',
  '🎯 Aligning divs... center... center... GOT IT!',
  '🌮 Wrapping components in tortillas of logic...',
  '🎵 Composing a symphony of semicolons...',
  '🏄 Surfing the virtual DOM waves...',
  '🤖 Teaching the AI to appreciate good UI...',
  '🎭 React is rehearsing its performance...',
  '🧪 Mixing state potions in the lab...',
  '📦 Unboxing fresh dependencies...',
  '🎮 Loading level: Your Awesome App...',
  '🌈 Painting the interface with rainbows...',
  '🦊 The fox says: "Almost ready!"',
  '🧁 Baking components at 350° React...',
  '🎬 Lights, camera, render()!',
  '🏰 Building your digital castle...',
  '🐙 Octopus deploying 8 features at once...',
  '🎪 Juggling props and state like a circus pro...',
  '☕ The code is having its morning coffee...',
  '🦸 Your app is putting on its superhero cape...',
  '🎲 Rolling for critical render success...',
];

// Hook for rotating commentary
const useCommentary = () => {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * BUILD_COMMENTARY.length));
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % BUILD_COMMENTARY.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);
  return BUILD_COMMENTARY[index];
};

// ASCII art idle screen with auto-scaling and rainbow animation
const ASCII_ART = `.==========================================================================================================.
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%#@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@#*@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@#*@%%%%%@@@@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@%@@%%%%%%%%%@@@@@%@@@%*@@@@%@@@@@%%%%%%%%@@@%@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%@#==#@@%%%%@@@*=++@@*-@##@@#@@@   @@@@%%%@@@==+@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%@%#@@=@@@@@%=@@#+++@@@@@   @@@#%#@@**@@@@@+%@@#@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%@%++=#@*%#%@+==@++*@@@@     @   @#+=@@#%#%@==+*@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%@%%@#++%@++=++@%+%%@@@   @=@   @@@#+=++#@+++%@%@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%@@=%@+*++++*@-#@@@@@@   %%#   @@@@=@@+++++++@=+@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%@%*%@+*+++@*%@@@%@@@   ###   @ @@@@@=@%++*++@+#@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@%+@+++@%*@@%%%@@@   #@@   %-  @@@@@%#@++++@=@@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%@@@@@@@#@++@%@@@@%%@@@   #@@  -@%%*  @@@@@@*@+++@#@@@@@@%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%##%%%%%@#===@+=++***++==#%%@#   #@#           @@+=+++*#++==@%===@%%%%%%*%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%%%%%%%%%%%%=
=%%%%%%%%%%@@@       -@@= @@@@@@ -@@ :      +@@@@@@. @@@@@@@@@@@@=+@@@@@@@..      @+   .:    %@%%%%%%%%%%%%=
=%%%%%%%%%%@@  -   -  #@    @@@@  @@  @@@@@=@@%%%@@  @@%%%%%%@@=    @@@%@  #@@@@*-@+  -      %@%%%%%%%%%%%%=
=%%%%%%%%%%@@  @@@@@+ @@: @   @@  @@        -@%%%@@  @@%%%%%@@%  @@  @@@@        +@@@@@  @@@@@@%%%%%%%%%%%%=
=%%%%%%%%%%@@  @@@@@@ @@. @@@     @@ @@@@@@@@@%%%@@  @@@@@@@@=  @     %@@@@@@@@@  @@%%@  #@%%%%%%%%%%%%%%%%=
=%%%%%%%%%%@@         #@  :@@@@   @@         @%%%%@        @   @@@@@@   @         @@%%@   @%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%%%@@@@@%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%++%%%%%%#+=*@#+***********+++**#++####+=****+++************@%=++@%%%%%#=#%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%@@%%%%%%@@=@@%%@@@@@@@@%#@@@@%=@@%**=@=@@%+@@@@@*@@@@@@@@@#@@*#@%%%%%%@@@%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%@@@%%@#=+%=##+@@@%%@%==#@%**+@@=++@%%%@@%*@=++=+@@%%@@%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@@%=+@+%@+#@@@%@@@@@@@@@@@@@@@%@@@=@@+*%=+@@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@@@=+@+@=@++@@@@@%%%%%%%%%@@@@%=@#+#@*=#@@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@@%%@=##=%%=+#%@@@@@@@@@#*=#@++@++@=@@@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@@@@@@@%@%+**++@@=@+@@+@=#@%+**+*@@%@@@@@@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=%%%=%@@@@@@*@+%=#@++@@++@*#@@@@@@@=%%@=#%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@@@%%*@%%%%@@@=@*+@*+++@#+@+#@%@%%%@##%@@@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%@@@%%%%@@@@%%%%#+@@@@@@%###@@@@@@@=@%%%%@@@@%%%%@@@%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%#=%%%%%#=%%%%%%#+@%%%%%@@@@@%%%%%%=@%%%%%+=%%%%%+=@%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%@@@%%%%@@@%%%%%@@%%%%%%@*+@%%%%%%@@@%%%%%@@@%%%%@@@%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@%#@%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=
.==========================================================================================================.`;

const ART_COLS = 108; // chars per line
const ART_ROWS = 57;  // number of lines

const AsciiIdleScreen: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(8);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const calc = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      // monospace char width ≈ 0.602 × fontSize, line height = 1.1 × fontSize
      const byWidth = w / (ART_COLS * 0.602);
      const byHeight = h / (ART_ROWS * 1.1);
      setFontSize(Math.floor(Math.min(byWidth, byHeight) * 100) / 100);
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="flex items-center justify-center h-full w-full bg-slate-300 dark:bg-black/40 overflow-hidden">
      <style>{`
        @keyframes rainbow-ascii {
          0% { color: #06b6d4; }
          14% { color: #8b5cf6; }
          28% { color: #ec4899; }
          42% { color: #f97316; }
          57% { color: #eab308; }
          71% { color: #22c55e; }
          85% { color: #3b82f6; }
          100% { color: #06b6d4; }
        }
        .ascii-rainbow {
          animation: rainbow-ascii 8s ease-in-out infinite;
          opacity: 0.5;
        }
      `}</style>
      <pre
        className="ascii-rainbow select-none font-mono whitespace-pre"
        style={{ fontSize: `${fontSize}px`, lineHeight: 1.1 }}
      >{ASCII_ART}</pre>
    </div>
  );
};

// Building commentary component shown during loading
const BuildingCommentary: React.FC<{ title: string }> = ({ title }) => {
  const commentary = useCommentary();
  return (
    <div className="flex flex-col items-center justify-center h-full bg-slate-400 dark:bg-black/60 gap-6 p-8">
      <style>{`
        @keyframes spin-glow {
          0% { box-shadow: 0 0 20px #06b6d4, 0 0 40px transparent; }
          50% { box-shadow: 0 0 20px #8b5cf6, 0 0 60px #8b5cf640; }
          100% { box-shadow: 0 0 20px #06b6d4, 0 0 40px transparent; }
        }
        @keyframes commentary-fade {
          0% { opacity: 0; transform: translateY(8px); }
          15% { opacity: 1; transform: translateY(0); }
          85% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-8px); }
        }
        .commentary-text {
          animation: commentary-fade 2.5s ease-in-out;
        }
        .build-spinner {
          animation: spin 1s linear infinite, spin-glow 3s ease-in-out infinite;
        }
      `}</style>
      <div className="build-spinner rounded-full h-12 w-12 border-2 border-indigo-500 border-t-transparent" />
      <div className="text-center space-y-3">
        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">{title}</p>
        <p key={commentary} className="commentary-text text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">{commentary}</p>
      </div>
    </div>
  );
};

const Preview: React.FC<PreviewProps> = ({ code, language = 'html', onCodeChange, projectFiles, onFilesGenerated, onConsoleMessage }) => {
  const [showEditor, setShowEditor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedCode, setDebouncedCode] = useState(code);
  const lastFilesRef = useRef<string>('');
  const [consoleLines, setConsoleLines] = useState<ConsoleLine[]>([]);
  const [showConsole, setShowConsole] = useState(false);
  const [hasError, setHasError] = useState(false);

  const projectType = useMemo(() => detectProjectType(code, language), [code, language]);

  // Console message listener (captures from Sandpack iframe postMessage)
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'console' && e.data?.log) {
        const line: ConsoleLine = {
          type: e.data.log.method || 'log',
          text: Array.isArray(e.data.log.data) ? e.data.log.data.join(' ') : String(e.data.log.data || ''),
          timestamp: Date.now(),
        };
        setConsoleLines(prev => [...prev.slice(-200), line]);
        if (line.type === 'error') setHasError(true);
        onConsoleMessage?.(line);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onConsoleMessage]);

  // Clear console on new code
  useEffect(() => { setConsoleLines([]); setHasError(false); }, [code]);

  // Debounce code changes to prevent excessive re-renders
  useEffect(() => {
    // Only debounce if code actually changed
    if (code === debouncedCode) return;

    setIsLoading(true);
    const timer = setTimeout(() => {
      setDebouncedCode(code);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [code, debouncedCode]);

  if (!code) {
    return <AsciiIdleScreen />;
  }
  // React/TSX/JSX - Use Sandpack
  if (projectType === 'react') {
    // Show loading state while debouncing
    if (isLoading) {
      return <BuildingCommentary title="Preparing React Preview" />;
    }

    // Check if we have multi-file project
    let files: Record<string, string>;
    let dependencies: Record<string, string>;

    if (projectFiles && projectFiles.length > 0) {
      // Multi-file project: build files from projectFiles
      const builtFiles = buildSandpackFiles(projectFiles);
      dependencies = {
        'react': '^18.2.0',
        'react-dom': '^18.2.0',
      };

      // Detect dependencies from all files
      Object.values(builtFiles).forEach(fileContent => {
        const importMatches = fileContent.matchAll(/import\s+.*\s+from\s+['"]([^'"./][^'"]*)['"]/g);
        for (const match of importMatches) {
          const pkg = match[1].split('/')[0];
          if (pkg && pkg !== 'react' && pkg !== 'react-dom') {
            const commonVersions: Record<string, string> = {
              'framer-motion': '^10.16.0',
              'lucide-react': '^0.294.0',
              '@heroicons/react': '^2.0.18',
              'axios': '^1.6.0',
              'zustand': '^4.4.0',
              '@tanstack/react-query': '^5.0.0',
              'react-router-dom': '^6.20.0',
              'clsx': '^2.0.0',
              'tailwind-merge': '^2.0.0',
            };
            dependencies[pkg] = commonVersions[pkg] || 'latest';
          }
        }
      });

      // Remove conflicting index.html that references /src/main.tsx directly
      // Sandpack vite-react template uses /public/index.html instead
      delete builtFiles['/index.html'];
      
      // If we have /src/main.tsx, use it as the entry point, otherwise use /index.tsx
      const entryContent = builtFiles['/src/main.tsx'] || builtFiles['/index.tsx'] || builtFiles['/main.tsx'] || `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { fetchWithCredentials } from '../fetchUtil';

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;
      
      // Remove old entry files that conflict with /index.tsx
      delete builtFiles['/src/main.tsx'];
      delete builtFiles['/main.tsx'];

      // Build final files with proper Sandpack structure
      files = {
        ...builtFiles,
        '/index.tsx': entryContent,
        '/public/index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>App Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
      };

      // If no index.css exists, add default styles
      if (!files['/index.css'] && !files['/styles.css']) {
        files['/index.css'] = `@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #0a0a0a;
  color: #ffffff;
  min-height: 100vh;
}`;
      }
    } else {
      // Single file project: use existing parseReactCode
      const parsed = parseReactCode(debouncedCode);
      files = parsed.files;
      dependencies = parsed.dependencies;
    }

    // Notify parent of generated files (only if changed to prevent infinite loop)
    const filesKey = JSON.stringify(Object.keys(files).sort());
    if (onFilesGenerated && filesKey !== lastFilesRef.current) {
      lastFilesRef.current = filesKey;
      // Use setTimeout to avoid calling during render
      setTimeout(() => onFilesGenerated(files), 0);
    }

    // Open in CodeSandbox using POST request
    const openInCodeSandbox = () => {
      const sandboxFiles: Record<string, { content: string }> = {};
      Object.entries(files).forEach(([path, content]) => {
        sandboxFiles[path.replace(/^\//, '')] = { content };
      });

      // Add package.json if not present
      if (!sandboxFiles['package.json']) {
        sandboxFiles['package.json'] = {
          content: JSON.stringify({
            name: 'canvas-export',
            version: '1.0.0',
            main: 'index.tsx',
            dependencies: dependencies,
          }, null, 2)
        };
      }

      const parameters = LZString.compressToBase64(JSON.stringify({ files: sandboxFiles }))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Use POST request via form to avoid URL length limits
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://codesandbox.io/api/v1/sandboxes/define';
      form.target = '_blank';

      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'parameters';
      input.value = parameters;
      form.appendChild(input);

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    };

    return (
      <div className="w-full bg-white dark:bg-[#0a0a0a] flex flex-col" style={{ height: '100%', minHeight: 0, maxHeight: '100%' }}>
        {/* Sandpack CSS Override */}
        <style>{`
          .sp-wrapper { height: 100% !important; }
          .sp-layout { height: 100% !important; }
          .sp-stack { height: 100% !important; }
          .sp-preview { height: 100% !important; }
          .sp-preview-container { height: 100% !important; }
          .sp-preview-iframe { height: 100% !important; }
          .sp-code-editor { height: 100% !important; }
        `}</style>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-400 dark:bg-black/60 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
            </div>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase tracking-wider font-mono ml-2">
              ⚛️ React Live Preview
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditor(!showEditor)}
              className={`px-3 py-1 text-[10px] rounded transition-all uppercase tracking-wider font-medium ${showEditor
                  ? 'bg-cyan-500 text-slate-900 dark:text-white'
                  : 'bg-white dark:bg-slate-800 hover:bg-cyan-500/20 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:text-indigo-400'
                }`}
            >
              {showEditor ? '✓ Editor' : '⌨ Editor'}
            </button>
            <button
              onClick={openInCodeSandbox}
              className="px-3 py-1 text-[10px] rounded bg-white dark:bg-slate-800 hover:bg-purple-500/20 text-slate-500 dark:text-slate-400 hover:text-purple-400 transition-all uppercase tracking-wider font-medium"
              title="Open in CodeSandbox"
            >
              📦 Sandbox
            </button>
          </div>
        </div>

        {/* Sandpack */}
        <div className="flex-1" style={{ minHeight: 0, height: 'calc(100% - 44px)' }}>
          <SandpackProvider
            template="react-ts"
            files={files}
            customSetup={{
              dependencies,
            }}
            theme="dark"
            options={{
              externalResources: ['https://cdn.tailwindcss.com/3.4.16'],
              recompileMode: 'delayed', // Prevent rapid recompilation
              recompileDelay: 500, // 500ms delay before recompiling
              autorun: true,
              autoReload: false, // Don't auto-reload on every change
            }}
          >
            <div style={{ height: '100%', display: 'flex', flexDirection: showEditor ? 'row' : 'column' }}>
              {showEditor && (
                <div style={{ width: '50%', height: '100%', borderRight: '1px solid #333' }}>
                  <SandpackCodeEditor
                    showTabs
                    showLineNumbers
                    showInlineErrors
                    style={{ height: '100%' }}
                  />
                </div>
              )}
              <div style={{ width: showEditor ? '50%' : '100%', height: '100%' }}>
                <SandpackPreview
                  showNavigator={false}
                  showRefreshButton
                  showOpenInCodeSandbox
                  style={{ height: '100%' }}
                />
              </div>
            </div>
            {onCodeChange && <SandpackEditor onCodeChange={onCodeChange} />}
          </SandpackProvider>
        </div>
      </div>
    );
  }

  // Vanilla JS - Use Sandpack with vanilla template
  if (projectType === 'vanilla-js') {
    const files = {
      '/index.js': code,
      '/index.html': `<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background: #0a0a0a; color: white; font-family: system-ui, sans-serif; min-height: 100vh; }
  </style>
</head>
<body>
  <div id="app"></div>
  <script src="index.js"></script>
</body>
</html>`,
    };

    // Open in CodeSandbox using POST request
    const openInCodeSandbox = () => {
      const sandboxFiles = {
        'index.js': { content: code },
        'index.html': { content: files['/index.html'] },
      };
      const parameters = LZString.compressToBase64(JSON.stringify({ files: sandboxFiles }))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Use POST request via form to avoid URL length limits
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://codesandbox.io/api/v1/sandboxes/define';
      form.target = '_blank';

      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'parameters';
      input.value = parameters;
      form.appendChild(input);

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    };

    return (
      <div className="w-full h-full bg-white dark:bg-[#0a0a0a] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-slate-400 dark:bg-black/60 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
            </div>
            <span className="text-[10px] text-yellow-400 uppercase tracking-wider font-mono ml-2">
              📜 JavaScript Preview
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditor(!showEditor)}
              className={`px-3 py-1 text-[10px] rounded transition-all uppercase tracking-wider font-medium ${showEditor
                  ? 'bg-cyan-500 text-slate-900 dark:text-white'
                  : 'bg-white dark:bg-slate-800 hover:bg-cyan-500/20 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:text-indigo-400'
                }`}
            >
              {showEditor ? '✓ Editor' : '⌨ Editor'}
            </button>
            <button
              onClick={openInCodeSandbox}
              className="px-3 py-1 text-[10px] rounded bg-white dark:bg-slate-800 hover:bg-purple-500/20 text-slate-500 dark:text-slate-400 hover:text-purple-400 transition-all uppercase tracking-wider font-medium"
              title="Open in CodeSandbox"
            >
              📦 Sandbox
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden" style={{ display: 'flex', flexDirection: showEditor ? 'row' : 'column' }}>
          <SandpackProvider
            template="vanilla"
            files={files}
            theme="dark"
            options={{
              recompileMode: 'delayed',
              recompileDelay: 500,
              autorun: true,
              autoReload: false,
            }}
          >
            {showEditor && (
              <div style={{ width: '50%', height: '100%', borderRight: '1px solid #333' }}>
                <SandpackCodeEditor
                  showTabs
                  showLineNumbers
                  style={{ height: '100%' }}
                />
              </div>
            )}
            <div style={{ width: showEditor ? '50%' : '100%', height: '100%' }}>
              <SandpackPreview
                showNavigator={false}
                showRefreshButton
                style={{ height: '100%' }}
              />
            </div>
          </SandpackProvider>
        </div>
      </div>
    );
  }

  // HTML - Use Sandpack static template for secure sandboxed preview
  if (projectType === 'html') {
    // Show loading state while debouncing
    if (isLoading) {
      return <BuildingCommentary title="Preparing Preview" />;
    }

    const files: Record<string, string> = {
      '/index.html': debouncedCode,
    };

    // Open in CodeSandbox using POST request
    const openInCodeSandbox = () => {
      const sandboxFiles = {
        'index.html': { content: debouncedCode },
      };
      const parameters = LZString.compressToBase64(JSON.stringify({ files: sandboxFiles }))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://codesandbox.io/api/v1/sandboxes/define';
      form.target = '_blank';

      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'parameters';
      input.value = parameters;
      form.appendChild(input);

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    };

    return (
      <div className="w-full bg-white dark:bg-[#0a0a0a] flex flex-col" style={{ height: '100%', minHeight: 0, maxHeight: '100%' }}>
        {/* Sandpack CSS Override */}
        <style>{`
          .sp-wrapper { height: 100% !important; }
          .sp-layout { height: 100% !important; }
          .sp-stack { height: 100% !important; }
          .sp-preview { height: 100% !important; }
          .sp-preview-container { height: 100% !important; }
          .sp-preview-iframe { height: 100% !important; }
          .sp-code-editor { height: 100% !important; }
        `}</style>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-400 dark:bg-black/60 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
            </div>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase tracking-wider font-mono ml-2">
              🌐 HTML Live Preview (Sandboxed)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditor(!showEditor)}
              className={`px-3 py-1 text-[10px] rounded transition-all uppercase tracking-wider font-medium ${showEditor
                  ? 'bg-cyan-500 text-slate-900 dark:text-white'
                  : 'bg-white dark:bg-slate-800 hover:bg-cyan-500/20 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:text-indigo-400'
                }`}
            >
              {showEditor ? '✓ Editor' : '⌨ Editor'}
            </button>
            <button
              onClick={openInCodeSandbox}
              className="px-3 py-1 text-[10px] rounded bg-white dark:bg-slate-800 hover:bg-blue-500/20 text-slate-500 dark:text-slate-400 hover:text-blue-400 transition-all uppercase tracking-wider font-medium"
              title="Open in CodeSandbox"
            >
              📦 CodeSandbox
            </button>
          </div>
        </div>

        {/* Sandpack for HTML */}
        <div className="flex-1" style={{ minHeight: 0, height: 'calc(100% - 44px)' }}>
          <SandpackProvider
            template="static"
            files={files}
            theme="dark"
            options={{
              recompileMode: 'delayed',
              recompileDelay: 500,
              autorun: true,
              autoReload: false,
            }}
          >
            <div style={{ height: '100%', display: 'flex', flexDirection: showEditor ? 'row' : 'column' }}>
              {showEditor && (
                <div style={{ width: '50%', height: '100%', borderRight: '1px solid #333' }}>
                  <SandpackCodeEditor
                    showTabs
                    showLineNumbers
                    showInlineErrors
                    style={{ height: '100%' }}
                  />
                </div>
              )}
              <div style={{ width: showEditor ? '50%' : '100%', height: '100%' }}>
                <SandpackPreview
                  showNavigator={false}
                  showRefreshButton
                  showOpenInCodeSandbox
                  style={{ height: '100%' }}
                />
              </div>
            </div>
          </SandpackProvider>
        </div>
      </div>
    );
  }

  // ========================================================================
  // ALL OTHER LANGUAGES — Real execution terminal
  // Python, Java, Go, Rust, C/C++, PHP, Ruby, Swift, Kotlin, C#, SQL, Shell
  // ========================================================================

  return (
    <CodeExecutionPreview code={debouncedCode} language={language} />
  );
};

// ============================================================================
// CODE EXECUTION PREVIEW — Runs ANY language with real compilers/interpreters
// ============================================================================

interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
  language: string;
}

const CodeExecutionPreview: React.FC<{ code: string; language: string }> = ({ code, language }) => {
  const [output, setOutput] = useState<ExecResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [autoRan, setAutoRan] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [stdinInput, setStdinInput] = useState('');
  const [showStdin, setShowStdin] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const prevCodeRef = useRef<string>('');

  const languageConfig: Record<string, { icon: string; color: string; name: string }> = {
    python: { icon: '🐍', color: 'text-yellow-400', name: 'Python 3' },
    java: { icon: '☕', color: 'text-orange-400', name: 'Java' },
    go: { icon: '🐹', color: 'text-indigo-600 dark:text-indigo-400', name: 'Go' },
    rust: { icon: '🦀', color: 'text-orange-500', name: 'Rust' },
    c: { icon: '🔧', color: 'text-blue-400', name: 'C (GCC)' },
    cpp: { icon: '⚡', color: 'text-blue-500', name: 'C++ 20' },
    'c++': { icon: '⚡', color: 'text-blue-500', name: 'C++ 20' },
    php: { icon: '🐘', color: 'text-indigo-400', name: 'PHP' },
    ruby: { icon: '💎', color: 'text-red-400', name: 'Ruby' },
    swift: { icon: '🍎', color: 'text-orange-400', name: 'Swift' },
    kotlin: { icon: '🎯', color: 'text-purple-400', name: 'Kotlin' },
    csharp: { icon: '🟣', color: 'text-purple-500', name: 'C# (.NET)' },
    'c#': { icon: '🟣', color: 'text-purple-500', name: 'C# (.NET)' },
    sql: { icon: '🗄️', color: 'text-blue-300', name: 'SQLite' },
    shell: { icon: '🖥️', color: 'text-violet-600 dark:text-violet-400', name: 'Bash' },
    bash: { icon: '🖥️', color: 'text-violet-600 dark:text-violet-400', name: 'Bash' },
    javascript: { icon: '📜', color: 'text-yellow-300', name: 'Node.js' },
    typescript: { icon: '🔷', color: 'text-blue-400', name: 'TypeScript (tsx)' },
  };

  const langLower = language.toLowerCase().replace(/\s+/g, '');
  const config = languageConfig[langLower] || { icon: '💻', color: 'text-slate-500 dark:text-slate-400', name: language };

  const runCode = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setOutput(null);

    try {
      const res = await fetchWithCredentials('/api/canvas/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          code,
          language: langLower,
          ...(stdinInput ? { stdin: stdinInput } : {}),
        }),
      });

      const data: ExecResult = await res.json();
      setOutput(data);

      // Scroll to bottom of output
      setTimeout(() => {
        if (outputRef.current) {
          outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
      }, 50);
    } catch (err: any) {
      setOutput({
        stdout: '',
        stderr: `Network error: ${err.message}`,
        exitCode: 1,
        executionTime: 0,
        language: langLower,
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Auto-run on first load and when code changes
  useEffect(() => {
    if (code && code !== prevCodeRef.current) {
      prevCodeRef.current = code;
      // Small delay to avoid running during rapid typing
      const timer = setTimeout(() => {
        runCode();
      }, autoRan ? 800 : 300);
      setAutoRan(true);
      return () => clearTimeout(timer);
    }
  }, [code]);

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-[#0a0a0a] overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/80 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
          </div>
          <span className={`text-[10px] ${config.color} uppercase tracking-wider font-mono ml-2 font-bold`}>
            {config.icon} {config.name} Runtime
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Stdin toggle */}
          <button
            onClick={() => setShowStdin(!showStdin)}
            className={`px-2.5 py-1 text-[10px] rounded transition-all uppercase tracking-wider font-medium ${showStdin
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                : 'bg-white dark:bg-slate-800 hover:bg-purple-500/10 text-gray-500 hover:text-purple-400'
              }`}
          >
            ⌨ stdin
          </button>
          {/* Code toggle */}
          <button
            onClick={() => setShowCode(!showCode)}
            className={`px-2.5 py-1 text-[10px] rounded transition-all uppercase tracking-wider font-medium ${showCode
                ? 'bg-cyan-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/40'
                : 'bg-white dark:bg-slate-800 hover:bg-cyan-500/10 text-gray-500 hover:text-indigo-600 dark:text-indigo-400'
              }`}
          >
            {'<>'} Code
          </button>
          {/* Run button */}
          <button
            onClick={runCode}
            disabled={isRunning}
            className={`px-3 py-1 text-[10px] rounded font-bold uppercase tracking-wider transition-all ${isRunning
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 animate-pulse'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
              }`}
          >
            {isRunning ? '⏳ Running...' : '▶ Run'}
          </button>
        </div>
      </div>

      {/* Stdin input area */}
      {showStdin && (
        <div className="px-4 py-2 bg-slate-400 dark:bg-black/60 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <label className="text-[9px] text-purple-400 uppercase tracking-widest font-bold mb-1 block">Standard Input (stdin)</label>
          <textarea
            value={stdinInput}
            onChange={(e) => setStdinInput(e.target.value)}
            placeholder="Enter input for your program..."
            rows={3}
            className="w-full px-3 py-2 text-xs font-mono bg-slate-400 dark:bg-black/60 border border-slate-300 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 placeholder-gray-600 focus:border-purple-500/50 outline-none resize-none"
          />
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden" style={{ minHeight: 0 }}>
        {/* Code panel (toggleable) */}
        {showCode && (
          <div className="w-1/2 border-r border-slate-200 dark:border-slate-800 overflow-auto">
            <div className="px-3 py-1.5 bg-slate-300 dark:bg-black/40 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
              <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Source Code</span>
              <span className="text-[9px] text-gray-600 ml-2">{code.split('\n').length} lines</span>
            </div>
            <pre className="p-3 text-[11px] font-mono text-slate-700 dark:text-slate-300 whitespace-pre leading-relaxed">
              {code.split('\n').map((line, i) => (
                <div key={i} className="flex hover:bg-white/[0.02]">
                  <span className="text-gray-600 select-none w-10 text-right pr-3 shrink-0">{i + 1}</span>
                  <span>{line || ' '}</span>
                </div>
              ))}
            </pre>
          </div>
        )}

        {/* Output terminal */}
        <div className={`${showCode ? 'w-1/2' : 'w-full'} flex flex-col overflow-hidden`}>
          <div className="px-3 py-1.5 bg-slate-300 dark:bg-black/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-emerald-400 uppercase tracking-widest font-bold">Output</span>
              {output && (
                <>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${output.exitCode === 0
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/20 text-red-400'
                    }`}>
                    {output.exitCode === 0 ? '✓ EXIT 0' : `✗ EXIT ${output.exitCode}`}
                  </span>
                  <span className="text-[9px] text-gray-600">
                    {output.executionTime}ms
                  </span>
                </>
              )}
            </div>
            {output && (
              <button
                onClick={() => {
                  const text = (output.stdout || '') + (output.stderr || '');
                  navigator.clipboard.writeText(text);
                }}
                className="text-[9px] text-gray-500 hover:text-indigo-600 dark:text-indigo-400 transition-colors"
                title="Copy output"
              >
                📋 Copy
              </button>
            )}
          </div>

          <div ref={outputRef} className="flex-1 overflow-auto p-3 font-mono text-[11px] leading-relaxed" style={{ minHeight: 0 }}>
            {isRunning && !output && (
              <div className="flex items-center gap-2 text-yellow-400 animate-pulse">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="uppercase tracking-wider text-[10px] font-bold">
                  Compiling & executing {config.name}...
                </span>
              </div>
            )}

            {output && (
              <>
                {/* stdout */}
                {output.stdout && (
                  <pre className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap mb-2">{output.stdout}</pre>
                )}

                {/* stderr */}
                {output.stderr && (
                  <pre className={`whitespace-pre-wrap ${output.exitCode === 0 ? 'text-yellow-400/70' : 'text-red-400'
                    }`}>{output.stderr}</pre>
                )}

                {/* Empty output */}
                {!output.stdout && !output.stderr && output.exitCode === 0 && (
                  <span className="text-gray-500 italic">Program completed with no output.</span>
                )}
              </>
            )}

            {!isRunning && !output && (
              <div className="flex flex-col items-center justify-center h-full text-gray-600">
                <div className="text-4xl mb-3">{config.icon}</div>
                <p className="text-[11px] font-bold uppercase tracking-wider mb-1">
                  {config.name} Ready
                </p>
                <p className="text-[10px] text-gray-700">
                  Press <span className="text-emerald-400 font-bold">▶ Run</span> or code will auto-execute
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preview;
