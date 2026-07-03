import React from 'react';
import ToolExecutionPanel, { ToolDefinition } from './ToolExecutionPanel';
import { PreviewContent } from './PanelPreview';

const TOOLS: ToolDefinition[] = [
  {
    id: 'canvas_list_files',
    icon: '📂',
    label: 'List Files',
    desc: 'List all files and directories in the current canvas project workspace.',
    color: 'teal',
    fields: [
      { key: 'path', type: 'text', label: 'Directory Path', placeholder: './ (project root)', default: './' },
      { key: 'recursive', type: 'checkbox', label: 'Recursive', default: false },
      { key: 'pattern', type: 'text', label: 'Filter Pattern', placeholder: '*.tsx, *.css' },
      { key: 'show_hidden', type: 'checkbox', label: 'Show Hidden Files', default: false },
    ],
    buildInput: (v) => ({ path: v.path || './', recursive: v.recursive === 'true' || v.recursive === true, pattern: v.pattern, show_hidden: v.show_hidden === 'true' || v.show_hidden === true }),
  },
  {
    id: 'canvas_read_file',
    icon: '📄',
    label: 'Read File',
    desc: 'Read the contents of a file in the canvas project. View source code, configs, and data.',
    color: 'blue',
    fields: [
      { key: 'path', type: 'text', label: 'File Path', placeholder: './src/App.tsx', required: true },
      { key: 'encoding', type: 'select', label: 'Encoding', options: ['utf8','base64','hex','binary'], default: 'utf8' },
      { key: 'start_line', type: 'number', label: 'Start Line (optional)', placeholder: '1' },
      { key: 'end_line', type: 'number', label: 'End Line (optional)', placeholder: '100' },
    ],
    buildInput: (v) => ({ path: v.path, encoding: v.encoding, start_line: v.start_line ? Number(v.start_line) : undefined, end_line: v.end_line ? Number(v.end_line) : undefined }),
  },
  {
    id: 'canvas_write_file',
    icon: '✏️',
    label: 'Write File',
    desc: 'Create or overwrite a file in the canvas project. Write code, configs, data, or content.',
    color: 'emerald',
    fields: [
      { key: 'path', type: 'text', label: 'File Path', placeholder: './src/utils/helper.ts', required: true },
      { key: 'content', type: 'textarea', label: 'File Content', placeholder: 'File content here...', required: true },
      { key: 'encoding', type: 'select', label: 'Encoding', options: ['utf8','base64'], default: 'utf8' },
      { key: 'create_dirs', type: 'checkbox', label: 'Create Parent Directories', default: true },
    ],
    buildInput: (v) => ({ path: v.path, content: v.content, encoding: v.encoding, create_dirs: v.create_dirs === 'true' || v.create_dirs === true }),
  },
  {
    id: 'canvas_delete_file',
    icon: '🗑️',
    label: 'Delete File',
    desc: 'Delete a file or empty directory from the canvas project workspace.',
    color: 'red',
    fields: [
      { key: 'path', type: 'text', label: 'File / Directory Path', placeholder: './src/old-file.ts', required: true },
      { key: 'recursive', type: 'checkbox', label: 'Recursive (for directories)', default: false },
    ],
    buildInput: (v) => ({ path: v.path, recursive: v.recursive === 'true' || v.recursive === true }),
  },
  {
    id: 'canvas_rename_file',
    icon: '📝',
    label: 'Rename / Move',
    desc: 'Rename or move a file within the canvas project workspace.',
    color: 'amber',
    fields: [
      { key: 'old_path', type: 'text', label: 'Current Path', placeholder: './src/OldName.tsx', required: true },
      { key: 'new_path', type: 'text', label: 'New Path', placeholder: './src/NewName.tsx', required: true },
      { key: 'overwrite', type: 'checkbox', label: 'Overwrite if Exists', default: false },
    ],
    buildInput: (v) => ({ old_path: v.old_path, new_path: v.new_path, overwrite: v.overwrite === 'true' || v.overwrite === true }),
  },
  {
    id: 'canvas_get_state',
    icon: '📊',
    label: 'Project State',
    desc: 'Get the current state of the canvas project: file count, size, dependencies, build status.',
    color: 'cyan',
    fields: [
      { key: 'include', type: 'select', label: 'Include', options: ['summary','files','dependencies','build_status','git_status','all'], default: 'summary' },
      { key: 'format', type: 'select', label: 'Output Format', options: ['json','markdown','text','table'], default: 'markdown' },
    ],
    buildInput: (v) => ({ include: v.include, format: v.format }),
  },
  {
    id: 'canvas_create_project',
    icon: '🚀',
    label: 'Create Project',
    desc: 'Scaffold a new canvas project from a template: React, Vue, Svelte, vanilla HTML, or custom.',
    color: 'purple',
    fields: [
      { key: 'name', type: 'text', label: 'Project Name', placeholder: 'my-project', required: true },
      { key: 'template', type: 'select', label: 'Template', options: ['react-ts','react-js','vue-ts','svelte','vanilla-html','next','astro','custom'], default: 'react-ts', required: true },
      { key: 'styling', type: 'select', label: 'Styling', options: ['tailwind','css','scss','styled-components','none'], default: 'tailwind' },
      { key: 'features', type: 'text', label: 'Features (comma-separated)', placeholder: 'router,state,testing,linting' },
      { key: 'description', type: 'text', label: 'Description', placeholder: 'A brief project description' },
    ],
    buildInput: (v) => ({ name: v.name, template: v.template, styling: v.styling, features: v.features, description: v.description }),
  },
];

interface Props {
  onClose?: () => void;
  onRunTool: (message: string) => void;
  onPreviewContent?: (c: PreviewContent) => void;
}

const CanvasToolsPanel: React.FC<Props> = ({ onClose, onRunTool, onPreviewContent }) => (
  <ToolExecutionPanel
    categoryTitle="Canvas Tools"
    categorySubtitle="Read, Write & Manage Project Files"
    categoryColor="teal"
    tools={TOOLS}
    onClose={onClose}
    onRunTool={onRunTool}
    onPreviewContent={onPreviewContent}
  />
);

export default CanvasToolsPanel;
