import React from 'react';
import ToolExecutionPanel, { ToolDefinition } from './ToolExecutionPanel';
import { PreviewContent } from './PanelPreview';

const TOOLS: ToolDefinition[] = [
  {
    id: 'dev_git',
    icon: '🔀',
    label: 'Git Operations',
    desc: 'Run git commands: status, log, diff, branch, commit, stash, merge, rebase, cherry-pick, and more.',
    color: 'orange',
    fields: [
      { key: 'command', type: 'select', label: 'Git Command', options: ['status','log','diff','branch','checkout','commit','stash','merge','rebase','cherry-pick','reset','tag','remote','fetch','pull','push','blame','show','reflog'], default: 'status', required: true },
      { key: 'args', type: 'text', label: 'Arguments', placeholder: '--oneline -n 20' },
      { key: 'path', type: 'text', label: 'Working Directory', placeholder: './' },
    ],
    buildInput: (v) => ({ command: v.command, args: v.args, path: v.path }),
  },
  {
    id: 'dev_npm',
    icon: '📦',
    label: 'NPM / Package Manager',
    desc: 'Run npm/yarn/pnpm commands: install, update, audit, outdated, list, run scripts, publish.',
    color: 'red',
    fields: [
      { key: 'manager', type: 'select', label: 'Package Manager', options: ['npm','yarn','pnpm','bun'], default: 'npm' },
      { key: 'command', type: 'select', label: 'Command', options: ['install','update','audit','outdated','list','run','init','publish','uninstall','link','pack','version','info'], default: 'install', required: true },
      { key: 'args', type: 'text', label: 'Arguments', placeholder: 'package-name or script-name' },
      { key: 'path', type: 'text', label: 'Working Directory', placeholder: './' },
    ],
    buildInput: (v) => ({ manager: v.manager, command: v.command, args: v.args, path: v.path }),
  },
  {
    id: 'dev_docker',
    icon: '🐳',
    label: 'Docker CLI',
    desc: 'Run Docker commands: images, containers, volumes, networks, compose, build, run, exec, logs.',
    color: 'blue',
    fields: [
      { key: 'command', type: 'select', label: 'Docker Command', options: ['ps','images','run','exec','logs','build','pull','push','stop','rm','rmi','volume ls','network ls','compose up','compose down','compose ps','stats','inspect','system prune'], default: 'ps', required: true },
      { key: 'args', type: 'text', label: 'Arguments', placeholder: '--all --format table' },
      { key: 'path', type: 'text', label: 'Working Directory', placeholder: './' },
    ],
    buildInput: (v) => ({ command: v.command, args: v.args, path: v.path }),
  },
  {
    id: 'dev_debug',
    icon: '🐛',
    label: 'Debug & Profile',
    desc: 'Debug tools: log analysis, stack trace parser, memory profiler, CPU profiler, heap snapshot.',
    color: 'yellow',
    fields: [
      { key: 'tool', type: 'select', label: 'Debug Tool', options: ['log_analyze','stack_trace','memory_profile','cpu_profile','heap_snapshot','flame_graph','perf_benchmark'], default: 'log_analyze', required: true },
      { key: 'input', type: 'textarea', label: 'Input (log text, stack trace, file path)', placeholder: 'Paste log output, stack trace, or enter file path...', required: true },
      { key: 'format', type: 'select', label: 'Output Format', options: ['text','json','html','table'], default: 'text' },
    ],
    buildInput: (v) => ({ tool: v.tool, input: v.input, format: v.format }),
  },
  {
    id: 'dev_test',
    icon: '🧪',
    label: 'Test Runner',
    desc: 'Run tests: jest, mocha, vitest, playwright, cypress. Execute test suites and view results.',
    color: 'emerald',
    fields: [
      { key: 'framework', type: 'select', label: 'Test Framework', options: ['jest','mocha','vitest','playwright','cypress','pytest','go test','cargo test'], default: 'jest', required: true },
      { key: 'pattern', type: 'text', label: 'Test Pattern / File', placeholder: '**/*.test.ts or ./tests/auth.test.js' },
      { key: 'args', type: 'text', label: 'Extra Arguments', placeholder: '--coverage --verbose' },
      { key: 'path', type: 'text', label: 'Working Directory', placeholder: './' },
    ],
    buildInput: (v) => ({ framework: v.framework, pattern: v.pattern, args: v.args, path: v.path }),
  },
  {
    id: 'dev_search',
    icon: '🔍',
    label: 'Code Search',
    desc: 'Search code with grep, ripgrep, or AST-based search. Find usages, dead code, patterns.',
    color: 'cyan',
    fields: [
      { key: 'query', type: 'text', label: 'Search Query', placeholder: 'function name, regex pattern, etc.', required: true },
      { key: 'tool', type: 'select', label: 'Search Tool', options: ['grep','ripgrep','ast','regex','fuzzy'], default: 'ripgrep' },
      { key: 'path', type: 'text', label: 'Search Path', placeholder: './src' },
      { key: 'include', type: 'text', label: 'Include Pattern', placeholder: '*.ts,*.tsx' },
      { key: 'exclude', type: 'text', label: 'Exclude Pattern', placeholder: 'node_modules,dist' },
      { key: 'case_sensitive', type: 'checkbox', label: 'Case Sensitive', default: false },
    ],
    buildInput: (v) => ({ query: v.query, tool: v.tool, path: v.path, include: v.include, exclude: v.exclude, case_sensitive: v.case_sensitive === 'true' || v.case_sensitive === true }),
  },
  {
    id: 'dev_filesystem',
    icon: '📁',
    label: 'File System',
    desc: 'File operations: list, find, du, df, watch, tree, stat, chmod, symlink, and bulk rename.',
    color: 'amber',
    fields: [
      { key: 'operation', type: 'select', label: 'Operation', options: ['list','find','tree','stat','du','df','watch','chmod','symlink','rename','copy','move','count'], default: 'list', required: true },
      { key: 'path', type: 'text', label: 'Path', placeholder: './', required: true },
      { key: 'pattern', type: 'text', label: 'Pattern / Filter', placeholder: '*.tsx or >10MB' },
      { key: 'recursive', type: 'checkbox', label: 'Recursive', default: true },
    ],
    buildInput: (v) => ({ operation: v.operation, path: v.path, pattern: v.pattern, recursive: v.recursive === 'true' || v.recursive === true }),
  },
  {
    id: 'dev_intelligence',
    icon: '🧠',
    label: 'Code Intelligence',
    desc: 'AI-powered code analysis: complexity metrics, dependency graphs, architecture review, tech debt.',
    color: 'purple',
    fields: [
      { key: 'analysis', type: 'select', label: 'Analysis Type', options: ['complexity','dependencies','architecture','tech_debt','coverage_report','bundle_size','security_audit','performance_audit'], default: 'complexity', required: true },
      { key: 'path', type: 'text', label: 'Project / File Path', placeholder: './src', required: true },
      { key: 'depth', type: 'select', label: 'Analysis Depth', options: ['quick','standard','deep'], default: 'standard' },
      { key: 'format', type: 'select', label: 'Output Format', options: ['text','json','html','markdown'], default: 'markdown' },
    ],
    buildInput: (v) => ({ analysis: v.analysis, path: v.path, depth: v.depth, format: v.format }),
  },
];

interface Props {
  onClose?: () => void;
  onRunTool: (message: string) => void;
  onPreviewContent?: (c: PreviewContent) => void;
}

const DevToolsPanel: React.FC<Props> = ({ onClose, onRunTool, onPreviewContent }) => (
  <ToolExecutionPanel
    categoryTitle="Developer Tools"
    categorySubtitle="Git, NPM, Docker, Debug, Test & Search"
    categoryColor="orange"
    tools={TOOLS}
    onClose={onClose}
    onRunTool={onRunTool}
    onPreviewContent={onPreviewContent}
  />
);

export default DevToolsPanel;
