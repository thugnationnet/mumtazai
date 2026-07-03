/**
 * SandpackPreview - Live Code Preview (iframe-based)
 * Supports multiple view modes: Desktop, Tablet, Mobile, Split
 *
 * Uses pure iframe srcDoc previews instead of @codesandbox/sandpack-react
 * to avoid the recurring "r.split is not a function" crash in Sandpack's
 * bundler worker. HTML templates render directly; React templates use
 * CDN-loaded React + Babel standalone for in-browser transpilation.
 */

import React, { useRef, useEffect, useState } from 'react';
import CodeRunner from './CodeRunner';

const LocalCodePane: React.FC<{ code: string }> = ({ code }) => {
  return (
    <div className="h-full w-full overflow-auto bg-[#0f172a] text-slate-100">
      <pre className="min-h-full whitespace-pre-wrap break-words p-4 font-mono text-xs leading-6">
        {code}
      </pre>
    </div>
  );
};

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

const ART_COLS = 108;
const ART_ROWS = 59;

const AsciiIdleScreen: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(8);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const calc = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
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
    <div ref={containerRef} className="flex items-center justify-center h-full w-full bg-white dark:bg-[#0a0a0a] overflow-hidden">
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
        .ascii-rainbow-sp {
          animation: rainbow-ascii 8s ease-in-out infinite;
          opacity: 0.7;
        }
      `}</style>
      <pre
        className="ascii-rainbow-sp select-none font-mono whitespace-pre"
        style={{ fontSize: `${fontSize}px`, lineHeight: 1.1 }}
      >{ASCII_ART}</pre>
    </div>
  );
};

export type ViewMode = 'desktop' | 'tablet' | 'mobile' | 'code' | 'split';

// Languages that can run in Sandpack browser preview
const BROWSER_LANGUAGES = new Set(['html', 'react', 'nextjs', 'vanilla', 'css', 'tailwind', 'sass', 'vue', 'svelte', 'angular']);

// Languages that need server-side execution
const SERVER_LANGUAGES = new Set([
  'python', 'java', 'go', 'rust', 'c', 'cpp', 'c++', 'php', 'ruby', 'swift',
  'kotlin', 'csharp', 'c#', 'javascript', 'typescript', 'sql', 'bash', 'shell',
  'nodejs', 'express', 'fastapi', 'django', 'flask', 'spring', 'dotnet', 'laravel', 'rails',
  'r', 'jupyter', 'perl', 'lua', 'powershell',
]);

interface SandpackPreviewProps {
  code: string;
  language?: string;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  onCodeChange?: (code: string) => void;
  files?: Record<string, string>;
}

// Device dimensions
const DEVICE_SIZES = {
  desktop: { width: '100%', height: '100%' },
  tablet: { width: '768px', height: '1024px' },
  mobile: { width: '375px', height: '812px' },
};



// CDN scripts to inject into HTML previews (Tailwind CSS + Lucide icons)
const CDN_INJECTIONS = [
  '<script src="https://cdn.tailwindcss.com/3.4.16"><\/script>',
  '<script src="https://unpkg.com/lucide@latest"><\/script>',
];

// Parse multi-file marker format (// --- file: xxx ---) into separate files
function parseMultiFileCode(code: string): Record<string, string> | null {
  if (!code.includes('// --- file:')) return null;
  const files: Record<string, string> = {};
  const parts = code.split(/\/\/ --- file: (.+?) ---\n?/);
  for (let i = 1; i < parts.length; i += 2) {
    const name = parts[i].trim();
    const content = (parts[i + 1] || '').replace(/\n$/, '');
    files[name.startsWith('/') ? name : `/${name}`] = content;
  }
  return Object.keys(files).length > 0 ? files : null;
}

// Inline local CSS/JS files into HTML and strip their external refs
function inlineLocalFiles(html: string, files: Record<string, string>): string {
  const css = files['/styles.css'] || files['styles.css'] || '';
  const js = files['/script.js'] || files['script.js'] || files['/game.js'] || files['game.js'] || '';
  let result = html;
  if (css && !result.includes(css.slice(0, 40))) {
    result = result.replace('</head>', `<style>${css}</style>\n</head>`);
  }
  if (js && !result.includes(js.slice(0, 40))) {
    result = result.replace('</body>', `<script>${js}<\/script>\n</body>`);
  }
  // Remove external refs to local files
  result = result.replace(/<link\s+rel="stylesheet"\s+href="styles\.css"\s*\/?>/gi, '');
  result = result.replace(/<script\s+src="script\.js"\s*><\/script>/gi, '');
  result = result.replace(/<script\s+src="game\.js"\s*><\/script>/gi, '');
  return result;
}

// Build a complete HTML document for iframe srcDoc
function buildPreviewHtml(code: string, language: string, files?: Record<string, string>): string {
  const safeCode = typeof code === 'string' ? code : String(code || '');

  if (language === 'react' || language === 'nextjs') {
    return buildReactPreviewHtml(safeCode);
  }

  // Resolve multi-file projects: inline CSS/JS into HTML
  const parsedFiles = files && Object.keys(files).length > 1
    ? files
    : parseMultiFileCode(safeCode);

  let html: string;
  if (parsedFiles) {
    const baseHtml = parsedFiles['/index.html'] || parsedFiles['index.html'] || safeCode;
    html = inlineLocalFiles(baseHtml, parsedFiles);
  } else {
    html = safeCode;
  }

  const lower = html.toLowerCase();

  // Only inject CDN tags that aren't already present
  const toInject = CDN_INJECTIONS.filter(tag => {
    const srcMatch = tag.match(/src="([^"]+)"/);
    if (!srcMatch) return false;
    const domain = srcMatch[1].split('/')[2];
    return !lower.includes(domain);
  });

  if (toInject.length > 0) {
    const injection = toInject.join('\n    ');
    if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/<head[^>]*>/i, (m) => `${m}\n    ${injection}`);
    } else if (/<html[^>]*>/i.test(html)) {
      html = html.replace(/<html[^>]*>/i, (m) => `${m}\n<head>\n    ${injection}\n</head>`);
    } else {
      html = `<!DOCTYPE html><html><head>${injection}</head><body>${html}</body></html>`;
    }
  }

  return html;
}

// Build an HTML wrapper that loads React + Babel from CDN for JSX transpilation
function buildReactPreviewHtml(reactCode: string): string {
  // Escape the code for embedding inside a script tag
  const escaped = reactCode
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com/3.4.16"><\/script>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin><\/script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin><\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
  <style>body{margin:0;font-family:system-ui,-apple-system,sans-serif;}</style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-type="module">
${reactCode}

// Auto-mount: look for default export
const _mod = typeof App !== 'undefined' ? App : (typeof default_1 !== 'undefined' ? default_1 : null);
if (_mod) {
  const _root = ReactDOM.createRoot(document.getElementById('root'));
  _root.render(React.createElement(_mod));
}
  <\/script>
</body>
</html>`;
}

const SandpackPreviewComponent: React.FC<SandpackPreviewProps> = ({
  code,
  language = 'html',
  viewMode = 'desktop',
  onViewModeChange,
  onCodeChange,
  files: externalFiles,
}) => {

  // Map language to execution language key for server-side runner
  const getExecutionLanguage = (lang: string): string => {
    const map: Record<string, string> = {
      nodejs: 'javascript', express: 'javascript',
      fastapi: 'python', django: 'python', flask: 'python',
      spring: 'java',
      dotnet: 'csharp', 'c#': 'csharp',
      laravel: 'php',
      rails: 'ruby',
      'c++': 'cpp',
      shell: 'bash',
      jupyter: 'python',
      r: 'r',
    };
    return map[lang] || lang;
  };

  // Check if this is a server-side language
  const isServerLanguage = SERVER_LANGUAGES.has(language) && !BROWSER_LANGUAGES.has(language);

  const safeCode = typeof code === 'string' ? code : String(code || '');

  // Empty state — ASCII art idle screen (fills entire container)
  if (!code) {
    return <AsciiIdleScreen />;
  }

  // Server-side language — show CodeRunner instead of iframe preview
  if (isServerLanguage) {
    return (
      <CodeRunner
        code={code}
        language={getExecutionLanguage(language)}
        files={externalFiles}
      />
    );
  }

  const deviceStyle = DEVICE_SIZES[viewMode as keyof typeof DEVICE_SIZES] || DEVICE_SIZES.desktop;
  const previewHtml = buildPreviewHtml(safeCode, language, externalFiles);

  const IframePreview: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
    <iframe
      title="Canvas Studio Preview"
      className="w-full border-0 bg-white"
      style={{ height: '100%', ...style }}
      sandbox="allow-scripts allow-modals allow-forms allow-popups"
      srcDoc={previewHtml}
    />
  );

  return (
    <div className="flex flex-col h-full bg-canvas-darker">
      {/* Preview Area */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'code' ? (
          <LocalCodePane code={safeCode} />
        ) : viewMode === 'split' ? (
          <div className="flex h-full min-h-0">
            <div className="w-1/2 min-h-0 border-r border-slate-200 dark:border-white/[0.06]">
              <LocalCodePane code={safeCode} />
            </div>
            <div className="w-1/2 min-h-0">
              <IframePreview />
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center p-4 bg-slate-50 dark:bg-[#1a1a2e]">
            <div
              className={`bg-canvas-dark rounded-lg overflow-hidden shadow-2xl transition-all duration-300 ${
                viewMode === 'mobile' ? 'rounded-[2rem] border-8 border-slate-800' : ''
              } ${viewMode === 'tablet' ? 'rounded-2xl border-4 border-slate-700' : ''}`}
              style={{
                width: deviceStyle.width,
                height: deviceStyle.height,
                maxWidth: '100%',
                maxHeight: '100%',
              }}
            >
              {viewMode === 'mobile' && (
                <div className="h-6 bg-slate-800 flex items-center justify-center">
                  <div className="w-20 h-4 bg-black rounded-full" />
                </div>
              )}
              <IframePreview style={{ height: viewMode === 'mobile' ? 'calc(100% - 24px)' : '100%' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SandpackPreviewComponent;
