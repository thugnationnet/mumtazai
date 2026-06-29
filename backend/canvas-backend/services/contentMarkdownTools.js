/**
 * CONTENT & MARKDOWN TOOLS — 5 tools
 * markdown_convert, markdown_validate, markdown_generate, markdown_toc, markdown_format
 */

import fs from 'fs';
import path from 'path';

export const CONTENT_MARKDOWN_TOOL_DEFINITIONS = [
  {
    name: 'markdown_convert',
    description: 'Convert Markdown to HTML, plain text, or structured JSON.',
    input_schema: {
      type: 'object',
      properties: {
        content:  { type: 'string', description: 'Markdown content to convert (or provide path)' },
        path:     { type: 'string', description: 'Path to Markdown file (alternative to content)' },
        to:       { type: 'string', enum: ['html', 'text', 'json', 'outline'],
                    description: 'Target format (default: html)' },
        output:   { type: 'string', description: 'Output file path (optional, returns inline if not set)' },
        options:  { type: 'object', description: 'Conversion options (e.g. {gfm: true, breaks: true})' },
      },
      required: [],
    },
  },
  {
    name: 'markdown_validate',
    description: 'Validate Markdown: check broken links, syntax errors, frontmatter, heading hierarchy.',
    input_schema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Markdown content or file path' },
        path:    { type: 'string', description: 'File or directory path to validate' },
        checks:  { type: 'array', items: { type: 'string', enum: ['links', 'syntax', 'frontmatter', 'headings', 'images'] },
                   description: 'Validation checks to run (default: all)' },
      },
      required: [],
    },
  },
  {
    name: 'markdown_generate',
    description: 'Generate Markdown from templates, data objects, code comments, or API specs.',
    input_schema: {
      type: 'object',
      properties: {
        template: { type: 'string', enum: ['readme', 'changelog', 'api_docs', 'blog_post', 'report', 'from_data'],
                    description: 'Template type' },
        data:     { type: 'object', description: 'Data to populate template' },
        output:   { type: 'string', description: 'Output file path (optional)' },
      },
      required: ['template'],
    },
  },
  {
    name: 'markdown_toc',
    description: 'Auto-generate or update a Table of Contents in a Markdown file.',
    input_schema: {
      type: 'object',
      properties: {
        content:   { type: 'string', description: 'Markdown content (or provide path)' },
        path:      { type: 'string', description: 'Markdown file path (in-place update if no output)' },
        output:    { type: 'string', description: 'Output file path' },
        min_depth: { type: 'number', description: 'Minimum heading depth (default: 1)' },
        max_depth: { type: 'number', description: 'Maximum heading depth (default: 3)' },
        insert:    { type: 'boolean', description: 'Insert TOC into the document (default: false — returns TOC only)' },
        marker:    { type: 'string', description: 'TOC insertion marker comment (default: "<!-- toc -->")' },
      },
      required: [],
    },
  },
  {
    name: 'markdown_format',
    description: 'Format and normalize Markdown: fix indentation, trailing spaces, blank lines, heading style.',
    input_schema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Markdown content to format' },
        path:    { type: 'string', description: 'File or directory of .md files to format' },
        output:  { type: 'string', description: 'Output path (overwrites input path if not set)' },
        rules:   { type: 'object', description: 'Formatting rules', properties: {
          trim_trailing:     { type: 'boolean' },
          normalize_headings:{ type: 'boolean' },
          max_blank_lines:   { type: 'number' },
          list_style:        { type: 'string', enum: ['-', '*', '+'] },
        }},
      },
      required: [],
    },
  },
];

// ============================================================================
// EXECUTORS
// ============================================================================

// Simple Markdown → HTML converter (no external deps needed)
function mdToHtml(md) {
  return md
    .replace(/^---[\s\S]+?---\n/, '')          // strip frontmatter
    .replace(/^### (.+)/gm, '<h3>$1</h3>')
    .replace(/^## (.+)/gm,  '<h2>$1</h2>')
    .replace(/^# (.+)/gm,   '<h1>$1</h1>')
    .replace(/^> (.+)/gm,   '<blockquote>$1</blockquote>')
    .replace(/^```(\w*)\n([\s\S]+?)```/gm, '<pre><code class="language-$1">$2</code></pre>')
    .replace(/`([^`]+)`/g,  '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g,  '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,  '<em>$1</em>')
    .replace(/_(.+?)_/g,    '<em>$1</em>')
    .replace(/~~(.+?)~~/g,  '<del>$1</del>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2"/>')
    .replace(/^[-*+] (.+)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, s => `<ul>\n${s}</ul>\n`)
    .replace(/^\d+\. (.+)/gm, '<li>$1</li>')
    .replace(/^---$/gm, '<hr/>')
    .replace(/\n\n(.+)/g, (_, p) => `\n\n<p>${p}</p>`)
    .trim();
}

function parseFrontmatter(md) {
  const m = md.match(/^---\n([\s\S]+?)\n---/);
  if (!m) return { fm: {}, body: md };
  const fm = {};
  for (const line of m[1].split('\n')) {
    const [k, ...v] = line.split(':');
    if (k) fm[k.trim()] = v.join(':').trim().replace(/^['"]|['"]$/g, '');
  }
  return { fm, body: md.slice(m[0].length + 1) };
}

function extractHeaders(md) {
  return [...md.matchAll(/^(#{1,6})\s+(.+)/gm)].map(m => ({
    level: m[1].length,
    text:  m[2].trim(),
    anchor: m[2].trim().toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/ /g, '-'),
  }));
}

function generateToc(headers, minDepth = 1, maxDepth = 3) {
  return headers
    .filter(h => h.level >= minDepth && h.level <= maxDepth)
    .map(h => `${'  '.repeat(h.level - minDepth)}- [${h.text}](#${h.anchor})`)
    .join('\n');
}

const TEMPLATES = {
  readme: (d) => `# ${d.name || 'Project Name'}

${d.description || 'A brief description of your project.'}

## Installation

\`\`\`bash
npm install ${d.package_name || d.name || 'package'}
\`\`\`

## Usage

\`\`\`${d.language || 'javascript'}
${d.usage_example || '// usage example here'}
\`\`\`

## API

${d.api || '<!-- Add API documentation here -->'}

## Contributing

Pull requests are welcome.

## License

${d.license || 'MIT'}
`,

  changelog: (d) => `# Changelog

All notable changes to this project will be documented in this file.

## [${d.version || 'Unreleased'}] - ${new Date().toISOString().split('T')[0]}

### Added
${(d.added || ['- Initial release']).map(i => `- ${i}`).join('\n')}

### Changed
${(d.changed || []).map(i => `- ${i}`).join('\n')}

### Fixed
${(d.fixed || []).map(i => `- ${i}`).join('\n')}
`,

  blog_post: (d) => `---
title: "${d.title || 'My Blog Post'}"
date: ${new Date().toISOString().split('T')[0]}
author: ${d.author || 'Author'}
tags: [${(d.tags || ['general']).join(', ')}]
---

# ${d.title || 'My Blog Post'}

${d.intro || 'Introduction paragraph here.'}

## ${d.section1 || 'First Section'}

${d.content1 || 'Content here.'}

## Conclusion

${d.conclusion || 'Conclusion here.'}
`,

  report: (d) => `# ${d.title || 'Report'}

**Date:** ${new Date().toLocaleDateString()}  
**Author:** ${d.author || 'Unknown'}  
**Status:** ${d.status || 'Draft'}

## Executive Summary

${d.summary || 'Summary here.'}

## Findings

${(d.findings || ['No findings yet']).map((f, i) => `${i + 1}. ${f}`).join('\n')}

## Recommendations

${(d.recommendations || []).map(r => `- ${r}`).join('\n')}
`,

  from_data: (d) => {
    let md = `# ${d.title || 'Generated Document'}\n\n`;
    for (const [k, v] of Object.entries(d)) {
      if (k === 'title') continue;
      if (Array.isArray(v)) {
        md += `## ${k}\n\n${v.map(i => `- ${i}`).join('\n')}\n\n`;
      } else if (typeof v === 'object') {
        md += `## ${k}\n\n${Object.entries(v).map(([kk, vv]) => `- **${kk}**: ${vv}`).join('\n')}\n\n`;
      } else {
        md += `## ${k}\n\n${v}\n\n`;
      }
    }
    return md;
  },
};

export async function executeContentMarkdownTool(toolName, input, ctx = {}) {
  const root = ctx.workspaceRoot || process.cwd();

  try {
    switch (toolName) {

      case 'markdown_convert': {
        let content = input.content;
        if (!content && input.path) content = fs.readFileSync(path.resolve(root, input.path), 'utf8');
        if (!content) throw new Error('Either content or path required');

        const to = input.to || 'html';
        let out;

        if (to === 'html') {
          out = mdToHtml(content);
        } else if (to === 'text') {
          out = content
            .replace(/^---[\s\S]+?---\n/, '')
            .replace(/```[\s\S]+?```/g, '')
            .replace(/[*_`~#>\-]/g, '')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
        } else if (to === 'json') {
          const { fm, body } = parseFrontmatter(content);
          out = JSON.stringify({ frontmatter: fm, headers: extractHeaders(body), content: body }, null, 2);
        } else if (to === 'outline') {
          const headers = extractHeaders(content);
          out = headers.map(h => `${'  '.repeat(h.level - 1)}${h.level}. ${h.text}`).join('\n');
        }

        if (input.output) {
          fs.mkdirSync(path.dirname(path.resolve(root, input.output)), { recursive: true });
          fs.writeFileSync(path.resolve(root, input.output), out);
        }
        return { result: JSON.stringify({ status: 'success', format: to, output: input.output || out.slice(0, 5000) }) };
      }

      case 'markdown_validate': {
        let content = input.content;
        if (!content && input.path) {
          const fp = path.resolve(root, input.path);
          content  = fs.existsSync(fp) && fs.statSync(fp).isFile() ? fs.readFileSync(fp, 'utf8') : null;
        }
        if (!content) throw new Error('Either content or path required');

        const checks  = input.checks || ['links', 'syntax', 'frontmatter', 'headings'];
        const issues  = [];

        if (checks.includes('frontmatter')) {
          const fm = content.match(/^---\n([\s\S]+?)\n---/);
          if (fm) {
            for (const line of fm[1].split('\n')) {
              if (line && !line.includes(':')) issues.push({ type: 'frontmatter', message: `Invalid frontmatter line: ${line}` });
            }
          }
        }
        if (checks.includes('headings')) {
          const headers = extractHeaders(content);
          let prevLevel = 0;
          for (const h of headers) {
            if (h.level > prevLevel + 1) issues.push({ type: 'headings', message: `Heading jump from h${prevLevel} to h${h.level}: "${h.text}"` });
            prevLevel = h.level;
          }
        }
        if (checks.includes('links')) {
          const links = [...content.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)];
          for (const [, text, url] of links) {
            if (url.startsWith('./') || url.startsWith('../')) {
              const fp = path.resolve(root, url);
              if (!fs.existsSync(fp)) issues.push({ type: 'link', message: `Broken relative link: ${url} in "${text}"` });
            }
          }
        }

        return { result: JSON.stringify({ status: 'success', valid: issues.length === 0, issues }) };
      }

      case 'markdown_generate': {
        const tpl  = TEMPLATES[input.template];
        if (!tpl) throw new Error(`Unknown template: ${input.template}`);
        const content = tpl(input.data || {});
        if (input.output) {
          fs.mkdirSync(path.dirname(path.resolve(root, input.output)), { recursive: true });
          fs.writeFileSync(path.resolve(root, input.output), content);
        }
        return { result: JSON.stringify({ status: 'success', template: input.template, content: input.output ? undefined : content, output: input.output }) };
      }

      case 'markdown_toc': {
        let content = input.content;
        if (!content && input.path) content = fs.readFileSync(path.resolve(root, input.path), 'utf8');
        if (!content) throw new Error('Either content or path required');

        const headers  = extractHeaders(content);
        const toc      = generateToc(headers, input.min_depth || 1, input.max_depth || 3);
        const tocBlock = `## Table of Contents\n\n${toc}\n`;

        if (input.insert) {
          const marker = input.marker || '<!-- toc -->';
          const newContent = content.includes(marker)
            ? content.replace(marker, `${marker}\n\n${tocBlock}`)
            : `${tocBlock}\n${content}`;
          const outPath = input.output ? path.resolve(root, input.output) : (input.path ? path.resolve(root, input.path) : null);
          if (outPath) fs.writeFileSync(outPath, newContent);
          return { result: JSON.stringify({ status: 'success', toc, inserted: true, path: outPath }) };
        }
        return { result: JSON.stringify({ status: 'success', toc, entry_count: headers.length }) };
      }

      case 'markdown_format': {
        let content = input.content;
        if (!content && input.path) {
          const fp = path.resolve(root, input.path);
          if (fs.existsSync(fp) && fs.statSync(fp).isFile()) content = fs.readFileSync(fp, 'utf8');
        }
        if (!content) throw new Error('Either content or path required');

        const rules = input.rules || {};
        let formatted = content;

        // Trim trailing whitespace
        if (rules.trim_trailing !== false) {
          formatted = formatted.split('\n').map(l => l.trimEnd()).join('\n');
        }
        // Max blank lines
        const maxBlanks = rules.max_blank_lines ?? 2;
        formatted = formatted.replace(/\n{3,}/g, '\n'.repeat(maxBlanks + 1));
        // Normalize list style
        if (rules.list_style) {
          formatted = formatted.replace(/^[*+] /gm, `${rules.list_style} `);
        }
        // Ensure single newline at end
        formatted = formatted.trimEnd() + '\n';

        const outPath = input.output
          ? path.resolve(root, input.output)
          : (input.path ? path.resolve(root, input.path) : null);
        if (outPath) fs.writeFileSync(outPath, formatted);

        return { result: JSON.stringify({ status: 'success', formatted: outPath ? undefined : formatted, path: outPath }) };
      }

      default:
        return { result: JSON.stringify({ status: 'error', error: `Unknown tool: ${toolName}` }) };
    }
  } catch (err) {
    return { result: JSON.stringify({ status: 'error', error: err.message, tool: toolName }) };
  }
}

export const isContentMarkdownTool = (name) => CONTENT_MARKDOWN_TOOL_DEFINITIONS.some(t => t.name === name);
