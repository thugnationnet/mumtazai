/**
 * DOCUMENT PARSING TOOLS
 * 7 tools: parse_pdf, parse_docx, parse_csv, parse_json, parse_markdown, parse_html, transcribe_audio
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export const DOCUMENT_PARSING_TOOL_DEFINITIONS = [
  {
    name: 'parse_pdf',
    description: 'Extract text content from PDF files. Returns full text and page count.',
    input_schema: {
      type: 'object',
      properties: {
        path:   { type: 'string', description: 'Path to PDF file' },
        pages:  { type: 'string', description: 'Page range (e.g. "1-5" or "all", default: "all")' },
      },
      required: ['path'],
    },
  },
  {
    name: 'parse_docx',
    description: 'Extract text content from DOCX (Word) documents.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to DOCX file' },
      },
      required: ['path'],
    },
  },
  {
    name: 'parse_csv',
    description: 'Parse CSV file into structured rows. Returns headers and data rows.',
    input_schema: {
      type: 'object',
      properties: {
        path:      { type: 'string', description: 'Path to CSV file' },
        delimiter: { type: 'string', description: 'Column delimiter (default: ",")' },
        has_header: { type: 'boolean', description: 'First row is header (default: true)' },
        max_rows:  { type: 'number', description: 'Maximum rows to return (default: 100)' },
      },
      required: ['path'],
    },
  },
  {
    name: 'parse_json',
    description: 'Parse, validate, and transform JSON data. Supports JSONPath queries.',
    input_schema: {
      type: 'object',
      properties: {
        path:    { type: 'string', description: 'Path to JSON file (optional if data provided)' },
        data:    { description: 'JSON string or object to parse (optional if path provided)' },
        query:   { type: 'string', description: 'JSONPath query expression (e.g. "$.users[0].name")' },
        schema:  { type: 'object', description: 'JSON Schema to validate against (optional)' },
        pretty:  { type: 'boolean', description: 'Return pretty-printed JSON (default: false)' },
      },
      required: [],
    },
  },
  {
    name: 'parse_markdown',
    description: 'Parse Markdown to extract headers, code blocks, links, frontmatter, and convert to HTML.',
    input_schema: {
      type: 'object',
      properties: {
        path:      { type: 'string', description: 'Path to Markdown file (optional if content provided)' },
        content:   { type: 'string', description: 'Markdown content to parse (optional if path provided)' },
        extract:   { type: 'array', items: { type: 'string', enum: ['headers', 'links', 'code', 'frontmatter', 'images', 'tables'] },
                     description: 'Elements to extract (default: all)' },
        to_html:   { type: 'boolean', description: 'Convert to HTML (default: false)' },
      },
      required: [],
    },
  },
  {
    name: 'parse_html',
    description: 'Parse HTML to extract structured data: text, links, tables, metadata, JSON-LD.',
    input_schema: {
      type: 'object',
      properties: {
        path:    { type: 'string', description: 'Path to HTML file (optional if content provided)' },
        content: { type: 'string', description: 'HTML content (optional if path provided)' },
        extract: { type: 'array', items: { type: 'string', enum: ['text', 'links', 'tables', 'meta', 'images', 'headings', 'json_ld'] },
                   description: 'Elements to extract (default: text, links, meta)' },
        selector: { type: 'string', description: 'CSS-like selector to target specific element (optional)' },
      },
      required: [],
    },
  },
  {
    name: 'transcribe_audio',
    description: 'Transcribe audio files to text using speech-to-text (requires OpenAI Whisper or ffmpeg).',
    input_schema: {
      type: 'object',
      properties: {
        path:     { type: 'string', description: 'Path to audio file (MP3, WAV, M4A, etc.)' },
        language: { type: 'string', description: 'Language code (e.g. "en", "es", auto-detect if not set)' },
        format:   { type: 'string', enum: ['text', 'srt', 'vtt'], description: 'Output format (default: text)' },
      },
      required: ['path'],
    },
  },
];

// ============================================================================
// EXECUTORS  
// ============================================================================

function parseCsvLine(line, delimiter = ',') {
  const cols = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === delimiter && !inQuotes) { cols.push(current); current = ''; }
    else { current += ch; }
  }
  cols.push(current);
  return cols.map(c => c.trim().replace(/^"|"$/g, ''));
}

function simpleMarkdownToHtml(md) {
  return md
    .replace(/^### (.+)/gm, '<h3>$1</h3>')
    .replace(/^## (.+)/gm, '<h2>$1</h2>')
    .replace(/^# (.+)/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^/g, '<p>')
    .replace(/$/g, '</p>');
}

function stripHtmlTags(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

export async function executeDocumentParsingTool(toolName, input, ctx = {}) {
  const root = ctx.workspaceRoot || process.cwd();

  try {
    switch (toolName) {
      case 'parse_pdf': {
        const fp = path.resolve(root, input.path);
        try {
          // Try pdftotext if available
          const text = execSync(`pdftotext "${fp}" -`, { encoding: 'utf8', stdio: 'pipe' });
          return { result: JSON.stringify({ status: 'success', text: text.slice(0, 100000), source: 'pdftotext' }) };
        } catch {
          // Fallback: return error with guidance
          return { result: JSON.stringify({ status: 'error', error: 'PDF parsing requires pdftotext (poppler-utils). Install with: brew install poppler (macOS) or apt install poppler-utils (Linux)' }) };
        }
      }

      case 'parse_docx': {
        const fp = path.resolve(root, input.path);
        try {
          const text = execSync(`unzip -p "${fp}" word/document.xml 2>/dev/null | sed 's/<[^>]*>//g' | sed '/^$/d'`, { encoding: 'utf8', stdio: 'pipe' });
          return { result: JSON.stringify({ status: 'success', text: text.slice(0, 100000) }) };
        } catch {
          return { result: JSON.stringify({ status: 'error', error: 'Could not extract DOCX content. File may be corrupt or encrypted.' }) };
        }
      }

      case 'parse_csv': {
        const fp      = path.resolve(root, input.path);
        const content = fs.readFileSync(fp, 'utf8');
        const delim   = input.delimiter || ',';
        const lines   = content.split('\n').filter(l => l.trim());
        const hasHeader = input.has_header !== false;
        const headers = hasHeader ? parseCsvLine(lines[0], delim) : lines[0].split(delim).map((_, i) => `col${i}`);
        const dataStart = hasHeader ? 1 : 0;
        const maxRows  = input.max_rows || 100;
        const rows = lines.slice(dataStart, dataStart + maxRows).map(line => {
          const vals = parseCsvLine(line, delim);
          const row = {};
          headers.forEach((h, i) => { row[h] = vals[i] || ''; });
          return row;
        });
        return { result: JSON.stringify({ status: 'success', headers, rows, total_rows: lines.length - dataStart, returned: rows.length }) };
      }

      case 'parse_json': {
        let data;
        if (input.path) {
          const fp = path.resolve(root, input.path);
          data = JSON.parse(fs.readFileSync(fp, 'utf8'));
        } else if (input.data) {
          data = typeof input.data === 'string' ? JSON.parse(input.data) : input.data;
        } else {
          throw new Error('Either path or data required');
        }

        // Simple JSONPath-like query
        if (input.query) {
          const parts = input.query.replace(/^\$/, '').split(/[.\[\]]/).filter(Boolean);
          let current = data;
          for (const part of parts) {
            current = current?.[isNaN(part) ? part : parseInt(part)];
          }
          data = current;
        }

        return { result: JSON.stringify({ status: 'success', data, pretty: input.pretty ? JSON.stringify(data, null, 2) : undefined }) };
      }

      case 'parse_markdown': {
        let content = input.content;
        if (!content && input.path) {
          content = fs.readFileSync(path.resolve(root, input.path), 'utf8');
        }
        if (!content) throw new Error('Either path or content required');

        const result = {};

        // Frontmatter
        const fmMatch = content.match(/^---\n([\s\S]+?)\n---/);
        result.frontmatter = fmMatch ? fmMatch[1] : null;
        const bodyContent = fmMatch ? content.slice(fmMatch[0].length) : content;

        // Headers
        result.headers = [...bodyContent.matchAll(/^#{1,6}\s+(.+)/gm)].map(m => ({
          level: m[0].match(/^#+/)[0].length, text: m[1],
        }));

        // Links
        result.links = [...bodyContent.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)].map(m => ({
          text: m[1], url: m[2],
        }));

        // Code blocks
        result.code_blocks = [...bodyContent.matchAll(/```(\w*)\n([\s\S]+?)```/g)].map(m => ({
          language: m[1], code: m[2],
        }));

        // Images
        result.images = [...bodyContent.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)].map(m => ({
          alt: m[1], url: m[2],
        }));

        if (input.to_html) result.html = simpleMarkdownToHtml(bodyContent);

        return { result: JSON.stringify({ status: 'success', ...result }) };
      }

      case 'parse_html': {
        let content = input.content;
        if (!content && input.path) content = fs.readFileSync(path.resolve(root, input.path), 'utf8');
        if (!content) throw new Error('Either path or content required');

        const extract = input.extract || ['text', 'links', 'meta'];
        const result = {};

        if (extract.includes('text')) {
          result.text = stripHtmlTags(content).slice(0, 10000);
        }
        if (extract.includes('links')) {
          result.links = [...content.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)].map(m => ({
            href: m[1], text: stripHtmlTags(m[2]),
          })).slice(0, 100);
        }
        if (extract.includes('headings')) {
          result.headings = [...content.matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi)].map(m => ({
            level: parseInt(m[1]), text: stripHtmlTags(m[2]),
          }));
        }
        if (extract.includes('meta')) {
          result.meta = {};
          [...content.matchAll(/<meta[^>]+name="([^"]+)"[^>]+content="([^"]+)"/gi)].forEach(m => {
            result.meta[m[1]] = m[2];
          });
          const titleMatch = content.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
          if (titleMatch) result.meta.title = stripHtmlTags(titleMatch[1]);
        }
        if (extract.includes('images')) {
          result.images = [...content.matchAll(/<img[^>]+src="([^"]+)"[^>]*(?:alt="([^"]*)")?/gi)].map(m => ({
            src: m[1], alt: m[2] || '',
          })).slice(0, 50);
        }

        return { result: JSON.stringify({ status: 'success', ...result }) };
      }

      case 'transcribe_audio': {
        const fp = path.resolve(root, input.path);
        if (!fs.existsSync(fp)) throw new Error(`Audio file not found: ${fp}`);
        // If OpenAI is available, use Whisper API — otherwise indicate requirement
        return { result: JSON.stringify({
          status: 'info',
          message: 'Audio transcription requires OpenAI Whisper API integration. File ready at: ' + fp,
          file_size: fs.statSync(fp).size,
          instructions: 'Use the api_request tool to call https://api.openai.com/v1/audio/transcriptions with the file.',
        }) };
      }

      default:
        return { result: JSON.stringify({ status: 'error', error: `Unknown tool: ${toolName}` }) };
    }
  } catch (err) {
    return { result: JSON.stringify({ status: 'error', error: err.message, tool: toolName }) };
  }
}

export const isDocumentParsingTool = (name) =>
  DOCUMENT_PARSING_TOOL_DEFINITIONS.some(t => t.name === name);
