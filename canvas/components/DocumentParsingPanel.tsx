import React from 'react';
import ToolExecutionPanel, { ToolDefinition } from './ToolExecutionPanel';
import { PreviewContent } from './PanelPreview';

const TOOLS: ToolDefinition[] = [
  {
    id: 'parse_pdf',
    icon: '📕',
    label: 'Parse PDF',
    desc: 'Extract text, tables, images, and metadata from PDF files. OCR support for scanned documents.',
    color: 'red',
    fields: [
      { key: 'file', type: 'text', label: 'PDF File Path', placeholder: './document.pdf', required: true },
      { key: 'mode', type: 'select', label: 'Parse Mode', options: ['text','tables','images','metadata','all','ocr'], default: 'text' },
      { key: 'pages', type: 'text', label: 'Page Range', placeholder: '1-5 or 1,3,5 (empty for all)' },
      { key: 'format', type: 'select', label: 'Output Format', options: ['text','json','markdown','html','csv'], default: 'text' },
    ],
    buildInput: (v) => ({ file: v.file, mode: v.mode, pages: v.pages, format: v.format }),
  },
  {
    id: 'parse_docx',
    icon: '📘',
    label: 'Parse DOCX',
    desc: 'Extract content from Word documents including text, styles, tables, headers, footers, and images.',
    color: 'blue',
    fields: [
      { key: 'file', type: 'text', label: 'DOCX File Path', placeholder: './document.docx', required: true },
      { key: 'mode', type: 'select', label: 'Extract Mode', options: ['text','styled','tables','images','headers','all'], default: 'text' },
      { key: 'format', type: 'select', label: 'Output Format', options: ['text','json','markdown','html'], default: 'markdown' },
    ],
    buildInput: (v) => ({ file: v.file, mode: v.mode, format: v.format }),
  },
  {
    id: 'parse_csv',
    icon: '📊',
    label: 'Parse CSV / Excel',
    desc: 'Parse CSV/TSV/Excel files. Filter rows, select columns, aggregate data, and convert formats.',
    color: 'emerald',
    fields: [
      { key: 'file', type: 'text', label: 'File Path', placeholder: './data.csv', required: true },
      { key: 'delimiter', type: 'select', label: 'Delimiter', options: ['auto','comma','tab','pipe','semicolon'], default: 'auto' },
      { key: 'columns', type: 'text', label: 'Select Columns', placeholder: 'name,email,age (empty for all)' },
      { key: 'filter', type: 'text', label: 'Filter Expression', placeholder: 'age > 18 AND status = active' },
      { key: 'limit', type: 'number', label: 'Row Limit', placeholder: '100' },
      { key: 'format', type: 'select', label: 'Output Format', options: ['table','json','csv','markdown','html'], default: 'table' },
    ],
    buildInput: (v) => ({ file: v.file, delimiter: v.delimiter, columns: v.columns, filter: v.filter, limit: v.limit ? Number(v.limit) : undefined, format: v.format }),
  },
  {
    id: 'parse_json',
    icon: '🔖',
    label: 'Parse JSON / YAML',
    desc: 'Parse, validate, query (JSONPath/jq), transform, diff, and convert JSON/YAML/TOML files.',
    color: 'amber',
    fields: [
      { key: 'input', type: 'textarea', label: 'JSON / YAML Content or File Path', placeholder: '{"key": "value"} or ./data.json', required: true },
      { key: 'operation', type: 'select', label: 'Operation', options: ['parse','validate','query','transform','diff','format','convert','schema'], default: 'parse' },
      { key: 'query', type: 'text', label: 'JSONPath / jq Query', placeholder: '$.store.book[*].author' },
      { key: 'output_format', type: 'select', label: 'Output Format', options: ['json','yaml','toml','csv','table'], default: 'json' },
    ],
    buildInput: (v) => ({ input: v.input, operation: v.operation, query: v.query, output_format: v.output_format }),
  },
  {
    id: 'parse_markdown',
    icon: '📝',
    label: 'Parse Markdown',
    desc: 'Parse Markdown to AST, extract headings/links/images, convert to HTML/PDF, lint, and reformat.',
    color: 'violet',
    fields: [
      { key: 'input', type: 'textarea', label: 'Markdown Content or File Path', placeholder: '# Title\n\nContent here...', required: true },
      { key: 'operation', type: 'select', label: 'Operation', options: ['to_html','to_ast','extract_headings','extract_links','extract_images','lint','reformat','to_pdf'], default: 'to_html' },
      { key: 'format', type: 'select', label: 'Output Format', options: ['html','json','text','markdown'], default: 'html' },
    ],
    buildInput: (v) => ({ input: v.input, operation: v.operation, format: v.format }),
  },
  {
    id: 'parse_html',
    icon: '🌐',
    label: 'Parse HTML',
    desc: 'Parse HTML: extract text, links, tables, metadata, structured data; CSS selector queries; sanitize.',
    color: 'cyan',
    fields: [
      { key: 'input', type: 'textarea', label: 'HTML Content or URL', placeholder: '<html>...</html> or https://example.com', required: true },
      { key: 'operation', type: 'select', label: 'Operation', options: ['extract_text','extract_links','extract_tables','extract_meta','query_selector','sanitize','to_markdown','structured_data'], default: 'extract_text' },
      { key: 'selector', type: 'text', label: 'CSS Selector (for query)', placeholder: 'div.content > p' },
      { key: 'format', type: 'select', label: 'Output Format', options: ['text','json','html','markdown','table'], default: 'text' },
    ],
    buildInput: (v) => ({ input: v.input, operation: v.operation, selector: v.selector, format: v.format }),
  },
  {
    id: 'transcribe_audio',
    icon: '🎙️',
    label: 'Transcribe Audio',
    desc: 'Transcribe audio/video to text using Whisper. Supports timestamps, speaker diarization, translation.',
    color: 'pink',
    fields: [
      { key: 'file', type: 'text', label: 'Audio / Video File', placeholder: './recording.mp3', required: true },
      { key: 'model', type: 'select', label: 'Model', options: ['whisper-1','whisper-large','auto'], default: 'whisper-1' },
      { key: 'language', type: 'text', label: 'Language (ISO code)', placeholder: 'en (empty for auto-detect)' },
      { key: 'format', type: 'select', label: 'Output Format', options: ['text','srt','vtt','json','verbose_json'], default: 'text' },
      { key: 'timestamps', type: 'checkbox', label: 'Include Timestamps', default: true },
      { key: 'translate', type: 'checkbox', label: 'Translate to English', default: false },
    ],
    buildInput: (v) => ({ file: v.file, model: v.model, language: v.language, format: v.format, timestamps: v.timestamps === 'true' || v.timestamps === true, translate: v.translate === 'true' || v.translate === true }),
  },
];

interface Props {
  onClose?: () => void;
  onRunTool: (message: string) => void;
  onPreviewContent?: (c: PreviewContent) => void;
}

const DocumentParsingPanel: React.FC<Props> = ({ onClose, onRunTool, onPreviewContent }) => (
  <ToolExecutionPanel
    categoryTitle="Document Parsing"
    categorySubtitle="PDF, DOCX, CSV, JSON, HTML & Audio"
    categoryColor="red"
    tools={TOOLS}
    onClose={onClose}
    onRunTool={onRunTool}
    onPreviewContent={onPreviewContent}
  />
);

export default DocumentParsingPanel;
