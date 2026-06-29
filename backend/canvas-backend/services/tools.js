/**
 * CORE TOOLS — file system, git, utilities
 * 15 tools: create_file, read_file, write_file, modify_file, list_files,
 *           delete_file, move_file, copy_file, rename_file, create_folder,
 *           list_folders, zip_files, unzip_files, file_exists, get_project_tree
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

// Helper: resolve a user-provided path against workspaceRoot safely
function safePath(filePath, root = process.cwd()) {
  const resolved = path.resolve(root, filePath);
  // Security: prevent path traversal outside workspace
  if (!resolved.startsWith(path.resolve(root))) {
    throw new Error(`Path traversal denied: ${filePath}`);
  }
  return resolved;
}

export const TOOL_DEFINITIONS = [
  {
    name: 'create_file',
    description: 'Create a new file with the given content. Creates parent directories if needed.',
    input_schema: {
      type: 'object',
      properties: {
        path:    { type: 'string', description: 'File path (relative to workspace or absolute)' },
        content: { type: 'string', description: 'File content to write' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'read_file',
    description: 'Read the contents of a file. Returns the file text.',
    input_schema: {
      type: 'object',
      properties: {
        path:       { type: 'string', description: 'File path to read' },
        start_line: { type: 'number', description: 'Start line (1-based, optional)' },
        end_line:   { type: 'number', description: 'End line (1-based, optional)' },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: 'Write or overwrite a file with the given content.',
    input_schema: {
      type: 'object',
      properties: {
        path:    { type: 'string', description: 'File path to write' },
        content: { type: 'string', description: 'Content to write' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'modify_file',
    description: 'Edit a file: replace text, append content, insert at line, or find-and-replace.',
    input_schema: {
      type: 'object',
      properties: {
        path:        { type: 'string', description: 'File path' },
        operation:   { type: 'string', enum: ['replace', 'append', 'prepend', 'insert_at_line', 'find_replace'],
                       description: 'Edit operation type' },
        content:     { type: 'string', description: 'Content to insert/append/prepend' },
        old_text:    { type: 'string', description: 'Text to find (for replace/find_replace)' },
        new_text:    { type: 'string', description: 'Replacement text (for find_replace)' },
        line_number: { type: 'number', description: 'Line number to insert at (for insert_at_line)' },
      },
      required: ['path', 'operation'],
    },
  },
  {
    name: 'list_files',
    description: 'List files in a directory. Returns filenames and metadata.',
    input_schema: {
      type: 'object',
      properties: {
        path:       { type: 'string', description: 'Directory path (default: workspace root)' },
        pattern:    { type: 'string', description: 'Glob pattern filter (e.g. *.js)' },
        recursive:  { type: 'boolean', description: 'List recursively (default: false)' },
      },
      required: [],
    },
  },
  {
    name: 'delete_file',
    description: 'Delete a file or empty directory.',
    input_schema: {
      type: 'object',
      properties: {
        path:      { type: 'string', description: 'File or directory path to delete' },
        recursive: { type: 'boolean', description: 'Delete directory recursively (default: false)' },
      },
      required: ['path'],
    },
  },
  {
    name: 'move_file',
    description: 'Move a file or directory to a new path.',
    input_schema: {
      type: 'object',
      properties: {
        source:      { type: 'string', description: 'Source path' },
        destination: { type: 'string', description: 'Destination path' },
      },
      required: ['source', 'destination'],
    },
  },
  {
    name: 'copy_file',
    description: 'Copy a file to a new path.',
    input_schema: {
      type: 'object',
      properties: {
        source:      { type: 'string', description: 'Source file path' },
        destination: { type: 'string', description: 'Destination file path' },
      },
      required: ['source', 'destination'],
    },
  },
  {
    name: 'rename_file',
    description: 'Rename a file in the same directory.',
    input_schema: {
      type: 'object',
      properties: {
        path:     { type: 'string', description: 'Current file path' },
        new_name: { type: 'string', description: 'New filename (not full path, just the name)' },
      },
      required: ['path', 'new_name'],
    },
  },
  {
    name: 'create_folder',
    description: 'Create a directory (and all intermediate directories).',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Directory path to create' },
      },
      required: ['path'],
    },
  },
  {
    name: 'list_folders',
    description: 'List subdirectories in a directory.',
    input_schema: {
      type: 'object',
      properties: {
        path:      { type: 'string', description: 'Parent directory path' },
        recursive: { type: 'boolean', description: 'List recursively (default: false)' },
      },
      required: [],
    },
  },
  {
    name: 'file_exists',
    description: 'Check if a file or directory exists at the given path.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to check' },
      },
      required: ['path'],
    },
  },
  {
    name: 'get_project_tree',
    description: 'Get full directory tree structure (like the `tree` command). Returns JSON tree.',
    input_schema: {
      type: 'object',
      properties: {
        path:        { type: 'string', description: 'Root path (default: workspace root)' },
        max_depth:   { type: 'number', description: 'Max depth to traverse (default: 4)' },
        ignore:      { type: 'array', items: { type: 'string' },
                       description: 'Patterns to ignore (e.g. ["node_modules", ".git"])' },
      },
      required: [],
    },
  },
  {
    name: 'zip_files',
    description: 'Compress files or directories into a ZIP archive.',
    input_schema: {
      type: 'object',
      properties: {
        source:  { type: 'string', description: 'Source file or directory to compress' },
        output:  { type: 'string', description: 'Output ZIP file path' },
        include: { type: 'array', items: { type: 'string' }, description: 'List of files/patterns to include' },
      },
      required: ['source', 'output'],
    },
  },
  {
    name: 'unzip_files',
    description: 'Extract a ZIP archive to a destination directory.',
    input_schema: {
      type: 'object',
      properties: {
        source:      { type: 'string', description: 'ZIP file to extract' },
        destination: { type: 'string', description: 'Destination directory' },
      },
      required: ['source', 'destination'],
    },
  },
];

// ============================================================================
// EXECUTORS
// ============================================================================

function buildTree(dirPath, maxDepth = 4, ignore = ['node_modules', '.git', 'dist', '.next', 'build'], depth = 0) {
  if (depth >= maxDepth) return null;
  const name = path.basename(dirPath);
  try {
    const stat = fs.statSync(dirPath);
    if (!stat.isDirectory()) return { name, type: 'file', size: stat.size };
    const entries = fs.readdirSync(dirPath)
      .filter(e => !ignore.some(ig => e === ig || e.startsWith('.')))
      .map(e => buildTree(path.join(dirPath, e), maxDepth, ignore, depth + 1))
      .filter(Boolean);
    return { name, type: 'dir', children: entries };
  } catch { return null; }
}

export async function executeTool(toolName, input, ctx = {}) {
  const root = ctx.workspaceRoot || process.cwd();

  try {
    switch (toolName) {
      case 'create_file': {
        const fp = safePath(input.path, root);
        fs.mkdirSync(path.dirname(fp), { recursive: true });
        fs.writeFileSync(fp, input.content, 'utf8');
        return { result: JSON.stringify({ status: 'success', path: fp, size: input.content.length }) };
      }

      case 'read_file': {
        const fp = safePath(input.path, root);
        let content = fs.readFileSync(fp, 'utf8');
        if (input.start_line || input.end_line) {
          const lines = content.split('\n');
          const from = (input.start_line || 1) - 1;
          const to   = input.end_line || lines.length;
          content = lines.slice(from, to).join('\n');
        }
        return { result: JSON.stringify({ status: 'success', content, size: content.length }) };
      }

      case 'write_file': {
        const fp = safePath(input.path, root);
        fs.mkdirSync(path.dirname(fp), { recursive: true });
        fs.writeFileSync(fp, input.content, 'utf8');
        return { result: JSON.stringify({ status: 'success', path: fp, size: input.content.length }) };
      }

      case 'modify_file': {
        const fp = safePath(input.path, root);
        let content = fs.readFileSync(fp, 'utf8');
        switch (input.operation) {
          case 'append':       content = content + (input.content || ''); break;
          case 'prepend':      content = (input.content || '') + content; break;
          case 'replace':      content = input.content || ''; break;
          case 'find_replace': content = content.replaceAll(input.old_text || '', input.new_text || ''); break;
          case 'insert_at_line': {
            const lines = content.split('\n');
            const idx = Math.max(0, (input.line_number || 1) - 1);
            lines.splice(idx, 0, input.content || '');
            content = lines.join('\n');
            break;
          }
        }
        fs.writeFileSync(fp, content, 'utf8');
        return { result: JSON.stringify({ status: 'success', path: fp }) };
      }

      case 'list_files': {
        const dir = safePath(input.path || '.', root);
        const entries = fs.readdirSync(dir, { withFileTypes: true })
          .filter(e => e.isFile())
          .map(e => {
            const stat = fs.statSync(path.join(dir, e.name));
            return { name: e.name, size: stat.size, modified: stat.mtime.toISOString() };
          });
        return { result: JSON.stringify({ status: 'success', files: entries, count: entries.length }) };
      }

      case 'delete_file': {
        const fp = safePath(input.path, root);
        if (input.recursive) {
          fs.rmSync(fp, { recursive: true, force: true });
        } else {
          fs.unlinkSync(fp);
        }
        return { result: JSON.stringify({ status: 'success', deleted: fp }) };
      }

      case 'move_file': {
        const src  = safePath(input.source, root);
        const dest = safePath(input.destination, root);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.renameSync(src, dest);
        return { result: JSON.stringify({ status: 'success', source: src, destination: dest }) };
      }

      case 'copy_file': {
        const src  = safePath(input.source, root);
        const dest = safePath(input.destination, root);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(src, dest);
        return { result: JSON.stringify({ status: 'success', source: src, destination: dest }) };
      }

      case 'rename_file': {
        const fp      = safePath(input.path, root);
        const newPath = path.join(path.dirname(fp), input.new_name);
        fs.renameSync(fp, newPath);
        return { result: JSON.stringify({ status: 'success', new_path: newPath }) };
      }

      case 'create_folder': {
        const fp = safePath(input.path, root);
        fs.mkdirSync(fp, { recursive: true });
        return { result: JSON.stringify({ status: 'success', path: fp }) };
      }

      case 'list_folders': {
        const dir = safePath(input.path || '.', root);
        const entries = fs.readdirSync(dir, { withFileTypes: true })
          .filter(e => e.isDirectory())
          .map(e => e.name);
        return { result: JSON.stringify({ status: 'success', folders: entries, count: entries.length }) };
      }

      case 'file_exists': {
        const fp     = safePath(input.path, root);
        const exists = fs.existsSync(fp);
        const stat   = exists ? fs.statSync(fp) : null;
        return { result: JSON.stringify({
          status: 'success',
          exists,
          type: stat ? (stat.isDirectory() ? 'directory' : 'file') : null,
        }) };
      }

      case 'get_project_tree': {
        const dir   = safePath(input.path || '.', root);
        const tree  = buildTree(dir, input.max_depth || 4, input.ignore || ['node_modules', '.git', 'dist', '.next', 'build']);
        return { result: JSON.stringify({ status: 'success', tree }) };
      }

      case 'zip_files': {
        const src  = safePath(input.source, root);
        const out  = safePath(input.output, root);
        execSync(`cd "${path.dirname(src)}" && zip -r "${out}" "${path.basename(src)}"`, { stdio: 'pipe' });
        return { result: JSON.stringify({ status: 'success', output: out }) };
      }

      case 'unzip_files': {
        const src  = safePath(input.source, root);
        const dest = safePath(input.destination, root);
        fs.mkdirSync(dest, { recursive: true });
        execSync(`unzip -o "${src}" -d "${dest}"`, { stdio: 'pipe' });
        return { result: JSON.stringify({ status: 'success', destination: dest }) };
      }

      default:
        return { result: JSON.stringify({ status: 'error', error: `Unknown tool: ${toolName}` }) };
    }
  } catch (err) {
    return { result: JSON.stringify({ status: 'error', error: err.message, tool: toolName }) };
  }
}

// Alias for toolsHQ compatibility
export const executeCoreTool = executeTool;
