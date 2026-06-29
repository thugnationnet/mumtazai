/**
 * MARKETPLACE ROUTES - API for Plugin Marketplace
 * Tools, plugins, reviews, and monetization
 */

import express from 'express';
import { prisma } from '../lib/prisma.js';
import pluginSDK from '../services/plugin-sdk.js';
import sandboxLoader from '../services/sandbox-loader.js';
import permissionSystem from '../services/permission-system.js';

const router = express.Router();

// ============================================================================
// MARKETPLACE STATUS
// ============================================================================

router.get('/status', async (req, res) => {
  try {
    const [toolCount, reviewCount, transactionCount, developerCount] = await Promise.all([
      prisma.marketplaceTool.count(),
      prisma.marketplaceReview.count(),
      prisma.marketplaceTransaction.count(),
      prisma.marketplaceDeveloper.count(),
    ]);

    res.json({
      success: true,
      status: 'operational',
      version: '1.0.0',
      services: {
        pluginSDK: pluginSDK.getSDKInfo(),
        sandboxLoader: sandboxLoader.getStatus(),
        permissionSystem: permissionSystem.getStatus(),
      },
      stats: {
        tools: toolCount,
        reviews: reviewCount,
        transactions: transactionCount,
        developers: developerCount,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// PLUGIN SDK ENDPOINTS
// ============================================================================

// Get SDK info
router.get('/sdk/info', (req, res) => {
  res.json({
    success: true,
    sdk: pluginSDK.getSDKInfo(),
  });
});

// Get available permissions
router.get('/sdk/permissions', (req, res) => {
  res.json({
    success: true,
    permissions: pluginSDK.getAvailablePermissions(),
  });
});

// Create plugin template
router.post('/sdk/template', (req, res) => {
  try {
    const { name, description, permissions = [] } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }

    const template = pluginSDK.createPluginTemplate(name, description || '', permissions);
    
    res.json({
      success: true,
      template,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Validate plugin manifest
router.post('/sdk/validate', (req, res) => {
  try {
    const { manifest } = req.body;
    
    if (!manifest) {
      return res.status(400).json({ success: false, error: 'Manifest is required' });
    }

    const validation = pluginSDK.validateManifest(manifest);
    
    res.json({
      success: true,
      validation,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Register plugin
router.post('/sdk/register', async (req, res) => {
  try {
    const { manifest, code } = req.body;
    
    if (!manifest || !code) {
      return res.status(400).json({ 
        success: false, 
        error: 'Manifest and code are required', 
      });
    }

    const result = await pluginSDK.registerPlugin(manifest, code);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      pluginId: result.pluginId,
      warnings: result.warnings,
      riskLevel: result.riskLevel,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// List registered plugins
router.get('/sdk/plugins', (req, res) => {
  try {
    const { enabled } = req.query;
    const filter = enabled !== undefined ? { enabled: enabled === 'true' } : {};
    
    res.json({
      success: true,
      plugins: pluginSDK.listPlugins(filter),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get plugin info
router.get('/sdk/plugins/:pluginId', (req, res) => {
  try {
    const plugin = pluginSDK.getPlugin(req.params.pluginId);
    
    if (!plugin) {
      return res.status(404).json({ success: false, error: 'Plugin not found' });
    }

    res.json({
      success: true,
      plugin,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Unregister plugin
router.delete('/sdk/plugins/:pluginId', (req, res) => {
  try {
    const result = pluginSDK.unregisterPlugin(req.params.pluginId);
    
    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// SANDBOX ENDPOINTS
// ============================================================================

// Get sandbox status
router.get('/sandbox/status', (req, res) => {
  res.json({
    success: true,
    status: sandboxLoader.getStatus(),
  });
});

// Load plugin into sandbox
router.post('/sandbox/load', async (req, res) => {
  try {
    const { pluginId, code, permissions = [], config = {} } = req.body;
    
    if (!pluginId || !code) {
      return res.status(400).json({ 
        success: false, 
        error: 'Plugin ID and code are required', 
      });
    }

    const result = await sandboxLoader.loadPlugin(pluginId, code, permissions, config);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      pluginId: result.pluginId,
      sandboxType: result.sandboxType,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Execute plugin function
router.post('/sandbox/execute', async (req, res) => {
  try {
    const { pluginId, functionName, input = {} } = req.body;
    
    if (!pluginId || !functionName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Plugin ID and function name are required', 
      });
    }

    const result = await sandboxLoader.executePlugin(pluginId, functionName, input);
    
    res.json({
      success: result.success,
      result: result.result,
      error: result.error,
      duration: result.duration,
      executionCount: result.executionCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Unload plugin from sandbox
router.post('/sandbox/unload', (req, res) => {
  try {
    const { pluginId } = req.body;
    
    if (!pluginId) {
      return res.status(400).json({ success: false, error: 'Plugin ID is required' });
    }

    const result = sandboxLoader.unloadPlugin(pluginId);
    
    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get sandbox stats
router.get('/sandbox/stats', (req, res) => {
  try {
    const { pluginId } = req.query;
    
    res.json({
      success: true,
      stats: sandboxLoader.getStats(pluginId || undefined),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// PERMISSION ENDPOINTS
// ============================================================================

// Get available permissions
router.get('/permissions/available', (req, res) => {
  res.json({
    success: true,
    permissions: permissionSystem.getAvailablePermissions(),
    roles: permissionSystem.getRoles(),
  });
});

// Grant permission
router.post('/permissions/grant', (req, res) => {
  try {
    const { entityId, entityType, permission, grantedBy, options = {} } = req.body;
    
    if (!entityId || !permission) {
      return res.status(400).json({ 
        success: false, 
        error: 'Entity ID and permission are required', 
      });
    }

    const result = permissionSystem.grantPermission(
      entityId, 
      entityType || 'plugin',
      permission, 
      grantedBy || 'api',
      options,
    );
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Revoke permission
router.post('/permissions/revoke', (req, res) => {
  try {
    const { entityId, permission, revokedBy, reason } = req.body;
    
    if (!entityId || !permission) {
      return res.status(400).json({ 
        success: false, 
        error: 'Entity ID and permission are required', 
      });
    }

    const result = permissionSystem.revokePermission(
      entityId,
      permission,
      revokedBy || 'api',
      reason || '',
    );
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check permission
router.get('/permissions/check', (req, res) => {
  try {
    const { entityId, permission } = req.query;
    
    if (!entityId || !permission) {
      return res.status(400).json({ 
        success: false, 
        error: 'Entity ID and permission are required', 
      });
    }

    const result = permissionSystem.hasPermission(entityId, permission);
    
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get entity permissions
router.get('/permissions/entity/:entityId', (req, res) => {
  try {
    const permissions = permissionSystem.getPermissions(req.params.entityId);
    const usage = permissionSystem.getUsageStats(req.params.entityId);
    
    res.json({
      success: true,
      permissions,
      usage,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Initialize role permissions
router.post('/permissions/init-role', (req, res) => {
  try {
    const { entityId, role } = req.body;
    
    if (!entityId || !role) {
      return res.status(400).json({ 
        success: false, 
        error: 'Entity ID and role are required', 
      });
    }

    const result = permissionSystem.initializeForRole(entityId, role);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Request permissions
router.post('/permissions/request', (req, res) => {
  try {
    const { entityId, entityType, permissions, reason } = req.body;
    
    if (!entityId || !permissions || permissions.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Entity ID and permissions are required', 
      });
    }

    const result = permissionSystem.createPermissionRequest(
      entityId,
      entityType || 'plugin',
      permissions,
      reason || '',
    );
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get audit log
router.get('/permissions/audit', (req, res) => {
  try {
    const { entityId, action, since, limit } = req.query;
    
    const logs = permissionSystem.getAuditLog({
      entityId,
      action,
      since,
      limit: limit ? parseInt(limit) : 100,
    });
    
    res.json({
      success: true,
      logs,
      total: logs.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// TOOLS MARKETPLACE
// ============================================================================

// List tools
router.get('/tools', async (req, res) => {
  try {
    const { category, search, sort = 'downloads', limit = 20, offset = 0 } = req.query;

    const where = {};
    if (category) {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderByMap = {
      downloads: { downloads: 'desc' },
      rating: { averageRating: 'desc' },
      newest: { createdAt: 'desc' },
    };

    const take = parseInt(limit);
    const skip = parseInt(offset);

    const [toolList, total] = await Promise.all([
      prisma.marketplaceTool.findMany({
        where,
        orderBy: orderByMap[sort] || { downloads: 'desc' },
        skip,
        take,
      }),
      prisma.marketplaceTool.count({ where }),
    ]);

    res.json({
      success: true,
      tools: toolList,
      pagination: {
        total,
        limit: take,
        offset: skip,
        hasMore: skip + toolList.length < total,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create tool
router.post('/tools', async (req, res) => {
  try {
    const {
      name, description, category, tags = [],
      icon, code, permissions = [], pricing = { type: 'free' },
      developerId,
    } = req.body;

    if (!name || !description || !code) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name, description, and code are required', 
      });
    }

    const tool = await prisma.marketplaceTool.create({
      data: {
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        description,
        category: category || 'utility',
        tags,
        icon: icon || '🔧',
        code,
        permissions,
        pricing,
        developerId: developerId || 'anonymous',
      },
    });

    res.status(201).json({
      success: true,
      tool,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get tool
router.get('/tools/:toolId', async (req, res) => {
  try {
    const [tool, toolReviews] = await Promise.all([
      prisma.marketplaceTool.findUnique({ where: { id: req.params.toolId } }),
      prisma.marketplaceReview.findMany({
        where: { toolId: req.params.toolId },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    if (!tool) {
      return res.status(404).json({ success: false, error: 'Tool not found' });
    }

    res.json({
      success: true,
      tool,
      reviews: toolReviews,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update tool
router.patch('/tools/:toolId', async (req, res) => {
  try {
    const existing = await prisma.marketplaceTool.findUnique({ where: { id: req.params.toolId } });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Tool not found' });
    }

    const allowedUpdates = ['name', 'description', 'category', 'tags', 'icon', 'code', 'permissions', 'pricing', 'published'];
    const data = {};
    for (const [key, value] of Object.entries(req.body)) {
      if (allowedUpdates.includes(key)) {
        data[key] = value;
      }
    }

    const tool = await prisma.marketplaceTool.update({
      where: { id: req.params.toolId },
      data,
    });

    res.json({
      success: true,
      tool,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete tool
router.delete('/tools/:toolId', async (req, res) => {
  try {
    const existing = await prisma.marketplaceTool.findUnique({ where: { id: req.params.toolId } });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Tool not found' });
    }

    await prisma.marketplaceTool.delete({ where: { id: req.params.toolId } });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Install tool (increment downloads)
router.post('/tools/:toolId/install', async (req, res) => {
  try {
    const existing = await prisma.marketplaceTool.findUnique({ where: { id: req.params.toolId } });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Tool not found' });
    }

    const tool = await prisma.marketplaceTool.update({
      where: { id: req.params.toolId },
      data: { downloads: { increment: 1 } },
    });

    res.json({
      success: true,
      downloads: tool.downloads,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Execute tool
router.post('/tools/:toolId/execute', async (req, res) => {
  try {
    const tool = await prisma.marketplaceTool.findUnique({ where: { id: req.params.toolId } });

    if (!tool) {
      return res.status(404).json({ success: false, error: 'Tool not found' });
    }

    // Load into sandbox and execute
    await sandboxLoader.loadPlugin(tool.id, tool.code, tool.permissions, {});
    const result = await sandboxLoader.executePlugin(tool.id, 'execute', req.body.input || {});

    // Increment uses
    await prisma.marketplaceTool.update({
      where: { id: req.params.toolId },
      data: { uses: { increment: 1 } },
    });

    res.json({
      success: result.success,
      result: result.result,
      error: result.error,
      duration: result.duration,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// REVIEWS
// ============================================================================

// Get reviews for tool
router.get('/reviews', async (req, res) => {
  try {
    const { toolId, userId, sort = 'newest', limit = 20, offset = 0 } = req.query;

    const where = {};
    if (toolId) where.toolId = toolId;
    if (userId) where.userId = userId;

    const orderByMap = {
      newest: { createdAt: 'desc' },
      rating: { rating: 'desc' },
      helpful: { helpfulCount: 'desc' },
    };

    const take = parseInt(limit);
    const skip = parseInt(offset);

    const [reviewList, total] = await Promise.all([
      prisma.marketplaceReview.findMany({
        where,
        orderBy: orderByMap[sort] || { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.marketplaceReview.count({ where }),
    ]);

    res.json({
      success: true,
      reviews: reviewList,
      pagination: { total, limit: take, offset: skip },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create review
router.post('/reviews', async (req, res) => {
  try {
    const { toolId, userId, title, content, rating } = req.body;

    if (!toolId || !userId || !rating) {
      return res.status(400).json({ 
        success: false, 
        error: 'Tool ID, user ID, and rating are required', 
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'Rating must be 1-5' });
    }

    const tool = await prisma.marketplaceTool.findUnique({ where: { id: toolId } });
    if (!tool) {
      return res.status(404).json({ success: false, error: 'Tool not found' });
    }

    const review = await prisma.marketplaceReview.create({
      data: {
        toolId,
        userId,
        title: title || '',
        content: content || '',
        rating,
      },
    });

    // Recalculate tool average rating
    const agg = await prisma.marketplaceReview.aggregate({
      where: { toolId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.marketplaceTool.update({
      where: { id: toolId },
      data: {
        averageRating: agg._avg.rating || 0,
        reviewCount: agg._count.rating,
      },
    });

    res.status(201).json({
      success: true,
      review,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark review helpful
router.post('/reviews/:reviewId/helpful', async (req, res) => {
  try {
    const existing = await prisma.marketplaceReview.findUnique({ where: { id: req.params.reviewId } });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    const review = await prisma.marketplaceReview.update({
      where: { id: req.params.reviewId },
      data: { helpfulCount: { increment: 1 } },
    });

    res.json({
      success: true,
      helpfulCount: review.helpfulCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// DEVELOPER / MONETIZATION
// ============================================================================

// Get developer profile
router.get('/developers/:developerId', async (req, res) => {
  try {
    const developer = await prisma.marketplaceDeveloper.upsert({
      where: { id: req.params.developerId },
      update: {},
      create: {
        id: req.params.developerId,
        name: 'Developer',
      },
      include: {
        tools: {
          select: { id: true, name: true, downloads: true, averageRating: true },
        },
      },
    });

    const toolsSummary = developer.tools.map(t => ({
      id: t.id,
      name: t.name,
      downloads: t.downloads,
      rating: t.averageRating,
    }));

    const totalDownloads = developer.tools.reduce((sum, t) => sum + t.downloads, 0);

    res.json({
      success: true,
      developer: {
        ...developer,
        tools: toolsSummary,
        totalDownloads,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get developer earnings
router.get('/developers/:developerId/earnings', async (req, res) => {
  try {
    const [totalResult, pendingResult, recentTransactions] = await Promise.all([
      prisma.marketplaceTransaction.aggregate({
        where: { developerId: req.params.developerId },
        _sum: { developerShare: true },
      }),
      prisma.marketplaceTransaction.aggregate({
        where: { developerId: req.params.developerId, status: 'pending' },
        _sum: { developerShare: true },
      }),
      prisma.marketplaceTransaction.findMany({
        where: { developerId: req.params.developerId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    const totalEarnings = totalResult._sum.developerShare || 0;
    const pendingEarnings = pendingResult._sum.developerShare || 0;

    res.json({
      success: true,
      earnings: {
        total: totalEarnings,
        pending: pendingEarnings,
        paid: totalEarnings - pendingEarnings,
      },
      transactions: recentTransactions,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create transaction
router.post('/transactions', async (req, res) => {
  try {
    const { toolId, userId, amount, type = 'purchase' } = req.body;

    const tool = await prisma.marketplaceTool.findUnique({ where: { id: toolId } });
    if (!tool) {
      return res.status(404).json({ success: false, error: 'Tool not found' });
    }

    const platformFee = amount * 0.2;
    const developerShare = amount * 0.8;

    const transaction = await prisma.marketplaceTransaction.create({
      data: {
        toolId,
        toolName: tool.name,
        userId,
        developerId: tool.developerId,
        amount,
        platformFee,
        developerShare,
        type,
        status: 'completed',
      },
    });

    res.status(201).json({
      success: true,
      transaction,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get categories
router.get('/categories', (req, res) => {
  res.json({
    success: true,
    categories: [
      { id: 'data-processing', name: 'Data Processing', icon: '📊' },
      { id: 'integration', name: 'Integrations', icon: '🔗' },
      { id: 'analytics', name: 'Analytics', icon: '📈' },
      { id: 'automation', name: 'Automation', icon: '⚡' },
      { id: 'utility', name: 'Utilities', icon: '🛠️' },
      { id: 'ai', name: 'AI & ML', icon: '🤖' },
      { id: 'custom', name: 'Custom', icon: '✨' },
    ],
  });
});

export default router;
