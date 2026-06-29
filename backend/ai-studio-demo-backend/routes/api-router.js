/**
 * AI STUDIO DEMO BACKEND — API ROUTER (Standalone)
 * Port 3009 · demo.mumtaz.ai
 *
 * Routes kept:
 *   - Auth: login/signup/verify (standalone demo auth)
 *   - User: preferences, memory
 *   - Subscriptions: plan checks and Stripe flows
 *   - Chat: sessions, messages, streaming
 *   - Canvas: projects, builder, builds, deploy, monitoring, assets, etc.
 *   - Media: image generation
 *   - Uploads: presign, proxy
 *   - Analytics: error reporting
 *   - Agent chat stream & search (demo-specific SSE)
 */

import express from 'express';
import rateLimit from 'express-rate-limit';

// ── Auth & User ──
import authRouter from './auth.js';
import userPreferencesRouter from './user-preferences.js';
import userMemoryRouter from './user-memory.js';

// ── Subscriptions ──
import agentSubscriptionsRouter from './agentSubscriptions.js';

// ── Agent Prompts (strict personality system) ──
import { STRICT_AGENT_PROMPTS, AGENT_TEMPERATURES } from '../lib/agent-strict-prompts.js';
import { buildAgentSystemMessage } from '../lib/personality-integration.js';

// ── Canvas routes ──
import canvasRouter from './canvas-routes.js';
import canvasProjectRouter from './canvas-project-routes.js';
import canvasBuilderRouter from './canvas-builder-routes.js';
import canvasDeployRouter from './canvas-deploy-routes.js';
import canvasMonitoringRouter from './canvas-monitoring-routes.js';
import canvasAssetRouter from './canvas-asset-routes.js';
import canvasBuildsRouter from './canvas-builds-routes.js';
import canvasVideoEditorRouter from './canvas-video-editor-routes.js';
import canvasDatabaseRouter from './canvas-database-routes.js';
import canvasAgentOpsRouter from './canvas-agent-ops-routes.js';

// ── Editor Bridge ──
import editorBridgeRouter from './editor-bridge-routes.js';

// ── Chat ──
import chatRouter from './chat.js';
import chatSessionsRouter from './chat-sessions.js';

// ── Media & Uploads ──
import mediaRouter from './media-routes.js';
import uploadsRouter from './uploads.js';

// ── Apps & Hosting ──
import appsRouter from './apps-routes.js';
import appHostingRouter from './app-hosting-routes.js';
import sandboxRouter from './sandbox-routes.js';

// ── Analytics ──
import analyticsRouter from './analytics.js';

// ── Chat Extras (ai-studio-demo specific) ──
import agentChatStreamRouter from './agent-chat-stream.js';
import agentSearchRouter from './agent-search.js';

const router = express.Router();

// ============================================
// GLOBAL MIDDLEWARE
// ============================================

// API-specific rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 API requests per windowMs
  message: {
    success: false,
    message: 'API rate limit exceeded, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================
// API VERSIONING & HEALTH CHECKS
// ============================================

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// API version info
router.get('/version', (req, res) => {
  res.json({
    success: true,
    version: '1.0.0',
    apiVersion: 'v1',
    buildDate: new Date().toISOString(),
    features: [
      'authentication',
      'canvas',
      'canvas-builder',
      'canvas-projects',
      'video-editor',
      'sandbox',
      'monitoring',
      'subscriptions',
    ],
  });
});

// ============================================
// AUTHENTICATION ROUTES
// ============================================
router.use('/auth', apiLimiter);
router.use('/auth', authRouter);

// ============================================
// USER ROUTES
// ============================================
router.use('/user/memory', apiLimiter);
router.use('/user/memory', userMemoryRouter);
router.use('/user/preferences', apiLimiter);
router.use('/user/preferences', userPreferencesRouter);

// ============================================
// SUBSCRIPTIONS
// ============================================
router.use('/agent/subscriptions', apiLimiter);
router.use('/agent/subscriptions', agentSubscriptionsRouter);

// Agent strict prompts endpoint
const TOOL_CAPABILITIES_BLOCK = `

TOOL CAPABILITIES (188 tools across 24 categories):
You have access to real tools that you can use when appropriate. The system will present these tools to you and you decide when to call them based on the user's request.

**Core Utilities:** web_search, fetch_url, execute_code, calculate, get_current_time, get_weather, generate_video, http_request, fetch_webpage, run_command
**Document Parsing:** parse_pdf, parse_docx, parse_csv, parse_json, parse_markdown, parse_html, transcribe_audio
**Image Processing:** image_create, image_transform, image_convert, image_compose, image_filter, image_analyze, image_batch, image_background, image_face, image_ai, image_export, image_ocr, generate_image
**Video Processing:** video_transform, video_convert, video_analyze, video_overlay, video_filter, video_audio, video_ai, video_batch
**Archive/ZIP:** archive_core, archive_edit, archive_structure, archive_security, archive_bulk, archive_convert, archive_intelligence, archive_deploy
**Developer Tools:** dev_filesystem, dev_search, dev_intelligence, dev_debug, dev_test, dev_git, dev_npm, dev_docker
**Web & Frontend:** web_analyze, web_scaffold, web_optimize, web_transform, web_screenshot, web_lighthouse, web_scrape
**Database:** db_query, db_schema, db_backup, db_migrate, db_analyze, db_connect
**API & Integrations:** api_request, api_mock, api_document, api_test, api_transform, webhook_listen, sdk_generate
**AI & ML:** llm_chat, llm_embed, llm_finetune, ml_train, ml_predict
**Security:** crypto_hash, crypto_encrypt, crypto_sign, scan_secrets, scan_malware, auth_generate
**Agent Intelligence:** agent_memory, agent_safety, agent_ui, agent_control, editor_select, save_context, recall_context
**File System:** create_file, read_file, modify_file, write_file, delete_file, list_files, file_exists, create_folder, list_folders, move_file, copy_file, rename_file, zip_files, unzip_files, get_project_tree, file_watch, sync_files
**Content & Markdown:** markdown_convert, markdown_validate, markdown_generate, markdown_toc, markdown_format
**Analytics & Monitoring:** analytics_track, analytics_dashboard, log_parse, monitor_health, telemetry_send
**Convenience:** think_step_by_step, generate_code, debug_code, summarize_file, search_in_files, find_file_by_name, get_symbols, git_status, git_log, read_json, create_zip, list_zip_contents, extract_zip
**Finance & Accounting:** invoice_generate, expense_track, budget_plan, financial_report, tax_calculate, currency_convert, payment_process
**Project Management:** project_create, task_manage, milestone_track, gantt_generate, sprint_plan, resource_allocate, deadline_track
**Communication & Email:** email_draft, email_template, newsletter_create, notification_send, sms_send, calendar_manage, meeting_schedule
**CRM & Sales:** lead_track, pipeline_manage, deal_forecast, customer_profile, sales_report, proposal_generate, contract_draft
**HR & Recruiting:** resume_parse, job_post, interview_schedule, employee_onboard, payroll_calculate, performance_review, org_chart
**Legal & Compliance:** contract_analyze, compliance_check, nda_generate, terms_generate, privacy_audit, regulatory_report, ip_search
**Marketing & SEO:** seo_audit, keyword_research, social_post, campaign_track, ab_test, brand_monitor, content_calendar
**Data & BI:** data_visualize, report_generate, kpi_dashboard, data_export, pivot_table, trend_analyze, forecast_model

TOOL USAGE RULES:
- Use tools when the task requires them
- When generate_image returns a URL, include it as: ![description](url)
- When file operations return download URLs, include them as: [filename](url)
- Never say "I can't do that" for tasks covered by your tools
- Never suggest external websites for things your tools can do`;

router.get('/agent/prompts', (req, res) => {
  const data = {};
  for (const [agentId, _prompt] of Object.entries(STRICT_AGENT_PROMPTS)) {
    const fullSystemPrompt = buildAgentSystemMessage(agentId, '');
    data[agentId] = {
      systemPrompt: fullSystemPrompt + TOOL_CAPABILITIES_BLOCK,
      temperature: AGENT_TEMPERATURES[agentId] || 0.7,
    };
  }
  res.json({ success: true, data });
});

// ============================================
// COOKIE CONSENT
// ============================================
router.post('/cookie-consent', apiLimiter, (req, res) => {
  try {
    const { consent } = req.body;
    const isProduction = req.headers['x-forwarded-proto'] === 'https' || req.get('host')?.includes('mumtaz.ai');
    const cookieDomain = isProduction ? '.mumtaz.ai' : undefined;
    const consentValue = typeof consent === 'object' ? JSON.stringify(consent) : String(consent || 'accepted');
    res.cookie('cookie_consent', consentValue, {
      httpOnly: false, secure: isProduction, sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60 * 1000, path: '/', domain: cookieDomain,
    });
    res.json({ success: true, message: 'Cookie consent recorded' });
  } catch (error) {
    console.error('[cookie-consent] error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to record cookie consent' });
  }
});
router.get('/cookie-consent', apiLimiter, (req, res) => {
  const consent = req.cookies?.cookie_consent || null;
  res.json({ success: true, consent });
});

// ============================================
// CHAT ROUTES
// ============================================
router.use('/chat', apiLimiter);
router.use('/chat', chatRouter);
router.use('/chat/sessions', apiLimiter);
router.use('/chat/sessions', chatSessionsRouter);

// ============================================
// MEDIA & UPLOADS ROUTES
// ============================================
router.use('/media', apiLimiter);
router.use('/media', mediaRouter);
router.use('/uploads', apiLimiter);
router.use('/uploads', uploadsRouter);

// ============================================
// CANVAS ROUTES
// ============================================
router.use('/canvas', apiLimiter);
router.use('/canvas', canvasRouter);
router.use('/canvas', canvasDeployRouter);
router.use('/canvas-projects', apiLimiter);
router.use('/canvas-projects', canvasProjectRouter);
router.use('/canvas-builder', apiLimiter);
router.use('/canvas-builder', canvasBuilderRouter);
router.use('/builds', apiLimiter);
router.use('/builds', canvasBuildsRouter);
router.use('/monitoring', apiLimiter);
router.use('/monitoring', canvasMonitoringRouter);
router.use('/assets', apiLimiter);
router.use('/assets', canvasAssetRouter);
router.use('/video-editor', apiLimiter);
router.use('/video-editor', canvasVideoEditorRouter);
router.use('/database', apiLimiter);
router.use('/database', canvasDatabaseRouter);
router.use('/agent-ops', apiLimiter);
router.use('/agent-ops', canvasAgentOpsRouter);
router.use('/editor', apiLimiter);
router.use('/editor', editorBridgeRouter);

// ============================================
// APPS & HOSTING ROUTES
// ============================================
router.use('/apps', apiLimiter);
router.use('/apps', appsRouter);
router.use('/apps/hosting', apiLimiter);
router.use('/apps/hosting', appHostingRouter);
router.use('/sandbox', apiLimiter);
router.use('/sandbox', sandboxRouter);

// ============================================
// ANALYTICS & SUBSCRIPTIONS
// ============================================
router.use('/analytics', apiLimiter);
router.use('/analytics', analyticsRouter);
router.use('/subscriptions', apiLimiter);
router.use('/subscriptions', agentSubscriptionsRouter);

// ============================================
// AGENT CHAT STREAM & SEARCH (ai-studio-demo specific)
// ============================================
router.use('/agent/chat-stream', apiLimiter);
router.use('/agent/chat-stream', agentChatStreamRouter);
router.use('/agent/search', apiLimiter);
router.use('/agent/search', agentSearchRouter);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler for API routes
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
  });
});

// Global error handler
router.use((error, req, res, _next) => {
  console.error('API Error:', error);

  // Handle validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(error.errors).map((err) => err.message),
    });
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
    });
  }

  // Handle Prisma/database errors
  if (
    error.name === 'PrismaClientKnownRequestError' ||
    error.name === 'PrismaClientValidationError'
  ) {
    return res.status(500).json({
      success: false,
      message: 'Database error',
    });
  }

  // Generic error
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

export default router;
