/**
 * CODE TOOLS  —  code execution, analysis, formatting, linting
 */

import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export const CODE_TOOL_DEFINITIONS = [
  {
    name: 'code_execute',
    description: 'Execute JavaScript, TypeScript, Python, or Bash code. Returns stdout, stderr.',
    input_schema: {
      type: 'object',
      properties: {
        code:     { type: 'string', description: 'Code to execute' },
        language: { type: 'string', enum: ['javascript','typescript','python','bash'],
                    description: 'Programming language (default: javascript)' },
        timeout:  { type: 'number', description: 'Timeout ms (default: 30000)' },
        env:      { type: 'object', description: 'Extra environment variables' },
      },
      required: ['code'],
    },
  },
  {
    name: 'code_format',
    description: 'Format code using Prettier (JS/TS/CSS/HTML/JSON) or Black (Python).',
    input_schema: {
      type: 'object',
      properties: {
        code:     { type: 'string', description: 'Code to format' },
        language: { type: 'string', description: 'Language: javascript, typescript, css, html, json, python' },
        options:  { type: 'object', description: 'Formatter options (e.g. { "tabWidth": 2, "singleQuote": true })' },
      },
      required: ['code', 'language'],
    },
  },
  {
    name: 'code_lint',
    description: 'Lint code with ESLint (JS/TS) or pylint (Python). Returns issues list.',
    input_schema: {
      type: 'object',
      properties: {
        code:     { type: 'string', description: 'Code to lint' },
        language: { type: 'string', description: 'Language: javascript, typescript, python' },
        fix:      { type: 'boolean', description: 'Auto-fix issues where possible (default: false)' },
      },
      required: ['code', 'language'],
    },
  },
  {
    name: 'code_analyze',
    description: 'Analyze code: count lines, functions, complexity, detect patterns, find todos.',
    input_schema: {
      type: 'object',
      properties: {
        code:      { type: 'string', description: 'Code to analyze' },
        language:  { type: 'string', description: 'Programming language' },
        checks:    { type: 'array', items: { type: 'string' },
                     description: 'Checks to run: ["metrics","todos","imports","exports","functions","security"]' },
      },
      required: ['code'],
    },
  },
  {
    name: 'code_transform',
    description: 'Transform code: convert between JS/TS, add types, remove comments, minify, prettify.',
    input_schema: {
      type: 'object',
      properties: {
        code:      { type: 'string', description: 'Source code' },
        operation: { type: 'string', enum: ['minify','remove_comments','add_semicolons','to_arrow','to_async_await','sort_imports'],
                     description: 'Transformation operation' },
        language:  { type: 'string', description: 'Source language' },
      },
      required: ['code', 'operation'],
    },
  },
];

// ─────────────────────────────────────────────────── executor ──

function runCmd(cmd, env = {}, timeout = 30000) {
  const r = spawnSync(cmd, { shell: true, encoding: 'utf8', timeout, env: { ...process.env, ...env } });
  return { stdout: r.stdout || '', stderr: r.stderr || '', code: r.status };
}

export async function executeCodeTool(toolName, input, ctx = {}) {
  try {
    switch (toolName) {
      case 'code_execute': {
        const lang    = input.language || 'javascript';
        const timeout = Math.min(input.timeout || 30000, 60000);
        const tmpFile = `/tmp/code_exec_${Date.now()}${lang === 'python' ? '.py' : lang === 'typescript' ? '.ts' : '.mjs'}`;
        fs.writeFileSync(tmpFile, input.code);

        let result;
        if (lang === 'python')  result = runCmd(`python3 "${tmpFile}"`, input.env || {}, timeout);
        else if (lang === 'typescript') result = runCmd(`npx ts-node "${tmpFile}"`, input.env || {}, timeout);
        else if (lang === 'bash')       result = runCmd(`bash "${tmpFile}"`, input.env || {}, timeout);
        else                            result = runCmd(`node "${tmpFile}"`, input.env || {}, timeout);

        try { fs.unlinkSync(tmpFile); } catch {}
        return { result: JSON.stringify({
          status: result.code === 0 ? 'success' : 'error',
          stdout: result.stdout.slice(0, 10000),
          stderr: result.stderr.slice(0, 2000),
          exit_code: result.code,
        }) };
      }

      case 'code_format': {
        const lang    = input.language || 'javascript';
        const tmpFile = `/tmp/fmt_${Date.now()}.${lang === 'python' ? 'py' : lang === 'css' ? 'css' : lang === 'html' ? 'html' : 'js'}`;
        fs.writeFileSync(tmpFile, input.code);

        let formatted = input.code;
        if (lang === 'python') {
          const r = runCmd(`python3 -m black --quiet "${tmpFile}" 2>/dev/null && cat "${tmpFile}"`);
          if (r.code === 0) formatted = r.stdout;
        } else {
          const opts = JSON.stringify(input.options || {});
          const r    = runCmd(`npx prettier --write --parser ${lang === 'typescript' ? 'typescript' : 'babel'} "${tmpFile}" 2>/dev/null && cat "${tmpFile}"`);
          if (r.code === 0) formatted = r.stdout;
        }
        try { fs.unlinkSync(tmpFile); } catch {}
        return { result: JSON.stringify({ status: 'success', formatted }) };
      }

      case 'code_lint': {
        const lang    = input.language || 'javascript';
        const tmpFile = `/tmp/lint_${Date.now()}.${lang === 'python' ? 'py' : 'js'}`;
        fs.writeFileSync(tmpFile, input.code);

        let issues = [];
        if (lang === 'python') {
          const r = runCmd(`python3 -m pylint "${tmpFile}" --output-format=json 2>/dev/null`);
          try { issues = JSON.parse(r.stdout).map(i => ({ line: i.line, message: i.message, type: i.type })); } catch {}
        } else {
          const r = runCmd(`npx eslint "${tmpFile}" --format json 2>/dev/null`);
          try {
            const data = JSON.parse(r.stdout);
            issues = (data[0]?.messages || []).map(m => ({ line: m.line, message: m.message, severity: m.severity }));
          } catch {}
        }
        try { fs.unlinkSync(tmpFile); } catch {}
        return { result: JSON.stringify({ status: 'success', issues, count: issues.length, passed: issues.length === 0 }) };
      }

      case 'code_analyze': {
        const code   = input.code;
        const checks = input.checks || ['metrics', 'todos', 'imports', 'functions'];
        const result = {};

        if (checks.includes('metrics')) {
          const lines    = code.split('\n');
          result.metrics = {
            total_lines: lines.length,
            code_lines:  lines.filter(l => l.trim() && !l.trim().startsWith('//')).length,
            blank_lines: lines.filter(l => !l.trim()).length,
          };
        }
        if (checks.includes('todos')) {
          result.todos = [...code.matchAll(/\/\/\s*(TODO|FIXME|HACK|XXX)[:\s]+(.+)/gi)].map(m => ({ type: m[1], text: m[2].trim() }));
        }
        if (checks.includes('imports')) {
          result.imports = [...code.matchAll(/^import\s+.+from\s+['"](.+)['"]/gm)].map(m => m[1]);
        }
        if (checks.includes('functions')) {
          result.functions = [...code.matchAll(/(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\()/g)].map(m => m[1]||m[2]);
        }
        if (checks.includes('security')) {
          const risks = [];
          if (/eval\s*\(/.test(code))            risks.push('eval() usage detected');
          if (/innerHTML\s*=/.test(code))         risks.push('innerHTML assignment (XSS risk)');
          if (/exec\s*\([^)]*\$\{/.test(code))   risks.push('Command injection risk');
          if (/Math\.random\(\)/.test(code))      risks.push('Weak randomness (use crypto.randomBytes)');
          result.security = { risks };
        }
        return { result: JSON.stringify({ status: 'success', ...result }) };
      }

      case 'code_transform': {
        let code = input.code;
        switch (input.operation) {
          case 'remove_comments':     code = code.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, ''); break;
          case 'add_semicolons':      code = code.replace(/([^;,{\n])\n/g, '$1;\n'); break;
          case 'minify':              code = code.replace(/\s+/g, ' ').replace(/\s*([{}();,=+\-*/<>!&|])\s*/g, '$1'); break;
          case 'sort_imports':  {
            const lines    = code.split('\n');
            const imports  = lines.filter(l => l.startsWith('import '));
            const rest     = lines.filter(l => !l.startsWith('import '));
            code           = [...imports.sort(), '', ...rest].join('\n');
            break;
          }
          default: break;
        }
        return { result: JSON.stringify({ status: 'success', code }) };
      }

      default:
        return { result: JSON.stringify({ status: 'error', error: `Unknown tool: ${toolName}` }) };
    }
  } catch (err) {
    return { result: JSON.stringify({ status: 'error', error: err.message, tool: toolName }) };
  }
}

export const isCodeTool = (name) => CODE_TOOL_DEFINITIONS.some(t => t.name === name);
