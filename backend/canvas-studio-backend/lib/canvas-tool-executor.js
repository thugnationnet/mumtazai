/**
 * CANVAS TOOL EXECUTOR
 *
 * Backend executes tools chosen by the LLM.
 *
 * - File operations mutate the in-memory project file list, then return results
 * - Terminal/build operations write files to a temp sandbox, execute, return output
 * - Deploy operations delegate to canvas-deploy-routes logic
 *
 * The project files array is passed in and mutated — the caller is responsible
 * for persisting the final state back to the database.
 */

import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import {
  archiveCore,
  archiveEdit,
  archiveStructure,
  archiveSecurity,
  archiveBulk,
  archiveConvert,
  archiveIntelligence,
  archiveDeploy,
} from './archive-processing-service.js';
import {
  devFilesystem,
  devSearch,
  devIntelligence,
  devDebug,
} from './web-dev-tools-service.js';
import {
  devTest,
  devGit,
  devNpm,
  devDocker,
  webScreenshot,
  webLighthouse,
  webScrape,
  dbQuery,
  dbSchema,
  dbBackup,
  dbMigrate,
  dbAnalyze,
  dbConnect,
  apiRequest,
  apiMock,
  apiDocument,
  apiTest,
  apiTransform,
  webhookListen,
  sdkGenerate,
  apiValidate,
  apiProxy,
  apiDiff,
  llmChat,
  llmEmbed,
  llmFinetune,
  mlTrain,
  mlPredict,
  llmAnalyze,
  llmModerate,
  mlPipeline,
  cryptoHash,
  cryptoEncrypt,
  cryptoSign,
  scanSecrets,
  scanMalware,
  authGenerate,
  scanDependency,
  passwordAudit,
  sslInspect,
  saveContext,
  recallContext,
  writeFile,
  createFolder,
  listFolders,
  fileExists,
  getProjectTree,
  moveFile,
  zipFiles,
  unzipFiles,
  fileWatch,
  syncFiles,
  markdownConvert,
  markdownValidate,
  markdownGenerate,
  markdownToc,
  markdownFormat,
  markdownMerge,
  markdownExtract,
  markdownSlides,
  analyticsTrack,
  analyticsDashboard,
  logParse,
  monitorHealth,
  telemetrySend,
  analyticsExport,
  logAggregate,
  metricsCollect,
  workflowCreate,
  workflowExecute,
  workflowSchedule,
  workflowVisualize,
  workflowOptimize,
  workflowTemplate,
  workflowHistory,
  workflowValidate,
  kgCreate,
  kgQuery,
  kgVisualize,
  kgMerge,
  kgReason,
  kgImport,
  kgExport,
  kgStats,
  growthAnalyze,
  pricingSimulate,
  abTestRun,
  abTestAnalyze,
  leadEnrich,
  campaignGenerate,
  cohortAnalyze,
  funnelOptimize,
  attributionModel,
  teamInvite,
  roleAssign,
  commentThread,
  taskAssign,
  approvalFlow,
  activityLog,
  accessAudit,
  notifyTeam,
  llmRouter,
  llmCostOptimize,
  llmGuardrail,
  llmEvaluate,
  agentReflect,
  llmFallback,
  llmCache,
  agentHandoff,
  dataProfile,
  dataClean,
  dataVisualize,
  featureEngineer,
  modelCompare,
  dataTransform,
  dataPipeline,
  modelExplain,
  geoGeocode,
  geoRoute,
  geoDistance,
  geoFence,
  geoSearch,
  geoTimezone,
  geoElevation,
  geoIp,
  geoCluster,
  geoTransform,
  cloudDeploy,
  cloudScale,
  cloudLogs,
  cloudSecrets,
  cloudCost,
  cloudStorage,
  cloudDns,
  cloudMonitor,
  cloudNetwork,
  cloudContainer,
  cloudIam,
  scanVulnerabilities,
  policyEnforce,
  threatModel,
  incidentResponse,
  pentestRecon,
  wafManage,
  siemQuery,
  zeroTrust,
  containerSecurity,
  apiSecurity,
  supplyChain,
  executeToolCall,
} from './agent-tools-service.js';
import {
  webAnalyze,
  webScaffold,
  webOptimize,
  webTransform,
} from './web-frontend-service.js';
import {
  agentMemory,
  agentSafety,
  agentUI,
  agentControl,
  editorSelect,
  agentWorkflow,
  agentDelegate,
  agentMetrics,
} from './agent-intelligence-service.js';

// Image / agent tools that are delegated to agent-tools-service
const DELEGATED_AGENT_TOOLS = new Set([
  'image_create', 'image_transform', 'image_convert', 'image_compose',
  'image_filter', 'image_analyze', 'image_batch', 'image_background',
  'image_face', 'image_ai', 'image_export', 'image_ocr', 'generate_image',
  'canvas_image_generate', // LLM alias → delegated to generate_image
]);

// =============================================================================
// TOOL TIMEOUTS
// =============================================================================

const DEFAULT_TIMEOUT_MS = 30_000;

const TOOL_TIMEOUTS = {
  canvas_terminal_run: 60_000,
  canvas_build_validate: 60_000,
  canvas_project_add_dependency: 60_000,
  generate_image: 120_000,
  image_create: 120_000,
  image_transform: 60_000,
  image_ai: 120_000,
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

// =============================================================================
// HOOKS SYSTEM (beforeRun / afterRun / onError)
// =============================================================================

const _hooks = { beforeRun: [], afterRun: [], onError: [] };

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

// =============================================================================
// DANGEROUS TOOLS
// =============================================================================

const DANGEROUS_TOOLS = new Set([
  'canvas_file_delete', 'canvas_terminal_run', 'canvas_deploy',
  'canvas_project_add_dependency', 'canvas_project_set_env',
]);

export function isDangerousTool(toolName) {
  return DANGEROUS_TOOLS.has(toolName);
}

// =============================================================================
// MAIN DISPATCHER
// =============================================================================

/**
 * Execute a single canvas tool call with timeout and hook lifecycle.
 *
 * @param {string} toolName - Name of the tool (e.g. "canvas_file_create")
 * @param {object} input - Tool input parameters from the LLM
 * @param {object} context - Execution context
 * @param {Array} context.files - In-memory project files array [{path, content, language}]
 * @param {string} context.framework - Current project framework
 * @param {string} context.projectId - Project ID
 * @param {string} context.userId - User ID
 * @param {string} [context.sandboxDir] - Reusable sandbox directory path
 * @returns {Promise<{result: any, files: Array, sandboxDir?: string}>}
 */
export async function executeCanvasTool(toolName, input, context) {
  const { files = [], framework = 'html', projectId, userId } = context;
  const startTime = Date.now();
  const hookPayload = { toolName, input, context, startTime };
  await runHooks('beforeRun', hookPayload);

  try {
    const timeoutMs = getTimeoutForTool(toolName);
    const result = await withTimeout(
      _dispatchTool(toolName, input, context),
      timeoutMs,
      toolName
    );
    await runHooks('afterRun', { ...hookPayload, result, durationMs: Date.now() - startTime });
    return result;
  } catch (error) {
    console.error(`[CanvasToolExecutor] Error executing ${toolName}:`, error.message);
    await runHooks('onError', { ...hookPayload, error, durationMs: Date.now() - startTime });
    return { result: { error: error.message, tool: toolName }, files: context.files || [] };
  }
}

/** Internal dispatch — routes toolName to the correct handler */
async function _dispatchTool(toolName, input, context) {
  const { files = [], framework = 'html', projectId, userId } = context;

  switch (toolName) {
    // ─── FILE SYSTEM ───
    case 'canvas_file_create':
      return fileCreate(input, files);
    case 'canvas_file_edit':
      return fileEdit(input, files);
    case 'canvas_file_delete':
      return fileDelete(input, files);
    case 'canvas_file_rename':
      return fileRename(input, files);
    case 'canvas_file_read':
      return fileRead(input, files);
    case 'canvas_file_copy':
      return fileCopy(input, files);
    case 'canvas_list_directory':
      return listDirectory(input, files);

    // ─── FILE SYSTEM (Extended — direct-import) ───
    case 'canvas_file_write': // LLM alias
    case 'canvas_write_file': {
      const r = await writeFile(input.filename, input.content, input.folder || '', context.userId || 'default', null);
      return { result: r, files: context.files || [] };
    }
    case 'canvas_create_folder': {
      const r = await createFolder(input.path, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_list_folders': {
      const r = await listFolders(input.folder || '', context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_file_exists': {
      const r = await fileExists(input.path, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_get_project_tree': {
      const r = await getProjectTree(input.folder || '', context.userId || 'default', input.max_depth || 10);
      return { result: r, files: context.files || [] };
    }
    case 'canvas_move_file': {
      const r = await moveFile(input.source, input.destination, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_zip_files': {
      const r = await zipFiles(input.files, input.output || 'archive.zip', context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_unzip_files': {
      const r = await unzipFiles(input.file, input.destination || '.', context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_file_watch': {
      const r = await fileWatch(input.action, input.path, { events: input.events, recursive: input.recursive }, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_sync_files': {
      const r = await syncFiles(input.action, input.source, input.destination, { recursive: input.recursive }, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }

    // ─── CONTENT & MARKDOWN (direct-import) ───
    case 'canvas_markdown_convert': {
      const r = await markdownConvert(input.content, input.format, {}, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_markdown_validate': {
      const r = await markdownValidate(input.content, {}, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_markdown_generate': {
      const r = await markdownGenerate(input.template, input.data || {}, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_markdown_toc': {
      const r = await markdownToc(input.content, { maxLevel: input.max_depth || 4 }, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_markdown_format': {
      const r = await markdownFormat(input.content, {}, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_markdown_merge': {
      const r = await markdownMerge(input.files, { separator: input.separator, addTitles: input.addTitles }, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_markdown_extract': {
      const r = await markdownExtract(input.content, input.action, {}, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_markdown_slides': {
      const r = await markdownSlides(input.content, { format: input.format, separator: input.separator }, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }

    // ─── ANALYTICS & MONITORING ───
    case 'canvas_analytics_track': {
      const r = await analyticsTrack(input.eventName, input.eventData || {}, { visitorId: input.visitorId, sessionId: input.sessionId }, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_analytics_dashboard': {
      const r = await analyticsDashboard(input.action || 'summary', { hours: input.hours }, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_log_parse': {
      const r = await logParse(input.content, {}, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_monitor_health': {
      const r = await monitorHealth(input.target, {}, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_telemetry_send': {
      const r = await telemetrySend(input.service, input.data || {}, { environment: input.environment, endpoint: input.endpoint }, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_analytics_export': {
      const r = await analyticsExport(input.format, { hours: input.hours, eventFilter: input.eventFilter, limit: input.limit }, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_log_aggregate': {
      const r = await logAggregate(input.content, { groupBy: input.groupBy, topN: input.topN }, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_metrics_collect': {
      const r = await metricsCollect(input.action, { name: input.name, value: input.value, tags: input.tags }, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }

    // ─── WORKFLOW & AUTOMATION ───
    case 'canvas_workflow_create': {
      const r = await workflowCreate(input.name, { steps: input.steps, description: input.description, tags: input.tags }, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_workflow_execute': {
      const r = await workflowExecute(input.workflowId, { dryRun: input.dryRun, startStep: input.startStep, variables: input.variables }, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_workflow_schedule': {
      const r = await workflowSchedule(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_workflow_visualize': {
      const r = await workflowVisualize(input.workflowId, { format: input.format }, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_workflow_optimize': {
      const r = await workflowOptimize(input.workflowId, { focus: input.focus }, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_workflow_template': {
      const r = await workflowTemplate(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_workflow_history': {
      const r = await workflowHistory(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_workflow_validate': {
      const r = await workflowValidate({ workflowId: input.workflowId, steps: input.steps, strict: input.strict }, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }

    // ─── KNOWLEDGE GRAPH ───
    case 'canvas_kg_create': {
      const r = await kgCreate(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_kg_query': {
      const r = await kgQuery(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_kg_visualize': {
      const r = await kgVisualize(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_kg_merge': {
      const r = await kgMerge(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_kg_reason': {
      const r = await kgReason(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_kg_import': {
      const r = await kgImport(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_kg_export': {
      const r = await kgExport(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_kg_stats': {
      const r = await kgStats(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }

    // ─── GROWTH & MARKETING ───
    case 'canvas_growth_analyze': {
      const r = await growthAnalyze(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_pricing_simulate': {
      const r = await pricingSimulate(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_ab_test_run': {
      const r = await abTestRun(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_ab_test_analyze': {
      const r = await abTestAnalyze(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_lead_enrich': {
      const r = await leadEnrich(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_campaign_generate': {
      const r = await campaignGenerate(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_cohort_analyze': {
      const r = await cohortAnalyze(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_funnel_optimize': {
      const r = await funnelOptimize(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_attribution_model': {
      const r = await attributionModel(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }

    // ─── COLLABORATION & TEAM ───
    case 'canvas_team_invite': {
      const r = await teamInvite(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_role_assign': {
      const r = await roleAssign(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_comment_thread': {
      const r = await commentThread(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_task_assign': {
      const r = await taskAssign(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_approval_flow': {
      const r = await approvalFlow(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_activity_log': {
      const r = await activityLog(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_access_audit': {
      const r = await accessAudit(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_notify_team': {
      const r = await notifyTeam(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }

    // ─── AI ORCHESTRATION ───
    case 'canvas_llm_router': {
      const r = await llmRouter(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_llm_cost_optimize': {
      const r = await llmCostOptimize(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_llm_guardrail': {
      const r = await llmGuardrail(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_llm_evaluate': {
      const r = await llmEvaluate(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_agent_reflect': {
      const r = await agentReflect(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_llm_fallback': {
      const r = await llmFallback(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_llm_cache': {
      const r = await llmCache(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_agent_handoff': {
      const r = await agentHandoff(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }

    // ─── DATA SCIENCE & ML ───
    case 'canvas_data_profile': {
      const r = await dataProfile(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_data_clean': {
      const r = await dataClean(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_data_visualize': {
      const r = await dataVisualize(input.type || 'bar', input.data || {}, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_feature_engineer': {
      const r = await featureEngineer(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_model_compare': {
      const r = await modelCompare(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_data_transform': {
      const r = await dataTransform(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_data_pipeline': {
      const r = await dataPipeline(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_model_explain': {
      const r = await modelExplain(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }

    // ─── GEOSPATIAL ───
    case 'canvas_geo_geocode': {
      const r = await geoGeocode(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_geo_route': {
      const r = await geoRoute(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_geo_distance': {
      const r = await geoDistance(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_geo_fence': {
      const r = await geoFence(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_geo_search': {
      const r = await geoSearch(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_geo_timezone': {
      const r = await geoTimezone(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_geo_elevation': {
      const r = await geoElevation(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_geo_ip': {
      const r = await geoIp(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_geo_cluster': {
      const r = await geoCluster(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_geo_transform': {
      const r = await geoTransform(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }

    // ─── CLOUD & INFRASTRUCTURE ───
    case 'canvas_cloud_deploy': {
      const r = await cloudDeploy(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_cloud_scale': {
      const r = await cloudScale(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_cloud_logs': {
      const r = await cloudLogs(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_cloud_secrets': {
      const r = await cloudSecrets(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_cloud_cost': {
      const r = await cloudCost(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_cloud_storage': {
      const r = await cloudStorage(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_cloud_dns': {
      const r = await cloudDns(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_cloud_monitor': {
      const r = await cloudMonitor(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_cloud_network': {
      const r = await cloudNetwork(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_cloud_container': {
      const r = await cloudContainer(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_cloud_iam': {
      const r = await cloudIam(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }

    // ─── ADVANCED SECURITY ───
    case 'canvas_scan_vulnerabilities': {
      const r = await scanVulnerabilities(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_policy_enforce': {
      const r = await policyEnforce(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_threat_model': {
      const r = await threatModel(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_incident_response': {
      const r = await incidentResponse(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_pentest_recon': {
      const r = await pentestRecon(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_waf_manage': {
      const r = await wafManage(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_siem_query': {
      const r = await siemQuery(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_zero_trust': {
      const r = await zeroTrust(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_container_security': {
      const r = await containerSecurity(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_api_security': {
      const r = await apiSecurity(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_supply_chain': {
      const r = await supplyChain(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }

    // ─── TERMINAL ───
    case 'canvas_terminal_run':
      return terminalRun(input, files, context);

    // ─── BUILD ───
    case 'canvas_build_validate':
      return buildValidate(input || {}, files, framework);

    // ─── PROJECT MANAGEMENT ───
    case 'canvas_project_set_framework':
      return projectSetFramework(input, context);
    case 'canvas_project_add_dependency':
      return projectAddDependency(input, files, context);
    case 'canvas_project_set_env':
      return projectSetEnv(input, files);

    // ─── SEARCH ───
    case 'canvas_search_files':
      return searchFiles(input, files);

    // ─── DEPLOY ───
    case 'canvas_deploy':
      return deployProject(input, files, context);

    // ─── ARCHIVE / ZIP ───
    case 'canvas_archive_core':
      return archiveToolProxy(archiveCore, input, context);
    case 'canvas_archive_edit':
      return archiveToolProxy(archiveEdit, input, context);
    case 'canvas_archive_structure':
      return archiveToolProxy(archiveStructure, input, context);
    case 'canvas_archive_security':
      return archiveToolProxy(archiveSecurity, input, context);
    case 'canvas_archive_bulk':
      return archiveToolProxy(archiveBulk, input, context);
    case 'canvas_archive_convert':
      return archiveToolProxy(archiveConvert, input, context);
    case 'canvas_archive_intelligence':
      return archiveToolProxy(archiveIntelligence, input, context);
    case 'canvas_archive_deploy':
      return archiveToolProxy(archiveDeploy, input, context);

    // ─── DEVELOPER TOOLS ───
    case 'canvas_dev_filesystem':
      return archiveToolProxy(devFilesystem, input, context);
    case 'canvas_dev_search':
      return archiveToolProxy(devSearch, input, context);
    case 'canvas_dev_intelligence':
      return archiveToolProxy(devIntelligence, input, context);
    case 'canvas_dev_debug':
      return archiveToolProxy(devDebug, input, context);
    case 'canvas_dev_test': {
      const r = await devTest(input.action, input.framework, input.path, input.options || {}, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_dev_git': {
      const r = await devGit(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_dev_npm': {
      const r = await devNpm(input.action, input.package, input.options || {}, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_dev_docker': {
      const r = await devDocker(input.action, input.options || input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }

    // ─── WEB & FRONTEND TOOLS ───
    case 'canvas_web_analyze':
      return archiveToolProxy(webAnalyze, input, context);
    case 'canvas_web_scaffold':
      return archiveToolProxy(webScaffold, input, context);
    case 'canvas_web_optimize':
      return archiveToolProxy(webOptimize, input, context);
    case 'canvas_web_transform':
      return archiveToolProxy(webTransform, input, context);
    case 'canvas_web_screenshot': {
      const r = await webScreenshot(input.url, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_web_lighthouse': {
      const r = await webLighthouse(input.url, input.categories, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_web_scrape': {
      const r = await webScrape(input.url, input.selectors || {}, input.format, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }

    // ─── DATABASE TOOLS ───
    case 'canvas_db_query': {
      const r = await dbQuery(input.sql, input.params || [], input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_db_schema': {
      const r = await dbSchema(input.action, input.table, input.definition, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_db_backup': {
      const r = await dbBackup(input.action, input.table, input.format, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_db_migrate': {
      const r = await dbMigrate(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_db_analyze': {
      const r = await dbAnalyze(input.sql, input.table, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_db_connect': {
      const r = await dbConnect(input.action, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }

    // ─── API & INTEGRATIONS ───
    case 'canvas_api_request': {
      const r = await apiRequest(input.url, input.method, input.headers || {}, input.body, { auth: input.auth, timeout: input.timeout }, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_api_mock': {
      const r = await apiMock(input.action, input.endpoint, { method: input.method, response: input.response, ...input }, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_api_document': {
      const r = await apiDocument(input.action, input.source, { format: input.format, title: input.title, version: input.version }, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_api_test': {
      const r = await apiTest(input.url, input.method, { status: input.expectedStatus, bodyContains: input.bodyContains, ...input.assertions }, { loadConfig: input.loadConfig, ...input }, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_api_transform': {
      const r = await apiTransform(input.action, input.source, { sourceFormat: input.sourceFormat, targetFormat: input.targetFormat }, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_webhook_listen': {
      const r = await webhookListen(input.action, input.name || input.url, { events: input.events, webhookId: input.webhookId, eventId: input.eventId, ...input }, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_sdk_generate': {
      const r = await sdkGenerate(input.spec, input.language, { className: input.name, ...input }, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_api_validate': {
      const r = await apiValidate(input.action, input.input, input.schema, {}, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_api_proxy': {
      const r = await apiProxy(input.action, input.url, input.method, input.headers || {}, input.body, input.proxyConfig || {}, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_api_diff': {
      const r = await apiDiff(input.action, input.before, input.after, {}, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }

    // ─── AI & ML ───
    case 'canvas_llm_chat': {
      const r = await llmChat(input.messages, input.model || 'auto', { systemPrompt: input.systemPrompt, temperature: input.temperature, maxTokens: input.maxTokens }, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_llm_embed': {
      const r = await llmEmbed(input.text || input.texts, input.model, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_llm_finetune': {
      const r = await llmFinetune(input.action, { trainingFile: input.trainingFile, model: input.baseModel, hyperparameters: input.hyperparams, jobId: input.jobId, data: input.data }, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_ml_train': {
      const r = await mlTrain(input.action, { algorithm: input.algorithm, model: input.model, data: input.data, modelId: input.modelId, ...input.params }, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_ml_predict': {
      const r = await mlPredict(input.modelId, input.input || input.inputs, input, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_llm_analyze': {
      const r = await llmAnalyze(input.action, input.text, input.options || {}, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_llm_moderate': {
      const r = await llmModerate(input.action, input.text, input.texts, input.options || {}, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_ml_pipeline': {
      const r = await mlPipeline(input.action, input.pipelineId, input.step, input.data, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }

    // ─── SECURITY TOOLS ───
    case 'canvas_crypto_hash': {
      const r = await cryptoHash(input.input, input.algorithm || 'sha256', input.encoding || 'hex', context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_crypto_encrypt': {
      const r = await cryptoEncrypt(input.action, input.data, input.key, input.algorithm || 'aes-256-gcm', context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_crypto_sign': {
      const r = await cryptoSign(input.action, input.data, input.key, input.algorithm || 'sha256', context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_scan_secrets': {
      const r = await scanSecrets(input.content, {}, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_scan_malware': {
      const r = await scanMalware(input.content, {}, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_auth_generate': {
      const r = await authGenerate(input.type, { subject: input.subject, issuer: input.issuer, expiresIn: input.expiresIn, claims: input.claims, prefix: input.prefix, length: input.length, secret: input.secret }, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_scan_dependency': {
      const r = await scanDependency(input.action, input.manifest, input.ecosystem || 'npm', input.severity || 'all', context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_password_audit': {
      const r = await passwordAudit(input.action, { password: input.password, length: input.length, words: input.words, policy: input.policy }, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }
    case 'canvas_ssl_inspect': {
      const r = await sslInspect(input.action, { hostname: input.hostname, port: input.port, commonName: input.commonName, days: input.days }, context.userId || 'default');
      return { result: r, files: context.files || [] };
    }

    // ─── AGENT INTELLIGENCE ───
    case 'canvas_agent_memory':
      return archiveToolProxy(agentMemory, input, context);
    case 'canvas_agent_safety':
      return archiveToolProxy(agentSafety, input, context);
    case 'canvas_agent_ui':
      return archiveToolProxy(agentUI, input, context);
    case 'canvas_agent_control':
      return archiveToolProxy(agentControl, input, context);
    case 'canvas_editor_select':
      return archiveToolProxy(editorSelect, input, context);
    case 'canvas_save_context': {
      const r = await saveContext(input.key, input.value, context.userId || 'default', input.agentId);
      return { result: r, files: context.files || [] };
    }
    case 'canvas_recall_context': {
      const r = await recallContext(input.key, context.userId || 'default', input.agentId);
      return { result: r, files: context.files || [] };
    }
    case 'canvas_agent_workflow':
      return archiveToolProxy(agentWorkflow, input, context);
    case 'canvas_agent_delegate':
      return archiveToolProxy(agentDelegate, input, context);
    case 'canvas_agent_metrics':
      return archiveToolProxy(agentMetrics, input, context);

    default: {
      // Delegate image/agent tools to agent-tools-service
      if (DELEGATED_AGENT_TOOLS.has(toolName)) {
        // Normalize LLM aliases before delegating
        const normalizedName = toolName === 'canvas_image_generate' ? 'generate_image' : toolName;
        const agentResult = await executeToolCall(normalizedName, input, userId);
        return { result: agentResult, files };
      }
      throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}

// =============================================================================
// FILE OPERATIONS — mutate the in-memory files array
// =============================================================================

/**
 * Proxy wrapper for archive-processing-service functions.
 * Archive tools don't mutate in-memory files — they operate on S3/temp files
 * and return { success, url, ... }. We wrap to match the canvas executor shape.
 */
async function archiveToolProxy(archiveFn, input, context) {
  try {
    const result = await archiveFn(input, context.userId || 'default');
    return { result, files: context.files || [] };
  } catch (error) {
    return {
      result: { success: false, error: error.message },
      files: context.files || [],
    };
  }
}

function normalizePath(p) {
  if (!p) return '/';
  let normalized = p.startsWith('/') ? p : `/${p}`;
  // Remove trailing slash unless root
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

function fileCreate(input, files) {
  const filePath = normalizePath(input.path);
  const { content = '', language } = input;

  // Auto-detect language from extension
  const detectedLang = language || detectLanguage(filePath);

  // Check if file already exists → overwrite
  const existingIdx = files.findIndex(
    (f) => normalizePath(f.path) === filePath
  );
  if (existingIdx >= 0) {
    files[existingIdx] = {
      ...files[existingIdx],
      content,
      language: detectedLang,
    };
    return {
      result: {
        success: true,
        action: 'overwritten',
        path: filePath,
        size: content.length,
      },
      files,
    };
  }

  // Create new file
  files.push({
    path: filePath,
    name: path.basename(filePath),
    content,
    language: detectedLang,
    size: content.length,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return {
    result: {
      success: true,
      action: 'created',
      path: filePath,
      size: content.length,
    },
    files,
  };
}

function fileEdit(input, files) {
  const filePath = normalizePath(input.path);
  const fileIdx = files.findIndex((f) => normalizePath(f.path) === filePath);

  if (fileIdx < 0) {
    // If file doesn't exist and we have content, create it
    if (input.content) {
      return fileCreate({ path: filePath, content: input.content }, files);
    }
    return {
      result: { error: `File not found: ${filePath}` },
      files,
    };
  }

  // Full replacement
  if (input.content !== undefined && input.content !== null) {
    files[fileIdx] = {
      ...files[fileIdx],
      content: input.content,
      size: input.content.length,
      updatedAt: new Date().toISOString(),
    };
    return {
      result: {
        success: true,
        action: 'replaced',
        path: filePath,
        size: input.content.length,
      },
      files,
    };
  }

  // Targeted diff
  if (input.diff && Array.isArray(input.diff)) {
    const lines = files[fileIdx].content.split('\n');

    // Apply hunks in reverse order so line numbers stay valid
    const sortedHunks = [...input.diff].sort(
      (a, b) => b.startLine - a.startLine
    );
    for (const hunk of sortedHunks) {
      const startIdx = (hunk.startLine || 1) - 1;
      const deleteCount = hunk.deleteCount || 0;
      const insertLines = hunk.insert || [];
      lines.splice(startIdx, deleteCount, ...insertLines);
    }

    const newContent = lines.join('\n');
    files[fileIdx] = {
      ...files[fileIdx],
      content: newContent,
      size: newContent.length,
      updatedAt: new Date().toISOString(),
    };

    return {
      result: {
        success: true,
        action: 'diff_applied',
        path: filePath,
        hunks: input.diff.length,
        size: newContent.length,
      },
      files,
    };
  }

  return {
    result: { error: 'Either content or diff must be provided for file edit' },
    files,
  };
}

function fileDelete(input, files) {
  const filePath = normalizePath(input.path);
  const idx = files.findIndex((f) => normalizePath(f.path) === filePath);

  if (idx < 0) {
    return {
      result: { error: `File not found: ${filePath}` },
      files,
    };
  }

  files.splice(idx, 1);
  return {
    result: { success: true, action: 'deleted', path: filePath },
    files,
  };
}

function fileRename(input, files) {
  const fromPath = normalizePath(input.from);
  const toPath = normalizePath(input.to);
  const idx = files.findIndex((f) => normalizePath(f.path) === fromPath);

  if (idx < 0) {
    return {
      result: { error: `File not found: ${fromPath}` },
      files,
    };
  }

  // Check if target exists
  const targetExists = files.some((f) => normalizePath(f.path) === toPath);
  if (targetExists) {
    return {
      result: { error: `Target file already exists: ${toPath}` },
      files,
    };
  }

  files[idx] = {
    ...files[idx],
    path: toPath,
    name: path.basename(toPath),
    language: detectLanguage(toPath),
    updatedAt: new Date().toISOString(),
  };

  return {
    result: { success: true, action: 'renamed', from: fromPath, to: toPath },
    files,
  };
}

function fileRead(input, files) {
  const filePath = normalizePath(input.path);
  const file = files.find((f) => normalizePath(f.path) === filePath);

  if (!file) {
    return {
      result: {
        error: `File not found: ${filePath}`,
        available_files: files.map((f) => f.path),
      },
      files,
    };
  }

  return {
    result: {
      path: filePath,
      content: file.content,
      language: file.language,
      size: (file.content || '').length,
    },
    files,
  };
}

function fileCopy(input, files) {
  const sourcePath = normalizePath(input.source);
  const destPath = normalizePath(input.destination);

  const sourceFile = files.find((f) => normalizePath(f.path) === sourcePath);
  if (!sourceFile) {
    return {
      result: { error: `Source file not found: ${sourcePath}` },
      files,
    };
  }

  // Check if destination already exists
  const destExists = files.some((f) => normalizePath(f.path) === destPath);
  if (destExists) {
    return {
      result: { error: `Destination already exists: ${destPath}` },
      files,
    };
  }

  files.push({
    path: destPath,
    name: path.basename(destPath),
    content: sourceFile.content,
    language: detectLanguage(destPath),
    size: (sourceFile.content || '').length,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return {
    result: {
      success: true,
      action: 'copied',
      source: sourcePath,
      destination: destPath,
      size: (sourceFile.content || '').length,
    },
    files,
  };
}

function listDirectory(input, files) {
  const dirPath = normalizePath(input.path || '/');
  const recursive = input.recursive || false;

  const entries = [];
  const seenFolders = new Set();

  for (const file of files) {
    const fp = normalizePath(file.path);

    if (recursive) {
      // Return all files under this directory
      if (
        fp.startsWith(dirPath === '/' ? '/' : dirPath + '/') ||
        dirPath === '/'
      ) {
        entries.push({
          name: file.name || path.basename(fp),
          path: fp,
          type: 'file',
          language: file.language,
          size: (file.content || '').length,
        });
      }
    } else {
      // Only return direct children
      const relativePath = dirPath === '/' ? fp : fp.replace(dirPath, '');
      const parts = relativePath.split('/').filter(Boolean);

      if (parts.length === 0) continue;

      if (parts.length === 1) {
        // Direct file child
        const parentDir = path.dirname(fp);
        const normalizedParent = normalizePath(parentDir);
        if (
          normalizedParent === dirPath ||
          (dirPath === '/' && !fp.slice(1).includes('/'))
        ) {
          entries.push({
            name: parts[0],
            path: fp,
            type: 'file',
            language: file.language,
            size: (file.content || '').length,
          });
        }
      } else {
        // This file is in a subfolder — record the folder
        const folderName = parts[0];
        const folderPath =
          dirPath === '/' ? `/${folderName}` : `${dirPath}/${folderName}`;
        if (!seenFolders.has(folderPath)) {
          seenFolders.add(folderPath);
          entries.push({
            name: folderName,
            path: folderPath,
            type: 'folder',
          });
        }
      }
    }
  }

  // Sort: folders first, then files, alphabetically
  entries.sort((a, b) => {
    if (a.type === 'folder' && b.type !== 'folder') return -1;
    if (a.type !== 'folder' && b.type === 'folder') return 1;
    return a.name.localeCompare(b.name);
  });

  return {
    result: {
      path: dirPath,
      entries,
      totalFiles: entries.filter((e) => e.type === 'file').length,
      totalFolders: entries.filter((e) => e.type === 'folder').length,
    },
    files,
  };
}

// =============================================================================
// TERMINAL EXECUTION — real sandboxed command execution
// =============================================================================

/**
 * Write project files to a temp directory, run the command, return output.
 */
async function terminalRun(input, files, context) {
  const { command, cwd = '/', timeout = 30000 } = input;

  // Validate command — block dangerous operations
  const blocked = isBlockedCommand(command);
  if (blocked) {
    return {
      result: {
        error: `Command blocked for security: ${blocked}`,
        exitCode: 1,
      },
      files,
    };
  }

  let sandboxDir = context.sandboxDir;
  let createdNewSandbox = false;

  try {
    // Create or reuse sandbox directory
    if (!sandboxDir) {
      sandboxDir = path.join(
        os.tmpdir(),
        `canvas-sandbox-${randomUUID().slice(0, 8)}`
      );
      createdNewSandbox = true;
    }

    // Write all project files to the sandbox
    await writeFilesToSandbox(files, sandboxDir);

    // Resolve working directory
    const workDir = path.resolve(
      sandboxDir,
      cwd === '/' ? '.' : cwd.replace(/^\//, '')
    );

    // Ensure the working directory exists
    await fs.mkdir(workDir, { recursive: true });

    // Execute the command
    const result = await execCommand(command, workDir, timeout);

    // If the command modified files, read them back
    if (isFileModifyingCommand(command)) {
      const updatedFiles = await readFilesFromSandbox(sandboxDir);
      return {
        result: {
          stdout: truncateOutput(result.stdout),
          stderr: truncateOutput(result.stderr),
          exitCode: result.exitCode,
          command,
        },
        files: updatedFiles,
        sandboxDir,
      };
    }

    return {
      result: {
        stdout: truncateOutput(result.stdout),
        stderr: truncateOutput(result.stderr),
        exitCode: result.exitCode,
        command,
      },
      files,
      sandboxDir,
    };
  } catch (err) {
    return {
      result: {
        error: err.message,
        exitCode: 1,
        command,
      },
      files,
      sandboxDir,
    };
  }
}

/**
 * Security: block dangerous shell commands.
 */
function isBlockedCommand(command) {
  const BLOCKED_PATTERNS = [
    /rm\s+-rf\s+\//, // rm -rf /
    /rm\s+-rf\s+~\//, // rm -rf ~/
    /mkfs/, // format disk
    /dd\s+if=/, // disk destroyer
    /:(){ :\|:& };:/, // fork bomb
    />\s*\/dev\/sda/, // overwrite disk
    /curl.*\|\s*(bash|sh|zsh|python|node|perl|ruby)/, // pipe curl to interpreter
    /wget.*\|\s*(bash|sh|zsh|python|node|perl|ruby)/, // pipe wget to interpreter
    /curl.*-o\s*\//, // curl write to root paths
    /wget.*-O\s*\//, // wget write to root paths
    /sudo\s/, // no sudo
    /chmod\s+777\s+\//, // chmod 777 root
    /chown\s.*\//, // chown root
    /shutdown/, // shutdown
    /reboot/, // reboot
    /passwd/, // change passwords
    /useradd|userdel/, // user management
    /eval\s*\(/, // eval in shell
    /\bnc\s+-[le]/, // netcat listening/exec mode
    /\bncat\s/, // ncat (netcat variant)
    /\bsocat\s/, // socat network relay
    /python[23]?\s+-c\s/, // python -c arbitrary code execution
    /node\s+-e\s/, // node -e arbitrary code execution
    /perl\s+-e\s/, // perl -e arbitrary code execution
    /ruby\s+-e\s/, // ruby -e arbitrary code execution
    /\bssh\s/, // ssh connections
    /\bscp\s/, // scp file transfer
    /\brsync\s.*:/, // rsync to remote
    /\bcrontab\s/, // cron job manipulation
    /\biptables\s/, // firewall rules
    /\/etc\//, // access to system config
    /\/proc\//, // access to proc filesystem
    /\/sys\//, // access to sys filesystem
    /\benv\s.*=.*\bsh\b/, // env-based shell execution
    /\bxargs\s.*sh\b/, // xargs running shell
  ];

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(command)) {
      return `Matches blocked pattern: ${pattern.source}`;
    }
  }

  return null;
}

/**
 * Check if a command likely modifies files.
 */
function isFileModifyingCommand(command) {
  const MODIFY_PATTERNS = [
    /npm\s+init/,
    /npm\s+install/,
    /npx\s+create/,
    /yarn\s+add/,
    /yarn\s+init/,
    /pnpm\s+add/,
    /mkdir/,
    /touch/,
    /mv\s/,
    /cp\s/,
    /echo\s.*>/,
    /sed\s+-i/,
    /tee\s/,
  ];
  return MODIFY_PATTERNS.some((p) => p.test(command));
}

/**
 * Execute a command with timeout.
 */
function execCommand(command, cwd, timeout) {
  return new Promise((resolve) => {
    const childProcess = exec(
      command,
      {
        cwd,
        timeout,
        maxBuffer: 1024 * 1024, // 1MB
        env: {
          ...process.env,
          // Sandbox env overrides
          HOME: cwd,
          NODE_ENV: 'development',
          CI: 'true', // Suppress interactive prompts
        },
        shell: '/bin/bash',
      },
      (error, stdout, stderr) => {
        resolve({
          stdout: stdout || '',
          stderr: stderr || '',
          exitCode: error ? error.code || 1 : 0,
        });
      }
    );
  });
}

/**
 * Write in-memory files to the sandbox temp directory.
 */
async function writeFilesToSandbox(files, sandboxDir) {
  await fs.mkdir(sandboxDir, { recursive: true });

  for (const file of files) {
    const filePath = path.join(sandboxDir, file.path.replace(/^\//, ''));
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, file.content || '', 'utf-8');
  }
}

/**
 * Read all files back from the sandbox (after a command may have modified them).
 */
async function readFilesFromSandbox(sandboxDir) {
  const files = [];

  async function walk(dir, prefix = '') {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Skip node_modules, .git, dist, build
          if (
            [
              'node_modules',
              '.git',
              'dist',
              'build',
              '.next',
              '__pycache__',
            ].includes(entry.name)
          )
            continue;
          await walk(fullPath, relativePath);
        } else if (entry.isFile()) {
          // Skip binary files
          if (isBinaryExtension(entry.name)) continue;
          // Skip very large files (>500KB)
          const stat = await fs.stat(fullPath);
          if (stat.size > 500 * 1024) continue;

          const content = await fs.readFile(fullPath, 'utf-8');
          files.push({
            path: `/${relativePath}`,
            name: entry.name,
            content,
            language: detectLanguage(entry.name),
            size: content.length,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      // Silently skip unreadable dirs
    }
  }

  await walk(sandboxDir);
  return files;
}

// =============================================================================
// BUILD VALIDATION — real validation in sandbox
// =============================================================================

async function buildValidate(input, files, currentFramework) {
  const framework = input.framework || currentFramework || 'html';
  const errors = [];
  const warnings = [];

  // 1. Static analysis — always run
  for (const file of files) {
    const fileErrors = staticAnalyze(file);
    errors.push(...fileErrors.errors);
    warnings.push(...fileErrors.warnings);
  }

  // 2. Framework-specific checks
  switch (framework) {
    case 'html': {
      // Check for entry point
      const hasIndex = files.some((f) => f.path === '/index.html');
      if (!hasIndex) {
        errors.push({
          file: '/',
          message: 'Missing index.html entry point',
          severity: 'error',
        });
      }
      break;
    }

    case 'vite_react':
    case 'nextjs':
    case 'vue':
    case 'svelte':
    case 'astro': {
      // Check for package.json
      const pkgFile = files.find((f) => f.path === '/package.json');
      if (!pkgFile) {
        errors.push({
          file: '/',
          message: 'Missing package.json',
          severity: 'error',
        });
      } else {
        try {
          const pkg = JSON.parse(pkgFile.content);
          if (!pkg.name)
            warnings.push({
              file: '/package.json',
              message: 'Missing "name" field',
              severity: 'warning',
            });
          if (!pkg.scripts?.build && !pkg.scripts?.dev) {
            warnings.push({
              file: '/package.json',
              message: 'No build or dev script found',
              severity: 'warning',
            });
          }
        } catch {
          errors.push({
            file: '/package.json',
            message: 'Invalid JSON in package.json',
            severity: 'error',
          });
        }
      }
      break;
    }

    case 'express':
    case 'fastapi': {
      const hasServer = files.some(
        (f) =>
          f.path.includes('server') ||
          f.path.includes('app.') ||
          f.path.includes('main.')
      );
      if (!hasServer) {
        warnings.push({
          file: '/',
          message: 'No server entry point found (server.js, app.js, main.py)',
          severity: 'warning',
        });
      }
      break;
    }
  }

  // 3. Cross-file reference checks
  const crossRefErrors = checkCrossReferences(files);
  errors.push(...crossRefErrors);

  // 4. Try a real build if it's a Node project with package.json
  const canRealBuild = [
    'vite_react',
    'nextjs',
    'vue',
    'svelte',
    'astro',
  ].includes(framework);
  let buildOutput = null;

  if (canRealBuild && files.some((f) => f.path === '/package.json')) {
    try {
      const sandboxDir = path.join(
        os.tmpdir(),
        `canvas-build-${randomUUID().slice(0, 8)}`
      );
      await writeFilesToSandbox(files, sandboxDir);

      // Install deps + run build
      const installResult = await execCommand(
        'npm install --no-audit --no-fund 2>&1',
        sandboxDir,
        60000
      );
      if (installResult.exitCode === 0) {
        const buildResult = await execCommand(
          'npm run build 2>&1 || true',
          sandboxDir,
          60000
        );
        buildOutput = {
          installed: true,
          buildExitCode: buildResult.exitCode,
          buildOutput: truncateOutput(
            buildResult.stdout + '\n' + buildResult.stderr
          ),
        };

        if (buildResult.exitCode !== 0) {
          errors.push({
            file: '/',
            message: `Build failed: ${truncateOutput(buildResult.stderr || buildResult.stdout, 200)}`,
            severity: 'error',
          });
        }
      } else {
        buildOutput = {
          installed: false,
          installOutput: truncateOutput(
            installResult.stderr || installResult.stdout,
            500
          ),
        };
        errors.push({
          file: '/package.json',
          message: `npm install failed: ${truncateOutput(installResult.stderr, 200)}`,
          severity: 'error',
        });
      }

      // Clean up
      await fs.rm(sandboxDir, { recursive: true, force: true }).catch(() => {});
    } catch (err) {
      warnings.push({
        file: '/',
        message: `Build validation skipped: ${err.message}`,
        severity: 'warning',
      });
    }
  }

  return {
    result: {
      valid: errors.length === 0,
      errors,
      warnings,
      framework,
      fileCount: files.length,
      ...(buildOutput && { buildOutput }),
    },
    files,
  };
}

/**
 * Static analysis: check individual files for common issues.
 */
function staticAnalyze(file) {
  const errors = [];
  const warnings = [];
  const content = file.content || '';
  const ext = path.extname(file.path).toLowerCase();

  // JSON syntax check
  if (ext === '.json') {
    try {
      JSON.parse(content);
    } catch (e) {
      errors.push({
        file: file.path,
        message: `Invalid JSON: ${e.message}`,
        severity: 'error',
      });
    }
  }

  // HTML structure checks
  if (ext === '.html' || ext === '.htm') {
    if (
      !content.includes('<!DOCTYPE') &&
      !content.includes('<!doctype') &&
      content.length > 50
    ) {
      warnings.push({
        file: file.path,
        message: 'Missing <!DOCTYPE html> declaration',
        severity: 'warning',
      });
    }
    // Check for unclosed tags (basic — not a full parser)
    const openTags = (
      content.match(/<(?!\/|!|meta|br|hr|img|input|link)[a-z][^>]*>/gi) || []
    ).length;
    const closeTags = (content.match(/<\/[a-z][^>]*>/gi) || []).length;
    if (Math.abs(openTags - closeTags) > 3) {
      warnings.push({
        file: file.path,
        message: `Possible unclosed tags (open: ${openTags}, close: ${closeTags})`,
        severity: 'warning',
      });
    }
  }

  // JS/TS: check for obvious syntax issues
  if (['.js', '.jsx', '.ts', '.tsx', '.mjs'].includes(ext)) {
    // Unmatched braces
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      warnings.push({
        file: file.path,
        message: `Unmatched braces (open: ${openBraces}, close: ${closeBraces})`,
        severity: 'warning',
      });
    }

    // console.log in production
    const consoleCount = (content.match(/console\.(log|debug|info)\(/g) || [])
      .length;
    if (consoleCount > 5) {
      warnings.push({
        file: file.path,
        message: `${consoleCount} console.log statements — consider removing for production`,
        severity: 'warning',
      });
    }
  }

  // CSS: check for basic issues
  if (ext === '.css') {
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push({
        file: file.path,
        message: `Unmatched CSS braces (open: ${openBraces}, close: ${closeBraces})`,
        severity: 'error',
      });
    }
  }

  return { errors, warnings };
}

/**
 * Check cross-file references (imports, script/link tags).
 */
function checkCrossReferences(files) {
  const errors = [];
  const filePaths = new Set(files.map((f) => normalizePath(f.path)));

  for (const file of files) {
    const content = file.content || '';
    const ext = path.extname(file.path).toLowerCase();

    // Check JS/TS imports
    if (['.js', '.jsx', '.ts', '.tsx', '.mjs'].includes(ext)) {
      const importRegex =
        /(?:import|require)\s*\(?\s*['"](\.[^'"]+)['"]\s*\)?/g;
      let match;
      while ((match = importRegex.exec(content))) {
        const importPath = match[1];
        const fileDir = path.dirname(file.path);
        let resolvedPath = path.resolve(fileDir, importPath);

        // Normalize
        resolvedPath = normalizePath(resolvedPath);

        // Check with common extensions
        const extensions = [
          '',
          '.js',
          '.jsx',
          '.ts',
          '.tsx',
          '.mjs',
          '/index.js',
          '/index.ts',
          '/index.tsx',
        ];
        const found = extensions.some((ext) =>
          filePaths.has(resolvedPath + ext)
        );

        if (!found) {
          // Don't flag package imports (they may be from node_modules)
          if (importPath.startsWith('.')) {
            errors.push({
              file: file.path,
              message: `Broken import: "${importPath}" (resolved to ${resolvedPath})`,
              severity: 'warning',
            });
          }
        }
      }
    }

    // Check HTML src/href references
    if (ext === '.html' || ext === '.htm') {
      const refRegex = /(?:src|href)=["'](\.[^"']+)["']/g;
      let match;
      while ((match = refRegex.exec(content))) {
        const refPath = match[1];
        const fileDir = path.dirname(file.path);
        const resolvedPath = normalizePath(path.resolve(fileDir, refPath));

        if (!filePaths.has(resolvedPath)) {
          errors.push({
            file: file.path,
            message: `Missing referenced file: "${refPath}" (resolved to ${resolvedPath})`,
            severity: 'warning',
          });
        }
      }
    }
  }

  return errors;
}

// =============================================================================
// PROJECT MANAGEMENT
// =============================================================================

function projectSetFramework(input, context) {
  return {
    result: { success: true, framework: input.framework },
    files: context.files,
    frameworkChanged: input.framework,
  };
}

async function projectAddDependency(input, files, context) {
  const { packages, dev = false } = input;

  // Find or create package.json
  let pkgIdx = files.findIndex(
    (f) => normalizePath(f.path) === '/package.json'
  );
  let pkg;

  if (pkgIdx >= 0) {
    try {
      pkg = JSON.parse(files[pkgIdx].content);
    } catch {
      pkg = { name: 'canvas-project', version: '1.0.0' };
    }
  } else {
    pkg = { name: 'canvas-project', version: '1.0.0', scripts: {} };
  }

  // Add dependencies
  const depField = dev ? 'devDependencies' : 'dependencies';
  if (!pkg[depField]) pkg[depField] = {};

  for (const pkgName of packages) {
    pkg[depField][pkgName] = 'latest';
  }

  const newContent = JSON.stringify(pkg, null, 2);

  if (pkgIdx >= 0) {
    files[pkgIdx] = {
      ...files[pkgIdx],
      content: newContent,
      size: newContent.length,
    };
  } else {
    files.push({
      path: '/package.json',
      name: 'package.json',
      content: newContent,
      language: 'json',
      size: newContent.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return {
    result: { success: true, added: packages, field: depField },
    files,
  };
}

function projectSetEnv(input, files) {
  const { vars } = input;

  // Find or create .env
  let envIdx = files.findIndex((f) => normalizePath(f.path) === '/.env');
  let envContent = '';

  if (envIdx >= 0) {
    envContent = files[envIdx].content || '';
  }

  // Parse existing env
  const existing = {};
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) existing[match[1].trim()] = match[2].trim();
  }

  // Merge new vars
  Object.assign(existing, vars);

  // Rebuild
  const newContent = Object.entries(existing)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  if (envIdx >= 0) {
    files[envIdx] = {
      ...files[envIdx],
      content: newContent,
      size: newContent.length,
    };
  } else {
    files.push({
      path: '/.env',
      name: '.env',
      content: newContent,
      language: 'plaintext',
      size: newContent.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return {
    result: { success: true, vars: Object.keys(vars) },
    files,
  };
}

// =============================================================================
// SEARCH
// =============================================================================

function searchFiles(input, files) {
  const { query, regex = false, includePattern } = input;
  const results = [];

  let searchRegex;
  try {
    searchRegex = regex
      ? new RegExp(query, 'gi')
      : new RegExp(escapeRegex(query), 'gi');
  } catch {
    return {
      result: { error: `Invalid search pattern: ${query}` },
      files,
    };
  }

  for (const file of files) {
    // Apply include pattern filter
    if (includePattern) {
      const globRegex = globToRegex(includePattern);
      if (!globRegex.test(file.path)) continue;
    }

    const content = file.content || '';
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (searchRegex.test(lines[i])) {
        results.push({
          file: file.path,
          line: i + 1,
          content: lines[i].trim().slice(0, 200),
        });
        // Reset regex state
        searchRegex.lastIndex = 0;
      }
    }
  }

  return {
    result: { matches: results, total: results.length, query },
    files,
  };
}

// =============================================================================
// DEPLOY
// =============================================================================

function deployProject(input, files, context) {
  // Deploy is handled by returning intent — the frontend or a follow-up
  // backend call to canvas-deploy-routes handles actual deployment.
  return {
    result: {
      success: true,
      action: 'deploy_requested',
      provider: input.provider,
      projectName: input.projectName || context.projectId,
      message: `Deployment to ${input.provider} has been initiated. The project files will be packaged and deployed.`,
    },
    files,
  };
}

// =============================================================================
// UTILITIES
// =============================================================================

function detectLanguage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.html': 'html',
    '.htm': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.less': 'less',
    '.js': 'javascript',
    '.mjs': 'javascript',
    '.cjs': 'javascript',
    '.jsx': 'jsx',
    '.ts': 'typescript',
    '.mts': 'typescript',
    '.tsx': 'tsx',
    '.json': 'json',
    '.md': 'markdown',
    '.py': 'python',
    '.rb': 'ruby',
    '.go': 'go',
    '.rs': 'rust',
    '.java': 'java',
    '.php': 'php',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.xml': 'xml',
    '.svg': 'xml',
    '.sh': 'shell',
    '.sql': 'sql',
    '.c': 'c',
    '.cpp': 'cpp',
    '.cc': 'cpp',
    '.cxx': 'cpp',
    '.h': 'c',
    '.hpp': 'cpp',
    '.hxx': 'cpp',
    '.env': 'plaintext',
    '.toml': 'toml',
    '.ini': 'ini',
  };
  return map[ext] || 'plaintext';
}

function isBinaryExtension(filename) {
  const binaryExts = [
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.bmp',
    '.ico',
    '.webp',
    '.mp3',
    '.mp4',
    '.avi',
    '.mov',
    '.wav',
    '.ogg',
    '.pdf',
    '.zip',
    '.tar',
    '.gz',
    '.rar',
    '.7z',
    '.woff',
    '.woff2',
    '.ttf',
    '.eot',
    '.otf',
    '.exe',
    '.dll',
    '.so',
    '.dylib',
    '.o',
    '.pyc',
    '.class',
    '.jar',
  ];
  return binaryExts.some((ext) => filename.toLowerCase().endsWith(ext));
}

function truncateOutput(text, maxLen = 4000) {
  if (!text || text.length <= maxLen) return text;
  return (
    text.slice(0, maxLen) +
    `\n... (${text.length - maxLen} more characters truncated)`
  );
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function globToRegex(glob) {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  const regexStr = escaped.replace(/\*/g, '.*').replace(/\?/g, '.');
  return new RegExp(regexStr, 'i');
}

// =============================================================================
// SANDBOX CLEANUP
// =============================================================================

/**
 * Clean up a sandbox directory. Call this after the agent conversation is done.
 */
export async function cleanupSandbox(sandboxDir) {
  if (!sandboxDir) return;
  try {
    await fs.rm(sandboxDir, { recursive: true, force: true });
  } catch {
    // Silent cleanup failure is fine
  }
}

// =============================================================================
// EXPORTED SANDBOX HELPERS — used by /api/canvas/exec route
// =============================================================================

export {
  isBlockedCommand,
  execCommand,
  writeFilesToSandbox,
  readFilesFromSandbox,
  truncateOutput,
};
