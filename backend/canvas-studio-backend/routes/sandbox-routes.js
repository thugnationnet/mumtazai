/**
 * SANDBOX ROUTES - ECS Fargate Container Lifecycle Management
 *
 * Manages cloud sandbox containers for live code execution:
 * - Start/stop sandbox containers (ECS tasks)
 * - Get sandbox status and connection info
 * - Proxy requests to running containers
 * - Auto-cleanup idle containers
 *
 * Each sandbox = 1 ECS Fargate task running mumtazai-sandbox image
 */

import express from 'express';
import {
  ECSClient,
  RunTaskCommand,
  StopTaskCommand,
  DescribeTasksCommand,
  ListTasksCommand,
} from '@aws-sdk/client-ecs';
import { requireAuth } from '../lib/auth-middleware.js';
import { requireAnyCanvasPlan } from '../lib/plan-middleware.js';

const router = express.Router();

// ============================================
// CONFIG
// ============================================

const ECS_CONFIG = {
  cluster:
    process.env.ECS_CLUSTER_ARN ||
    'arn:aws:ecs:ap-southeast-1:863394984321:cluster/homely-frog-53zij7',
  taskDefinition: process.env.ECS_TASK_DEFINITION || 'mumtazai-task:1',
  subnets: (
    process.env.ECS_SUBNETS ||
    'subnet-0198823fddf3fe34e,subnet-08ea233b8ee51f91c,subnet-040f3fae44d5ebf54'
  ).split(','),
  securityGroups: (
    process.env.ECS_SECURITY_GROUPS || 'sg-09b790a45e498d160'
  ).split(','),
  containerName: process.env.ECS_CONTAINER_NAME || 'mumtazai',
  containerPort: 3000,
  region: process.env.AWS_REGION || 'ap-southeast-1',
};

const ecsClient = new ECSClient({ region: ECS_CONFIG.region });

// In-memory sandbox registry: sessionId -> { taskArn, publicIp, status, createdAt, userId }
const sandboxRegistry = new Map();

// Auto-cleanup interval (check every 5 minutes)
const SANDBOX_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes idle timeout
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

setInterval(async () => {
  const now = Date.now();
  for (const [sessionId, sandbox] of sandboxRegistry.entries()) {
    if (now - sandbox.lastActivity > SANDBOX_TIMEOUT_MS) {
      console.log(`[Sandbox] Auto-stopping idle sandbox: ${sessionId}`);
      try {
        await stopSandboxTask(sandbox.taskArn);
      } catch (err) {
        console.error(
          `[Sandbox] Failed to auto-stop ${sessionId}:`,
          err.message
        );
      }
      sandboxRegistry.delete(sessionId);
    }
  }
}, CLEANUP_INTERVAL_MS);

// ============================================
// HELPERS
// ============================================

/**
 * Generate a unique session ID
 */
function generateSessionId() {
  return `sandbox-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Run a new ECS Fargate task
 */
async function startSandboxTask(sessionId) {
  const command = new RunTaskCommand({
    cluster: ECS_CONFIG.cluster,
    taskDefinition: ECS_CONFIG.taskDefinition,
    launchType: 'FARGATE',
    count: 1,
    networkConfiguration: {
      awsvpcConfiguration: {
        subnets: ECS_CONFIG.subnets,
        securityGroups: ECS_CONFIG.securityGroups,
        assignPublicIp: 'ENABLED',
      },
    },
    overrides: {
      containerOverrides: [
        {
          name: ECS_CONFIG.containerName,
          environment: [{ name: 'SANDBOX_SESSION_ID', value: sessionId }],
        },
      ],
    },
    tags: [
      { key: 'sandbox-session', value: sessionId },
      { key: 'app', value: 'mumtazai' },
    ],
  });

  const result = await ecsClient.send(command);
  const task = result.tasks?.[0];

  if (!task) {
    const failure = result.failures?.[0];
    throw new Error(
      `Failed to start task: ${failure?.reason || 'Unknown error'}`
    );
  }

  return {
    taskArn: task.taskArn,
    status: task.lastStatus,
    desiredStatus: task.desiredStatus,
  };
}

/**
 * Stop an ECS task
 */
async function stopSandboxTask(taskArn) {
  const command = new StopTaskCommand({
    cluster: ECS_CONFIG.cluster,
    task: taskArn,
    reason: 'Sandbox session ended',
  });

  return ecsClient.send(command);
}

/**
 * Describe task(s) to get status and network info
 */
async function describeTasks(taskArns) {
  if (!taskArns.length) return [];

  const command = new DescribeTasksCommand({
    cluster: ECS_CONFIG.cluster,
    tasks: taskArns,
  });

  const result = await ecsClient.send(command);
  return result.tasks || [];
}

/**
 * Extract public IP from a task's network attachments
 */
function getPublicIp(task) {
  const eni = task.attachments?.find(
    (a) => a.type === 'ElasticNetworkInterface'
  );
  if (!eni) return null;

  const detail = eni.details?.find((d) => d.name === 'networkInterfaceId');
  // Public IP is in the container's networkInterfaces
  for (const container of task.containers || []) {
    for (const ni of container.networkInterfaces || []) {
      if (ni.publicIpv4Address) return ni.publicIpv4Address;
    }
  }
  return null;
}

/**
 * Wait for task to reach RUNNING state with public IP
 */
async function waitForTask(taskArn, maxWaitMs = 120000) {
  const startTime = Date.now();
  const pollInterval = 3000;

  while (Date.now() - startTime < maxWaitMs) {
    const tasks = await describeTasks([taskArn]);
    const task = tasks[0];

    if (!task) throw new Error('Task not found');

    if (task.lastStatus === 'STOPPED') {
      const reason =
        task.stoppedReason || task.containers?.[0]?.reason || 'Unknown';
      throw new Error(`Task stopped: ${reason}`);
    }

    if (task.lastStatus === 'RUNNING') {
      const publicIp = getPublicIp(task);
      if (publicIp) {
        return { publicIp, task };
      }
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error('Timeout waiting for sandbox to start');
}

// ============================================
// ROUTES
// ============================================

/**
 * POST /api/sandbox/start
 * Start a new sandbox container
 *
 * Body: { userId?, projectId? }
 * Returns: { sessionId, status }
 */
router.post('/start', requireAuth, requireAnyCanvasPlan, async (req, res) => {
  try {
    const { userId, projectId } = req.body;
    const sessionId = generateSessionId();

    console.log(`[Sandbox] Starting new sandbox: ${sessionId}`);

    // Start ECS task
    const { taskArn, status } = await startSandboxTask(sessionId);

    // Register in memory
    sandboxRegistry.set(sessionId, {
      taskArn,
      userId: userId || 'anonymous',
      projectId: projectId || null,
      status: 'PROVISIONING',
      publicIp: null,
      createdAt: Date.now(),
      lastActivity: Date.now(),
    });

    // Return immediately — client will poll /status
    res.json({
      success: true,
      message: 'Sandbox is starting',
      data: {
        sessionId,
        status: 'PROVISIONING',
        taskArn,
      },
    });

    // Background: wait for running + update registry
    waitForTask(taskArn)
      .then(({ publicIp }) => {
        const sandbox = sandboxRegistry.get(sessionId);
        if (sandbox) {
          sandbox.status = 'RUNNING';
          sandbox.publicIp = publicIp;
          console.log(
            `[Sandbox] ${sessionId} is RUNNING at ${publicIp}:${ECS_CONFIG.containerPort}`
          );
        }
      })
      .catch((err) => {
        const sandbox = sandboxRegistry.get(sessionId);
        if (sandbox) {
          sandbox.status = 'FAILED';
          sandbox.error = err.message;
          console.error(`[Sandbox] ${sessionId} failed:`, err.message);
        }
      });
  } catch (error) {
    console.error('[Sandbox] Start error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start sandbox',
      error: error.message,
    });
  }
});

/**
 * GET /api/sandbox/status/:sessionId
 * Get sandbox status and connection URL
 */
router.get('/status/:sessionId', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const sandbox = sandboxRegistry.get(sessionId);

    if (!sandbox) {
      return res.status(404).json({
        success: false,
        message: 'Sandbox not found',
      });
    }

    // Update last activity
    sandbox.lastActivity = Date.now();

    // If we still don't have IP, try to fetch from ECS
    if (sandbox.status === 'PROVISIONING' && sandbox.taskArn) {
      try {
        const tasks = await describeTasks([sandbox.taskArn]);
        const task = tasks[0];
        if (task) {
          if (task.lastStatus === 'RUNNING') {
            const publicIp = getPublicIp(task);
            if (publicIp) {
              sandbox.status = 'RUNNING';
              sandbox.publicIp = publicIp;
            }
          } else if (task.lastStatus === 'STOPPED') {
            sandbox.status = 'STOPPED';
            sandbox.error = task.stoppedReason || 'Task stopped';
          } else {
            sandbox.status = task.lastStatus; // PENDING, etc.
          }
        }
      } catch (err) {
        console.error(
          `[Sandbox] Status check error for ${sessionId}:`,
          err.message
        );
      }
    }

    const data = {
      sessionId,
      status: sandbox.status,
      createdAt: new Date(sandbox.createdAt).toISOString(),
      uptime: Math.floor((Date.now() - sandbox.createdAt) / 1000),
    };

    if (sandbox.status === 'RUNNING' && sandbox.publicIp) {
      data.url = `http://${sandbox.publicIp}:${ECS_CONFIG.containerPort}`;
      data.publicIp = sandbox.publicIp;
    }

    if (sandbox.error) {
      data.error = sandbox.error;
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('[Sandbox] Status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sandbox status',
    });
  }
});

/**
 * POST /api/sandbox/stop/:sessionId
 * Stop a sandbox container
 */
router.post('/stop/:sessionId', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const sandbox = sandboxRegistry.get(sessionId);

    if (!sandbox) {
      return res.status(404).json({
        success: false,
        message: 'Sandbox not found',
      });
    }

    if (sandbox.taskArn) {
      await stopSandboxTask(sandbox.taskArn);
    }

    sandbox.status = 'STOPPED';
    sandboxRegistry.delete(sessionId);

    console.log(`[Sandbox] Stopped: ${sessionId}`);

    res.json({
      success: true,
      message: 'Sandbox stopped',
      data: { sessionId, status: 'STOPPED' },
    });
  } catch (error) {
    console.error('[Sandbox] Stop error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop sandbox',
    });
  }
});

/**
 * GET /api/sandbox/list
 * List all active sandboxes (admin)
 */
router.get('/list', requireAuth, async (req, res) => {
  try {
    const sandboxes = [];

    for (const [sessionId, sandbox] of sandboxRegistry.entries()) {
      sandboxes.push({
        sessionId,
        status: sandbox.status,
        userId: sandbox.userId,
        projectId: sandbox.projectId,
        publicIp: sandbox.publicIp,
        url: sandbox.publicIp
          ? `http://${sandbox.publicIp}:${ECS_CONFIG.containerPort}`
          : null,
        createdAt: new Date(sandbox.createdAt).toISOString(),
        uptime: Math.floor((Date.now() - sandbox.createdAt) / 1000),
        lastActivity: new Date(sandbox.lastActivity).toISOString(),
      });
    }

    res.json({
      success: true,
      data: {
        count: sandboxes.length,
        sandboxes,
      },
    });
  } catch (error) {
    console.error('[Sandbox] List error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list sandboxes',
    });
  }
});

/**
 * POST /api/sandbox/proxy/:sessionId/{*path}
 * Proxy a request to the running sandbox container
 *
 * Example: POST /api/sandbox/proxy/sandbox-123/files/write
 *   -> proxied to http://<container-ip>:3000/files/write
 */
router.all('/proxy/:sessionId/{*path}', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const sandbox = sandboxRegistry.get(sessionId);

    if (!sandbox) {
      return res.status(404).json({
        success: false,
        message: 'Sandbox not found',
      });
    }

    if (sandbox.status !== 'RUNNING' || !sandbox.publicIp) {
      return res.status(503).json({
        success: false,
        message: `Sandbox is not ready (status: ${sandbox.status})`,
      });
    }

    // Update activity
    sandbox.lastActivity = Date.now();

    // Build target URL — strip /proxy/:sessionId from path
    const targetPath = req.params.path || '';
    const targetUrl = `http://${sandbox.publicIp}:${ECS_CONFIG.containerPort}/${targetPath}`;

    // Forward request to sandbox container
    const fetchOptions = {
      method: req.method,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
      },
    };

    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data = await response.json();
      res.status(response.status).json(data);
    } else {
      const text = await response.text();
      res.status(response.status).type(contentType).send(text);
    }
  } catch (error) {
    console.error('[Sandbox] Proxy error:', error);
    res.status(502).json({
      success: false,
      message: 'Failed to reach sandbox container',
      error: error.message,
    });
  }
});

/**
 * POST /api/sandbox/exec/:sessionId
 * Execute a command in the sandbox
 *
 * Body: { command: "npm install express" }
 */
router.post('/exec/:sessionId', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { command } = req.body;
    const sandbox = sandboxRegistry.get(sessionId);

    if (!sandbox || sandbox.status !== 'RUNNING' || !sandbox.publicIp) {
      return res.status(404).json({
        success: false,
        message: 'Sandbox not found or not running',
      });
    }

    sandbox.lastActivity = Date.now();

    const targetUrl = `http://${sandbox.publicIp}:${ECS_CONFIG.containerPort}/exec`;

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command }),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('[Sandbox] Exec error:', error);
    res.status(502).json({
      success: false,
      message: 'Failed to execute command in sandbox',
      error: error.message,
    });
  }
});

/**
 * GET /api/sandbox/preview/:sessionId
 * Get preview URL for sandbox's running dev server
 */
router.get('/preview/:sessionId', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const sandbox = sandboxRegistry.get(sessionId);

    if (!sandbox || sandbox.status !== 'RUNNING' || !sandbox.publicIp) {
      return res.status(404).json({
        success: false,
        message: 'Sandbox not found or not running',
      });
    }

    sandbox.lastActivity = Date.now();

    // Fetch preview info from sandbox
    const targetUrl = `http://${sandbox.publicIp}:${ECS_CONFIG.containerPort}/preview`;
    const response = await fetch(targetUrl);
    const data = await response.json();

    // Replace localhost references with public IP
    if (data.url) {
      data.url = data.url.replace('localhost', sandbox.publicIp);
    }
    data.sandboxUrl = `http://${sandbox.publicIp}:${ECS_CONFIG.containerPort}`;

    res.json({ success: true, data });
  } catch (error) {
    console.error('[Sandbox] Preview error:', error);
    res.status(502).json({
      success: false,
      message: 'Failed to get preview',
      error: error.message,
    });
  }
});

export default router;
