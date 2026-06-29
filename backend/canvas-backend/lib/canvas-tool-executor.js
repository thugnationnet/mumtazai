/**
 * ============================================================================
 * CANVAS TOOL EXECUTOR (Layer 2)
 * ============================================================================
 * Centralized tool dispatcher. Receives a tool name + input from the LLM,
 * routes to the correct service executor, applies timeout + hooks lifecycle.
 *
 * This is the execution counterpart to canvas-tool-definitions.js (Layer 1).
 * Together they form the dual-layer tool system:
 *   Layer 1 (Definitions): Schema registry — what tools exist + their schemas
 *   Layer 2 (Executor):    Dispatch layer — how tools get executed
 *
 * Exports:
 *   executeCanvasToolDispatch() — Main entry: routes toolName → correct executor
 *   registerHook()             — Register beforeRun/afterRun/onError hooks
 *   isDangerousTool()          — Check if tool requires user confirmation
 * ============================================================================
 */

// ============================================================================
// IMPORT ALL EXECUTORS
// ============================================================================

// Core tools
import { executeTool as executeCoreTool, TOOL_DEFINITIONS } from '../services/tools.js';

// Canvas/Workspace tools
import { executeCanvasTool, CANVAS_TOOL_DEFINITIONS } from '../services/canvasTools.js';

// Image tools
import { executeImageTool, isImageTool } from '../services/imageTools.js';

// Video tools
import { executeVideoTool, isVideoTool } from '../services/videoTools.js';

// Archive tools
import { executeArchiveTool, isArchiveTool } from '../services/archiveTools.js';

// Backend tools
import { executeBackendTool, isBackendTool } from '../services/backendTools.js';

// Code tools
import { executeCodeTool, isCodeTool } from '../services/codeTools.js';

// Editor tools
import { executeEditorTool, isEditorTool } from '../services/editorTools.js';

// Agent Control tools
import { executeAgentControlTool, isAgentControlTool } from '../services/agentControlTools.js';

// V2 tool modules
import { executeCoreUtilityTool, isCoreUtilityTool } from '../services/coreUtilityTools.js';
import { executeDocumentParsingTool, isDocumentParsingTool } from '../services/documentParsingTools.js';
import { executeDevTool, isDevTool } from '../services/devTools.js';
import { executeWebFrontendTool, isWebFrontendTool } from '../services/webFrontendTools.js';
import { executeDatabaseTool, isDatabaseTool } from '../services/databaseTools.js';
import { executeApiTool, isApiTool } from '../services/apiTools.js';
import { executeAiMlTool, isAiMlTool } from '../services/aiMlTools.js';
import { executeSecurityTool, isSecurityTool } from '../services/securityTools.js';
import { executeContentMarkdownTool, isContentMarkdownTool } from '../services/contentMarkdownTools.js';
import { executeAnalyticsTool, isAnalyticsTool } from '../services/analyticsTools.js';
import { executeFileSystemTool, isFileSystemTool } from '../services/fileSystemTools.js';

// V3 tool modules
import { executeDeploymentDockerTool, isDeploymentDockerTool } from '../services/deploymentDockerTools.js';
import { executeCommunicationTool, isCommunicationTool } from '../services/communicationTools.js';
import { executeUiInteractionTool, isUiInteractionTool } from '../services/uiInteractionTools.js';

// V4 tool modules
import { executeWorkflowTool, isWorkflowTool } from '../services/workflowTools.js';
import { executeKnowledgeGraphTool, isKnowledgeGraphTool } from '../services/knowledgeGraphTools.js';
import { executeBusinessGrowthTool, isBusinessGrowthTool } from '../services/businessGrowthTools.js';
import { executeCollaborationTool, isCollaborationTool } from '../services/collaborationTools.js';
import { executeAdvancedAiTool, isAdvancedAiTool } from '../services/advancedAiTools.js';
import { executeDataScienceTool, isDataScienceTool } from '../services/dataScienceTools.js';
import { executeGeoLocationTool, isGeoLocationTool } from '../services/geoLocationTools.js';
import { executeCloudControlTool, isCloudControlTool } from '../services/cloudControlTools.js';
import { executeAdvancedSecurityTool, isAdvancedSecurityTool } from '../services/advancedSecurityTools.js';

// V5 Enterprise tool modules
import { executeFinancialTool, isFinancialTool } from '../services/financialTools.js';
import { executeProjectMgmtTool, isProjectMgmtTool } from '../services/projectMgmtTools.js';
import { executeEmailCommTool, isEmailCommTool } from '../services/emailCommTools.js';
import { executeSalesCrmTool, isSalesCrmTool } from '../services/salesCrmTools.js';
import { executeHrRecruitingTool, isHrRecruitingTool } from '../services/hrRecruitingTools.js';
import { executeLegalComplianceTool, isLegalComplianceTool } from '../services/legalComplianceTools.js';
import { executeMarketingSeoTool, isMarketingSeoTool } from '../services/marketingSeoTools.js';


// ============================================================================
// TOOL NAME SETS (for fast routing)
// ============================================================================

const CORE_TOOL_NAMES = new Set(TOOL_DEFINITIONS.map(t => t.name));
const CANVAS_TOOL_NAMES = new Set(CANVAS_TOOL_DEFINITIONS.map(t => t.name));


// ============================================================================
// TOOL TIMEOUTS
// ============================================================================

const DEFAULT_TIMEOUT_MS = 30_000;

const TOOL_TIMEOUTS = {
  'generate_image': 120_000,
  'canvas_image_generate': 120_000,
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
  'canvas_terminal_run': 60_000,
  'canvas_build_validate': 60_000,
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
    try { await fn(payload); } catch (e) { console.error(`[CanvasToolExecutor] Hook ${event} error:`, e.message); }
  }
}


// ============================================================================
// DANGEROUS / CONFIRMATION TOOLS
// ============================================================================

const DANGEROUS_TOOLS = new Set([
  'deploy_static', 'docker_build', 'docker_compose_up', 'docker_run',
  'delete_file', 'rm_directory', 'git_push', 'git_reset',
  'database_query', 'send_email', 'send_sms', 'send_push_notification',
  'canvas_file_delete', 'canvas_terminal_run', 'canvas_deploy',
  'canvas_project_add_dependency', 'canvas_project_set_env',
  'payment_process',
]);

export function isDangerousTool(toolName) {
  return DANGEROUS_TOOLS.has(toolName);
}


// ============================================================================
// MAIN DISPATCHER
// ============================================================================

/**
 * Execute a tool call with timeout protection and hook lifecycle.
 *
 * @param {string} toolName - Tool name from LLM response
 * @param {object} input - Tool parameters from LLM response
 * @param {object} ctx - Execution context (userId, sessionId, deps, etc.)
 * @returns {Promise<{result: string, sideEffects?: object}>}
 */
export async function executeCanvasToolDispatch(toolName, input, ctx = {}) {
  console.log(`[CanvasToolExecutor] Dispatching: ${toolName}`);

  const hookPayload = { toolName, input, ctx, startTime: Date.now() };
  await runHooks('beforeRun', hookPayload);

  try {
    const timeoutMs = getTimeoutForTool(toolName);
    const rawResult = await withTimeout(
      _dispatchTool(toolName, input, ctx),
      timeoutMs,
      toolName
    );

    const normalized = normalizeToolResult(toolName, rawResult);
    await runHooks('afterRun', { ...hookPayload, result: normalized, durationMs: Date.now() - hookPayload.startTime });
    return normalized;

  } catch (error) {
    console.error(`[CanvasToolExecutor] Error executing ${toolName}:`, error);
    const errorResult = {
      result: JSON.stringify({ status: 'error', error: error.message, tool: toolName }),
      sideEffects: null
    };
    await runHooks('onError', { ...hookPayload, error, durationMs: Date.now() - hookPayload.startTime });
    return errorResult;
  }
}


// ============================================================================
// INTERNAL DISPATCH (routes toolName → correct executor)
// ============================================================================

async function _dispatchTool(toolName, input, ctx) {
  // Agent tools first (highest priority)
  if (isAgentControlTool(toolName)) return executeAgentControlTool(toolName, input, ctx);

  // Media tools
  if (isImageTool(toolName)) return executeImageTool(toolName, input, ctx);
  if (isVideoTool(toolName)) return executeVideoTool(toolName, input, ctx);

  // Project tools
  if (isArchiveTool(toolName)) return executeArchiveTool(toolName, input, ctx);
  if (isBackendTool(toolName)) return executeBackendTool(toolName, input, ctx);
  if (isCodeTool(toolName)) return executeCodeTool(toolName, input, ctx);
  if (isEditorTool(toolName)) return executeEditorTool(toolName, input, ctx.editorContext || {}, ctx.sseWrite || (() => {}));

  // V2 tool modules
  if (isCoreUtilityTool(toolName)) return executeCoreUtilityTool(toolName, input, ctx);
  if (isDocumentParsingTool(toolName)) return executeDocumentParsingTool(toolName, input, ctx);
  if (isDevTool(toolName)) return executeDevTool(toolName, input, ctx);
  if (isWebFrontendTool(toolName)) return executeWebFrontendTool(toolName, input, ctx);
  if (isDatabaseTool(toolName)) return executeDatabaseTool(toolName, input, ctx);
  if (isApiTool(toolName)) return executeApiTool(toolName, input, ctx);
  if (isAiMlTool(toolName)) return executeAiMlTool(toolName, input, ctx);
  if (isSecurityTool(toolName)) return executeSecurityTool(toolName, input, ctx);
  if (isContentMarkdownTool(toolName)) return executeContentMarkdownTool(toolName, input, ctx);
  if (isAnalyticsTool(toolName)) return executeAnalyticsTool(toolName, input, ctx);
  if (isFileSystemTool(toolName)) return executeFileSystemTool(toolName, input, ctx);

  // V3 tool modules
  if (isDeploymentDockerTool(toolName)) return executeDeploymentDockerTool(toolName, input, ctx);
  if (isCommunicationTool(toolName)) return executeCommunicationTool(toolName, input, ctx);
  if (isUiInteractionTool(toolName)) return executeUiInteractionTool(toolName, input, ctx);

  // V4 tool modules
  if (isWorkflowTool(toolName)) return executeWorkflowTool(toolName, input, ctx);
  if (isKnowledgeGraphTool(toolName)) return executeKnowledgeGraphTool(toolName, input, ctx);
  if (isBusinessGrowthTool(toolName)) return executeBusinessGrowthTool(toolName, input, ctx);
  if (isCollaborationTool(toolName)) return executeCollaborationTool(toolName, input, ctx);
  if (isAdvancedAiTool(toolName)) return executeAdvancedAiTool(toolName, input, ctx);
  if (isDataScienceTool(toolName)) return executeDataScienceTool(toolName, input, ctx);
  if (isGeoLocationTool(toolName)) return executeGeoLocationTool(toolName, input, ctx);
  if (isCloudControlTool(toolName)) return executeCloudControlTool(toolName, input, ctx);
  if (isAdvancedSecurityTool(toolName)) return executeAdvancedSecurityTool(toolName, input, ctx);

  // V5 Enterprise tool modules
  if (isFinancialTool(toolName)) return executeFinancialTool(toolName, input, ctx);
  if (isProjectMgmtTool(toolName)) return executeProjectMgmtTool(toolName, input, ctx);
  if (isEmailCommTool(toolName)) return executeEmailCommTool(toolName, input, ctx);
  if (isSalesCrmTool(toolName)) return executeSalesCrmTool(toolName, input, ctx);
  if (isHrRecruitingTool(toolName)) return executeHrRecruitingTool(toolName, input, ctx);
  if (isLegalComplianceTool(toolName)) return executeLegalComplianceTool(toolName, input, ctx);
  if (isMarketingSeoTool(toolName)) return executeMarketingSeoTool(toolName, input, ctx);

  // Canvas tools
  if (CANVAS_TOOL_NAMES.has(toolName)) return executeCanvasTool(toolName, input, ctx);

  // Core tools (file system, git, terminal, http, etc.)
  if (CORE_TOOL_NAMES.has(toolName)) return executeCoreTool(toolName, input, ctx.deps || ctx);

  throw new Error(`Unknown tool: ${toolName}`);
}


// ============================================================================
// RESULT NORMALIZER
// ============================================================================

function normalizeToolResult(toolName, rawResult) {
  // Already normalized
  if (rawResult && typeof rawResult === 'object' && typeof rawResult.result === 'string') {
    return { result: rawResult.result, sideEffects: rawResult.sideEffects || null };
  }

  // Raw JSON string
  if (typeof rawResult === 'string') {
    return { result: rawResult, sideEffects: null };
  }

  // Object without .result
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
// STATS
// ============================================================================

console.log(`[CanvasToolExecutor] Dispatcher ready — routing to ${39} service executors`);
