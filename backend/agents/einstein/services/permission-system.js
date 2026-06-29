/**
 * PERMISSION SYSTEM - Access control for plugins and tools
 * Handles permission grants, checks, and auditing
 */

import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';

// Permission categories and their scopes
const PERMISSION_CATEGORIES = {
  data: {
    name: 'Data Access',
    description: 'Access to user and application data',
    scopes: {
      read: { description: 'Read data', risk: 'low' },
      write: { description: 'Create and modify data', risk: 'medium' },
      delete: { description: 'Delete data', risk: 'high' },
    },
  },
  network: {
    name: 'Network Access',
    description: 'Internet and network connectivity',
    scopes: {
      fetch: { description: 'Make HTTP requests', risk: 'medium' },
      websocket: { description: 'WebSocket connections', risk: 'medium' },
    },
  },
  ai: {
    name: 'AI Features',
    description: 'Access to AI capabilities',
    scopes: {
      chat: { description: 'Chat completions', risk: 'low' },
      embeddings: { description: 'Generate embeddings', risk: 'low' },
      images: { description: 'Image generation', risk: 'medium' },
      voice: { description: 'Voice synthesis/recognition', risk: 'medium' },
    },
  },
  storage: {
    name: 'Storage',
    description: 'Data storage services',
    scopes: {
      local: { description: 'Local storage', risk: 'low' },
      cloud: { description: 'Cloud storage (S3, etc.)', risk: 'medium' },
      database: { description: 'Direct database access', risk: 'high' },
    },
  },
  system: {
    name: 'System',
    description: 'System-level features',
    scopes: {
      notifications: { description: 'Send notifications', risk: 'low' },
      clipboard: { description: 'Clipboard access', risk: 'medium' },
      files: { description: 'File system access', risk: 'high' },
    },
  },
  tools: {
    name: 'Tools',
    description: 'Tool and plugin interaction',
    scopes: {
      execute: { description: 'Execute other tools', risk: 'medium' },
      compose: { description: 'Compose tool chains', risk: 'low' },
      install: { description: 'Install plugins', risk: 'high' },
    },
  },
  billing: {
    name: 'Billing',
    description: 'Financial operations',
    scopes: {
      read: { description: 'View billing info', risk: 'medium' },
      charge: { description: 'Create charges', risk: 'high' },
    },
  },
};

// Role definitions
const ROLES = {
  user: {
    name: 'User',
    defaultPermissions: [
      'data:read',
      'ai:chat',
      'ai:embeddings',
      'storage:local',
      'tools:compose',
    ],
  },
  developer: {
    name: 'Developer',
    defaultPermissions: [
      'data:read', 'data:write',
      'network:fetch',
      'ai:chat', 'ai:embeddings', 'ai:images',
      'storage:local', 'storage:cloud',
      'tools:execute', 'tools:compose',
    ],
  },
  admin: {
    name: 'Admin',
    defaultPermissions: ['*'], // All permissions
  },
  plugin: {
    name: 'Plugin',
    defaultPermissions: [], // Must explicitly request
  },
};

class PermissionSystem {
  constructor() {
    // Runtime permission cache (DB-backed requests via createPermissionRequest/approveRequest)
    this.grants = new Map();      // entityId -> Set of permissions
    this.revocations = new Map(); // entityId -> Set of revoked permissions
    this.auditLog = [];           // Audit trail
    this.rateTracking = new Map(); // Track permission usage rates
  }

  /**
   * Parse permission string (e.g., "data:read")
   */
  parsePermission(permission) {
    if (permission === '*') {
      return { category: '*', scope: '*', valid: true };
    }
    
    const [category, scope] = permission.split(':');
    const categoryDef = PERMISSION_CATEGORIES[category];
    
    if (!categoryDef) {
      return { valid: false, error: `Unknown category: ${category}` };
    }
    
    if (scope && scope !== '*' && !categoryDef.scopes[scope]) {
      return { valid: false, error: `Unknown scope: ${scope} in category ${category}` };
    }
    
    return {
      category,
      scope: scope || '*',
      valid: true,
      risk: scope && categoryDef.scopes[scope] 
        ? categoryDef.scopes[scope].risk 
        : this.getHighestRisk(categoryDef.scopes),
    };
  }

  getHighestRisk(scopes) {
    const risks = Object.values(scopes).map(s => s.risk);
    if (risks.includes('high')) return 'high';
    if (risks.includes('medium')) return 'medium';
    return 'low';
  }

  /**
   * Grant permission to an entity
   */
  grantPermission(entityId, entityType, permission, grantedBy, options = {}) {
    const parsed = this.parsePermission(permission);
    if (!parsed.valid) {
      return { success: false, error: parsed.error };
    }

    // Get or create grants set
    if (!this.grants.has(entityId)) {
      this.grants.set(entityId, new Set());
    }
    
    const grants = this.grants.get(entityId);
    grants.add(permission);

    // Remove from revocations if exists
    const revocations = this.revocations.get(entityId);
    if (revocations) {
      revocations.delete(permission);
    }

    // Audit log
    this.logAudit({
      action: 'grant',
      entityId,
      entityType,
      permission,
      grantedBy,
      timestamp: new Date(),
      options,
    });

    return {
      success: true,
      permission,
      risk: parsed.risk,
      expiresAt: options.expiresAt || null,
    };
  }

  /**
   * Revoke permission
   */
  revokePermission(entityId, permission, revokedBy, reason = '') {
    const parsed = this.parsePermission(permission);
    if (!parsed.valid) {
      return { success: false, error: parsed.error };
    }

    // Remove from grants
    const grants = this.grants.get(entityId);
    if (grants) {
      grants.delete(permission);
    }

    // Add to revocations
    if (!this.revocations.has(entityId)) {
      this.revocations.set(entityId, new Set());
    }
    this.revocations.get(entityId).add(permission);

    // Audit log
    this.logAudit({
      action: 'revoke',
      entityId,
      permission,
      revokedBy,
      reason,
      timestamp: new Date(),
    });

    return { success: true };
  }

  /**
   * Check if entity has permission
   */
  hasPermission(entityId, permission, _options = {}) {
    const parsed = this.parsePermission(permission);
    if (!parsed.valid) {
      return { allowed: false, error: parsed.error };
    }

    // Check explicit revocations first
    const revocations = this.revocations.get(entityId);
    if (revocations && (revocations.has(permission) || revocations.has('*'))) {
      this.logAudit({
        action: 'check:denied:revoked',
        entityId,
        permission,
        timestamp: new Date(),
      });
      return { allowed: false, reason: 'explicitly_revoked' };
    }

    const grants = this.grants.get(entityId);
    if (!grants) {
      return { allowed: false, reason: 'no_grants' };
    }

    // Check for exact match
    if (grants.has(permission)) {
      this.trackUsage(entityId, permission);
      return { allowed: true, matchType: 'exact' };
    }

    // Check for wildcard category (e.g., "data:*" grants "data:read")
    if (parsed.scope !== '*' && grants.has(`${parsed.category}:*`)) {
      this.trackUsage(entityId, permission);
      return { allowed: true, matchType: 'category_wildcard' };
    }

    // Check for full wildcard
    if (grants.has('*')) {
      this.trackUsage(entityId, permission);
      return { allowed: true, matchType: 'full_wildcard' };
    }

    return { allowed: false, reason: 'not_granted' };
  }

  /**
   * Get all permissions for an entity
   */
  getPermissions(entityId) {
    const grants = this.grants.get(entityId);
    const revocations = this.revocations.get(entityId);

    return {
      granted: grants ? Array.from(grants) : [],
      revoked: revocations ? Array.from(revocations) : [],
    };
  }

  /**
   * Initialize default permissions for a role
   */
  initializeForRole(entityId, role) {
    const roleDef = ROLES[role];
    if (!roleDef) {
      return { success: false, error: `Unknown role: ${role}` };
    }

    for (const permission of roleDef.defaultPermissions) {
      this.grantPermission(entityId, 'role', permission, 'system', {
        reason: `Default for role: ${role}`,
      });
    }

    return {
      success: true,
      role,
      permissions: roleDef.defaultPermissions,
    };
  }

  /**
   * Request permissions (for user approval flow)
   */
  async createPermissionRequest(entityId, entityType, permissions, reason = '') {
    const validations = permissions.map(p => ({
      permission: p,
      ...this.parsePermission(p),
    }));

    const invalid = validations.filter(v => !v.valid);
    if (invalid.length > 0) {
      return {
        success: false,
        errors: invalid.map(v => v.error),
      };
    }

    const overallRisk = this.calculateOverallRisk(validations.map(v => v.risk));

    const request = await prisma.permissionRequest.create({
      data: {
        entityId,
        entityType,
        permissions,
        reason,
        risk: overallRisk,
        status: 'pending',
      },
    });

    this.logAudit({
      action: 'permission_request',
      entityId,
      entityType,
      permissions,
      reason,
      risk: overallRisk,
      requestId: request.id,
    });

    return {
      success: true,
      request: {
        requestId: request.id,
        entityId: request.entityId,
        entityType: request.entityType,
        permissions: request.permissions,
        reason: request.reason,
        risk: request.risk,
        status: request.status,
        createdAt: request.createdAt,
      },
    };
  }

  /**
   * Approve permission request
   */
  async approveRequest(requestId, approvedBy, selectedPermissions = null) {
    const request = await prisma.permissionRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      return { success: false, error: 'Permission request not found' };
    }
    if (request.status !== 'pending') {
      return { success: false, error: `Request already ${request.status}` };
    }

    const permsToGrant = selectedPermissions || request.permissions;

    // Grant each permission in the runtime cache
    for (const perm of permsToGrant) {
      this.grantPermission(request.entityId, request.entityType, perm, approvedBy, {});
    }

    const updated = await prisma.permissionRequest.update({
      where: { id: requestId },
      data: {
        status: 'approved',
        approvedBy,
        approvedAt: new Date(),
      },
    });

    return {
      success: true,
      requestId: updated.id,
      approvedBy,
      approvedAt: updated.approvedAt,
      permissions: permsToGrant,
    };
  }

  /**
   * Deny permission request
   */
  async denyRequest(requestId, deniedBy, reason = '') {
    const request = await prisma.permissionRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      return { success: false, error: 'Permission request not found' };
    }
    if (request.status !== 'pending') {
      return { success: false, error: `Request already ${request.status}` };
    }

    const updated = await prisma.permissionRequest.update({
      where: { id: requestId },
      data: {
        status: 'denied',
        deniedBy,
        denyReason: reason,
        deniedAt: new Date(),
      },
    });

    return {
      success: true,
      requestId: updated.id,
      deniedBy,
      reason,
      deniedAt: updated.deniedAt,
    };
  }

  /**
   * Calculate overall risk from multiple permissions
   */
  calculateOverallRisk(risks) {
    if (risks.includes('high')) return 'high';
    if (risks.includes('medium')) return 'medium';
    return 'low';
  }

  /**
   * Track permission usage
   */
  trackUsage(entityId, permission) {
    const key = `${entityId}:${permission}`;
    const current = this.rateTracking.get(key) || { count: 0, lastUsed: null };
    
    this.rateTracking.set(key, {
      count: current.count + 1,
      lastUsed: new Date(),
    });
  }

  /**
   * Get usage stats
   */
  getUsageStats(entityId) {
    const stats = {};
    
    for (const [key, data] of this.rateTracking.entries()) {
      if (key.startsWith(`${entityId}:`)) {
        const permission = key.replace(`${entityId}:`, '');
        stats[permission] = data;
      }
    }
    
    return stats;
  }

  /**
   * Log audit entry
   */
  logAudit(entry) {
    this.auditLog.push({
      ...entry,
      logId: crypto.randomBytes(8).toString('hex'),
      loggedAt: new Date(),
    });

    // Keep only last 10000 entries in memory
    if (this.auditLog.length > 10000) {
      this.auditLog = this.auditLog.slice(-10000);
    }
  }

  /**
   * Get audit log
   */
  getAuditLog(filter = {}) {
    let logs = [...this.auditLog];

    if (filter.entityId) {
      logs = logs.filter(l => l.entityId === filter.entityId);
    }
    if (filter.action) {
      logs = logs.filter(l => l.action === filter.action);
    }
    if (filter.since) {
      logs = logs.filter(l => new Date(l.timestamp) >= new Date(filter.since));
    }
    if (filter.limit) {
      logs = logs.slice(-filter.limit);
    }

    return logs;
  }

  /**
   * Get all available permissions
   */
  getAvailablePermissions() {
    const permissions = [];

    for (const [category, categoryDef] of Object.entries(PERMISSION_CATEGORIES)) {
      for (const [scope, scopeDef] of Object.entries(categoryDef.scopes)) {
        permissions.push({
          permission: `${category}:${scope}`,
          category: categoryDef.name,
          description: scopeDef.description,
          risk: scopeDef.risk,
        });
      }
    }

    return permissions;
  }

  /**
   * Get roles
   */
  getRoles() {
    return Object.entries(ROLES).map(([id, role]) => ({
      id,
      ...role,
    }));
  }

  /**
   * Get system status
   */
  getStatus() {
    return {
      totalEntities: this.grants.size,
      totalGrants: Array.from(this.grants.values()).reduce((sum, s) => sum + s.size, 0),
      totalRevocations: Array.from(this.revocations.values()).reduce((sum, s) => sum + s.size, 0),
      auditLogSize: this.auditLog.length,
      categories: Object.keys(PERMISSION_CATEGORIES),
      roles: Object.keys(ROLES),
    };
  }
}

// Export singleton
const permissionSystem = new PermissionSystem();
export default permissionSystem;
export { PermissionSystem, PERMISSION_CATEGORIES, ROLES };
