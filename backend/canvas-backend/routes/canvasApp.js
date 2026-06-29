/**
 * CANVAS STUDIO APP ROUTES
 * Handles auth, workspace, hosting, speech, credentials,
 * dashboard, billing, video, assets, project, sandbox,
 * AI helpers, agent tools, and collaboration endpoints
 * needed by the Canvas Studio frontend.
 */

import { Router } from 'express';
import * as jose from 'jose';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { emailService } from '../services/emailService.js';
import crypto from 'crypto';
import http from 'http';
import https from 'https';
import multer from 'multer';
import path from 'path';
import { ECSClient, RunTaskCommand, StopTaskCommand, DescribeTasksCommand, ListTasksCommand } from '@aws-sdk/client-ecs';
import { uploadImage, resignUrl, deleteImage, isConfigured as isS3Configured } from '../services/imageStorage.js';
import { ALL_TOOLS, executeTool, hasTool, getTool, getToolsByCategory, isDangerousTool } from '../services/toolsHeadquarters.js';

// ── Multer: memory storage (buffer handed to S3, never written to disk) ──────
const ASSET_MIME_WHITELIST = new Set([
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif',
    'video/mp4', 'video/webm', 'video/ogg',
    'font/woff', 'font/woff2', 'font/ttf', 'font/otf',
    'application/font-woff', 'application/font-woff2',
    'application/pdf', 'application/json', 'text/plain', 'text/css',
]);
const assetUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
    fileFilter(_req, file, cb) {
        cb(null, ASSET_MIME_WHITELIST.has(file.mimetype));
    },
});

// ── Magic-byte validation: verify actual file content matches claimed MIME ────
// Maps MIME types to their expected file signature (magic bytes) at offset 0.
const MAGIC_BYTES = {
    'image/jpeg':  [Buffer.from([0xFF, 0xD8, 0xFF])],
    'image/png':   [Buffer.from([0x89, 0x50, 0x4E, 0x47])],
    'image/gif':   [Buffer.from('GIF87a'), Buffer.from('GIF89a')],
    'image/webp':  [Buffer.from('RIFF')],           // RIFF....WEBP
    'image/avif':  [Buffer.from([0x00, 0x00, 0x00])], // ftyp box (offset 4 = 'ftyp')
    'video/mp4':   [Buffer.from([0x00, 0x00, 0x00])], // ftyp box
    'video/webm':  [Buffer.from([0x1A, 0x45, 0xDF, 0xA3])], // EBML header
    'video/ogg':   [Buffer.from('OggS')],
    'application/pdf': [Buffer.from('%PDF')],
    'font/woff':   [Buffer.from('wOFF')],
    'font/woff2':  [Buffer.from('wOF2')],
    'application/font-woff':  [Buffer.from('wOFF')],
    'application/font-woff2': [Buffer.from('wOF2')],
};

/**
 * Validate that a file buffer's leading bytes match expected signatures
 * for the claimed MIME type. Text-based types (json, css, txt, svg, ttf/otf)
 * are allowed through since they have no reliable magic bytes.
 */
function validateMagicBytes(buffer, mimetype) {
    const signatures = MAGIC_BYTES[mimetype];
    if (!signatures) return true; // text-based or no signature defined — allow
    if (!buffer || buffer.length < 4) return false;
    return signatures.some(sig => buffer.subarray(0, sig.length).equals(sig));
}

const router = Router();

function getJwtSecret() { return process.env.CANVAS_STUDIO_JWT_SECRET || process.env.JWT_SECRET || 'dev-secret'; }
const APP_ID = 'canvas-studio';

// ── SSO email domain whitelist — only auto-provision users from these domains ─
const SSO_ALLOWED_DOMAINS = (process.env.SSO_ALLOWED_DOMAINS || 'mumtaz.ai')
    .split(',')
    .map(d => d.trim().toLowerCase())
    .filter(Boolean);

// ============================================================================
// ECS SANDBOX CLIENT
// ============================================================================
const ECS_REGION = process.env.AWS_REGION || 'us-east-1';
const ECS_CLUSTER = process.env.ECS_CLUSTER_ARN;
const ECS_TASK_DEF = process.env.ECS_TASK_DEFINITION || 'mumtazai-sandbox';
const ECS_SUBNETS = process.env.ECS_SUBNETS ? process.env.ECS_SUBNETS.split(',') : [];
const ECS_SECURITY_GROUP = process.env.ECS_SECURITY_GROUP;
const ASSIGN_PUBLIC_IP = process.env.SANDBOX_ASSIGN_PUBLIC_IP || 'ENABLED';

let ecsClient = null;
function getEcsClient() {
    if (!ecsClient) {
        ecsClient = new ECSClient({ region: ECS_REGION });
    }
    return ecsClient;
}

// Wait for task running + get IP
async function waitForTaskIp(taskArn, maxWait = 90000) {
    const ecs = getEcsClient();
    const deadline = Date.now() + maxWait;
    while (Date.now() < deadline) {
        const desc = await ecs.send(new DescribeTasksCommand({ cluster: ECS_CLUSTER, tasks: [taskArn] }));
        const task = desc.tasks?.[0];
        if (!task) throw new Error('Task not found');
        if (task.lastStatus === 'STOPPED') {
            throw new Error(`Task stopped: ${task.stoppedReason || 'unknown reason'}`);
        }
        if (task.lastStatus === 'RUNNING') {
            const eniAttachment = task.attachments?.find(a => a.type === 'ElasticNetworkInterface');
            const ipDetail = eniAttachment?.details?.find(d => d.name === 'privateIPv4Address');
            if (ipDetail?.value) return ipDetail.value;
        }
        await new Promise(r => setTimeout(r, 2000));
    }
    throw new Error('Timeout waiting for sandbox task to start');
}

// In-memory session store: taskArn → { ip, status, userId, startedAt }
const sandboxSessions = new Map();

// ============================================================================
// AUTH MIDDLEWARE
// ============================================================================

async function requireAuth(req, res, next) {
    try {
        const token =
            req.cookies?.canvas_studio_session ||
            req.cookies?.auth_token ||
            req.cookies?.neural_link_session ||
            req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(getJwtSecret()));

        // Try local user first by ID, then by email, auto-create if needed (cross-domain SSO)
        let user = await prisma.user.findUnique({
            where: { id: payload.userId },
            include: { credits: true },
        });

        if (!user && payload.email) {
            user = await prisma.user.findUnique({ where: { email: payload.email }, include: { credits: true } });
            if (!user) {
                // Auto-provision user from cross-domain SSO (JWT already verified)
                try {
                    user = await prisma.user.create({
                        data: {
                            email: payload.email,
                            name: payload.name || payload.email.split('@')[0],
                            passwordHash: 'cross-domain-sso',
                            isVerified: true,
                        },
                        include: { credits: true },
                    });
                    console.log(`[Auth] Auto-provisioned user ${payload.email} from cross-domain SSO`);
                } catch (createErr) {
                    if (createErr.code === 'P2002') {
                        user = await prisma.user.findUnique({ where: { email: payload.email }, include: { credits: true } });
                    } else {
                        throw createErr;
                    }
                }
            }
        }

        if (user) {
            req.user = user;
            return next();
        }
        return res.status(401).json({ success: false, error: 'User not found' });
    } catch (e) {
        console.log('[Auth] Token verification failed:', e.message);
        return res.status(401).json({ success: false, error: 'Authentication failed' });
    }
}

// ============================================================================
// AUTH ROUTES — /api/auth/*
// ============================================================================

router.get('/auth/me', async (req, res) => {
    try {
        const token =
            req.cookies?.canvas_studio_session ||
            req.cookies?.auth_token ||
            req.cookies?.neural_link_session ||
            req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ success: false, error: 'Not authenticated' });
        }

        const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(getJwtSecret()));

        // Try by ID first, then email, auto-provision from main site SSO
        let user = await prisma.user.findUnique({
            where: { id: payload.userId },
            include: { credits: true },
        });

        if (!user && payload.email) {
            user = await prisma.user.findUnique({ where: { email: payload.email }, include: { credits: true } });
            if (!user) {
                user = await prisma.user.create({
                    data: {
                        email: payload.email,
                        name: payload.name || payload.email.split('@')[0],
                        passwordHash: 'cross-domain-sso',
                        isVerified: true,
                    },
                    include: { credits: true },
                });
                console.log(`[Auth] Auto-provisioned user ${payload.email} via /auth/me`);
            }
        }

        if (!user) {
            return res.status(401).json({ success: false, error: 'User not found' });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        });
    } catch {
        res.status(401).json({ success: false, error: 'Invalid token' });
    }
});

// ============================================================================
// USER PREFERENCES — /api/preferences
// ============================================================================

// Get user preferences
router.get('/preferences', requireAuth, async (req, res) => {
    try {
        let prefs = await prisma.userPreferences.findUnique({
            where: { userId: req.user.id },
        });

        if (!prefs) {
            // Return defaults (don't create yet — created on first save)
            return res.json({
                success: true,
                preferences: {
                    isDarkMode: true,
                    temperature: 0.7,
                    maxTokens: 4096,
                    chatFontSize: 12,
                    focusMode: false,
                    chatMode: 'agent',
                    selectedLanguage: 'auto',
                    viewMode: 'preview',
                    deviceMode: 'desktop',
                    activePanel: 'assistant',
                    previewMode: 'browser',
                    uiFlags: {},
                },
            });
        }

        res.json({
            success: true,
            preferences: {
                isDarkMode: prefs.isDarkMode,
                temperature: prefs.temperature,
                maxTokens: prefs.maxTokens,
                chatFontSize: prefs.chatFontSize,
                focusMode: prefs.focusMode,
                chatMode: prefs.chatMode,
                selectedLanguage: prefs.selectedLanguage,
                viewMode: prefs.viewMode,
                deviceMode: prefs.deviceMode,
                activePanel: prefs.activePanel,
                previewMode: prefs.previewMode,
                uiFlags: prefs.uiFlags || {},
            },
        });
    } catch (err) {
        console.error('[Preferences] GET error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to load preferences' });
    }
});

// Save user preferences (upsert)
router.put('/preferences', requireAuth, async (req, res) => {
    try {
        const allowed = [
            'isDarkMode', 'temperature', 'maxTokens', 'chatFontSize',
            'focusMode', 'chatMode', 'selectedLanguage', 'viewMode',
            'deviceMode', 'activePanel', 'previewMode', 'uiFlags',
        ];
        const data = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) {
                data[key] = req.body[key];
            }
        }

        const prefs = await prisma.userPreferences.upsert({
            where: { userId: req.user.id },
            create: { userId: req.user.id, ...data },
            update: data,
        });

        res.json({
            success: true,
            preferences: {
                isDarkMode: prefs.isDarkMode,
                temperature: prefs.temperature,
                maxTokens: prefs.maxTokens,
                chatFontSize: prefs.chatFontSize,
                focusMode: prefs.focusMode,
                chatMode: prefs.chatMode,
                selectedLanguage: prefs.selectedLanguage,
                viewMode: prefs.viewMode,
                deviceMode: prefs.deviceMode,
                activePanel: prefs.activePanel,
                previewMode: prefs.previewMode,
                uiFlags: prefs.uiFlags || {},
            },
        });
    } catch (err) {
        console.error('[Preferences] PUT error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to save preferences' });
    }
});

// Patch a single UI flag (e.g. { sidebarIntroSeen: true })
// Merges into existing uiFlags JSON without clobbering other flags.
router.patch('/preferences/ui-flags', requireAuth, async (req, res) => {
    try {
        if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
            return res.status(400).json({ success: false, error: 'Body must be an object of flag updates' });
        }
        const existing = await prisma.userPreferences.findUnique({
            where: { userId: req.user.id },
            select: { uiFlags: true },
        });
        const merged = { ...(existing?.uiFlags || {}), ...req.body };
        const prefs = await prisma.userPreferences.upsert({
            where: { userId: req.user.id },
            create: { userId: req.user.id, uiFlags: merged },
            update: { uiFlags: merged },
            select: { uiFlags: true },
        });
        res.json({ success: true, uiFlags: prefs.uiFlags || {} });
    } catch (err) {
        console.error('[Preferences] PATCH ui-flags error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to update UI flags' });
    }
});

// ============================================================================
// CHAT SESSION ROUTES — /api/chat/sessions
// ============================================================================

// List chat sessions
router.get('/chat/sessions', requireAuth, async (req, res) => {
    try {
        const sessions = await prisma.chatSession.findMany({
            where: { userId: req.user.id, sourceApp: APP_ID },
            orderBy: { updatedAt: 'desc' },
            take: 50,
            include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
        });
        res.json({ success: true, sessions });
    } catch (err) {
        console.error('[ChatSessions] List error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to list sessions' });
    }
});

// Get a chat session with messages
router.get('/chat/sessions/:sessionId', requireAuth, async (req, res) => {
    try {
        const session = await prisma.chatSession.findFirst({
            where: { id: req.params.sessionId, userId: req.user.id },
            include: { messages: { orderBy: { createdAt: 'asc' } } },
        });
        if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
        res.json({ success: true, session });
    } catch (err) {
        console.error('[ChatSessions] Get error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to load session' });
    }
});

// Create a new chat session
router.post('/chat/sessions', requireAuth, async (req, res) => {
    try {
        const { name, chatMode, provider, model } = req.body;
        const session = await prisma.chatSession.create({
            data: {
                userId: req.user.id,
                name: name || 'New Chat',
                chatMode: chatMode || 'Agent',
                provider: provider || 'gemini',
                model: model || 'gemini-3-flash-preview',
                sourceApp: APP_ID,
            },
        });
        res.json({ success: true, session });
    } catch (err) {
        console.error('[ChatSessions] Create error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to create session' });
    }
});

// Add message to session
router.post('/chat/sessions/:sessionId/messages', requireAuth, async (req, res) => {
    try {
        const session = await prisma.chatSession.findFirst({
            where: { id: req.params.sessionId, userId: req.user.id },
        });
        if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

        const { role, content, chatMode, provider, model, tokensUsed, creditsCost, latencyMs, metadata } = req.body;
        if (!role || !content) return res.status(400).json({ success: false, error: 'role and content required' });

        const message = await prisma.chatMessage.create({
            data: {
                sessionId: session.id,
                role: role === 'user' ? 'USER' : role === 'system' ? 'SYSTEM' : 'ASSISTANT',
                content,
                chatMode,
                provider,
                model,
                tokensUsed: tokensUsed || null,
                creditsCost: creditsCost || null,
                latencyMs: latencyMs || null,
                metadata: metadata || null,
            },
        });

        // Update session message count
        await prisma.chatSession.update({
            where: { id: session.id },
            data: { messageCount: { increment: 1 } },
        });

        res.json({ success: true, message });
    } catch (err) {
        console.error('[ChatSessions] AddMessage error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to add message' });
    }
});

// Delete a chat session
router.delete('/chat/sessions/:sessionId', requireAuth, async (req, res) => {
    try {
        const session = await prisma.chatSession.findFirst({
            where: { id: req.params.sessionId, userId: req.user.id },
        });
        if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

        await prisma.chatSession.delete({ where: { id: session.id } });
        res.json({ success: true });
    } catch (err) {
        console.error('[ChatSessions] Delete error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to delete session' });
    }
});

// Archive / unarchive a chat session
router.patch('/chat/sessions/:sessionId/archive', requireAuth, async (req, res) => {
    try {
        const session = await prisma.chatSession.findFirst({
            where: { id: req.params.sessionId, userId: req.user.id },
            select: { id: true },
        });
        if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
        const isArchived = req.body?.isArchived !== false; // default true
        const updated = await prisma.chatSession.update({
            where: { id: session.id },
            data: { isArchived },
        });
        res.json({ success: true, session: updated });
    } catch (err) {
        console.error('[ChatSessions] Archive error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to archive session' });
    }
});

// Bulk-archive: create a session from a transient client-side conversation, persist messages, and archive it.
// Useful for the "Archive conversation" UI button when no sessionId exists yet.
router.post('/chat/sessions/archive-from-conversation', requireAuth, async (req, res) => {
    try {
        const { name, chatMode, provider, model, messages } = req.body || {};
        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ success: false, error: 'messages array required' });
        }
        const session = await prisma.chatSession.create({
            data: {
                userId: req.user.id,
                name: (name || messages[0]?.content?.slice(0, 50) || 'Archived chat').toString(),
                chatMode: chatMode || 'Agent',
                provider: provider || 'gemini',
                model: model || 'gemini-3-flash-preview',
                sourceApp: APP_ID,
                isArchived: true,
                messageCount: messages.length,
            },
        });
        // Persist messages in original order
        const data = messages.map((m) => ({
            sessionId: session.id,
            role: m.role === 'user' ? 'USER' : m.role === 'system' ? 'SYSTEM' : 'ASSISTANT',
            content: String(m.content ?? m.text ?? ''),
            chatMode: m.chatMode || null,
            provider: m.provider || null,
            model: m.model || null,
            tokensUsed: m.tokensUsed || null,
            creditsCost: m.creditsCost || null,
            latencyMs: m.latencyMs || null,
            metadata: m.metadata || null,
        }));
        await prisma.chatMessage.createMany({ data });
        res.json({ success: true, session });
    } catch (err) {
        console.error('[ChatSessions] ArchiveFromConversation error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to archive conversation' });
    }
});

// ============================================================================
// WORKSPACE ROUTES — /api/workspace/*
// ============================================================================

// List projects
router.get('/workspace/projects', requireAuth, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const sourceApp = req.query.sourceApp || APP_ID;

        const projects = await prisma.project.findMany({
            where: { userId: req.user.id, sourceApp },
            orderBy: { updatedAt: 'desc' },
            take: limit,
            include: { files: { where: { isMain: true }, take: 1 } },
        });

        const mapped = projects.map(p => ({
            ...p,
            code: p.files?.[0]?.content || '',
        }));

        res.json({ success: true, projects: mapped });
    } catch (error) {
        console.error('[Workspace] List error:', error.message);
        res.json({ success: true, projects: [] });
    }
});

// Create project
router.post('/workspace/projects', requireAuth, async (req, res) => {
    try {
        const { name, description, slug, code, files, sourceApp } = req.body;
        const projectSlug = slug || name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `project-${Date.now()}`;

        const project = await prisma.project.create({
            data: {
                name: name || 'Untitled',
                description: description || '',
                slug: projectSlug,
                sourceApp: sourceApp || APP_ID,
                userId: req.user.id,
                ...(code && {
                    files: {
                        create: { path: 'main.html', content: code, language: 'html', isMain: true },
                    },
                }),
            },
            include: { files: true },
        });

        const mainFile = project.files?.find(f => f.isMain) || project.files?.[0];
        res.json({
            success: true,
            project: { ...project, code: mainFile?.content || '' },
        });
    } catch (error) {
        console.error('[Workspace] Create error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to create project' });
    }
});

// Get single project
router.get('/workspace/projects/:slug', requireAuth, async (req, res) => {
    try {
        const project = await prisma.project.findFirst({
            where: { slug: req.params.slug, userId: req.user.id },
            include: { files: true },
        });

        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        const mainFile = project.files?.find(f => f.isMain) || project.files?.[0];
        res.json({ success: true, project: { ...project, code: mainFile?.content || '' } });
    } catch (error) {
        console.error('[Workspace] Get error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to get project' });
    }
});

// Update project (PUT)
router.put('/workspace/projects/:slug', requireAuth, async (req, res) => {
    try {
        const { name, description } = req.body;

        const project = await prisma.project.findFirst({
            where: { slug: req.params.slug, userId: req.user.id },
        });

        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        const updated = await prisma.project.update({
            where: { id: project.id },
            data: {
                ...(name !== undefined && { name }),
                ...(description !== undefined && { description }),
            },
        });

        res.json({ success: true, project: updated });
    } catch (error) {
        console.error('[Workspace] Update error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to update project' });
    }
});

// Save project files
router.post('/workspace/projects/:slug/save', requireAuth, async (req, res) => {
    try {
        const { code, files, name, description } = req.body;

        const project = await prisma.project.findFirst({
            where: { slug: req.params.slug, userId: req.user.id },
        });

        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        // Update project metadata
        if (name !== undefined || description !== undefined) {
            await prisma.project.update({
                where: { id: project.id },
                data: {
                    ...(name !== undefined && { name }),
                    ...(description !== undefined && { description }),
                },
            });
        }

        // Save multi-file project
        if (files && typeof files === 'object') {
            for (const [filePath, content] of Object.entries(files)) {
                const lang = filePath.split('.').pop() || 'txt';
                const isMain = filePath === 'index.html' || filePath === 'main.html';
                await prisma.projectFile.upsert({
                    where: { projectId_path: { projectId: project.id, path: filePath } },
                    update: { content: String(content) },
                    create: { projectId: project.id, path: filePath, content: String(content), language: lang, isMain },
                });
            }
        }

        // Save single code field
        if (code !== undefined && !files) {
            await prisma.projectFile.upsert({
                where: { projectId_path: { projectId: project.id, path: 'main.html' } },
                update: { content: code },
                create: { projectId: project.id, path: 'main.html', content: code, language: 'html', isMain: true },
            });
        }

        res.json({ success: true, updated: 1 });
    } catch (error) {
        console.error('[Workspace] Save error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to save project' });
    }
});

// Quick save (from shared/api.ts)
router.post('/workspace/quick-save', requireAuth, async (req, res) => {
    try {
        const { code, slug, name, sourceApp } = req.body;
        const projectSlug = slug || `quick-${Date.now()}`;

        const existing = await prisma.project.findFirst({
            where: { slug: projectSlug, userId: req.user.id },
        });

        if (existing) {
            if (code !== undefined) {
                await prisma.projectFile.upsert({
                    where: { projectId_path: { projectId: existing.id, path: 'main.html' } },
                    update: { content: code },
                    create: { projectId: existing.id, path: 'main.html', content: code, language: 'html', isMain: true },
                });
            }
            res.json({ success: true, slug: projectSlug });
        } else {
            const project = await prisma.project.create({
                data: {
                    name: name || 'Quick Save',
                    slug: projectSlug,
                    sourceApp: sourceApp || APP_ID,
                    userId: req.user.id,
                    files: code ? {
                        create: { path: 'main.html', content: code, language: 'html', isMain: true },
                    } : undefined,
                },
            });
            res.json({ success: true, slug: project.slug });
        }
    } catch (error) {
        console.error('[Workspace] Quick-save error:', error.message);
        res.status(500).json({ success: false, error: 'Quick save failed' });
    }
});

// Delete project
router.delete('/workspace/projects/:slug', requireAuth, async (req, res) => {
    try {
        const result = await prisma.project.deleteMany({
            where: { slug: req.params.slug, userId: req.user.id },
        });
        res.json({ success: true, deleted: result.count });
    } catch (error) {
        console.error('[Workspace] Delete error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to delete project' });
    }
});

// Collaborators
router.get('/workspace/projects/:slug/collaborators', requireAuth, async (req, res) => {
    try {
        const project = await prisma.project.findFirst({
            where: { slug: req.params.slug, userId: req.user.id },
            include: { user: { select: { id: true, email: true, name: true } } },
        });
        if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

        const collaborators = await prisma.projectCollaborator.findMany({
            where: { projectId: project.id },
            include: { user: { select: { id: true, email: true, name: true } } },
        });

        // Return owner info so frontend can display the project owner
        const owner = project.user ? {
            id: project.user.id,
            name: project.user.name,
            email: project.user.email,
        } : null;

        res.json({ success: true, owner, collaborators });
    } catch {
        res.json({ success: true, collaborators: [] });
    }
});

router.post('/workspace/projects/:slug/collaborators', requireAuth, async (req, res) => {
    try {
        const { email, role } = req.body;

        const project = await prisma.project.findFirst({
            where: { slug: req.params.slug, userId: req.user.id },
        });
        if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

        const invitedUser = await prisma.user.findUnique({ where: { email } });
        if (!invitedUser) return res.status(404).json({ success: false, error: 'User not found' });

        const collab = await prisma.projectCollaborator.create({
            data: {
                projectId: project.id,
                userId: invitedUser.id,
                role: role || 'viewer',
            },
        });
        res.json({ success: true, collaborator: collab });
    } catch (error) {
        console.error('[Collab] Invite error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to invite collaborator' });
    }
});

router.delete('/workspace/projects/:slug/collaborators/:id', requireAuth, async (req, res) => {
    try {
        await prisma.projectCollaborator.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch {
        res.json({ success: true });
    }
});

router.post('/workspace/projects/:slug/share-link', requireAuth, async (req, res) => {
    try {
        const shareToken = crypto.randomBytes(16).toString('hex');
        const shareUrl = `https://build.mumtaz.ai/shared/${req.params.slug}?token=${shareToken}`;
        res.json({ success: true, url: shareUrl, token: shareToken });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to generate share link' });
    }
});

// Databases
router.get('/workspace/databases', requireAuth, async (req, res) => {
    try {
        const databases = await prisma.projectDatabase.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, databases });
    } catch {
        res.json({ success: true, databases: [] });
    }
});

router.post('/workspace/databases', requireAuth, async (req, res) => {
    try {
        const { name, type, projectId } = req.body;
        const db = await prisma.projectDatabase.create({
            data: {
                name: name || 'New Database',
                type: type || 'sqlite',
                userId: req.user.id,
                projectId: projectId || null,
                connectionString: `sqlite:///tmp/db-${Date.now()}.db`,
            },
        });
        res.json({ success: true, database: db });
    } catch (error) {
        console.error('[Database] Create error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to create database' });
    }
});

router.delete('/workspace/databases/:id', requireAuth, async (req, res) => {
    try {
        await prisma.projectDatabase.deleteMany({ where: { id: req.params.id, userId: req.user.id } });
        res.json({ success: true });
    } catch {
        res.json({ success: true });
    }
});

// ============================================================================
// HOSTING ROUTES — /api/hosting/*
// ============================================================================

router.get('/hosting/my-apps', requireAuth, async (req, res) => {
    try {
        const sourceApp = req.query.sourceApp || APP_ID;

        const apps = await prisma.hostedApp.findMany({
            where: { userId: req.user.id, sourceApp },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true, slug: true, name: true, previewUrl: true, productionUrl: true,
                sourceApp: true, status: true, createdAt: true, updatedAt: true,
            },
        });

        const mapped = apps.map(a => ({
            ...a,
            url: a.productionUrl || a.previewUrl || `https://${a.slug}.mumtaz.ai`,
            embedUrl: a.previewUrl,
        }));

        res.json({ success: true, apps: mapped });
    } catch {
        res.json({ success: true, apps: [] });
    }
});

router.post('/hosting/deploy', requireAuth, async (req, res) => {
    try {
        const { name, html, code, slug, sourceApp } = req.body;
        const deploySlug = slug || `app-${Date.now()}`;
        const url = `https://${deploySlug}.mumtaz.ai`;

        try {
            await prisma.hostedApp.upsert({
                where: { slug: deploySlug },
                update: { code: html || code || '', name, updatedAt: new Date() },
                create: {
                    slug: deploySlug,
                    name: name || 'Untitled App',
                    code: html || code || '',
                    previewUrl: url,
                    sourceApp: sourceApp || APP_ID,
                    userId: req.user.id,
                },
            });
        } catch { /* OK if hostedApp table unavailable */ }

        res.json({ success: true, url, slug: deploySlug });
    } catch (error) {
        console.error('[Hosting] Deploy error:', error.message);
        res.status(500).json({ success: false, error: 'Deploy failed' });
    }
});

// ============================================================================
// SPEECH ROUTES — /api/speech/*
// ============================================================================

router.post('/speech/synthesize', requireAuth, async (req, res) => {
    try {
        const { text, voice } = req.body;

        if (!text) return res.status(400).json({ success: false, error: 'Text is required' });

        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const mp3 = await openai.audio.speech.create({
            model: 'tts-1',
            voice: voice || 'alloy',
            input: text.substring(0, 4096),
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());
        res.set('Content-Type', 'audio/mpeg');
        res.send(buffer);
    } catch (error) {
        console.error('[Speech] Synthesize error:', error.message);
        res.status(500).json({ success: false, error: 'Speech synthesis failed' });
    }
});

// ============================================================================
// CREDENTIALS ROUTES — /api/credentials/*
// ============================================================================

router.get('/credentials', requireAuth, async (req, res) => {
    try {
        const credentials = await prisma.deployCredential.findMany({
            where: { userId: req.user.id },
            select: { id: true, provider: true, label: true, isValid: true, createdAt: true },
        });
        res.json({ success: true, credentials });
    } catch {
        res.json({ success: true, credentials: [] });
    }
});

router.post('/credentials', requireAuth, async (req, res) => {
    try {
        const { provider, apiKey, label } = req.body;

        const ENCRYPTION_KEY = process.env.CREDENTIAL_ENCRYPTION_KEY || process.env.JWT_SECRET || 'dev-encryption-key-32chars!!!!!';
        const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        let encrypted = cipher.update(apiKey || '', 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');

        const credential = await prisma.deployCredential.create({
            data: {
                provider: provider.toUpperCase(),
                encryptedToken: encrypted + ':' + authTag,
                tokenIv: iv.toString('hex'),
                label: label || provider,
                userId: req.user.id,
            },
        });
        res.json({ success: true, credential: { id: credential.id, provider, label } });
    } catch (error) {
        console.error('[Credentials] Create error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to save credential' });
    }
});

router.delete('/credentials/:providerId', requireAuth, async (req, res) => {
    try {
        await prisma.deployCredential.deleteMany({
            where: { id: req.params.providerId, userId: req.user.id },
        });
        res.json({ success: true });
    } catch {
        res.json({ success: true });
    }
});

router.post('/credentials/:providerId/validate', requireAuth, async (req, res) => {
    try {
        const credential = await prisma.deployCredential.findFirst({
            where: { id: req.params.providerId, userId: req.user.id },
        });
        if (!credential) {
            return res.status(404).json({ success: false, valid: false, error: 'Credential not found' });
        }

        // Decrypt the stored token
        const ENCRYPTION_KEY = process.env.CREDENTIAL_ENCRYPTION_KEY || process.env.JWT_SECRET || 'dev-encryption-key-32chars!!!!!';
        const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
        const iv = Buffer.from(credential.tokenIv, 'hex');
        const [encData, authTagHex] = credential.encryptedToken.split(':');
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
        let decrypted = decipher.update(encData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        // Validate by calling the provider's API
        const provider = credential.provider.toUpperCase();
        let valid = false;
        let validationError = null;

        if (provider === 'GITHUB') {
            const resp = await fetch('https://api.github.com/user', {
                headers: { Authorization: `Bearer ${decrypted}`, 'User-Agent': 'OnelastAI-Canvas' },
            });
            valid = resp.ok;
            if (!valid) validationError = 'GitHub token is invalid or expired';
        } else if (provider === 'VERCEL') {
            const resp = await fetch('https://api.vercel.com/v2/user', {
                headers: { Authorization: `Bearer ${decrypted}` },
            });
            valid = resp.ok;
            if (!valid) validationError = 'Vercel token is invalid or expired';
        } else if (provider === 'NETLIFY') {
            const resp = await fetch('https://api.netlify.com/api/v1/user', {
                headers: { Authorization: `Bearer ${decrypted}` },
            });
            valid = resp.ok;
            if (!valid) validationError = 'Netlify token is invalid or expired';
        } else if (provider === 'OPENAI') {
            const resp = await fetch('https://api.openai.com/v1/models', {
                headers: { Authorization: `Bearer ${decrypted}` },
            });
            valid = resp.ok;
            if (!valid) validationError = 'OpenAI API key is invalid';
        } else if (provider === 'ANTHROPIC') {
            const resp = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: { 'x-api-key': decrypted, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: 'claude-3-haiku-20240307', max_tokens: 1, messages: [{ role: 'user', content: 'hi' }] }),
            });
            valid = resp.ok || resp.status === 400; // 400 = key valid but bad request is ok
            if (!valid) validationError = 'Anthropic API key is invalid';
        } else {
            // Unknown provider — can't validate, mark as unchecked
            return res.json({ success: true, valid: true, message: 'Provider validation not supported, assumed valid' });
        }

        // Update the isValid field in DB
        await prisma.deployCredential.update({
            where: { id: credential.id },
            data: { isValid: valid },
        });

        res.json({ success: true, valid, ...(validationError && { error: validationError }) });
    } catch (error) {
        console.error('[Credentials] Validate error:', error.message);
        res.status(500).json({ success: false, valid: false, error: 'Validation failed' });
    }
});

router.post('/credentials/deploy', requireAuth, async (req, res) => {
    try {
        const { provider, projectName, files, buildCommand, outputDir, envVars, sourceApp } = req.body;
        if (!provider || !projectName) {
            return res.status(400).json({ success: false, error: 'Provider and projectName are required' });
        }

        // Find the user's credential for this provider
        const credential = await prisma.deployCredential.findFirst({
            where: { userId: req.user.id, provider: provider.toUpperCase() },
        });
        if (!credential) {
            return res.status(400).json({ success: false, error: `No ${provider} credential configured. Add it in Deploy Credentials.` });
        }

        // Decrypt the stored token
        const ENCRYPTION_KEY = process.env.CREDENTIAL_ENCRYPTION_KEY || process.env.JWT_SECRET || 'dev-encryption-key-32chars!!!!!';
        const encKey = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
        const iv = Buffer.from(credential.tokenIv, 'hex');
        const [encData, authTagHex] = credential.encryptedToken.split(':');
        const decipher = crypto.createDecipheriv('aes-256-gcm', encKey, iv);
        decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
        let token = decipher.update(encData, 'hex', 'utf8');
        token += decipher.final('utf8');

        const providerKey = provider.toUpperCase();

        if (providerKey === 'GITHUB') {
            // Create or update GitHub repo and push files
            const repoName = projectName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
            const headers = { Authorization: `Bearer ${token}`, 'User-Agent': 'OnelastAI-Canvas', 'Content-Type': 'application/json' };

            // Check if repo exists
            let repoUrl = null;
            const checkResp = await fetch(`https://api.github.com/repos/${(await (await fetch('https://api.github.com/user', { headers })).json()).login}/${repoName}`, { headers });

            if (checkResp.status === 404) {
                // Create repo
                const createResp = await fetch('https://api.github.com/user/repos', {
                    method: 'POST', headers,
                    body: JSON.stringify({ name: repoName, description: `Deployed from Mumtaz AI Canvas`, private: false, auto_init: true }),
                });
                if (!createResp.ok) {
                    const err = await createResp.json();
                    return res.status(400).json({ success: false, error: err.message || 'Failed to create GitHub repo' });
                }
                const repo = await createResp.json();
                repoUrl = repo.html_url;
                // Wait for repo init
                await new Promise(r => setTimeout(r, 2000));
            } else if (checkResp.ok) {
                repoUrl = (await checkResp.json()).html_url;
            } else {
                return res.status(400).json({ success: false, error: 'Failed to check GitHub repo' });
            }

            // Push files using Contents API (for small projects)
            const fileEntries = Object.entries(files || {});
            let pushed = 0;
            for (const [filePath, content] of fileEntries) {
                const safePath = filePath.replace(/^\//, '');
                // Check if file exists (to get sha for update)
                const owner = (await (await fetch('https://api.github.com/user', { headers })).json()).login;
                const existResp = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${safePath}`, { headers });
                const existData = existResp.ok ? await existResp.json() : null;

                const putResp = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${safePath}`, {
                    method: 'PUT', headers,
                    body: JSON.stringify({
                        message: `Deploy ${safePath} from Canvas`,
                        content: Buffer.from(String(content)).toString('base64'),
                        ...(existData?.sha && { sha: existData.sha }),
                    }),
                });
                if (putResp.ok) pushed++;
            }

            res.json({ success: true, message: `Pushed ${pushed}/${fileEntries.length} files to GitHub`, url: repoUrl });
        } else if (providerKey === 'VERCEL' || providerKey === 'NETLIFY') {
            // For Vercel/Netlify, guide users to connect their GitHub repo
            res.status(501).json({
                success: false,
                error: `Direct ${provider} deployment is not yet supported. Push to GitHub first, then connect the repo in your ${provider} dashboard.`,
            });
        } else {
            res.status(400).json({ success: false, error: `Unsupported deploy provider: ${provider}` });
        }
    } catch (error) {
        console.error('[Credentials] Deploy error:', error.message);
        res.status(500).json({ success: false, error: 'Deployment failed: ' + error.message });
    }
});

// ============================================================================
// DASHBOARD — /api/dashboard
// ============================================================================

router.get('/dashboard', requireAuth, async (req, res) => {
    try {
        const projectCount = await prisma.project.count({ where: { userId: req.user.id } });
        const credits = await prisma.userCredits.findMany({ where: { userId: req.user.id } });
        const totalCredits = credits.reduce((sum, c) => sum + (c.balance || 0), 0);
        const deploymentCount = await prisma.hostedApp.count({ where: { userId: req.user.id } }).catch(() => 0);

        res.json({
            success: true,
            stats: {
                projects: projectCount,
                credits: totalCredits,
                deployments: deploymentCount,
                usage: { requests: 0, tokens: 0 },
            },
        });
    } catch {
        res.json({
            success: true,
            stats: { projects: 0, credits: 0, deployments: 0, usage: { requests: 0, tokens: 0 } },
        });
    }
});

// ============================================================================
// BILLING ROUTES — /api/billing/*
// ============================================================================

router.get('/billing/packages/:appId', async (req, res) => {
    try {
        const packages = await prisma.creditPackage.findMany({
            where: { appId: req.params.appId, isActive: true },
            orderBy: { credits: 'asc' },
        });

        if (packages.length === 0) {
            // Return default packages if none configured
            return res.json({
                success: true,
                packages: [
                    { id: 'starter', name: 'Starter', credits: 50, price: 5, stripePriceId: null },
                    { id: 'basic', name: 'Basic', credits: 250, price: 25, stripePriceId: null },
                    { id: 'pro', name: 'Pro', credits: 1000, price: 100, stripePriceId: null },
                    { id: 'business', name: 'Business', credits: 2500, price: 250, stripePriceId: null },
                    { id: 'enterprise', name: 'Enterprise', credits: 5000, price: 500, stripePriceId: null },
                ],
            });
        }
        res.json({ success: true, packages });
    } catch {
        res.json({ success: true, packages: [] });
    }
});

router.get('/billing/credits', requireAuth, async (req, res) => {
    try {
        const appId = req.query.app || APP_ID;
        const credits = await prisma.userCredits.findFirst({
            where: { userId: req.user.id, appId },
        });
        res.json({
            success: true,
            credits: credits ? { balance: credits.balance, freeCreditsMax: credits.freeCreditsMax } : { balance: 0, freeCreditsMax: 5 },
        });
    } catch {
        res.json({ success: true, credits: { balance: 0, freeCreditsMax: 5 } });
    }
});

router.post('/billing/verify', requireAuth, async (req, res) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId) return res.json({ success: false, error: 'sessionId required' });

        const Stripe = (await import('stripe')).default;
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeKey) return res.json({ success: false, verified: false });

        const stripe = new Stripe(stripeKey);
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === 'paid') {
            // Send purchase confirmation email
            try {
                const meta = session.metadata || {};
                await emailService.sendPurchaseConfirmation(
                    req.user.email,
                    req.user.name || '',
                    { credits: meta.credits || '?', amount: (session.amount_total / 100).toFixed(2), currency: (session.currency || 'usd').toUpperCase(), appName: 'Canvas Studio' }
                );
            } catch (emailErr) { console.error('[Billing] Purchase email error:', emailErr.message); }
            res.json({ success: true, verified: true, status: session.payment_status });
        } else {
            res.json({ success: false, verified: false, status: session.payment_status });
        }
    } catch (error) {
        console.error('[Billing] Verify error:', error.message);
        res.json({ success: false, verified: false });
    }
});

router.post('/billing/checkout/:appId', requireAuth, async (req, res) => {
    try {
        const Stripe = (await import('stripe')).default;
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeKey) return res.status(503).json({ success: false, error: 'Stripe not configured' });

        const stripe = new Stripe(stripeKey);
        const { priceId, packageId, credits: reqCredits, price: reqPrice } = req.body;

        let lineItems;
        let credits = 0;

        if (priceId && typeof priceId === 'string' && priceId.startsWith('price_')) {
            const pkg = await prisma.creditPackage.findFirst({ where: { stripePriceId: priceId } }).catch(() => null);
            if (pkg) credits = Number(pkg.credits);
            lineItems = [{ price: priceId, quantity: 1 }];
        } else {
            const PACKAGES = {
                'starter': { name: '50 Credits', credits: 50, priceCents: 500 },
                'basic': { name: '250 Credits', credits: 250, priceCents: 2500 },
                'pro': { name: '1,000 Credits', credits: 1000, priceCents: 10000 },
                'business': { name: '2,500 Credits', credits: 2500, priceCents: 25000 },
                'enterprise': { name: '5,000 Credits', credits: 5000, priceCents: 50000 },
                'nc-50': { name: '50 Credits', credits: 50, priceCents: 500 },
                'nc-100': { name: '100 Credits', credits: 100, priceCents: 1000 },
                'nc-350': { name: '350 Credits', credits: 350, priceCents: 3500 },
                'nc-600': { name: '600 Credits', credits: 600, priceCents: 6000 },
                'nc-1500': { name: '1,500 Credits', credits: 1500, priceCents: 15000 },
            };
            let pkg = packageId ? PACKAGES[packageId] : null;
            if (!pkg && reqCredits && reqPrice) {
                pkg = { name: `${reqCredits} Credits`, credits: Number(reqCredits), priceCents: Math.round(Number(reqPrice) * 100) };
            }
            if (!pkg) return res.status(400).json({ success: false, error: 'Invalid package — provide priceId, packageId, or credits+price' });
            credits = pkg.credits;
            lineItems = [{ price_data: { currency: 'usd', product_data: { name: `OneLast AI - ${pkg.name}` }, unit_amount: pkg.priceCents }, quantity: 1 }];
        }

        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            payment_method_types: ['card'],
            line_items: lineItems,
            success_url: `https://build.mumtaz.ai/thank-you/?credits=${credits}&app=canvas&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CANVAS_STUDIO_FRONTEND_URL || 'https://build.mumtaz.ai'}/?checkout=cancelled`,
            metadata: { userId: req.user.id, appId: req.params.appId, credits: String(credits), priceId: priceId || '' },
            allow_promotion_codes: true,
        });

        res.json({ success: true, url: session.url, sessionId: session.id });
    } catch (error) {
        console.error('[Billing] Checkout error:', error.message);
        res.status(500).json({ success: false, error: 'Checkout failed' });
    }
});

// ============================================================================
// VIDEO ROUTES — /api/video/*
// ============================================================================

router.get('/video/providers', (req, res) => {
    res.json({
        success: true,
        providers: [
            { id: 'runway', name: 'RunwayML', configured: !!process.env.RUNWAYML_API_KEY },
            { id: 'fal', name: 'fal.ai', configured: !!process.env.FAL_API_KEY },
        ],
    });
});

router.get('/video/history', requireAuth, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const videos = await prisma.videoGeneration.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
        res.json({ success: true, videos });
    } catch {
        res.json({ success: true, videos: [] });
    }
});

router.post('/video/history', requireAuth, async (req, res) => {
    try {
        const { prompt, provider, status, taskId, videoUrl } = req.body;
        const entry = await prisma.videoGeneration.create({
            data: {
                prompt: prompt || '',
                provider: provider || 'runway',
                status: status || 'pending',
                taskId: taskId || null,
                videoUrl: videoUrl || null,
                userId: req.user.id,
                sourceApp: APP_ID,
            },
        });
        res.json({ success: true, video: entry });
    } catch (error) {
        console.error('[Video] History create error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to create video entry' });
    }
});

router.patch('/video/history/:id', requireAuth, async (req, res) => {
    try {
        const { status, videoUrl, error: errMsg, thumbnailUrl, duration } = req.body;
        const updated = await prisma.videoGeneration.update({
            where: { id: req.params.id },
            data: {
                ...(status && { status }),
                ...(videoUrl && { videoUrl }),
                ...(errMsg && { error: errMsg }),
                ...(thumbnailUrl !== undefined && { thumbnailUrl }),
                ...(duration !== undefined && { duration }),
            },
        });
        res.json({ success: true, video: updated });
    } catch (error) {
        console.error('[Video] History update error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to update video' });
    }
});

router.delete('/video/history/:id', requireAuth, async (req, res) => {
    try {
        await prisma.videoGeneration.deleteMany({ where: { id: req.params.id, userId: req.user.id } });
        res.json({ success: true });
    } catch {
        res.json({ success: true });
    }
});

// RunwayML generation — calls RunwayML Gen-4 API
router.post('/video/runway', requireAuth, async (req, res) => {
    const apiKey = process.env.RUNWAYML_API_KEY;
    if (!apiKey) {
        return res.status(503).json({ success: false, error: 'RunwayML API key not configured. Set RUNWAYML_API_KEY in environment.' });
    }
    try {
        const { prompt, imageUrl, duration, model } = req.body;
        if (!prompt && !imageUrl) {
            return res.status(400).json({ success: false, error: 'A prompt or imageUrl is required' });
        }

        const runwayModel = model || 'gen4_turbo';
        const body = {
            model: runwayModel,
            promptText: prompt || '',
            ...(imageUrl && { promptImage: imageUrl }),
            duration: duration || 5,
            ratio: '16:9',
        };

        const resp = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'X-Runway-Version': '2024-11-06',
            },
            body: JSON.stringify(body),
        });

        if (!resp.ok) {
            const errData = await resp.json().catch(() => ({}));
            console.error('[Video] RunwayML API error:', resp.status, errData);
            return res.status(resp.status === 401 ? 401 : 502).json({
                success: false,
                error: errData.error || errData.message || `RunwayML API returned ${resp.status}`,
            });
        }

        const data = await resp.json();
        const taskId = data.id;

        // Save to video history
        try {
            await prisma.videoGeneration.create({
                data: { prompt: prompt || '', provider: 'runway', status: 'pending', taskId, userId: req.user.id, sourceApp: APP_ID },
            });
        } catch (dbErr) { console.error('[Video] History save error:', dbErr.message); }

        res.json({ success: true, taskId, status: 'pending' });
    } catch (error) {
        console.error('[Video] RunwayML generation error:', error.message);
        res.status(500).json({ success: false, error: 'RunwayML generation failed: ' + error.message });
    }
});

// RunwayML status polling — queries RunwayML API for task progress
router.get('/video/runway/status/:taskId', requireAuth, async (req, res) => {
    const apiKey = process.env.RUNWAYML_API_KEY;
    if (!apiKey) {
        return res.status(503).json({ success: false, error: 'RunwayML not configured' });
    }
    try {
        const resp = await fetch(`https://api.dev.runwayml.com/v1/tasks/${req.params.taskId}`, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'X-Runway-Version': '2024-11-06',
            },
        });

        if (!resp.ok) {
            return res.status(502).json({ success: false, error: `RunwayML status check failed (${resp.status})` });
        }

        const data = await resp.json();
        // RunwayML statuses: PENDING, RUNNING, SUCCEEDED, FAILED, CANCELLED
        const statusMap = { PENDING: 'pending', RUNNING: 'processing', SUCCEEDED: 'completed', FAILED: 'failed', CANCELLED: 'cancelled' };
        const status = statusMap[data.status] || data.status?.toLowerCase() || 'pending';
        const progress = data.progress != null ? Math.round(data.progress * 100) : (status === 'completed' ? 100 : 0);
        const videoUrl = data.output?.[0] || null;

        // Update DB record if status changed
        if (status === 'completed' || status === 'failed') {
            try {
                await prisma.videoGeneration.updateMany({
                    where: { taskId: req.params.taskId, userId: req.user.id },
                    data: { status, ...(videoUrl && { videoUrl }), ...(status === 'failed' && { error: data.failure || 'Generation failed' }) },
                });
            } catch (dbErr) { console.error('[Video] History update error:', dbErr.message); }
        }

        res.json({ success: true, status, taskId: req.params.taskId, progress, videoUrl, failure: data.failure || null });
    } catch (error) {
        console.error('[Video] RunwayML status error:', error.message);
        res.status(500).json({ success: false, error: 'Status check failed' });
    }
});

// RunwayML cancel — cancels task via RunwayML API
router.delete('/video/runway/cancel/:taskId', requireAuth, async (req, res) => {
    const apiKey = process.env.RUNWAYML_API_KEY;
    if (!apiKey) {
        return res.status(503).json({ success: false, error: 'RunwayML not configured' });
    }
    try {
        const resp = await fetch(`https://api.dev.runwayml.com/v1/tasks/${req.params.taskId}/cancel`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'X-Runway-Version': '2024-11-06',
            },
        });

        // Update DB
        try {
            await prisma.videoGeneration.updateMany({
                where: { taskId: req.params.taskId, userId: req.user.id },
                data: { status: 'cancelled' },
            });
        } catch (dbErr) { console.error('[Video] History cancel update error:', dbErr.message); }

        res.json({ success: true, cancelled: resp.ok });
    } catch (error) {
        console.error('[Video] RunwayML cancel error:', error.message);
        res.status(500).json({ success: false, error: 'Cancel failed' });
    }
});

// fal.ai generation — calls fal.ai queue API
router.post('/video/generate', requireAuth, async (req, res) => {
    const apiKey = process.env.FAL_API_KEY;
    if (!apiKey) {
        return res.status(503).json({ success: false, error: 'fal.ai API key not configured. Set FAL_API_KEY in environment.' });
    }
    try {
        const { prompt, imageUrl, model, negativePrompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ success: false, error: 'A prompt is required' });
        }

        const falModel = model || 'fal-ai/minimax/video-01-live';
        const body = {
            prompt,
            ...(imageUrl && { image_url: imageUrl }),
            ...(negativePrompt && { negative_prompt: negativePrompt }),
        };

        const resp = await fetch(`https://queue.fal.run/${falModel}`, {
            method: 'POST',
            headers: {
                Authorization: `Key ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!resp.ok) {
            const errData = await resp.json().catch(() => ({}));
            console.error('[Video] fal.ai API error:', resp.status, errData);
            return res.status(resp.status === 401 ? 401 : 502).json({
                success: false,
                error: errData.detail || errData.message || `fal.ai API returned ${resp.status}`,
            });
        }

        const data = await resp.json();
        const requestId = data.request_id;

        // Save to video history
        try {
            await prisma.videoGeneration.create({
                data: { prompt, provider: 'fal', status: 'pending', taskId: requestId, userId: req.user.id, sourceApp: APP_ID },
            });
        } catch (dbErr) { console.error('[Video] History save error:', dbErr.message); }

        res.json({ success: true, requestId, status: 'pending' });
    } catch (error) {
        console.error('[Video] fal.ai generation error:', error.message);
        res.status(500).json({ success: false, error: 'Video generation failed: ' + error.message });
    }
});

// fal.ai status polling — queries fal.ai queue for request status
router.get('/video/status/:requestId', requireAuth, async (req, res) => {
    const apiKey = process.env.FAL_API_KEY;
    if (!apiKey) {
        return res.status(503).json({ success: false, error: 'fal.ai not configured' });
    }
    try {
        // fal.ai uses model path in the status URL, check DB for the model
        const videoRecord = await prisma.videoGeneration.findFirst({
            where: { taskId: req.params.requestId, userId: req.user.id },
        });

        const falModel = 'fal-ai/minimax/video-01-live';
        const resp = await fetch(`https://queue.fal.run/${falModel}/requests/${req.params.requestId}/status`, {
            headers: { Authorization: `Key ${apiKey}` },
        });

        if (!resp.ok) {
            return res.status(502).json({ success: false, error: `fal.ai status check failed (${resp.status})` });
        }

        const data = await resp.json();
        // fal.ai statuses: IN_QUEUE, IN_PROGRESS, COMPLETED, FAILED
        const statusMap = { IN_QUEUE: 'pending', IN_PROGRESS: 'processing', COMPLETED: 'completed', FAILED: 'failed' };
        const status = statusMap[data.status] || data.status?.toLowerCase() || 'pending';
        const progress = status === 'completed' ? 100 : (status === 'processing' ? 50 : 0);

        // If completed, fetch the result to get the video URL
        let videoUrl = null;
        if (status === 'completed' && data.response_url) {
            try {
                const resultResp = await fetch(data.response_url, {
                    headers: { Authorization: `Key ${apiKey}` },
                });
                if (resultResp.ok) {
                    const resultData = await resultResp.json();
                    videoUrl = resultData.video?.url || resultData.output?.url || null;
                }
            } catch (fetchErr) { console.error('[Video] fal.ai result fetch error:', fetchErr.message); }
        }

        // Update DB record if status changed
        if (status === 'completed' || status === 'failed') {
            try {
                await prisma.videoGeneration.updateMany({
                    where: { taskId: req.params.requestId, userId: req.user.id },
                    data: { status, ...(videoUrl && { videoUrl }) },
                });
            } catch (dbErr) { console.error('[Video] History update error:', dbErr.message); }
        }

        res.json({ success: true, status, requestId: req.params.requestId, progress, videoUrl });
    } catch (error) {
        console.error('[Video] fal.ai status error:', error.message);
        res.status(500).json({ success: false, error: 'Status check failed' });
    }
});

// ============================================================================
// ASSETS ROUTES — /api/assets/*
// ============================================================================

// GET /assets — list with fresh signed URLs
router.get('/assets', requireAuth, async (req, res) => {
    try {
        const assets = await prisma.asset.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
        });

        // Re-sign URLs so they never expire for the caller
        const refreshed = await Promise.all(assets.map(async (a) => {
            if (a.s3Key) {
                try {
                    const { url } = await resignUrl(a.s3Key);
                    return { ...a, url };
                } catch { /* return as-is if re-sign fails */ }
            }
            return a;
        }));

        res.json({ success: true, assets: refreshed });
    } catch {
        res.json({ success: true, assets: [] });
    }
});

// POST /assets/upload — multipart → S3 → DB record
router.post('/assets/upload', requireAuth, assetUpload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file provided or file type not allowed.' });
        }

        // Verify actual file content matches claimed MIME (magic bytes check)
        if (!validateMagicBytes(req.file.buffer, req.file.mimetype)) {
            return res.status(400).json({ success: false, error: 'File content does not match its declared type.' });
        }

        if (!isS3Configured()) {
            return res.status(503).json({ success: false, error: 'Cloud storage not configured on this server.' });
        }

        const { originalname, mimetype, buffer, size } = req.file;
        const ext = path.extname(originalname).replace('.', '') || 'bin';
        const type = mimetype.startsWith('image/') ? 'image'
            : mimetype.startsWith('video/') ? 'video'
            : mimetype.startsWith('font/') || mimetype.includes('font-woff') ? 'font'
            : 'document';

        // Upload to S3 under assets/{userId}/
        const s3Prefix = `assets/${req.user.id}`;
        const { url, key } = await uploadImage(buffer, {
            format: ext,
            prefix: s3Prefix,
            filename: null, // auto-generate unique key
            ttl: 3600,      // 1-hour signed URL
            metadata: { originalName: originalname, userId: req.user.id, mimeType: mimetype },
        });

        const asset = await prisma.asset.create({
            data: {
                userId: req.user.id,
                projectId: req.body.projectId || null,
                sourceApp: 'canvas-studio',
                name: originalname,
                type,
                mimeType: mimetype,
                size,
                s3Key: key,
                url,
            },
        });

        res.json({ success: true, asset });
    } catch (err) {
        console.error('[Assets] Upload error:', err.message);
        res.status(500).json({ success: false, error: 'Upload failed', detail: err.message });
    }
});

// DELETE /assets/:id — remove from S3 + DB
router.delete('/assets/:id', requireAuth, async (req, res) => {
    try {
        const asset = await prisma.asset.findFirst({
            where: { id: req.params.id, userId: req.user.id },
        });
        if (!asset) return res.status(404).json({ success: false, error: 'Asset not found.' });

        // Delete from S3 first (best-effort)
        if (asset.s3Key) {
            try { await deleteImage(asset.s3Key); } catch (e) {
                console.warn('[Assets] S3 delete warning:', e.message);
            }
        }

        await prisma.asset.delete({ where: { id: asset.id } });
        res.json({ success: true });
    } catch (err) {
        console.error('[Assets] Delete error:', err.message);
        res.status(500).json({ success: false, error: 'Delete failed' });
    }
});

// ============================================================================
// PROJECT ROUTES — /api/project/*
// ============================================================================

router.get('/project/list', requireAuth, async (req, res) => {
    try {
        const sourceApp = req.query.sourceApp || APP_ID;
        const projects = await prisma.project.findMany({
            where: { userId: req.user.id, sourceApp },
            orderBy: { updatedAt: 'desc' },
            take: 50,
        });
        res.json({ success: true, projects });
    } catch {
        res.json({ success: true, projects: [] });
    }
});

router.get('/project', requireAuth, async (req, res) => {
    try {
        const projects = await prisma.project.findMany({
            where: { userId: req.user.id },
            orderBy: { updatedAt: 'desc' },
            take: 1,
        });
        res.json({ success: true, project: projects[0] || null });
    } catch {
        res.json({ success: true, project: null });
    }
});

router.get('/project/env', requireAuth, async (req, res) => {
    try {
        // Return user's deploy credentials as available environment context
        const credentials = await prisma.deployCredential.findMany({
            where: { userId: req.user.id },
            select: { provider: true, isValid: true },
        });
        const env = {};
        for (const cred of credentials) {
            env[`${cred.provider}_CONFIGURED`] = cred.isValid !== false ? 'true' : 'false';
        }
        // Include server-side env availability (not the actual keys)
        if (process.env.OPENAI_API_KEY) env.OPENAI_AVAILABLE = 'true';
        if (process.env.ANTHROPIC_API_KEY) env.ANTHROPIC_AVAILABLE = 'true';
        if (process.env.RUNWAYML_API_KEY) env.RUNWAYML_AVAILABLE = 'true';
        if (process.env.FAL_API_KEY) env.FAL_AVAILABLE = 'true';
        if (process.env.STRIPE_SECRET_KEY) env.STRIPE_AVAILABLE = 'true';
        res.json({ success: true, env });
    } catch {
        res.json({ success: true, env: {} });
    }
});

// ============================================================================
// AI HELPER ROUTES — /api/ai/*
// Used by AIPanel.tsx via shared/api.ts
// ============================================================================

router.post('/ai/analyze-errors', requireAuth, async (req, res) => {
    try {
        const { code, error: codeError } = req.body;

        if (!code || !codeError) {
            return res.status(400).json({ success: false, error: 'Code and error required' });
        }

        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const response = await openai.chat.completions.create({
            model: 'gpt-4.1-mini',
            messages: [
                { role: 'system', content: 'You are a code debugging expert. Analyze the error and provide a clear explanation and fix.' },
                { role: 'user', content: `Code:\n\`\`\`\n${code.slice(0, 5000)}\n\`\`\`\n\nError:\n${codeError.slice(0, 2000)}\n\nAnalyze the error and suggest a fix.` },
            ],
            max_tokens: 32768,
        });

        res.json({ success: true, analysis: response.choices[0]?.message?.content || 'No analysis generated.' });
    } catch (error) {
        console.error('[AI] analyze-errors:', error.message);
        res.status(500).json({ success: false, error: 'Analysis failed' });
    }
});

router.post('/ai/generate-tests', requireAuth, async (req, res) => {
    try {
        const { code, language } = req.body;

        if (!code) return res.status(400).json({ success: false, error: 'Code required' });

        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const response = await openai.chat.completions.create({
            model: 'gpt-4.1-mini',
            messages: [
                { role: 'system', content: `You are a testing expert. Generate comprehensive unit tests for the given ${language || 'JavaScript'} code.` },
                { role: 'user', content: `Generate unit tests for this code:\n\`\`\`${language || 'javascript'}\n${code.slice(0, 5000)}\n\`\`\`` },
            ],
            max_tokens: 32768,
        });

        res.json({ success: true, tests: response.choices[0]?.message?.content || '' });
    } catch (error) {
        console.error('[AI] generate-tests:', error.message);
        res.status(500).json({ success: false, error: 'Test generation failed' });
    }
});

router.post('/ai/analyze-refactoring', requireAuth, async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) return res.status(400).json({ success: false, error: 'Code required' });

        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const response = await openai.chat.completions.create({
            model: 'gpt-4.1-mini',
            messages: [
                { role: 'system', content: 'You are a code quality expert. Analyze the code and suggest refactoring improvements.' },
                { role: 'user', content: `Analyze this code for refactoring opportunities:\n\`\`\`\n${code.slice(0, 5000)}\n\`\`\`\n\nProvide specific, actionable refactoring suggestions.` },
            ],
            max_tokens: 32768,
        });

        res.json({ success: true, analysis: response.choices[0]?.message?.content || '' });
    } catch (error) {
        console.error('[AI] analyze-refactoring:', error.message);
        res.status(500).json({ success: false, error: 'Refactoring analysis failed' });
    }
});

// ============================================================================
// AGENT TOOLS — /api/agent/*
// Direct tool execution + history for panel-based tool UI
// Persisted to ToolUsage table via Prisma
// ============================================================================

router.get('/agent/tools', requireAuth, (req, res) => {
    const { category } = req.query;
    const tools = category
        ? getToolsByCategory(category)
        : ALL_TOOLS;
    res.json({
        success: true,
        count: tools.length,
        tools: tools.map(t => ({
            name: t.name,
            description: t.description,
            parameters: t.input_schema || t.parameters,
            dangerous: isDangerousTool(t.name),
        })),
    });
});

router.post('/agent/run-tool', requireAuth, async (req, res) => {
    const startTime = Date.now();
    try {
        const { tool, input, confirmed } = req.body;
        if (!tool || typeof tool !== 'string') {
            return res.status(400).json({ success: false, error: 'Missing required field: tool' });
        }
        if (!hasTool(tool)) {
            return res.status(400).json({ success: false, error: `Unknown tool: ${tool}` });
        }

        // Confirmation gate for dangerous tools
        if (isDangerousTool(tool) && !confirmed) {
            return res.status(200).json({
                success: false,
                requiresConfirmation: true,
                tool,
                message: `"${tool}" is a destructive/sensitive operation. Send confirmed: true to proceed.`,
            });
        }

        const ctx = { userId: req.user.id, sessionId: req.sessionID };
        const result = await executeTool(tool, input || {}, ctx);
        const executionMs = Date.now() - startTime;

        // Parse result
        let parsedResult;
        try { parsedResult = JSON.parse(result.result); } catch { parsedResult = result.result; }
        const success = !(typeof parsedResult === 'object' && parsedResult?.status === 'error');

        // Persist to database (fire-and-forget, don't block response)
        const inputPreview = JSON.stringify(input || {}).slice(0, 2000);
        const outputPreview = (typeof result.result === 'string' ? result.result : JSON.stringify(result.result)).slice(0, 4000);
        prisma.toolUsage.create({
            data: {
                toolName: tool,
                userId: req.user.id,
                command: tool,
                arguments: input || {},
                inputPreview,
                outputPreview,
                latencyMs: executionMs,
                status: success ? 'completed' : 'failed',
                environment: 'canvas',
                tags: [],
            },
        }).catch(err => console.error('[agent/run-tool] DB persist error:', err.message));

        res.json({
            success,
            tool,
            result: parsedResult,
            sideEffects: result.sideEffects,
            executionMs,
            timestamp: Date.now(),
        });
    } catch (error) {
        console.error('[agent/run-tool] Error:', error.message);
        res.status(500).json({ success: false, error: error.message, executionMs: Date.now() - startTime });
    }
});

router.get('/agent/tool-history', requireAuth, async (req, res) => {
    try {
        const { tool, limit = 50, offset = 0 } = req.query;
        const where = { userId: req.user.id };
        if (tool) where.toolName = tool;

        const [items, total] = await Promise.all([
            prisma.toolUsage.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: Number(offset),
                take: Number(limit),
            }),
            prisma.toolUsage.count({ where }),
        ]);

        res.json({
            success: true,
            total,
            items: items.map(h => ({
                id: h.id,
                tool: h.toolName,
                input: h.arguments,
                result: h.outputPreview ? (() => { try { return JSON.parse(h.outputPreview); } catch { return h.outputPreview; } })() : null,
                success: h.status === 'completed',
                executionMs: h.latencyMs,
                timestamp: h.createdAt.getTime(),
            })),
        });
    } catch (error) {
        console.error('[agent/tool-history] Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/agent/tool-history/:id', requireAuth, async (req, res) => {
    try {
        await prisma.toolUsage.deleteMany({
            where: { id: req.params.id, userId: req.user.id },
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/agent/tool-history', requireAuth, async (req, res) => {
    try {
        await prisma.toolUsage.deleteMany({ where: { userId: req.user.id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================================
// DEPLOY ROUTE — /api/deploy (shared/api.ts deployProject)
// ============================================================================

router.post('/deploy', requireAuth, async (req, res) => {
    try {
        const { name, html, code, slug, sourceApp } = req.body;
        const deploySlug = slug || `deploy-${Date.now()}`;
        const url = `https://${deploySlug}.mumtaz.ai`;

        try {
            await prisma.hostedApp.upsert({
                where: { slug: deploySlug },
                update: { code: html || code || '', name, updatedAt: new Date() },
                create: {
                    slug: deploySlug,
                    name: name || 'Deployed App',
                    code: html || code || '',
                    previewUrl: url,
                    sourceApp: sourceApp || APP_ID,
                    userId: req.user.id,
                },
            });
        } catch { /* OK */ }

        res.json({ success: true, url, slug: deploySlug });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Deploy failed' });
    }
});

// ============================================================================
// SANDBOX ROUTES — /api/sandbox/* (ECS Fargate cloud sandbox)
// ============================================================================

router.post('/sandbox/start', requireAuth, async (req, res) => {
    if (!ECS_CLUSTER || !ECS_SUBNETS.length || !ECS_SECURITY_GROUP) {
        return res.status(503).json({ success: false, error: 'Sandbox infrastructure not configured' });
    }
    try {
        const ecs = getEcsClient();
        const result = await ecs.send(new RunTaskCommand({
            cluster: ECS_CLUSTER,
            taskDefinition: ECS_TASK_DEF,
            launchType: 'FARGATE',
            count: 1,
            networkConfiguration: {
                awsvpcConfiguration: {
                    subnets: ECS_SUBNETS,
                    securityGroups: [ECS_SECURITY_GROUP],
                    assignPublicIp: ASSIGN_PUBLIC_IP,
                }
            }
        }));

        const task = result.tasks?.[0];
        if (!task) throw new Error('Failed to launch ECS task');

        const taskArn = task.taskArn;
        const sessionId = taskArn.split('/').pop();

        sandboxSessions.set(taskArn, {
            taskArn,
            sessionId,
            ip: null,
            status: 'starting',
            userId: req.user?.id,
            startedAt: Date.now(),
        });

        // Async: wait for IP and mark ready
        waitForTaskIp(taskArn).then(ip => {
            const sess = sandboxSessions.get(taskArn);
            if (sess) { sess.ip = ip; sess.status = 'running'; }
        }).catch(err => {
            const sess = sandboxSessions.get(taskArn);
            if (sess) { sess.status = 'failed'; sess.error = err.message; }
        });

        res.json({ success: true, sessionId, taskArn, status: 'starting' });
    } catch (error) {
        console.error('[sandbox/start]', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/sandbox/:sessionId/stop', requireAuth, async (req, res) => {
    const { sessionId } = req.params;
    try {
        const ecs = getEcsClient();
        // Find taskArn by sessionId (last segment of ARN)
        let taskArn = null;
        for (const [arn, sess] of sandboxSessions) {
            if (sess.sessionId === sessionId) { taskArn = arn; break; }
        }
        if (!taskArn) {
            // Try to reconstruct ARN pattern (best effort)
            taskArn = sessionId; // sessionId may already be a partial ARN
        }
        await ecs.send(new StopTaskCommand({ cluster: ECS_CLUSTER, task: taskArn, reason: 'User requested stop' }));
        sandboxSessions.delete(taskArn);
        res.json({ success: true, stopped: true });
    } catch (error) {
        console.error('[sandbox/stop]', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/sandbox/:sessionId/status', requireAuth, async (req, res) => {
    const { sessionId } = req.params;
    // Find session
    let session = null;
    for (const sess of sandboxSessions.values()) {
        if (sess.sessionId === sessionId) { session = sess; break; }
    }
    if (!session) {
        return res.json({ success: true, status: 'stopped', sessionId });
    }
    res.json({
        success: true,
        sessionId,
        status: session.status,
        ip: session.ip,
        error: session.error || null,
        startedAt: session.startedAt,
    });
});

router.get('/sandbox/sessions', requireAuth, (req, res) => {
    const userId = req.user?.id;
    const sessions = [...sandboxSessions.values()]
        .filter(s => !userId || s.userId === userId)
        .map(({ taskArn, sessionId, status, ip, startedAt }) => ({ taskArn, sessionId, status, ip, startedAt }));
    res.json({ success: true, sessions });
});

router.post('/sandbox/:sessionId/deploy', requireAuth, async (req, res) => {
    const { sessionId } = req.params;
    let session = null;
    for (const sess of sandboxSessions.values()) {
        if (sess.sessionId === sessionId) { session = sess; break; }
    }
    if (!session || !session.ip) {
        return res.status(404).json({ success: false, error: 'Sandbox session not found or not running' });
    }

    try {
        // Deploy sandbox output to hosted apps via the hosting system
        const slug = `sandbox-${sessionId.slice(0, 8)}-${Date.now()}`;
        const previewUrl = `https://${slug}.mumtaz.ai`;

        // Fetch the built output from the sandbox container
        let sandboxCode = '';
        try {
            const buildResp = await new Promise((resolve, reject) => {
                const req = http.get(`http://${session.ip}:3000/dev/preview`, (resp) => {
                    let data = '';
                    resp.on('data', chunk => data += chunk);
                    resp.on('end', () => resolve(data));
                });
                req.on('error', reject);
                req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')); });
            });
            sandboxCode = buildResp;
        } catch (fetchErr) {
            console.warn('[Sandbox] Could not fetch preview HTML, using fallback redirect:', fetchErr.message);
            sandboxCode = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=http://${session.ip}:3000/dev/preview"></head><body>Redirecting...</body></html>`;
        }

        // Persist to hosted apps DB
        await prisma.hostedApp.upsert({
            where: { slug },
            update: { code: sandboxCode, updatedAt: new Date() },
            create: {
                slug,
                name: `Sandbox Deploy ${sessionId.slice(0, 8)}`,
                code: sandboxCode,
                previewUrl,
                sourceApp: APP_ID,
                userId: req.user.id,
            },
        });

        res.json({ success: true, url: previewUrl, liveUrl: `http://${session.ip}:3000/dev/preview`, sessionId, slug });
    } catch (error) {
        console.error('[Sandbox] Deploy error:', error.message);
        // Fallback: return the direct sandbox preview URL
        res.json({ success: true, url: `http://${session.ip}:3000/dev/preview`, sessionId, note: 'Live preview (not persisted)' });
    }
});

// Sandbox HTTP proxy routes — forward all requests to the sandbox container
// Using router.use() instead of router.all() to avoid path-to-regexp v8 wildcard restriction
router.use('/sandbox/:sessionId/proxy', requireAuth, async (req, res) => {
    const { sessionId } = req.params;
    let session = null;
    for (const sess of sandboxSessions.values()) {
        if (sess.sessionId === sessionId) { session = sess; break; }
    }
    if (!session || !session.ip) {
        return res.status(503).json({ success: false, error: 'Sandbox not ready or not found' });
    }

    // req.path contains everything after /proxy (e.g. "/index.html" or "/api/data")
    const proxyPath = req.path || '/';
    const targetUrl = `http://${session.ip}:3000${proxyPath}`;

    // Forward request body
    const bodyStr = req.body && Object.keys(req.body).length ? JSON.stringify(req.body) : null;
    const options = {
        method: req.method,
        headers: {
            'Content-Type': 'application/json',
            ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
        },
        timeout: 30000,
    };

    const url = new URL(targetUrl);
    options.hostname = url.hostname;
    options.port = url.port || 3000;
    options.path = url.pathname + url.search;

    const proxyReq = http.request(options, (proxyRes) => {
        res.status(proxyRes.statusCode || 200);
        Object.entries(proxyRes.headers).forEach(([k, v]) => {
            if (k !== 'transfer-encoding') res.setHeader(k, v);
        });
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
        console.error('[sandbox proxy]', err.message);
        if (!res.headersSent) {
            res.status(502).json({ success: false, error: 'Sandbox proxy error: ' + err.message });
        }
    });

    if (bodyStr) proxyReq.write(bodyStr);
    proxyReq.end();
});

export default router;
