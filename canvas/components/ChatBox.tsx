
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, ToolEvent } from '../types';
import { speak } from '@shared/api';
import hljs from 'highlight.js';
import '../highlight-theme.css';

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  timestamp: number;
}

interface ChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isGenerating: boolean;
  onNewChat?: () => void;
  onClose?: () => void;
  onLoadSession?: (session: ChatSession) => void;
  streamingText?: string;
  toolEvents?: ToolEvent[];
  selectedLanguage?: string;
  onLanguageChange?: (language: string) => void;
  mode?: 'agent' | 'chat';
  onModeChange?: (mode: 'agent' | 'chat') => void;
  onStopGeneration?: () => void;
  onRegenerateMessage?: (messageIndex: number) => void;
  onEditMessage?: (messageIndex: number, newText: string) => void;
  onPinMessage?: (messageIndex: number) => void;
  onFavoriteMessage?: (messageIndex: number) => void;
  onArchiveConversation?: () => void;
  onExportConversation?: (format: 'markdown' | 'json' | 'pdf' | 'image') => void;
  fontSize?: number;
  onFontSizeChange?: (size: number) => void;
  temperature?: number;
  onTemperatureChange?: (temp: number) => void;
  maxTokens?: number;
  onMaxTokensChange?: (tokens: number) => void;
  focusMode?: boolean;
  onFocusModeToggle?: () => void;
  rateLimitInfo?: { remaining: number; limit: number; resetAt?: number };
}

// 🎯 Tool icon map — 130+ tool-to-emoji mappings for rich ToolEventBubble display
const toolIcons: Record<string, string> = {
  // File management
  write_file: '📝', read_file: '📖', delete_file: '🗑️', list_files: '📁',
  create_file: '📄', modify_file: '✏️', rename_file: '🏷️', move_file: '📦',
  copy_file: '📋', open_file: '📂', list_folders: '📂', get_project_tree: '🌳',
  find_file_by_name: '🔎', file_search: '🔍', list_directory: '📁',
  file_watch: '👁️', sync_files: '🔄', file_hash: '#️⃣', file_diff: '↔️', file_permissions: '🔐',
  bulk_file_operations: '📦', bulk_upload_handler: '📤', change_file_extension: '🏷️',
  // Search & navigation
  search_in_files: '🔍', run_command: '⚡', get_symbols: '🔣', get_references: '🔗', rename_symbol: '🏷️',
  // Deploy & web
  deploy_project: '🚀', deploy_static: '🚀', sdk_generate: '🛠️',
  web_search: '🌐', fetch_url: '📡', fetch_webpage: '📡', http_request: '📡',
  web_scrape: '🕷️', web_screenshot: '📸', web_analyze: '📊', web_scaffold: '🏗️',
  web_optimize: '⚡', web_transform: '🔄', web_lighthouse: '💡',
  // Core utility
  execute_code: '▶️', calculate: '🧮', get_current_time: '🕐', get_weather: '🌤️',
  generate_video: '🎬', generate_image: '🖼️', generate_speech: '🔊',
  // Image tools
  image_ai: '🤖', image_analyze: '🔬', image_background: '🎨', image_batch: '📦',
  image_compose: '🎭', image_convert: '💱', image_create: '🖼️', image_export: '📤',
  image_face: '👤', image_filter: '🎨', image_merge: '🔀', image_ocr: '📝',
  image_optimize: '⚡', image_transform: '🔄',
  // Video tools
  video_transform: '🔄', video_convert: '💱', video_analyze: '📊', video_filter: '🎨',
  video_ai: '🤖', video_overlay: '📐', video_audio: '🔊', video_batch: '📦',
  video_trim: '✂️', video_highlights: '⭐', video_resize: '📐', video_subtitles: '💬',
  video_style: '🎭', video_faces: '👤', video_moderate: '🛡️', video_export: '📤',
  transcribe_audio: '🎙️',
  // Archive tools
  archive_create: '📦', archive_extract: '📤', archive_inspect: '🔍', archive_search: '🔎',
  archive_core: '📦', archive_edit: '✏️', archive_structure: '🏗️', archive_security: '🔒',
  archive_bulk: '📥', archive_convert: '🔀', archive_intelligence: '🧠', archive_deploy: '🚀',
  create_zip: '📦', extract_zip: '📤', create_tar: '📦', extract_tar: '📤',
  zip_files: '🗜️', unzip_files: '📦',
  // Code intelligence
  code_edit: '✏️', code_navigate: '🧭', code_symbols: '🔣', code_git: '📊',
  code_deps: '📦', code_lint: '🧹', code_test: '🧪', code_refactor: '♻️',
  code_metrics: '📏', code_debug: '🐛', code_docs: '📖', code_scaffold: '🏗️',
  debug_code: '🐛', format_code: '✨', lint_code: '🧹', run_script: '▶️', summarize_file: '📋',
  // Git
  git_status: '📊', git_commit: '💾', git_push: '📤', git_pull: '📥',
  git_branch: '🌿', git_diff: '↔️', git_log: '📜', git_stash: '📦', git_checkout: '🔀',
  // Editor
  editor_select: '🖍️', editor_cursor: '📍', editor_selection: '🖍️',
  editor_insert: '📥', editor_context: '🧩',
  // Backend
  backend_ratelimit: '⏱️', backend_test: '🧪', backend_upload: '📤',
  backend_webhook: '🔗', error_middleware: '🛡️',
  // Database
  db_query: '🗄️', db_schema: '📐', db_migrate: '🔄', db_analyze: '📊',
  db_backup: '💾', db_connect: '🔌',
  // API
  api_request: '📡', api_mock: '🎭', api_document: '📄', api_test: '🧪',
  api_transform: '🔄', api_monitor: '📈', api_rate_limit: '⏱️', api_auth: '🔐',
  // LLM & ML
  llm_chat: '💬', llm_embed: '🧠', llm_finetune: '🎯', llm_prompt: '✍️',
  ml_train: '🏋️', ml_predict: '🔮', ml_data_prep: '🧪', ml_pipeline: '⚙️',
  // Security
  crypto_hash: '#️⃣', crypto_encrypt: '🔒', crypto_sign: '✋', crypto_random: '🎲',
  scan_secrets: '🕵️', scan_malware: '🛡️', security_headers: '🧱', cert_tools: '📃',
  scan_vulnerabilities: '🛡️', policy_enforce: '📜', threat_model: '🎯', incident_response: '🚨',
  sec_pen_test: '🗡️', sec_compliance_check: '✅', sec_auth_audit: '🔑', sec_network_scan: '🌐',
  sec_dependency_audit: '📦', sec_waf_rules: '🧱', sec_forensics: '🔬', sec_crypto_audit: '🔐',
  sec_container_scan: '🐳', sec_api_security: '🔌', sec_siem: '📊', sec_zero_trust: '🚫',
  sec_devsecops: '⚙️', sec_data_protection: '🛡️', sec_access_review: '👁️',
  log_parse: '📋', file_compress: '🗜️',
  // Advanced AI
  llm_compare: '⚖️', llm_cache: '📦', llm_cost_optimize: '💰', llm_evaluate: '📊',
  llm_guardrail: '🛡️', llm_router: '🔀', prompt_template: '📜',
  agent_chain: '🔗', agent_delegate: '📋', agent_reflect: '🪞', agent_spawn: '🚀',
  model_benchmark: '🏆',
  // Data science
  correlation_matrix: '🔢', hypothesis_test: '🧪', outlier_detect: '🎯',
  time_series: '📈', data_sample: '🎲', data_clean: '🧹', data_profile: '📊',
  data_visualize: '📉', feature_engineer: '🔧', model_compare: '⚖️',
  // Geo/Location
  geo_geocode: '📍', geo_route: '🗺️', geo_distance: '📏', geo_fence: '🏗️',
  geo_timezone: '🕐', geo_elevation: '⛰️', geo_place: '🏙️', geo_midpoint: '⊕',
  geo_convert: '🔄', geo_heatmap: '🌡️',
  // Cloud control
  cloud_deploy: '🚀', cloud_scale: '📈', cloud_logs: '📜', cloud_secrets: '🔐',
  cloud_cost: '💰', cloud_monitor: '📟', cloud_backup: '💾', cloud_network: '🌐',
  cloud_iam: '👤', cloud_registry: '📦', cloud_queue: '📨', cloud_cdn: '⚡',
  // DevOps
  docker_build: '🐳', docker_run: '🐳', docker_compose: '🐳',
  ci_pipeline: '🔄', cloud_dns: '🌐', cloud_ssl: '🔒', cloud_storage: '☁️',
  dev_docker: '🐳', dev_npm: '📦', dev_debug: '🐛', dev_filesystem: '📂',
  dev_git: '📊', dev_intelligence: '🧠', dev_search: '🔍', dev_test: '🧪',
  // Collaboration
  comment_thread: '💬', conflict_resolve: '🤝', live_session: '🟢',
  notification_send: '🔔', presence_track: '🟢', review_comment: '💬',
  role_assign: '👤', share_snapshot: '📸', team_invite: '👥',
  // Communication
  email_send: '📧', notification_push: '🔔', sms_send: '📱',
  // Workflow
  plan_workflow: '📋', workflow_create: '🔧', workflow_execute: '▶️',
  workflow_run: '▶️', workflow_schedule: '📅', workflow_template: '📝',
  workflow_webhook: '🔗', workflow_variables: '🔧', workflow_audit: '📜',
  workflow_rollback: '⏪', workflow_optimize: '⚡', workflow_visualize: '🗺️',
  // Knowledge Graph
  kg_create: '🧠', kg_query: '🔍', kg_reason: '🤔', kg_visualize: '🗺️',
  kg_export: '📤', kg_embed: '🧠', kg_cluster: '🎯', kg_history: '📅',
  kg_merge: '🔀',
  // Analytics & Business
  campaign_generate: '📣', competitor_track: '🏁', customer_segment: '👥',
  growth_analyze: '📈', lead_enrich: '💎', nps_survey: '⭐', pricing_simulate: '💰',
  revenue_forecast: '📈', metrics_aggregate: '📈',
  // Markdown
  markdown_convert: '📝', markdown_extract: '🔍', markdown_format: '✨',
  markdown_generate: '📝', markdown_merge: '📏', markdown_template: '📄',
  markdown_toc: '📑', markdown_transform: '♻️', markdown_validate: '✅',
  // Task management
  cron_schedule: '⏰', event_trigger: '⚡', retry_policy: '🔄',
  task_assign: '📋', task_queue: '📨',
  // Testing
  test_coverage_report: '📊', test_e2e: '🧪', test_load: '🏋️',
  test_mock_server: '🎭', test_snapshot: '📸',
  // Monitoring
  monitor_health: '💚', monitor_logs: '📜', monitor_performance: '⚡',
  // Parsing
  parse_csv: '📊', parse_docx: '📄', parse_html: '🌐',
  parse_json: '📋', parse_markdown: '📝', parse_pdf: '📕',
  // Data processing
  data_diff: '↔️', data_merge: '🔀', data_pipeline: '⚙️',
  data_transform: '🔄', data_validate: '✅',
  // Webhook
  webhook_dispatch: '📤', webhook_listen: '🔔', telemetry_send: '📡',
  // Context & Memory
  save_context: '💾', recall_context: '🧠', list_context_keys: '🔑',
  // JSON tools
  read_json: '📋', write_json: '📝',
  // Other
  diff_merge: '↔️', shared_snippet: '📋', think_step_by_step: '🤔',
  replace_range: '✏️', update_file: '✏️', agent_plan: '📋', agent_context: '🧩',
  activity_log: '📝', access_request: '🔐',
  // Canvas workspace tools
  canvas_read_file: '📖', canvas_write_file: '📝', canvas_list_files: '📁',
  canvas_delete_file: '🗑️', canvas_rename_file: '🏷️', canvas_get_state: '🗺️',
  canvas_switch_file: '🔀', canvas_create_project: '🏗️',
  // Code intelligence (new aliases)
  code_execute: '▶️', code_format: '✨', code_analyze: '📊', code_transform: '🔄',
  // Communication (new aliases)
  send_webhook: '🔗', send_push: '🔔', send_email: '📧', send_sms: '📱',
  // Docker / Deploy
  deploy_generate: '⚙️', docker_manage: '🗂️',
  // Backend scaffolding
  backend_scaffold: '🏗️', backend_route: '🔀', backend_middleware: '🛡️', backend_schema: '📐',
  // Editor bridge
  editor_action: '⚡', editor_command: '⚡',
};

// Tool event visual bubble with expandable results
const ToolEventBubble: React.FC<{ event: ToolEvent }> = ({ event }) => {
  const [expanded, setExpanded] = useState(false);

  if (event.type === 'tool_start') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/5 border border-indigo-500/20 rounded-lg text-[11px] text-indigo-600 dark:text-indigo-400/80 animate-pulse">
        <span>{toolIcons[event.tool || ''] || '🔧'}</span>
        <span className="font-bold uppercase tracking-wider">{event.tool?.replace(/_/g, ' ')}</span>
        {event.input?.path && <span className="text-gray-500 font-mono truncate ml-1">→ {event.input.path}</span>}
      </div>
    );
  }

  if (event.type === 'tool_result') {
    return (
      <div
        onClick={() => setExpanded(!expanded)}
        className={`px-3 py-1.5 border rounded-lg text-[11px] cursor-pointer transition-all ${event.success
          ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400/80'
          : 'bg-red-500/5 border-red-500/20 text-red-400/80'
          }`}
      >
        <div className="flex items-center gap-2">
          <span>{event.success ? '✓' : '✕'}</span>
          <span>{toolIcons[event.tool || ''] || '🔧'}</span>
          <span className="font-bold uppercase tracking-wider">{event.tool?.replace(/_/g, ' ')}</span>
          {event.summary && <span className="text-gray-500 truncate ml-1">{event.summary}</span>}
        </div>
      </div>
    );
  }

  if (event.type === 'file_write') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-500/5 border border-violet-500/20 rounded-lg text-[11px] text-violet-400/80">
        <span>📝</span>
        <span className="font-bold">Wrote</span>
        <span className="font-mono text-violet-300">{event.path}</span>
      </div>
    );
  }

  if (event.type === 'file_delete') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/5 border border-red-500/20 rounded-lg text-[11px] text-red-400/80">
        <span>🗑️</span>
        <span className="font-bold">Deleted</span>
        <span className="font-mono text-red-300">{event.path}</span>
      </div>
    );
  }

  if (event.type === 'command_output') {
    return (
      <div className="px-3 py-2 bg-slate-100 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700/50 rounded-lg text-[11px]">
        <div className="flex items-center gap-2 text-yellow-400/80 mb-1">
          <span>⚡</span><span className="font-bold uppercase tracking-wider">Command Output</span>
        </div>
        <pre className="text-slate-500 dark:text-slate-400 font-mono text-[10px] max-h-20 overflow-auto whitespace-pre-wrap">{event.content?.slice(0, 500)}</pre>
      </div>
    );
  }

  if (event.type === 'image_result') {
    const src = event.imageUrl || event.dataUrl || '';
    return (
      <div className="px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-[10px]">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-indigo-400">🖼️</span>
          <span className="text-indigo-300 font-medium">Image Generated</span>
          {event.width && event.height && (
            <span className="text-gray-500">{event.width}×{event.height}</span>
          )}
          {event.format && <span className="text-gray-600 uppercase">{event.format}</span>}
        </div>
        {src && (
          <a href={src} target="_blank" rel="noopener noreferrer" download>
            <img
              src={src}
              alt="Generated"
              className="max-w-[280px] max-h-[200px] rounded border border-slate-300 dark:border-slate-700 object-contain cursor-pointer hover:border-indigo-400 transition-colors"
            />
          </a>
        )}
        {event.imageUrls && event.imageUrls.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {event.imageUrls.map((u: string, i: number) => (
              <a key={i} href={u} target="_blank" rel="noopener noreferrer" download>
                <img src={u} alt={`Batch ${i + 1}`} className="w-16 h-16 rounded border border-slate-300 dark:border-slate-700 object-cover hover:border-indigo-400 transition-colors" />
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }
  return null;
};

// Render inline markdown: bold, italic, bold+italic, inline code
const renderInline = (line: string, kp: string): React.ReactNode => {
  const result: React.ReactNode[] = [];
  const regex = /(\*\*\*[^*\n]+?\*\*\*|\*\*[^*\n]+?\*\*|\*[^*\n]+?\*|_[^_\n]+?_|`[^`\n]+?`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let idx = 0;
  while ((match = regex.exec(line)) !== null) {
    if (match.index > last) result.push(<span key={`${kp}t${idx++}`}>{line.slice(last, match.index)}</span>);
    const m = match[0];
    if (m.startsWith('***')) result.push(<strong key={`${kp}bi${idx++}`}><em>{m.slice(3, -3)}</em></strong>);
    else if (m.startsWith('**')) result.push(<strong key={`${kp}b${idx++}`} className="text-slate-900 dark:text-white font-semibold">{m.slice(2, -2)}</strong>);
    else if (m.startsWith('*') || (m.startsWith('_') && m.endsWith('_'))) result.push(<em key={`${kp}e${idx++}`} className="italic text-slate-800 dark:text-slate-200">{m.slice(1, -1)}</em>);
    else if (m.startsWith('`')) result.push(<code key={`${kp}c${idx++}`} className="px-1 py-0.5 bg-slate-400 dark:bg-black/50 rounded text-cyan-300 font-mono text-[10px]">{m.slice(1, -1)}</code>);
    last = match.index + m.length;
  }
  if (last < line.length) result.push(<span key={`${kp}tail`}>{line.slice(last)}</span>);
  return <>{result}</>;
};

// Full markdown renderer: headings, lists, code blocks, blockquotes, hr, inline formatting
const renderMarkdown = (text: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  const lines = text.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim() || 'plaintext';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) { codeLines.push(lines[i]); i++; }
      const code = codeLines.join('\n');
      let highlighted = code;
      try {
        if (hljs.getLanguage(lang)) highlighted = hljs.highlight(code, { language: lang }).value;
        else highlighted = hljs.highlightAuto(code).value;
      } catch { try { highlighted = hljs.highlightAuto(code).value; } catch { highlighted = code; } }
      parts.push(
        <pre key={parts.length} className="my-2 p-3 bg-slate-400 dark:bg-black/60 rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto">
          <code className="text-[11px] font-mono" dangerouslySetInnerHTML={{ __html: highlighted }} />
        </pre>
      );
      i++; continue;
    }

    // Headings
    const h1 = line.match(/^#\s+(.+)$/);
    const h2 = line.match(/^##\s+(.+)$/);
    const h3 = line.match(/^###\s+(.+)$/);
    if (h3) { parts.push(<div key={parts.length} className="text-xs font-semibold text-slate-900 dark:text-white mt-2 mb-0.5">{renderInline(h3[1], `h3-${parts.length}-`)}</div>); i++; continue; }
    if (h2) { parts.push(<div key={parts.length} className="text-xs font-bold text-slate-900 dark:text-white mt-3 mb-1 border-b border-slate-300 dark:border-slate-700 pb-0.5">{renderInline(h2[1], `h2-${parts.length}-`)}</div>); i++; continue; }
    if (h1) { parts.push(<div key={parts.length} className="text-sm font-bold text-slate-900 dark:text-white mt-3 mb-1">{renderInline(h1[1], `h1-${parts.length}-`)}</div>); i++; continue; }

    // Horizontal rule
    if (/^(---+|\*\*\*+|___+)$/.test(line.trim())) {
      parts.push(<hr key={parts.length} className="my-2 border-slate-300 dark:border-slate-700" />); i++; continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      parts.push(
        <div key={parts.length} className="border-l-2 border-indigo-500/50 pl-3 my-1 text-slate-500 dark:text-slate-400 italic">
          {renderInline(line.slice(2), `bq-${parts.length}-`)}
        </div>
      ); i++; continue;
    }

    // Unordered list
    const ul = line.match(/^(\s*)[-*+]\s+(.+)$/);
    if (ul) {
      const depth = Math.floor(ul[1].length / 2);
      parts.push(
        <div key={parts.length} className="flex items-start gap-1.5 my-0.5" style={{ paddingLeft: `${depth * 12 + 4}px` }}>
          <span className="text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5">•</span>
          <span>{renderInline(ul[2], `ul-${parts.length}-`)}</span>
        </div>
      ); i++; continue;
    }

    // Ordered list
    const ol = line.match(/^(\s*)(\d+)\.\s+(.+)$/);
    if (ol) {
      const depth = Math.floor(ol[1].length / 2);
      parts.push(
        <div key={parts.length} className="flex items-start gap-1.5 my-0.5" style={{ paddingLeft: `${depth * 12 + 4}px` }}>
          <span className="text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5 min-w-[14px]">{ol[2]}.</span>
          <span>{renderInline(ol[3], `ol-${parts.length}-`)}</span>
        </div>
      ); i++; continue;
    }

    // Empty line → spacer
    if (line.trim() === '') {
      if (parts.length > 0) parts.push(<div key={parts.length} className="h-1.5" />);
      i++; continue;
    }

    // Regular text with inline formatting
    parts.push(<span key={parts.length}>{renderInline(line, `p-${parts.length}-`)}</span>);
    const nextLine = lines[i + 1];
    const nextIsBlock = !nextLine || nextLine.trim() === '' ||
      nextLine.match(/^#{1,3}\s/) || nextLine.match(/^\s*[-*+]\s/) ||
      nextLine.match(/^\s*\d+\.\s/) || nextLine.startsWith('```') ||
      nextLine.startsWith('> ') || /^(---+|\*\*\*+|___+)$/.test(nextLine.trim());
    if (i < lines.length - 1 && !nextIsBlock) parts.push(<br key={`br-${parts.length}`} />);
    i++;
  }

  return parts;
};

const LANGUAGE_OPTIONS = [
  { id: 'auto', name: 'Auto-Detect', icon: '🔍' },
  { id: 'html', name: 'HTML', icon: '🌐' },
  { id: 'react', name: 'React/TSX', icon: '⚛️' },
  { id: 'typescript', name: 'TypeScript', icon: '🔷' },
  { id: 'javascript', name: 'JavaScript', icon: '📜' },
  { id: 'python', name: 'Python', icon: '🐍' },
];

const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  onSendMessage,
  isGenerating,
  onNewChat,
  onClose,
  onLoadSession,
  streamingText,
  toolEvents: liveToolEvents,
  selectedLanguage = 'auto',
  onLanguageChange,
  mode = 'agent',
  onModeChange,
  onStopGeneration,
  onRegenerateMessage,
  onEditMessage,
  onPinMessage,
  onFavoriteMessage,
  onArchiveConversation,
  onExportConversation,
  fontSize = 12,
  onFontSizeChange,
  temperature,
  onTemperatureChange,
  maxTokens,
  onMaxTokensChange,
  focusMode,
  onFocusModeToggle,
  rateLimitInfo,
}) => {
  const [input, setInput] = useState('');
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [editingMsgIdx, setEditingMsgIdx] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd+Enter to send from anywhere
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && input.trim() && !isGenerating) {
        e.preventDefault();
        onSendMessage(input);
        setInput('');
      }
      // Escape to stop generation or cancel edit
      if (e.key === 'Escape') {
        if (isGenerating && onStopGeneration) {
          e.preventDefault();
          onStopGeneration();
        } else if (editingMsgIdx !== null) {
          e.preventDefault();
          setEditingMsgIdx(null);
          setEditText('');
        }
      }
      // Ctrl/Cmd+F to search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setShowSearch(s => !s);
      }
      // Ctrl/Cmd+Shift+N for new chat
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        onNewChat?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [input, isGenerating, onStopGeneration, editingMsgIdx, onNewChat, onSendMessage]);

  // Save current chat to history when messages change
  useEffect(() => {
    if (messages.length > 0) {
      const existingSessionIndex = chatSessions.findIndex(s =>
        s.messages.length > 0 && s.messages[0].timestamp === messages[0]?.timestamp
      );

      if (existingSessionIndex === -1 && messages.length > 0) {
        // New session
        const newSession: ChatSession = {
          id: Date.now().toString(),
          title: messages[0]?.text.slice(0, 30) + '...' || 'New Chat',
          messages: [...messages],
          timestamp: Date.now()
        };
        setChatSessions(prev => [newSession, ...prev].slice(0, 10)); // Keep last 10
      }
    }
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Filter messages by search
  const filteredMessages = searchQuery.trim()
    ? messages.filter(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  // Start editing a message
  const startEditMessage = (idx: number) => {
    setEditingMsgIdx(idx);
    setEditText(messages[idx].text);
  };

  // Confirm edit
  const confirmEdit = () => {
    if (editingMsgIdx !== null && editText.trim()) {
      onEditMessage?.(editingMsgIdx, editText);
      setEditingMsgIdx(null);
      setEditText('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isGenerating) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleSpeak = async (text: string, idx: number) => {
    setSpeakingIdx(idx);
    await speak(text);
    setSpeakingIdx(null);
  };

  // Voice recording using Web Speech API
  const toggleVoiceRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      // Voice not supported — fail silently (button will remain unresponsive)
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => setIsRecording(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + ' ' + transcript);
    };

    recognition.start();
  };

  // File upload handler — reads actual file content
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const isCode = ['ts', 'tsx', 'js', 'jsx', 'html', 'css', 'json', 'py', 'md', 'txt', 'yaml', 'yml', 'toml', 'xml', 'sql', 'sh'].includes(ext);

      if (isCode || file.type.startsWith('text/')) {
        // Append the full file content for code/text files
        setInput(prev => prev + `\n\n--- ${file.name} ---\n${content}\n---\n`);
      } else if (file.type.startsWith('image/')) {
        // For images, base64 encode and attach reference
        setInput(prev => prev + ` [Image: ${file.name}]`);
      } else {
        setInput(prev => prev + ` [File: ${file.name} (${(file.size / 1024).toFixed(1)}KB)]`);
      }
    };
    reader.onerror = () => {
      setInput(prev => prev + ` [Failed to read: ${file.name}]`);
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0a0a0a] w-full relative">
      {/* Chat Header */}
      <div className="shrink-0 border-b border-slate-200 dark:border-slate-800/50">
        {/* Title Row */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-cyan-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-indigo-500/30 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{mode === 'chat' ? 'AI Chat' : 'AI Canvas Agent'}</h3>
              <p className="text-[9px] text-gray-600">{mode === 'chat' ? 'Conversational' : 'Mistral • xAI • OpenAI'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Search */}
            <button
              onClick={() => setShowSearch(s => !s)}
              className={`p-1.5 rounded-lg transition-all border ${showSearch ? 'text-indigo-600 dark:text-indigo-400 bg-cyan-500/10 border-indigo-500/30' : 'text-gray-500 hover:text-indigo-600 dark:text-indigo-400 hover:bg-cyan-500/10 border-transparent hover:border-indigo-500/20'}`}
              title="Search (Ctrl+F)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            {/* Export */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(s => !s)}
                className={`p-1.5 rounded-lg transition-all border ${showExportMenu ? 'text-indigo-600 dark:text-indigo-400 bg-cyan-500/10 border-indigo-500/30' : 'text-gray-500 hover:text-indigo-600 dark:text-indigo-400 hover:bg-cyan-500/10 border-transparent hover:border-indigo-500/20'}`}
                title="Export"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 bg-slate-50 dark:bg-[#1a1a2e] border border-slate-300 dark:border-slate-700 rounded-lg shadow-xl z-20 py-1 min-w-[140px]">
                  {(['markdown', 'json', 'pdf', 'image'] as const).map(fmt => (
                    <button key={fmt} onClick={() => { onExportConversation?.(fmt); setShowExportMenu(false); }}
                      className="w-full text-left px-3 py-1.5 text-[10px] text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:text-indigo-400 hover:bg-cyan-500/10 transition-all capitalize">
                      {fmt === 'markdown' ? '📝' : fmt === 'json' ? '📋' : fmt === 'pdf' ? '📄' : '🖼️'} Export {fmt}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Settings */}
            <button
              onClick={() => setShowSettings(s => !s)}
              className={`p-1.5 rounded-lg transition-all border ${showSettings ? 'text-indigo-600 dark:text-indigo-400 bg-cyan-500/10 border-indigo-500/30' : 'text-gray-500 hover:text-indigo-600 dark:text-indigo-400 hover:bg-cyan-500/10 border-transparent hover:border-indigo-500/20'}`}
              title="Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            {/* History */}
            <button
              onClick={() => setShowChatHistory(!showChatHistory)}
              className={`p-1.5 rounded-lg transition-all border ${showChatHistory ? 'text-indigo-600 dark:text-indigo-400 bg-cyan-500/10 border-indigo-500/30' : 'text-gray-500 hover:text-indigo-600 dark:text-indigo-400 hover:bg-cyan-500/10 border-transparent hover:border-indigo-500/20'}`}
              title="Chat History"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button
              onClick={() => {
                onNewChat?.();
                setShowChatHistory(false);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-slate-900 dark:hover:text-white bg-cyan-500/10 hover:bg-cyan-500/20 border border-indigo-500/30 rounded-lg transition-all uppercase tracking-widest"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-gray-500 hover:text-indigo-600 dark:text-indigo-400 hover:bg-cyan-500/10 border border-transparent hover:border-indigo-500/20 transition-all"
                title="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Mode Toggle */}
        {onModeChange && (
          <div className="flex items-center gap-1 px-4 py-2 bg-black/30">
            <button
              onClick={() => onModeChange('agent')}
              className={`flex-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${mode === 'agent' ? 'text-indigo-600 dark:text-indigo-400 bg-cyan-500/15 border border-indigo-500/40 shadow-[0_0_8px_rgba(34,211,238,0.15)]' : 'text-gray-500 hover:text-slate-500 dark:text-slate-400 border border-transparent hover:border-slate-300 dark:border-slate-700'}`}
            >
              ⚡ Agent
            </button>
            <button
              onClick={() => onModeChange('chat')}
              className={`flex-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${mode === 'chat' ? 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/40 shadow-[0_0_8px_rgba(52,211,153,0.15)]' : 'text-gray-500 hover:text-slate-500 dark:text-slate-400 border border-transparent hover:border-slate-300 dark:border-slate-700'}`}
            >
              💬 Chat
            </button>
          </div>
        )}
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800/50 bg-slate-300 dark:bg-black/40">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="flex-1 text-[10px] bg-transparent border-none outline-none text-slate-700 dark:text-slate-300 placeholder:text-gray-600"
              autoFocus
            />
            {searchQuery && (
              <span className="text-[9px] text-gray-500">{filteredMessages.length} found</span>
            )}
            <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="text-gray-500 hover:text-indigo-600 dark:text-indigo-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800/50 bg-slate-300 dark:bg-black/40 space-y-3">
          {/* Temperature */}
          {onTemperatureChange && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Temperature</label>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">{(temperature ?? 0.7).toFixed(1)}</span>
              </div>
              <input type="range" min="0" max="2" step="0.1" value={temperature ?? 0.7}
                onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
              <div className="flex justify-between text-[8px] text-gray-600"><span>Precise</span><span>Creative</span></div>
            </div>
          )}
          {/* Max Tokens */}
          {onMaxTokensChange && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Max Tokens</label>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">{maxTokens ?? 4096}</span>
              </div>
              <input type="range" min="256" max="16384" step="256" value={maxTokens ?? 4096}
                onChange={(e) => onMaxTokensChange(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
              <div className="flex justify-between text-[8px] text-gray-600"><span>256</span><span>16384</span></div>
            </div>
          )}
          {/* Font Size */}
          {onFontSizeChange && (
            <div className="flex items-center justify-between">
              <label className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Font Size</label>
              <div className="flex items-center gap-1">
                <button onClick={() => onFontSizeChange(Math.max(10, fontSize - 1))}
                  className="w-6 h-6 text-[10px] bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:text-indigo-400 rounded border border-slate-300 dark:border-slate-700 hover:border-indigo-500/30 transition-all">−</button>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono w-6 text-center">{fontSize}</span>
                <button onClick={() => onFontSizeChange(Math.min(20, fontSize + 1))}
                  className="w-6 h-6 text-[10px] bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:text-indigo-400 rounded border border-slate-300 dark:border-slate-700 hover:border-indigo-500/30 transition-all">+</button>
              </div>
            </div>
          )}
          {/* Focus Mode */}
          {onFocusModeToggle && (
            <div className="flex items-center justify-between">
              <label className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Focus Mode</label>
              <button onClick={onFocusModeToggle}
                className={`px-2 py-1 text-[9px] rounded border transition-all ${focusMode ? 'text-indigo-600 dark:text-indigo-400 bg-cyan-500/15 border-indigo-500/40' : 'text-gray-500 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 hover:border-indigo-500/30'}`}>
                {focusMode ? 'ON' : 'OFF'}
              </button>
            </div>
          )}
          {/* Archive */}
          {onArchiveConversation && (
            <button onClick={onArchiveConversation}
              className="w-full text-left px-2 py-1.5 text-[9px] text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 rounded border border-transparent hover:border-amber-500/20 transition-all uppercase tracking-widest font-bold">
              📦 Archive Conversation
            </button>
          )}
          {/* Rate Limit */}
          {rateLimitInfo && (
            <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800/50">
              <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Rate Limit</span>
              <span className={`text-[10px] font-mono ${rateLimitInfo.remaining < 5 ? 'text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                {rateLimitInfo.remaining}/{rateLimitInfo.limit}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Chat History Panel (slides in) */}
      {showChatHistory && (
        <div className="absolute inset-0 top-0 bg-white dark:bg-[#0a0a0a] z-10 flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800/50 flex items-center justify-between">
            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Recent Conversations</h4>
            <button
              onClick={() => setShowChatHistory(false)}
              className="p-1.5 text-gray-600 hover:text-indigo-600 dark:text-indigo-400 hover:bg-cyan-500/10 rounded-lg transition-all"
              title="Close History"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {chatSessions.length === 0 ? (
              <p className="text-xs text-gray-600 text-center py-8">No chat history yet</p>
            ) : (
              chatSessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => { onLoadSession?.(session); setShowChatHistory(false); }}
                  className="w-full text-left p-3 bg-black/30 hover:bg-cyan-500/10 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 rounded-lg transition-all group"
                >
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:text-indigo-400 truncate">{session.title}</p>
                  <p className="text-[10px] text-gray-600 mt-1">
                    {new Date(session.timestamp).toLocaleDateString()} • {session.messages.length} messages
                  </p>
                </button>
              ))
            )}
          </div>
          <button
            onClick={() => setShowChatHistory(false)}
            className="m-4 py-2 text-xs font-bold text-gray-500 hover:text-indigo-600 dark:text-indigo-400 bg-black/30 hover:bg-cyan-500/10 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 rounded-lg transition-all uppercase tracking-widest"
          >
            Back to Chat
          </button>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" style={{ fontSize: `${fontSize}px` }}>
        {filteredMessages.length === 0 && !searchQuery && (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="w-12 h-12 bg-cyan-500/10 border border-indigo-500/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <p className="text-xs font-bold text-cyan-500/80 uppercase tracking-widest mb-2">Neural_Interface_Ready</p>
            <p className="text-xs text-gray-500 leading-relaxed">Request modifications, animations, or advanced functionality.</p>
            <p className="text-[9px] text-gray-600 mt-3">Shortcuts: Ctrl+Enter send · Escape stop · Ctrl+F search · Ctrl+Shift+N new</p>
          </div>
        )}
        {filteredMessages.length === 0 && searchQuery && (
          <p className="text-xs text-gray-500 text-center py-8">No messages matching "{searchQuery}"</p>
        )}

        {filteredMessages.map((msg, i) => {
          const realIdx = messages.indexOf(msg);
          return (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            {/* Pin/Favorite indicators */}
            {(msg.pinned || msg.favorite) && (
              <div className="flex items-center gap-1 mb-0.5 px-1">
                {msg.pinned && <span className="text-[9px] text-amber-400">📌 Pinned</span>}
                {msg.favorite && <span className="text-[9px] text-pink-400">❤️ Favorite</span>}
              </div>
            )}
            {/* Editing mode */}
            {editingMsgIdx === realIdx && msg.role === 'user' ? (
              <div className="max-w-[90%] w-full">
                <input type="text" value={editText} onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') confirmEdit(); if (e.key === 'Escape') { setEditingMsgIdx(null); setEditText(''); } }}
                  className="w-full px-3 py-2 text-xs bg-cyan-500/10 border border-indigo-500/30 rounded-lg text-slate-900 dark:text-white outline-none" autoFocus />
                <div className="flex gap-1 mt-1 justify-end">
                  <button onClick={confirmEdit} className="px-2 py-0.5 text-[9px] text-indigo-600 dark:text-indigo-400 bg-cyan-500/10 border border-indigo-500/30 rounded transition-all hover:bg-cyan-500/20">Save</button>
                  <button onClick={() => { setEditingMsgIdx(null); setEditText(''); }} className="px-2 py-0.5 text-[9px] text-gray-500 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded transition-all hover:text-slate-700 dark:text-slate-300">Cancel</button>
                </div>
              </div>
            ) : (
            <div className={`group relative max-w-[90%] px-4 py-3 rounded-lg text-xs leading-relaxed ${msg.role === 'user'
              ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-slate-900 dark:text-white rounded-tr-none shadow-[0_0_15px_rgba(34,211,238,0.2)]'
              : 'bg-slate-300 dark:bg-black/40 text-slate-700 dark:text-slate-300 rounded-tl-none border border-slate-200 dark:border-slate-800'
              }`}>
              {msg.role === 'model' ? renderMarkdown(msg.text) : msg.text}
              {msg.edited && <span className="text-[8px] text-gray-500 ml-1">(edited)</span>}

              {/* Message action buttons */}
              <div className={`absolute ${msg.role === 'user' ? '-left-20' : '-right-20'} top-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all`}>
                {msg.role === 'model' && (
                  <>
                    <button onClick={() => handleSpeak(msg.text, i)} title="Speak"
                      className={`p-1 text-gray-500 hover:text-indigo-600 dark:text-indigo-400 transition-all ${speakingIdx === i ? 'text-indigo-600 dark:text-indigo-400 animate-pulse' : ''}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                    </button>
                    <button onClick={() => onRegenerateMessage?.(realIdx)} title="Regenerate"
                      className="p-1 text-gray-500 hover:text-emerald-400 transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </>
                )}
                {msg.role === 'user' && (
                  <button onClick={() => startEditMessage(realIdx)} title="Edit"
                    className="p-1 text-gray-500 hover:text-indigo-600 dark:text-indigo-400 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
                <button onClick={() => onPinMessage?.(realIdx)} title={msg.pinned ? 'Unpin' : 'Pin'}
                  className={`p-1 transition-all ${msg.pinned ? 'text-amber-400' : 'text-gray-500 hover:text-amber-400'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill={msg.pinned ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
                <button onClick={() => onFavoriteMessage?.(realIdx)} title={msg.favorite ? 'Unfavorite' : 'Favorite'}
                  className={`p-1 transition-all ${msg.favorite ? 'text-pink-400' : 'text-gray-500 hover:text-pink-400'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill={msg.favorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
            </div>
            )}
            {/* Tool events attached to message */}
            {msg.toolEvents && msg.toolEvents.length > 0 && (
              <div className="mt-1 space-y-1 max-w-[90%]">
                {msg.toolEvents.map((evt, j) => <ToolEventBubble key={j} event={evt} />)}
              </div>
            )}
            <span className="text-[10px] text-gray-600 mt-1 px-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          );
        })}

        {/* Live streaming text */}
        {streamingText && (
          <div className="flex flex-col items-start">
            <div className="max-w-[90%] px-4 py-3 rounded-lg rounded-tl-none text-xs leading-relaxed bg-slate-300 dark:bg-black/40 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
              {renderMarkdown(streamingText)}
              <span className="inline-block w-1.5 h-3.5 bg-cyan-400 animate-pulse ml-0.5 -mb-0.5" />
            </div>
          </div>
        )}

        {/* Live tool events */}
        {liveToolEvents && liveToolEvents.length > 0 && (
          <div className="space-y-1">
            {liveToolEvents.slice(-8).map((evt, i) => <ToolEventBubble key={i} event={evt} />)}
          </div>
        )}

        {isGenerating && !streamingText && (
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-[10px] px-2 font-bold uppercase tracking-widest italic animate-pulse">
            <span className="flex gap-1">
              <span className="w-1 h-1 bg-cyan-400 rounded-full"></span>
              <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce"></span>
              <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce delay-150"></span>
            </span>
            Processing...
          </div>
        )}

        {/* Stop Generation Button */}
        {isGenerating && onStopGeneration && (
          <div className="flex justify-center">
            <button
              onClick={onStopGeneration}
              className="flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-full transition-all uppercase tracking-widest"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
              Stop (Esc)
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="px-3 py-1.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0a0a] shrink-0">
        <div className="flex items-center gap-2">
          {/* Voice Recording Button */}
          <button
            type="button"
            onClick={toggleVoiceRecording}
            className={`p-2.5 rounded-lg transition-all border ${isRecording ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-slate-300 dark:bg-black/40 text-gray-500 border-slate-200 dark:border-slate-800 hover:bg-cyan-500/10 hover:text-indigo-600 dark:text-indigo-400 hover:border-indigo-500/30'}`}
            title="Voice Input"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>

          {/* File Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 bg-slate-300 dark:bg-black/40 text-gray-500 rounded-lg hover:bg-cyan-500/10 hover:text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 transition-all"
            title="Upload File"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />

          {/* Text Input */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isGenerating}
              placeholder={mode === 'chat' ? "Chat with AI... (Ctrl+Enter)" : "Enter request... (Ctrl+Enter)"}
              maxLength={100000}
              className="w-full pl-4 pr-4 py-3 text-xs bg-slate-300 dark:bg-black/40 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-indigo-500/50 outline-none transition-all placeholder:text-gray-600 text-slate-700 dark:text-slate-300"
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!input.trim() || isGenerating}
            className="p-2.5 bg-gradient-to-r from-cyan-600 to-emerald-600 text-slate-900 dark:text-white rounded-lg disabled:bg-white dark:bg-slate-800 disabled:from-gray-700 disabled:to-gray-700 transition-all shadow-[0_0_10px_rgba(34,211,238,0.2)] hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] active:scale-95"
            title="Send Message"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;
