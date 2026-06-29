/**
 * ============================================================================
 * CANVAS TOOL DEFINITIONS (Layer 1)
 * ============================================================================
 * Centralized schema registry — the single source of truth for ALL canvas
 * tool definitions. Aggregates definitions from every service module.
 *
 * Backend defines tools → LLM decides which to use → canvas-tool-executor
 * dispatches execution.
 *
 * Exports:
 *   CANVAS_TOOLS           — Full array of all tool definitions
 *   CANVAS_SYSTEM_PROMPT   — System prompt describing available tools
 *   getCanvasTools()       — Returns all tool definitions
 *   getCanvasToolsForOpenAI() — OpenAI function-calling format
 *   getCanvasToolsForPanel()  — Filtered tools for a specific panel
 *   getCanvasToolsForPanelOpenAI() — Panel tools in OpenAI format
 * ============================================================================
 */

// ============================================================================
// IMPORT ALL TOOL DEFINITIONS
// ============================================================================

// Core tools (file system, git, terminal, http, etc.)
import { TOOL_DEFINITIONS } from '../services/tools.js';

// Canvas/Workspace tools
import { CANVAS_TOOL_DEFINITIONS } from '../services/canvasTools.js';

// Image generation tools
import { IMAGE_TOOL_DEFINITIONS } from '../services/imageTools.js';

// Video generation tools
import { VIDEO_TOOL_DEFINITIONS } from '../services/videoTools.js';

// Archive/ZIP tools
import { ARCHIVE_TOOL_DEFINITIONS } from '../services/archiveTools.js';

// Backend/API generation tools
import { BACKEND_TOOL_DEFINITIONS } from '../services/backendTools.js';

// Code execution tools
import { CODE_TOOL_DEFINITIONS } from '../services/codeTools.js';

// Editor tools
import { EDITOR_TOOL_DEFINITIONS } from '../services/editorTools.js';

// Agent Control tools
import { AGENT_CONTROL_TOOL_DEFINITIONS } from '../services/agentControlTools.js';

// V2 tool modules
import { CORE_UTILITY_TOOL_DEFINITIONS } from '../services/coreUtilityTools.js';
import { DOCUMENT_PARSING_TOOL_DEFINITIONS } from '../services/documentParsingTools.js';
import { DEV_TOOL_DEFINITIONS } from '../services/devTools.js';
import { WEB_FRONTEND_TOOL_DEFINITIONS } from '../services/webFrontendTools.js';
import { DATABASE_TOOL_DEFINITIONS } from '../services/databaseTools.js';
import { API_TOOL_DEFINITIONS } from '../services/apiTools.js';
import { AI_ML_TOOL_DEFINITIONS } from '../services/aiMlTools.js';
import { SECURITY_TOOL_DEFINITIONS } from '../services/securityTools.js';
import { CONTENT_MARKDOWN_TOOL_DEFINITIONS } from '../services/contentMarkdownTools.js';
import { ANALYTICS_TOOL_DEFINITIONS } from '../services/analyticsTools.js';
import { FILE_SYSTEM_TOOL_DEFINITIONS } from '../services/fileSystemTools.js';

// V3 tool modules
import { DEPLOYMENT_DOCKER_TOOL_DEFINITIONS } from '../services/deploymentDockerTools.js';
import { COMMUNICATION_TOOL_DEFINITIONS } from '../services/communicationTools.js';
import { UI_INTERACTION_TOOL_DEFINITIONS } from '../services/uiInteractionTools.js';

// V4 tool modules
import { WORKFLOW_TOOL_DEFINITIONS } from '../services/workflowTools.js';
import { KNOWLEDGE_GRAPH_TOOL_DEFINITIONS } from '../services/knowledgeGraphTools.js';
import { BUSINESS_GROWTH_TOOL_DEFINITIONS } from '../services/businessGrowthTools.js';
import { COLLABORATION_TOOL_DEFINITIONS } from '../services/collaborationTools.js';
import { ADVANCED_AI_TOOL_DEFINITIONS } from '../services/advancedAiTools.js';
import { DATA_SCIENCE_TOOL_DEFINITIONS } from '../services/dataScienceTools.js';
import { GEO_LOCATION_TOOL_DEFINITIONS } from '../services/geoLocationTools.js';
import { CLOUD_CONTROL_TOOL_DEFINITIONS } from '../services/cloudControlTools.js';
import { ADVANCED_SECURITY_TOOL_DEFINITIONS } from '../services/advancedSecurityTools.js';

// V5 Enterprise tool modules
import { FINANCIAL_TOOL_DEFINITIONS } from '../services/financialTools.js';
import { PROJECT_MGMT_TOOL_DEFINITIONS } from '../services/projectMgmtTools.js';
import { EMAIL_COMM_TOOL_DEFINITIONS } from '../services/emailCommTools.js';
import { SALES_CRM_TOOL_DEFINITIONS } from '../services/salesCrmTools.js';
import { HR_RECRUITING_TOOL_DEFINITIONS } from '../services/hrRecruitingTools.js';
import { LEGAL_COMPLIANCE_TOOL_DEFINITIONS } from '../services/legalComplianceTools.js';
import { MARKETING_SEO_TOOL_DEFINITIONS } from '../services/marketingSeoTools.js';


// ============================================================================
// AGGREGATE ALL TOOLS — deduplicated, last-wins
// ============================================================================

const _rawTools = [
  // Core
  ...TOOL_DEFINITIONS,
  ...CANVAS_TOOL_DEFINITIONS,
  ...IMAGE_TOOL_DEFINITIONS,
  ...VIDEO_TOOL_DEFINITIONS,
  ...ARCHIVE_TOOL_DEFINITIONS,
  ...BACKEND_TOOL_DEFINITIONS,
  ...CODE_TOOL_DEFINITIONS,
  ...EDITOR_TOOL_DEFINITIONS,
  ...AGENT_CONTROL_TOOL_DEFINITIONS,
  // V2
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
  // V3
  ...DEPLOYMENT_DOCKER_TOOL_DEFINITIONS,
  ...COMMUNICATION_TOOL_DEFINITIONS,
  ...UI_INTERACTION_TOOL_DEFINITIONS,
  // V4
  ...WORKFLOW_TOOL_DEFINITIONS,
  ...KNOWLEDGE_GRAPH_TOOL_DEFINITIONS,
  ...BUSINESS_GROWTH_TOOL_DEFINITIONS,
  ...COLLABORATION_TOOL_DEFINITIONS,
  ...ADVANCED_AI_TOOL_DEFINITIONS,
  ...DATA_SCIENCE_TOOL_DEFINITIONS,
  ...GEO_LOCATION_TOOL_DEFINITIONS,
  ...CLOUD_CONTROL_TOOL_DEFINITIONS,
  ...ADVANCED_SECURITY_TOOL_DEFINITIONS,
  // V5 Enterprise
  ...FINANCIAL_TOOL_DEFINITIONS,
  ...PROJECT_MGMT_TOOL_DEFINITIONS,
  ...EMAIL_COMM_TOOL_DEFINITIONS,
  ...SALES_CRM_TOOL_DEFINITIONS,
  ...HR_RECRUITING_TOOL_DEFINITIONS,
  ...LEGAL_COMPLIANCE_TOOL_DEFINITIONS,
  ...MARKETING_SEO_TOOL_DEFINITIONS,
];

// Deduplicate — last definition wins (specialized tools override core)
const _seen = new Map();
for (const tool of _rawTools) {
  _seen.set(tool.name, tool);
}

export const CANVAS_TOOLS = [..._seen.values()];


// ============================================================================
// SYSTEM PROMPT
// ============================================================================

export const CANVAS_SYSTEM_PROMPT = `You are Nova, an expert full-stack developer at Mumtaz AI Canvas.

You have access to a powerful set of tools for building, editing, and deploying applications.
When the user asks you to build something, USE YOUR TOOLS. Don't just describe what to do.

Key principles:
- Always create complete, working files — never placeholder code
- Use canvas_file_create / canvas_file_edit for file operations
- Use generate_image for image generation requests
- Use canvas_terminal_run for shell commands
- Use canvas_build_validate to check for errors before deploying
- Return clear, concise explanations of what you did

Available tool categories:
- File System: create, edit, read, delete, rename, search files
- Terminal: run shell commands, install packages
- Build: validate, preview, deploy projects
- Image: generate, edit, transform images
- Video: generate videos
- Code: execute, analyze, format, lint code
- Database: query, schema, backup, migrate
- API: HTTP requests, webhooks, SDK generation
- AI/ML: LLM chat, embeddings, ML training
- Security: encryption, scanning, authentication
- Analytics: tracking, dashboards, monitoring
- Deployment: Docker, CI/CD, static deploy
- Workflow: automation, scheduling
- Knowledge Graph: CRUD, reasoning
- Business: growth, pricing, A/B tests
- Collaboration: teams, tasks, approvals
- Data Science: profiling, cleaning, visualization
- Geo/Location: geocoding, routing, geofencing
- Cloud: deploy, scale, logs, secrets
- Financial: invoices, expenses, budgets, reports
- Project Management: projects, tasks, milestones, sprints
- Email/Communication: email, newsletters, SMS, calendar
- Sales/CRM: leads, pipeline, deals, proposals
- HR/Recruiting: resumes, jobs, interviews, payroll
- Legal/Compliance: contracts, NDA, terms, privacy, IP
- Marketing/SEO: SEO audit, keywords, social, campaigns
`;


// ============================================================================
// BASE TOOLS (always included in every panel)
// ============================================================================

const BASE_TOOLS = new Set([
  'canvas_file_create', 'canvas_file_edit', 'canvas_file_read',
  'canvas_file_delete', 'canvas_file_rename', 'canvas_file_list',
  'canvas_terminal_run', 'canvas_build_validate', 'canvas_search',
  'generate_image', 'canvas_image_generate',
]);


// ============================================================================
// PANEL → EXTRA TOOL MAPPINGS
// ============================================================================

const PANEL_EXTRA_TOOLS = {
  // Media
  'image-tools': IMAGE_TOOL_DEFINITIONS.map(t => t.name),
  'video': VIDEO_TOOL_DEFINITIONS.map(t => t.name),
  'assets': [...IMAGE_TOOL_DEFINITIONS, ...VIDEO_TOOL_DEFINITIONS, ...ARCHIVE_TOOL_DEFINITIONS].map(t => t.name),

  // Code & Dev
  'code-tools': [...CODE_TOOL_DEFINITIONS, ...DEV_TOOL_DEFINITIONS, ...EDITOR_TOOL_DEFINITIONS].map(t => t.name),
  'dev-tools': [...DEV_TOOL_DEFINITIONS, ...CODE_TOOL_DEFINITIONS, ...EDITOR_TOOL_DEFINITIONS].map(t => t.name),
  'canvas-tools': [...CANVAS_TOOL_DEFINITIONS, ...EDITOR_TOOL_DEFINITIONS, ...CODE_TOOL_DEFINITIONS].map(t => t.name),

  // Backend & Infra
  'backend-tools': [...BACKEND_TOOL_DEFINITIONS, ...DATABASE_TOOL_DEFINITIONS, ...API_TOOL_DEFINITIONS, ...SECURITY_TOOL_DEFINITIONS, ...DEPLOYMENT_DOCKER_TOOL_DEFINITIONS].map(t => t.name),
  'database': [...DATABASE_TOOL_DEFINITIONS, ...BACKEND_TOOL_DEFINITIONS].map(t => t.name),
  'docker': [...DEPLOYMENT_DOCKER_TOOL_DEFINITIONS, ...BACKEND_TOOL_DEFINITIONS].map(t => t.name),
  'deploy': [...DEPLOYMENT_DOCKER_TOOL_DEFINITIONS, ...BACKEND_TOOL_DEFINITIONS, ...SECURITY_TOOL_DEFINITIONS].map(t => t.name),

  // Web & API
  'api-tools': [...API_TOOL_DEFINITIONS, ...BACKEND_TOOL_DEFINITIONS].map(t => t.name),
  'web-tools': [...WEB_FRONTEND_TOOL_DEFINITIONS, ...DEV_TOOL_DEFINITIONS].map(t => t.name),

  // Content & Docs
  'content-markdown': [...CONTENT_MARKDOWN_TOOL_DEFINITIONS, ...DOCUMENT_PARSING_TOOL_DEFINITIONS].map(t => t.name),
  'document-parsing': [...DOCUMENT_PARSING_TOOL_DEFINITIONS, ...CONTENT_MARKDOWN_TOOL_DEFINITIONS].map(t => t.name),

  // Security
  'security': [...SECURITY_TOOL_DEFINITIONS, ...ADVANCED_SECURITY_TOOL_DEFINITIONS].map(t => t.name),

  // Communication & Analytics
  'communication': COMMUNICATION_TOOL_DEFINITIONS.map(t => t.name),
  'collaboration': [...COLLABORATION_TOOL_DEFINITIONS, ...COMMUNICATION_TOOL_DEFINITIONS, ...ANALYTICS_TOOL_DEFINITIONS].map(t => t.name),

  // AI / ML
  'ai': [...AI_ML_TOOL_DEFINITIONS, ...ADVANCED_AI_TOOL_DEFINITIONS].map(t => t.name),

  // Files / Archive
  'files': [...FILE_SYSTEM_TOOL_DEFINITIONS, ...ARCHIVE_TOOL_DEFINITIONS].map(t => t.name),

  // Enterprise
  'financial': FINANCIAL_TOOL_DEFINITIONS.map(t => t.name),
  'project-management': [...PROJECT_MGMT_TOOL_DEFINITIONS, ...COLLABORATION_TOOL_DEFINITIONS].map(t => t.name),
  'email': [...EMAIL_COMM_TOOL_DEFINITIONS, ...COMMUNICATION_TOOL_DEFINITIONS].map(t => t.name),
  'sales-crm': [...SALES_CRM_TOOL_DEFINITIONS, ...ANALYTICS_TOOL_DEFINITIONS].map(t => t.name),
  'hr-recruiting': HR_RECRUITING_TOOL_DEFINITIONS.map(t => t.name),
  'legal-compliance': LEGAL_COMPLIANCE_TOOL_DEFINITIONS.map(t => t.name),
  'marketing-seo': [...MARKETING_SEO_TOOL_DEFINITIONS, ...ANALYTICS_TOOL_DEFINITIONS].map(t => t.name),

  // Full agent set for workspace/build/general
  'workspace': CANVAS_TOOLS.map(t => t.name),
  'build': CANVAS_TOOLS.map(t => t.name),
  'assistant': CANVAS_TOOLS.map(t => t.name),
  'project': CANVAS_TOOLS.map(t => t.name),
  'dashboard': CANVAS_TOOLS.map(t => t.name),
};


// ============================================================================
// PANEL TOOL ACCESSOR (cached)
// ============================================================================

const _panelToolCache = new Map();

/**
 * Get tool definitions filtered for a specific UI panel.
 * @param {string} panel - Panel name (matches ActivePanel type in App.tsx)
 * @returns {Array} Filtered tool definitions
 */
export function getCanvasToolsForPanel(panel = 'workspace') {
  if (_panelToolCache.has(panel)) return _panelToolCache.get(panel);

  const extraNames = PANEL_EXTRA_TOOLS[panel] || PANEL_EXTRA_TOOLS['workspace'];
  const allowedNames = new Set([...BASE_TOOLS, ...extraNames]);

  const filtered = CANVAS_TOOLS.filter(t => allowedNames.has(t.name));
  _panelToolCache.set(panel, filtered);
  return filtered;
}

/**
 * Return OpenAI-format panel tools.
 */
export function getCanvasToolsForPanelOpenAI(panel = 'workspace') {
  return getCanvasToolsForPanel(panel).map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.input_schema || tool.parameters || { type: 'object', properties: {} },
    },
  }));
}


// ============================================================================
// FORMAT CONVERTERS
// ============================================================================

/**
 * Convert all canvas tools to OpenAI function calling format.
 */
export function getCanvasToolsForOpenAI() {
  return CANVAS_TOOLS.map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.input_schema || tool.parameters || { type: 'object', properties: {} },
    },
  }));
}

/**
 * Get all tool definitions (raw format).
 */
export function getCanvasTools() {
  return CANVAS_TOOLS;
}


// ============================================================================
// RE-EXPORT individual definition arrays for direct access
// ============================================================================

export {
  TOOL_DEFINITIONS,
  CANVAS_TOOL_DEFINITIONS,
  IMAGE_TOOL_DEFINITIONS,
  VIDEO_TOOL_DEFINITIONS,
  ARCHIVE_TOOL_DEFINITIONS,
  BACKEND_TOOL_DEFINITIONS,
  CODE_TOOL_DEFINITIONS,
  EDITOR_TOOL_DEFINITIONS,
  AGENT_CONTROL_TOOL_DEFINITIONS,
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
  DEPLOYMENT_DOCKER_TOOL_DEFINITIONS,
  COMMUNICATION_TOOL_DEFINITIONS,
  UI_INTERACTION_TOOL_DEFINITIONS,
  WORKFLOW_TOOL_DEFINITIONS,
  KNOWLEDGE_GRAPH_TOOL_DEFINITIONS,
  BUSINESS_GROWTH_TOOL_DEFINITIONS,
  COLLABORATION_TOOL_DEFINITIONS,
  ADVANCED_AI_TOOL_DEFINITIONS,
  DATA_SCIENCE_TOOL_DEFINITIONS,
  GEO_LOCATION_TOOL_DEFINITIONS,
  CLOUD_CONTROL_TOOL_DEFINITIONS,
  ADVANCED_SECURITY_TOOL_DEFINITIONS,
  FINANCIAL_TOOL_DEFINITIONS,
  PROJECT_MGMT_TOOL_DEFINITIONS,
  EMAIL_COMM_TOOL_DEFINITIONS,
  SALES_CRM_TOOL_DEFINITIONS,
  HR_RECRUITING_TOOL_DEFINITIONS,
  LEGAL_COMPLIANCE_TOOL_DEFINITIONS,
  MARKETING_SEO_TOOL_DEFINITIONS,
};


// ============================================================================
// STATS
// ============================================================================

console.log(`[CanvasToolDefinitions] Registry: ${CANVAS_TOOLS.length} unique tools (from ${_rawTools.length} raw)`);
