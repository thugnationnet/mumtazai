/**
 * ============================================================================
 * TOOLS HEADQUARTERS 🏢
 * ============================================================================
 * ONE place for ALL tools. Every app/route imports from here.
 * 
 * Structure:
 * - ALL_TOOLS: Complete array of all tool definitions
 * - executeTool: Single function that routes to correct executor
 * - Category helpers: isFileTool, isAgentTool, etc.
 * ============================================================================
 */

// ============================================================================
// IMPORT ALL TOOL MODULES
// ============================================================================

// Core tools (file system, git, terminal, http, etc.)
import { TOOL_DEFINITIONS, executeTool as executeCoreTool } from './tools.js';

// Canvas/Workspace tools
import { CANVAS_TOOL_DEFINITIONS, executeCanvasTool } from './canvasTools.js';

// Image generation tools
import { IMAGE_TOOL_DEFINITIONS, executeImageTool, isImageTool } from './imageTools.js';

// Video generation tools
import { VIDEO_TOOL_DEFINITIONS, executeVideoTool, isVideoTool } from './videoTools.js';

// Archive/ZIP tools
import { ARCHIVE_TOOL_DEFINITIONS, executeArchiveTool, isArchiveTool } from './archiveTools.js';

// Backend/API generation tools
import { BACKEND_TOOL_DEFINITIONS, executeBackendTool, isBackendTool } from './backendTools.js';

// Code execution tools
import { CODE_TOOL_DEFINITIONS, executeCodeTool, isCodeTool } from './codeTools.js';

// Editor tools
import { EDITOR_TOOL_DEFINITIONS, executeEditorTool, isEditorTool } from './editorTools.js';

// Agent Control tools (mode switching, state management, planning, context)
import {
  AGENT_CONTROL_TOOL_DEFINITIONS,
  executeAgentControlTool,
  isAgentControlTool,
  AGENT_MODES,
  getAgentState
} from './agentControlTools.js';

// ── NEW V2 TOOL MODULES ──

// Core Utility tools (JSON, date/time, text transform)
import { CORE_UTILITY_TOOL_DEFINITIONS, executeCoreUtilityTool, isCoreUtilityTool } from './coreUtilityTools.js';

// Document Parsing tools (PDF, CSV, XML, YAML, DOCX, XLSX, HTML)
import { DOCUMENT_PARSING_TOOL_DEFINITIONS, executeDocumentParsingTool, isDocumentParsingTool } from './documentParsingTools.js';

// Developer tools (format, lint, compile, bundle, test, coverage, complexity, deps)
import { DEV_TOOL_DEFINITIONS, executeDevTool, isDevTool } from './devTools.js';

// Web & Frontend tools (HTML gen, CSS gen, responsive check, a11y, SEO, perf, PWA)
import { WEB_FRONTEND_TOOL_DEFINITIONS, executeWebFrontendTool, isWebFrontendTool } from './webFrontendTools.js';

// Database tools (query, schema, backup, migrate, analyze, connect)
import { DATABASE_TOOL_DEFINITIONS, executeDatabaseTool, isDatabaseTool } from './databaseTools.js';

// API & Integration tools (request, mock, document, test, transform, webhook, SDK)
import { API_TOOL_DEFINITIONS, executeApiTool, isApiTool } from './apiTools.js';

// AI & ML tools (LLM chat, embed, finetune, ML train, predict)
import { AI_ML_TOOL_DEFINITIONS, executeAiMlTool, isAiMlTool } from './aiMlTools.js';

// Security tools (hash, encrypt, sign, scan secrets, scan malware, auth generate)
import { SECURITY_TOOL_DEFINITIONS, executeSecurityTool, isSecurityTool } from './securityTools.js';

// Content & Markdown tools (convert, validate, generate, TOC, format)
import { CONTENT_MARKDOWN_TOOL_DEFINITIONS, executeContentMarkdownTool, isContentMarkdownTool } from './contentMarkdownTools.js';

// Analytics & Monitoring tools (track, report, health, logs, performance)
import { ANALYTICS_TOOL_DEFINITIONS, executeAnalyticsTool, isAnalyticsTool } from './analyticsTools.js';

// File System tools (search, compress)
import { FILE_SYSTEM_TOOL_DEFINITIONS, executeFileSystemTool, isFileSystemTool } from './fileSystemTools.js';

// ── NEW V3 TOOL MODULES (AK 47) ──

// Deployment & Docker tools (build, run, compose, CI, static deploy)
import { DEPLOYMENT_DOCKER_TOOL_DEFINITIONS, executeDeploymentDockerTool, isDeploymentDockerTool } from './deploymentDockerTools.js';

// Communication tools (email, push notifications, webhooks, SMS)
import { COMMUNICATION_TOOL_DEFINITIONS, executeCommunicationTool, isCommunicationTool } from './communicationTools.js';

// UI Interaction tools (approvals, questions, messages)
import { UI_INTERACTION_TOOL_DEFINITIONS, executeUiInteractionTool, isUiInteractionTool } from './uiInteractionTools.js';

// ── NEW V4 TOOL MODULES ──

// Workflow Automation tools
import { WORKFLOW_TOOL_DEFINITIONS, executeWorkflowTool, isWorkflowTool } from './workflowTools.js';

// Knowledge Graph tools
import { KNOWLEDGE_GRAPH_TOOL_DEFINITIONS, executeKnowledgeGraphTool, isKnowledgeGraphTool } from './knowledgeGraphTools.js';

// Business & Growth tools
import { BUSINESS_GROWTH_TOOL_DEFINITIONS, executeBusinessGrowthTool, isBusinessGrowthTool } from './businessGrowthTools.js';

// Collaboration tools
import { COLLABORATION_TOOL_DEFINITIONS, executeCollaborationTool, isCollaborationTool } from './collaborationTools.js';

// Advanced AI tools (LLM routing, guardrails, agent orchestration)
import { ADVANCED_AI_TOOL_DEFINITIONS, executeAdvancedAiTool, isAdvancedAiTool } from './advancedAiTools.js';

// Data Science tools
import { DATA_SCIENCE_TOOL_DEFINITIONS, executeDataScienceTool, isDataScienceTool } from './dataScienceTools.js';

// Geo & Location tools
import { GEO_LOCATION_TOOL_DEFINITIONS, executeGeoLocationTool, isGeoLocationTool } from './geoLocationTools.js';

// Cloud Control tools
import { CLOUD_CONTROL_TOOL_DEFINITIONS, executeCloudControlTool, isCloudControlTool } from './cloudControlTools.js';

// Advanced Security tools
import { ADVANCED_SECURITY_TOOL_DEFINITIONS, executeAdvancedSecurityTool, isAdvancedSecurityTool } from './advancedSecurityTools.js';

// ── V5 ENTERPRISE TOOL MODULES ──

// Financial tools (invoices, expenses, budgets, reports, tax, currency, payments)
import { FINANCIAL_TOOL_DEFINITIONS, executeFinancialTool, isFinancialTool } from './financialTools.js';

// Project Management tools (projects, tasks, milestones, gantt, sprints, resources, deadlines)
import { PROJECT_MGMT_TOOL_DEFINITIONS, executeProjectMgmtTool, isProjectMgmtTool } from './projectMgmtTools.js';

// Email & Communication tools (email draft, templates, newsletters, notifications, SMS, calendar, meetings)
import { EMAIL_COMM_TOOL_DEFINITIONS, executeEmailCommTool, isEmailCommTool } from './emailCommTools.js';

// Sales & CRM tools (leads, pipeline, deals, customers, sales reports, proposals, contracts)
import { SALES_CRM_TOOL_DEFINITIONS, executeSalesCrmTool, isSalesCrmTool } from './salesCrmTools.js';

// HR & Recruiting tools (resumes, jobs, interviews, onboarding, payroll, reviews, org charts)
import { HR_RECRUITING_TOOL_DEFINITIONS, executeHrRecruitingTool, isHrRecruitingTool } from './hrRecruitingTools.js';

// Legal & Compliance tools (contracts, compliance, NDA, terms, privacy, regulatory, IP)
import { LEGAL_COMPLIANCE_TOOL_DEFINITIONS, executeLegalComplianceTool, isLegalComplianceTool } from './legalComplianceTools.js';

// Marketing & SEO tools (SEO audit, keywords, social, campaigns, A/B tests, brand, content calendar)
import { MARKETING_SEO_TOOL_DEFINITIONS, executeMarketingSeoTool, isMarketingSeoTool } from './marketingSeoTools.js';


// ============================================================================
// MERGE ALL TOOLS INTO ONE ARRAY
// ============================================================================

// Deduplicate tools: later definitions win (canvas tools override core when names clash)
const _rawTools = [
  // Core tools (55 tools: file system, git, terminal, http, memory, zip, web search)
  ...TOOL_DEFINITIONS,

  // Canvas tools (workspace, project, component management) — overrides core file tools
  ...CANVAS_TOOL_DEFINITIONS,

  // Image tools (generation, editing, upscaling)
  ...IMAGE_TOOL_DEFINITIONS,

  // Video tools (generation, editing)
  ...VIDEO_TOOL_DEFINITIONS,

  // Archive tools (export, backup, restore)
  ...ARCHIVE_TOOL_DEFINITIONS,

  // Backend tools (API generation, database, deployment)
  ...BACKEND_TOOL_DEFINITIONS,

  // Code tools (execution, analysis)
  ...CODE_TOOL_DEFINITIONS,

  // Editor tools (cursor, selection, insert)
  ...EDITOR_TOOL_DEFINITIONS,

  // Agent Control tools (mode, state, execution control)
  ...AGENT_CONTROL_TOOL_DEFINITIONS,

  // ── NEW V2 TOOL MODULES ──
  ...CORE_UTILITY_TOOL_DEFINITIONS,
  ...DOCUMENT_PARSING_TOOL_DEFINITIONS,
  ...DEV_TOOL_DEFINITIONS,
  ...WEB_FRONTEND_TOOL_DEFINITIONS,
  ...DATABASE_TOOL_DEFINITIONS,
  ...API_TOOL_DEFINITIONS,
  ...AI_ML_TOOL_DEFINITIONS,
  ...SECURITY_TOOL_DEFINITIONS,
  ...CONTENT_MARKDOWN_TOOL_DEFINITIONS,
  ...ANALYTICS_TOOL_DEFINITIONS,
  ...FILE_SYSTEM_TOOL_DEFINITIONS,

  // ── NEW V3 TOOL MODULES (AK 47) ──
  ...DEPLOYMENT_DOCKER_TOOL_DEFINITIONS,
  ...COMMUNICATION_TOOL_DEFINITIONS,

  // ── UI INTERACTION TOOLS ──
  ...UI_INTERACTION_TOOL_DEFINITIONS,

  // ── V4 TOOL MODULES ──
  ...WORKFLOW_TOOL_DEFINITIONS,
  ...KNOWLEDGE_GRAPH_TOOL_DEFINITIONS,
  ...BUSINESS_GROWTH_TOOL_DEFINITIONS,
  ...COLLABORATION_TOOL_DEFINITIONS,
  ...ADVANCED_AI_TOOL_DEFINITIONS,
  ...DATA_SCIENCE_TOOL_DEFINITIONS,
  ...GEO_LOCATION_TOOL_DEFINITIONS,
  ...CLOUD_CONTROL_TOOL_DEFINITIONS,
  ...ADVANCED_SECURITY_TOOL_DEFINITIONS,

  // ── V5 ENTERPRISE TOOL MODULES ──
  ...FINANCIAL_TOOL_DEFINITIONS,
  ...PROJECT_MGMT_TOOL_DEFINITIONS,
  ...EMAIL_COMM_TOOL_DEFINITIONS,
  ...SALES_CRM_TOOL_DEFINITIONS,
  ...HR_RECRUITING_TOOL_DEFINITIONS,
  ...LEGAL_COMPLIANCE_TOOL_DEFINITIONS,
  ...MARKETING_SEO_TOOL_DEFINITIONS,
];

// Remove duplicates — keep last occurrence (so canvas/specialized tools override core)
const _seenNames = new Map();
for (const tool of _rawTools) {
  _seenNames.set(tool.name, tool);
}
export const ALL_TOOLS = [..._seenNames.values()];

// Tool name set for quick lookup
const ALL_TOOL_NAMES = new Set(ALL_TOOLS.map(t => t.name));

// Core tool names (from tools.js)
const CORE_TOOL_NAMES = new Set(TOOL_DEFINITIONS.map(t => t.name));

// Canvas tool names
const CANVAS_TOOL_NAMES = new Set(CANVAS_TOOL_DEFINITIONS.map(t => t.name));


// ============================================================================
// TOOL TIMEOUTS
// ============================================================================

const DEFAULT_TIMEOUT_MS = 30_000; // 30 seconds

// Per-tool timeout overrides (tool name → ms). Long-running tools get more time.
const TOOL_TIMEOUTS = {
  'generate_image': 120_000,
  'generate_video': 180_000,
  'deploy_static': 60_000,
  'docker_build': 120_000,
  'docker_compose_up': 120_000,
  'run_code': 60_000,
  'ml_train': 180_000,
  'llm_chat': 60_000,
  'finetune_model': 300_000,
  'send_email': 30_000,
  'database_query': 60_000,
  'api_request': 30_000,
  'bundle_code': 60_000,
};

function getTimeoutForTool(toolName) {
  return TOOL_TIMEOUTS[toolName] || DEFAULT_TIMEOUT_MS;
}

function withTimeout(promise, ms, toolName) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Tool "${toolName}" timed out after ${ms / 1000}s`)), ms)
    ),
  ]);
}

// ============================================================================
// HOOKS SYSTEM (beforeRun / afterRun / onError)
// ============================================================================

const _hooks = { beforeRun: [], afterRun: [], onError: [] };

/**
 * Register a hook. Returns unregister function.
 * @param {'beforeRun'|'afterRun'|'onError'} event
 * @param {Function} fn
 */
export function registerHook(event, fn) {
  if (!_hooks[event]) return () => {};
  _hooks[event].push(fn);
  return () => { _hooks[event] = _hooks[event].filter(h => h !== fn); };
}

async function runHooks(event, payload) {
  for (const fn of _hooks[event]) {
    try { await fn(payload); } catch (e) { console.error(`[ToolsHQ] Hook ${event} error:`, e.message); }
  }
}

// ============================================================================
// DANGEROUS / CONFIRMATION TOOLS
// ============================================================================

const DANGEROUS_TOOLS = new Set([
  'deploy_static', 'docker_build', 'docker_compose_up', 'docker_run',
  'delete_file', 'rm_directory', 'git_push', 'git_reset',
  'database_query', 'send_email', 'send_sms', 'send_push_notification',
]);

export function isDangerousTool(toolName) {
  return DANGEROUS_TOOLS.has(toolName);
}

// ============================================================================
// UNIFIED EXECUTE FUNCTION
// ============================================================================

/**
 * Execute any tool by name - routes to correct executor automatically.
 * Includes timeout protection and hook lifecycle.
 * @param {string} toolName - Name of the tool to execute
 * @param {object} input - Input parameters for the tool
 * @param {object} ctx - Context (userId, sessionId, deps, etc.)
 * @returns {Promise<any>} - Tool execution result
 */
export async function executeTool(toolName, input, ctx = {}) {
  console.log(`[ToolsHQ] Executing: ${toolName}`);

  const hookPayload = { toolName, input, ctx, startTime: Date.now() };
  await runHooks('beforeRun', hookPayload);

  try {
    const timeoutMs = getTimeoutForTool(toolName);
    const rawResult = await withTimeout(
      _routeToolExecution(toolName, input, ctx),
      timeoutMs,
      toolName
    );

    // ── Normalize return to { result: string, sideEffects?: object } ──
    const normalized = normalizeToolResult(toolName, rawResult);
    await runHooks('afterRun', { ...hookPayload, result: normalized, durationMs: Date.now() - hookPayload.startTime });
    return normalized;

  } catch (error) {
    console.error(`[ToolsHQ] Error executing ${toolName}:`, error);
    const errorResult = {
      result: JSON.stringify({ status: 'error', error: error.message, tool: toolName }),
      sideEffects: null
    };
    await runHooks('onError', { ...hookPayload, error, durationMs: Date.now() - hookPayload.startTime });
    return errorResult;
  }
}

/** Internal: route toolName to the correct executor */
async function _routeToolExecution(toolName, input, ctx) {
    // Agent tools first (highest priority)
    if (isAgentControlTool(toolName)) {
      return executeAgentControlTool(toolName, input, ctx);
    }
    // Media tools
    if (isImageTool(toolName)) {
      return executeImageTool(toolName, input, ctx);
    }
    if (isVideoTool(toolName)) {
      return executeVideoTool(toolName, input, ctx);
    }
    // Project tools
    if (isArchiveTool(toolName)) {
      return executeArchiveTool(toolName, input, ctx);
    }
    if (isBackendTool(toolName)) {
      return executeBackendTool(toolName, input, ctx);
    }
    if (isCodeTool(toolName)) {
      return executeCodeTool(toolName, input, ctx);
    }
    if (isEditorTool(toolName)) {
      return executeEditorTool(toolName, input, ctx.editorContext || {}, ctx.sseWrite || (() => { }));
    }
    // ── V2 TOOL MODULES ──
    if (isCoreUtilityTool(toolName)) {
      return executeCoreUtilityTool(toolName, input, ctx);
    }
    if (isDocumentParsingTool(toolName)) {
      return executeDocumentParsingTool(toolName, input, ctx);
    }
    if (isDevTool(toolName)) {
      return executeDevTool(toolName, input, ctx);
    }
    if (isWebFrontendTool(toolName)) {
      return executeWebFrontendTool(toolName, input, ctx);
    }
    if (isDatabaseTool(toolName)) {
      return executeDatabaseTool(toolName, input, ctx);
    }
    if (isApiTool(toolName)) {
      return executeApiTool(toolName, input, ctx);
    }
    if (isAiMlTool(toolName)) {
      return executeAiMlTool(toolName, input, ctx);
    }
    if (isSecurityTool(toolName)) {
      return executeSecurityTool(toolName, input, ctx);
    }
    if (isContentMarkdownTool(toolName)) {
      return executeContentMarkdownTool(toolName, input, ctx);
    }
    if (isAnalyticsTool(toolName)) {
      return executeAnalyticsTool(toolName, input, ctx);
    }
    if (isFileSystemTool(toolName)) {
      return executeFileSystemTool(toolName, input, ctx);
    }
    // ── V3 TOOL MODULES (AK 47) ──
    if (isDeploymentDockerTool(toolName)) {
      return executeDeploymentDockerTool(toolName, input, ctx);
    }
    if (isCommunicationTool(toolName)) {
      return executeCommunicationTool(toolName, input, ctx);
    }
    // UI Interaction tools (approvals, questions, messages)
    if (isUiInteractionTool(toolName)) {
      return executeUiInteractionTool(toolName, input, ctx);
    }
    // ── V4 TOOL MODULES ──
    if (isWorkflowTool(toolName)) {
      return executeWorkflowTool(toolName, input, ctx);
    }
    if (isKnowledgeGraphTool(toolName)) {
      return executeKnowledgeGraphTool(toolName, input, ctx);
    }
    if (isBusinessGrowthTool(toolName)) {
      return executeBusinessGrowthTool(toolName, input, ctx);
    }
    if (isCollaborationTool(toolName)) {
      return executeCollaborationTool(toolName, input, ctx);
    }
    if (isAdvancedAiTool(toolName)) {
      return executeAdvancedAiTool(toolName, input, ctx);
    }
    if (isDataScienceTool(toolName)) {
      return executeDataScienceTool(toolName, input, ctx);
    }
    if (isGeoLocationTool(toolName)) {
      return executeGeoLocationTool(toolName, input, ctx);
    }
    if (isCloudControlTool(toolName)) {
      return executeCloudControlTool(toolName, input, ctx);
    }
    if (isAdvancedSecurityTool(toolName)) {
      return executeAdvancedSecurityTool(toolName, input, ctx);
    }
    // ── V5 ENTERPRISE TOOL MODULES ──
    if (isFinancialTool(toolName)) {
      return executeFinancialTool(toolName, input, ctx);
    }
    if (isProjectMgmtTool(toolName)) {
      return executeProjectMgmtTool(toolName, input, ctx);
    }
    if (isEmailCommTool(toolName)) {
      return executeEmailCommTool(toolName, input, ctx);
    }
    if (isSalesCrmTool(toolName)) {
      return executeSalesCrmTool(toolName, input, ctx);
    }
    if (isHrRecruitingTool(toolName)) {
      return executeHrRecruitingTool(toolName, input, ctx);
    }
    if (isLegalComplianceTool(toolName)) {
      return executeLegalComplianceTool(toolName, input, ctx);
    }
    if (isMarketingSeoTool(toolName)) {
      return executeMarketingSeoTool(toolName, input, ctx);
    }
    // Canvas tools
    if (CANVAS_TOOL_NAMES.has(toolName)) {
      return executeCanvasTool(toolName, input, ctx);
    }
    // Core tools (file system, git, terminal, http, etc.)
    if (CORE_TOOL_NAMES.has(toolName)) {
      return executeCoreTool(toolName, input, ctx.deps || ctx);
    }
    throw new Error(`Unknown tool: ${toolName}`);
}

/**
 * Normalize any executor return value to { result: string, sideEffects?: object }
 * Handles all shapes: { result, sideEffects }, { success, ... }, raw string, etc.
 */
function normalizeToolResult(toolName, rawResult) {
  // Already normalized: image/video/archive/backend/core tools
  if (rawResult && typeof rawResult === 'object' && typeof rawResult.result === 'string') {
    return { result: rawResult.result, sideEffects: rawResult.sideEffects || null };
  }

  // Raw JSON string (canvasTools return this)
  if (typeof rawResult === 'string') {
    return { result: rawResult, sideEffects: null };
  }

  // Object without .result (code/editor/agent tools return { success, ... })
  if (rawResult && typeof rawResult === 'object') {
    const status = rawResult.success ? 'success' : 'error';
    return {
      result: JSON.stringify({ status, ...rawResult }),
      sideEffects: rawResult.sideEffects || null
    };
  }

  // Fallback
  return {
    result: JSON.stringify({ status: 'success', data: rawResult }),
    sideEffects: null
  };
}


// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a tool exists
 */
export function hasTool(toolName) {
  return ALL_TOOL_NAMES.has(toolName);
}

/**
 * Get tool definition by name
 */
export function getTool(toolName) {
  return ALL_TOOLS.find(t => t.name === toolName);
}

/**
 * Get tools by category
 */
export function getToolsByCategory(category) {
  switch (category) {
    case 'core':
      return TOOL_DEFINITIONS;
    case 'canvas':
      return CANVAS_TOOL_DEFINITIONS;
    case 'image':
      return IMAGE_TOOL_DEFINITIONS;
    case 'video':
      return VIDEO_TOOL_DEFINITIONS;
    case 'archive':
      return ARCHIVE_TOOL_DEFINITIONS;
    case 'backend':
      return BACKEND_TOOL_DEFINITIONS;
    case 'code':
      return CODE_TOOL_DEFINITIONS;
    case 'editor':
      return EDITOR_TOOL_DEFINITIONS;
    case 'agent_control':
      return AGENT_CONTROL_TOOL_DEFINITIONS;
    case 'core_utility':
      return CORE_UTILITY_TOOL_DEFINITIONS;
    case 'document_parsing':
      return DOCUMENT_PARSING_TOOL_DEFINITIONS;
    case 'dev':
      return DEV_TOOL_DEFINITIONS;
    case 'web_frontend':
      return WEB_FRONTEND_TOOL_DEFINITIONS;
    case 'database':
      return DATABASE_TOOL_DEFINITIONS;
    case 'api':
      return API_TOOL_DEFINITIONS;
    case 'ai_ml':
      return AI_ML_TOOL_DEFINITIONS;
    case 'security':
      return SECURITY_TOOL_DEFINITIONS;
    case 'content_markdown':
      return CONTENT_MARKDOWN_TOOL_DEFINITIONS;
    case 'analytics':
      return ANALYTICS_TOOL_DEFINITIONS;
    case 'filesystem':
      return FILE_SYSTEM_TOOL_DEFINITIONS;
    // V3 categories (AK 47)
    case 'deployment_docker':
      return DEPLOYMENT_DOCKER_TOOL_DEFINITIONS;
    case 'communication':
      return COMMUNICATION_TOOL_DEFINITIONS;
    case 'ui_interaction':
      return UI_INTERACTION_TOOL_DEFINITIONS;
    // V4 categories
    case 'workflow':
      return WORKFLOW_TOOL_DEFINITIONS;
    case 'knowledge_graph':
      return KNOWLEDGE_GRAPH_TOOL_DEFINITIONS;
    case 'business_growth':
      return BUSINESS_GROWTH_TOOL_DEFINITIONS;
    case 'collaboration':
      return COLLABORATION_TOOL_DEFINITIONS;
    case 'advanced_ai':
      return ADVANCED_AI_TOOL_DEFINITIONS;
    case 'data_science':
      return DATA_SCIENCE_TOOL_DEFINITIONS;
    case 'geo_location':
      return GEO_LOCATION_TOOL_DEFINITIONS;
    case 'cloud_control':
      return CLOUD_CONTROL_TOOL_DEFINITIONS;
    case 'advanced_security':
      return ADVANCED_SECURITY_TOOL_DEFINITIONS;
    // V5 enterprise categories
    case 'financial':
      return FINANCIAL_TOOL_DEFINITIONS;
    case 'project_mgmt':
      return PROJECT_MGMT_TOOL_DEFINITIONS;
    case 'email_comm':
      return EMAIL_COMM_TOOL_DEFINITIONS;
    case 'sales_crm':
      return SALES_CRM_TOOL_DEFINITIONS;
    case 'hr_recruiting':
      return HR_RECRUITING_TOOL_DEFINITIONS;
    case 'legal_compliance':
      return LEGAL_COMPLIANCE_TOOL_DEFINITIONS;
    case 'marketing_seo':
      return MARKETING_SEO_TOOL_DEFINITIONS;
    default:
      return [];
  }
}

/**
 * Get all tool categories
 */
export function getCategories() {
  return [
    { name: 'core', count: TOOL_DEFINITIONS.length, description: 'File system, git, terminal, HTTP' },
    { name: 'canvas', count: CANVAS_TOOL_DEFINITIONS.length, description: 'Workspace and project management' },
    { name: 'image', count: IMAGE_TOOL_DEFINITIONS.length, description: 'Image generation and editing' },
    { name: 'video', count: VIDEO_TOOL_DEFINITIONS.length, description: 'Video generation' },
    { name: 'archive', count: ARCHIVE_TOOL_DEFINITIONS.length, description: 'Export, backup, restore' },
    { name: 'backend', count: BACKEND_TOOL_DEFINITIONS.length, description: 'API and database generation' },
    { name: 'code', count: CODE_TOOL_DEFINITIONS.length, description: 'Code execution and analysis' },
    { name: 'editor', count: EDITOR_TOOL_DEFINITIONS.length, description: 'Editor operations' },
    { name: 'agent_control', count: AGENT_CONTROL_TOOL_DEFINITIONS.length, description: 'Agent mode and state' },
    { name: 'core_utility', count: CORE_UTILITY_TOOL_DEFINITIONS.length, description: 'JSON, date/time, text transform' },
    { name: 'document_parsing', count: DOCUMENT_PARSING_TOOL_DEFINITIONS.length, description: 'PDF, CSV, XML, YAML, DOCX, XLSX, HTML parsing' },
    { name: 'dev', count: DEV_TOOL_DEFINITIONS.length, description: 'Format, lint, compile, bundle, test' },
    { name: 'web_frontend', count: WEB_FRONTEND_TOOL_DEFINITIONS.length, description: 'HTML/CSS gen, a11y, SEO, performance' },
    { name: 'database', count: DATABASE_TOOL_DEFINITIONS.length, description: 'Query, schema, backup, migrate, analyze' },
    { name: 'api', count: API_TOOL_DEFINITIONS.length, description: 'HTTP, mock, docs, test, transform, webhook' },
    { name: 'ai_ml', count: AI_ML_TOOL_DEFINITIONS.length, description: 'LLM chat, embed, ML train/predict' },
    { name: 'security', count: SECURITY_TOOL_DEFINITIONS.length, description: 'Crypto, scanning, auth generation' },
    { name: 'content_markdown', count: CONTENT_MARKDOWN_TOOL_DEFINITIONS.length, description: 'Markdown convert, validate, generate' },
    { name: 'analytics', count: ANALYTICS_TOOL_DEFINITIONS.length, description: 'Track events, reports, monitoring' },
    { name: 'filesystem', count: FILE_SYSTEM_TOOL_DEFINITIONS.length, description: 'File search, compression' },
    // V3 categories (AK 47)
    { name: 'deployment_docker', count: DEPLOYMENT_DOCKER_TOOL_DEFINITIONS.length, description: 'Docker, CI/CD, static deploy' },
    { name: 'communication', count: COMMUNICATION_TOOL_DEFINITIONS.length, description: 'Email, push, webhooks, SMS' },
    { name: 'ui_interaction', count: UI_INTERACTION_TOOL_DEFINITIONS.length, description: 'Approvals, questions, messages' },
    // V4 categories
    { name: 'workflow', count: WORKFLOW_TOOL_DEFINITIONS.length, description: 'Workflow automation and scheduling' },
    { name: 'knowledge_graph', count: KNOWLEDGE_GRAPH_TOOL_DEFINITIONS.length, description: 'Knowledge graph CRUD and reasoning' },
    { name: 'business_growth', count: BUSINESS_GROWTH_TOOL_DEFINITIONS.length, description: 'Funnels, pricing, A/B tests, leads, campaigns' },
    { name: 'collaboration', count: COLLABORATION_TOOL_DEFINITIONS.length, description: 'Teams, comments, tasks, approvals' },
    { name: 'advanced_ai', count: ADVANCED_AI_TOOL_DEFINITIONS.length, description: 'LLM routing, guardrails, agent orchestration' },
    { name: 'data_science', count: DATA_SCIENCE_TOOL_DEFINITIONS.length, description: 'Data profiling, cleaning, visualization, ML' },
    { name: 'geo_location', count: GEO_LOCATION_TOOL_DEFINITIONS.length, description: 'Geocoding, routing, distance, geofencing' },
    { name: 'cloud_control', count: CLOUD_CONTROL_TOOL_DEFINITIONS.length, description: 'Cloud deploy, scale, logs, secrets, cost' },
    { name: 'advanced_security', count: ADVANCED_SECURITY_TOOL_DEFINITIONS.length, description: 'Vulnerability scan, policy, threat model, incidents' },
    // V5 enterprise categories
    { name: 'financial', count: FINANCIAL_TOOL_DEFINITIONS.length, description: 'Invoices, expenses, budgets, reports, tax, payments' },
    { name: 'project_mgmt', count: PROJECT_MGMT_TOOL_DEFINITIONS.length, description: 'Projects, tasks, milestones, sprints, resources' },
    { name: 'email_comm', count: EMAIL_COMM_TOOL_DEFINITIONS.length, description: 'Email, templates, newsletters, SMS, calendar' },
    { name: 'sales_crm', count: SALES_CRM_TOOL_DEFINITIONS.length, description: 'Leads, pipeline, deals, proposals, contracts' },
    { name: 'hr_recruiting', count: HR_RECRUITING_TOOL_DEFINITIONS.length, description: 'Resumes, jobs, interviews, payroll, reviews' },
    { name: 'legal_compliance', count: LEGAL_COMPLIANCE_TOOL_DEFINITIONS.length, description: 'Contracts, compliance, NDA, terms, privacy, IP' },
    { name: 'marketing_seo', count: MARKETING_SEO_TOOL_DEFINITIONS.length, description: 'SEO audit, keywords, social, campaigns, A/B tests' },
  ];
}

/**
 * Get tools for a given chat mode.
 * 
 * Provider tool limits:
 *   - Groq / OpenAI: 128 max
 *   - xAI (Grok):     200 max
 *   - Anthropic:       ~200 (schema-strict)
 *   - Mistral:         ~128
 * 
 * Strategy: return the most relevant subset for the mode, capped at 128
 * so it works across ALL providers without rejection.
 */

// Cache mode tool sets to avoid re-computing on every request
const _modeToolCache = new Map();

export function getToolsForMode(chatMode = 'Chat') {
  // Return cached result if available
  if (_modeToolCache.has(chatMode)) return _modeToolCache.get(chatMode);

  const MAX_TOOLS = 128; // Strictest provider limit (Groq / OpenAI)

  let selectedTools;

  switch (chatMode) {
    case 'Chat': {
      // Chat mode: core conversational + utility tools
      // Core (55) + CoreUtility (6) + AgentMemory (1) + DocParsing + Code + API + Content + Database
      const chatCategories = [
        ...TOOL_DEFINITIONS,           // 55: file ops, git, terminal, web search, http, generate_image, etc.
        ...CORE_UTILITY_TOOL_DEFINITIONS, // 6: calculate, time, weather, fetch_url, execute_code, generate_video
        ...DOCUMENT_PARSING_TOOL_DEFINITIONS,
        ...CODE_TOOL_DEFINITIONS,
        ...API_TOOL_DEFINITIONS,
        ...CONTENT_MARKDOWN_TOOL_DEFINITIONS,
        ...DATABASE_TOOL_DEFINITIONS,
      ];
      // Deduplicate by name (keep last)
      const seen = new Map();
      for (const t of chatCategories) seen.set(t.name, t);
      selectedTools = [...seen.values()].slice(0, MAX_TOOLS);
      break;
    }

    case 'Web Search':
    case 'Deep Research': {
      // Research mode: core + utility + content + api + analytics
      const researchCategories = [
        ...TOOL_DEFINITIONS,
        ...CORE_UTILITY_TOOL_DEFINITIONS,
        ...API_TOOL_DEFINITIONS,
        ...CONTENT_MARKDOWN_TOOL_DEFINITIONS,
        ...ANALYTICS_TOOL_DEFINITIONS,
        ...DOCUMENT_PARSING_TOOL_DEFINITIONS,
      ];
      const seen = new Map();
      for (const t of researchCategories) seen.set(t.name, t);
      selectedTools = [...seen.values()].slice(0, MAX_TOOLS);
      break;
    }

    case 'Create Image': {
      // Image mode: core + image + canvas
      const imageCategories = [
        ...TOOL_DEFINITIONS,
        ...CORE_UTILITY_TOOL_DEFINITIONS,
        ...IMAGE_TOOL_DEFINITIONS,
        ...CANVAS_TOOL_DEFINITIONS,
      ];
      const seen = new Map();
      for (const t of imageCategories) seen.set(t.name, t);
      selectedTools = [...seen.values()].slice(0, MAX_TOOLS);
      break;
    }

    default: {
      // Agent / Thinking / unknown modes: broad set, capped at 128
      // Prioritize: core + utility + agent + code + backend + api + canvas + image + database + filesystem
      //           + dev + editor + video + web frontend + AI/ML (HIGH-priority modules)
      const agentCategories = [
        ...TOOL_DEFINITIONS,
        ...CORE_UTILITY_TOOL_DEFINITIONS,
        ...AGENT_CONTROL_TOOL_DEFINITIONS,
        ...CODE_TOOL_DEFINITIONS,
        ...BACKEND_TOOL_DEFINITIONS,
        ...API_TOOL_DEFINITIONS,
        ...CANVAS_TOOL_DEFINITIONS,
        ...IMAGE_TOOL_DEFINITIONS,
        ...DATABASE_TOOL_DEFINITIONS,
        ...FILE_SYSTEM_TOOL_DEFINITIONS,
        ...CONTENT_MARKDOWN_TOOL_DEFINITIONS,
        ...DOCUMENT_PARSING_TOOL_DEFINITIONS,
        ...SECURITY_TOOL_DEFINITIONS,
        ...UI_INTERACTION_TOOL_DEFINITIONS,
        // HIGH-priority modules added to default Agent mode
        ...DEV_TOOL_DEFINITIONS,
        ...EDITOR_TOOL_DEFINITIONS,
        ...VIDEO_TOOL_DEFINITIONS,
        ...WEB_FRONTEND_TOOL_DEFINITIONS,
        ...AI_ML_TOOL_DEFINITIONS,
      ];
      const seen = new Map();
      for (const t of agentCategories) seen.set(t.name, t);
      selectedTools = [...seen.values()].slice(0, MAX_TOOLS);
      break;
    }
  }

  _modeToolCache.set(chatMode, selectedTools);
  return selectedTools;
}

/**
 * Get tools for a specific canvas panel.
 * Each panel only receives the tool subset it actually needs — keeps context
 * windows small and prevents the model from hallucinating irrelevant tools.
 *
 * Panel names match the `ActivePanel` type in canvas/App.tsx.
 */
const _panelToolCache = new Map();

export function getToolsForPanel(panel = 'assistant') {
  if (_panelToolCache.has(panel)) return _panelToolCache.get(panel);

  const MAX_TOOLS = 128;

  // Core file/git/terminal/http tools always included as a base
  const CORE = TOOL_DEFINITIONS;

  const PANEL_CATEGORIES = {
    // ── Media ──
    'image-tools': [
      ...CORE, ...IMAGE_TOOL_DEFINITIONS, ...CORE_UTILITY_TOOL_DEFINITIONS, ...FILE_SYSTEM_TOOL_DEFINITIONS,
    ],
    'video': [
      ...CORE, ...VIDEO_TOOL_DEFINITIONS, ...CORE_UTILITY_TOOL_DEFINITIONS, ...FILE_SYSTEM_TOOL_DEFINITIONS,
    ],
    'video-processing': [
      ...CORE, ...VIDEO_TOOL_DEFINITIONS, ...CORE_UTILITY_TOOL_DEFINITIONS, ...FILE_SYSTEM_TOOL_DEFINITIONS,
    ],
    'assets': [
      ...CORE, ...IMAGE_TOOL_DEFINITIONS, ...VIDEO_TOOL_DEFINITIONS, ...FILE_SYSTEM_TOOL_DEFINITIONS, ...ARCHIVE_TOOL_DEFINITIONS,
    ],

    // ── Code & Dev ──
    'code-tools': [
      ...CORE, ...CODE_TOOL_DEFINITIONS, ...DEV_TOOL_DEFINITIONS, ...EDITOR_TOOL_DEFINITIONS, ...FILE_SYSTEM_TOOL_DEFINITIONS,
    ],
    'dev-tools': [
      ...CORE, ...DEV_TOOL_DEFINITIONS, ...CODE_TOOL_DEFINITIONS, ...EDITOR_TOOL_DEFINITIONS, ...FILE_SYSTEM_TOOL_DEFINITIONS,
    ],
    'canvas-tools': [
      ...CORE, ...CANVAS_TOOL_DEFINITIONS, ...EDITOR_TOOL_DEFINITIONS, ...CODE_TOOL_DEFINITIONS,
    ],

    // ── Backend & Infra ──
    'backend-tools': [
      ...CORE, ...BACKEND_TOOL_DEFINITIONS, ...CODE_TOOL_DEFINITIONS, ...DATABASE_TOOL_DEFINITIONS,
      ...API_TOOL_DEFINITIONS, ...SECURITY_TOOL_DEFINITIONS, ...DEPLOYMENT_DOCKER_TOOL_DEFINITIONS,
    ],
    'database': [
      ...CORE, ...DATABASE_TOOL_DEFINITIONS, ...BACKEND_TOOL_DEFINITIONS, ...CODE_TOOL_DEFINITIONS,
    ],
    'docker': [
      ...CORE, ...DEPLOYMENT_DOCKER_TOOL_DEFINITIONS, ...CODE_TOOL_DEFINITIONS, ...BACKEND_TOOL_DEFINITIONS,
    ],
    'deploy': [
      ...CORE, ...DEPLOYMENT_DOCKER_TOOL_DEFINITIONS, ...BACKEND_TOOL_DEFINITIONS, ...CODE_TOOL_DEFINITIONS, ...SECURITY_TOOL_DEFINITIONS,
    ],

    // ── Web & API ──
    'api-tools': [
      ...CORE, ...API_TOOL_DEFINITIONS, ...CODE_TOOL_DEFINITIONS, ...CORE_UTILITY_TOOL_DEFINITIONS, ...BACKEND_TOOL_DEFINITIONS,
    ],
    'web-tools': [
      ...CORE, ...WEB_FRONTEND_TOOL_DEFINITIONS, ...CODE_TOOL_DEFINITIONS, ...CORE_UTILITY_TOOL_DEFINITIONS, ...DEV_TOOL_DEFINITIONS,
    ],

    // ── Content & Docs ──
    'content-markdown': [
      ...CORE, ...CONTENT_MARKDOWN_TOOL_DEFINITIONS, ...DOCUMENT_PARSING_TOOL_DEFINITIONS, ...CORE_UTILITY_TOOL_DEFINITIONS,
    ],
    'document-parsing': [
      ...CORE, ...DOCUMENT_PARSING_TOOL_DEFINITIONS, ...CONTENT_MARKDOWN_TOOL_DEFINITIONS, ...CORE_UTILITY_TOOL_DEFINITIONS, ...FILE_SYSTEM_TOOL_DEFINITIONS,
    ],

    // ── Security ──
    'security': [
      ...CORE, ...SECURITY_TOOL_DEFINITIONS, ...CODE_TOOL_DEFINITIONS, ...CORE_UTILITY_TOOL_DEFINITIONS,
    ],

    // ── Communication & Analytics ──
    'communication': [
      ...CORE, ...COMMUNICATION_TOOL_DEFINITIONS, ...CORE_UTILITY_TOOL_DEFINITIONS,
    ],
    'collaboration': [
      ...CORE, ...COMMUNICATION_TOOL_DEFINITIONS, ...ANALYTICS_TOOL_DEFINITIONS, ...CORE_UTILITY_TOOL_DEFINITIONS,
    ],

    // ── AI / ML ──
    'ai': [
      ...CORE, ...AI_ML_TOOL_DEFINITIONS, ...CODE_TOOL_DEFINITIONS, ...CORE_UTILITY_TOOL_DEFINITIONS, ...API_TOOL_DEFINITIONS,
    ],

    // ── Enterprise ──
    'financial': [
      ...CORE, ...FINANCIAL_TOOL_DEFINITIONS, ...CORE_UTILITY_TOOL_DEFINITIONS,
    ],
    'project-management': [
      ...CORE, ...PROJECT_MGMT_TOOL_DEFINITIONS, ...COLLABORATION_TOOL_DEFINITIONS, ...CORE_UTILITY_TOOL_DEFINITIONS,
    ],
    'email': [
      ...CORE, ...EMAIL_COMM_TOOL_DEFINITIONS, ...COMMUNICATION_TOOL_DEFINITIONS, ...CORE_UTILITY_TOOL_DEFINITIONS,
    ],
    'sales-crm': [
      ...CORE, ...SALES_CRM_TOOL_DEFINITIONS, ...ANALYTICS_TOOL_DEFINITIONS, ...CORE_UTILITY_TOOL_DEFINITIONS,
    ],
    'hr-recruiting': [
      ...CORE, ...HR_RECRUITING_TOOL_DEFINITIONS, ...CORE_UTILITY_TOOL_DEFINITIONS,
    ],
    'legal-compliance': [
      ...CORE, ...LEGAL_COMPLIANCE_TOOL_DEFINITIONS, ...CORE_UTILITY_TOOL_DEFINITIONS,
    ],
    'marketing-seo': [
      ...CORE, ...MARKETING_SEO_TOOL_DEFINITIONS, ...ANALYTICS_TOOL_DEFINITIONS, ...CORE_UTILITY_TOOL_DEFINITIONS,
    ],

    // ── Files / Archive ──
    'files': [
      ...CORE, ...FILE_SYSTEM_TOOL_DEFINITIONS, ...ARCHIVE_TOOL_DEFINITIONS, ...CORE_UTILITY_TOOL_DEFINITIONS,
    ],

    // ── Build / Workspace (full agent set) ──
    'build':       null, // → full Agent set
    'workspace':   null,
    'assistant':   null,
    'project':     null,
    'dashboard':   null,
  };

  const raw = PANEL_CATEGORIES[panel];
  let tools;

  if (raw === null || raw === undefined) {
    // Full agent set for general/build panels
    tools = getToolsForMode('Agent');
  } else {
    const seen = new Map();
    for (const t of raw) seen.set(t.name, t);
    tools = [...seen.values()].slice(0, MAX_TOOLS);
  }

  _panelToolCache.set(panel, tools);
  return tools;
}

/**
 * Format tools for AI provider (Anthropic/OpenAI format)
 */
export function formatToolsForProvider(provider = 'openai') {
  if (provider === 'openai') {
    return ALL_TOOLS.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.input_schema || tool.parameters || { type: 'object', properties: {} }
      }
    }));
  }

  // Anthropic format (default)
  return ALL_TOOLS.map(tool => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.input_schema || tool.parameters || { type: 'object', properties: {} }
  }));
}


// ============================================================================
// RE-EXPORT AGENT UTILITIES (for apps that need direct access)
// ============================================================================

export {
  // Agent modes and state
  AGENT_MODES,
  getAgentState,

  // Individual tool arrays (for apps that need specific categories)
  TOOL_DEFINITIONS,
  CANVAS_TOOL_DEFINITIONS,
  IMAGE_TOOL_DEFINITIONS,
  VIDEO_TOOL_DEFINITIONS,
  ARCHIVE_TOOL_DEFINITIONS,
  BACKEND_TOOL_DEFINITIONS,
  CODE_TOOL_DEFINITIONS,
  EDITOR_TOOL_DEFINITIONS,
  AGENT_CONTROL_TOOL_DEFINITIONS,

  // V2 tool modules
  CORE_UTILITY_TOOL_DEFINITIONS,
  DOCUMENT_PARSING_TOOL_DEFINITIONS,
  DEV_TOOL_DEFINITIONS,
  WEB_FRONTEND_TOOL_DEFINITIONS,
  DATABASE_TOOL_DEFINITIONS,
  API_TOOL_DEFINITIONS,
  AI_ML_TOOL_DEFINITIONS,
  SECURITY_TOOL_DEFINITIONS,
  CONTENT_MARKDOWN_TOOL_DEFINITIONS,
  ANALYTICS_TOOL_DEFINITIONS,
  FILE_SYSTEM_TOOL_DEFINITIONS,

  // V3 tool modules (AK 47)
  DEPLOYMENT_DOCKER_TOOL_DEFINITIONS,
  COMMUNICATION_TOOL_DEFINITIONS,

  // UI Interaction tools
  UI_INTERACTION_TOOL_DEFINITIONS,

  // V5 Enterprise tool modules
  FINANCIAL_TOOL_DEFINITIONS,
  PROJECT_MGMT_TOOL_DEFINITIONS,
  EMAIL_COMM_TOOL_DEFINITIONS,
  SALES_CRM_TOOL_DEFINITIONS,
  HR_RECRUITING_TOOL_DEFINITIONS,
  LEGAL_COMPLIANCE_TOOL_DEFINITIONS,
  MARKETING_SEO_TOOL_DEFINITIONS,
};


// ============================================================================
// RE-EXPORT INDIVIDUAL EXECUTORS (for apps that need sideEffects/callbacks)
// ============================================================================

export { executeCanvasTool } from './canvasTools.js';
export { executeImageTool, isImageTool } from './imageTools.js';
export { executeVideoTool, isVideoTool } from './videoTools.js';
export { executeArchiveTool, isArchiveTool } from './archiveTools.js';
export { executeBackendTool, isBackendTool } from './backendTools.js';
export { executeCodeTool, isCodeTool } from './codeTools.js';
export { executeEditorTool, isEditorTool } from './editorTools.js';
export { executeAgentControlTool, isAgentControlTool } from './agentControlTools.js';

// V2 tool module executors
export { executeCoreUtilityTool, isCoreUtilityTool } from './coreUtilityTools.js';
export { executeDocumentParsingTool, isDocumentParsingTool } from './documentParsingTools.js';
export { executeDevTool, isDevTool } from './devTools.js';
export { executeWebFrontendTool, isWebFrontendTool } from './webFrontendTools.js';
export { executeDatabaseTool, isDatabaseTool } from './databaseTools.js';
export { executeApiTool, isApiTool } from './apiTools.js';
export { executeAiMlTool, isAiMlTool } from './aiMlTools.js';
export { executeSecurityTool, isSecurityTool } from './securityTools.js';
export { executeContentMarkdownTool, isContentMarkdownTool } from './contentMarkdownTools.js';
export { executeAnalyticsTool, isAnalyticsTool } from './analyticsTools.js';
export { executeFileSystemTool, isFileSystemTool } from './fileSystemTools.js';

// V3 tool module executors (AK 47)
export { executeDeploymentDockerTool, isDeploymentDockerTool } from './deploymentDockerTools.js';
export { executeCommunicationTool, isCommunicationTool } from './communicationTools.js';

// V5 Enterprise tool module executors
export { executeFinancialTool, isFinancialTool } from './financialTools.js';
export { executeProjectMgmtTool, isProjectMgmtTool } from './projectMgmtTools.js';
export { executeEmailCommTool, isEmailCommTool } from './emailCommTools.js';
export { executeSalesCrmTool, isSalesCrmTool } from './salesCrmTools.js';
export { executeHrRecruitingTool, isHrRecruitingTool } from './hrRecruitingTools.js';
export { executeLegalComplianceTool, isLegalComplianceTool } from './legalComplianceTools.js';
export { executeMarketingSeoTool, isMarketingSeoTool } from './marketingSeoTools.js';


// ============================================================================
// STATS
// ============================================================================

console.log(`[ToolsHQ] Loaded ${ALL_TOOLS.length} unique tools from ${getCategories().length} categories (deduped from ${_rawTools.length} raw)`);
