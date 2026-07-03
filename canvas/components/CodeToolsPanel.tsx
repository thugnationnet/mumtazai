import React from 'react';
import ToolExecutionPanel, { ToolDefinition } from './ToolExecutionPanel';
import { PreviewContent } from './PanelPreview';

const TOOLS: ToolDefinition[] = [
  {
    id: 'code_execute',
    icon: '▶️',
    label: 'Run Code',
    desc: 'Execute JavaScript, TypeScript, Python, Bash, Go, Rust, Java, C++, PHP, Ruby, Swift, Kotlin, C# and more.',
    color: 'emerald',
    fields: [
      { key: 'language', type: 'select', label: 'Language', options: ['javascript','typescript','python','bash','go','rust','java','cpp','php','ruby','swift','kotlin','csharp','sql'], default: 'javascript' },
      { key: 'code', type: 'textarea', label: 'Code', rows: 10, placeholder: 'console.log("Hello World");', required: true },
      { key: 'stdin', type: 'textarea', label: 'Standard Input (optional)', rows: 2, placeholder: 'Input data for the program...' },
    ],
    buildInput: (v) => ({ language: v.language, code: v.code, stdin: v.stdin }),
  },
  {
    id: 'code_format',
    icon: '✨',
    label: 'Format Code',
    desc: 'Auto-format code using Prettier (JS/TS/CSS/HTML), Black (Python), gofmt (Go), rustfmt (Rust), and more.',
    color: 'cyan',
    fields: [
      { key: 'language', type: 'select', label: 'Language', options: ['javascript','typescript','python','go','rust','java','cpp','css','html','json','yaml','sql','markdown'], default: 'javascript' },
      { key: 'code', type: 'textarea', label: 'Code to Format', rows: 10, placeholder: 'Paste unformatted code here...', required: true },
      { key: 'config', type: 'text', label: 'Config (optional)', placeholder: '{"tabWidth": 2, "singleQuote": true}' },
    ],
    buildInput: (v) => ({ language: v.language, code: v.code, config: v.config }),
  },
  {
    id: 'code_lint',
    icon: '🧹',
    label: 'Lint Code',
    desc: 'Run ESLint, pylint, golint, clippy, and other linters to find issues, warnings, and best practice violations.',
    color: 'amber',
    fields: [
      { key: 'language', type: 'select', label: 'Language', options: ['javascript','typescript','python','go','rust','java','cpp','css','html'], default: 'javascript' },
      { key: 'code', type: 'textarea', label: 'Code to Lint', rows: 10, placeholder: 'Paste code to analyze...', required: true },
      { key: 'ruleset', type: 'select', label: 'Ruleset', options: ['recommended','strict','airbnb','google'], default: 'recommended' },
    ],
    buildInput: (v) => ({ language: v.language, code: v.code, ruleset: v.ruleset }),
  },
  {
    id: 'code_analyze',
    icon: '📊',
    label: 'Analyze Code',
    desc: 'Deep analysis: complexity metrics, security scan, dependency audit, dead code detection, and more.',
    color: 'blue',
    fields: [
      { key: 'code', type: 'textarea', label: 'Code to Analyze', rows: 10, placeholder: 'Paste code for analysis...', required: true },
      { key: 'checks', type: 'select', label: 'Analysis Type', options: ['all','complexity','security','dependencies','dead_code','performance','todos'], default: 'all' },
      { key: 'language', type: 'select', label: 'Language', options: ['javascript','typescript','python','go','rust','java','cpp'], default: 'javascript' },
    ],
    buildInput: (v) => ({ code: v.code, checks: v.checks, language: v.language }),
  },
  {
    id: 'code_transform',
    icon: '🔄',
    label: 'Transform Code',
    desc: 'Minify, obfuscate, transpile, remove comments, sort imports, convert between languages.',
    color: 'purple',
    fields: [
      { key: 'operation', type: 'select', label: 'Operation', options: ['minify','obfuscate','transpile','remove_comments','sort_imports','add_types','convert_syntax'], default: 'minify' },
      { key: 'code', type: 'textarea', label: 'Code', rows: 10, placeholder: 'Paste code to transform...', required: true },
      { key: 'language', type: 'select', label: 'Language', options: ['javascript','typescript','python','go','rust','java','css','html'], default: 'javascript' },
      { key: 'target', type: 'text', label: 'Target Language (for transpile)', placeholder: 'typescript, python, etc.' },
    ],
    buildInput: (v) => ({ operation: v.operation, code: v.code, language: v.language, target: v.target }),
  },
];

interface Props {
  onClose?: () => void;
  onRunTool: (message: string) => void;
  onPreviewContent?: (c: PreviewContent) => void;
}

const CodeToolsPanel: React.FC<Props> = ({ onClose, onRunTool, onPreviewContent }) => (
  <ToolExecutionPanel
    categoryTitle="Code Tools"
    categorySubtitle="Execute, Format, Lint & Analyze"
    categoryColor="emerald"
    tools={TOOLS}
    onClose={onClose}
    onRunTool={onRunTool}
    onPreviewContent={onPreviewContent}
  />
);

export default CodeToolsPanel;
