/**
 * 📦 Archive Processing Service
 * ─────────────────────────────────────────────────────────────────
 * 8 consolidated tools covering ZIP / TAR / 7Z / RAR operations:
 *
 *  1. archive_core      — create, extract, repack, rename, split, merge, compress
 *  2. archive_edit       — add_files, remove_files, replace_file, edit_text, patch_config, fix_paths
 *  3. archive_structure  — inspect, detect_missing, validate_layout, normalize, flatten, nest, naming
 *  4. archive_security   — zip_bomb_check, size_limit, symlink_check, password_detect, encrypt, scan
 *  5. archive_bulk       — bulk_extract, bulk_rezip, auto_rename, deduplicate, chunk, progress
 *  6. archive_convert    — zip_to_tar, tar_to_zip, zip_to_targz, targz_to_zip, zip_to_7z, rar_extract, fix_line_endings
 *  7. archive_intelligence — summarize, find_files, search_text, auto_readme, detect_project, flag_secrets
 *  8. archive_deploy     — package_build, prepare_deploy, inject_env, strip_dev, size_optimize, version_tag
 *
 * Pattern mirrors video-processing-service.js:
 *   export async function toolName(params, userId) → { success, ... }
 * ─────────────────────────────────────────────────────────────────
 */

import path from 'path';
import fs from 'fs';
import os from 'os';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { createGzip, createGunzip } from 'zlib';
import AgentFile from '../models/AgentFile.js';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';

// Lazy-load heavy deps
let _AdmZip = null;
let _archiver = null;
let _tar = null;

async function getAdmZip() {
  if (_AdmZip) return _AdmZip;
  const mod = await import('adm-zip');
  _AdmZip = mod.default || mod;
  return _AdmZip;
}

async function getArchiver() {
  if (_archiver) return _archiver;
  const mod = await import('archiver');
  _archiver = mod.default || mod;
  return _archiver;
}

async function getTar() {
  if (_tar) return _tar;
  try {
    const mod = await import('tar');
    _tar = mod.default || mod;
    return _tar;
  } catch {
    return null; // tar is optional
  }
}

// ─── S3 Setup ──────────────────────────────────────────────────
const S3_BUCKET = process.env.S3_BUCKET || 'mumtazai-bucket';
const S3_REGION = process.env.AWS_REGION || 'ap-southeast-1';
const s3Client = new S3Client({
  region: S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/** Upload buffer to S3, return URL */
async function uploadToS3(key, content, mimeType) {
  const buffer =
    typeof content === 'string' ? Buffer.from(content, 'utf-8') : content;
  await s3Client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );
  const url = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;
  console.log(`[ArchiveService][S3] Uploaded: ${key} (${buffer.length} bytes)`);
  return url;
}

/** Download file content from S3 */
async function downloadFromS3(key) {
  const response = await s3Client.send(
    new GetObjectCommand({ Bucket: S3_BUCKET, Key: key })
  );
  const chunks = [];
  for await (const chunk of response.Body) chunks.push(chunk);
  return Buffer.concat(chunks);
}

// ─── Helpers ───────────────────────────────────────────────────

/** Resolve archive input → local temp file path */
async function resolveArchiveInput(source, userId = 'default') {
  // Already a local file
  if (source.startsWith('/') && fs.existsSync(source))
    return { path: source, isTemp: false };

  // URL — download to temp
  if (source.startsWith('http://') || source.startsWith('https://')) {
    const resp = await fetch(source);
    if (!resp.ok) throw new Error(`Failed to fetch archive: ${resp.status}`);
    const buffer = Buffer.from(await resp.arrayBuffer());
    const ext = path.extname(new URL(source).pathname) || '.zip';
    const tempPath = path.join(os.tmpdir(), `arc_${Date.now()}${ext}`);
    fs.writeFileSync(tempPath, buffer);
    return { path: tempPath, isTemp: true };
  }

  // AgentFile lookup
  const file = await AgentFile.findOne({
    userId,
    $or: [{ path: source }, { filename: source }],
  });
  if (file?.s3Key) {
    const buffer = await downloadFromS3(file.s3Key);
    const ext = path.extname(file.filename || source) || '.zip';
    const tempPath = path.join(os.tmpdir(), `arc_${Date.now()}${ext}`);
    fs.writeFileSync(tempPath, buffer);
    return { path: tempPath, isTemp: true };
  }
  if (file?.path && fs.existsSync(file.path))
    return { path: file.path, isTemp: false };

  throw new Error(`Archive not found: ${source}`);
}

/** Clean up temp file */
function cleanTemp(filePath, isTemp) {
  if (isTemp && filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch {
      /* ignore */
    }
  }
}

/** Clean up temp directory */
function cleanTempDir(dirPath) {
  if (dirPath && fs.existsSync(dirPath)) {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}

/** Detect archive type from extension */
function detectArchiveType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.zip' || ext === '.jar' || ext === '.war') return 'zip';
  if (ext === '.tar') return 'tar';
  if (ext === '.gz' || ext === '.tgz') return 'tar.gz';
  if (ext === '.bz2') return 'tar.bz2';
  if (ext === '.7z') return '7z';
  if (ext === '.rar') return 'rar';
  return 'zip'; // default
}

/** Get MIME type for archive */
function getArchiveMime(type) {
  const mimes = {
    zip: 'application/zip',
    tar: 'application/x-tar',
    'tar.gz': 'application/gzip',
    'tar.bz2': 'application/x-bzip2',
    '7z': 'application/x-7z-compressed',
    rar: 'application/vnd.rar',
  };
  return mimes[type] || 'application/octet-stream';
}

/** Human-readable file size */
function humanSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/** Record file in AgentFile collection */
async function recordAgentFile(userId, filename, s3Key, url, mimeType, size) {
  try {
    await AgentFile.create({
      userId,
      filename,
      path: url,
      s3Key,
      mimeType,
      size,
      type: 'archive',
      createdAt: new Date(),
    });
  } catch (e) {
    console.warn('[ArchiveService] Failed to record AgentFile:', e.message);
  }
}

// ZIP bomb detection constants
const ZIP_BOMB_RATIO = 100; // Compression ratio > 100x is suspicious
const ZIP_BOMB_MAX_FILES = 50000; // More than 50k entries is suspicious
const MAX_EXTRACT_SIZE = 2 * 1024 * 1024 * 1024; // 2 GB default limit

// Secret patterns for flag_secrets
const SECRET_PATTERNS = [
  {
    pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"]?[A-Za-z0-9_\-]{16,}/gi,
    label: 'API Key',
  },
  {
    pattern: /(?:secret|password|passwd|pwd)\s*[:=]\s*['"]?[^\s'"]{8,}/gi,
    label: 'Secret/Password',
  },
  {
    pattern:
      /(?:aws_access_key_id|aws_secret_access_key)\s*[:=]\s*['"]?[A-Za-z0-9/+=]{16,}/gi,
    label: 'AWS Credential',
  },
  { pattern: /(?:AKIA|ASIA)[A-Z0-9]{16}/g, label: 'AWS Access Key ID' },
  {
    pattern: /-----BEGIN (?:RSA |DSA |EC )?PRIVATE KEY-----/g,
    label: 'Private Key',
  },
  { pattern: /ghp_[A-Za-z0-9_]{36,}/g, label: 'GitHub Token' },
  { pattern: /sk-[A-Za-z0-9]{32,}/g, label: 'OpenAI API Key' },
  { pattern: /sk_live_[A-Za-z0-9]{24,}/g, label: 'Stripe Secret Key' },
  { pattern: /xox[bprs]-[A-Za-z0-9-]{10,}/g, label: 'Slack Token' },
  {
    pattern:
      /eyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g,
    label: 'JWT Token',
  },
  {
    pattern: /mongodb(\+srv)?:\/\/[^\s'"]+/gi,
    label: 'MongoDB Connection String',
  },
  {
    pattern: /postgres(ql)?:\/\/[^\s'"]+/gi,
    label: 'PostgreSQL Connection String',
  },
];

// Project detection signatures
const PROJECT_SIGNATURES = {
  node: ['package.json', 'node_modules/', 'yarn.lock', 'pnpm-lock.yaml'],
  python: [
    'requirements.txt',
    'setup.py',
    'pyproject.toml',
    'Pipfile',
    '__init__.py',
  ],
  php: ['composer.json', 'artisan', 'wp-config.php', 'index.php'],
  ruby: ['Gemfile', 'Rakefile', '.ruby-version'],
  java: ['pom.xml', 'build.gradle', 'gradlew', '.java'],
  dotnet: ['*.csproj', '*.sln', 'Program.cs', 'appsettings.json'],
  rust: ['Cargo.toml', 'Cargo.lock'],
  go: ['go.mod', 'go.sum', 'main.go'],
  react: ['package.json', 'src/App.jsx', 'src/App.tsx', 'src/index.js'],
  nextjs: ['next.config.js', 'next.config.mjs', 'pages/', 'app/'],
  docker: ['Dockerfile', 'docker-compose.yml', '.dockerignore'],
  terraform: ['main.tf', 'variables.tf', 'terraform.tfstate'],
};

// Dev files to strip
const DEV_FILES = [
  'node_modules/',
  '.git/',
  '.svn/',
  '.hg/',
  '__pycache__/',
  '.pytest_cache/',
  '.mypy_cache/',
  '.DS_Store',
  'Thumbs.db',
  'desktop.ini',
  '*.log',
  '.env.local',
  '.env.development',
  'coverage/',
  '.nyc_output/',
  '.cache/',
  'dist/',
  'build/',
  '.next/',
  '.nuxt/',
  '*.map',
  '*.test.js',
  '*.test.ts',
  '*.spec.js',
  '*.spec.ts',
  'test/',
  'tests/',
  '__tests__/',
  '.eslintcache',
  '.prettierrc',
];

// ═══════════════════════════════════════════════════════════════
// 1. ARCHIVE CORE — create, extract, repack, rename, split, merge, compress
// ═══════════════════════════════════════════════════════════════

export async function archiveCore(params, userId = 'default') {
  const { file, action = 'create', options = {} } = params;

  try {
    switch (action) {
      // ── Create ZIP/TAR from files ───────────────────────────
      case 'create': {
        const {
          files = [],
          format = 'zip',
          name = `archive_${Date.now()}`,
          compressionLevel = 6,
          baseDir,
        } = options;

        if (!files.length && !baseDir) {
          return {
            success: false,
            error: 'Provide files array or baseDir to archive',
          };
        }

        const AdmZip = await getAdmZip();
        const outputName = `${name}.${format === 'tar.gz' ? 'tar.gz' : format}`;
        const s3Key = `archives/${userId}/${Date.now()}_${outputName}`;

        if (format === 'zip') {
          const zip = new AdmZip();
          if (baseDir) {
            // Archive a directory
            const resolved = await resolveArchiveInput(baseDir, userId);
            const basePath = resolved.path;
            if (fs.statSync(basePath).isDirectory()) {
              zip.addLocalFolder(basePath);
            } else {
              zip.addLocalFile(basePath);
            }
            cleanTemp(basePath, resolved.isTemp);
          } else {
            for (const f of files) {
              try {
                const resolved = await resolveArchiveInput(f, userId);
                zip.addLocalFile(
                  resolved.path,
                  '',
                  path.basename(resolved.path)
                );
                cleanTemp(resolved.path, resolved.isTemp);
              } catch (e) {
                // If its a text content entry: { name, content }
                if (typeof f === 'object' && f.name && f.content) {
                  zip.addFile(f.name, Buffer.from(f.content, 'utf-8'));
                }
              }
            }
          }

          const buffer = zip.toBuffer();
          const url = await uploadToS3(s3Key, buffer, 'application/zip');
          await recordAgentFile(
            userId,
            outputName,
            s3Key,
            url,
            'application/zip',
            buffer.length
          );

          return {
            success: true,
            url,
            filename: outputName,
            size: humanSize(buffer.length),
            format: 'zip',
            entryCount: zip.getEntries().length,
          };
        }

        if (format === 'tar' || format === 'tar.gz') {
          const archiver = await getArchiver();
          const tempPath = path.join(
            os.tmpdir(),
            `arc_${Date.now()}.${format === 'tar.gz' ? 'tar.gz' : 'tar'}`
          );
          const output = createWriteStream(tempPath);
          const archive = archiver(format === 'tar.gz' ? 'tar' : 'tar', {
            gzip: format === 'tar.gz',
            gzipOptions: { level: compressionLevel },
          });

          archive.pipe(output);

          if (baseDir) {
            const resolved = await resolveArchiveInput(baseDir, userId);
            if (fs.statSync(resolved.path).isDirectory()) {
              archive.directory(resolved.path, false);
            } else {
              archive.file(resolved.path, {
                name: path.basename(resolved.path),
              });
            }
            cleanTemp(resolved.path, resolved.isTemp);
          } else {
            for (const f of files) {
              if (typeof f === 'object' && f.name && f.content) {
                archive.append(Buffer.from(f.content, 'utf-8'), {
                  name: f.name,
                });
              } else {
                try {
                  const resolved = await resolveArchiveInput(f, userId);
                  archive.file(resolved.path, {
                    name: path.basename(resolved.path),
                  });
                  cleanTemp(resolved.path, resolved.isTemp);
                } catch {
                  /* skip unresolvable */
                }
              }
            }
          }

          await archive.finalize();
          await new Promise((resolve) => output.on('close', resolve));

          const buffer = fs.readFileSync(tempPath);
          const mime =
            format === 'tar.gz' ? 'application/gzip' : 'application/x-tar';
          const url = await uploadToS3(s3Key, buffer, mime);
          await recordAgentFile(
            userId,
            outputName,
            s3Key,
            url,
            mime,
            buffer.length
          );
          cleanTemp(tempPath, true);

          return {
            success: true,
            url,
            filename: outputName,
            size: humanSize(buffer.length),
            format,
          };
        }

        return {
          success: false,
          error: `Unsupported create format: ${format}. Use zip, tar, or tar.gz`,
        };
      }

      // ── Extract archive ─────────────────────────────────────
      case 'extract': {
        const { destination, filter, flat = false, maxSize } = options;

        const resolved = await resolveArchiveInput(file, userId);
        const archiveType = detectArchiveType(resolved.path);

        if (archiveType === 'zip') {
          const AdmZip = await getAdmZip();
          const zip = new AdmZip(resolved.path);
          const entries = zip.getEntries();

          // Safety check
          const totalUncompressed = entries.reduce(
            (sum, e) => sum + e.header.size,
            0
          );
          const limit = maxSize || MAX_EXTRACT_SIZE;
          if (totalUncompressed > limit) {
            cleanTemp(resolved.path, resolved.isTemp);
            return {
              success: false,
              error: `Extraction would produce ${humanSize(totalUncompressed)}, exceeds limit of ${humanSize(limit)}`,
            };
          }

          const extractDir =
            destination || path.join(os.tmpdir(), `extract_${Date.now()}`);
          fs.mkdirSync(extractDir, { recursive: true });

          let extracted = [];
          for (const entry of entries) {
            if (entry.isDirectory) continue;
            if (filter && !entry.entryName.match(new RegExp(filter, 'i')))
              continue;

            const targetPath = flat
              ? path.join(extractDir, path.basename(entry.entryName))
              : path.join(extractDir, entry.entryName);

            fs.mkdirSync(path.dirname(targetPath), { recursive: true });
            fs.writeFileSync(targetPath, entry.getData());
            extracted.push({
              name: entry.entryName,
              size: humanSize(entry.header.size),
              path: targetPath,
            });
          }

          // Upload extracted files to S3
          const s3Results = [];
          for (const ext of extracted.slice(0, 100)) {
            // Cap at 100 files for S3
            const s3Key = `archives/${userId}/extracted/${Date.now()}_${path.basename(ext.name)}`;
            const buffer = fs.readFileSync(ext.path);
            const mime = getMimeFromExt(ext.name);
            const url = await uploadToS3(s3Key, buffer, mime);
            s3Results.push({ name: ext.name, url, size: ext.size });
          }

          cleanTemp(resolved.path, resolved.isTemp);
          cleanTempDir(extractDir);

          return {
            success: true,
            extractedCount: extracted.length,
            files: s3Results.slice(0, 50), // Return first 50 in response
            totalFiles: extracted.length,
            totalSize: humanSize(totalUncompressed),
          };
        }

        // TAR / TAR.GZ extraction
        if (archiveType === 'tar' || archiveType === 'tar.gz') {
          const tar = await getTar();
          if (!tar) {
            cleanTemp(resolved.path, resolved.isTemp);
            return {
              success: false,
              error: 'tar package not available. Install: npm i tar',
            };
          }

          const extractDir =
            destination || path.join(os.tmpdir(), `extract_${Date.now()}`);
          fs.mkdirSync(extractDir, { recursive: true });

          await tar.x({
            file: resolved.path,
            cwd: extractDir,
            strip: flat ? 999 : 0,
          });

          const extracted = [];
          function walkDir(dir, prefix = '') {
            for (const item of fs.readdirSync(dir)) {
              const fullPath = path.join(dir, item);
              const relPath = prefix ? `${prefix}/${item}` : item;
              if (fs.statSync(fullPath).isDirectory()) {
                walkDir(fullPath, relPath);
              } else {
                extracted.push({
                  name: relPath,
                  path: fullPath,
                  size: humanSize(fs.statSync(fullPath).size),
                });
              }
            }
          }
          walkDir(extractDir);

          const s3Results = [];
          for (const ext of extracted.slice(0, 100)) {
            const s3Key = `archives/${userId}/extracted/${Date.now()}_${path.basename(ext.name)}`;
            const buffer = fs.readFileSync(ext.path);
            const url = await uploadToS3(
              s3Key,
              buffer,
              getMimeFromExt(ext.name)
            );
            s3Results.push({ name: ext.name, url, size: ext.size });
          }

          cleanTemp(resolved.path, resolved.isTemp);
          cleanTempDir(extractDir);

          return {
            success: true,
            extractedCount: extracted.length,
            files: s3Results.slice(0, 50),
            totalFiles: extracted.length,
          };
        }

        cleanTemp(resolved.path, resolved.isTemp);
        return {
          success: false,
          error: `Unsupported archive type: ${archiveType}`,
        };
      }

      // ── Repack — extract and re-create with new settings ────
      case 'repack': {
        const { format = 'zip', compressionLevel = 9, name } = options;

        const resolved = await resolveArchiveInput(file, userId);
        const AdmZip = await getAdmZip();
        const sourceZip = new AdmZip(resolved.path);
        const entries = sourceZip.getEntries();

        const outputName = name || `repacked_${Date.now()}.${format}`;
        const s3Key = `archives/${userId}/${Date.now()}_${outputName}`;

        if (format === 'zip') {
          const newZip = new AdmZip();
          for (const entry of entries) {
            if (entry.isDirectory) continue;
            newZip.addFile(entry.entryName, entry.getData(), entry.comment);
          }

          const buffer = newZip.toBuffer();
          const url = await uploadToS3(s3Key, buffer, 'application/zip');
          await recordAgentFile(
            userId,
            outputName,
            s3Key,
            url,
            'application/zip',
            buffer.length
          );
          cleanTemp(resolved.path, resolved.isTemp);

          return {
            success: true,
            url,
            filename: outputName,
            size: humanSize(buffer.length),
            entryCount: entries.filter((e) => !e.isDirectory).length,
          };
        }

        cleanTemp(resolved.path, resolved.isTemp);
        return {
          success: false,
          error: `Repack to ${format} not yet supported`,
        };
      }

      // ── Rename files inside archive ──────────────────────────
      case 'rename': {
        const { renames = {} } = options;
        // renames: { "old/path.txt": "new/path.txt" }

        if (!Object.keys(renames).length) {
          return {
            success: false,
            error: 'Provide renames object: { "old/path": "new/path" }',
          };
        }

        const resolved = await resolveArchiveInput(file, userId);
        const AdmZip = await getAdmZip();
        const zip = new AdmZip(resolved.path);
        const newZip = new AdmZip();
        let renamed = 0;

        for (const entry of zip.getEntries()) {
          if (entry.isDirectory) continue;
          const newName = renames[entry.entryName] || entry.entryName;
          if (newName !== entry.entryName) renamed++;
          newZip.addFile(newName, entry.getData());
        }

        const outputName = `renamed_${path.basename(file)}`;
        const s3Key = `archives/${userId}/${Date.now()}_${outputName}`;
        const buffer = newZip.toBuffer();
        const url = await uploadToS3(s3Key, buffer, 'application/zip');
        await recordAgentFile(
          userId,
          outputName,
          s3Key,
          url,
          'application/zip',
          buffer.length
        );
        cleanTemp(resolved.path, resolved.isTemp);

        return {
          success: true,
          url,
          filename: outputName,
          renamedCount: renamed,
        };
      }

      // ── Change compression level ─────────────────────────────
      case 'compress': {
        const { level = 9 } = options;

        const resolved = await resolveArchiveInput(file, userId);
        const AdmZip = await getAdmZip();
        const sourceZip = new AdmZip(resolved.path);
        const newZip = new AdmZip();

        for (const entry of sourceZip.getEntries()) {
          if (entry.isDirectory) continue;
          newZip.addFile(entry.entryName, entry.getData());
        }

        const outputName = `compressed_${path.basename(file)}`;
        const s3Key = `archives/${userId}/${Date.now()}_${outputName}`;
        const buffer = newZip.toBuffer();
        const url = await uploadToS3(s3Key, buffer, 'application/zip');
        await recordAgentFile(
          userId,
          outputName,
          s3Key,
          url,
          'application/zip',
          buffer.length
        );
        cleanTemp(resolved.path, resolved.isTemp);

        const originalSize = fs.existsSync(resolved.path)
          ? fs.statSync(resolved.path).size
          : buffer.length;
        return {
          success: true,
          url,
          filename: outputName,
          originalSize: humanSize(originalSize),
          newSize: humanSize(buffer.length),
          compressionLevel: level,
        };
      }

      // ── Split ZIP into parts ──────────────────────────────────
      case 'split': {
        const { partSize = 10 * 1024 * 1024 } = options; // Default 10MB parts

        const resolved = await resolveArchiveInput(file, userId);
        const AdmZip = await getAdmZip();
        const zip = new AdmZip(resolved.path);
        const entries = zip.getEntries().filter((e) => !e.isDirectory);

        const parts = [];
        let currentPart = new AdmZip();
        let currentSize = 0;
        let partNum = 1;

        for (const entry of entries) {
          const entrySize = entry.getData().length;
          if (currentSize + entrySize > partSize && currentSize > 0) {
            // Save current part
            const partName = `${path.basename(file, '.zip')}_part${partNum}.zip`;
            const s3Key = `archives/${userId}/${Date.now()}_${partName}`;
            const buffer = currentPart.toBuffer();
            const url = await uploadToS3(s3Key, buffer, 'application/zip');
            parts.push({
              part: partNum,
              url,
              filename: partName,
              size: humanSize(buffer.length),
            });
            partNum++;
            currentPart = new AdmZip();
            currentSize = 0;
          }
          currentPart.addFile(entry.entryName, entry.getData());
          currentSize += entrySize;
        }

        // Save last part
        if (currentSize > 0) {
          const partName = `${path.basename(file, '.zip')}_part${partNum}.zip`;
          const s3Key = `archives/${userId}/${Date.now()}_${partName}`;
          const buffer = currentPart.toBuffer();
          const url = await uploadToS3(s3Key, buffer, 'application/zip');
          parts.push({
            part: partNum,
            url,
            filename: partName,
            size: humanSize(buffer.length),
          });
        }

        cleanTemp(resolved.path, resolved.isTemp);

        return {
          success: true,
          totalParts: parts.length,
          partSizeLimit: humanSize(partSize),
          parts,
        };
      }

      // ── Merge multiple ZIPs ───────────────────────────────────
      case 'merge': {
        const { archives = [] } = options;
        const filesToMerge = file ? [file, ...archives] : archives;

        if (filesToMerge.length < 2) {
          return {
            success: false,
            error:
              'Provide at least 2 archives to merge (file + options.archives)',
          };
        }

        const AdmZip = await getAdmZip();
        const merged = new AdmZip();
        let totalEntries = 0;

        for (const archiveSource of filesToMerge) {
          const resolved = await resolveArchiveInput(archiveSource, userId);
          const zip = new AdmZip(resolved.path);
          for (const entry of zip.getEntries()) {
            if (entry.isDirectory) continue;
            merged.addFile(entry.entryName, entry.getData());
            totalEntries++;
          }
          cleanTemp(resolved.path, resolved.isTemp);
        }

        const outputName = `merged_${Date.now()}.zip`;
        const s3Key = `archives/${userId}/${Date.now()}_${outputName}`;
        const buffer = merged.toBuffer();
        const url = await uploadToS3(s3Key, buffer, 'application/zip');
        await recordAgentFile(
          userId,
          outputName,
          s3Key,
          url,
          'application/zip',
          buffer.length
        );

        return {
          success: true,
          url,
          filename: outputName,
          mergedArchives: filesToMerge.length,
          totalEntries,
          size: humanSize(buffer.length),
        };
      }

      default:
        return {
          success: false,
          error: `Unknown archive_core action: ${action}. Use: create, extract, repack, rename, compress, split, merge`,
        };
    }
  } catch (error) {
    console.error(`[ArchiveService] archiveCore error (${action}):`, error);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════
// 2. ARCHIVE EDIT — add_files, remove_files, replace_file, edit_text, patch_config, fix_paths
// ═══════════════════════════════════════════════════════════════

export async function archiveEdit(params, userId = 'default') {
  const { file, action = 'add_files', options = {} } = params;

  try {
    const resolved = await resolveArchiveInput(file, userId);
    const AdmZip = await getAdmZip();
    const zip = new AdmZip(resolved.path);

    switch (action) {
      // ── Add files to existing ZIP ────────────────────────────
      case 'add_files': {
        const { files = [], basePath = '' } = options;

        if (!files.length) {
          cleanTemp(resolved.path, resolved.isTemp);
          return { success: false, error: 'Provide files array to add' };
        }

        let added = 0;
        for (const f of files) {
          if (typeof f === 'object' && f.name && f.content) {
            const entryPath = basePath ? `${basePath}/${f.name}` : f.name;
            zip.addFile(entryPath, Buffer.from(f.content, 'utf-8'));
            added++;
          } else if (typeof f === 'string') {
            try {
              const fileResolved = await resolveArchiveInput(f, userId);
              const entryPath = basePath
                ? `${basePath}/${path.basename(f)}`
                : path.basename(f);
              zip.addLocalFile(
                fileResolved.path,
                basePath || '',
                path.basename(f)
              );
              cleanTemp(fileResolved.path, fileResolved.isTemp);
              added++;
            } catch {
              /* skip unresolvable */
            }
          }
        }

        const outputName = `updated_${path.basename(file)}`;
        const s3Key = `archives/${userId}/${Date.now()}_${outputName}`;
        const buffer = zip.toBuffer();
        const url = await uploadToS3(s3Key, buffer, 'application/zip');
        await recordAgentFile(
          userId,
          outputName,
          s3Key,
          url,
          'application/zip',
          buffer.length
        );
        cleanTemp(resolved.path, resolved.isTemp);

        return {
          success: true,
          url,
          filename: outputName,
          addedCount: added,
          totalEntries: zip.getEntries().length,
        };
      }

      // ── Remove files from ZIP ────────────────────────────────
      case 'remove_files': {
        const { patterns = [], names = [] } = options;
        const toRemove = [...names];

        // Resolve patterns to entry names
        if (patterns.length) {
          for (const entry of zip.getEntries()) {
            for (const pat of patterns) {
              if (entry.entryName.match(new RegExp(pat, 'i'))) {
                toRemove.push(entry.entryName);
              }
            }
          }
        }

        if (!toRemove.length) {
          cleanTemp(resolved.path, resolved.isTemp);
          return { success: false, error: 'No files matched for removal' };
        }

        const newZip = new AdmZip();
        let removed = 0;
        for (const entry of zip.getEntries()) {
          if (entry.isDirectory) continue;
          if (toRemove.includes(entry.entryName)) {
            removed++;
          } else {
            newZip.addFile(entry.entryName, entry.getData());
          }
        }

        const outputName = `trimmed_${path.basename(file)}`;
        const s3Key = `archives/${userId}/${Date.now()}_${outputName}`;
        const buffer = newZip.toBuffer();
        const url = await uploadToS3(s3Key, buffer, 'application/zip');
        await recordAgentFile(
          userId,
          outputName,
          s3Key,
          url,
          'application/zip',
          buffer.length
        );
        cleanTemp(resolved.path, resolved.isTemp);

        return {
          success: true,
          url,
          filename: outputName,
          removedCount: removed,
          remainingEntries: newZip.getEntries().length,
        };
      }

      // ── Replace file inside ZIP ──────────────────────────────
      case 'replace_file': {
        const { target, content, sourceFile } = options;

        if (!target) {
          cleanTemp(resolved.path, resolved.isTemp);
          return {
            success: false,
            error: 'Provide target path inside ZIP to replace',
          };
        }

        const entry = zip.getEntry(target);
        if (!entry) {
          cleanTemp(resolved.path, resolved.isTemp);
          return {
            success: false,
            error: `File not found in archive: ${target}`,
          };
        }

        let newContent;
        if (content) {
          newContent = Buffer.from(content, 'utf-8');
        } else if (sourceFile) {
          const sourceResolved = await resolveArchiveInput(sourceFile, userId);
          newContent = fs.readFileSync(sourceResolved.path);
          cleanTemp(sourceResolved.path, sourceResolved.isTemp);
        } else {
          cleanTemp(resolved.path, resolved.isTemp);
          return {
            success: false,
            error: 'Provide content or sourceFile for replacement',
          };
        }

        // Rebuild ZIP with replacement
        const newZip = new AdmZip();
        for (const e of zip.getEntries()) {
          if (e.isDirectory) continue;
          if (e.entryName === target) {
            newZip.addFile(e.entryName, newContent);
          } else {
            newZip.addFile(e.entryName, e.getData());
          }
        }

        const outputName = `patched_${path.basename(file)}`;
        const s3Key = `archives/${userId}/${Date.now()}_${outputName}`;
        const buffer = newZip.toBuffer();
        const url = await uploadToS3(s3Key, buffer, 'application/zip');
        await recordAgentFile(
          userId,
          outputName,
          s3Key,
          url,
          'application/zip',
          buffer.length
        );
        cleanTemp(resolved.path, resolved.isTemp);

        return { success: true, url, filename: outputName, replaced: target };
      }

      // ── Edit text file inside ZIP ────────────────────────────
      case 'edit_text': {
        const { target, find, replace, appendContent, prependContent } =
          options;

        if (!target) {
          cleanTemp(resolved.path, resolved.isTemp);
          return {
            success: false,
            error: 'Provide target file path inside ZIP',
          };
        }

        const entry = zip.getEntry(target);
        if (!entry) {
          cleanTemp(resolved.path, resolved.isTemp);
          return { success: false, error: `File not found: ${target}` };
        }

        let text = entry.getData().toString('utf-8');

        if (find !== undefined && replace !== undefined) {
          const regex = new RegExp(find, 'g');
          text = text.replace(regex, replace);
        }
        if (prependContent) text = prependContent + text;
        if (appendContent) text = text + appendContent;

        // Rebuild
        const newZip = new AdmZip();
        for (const e of zip.getEntries()) {
          if (e.isDirectory) continue;
          if (e.entryName === target) {
            newZip.addFile(e.entryName, Buffer.from(text, 'utf-8'));
          } else {
            newZip.addFile(e.entryName, e.getData());
          }
        }

        const outputName = `edited_${path.basename(file)}`;
        const s3Key = `archives/${userId}/${Date.now()}_${outputName}`;
        const buffer = newZip.toBuffer();
        const url = await uploadToS3(s3Key, buffer, 'application/zip');
        await recordAgentFile(
          userId,
          outputName,
          s3Key,
          url,
          'application/zip',
          buffer.length
        );
        cleanTemp(resolved.path, resolved.isTemp);

        return { success: true, url, filename: outputName, editedFile: target };
      }

      // ── Patch configs (.env, .json, .yaml) inside ZIP ────────
      case 'patch_config': {
        const { target, patches = {} } = options;
        // patches: { "KEY": "VALUE" } for .env, or nested object for .json

        if (!target || !Object.keys(patches).length) {
          cleanTemp(resolved.path, resolved.isTemp);
          return {
            success: false,
            error: 'Provide target config file and patches object',
          };
        }

        const entry = zip.getEntry(target);
        if (!entry) {
          cleanTemp(resolved.path, resolved.isTemp);
          return { success: false, error: `Config not found: ${target}` };
        }

        let content = entry.getData().toString('utf-8');
        const ext = path.extname(target).toLowerCase();

        if (ext === '.json') {
          const json = JSON.parse(content);
          for (const [key, value] of Object.entries(patches)) {
            // Support dot notation: "server.port" → json.server.port
            const keys = key.split('.');
            let obj = json;
            for (let i = 0; i < keys.length - 1; i++) {
              if (!obj[keys[i]]) obj[keys[i]] = {};
              obj = obj[keys[i]];
            }
            obj[keys[keys.length - 1]] = value;
          }
          content = JSON.stringify(json, null, 2);
        } else if (ext === '.env' || target.includes('.env')) {
          const lines = content.split('\n');
          for (const [key, value] of Object.entries(patches)) {
            const idx = lines.findIndex((l) => l.startsWith(`${key}=`));
            if (idx >= 0) {
              lines[idx] = `${key}=${value}`;
            } else {
              lines.push(`${key}=${value}`);
            }
          }
          content = lines.join('\n');
        } else if (ext === '.yaml' || ext === '.yml') {
          // Simple YAML patching (top-level keys only)
          const lines = content.split('\n');
          for (const [key, value] of Object.entries(patches)) {
            const idx = lines.findIndex((l) => l.startsWith(`${key}:`));
            if (idx >= 0) {
              lines[idx] =
                `${key}: ${typeof value === 'string' ? `"${value}"` : value}`;
            } else {
              lines.push(
                `${key}: ${typeof value === 'string' ? `"${value}"` : value}`
              );
            }
          }
          content = lines.join('\n');
        }

        // Rebuild
        const newZip = new AdmZip();
        for (const e of zip.getEntries()) {
          if (e.isDirectory) continue;
          if (e.entryName === target) {
            newZip.addFile(e.entryName, Buffer.from(content, 'utf-8'));
          } else {
            newZip.addFile(e.entryName, e.getData());
          }
        }

        const outputName = `configured_${path.basename(file)}`;
        const s3Key = `archives/${userId}/${Date.now()}_${outputName}`;
        const buffer = newZip.toBuffer();
        const url = await uploadToS3(s3Key, buffer, 'application/zip');
        await recordAgentFile(
          userId,
          outputName,
          s3Key,
          url,
          'application/zip',
          buffer.length
        );
        cleanTemp(resolved.path, resolved.isTemp);

        return {
          success: true,
          url,
          filename: outputName,
          patchedFile: target,
          patchedKeys: Object.keys(patches),
        };
      }

      // ── Fix paths (Windows ↔ Linux) ──────────────────────────
      case 'fix_paths': {
        const { targetOS = 'linux' } = options;

        const newZip = new AdmZip();
        let fixed = 0;

        for (const entry of zip.getEntries()) {
          if (entry.isDirectory) continue;
          let entryName = entry.entryName;
          if (targetOS === 'linux' || targetOS === 'unix') {
            const newName = entryName.replace(/\\/g, '/');
            if (newName !== entryName) fixed++;
            entryName = newName;
          } else if (targetOS === 'windows') {
            const newName = entryName.replace(/\//g, '\\');
            if (newName !== entryName) fixed++;
            entryName = newName;
          }
          newZip.addFile(entryName, entry.getData());
        }

        const outputName = `pathfixed_${path.basename(file)}`;
        const s3Key = `archives/${userId}/${Date.now()}_${outputName}`;
        const buffer = newZip.toBuffer();
        const url = await uploadToS3(s3Key, buffer, 'application/zip');
        cleanTemp(resolved.path, resolved.isTemp);

        return {
          success: true,
          url,
          filename: outputName,
          fixedPaths: fixed,
          targetOS,
        };
      }

      default:
        cleanTemp(resolved.path, resolved.isTemp);
        return {
          success: false,
          error: `Unknown archive_edit action: ${action}. Use: add_files, remove_files, replace_file, edit_text, patch_config, fix_paths`,
        };
    }
  } catch (error) {
    console.error(`[ArchiveService] archiveEdit error (${action}):`, error);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════
// 3. ARCHIVE STRUCTURE — inspect, detect_missing, validate_layout, normalize, flatten, nest, naming
// ═══════════════════════════════════════════════════════════════

export async function archiveStructure(params, userId = 'default') {
  const { file, action = 'inspect', options = {} } = params;

  try {
    const resolved = await resolveArchiveInput(file, userId);
    const AdmZip = await getAdmZip();
    const zip = new AdmZip(resolved.path);
    const entries = zip.getEntries();

    switch (action) {
      // ── Inspect ZIP structure ────────────────────────────────
      case 'inspect': {
        const { showContent = false, maxPreview = 500 } = options;

        const tree = {};
        const fileList = [];
        let totalSize = 0;
        let totalCompressed = 0;

        for (const entry of entries) {
          const parts = entry.entryName.split('/');
          let current = tree;
          for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (!part) continue;
            if (i === parts.length - 1 && !entry.isDirectory) {
              current[part] = {
                size: humanSize(entry.header.size),
                compressed: humanSize(entry.header.compressedSize),
                ratio:
                  entry.header.size > 0
                    ? `${((1 - entry.header.compressedSize / entry.header.size) * 100).toFixed(1)}%`
                    : '0%',
              };
              if (showContent && entry.header.size < 50000) {
                try {
                  const text = entry.getData().toString('utf-8');
                  current[part].preview = text.substring(0, maxPreview);
                } catch {
                  /* binary file */
                }
              }
            } else {
              if (!current[part]) current[part] = {};
              current = current[part];
            }
          }

          if (!entry.isDirectory) {
            totalSize += entry.header.size;
            totalCompressed += entry.header.compressedSize;
            fileList.push({
              path: entry.entryName,
              size: humanSize(entry.header.size),
              compressed: humanSize(entry.header.compressedSize),
            });
          }
        }

        cleanTemp(resolved.path, resolved.isTemp);

        return {
          success: true,
          totalFiles: fileList.length,
          totalDirectories: entries.filter((e) => e.isDirectory).length,
          totalSize: humanSize(totalSize),
          totalCompressed: humanSize(totalCompressed),
          compressionRatio:
            totalSize > 0
              ? `${((1 - totalCompressed / totalSize) * 100).toFixed(1)}%`
              : '0%',
          tree,
          files: fileList.slice(0, 100), // Cap listing at 100
        };
      }

      // ── Detect missing files ─────────────────────────────────
      case 'detect_missing': {
        const { expected = [] } = options;

        if (!expected.length) {
          cleanTemp(resolved.path, resolved.isTemp);
          return {
            success: false,
            error: 'Provide expected array of file paths',
          };
        }

        const entryNames = entries.map((e) => e.entryName);
        const missing = [];
        const found = [];

        for (const exp of expected) {
          const exists = entryNames.some(
            (name) =>
              name === exp || name.endsWith(`/${exp}`) || name.includes(exp)
          );
          if (exists) found.push(exp);
          else missing.push(exp);
        }

        cleanTemp(resolved.path, resolved.isTemp);

        return {
          success: true,
          total: expected.length,
          found: found.length,
          missing: missing.length,
          missingFiles: missing,
          foundFiles: found,
        };
      }

      // ── Validate expected folder layout ──────────────────────
      case 'validate_layout': {
        const { rules = {} } = options;
        // rules: { requiredDirs: [], requiredFiles: [], maxDepth: N, maxFiles: N }

        const entryNames = entries.map((e) => e.entryName);
        const issues = [];

        if (rules.requiredDirs) {
          for (const dir of rules.requiredDirs) {
            const exists = entryNames.some((n) =>
              n.startsWith(dir.endsWith('/') ? dir : `${dir}/`)
            );
            if (!exists) issues.push(`Missing required directory: ${dir}`);
          }
        }

        if (rules.requiredFiles) {
          for (const f of rules.requiredFiles) {
            const exists = entryNames.some(
              (n) => n === f || n.endsWith(`/${f}`)
            );
            if (!exists) issues.push(`Missing required file: ${f}`);
          }
        }

        if (rules.maxDepth) {
          const maxFound = Math.max(
            ...entryNames.map((n) => n.split('/').length - 1)
          );
          if (maxFound > rules.maxDepth) {
            issues.push(
              `Directory depth ${maxFound} exceeds max ${rules.maxDepth}`
            );
          }
        }

        if (rules.maxFiles) {
          const fileCount = entries.filter((e) => !e.isDirectory).length;
          if (fileCount > rules.maxFiles) {
            issues.push(
              `File count ${fileCount} exceeds max ${rules.maxFiles}`
            );
          }
        }

        cleanTemp(resolved.path, resolved.isTemp);

        return {
          success: true,
          valid: issues.length === 0,
          issueCount: issues.length,
          issues,
        };
      }

      // ── Normalize directory depth ────────────────────────────
      case 'normalize': {
        const { stripPrefix, maxDepth = 10 } = options;

        const newZip = new AdmZip();
        let normalized = 0;

        for (const entry of entries) {
          if (entry.isDirectory) continue;
          let newName = entry.entryName;

          // Strip common prefix (e.g., "project-v1.0/src/" → "src/")
          if (stripPrefix) {
            if (newName.startsWith(stripPrefix)) {
              newName = newName.substring(stripPrefix.length);
              normalized++;
            }
          } else {
            // Auto-detect single root dir and strip it
            const rootDirs = [
              ...new Set(entries.map((e) => e.entryName.split('/')[0])),
            ];
            if (
              rootDirs.length === 1 &&
              entries.some(
                (e) => e.isDirectory && e.entryName === `${rootDirs[0]}/`
              )
            ) {
              const prefix = `${rootDirs[0]}/`;
              if (newName.startsWith(prefix)) {
                newName = newName.substring(prefix.length);
                normalized++;
              }
            }
          }

          if (newName) newZip.addFile(newName, entry.getData());
        }

        const outputName = `normalized_${path.basename(file)}`;
        const s3Key = `archives/${userId}/${Date.now()}_${outputName}`;
        const buffer = newZip.toBuffer();
        const url = await uploadToS3(s3Key, buffer, 'application/zip');
        cleanTemp(resolved.path, resolved.isTemp);

        return {
          success: true,
          url,
          filename: outputName,
          normalizedPaths: normalized,
        };
      }

      // ── Flatten folders ──────────────────────────────────────
      case 'flatten': {
        const newZip = new AdmZip();
        const seen = new Set();

        for (const entry of entries) {
          if (entry.isDirectory) continue;
          let flatName = path.basename(entry.entryName);
          // Handle duplicates
          if (seen.has(flatName)) {
            const ext = path.extname(flatName);
            const base = path.basename(flatName, ext);
            let i = 2;
            while (seen.has(`${base}_${i}${ext}`)) i++;
            flatName = `${base}_${i}${ext}`;
          }
          seen.add(flatName);
          newZip.addFile(flatName, entry.getData());
        }

        const outputName = `flat_${path.basename(file)}`;
        const s3Key = `archives/${userId}/${Date.now()}_${outputName}`;
        const buffer = newZip.toBuffer();
        const url = await uploadToS3(s3Key, buffer, 'application/zip');
        cleanTemp(resolved.path, resolved.isTemp);

        return {
          success: true,
          url,
          filename: outputName,
          flattenedFiles: seen.size,
        };
      }

      // ── Nest into folder ─────────────────────────────────────
      case 'nest': {
        const { folder = 'project' } = options;

        const newZip = new AdmZip();
        for (const entry of entries) {
          if (entry.isDirectory) continue;
          newZip.addFile(`${folder}/${entry.entryName}`, entry.getData());
        }

        const outputName = `nested_${path.basename(file)}`;
        const s3Key = `archives/${userId}/${Date.now()}_${outputName}`;
        const buffer = newZip.toBuffer();
        const url = await uploadToS3(s3Key, buffer, 'application/zip');
        cleanTemp(resolved.path, resolved.isTemp);

        return { success: true, url, filename: outputName, rootFolder: folder };
      }

      // ── Enforce naming conventions ───────────────────────────
      case 'naming': {
        const { convention = 'kebab-case' } = options;

        const transformName = (name) => {
          const ext = path.extname(name);
          const base = path.basename(name, ext);
          const dir = path.dirname(name);
          let transformed;

          switch (convention) {
            case 'kebab-case':
              transformed = base
                .replace(/([a-z])([A-Z])/g, '$1-$2')
                .replace(/[_\s]+/g, '-')
                .toLowerCase();
              break;
            case 'snake_case':
              transformed = base
                .replace(/([a-z])([A-Z])/g, '$1_$2')
                .replace(/[-\s]+/g, '_')
                .toLowerCase();
              break;
            case 'camelCase':
              transformed = base.replace(/[-_\s]+(.)/g, (_, c) =>
                c.toUpperCase()
              );
              break;
            case 'lowercase':
              transformed = base.toLowerCase();
              break;
            default:
              transformed = base;
          }

          return dir === '.'
            ? `${transformed}${ext}`
            : `${dir}/${transformed}${ext}`;
        };

        const newZip = new AdmZip();
        let renamed = 0;
        for (const entry of entries) {
          if (entry.isDirectory) continue;
          const newName = transformName(entry.entryName);
          if (newName !== entry.entryName) renamed++;
          newZip.addFile(newName, entry.getData());
        }

        const outputName = `named_${path.basename(file)}`;
        const s3Key = `archives/${userId}/${Date.now()}_${outputName}`;
        const buffer = newZip.toBuffer();
        const url = await uploadToS3(s3Key, buffer, 'application/zip');
        cleanTemp(resolved.path, resolved.isTemp);

        return {
          success: true,
          url,
          filename: outputName,
          renamedFiles: renamed,
          convention,
        };
      }

      default:
        cleanTemp(resolved.path, resolved.isTemp);
        return {
          success: false,
          error: `Unknown archive_structure action: ${action}. Use: inspect, detect_missing, validate_layout, normalize, flatten, nest, naming`,
        };
    }
  } catch (error) {
    console.error(
      `[ArchiveService] archiveStructure error (${action}):`,
      error
    );
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════
// 4. ARCHIVE SECURITY — zip_bomb_check, size_limit, symlink_check, password_detect, encrypt, scan
// ═══════════════════════════════════════════════════════════════

export async function archiveSecurity(params, userId = 'default') {
  const { file, action = 'zip_bomb_check', options = {} } = params;

  try {
    const resolved = await resolveArchiveInput(file, userId);
    const AdmZip = await getAdmZip();
    const zip = new AdmZip(resolved.path);
    const entries = zip.getEntries();

    switch (action) {
      // ── Zip bomb detection ───────────────────────────────────
      case 'zip_bomb_check': {
        const archiveSize = fs.statSync(resolved.path).size;
        const totalUncompressed = entries.reduce(
          (sum, e) => sum + e.header.size,
          0
        );
        const entryCount = entries.length;
        const ratio = archiveSize > 0 ? totalUncompressed / archiveSize : 0;

        const isBomb =
          ratio > ZIP_BOMB_RATIO || entryCount > ZIP_BOMB_MAX_FILES;
        const warnings = [];

        if (ratio > ZIP_BOMB_RATIO) {
          warnings.push(
            `Compression ratio ${ratio.toFixed(1)}x exceeds safe threshold (${ZIP_BOMB_RATIO}x)`
          );
        }
        if (entryCount > ZIP_BOMB_MAX_FILES) {
          warnings.push(
            `Entry count ${entryCount} exceeds safe threshold (${ZIP_BOMB_MAX_FILES})`
          );
        }
        if (totalUncompressed > MAX_EXTRACT_SIZE) {
          warnings.push(
            `Uncompressed size ${humanSize(totalUncompressed)} exceeds limit (${humanSize(MAX_EXTRACT_SIZE)})`
          );
        }

        // Check for nested ZIPs (zip bomb technique)
        const nestedZips = entries.filter((e) =>
          e.entryName.match(/\.zip$/i)
        ).length;
        if (nestedZips > 10) {
          warnings.push(
            `Contains ${nestedZips} nested ZIP files (potential recursive bomb)`
          );
        }

        cleanTemp(resolved.path, resolved.isTemp);

        return {
          success: true,
          safe: !isBomb,
          archiveSize: humanSize(archiveSize),
          uncompressedSize: humanSize(totalUncompressed),
          compressionRatio: `${ratio.toFixed(1)}x`,
          entryCount,
          nestedZips,
          warnings,
        };
      }

      // ── Size limit check ─────────────────────────────────────
      case 'size_limit': {
        const { maxSize = MAX_EXTRACT_SIZE, maxFiles = ZIP_BOMB_MAX_FILES } =
          options;

        const totalUncompressed = entries.reduce(
          (sum, e) => sum + e.header.size,
          0
        );
        const fileCount = entries.filter((e) => !e.isDirectory).length;
        const issues = [];

        if (totalUncompressed > maxSize) {
          issues.push(
            `Total size ${humanSize(totalUncompressed)} exceeds limit ${humanSize(maxSize)}`
          );
        }
        if (fileCount > maxFiles) {
          issues.push(`File count ${fileCount} exceeds limit ${maxFiles}`);
        }

        cleanTemp(resolved.path, resolved.isTemp);

        return {
          success: true,
          withinLimits: issues.length === 0,
          totalSize: humanSize(totalUncompressed),
          fileCount,
          limits: { maxSize: humanSize(maxSize), maxFiles },
          issues,
        };
      }

      // ── Symlink / Path traversal check ───────────────────────
      case 'symlink_check': {
        const issues = [];

        for (const entry of entries) {
          // Check for path traversal
          if (entry.entryName.includes('..')) {
            issues.push({
              type: 'path_traversal',
              path: entry.entryName,
              severity: 'critical',
            });
          }
          // Check for absolute paths
          if (
            entry.entryName.startsWith('/') ||
            entry.entryName.match(/^[A-Z]:\\/i)
          ) {
            issues.push({
              type: 'absolute_path',
              path: entry.entryName,
              severity: 'high',
            });
          }
          // Check for symlink indicators
          if (entry.header.attr && (entry.header.attr & 0xa000) === 0xa000) {
            issues.push({
              type: 'symlink',
              path: entry.entryName,
              severity: 'high',
            });
          }
          // Check for suspicious names
          if (entry.entryName.match(/\.(exe|bat|cmd|ps1|vbs|scr|com)$/i)) {
            issues.push({
              type: 'executable',
              path: entry.entryName,
              severity: 'medium',
            });
          }
        }

        cleanTemp(resolved.path, resolved.isTemp);

        return {
          success: true,
          safe:
            issues.filter(
              (i) => i.severity === 'critical' || i.severity === 'high'
            ).length === 0,
          totalIssues: issues.length,
          critical: issues.filter((i) => i.severity === 'critical').length,
          high: issues.filter((i) => i.severity === 'high').length,
          medium: issues.filter((i) => i.severity === 'medium').length,
          issues,
        };
      }

      // ── Password-protected ZIP detection ─────────────────────
      case 'password_detect': {
        const encrypted = entries.filter((e) => e.header.flags & 0x1);
        const isProtected = encrypted.length > 0;

        cleanTemp(resolved.path, resolved.isTemp);

        return {
          success: true,
          passwordProtected: isProtected,
          encryptedFiles: encrypted.length,
          totalFiles: entries.filter((e) => !e.isDirectory).length,
          encryptedEntries: encrypted.slice(0, 20).map((e) => e.entryName),
        };
      }

      // ── Encrypt ZIP with password ────────────────────────────
      case 'encrypt': {
        const { password } = options;

        if (!password) {
          cleanTemp(resolved.path, resolved.isTemp);
          return { success: false, error: 'Provide password for encryption' };
        }

        // adm-zip doesn't support password creation natively
        // Use system zip command if available
        try {
          const { exec } = await import('child_process');
          const { promisify } = await import('util');
          const execAsync = promisify(exec);

          const outputPath = path.join(
            os.tmpdir(),
            `encrypted_${Date.now()}.zip`
          );
          const extractDir = path.join(
            os.tmpdir(),
            `enc_extract_${Date.now()}`
          );
          fs.mkdirSync(extractDir, { recursive: true });
          zip.extractAllTo(extractDir, true);

          await execAsync(
            `cd "${extractDir}" && zip -r -P "${password}" "${outputPath}" .`
          );

          const buffer = fs.readFileSync(outputPath);
          const outputName = `encrypted_${path.basename(file)}`;
          const s3Key = `archives/${userId}/${Date.now()}_${outputName}`;
          const url = await uploadToS3(s3Key, buffer, 'application/zip');
          await recordAgentFile(
            userId,
            outputName,
            s3Key,
            url,
            'application/zip',
            buffer.length
          );

          cleanTemp(resolved.path, resolved.isTemp);
          cleanTemp(outputPath, true);
          cleanTempDir(extractDir);

          return { success: true, url, filename: outputName, encrypted: true };
        } catch (e) {
          cleanTemp(resolved.path, resolved.isTemp);
          return {
            success: false,
            error: `Encryption failed (system zip required): ${e.message}`,
          };
        }
      }

      // ── Security scan (comprehensive) ────────────────────────
      case 'scan': {
        const results = {
          pathTraversal: [],
          executables: [],
          suspiciousFiles: [],
          largeFiles: [],
          hiddenFiles: [],
          secretsFound: [],
        };

        for (const entry of entries) {
          if (entry.isDirectory) continue;
          const name = entry.entryName;

          if (name.includes('..')) results.pathTraversal.push(name);
          if (name.match(/\.(exe|bat|cmd|ps1|vbs|scr|com|dll|so|dylib)$/i))
            results.executables.push(name);
          if (name.match(/\.(php|asp|aspx|jsp|cgi)$/i))
            results.suspiciousFiles.push(name);
          if (entry.header.size > 100 * 1024 * 1024)
            results.largeFiles.push({
              name,
              size: humanSize(entry.header.size),
            });
          if (path.basename(name).startsWith('.'))
            results.hiddenFiles.push(name);

          // Quick secret scan on small text files
          if (
            entry.header.size < 100000 &&
            name.match(
              /\.(env|json|yaml|yml|toml|cfg|conf|ini|properties|txt|js|ts|py)$/i
            )
          ) {
            try {
              const text = entry.getData().toString('utf-8');
              for (const { pattern, label } of SECRET_PATTERNS) {
                if (pattern.test(text)) {
                  results.secretsFound.push({ file: name, type: label });
                  pattern.lastIndex = 0; // Reset regex
                }
              }
            } catch {
              /* binary */
            }
          }
        }

        const totalIssues = Object.values(results).reduce(
          (sum, arr) => sum + arr.length,
          0
        );
        cleanTemp(resolved.path, resolved.isTemp);

        return {
          success: true,
          safe: totalIssues === 0,
          totalIssues,
          ...results,
        };
      }

      default:
        cleanTemp(resolved.path, resolved.isTemp);
        return {
          success: false,
          error: `Unknown archive_security action: ${action}. Use: zip_bomb_check, size_limit, symlink_check, password_detect, encrypt, scan`,
        };
    }
  } catch (error) {
    console.error(`[ArchiveService] archiveSecurity error (${action}):`, error);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════
// 5. ARCHIVE BULK — bulk_extract, bulk_rezip, auto_rename, deduplicate, chunk, progress
// ═══════════════════════════════════════════════════════════════

export async function archiveBulk(params, userId = 'default') {
  const { file, action = 'bulk_extract', options = {} } = params;

  try {
    switch (action) {
      // ── Bulk extract multiple archives ───────────────────────
      case 'bulk_extract': {
        const { archives = [] } = options;
        const archiveList = file ? [file, ...archives] : archives;

        if (!archiveList.length) {
          return { success: false, error: 'Provide archives array to extract' };
        }

        const AdmZip = await getAdmZip();
        const results = [];

        for (const archiveSource of archiveList) {
          try {
            const resolved = await resolveArchiveInput(archiveSource, userId);
            const zip = new AdmZip(resolved.path);
            const entries = zip.getEntries().filter((e) => !e.isDirectory);
            const fileCount = entries.length;
            const totalSize = entries.reduce(
              (sum, e) => sum + e.header.size,
              0
            );

            // Upload each file to S3
            const uploaded = [];
            for (const entry of entries.slice(0, 50)) {
              // Cap per archive
              const s3Key = `archives/${userId}/bulk/${Date.now()}_${path.basename(entry.entryName)}`;
              const url = await uploadToS3(
                s3Key,
                entry.getData(),
                getMimeFromExt(entry.entryName)
              );
              uploaded.push({ name: entry.entryName, url });
            }

            results.push({
              archive: archiveSource,
              success: true,
              fileCount,
              totalSize: humanSize(totalSize),
              files: uploaded,
            });

            cleanTemp(resolved.path, resolved.isTemp);
          } catch (e) {
            results.push({
              archive: archiveSource,
              success: false,
              error: e.message,
            });
          }
        }

        return {
          success: true,
          totalArchives: archiveList.length,
          successful: results.filter((r) => r.success).length,
          failed: results.filter((r) => !r.success).length,
          results,
        };
      }

      // ── Bulk re-zip with rules ───────────────────────────────
      case 'bulk_rezip': {
        const {
          archives = [],
          excludePatterns = [],
          includePatterns = [],
          compressionLevel = 6,
        } = options;
        const archiveList = file ? [file, ...archives] : archives;

        const AdmZip = await getAdmZip();
        const results = [];

        for (const archiveSource of archiveList) {
          try {
            const resolved = await resolveArchiveInput(archiveSource, userId);
            const zip = new AdmZip(resolved.path);
            const newZip = new AdmZip();
            let included = 0,
              excluded = 0;

            for (const entry of zip.getEntries()) {
              if (entry.isDirectory) continue;

              // Check exclude patterns
              const shouldExclude = excludePatterns.some((p) =>
                entry.entryName.match(new RegExp(p, 'i'))
              );
              if (shouldExclude) {
                excluded++;
                continue;
              }

              // Check include patterns
              if (includePatterns.length) {
                const shouldInclude = includePatterns.some((p) =>
                  entry.entryName.match(new RegExp(p, 'i'))
                );
                if (!shouldInclude) {
                  excluded++;
                  continue;
                }
              }

              newZip.addFile(entry.entryName, entry.getData());
              included++;
            }

            const outputName = `rezipped_${path.basename(archiveSource)}`;
            const s3Key = `archives/${userId}/${Date.now()}_${outputName}`;
            const buffer = newZip.toBuffer();
            const url = await uploadToS3(s3Key, buffer, 'application/zip');

            results.push({
              archive: archiveSource,
              success: true,
              url,
              filename: outputName,
              included,
              excluded,
            });

            cleanTemp(resolved.path, resolved.isTemp);
          } catch (e) {
            results.push({
              archive: archiveSource,
              success: false,
              error: e.message,
            });
          }
        }

        return { success: true, totalArchives: archiveList.length, results };
      }

      // ── Auto-rename extracted files ──────────────────────────
      case 'auto_rename': {
        const { pattern = '{name}_{index}', startIndex = 1 } = options;

        const resolved = await resolveArchiveInput(file, userId);
        const AdmZip = await getAdmZip();
        const zip = new AdmZip(resolved.path);
        const newZip = new AdmZip();

        let index = startIndex;
        for (const entry of zip.getEntries()) {
          if (entry.isDirectory) continue;
          const ext = path.extname(entry.entryName);
          const base = path.basename(entry.entryName, ext);
          const dir = path.dirname(entry.entryName);

          const newName = pattern
            .replace('{name}', base)
            .replace('{index}', String(index).padStart(3, '0'))
            .replace('{ext}', ext.replace('.', ''))
            .replace('{date}', new Date().toISOString().split('T')[0]);

          const newPath =
            dir === '.' ? `${newName}${ext}` : `${dir}/${newName}${ext}`;
          newZip.addFile(newPath, entry.getData());
          index++;
        }

        const outputName = `renamed_${path.basename(file)}`;
        const s3Key = `archives/${userId}/${Date.now()}_${outputName}`;
        const buffer = newZip.toBuffer();
        const url = await uploadToS3(s3Key, buffer, 'application/zip');
        cleanTemp(resolved.path, resolved.isTemp);

        return {
          success: true,
          url,
          filename: outputName,
          renamedFiles: index - startIndex,
        };
      }

      // ── Deduplicate files ────────────────────────────────────
      case 'deduplicate': {
        const { strategy = 'hash' } = options; // hash | name | size

        const resolved = await resolveArchiveInput(file, userId);
        const AdmZip = await getAdmZip();
        const zip = new AdmZip(resolved.path);
        const newZip = new AdmZip();

        const seen = new Map();
        let duplicates = 0;

        for (const entry of zip.getEntries()) {
          if (entry.isDirectory) continue;

          let key;
          if (strategy === 'hash') {
            const { createHash } = await import('crypto');
            key = createHash('md5').update(entry.getData()).digest('hex');
          } else if (strategy === 'name') {
            key = path.basename(entry.entryName);
          } else {
            key = `${path.basename(entry.entryName)}_${entry.header.size}`;
          }

          if (seen.has(key)) {
            duplicates++;
          } else {
            seen.set(key, entry.entryName);
            newZip.addFile(entry.entryName, entry.getData());
          }
        }

        const outputName = `deduped_${path.basename(file)}`;
        const s3Key = `archives/${userId}/${Date.now()}_${outputName}`;
        const buffer = newZip.toBuffer();
        const url = await uploadToS3(s3Key, buffer, 'application/zip');
        cleanTemp(resolved.path, resolved.isTemp);

        return {
          success: true,
          url,
          filename: outputName,
          duplicatesRemoved: duplicates,
          uniqueFiles: seen.size,
          strategy,
        };
      }

      // ── Chunk large file into archive parts ──────────────────
      case 'chunk': {
        const { chunkSize = 25 * 1024 * 1024 } = options; // Default 25MB

        const resolved = await resolveArchiveInput(file, userId);
        const buffer = fs.readFileSync(resolved.path);
        const totalChunks = Math.ceil(buffer.length / chunkSize);
        const chunks = [];

        for (let i = 0; i < totalChunks; i++) {
          const start = i * chunkSize;
          const end = Math.min(start + chunkSize, buffer.length);
          const chunkBuffer = buffer.slice(start, end);

          const chunkName = `${path.basename(file, path.extname(file))}_chunk${i + 1}of${totalChunks}${path.extname(file)}`;
          const s3Key = `archives/${userId}/chunks/${Date.now()}_${chunkName}`;
          const url = await uploadToS3(
            s3Key,
            chunkBuffer,
            'application/octet-stream'
          );
          chunks.push({
            chunk: i + 1,
            url,
            filename: chunkName,
            size: humanSize(chunkBuffer.length),
          });
        }

        cleanTemp(resolved.path, resolved.isTemp);

        return {
          success: true,
          totalChunks,
          chunkSize: humanSize(chunkSize),
          originalSize: humanSize(buffer.length),
          chunks,
        };
      }

      default:
        return {
          success: false,
          error: `Unknown archive_bulk action: ${action}. Use: bulk_extract, bulk_rezip, auto_rename, deduplicate, chunk`,
        };
    }
  } catch (error) {
    console.error(`[ArchiveService] archiveBulk error (${action}):`, error);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════
// 6. ARCHIVE CONVERT — zip_to_tar, tar_to_zip, zip_to_targz, targz_to_zip, zip_to_7z, rar_extract, fix_line_endings
// ═══════════════════════════════════════════════════════════════

export async function archiveConvert(params, userId = 'default') {
  const { file, action = 'zip_to_tar', options = {} } = params;

  try {
    const resolved = await resolveArchiveInput(file, userId);

    switch (action) {
      // ── ZIP → TAR ────────────────────────────────────────────
      case 'zip_to_tar': {
        const AdmZip = await getAdmZip();
        const archiver = await getArchiver();
        const zip = new AdmZip(resolved.path);

        const tempPath = path.join(os.tmpdir(), `convert_${Date.now()}.tar`);
        const output = createWriteStream(tempPath);
        const archive = archiver('tar');
        archive.pipe(output);

        for (const entry of zip.getEntries()) {
          if (entry.isDirectory) continue;
          archive.append(entry.getData(), { name: entry.entryName });
        }

        await archive.finalize();
        await new Promise((resolve) => output.on('close', resolve));

        const buffer = fs.readFileSync(tempPath);
        const outputName = path.basename(file, '.zip') + '.tar';
        const s3Key = `archives/${userId}/${Date.now()}_${outputName}`;
        const url = await uploadToS3(s3Key, buffer, 'application/x-tar');
        await recordAgentFile(
          userId,
          outputName,
          s3Key,
          url,
          'application/x-tar',
          buffer.length
        );

        cleanTemp(resolved.path, resolved.isTemp);
        cleanTemp(tempPath, true);

        return {
          success: true,
          url,
          filename: outputName,
          size: humanSize(buffer.length),
          convertedFrom: 'zip',
          convertedTo: 'tar',
        };
      }

      // ── TAR → ZIP ────────────────────────────────────────────
      case 'tar_to_zip': {
        const tar = await getTar();
        const AdmZip = await getAdmZip();

        const extractDir = path.join(os.tmpdir(), `tarextract_${Date.now()}`);
        fs.mkdirSync(extractDir, { recursive: true });

        if (tar) {
          await tar.x({ file: resolved.path, cwd: extractDir });
        } else {
          // Fallback: use system tar
          const { exec } = await import('child_process');
          const { promisify } = await import('util');
          const execAsync = promisify(exec);
          await execAsync(`tar -xf "${resolved.path}" -C "${extractDir}"`);
        }

        const newZip = new AdmZip();
        function addDirToZip(dirPath, zipPath = '') {
          for (const item of fs.readdirSync(dirPath)) {
            const fullPath = path.join(dirPath, item);
            const entryPath = zipPath ? `${zipPath}/${item}` : item;
            if (fs.statSync(fullPath).isDirectory()) {
              addDirToZip(fullPath, entryPath);
            } else {
              newZip.addLocalFile(fullPath, zipPath || '', item);
            }
          }
        }
        addDirToZip(extractDir);

        const outputName =
          path.basename(file).replace(/\.(tar|tar\.gz|tgz)$/i, '') + '.zip';
        const s3Key = `archives/${userId}/${Date.now()}_${outputName}`;
        const buffer = newZip.toBuffer();
        const url = await uploadToS3(s3Key, buffer, 'application/zip');
        await recordAgentFile(
          userId,
          outputName,
          s3Key,
          url,
          'application/zip',
          buffer.length
        );

        cleanTemp(resolved.path, resolved.isTemp);
        cleanTempDir(extractDir);

        return {
          success: true,
          url,
          filename: outputName,
          size: humanSize(buffer.length),
          convertedFrom: detectArchiveType(file),
          convertedTo: 'zip',
        };
      }

      // ── ZIP → TAR.GZ ─────────────────────────────────────────
      case 'zip_to_targz': {
        const AdmZip = await getAdmZip();
        const archiver = await getArchiver();
        const zip = new AdmZip(resolved.path);

        const tempPath = path.join(os.tmpdir(), `convert_${Date.now()}.tar.gz`);
        const output = createWriteStream(tempPath);
        const archive = archiver('tar', {
          gzip: true,
          gzipOptions: { level: options.level || 6 },
        });
        archive.pipe(output);

        for (const entry of zip.getEntries()) {
          if (entry.isDirectory) continue;
          archive.append(entry.getData(), { name: entry.entryName });
        }

        await archive.finalize();
        await new Promise((resolve) => output.on('close', resolve));

        const buffer = fs.readFileSync(tempPath);
        const outputName = path.basename(file, '.zip') + '.tar.gz';
        const s3Key = `archives/${userId}/${Date.now()}_${outputName}`;
        const url = await uploadToS3(s3Key, buffer, 'application/gzip');
        await recordAgentFile(
          userId,
          outputName,
          s3Key,
          url,
          'application/gzip',
          buffer.length
        );

        cleanTemp(resolved.path, resolved.isTemp);
        cleanTemp(tempPath, true);

        return {
          success: true,
          url,
          filename: outputName,
          size: humanSize(buffer.length),
          convertedFrom: 'zip',
          convertedTo: 'tar.gz',
        };
      }

      // ── TAR.GZ → ZIP ─────────────────────────────────────────
      case 'targz_to_zip': {
        return archiveConvert({ file, action: 'tar_to_zip', options }, userId);
      }

      // ── ZIP → 7Z ──────────────────────────────────────────────
      case 'zip_to_7z': {
        try {
          const { exec } = await import('child_process');
          const { promisify } = await import('util');
          const execAsync = promisify(exec);

          const outputPath = path.join(os.tmpdir(), `convert_${Date.now()}.7z`);
          const extractDir = path.join(os.tmpdir(), `7z_extract_${Date.now()}`);
          fs.mkdirSync(extractDir, { recursive: true });

          const AdmZip = await getAdmZip();
          const zip = new AdmZip(resolved.path);
          zip.extractAllTo(extractDir, true);

          await execAsync(`7z a "${outputPath}" "${extractDir}/"*`);

          if (!fs.existsSync(outputPath)) {
            throw new Error('7z command failed — ensure 7z is installed');
          }

          const buffer = fs.readFileSync(outputPath);
          const outputName = path.basename(file, '.zip') + '.7z';
          const s3Key = `archives/${userId}/${Date.now()}_${outputName}`;
          const url = await uploadToS3(
            s3Key,
            buffer,
            'application/x-7z-compressed'
          );
          await recordAgentFile(
            userId,
            outputName,
            s3Key,
            url,
            'application/x-7z-compressed',
            buffer.length
          );

          cleanTemp(resolved.path, resolved.isTemp);
          cleanTemp(outputPath, true);
          cleanTempDir(extractDir);

          return {
            success: true,
            url,
            filename: outputName,
            size: humanSize(buffer.length),
            convertedFrom: 'zip',
            convertedTo: '7z',
          };
        } catch (e) {
          cleanTemp(resolved.path, resolved.isTemp);
          return {
            success: false,
            error: `7z conversion requires system 7z command: ${e.message}`,
          };
        }
      }

      // ── RAR extract (read-only) ───────────────────────────────
      case 'rar_extract': {
        try {
          const { exec } = await import('child_process');
          const { promisify } = await import('util');
          const execAsync = promisify(exec);

          const extractDir = path.join(
            os.tmpdir(),
            `rar_extract_${Date.now()}`
          );
          fs.mkdirSync(extractDir, { recursive: true });

          await execAsync(`unrar x "${resolved.path}" "${extractDir}/"`);

          const AdmZip = await getAdmZip();
          const newZip = new AdmZip();
          function addDir(dir, prefix = '') {
            for (const item of fs.readdirSync(dir)) {
              const full = path.join(dir, item);
              const rel = prefix ? `${prefix}/${item}` : item;
              if (fs.statSync(full).isDirectory()) addDir(full, rel);
              else newZip.addLocalFile(full, prefix || '', item);
            }
          }
          addDir(extractDir);

          const outputName = path.basename(file, '.rar') + '.zip';
          const s3Key = `archives/${userId}/${Date.now()}_${outputName}`;
          const buffer = newZip.toBuffer();
          const url = await uploadToS3(s3Key, buffer, 'application/zip');
          await recordAgentFile(
            userId,
            outputName,
            s3Key,
            url,
            'application/zip',
            buffer.length
          );

          cleanTemp(resolved.path, resolved.isTemp);
          cleanTempDir(extractDir);

          return {
            success: true,
            url,
            filename: outputName,
            size: humanSize(buffer.length),
            convertedFrom: 'rar',
            convertedTo: 'zip',
          };
        } catch (e) {
          cleanTemp(resolved.path, resolved.isTemp);
          return {
            success: false,
            error: `RAR extraction requires system unrar: ${e.message}`,
          };
        }
      }

      // ── Fix line endings ──────────────────────────────────────
      case 'fix_line_endings': {
        const {
          target = 'lf',
          fileTypes = [
            '.txt',
            '.js',
            '.ts',
            '.jsx',
            '.tsx',
            '.json',
            '.md',
            '.css',
            '.html',
            '.xml',
            '.yaml',
            '.yml',
            '.env',
            '.sh',
            '.py',
            '.rb',
            '.php',
            '.java',
            '.cs',
            '.go',
            '.rs',
          ],
        } = options;

        const AdmZip = await getAdmZip();
        const zip = new AdmZip(resolved.path);
        const newZip = new AdmZip();
        let fixed = 0;

        for (const entry of zip.getEntries()) {
          if (entry.isDirectory) continue;
          const ext = path.extname(entry.entryName).toLowerCase();
          if (fileTypes.includes(ext)) {
            try {
              let text = entry.getData().toString('utf-8');
              if (target === 'lf') {
                const before = text;
                text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
                if (text !== before) fixed++;
              } else if (target === 'crlf') {
                const before = text;
                text = text
                  .replace(/\r\n/g, '\n')
                  .replace(/\r/g, '\n')
                  .replace(/\n/g, '\r\n');
                if (text !== before) fixed++;
              }
              newZip.addFile(entry.entryName, Buffer.from(text, 'utf-8'));
            } catch {
              newZip.addFile(entry.entryName, entry.getData()); // binary, skip
            }
          } else {
            newZip.addFile(entry.entryName, entry.getData());
          }
        }

        const outputName = `eol_fixed_${path.basename(file)}`;
        const s3Key = `archives/${userId}/${Date.now()}_${outputName}`;
        const buffer = newZip.toBuffer();
        const url = await uploadToS3(s3Key, buffer, 'application/zip');
        cleanTemp(resolved.path, resolved.isTemp);

        return {
          success: true,
          url,
          filename: outputName,
          fixedFiles: fixed,
          targetLineEnding: target,
        };
      }

      default:
        cleanTemp(resolved.path, resolved.isTemp);
        return {
          success: false,
          error: `Unknown archive_convert action: ${action}. Use: zip_to_tar, tar_to_zip, zip_to_targz, targz_to_zip, zip_to_7z, rar_extract, fix_line_endings`,
        };
    }
  } catch (error) {
    console.error(`[ArchiveService] archiveConvert error (${action}):`, error);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════
// 7. ARCHIVE INTELLIGENCE — summarize, find_files, search_text, auto_readme, detect_project, flag_secrets
// ═══════════════════════════════════════════════════════════════

export async function archiveIntelligence(params, userId = 'default') {
  const { file, action = 'summarize', options = {} } = params;

  try {
    const resolved = await resolveArchiveInput(file, userId);
    const AdmZip = await getAdmZip();
    const zip = new AdmZip(resolved.path);
    const entries = zip.getEntries();

    switch (action) {
      // ── Summarize archive contents ───────────────────────────
      case 'summarize': {
        const filesByExt = {};
        let totalSize = 0;
        let largestFile = { name: '', size: 0 };
        const directories = new Set();

        for (const entry of entries) {
          if (entry.isDirectory) {
            directories.add(entry.entryName);
            continue;
          }
          const ext = path.extname(entry.entryName).toLowerCase() || '(no ext)';
          if (!filesByExt[ext]) filesByExt[ext] = { count: 0, totalSize: 0 };
          filesByExt[ext].count++;
          filesByExt[ext].totalSize += entry.header.size;
          totalSize += entry.header.size;

          if (entry.header.size > largestFile.size) {
            largestFile = { name: entry.entryName, size: entry.header.size };
          }
        }

        // Sort extensions by count
        const extensionSummary = Object.entries(filesByExt)
          .sort((a, b) => b[1].count - a[1].count)
          .map(([ext, info]) => ({
            extension: ext,
            count: info.count,
            totalSize: humanSize(info.totalSize),
          }));

        // Top-level structure
        const topLevel = [
          ...new Set(entries.map((e) => e.entryName.split('/')[0])),
        ];

        cleanTemp(resolved.path, resolved.isTemp);

        return {
          success: true,
          totalFiles: entries.filter((e) => !e.isDirectory).length,
          totalDirectories: directories.size,
          totalSize: humanSize(totalSize),
          archiveSize: humanSize(
            fs.existsSync(resolved.path) ? fs.statSync(resolved.path).size : 0
          ),
          largestFile: {
            name: largestFile.name,
            size: humanSize(largestFile.size),
          },
          topLevelItems: topLevel,
          extensionBreakdown: extensionSummary,
        };
      }

      // ── Find files by pattern ────────────────────────────────
      case 'find_files': {
        const { pattern, extensions = [], minSize, maxSize } = options;

        let results = entries.filter((e) => !e.isDirectory);

        if (pattern) {
          const regex = new RegExp(pattern, 'i');
          results = results.filter((e) => regex.test(e.entryName));
        }

        if (extensions.length) {
          results = results.filter((e) => {
            const ext = path.extname(e.entryName).toLowerCase();
            return extensions.some(
              (x) => ext === (x.startsWith('.') ? x : `.${x}`)
            );
          });
        }

        if (minSize) results = results.filter((e) => e.header.size >= minSize);
        if (maxSize) results = results.filter((e) => e.header.size <= maxSize);

        cleanTemp(resolved.path, resolved.isTemp);

        return {
          success: true,
          matchCount: results.length,
          matches: results.slice(0, 100).map((e) => ({
            path: e.entryName,
            size: humanSize(e.header.size),
            compressed: humanSize(e.header.compressedSize),
          })),
        };
      }

      // ── Search text across archive ───────────────────────────
      case 'search_text': {
        const {
          query,
          caseSensitive = false,
          maxResults = 50,
          fileTypes,
        } = options;

        if (!query) {
          cleanTemp(resolved.path, resolved.isTemp);
          return { success: false, error: 'Provide search query' };
        }

        const regex = new RegExp(query, caseSensitive ? 'g' : 'gi');
        const results = [];

        for (const entry of entries) {
          if (entry.isDirectory) continue;
          if (entry.header.size > 1024 * 1024) continue; // Skip files > 1MB
          if (entry.header.size === 0) continue;

          if (fileTypes) {
            const ext = path.extname(entry.entryName).toLowerCase();
            if (
              !fileTypes.some((t) => ext === (t.startsWith('.') ? t : `.${t}`))
            )
              continue;
          }

          try {
            const text = entry.getData().toString('utf-8');
            const matches = text.match(regex);
            if (matches) {
              // Find line numbers of matches
              const lines = text.split('\n');
              const matchLines = [];
              for (let i = 0; i < lines.length && matchLines.length < 5; i++) {
                if (
                  caseSensitive
                    ? lines[i].includes(query)
                    : lines[i].toLowerCase().includes(query.toLowerCase())
                ) {
                  matchLines.push({
                    line: i + 1,
                    content: lines[i].trim().substring(0, 200),
                  });
                }
              }

              results.push({
                file: entry.entryName,
                matchCount: matches.length,
                matchLines,
              });

              if (results.length >= maxResults) break;
            }
          } catch {
            /* binary file */
          }
        }

        cleanTemp(resolved.path, resolved.isTemp);

        return {
          success: true,
          query,
          totalMatches: results.reduce((sum, r) => sum + r.matchCount, 0),
          filesMatched: results.length,
          results,
        };
      }

      // ── Auto-generate README ─────────────────────────────────
      case 'auto_readme': {
        const fileList = entries.filter((e) => !e.isDirectory);
        const totalSize = fileList.reduce((sum, e) => sum + e.header.size, 0);

        // Detect project type
        const entryNames = entries.map((e) => e.entryName);
        let projectType = 'Unknown';
        for (const [type, sigs] of Object.entries(PROJECT_SIGNATURES)) {
          const matches = sigs.filter((sig) =>
            entryNames.some((n) => n.endsWith(sig) || n.includes(sig))
          );
          if (matches.length >= 1) {
            projectType = type;
            break;
          }
        }

        // File extension breakdown
        const extCounts = {};
        for (const f of fileList) {
          const ext = path.extname(f.entryName).toLowerCase() || 'other';
          extCounts[ext] = (extCounts[ext] || 0) + 1;
        }

        // Build README content
        const topLevel = [
          ...new Set(entries.map((e) => e.entryName.split('/')[0])),
        ];
        const readmeContent = `# Archive Contents

## Overview
- **Project Type**: ${projectType}
- **Total Files**: ${fileList.length}
- **Total Size**: ${humanSize(totalSize)}
- **Generated**: ${new Date().toISOString()}

## Structure
\`\`\`
${topLevel.map((t) => `├── ${t}`).join('\n')}
\`\`\`

## File Types
${Object.entries(extCounts)
  .sort((a, b) => b[1] - a[1])
  .map(([ext, count]) => `- **${ext}**: ${count} file${count > 1 ? 's' : ''}`)
  .join('\n')}

## Key Files
${
  fileList
    .filter((f) =>
      f.entryName.match(
        /(readme|package\.json|requirements\.txt|setup\.py|Makefile|Dockerfile|\.env\.example|index\.(html|js|ts)|main\.(py|go|rs|java))/i
      )
    )
    .slice(0, 10)
    .map((f) => `- \`${f.entryName}\``)
    .join('\n') || '- None detected'
}
`;

        // Add README to ZIP
        const newZip = new AdmZip(resolved.path);
        newZip.addFile(
          'README_GENERATED.md',
          Buffer.from(readmeContent, 'utf-8')
        );

        const outputName = `with_readme_${path.basename(file)}`;
        const s3Key = `archives/${userId}/${Date.now()}_${outputName}`;
        const buffer = newZip.toBuffer();
        const url = await uploadToS3(s3Key, buffer, 'application/zip');
        cleanTemp(resolved.path, resolved.isTemp);

        return {
          success: true,
          url,
          filename: outputName,
          readmeContent,
          projectType,
        };
      }

      // ── Detect project type ──────────────────────────────────
      case 'detect_project': {
        const entryNames = entries.map((e) => e.entryName);
        const detected = [];

        for (const [type, sigs] of Object.entries(PROJECT_SIGNATURES)) {
          const matches = sigs.filter((sig) =>
            entryNames.some(
              (n) => n === sig || n.endsWith(`/${sig}`) || n.includes(sig)
            )
          );
          if (matches.length > 0) {
            detected.push({
              type,
              confidence:
                matches.length >= 3
                  ? 'high'
                  : matches.length >= 2
                    ? 'medium'
                    : 'low',
              matchedSignatures: matches,
            });
          }
        }

        // Sort by confidence
        const order = { high: 0, medium: 1, low: 2 };
        detected.sort((a, b) => order[a.confidence] - order[b.confidence]);

        cleanTemp(resolved.path, resolved.isTemp);

        return {
          success: true,
          primaryType: detected[0]?.type || 'unknown',
          detected,
          totalFiles: entries.filter((e) => !e.isDirectory).length,
        };
      }

      // ── Flag secrets ─────────────────────────────────────────
      case 'flag_secrets': {
        const { scanAllFiles = false } = options;
        const secretFindings = [];

        const sensitiveFilePatterns = [
          /\.env$/i,
          /\.env\.\w+$/i,
          /credentials/i,
          /secrets/i,
          /\.pem$/i,
          /\.key$/i,
          /\.pfx$/i,
          /\.p12$/i,
          /\.htpasswd$/i,
          /\.netrc$/i,
          /id_rsa$/i,
          /id_dsa$/i,
          /id_ecdsa$/i,
        ];

        for (const entry of entries) {
          if (entry.isDirectory) continue;

          // Check for sensitive file names
          for (const pat of sensitiveFilePatterns) {
            if (pat.test(entry.entryName)) {
              secretFindings.push({
                file: entry.entryName,
                type: 'sensitive_file',
                severity: 'high',
                detail: `Sensitive file detected: ${path.basename(entry.entryName)}`,
              });
            }
          }

          // Scan content of text files
          if (scanAllFiles || entry.header.size < 100000) {
            const ext = path.extname(entry.entryName).toLowerCase();
            if (
              [
                '.env',
                '.json',
                '.yaml',
                '.yml',
                '.toml',
                '.cfg',
                '.conf',
                '.ini',
                '.properties',
                '.js',
                '.ts',
                '.py',
                '.rb',
                '.php',
                '.java',
                '.cs',
                '.go',
                '.rs',
                '.sh',
                '.xml',
                '.txt',
                '.md',
              ].includes(ext) ||
              entry.entryName.match(/\.env/i)
            ) {
              try {
                const text = entry.getData().toString('utf-8');
                for (const { pattern, label } of SECRET_PATTERNS) {
                  const matches = text.match(pattern);
                  if (matches) {
                    secretFindings.push({
                      file: entry.entryName,
                      type: 'secret_in_content',
                      severity: 'critical',
                      secretType: label,
                      occurrences: matches.length,
                    });
                  }
                  pattern.lastIndex = 0;
                }
              } catch {
                /* binary */
              }
            }
          }
        }

        cleanTemp(resolved.path, resolved.isTemp);

        return {
          success: true,
          safe:
            secretFindings.filter((f) => f.severity === 'critical').length ===
            0,
          totalFindings: secretFindings.length,
          critical: secretFindings.filter((f) => f.severity === 'critical')
            .length,
          high: secretFindings.filter((f) => f.severity === 'high').length,
          findings: secretFindings,
        };
      }

      default:
        cleanTemp(resolved.path, resolved.isTemp);
        return {
          success: false,
          error: `Unknown archive_intelligence action: ${action}. Use: summarize, find_files, search_text, auto_readme, detect_project, flag_secrets`,
        };
    }
  } catch (error) {
    console.error(
      `[ArchiveService] archiveIntelligence error (${action}):`,
      error
    );
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════
// 8. ARCHIVE DEPLOY — package_build, prepare_deploy, inject_env, strip_dev, size_optimize, version_tag
// ═══════════════════════════════════════════════════════════════

export async function archiveDeploy(params, userId = 'default') {
  const { file, action = 'prepare_deploy', options = {} } = params;

  try {
    switch (action) {
      // ── Package build artifacts ──────────────────────────────
      case 'package_build': {
        const {
          buildDir,
          outputName = `build_${Date.now()}.zip`,
          include = [],
          exclude = [],
        } = options;

        if (!buildDir && !file) {
          return {
            success: false,
            error: 'Provide buildDir path or file to package',
          };
        }

        const sourceDir = buildDir || file;
        const resolved = await resolveArchiveInput(sourceDir, userId);
        const AdmZip = await getAdmZip();
        const zip = new AdmZip();

        if (fs.statSync(resolved.path).isDirectory()) {
          function addDirRecursive(dir, zipDir = '') {
            for (const item of fs.readdirSync(dir)) {
              const fullPath = path.join(dir, item);
              const relPath = zipDir ? `${zipDir}/${item}` : item;
              const stat = fs.statSync(fullPath);

              // Check exclusions
              if (exclude.some((p) => relPath.match(new RegExp(p)))) continue;
              if (
                include.length &&
                !include.some((p) => relPath.match(new RegExp(p)))
              )
                continue;

              if (stat.isDirectory()) {
                addDirRecursive(fullPath, relPath);
              } else {
                zip.addLocalFile(fullPath, zipDir || '', item);
              }
            }
          }
          addDirRecursive(resolved.path);
        } else {
          // It's an existing archive — filter it
          const sourceZip = new AdmZip(resolved.path);
          for (const entry of sourceZip.getEntries()) {
            if (entry.isDirectory) continue;
            if (exclude.some((p) => entry.entryName.match(new RegExp(p))))
              continue;
            if (
              include.length &&
              !include.some((p) => entry.entryName.match(new RegExp(p)))
            )
              continue;
            zip.addFile(entry.entryName, entry.getData());
          }
        }

        const s3Key = `archives/${userId}/builds/${Date.now()}_${outputName}`;
        const buffer = zip.toBuffer();
        const url = await uploadToS3(s3Key, buffer, 'application/zip');
        await recordAgentFile(
          userId,
          outputName,
          s3Key,
          url,
          'application/zip',
          buffer.length
        );
        cleanTemp(resolved.path, resolved.isTemp);

        return {
          success: true,
          url,
          filename: outputName,
          size: humanSize(buffer.length),
          entryCount: zip.getEntries().length,
        };
      }

      // ── Prepare deployment ZIP ───────────────────────────────
      case 'prepare_deploy': {
        const {
          platform = 'generic',
          stripDev = true,
          injectFiles = [],
        } = options;

        const resolved = await resolveArchiveInput(file, userId);
        const AdmZip = await getAdmZip();
        const sourceZip = new AdmZip(resolved.path);
        const newZip = new AdmZip();

        const devPatterns = DEV_FILES.map((p) =>
          p.endsWith('/')
            ? new RegExp(
                `(^|/)${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
                'i'
              )
            : p.startsWith('*.')
              ? new RegExp(`\\${p.substring(1)}$`, 'i')
              : new RegExp(
                  `(^|/)${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
                  'i'
                )
        );

        let stripped = 0;
        for (const entry of sourceZip.getEntries()) {
          if (entry.isDirectory) continue;

          if (stripDev) {
            const isDevFile = devPatterns.some((p) => p.test(entry.entryName));
            if (isDevFile) {
              stripped++;
              continue;
            }
          }

          newZip.addFile(entry.entryName, entry.getData());
        }

        // Inject additional files
        for (const inject of injectFiles) {
          if (inject.name && inject.content) {
            newZip.addFile(inject.name, Buffer.from(inject.content, 'utf-8'));
          }
        }

        // Platform-specific additions
        if (platform === 'vercel') {
          if (!newZip.getEntry('vercel.json')) {
            newZip.addFile(
              'vercel.json',
              Buffer.from(JSON.stringify({ version: 2 }, null, 2))
            );
          }
        } else if (platform === 'docker') {
          if (
            !newZip.getEntry('Dockerfile') &&
            !newZip.getEntry('dockerfile')
          ) {
            newZip.addFile(
              'Dockerfile',
              Buffer.from(
                '# Auto-generated Dockerfile\nFROM node:20-alpine\nWORKDIR /app\nCOPY . .\nRUN npm install --production\nCMD ["node", "server.js"]\n'
              )
            );
          }
        } else if (platform === 'aws-lambda') {
          if (!newZip.getEntry('index.js') && !newZip.getEntry('handler.js')) {
            // Don't add handler, just note it's missing
          }
        }

        const outputName = `deploy_${platform}_${Date.now()}.zip`;
        const s3Key = `archives/${userId}/deploy/${Date.now()}_${outputName}`;
        const buffer = newZip.toBuffer();
        const url = await uploadToS3(s3Key, buffer, 'application/zip');
        await recordAgentFile(
          userId,
          outputName,
          s3Key,
          url,
          'application/zip',
          buffer.length
        );
        cleanTemp(resolved.path, resolved.isTemp);

        return {
          success: true,
          url,
          filename: outputName,
          size: humanSize(buffer.length),
          strippedDevFiles: stripped,
          injectedFiles: injectFiles.length,
          platform,
        };
      }

      // ── Inject env configs ───────────────────────────────────
      case 'inject_env': {
        const { envVars = {}, targetFile = '.env', mode = 'merge' } = options;

        if (!Object.keys(envVars).length) {
          return {
            success: false,
            error: 'Provide envVars object with key-value pairs',
          };
        }

        const resolved = await resolveArchiveInput(file, userId);
        const AdmZip = await getAdmZip();
        const zip = new AdmZip(resolved.path);

        const existingEntry = zip.getEntry(targetFile);
        let envContent = '';

        if (existingEntry && mode === 'merge') {
          envContent = existingEntry.getData().toString('utf-8');
          const lines = envContent.split('\n');
          for (const [key, value] of Object.entries(envVars)) {
            const idx = lines.findIndex((l) => l.startsWith(`${key}=`));
            if (idx >= 0) {
              lines[idx] = `${key}=${value}`;
            } else {
              lines.push(`${key}=${value}`);
            }
          }
          envContent = lines.join('\n');
        } else {
          envContent = Object.entries(envVars)
            .map(([k, v]) => `${k}=${v}`)
            .join('\n');
        }

        // Rebuild ZIP
        const newZip = new AdmZip();
        for (const entry of zip.getEntries()) {
          if (entry.isDirectory) continue;
          if (entry.entryName === targetFile) continue;
          newZip.addFile(entry.entryName, entry.getData());
        }
        newZip.addFile(targetFile, Buffer.from(envContent, 'utf-8'));

        const outputName = `env_injected_${path.basename(file)}`;
        const s3Key = `archives/${userId}/${Date.now()}_${outputName}`;
        const buffer = newZip.toBuffer();
        const url = await uploadToS3(s3Key, buffer, 'application/zip');
        cleanTemp(resolved.path, resolved.isTemp);

        return {
          success: true,
          url,
          filename: outputName,
          injectedVars: Object.keys(envVars).length,
          targetFile,
          mode,
        };
      }

      // ── Strip dev files ──────────────────────────────────────
      case 'strip_dev': {
        const { extraPatterns = [] } = options;

        const resolved = await resolveArchiveInput(file, userId);
        const AdmZip = await getAdmZip();
        const zip = new AdmZip(resolved.path);
        const newZip = new AdmZip();

        const allPatterns = [...DEV_FILES, ...extraPatterns];
        const devPatterns = allPatterns.map((p) =>
          p.endsWith('/')
            ? new RegExp(
                `(^|/)${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
                'i'
              )
            : p.startsWith('*.')
              ? new RegExp(`\\${p.substring(1)}$`, 'i')
              : new RegExp(
                  `(^|/)${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
                  'i'
                )
        );

        let stripped = 0;
        let kept = 0;
        const strippedFiles = [];

        for (const entry of zip.getEntries()) {
          if (entry.isDirectory) continue;
          const isDevFile = devPatterns.some((p) => p.test(entry.entryName));
          if (isDevFile) {
            stripped++;
            if (strippedFiles.length < 50) strippedFiles.push(entry.entryName);
          } else {
            newZip.addFile(entry.entryName, entry.getData());
            kept++;
          }
        }

        const outputName = `prod_${path.basename(file)}`;
        const s3Key = `archives/${userId}/${Date.now()}_${outputName}`;
        const buffer = newZip.toBuffer();
        const url = await uploadToS3(s3Key, buffer, 'application/zip');
        cleanTemp(resolved.path, resolved.isTemp);

        return {
          success: true,
          url,
          filename: outputName,
          strippedFiles: stripped,
          keptFiles: kept,
          size: humanSize(buffer.length),
          examples: strippedFiles,
        };
      }

      // ── Size optimization ────────────────────────────────────
      case 'size_optimize': {
        const { removeEmpty = true, dedup = true, maxFileSize } = options;

        const resolved = await resolveArchiveInput(file, userId);
        const AdmZip = await getAdmZip();
        const zip = new AdmZip(resolved.path);
        const newZip = new AdmZip();
        const originalSize = fs.statSync(resolved.path).size;

        const seen = new Map();
        let removed = 0;
        let deduped = 0;

        for (const entry of zip.getEntries()) {
          if (entry.isDirectory) continue;

          // Remove empty files
          if (removeEmpty && entry.header.size === 0) {
            removed++;
            continue;
          }

          // Skip files over max size
          if (maxFileSize && entry.header.size > maxFileSize) {
            removed++;
            continue;
          }

          // Deduplicate by content hash
          if (dedup) {
            const { createHash } = await import('crypto');
            const hash = createHash('md5')
              .update(entry.getData())
              .digest('hex');
            if (seen.has(hash)) {
              deduped++;
              continue;
            }
            seen.set(hash, entry.entryName);
          }

          newZip.addFile(entry.entryName, entry.getData());
        }

        const outputName = `optimized_${path.basename(file)}`;
        const s3Key = `archives/${userId}/${Date.now()}_${outputName}`;
        const buffer = newZip.toBuffer();
        const url = await uploadToS3(s3Key, buffer, 'application/zip');
        cleanTemp(resolved.path, resolved.isTemp);

        const savings = originalSize - buffer.length;
        return {
          success: true,
          url,
          filename: outputName,
          originalSize: humanSize(originalSize),
          newSize: humanSize(buffer.length),
          savings: humanSize(Math.max(0, savings)),
          savingsPercent: `${((Math.max(0, savings) / originalSize) * 100).toFixed(1)}%`,
          emptyRemoved: removed,
          duplicatesRemoved: deduped,
        };
      }

      // ── Version tagging ──────────────────────────────────────
      case 'version_tag': {
        const { version = '1.0.0', buildNumber, timestamp = true } = options;

        const resolved = await resolveArchiveInput(file, userId);
        const AdmZip = await getAdmZip();
        const zip = new AdmZip(resolved.path);

        // Add version manifest
        const manifest = {
          version,
          buildNumber: buildNumber || Date.now(),
          timestamp: timestamp ? new Date().toISOString() : undefined,
          files: zip.getEntries().filter((e) => !e.isDirectory).length,
          createdBy: 'Mumtaz AI Archive Service',
        };

        zip.addFile(
          'VERSION.json',
          Buffer.from(JSON.stringify(manifest, null, 2))
        );
        zip.addFile('VERSION', Buffer.from(version));

        const outputName = `${path.basename(file, '.zip')}_v${version}.zip`;
        const s3Key = `archives/${userId}/${Date.now()}_${outputName}`;
        const buffer = zip.toBuffer();
        const url = await uploadToS3(s3Key, buffer, 'application/zip');
        await recordAgentFile(
          userId,
          outputName,
          s3Key,
          url,
          'application/zip',
          buffer.length
        );
        cleanTemp(resolved.path, resolved.isTemp);

        return {
          success: true,
          url,
          filename: outputName,
          version,
          manifest,
        };
      }

      default:
        return {
          success: false,
          error: `Unknown archive_deploy action: ${action}. Use: package_build, prepare_deploy, inject_env, strip_dev, size_optimize, version_tag`,
        };
    }
  } catch (error) {
    console.error(`[ArchiveService] archiveDeploy error (${action}):`, error);
    return { success: false, error: error.message };
  }
}

// ─── MIME Helper ───────────────────────────────────────────────
function getMimeFromExt(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimes = {
    '.html': 'text/html',
    '.htm': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.ts': 'application/typescript',
    '.tsx': 'application/typescript',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.csv': 'text/csv',
    '.yaml': 'text/yaml',
    '.yml': 'text/yaml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.avi': 'video/x-msvideo',
    '.pdf': 'application/pdf',
    '.zip': 'application/zip',
    '.tar': 'application/x-tar',
    '.gz': 'application/gzip',
    '.7z': 'application/x-7z-compressed',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.py': 'text/x-python',
    '.rb': 'text/x-ruby',
    '.php': 'text/x-php',
    '.java': 'text/x-java',
    '.go': 'text/x-go',
    '.rs': 'text/x-rust',
    '.sh': 'text/x-shellscript',
    '.env': 'text/plain',
  };
  return mimes[ext] || 'application/octet-stream';
}
