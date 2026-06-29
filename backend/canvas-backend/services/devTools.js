/**
 * DEVELOPER TOOLS
 * 8 tools: dev_filesystem, dev_search, dev_intelligence, dev_debug,
 *          dev_test, dev_git, dev_npm, dev_docker
 */

import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export const DEV_TOOL_DEFINITIONS = [
  {
    name: 'dev_filesystem',
    description: 'File system analysis: project tree, file stats, disk usage, duplicates, diff between files.',
    input_schema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['tree', 'stats', 'disk_usage', 'diff', 'duplicates'],
                     description: 'Operation to perform' },
        path:  { type: 'string', description: 'Target path (default: workspace root)' },
        path2: { type: 'string', description: 'Second path for diff operation' },
      },
      required: ['operation'],
    },
  },
  {
    name: 'dev_search',
    description: 'Search files: grep text, find by name, regex search, find-and-replace across files.',
    input_schema: {
      type: 'object',
      properties: {
        operation:   { type: 'string', enum: ['grep', 'find_file', 'regex', 'find_replace'],
                       description: 'Search operation' },
        pattern:     { type: 'string', description: 'Search pattern or text' },
        path:        { type: 'string', description: 'Directory to search (default: workspace root)' },
        replacement: { type: 'string', description: 'Replacement text (for find_replace)' },
        glob:        { type: 'string', description: 'File glob filter (e.g. "*.js")' },
      },
      required: ['operation', 'pattern'],
    },
  },
  {
    name: 'dev_intelligence',
    description: 'Code intelligence: symbols, references, imports, language detection, framework detection.',
    input_schema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['symbols', 'imports', 'language_detect', 'framework_detect', 'complexity'],
                     description: 'Analysis operation' },
        path: { type: 'string', description: 'File or directory path' },
      },
      required: ['operation', 'path'],
    },
  },
  {
    name: 'dev_debug',
    description: 'Debug assistance: parse errors, stack traces, lint code, audit dependencies, find dead code, list TODOs.',
    input_schema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['parse_error', 'lint', 'audit_deps', 'dead_code', 'todos', 'stack_trace'],
                     description: 'Debug operation' },
        path:  { type: 'string', description: 'File or directory path' },
        error: { type: 'string', description: 'Error message or stack trace to parse' },
      },
      required: ['operation'],
    },
  },
  {
    name: 'dev_test',
    description: 'Run tests, generate mocks, check coverage (Jest/Vitest/Pytest compatible).',
    input_schema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['run', 'coverage', 'watch', 'list'],
                     description: 'Test operation' },
        path:    { type: 'string', description: 'Test file or directory' },
        pattern: { type: 'string', description: 'Test name pattern filter' },
      },
      required: ['operation'],
    },
  },
  {
    name: 'dev_git',
    description: 'Git operations: status, diff, add, commit, push, pull, branch, log, blame.',
    input_schema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['status', 'diff', 'add', 'commit', 'push', 'pull', 'branch', 'log', 'blame', 'clone'],
                     description: 'Git operation' },
        path:    { type: 'string', description: 'Target path (default: workspace root)' },
        message: { type: 'string', description: 'Commit message (for commit)' },
        branch:  { type: 'string', description: 'Branch name (for branch/checkout)' },
        url:     { type: 'string', description: 'Repository URL (for clone)' },
      },
      required: ['operation'],
    },
  },
  {
    name: 'dev_npm',
    description: 'NPM/package manager operations: install, update, audit, run scripts, check versions.',
    input_schema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['install', 'update', 'audit', 'run', 'list', 'outdated'],
                     description: 'NPM operation' },
        path:     { type: 'string', description: 'Project directory (default: workspace root)' },
        packages: { type: 'array', items: { type: 'string' }, description: 'Package names (for install/update)' },
        script:   { type: 'string', description: 'Script name (for run)' },
        dev:      { type: 'boolean', description: 'Install as devDependency (for install)' },
      },
      required: ['operation'],
    },
  },
  {
    name: 'dev_docker',
    description: 'Docker operations: build, run, stop, list containers/images, compose up/down.',
    input_schema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['build', 'run', 'stop', 'rm', 'ps', 'images', 'compose_up', 'compose_down', 'logs'],
                     description: 'Docker operation' },
        path:    { type: 'string', description: 'Dockerfile or compose file directory' },
        image:   { type: 'string', description: 'Image name/tag' },
        container: { type: 'string', description: 'Container name or ID' },
        ports:   { type: 'string', description: 'Port mapping (e.g. "8080:80")' },
        env:     { type: 'object', description: 'Environment variables' },
      },
      required: ['operation'],
    },
  },
];

// ============================================================================
// EXECUTORS
// ============================================================================

function run(cmd, cwd = process.cwd(), timeout = 30000) {
  const result = spawnSync(cmd, { shell: true, encoding: 'utf8', cwd, timeout });
  return (result.stdout || '') + (result.stderr || '');
}

export async function executeDevTool(toolName, input, ctx = {}) {
  const root = ctx.workspaceRoot || process.cwd();

  try {
    switch (toolName) {
      case 'dev_filesystem': {
        const dir = path.resolve(root, input.path || '.');
        switch (input.operation) {
          case 'tree':       return { result: run(`find "${dir}" -not -path "*/node_modules/*" -not -path "*/.git/*" | head -200`, root) };
          case 'stats':      return { result: run(`ls -la "${dir}"`, root) };
          case 'disk_usage': return { result: run(`du -sh "${dir}"`, root) };
          case 'diff': {
            const p2 = path.resolve(root, input.path2 || '');
            return { result: run(`diff "${dir}" "${p2}"`, root) };
          }
          default: return { result: JSON.stringify({ status: 'error', error: 'Unknown operation' }) };
        }
      }

      case 'dev_search': {
        const dir = path.resolve(root, input.path || '.');
        switch (input.operation) {
          case 'grep': {
            const glob = input.glob ? `--include="${input.glob}"` : '';
            const out  = run(`grep -r ${glob} -n "${input.pattern}" "${dir}" 2>/dev/null | head -100`, root);
            return { result: JSON.stringify({ status: 'success', matches: out }) };
          }
          case 'find_file': {
            const out = run(`find "${dir}" -name "${input.pattern}" -not -path "*/node_modules/*" | head -50`, root);
            return { result: JSON.stringify({ status: 'success', files: out.trim().split('\n').filter(Boolean) }) };
          }
          case 'regex': {
            const out = run(`grep -rP "${input.pattern}" "${dir}" --include="${input.glob || '*'}" | head -100`, root);
            return { result: JSON.stringify({ status: 'success', matches: out }) };
          }
          case 'find_replace': {
            const glob = input.glob || '*.js';
            run(`find "${dir}" -name "${glob}" -not -path "*/node_modules/*" -exec sed -i '' 's/${input.pattern}/${input.replacement}/g' {} +`, root);
            return { result: JSON.stringify({ status: 'success', message: 'Replacement applied' }) };
          }
          default: return { result: JSON.stringify({ status: 'error', error: 'Unknown operation' }) };
        }
      }

      case 'dev_intelligence': {
        const fp = path.resolve(root, input.path || '.');
        switch (input.operation) {
          case 'imports': {
            const out = run(`grep -rn "^import\\|^require" "${fp}" | head -50`, root);
            return { result: JSON.stringify({ status: 'success', imports: out }) };
          }
          case 'language_detect': {
            const ext = path.extname(fp);
            const LANG_MAP = { '.js': 'JavaScript', '.ts': 'TypeScript', '.py': 'Python',
              '.rb': 'Ruby', '.go': 'Go', '.rs': 'Rust', '.java': 'Java', '.cs': 'C#',
              '.cpp': 'C++', '.c': 'C', '.php': 'PHP', '.swift': 'Swift', '.kt': 'Kotlin' };
            return { result: JSON.stringify({ status: 'success', language: LANG_MAP[ext] || 'Unknown', extension: ext }) };
          }
          case 'framework_detect': {
            let pkgJsonPath;
            try { pkgJsonPath = path.join(fp, 'package.json'); } catch { pkgJsonPath = null; }
            let frameworks = [];
            if (pkgJsonPath && fs.existsSync(pkgJsonPath)) {
              const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
              const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
              if (deps.react)   frameworks.push('React');
              if (deps.next)    frameworks.push('Next.js');
              if (deps.vue)     frameworks.push('Vue');
              if (deps.angular) frameworks.push('Angular');
              if (deps.express) frameworks.push('Express');
              if (deps.fastify) frameworks.push('Fastify');
            }
            return { result: JSON.stringify({ status: 'success', frameworks }) };
          }
          default: return { result: JSON.stringify({ status: 'error', error: 'Unknown operation' }) };
        }
      }

      case 'dev_debug': {
        const dir = path.resolve(root, input.path || '.');
        switch (input.operation) {
          case 'todos': {
            const out = run(`grep -rn "TODO\\|FIXME\\|HACK\\|XXX\\|NOTE" "${dir}" --include="*.js" --include="*.ts" | head -50`, root);
            return { result: JSON.stringify({ status: 'success', todos: out }) };
          }
          case 'lint': {
            const out = run(`cd "${root}" && npx eslint "${dir}" --max-warnings 20 2>&1 | head -50`, root, 30000);
            return { result: JSON.stringify({ status: 'success', lint_output: out }) };
          }
          case 'audit_deps': {
            const out = run(`cd "${root}" && npm audit --json 2>&1 | head -100`, root, 30000);
            return { result: JSON.stringify({ status: 'success', audit: out }) };
          }
          case 'parse_error': {
            const error = input.error || '';
            const lines = error.split('\n').filter(l => l.trim());
            return { result: JSON.stringify({ status: 'success', parsed: { message: lines[0], stack: lines.slice(1) } }) };
          }
          default: return { result: JSON.stringify({ status: 'error', error: 'Unknown operation' }) };
        }
      }

      case 'dev_test': {
        const dir = path.resolve(root, input.path || '.');
        switch (input.operation) {
          case 'run': {
            const out = run(`cd "${root}" && npx vitest run "${dir}" 2>&1 | tail -30`, root, 60000);
            return { result: JSON.stringify({ status: 'success', output: out }) };
          }
          case 'coverage': {
            const out = run(`cd "${root}" && npx vitest run --coverage 2>&1 | tail -30`, root, 120000);
            return { result: JSON.stringify({ status: 'success', coverage: out }) };
          }
          default: return { result: JSON.stringify({ status: 'error', error: 'Unknown operation' }) };
        }
      }

      case 'dev_git': {
        const dir = path.resolve(root, input.path || '.');
        switch (input.operation) {
          case 'status':  return { result: run(`cd "${dir}" && git status`, dir) };
          case 'diff':    return { result: run(`cd "${dir}" && git diff`, dir) };
          case 'add':     return { result: run(`cd "${dir}" && git add -A`, dir) };
          case 'log':     return { result: run(`cd "${dir}" && git log --oneline -20`, dir) };
          case 'commit': {
            const msg = input.message || 'Auto commit';
            return { result: run(`cd "${dir}" && git add -A && git commit -m "${msg}"`, dir) };
          }
          case 'push':   return { result: run(`cd "${dir}" && git push`, dir, 60000) };
          case 'pull':   return { result: run(`cd "${dir}" && git pull`, dir, 60000) };
          case 'branch': {
            if (input.branch) return { result: run(`cd "${dir}" && git checkout -b "${input.branch}"`, dir) };
            return { result: run(`cd "${dir}" && git branch`, dir) };
          }
          case 'clone': {
            if (!input.url) throw new Error('URL required for clone');
            return { result: run(`git clone "${input.url}" "${dir}"`, root, 120000) };
          }
          default: return { result: JSON.stringify({ status: 'error', error: 'Unknown git operation' }) };
        }
      }

      case 'dev_npm': {
        const dir = path.resolve(root, input.path || '.');
        switch (input.operation) {
          case 'install': {
            const pkgs = (input.packages || []).join(' ');
            const flag = input.dev ? '--save-dev' : '--save';
            const cmd  = pkgs ? `npm install ${flag} ${pkgs}` : 'npm install';
            return { result: run(`cd "${dir}" && ${cmd} 2>&1 | tail -20`, dir, 120000) };
          }
          case 'audit':   return { result: run(`cd "${dir}" && npm audit 2>&1 | head -50`, dir, 30000) };
          case 'outdated': return { result: run(`cd "${dir}" && npm outdated 2>&1`, dir, 30000) };
          case 'list':    return { result: run(`cd "${dir}" && npm list --depth=1 2>&1 | head -50`, dir, 30000) };
          case 'run': {
            if (!input.script) throw new Error('script name required');
            return { result: run(`cd "${dir}" && npm run ${input.script} 2>&1 | tail -50`, dir, 120000) };
          }
          default: return { result: JSON.stringify({ status: 'error', error: 'Unknown npm operation' }) };
        }
      }

      case 'dev_docker': {
        switch (input.operation) {
          case 'ps':      return { result: run('docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"') };
          case 'images':  return { result: run('docker images') };
          case 'build': {
            const dir = path.resolve(root, input.path || '.');
            return { result: run(`docker build -t "${input.image || 'app:latest'}" "${dir}" 2>&1 | tail -20`, dir, 300000) };
          }
          case 'run': {
            const ports = input.ports ? `-p ${input.ports}` : '';
            return { result: run(`docker run -d ${ports} "${input.image || 'app:latest'}"`) };
          }
          case 'stop':    return { result: run(`docker stop ${input.container}`) };
          case 'logs':    return { result: run(`docker logs --tail 50 ${input.container}`) };
          case 'compose_up': {
            const dir = path.resolve(root, input.path || '.');
            return { result: run(`cd "${dir}" && docker compose up -d 2>&1 | tail -20`, dir, 120000) };
          }
          case 'compose_down': {
            const dir = path.resolve(root, input.path || '.');
            return { result: run(`cd "${dir}" && docker compose down 2>&1`, dir, 60000) };
          }
          default: return { result: JSON.stringify({ status: 'error', error: 'Unknown docker operation' }) };
        }
      }

      default:
        return { result: JSON.stringify({ status: 'error', error: `Unknown tool: ${toolName}` }) };
    }
  } catch (err) {
    return { result: JSON.stringify({ status: 'error', error: err.message, tool: toolName }) };
  }
}

export const isDevTool = (name) => DEV_TOOL_DEFINITIONS.some(t => t.name === name);
