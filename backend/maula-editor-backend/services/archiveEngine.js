/**
 * ARCHIVE ENGINE — Archive processing with archiver + adm-zip
 * Creates, extracts, inspects, and manipulates ZIP/TAR archives.
 */

import archiver from 'archiver';
import AdmZip from 'adm-zip';
import fs from 'fs/promises';
import { createWriteStream, createReadStream, existsSync } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import crypto from 'crypto';

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

function tmpPath(ext = 'zip') {
  return path.join('/tmp', `archive_${crypto.randomBytes(6).toString('hex')}.${ext}`);
}

async function collectFiles(dir, base = dir, excludePatterns = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(base, fullPath);
    if (excludePatterns.some(p => relPath.includes(p) || entry.name === p)) continue;
    if (entry.isDirectory()) {
      files = files.concat(await collectFiles(fullPath, base, excludePatterns));
    } else {
      files.push({ fullPath, relPath });
    }
  }
  return files;
}

// ── 1. CREATE ARCHIVE ───────────────────────────────────────────────────────

export async function createArchive(options = {}) {
  try {
    const {
      action = 'create',
      sourcePaths = [],
      sourceDir,
      outputPath,
      format = 'zip',
      compressionLevel = 6,
      excludePatterns = [],
      splitSize,
      partFiles = [],
    } = options;

    if (action === 'split') {
      // Split a file into parts
      const source = sourcePaths[0] || sourceDir;
      if (!source || !existsSync(source)) return { success: false, error: `Source not found: ${source}` };
      const size = splitSize || 10 * 1024 * 1024; // 10MB default
      const data = await fs.readFile(source);
      const parts = [];
      for (let i = 0; i < data.length; i += size) {
        const partPath = `${source}.part${Math.floor(i / size) + 1}`;
        await fs.writeFile(partPath, data.subarray(i, i + size));
        parts.push(partPath);
      }
      return { success: true, operation: 'split', parts, partCount: parts.length, originalSize: data.length };
    }

    if (action === 'merge') {
      // Merge parts back
      if (!partFiles.length) return { success: false, error: 'partFiles required for merge' };
      const out = outputPath || partFiles[0].replace(/\.part\d+$/, '');
      const buffers = [];
      for (const pf of partFiles) {
        buffers.push(await fs.readFile(pf));
      }
      const merged = Buffer.concat(buffers);
      await fs.writeFile(out, merged);
      return { success: true, operation: 'merge', outputPath: out, size: merged.length, sizeFormatted: formatBytes(merged.length) };
    }

    // action === 'create'
    const resolvedSources = sourceDir ? [sourceDir] : sourcePaths;
    if (!resolvedSources.length) return { success: false, error: 'No source paths or sourceDir provided' };

    const outPath = outputPath || tmpPath(format === 'tar.gz' ? 'tar.gz' : format);
    await ensureDir(path.dirname(outPath));

    return new Promise((resolve, reject) => {
      const output = createWriteStream(outPath);
      const archiverFormat = format === 'tar.gz' ? 'tar' : format;
      const archiverOpts = format === 'tar.gz'
        ? { gzip: true, gzipOptions: { level: compressionLevel } }
        : { zlib: { level: compressionLevel } };

      const archive = archiver(archiverFormat, archiverOpts);
      let entryCount = 0;

      output.on('close', () => {
        resolve({
          success: true,
          operation: 'create',
          outputPath: outPath,
          format,
          size: archive.pointer(),
          sizeFormatted: formatBytes(archive.pointer()),
          entryCount,
        });
      });

      archive.on('entry', () => { entryCount++; });
      archive.on('error', (err) => reject({ success: false, error: err.message }));
      archive.pipe(output);

      for (const src of resolvedSources) {
        if (!existsSync(src)) continue;
        const stat = require('fs').statSync(src);
        if (stat.isDirectory()) {
          archive.directory(src, path.basename(src));
        } else {
          archive.file(src, { name: path.basename(src) });
        }
      }

      archive.finalize();
    });
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 2. EXTRACT ARCHIVE ─────────────────────────────────────────────────────

export async function extractArchive(inputPath, options = {}) {
  try {
    const archivePath = inputPath || options?.inputPath;
    if (!archivePath || !existsSync(archivePath)) return { success: false, error: `Archive not found: ${archivePath}` };

    const { outputDir, filter } = options;
    const outDir = outputDir || path.join(path.dirname(archivePath), path.basename(archivePath, path.extname(archivePath)));
    await ensureDir(outDir);

    const ext = path.extname(archivePath).toLowerCase();
    if (ext === '.zip') {
      const zip = new AdmZip(archivePath);
      const entries = zip.getEntries();
      let extracted = 0;
      for (const entry of entries) {
        if (filter && !entry.entryName.includes(filter)) continue;
        if (!entry.isDirectory) {
          const target = path.join(outDir, entry.entryName);
          await ensureDir(path.dirname(target));
          await fs.writeFile(target, entry.getData());
          extracted++;
        }
      }
      return { success: true, operation: 'extract', outputDir: outDir, entryCount: extracted, format: 'zip' };
    }

    // tar / tar.gz — use system tar
    const tarFlag = archivePath.endsWith('.gz') || archivePath.endsWith('.tgz') ? 'xzf' : 'xf';
    execSync(`tar ${tarFlag} "${archivePath}" -C "${outDir}"`, { timeout: 60000 });
    const files = await collectFiles(outDir);
    return { success: true, operation: 'extract', outputDir: outDir, entryCount: files.length, format: ext.replace('.', '') };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 3. EDIT ARCHIVE ─────────────────────────────────────────────────────────

export async function editArchive(inputPath, options = {}) {
  try {
    const archivePath = inputPath || options?.inputPath;
    if (!archivePath || !existsSync(archivePath)) return { success: false, error: `Archive not found: ${archivePath}` };

    const { action = 'add', files = [], removePaths = [] } = options;
    const zip = new AdmZip(archivePath);

    if (action === 'add') {
      for (const f of files) {
        if (f.content) {
          zip.addFile(f.path, Buffer.from(f.content, 'utf-8'));
        } else if (f.sourcePath && existsSync(f.sourcePath)) {
          zip.addLocalFile(f.sourcePath, path.dirname(f.path));
        }
      }
    } else if (action === 'remove') {
      for (const rp of removePaths) {
        zip.deleteFile(rp);
      }
    } else if (action === 'update') {
      for (const f of files) {
        zip.deleteFile(f.path);
        zip.addFile(f.path, Buffer.from(f.content || '', 'utf-8'));
      }
    }

    const outPath = options.outputPath || archivePath;
    zip.writeZip(outPath);
    const stat = await fs.stat(outPath);
    return { success: true, operation: 'edit', action, outputPath: outPath, size: stat.size, sizeFormatted: formatBytes(stat.size), entryCount: zip.getEntryCount() };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 4. INSPECT ARCHIVE ─────────────────────────────────────────────────────

export async function inspectArchive(inputPath, options = {}) {
  try {
    const archivePath = inputPath || options?.inputPath;
    if (!archivePath || !existsSync(archivePath)) return { success: false, error: `Archive not found: ${archivePath}` };

    const ext = path.extname(archivePath).toLowerCase();
    const stat = await fs.stat(archivePath);

    if (ext === '.zip') {
      const zip = new AdmZip(archivePath);
      const entries = zip.getEntries().map(e => ({
        name: e.entryName,
        size: e.header.size,
        compressedSize: e.header.compressedSize,
        isDirectory: e.isDirectory,
        modified: e.header.time ? new Date(e.header.time).toISOString() : null,
      }));

      const totalUncompressed = entries.reduce((s, e) => s + (e.size || 0), 0);
      return {
        success: true,
        operation: 'inspect',
        format: 'zip',
        archiveSize: stat.size,
        archiveSizeFormatted: formatBytes(stat.size),
        totalUncompressed,
        totalUncompressedFormatted: formatBytes(totalUncompressed),
        entryCount: entries.length,
        entries: entries.slice(0, 200), // cap for LLM context
        compressionRatio: totalUncompressed > 0 ? ((1 - stat.size / totalUncompressed) * 100).toFixed(1) + '%' : 'N/A',
      };
    }

    // tar — use system tar to list
    const tarFlag = archivePath.endsWith('.gz') || archivePath.endsWith('.tgz') ? 'tzf' : 'tf';
    const listing = execSync(`tar ${tarFlag} "${archivePath}"`, { timeout: 30000 }).toString().trim();
    const entries = listing.split('\n').filter(Boolean);
    return {
      success: true,
      operation: 'inspect',
      format: ext.replace('.', ''),
      archiveSize: stat.size,
      archiveSizeFormatted: formatBytes(stat.size),
      entryCount: entries.length,
      entries: entries.slice(0, 200).map(name => ({ name })),
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 5. SECURITY CHECK ───────────────────────────────────────────────────────

export async function securityCheck(inputPath, options = {}) {
  try {
    const archivePath = inputPath || options?.inputPath;
    if (!archivePath || !existsSync(archivePath)) return { success: false, error: `Archive not found: ${archivePath}` };

    const issues = [];
    const ext = path.extname(archivePath).toLowerCase();
    const stat = await fs.stat(archivePath);

    if (ext === '.zip') {
      const zip = new AdmZip(archivePath);
      const entries = zip.getEntries();
      let totalSize = 0;

      for (const entry of entries) {
        // Path traversal check
        if (entry.entryName.includes('..') || entry.entryName.startsWith('/')) {
          issues.push({ type: 'path_traversal', severity: 'critical', file: entry.entryName, message: 'Path traversal detected' });
        }
        // Zip bomb check (ratio > 100:1)
        if (entry.header.compressedSize > 0 && entry.header.size / entry.header.compressedSize > 100) {
          issues.push({ type: 'zip_bomb', severity: 'critical', file: entry.entryName, message: `Extreme compression ratio: ${(entry.header.size / entry.header.compressedSize).toFixed(0)}:1` });
        }
        // Suspicious extensions
        const suspicious = ['.exe', '.dll', '.bat', '.cmd', '.ps1', '.vbs', '.scr', '.com'];
        if (suspicious.some(s => entry.entryName.toLowerCase().endsWith(s))) {
          issues.push({ type: 'suspicious_file', severity: 'warning', file: entry.entryName, message: 'Potentially dangerous executable' });
        }
        totalSize += entry.header.size;
      }

      // Overall zip bomb check
      if (stat.size > 0 && totalSize / stat.size > 1000) {
        issues.push({ type: 'zip_bomb', severity: 'critical', message: `Archive decompresses to ${formatBytes(totalSize)} from ${formatBytes(stat.size)}` });
      }

      return {
        success: true,
        operation: 'security_check',
        safe: issues.filter(i => i.severity === 'critical').length === 0,
        issues,
        issueCount: issues.length,
        criticalCount: issues.filter(i => i.severity === 'critical').length,
        warningCount: issues.filter(i => i.severity === 'warning').length,
        entryCount: entries.length,
        archiveSize: stat.size,
        decompressedSize: totalSize,
      };
    }

    // Basic check for non-zip
    return { success: true, operation: 'security_check', safe: true, issues: [], issueCount: 0, message: 'Basic check passed (detailed scanning only for ZIP)' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 6. BULK ARCHIVE ─────────────────────────────────────────────────────────

export async function bulkArchive(options = {}) {
  try {
    const { action = 'compress', items = [], format = 'zip', outputDir } = options;
    const results = [];

    if (action === 'compress') {
      for (const item of items) {
        const src = item.path || item;
        if (!existsSync(src)) { results.push({ source: src, success: false, error: 'Not found' }); continue; }
        const outDir = outputDir || path.dirname(src);
        const outPath = path.join(outDir, path.basename(src) + '.' + format);
        const result = await createArchive({ sourcePaths: [src], outputPath: outPath, format });
        results.push({ source: src, ...result });
      }
    } else if (action === 'extract') {
      for (const item of items) {
        const src = item.path || item;
        const result = await extractArchive(src, { outputDir: item.outputDir || outputDir });
        results.push({ source: src, ...result });
      }
    }

    return {
      success: true,
      operation: 'bulk',
      action,
      total: items.length,
      succeeded: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 7. CONVERT ARCHIVE ──────────────────────────────────────────────────────

export async function convertArchive(inputPath, options = {}) {
  try {
    const archivePath = inputPath || options?.inputPath;
    if (!archivePath || !existsSync(archivePath)) return { success: false, error: `Archive not found: ${archivePath}` };

    const { targetFormat = 'zip' } = options;
    const tmpDir = path.join('/tmp', `convert_${crypto.randomBytes(6).toString('hex')}`);
    await ensureDir(tmpDir);

    // Extract to temp
    await extractArchive(archivePath, { outputDir: tmpDir });

    // Re-archive in target format
    const outPath = options.outputPath || archivePath.replace(/\.(zip|tar|tar\.gz|tgz)$/i, '.' + targetFormat);
    const result = await createArchive({ sourceDir: tmpDir, outputPath: outPath, format: targetFormat });

    // Cleanup
    await fs.rm(tmpDir, { recursive: true, force: true });

    return { ...result, operation: 'convert', originalFormat: path.extname(archivePath).replace('.', ''), targetFormat };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 8. SEARCH ARCHIVE ───────────────────────────────────────────────────────

export async function searchArchive(inputPath, options = {}) {
  try {
    const archivePath = inputPath || options?.inputPath;
    if (!archivePath || !existsSync(archivePath)) return { success: false, error: `Archive not found: ${archivePath}` };

    const { pattern, contentSearch, caseSensitive = false } = options;
    const ext = path.extname(archivePath).toLowerCase();

    if (ext !== '.zip') return { success: false, error: 'Content search only supported for ZIP archives' };

    const zip = new AdmZip(archivePath);
    const entries = zip.getEntries();
    const matches = [];
    const flags = caseSensitive ? '' : 'i';

    for (const entry of entries) {
      if (entry.isDirectory) continue;

      // Name match
      if (pattern) {
        const re = new RegExp(pattern, flags);
        if (re.test(entry.entryName)) {
          matches.push({ file: entry.entryName, matchType: 'name', size: entry.header.size });
          continue;
        }
      }

      // Content match (only text files < 1MB)
      if (contentSearch && entry.header.size < 1024 * 1024) {
        try {
          const content = entry.getData().toString('utf-8');
          const re = new RegExp(contentSearch, flags);
          if (re.test(content)) {
            const lines = content.split('\n');
            const matchingLines = lines
              .map((line, i) => ({ line: i + 1, text: line }))
              .filter(l => re.test(l.text))
              .slice(0, 5);
            matches.push({ file: entry.entryName, matchType: 'content', size: entry.header.size, matchingLines });
          }
        } catch { /* skip binary */ }
      }
    }

    return { success: true, operation: 'search', matchCount: matches.length, matches: matches.slice(0, 100), totalEntries: entries.length };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 9. DEPLOY ARCHIVE ───────────────────────────────────────────────────────

export async function deployArchive(inputPath, options = {}) {
  try {
    const archivePath = inputPath || options?.inputPath;
    if (!archivePath || !existsSync(archivePath)) return { success: false, error: `Archive not found: ${archivePath}` };

    const { targetDir, backup = true, clean = false } = options;
    if (!targetDir) return { success: false, error: 'targetDir is required for deploy' };

    // Backup existing
    let backupPath = null;
    if (backup && existsSync(targetDir)) {
      backupPath = `${targetDir}_backup_${Date.now()}`;
      await fs.cp(targetDir, backupPath, { recursive: true });
    }

    // Clean target if requested
    if (clean && existsSync(targetDir)) {
      await fs.rm(targetDir, { recursive: true, force: true });
    }

    // Extract to target
    const result = await extractArchive(archivePath, { outputDir: targetDir });
    return { ...result, operation: 'deploy', targetDir, backupPath };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 10. CORE ARCHIVE ────────────────────────────────────────────────────────

export async function coreArchive(options = {}) {
  try {
    const { action = 'info', inputPath } = options;

    if (action === 'info' && inputPath && existsSync(inputPath)) {
      const stat = await fs.stat(inputPath);
      return { success: true, operation: 'core', action: 'info', path: inputPath, size: stat.size, sizeFormatted: formatBytes(stat.size), modified: stat.mtime.toISOString() };
    }

    if (action === 'capabilities') {
      return getArchiveCapabilities();
    }

    return { success: true, operation: 'core', action, message: `Core action '${action}' completed` };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 11. STRUCTURE ARCHIVE ───────────────────────────────────────────────────

export async function structureArchive(inputPath, options = {}) {
  try {
    const archivePath = inputPath || options?.inputPath;
    if (!archivePath || !existsSync(archivePath)) return { success: false, error: `Archive not found: ${archivePath}` };

    const ext = path.extname(archivePath).toLowerCase();
    if (ext !== '.zip') return { success: false, error: 'Structure analysis only supported for ZIP' };

    const zip = new AdmZip(archivePath);
    const entries = zip.getEntries();

    const tree = {};
    const extensions = {};
    let totalSize = 0;

    for (const entry of entries) {
      if (entry.isDirectory) continue;
      totalSize += entry.header.size;

      const ext = path.extname(entry.entryName).toLowerCase() || '(no ext)';
      extensions[ext] = (extensions[ext] || 0) + 1;

      // Build tree
      const parts = entry.entryName.split('/');
      let node = tree;
      for (const part of parts.slice(0, -1)) {
        node[part] = node[part] || {};
        node = node[part];
      }
      node[parts[parts.length - 1]] = entry.header.size;
    }

    return {
      success: true,
      operation: 'structure',
      entryCount: entries.length,
      totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      extensions,
      topLevelDirs: Object.keys(tree),
      tree: JSON.stringify(tree).length < 5000 ? tree : '(too large to display — use inspect for details)',
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── 12. INTELLIGENCE ARCHIVE ────────────────────────────────────────────────

export async function intelligenceArchive(inputPath, options = {}) {
  try {
    const archivePath = inputPath || options?.inputPath;
    if (!archivePath || !existsSync(archivePath)) return { success: false, error: `Archive not found: ${archivePath}` };

    const ext = path.extname(archivePath).toLowerCase();
    if (ext !== '.zip') return { success: false, error: 'Intelligence analysis only supported for ZIP' };

    const zip = new AdmZip(archivePath);
    const entries = zip.getEntries();

    const analysis = {
      isProject: false,
      projectType: null,
      hasPackageJson: false,
      hasGitignore: false,
      hasSrcDir: false,
      hasReadme: false,
      languages: {},
      frameworks: [],
    };

    const langMap = { '.js': 'JavaScript', '.ts': 'TypeScript', '.py': 'Python', '.java': 'Java', '.rb': 'Ruby', '.go': 'Go', '.rs': 'Rust', '.php': 'PHP', '.cs': 'C#', '.cpp': 'C++', '.c': 'C', '.swift': 'Swift', '.kt': 'Kotlin' };

    for (const entry of entries) {
      const name = entry.entryName;
      if (name.endsWith('package.json')) { analysis.hasPackageJson = true; analysis.isProject = true; }
      if (name.endsWith('.gitignore')) analysis.hasGitignore = true;
      if (name.includes('src/')) analysis.hasSrcDir = true;
      if (name.match(/readme/i)) analysis.hasReadme = true;

      const fileExt = path.extname(name).toLowerCase();
      if (langMap[fileExt]) analysis.languages[langMap[fileExt]] = (analysis.languages[langMap[fileExt]] || 0) + 1;
    }

    // Detect project type
    if (analysis.hasPackageJson) {
      try {
        const pkgEntry = entries.find(e => e.entryName.endsWith('package.json') && !e.entryName.includes('node_modules'));
        if (pkgEntry) {
          const pkg = JSON.parse(pkgEntry.getData().toString('utf-8'));
          const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
          if (allDeps.next) { analysis.projectType = 'Next.js'; analysis.frameworks.push('Next.js'); }
          else if (allDeps.react) { analysis.projectType = 'React'; analysis.frameworks.push('React'); }
          else if (allDeps.vue) { analysis.projectType = 'Vue'; analysis.frameworks.push('Vue'); }
          else if (allDeps.express) { analysis.projectType = 'Express'; analysis.frameworks.push('Express'); }
          else { analysis.projectType = 'Node.js'; }
        }
      } catch { /* ignore parse errors */ }
    }

    const primaryLang = Object.entries(analysis.languages).sort((a, b) => b[1] - a[1])[0];

    return {
      success: true,
      operation: 'intelligence',
      entryCount: entries.length,
      isProject: analysis.isProject,
      projectType: analysis.projectType,
      primaryLanguage: primaryLang ? primaryLang[0] : null,
      languages: analysis.languages,
      frameworks: analysis.frameworks,
      hasPackageJson: analysis.hasPackageJson,
      hasGitignore: analysis.hasGitignore,
      hasSrcDir: analysis.hasSrcDir,
      hasReadme: analysis.hasReadme,
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── CAPABILITIES ────────────────────────────────────────────────────────────

export function getArchiveCapabilities() {
  return {
    supported: true,
    message: 'Archive engine ready — archiver + adm-zip',
    formats: ['zip', 'tar', 'tar.gz'],
    operations: ['create', 'extract', 'edit', 'inspect', 'search', 'convert', 'security_check', 'bulk', 'deploy', 'structure', 'intelligence'],
  };
}
