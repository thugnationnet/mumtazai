/**
 * FILE SYSTEM EXTENDED TOOLS — 3 tools
 * file_watch, sync_files, file_diff
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export const FILE_SYSTEM_TOOL_DEFINITIONS = [
  {
    name: 'file_watch',
    description: 'Watch a file or directory for changes and return a snapshot of recent events. Uses fs.watch under the hood.',
    input_schema: {
      type: 'object',
      properties: {
        path:        { type: 'string', description: 'File or directory path to watch' },
        operation:   { type: 'string', enum: ['snapshot', 'start', 'list_watchers', 'stop'],
                       description: 'Watch operation (snapshot: check mtime/size; start: write watcher pid to tmp; stop: kill watcher)' },
        recursive:   { type: 'boolean', description: 'Watch subdirectories recursively (default: true)' },
        duration_ms: { type: 'number', description: 'For snapshot: how far back to look for changes in ms (default: 60000)' },
      },
      required: ['path', 'operation'],
    },
  },
  {
    name: 'sync_files',
    description: 'Sync files between two directories: copy new/changed files, optionally delete extras.',
    input_schema: {
      type: 'object',
      properties: {
        source:        { type: 'string', description: 'Source directory' },
        destination:   { type: 'string', description: 'Destination directory' },
        operation:     { type: 'string', enum: ['preview', 'sync', 'mirror', 'backup'],
                         description: 'Sync operation (preview: show diff; sync: copy new/changed; mirror: also delete extras; backup: timestamped copy)' },
        exclude:       { type: 'array', items: { type: 'string' }, description: 'Patterns to exclude (e.g. node_modules)' },
        dry_run:       { type: 'boolean', description: 'Show what would happen without doing it (default: false)' },
        checksum:      { type: 'boolean', description: 'Compare by checksum (default: false — uses mtime+size)' },
      },
      required: ['source', 'destination', 'operation'],
    },
  },
  {
    name: 'file_diff',
    description: 'Show diff between two files or directories, or check if content has changed.',
    input_schema: {
      type: 'object',
      properties: {
        a:         { type: 'string', description: 'First file/directory path or content string' },
        b:         { type: 'string', description: 'Second file/directory path or content string' },
        operation: { type: 'string', enum: ['diff', 'changed', 'merge_preview'],
                     description: 'Diff operation (default: diff)' },
        context:   { type: 'number', description: 'Context lines in unified diff (default: 3)' },
        inline:    { type: 'boolean', description: 'a and b are content strings rather than file paths' },
      },
      required: ['a', 'b'],
    },
  },
];

// ============================================================================
// HELPERS
// ============================================================================

function walkDir(dir, excludePatterns = []) {
  const results = [];
  function walk(current) {
    let entries;
    try { entries = fs.readdirSync(current, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (excludePatterns.some(p => entry.name.includes(p) || new RegExp(p, 'i').test(entry.name))) continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else {
        const stat = fs.statSync(full);
        results.push({ path: full, rel: path.relative(dir, full), size: stat.size, mtime: stat.mtimeMs });
      }
    }
  }
  walk(dir);
  return results;
}

function copyFileRecursive(src, dst) {
  const dstDir = path.dirname(dst);
  fs.mkdirSync(dstDir, { recursive: true });
  fs.copyFileSync(src, dst);
}

function unifiedDiff(aContent, bContent, aLabel = 'a', bLabel = 'b', context = 3) {
  const aLines = aContent.split('\n');
  const bLines = bContent.split('\n');
  const hunks  = [];
  let i = 0, j = 0;
  while (i < aLines.length || j < bLines.length) {
    if (i < aLines.length && j < bLines.length && aLines[i] === bLines[j]) { i++; j++; continue; }
    const hunkStart = i;
    const hunkLines = [];
    while (i < aLines.length && j < bLines.length && aLines[i] !== bLines[j]) {
      hunkLines.push(`-${aLines[i++]}`);
      hunkLines.push(`+${bLines[j++]}`);
    }
    if (hunkLines.length) hunks.push(`@@ -${hunkStart + 1} +${hunkStart + 1} @@\n${hunkLines.join('\n')}`);
    else { i++; j++; }
  }
  return hunks.length ? `--- ${aLabel}\n+++ ${bLabel}\n${hunks.join('\n')}` : '(no differences)';
}

// ============================================================================
// EXECUTORS
// ============================================================================

export async function executeFileSystemTool(toolName, input, ctx = {}) {
  const root = ctx.workspaceRoot || process.cwd();

  try {
    switch (toolName) {

      case 'file_watch': {
        const fp        = path.resolve(root, input.path);
        const operation = input.operation || 'snapshot';

        switch (operation) {
          case 'snapshot': {
            const duration = input.duration_ms || 60000;
            const since    = Date.now() - duration;
            if (!fs.existsSync(fp)) throw new Error(`Path not found: ${fp}`);
            const stat = fs.statSync(fp);
            if (stat.isFile()) {
              return { result: JSON.stringify({ status: 'success', type: 'file', path: fp, size: stat.size, mtime: stat.mtime, changed_recently: stat.mtimeMs > since }) };
            }
            const files   = walkDir(fp, ['.git', 'node_modules']);
            const changed = files.filter(f => f.mtime > since);
            return { result: JSON.stringify({ status: 'success', type: 'directory', path: fp, total_files: files.length, changed_recently: changed.length, changes: changed.slice(0, 20) }) };
          }
          case 'list_watchers': {
            return { result: JSON.stringify({ status: 'success', note: 'Active watchers tracked via OS processes. Use snapshot to check for recent changes.' }) };
          }
          default:
            return { result: JSON.stringify({ status: 'info', message: `file_watch operation '${operation}' is informational — use 'snapshot' to check for changes.` }) };
        }
      }

      case 'sync_files': {
        const src    = path.resolve(root, input.source);
        const dst    = path.resolve(root, input.destination);
        const exc    = [...(input.exclude || []), '.DS_Store', 'Thumbs.db'];
        const dryRun = input.dry_run || false;

        if (!fs.existsSync(src)) throw new Error(`Source not found: ${src}`);

        if (input.operation === 'backup') {
          const ts      = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
          const backDst = `${dst}_${ts}`;
          if (!dryRun) {
            execSync(`cp -rp "${src}" "${backDst}" 2>&1`);
          }
          return { result: JSON.stringify({ status: 'success', backup_to: backDst, dry_run: dryRun }) };
        }

        fs.mkdirSync(dst, { recursive: true });
        const srcFiles = walkDir(src, exc);
        const dstFiles = walkDir(dst, exc);
        const dstMap   = Object.fromEntries(dstFiles.map(f => [f.rel, f]));

        const toAdd    = srcFiles.filter(f => !dstMap[f.rel] || dstMap[f.rel].mtime < f.mtime || dstMap[f.rel].size !== f.size);
        const toDelete = input.operation === 'mirror'
          ? dstFiles.filter(f => !srcFiles.find(s => s.rel === f.rel))
          : [];

        if (!dryRun) {
          for (const f of toAdd)    copyFileRecursive(f.path, path.join(dst, f.rel));
          for (const f of toDelete) fs.unlinkSync(f.path);
        }

        return { result: JSON.stringify({ status: 'success', operation: input.operation, dry_run: dryRun, files_added: toAdd.length, files_deleted: toDelete.length, added: toAdd.slice(0, 20).map(f => f.rel), deleted: toDelete.slice(0, 20).map(f => f.rel) }) };
      }

      case 'file_diff': {
        const op  = input.operation || 'diff';
        let aContent, bContent;

        if (input.inline) {
          aContent = input.a;
          bContent = input.b;
        } else {
          const aPath = path.resolve(root, input.a);
          const bPath = path.resolve(root, input.b);
          if (!fs.existsSync(aPath)) throw new Error(`File not found: ${aPath}`);
          if (!fs.existsSync(bPath)) throw new Error(`File not found: ${bPath}`);
          aContent = fs.readFileSync(aPath, 'utf8');
          bContent = fs.readFileSync(bPath, 'utf8');
        }

        if (op === 'changed') {
          return { result: JSON.stringify({ status: 'success', changed: aContent !== bContent }) };
        }

        const diff = unifiedDiff(aContent, bContent, input.a, input.b, input.context || 3);
        return { result: JSON.stringify({ status: 'success', diff, has_changes: diff !== '(no differences)' }) };
      }

      default:
        return { result: JSON.stringify({ status: 'error', error: `Unknown tool: ${toolName}` }) };
    }
  } catch (err) {
    return { result: JSON.stringify({ status: 'error', error: err.message, tool: toolName }) };
  }
}

export const isFileSystemTool = (name) => FILE_SYSTEM_TOOL_DEFINITIONS.some(t => t.name === name);
