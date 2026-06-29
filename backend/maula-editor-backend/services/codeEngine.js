/**
 * CODE ENGINE — Code intelligence operations using fs, child_process, isomorphic-git
 * Provides file editing, navigation, symbol extraction, git, deps, lint, test,
 * refactor, metrics, debug, docs, and scaffolding.
 */

import fs from 'fs/promises';
import { existsSync, statSync } from 'fs';
import path from 'path';
import { execSync, exec } from 'child_process';
import git from 'isomorphic-git';
import gitFs from 'fs';

// ── Helpers ─────────────────────────────────────────────────────────────────

function safeExec(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: 'utf-8', timeout: 30000, maxBuffer: 10 * 1024 * 1024, ...opts }).trim();
  } catch (err) {
    return err.stdout?.toString().trim() || err.message;
  }
}

async function walkDir(dir, maxDepth = 5, depth = 0, base = dir) {
  if (depth > maxDepth) return [];
  let results = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (['node_modules', '.git', 'dist', 'build', '.next', '__pycache__', '.cache'].includes(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(base, fullPath);
      results.push({ name: entry.name, path: relPath, isDir: entry.isDirectory() });
      if (entry.isDirectory()) {
        results = results.concat(await walkDir(fullPath, maxDepth, depth + 1, base));
      }
    }
  } catch { /* permission denied etc */ }
  return results;
}

function resolveProjectPath(projectPath) {
  return projectPath || process.cwd();
}

function resolvePath(projectPath, filePath) {
  if (!filePath) return projectPath;
  return path.isAbsolute(filePath) ? filePath : path.join(projectPath, filePath);
}

// ── 1. CODE EDIT ────────────────────────────────────────────────────────────

export async function codeEdit(projectPath, action, params = {}) {
  try {
    const root = resolveProjectPath(projectPath);
    const targetFile = resolvePath(root, params.filePath);

    switch (action) {
      case 'patch': {
        // Apply a unified diff string (basic line-by-line apply)
        if (!params.patch) return { success: false, error: 'patch content required' };
        const content = await fs.readFile(targetFile, 'utf-8');
        const lines = content.split('\n');
        const result = applySimplePatch(lines, params.patch);
        await fs.writeFile(targetFile, result.join('\n'));
        return { success: true, action: 'patch', file: params.filePath, linesChanged: result.length };
      }

      case 'find_replace': {
        if (!params.pattern) return { success: false, error: 'pattern required' };
        let content = await fs.readFile(targetFile, 'utf-8');
        const flags = (params.global !== false ? 'g' : '') + (params.isRegex ? '' : '');
        const regex = params.isRegex ? new RegExp(params.pattern, flags) : null;
        const count = (content.match(regex || new RegExp(escapeRegex(params.pattern), flags)) || []).length;
        content = regex
          ? content.replace(regex, params.replacement || '')
          : content.replaceAll(params.pattern, params.replacement || '');
        await fs.writeFile(targetFile, content);
        return { success: true, action: 'find_replace', file: params.filePath, replacements: count };
      }

      case 'insert_lines': {
        const content = await fs.readFile(targetFile, 'utf-8');
        const lines = content.split('\n');
        const lineNum = params.lineNumber || 0;
        const newLines = (params.content || '').split('\n');
        lines.splice(lineNum, 0, ...newLines);
        await fs.writeFile(targetFile, lines.join('\n'));
        return { success: true, action: 'insert_lines', file: params.filePath, insertedAt: lineNum, linesInserted: newLines.length };
      }

      case 'delete_lines': {
        const content = await fs.readFile(targetFile, 'utf-8');
        const lines = content.split('\n');
        const start = (params.startLine || 1) - 1;
        const end = params.endLine || start + 1;
        const deleted = lines.splice(start, end - start);
        await fs.writeFile(targetFile, lines.join('\n'));
        return { success: true, action: 'delete_lines', file: params.filePath, linesDeleted: deleted.length };
      }

      case 'update_range': {
        const content = await fs.readFile(targetFile, 'utf-8');
        const lines = content.split('\n');
        const start = (params.startLine || 1) - 1;
        const end = params.endLine || start + 1;
        const newLines = (params.content || '').split('\n');
        lines.splice(start, end - start, ...newLines);
        await fs.writeFile(targetFile, lines.join('\n'));
        return { success: true, action: 'update_range', file: params.filePath, rangeReplaced: `${params.startLine}-${params.endLine}`, newLines: newLines.length };
      }

      default:
        return { success: false, error: `Unknown edit action: ${action}` };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function escapeRegex(str) { return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function applySimplePatch(lines, patch) {
  // Simple patch: lines starting with + are added, - are removed, else context
  const patchLines = patch.split('\n');
  const result = [...lines];
  let offset = 0;
  for (const pl of patchLines) {
    if (pl.startsWith('@@')) {
      const m = pl.match(/@@ -(\d+)/);
      if (m) offset = parseInt(m[1]) - 1;
    } else if (pl.startsWith('+') && !pl.startsWith('+++')) {
      result.splice(offset, 0, pl.slice(1));
      offset++;
    } else if (pl.startsWith('-') && !pl.startsWith('---')) {
      result.splice(offset, 1);
    } else {
      offset++;
    }
  }
  return result;
}

// ── 2. CODE NAVIGATE ────────────────────────────────────────────────────────

export async function codeNavigate(projectPath, action, params = {}) {
  try {
    const root = resolveProjectPath(projectPath);

    switch (action) {
      case 'project_tree': {
        const tree = await walkDir(root, params.maxDepth || 5);
        const dirs = tree.filter(t => t.isDir);
        const files = tree.filter(t => !t.isDir);
        return { success: true, action: 'project_tree', totalDirs: dirs.length, totalFiles: files.length, tree: tree.slice(0, 500) };
      }

      case 'find_file': {
        const pattern = params.pattern || '*';
        const tree = await walkDir(root, 10);
        const isGlob = pattern.includes('*');
        const regex = isGlob
          ? new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$', 'i')
          : new RegExp(pattern, 'i');
        const matches = tree.filter(t => !t.isDir && regex.test(t.name));
        return { success: true, action: 'find_file', pattern, matchCount: matches.length, matches: matches.slice(0, 100) };
      }

      case 'file_exists': {
        const target = resolvePath(root, params.filePath);
        const exists = existsSync(target);
        let info = null;
        if (exists) {
          const stat = statSync(target);
          info = { size: stat.size, isDirectory: stat.isDirectory(), modified: stat.mtime.toISOString() };
        }
        return { success: true, action: 'file_exists', filePath: params.filePath, exists, info };
      }

      case 'detect_language': {
        const tree = await walkDir(root, 3);
        const extCount = {};
        for (const f of tree.filter(t => !t.isDir)) {
          const ext = path.extname(f.name).toLowerCase();
          if (ext) extCount[ext] = (extCount[ext] || 0) + 1;
        }
        const langMap = { '.js': 'JavaScript', '.ts': 'TypeScript', '.tsx': 'TypeScript/React', '.jsx': 'JavaScript/React', '.py': 'Python', '.java': 'Java', '.go': 'Go', '.rs': 'Rust', '.rb': 'Ruby', '.php': 'PHP' };
        const sorted = Object.entries(extCount).sort((a, b) => b[1] - a[1]);
        const primary = sorted.find(([ext]) => langMap[ext]);
        return { success: true, action: 'detect_language', primary: primary ? langMap[primary[0]] : 'Unknown', extensions: Object.fromEntries(sorted.slice(0, 15)) };
      }

      default:
        return { success: false, error: `Unknown navigate action: ${action}` };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 3. CODE SYMBOLS ─────────────────────────────────────────────────────────

export async function codeSymbols(projectPath, action, params = {}) {
  try {
    const root = resolveProjectPath(projectPath);

    switch (action) {
      case 'extract_symbols': {
        const target = resolvePath(root, params.filePath);
        const content = await fs.readFile(target, 'utf-8');
        const symbols = extractSymbolsFromCode(content);
        return { success: true, action: 'extract_symbols', file: params.filePath, symbols };
      }

      case 'find_references': {
        if (!params.symbol) return { success: false, error: 'symbol required' };
        const pattern = escapeRegex(params.symbol);
        const result = safeExec(`grep -rn "${pattern}" "${root}" --include="*.{js,ts,jsx,tsx,py}" -l`, { cwd: root });
        const files = result.split('\n').filter(Boolean).slice(0, 50);
        return { success: true, action: 'find_references', symbol: params.symbol, fileCount: files.length, files };
      }

      case 'go_to_definition': {
        if (!params.symbol) return { success: false, error: 'symbol required' };
        const defPatterns = [
          `function ${params.symbol}`,
          `const ${params.symbol}`,
          `class ${params.symbol}`,
          `export.*${params.symbol}`,
          `def ${params.symbol}`,
        ];
        const pattern = defPatterns.join('|');
        const result = safeExec(`grep -rn -E "${pattern}" "${root}" --include="*.{js,ts,jsx,tsx,py}"`, { cwd: root });
        const matches = result.split('\n').filter(Boolean).slice(0, 20).map(line => {
          const m = line.match(/^(.+?):(\d+):(.+)$/);
          return m ? { file: path.relative(root, m[1]), line: parseInt(m[2]), text: m[3].trim() } : null;
        }).filter(Boolean);
        return { success: true, action: 'go_to_definition', symbol: params.symbol, definitions: matches };
      }

      case 'get_outline': {
        const target = resolvePath(root, params.filePath);
        const content = await fs.readFile(target, 'utf-8');
        const symbols = extractSymbolsFromCode(content);
        return { success: true, action: 'get_outline', file: params.filePath, outline: symbols };
      }

      default:
        return { success: false, error: `Unknown symbols action: ${action}` };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function extractSymbolsFromCode(content) {
  const symbols = [];
  const lines = content.split('\n');
  const patterns = [
    { regex: /^(?:export\s+)?(?:async\s+)?function\s+(\w+)/m, type: 'function' },
    { regex: /^(?:export\s+)?class\s+(\w+)/m, type: 'class' },
    { regex: /^(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=/m, type: 'variable' },
    { regex: /^(?:export\s+)?interface\s+(\w+)/m, type: 'interface' },
    { regex: /^(?:export\s+)?type\s+(\w+)/m, type: 'type' },
    { regex: /^(?:export\s+)?enum\s+(\w+)/m, type: 'enum' },
    { regex: /^\s*def\s+(\w+)/m, type: 'function' },
  ];
  for (let i = 0; i < lines.length; i++) {
    for (const { regex, type } of patterns) {
      const m = lines[i].match(regex);
      if (m) {
        symbols.push({ name: m[1], type, line: i + 1 });
        break;
      }
    }
  }
  return symbols;
}

// ── 4. CODE GIT ─────────────────────────────────────────────────────────────

export async function codeGit(projectPath, action, params = {}) {
  try {
    const root = resolveProjectPath(projectPath);

    switch (action) {
      case 'status': {
        const matrix = await git.statusMatrix({ fs: gitFs, dir: root });
        const changes = matrix
          .filter(([, head, work, stage]) => !(head === 1 && work === 1 && stage === 1))
          .map(([file, head, work, stage]) => ({
            file,
            status: head === 0 && work === 2 ? 'new' : work === 0 ? 'deleted' : work === 2 ? 'modified' : 'unknown',
            staged: stage === 2 || stage === 3,
          }));
        return { success: true, action: 'status', changes, totalChanges: changes.length };
      }

      case 'diff': {
        // Use system git for richer diff output
        const diffTarget = params.filePath ? `-- "${params.filePath}"` : '';
        const flag = params.staged ? '--staged' : '';
        const diff = safeExec(`git diff ${flag} ${diffTarget}`, { cwd: root });
        return { success: true, action: 'diff', diff: diff.slice(0, 10000), truncated: diff.length > 10000 };
      }

      case 'commit': {
        if (!params.message) return { success: false, error: 'commit message required' };
        if (params.files?.length) {
          for (const f of params.files) {
            await git.add({ fs: gitFs, dir: root, filepath: f });
          }
        } else {
          // Stage all
          safeExec('git add -A', { cwd: root });
        }
        const sha = await git.commit({
          fs: gitFs,
          dir: root,
          message: params.message,
          author: { name: 'Maula Editor', email: 'editor@maula.ai' },
        });
        return { success: true, action: 'commit', sha, message: params.message };
      }

      case 'branch': {
        if (params.delete && params.name) {
          await git.deleteBranch({ fs: gitFs, dir: root, ref: params.name });
          return { success: true, action: 'branch', deleted: params.name };
        }
        if (params.name) {
          await git.branch({ fs: gitFs, dir: root, ref: params.name, checkout: params.checkout });
          return { success: true, action: 'branch', created: params.name, checkedOut: !!params.checkout };
        }
        const branches = await git.listBranches({ fs: gitFs, dir: root });
        const current = await git.currentBranch({ fs: gitFs, dir: root });
        return { success: true, action: 'branch', current, branches };
      }

      case 'log': {
        const commits = await git.log({ fs: gitFs, dir: root, depth: params.limit || 20 });
        const log = commits.map(c => ({
          sha: c.oid.slice(0, 7),
          message: params.oneline !== false ? c.commit.message.split('\n')[0] : c.commit.message,
          author: c.commit.author.name,
          date: new Date(c.commit.author.timestamp * 1000).toISOString(),
        }));
        return { success: true, action: 'log', commits: log };
      }

      case 'stash': {
        // Use system git for stash (isomorphic-git doesn't support stash)
        if (params.list) {
          const list = safeExec('git stash list', { cwd: root });
          return { success: true, action: 'stash', list: list.split('\n').filter(Boolean) };
        }
        if (params.pop) {
          safeExec('git stash pop', { cwd: root });
          return { success: true, action: 'stash', popped: true };
        }
        const msg = params.message ? `-m "${params.message}"` : '';
        safeExec(`git stash ${msg}`, { cwd: root });
        return { success: true, action: 'stash', stashed: true };
      }

      case 'reset': {
        const target = params.commit || 'HEAD~1';
        const flag = params.hard ? '--hard' : '--mixed';
        safeExec(`git reset ${flag} ${target}`, { cwd: root });
        return { success: true, action: 'reset', target, hard: !!params.hard };
      }

      default:
        return { success: false, error: `Unknown git action: ${action}` };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 5. CODE DEPS ────────────────────────────────────────────────────────────

export async function codeDeps(projectPath, action, params = {}) {
  try {
    const root = resolveProjectPath(projectPath);

    switch (action) {
      case 'install': {
        const output = safeExec('npm install', { cwd: root });
        return { success: true, action: 'install', output: output.slice(0, 3000) };
      }
      case 'list': {
        const depth = params.depth !== undefined ? params.depth : 0;
        const output = safeExec(`npm ls --depth=${depth} --json 2>/dev/null || npm ls --depth=${depth}`, { cwd: root });
        try {
          const parsed = JSON.parse(output);
          return { success: true, action: 'list', dependencies: parsed.dependencies || {} };
        } catch {
          return { success: true, action: 'list', output: output.slice(0, 5000) };
        }
      }
      case 'outdated': {
        const output = safeExec('npm outdated --json 2>/dev/null || echo "{}"', { cwd: root });
        try {
          return { success: true, action: 'outdated', packages: JSON.parse(output) };
        } catch {
          return { success: true, action: 'outdated', output };
        }
      }
      case 'audit': {
        const output = safeExec('npm audit --json 2>/dev/null || echo "{}"', { cwd: root });
        try {
          const audit = JSON.parse(output);
          return { success: true, action: 'audit', vulnerabilities: audit.metadata?.vulnerabilities || {}, advisories: Object.keys(audit.advisories || {}).length };
        } catch {
          return { success: true, action: 'audit', output: output.slice(0, 5000) };
        }
      }
      case 'add': {
        const pkgs = Array.isArray(params.packages) ? params.packages.join(' ') : params.packages || '';
        if (!pkgs) return { success: false, error: 'packages required' };
        const devFlag = params.dev ? '--save-dev' : '';
        const output = safeExec(`npm install ${devFlag} ${pkgs}`, { cwd: root });
        return { success: true, action: 'add', packages: pkgs, dev: !!params.dev, output: output.slice(0, 2000) };
      }
      case 'remove': {
        const pkgs = Array.isArray(params.packages) ? params.packages.join(' ') : params.packages || '';
        if (!pkgs) return { success: false, error: 'packages required' };
        const output = safeExec(`npm uninstall ${pkgs}`, { cwd: root });
        return { success: true, action: 'remove', packages: pkgs, output: output.slice(0, 2000) };
      }
      default:
        return { success: false, error: `Unknown deps action: ${action}` };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 6. CODE LINT ────────────────────────────────────────────────────────────

export async function codeLint(projectPath, action, params = {}) {
  try {
    const root = resolveProjectPath(projectPath);
    const target = params.filePath || '.';

    switch (action) {
      case 'lint': {
        const fix = params.fix ? '--fix' : '';
        const output = safeExec(`npx eslint ${target} ${fix} --format json 2>/dev/null || npx eslint ${target} ${fix}`, { cwd: root });
        try {
          const results = JSON.parse(output);
          const errorCount = results.reduce((sum, r) => sum + r.errorCount, 0);
          const warningCount = results.reduce((sum, r) => sum + r.warningCount, 0);
          return { success: true, action: 'lint', errorCount, warningCount, results: results.slice(0, 20) };
        } catch {
          return { success: true, action: 'lint', output: output.slice(0, 5000) };
        }
      }
      case 'format': {
        const output = safeExec(`npx prettier --write "${target}"`, { cwd: root });
        return { success: true, action: 'format', output: output.slice(0, 2000) };
      }
      case 'type_check': {
        const output = safeExec('npx tsc --noEmit 2>&1', { cwd: root });
        const errors = output.split('\n').filter(l => l.includes('error TS'));
        return { success: true, action: 'type_check', errorCount: errors.length, errors: errors.slice(0, 30), output: output.slice(0, 5000) };
      }
      case 'autofix': {
        const lintOut = safeExec(`npx eslint ${target} --fix 2>&1`, { cwd: root });
        const fmtOut = safeExec(`npx prettier --write "${target}" 2>&1`, { cwd: root });
        return { success: true, action: 'autofix', lint: lintOut.slice(0, 1000), format: fmtOut.slice(0, 1000) };
      }
      default:
        return { success: false, error: `Unknown lint action: ${action}` };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 7. CODE TEST ────────────────────────────────────────────────────────────

export async function codeTest(projectPath, action, params = {}) {
  try {
    const root = resolveProjectPath(projectPath);

    switch (action) {
      case 'run': {
        const pattern = params.pattern ? `-- "${params.pattern}"` : '';
        const output = safeExec(`npx jest ${pattern} --passWithNoTests 2>&1 || npx vitest run ${pattern} 2>&1`, { cwd: root });
        return { success: true, action: 'run', output: output.slice(0, 5000) };
      }
      case 'run_file': {
        if (!params.filePath) return { success: false, error: 'filePath required' };
        const output = safeExec(`npx jest "${params.filePath}" --passWithNoTests 2>&1 || npx vitest run "${params.filePath}" 2>&1`, { cwd: root });
        return { success: true, action: 'run_file', file: params.filePath, output: output.slice(0, 5000) };
      }
      case 'coverage': {
        const output = safeExec('npx jest --coverage --passWithNoTests 2>&1 || npx vitest run --coverage 2>&1', { cwd: root });
        return { success: true, action: 'coverage', output: output.slice(0, 5000) };
      }
      case 'detect': {
        const tree = await walkDir(root, 5);
        const testFiles = tree.filter(f => !f.isDir && /\.(test|spec)\.(js|ts|jsx|tsx)$/.test(f.name));
        return { success: true, action: 'detect', testFiles: testFiles.slice(0, 100), count: testFiles.length };
      }
      default:
        return { success: false, error: `Unknown test action: ${action}` };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 8. CODE REFACTOR ────────────────────────────────────────────────────────

export async function codeRefactor(projectPath, action, params = {}) {
  try {
    const root = resolveProjectPath(projectPath);

    switch (action) {
      case 'rename_symbol': {
        if (!params.oldName || !params.newName) return { success: false, error: 'oldName and newName required' };
        const filePattern = params.filePattern || '**/*.{js,ts,jsx,tsx}';
        // Use grep + sed for cross-file rename
        const grepResult = safeExec(`grep -rl "${escapeRegex(params.oldName)}" "${root}" --include="*.js" --include="*.ts" --include="*.tsx" --include="*.jsx"`, { cwd: root });
        const files = grepResult.split('\n').filter(Boolean);
        let totalReplacements = 0;
        for (const file of files) {
          const content = await fs.readFile(file, 'utf-8');
          const regex = new RegExp(`\\b${escapeRegex(params.oldName)}\\b`, 'g');
          const count = (content.match(regex) || []).length;
          if (count > 0) {
            await fs.writeFile(file, content.replace(regex, params.newName));
            totalReplacements += count;
          }
        }
        return { success: true, action: 'rename_symbol', oldName: params.oldName, newName: params.newName, filesModified: files.length, replacements: totalReplacements };
      }

      case 'extract_function': {
        if (!params.filePath || !params.startLine || !params.endLine) return { success: false, error: 'filePath, startLine, endLine required' };
        const target = resolvePath(root, params.filePath);
        const content = await fs.readFile(target, 'utf-8');
        const lines = content.split('\n');
        const extracted = lines.slice(params.startLine - 1, params.endLine);
        const funcName = params.functionName || 'extractedFunction';
        const newFunc = `\nfunction ${funcName}() {\n${extracted.map(l => '  ' + l).join('\n')}\n}\n`;
        lines.splice(params.startLine - 1, params.endLine - params.startLine + 1, `  ${funcName}();`);
        lines.push(newFunc);
        await fs.writeFile(target, lines.join('\n'));
        return { success: true, action: 'extract_function', file: params.filePath, functionName: funcName, linesExtracted: extracted.length };
      }

      case 'organize_imports': {
        const target = resolvePath(root, params.filePath);
        const content = await fs.readFile(target, 'utf-8');
        const lines = content.split('\n');
        const importLines = [];
        const otherLines = [];
        let pastImports = false;
        for (const line of lines) {
          if (!pastImports && (line.startsWith('import ') || line.startsWith('import{'))) {
            importLines.push(line);
          } else {
            if (importLines.length > 0 && line.trim() === '') continue; // skip blank after imports
            pastImports = true;
            otherLines.push(line);
          }
        }
        importLines.sort();
        const result = [...importLines, '', ...otherLines].join('\n');
        await fs.writeFile(target, result);
        return { success: true, action: 'organize_imports', file: params.filePath, importsOrganized: importLines.length };
      }

      case 'dead_code': {
        const tree = await walkDir(root, 5);
        const jsFiles = tree.filter(f => !f.isDir && /\.(js|ts|jsx|tsx)$/.test(f.name));
        const exports = [];
        const allContent = [];
        for (const f of jsFiles.slice(0, 100)) {
          const content = await fs.readFile(resolvePath(root, f.path), 'utf-8');
          allContent.push(content);
          const exportRegex = /export\s+(?:const|function|class|let|var|async\s+function)\s+(\w+)/g;
          let m;
          while ((m = exportRegex.exec(content))) {
            exports.push({ name: m[1], file: f.path });
          }
        }
        const joined = allContent.join('\n');
        const unused = exports.filter(e => {
          const regex = new RegExp(`\\b${e.name}\\b`, 'g');
          const count = (joined.match(regex) || []).length;
          return count <= 1; // only the export itself
        });
        return { success: true, action: 'dead_code', unusedExports: unused.slice(0, 50), totalExports: exports.length, scannedFiles: jsFiles.length };
      }

      case 'inline_variable': {
        if (!params.filePath || !params.variableName) return { success: false, error: 'filePath and variableName required' };
        const target = resolvePath(root, params.filePath);
        const content = await fs.readFile(target, 'utf-8');
        const declRegex = new RegExp(`(?:const|let|var)\\s+${escapeRegex(params.variableName)}\\s*=\\s*(.+?);`);
        const match = content.match(declRegex);
        if (!match) return { success: false, error: `Variable '${params.variableName}' not found` };
        const value = match[1];
        let result = content.replace(declRegex, ''); // remove declaration
        const useRegex = new RegExp(`\\b${escapeRegex(params.variableName)}\\b`, 'g');
        const count = (result.match(useRegex) || []).length;
        result = result.replace(useRegex, value);
        await fs.writeFile(target, result);
        return { success: true, action: 'inline_variable', variable: params.variableName, inlinedCount: count };
      }

      default:
        return { success: false, error: `Unknown refactor action: ${action}` };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 9. CODE METRICS ─────────────────────────────────────────────────────────

export async function codeMetrics(projectPath, action, params = {}) {
  try {
    const root = resolveProjectPath(projectPath);

    switch (action) {
      case 'file_stats': {
        const target = resolvePath(root, params.filePath);
        const content = await fs.readFile(target, 'utf-8');
        const lines = content.split('\n');
        const blankLines = lines.filter(l => l.trim() === '').length;
        const commentLines = lines.filter(l => l.trim().startsWith('//') || l.trim().startsWith('#') || l.trim().startsWith('*')).length;
        const stat = statSync(target);
        return {
          success: true, action: 'file_stats', file: params.filePath,
          totalLines: lines.length, codeLines: lines.length - blankLines - commentLines,
          blankLines, commentLines, sizeBytes: stat.size, modified: stat.mtime.toISOString(),
        };
      }
      case 'project_stats': {
        const tree = await walkDir(root, 5);
        const files = tree.filter(t => !t.isDir);
        const dirs = tree.filter(t => t.isDir);
        const extCount = {};
        let totalSize = 0;
        for (const f of files) {
          const ext = path.extname(f.name).toLowerCase() || '(none)';
          extCount[ext] = (extCount[ext] || 0) + 1;
          try { totalSize += statSync(resolvePath(root, f.path)).size; } catch {}
        }
        return {
          success: true, action: 'project_stats', totalFiles: files.length, totalDirs: dirs.length,
          totalSizeBytes: totalSize, extensions: extCount,
        };
      }
      case 'dependency_graph': {
        const tree = await walkDir(root, 5);
        const jsFiles = tree.filter(f => !f.isDir && /\.(js|ts|jsx|tsx)$/.test(f.name));
        const graph = {};
        for (const f of jsFiles.slice(0, 100)) {
          const content = await fs.readFile(resolvePath(root, f.path), 'utf-8');
          const imports = [];
          const importRegex = /(?:import|require)\s*\(?['"]([^'"]+)['"]\)?/g;
          let m;
          while ((m = importRegex.exec(content))) {
            imports.push(m[1]);
          }
          if (imports.length > 0) graph[f.path] = imports;
        }
        return { success: true, action: 'dependency_graph', files: Object.keys(graph).length, graph };
      }
      case 'complexity': {
        const target = resolvePath(root, params.filePath);
        const content = await fs.readFile(target, 'utf-8');
        // Simple cyclomatic complexity: count decision points
        const decisions = (content.match(/\b(if|else if|for|while|switch|case|catch|\?\?|&&|\|\|)\b/g) || []).length;
        const functions = extractSymbolsFromCode(content).filter(s => s.type === 'function');
        return {
          success: true, action: 'complexity', file: params.filePath,
          cyclomaticComplexity: decisions + 1, decisionPoints: decisions,
          functionCount: functions.length, functions: functions.slice(0, 30),
        };
      }
      default:
        return { success: false, error: `Unknown metrics action: ${action}` };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 10. CODE DEBUG ──────────────────────────────────────────────────────────

export async function codeDebug(projectPath, action, params = {}) {
  try {
    const root = resolveProjectPath(projectPath);

    switch (action) {
      case 'parse_errors': {
        if (!params.errorText) return { success: false, error: 'errorText required' };
        const lines = params.errorText.split('\n');
        const errors = [];
        for (const line of lines) {
          const m = line.match(/(?:Error|TypeError|SyntaxError|ReferenceError):\s*(.+)/i);
          if (m) errors.push({ message: m[1], raw: line.trim() });
          const fileMatch = line.match(/at\s+(?:.*?)\s*\((.+?):(\d+):(\d+)\)/);
          if (fileMatch) errors.push({ file: fileMatch[1], line: parseInt(fileMatch[2]), column: parseInt(fileMatch[3]) });
        }
        return { success: true, action: 'parse_errors', errorCount: errors.length, errors: errors.slice(0, 20) };
      }
      case 'get_logs': {
        const logFile = resolvePath(root, params.logFile || 'npm-debug.log');
        if (!existsSync(logFile)) return { success: false, error: `Log file not found: ${params.logFile || 'npm-debug.log'}` };
        const content = await fs.readFile(logFile, 'utf-8');
        const lines = content.split('\n');
        const tail = lines.slice(-(params.lines || 100));
        return { success: true, action: 'get_logs', file: params.logFile, totalLines: lines.length, lines: tail };
      }
      case 'analyze_stack': {
        if (!params.stackTrace) return { success: false, error: 'stackTrace required' };
        const frames = params.stackTrace.split('\n')
          .map(l => l.match(/at\s+(?:(.+?)\s+)?\((.+?):(\d+):(\d+)\)/))
          .filter(Boolean)
          .map(m => ({ function: m[1] || '(anonymous)', file: m[2], line: parseInt(m[3]), column: parseInt(m[4]) }));
        const errMatch = params.stackTrace.match(/^(\w*Error):\s*(.+)/m);
        return {
          success: true, action: 'analyze_stack',
          errorType: errMatch?.[1] || 'Unknown', errorMessage: errMatch?.[2] || 'Unknown',
          frames: frames.slice(0, 20), depth: frames.length,
        };
      }
      case 'suggest_fix': {
        if (!params.errorMessage) return { success: false, error: 'errorMessage required' };
        const suggestions = getErrorSuggestions(params.errorMessage);
        return { success: true, action: 'suggest_fix', errorMessage: params.errorMessage, suggestions };
      }
      default:
        return { success: false, error: `Unknown debug action: ${action}` };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function getErrorSuggestions(msg) {
  const lower = msg.toLowerCase();
  const suggestions = [];
  if (lower.includes('cannot find module')) suggestions.push('Run `npm install` to install missing dependencies', 'Check the import path for typos');
  if (lower.includes('is not defined')) suggestions.push('Check for typos in variable/function name', 'Ensure the variable is imported or declared before use');
  if (lower.includes('is not a function')) suggestions.push('Verify the export type — it may be an object, not a function', 'Check for circular dependencies');
  if (lower.includes('enoent')) suggestions.push('File or directory does not exist — check the path', 'Ensure the file was created before being accessed');
  if (lower.includes('eaddrinuse')) suggestions.push('Port is already in use — kill the existing process or use a different port');
  if (lower.includes('syntax')) suggestions.push('Check for missing brackets, commas, or semicolons', 'Validate JSON syntax if parsing JSON');
  if (suggestions.length === 0) suggestions.push('Search for the error message online', 'Check recent code changes that may have introduced the error');
  return suggestions;
}

// ── 11. CODE DOCS ───────────────────────────────────────────────────────────

export async function codeDocs(projectPath, action, params = {}) {
  try {
    const root = resolveProjectPath(projectPath);

    switch (action) {
      case 'jsdoc': {
        const target = resolvePath(root, params.filePath);
        const content = await fs.readFile(target, 'utf-8');
        const funcName = params.functionName;
        const funcRegex = funcName
          ? new RegExp(`(?:export\\s+)?(?:async\\s+)?function\\s+${escapeRegex(funcName)}\\s*\\(([^)]*)\\)`)
          : /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/;
        const match = content.match(funcRegex);
        if (!match) return { success: false, error: `Function '${funcName || '(first)'}' not found` };
        const name = funcName || match[1];
        const paramsStr = funcName ? match[1] : match[2];
        const paramList = paramsStr.split(',').map(p => p.trim().split(/\s*[=:]/)[0].trim()).filter(Boolean);
        const jsdoc = `/**\n * ${name}\n${paramList.map(p => ` * @param {*} ${p}\n`).join('')} * @returns {*}\n */`;
        return { success: true, action: 'jsdoc', functionName: name, jsdoc, params: paramList };
      }
      case 'readme': {
        const pkgPath = path.join(root, 'package.json');
        let pkg = {};
        if (existsSync(pkgPath)) pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));
        const readme = `# ${pkg.name || path.basename(root)}\n\n${pkg.description || ''}\n\n## Installation\n\n\`\`\`bash\nnpm install\n\`\`\`\n\n## Usage\n\n\`\`\`bash\nnpm start\n\`\`\`\n\n## Scripts\n\n${Object.entries(pkg.scripts || {}).map(([k, v]) => `- \`npm run ${k}\` — ${v}`).join('\n')}\n\n## License\n\n${pkg.license || 'MIT'}\n`;
        return { success: true, action: 'readme', content: readme };
      }
      case 'api_docs': {
        const target = resolvePath(root, params.filePath);
        const content = await fs.readFile(target, 'utf-8');
        const docBlocks = [];
        const regex = /\/\*\*([\s\S]*?)\*\/\s*(?:export\s+)?(?:async\s+)?(?:function|const|class)\s+(\w+)/g;
        let m;
        while ((m = regex.exec(content))) {
          docBlocks.push({ name: m[2], doc: m[1].replace(/\s*\*\s*/g, ' ').trim() });
        }
        return { success: true, action: 'api_docs', file: params.filePath, docBlocks };
      }
      case 'changelog': {
        try {
          const commits = await git.log({ fs: gitFs, dir: root, depth: 50 });
          const changelog = commits.map(c =>
            `- ${new Date(c.commit.author.timestamp * 1000).toISOString().split('T')[0]} ${c.commit.message.split('\n')[0]}`
          ).join('\n');
          return { success: true, action: 'changelog', content: `# Changelog\n\n${changelog}` };
        } catch {
          return { success: false, error: 'Not a git repository or no commits' };
        }
      }
      default:
        return { success: false, error: `Unknown docs action: ${action}` };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 12. CODE SCAFFOLD ───────────────────────────────────────────────────────

export async function codeScaffold(projectPath, action, params = {}) {
  try {
    const root = resolveProjectPath(projectPath);
    const ts = params.typescript !== false;
    const ext = ts ? 'tsx' : 'jsx';
    const name = params.name || 'MyComponent';

    switch (action) {
      case 'component': {
        const content = ts
          ? `import React from 'react';\n\ninterface ${name}Props {\n  // Define props\n}\n\nexport const ${name}: React.FC<${name}Props> = (props) => {\n  return (\n    <div>\n      <h1>${name}</h1>\n    </div>\n  );\n};\n\nexport default ${name};\n`
          : `import React from 'react';\n\nexport const ${name} = (props) => {\n  return (\n    <div>\n      <h1>${name}</h1>\n    </div>\n  );\n};\n\nexport default ${name};\n`;
        return { success: true, action: 'component', name, file: `${name}.${ext}`, content };
      }
      case 'module': {
        const modExt = ts ? 'ts' : 'js';
        const content = ts
          ? `/**\n * ${name} module\n */\n\nexport interface ${name}Options {\n  // Define options\n}\n\nexport class ${name} {\n  constructor(private options: ${name}Options = {} as ${name}Options) {}\n\n  async init(): Promise<void> {\n    // Initialize\n  }\n}\n\nexport default ${name};\n`
          : `/**\n * ${name} module\n */\n\nexport class ${name} {\n  constructor(options = {}) {\n    this.options = options;\n  }\n\n  async init() {\n    // Initialize\n  }\n}\n\nexport default ${name};\n`;
        return { success: true, action: 'module', name, file: `${name}.${modExt}`, content };
      }
      case 'test_file': {
        const source = params.sourceFile || `${name}`;
        const fw = params.framework || 'jest';
        const content = `import { ${name} } from './${source}';\n\ndescribe('${name}', () => {\n  it('should exist', () => {\n    expect(${name}).toBeDefined();\n  });\n\n  it('should work correctly', () => {\n    // TODO: Add test cases\n  });\n});\n`;
        return { success: true, action: 'test_file', name, file: `${name}.test.${ts ? 'ts' : 'js'}`, content, framework: fw };
      }
      case 'config': {
        const configType = params.type || 'eslint';
        const configs = {
          eslint: { file: '.eslintrc.json', content: JSON.stringify({ env: { browser: true, es2021: true, node: true }, extends: ['eslint:recommended'], parserOptions: { ecmaVersion: 'latest', sourceType: 'module' }, rules: {} }, null, 2) },
          prettier: { file: '.prettierrc', content: JSON.stringify({ semi: true, trailingComma: 'all', singleQuote: true, printWidth: 100, tabWidth: 2 }, null, 2) },
          tsconfig: { file: 'tsconfig.json', content: JSON.stringify({ compilerOptions: { target: 'ES2020', module: 'ESNext', moduleResolution: 'bundler', strict: true, esModuleInterop: true, skipLibCheck: true, outDir: 'dist', declaration: true, jsx: 'react-jsx' }, include: ['src'] }, null, 2) },
          jest: { file: 'jest.config.js', content: `module.exports = {\n  testEnvironment: 'node',\n  transform: { '^.+\\.tsx?$': 'ts-jest' },\n  testMatch: ['**/*.test.{ts,tsx,js,jsx}'],\n  collectCoverageFrom: ['src/**/*.{ts,tsx}'],\n};\n` },
        };
        const config = configs[configType];
        if (!config) return { success: false, error: `Unknown config type: ${configType}` };
        return { success: true, action: 'config', type: configType, file: config.file, content: config.content };
      }
      case 'hook': {
        const hookName = name.startsWith('use') ? name : `use${name}`;
        const content = ts
          ? `import { useState, useEffect } from 'react';\n\nexport function ${hookName}() {\n  const [data, setData] = useState<unknown>(null);\n  const [loading, setLoading] = useState(false);\n  const [error, setError] = useState<Error | null>(null);\n\n  useEffect(() => {\n    // Effect logic\n  }, []);\n\n  return { data, loading, error };\n}\n`
          : `import { useState, useEffect } from 'react';\n\nexport function ${hookName}() {\n  const [data, setData] = useState(null);\n  const [loading, setLoading] = useState(false);\n  const [error, setError] = useState(null);\n\n  useEffect(() => {\n    // Effect logic\n  }, []);\n\n  return { data, loading, error };\n}\n`;
        return { success: true, action: 'hook', name: hookName, file: `${hookName}.${ts ? 'ts' : 'js'}`, content };
      }
      case 'service': {
        const content = ts
          ? `/**\n * ${name} Service\n */\n\nconst API_BASE = process.env.API_URL || 'http://localhost:3000/api';\n\nexport class ${name}Service {\n  private baseUrl: string;\n\n  constructor(baseUrl = API_BASE) {\n    this.baseUrl = baseUrl;\n  }\n\n  async getAll(): Promise<any[]> {\n    const res = await fetch(\`\${this.baseUrl}/${name.toLowerCase()}\`);\n    if (!res.ok) throw new Error(\`Failed to fetch: \${res.statusText}\`);\n    return res.json();\n  }\n\n  async getById(id: string): Promise<any> {\n    const res = await fetch(\`\${this.baseUrl}/${name.toLowerCase()}/\${id}\`);\n    if (!res.ok) throw new Error(\`Not found: \${res.statusText}\`);\n    return res.json();\n  }\n\n  async create(data: Partial<any>): Promise<any> {\n    const res = await fetch(\`\${this.baseUrl}/${name.toLowerCase()}\`, {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify(data),\n    });\n    if (!res.ok) throw new Error(\`Create failed: \${res.statusText}\`);\n    return res.json();\n  }\n\n  async update(id: string, data: Partial<any>): Promise<any> {\n    const res = await fetch(\`\${this.baseUrl}/${name.toLowerCase()}/\${id}\`, {\n      method: 'PUT',\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify(data),\n    });\n    if (!res.ok) throw new Error(\`Update failed: \${res.statusText}\`);\n    return res.json();\n  }\n\n  async delete(id: string): Promise<void> {\n    const res = await fetch(\`\${this.baseUrl}/${name.toLowerCase()}/\${id}\`, { method: 'DELETE' });\n    if (!res.ok) throw new Error(\`Delete failed: \${res.statusText}\`);\n  }\n}\n\nexport const ${name.toLowerCase()}Service = new ${name}Service();\n`
          : `/**\n * ${name} Service\n */\n\nconst API_BASE = process.env.API_URL || 'http://localhost:3000/api';\n\nexport class ${name}Service {\n  constructor(baseUrl = API_BASE) {\n    this.baseUrl = baseUrl;\n  }\n\n  async getAll() {\n    const res = await fetch(\`\${this.baseUrl}/${name.toLowerCase()}\`);\n    if (!res.ok) throw new Error(\`Failed to fetch: \${res.statusText}\`);\n    return res.json();\n  }\n\n  async getById(id) {\n    const res = await fetch(\`\${this.baseUrl}/${name.toLowerCase()}/\${id}\`);\n    if (!res.ok) throw new Error(\`Not found: \${res.statusText}\`);\n    return res.json();\n  }\n\n  async create(data) {\n    const res = await fetch(\`\${this.baseUrl}/${name.toLowerCase()}\`, {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify(data),\n    });\n    if (!res.ok) throw new Error(\`Create failed: \${res.statusText}\`);\n    return res.json();\n  }\n}\n\nexport const ${name.toLowerCase()}Service = new ${name}Service();\n`;
        return { success: true, action: 'service', name, file: `${name}Service.${ts ? 'ts' : 'js'}`, content };
      }
      default:
        return { success: false, error: `Unknown scaffold action: ${action}` };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── CAPABILITIES ────────────────────────────────────────────────────────────

export function getCodeCapabilities() {
  return {
    supported: true,
    message: 'Code engine ready — fs + child_process + isomorphic-git',
    languages: ['javascript', 'typescript', 'python', 'java', 'go', 'rust'],
    operations: ['edit', 'navigate', 'symbols', 'git', 'deps', 'lint', 'test', 'refactor', 'metrics', 'debug', 'docs', 'scaffold'],
  };
}
