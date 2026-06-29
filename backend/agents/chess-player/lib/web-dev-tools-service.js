/**
 * WEB DEV TOOLS SERVICE
 * ═══════════════════════
 * Gives the AI agent the same developer capabilities a human IDE has:
 * - Filesystem intelligence (project tree, file search, stats, diff)
 * - Code intelligence (symbols, references, definitions, language detection, imports)
 * - Search & navigation (grep, find by name, regex, replace in files)
 * - Debugging & diagnostics (error parsing, stack traces, linting, performance, logs)
 *
 * 4 consolidated tools, ~45 actions total.
 */

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS & HELPERS
// ═══════════════════════════════════════════════════════════════════

const MAX_TREE_DEPTH = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_SEARCH_RESULTS = 200;
const MAX_DIFF_SIZE = 5 * 1024 * 1024; // 5 MB

// Common language detection by extension
const LANGUAGE_MAP = {
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.mts': 'typescript',
  '.cts': 'typescript',
  '.py': 'python',
  '.pyw': 'python',
  '.rb': 'ruby',
  '.erb': 'ruby',
  '.java': 'java',
  '.kt': 'kotlin',
  '.kts': 'kotlin',
  '.go': 'go',
  '.rs': 'rust',
  '.c': 'c',
  '.h': 'c',
  '.cpp': 'cpp',
  '.cc': 'cpp',
  '.cxx': 'cpp',
  '.hpp': 'cpp',
  '.cs': 'csharp',
  '.swift': 'swift',
  '.php': 'php',
  '.html': 'html',
  '.htm': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.sass': 'sass',
  '.less': 'less',
  '.json': 'json',
  '.jsonc': 'json',
  '.xml': 'xml',
  '.xsl': 'xml',
  '.xsd': 'xml',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.toml': 'toml',
  '.md': 'markdown',
  '.mdx': 'markdown',
  '.sql': 'sql',
  '.sh': 'shell',
  '.bash': 'shell',
  '.zsh': 'shell',
  '.ps1': 'powershell',
  '.r': 'r',
  '.R': 'r',
  '.lua': 'lua',
  '.dart': 'dart',
  '.vue': 'vue',
  '.svelte': 'svelte',
  '.astro': 'astro',
  '.prisma': 'prisma',
  '.graphql': 'graphql',
  '.gql': 'graphql',
  '.proto': 'protobuf',
  '.dockerfile': 'dockerfile',
  '.tf': 'terraform',
  '.sol': 'solidity',
  '.zig': 'zig',
  '.ex': 'elixir',
  '.exs': 'elixir',
  '.erl': 'erlang',
  '.hs': 'haskell',
  '.ml': 'ocaml',
  '.fs': 'fsharp',
  '.fsx': 'fsharp',
  '.clj': 'clojure',
  '.cljs': 'clojure',
  '.scala': 'scala',
  '.groovy': 'groovy',
  '.pl': 'perl',
  '.pm': 'perl',
};

// Framework detection signatures
const FRAMEWORK_SIGNATURES = {
  'next.js': ['next.config.js', 'next.config.mjs', 'next.config.ts', '.next/'],
  react: ['package.json:react', 'src/App.tsx', 'src/App.jsx'],
  vue: ['vue.config.js', 'nuxt.config.ts', 'package.json:vue'],
  svelte: ['svelte.config.js', 'package.json:svelte'],
  angular: ['angular.json', 'package.json:@angular/core'],
  astro: ['astro.config.mjs', 'package.json:astro'],
  remix: ['remix.config.js', 'package.json:@remix-run'],
  express: ['package.json:express'],
  fastify: ['package.json:fastify'],
  'nest.js': ['nest-cli.json', 'package.json:@nestjs/core'],
  django: ['manage.py', 'settings.py', 'urls.py'],
  flask: ['app.py:Flask', 'requirements.txt:flask'],
  rails: ['Gemfile:rails', 'config/routes.rb'],
  spring: ['pom.xml:spring', 'build.gradle:spring'],
  vite: ['vite.config.ts', 'vite.config.js', 'vite.config.mts'],
  webpack: ['webpack.config.js', 'webpack.config.ts'],
  tailwind: ['tailwind.config.js', 'tailwind.config.ts'],
  prisma: ['prisma/schema.prisma'],
  docker: ['Dockerfile', 'docker-compose.yml', 'docker-compose.yaml'],
  turborepo: ['turbo.json'],
  'monorepo-nx': ['nx.json'],
  electron: ['package.json:electron'],
};

// Symbol extraction regex patterns per language family
const SYMBOL_PATTERNS = {
  javascript: {
    functions: /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/g,
    arrow:
      /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|[^=])\s*=>/g,
    classes: /(?:export\s+)?class\s+(\w+)(?:\s+extends\s+\w+)?\s*\{/g,
    methods: /(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{/g,
    exports:
      /export\s+(?:default\s+)?(?:const|let|var|function|class|async\s+function)\s+(\w+)/g,
    interfaces: /(?:export\s+)?(?:interface|type)\s+(\w+)/g,
    enums: /(?:export\s+)?enum\s+(\w+)/g,
    constants: /(?:export\s+)?const\s+([A-Z_][A-Z0-9_]+)\s*=/g,
  },
  typescript: {
    functions: /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*[<(]/g,
    arrow:
      /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*(?::\s*[^=]+)?\s*=\s*(?:async\s+)?(?:\([^)]*\)|[^=])\s*=>/g,
    classes:
      /(?:export\s+)?(?:abstract\s+)?class\s+(\w+)(?:<[^>]*>)?(?:\s+extends\s+\w+)?(?:\s+implements\s+[\w,\s]+)?\s*\{/g,
    interfaces:
      /(?:export\s+)?interface\s+(\w+)(?:<[^>]*>)?\s*(?:extends\s+[\w,\s]+)?\s*\{/g,
    types: /(?:export\s+)?type\s+(\w+)(?:<[^>]*>)?\s*=/g,
    enums: /(?:export\s+)?(?:const\s+)?enum\s+(\w+)\s*\{/g,
    methods:
      /(?:public|private|protected|static|async|readonly)*\s*(\w+)\s*(?:<[^>]*>)?\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{/g,
    exports:
      /export\s+(?:default\s+)?(?:const|let|var|function|class|async\s+function|interface|type|enum|abstract\s+class)\s+(\w+)/g,
    constants: /(?:export\s+)?const\s+([A-Z_][A-Z0-9_]+)\s*(?::\s*[^=]+)?\s*=/g,
  },
  python: {
    functions: /(?:async\s+)?def\s+(\w+)\s*\(/g,
    classes: /class\s+(\w+)(?:\([^)]*\))?\s*:/g,
    methods: /\s+(?:async\s+)?def\s+(\w+)\s*\(self/g,
    decorators: /@(\w+)(?:\([^)]*\))?/g,
    constants: /^([A-Z_][A-Z0-9_]+)\s*=/gm,
    imports: /(?:from\s+(\S+)\s+)?import\s+([^#\n]+)/g,
  },
  css: {
    selectors: /([.#][\w-]+(?:\s*[>+~]\s*[.#]?[\w-]+)*)\s*\{/g,
    variables: /(--[\w-]+)\s*:/g,
    mediaQueries: /@media\s*\(([^)]+)\)/g,
    keyframes: /@keyframes\s+([\w-]+)/g,
    mixins: /@mixin\s+([\w-]+)/g,
  },
  html: {
    ids: /id\s*=\s*["']([^"']+)["']/g,
    classes: /class\s*=\s*["']([^"']+)["']/g,
    components: /<([A-Z][\w]*)/g,
    dataAttributes: /(data-[\w-]+)\s*=/g,
  },
};

// Import detection patterns
const IMPORT_PATTERNS = {
  javascript: [
    /import\s+(?:{[^}]+}|[\w*]+(?:\s*,\s*{[^}]+})?)\s+from\s+['"]([^'"]+)['"]/g,
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ],
  typescript: [
    /import\s+(?:type\s+)?(?:{[^}]+}|[\w*]+(?:\s*,\s*{[^}]+})?)\s+from\s+['"]([^'"]+)['"]/g,
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ],
  python: [/^from\s+(\S+)\s+import/gm, /^import\s+(\S+)/gm],
  css: [/@import\s+(?:url\(\s*)?['"]([^'"]+)['"](?:\s*\))?/g],
};

// Common ignore patterns for tree/search
const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  '.nuxt',
  '.svelte-kit',
  'dist',
  'build',
  '.cache',
  '.turbo',
  '__pycache__',
  '.pytest_cache',
  'coverage',
  '.nyc_output',
  '.vercel',
  '.netlify',
  '.output',
  'vendor',
  'target',
  '.gradle',
  '.idea',
  '.vscode',
  '.DS_Store',
  'venv',
  '.env',
  '.tox',
]);

const IGNORE_FILES = new Set([
  '.DS_Store',
  'Thumbs.db',
  '.gitkeep',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'composer.lock',
  'Gemfile.lock',
  'Cargo.lock',
]);

function getLanguage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const basename = path.basename(filePath).toLowerCase();
  if (basename === 'dockerfile') return 'dockerfile';
  if (basename === 'makefile') return 'makefile';
  if (basename === 'jenkinsfile') return 'groovy';
  if (basename === '.env' || basename.startsWith('.env.')) return 'env';
  if (basename === 'docker-compose.yml' || basename === 'docker-compose.yaml')
    return 'yaml';
  return LANGUAGE_MAP[ext] || 'unknown';
}

function getLanguageFamily(lang) {
  if (['javascript', 'typescript', 'vue', 'svelte', 'astro'].includes(lang))
    return 'javascript';
  if (['scss', 'sass', 'less'].includes(lang)) return 'css';
  return lang;
}

// ═══════════════════════════════════════════════════════════════════
// TOOL 1: dev_filesystem
// ═══════════════════════════════════════════════════════════════════
// Actions: project_tree, file_exists, file_stats, diff_files, find_duplicates, disk_usage

export async function devFilesystem(params, userId) {
  const action = params.action;
  try {
    switch (action) {
      // ── PROJECT TREE ───────────────────────────────────────────────
      case 'project_tree': {
        const dir = params.directory || params.path || '.';
        const maxDepth = params.options?.maxDepth ?? MAX_TREE_DEPTH;
        const showHidden = params.options?.showHidden ?? false;
        const showFiles = params.options?.showFiles ?? true;
        const showSize = params.options?.showSize ?? false;
        const filterExt = params.options?.filterExtensions || null; // e.g. ['.js', '.ts']

        async function buildTree(dirPath, depth = 0, prefix = '') {
          if (depth > maxDepth) return [];
          let entries;
          try {
            entries = await fs.readdir(dirPath, { withFileTypes: true });
          } catch {
            return [];
          }

          // Sort: dirs first, then files, alphabetically
          entries.sort((a, b) => {
            if (a.isDirectory() && !b.isDirectory()) return -1;
            if (!a.isDirectory() && b.isDirectory()) return 1;
            return a.name.localeCompare(b.name);
          });

          const results = [];
          for (const entry of entries) {
            if (!showHidden && entry.name.startsWith('.')) continue;
            if (entry.isDirectory() && IGNORE_DIRS.has(entry.name)) continue;
            if (!entry.isDirectory() && IGNORE_FILES.has(entry.name)) continue;

            const fullPath = path.join(dirPath, entry.name);
            const isDir = entry.isDirectory();

            if (
              !isDir &&
              filterExt &&
              !filterExt.includes(path.extname(entry.name).toLowerCase())
            )
              continue;

            const node = {
              name: entry.name,
              type: isDir ? 'directory' : 'file',
              path: fullPath,
            };

            if (!isDir && showSize) {
              try {
                const stat = await fs.stat(fullPath);
                node.size = stat.size;
              } catch {
                node.size = 0;
              }
            }

            if (isDir) {
              node.children =
                showFiles || depth < maxDepth
                  ? await buildTree(fullPath, depth + 1, prefix + '  ')
                  : [];
              node.childCount = node.children.length;
            } else if (!isDir) {
              node.language = getLanguage(entry.name);
            }

            results.push(node);
          }
          return results;
        }

        const tree = await buildTree(dir);

        // Count totals
        function countNodes(nodes) {
          let dirs = 0,
            files = 0;
          for (const n of nodes) {
            if (n.type === 'directory') {
              dirs++;
              const sub = countNodes(n.children || []);
              dirs += sub.dirs;
              files += sub.files;
            } else {
              files++;
            }
          }
          return { dirs, files };
        }
        const counts = countNodes(tree);

        return {
          success: true,
          action: 'project_tree',
          root: dir,
          tree,
          totalDirectories: counts.dirs,
          totalFiles: counts.files,
          depth: maxDepth,
        };
      }

      // ── FILE EXISTS ────────────────────────────────────────────────
      case 'file_exists': {
        const filePath = params.path || params.file;
        if (!filePath) return { success: false, error: 'path is required' };

        try {
          const stat = await fs.stat(filePath);
          return {
            success: true,
            action: 'file_exists',
            exists: true,
            path: filePath,
            type: stat.isDirectory() ? 'directory' : 'file',
            size: stat.size,
            modified: stat.mtime.toISOString(),
            created: stat.birthtime.toISOString(),
          };
        } catch {
          return {
            success: true,
            action: 'file_exists',
            exists: false,
            path: filePath,
          };
        }
      }

      // ── FILE STATS ─────────────────────────────────────────────────
      case 'file_stats': {
        const filePath = params.path || params.file;
        if (!filePath) return { success: false, error: 'path is required' };

        const stat = await fs.stat(filePath);
        const result = {
          success: true,
          action: 'file_stats',
          path: filePath,
          type: stat.isDirectory() ? 'directory' : 'file',
          size: stat.size,
          sizeHuman: formatBytes(stat.size),
          modified: stat.mtime.toISOString(),
          created: stat.birthtime.toISOString(),
          accessed: stat.atime.toISOString(),
          permissions: stat.mode.toString(8).slice(-3),
        };

        if (!stat.isDirectory()) {
          result.language = getLanguage(filePath);
          result.extension = path.extname(filePath);
          result.basename = path.basename(filePath);
          result.directory = path.dirname(filePath);

          // Line count for text files
          if (stat.size < MAX_FILE_SIZE) {
            try {
              const content = await fs.readFile(filePath, 'utf8');
              const lines = content.split('\n');
              result.lineCount = lines.length;
              result.charCount = content.length;
              result.wordCount = content.split(/\s+/).filter(Boolean).length;
              result.blankLines = lines.filter((l) => l.trim() === '').length;
              result.codeLines = result.lineCount - result.blankLines;
            } catch {
              /* binary file */
            }
          }
        } else {
          // Directory stats
          try {
            const entries = await fs.readdir(filePath);
            result.entryCount = entries.length;
          } catch {
            result.entryCount = 0;
          }
        }

        return result;
      }

      // ── DIFF FILES ─────────────────────────────────────────────────
      case 'diff_files': {
        const file1 = params.file1 || params.source;
        const file2 = params.file2 || params.target;
        if (!file1 || !file2)
          return { success: false, error: 'file1 and file2 are required' };

        const [stat1, stat2] = await Promise.all([
          fs.stat(file1),
          fs.stat(file2),
        ]);
        if (stat1.size > MAX_DIFF_SIZE || stat2.size > MAX_DIFF_SIZE) {
          return { success: false, error: 'Files too large for diff (>5MB)' };
        }

        const [content1, content2] = await Promise.all([
          fs.readFile(file1, 'utf8'),
          fs.readFile(file2, 'utf8'),
        ]);

        const lines1 = content1.split('\n');
        const lines2 = content2.split('\n');

        // Simple line-by-line diff
        const changes = [];
        const maxLines = Math.max(lines1.length, lines2.length);
        let added = 0,
          removed = 0,
          modified = 0;

        for (let i = 0; i < maxLines; i++) {
          const l1 = lines1[i];
          const l2 = lines2[i];
          if (l1 === undefined) {
            changes.push({ line: i + 1, type: 'added', content: l2 });
            added++;
          } else if (l2 === undefined) {
            changes.push({ line: i + 1, type: 'removed', content: l1 });
            removed++;
          } else if (l1 !== l2) {
            changes.push({ line: i + 1, type: 'modified', from: l1, to: l2 });
            modified++;
          }
        }

        return {
          success: true,
          action: 'diff_files',
          file1,
          file2,
          identical: changes.length === 0,
          stats: {
            added,
            removed,
            modified,
            unchanged: maxLines - added - removed - modified,
          },
          changes: changes.slice(0, 500), // Cap output
        };
      }

      // ── FIND DUPLICATES ────────────────────────────────────────────
      case 'find_duplicates': {
        const dir = params.directory || params.path || '.';
        const byContent = params.options?.byContent ?? true;
        const minSize = params.options?.minSize ?? 0;

        const fileMap = new Map(); // size -> [paths]

        async function scanDir(dirPath) {
          let entries;
          try {
            entries = await fs.readdir(dirPath, { withFileTypes: true });
          } catch {
            return;
          }
          for (const entry of entries) {
            if (entry.isDirectory()) {
              if (!IGNORE_DIRS.has(entry.name))
                await scanDir(path.join(dirPath, entry.name));
              continue;
            }
            if (IGNORE_FILES.has(entry.name)) continue;
            const fullPath = path.join(dirPath, entry.name);
            try {
              const stat = await fs.stat(fullPath);
              if (stat.size < minSize) continue;
              const key = byContent ? `${stat.size}` : entry.name;
              if (!fileMap.has(key)) fileMap.set(key, []);
              fileMap.get(key).push({ path: fullPath, size: stat.size });
            } catch {
              continue;
            }
          }
        }

        await scanDir(dir);

        // Filter to only groups with duplicates
        const duplicateGroups = [];
        for (const [key, files] of fileMap) {
          if (files.length < 2) continue;

          if (byContent) {
            // Further verify by reading content hash (first 4KB)
            const contentMap = new Map();
            for (const f of files) {
              try {
                const handle = await fs.open(f.path, 'r');
                const buf = Buffer.alloc(4096);
                await handle.read(buf, 0, 4096, 0);
                await handle.close();
                const hash = buf.toString('hex').slice(0, 32);
                if (!contentMap.has(hash)) contentMap.set(hash, []);
                contentMap.get(hash).push(f);
              } catch {
                continue;
              }
            }
            for (const [, group] of contentMap) {
              if (group.length >= 2) {
                duplicateGroups.push({
                  count: group.length,
                  size: group[0].size,
                  files: group.map((f) => f.path),
                });
              }
            }
          } else {
            duplicateGroups.push({
              count: files.length,
              name: path.basename(files[0].path),
              files: files.map((f) => f.path),
            });
          }
        }

        return {
          success: true,
          action: 'find_duplicates',
          directory: dir,
          duplicateGroups: duplicateGroups.slice(0, 100),
          totalGroups: duplicateGroups.length,
          totalDuplicateFiles: duplicateGroups.reduce(
            (sum, g) => sum + g.count - 1,
            0
          ),
        };
      }

      // ── DISK USAGE ─────────────────────────────────────────────────
      case 'disk_usage': {
        const dir = params.directory || params.path || '.';
        const topN = params.options?.topN ?? 20;

        const usage = {};
        let totalSize = 0;
        let totalFiles = 0;

        async function scan(dirPath) {
          let entries;
          try {
            entries = await fs.readdir(dirPath, { withFileTypes: true });
          } catch {
            return;
          }
          for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
              if (!IGNORE_DIRS.has(entry.name)) await scan(fullPath);
              continue;
            }
            try {
              const stat = await fs.stat(fullPath);
              totalSize += stat.size;
              totalFiles++;
              const ext = path.extname(entry.name).toLowerCase() || '(no ext)';
              if (!usage[ext]) usage[ext] = { count: 0, size: 0 };
              usage[ext].count++;
              usage[ext].size += stat.size;
            } catch {
              continue;
            }
          }
        }

        await scan(dir);

        const byExtension = Object.entries(usage)
          .map(([ext, data]) => ({
            extension: ext,
            ...data,
            sizeHuman: formatBytes(data.size),
          }))
          .sort((a, b) => b.size - a.size)
          .slice(0, topN);

        return {
          success: true,
          action: 'disk_usage',
          directory: dir,
          totalSize,
          totalSizeHuman: formatBytes(totalSize),
          totalFiles,
          byExtension,
        };
      }

      default:
        return {
          success: false,
          error: `Unknown dev_filesystem action: ${action}`,
        };
    }
  } catch (err) {
    return { success: false, action, error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════════
// TOOL 2: dev_search
// ═══════════════════════════════════════════════════════════════════
// Actions: grep, find_by_name, find_by_content, regex_search, replace_in_files, find_and_replace

export async function devSearch(params, userId) {
  const action = params.action;
  try {
    switch (action) {
      // ── GREP ───────────────────────────────────────────────────────
      case 'grep': {
        const query = params.query || params.pattern;
        const dir = params.directory || params.path || '.';
        const caseSensitive = params.options?.caseSensitive ?? false;
        const wholeWord = params.options?.wholeWord ?? false;
        const maxResults = params.options?.maxResults ?? MAX_SEARCH_RESULTS;
        const fileFilter = params.options?.fileFilter || null; // e.g. '*.js'
        const contextLines = params.options?.contextLines ?? 2;

        if (!query) return { success: false, error: 'query is required' };

        let flags = 'g';
        if (!caseSensitive) flags += 'i';
        let pattern = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (wholeWord) pattern = `\\b${pattern}\\b`;
        const regex = new RegExp(pattern, flags);

        const results = [];

        async function searchDir(dirPath) {
          if (results.length >= maxResults) return;
          let entries;
          try {
            entries = await fs.readdir(dirPath, { withFileTypes: true });
          } catch {
            return;
          }

          for (const entry of entries) {
            if (results.length >= maxResults) return;
            const fullPath = path.join(dirPath, entry.name);

            if (entry.isDirectory()) {
              if (!IGNORE_DIRS.has(entry.name)) await searchDir(fullPath);
              continue;
            }
            if (IGNORE_FILES.has(entry.name)) continue;

            // File filter
            if (fileFilter) {
              const ext = fileFilter.replace('*', '');
              if (!entry.name.endsWith(ext)) continue;
            }

            // Skip binary/large files
            try {
              const stat = await fs.stat(fullPath);
              if (stat.size > MAX_FILE_SIZE) continue;
            } catch {
              continue;
            }

            try {
              const content = await fs.readFile(fullPath, 'utf8');
              const lines = content.split('\n');

              for (let i = 0; i < lines.length; i++) {
                if (results.length >= maxResults) break;
                if (regex.test(lines[i])) {
                  regex.lastIndex = 0; // Reset regex
                  const match = {
                    file: fullPath,
                    line: i + 1,
                    content: lines[i].trim(),
                    language: getLanguage(fullPath),
                  };

                  if (contextLines > 0) {
                    match.before = lines
                      .slice(Math.max(0, i - contextLines), i)
                      .map((l) => l.trimEnd());
                    match.after = lines
                      .slice(i + 1, i + 1 + contextLines)
                      .map((l) => l.trimEnd());
                  }

                  results.push(match);
                }
              }
            } catch {
              continue;
            }
          }
        }

        await searchDir(dir);

        return {
          success: true,
          action: 'grep',
          query,
          directory: dir,
          totalMatches: results.length,
          results,
        };
      }

      // ── FIND BY NAME ───────────────────────────────────────────────
      case 'find_by_name': {
        const name = params.name || params.query;
        const dir = params.directory || params.path || '.';
        const exact = params.options?.exact ?? false;
        const maxResults = params.options?.maxResults ?? MAX_SEARCH_RESULTS;

        if (!name) return { success: false, error: 'name is required' };

        const results = [];
        const searchLower = name.toLowerCase();

        async function searchDir(dirPath) {
          if (results.length >= maxResults) return;
          let entries;
          try {
            entries = await fs.readdir(dirPath, { withFileTypes: true });
          } catch {
            return;
          }

          for (const entry of entries) {
            if (results.length >= maxResults) return;
            const fullPath = path.join(dirPath, entry.name);

            const match = exact
              ? entry.name === name
              : entry.name.toLowerCase().includes(searchLower);

            if (match) {
              const stat = await fs.stat(fullPath).catch(() => null);
              results.push({
                name: entry.name,
                path: fullPath,
                type: entry.isDirectory() ? 'directory' : 'file',
                size: stat?.size || 0,
                language: entry.isDirectory() ? null : getLanguage(entry.name),
              });
            }

            if (entry.isDirectory() && !IGNORE_DIRS.has(entry.name)) {
              await searchDir(fullPath);
            }
          }
        }

        await searchDir(dir);

        return {
          success: true,
          action: 'find_by_name',
          query: name,
          directory: dir,
          totalMatches: results.length,
          results,
        };
      }

      // ── FIND BY CONTENT ────────────────────────────────────────────
      case 'find_by_content': {
        const query = params.query || params.content;
        const dir = params.directory || params.path || '.';
        const fileFilter = params.options?.fileFilter || null;
        const maxResults = params.options?.maxResults ?? MAX_SEARCH_RESULTS;

        if (!query) return { success: false, error: 'query is required' };

        const results = [];
        const searchLower = query.toLowerCase();

        async function searchDir(dirPath) {
          if (results.length >= maxResults) return;
          let entries;
          try {
            entries = await fs.readdir(dirPath, { withFileTypes: true });
          } catch {
            return;
          }

          for (const entry of entries) {
            if (results.length >= maxResults) return;
            const fullPath = path.join(dirPath, entry.name);

            if (entry.isDirectory()) {
              if (!IGNORE_DIRS.has(entry.name)) await searchDir(fullPath);
              continue;
            }

            if (fileFilter) {
              const ext = fileFilter.replace('*', '');
              if (!entry.name.endsWith(ext)) continue;
            }

            try {
              const stat = await fs.stat(fullPath);
              if (stat.size > MAX_FILE_SIZE) continue;
              const content = await fs.readFile(fullPath, 'utf8');
              if (content.toLowerCase().includes(searchLower)) {
                // Find all matching lines
                const lines = content.split('\n');
                const matchingLines = [];
                for (let i = 0; i < lines.length; i++) {
                  if (lines[i].toLowerCase().includes(searchLower)) {
                    matchingLines.push({
                      line: i + 1,
                      content: lines[i].trim(),
                    });
                  }
                }
                results.push({
                  file: fullPath,
                  language: getLanguage(fullPath),
                  matchCount: matchingLines.length,
                  matches: matchingLines.slice(0, 10),
                });
              }
            } catch {
              continue;
            }
          }
        }

        await searchDir(dir);

        return {
          success: true,
          action: 'find_by_content',
          query,
          directory: dir,
          totalFiles: results.length,
          results,
        };
      }

      // ── REGEX SEARCH ───────────────────────────────────────────────
      case 'regex_search': {
        const pattern = params.pattern || params.query;
        const dir = params.directory || params.path || '.';
        const flags = params.options?.flags || 'gi';
        const fileFilter = params.options?.fileFilter || null;
        const maxResults = params.options?.maxResults ?? MAX_SEARCH_RESULTS;

        if (!pattern) return { success: false, error: 'pattern is required' };

        let regex;
        try {
          regex = new RegExp(pattern, flags);
        } catch (err) {
          return { success: false, error: `Invalid regex: ${err.message}` };
        }

        const results = [];

        async function searchDir(dirPath) {
          if (results.length >= maxResults) return;
          let entries;
          try {
            entries = await fs.readdir(dirPath, { withFileTypes: true });
          } catch {
            return;
          }

          for (const entry of entries) {
            if (results.length >= maxResults) return;
            const fullPath = path.join(dirPath, entry.name);

            if (entry.isDirectory()) {
              if (!IGNORE_DIRS.has(entry.name)) await searchDir(fullPath);
              continue;
            }
            if (fileFilter) {
              const ext = fileFilter.replace('*', '');
              if (!entry.name.endsWith(ext)) continue;
            }

            try {
              const stat = await fs.stat(fullPath);
              if (stat.size > MAX_FILE_SIZE) continue;
              const content = await fs.readFile(fullPath, 'utf8');
              const matches = [];
              let match;
              regex.lastIndex = 0;
              while (
                (match = regex.exec(content)) !== null &&
                matches.length < 20
              ) {
                // Find line number
                const before = content.slice(0, match.index);
                const lineNum = before.split('\n').length;
                matches.push({
                  match: match[0],
                  groups: match.groups || null,
                  line: lineNum,
                  index: match.index,
                });
              }
              if (matches.length > 0) {
                results.push({
                  file: fullPath,
                  language: getLanguage(fullPath),
                  matches,
                });
              }
            } catch {
              continue;
            }
          }
        }

        await searchDir(dir);

        return {
          success: true,
          action: 'regex_search',
          pattern,
          directory: dir,
          totalFiles: results.length,
          totalMatches: results.reduce((sum, r) => sum + r.matches.length, 0),
          results,
        };
      }

      // ── REPLACE IN FILES ───────────────────────────────────────────
      case 'replace_in_files': {
        const search = params.search || params.find;
        const replace = params.replace || params.replaceWith || '';
        const dir = params.directory || params.path || '.';
        const fileFilter = params.options?.fileFilter || null;
        const dryRun = params.options?.dryRun ?? true; // Default to dry-run for safety
        const isRegex = params.options?.isRegex ?? false;
        const caseSensitive = params.options?.caseSensitive ?? true;

        if (!search) return { success: false, error: 'search is required' };

        let flags = 'g';
        if (!caseSensitive) flags += 'i';
        let regex;
        try {
          regex = new RegExp(
            isRegex ? search : search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
            flags
          );
        } catch (err) {
          return { success: false, error: `Invalid pattern: ${err.message}` };
        }

        const affected = [];

        async function processDir(dirPath) {
          let entries;
          try {
            entries = await fs.readdir(dirPath, { withFileTypes: true });
          } catch {
            return;
          }

          for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
              if (!IGNORE_DIRS.has(entry.name)) await processDir(fullPath);
              continue;
            }
            if (fileFilter) {
              const ext = fileFilter.replace('*', '');
              if (!entry.name.endsWith(ext)) continue;
            }

            try {
              const stat = await fs.stat(fullPath);
              if (stat.size > MAX_FILE_SIZE) continue;
              const content = await fs.readFile(fullPath, 'utf8');
              regex.lastIndex = 0;
              if (regex.test(content)) {
                regex.lastIndex = 0;
                const matchCount = (content.match(regex) || []).length;
                const newContent = content.replace(regex, replace);

                if (!dryRun) {
                  await fs.writeFile(fullPath, newContent, 'utf8');
                }

                affected.push({
                  file: fullPath,
                  replacements: matchCount,
                  applied: !dryRun,
                });
              }
            } catch {
              continue;
            }
          }
        }

        await processDir(dir);

        return {
          success: true,
          action: 'replace_in_files',
          search,
          replace,
          dryRun,
          directory: dir,
          totalFiles: affected.length,
          totalReplacements: affected.reduce(
            (sum, f) => sum + f.replacements,
            0
          ),
          affected,
        };
      }

      // ── FIND AND REPLACE (single file) ─────────────────────────────
      case 'find_and_replace': {
        const filePath = params.file || params.path;
        const search = params.search || params.find;
        const replace = params.replace || params.replaceWith || '';
        const isRegex = params.options?.isRegex ?? false;
        const all = params.options?.all ?? true;

        if (!filePath || !search)
          return { success: false, error: 'file and search are required' };

        const content = await fs.readFile(filePath, 'utf8');
        const flags = all ? 'g' : '';
        const regex = new RegExp(
          isRegex ? search : search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
          flags
        );
        const matchCount = (
          content.match(
            new RegExp(
              regex.source,
              regex.flags + (regex.flags.includes('g') ? '' : 'g')
            )
          ) || []
        ).length;
        const newContent = content.replace(regex, replace);

        await fs.writeFile(filePath, newContent, 'utf8');

        return {
          success: true,
          action: 'find_and_replace',
          file: filePath,
          search,
          replace,
          replacements: matchCount,
        };
      }

      default:
        return {
          success: false,
          error: `Unknown dev_search action: ${action}`,
        };
    }
  } catch (err) {
    return { success: false, action, error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════════
// TOOL 3: dev_intelligence
// ═══════════════════════════════════════════════════════════════════
// Actions: get_symbols, find_references, go_to_definition, detect_language, analyze_imports, detect_framework, get_outline

export async function devIntelligence(params, userId) {
  const action = params.action;
  try {
    switch (action) {
      // ── GET SYMBOLS ────────────────────────────────────────────────
      case 'get_symbols': {
        const filePath = params.file || params.path;
        if (!filePath) return { success: false, error: 'file is required' };

        const content = await fs.readFile(filePath, 'utf8');
        const lang = getLanguage(filePath);
        const family = getLanguageFamily(lang);
        const patterns = SYMBOL_PATTERNS[family] || SYMBOL_PATTERNS.javascript;

        const symbols = {};
        for (const [type, pattern] of Object.entries(patterns)) {
          symbols[type] = [];
          let match;
          const regex = new RegExp(pattern.source, pattern.flags);
          while ((match = regex.exec(content)) !== null) {
            // Find line number
            const before = content.slice(0, match.index);
            const lineNum = before.split('\n').length;
            const captured = match[1] || match[0];

            // Skip common false positives
            if (
              [
                'if',
                'else',
                'for',
                'while',
                'switch',
                'catch',
                'return',
                'new',
                'try',
                'constructor',
              ].includes(captured)
            )
              continue;

            symbols[type].push({
              name: captured,
              line: lineNum,
              kind: type,
            });
          }
        }

        // Remove empty categories
        for (const key of Object.keys(symbols)) {
          if (symbols[key].length === 0) delete symbols[key];
        }

        const totalSymbols = Object.values(symbols).reduce(
          (sum, arr) => sum + arr.length,
          0
        );

        return {
          success: true,
          action: 'get_symbols',
          file: filePath,
          language: lang,
          totalSymbols,
          symbols,
        };
      }

      // ── FIND REFERENCES ────────────────────────────────────────────
      case 'find_references': {
        const symbol = params.symbol || params.name;
        const dir = params.directory || params.path || '.';
        const fileFilter = params.options?.fileFilter || null;
        const maxResults = params.options?.maxResults ?? MAX_SEARCH_RESULTS;

        if (!symbol) return { success: false, error: 'symbol is required' };

        // Search for word-boundary matches of the symbol across the project
        const regex = new RegExp(
          `\\b${symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
          'g'
        );
        const results = [];

        async function searchDir(dirPath) {
          if (results.length >= maxResults) return;
          let entries;
          try {
            entries = await fs.readdir(dirPath, { withFileTypes: true });
          } catch {
            return;
          }

          for (const entry of entries) {
            if (results.length >= maxResults) return;
            const fullPath = path.join(dirPath, entry.name);

            if (entry.isDirectory()) {
              if (!IGNORE_DIRS.has(entry.name)) await searchDir(fullPath);
              continue;
            }
            if (IGNORE_FILES.has(entry.name)) continue;

            if (fileFilter) {
              const ext = fileFilter.replace('*', '');
              if (!entry.name.endsWith(ext)) continue;
            }

            const lang = getLanguage(entry.name);
            if (lang === 'unknown') continue;

            try {
              const stat = await fs.stat(fullPath);
              if (stat.size > MAX_FILE_SIZE) continue;
              const content = await fs.readFile(fullPath, 'utf8');
              const lines = content.split('\n');
              const refs = [];

              for (let i = 0; i < lines.length; i++) {
                regex.lastIndex = 0;
                if (regex.test(lines[i])) {
                  // Classify reference type
                  const line = lines[i];
                  let refType = 'usage';
                  if (
                    /(?:function|class|interface|type|enum|const|let|var)\s+/.test(
                      line
                    ) &&
                    new RegExp(
                      `(?:function|class|interface|type|enum|const|let|var)\\s+${symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`
                    ).test(line)
                  ) {
                    refType = 'definition';
                  } else if (/import\s/.test(line)) {
                    refType = 'import';
                  } else if (/export\s/.test(line)) {
                    refType = 'export';
                  }

                  refs.push({
                    line: i + 1,
                    content: line.trim(),
                    type: refType,
                  });
                }
              }

              if (refs.length > 0) {
                results.push({
                  file: fullPath,
                  language: lang,
                  references: refs,
                  count: refs.length,
                });
              }
            } catch {
              continue;
            }
          }
        }

        await searchDir(dir);

        // Separate definitions from usages
        const definitions = [];
        const imports = [];
        const usages = [];
        for (const r of results) {
          for (const ref of r.references) {
            if (ref.type === 'definition')
              definitions.push({ file: r.file, ...ref });
            else if (ref.type === 'import')
              imports.push({ file: r.file, ...ref });
            else usages.push({ file: r.file, ...ref });
          }
        }

        return {
          success: true,
          action: 'find_references',
          symbol,
          directory: dir,
          totalFiles: results.length,
          totalReferences: results.reduce((sum, r) => sum + r.count, 0),
          definitions,
          imports,
          usages: usages.slice(0, 100),
        };
      }

      // ── GO TO DEFINITION ───────────────────────────────────────────
      case 'go_to_definition': {
        const symbol = params.symbol || params.name;
        const dir = params.directory || params.path || '.';

        if (!symbol) return { success: false, error: 'symbol is required' };

        const definitionPatterns = [
          new RegExp(
            `(?:export\\s+)?(?:async\\s+)?function\\s+${symbol}\\s*[<(]`,
            'g'
          ),
          new RegExp(`(?:export\\s+)?(?:const|let|var)\\s+${symbol}\\s*=`, 'g'),
          new RegExp(
            `(?:export\\s+)?(?:abstract\\s+)?class\\s+${symbol}\\b`,
            'g'
          ),
          new RegExp(`(?:export\\s+)?interface\\s+${symbol}\\b`, 'g'),
          new RegExp(`(?:export\\s+)?type\\s+${symbol}\\s*[<=]`, 'g'),
          new RegExp(`(?:export\\s+)?enum\\s+${symbol}\\b`, 'g'),
          new RegExp(`(?:async\\s+)?def\\s+${symbol}\\s*\\(`, 'g'), // Python
          new RegExp(`class\\s+${symbol}\\s*[:(]`, 'g'), // Python
        ];

        const definitions = [];

        async function searchDir(dirPath) {
          let entries;
          try {
            entries = await fs.readdir(dirPath, { withFileTypes: true });
          } catch {
            return;
          }

          for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
              if (!IGNORE_DIRS.has(entry.name)) await searchDir(fullPath);
              continue;
            }
            if (IGNORE_FILES.has(entry.name)) continue;

            const lang = getLanguage(entry.name);
            if (lang === 'unknown') continue;

            try {
              const stat = await fs.stat(fullPath);
              if (stat.size > MAX_FILE_SIZE) continue;
              const content = await fs.readFile(fullPath, 'utf8');
              const lines = content.split('\n');

              for (let i = 0; i < lines.length; i++) {
                for (const pattern of definitionPatterns) {
                  pattern.lastIndex = 0;
                  if (pattern.test(lines[i])) {
                    // Get context lines
                    const contextBefore = lines.slice(Math.max(0, i - 2), i);
                    const contextAfter = lines.slice(i + 1, i + 5);

                    definitions.push({
                      file: fullPath,
                      line: i + 1,
                      content: lines[i].trim(),
                      language: lang,
                      context: [
                        ...contextBefore,
                        `>>> ${lines[i]}`,
                        ...contextAfter,
                      ].join('\n'),
                    });
                    break; // One match per line
                  }
                }
              }
            } catch {
              continue;
            }
          }
        }

        await searchDir(dir);

        return {
          success: true,
          action: 'go_to_definition',
          symbol,
          directory: dir,
          found: definitions.length > 0,
          definitions: definitions.slice(0, 20),
        };
      }

      // ── DETECT LANGUAGE ────────────────────────────────────────────
      case 'detect_language': {
        const filePath = params.file || params.path;
        if (!filePath) return { success: false, error: 'file is required' };

        const lang = getLanguage(filePath);
        const family = getLanguageFamily(lang);

        // Try to detect from content if unknown
        let detectedFromContent = null;
        if (lang === 'unknown') {
          try {
            const content = await fs.readFile(filePath, 'utf8');
            const firstLines = content.split('\n').slice(0, 10).join('\n');

            if (
              firstLines.includes('#!/usr/bin/env node') ||
              firstLines.includes('#!/usr/bin/node')
            )
              detectedFromContent = 'javascript';
            else if (
              firstLines.includes('#!/usr/bin/env python') ||
              firstLines.includes('#!/usr/bin/python')
            )
              detectedFromContent = 'python';
            else if (
              firstLines.includes('#!/bin/bash') ||
              firstLines.includes('#!/bin/sh') ||
              firstLines.includes('#!/usr/bin/env bash')
            )
              detectedFromContent = 'shell';
            else if (firstLines.includes('#!/usr/bin/env ruby'))
              detectedFromContent = 'ruby';
            else if (firstLines.includes('<?php')) detectedFromContent = 'php';
            else if (
              firstLines.includes('<!DOCTYPE html') ||
              firstLines.includes('<html')
            )
              detectedFromContent = 'html';
            else if (firstLines.includes('<?xml')) detectedFromContent = 'xml';
          } catch {
            /* binary or unreadable */
          }
        }

        return {
          success: true,
          action: 'detect_language',
          file: filePath,
          language: detectedFromContent || lang,
          family,
          detectedFromContent: !!detectedFromContent,
          extension: path.extname(filePath),
        };
      }

      // ── ANALYZE IMPORTS ────────────────────────────────────────────
      case 'analyze_imports': {
        const filePath = params.file || params.path;
        if (!filePath) return { success: false, error: 'file is required' };

        const content = await fs.readFile(filePath, 'utf8');
        const lang = getLanguage(filePath);
        const family = getLanguageFamily(lang);
        const patterns = IMPORT_PATTERNS[family] || IMPORT_PATTERNS.javascript;

        const imports = {
          local: [], // ./relative or ../relative
          package: [], // node_modules packages
          builtin: [], // node:fs, path, etc.
          type: [], // import type { }
        };

        const nodeBuiltins = new Set([
          'fs',
          'path',
          'os',
          'http',
          'https',
          'url',
          'util',
          'stream',
          'events',
          'child_process',
          'crypto',
          'buffer',
          'cluster',
          'dgram',
          'dns',
          'net',
          'readline',
          'tls',
          'vm',
          'zlib',
          'worker_threads',
          'perf_hooks',
          'querystring',
          'string_decoder',
          'timers',
          'assert',
        ]);

        for (const pattern of patterns) {
          const regex = new RegExp(pattern.source, pattern.flags);
          let match;
          while ((match = regex.exec(content)) !== null) {
            const source = match[1] || match[2];
            if (!source) continue;

            const clean = source.trim().replace(/['"]/g, '');
            const before = content.slice(0, match.index);
            const lineNum = before.split('\n').length;

            // Check if it's a type import
            const isTypeImport = /import\s+type\s/.test(match[0]);

            const importInfo = {
              source: clean,
              line: lineNum,
              raw: match[0].trim().slice(0, 200),
            };

            if (isTypeImport) {
              imports.type.push(importInfo);
            } else if (clean.startsWith('.') || clean.startsWith('/')) {
              imports.local.push(importInfo);
            } else if (
              clean.startsWith('node:') ||
              nodeBuiltins.has(clean.split('/')[0])
            ) {
              imports.builtin.push(importInfo);
            } else {
              imports.package.push(importInfo);
            }
          }
        }

        // Extract unique package names
        const uniquePackages = [
          ...new Set(imports.package.map((i) => i.source.split('/')[0])),
        ];

        return {
          success: true,
          action: 'analyze_imports',
          file: filePath,
          language: lang,
          totalImports:
            imports.local.length +
            imports.package.length +
            imports.builtin.length +
            imports.type.length,
          imports,
          uniquePackages,
        };
      }

      // ── DETECT FRAMEWORK ───────────────────────────────────────────
      case 'detect_framework': {
        const dir = params.directory || params.path || '.';
        const detected = [];

        // Check for package.json dependencies
        let pkgJson = null;
        try {
          const raw = await fs.readFile(path.join(dir, 'package.json'), 'utf8');
          pkgJson = JSON.parse(raw);
        } catch {
          /* no package.json */
        }

        const allDeps = pkgJson
          ? { ...pkgJson.dependencies, ...pkgJson.devDependencies }
          : {};

        for (const [framework, signatures] of Object.entries(
          FRAMEWORK_SIGNATURES
        )) {
          for (const sig of signatures) {
            if (sig.includes(':')) {
              // Check package.json dependency or file content
              const [file, dep] = sig.split(':');
              if (file === 'package.json' && allDeps[dep]) {
                detected.push({
                  framework,
                  confidence: 'high',
                  evidence: `Found "${dep}" in package.json (v${allDeps[dep]})`,
                  version: allDeps[dep],
                });
                break;
              }
              // Check file content
              try {
                const content = await fs.readFile(path.join(dir, file), 'utf8');
                if (content.includes(dep)) {
                  detected.push({
                    framework,
                    confidence: 'medium',
                    evidence: `Found "${dep}" in ${file}`,
                  });
                  break;
                }
              } catch {
                continue;
              }
            } else {
              // Check file/directory existence
              try {
                await fs.stat(path.join(dir, sig.replace('/', '')));
                detected.push({
                  framework,
                  confidence: 'high',
                  evidence: `Found ${sig}`,
                });
                break;
              } catch {
                continue;
              }
            }
          }
        }

        // Detect language breakdown
        const languageCounts = {};
        async function countLanguages(dirPath, depth = 0) {
          if (depth > 3) return; // Only scan 3 levels deep for speed
          let entries;
          try {
            entries = await fs.readdir(dirPath, { withFileTypes: true });
          } catch {
            return;
          }
          for (const entry of entries) {
            if (entry.isDirectory()) {
              if (!IGNORE_DIRS.has(entry.name))
                await countLanguages(path.join(dirPath, entry.name), depth + 1);
              continue;
            }
            const lang = getLanguage(entry.name);
            if (lang !== 'unknown') {
              languageCounts[lang] = (languageCounts[lang] || 0) + 1;
            }
          }
        }
        await countLanguages(dir);

        const languages = Object.entries(languageCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([lang, count]) => ({ language: lang, files: count }));

        return {
          success: true,
          action: 'detect_framework',
          directory: dir,
          frameworks: detected,
          languages,
          projectName: pkgJson?.name || path.basename(dir),
          projectVersion: pkgJson?.version || null,
          hasTypeScript: !!allDeps.typescript,
          hasEslint: !!allDeps.eslint,
          hasPrettier: !!allDeps.prettier,
          packageManager: await detectPackageManager(dir),
        };
      }

      // ── GET OUTLINE ────────────────────────────────────────────────
      case 'get_outline': {
        const filePath = params.file || params.path;
        if (!filePath) return { success: false, error: 'file is required' };

        const content = await fs.readFile(filePath, 'utf8');
        const lang = getLanguage(filePath);
        const lines = content.split('\n');
        const outline = [];

        // Extract structured outline with nesting
        let currentClass = null;
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const trimmed = line.trim();
          if (
            !trimmed ||
            trimmed.startsWith('//') ||
            trimmed.startsWith('#') ||
            trimmed.startsWith('*')
          )
            continue;

          const indent = line.length - line.trimStart().length;

          // Class/interface
          const classMatch = trimmed.match(
            /^(?:export\s+)?(?:abstract\s+)?(?:class|interface)\s+(\w+)/
          );
          if (classMatch) {
            currentClass = {
              name: classMatch[1],
              line: i + 1,
              kind: trimmed.includes('interface') ? 'interface' : 'class',
              children: [],
            };
            outline.push(currentClass);
            continue;
          }

          // Function/method
          const funcMatch = trimmed.match(
            /^(?:export\s+)?(?:async\s+)?function\s+(\w+)/
          );
          if (funcMatch) {
            const item = { name: funcMatch[1], line: i + 1, kind: 'function' };
            if (currentClass && indent > 0) currentClass.children.push(item);
            else {
              currentClass = null;
              outline.push(item);
            }
            continue;
          }

          // Arrow function (top-level or export)
          const arrowMatch = trimmed.match(
            /^(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:\(|[^=]*=>)/
          );
          if (arrowMatch) {
            const item = { name: arrowMatch[1], line: i + 1, kind: 'arrow' };
            if (currentClass && indent > 0) currentClass.children.push(item);
            else {
              currentClass = null;
              outline.push(item);
            }
            continue;
          }

          // Method in class
          if (currentClass) {
            const methodMatch = trimmed.match(
              /^(?:public|private|protected|static|async|readonly|\s)*(\w+)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{/
            );
            if (
              methodMatch &&
              ![
                'if',
                'for',
                'while',
                'switch',
                'catch',
                'constructor',
              ].includes(methodMatch[1])
            ) {
              currentClass.children.push({
                name: methodMatch[1],
                line: i + 1,
                kind: 'method',
              });
              continue;
            }
          }

          // Python def
          const pyMatch = trimmed.match(/^(?:async\s+)?def\s+(\w+)\s*\(/);
          if (pyMatch) {
            const item = {
              name: pyMatch[1],
              line: i + 1,
              kind: indent > 0 ? 'method' : 'function',
            };
            if (currentClass && indent > 0) currentClass.children.push(item);
            else {
              currentClass = null;
              outline.push(item);
            }
            continue;
          }

          // Python class
          const pyClassMatch = trimmed.match(/^class\s+(\w+)/);
          if (pyClassMatch) {
            currentClass = {
              name: pyClassMatch[1],
              line: i + 1,
              kind: 'class',
              children: [],
            };
            outline.push(currentClass);
            continue;
          }
        }

        return {
          success: true,
          action: 'get_outline',
          file: filePath,
          language: lang,
          totalItems: outline.length,
          outline,
        };
      }

      default:
        return {
          success: false,
          error: `Unknown dev_intelligence action: ${action}`,
        };
    }
  } catch (err) {
    return { success: false, action, error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════════
// TOOL 4: dev_debug
// ═══════════════════════════════════════════════════════════════════
// Actions: parse_error, analyze_stacktrace, lint_check, dependency_audit, dead_code, todos_scan, env_check

export async function devDebug(params, userId) {
  const action = params.action;
  try {
    switch (action) {
      // ── PARSE ERROR ────────────────────────────────────────────────
      case 'parse_error': {
        const errorText = params.error || params.text || params.message;
        if (!errorText)
          return { success: false, error: 'error text is required' };

        const parsed = {
          type: null,
          message: null,
          file: null,
          line: null,
          column: null,
          stack: [],
          suggestions: [],
        };

        // Common error pattern matching
        const lines = errorText.split('\n');

        // TypeError, ReferenceError, SyntaxError, etc.
        const errorTypeMatch = errorText.match(
          /(TypeError|ReferenceError|SyntaxError|RangeError|URIError|EvalError|Error|Warning|FatalError|ModuleNotFoundError|ImportError|IndentationError|NameError|AttributeError|KeyError|ValueError|IndexError|FileNotFoundError|PermissionError):\s*(.+)/
        );
        if (errorTypeMatch) {
          parsed.type = errorTypeMatch[1];
          parsed.message = errorTypeMatch[2].trim();
        }

        // File:line:col patterns
        const locationPatterns = [
          /at\s+.*?\((.+?):(\d+):(\d+)\)/, // Node.js stack trace
          /File\s+"(.+?)",\s*line\s+(\d+)/, // Python
          /(.+?):(\d+):(\d+):/, // Generic compiler
          /\s+at\s+(.+?):(\d+):(\d+)/, // V8 alt pattern
          /Error in (.+?)\s*\[(\d+),\s*(\d+)\]/, // Some linters
        ];

        for (const pattern of locationPatterns) {
          const match = errorText.match(pattern);
          if (match) {
            parsed.file = match[1];
            parsed.line = parseInt(match[2]);
            parsed.column = match[3] ? parseInt(match[3]) : null;
            break;
          }
        }

        // Parse stack trace
        const stackLines = lines.filter(
          (l) => /^\s+at\s/.test(l) || /^\s+File\s/.test(l)
        );
        parsed.stack = stackLines.slice(0, 10).map((l) => l.trim());

        // Generate suggestions based on error type
        parsed.suggestions = getErrorSuggestions(
          parsed.type,
          parsed.message,
          errorText
        );

        return {
          success: true,
          action: 'parse_error',
          parsed,
        };
      }

      // ── ANALYZE STACKTRACE ─────────────────────────────────────────
      case 'analyze_stacktrace': {
        const stackText = params.stack || params.error || params.text;
        if (!stackText)
          return { success: false, error: 'stack trace is required' };

        const lines = stackText.split('\n');
        const frames = [];

        for (const line of lines) {
          // Node.js/JS: "at functionName (file:line:col)"
          let match = line.match(/at\s+(?:(.+?)\s+)?\(?(.+?):(\d+):(\d+)\)?/);
          if (match) {
            frames.push({
              function: match[1] || '(anonymous)',
              file: match[2],
              line: parseInt(match[3]),
              column: parseInt(match[4]),
              isUserCode:
                !match[2].includes('node_modules') &&
                !match[2].includes('internal/'),
            });
            continue;
          }

          // Python: "File "path", line N, in func"
          match = line.match(
            /File\s+"(.+?)",\s*line\s+(\d+)(?:,\s*in\s+(.+))?/
          );
          if (match) {
            frames.push({
              function: match[3] || '(module)',
              file: match[1],
              line: parseInt(match[2]),
              column: null,
              isUserCode:
                !match[1].includes('site-packages') &&
                !match[1].includes('/lib/python'),
            });
          }
        }

        // Separate user code from library code
        const userFrames = frames.filter((f) => f.isUserCode);
        const libraryFrames = frames.filter((f) => !f.isUserCode);

        // Identify the root cause frame (first user code frame)
        const rootCause = userFrames[0] || frames[0] || null;

        return {
          success: true,
          action: 'analyze_stacktrace',
          totalFrames: frames.length,
          userFrames: userFrames.length,
          libraryFrames: libraryFrames.length,
          rootCause,
          frames: frames.slice(0, 20),
          userCodePath: userFrames.map(
            (f) => `${f.function} (${path.basename(f.file)}:${f.line})`
          ),
        };
      }

      // ── LINT CHECK ─────────────────────────────────────────────────
      case 'lint_check': {
        const filePath = params.file || params.path;
        if (!filePath) return { success: false, error: 'file is required' };

        const content = await fs.readFile(filePath, 'utf8');
        const lang = getLanguage(filePath);
        const lines = content.split('\n');
        const issues = [];

        // Universal lint checks
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const lineNum = i + 1;

          // Trailing whitespace
          if (line !== line.trimEnd() && line.trim().length > 0) {
            issues.push({
              line: lineNum,
              severity: 'warning',
              rule: 'no-trailing-space',
              message: 'Trailing whitespace',
            });
          }

          // Very long lines
          if (line.length > 200) {
            issues.push({
              line: lineNum,
              severity: 'warning',
              rule: 'max-line-length',
              message: `Line too long (${line.length} chars)`,
            });
          }

          // Tab/space mixing
          if (/^\t+ /.test(line) || /^ +\t/.test(line)) {
            issues.push({
              line: lineNum,
              severity: 'warning',
              rule: 'no-mixed-indent',
              message: 'Mixed tabs and spaces',
            });
          }
        }

        // Language-specific checks
        if (['javascript', 'typescript'].includes(lang)) {
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lineNum = i + 1;

            // console.log in code
            if (
              /console\.(log|debug|info|warn|error)\s*\(/.test(line) &&
              !/\/\//.test(line.split('console')[0])
            ) {
              issues.push({
                line: lineNum,
                severity: 'info',
                rule: 'no-console',
                message: 'Console statement found',
              });
            }

            // var instead of let/const
            if (/^var\s/.test(line)) {
              issues.push({
                line: lineNum,
                severity: 'warning',
                rule: 'no-var',
                message: 'Use let/const instead of var',
              });
            }

            // == instead of ===
            if (/[^!=]={2}[^=]/.test(line) && !/['"`].*==.*['"`]/.test(line)) {
              issues.push({
                line: lineNum,
                severity: 'warning',
                rule: 'eqeqeq',
                message: 'Use === instead of ==',
              });
            }

            // TODO/FIXME/HACK
            if (/\/\/\s*(TODO|FIXME|HACK|XXX|BUG)/i.test(line)) {
              const match = line.match(
                /\/\/\s*(TODO|FIXME|HACK|XXX|BUG):?\s*(.*)/i
              );
              issues.push({
                line: lineNum,
                severity: 'info',
                rule: 'no-todo',
                message: `${match[1]}: ${match[2] || '(no description)'}`,
              });
            }

            // Empty catch blocks
            if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(line)) {
              issues.push({
                line: lineNum,
                severity: 'warning',
                rule: 'no-empty-catch',
                message: 'Empty catch block',
              });
            }

            // Magic numbers
            if (
              /return\s+\d{2,}|===?\s*\d{2,}|\d{2,}\s*===?/.test(line) &&
              !/\b(0|1|2|100|200|201|204|301|302|400|401|403|404|500)\b/.test(
                line
              )
            ) {
              issues.push({
                line: lineNum,
                severity: 'info',
                rule: 'no-magic-numbers',
                message: 'Consider extracting magic number to a constant',
              });
            }
          }
        }

        if (lang === 'python') {
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNum = i + 1;

            // Line too long (PEP 8: 79 chars)
            if (line.length > 120) {
              issues.push({
                line: lineNum,
                severity: 'warning',
                rule: 'E501',
                message: `Line too long (${line.length} > 120)`,
              });
            }

            // Bare except
            if (/except\s*:/.test(line.trim())) {
              issues.push({
                line: lineNum,
                severity: 'warning',
                rule: 'bare-except',
                message: 'Bare except clause, use specific exception type',
              });
            }

            // print() statements
            if (
              /\bprint\s*\(/.test(line.trim()) &&
              !line.trim().startsWith('#')
            ) {
              issues.push({
                line: lineNum,
                severity: 'info',
                rule: 'no-print',
                message: 'Print statement found (use logging instead)',
              });
            }
          }
        }

        // Count by severity
        const counts = { error: 0, warning: 0, info: 0 };
        for (const issue of issues) counts[issue.severity]++;

        return {
          success: true,
          action: 'lint_check',
          file: filePath,
          language: lang,
          totalIssues: issues.length,
          counts,
          issues: issues.slice(0, 100),
        };
      }

      // ── DEPENDENCY AUDIT ───────────────────────────────────────────
      case 'dependency_audit': {
        const dir = params.directory || params.path || '.';
        const result = {
          success: true,
          action: 'dependency_audit',
          directory: dir,
          packageManagers: [],
          analysis: {},
        };

        // Check package.json
        try {
          const raw = await fs.readFile(path.join(dir, 'package.json'), 'utf8');
          const pkg = JSON.parse(raw);
          const deps = Object.entries(pkg.dependencies || {});
          const devDeps = Object.entries(pkg.devDependencies || {});

          result.packageManagers.push('npm');
          result.analysis.npm = {
            dependencies: deps.length,
            devDependencies: devDeps.length,
            total: deps.length + devDeps.length,
            scripts: Object.keys(pkg.scripts || {}),
            engines: pkg.engines || null,
            dependencies_list: deps.map(([name, version]) => ({
              name,
              version,
            })),
            devDependencies_list: devDeps.map(([name, version]) => ({
              name,
              version,
            })),
          };

          // Check for common outdated/problematic patterns
          const warnings = [];
          for (const [name, version] of deps) {
            if (version === '*' || version === 'latest') {
              warnings.push({
                package: name,
                issue: 'Unpinned version — use a specific version',
              });
            }
            if (version.startsWith('file:') || version.startsWith('link:')) {
              warnings.push({
                package: name,
                issue:
                  'Local file reference — ensure it resolves in production',
              });
            }
          }
          result.analysis.npm.warnings = warnings;
        } catch {
          /* no package.json */
        }

        // Check requirements.txt (Python)
        try {
          const raw = await fs.readFile(
            path.join(dir, 'requirements.txt'),
            'utf8'
          );
          const deps = raw
            .split('\n')
            .filter((l) => l.trim() && !l.startsWith('#'));
          result.packageManagers.push('pip');
          result.analysis.pip = {
            dependencies: deps.length,
            packages: deps.map((l) => {
              const match = l.match(/^([^>=<!\s]+)\s*([>=<!=]+\s*[\d.]+)?/);
              return {
                name: match?.[1] || l,
                version: match?.[2]?.trim() || 'unpinned',
              };
            }),
          };
        } catch {
          /* no requirements.txt */
        }

        // Check go.mod
        try {
          const raw = await fs.readFile(path.join(dir, 'go.mod'), 'utf8');
          const deps =
            raw
              .match(/require\s*\(([\s\S]*?)\)/)?.[1]
              ?.split('\n')
              .filter((l) => l.trim()) || [];
          result.packageManagers.push('go');
          result.analysis.go = {
            module: raw.match(/module\s+(.+)/)?.[1] || null,
            goVersion: raw.match(/go\s+([\d.]+)/)?.[1] || null,
            dependencies: deps.length,
          };
        } catch {
          /* no go.mod */
        }

        // Check Cargo.toml
        try {
          const raw = await fs.readFile(path.join(dir, 'Cargo.toml'), 'utf8');
          result.packageManagers.push('cargo');
          const deps =
            raw
              .match(/\[dependencies\]([\s\S]*?)(?:\[|$)/)?.[1]
              ?.split('\n')
              .filter((l) => l.trim() && !l.startsWith('#')) || [];
          result.analysis.cargo = { dependencies: deps.length };
        } catch {
          /* no Cargo.toml */
        }

        return result;
      }

      // ── DEAD CODE DETECTION ────────────────────────────────────────
      case 'dead_code': {
        const dir = params.directory || params.path || '.';
        const fileFilter =
          params.options?.fileFilter || '*.js,*.ts,*.jsx,*.tsx';
        const extensions = fileFilter
          .split(',')
          .map((f) => f.replace('*', '').trim());

        // Collect all exports and all references
        const exports = new Map(); // exportName -> { file, line }
        const references = new Set(); // names that are referenced/imported

        async function scanDir(dirPath) {
          let entries;
          try {
            entries = await fs.readdir(dirPath, { withFileTypes: true });
          } catch {
            return;
          }

          for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
              if (!IGNORE_DIRS.has(entry.name)) await scanDir(fullPath);
              continue;
            }

            if (!extensions.some((ext) => entry.name.endsWith(ext))) continue;

            try {
              const content = await fs.readFile(fullPath, 'utf8');

              // Find exports
              const exportPatterns = [
                /export\s+(?:async\s+)?function\s+(\w+)/g,
                /export\s+(?:const|let|var)\s+(\w+)/g,
                /export\s+class\s+(\w+)/g,
                /export\s+interface\s+(\w+)/g,
                /export\s+type\s+(\w+)/g,
                /export\s+enum\s+(\w+)/g,
              ];

              for (const pattern of exportPatterns) {
                let match;
                const regex = new RegExp(pattern.source, pattern.flags);
                while ((match = regex.exec(content)) !== null) {
                  const before = content.slice(0, match.index);
                  exports.set(`${match[1]}@${fullPath}`, {
                    name: match[1],
                    file: fullPath,
                    line: before.split('\n').length,
                  });
                }
              }

              // Find imports/references
              const importPattern =
                /import\s+(?:(?:type\s+)?{([^}]+)}|(\w+))\s+from/g;
              let importMatch;
              while ((importMatch = importPattern.exec(content)) !== null) {
                const names = (importMatch[1] || importMatch[2] || '').split(
                  ','
                );
                for (const n of names) {
                  const clean = n
                    .trim()
                    .split(/\s+as\s+/)[0]
                    .trim();
                  if (clean) references.add(clean);
                }
              }
            } catch {
              continue;
            }
          }
        }

        await scanDir(dir);

        // Find unreferenced exports
        const potentiallyDead = [];
        for (const [, exp] of exports) {
          if (!references.has(exp.name)) {
            potentiallyDead.push(exp);
          }
        }

        return {
          success: true,
          action: 'dead_code',
          directory: dir,
          totalExports: exports.size,
          totalReferences: references.size,
          potentiallyDeadExports: potentiallyDead.length,
          deadCode: potentiallyDead.slice(0, 100),
          note: 'These exports were not found as imports elsewhere. Some may be entry points or dynamically imported.',
        };
      }

      // ── TODOS SCAN ─────────────────────────────────────────────────
      case 'todos_scan': {
        const dir = params.directory || params.path || '.';
        const tags = params.options?.tags || [
          'TODO',
          'FIXME',
          'HACK',
          'XXX',
          'BUG',
          'WARN',
          'NOTE',
        ];

        const tagRegex = new RegExp(
          `(?://|#|/\\*|<!--)\\s*(${tags.join('|')}):?\\s*(.*)`,
          'gi'
        );
        const results = [];

        async function scanDir(dirPath) {
          let entries;
          try {
            entries = await fs.readdir(dirPath, { withFileTypes: true });
          } catch {
            return;
          }

          for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
              if (!IGNORE_DIRS.has(entry.name)) await scanDir(fullPath);
              continue;
            }
            if (IGNORE_FILES.has(entry.name)) continue;

            try {
              const stat = await fs.stat(fullPath);
              if (stat.size > MAX_FILE_SIZE) continue;
              const content = await fs.readFile(fullPath, 'utf8');
              const lines = content.split('\n');

              for (let i = 0; i < lines.length; i++) {
                tagRegex.lastIndex = 0;
                const match = tagRegex.exec(lines[i]);
                if (match) {
                  results.push({
                    file: fullPath,
                    line: i + 1,
                    tag: match[1].toUpperCase(),
                    message: match[2]
                      .trim()
                      .replace(/\*\/|-->/, '')
                      .trim(),
                    language: getLanguage(fullPath),
                  });
                }
              }
            } catch {
              continue;
            }
          }
        }

        await scanDir(dir);

        // Group by tag
        const byTag = {};
        for (const r of results) {
          if (!byTag[r.tag]) byTag[r.tag] = [];
          byTag[r.tag].push(r);
        }

        return {
          success: true,
          action: 'todos_scan',
          directory: dir,
          total: results.length,
          byTag,
          results: results.slice(0, 200),
        };
      }

      // ── ENV CHECK ──────────────────────────────────────────────────
      case 'env_check': {
        const dir = params.directory || params.path || '.';

        // Find all .env* files
        const envFiles = [];
        try {
          const entries = await fs.readdir(dir);
          for (const entry of entries) {
            if (entry.startsWith('.env')) {
              const content = await fs.readFile(path.join(dir, entry), 'utf8');
              const vars = content
                .split('\n')
                .filter((l) => l.trim() && !l.startsWith('#'))
                .map((l) => {
                  const [key, ...rest] = l.split('=');
                  const value = rest.join('=');
                  return {
                    key: key.trim(),
                    hasValue: value.trim().length > 0,
                    isSecret:
                      /key|secret|password|token|api|auth|private|credential/i.test(
                        key
                      ),
                  };
                });
              envFiles.push({
                file: entry,
                variables: vars,
                count: vars.length,
              });
            }
          }
        } catch {
          /* no access */
        }

        // Find all process.env references in code
        const envUsages = new Set();
        async function scanForEnv(dirPath) {
          let entries;
          try {
            entries = await fs.readdir(dirPath, { withFileTypes: true });
          } catch {
            return;
          }
          for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
              if (!IGNORE_DIRS.has(entry.name)) await scanForEnv(fullPath);
              continue;
            }
            const lang = getLanguage(entry.name);
            if (!['javascript', 'typescript'].includes(lang)) continue;
            try {
              const content = await fs.readFile(fullPath, 'utf8');
              const pattern =
                /process\.env\.(\w+)|process\.env\[['"](\w+)['"]\]/g;
              let match;
              while ((match = pattern.exec(content)) !== null) {
                envUsages.add(match[1] || match[2]);
              }
            } catch {
              continue;
            }
          }
        }
        await scanForEnv(dir);

        // Cross-reference: find used but undefined, and defined but unused
        const allDefined = new Set();
        for (const ef of envFiles) {
          for (const v of ef.variables) allDefined.add(v.key);
        }

        const missing = [...envUsages].filter((v) => !allDefined.has(v));
        const unused = [...allDefined].filter((v) => !envUsages.has(v));

        return {
          success: true,
          action: 'env_check',
          directory: dir,
          envFiles,
          referencedInCode: [...envUsages],
          missingFromEnv: missing,
          definedButUnused: unused,
        };
      }

      default:
        return { success: false, error: `Unknown dev_debug action: ${action}` };
    }
  } catch (err) {
    return { success: false, action, error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function detectPackageManager(dir) {
  try {
    await fs.stat(path.join(dir, 'pnpm-lock.yaml'));
    return 'pnpm';
  } catch {}
  try {
    await fs.stat(path.join(dir, 'yarn.lock'));
    return 'yarn';
  } catch {}
  try {
    await fs.stat(path.join(dir, 'bun.lockb'));
    return 'bun';
  } catch {}
  try {
    await fs.stat(path.join(dir, 'package-lock.json'));
    return 'npm';
  } catch {}
  return 'unknown';
}

function getErrorSuggestions(type, message, fullText) {
  const suggestions = [];

  if (type === 'TypeError') {
    if (/undefined|null/i.test(message)) {
      suggestions.push('Check if the variable is initialized before use');
      suggestions.push('Add optional chaining (?.) or null checks');
      suggestions.push('Verify API response shape matches expectations');
    }
    if (/not a function/i.test(message)) {
      suggestions.push(
        'Check import path — you may be importing the wrong export'
      );
      suggestions.push('Verify the module exports the function correctly');
      suggestions.push('Check for circular dependencies');
    }
  }

  if (type === 'ReferenceError') {
    suggestions.push('Check for typos in the variable/function name');
    suggestions.push('Ensure the variable is declared before use');
    suggestions.push('Check scope — it might be declared in a different scope');
  }

  if (type === 'SyntaxError') {
    suggestions.push('Check for missing brackets, parentheses, or semicolons');
    suggestions.push('Look for unexpected tokens near the reported line');
    suggestions.push('Verify JSON/config files for trailing commas');
  }

  if (type === 'ModuleNotFoundError' || /Cannot find module/i.test(fullText)) {
    suggestions.push(
      'Run npm install / pip install to install missing dependencies'
    );
    suggestions.push('Check the import path for typos');
    suggestions.push(
      'Verify package.json/requirements.txt includes the dependency'
    );
  }

  if (/ENOENT/i.test(fullText)) {
    suggestions.push('File or directory does not exist — check the path');
    suggestions.push('Ensure the file was created before reading');
    suggestions.push('Check working directory context');
  }

  if (/EACCES|EPERM/i.test(fullText)) {
    suggestions.push('Permission denied — check file/directory permissions');
    suggestions.push('Try running with elevated permissions if appropriate');
  }

  if (/ECONNREFUSED/i.test(fullText)) {
    suggestions.push('The server is not running or not accepting connections');
    suggestions.push('Check the port number and host');
    suggestions.push('Verify firewall/network settings');
  }

  if (suggestions.length === 0) {
    suggestions.push('Read the full error message and stack trace carefully');
    suggestions.push('Search for the exact error message online');
    suggestions.push(
      'Check recent code changes that might have introduced the issue'
    );
  }

  return suggestions;
}
