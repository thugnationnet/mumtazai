// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER TOOL ROUTER — Distributes 283 tools across 3 AI providers
// ═══════════════════════════════════════════════════════════════════════════════
// Each provider gets a subset of tools it's best suited for:
//   - Mistral: Core utilities, file ops, code/dev, search, markdown, archive (~95)
//   - xAI/Grok: Business/enterprise, analytics, workflow, knowledge graph, PM (~100)
//   - OpenAI: Creative/media, data/BI, AI/ML, cloud, security, geo (~88)
//
// Intent router analyzes user message → picks best provider → that provider
// sees only its tools. Fallback cascade still works: if primary fails, next
// provider gets ALL tools as fallback.
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Tool-to-Provider Mapping ────────────────────────────────────────────────

// MISTRAL — Fast, cost-efficient. Core utilities, file system, code/dev, parsing, markdown, archive
const MISTRAL_TOOLS = new Set([
  // Core utilities
  'calculate', 'get_current_time', 'get_weather', 'execute_code', 'run_command',
  'think_step_by_step', 'fetch_url', 'fetch_webpage', 'http_request', 'web_search',
  // File system (all)
  'create_file', 'read_file', 'modify_file', 'write_file', 'delete_file',
  'list_files', 'file_exists', 'create_folder', 'list_folders', 'move_file',
  'copy_file', 'rename_file', 'zip_files', 'unzip_files', 'get_project_tree',
  'file_watch', 'sync_files', 'create_zip', 'list_zip_contents', 'extract_zip',
  // Document parsing
  'parse_pdf', 'parse_docx', 'parse_csv', 'parse_json', 'parse_markdown', 'parse_html',
  // Developer tools
  'dev_filesystem', 'dev_search', 'dev_intelligence', 'dev_debug', 'dev_test',
  'dev_git', 'dev_npm', 'dev_docker',
  // Code convenience
  'generate_code', 'debug_code', 'summarize_file', 'search_in_files',
  'find_file_by_name', 'get_symbols', 'git_status', 'git_log', 'read_json',
  // Markdown
  'markdown_convert', 'markdown_validate', 'markdown_generate', 'markdown_toc',
  'markdown_format', 'markdown_merge', 'markdown_extract', 'markdown_slides',
  // Archive/ZIP
  'archive_core', 'archive_edit', 'archive_structure', 'archive_security',
  'archive_bulk', 'archive_convert', 'archive_intelligence', 'archive_deploy',
  // Web dev
  'web_analyze', 'web_scaffold', 'web_optimize', 'web_transform',
  'web_screenshot', 'web_lighthouse', 'web_scrape',
  // API tools
  'api_request', 'api_mock', 'api_document', 'api_test', 'api_transform',
  'api_validate', 'api_diff', 'api_proxy', 'webhook_listen', 'sdk_generate',
  // Agent intelligence
  'agent_memory', 'agent_safety', 'agent_ui', 'agent_control',
  'editor_select', 'save_context', 'recall_context',
  // Database
  'db_query', 'db_schema', 'db_backup', 'db_migrate', 'db_analyze', 'db_connect',
]);

// XAI/GROK — Strong reasoning. Business, enterprise, analytics, workflow, PM, CRM, HR, legal
const XAI_TOOLS = new Set([
  // Agent intelligence (shared — needed for memory across providers)
  'agent_memory', 'save_context', 'recall_context',
  // Finance & Accounting
  'invoice_generate', 'expense_track', 'budget_plan', 'financial_report',
  'tax_calculate', 'currency_convert', 'payment_process',
  // Project Management
  'project_create', 'task_manage', 'milestone_track', 'gantt_generate',
  'sprint_plan', 'resource_allocate', 'deadline_track',
  // Communication & Email
  'email_draft', 'email_template', 'newsletter_create', 'notification_send',
  'sms_send', 'calendar_manage', 'meeting_schedule',
  // CRM & Sales
  'lead_track', 'pipeline_manage', 'deal_forecast', 'customer_profile',
  'sales_report', 'proposal_generate', 'contract_draft',
  // HR & Recruiting
  'resume_parse', 'job_post', 'interview_schedule', 'employee_onboard',
  'payroll_calculate', 'performance_review', 'org_chart',
  // Legal & Compliance
  'contract_analyze', 'compliance_check', 'nda_generate', 'terms_generate',
  'privacy_audit', 'regulatory_report', 'ip_search',
  // Marketing & SEO
  'seo_audit', 'keyword_research', 'social_post', 'campaign_track',
  'ab_test', 'brand_monitor', 'content_calendar',
  // Analytics & Monitoring
  'analytics_track', 'analytics_dashboard', 'log_parse', 'monitor_health',
  'telemetry_send', 'analytics_export', 'log_aggregate', 'metrics_collect',
  // Workflow & Automation
  'workflow_create', 'workflow_execute', 'workflow_schedule', 'workflow_visualize',
  'workflow_optimize', 'workflow_template', 'workflow_history', 'workflow_validate',
  // Knowledge Graph
  'kg_create', 'kg_query', 'kg_visualize', 'kg_merge', 'kg_reason',
  'kg_import', 'kg_export', 'kg_stats',
  // Growth & Marketing
  'growth_analyze', 'pricing_simulate', 'ab_test_run', 'ab_test_analyze',
  'lead_enrich', 'campaign_generate', 'cohort_analyze', 'funnel_optimize',
  'attribution_model',
  // Collaboration & Team
  'team_invite', 'role_assign', 'comment_thread', 'task_assign',
  'approval_flow', 'activity_log', 'access_audit', 'notify_team',
  // Agent workflow/metrics/delegate
  'agent_workflow', 'agent_metrics', 'agent_delegate',
]);

// OPENAI — Best tool support, vision, creative. Media, data/BI, AI/ML, cloud, security, geo
const OPENAI_TOOLS = new Set([
  // Agent intelligence (shared)
  'agent_memory', 'save_context', 'recall_context',
  // Image Processing (all)
  'image_create', 'image_transform', 'image_convert', 'image_compose',
  'image_filter', 'image_analyze', 'image_batch', 'image_background',
  'image_face', 'image_ai', 'image_export', 'image_ocr', 'generate_image',
  // Video Processing (all)
  'video_transform', 'video_convert', 'video_analyze', 'video_overlay',
  'video_filter', 'video_audio', 'video_ai', 'video_batch', 'generate_video',
  // Audio
  'transcribe_audio',
  // Data & BI
  'data_visualize', 'report_generate', 'kpi_dashboard', 'data_export',
  'pivot_table', 'trend_analyze', 'forecast_model', 'data_profile',
  'data_clean', 'feature_engineer', 'model_compare', 'data_transform',
  'data_pipeline', 'model_explain',
  // AI & ML
  'llm_chat', 'llm_embed', 'llm_finetune', 'llm_analyze', 'llm_moderate',
  'ml_train', 'ml_predict', 'ml_pipeline',
  // Geospatial
  'geo_geocode', 'geo_route', 'geo_distance', 'geo_fence', 'geo_search',
  'geo_timezone', 'geo_elevation', 'geo_ip', 'geo_cluster', 'geo_transform',
  // Cloud
  'cloud_deploy', 'cloud_scale', 'cloud_logs', 'cloud_secrets', 'cloud_cost',
  'cloud_storage', 'cloud_dns', 'cloud_monitor', 'cloud_network',
  'cloud_container', 'cloud_iam',
  // Security (all)
  'crypto_hash', 'crypto_encrypt', 'crypto_sign', 'scan_secrets', 'scan_malware',
  'auth_generate', 'scan_vulnerabilities', 'policy_enforce', 'threat_model',
  'incident_response', 'pentest_recon', 'waf_manage', 'siem_query',
  'zero_trust', 'container_security', 'api_security', 'supply_chain',
  'scan_dependency', 'ssl_inspect', 'password_audit',
]);

// ─── Provider → Tool Set Lookup ──────────────────────────────────────────────

const PROVIDER_TOOL_MAP = {
  mistral: MISTRAL_TOOLS,
  xai: XAI_TOOLS,
  openai: OPENAI_TOOLS,
};

// ─── Intent Keywords → Provider Routing ──────────────────────────────────────
// Keyword patterns that strongly indicate which provider's tools are needed.
// Analyzed in order; first match wins. Falls back to default cascade if no match.

const INTENT_ROUTES = [
  {
    // Creative / media requests → OpenAI (highest priority — unambiguous)
    provider: 'openai',
    keywords: /\b(image|photo|picture|draw|sketch|paint|illustrat|logo|thumbnail|banner|icon|avatar|video|animation|animate|movie|clip|film|audio|transcri|voice|speech|music|sound)\b/i,
  },
  {
    // Business / finance → xAI (before generic "chart/graph" to catch "gantt chart", "budget forecast")
    provider: 'xai',
    keywords: /\b(invoice|budget|expense|tax|financial|accounting|payroll|revenue|profit|payment|billing|salary|gantt)\b/i,
  },
  {
    // Project management / workflow → xAI
    provider: 'xai',
    keywords: /\b(project.?manage|task.?manage|sprint|milestone|deadline|workflow|automat|schedul|pipeline|kanban|agile|scrum)\b/i,
  },
  {
    // CRM / Sales / Marketing → xAI
    provider: 'xai',
    keywords: /\b(crm|sales|lead|pipeline|deal|prospect|campaign|seo|keyword|marketing|newsletter|social.?media|a.?b.?test|funnel|cohort|growth|brand|content.?calendar)\b/i,
  },
  {
    // HR / Legal / Compliance → xAI
    provider: 'xai',
    keywords: /\b(recruit|resume|onboard|interview|job.?post|hr|human.?resource|contract|compliance|nda|legal|regulat|privacy|terms.?of|org.?chart|performance.?review)\b/i,
  },
  {
    // Analytics / monitoring / knowledge graph → xAI
    provider: 'xai',
    keywords: /\b(analytics|telemetry|monitor|log.?pars|knowledge.?graph|entity|relationship|graph.?query|reasoning|team|collaborat|approval|assign|meeting|calendar)\b/i,
  },
  {
    // Data analysis / visualization / ML → OpenAI
    provider: 'openai',
    keywords: /\b(chart|graph|plot|dashboard|kpi|forecast|predict|trend|dataset|data.?viz|machine.?learn|train.?model|neural|embeddings?|visualiz|pivot|histogram|scatter|heatmap|ml.?model|train.+model|classif|regression)\b/i,
  },
  {
    // Security / cloud / geo → OpenAI
    provider: 'openai',
    keywords: /\b(encrypt|decrypt|hash|security.?scan|vulnerabilit|malware|firewall|waf|siem|pentest|zero.?trust|cloud.?deploy|aws|azure|gcp|docker|kubernetes|k8s|geolocation|geocode|route.?map|distance|elevation|geofence|latitude|longitude)/i,
  },
  {
    // Code / dev / files → Mistral
    provider: 'mistral',
    keywords: /\b(code|program|function|class|debug|compile|lint|test|npm|git|docker|api|webhook|sdk|database|sql|query|schema|migrat|backup|markdown|csv|pdf|docx|json|parse|file|folder|zip|archive|web.?scrape|lighthouse|scaffold)\b/i,
  },
];

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Analyze user message and determine the best provider to handle it.
 * Returns the provider name or null if no strong match (use default cascade).
 */
export function detectIntentProvider(userMessage) {
  if (!userMessage || typeof userMessage !== 'string') return null;

  for (const route of INTENT_ROUTES) {
    if (route.keywords.test(userMessage)) {
      return route.provider;
    }
  }

  return null; // No strong signal — use default cascade order
}

/**
 * Get the tool definitions for a specific provider.
 * Result is cached per (input array reference, provider) so repeat requests
 * with the same agent-filtered input skip the .filter() pass entirely.
 * @param {string} providerName - 'mistral', 'xai', or 'openai'
 * @param {Array} allTools - Full TOOL_DEFINITIONS array
 * @returns {Array} Filtered tool definitions for this provider
 */
const _providerFilterCache = new WeakMap(); // input array → { providerName: filteredArray }

export function getToolsForProvider(providerName, allTools) {
  const toolSet = PROVIDER_TOOL_MAP[providerName];
  if (!toolSet) return allTools; // Unknown provider → give all tools

  let perProvider = _providerFilterCache.get(allTools);
  if (!perProvider) {
    perProvider = {};
    _providerFilterCache.set(allTools, perProvider);
  }
  if (!perProvider[providerName]) {
    perProvider[providerName] = allTools.filter(t => toolSet.has(t.name));
  }
  return perProvider[providerName];
}

/**
 * Reorder the provider cascade so the intent-matched provider comes first.
 * Other providers remain as fallbacks in their original order.
 * @param {Array} cascade - Original PROVIDER_CASCADE array
 * @param {string} userMessage - The user's message text
 * @returns {Array} Reordered cascade
 */
export function getIntentRoutedCascade(cascade, userMessage) {
  const preferredProvider = detectIntentProvider(userMessage);
  if (!preferredProvider) return cascade; // No intent match → default order

  const preferred = cascade.find(p => p.name === preferredProvider);
  if (!preferred) return cascade; // Provider not in cascade

  // Move matched provider to front, keep others as fallback
  const rest = cascade.filter(p => p.name !== preferredProvider);
  console.log(`[intent-router] Detected intent → routing to ${preferredProvider} first`);
  return [preferred, ...rest];
}

/**
 * Get tool count per provider for logging/diagnostics.
 */
export function getProviderToolCounts(allTools) {
  const counts = {};
  for (const [name, toolSet] of Object.entries(PROVIDER_TOOL_MAP)) {
    const matched = allTools.filter(t => toolSet.has(t.name));
    counts[name] = matched.length;
  }
  // Check for tools not assigned to any provider
  const allAssigned = new Set([...MISTRAL_TOOLS, ...XAI_TOOLS, ...OPENAI_TOOLS]);
  const unassigned = allTools.filter(t => !allAssigned.has(t.name));
  counts.unassigned = unassigned.length;
  if (unassigned.length > 0) {
    console.warn(`[tool-router] ${unassigned.length} unassigned tools:`, unassigned.map(t => t.name).join(', '));
  }
  return counts;
}
