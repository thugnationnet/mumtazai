/**
 * ARCHIVE TOOLS — 8 tools
 * archive_core, archive_edit, archive_structure, archive_security,
 * archive_bulk, archive_convert, archive_intelligence, archive_deploy
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

async function getAdmZip() {
  try { return (await import('adm-zip')).default; } catch { return null; }
}

export const ARCHIVE_TOOL_DEFINITIONS = [
  {
    name: 'archive_core',
    description: 'Create, extract, list, or repack ZIP/TAR archives.',
    input_schema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['create', 'extract', 'list', 'repack', 'compress', 'merge'],
                     description: 'Archive operation' },
        source:    { type: 'string', description: 'File/directory to archive, or archive to extract/list' },
        output:    { type: 'string', description: 'Output archive path or extraction directory' },
        format:    { type: 'string', enum: ['zip', 'tar', 'tar.gz', 'tar.bz2'], description: 'Archive format (default: zip)' },
        exclude:   { type: 'array', items: { type: 'string' }, description: 'Patterns to exclude (e.g. node_modules)' },
      },
      required: ['operation', 'source'],
    },
  },
  {
    name: 'archive_edit',
    description: 'In-place ZIP editing: add, remove, replace, or rename files inside a ZIP.',
    input_schema: {
      type: 'object',
      properties: {
        archive:   { type: 'string', description: 'ZIP file path to edit' },
        operation: { type: 'string', enum: ['add', 'remove', 'replace', 'rename', 'read_entry'],
                     description: 'Edit operation' },
        entry:     { type: 'string', description: 'Entry path inside the ZIP' },
        source:    { type: 'string', description: 'File to add/replace (for add/replace)' },
        new_name:  { type: 'string', description: 'New entry name (for rename)' },
        content:   { type: 'string', description: 'File content to add inline (alternative to source)' },
      },
      required: ['archive', 'operation'],
    },
  },
  {
    name: 'archive_structure',
    description: 'Inspect, validate, flatten, or reorder the internal structure of an archive.',
    input_schema: {
      type: 'object',
      properties: {
        archive:   { type: 'string', description: 'Archive file path' },
        operation: { type: 'string', enum: ['inspect', 'validate', 'flatten', 'normalize', 'tree'],
                     description: 'Structure operation' },
        output:    { type: 'string', description: 'Output archive path (for operations that modify)' },
      },
      required: ['archive', 'operation'],
    },
  },
  {
    name: 'archive_security',
    description: 'Security checks: zip bomb detection, size limits, symlink check, password encryption.',
    input_schema: {
      type: 'object',
      properties: {
        archive:   { type: 'string', description: 'Archive file path' },
        operation: { type: 'string', enum: ['zip_bomb_check', 'size_audit', 'symlink_check', 'encrypt', 'scan_contents'],
                     description: 'Security operation' },
        max_size:  { type: 'number', description: 'Max allowed uncompressed size in MB (for size_audit)' },
        password:  { type: 'string', description: 'Password for encryption' },
        output:    { type: 'string', description: 'Output archive path (for encrypt)' },
      },
      required: ['archive', 'operation'],
    },
  },
  {
    name: 'archive_bulk',
    description: 'Bulk operations: extract many archives, batch re-zip, rename entries, deduplicate.',
    input_schema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['bulk_extract', 'bulk_rezip', 'bulk_rename', 'dedup'],
                     description: 'Bulk operation' },
        source_dir:  { type: 'string', description: 'Directory containing archives' },
        output_dir:  { type: 'string', description: 'Output directory' },
        rename_pattern: { type: 'string', description: 'Rename pattern (e.g. "{name}_{date}")' },
      },
      required: ['operation', 'source_dir'],
    },
  },
  {
    name: 'archive_convert',
    description: 'Convert between archive formats (zip ↔ tar ↔ tar.gz ↔ tar.bz2).',
    input_schema: {
      type: 'object',
      properties: {
        source: { type: 'string', description: 'Source archive path' },
        output: { type: 'string', description: 'Output archive path' },
        format: { type: 'string', enum: ['zip', 'tar', 'tar.gz', 'tar.bz2'], description: 'Target format' },
      },
      required: ['source', 'format'],
    },
  },
  {
    name: 'archive_intelligence',
    description: 'AI analysis of archive contents: summarize, find files, search text, detect patterns.',
    input_schema: {
      type: 'object',
      properties: {
        archive:   { type: 'string', description: 'Archive file path' },
        operation: { type: 'string', enum: ['summarize', 'find', 'search_text', 'detect_language', 'find_secrets'],
                     description: 'Analysis operation' },
        query:     { type: 'string', description: 'Search query (for find/search_text)' },
        pattern:   { type: 'string', description: 'File pattern to find (for find)' },
      },
      required: ['archive', 'operation'],
    },
  },
  {
    name: 'archive_deploy',
    description: 'Dev packaging: build deployment archives, strip dev files, version packages.',
    input_schema: {
      type: 'object',
      properties: {
        source:    { type: 'string', description: 'Project directory to package' },
        output:    { type: 'string', description: 'Output archive path' },
        operation: { type: 'string', enum: ['package', 'strip_dev', 'add_version', 'optimize'],
                     description: 'Deploy operation' },
        version:   { type: 'string', description: 'Version string to embed (for add_version)' },
        exclude:   { type: 'array', items: { type: 'string' }, description: 'Patterns to exclude' },
      },
      required: ['source', 'output', 'operation'],
    },
  },
];

// ============================================================================
// EXECUTORS
// ============================================================================

export async function executeArchiveTool(toolName, input, ctx = {}) {
  const root    = ctx.workspaceRoot || process.cwd();
  const AdmZip  = await getAdmZip();

  try {
    switch (toolName) {

      case 'archive_core': {
        const src = path.resolve(root, input.source);
        const out = input.output ? path.resolve(root, input.output) : null;
        const fmt = input.format || 'zip';
        const exc = (input.exclude || ['node_modules', '.git', '.DS_Store']).join('|');

        switch (input.operation) {
          case 'create': {
            if (!out) throw new Error('output path required');
            if (fmt === 'zip') {
              if (!AdmZip) throw new Error('adm-zip not available');
              const zip = new AdmZip();
              const stat = fs.statSync(src);
              if (stat.isDirectory()) {
                zip.addLocalFolder(src, path.basename(src));
              } else {
                zip.addLocalFile(src);
              }
              zip.writeZip(out);
            } else {
              const tarFmt = fmt === 'tar.gz' ? 'czf' : fmt === 'tar.bz2' ? 'cjf' : 'cf';
              const dir    = path.dirname(src);
              const base   = path.basename(src);
              execSync(`cd "${dir}" && tar ${tarFmt} "${out}" "${base}" 2>&1`, { stdio: 'pipe' });
            }
            return { result: JSON.stringify({ status: 'success', archive: out }) };
          }
          case 'extract': {
            if (!out) throw new Error('output directory required');
            fs.mkdirSync(out, { recursive: true });
            if (src.endsWith('.zip')) {
              if (!AdmZip) throw new Error('adm-zip not available');
              const zip = new AdmZip(src);
              zip.extractAllTo(out, true);
            } else {
              execSync(`tar xf "${src}" -C "${out}" 2>&1`, { stdio: 'pipe' });
            }
            return { result: JSON.stringify({ status: 'success', extracted_to: out }) };
          }
          case 'list': {
            if (!AdmZip || !src.endsWith('.zip')) {
              const out2 = execSync(`tar tf "${src}" 2>&1 | head -100`, { encoding: 'utf8', stdio: 'pipe' });
              return { result: JSON.stringify({ status: 'success', entries: out2.trim().split('\n') }) };
            }
            const zip     = new AdmZip(src);
            const entries = zip.getEntries().map(e => ({ name: e.entryName, size: e.header.size, compressed: e.header.compressedSize }));
            return { result: JSON.stringify({ status: 'success', entries, count: entries.length }) };
          }
          default: return { result: JSON.stringify({ status: 'error', error: `Unknown archive_core operation: ${input.operation}` }) };
        }
      }

      case 'archive_edit': {
        if (!AdmZip) throw new Error('adm-zip not available — install: npm install adm-zip');
        const archivePath = path.resolve(root, input.archive);
        const zip = new AdmZip(archivePath);

        switch (input.operation) {
          case 'add': {
            if (input.content !== undefined) {
              zip.addFile(input.entry, Buffer.from(input.content, 'utf8'));
            } else if (input.source) {
              zip.addLocalFile(path.resolve(root, input.source), path.dirname(input.entry));
            }
            break;
          }
          case 'remove':
            zip.deleteFile(input.entry);
            break;
          case 'replace': {
            zip.deleteFile(input.entry);
            const newContent = input.content !== undefined ? Buffer.from(input.content, 'utf8') : fs.readFileSync(path.resolve(root, input.source));
            zip.addFile(input.entry, newContent);
            break;
          }
          case 'read_entry': {
            const entry = zip.getEntry(input.entry);
            if (!entry) throw new Error(`Entry not found: ${input.entry}`);
            return { result: JSON.stringify({ status: 'success', content: zip.readAsText(entry) }) };
          }
          case 'rename': {
            const entry = zip.getEntry(input.entry);
            if (!entry) throw new Error(`Entry not found: ${input.entry}`);
            entry.entryName = input.new_name;
            break;
          }
        }

        zip.writeZip(archivePath);
        return { result: JSON.stringify({ status: 'success', archive: archivePath, operation: input.operation }) };
      }

      case 'archive_structure': {
        if (!AdmZip) throw new Error('adm-zip not available');
        const archivePath = path.resolve(root, input.archive);
        const zip         = new AdmZip(archivePath);
        const entries     = zip.getEntries();

        switch (input.operation) {
          case 'inspect':
          case 'tree': {
            const tree = {};
            for (const e of entries) {
              const parts = e.entryName.split('/');
              let node = tree;
              for (const p of parts) {
                if (!node[p]) node[p] = {};
                node = node[p];
              }
            }
            return { result: JSON.stringify({ status: 'success', tree, entry_count: entries.length }) };
          }
          case 'validate': {
            const issues = [];
            for (const e of entries) {
              if (e.header.compressedSize > e.header.size * 10) issues.push({ entry: e.entryName, issue: 'high_compression_ratio' });
              if (e.entryName.includes('..')) issues.push({ entry: e.entryName, issue: 'path_traversal' });
            }
            return { result: JSON.stringify({ status: 'success', valid: issues.length === 0, issues }) };
          }
          default: return { result: JSON.stringify({ status: 'error', error: `Unknown structure operation` }) };
        }
      }

      case 'archive_security': {
        if (!AdmZip) throw new Error('adm-zip not available');
        const archivePath = path.resolve(root, input.archive);
        const zip         = new AdmZip(archivePath);
        const entries     = zip.getEntries();

        switch (input.operation) {
          case 'zip_bomb_check': {
            const totalRatio = entries.reduce((sum, e) => sum + (e.header.size / Math.max(e.header.compressedSize, 1)), 0) / entries.length;
            const suspicious = entries.filter(e => e.header.size / Math.max(e.header.compressedSize, 1) > 100);
            return { result: JSON.stringify({ status: 'success', safe: suspicious.length === 0, avg_ratio: totalRatio.toFixed(2), suspicious_entries: suspicious.map(e => e.entryName) }) };
          }
          case 'size_audit': {
            const maxMB   = input.max_size || 500;
            const totalMB = entries.reduce((sum, e) => sum + e.header.size, 0) / (1024 * 1024);
            return { result: JSON.stringify({ status: 'success', total_uncompressed_mb: totalMB.toFixed(2), within_limit: totalMB <= maxMB, limit_mb: maxMB }) };
          }
          case 'symlink_check': {
            const symlinks = entries.filter(e => (e.attr >> 16) === 0xA1FF || e.entryName.endsWith('/') === false && e.header.size === 0);
            return { result: JSON.stringify({ status: 'success', symlinks_found: symlinks.length, entries: symlinks.map(e => e.entryName) }) };
          }
          case 'scan_contents': {
            const SECRET_PATTERNS = [/AKIA[0-9A-Z]{16}/, /sk-[A-Za-z0-9]{48}/, /-----BEGIN.*PRIVATE KEY/];
            const found = [];
            for (const e of entries.slice(0, 50)) {
              try {
                const content = zip.readAsText(e);
                for (const p of SECRET_PATTERNS) {
                  if (p.test(content)) found.push({ entry: e.entryName, pattern: p.source.slice(0, 20) });
                }
              } catch { /* binary file */ }
            }
            return { result: JSON.stringify({ status: 'success', secrets_found: found.length, findings: found }) };
          }
          default: return { result: JSON.stringify({ status: 'error', error: `Unknown security operation` }) };
        }
      }

      case 'archive_bulk': {
        const srcDir = path.resolve(root, input.source_dir);
        const outDir = input.output_dir ? path.resolve(root, input.output_dir) : null;
        const zipFiles = fs.readdirSync(srcDir).filter(f => f.endsWith('.zip'));

        switch (input.operation) {
          case 'bulk_extract': {
            if (!outDir) throw new Error('output_dir required');
            fs.mkdirSync(outDir, { recursive: true });
            const results = [];
            for (const zf of zipFiles) {
              try {
                if (!AdmZip) throw new Error('adm-zip not available');
                const zip    = new AdmZip(path.join(srcDir, zf));
                const destDir = path.join(outDir, path.basename(zf, '.zip'));
                zip.extractAllTo(destDir, true);
                results.push({ archive: zf, extracted_to: destDir, status: 'ok' });
              } catch (err) {
                results.push({ archive: zf, status: 'error', error: err.message });
              }
            }
            return { result: JSON.stringify({ status: 'success', total: zipFiles.length, results }) };
          }
          default: return { result: JSON.stringify({ status: 'error', error: `Unknown bulk operation` }) };
        }
      }

      case 'archive_convert': {
        const src = path.resolve(root, input.source);
        const fmt = input.format;
        const base = path.basename(src).replace(/\.(zip|tar|tar\.gz|tar\.bz2)$/, '');
        const outPath = input.output ? path.resolve(root, input.output) : path.join(path.dirname(src), `${base}.${fmt.replace('.', '')}`);

        // Extract source to tmp, then repackage
        const tmpDir = `/tmp/arch_convert_${Date.now()}`;
        fs.mkdirSync(tmpDir);
        execSync(`cd "${tmpDir}" && unzip -q "${src}" 2>/dev/null || tar xf "${src}" 2>/dev/null || true`);

        if (fmt === 'zip') {
          execSync(`cd "${tmpDir}" && zip -r "${outPath}" . 2>&1`);
        } else if (fmt === 'tar') {
          execSync(`cd "${tmpDir}" && tar cf "${outPath}" . 2>&1`);
        } else if (fmt === 'tar.gz') {
          execSync(`cd "${tmpDir}" && tar czf "${outPath}" . 2>&1`);
        }

        fs.rmSync(tmpDir, { recursive: true });
        return { result: JSON.stringify({ status: 'success', output: outPath, format: fmt }) };
      }

      case 'archive_intelligence': {
        if (!AdmZip) throw new Error('adm-zip not available');
        const archivePath = path.resolve(root, input.archive);
        const zip         = new AdmZip(archivePath);
        const entries     = zip.getEntries();

        switch (input.operation) {
          case 'summarize': {
            const exts = {};
            let totalSize = 0;
            for (const e of entries) {
              const ext = path.extname(e.entryName) || '(none)';
              exts[ext] = (exts[ext] || 0) + 1;
              totalSize += e.header.size;
            }
            return { result: JSON.stringify({ status: 'success', total_entries: entries.length, uncompressed_kb: (totalSize / 1024).toFixed(1), file_types: exts }) };
          }
          case 'find': {
            const pattern = new RegExp(input.pattern || input.query || '', 'i');
            const found   = entries.filter(e => pattern.test(e.entryName)).map(e => e.entryName);
            return { result: JSON.stringify({ status: 'success', found, count: found.length }) };
          }
          case 'search_text': {
            const query   = input.query || '';
            const results = [];
            for (const e of entries.slice(0, 100)) {
              try {
                const text = zip.readAsText(e);
                if (text.includes(query)) results.push({ entry: e.entryName, context: text.slice(Math.max(0, text.indexOf(query) - 50), text.indexOf(query) + 100) });
              } catch { /* binary */ }
            }
            return { result: JSON.stringify({ status: 'success', results, found_in: results.length }) };
          }
          case 'find_secrets': {
            const PATS = [/AKIA[0-9A-Z]{16}/, /sk-[A-Za-z0-9]{48}/, /-----BEGIN.*PRIVATE KEY/, /password\s*=\s*['"][^'"]{8,}/i];
            const findings = [];
            for (const e of entries.slice(0, 50)) {
              try {
                const text = zip.readAsText(e);
                for (const p of PATS) { if (p.test(text)) findings.push(e.entryName); }
              } catch { /* binary */ }
            }
            return { result: JSON.stringify({ status: 'success', secrets_found: findings.length, files: findings }) };
          }
          default: return { result: JSON.stringify({ status: 'error', error: `Unknown intelligence operation` }) };
        }
      }

      case 'archive_deploy': {
        const src    = path.resolve(root, input.source);
        const outPath = path.resolve(root, input.output);
        const exc    = [...(input.exclude || []), 'node_modules', '.git', '.env', '*.log', 'dist', '.next'];

        switch (input.operation) {
          case 'package':
          case 'strip_dev': {
            if (!AdmZip) throw new Error('adm-zip not available');
            const zip    = new AdmZip();
            const excReg = new RegExp(exc.map(e => e.replace(/\*/g, '.*')).join('|'));
            function addDir(dirPath, zipPath = '') {
              const items = fs.readdirSync(dirPath);
              for (const item of items) {
                const fullPath = path.join(dirPath, item);
                const relPath  = zipPath ? `${zipPath}/${item}` : item;
                if (excReg.test(item)) continue;
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) addDir(fullPath, relPath);
                else zip.addLocalFile(fullPath, zipPath);
              }
            }
            addDir(src);
            if (input.version) zip.addFile('VERSION.txt', Buffer.from(input.version));
            zip.writeZip(outPath);
            return { result: JSON.stringify({ status: 'success', archive: outPath, entries: zip.getEntries().length }) };
          }
          default: return { result: JSON.stringify({ status: 'error', error: `Unknown deploy operation` }) };
        }
      }

      default:
        return { result: JSON.stringify({ status: 'error', error: `Unknown tool: ${toolName}` }) };
    }
  } catch (err) {
    return { result: JSON.stringify({ status: 'error', error: err.message, tool: toolName }) };
  }
}

export const isArchiveTool = (name) => ARCHIVE_TOOL_DEFINITIONS.some(t => t.name === name);
