import React from 'react';
import ToolExecutionPanel, { ToolDefinition } from './ToolExecutionPanel';
import { PreviewContent } from './PanelPreview';

const TOOLS: ToolDefinition[] = [
  {
    id: 'markdown_convert',
    icon: '🔄',
    label: 'Convert Markdown',
    desc: 'Convert Markdown to HTML, PDF, DOCX, LaTeX, or plain text. Preserves formatting and code blocks.',
    color: 'amber',
    fields: [
      { key: 'input', type: 'textarea', label: 'Markdown Input', rows: 6, placeholder: '# Hello World\n\nSome **bold** text and `code`...' },
      { key: 'to', type: 'select', label: 'Convert To', options: ['html','pdf','docx','latex','rst','plain_text','confluence'], default: 'html' },
      { key: 'output', type: 'text', label: 'Output File (optional)', placeholder: './output.html or ./report.pdf' },
    ],
    buildInput: (v) => ({ content: v.input, to: v.to, output: v.output }),
  },
  {
    id: 'markdown_validate',
    icon: '✅',
    label: 'Validate Markdown',
    desc: 'Check for broken links, missing images, invalid syntax, heading structure issues, and linting errors.',
    color: 'green',
    fields: [
      { key: 'source', type: 'select', label: 'Source', options: ['file','inline'], default: 'inline' },
      { key: 'path_or_content', type: 'textarea', label: 'File Path or Markdown Content', rows: 4, placeholder: './README.md or paste markdown...' },
      { key: 'checks', type: 'select', label: 'Checks', options: ['all','links','images','headings','syntax'], default: 'all' },
    ],
    buildInput: (v) => ({ source: v.source, path_or_content: v.path_or_content, checks: v.checks }),
  },
  {
    id: 'markdown_generate',
    icon: '✨',
    label: 'Generate Markdown',
    desc: 'AI-generate README files, changelogs, contributor guides, API docs, or blog posts in Markdown.',
    color: 'purple',
    fields: [
      { key: 'type', type: 'select', label: 'Document Type', options: ['readme','changelog','contributing','api_docs','blog_post','release_notes','tutorial','license'], default: 'readme' },
      { key: 'topic', type: 'text', label: 'Topic / Project Name', placeholder: 'My awesome Node.js authentication library', required: true },
      { key: 'context', type: 'textarea', label: 'Additional Context', rows: 3, placeholder: 'Language: TypeScript, Features: JWT, OAuth2, Rate limiting...' },
    ],
    buildInput: (v) => ({ type: v.type, topic: v.topic, context: v.context }),
  },
  {
    id: 'markdown_toc',
    icon: '📑',
    label: 'Generate TOC',
    desc: 'Auto-generate or update a Table of Contents for a Markdown file. Supports anchor links.',
    color: 'cyan',
    fields: [
      { key: 'path_or_content', type: 'textarea', label: 'File Path or Markdown Content', rows: 4, placeholder: '# Heading 1\n## Heading 2\n### Heading 3' },
      { key: 'depth', type: 'select', label: 'Max Heading Depth', options: ['2','3','4','6'], default: '3' },
      { key: 'style', type: 'select', label: 'TOC Style', options: ['bullet','numbered'], default: 'bullet' },
    ],
    buildInput: (v) => ({ content: v.path_or_content, depth: Number(v.depth), style: v.style }),
  },
  {
    id: 'markdown_format',
    icon: '🎨',
    label: 'Format / Lint Markdown',
    desc: 'Auto-fix formatting: consistent heading levels, line lengths, blank lines, list styles, and code fences.',
    color: 'orange',
    fields: [
      { key: 'path_or_content', type: 'textarea', label: 'File Path or Markdown Content', rows: 5, placeholder: './docs/guide.md or paste markdown...' },
      { key: 'ruleset', type: 'select', label: 'Ruleset', options: ['github','commonmark','strict'], default: 'github' },
      { key: 'fix', type: 'select', label: 'Auto-fix Issues', options: ['yes','no'], default: 'yes' },
    ],
    buildInput: (v) => ({ content: v.path_or_content, ruleset: v.ruleset, fix: v.fix === 'yes' }),
  },
];

interface Props {
  onClose?: () => void;
  onRunTool: (message: string) => void;
  onPreviewContent?: (c: PreviewContent) => void;
}

const ContentMarkdownPanel: React.FC<Props> = ({ onClose, onRunTool, onPreviewContent }) => (
  <ToolExecutionPanel
    categoryTitle="Markdown & Content"
    categorySubtitle="Convert, Validate, Generate & Format"
    categoryColor="amber"
    tools={TOOLS}
    onClose={onClose}
    onRunTool={onRunTool}
    onPreviewContent={onPreviewContent}
  />
);

export default ContentMarkdownPanel;
