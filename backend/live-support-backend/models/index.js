/**
 * PRISMA MODEL ADAPTERS
 * Provides Mongoose-compatible interface for database operations using Prisma
 * All models use PostgreSQL via Prisma ORM
 * 
 * Supports both:
 * - Static methods: Model.findById(id), Model.findOne(query)
 * - Instance methods: new Model(data), instance.save()
 */

import { prisma } from '../lib/prisma.js';

// Helper to convert MongoDB query operators to Prisma
function convertMongoToPrisma(query) {
  const where = {};
  for (const [key, value] of Object.entries(query)) {
    // Handle $or at the top level → Prisma OR
    if (key === '$or' && Array.isArray(value)) {
      where.OR = value.map(condition => convertMongoToPrisma(condition));
      continue;
    }
    // Handle $and at the top level → Prisma AND
    if (key === '$and' && Array.isArray(value)) {
      where.AND = value.map(condition => convertMongoToPrisma(condition));
      continue;
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Handle MongoDB operators
      const prismaOp = {};
      if (value.$gte) prismaOp.gte = value.$gte;
      if (value.$lte) prismaOp.lte = value.$lte;
      if (value.$gt) prismaOp.gt = value.$gt;
      if (value.$lt) prismaOp.lt = value.$lt;
      if (value.$ne) prismaOp.not = value.$ne;
      if (value.$in) prismaOp.in = value.$in;
      if (value.$regex) {
        // Convert MongoDB $regex to Prisma startsWith/contains/endsWith
        const pattern = value.$regex.toString();
        if (pattern.startsWith('^')) {
          prismaOp.startsWith = pattern.slice(1);
        } else if (pattern.endsWith('$')) {
          prismaOp.endsWith = pattern.slice(0, -1);
        } else {
          prismaOp.contains = pattern;
        }
      }
      if (value.$exists !== undefined) {
        // Handle $exists - map to isNot null or is null
        prismaOp[value.$exists ? 'not' : 'equals'] = value.$exists ? null : null;
        // Actually for Prisma, we should skip this as it's a different paradigm
        // Just ignore $exists and return all records
        continue;
      }
      if (Object.keys(prismaOp).length > 0) {
        where[key] = prismaOp;
      } else {
        where[key] = value;
      }
    } else {
      where[key] = value;
    }
  }
  return where;
}

// ============================================
// QUERY BUILDER - Provides Mongoose-style chaining for find() queries
// ============================================
class QueryBuilder {
  constructor(promise, AdapterClass = null) {
    this._promise = promise;
    this._AdapterClass = AdapterClass;
    this._sortOptions = null;
    this._limitValue = null;
    this._skipValue = null;
    this._populateFields = [];
    this._selectFields = null;
  }

  // Chainable methods (no-op for Prisma but allow chaining)
  populate(field, select) {
    this._populateFields.push({ field, select });
    return this;
  }

  sort(options) {
    this._sortOptions = options;
    return this;
  }

  limit(value) {
    this._limitValue = parseInt(value);
    return this;
  }

  skip(value) {
    this._skipValue = parseInt(value);
    return this;
  }

  select(fields) {
    this._selectFields = fields;
    return this;
  }

  lean() {
    // No-op for Prisma - always returns plain objects
    return this;
  }

  // Execute the query with all options applied
  async then(resolve, reject) {
    try {
      let results = await this._promise;
      
      // Apply sort in JavaScript
      if (this._sortOptions) {
        results = this._applySorting(results);
      }
      
      // Apply skip
      if (this._skipValue) {
        results = results.slice(this._skipValue);
      }
      
      // Apply limit
      if (this._limitValue) {
        results = results.slice(0, this._limitValue);
      }
      
      resolve(results);
    } catch (error) {
      reject(error);
    }
  }

  _applySorting(results) {
    if (!this._sortOptions || !Array.isArray(results)) return results;
    
    return [...results].sort((a, b) => {
      for (const [field, direction] of Object.entries(this._sortOptions)) {
        const dir = direction === -1 || direction === 'desc' ? -1 : 1;
        const aVal = this._getNestedValue(a, field);
        const bVal = this._getNestedValue(b, field);
        
        if (aVal < bVal) return -1 * dir;
        if (aVal > bVal) return 1 * dir;
      }
      return 0;
    });
  }

  _getNestedValue(obj, path) {
    return path.split('.').reduce((curr, key) => curr?.[key], obj);
  }
}

// ============================================
// USER MODEL ADAPTER
// ============================================
class UserAdapter {
  constructor(data = {}) {
    Object.assign(this, data);
    this._isNew = true;
  }

  async save() {
    if (this._isNew) {
      const result = await prisma.user.create({ data: this._getData() });
      Object.assign(this, result);
      this._isNew = false;
      return this;
    } else {
      const result = await prisma.user.update({
        where: { id: this.id },
        data: this._getData(),
      });
      Object.assign(this, result);
      return this;
    }
  }

  _getData() {
    const { _isNew, ...data } = this;
    return data;
  }

  static async findById(id) {
    const result = await prisma.user.findUnique({ where: { id } });
    return result ? Object.assign(new UserAdapter(result), { _isNew: false }) : null;
  }

  static async findByEmail(email) {
    const result = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    return result ? Object.assign(new UserAdapter(result), { _isNew: false }) : null;
  }

  static async findOne(query) {
    const where = {};
    if (query.email) where.email = query.email.toLowerCase();
    if (query.sessionId) where.sessionId = query.sessionId;
    if (query._id) where.id = query._id;
    if (query.id) where.id = query.id;
    const result = await prisma.user.findFirst({ where: convertMongoToPrisma(where) });
    return result ? Object.assign(new UserAdapter(result), { _isNew: false }) : null;
  }

  static async findMany(query = {}) {
    const results = await prisma.user.findMany({ where: convertMongoToPrisma(query) });
    return results.map(r => Object.assign(new UserAdapter(r), { _isNew: false }));
  }

  static async countDocuments(query = {}) {
    return prisma.user.count({ where: convertMongoToPrisma(query) });
  }

  static async create(data) {
    const result = await prisma.user.create({ data });
    return Object.assign(new UserAdapter(result), { _isNew: false });
  }

  static async updateOne(query, update) {
    const where = {};
    if (query._id) where.id = query._id;
    if (query.id) where.id = query.id;
    if (query.email) where.email = query.email.toLowerCase();
    return prisma.user.updateMany({ where, data: update.$set || update });
  }
}

// ============================================
// AGENT MODEL ADAPTER
// ============================================
class AgentAdapter {
  constructor(data = {}) {
    Object.assign(this, data);
    this._isNew = true;
  }

  async save() {
    if (this._isNew) {
      const result = await prisma.agent.create({ data: this._getData() });
      Object.assign(this, result);
      this._isNew = false;
      return this;
    } else {
      const result = await prisma.agent.update({
        where: { id: this.id },
        data: this._getData(),
      });
      Object.assign(this, result);
      return this;
    }
  }

  _getData() {
    const { _isNew, ...data } = this;
    return data;
  }

  static async findById(id) {
    const result = await prisma.agent.findUnique({ where: { id } });
    return result ? Object.assign(new AgentAdapter(result), { _isNew: false }) : null;
  }

  static async findOne(query) {
    const where = {};
    if (query.agentId) where.agentId = query.agentId;
    if (query.id) where.id = query.id;
    if (query._id) where.id = query._id;
    if (query.status) where.status = query.status;
    const result = await prisma.agent.findFirst({ where });
    return result ? Object.assign(new AgentAdapter(result), { _isNew: false }) : null;
  }

  static async find(query = {}) {
    const where = {};
    if (query.status) where.status = query.status;
    if (query.isActive !== undefined) where.status = query.isActive ? 'active' : 'deprecated';
    const results = await prisma.agent.findMany({ where, orderBy: { name: 'asc' } });
    return results.map(r => Object.assign(new AgentAdapter(r), { _isNew: false }));
  }

  static async countDocuments(query = {}) {
    return prisma.agent.count({ where: convertMongoToPrisma(query) });
  }

  static async create(data) {
    const result = await prisma.agent.create({ data });
    return Object.assign(new AgentAdapter(result), { _isNew: false });
  }
}

// ============================================
// CHAT SESSION MODEL ADAPTER
// ============================================
class ChatSessionAdapter {
  constructor(data = {}) {
    Object.assign(this, data);
    this._isNew = true;
  }

  async save() {
    if (this._isNew) {
      // Build settings JSON from individual fields
      const settings = {
        temperature: this.temperature || this.settings?.temperature || 0.7,
        maxTokens: this.maxTokens || this.settings?.maxTokens || 32768,
        mode: this.settings?.mode || 'balanced',
        provider: this.settings?.provider || 'mistral',
        model: this.model || this.settings?.model,
        context: this.context || this.settings?.context || {},
      };
      
      // Build stats JSON from individual fields
      const stats = {
        messageCount: this.stats?.messageCount || this.messageCount || 0,
        totalTokens: this.stats?.totalTokens || this.totalTokens || 0,
        durationMs: this.stats?.durationMs || 0,
        lastMessageAt: this.stats?.lastMessageAt || this.lastMessageAt,
      };
      
      const createData = {
        sessionId: this.sessionId,
        userId: this.userId,
        agentId: this.agentId,
        name: this.name,
        description: this.description || '',
        tags: this.tags || [],
        settings: settings,
        stats: stats,
        isActive: this.isActive !== undefined ? this.isActive : true,
        isArchived: this.isArchived || false,
      };
      const result = await prisma.chatSession.create({ data: createData });
      Object.assign(this, result);
      this._isNew = false;
      return this;
    } else {
      // Build updated settings/stats JSON
      const settings = {
        temperature: this.temperature || this.settings?.temperature,
        maxTokens: this.maxTokens || this.settings?.maxTokens,
        mode: this.settings?.mode,
        provider: this.settings?.provider,
        model: this.model || this.settings?.model,
        context: this.context || this.settings?.context,
      };
      
      const stats = {
        messageCount: this.stats?.messageCount || this.messageCount,
        totalTokens: this.stats?.totalTokens || this.totalTokens,
        durationMs: this.stats?.durationMs,
        lastMessageAt: this.stats?.lastMessageAt || this.lastMessageAt,
      };
      
      const result = await prisma.chatSession.update({
        where: { id: this.id },
        data: {
          name: this.name,
          description: this.description,
          tags: this.tags,
          settings: settings,
          stats: stats,
          isActive: this.isActive,
          isArchived: this.isArchived,
        },
      });
      Object.assign(this, result);
      return this;
    }
  }

  // Mongoose-style populate (returns self for chaining)
  populate() {
    return this;
  }

  static async findById(id) {
    const result = await prisma.chatSession.findUnique({ 
      where: { id },
      include: { agent: true },
    });
    return result ? Object.assign(new ChatSessionAdapter(result), { _isNew: false }) : null;
  }

  static findOne(query) {
    const where = {};
    if (query.sessionId) where.sessionId = query.sessionId;
    if (query.userId) where.userId = query.userId;
    if (query.id) where.id = query.id;
    const promise = prisma.chatSession.findFirst({ 
      where,
      include: { agent: true },
    }).then(result => result ? Object.assign(new ChatSessionAdapter(result), { _isNew: false, agentId: result.agent }) : null);
    return new QueryBuilder(promise, ChatSessionAdapter);
  }

  static find(query = {}) {
    const where = {};
    if (query.userId) where.userId = query.userId;
    if (query.agentId) where.agentId = query.agentId;
    if (query.isActive !== undefined) where.isActive = query.isActive;
    const promise = prisma.chatSession.findMany({ 
      where,
      include: { agent: true },
    }).then(results => results.map(r => {
      const session = Object.assign(new ChatSessionAdapter(r), { _isNew: false });
      // Map agent relation to agentId for Mongoose-style access
      session.agentId = r.agent;
      session.stats = {
        messageCount: r.messageCount || 0,
        totalTokens: r.totalTokens || 0,
        lastMessageAt: r.lastMessageAt,
        durationMs: 0,
      };
      return session;
    }));
    return new QueryBuilder(promise, ChatSessionAdapter);
  }

  static async create(data) {
    const instance = new ChatSessionAdapter(data);
    return instance.save();
  }

  static async countDocuments(query = {}) {
    return prisma.chatSession.count({ where: convertMongoToPrisma(query) });
  }

  static async deleteOne(query) {
    try {
      const where = {};
      if (query.sessionId) where.sessionId = query.sessionId;
      if (query.userId) where.userId = query.userId;
      await prisma.chatSession.deleteMany({ where });
      return { deletedCount: 1 };
    } catch (_error) {
      return { deletedCount: 0 };
    }
  }

  // Mongoose-style updateOne for session stats updates
  static async updateOne(query, update) {
    try {
      const where = {};
      if (query.sessionId) where.sessionId = query.sessionId;
      if (query.userId) where.userId = query.userId;
      if (query.id) where.id = query.id;
      
      // Find the existing session first
      const existing = await prisma.chatSession.findFirst({ where });
      if (!existing) {
        return { modifiedCount: 0 };
      }
      
      // Handle MongoDB-style $set updates
      const setData = update.$set || update;
      const updateData = {};
      
      // Handle nested stats updates (e.g., 'stats.messageCount')
      if (setData['stats.messageCount'] !== undefined || 
          setData['stats.lastMessageAt'] !== undefined ||
          setData['stats.totalTokens'] !== undefined) {
        const currentStats = existing.stats || {};
        updateData.stats = {
          ...currentStats,
          messageCount: setData['stats.messageCount'] ?? currentStats.messageCount,
          lastMessageAt: setData['stats.lastMessageAt'] ?? currentStats.lastMessageAt,
          totalTokens: setData['stats.totalTokens'] ?? currentStats.totalTokens,
          durationMs: setData['stats.durationMs'] ?? currentStats.durationMs ?? 0,
        };
      }
      
      // Handle direct field updates
      if (setData.updatedAt) updateData.updatedAt = setData.updatedAt;
      if (setData.name) updateData.name = setData.name;
      if (setData.isActive !== undefined) updateData.isActive = setData.isActive;
      if (setData.isArchived !== undefined) updateData.isArchived = setData.isArchived;
      
      await prisma.chatSession.update({
        where: { id: existing.id },
        data: updateData,
      });
      
      return { modifiedCount: 1 };
    } catch (error) {
      console.error('ChatSession.updateOne error:', error);
      return { modifiedCount: 0 };
    }
  }
}

// ============================================
// CHAT SETTINGS MODEL ADAPTER
// ============================================
class ChatSettingsAdapter {
  constructor(data = {}) {
    Object.assign(this, data);
    this._isNew = true;
  }

  async save() {
    if (this._isNew) {
      const result = await prisma.chatSettings.create({ data: this._getData() });
      Object.assign(this, result);
      this._isNew = false;
      return this;
    } else {
      const result = await prisma.chatSettings.update({
        where: { id: this.id },
        data: this._getData(),
      });
      Object.assign(this, result);
      return this;
    }
  }

  _getData() {
    const { _isNew, id, createdAt, updatedAt, ...data } = this;
    return data;
  }

  static async findOne(query) {
    const where = {};
    if (query.userId) where.userId = query.userId;
    const result = await prisma.chatSettings.findFirst({ where });
    return result ? Object.assign(new ChatSettingsAdapter(result), { _isNew: false }) : null;
  }

  static async findOneAndUpdate(query, update, options = {}) {
    const where = {};
    if (query.userId) where.userId = query.userId;
    
    const existing = await prisma.chatSettings.findFirst({ where });
    
    if (existing) {
      const result = await prisma.chatSettings.update({
        where: { id: existing.id },
        data: update.$set || update,
      });
      return Object.assign(new ChatSettingsAdapter(result), { _isNew: false });
    } else if (options.upsert) {
      const result = await prisma.chatSettings.create({
        data: {
          userId: query.userId,
          ...(update.$set || update),
        },
      });
      return Object.assign(new ChatSettingsAdapter(result), { _isNew: false });
    }
    return null;
  }

  static async create(data) {
    const instance = new ChatSettingsAdapter(data);
    return instance.save();
  }

  static async countDocuments(query = {}) {
    return prisma.chatSettings.count({ where: convertMongoToPrisma(query) });
  }
}

// ============================================
// CHAT FEEDBACK MODEL ADAPTER
// ============================================
class ChatFeedbackAdapter {
  constructor(data = {}) {
    Object.assign(this, data);
    this._isNew = true;
  }

  async save() {
    if (this._isNew) {
      const result = await prisma.chatFeedback.create({ data: this._getData() });
      Object.assign(this, result);
      this._isNew = false;
      return this;
    } else {
      const result = await prisma.chatFeedback.update({
        where: { id: this.id },
        data: this._getData(),
      });
      Object.assign(this, result);
      return this;
    }
  }

  _getData() {
    const { _isNew, id, createdAt, updatedAt, ...data } = this;
    return data;
  }

  static async findOne(query) {
    const where = {};
    if (query.messageId) where.messageId = query.messageId;
    if (query.userId) where.userId = query.userId;
    if (query.sessionId) where.sessionId = query.sessionId;
    const result = await prisma.chatFeedback.findFirst({ where });
    return result ? Object.assign(new ChatFeedbackAdapter(result), { _isNew: false }) : null;
  }

  static async find(query = {}) {
    const where = {};
    if (query.sessionId) where.sessionId = query.sessionId;
    if (query.userId) where.userId = query.userId;
    const results = await prisma.chatFeedback.findMany({ where });
    return results.map(r => Object.assign(new ChatFeedbackAdapter(r), { _isNew: false }));
  }

  static async create(data) {
    const instance = new ChatFeedbackAdapter(data);
    return instance.save();
  }

  static async countDocuments(query = {}) {
    return prisma.chatFeedback.count({ where: convertMongoToPrisma(query) });
  }
}

// ============================================
// CHAT QUICK ACTION MODEL ADAPTER
// ============================================
class ChatQuickActionAdapter {
  constructor(data = {}) {
    Object.assign(this, data);
    this._isNew = true;
  }

  async save() {
    if (this._isNew) {
      const result = await prisma.chatQuickAction.create({ data: this._getData() });
      Object.assign(this, result);
      this._isNew = false;
      return this;
    } else {
      const result = await prisma.chatQuickAction.update({
        where: { id: this.id },
        data: this._getData(),
      });
      Object.assign(this, result);
      return this;
    }
  }

  _getData() {
    const { _isNew, id, createdAt, updatedAt, ...data } = this;
    return data;
  }

  static find(query = {}) {
    const where = {};
    if (query.userId) where.userId = query.userId;
    if (query.category) where.category = query.category;
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.isDefault !== undefined) where.isDefault = query.isDefault;
    const promise = prisma.chatQuickAction.findMany({ 
      where,
    }).then(results => results.map(r => Object.assign(new ChatQuickActionAdapter(r), { _isNew: false })));
    return new QueryBuilder(promise, ChatQuickActionAdapter);
  }

  static async findOne(query) {
    const where = {};
    if (query.actionId) where.actionId = query.actionId;
    if (query.userId) where.userId = query.userId;
    const result = await prisma.chatQuickAction.findFirst({ where });
    return result ? Object.assign(new ChatQuickActionAdapter(result), { _isNew: false }) : null;
  }

  static async findOneAndUpdate(query, update, options = {}) {
    const where = {};
    if (query.actionId) where.actionId = query.actionId;
    if (query.userId) where.userId = query.userId;
    
    const existing = await prisma.chatQuickAction.findFirst({ where });
    if (!existing && options.upsert) {
      const createData = { ...query };
      if (update.$set) Object.assign(createData, update.$set);
      if (update.$inc) {
        for (const [key, val] of Object.entries(update.$inc)) {
          createData[key] = val;
        }
      }
      const result = await prisma.chatQuickAction.create({ data: createData });
      return Object.assign(new ChatQuickActionAdapter(result), { _isNew: false });
    }
    
    if (!existing) return null;
    
    // Handle $inc operations
    const updateData = update.$set ? { ...update.$set } : {};
    if (update.$inc) {
      for (const [key, val] of Object.entries(update.$inc)) {
        updateData[key] = { increment: val };
      }
    }
    
    const result = await prisma.chatQuickAction.update({
      where: { id: existing.id },
      data: updateData,
    });
    return Object.assign(new ChatQuickActionAdapter(result), { _isNew: false });
  }

  static async create(data) {
    const instance = new ChatQuickActionAdapter(data);
    return instance.save();
  }

  static async findByIdAndUpdate(id, update) {
    const result = await prisma.chatQuickAction.update({
      where: { id },
      data: update,
    });
    return Object.assign(new ChatQuickActionAdapter(result), { _isNew: false });
  }

  static async findByIdAndDelete(id) {
    return prisma.chatQuickAction.delete({ where: { id } });
  }

  static async countDocuments(query = {}) {
    return prisma.chatQuickAction.count({ where: convertMongoToPrisma(query) });
  }
}

// ============================================
// CANVAS PROJECT MODEL ADAPTER
// ============================================
class ChatCanvasProjectAdapter {
  constructor(data = {}) {
    Object.assign(this, data);
    this._isNew = true;
  }

  async save() {
    if (this._isNew) {
      const result = await prisma.chatCanvasProject.create({
        data: {
          projectId: this.projectId,
          userId: this.userId,
          sessionId: this.sessionId,
          name: this.name,
          description: this.description,
          type: this.type,
          metadata: this.metadata || {},
        },
      });
      Object.assign(this, result);
      this._isNew = false;
      return this;
    } else {
      const result = await prisma.chatCanvasProject.update({
        where: { id: this.id },
        data: {
          name: this.name,
          description: this.description,
          type: this.type,
          metadata: this.metadata,
        },
      });
      Object.assign(this, result);
      return this;
    }
  }

  static find(query = {}) {
    const where = {};
    if (query.userId) where.userId = query.userId;
    if (query.sessionId) where.sessionId = query.sessionId;
    if (query.status) where.status = query.status;
    if (query.status?.$exists !== undefined) {
      // Handle Mongoose $exists - ignore, just return all
    }
    const promise = prisma.chatCanvasProject.findMany({
      where,
    }).then(results => results.map(r => Object.assign(new ChatCanvasProjectAdapter(r), { _isNew: false })));
    return new QueryBuilder(promise, ChatCanvasProjectAdapter);
  }

  static async findById(id) {
    const result = await prisma.chatCanvasProject.findUnique({
      where: { id },
    });
    return result ? Object.assign(new ChatCanvasProjectAdapter(result), { _isNew: false }) : null;
  }

  static async findOne(query) {
    const where = {};
    if (query.projectId) where.projectId = query.projectId;
    if (query.userId) where.userId = query.userId;
    const result = await prisma.chatCanvasProject.findFirst({
      where,
    });
    return result ? Object.assign(new ChatCanvasProjectAdapter(result), { _isNew: false }) : null;
  }

  static async findOneAndUpdate(query, update, options = {}) {
    const where = {};
    if (query.projectId) where.projectId = query.projectId;
    if (query.userId) where.userId = query.userId;
    
    const existing = await prisma.chatCanvasProject.findFirst({ where });
    if (!existing) return null;
    
    // Handle $inc and $set operations - ChatCanvasProject doesn't have stats in schema
    // Just update normal fields
    const updateData = update.$set ? { ...update.$set } : {};
    // Copy non-operator fields
    for (const [key, val] of Object.entries(update)) {
      if (!key.startsWith('$') && key !== 'stats.lastModified') {
        updateData[key] = val;
      }
    }
    
    const result = await prisma.chatCanvasProject.update({
      where: { id: existing.id },
      data: updateData,
    });
    return Object.assign(new ChatCanvasProjectAdapter(result), { _isNew: false });
  }

  static async create(data) {
    const instance = new ChatCanvasProjectAdapter(data);
    return instance.save();
  }

  static async findByIdAndUpdate(id, update) {
    const result = await prisma.chatCanvasProject.update({
      where: { id },
      data: update.$set || update,
    });
    return Object.assign(new ChatCanvasProjectAdapter(result), { _isNew: false });
  }

  static async findByIdAndDelete(id) {
    // Delete associated files first
    await prisma.chatCanvasFile.deleteMany({ where: { projectId: id } });
    return prisma.chatCanvasProject.delete({ where: { id } });
  }

  static async countDocuments(query = {}) {
    return prisma.chatCanvasProject.count({ where: convertMongoToPrisma(query) });
  }
}

// ============================================
// CANVAS FILE MODEL ADAPTER
// ============================================
class ChatCanvasFileAdapter {
  constructor(data = {}) {
    Object.assign(this, data);
    this._isNew = true;
  }

  async save() {
    if (this._isNew) {
      const result = await prisma.chatCanvasFile.create({ data: this._getData() });
      Object.assign(this, result);
      this._isNew = false;
      return this;
    } else {
      const result = await prisma.chatCanvasFile.update({
        where: { id: this.id },
        data: this._getData(),
      });
      Object.assign(this, result);
      return this;
    }
  }

  _getData() {
    const { _isNew, id, createdAt, updatedAt, ...data } = this;
    return data;
  }

  static find(query = {}) {
    const where = {};
    if (query.projectId) where.projectId = query.projectId;
    if (query.userId) where.userId = query.userId;
    const promise = prisma.chatCanvasFile.findMany({
      where,
    }).then(results => results.map(r => Object.assign(new ChatCanvasFileAdapter(r), { _isNew: false })));
    return new QueryBuilder(promise, ChatCanvasFileAdapter);
  }

  static async findById(id) {
    const result = await prisma.chatCanvasFile.findUnique({ where: { id } });
    return result ? Object.assign(new ChatCanvasFileAdapter(result), { _isNew: false }) : null;
  }

  static async findOne(query) {
    const where = {};
    if (query.projectId) where.projectId = query.projectId;
    if (query.userId) where.userId = query.userId;
    if (query.path) where.path = query.path;
    if (query.fileId) where.fileId = query.fileId;
    const result = await prisma.chatCanvasFile.findFirst({ where });
    return result ? Object.assign(new ChatCanvasFileAdapter(result), { _isNew: false }) : null;
  }

  static async create(data) {
    const instance = new ChatCanvasFileAdapter(data);
    return instance.save();
  }

  static async findByIdAndUpdate(id, update) {
    const result = await prisma.chatCanvasFile.update({
      where: { id },
      data: update.$set || update,
    });
    return Object.assign(new ChatCanvasFileAdapter(result), { _isNew: false });
  }

  static async findByIdAndDelete(id) {
    return prisma.chatCanvasFile.delete({ where: { id } });
  }

  static async countDocuments(query = {}) {
    return prisma.chatCanvasFile.count({ where: convertMongoToPrisma(query) });
  }
}

// ============================================
// CANVAS HISTORY MODEL ADAPTER
// ============================================
class ChatCanvasHistoryAdapter {
  constructor(data = {}) {
    Object.assign(this, data);
    this._isNew = true;
  }

  async save() {
    if (this._isNew) {
      const result = await prisma.chatCanvasHistory.create({ data: this._getData() });
      Object.assign(this, result);
      this._isNew = false;
      return this;
    } else {
      const result = await prisma.chatCanvasHistory.update({
        where: { id: this.id },
        data: this._getData(),
      });
      Object.assign(this, result);
      return this;
    }
  }

  _getData() {
    const { _isNew, id, createdAt, ...data } = this;
    return data;
  }

  static find(query = {}) {
    const where = {};
    if (query.fileId) where.fileId = query.fileId;
    if (query.projectId) where.projectId = query.projectId;
    if (query.userId) where.userId = query.userId;
    const promise = prisma.chatCanvasHistory.findMany({
      where,
    }).then(results => results.map(r => Object.assign(new ChatCanvasHistoryAdapter(r), { _isNew: false })));
    return new QueryBuilder(promise, ChatCanvasHistoryAdapter);
  }

  static async create(data) {
    const instance = new ChatCanvasHistoryAdapter(data);
    return instance.save();
  }

  static async countDocuments(query = {}) {
    return prisma.chatCanvasHistory.count({ where: convertMongoToPrisma(query) });
  }
}

// ============================================
// ANALYTICS MODELS ADAPTERS
// ============================================
class VisitorAdapter {
  constructor(data = {}) {
    Object.assign(this, data);
    this._isNew = true;
  }

  async save() {
    if (this._isNew) {
      const result = await prisma.visitor.create({ data: this._getData() });
      Object.assign(this, result);
      this._isNew = false;
      return this;
    } else {
      const result = await prisma.visitor.update({
        where: { id: this.id },
        data: this._getData(),
      });
      Object.assign(this, result);
      return this;
    }
  }

  _getData() {
    const { _isNew, id, createdAt, updatedAt, ...data } = this;
    return data;
  }

  static async findOne(query) {
    const where = {};
    if (query.visitorId) where.visitorId = query.visitorId;
    const result = await prisma.visitor.findFirst({ where });
    return result ? Object.assign(new VisitorAdapter(result), { _isNew: false }) : null;
  }

  static async findById(id) {
    const result = await prisma.visitor.findUnique({ where: { id } });
    return result ? Object.assign(new VisitorAdapter(result), { _isNew: false }) : null;
  }

  static async countDocuments(query = {}) {
    return prisma.visitor.count({ where: convertMongoToPrisma(query) });
  }

  static async create(data) {
    const instance = new VisitorAdapter(data);
    return instance.save();
  }
}

class SessionAdapter {
  constructor(data = {}) {
    Object.assign(this, data);
    this._isNew = true;
  }

  async save() {
    if (this._isNew) {
      const result = await prisma.session.create({ data: this._getData() });
      Object.assign(this, result);
      this._isNew = false;
      return this;
    } else {
      const result = await prisma.session.update({
        where: { id: this.id },
        data: this._getData(),
      });
      Object.assign(this, result);
      return this;
    }
  }

  _getData() {
    const { _isNew, id, createdAt, updatedAt, ...data } = this;
    return data;
  }

  static async findOne(query) {
    const where = {};
    if (query.sessionId) where.sessionId = query.sessionId;
    const result = await prisma.session.findFirst({ where });
    return result ? Object.assign(new SessionAdapter(result), { _isNew: false }) : null;
  }

  static async findById(id) {
    const result = await prisma.session.findUnique({ where: { id } });
    return result ? Object.assign(new SessionAdapter(result), { _isNew: false }) : null;
  }

  static async find(query = {}) {
    const where = {};
    if (query.visitorId) where.visitorId = query.visitorId;
    const results = await prisma.session.findMany({ where: convertMongoToPrisma(where), orderBy: { startTime: 'desc' } });
    return results.map(r => Object.assign(new SessionAdapter(r), { _isNew: false }));
  }

  static async countDocuments(query = {}) {
    return prisma.session.count({ where: convertMongoToPrisma(query) });
  }

  static async create(data) {
    const instance = new SessionAdapter(data);
    return instance.save();
  }
}

class PageViewAdapter {
  constructor(data = {}) {
    Object.assign(this, data);
    this._isNew = true;
  }

  async save() {
    if (this._isNew) {
      const result = await prisma.pageView.create({ data: this._getData() });
      Object.assign(this, result);
      this._isNew = false;
      return this;
    } else {
      const result = await prisma.pageView.update({
        where: { id: this.id },
        data: this._getData(),
      });
      Object.assign(this, result);
      return this;
    }
  }

  _getData() {
    const { _isNew, id, ...data } = this;
    return data;
  }

  static async findById(id) {
    const result = await prisma.pageView.findUnique({ where: { id } });
    return result ? Object.assign(new PageViewAdapter(result), { _isNew: false }) : null;
  }

  static async countDocuments(query = {}) {
    return prisma.pageView.count({ where: convertMongoToPrisma(query) });
  }

  static async find(query = {}) {
    const results = await prisma.pageView.findMany({ where: convertMongoToPrisma(query), orderBy: { timestamp: 'desc' } });
    return results.map(r => Object.assign(new PageViewAdapter(r), { _isNew: false }));
  }

  static async create(data) {
    const instance = new PageViewAdapter(data);
    return instance.save();
  }
}

class UserEventAdapter {
  constructor(data = {}) {
    Object.assign(this, data);
    this._isNew = true;
  }

  async save() {
    if (this._isNew) {
      const result = await prisma.userEvent.create({ data: this._getData() });
      Object.assign(this, result);
      this._isNew = false;
      return this;
    } else {
      const result = await prisma.userEvent.update({
        where: { id: this.id },
        data: this._getData(),
      });
      Object.assign(this, result);
      return this;
    }
  }

  _getData() {
    const { _isNew, id, ...data } = this;
    return data;
  }

  static async countDocuments(query = {}) {
    return prisma.userEvent.count({ where: convertMongoToPrisma(query) });
  }

  static async find(query = {}) {
    const results = await prisma.userEvent.findMany({ where: convertMongoToPrisma(query), orderBy: { occurredAt: 'desc' } });
    return results.map(r => Object.assign(new UserEventAdapter(r), { _isNew: false }));
  }

  static async create(data) {
    const instance = new UserEventAdapter(data);
    return instance.save();
  }
}

class ApiUsageAdapter {
  constructor(data = {}) {
    Object.assign(this, data);
    this._isNew = true;
  }

  async save() {
    if (this._isNew) {
      const result = await prisma.apiUsage.create({ data: this._getData() });
      Object.assign(this, result);
      this._isNew = false;
      return this;
    } else {
      const result = await prisma.apiUsage.update({
        where: { id: this.id },
        data: this._getData(),
      });
      Object.assign(this, result);
      return this;
    }
  }

  _getData() {
    const { _isNew, id, ...data } = this;
    return data;
  }

  static async countDocuments(query = {}) {
    return prisma.apiUsage.count({ where: convertMongoToPrisma(query) });
  }

  static async find(query = {}) {
    const results = await prisma.apiUsage.findMany({ where: convertMongoToPrisma(query), orderBy: { timestamp: 'desc' } });
    return results.map(r => Object.assign(new ApiUsageAdapter(r), { _isNew: false }));
  }

  static async create(data) {
    const instance = new ApiUsageAdapter(data);
    return instance.save();
  }
}

class ChatInteractionAdapter {
  constructor(data = {}) {
    Object.assign(this, data);
    this._isNew = true;
  }

  async save() {
    if (this._isNew) {
      // If agentId is a slug (like "chess-player"), look up the actual agent id
      // cuid always starts with 'c' and is 25 chars, slugs are different format
      let resolvedAgentId = null;
      if (this.agentId) {
        // Check if it looks like a cuid (starts with 'c' + random chars, ~25 chars)
        const isCuid = /^c[a-z0-9]{20,}$/i.test(this.agentId);
        if (isCuid) {
          // It's already a cuid, use it directly
          resolvedAgentId = this.agentId;
        } else {
          // It's a slug like "chess-player", look up the agent's id
          const agent = await prisma.agent.findUnique({ 
            where: { agentId: this.agentId },
            select: { id: true }
          });
          resolvedAgentId = agent?.id || null;
        }
      }
      
      const createData = {
        conversationId: this.conversationId,
        userId: this.userId,
        agentId: resolvedAgentId, // Use resolved cuid
        channel: this.channel || 'web',
        language: this.language || 'en',
        messages: this.messages || [],
        status: this.status || 'active',
      };
      const result = await prisma.chatAnalyticsInteraction.create({ data: createData });
      Object.assign(this, result);
      this._isNew = false;
      return this;
    } else {
      const result = await prisma.chatAnalyticsInteraction.update({
        where: { id: this.id },
        data: {
          messages: this.messages,
          status: this.status,
        },
      });
      Object.assign(this, result);
      return this;
    }
  }

  static findOne(query) {
    const where = {};
    if (query.conversationId) where.conversationId = query.conversationId;
    if (query.userId) where.userId = query.userId;
    const promise = prisma.chatAnalyticsInteraction.findFirst({ where })
      .then(result => result ? Object.assign(new ChatInteractionAdapter(result), { _isNew: false }) : null);
    return new QueryBuilder(promise, ChatInteractionAdapter);
  }

  static async findById(id) {
    const result = await prisma.chatAnalyticsInteraction.findUnique({ where: { id } });
    return result ? Object.assign(new ChatInteractionAdapter(result), { _isNew: false }) : null;
  }

  static find(query = {}) {
    const where = {};
    if (query.conversationId) where.conversationId = query.conversationId;
    if (query.userId) where.userId = query.userId;
    const promise = prisma.chatAnalyticsInteraction.findMany({
      where,
    }).then(results => results.map(r => Object.assign(new ChatInteractionAdapter(r), { _isNew: false })));
    return new QueryBuilder(promise, ChatInteractionAdapter);
  }

  static async create(data) {
    const instance = new ChatInteractionAdapter(data);
    return instance.save();
  }

  static async countDocuments(query = {}) {
    return prisma.chatAnalyticsInteraction.count({ where: convertMongoToPrisma(query) });
  }

  // Mongoose-style sort (returns self for chaining)  
  sort() {
    return this;
  }
}

// ============================================
// SUPPORT MODELS ADAPTERS
// ============================================
class SupportTicketAdapter {
  constructor(data = {}) {
    Object.assign(this, data);
    this._isNew = true;
  }

  async save() {
    if (this._isNew) {
      const result = await prisma.supportTicket.create({ data: this._getData() });
      Object.assign(this, result);
      this._isNew = false;
      return this;
    } else {
      const result = await prisma.supportTicket.update({
        where: { id: this.id },
        data: this._getData(),
      });
      Object.assign(this, result);
      return this;
    }
  }

  _getData() {
    const { _isNew, id, createdAt, updatedAt, ticketId, ticketNumber, messages, ...rest } = this;
    // Map field names from route format to Prisma schema format
    const data = {
      ...rest,
      // Map userEmail to email if present
      email: rest.email || rest.userEmail,
      // Map userName to name if present  
      name: rest.name || rest.userName,
      // For guest users (userId starts with 'guest_'), set userId to null
      // This avoids foreign key constraint violations
      userId: (rest.userId && rest.userId.startsWith('guest_')) ? null : rest.userId,
    };
    // Remove the old field names
    delete data.userEmail;
    delete data.userName;
    // Store messages in metadata
    if (messages && Array.isArray(messages)) {
      data.metadata = { ...(data.metadata || {}), chatMessages: messages };
    }
    return data;
  }

  static async find(query = {}) {
    const where = {};
    if (query.userId) where.userId = query.userId;
    if (query.status) where.status = query.status;
    const results = await prisma.supportTicket.findMany({ where, orderBy: { createdAt: 'desc' } });
    return results.map(r => Object.assign(new SupportTicketAdapter(r), { _isNew: false }));
  }

  static async findById(id) {
    const result = await prisma.supportTicket.findUnique({ where: { id } });
    return result ? Object.assign(new SupportTicketAdapter(result), { _isNew: false }) : null;
  }

  static async create(data) {
    const instance = new SupportTicketAdapter(data);
    return instance.save();
  }

  static async findByIdAndUpdate(id, update) {
    const result = await prisma.supportTicket.update({ where: { id }, data: update.$set || update });
    return Object.assign(new SupportTicketAdapter(result), { _isNew: false });
  }

  static async countDocuments(query = {}) {
    return prisma.supportTicket.count({ where: convertMongoToPrisma(query) });
  }
}

class ContactMessageAdapter {
  constructor(data = {}) {
    Object.assign(this, data);
    this._isNew = true;
  }

  async save() {
    if (this._isNew) {
      const result = await prisma.contactMessage.create({ data: this._getData() });
      Object.assign(this, result);
      this._isNew = false;
      return this;
    } else {
      const result = await prisma.contactMessage.update({
        where: { id: this.id },
        data: this._getData(),
      });
      Object.assign(this, result);
      return this;
    }
  }

  _getData() {
    const { _isNew, id, createdAt, updatedAt, ticketId, agentName, category, priority, metadata, ...rest } = this;
    // ContactMessage schema only has: name, email, subject, message, source, isRead
    const data = {
      name: rest.name,
      email: rest.email,
      subject: rest.subject || null,
      message: rest.message,
      source: rest.source || 'website',
      isRead: rest.isRead || false,
    };
    return data;
  }

  static async find(query = {}) {
    const results = await prisma.contactMessage.findMany({ where: convertMongoToPrisma(query), orderBy: { createdAt: 'desc' } });
    return results.map(r => Object.assign(new ContactMessageAdapter(r), { _isNew: false }));
  }

  static async findById(id) {
    const result = await prisma.contactMessage.findUnique({ where: { id } });
    return result ? Object.assign(new ContactMessageAdapter(result), { _isNew: false }) : null;
  }

  static async create(data) {
    const instance = new ContactMessageAdapter(data);
    return instance.save();
  }

  static async findByIdAndUpdate(id, update) {
    const result = await prisma.contactMessage.update({ where: { id }, data: update.$set || update });
    return Object.assign(new ContactMessageAdapter(result), { _isNew: false });
  }

  static async countDocuments(query = {}) {
    return prisma.contactMessage.count({ where: convertMongoToPrisma(query) });
  }
}

// ============================================
// COMMUNITY MODELS ADAPTERS
// ============================================
class CommunityPostAdapter {
  constructor(data = {}) {
    Object.assign(this, data);
    this._isNew = true;
  }

  async save() {
    if (this._isNew) {
      const result = await prisma.communityPost.create({ data: this._getData() });
      Object.assign(this, result);
      this._isNew = false;
      return this;
    } else {
      const result = await prisma.communityPost.update({
        where: { id: this.id },
        data: this._getData(),
      });
      Object.assign(this, result);
      return this;
    }
  }

  _getData() {
    const { _isNew, id, createdAt, updatedAt, author, comments, likes, ...data } = this;
    return data;
  }

  // Mongoose-style lean (returns self for chaining)
  lean() {
    return this;
  }

  static find(query = {}) {
    const where = {};
    if (query.authorId) where.authorId = query.authorId;
    if (query.category) where.category = query.category;
    const promise = prisma.communityPost.findMany({ 
      where, 
      include: { author: true, comments: true, likes: true },
    }).then(results => results.map(r => Object.assign(new CommunityPostAdapter(r), { _isNew: false })));
    return new QueryBuilder(promise, CommunityPostAdapter);
  }

  static findById(id) {
    const promise = prisma.communityPost.findUnique({ 
      where: { id },
      include: { author: true, comments: true, likes: true },
    }).then(result => {
      if (result) {
        const instance = Object.assign(new CommunityPostAdapter(result), { _isNew: false });
        return instance;
      }
      return null;
    });
    return new QueryBuilder(promise, CommunityPostAdapter);
  }

  static async create(data) {
    const instance = new CommunityPostAdapter(data);
    return instance.save();
  }

  static async findByIdAndUpdate(id, update) {
    const result = await prisma.communityPost.update({ where: { id }, data: update.$set || update });
    return Object.assign(new CommunityPostAdapter(result), { _isNew: false });
  }

  static async findByIdAndDelete(id) {
    return prisma.communityPost.delete({ where: { id } });
  }

  static async countDocuments(query = {}) {
    return prisma.communityPost.count({ where: convertMongoToPrisma(query) });
  }
}

class CommunityCommentAdapter {
  constructor(data = {}) {
    Object.assign(this, data);
    this._isNew = true;
  }

  async save() {
    if (this._isNew) {
      const result = await prisma.communityComment.create({ data: this._getData() });
      Object.assign(this, result);
      this._isNew = false;
      return this;
    } else {
      const result = await prisma.communityComment.update({
        where: { id: this.id },
        data: this._getData(),
      });
      Object.assign(this, result);
      return this;
    }
  }

  _getData() {
    const { _isNew, id, createdAt, updatedAt, ...data } = this;
    return data;
  }

  static async countDocuments(query = {}) {
    return prisma.communityComment.count({ where: convertMongoToPrisma(query) });
  }

  static async create(data) {
    const instance = new CommunityCommentAdapter(data);
    return instance.save();
  }
}

class CommunityLikeAdapter {
  constructor(data = {}) {
    Object.assign(this, data);
    this._isNew = true;
  }

  async save() {
    if (this._isNew) {
      const result = await prisma.communityLike.create({ data: this._getData() });
      Object.assign(this, result);
      this._isNew = false;
      return this;
    } else {
      const result = await prisma.communityLike.update({
        where: { id: this.id },
        data: this._getData(),
      });
      Object.assign(this, result);
      return this;
    }
  }

  _getData() {
    const { _isNew, id, createdAt, ...data } = this;
    return data;
  }

  static async countDocuments(query = {}) {
    return prisma.communityLike.count({ where: convertMongoToPrisma(query) });
  }

  static async create(data) {
    const instance = new CommunityLikeAdapter(data);
    return instance.save();
  }
}

// ============================================
// OTHER MODELS ADAPTERS
// ============================================
class JobApplicationAdapter {
  constructor(data = {}) {
    Object.assign(this, data);
    this._isNew = true;
  }

  async save() {
    if (this._isNew) {
      const result = await prisma.jobApplication.create({ data: this._getData() });
      Object.assign(this, result);
      this._isNew = false;
      return this;
    } else {
      const result = await prisma.jobApplication.update({
        where: { id: this.id },
        data: this._getData(),
      });
      Object.assign(this, result);
      return this;
    }
  }

  _getData() {
    const { _isNew, id, createdAt, updatedAt, applicationId, applicationNumber, ...rest } = this;
    // Map route format to Prisma schema format
    // Route sends: { applicant: { firstName, lastName, email, phone }, position: { id, title }, ... }
    // Prisma expects: { name, email, phone, position, ... }
    const data = {
      userId: rest.userId || null,
      name: rest.applicant 
        ? `${rest.applicant.firstName} ${rest.applicant.lastName}` 
        : rest.name,
      email: rest.applicant?.email || rest.email,
      phone: rest.applicant?.phone || rest.phone || null,
      position: rest.position?.title || rest.position?.id || rest.position,
      resumeUrl: rest.resume?.url || rest.resumeUrl || null,
      coverLetter: rest.coverLetter || null,
      linkedinUrl: rest.applicant?.linkedin || rest.linkedinUrl || null,
      portfolioUrl: rest.applicant?.portfolio || rest.portfolioUrl || null,
      status: rest.status || 'submitted',
      notes: rest.notes || null,
    };
    return data;
  }

  static find(query = {}) {
    const promise = prisma.jobApplication.findMany({ where: convertMongoToPrisma(query) })
      .then(results => results.map(r => Object.assign(new JobApplicationAdapter(r), { _isNew: false })));
    return new QueryBuilder(promise, JobApplicationAdapter);
  }

  static async findById(id) {
    const result = await prisma.jobApplication.findUnique({ where: { id } });
    return result ? Object.assign(new JobApplicationAdapter(result), { _isNew: false }) : null;
  }

  static async findOne(query) {
    const where = {};
    if (query.applicationId) where.applicationId = query.applicationId;
    if (query.email) where.email = query.email;
    if (query.jobId) where.jobId = query.jobId;
    const result = await prisma.jobApplication.findFirst({ where });
    return result ? Object.assign(new JobApplicationAdapter(result), { _isNew: false }) : null;
  }

  static async create(data) {
    const instance = new JobApplicationAdapter(data);
    return instance.save();
  }

  static async findByIdAndUpdate(id, update) {
    const result = await prisma.jobApplication.update({ where: { id }, data: update.$set || update });
    return Object.assign(new JobApplicationAdapter(result), { _isNew: false });
  }

  static async countDocuments(query = {}) {
    return prisma.jobApplication.count({ where: convertMongoToPrisma(query) });
  }
}

class WebinarRegistrationAdapter {
  constructor(data = {}) {
    Object.assign(this, data);
    this._isNew = true;
  }

  async save() {
    if (this._isNew) {
      const result = await prisma.webinarRegistration.create({ data: this._getData() });
      Object.assign(this, result);
      this._isNew = false;
      return this;
    } else {
      const result = await prisma.webinarRegistration.update({
        where: { id: this.id },
        data: this._getData(),
      });
      Object.assign(this, result);
      return this;
    }
  }

  _getData() {
    const { _isNew, id, createdAt, ...data } = this;
    return data;
  }

  static async find(query = {}) {
    const results = await prisma.webinarRegistration.findMany({ where: convertMongoToPrisma(query), orderBy: { createdAt: 'desc' } });
    return results.map(r => Object.assign(new WebinarRegistrationAdapter(r), { _isNew: false }));
  }

  static async findOne(query) {
    const result = await prisma.webinarRegistration.findFirst({ where: convertMongoToPrisma(query) });
    return result ? Object.assign(new WebinarRegistrationAdapter(result), { _isNew: false }) : null;
  }

  static async create(data) {
    const instance = new WebinarRegistrationAdapter(data);
    return instance.save();
  }

  static async countDocuments(query = {}) {
    return prisma.webinarRegistration.count({ where: convertMongoToPrisma(query) });
  }
}

class UserFavoritesAdapter {
  constructor(data = {}) {
    Object.assign(this, data);
    this._isNew = true;
  }

  async save() {
    if (this._isNew) {
      const result = await prisma.userFavorites.create({ data: this._getData() });
      Object.assign(this, result);
      this._isNew = false;
      return this;
    } else {
      const result = await prisma.userFavorites.update({
        where: { id: this.id },
        data: this._getData(),
      });
      Object.assign(this, result);
      return this;
    }
  }

  _getData() {
    const { _isNew, id, createdAt, updatedAt, ...data } = this;
    return data;
  }

  static async findOne(query) {
    const result = await prisma.userFavorites.findFirst({ where: convertMongoToPrisma(query) });
    return result ? Object.assign(new UserFavoritesAdapter(result), { _isNew: false }) : null;
  }

  static async findById(id) {
    const result = await prisma.userFavorites.findUnique({ where: { id } });
    return result ? Object.assign(new UserFavoritesAdapter(result), { _isNew: false }) : null;
  }

  static find(query = {}) {
    const promise = prisma.userFavorites.findMany({ where: convertMongoToPrisma(query), orderBy: { createdAt: 'desc' } })
      .then(results => results.map(r => Object.assign(new UserFavoritesAdapter(r), { _isNew: false })));
    return new QueryBuilder(promise, UserFavoritesAdapter);
  }

  static async findOneAndUpdate(query, update, options = {}) {
    const existing = await prisma.userFavorites.findFirst({ where: convertMongoToPrisma(query) });
    if (existing) {
      const result = await prisma.userFavorites.update({ where: { id: existing.id }, data: update.$set || update });
      return Object.assign(new UserFavoritesAdapter(result), { _isNew: false });
    } else if (options.upsert) {
      const result = await prisma.userFavorites.create({ data: { ...query, ...(update.$set || update) } });
      return Object.assign(new UserFavoritesAdapter(result), { _isNew: false });
    }
    return null;
  }

  static async create(data) {
    const instance = new UserFavoritesAdapter(data);
    return instance.save();
  }

  static async countDocuments(query = {}) {
    return prisma.userFavorites.count({ where: convertMongoToPrisma(query) });
  }

  static async deleteOne(query) {
    const existing = await prisma.userFavorites.findFirst({ where: convertMongoToPrisma(query) });
    if (existing) {
      await prisma.userFavorites.delete({ where: { id: existing.id } });
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }

  static async distinct(field, query = {}) {
    const results = await prisma.userFavorites.findMany({
      where: convertMongoToPrisma(query),
      select: { [field]: true },
      distinct: [field],
    });
    return results.map(r => r[field]).filter(Boolean);
  }
}

class TransactionAdapter {
  constructor(data = {}) {
    Object.assign(this, data);
    this._isNew = true;
  }

  async save() {
    if (this._isNew) {
      const result = await prisma.transaction.create({ data: this._getData() });
      Object.assign(this, result);
      this._isNew = false;
      return this;
    } else {
      const result = await prisma.transaction.update({
        where: { id: this.id },
        data: this._getData(),
      });
      Object.assign(this, result);
      return this;
    }
  }

  _getData() {
    const { _isNew, id, createdAt, ...data } = this;
    return data;
  }

  static async find(query = {}) {
    const results = await prisma.transaction.findMany({ where: convertMongoToPrisma(query), orderBy: { createdAt: 'desc' } });
    return results.map(r => Object.assign(new TransactionAdapter(r), { _isNew: false }));
  }

  static async findOne(query) {
    const result = await prisma.transaction.findFirst({ where: convertMongoToPrisma(query) });
    return result ? Object.assign(new TransactionAdapter(result), { _isNew: false }) : null;
  }

  static async create(data) {
    const instance = new TransactionAdapter(data);
    return instance.save();
  }

  static async findByIdAndUpdate(id, update) {
    const result = await prisma.transaction.update({ where: { id }, data: update.$set || update });
    return Object.assign(new TransactionAdapter(result), { _isNew: false });
  }

  static async countDocuments(query = {}) {
    return prisma.transaction.count({ where: convertMongoToPrisma(query) });
  }
}

class AgentMemoryAdapter {
  constructor(data = {}) {
    Object.assign(this, data);
    this._isNew = true;
  }

  async save() {
    if (this._isNew) {
      const result = await prisma.agentMemory.create({ data: this._getData() });
      Object.assign(this, result);
      this._isNew = false;
      return this;
    } else {
      const result = await prisma.agentMemory.update({
        where: { id: this.id },
        data: this._getData(),
      });
      Object.assign(this, result);
      return this;
    }
  }

  _getData() {
    const { _isNew, id, createdAt, updatedAt, ...data } = this;
    return data;
  }

  static async find(query = {}) {
    const results = await prisma.agentMemory.findMany({ 
      where: convertMongoToPrisma(query), 
      orderBy: { updatedAt: 'desc' }, 
    });
    return results.map(r => Object.assign(new AgentMemoryAdapter(r), { _isNew: false }));
  }

  static async findOne(query) {
    const result = await prisma.agentMemory.findFirst({ where: convertMongoToPrisma(query) });
    return result ? Object.assign(new AgentMemoryAdapter(result), { _isNew: false }) : null;
  }

  static async create(data) {
    const instance = new AgentMemoryAdapter(data);
    return instance.save();
  }

  static async findByIdAndUpdate(id, update) {
    const result = await prisma.agentMemory.update({ where: { id }, data: update.$set || update });
    return Object.assign(new AgentMemoryAdapter(result), { _isNew: false });
  }

  static async findByIdAndDelete(id) {
    return prisma.agentMemory.delete({ where: { id } });
  }

  static async deleteMany(query) {
    return prisma.agentMemory.deleteMany({ where: convertMongoToPrisma(query) });
  }

  static async countDocuments(query = {}) {
    return prisma.agentMemory.count({ where: convertMongoToPrisma(query) });
  }
}

class AgentFileAdapter {
  constructor(data = {}) {
    Object.assign(this, data);
    this._isNew = true;
  }

  async save() {
    if (this._isNew) {
      const result = await prisma.agentFile.create({ data: this._getData() });
      Object.assign(this, result);
      this._isNew = false;
      return this;
    } else {
      const data = this._getData();
      // Prisma requires relation syntax for agentId in updates
      if ('agentId' in data) {
        const agentIdVal = data.agentId;
        delete data.agentId;
        if (agentIdVal) {
          data.agent = { connect: { agentId: agentIdVal } };
        } else {
          data.agent = { disconnect: true };
        }
      }
      const result = await prisma.agentFile.update({
        where: { id: this.id },
        data,
      });
      Object.assign(this, result);
      return this;
    }
  }

  _getData() {
    const { _isNew, id, createdAt, updatedAt, agent, ...data } = this;
    return data;
  }

  // Mongoose-style toObject
  toObject() {
    const { _isNew, ...data } = this;
    return data;
  }

  static find(query = {}) {
    const promise = prisma.agentFile.findMany({ where: convertMongoToPrisma(query) })
      .then(results => results.map(r => Object.assign(new AgentFileAdapter(r), { _isNew: false })));
    return new QueryBuilder(promise, AgentFileAdapter);
  }

  static async findById(id) {
    const result = await prisma.agentFile.findUnique({ where: { id } });
    return result ? Object.assign(new AgentFileAdapter(result), { _isNew: false }) : null;
  }

  static async findOne(query) {
    const where = {};
    if (query.userId) where.userId = query.userId;
    if (query.path) where.path = query.path;
    if (query.filename) where.filename = query.filename;
    if (query.isDeleted !== undefined) where.isDeleted = query.isDeleted;
    if (query.agentId) where.agentId = query.agentId;
    // Handle Mongoose-style $or queries → Prisma OR
    if (query.$or && Array.isArray(query.$or)) {
      where.OR = query.$or.map(condition => {
        const orWhere = {};
        for (const [key, val] of Object.entries(condition)) {
          if (key !== '$or') orWhere[key] = val;
        }
        return orWhere;
      });
      // Remove individual fields that are part of $or to avoid conflict
      // Keep only userId and isDeleted as top-level AND conditions
      delete where.path;
      delete where.filename;
    }
    const result = await prisma.agentFile.findFirst({ where });
    return result ? Object.assign(new AgentFileAdapter(result), { _isNew: false }) : null;
  }

  static async findOneAndUpdate(query, update, options = {}) {
    const where = {};
    if (query.userId) where.userId = query.userId;
    if (query.path) where.path = query.path;
    if (query.filename) where.filename = query.filename;
    if (query.agentId) where.agentId = query.agentId;
    // Handle $or queries
    if (query.$or && Array.isArray(query.$or)) {
      where.OR = query.$or.map(condition => {
        const orWhere = {};
        for (const [key, val] of Object.entries(condition)) {
          if (key !== '$or') orWhere[key] = val;
        }
        return orWhere;
      });
      delete where.path;
      delete where.filename;
    }
    
    const existing = await prisma.agentFile.findFirst({ where });
    
    if (existing) {
      const updateData = update.$set ? { ...update.$set } : { ...update };
      // Remove any _id field
      delete updateData._id;
      delete updateData.id;
      // Prisma requires relation syntax for agentId in updates
      if ('agentId' in updateData) {
        const agentIdVal = updateData.agentId;
        delete updateData.agentId;
        if (agentIdVal) {
          updateData.agent = { connect: { agentId: agentIdVal } };
        } else {
          updateData.agent = { disconnect: true };
        }
      }
      const result = await prisma.agentFile.update({
        where: { id: existing.id },
        data: updateData,
      });
      return Object.assign(new AgentFileAdapter(result), { _isNew: false });
    } else if (options.upsert) {
      const createData = { ...query, ...(update.$set || update) };
      delete createData._id;
      delete createData.id;
      const result = await prisma.agentFile.create({ data: createData });
      return Object.assign(new AgentFileAdapter(result), { _isNew: false });
    }
    return null;
  }

  static async create(data) {
    const instance = new AgentFileAdapter(data);
    return instance.save();
  }

  static async findByIdAndDelete(id) {
    return prisma.agentFile.delete({ where: { id } });
  }

  static async countDocuments(query = {}) {
    return prisma.agentFile.count({ where: convertMongoToPrisma(query) });
  }
}

class CommunitySuggestionAdapter {
  constructor(data = {}) {
    Object.assign(this, data);
    this._isNew = true;
  }

  async save() {
    if (this._isNew) {
      const result = await prisma.communitySuggestion.create({ data: this._getData() });
      Object.assign(this, result);
      this._isNew = false;
      return this;
    } else {
      const result = await prisma.communitySuggestion.update({
        where: { id: this.id },
        data: this._getData(),
      });
      Object.assign(this, result);
      return this;
    }
  }

  _getData() {
    const { _isNew, id, createdAt, updatedAt, suggestionId, userEmail, userName, isAnonymous, relatedTo, userPriority, tags, votes, ...rest } = this;
    // Map route format to Prisma schema format
    const data = {
      userId: rest.userId || null,
      title: rest.title,
      description: rest.description,
      category: rest.category || 'general',
      status: rest.status || 'pending',
      votes: 0,
    };
    return data;
  }

  static find(query = {}) {
    const promise = prisma.communitySuggestion.findMany({ where: convertMongoToPrisma(query), orderBy: { createdAt: 'desc' } })
      .then(results => results.map(r => Object.assign(new CommunitySuggestionAdapter(r), { _isNew: false })));
    return new QueryBuilder(promise, CommunitySuggestionAdapter);
  }

  static findOne(query) {
    const promise = prisma.communitySuggestion.findFirst({ where: convertMongoToPrisma(query) })
      .then(result => result ? Object.assign(new CommunitySuggestionAdapter(result), { _isNew: false }) : null);
    return new QueryBuilder(promise, CommunitySuggestionAdapter);
  }

  static async findById(id) {
    const result = await prisma.communitySuggestion.findUnique({ where: { id } });
    return result ? Object.assign(new CommunitySuggestionAdapter(result), { _isNew: false }) : null;
  }

  static async create(data) {
    const instance = new CommunitySuggestionAdapter(data);
    return instance.save();
  }

  static async findByIdAndUpdate(id, update) {
    const result = await prisma.communitySuggestion.update({ where: { id }, data: update.$set || update });
    return Object.assign(new CommunitySuggestionAdapter(result), { _isNew: false });
  }

  static async countDocuments(query = {}) {
    return prisma.communitySuggestion.count({ where: convertMongoToPrisma(query) });
  }
}

// ============================================
// TOOL USAGE ADAPTER
// ============================================
class ToolUsageAdapter {
  constructor(data = {}) {
    Object.assign(this, data);
    this._isNew = true;
  }

  async save() {
    if (this._isNew) {
      const result = await prisma.toolUsage.create({ data: this._getData() });
      Object.assign(this, result);
      this._isNew = false;
      return this;
    } else {
      const result = await prisma.toolUsage.update({
        where: { id: this.id },
        data: this._getData(),
      });
      Object.assign(this, result);
      return this;
    }
  }

  _getData() {
    const { _isNew, id, ...data } = this;
    return data;
  }

  static async countDocuments(query = {}) {
    return prisma.toolUsage.count({ where: convertMongoToPrisma(query) });
  }

  static async find(query = {}) {
    const results = await prisma.toolUsage.findMany({ where: convertMongoToPrisma(query), orderBy: { createdAt: 'desc' } });
    return results.map(r => Object.assign(new ToolUsageAdapter(r), { _isNew: false }));
  }

  static async create(data) {
    const instance = new ToolUsageAdapter(data);
    return instance.save();
  }
}

// ============================================
// LAB EXPERIMENT ADAPTER
// Uses AnalyticsEvent to store lab experiments
// ============================================
class LabExperimentAdapter {
  constructor(data = {}) {
    Object.assign(this, data);
    this._isNew = true;
  }

  async save() {
    return LabExperimentAdapter.create(this);
  }

  static async find(query = {}) {
    const where = { eventName: 'lab_experiment' };
    if (query.sessionId) where.sessionId = query.sessionId;
    if (query.userId) where.userId = query.userId;
    const results = await prisma.analyticsEvent.findMany({ 
      where, 
      orderBy: { timestamp: 'desc' }, 
    });
    return results.map(r => Object.assign(new LabExperimentAdapter(r), { _isNew: false }));
  }

  static async findById(id) {
    const result = await prisma.analyticsEvent.findUnique({ where: { id } });
    return result ? Object.assign(new LabExperimentAdapter(result), { _isNew: false }) : null;
  }

  static async create(data) {
    const result = await prisma.analyticsEvent.create({
      data: {
        visitorId: data.visitorId || 'system',
        sessionId: data.sessionId || 'system',
        userId: data.userId,
        eventName: 'lab_experiment',
        eventData: {
          experimentId: data.experimentId,
          experimentType: data.experimentType,
          input: data.input,
          output: data.output,
          status: data.status || 'completed',
          processingTime: data.processingTime,
          tokensUsed: data.tokensUsed,
          costIncurred: data.costIncurred,
          modelUsed: data.modelUsed,
          parameters: data.parameters,
          metadata: data.metadata,
        },
        timestamp: new Date(),
      },
    });
    return Object.assign(new LabExperimentAdapter(result), { _isNew: false });
  }

  static async countDocuments(query = {}) {
    const where = { eventName: 'lab_experiment' };
    if (query.timestamp) where.timestamp = convertMongoToPrisma({ timestamp: query.timestamp }).timestamp;
    return prisma.analyticsEvent.count({ where });
  }

  static async distinct(field, query = {}) {
    const where = { eventName: 'lab_experiment' };
    if (query.timestamp) where.timestamp = convertMongoToPrisma({ timestamp: query.timestamp }).timestamp;
    const events = await prisma.analyticsEvent.findMany({
      where,
      select: { [field]: true },
      distinct: [field],
    });
    return events.map(e => e[field]).filter(Boolean);
  }

  static async aggregate(pipeline) {
    // Simplified aggregation for avg duration
    const events = await prisma.analyticsEvent.findMany({
      where: { eventName: 'lab_experiment' },
    });
    if (pipeline.some(p => p.$group?._id === null)) {
      const durations = events.map(e => e.eventData?.processingTime || 0);
      const avg = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
      return [{ avgDuration: avg }];
    }
    return [];
  }
}

// ============================================
// CONSULTATION ADAPTER
// ============================================
class ConsultationAdapter {
  constructor(data = {}) {
    Object.assign(this, data);
    this._isNew = true;
  }

  async save() {
    if (this._isNew) {
      const result = await prisma.consultation.create({ data: this._getData() });
      Object.assign(this, result);
      this._isNew = false;
      return this;
    } else {
      const result = await prisma.consultation.update({
        where: { id: this.id },
        data: this._getData(),
      });
      Object.assign(this, result);
      return this;
    }
  }

  _getData() {
    const { _isNew, id, createdAt, updatedAt, consultationId, consultationNumber, ...rest } = this;
    // Map route format to Prisma schema format
    // Route sends: { userName, userEmail, userPhone, consultationType, project: { description }, ... }
    // Prisma expects: { name, email, phone, company, topic, description, ... }
    const data = {
      name: rest.userName || rest.name,
      email: rest.userEmail || rest.email,
      phone: rest.userPhone || rest.phone || null,
      company: rest.company?.name || rest.company || null,
      topic: rest.consultationType || rest.topic || 'General',
      description: rest.project?.description || rest.description || null,
      preferredDate: rest.preferredDates?.[0] ? new Date(rest.preferredDates[0]) : null,
      timezone: rest.timezone || null,
      status: rest.status || 'requested',
      notes: rest.notes || null,
    };
    return data;
  }

  static async find(query = {}) {
    const results = await prisma.consultation.findMany({ 
      where: convertMongoToPrisma(query), 
      orderBy: { createdAt: 'desc' }, 
    });
    return results.map(r => Object.assign(new ConsultationAdapter(r), { _isNew: false }));
  }

  static async findById(id) {
    const result = await prisma.consultation.findUnique({ where: { id } });
    return result ? Object.assign(new ConsultationAdapter(result), { _isNew: false }) : null;
  }

  static async create(data) {
    const instance = new ConsultationAdapter(data);
    return instance.save();
  }

  static async findByIdAndUpdate(id, update) {
    const result = await prisma.consultation.update({ 
      where: { id }, 
      data: update.$set || update, 
    });
    return Object.assign(new ConsultationAdapter(result), { _isNew: false });
  }

  static async countDocuments(query = {}) {
    return prisma.consultation.count({ where: convertMongoToPrisma(query) });
  }
}

// ============================================
// ADDITIONAL COMMUNITY ADAPTERS
// ============================================
class CommunityGroupAdapter {
  constructor(data = {}) {
    Object.assign(this, data);
    this._isNew = true;
  }

  async save() {
    if (this._isNew) {
      const result = await prisma.communityGroup.create({ data: this._getData() });
      Object.assign(this, result);
      this._isNew = false;
      return this;
    } else {
      const result = await prisma.communityGroup.update({
        where: { id: this.id },
        data: this._getData(),
      });
      Object.assign(this, result);
      return this;
    }
  }

  _getData() {
    const { _isNew, id, createdAt, updatedAt, memberships, ...data } = this;
    return data;
  }

  static async find(query = {}) {
    const results = await prisma.communityGroup.findMany({ 
      where: convertMongoToPrisma(query), 
      include: { memberships: true },
      orderBy: { createdAt: 'desc' } 
    });
    return results.map(r => Object.assign(new CommunityGroupAdapter(r), { _isNew: false }));
  }

  static async findById(id) {
    const result = await prisma.communityGroup.findUnique({ 
      where: { id },
      include: { memberships: true } 
    });
    return result ? Object.assign(new CommunityGroupAdapter(result), { _isNew: false }) : null;
  }

  static async findOne(query) {
    const result = await prisma.communityGroup.findFirst({ where: convertMongoToPrisma(query) });
    return result ? Object.assign(new CommunityGroupAdapter(result), { _isNew: false }) : null;
  }

  static async create(data) {
    const instance = new CommunityGroupAdapter(data);
    return instance.save();
  }

  static async findByIdAndUpdate(id, update) {
    const result = await prisma.communityGroup.update({ where: { id }, data: update.$set || update });
    return Object.assign(new CommunityGroupAdapter(result), { _isNew: false });
  }

  static async findByIdAndDelete(id) {
    return prisma.communityGroup.delete({ where: { id } });
  }

  static async countDocuments(query = {}) {
    return prisma.communityGroup.count({ where: convertMongoToPrisma(query) });
  }
}

class CommunityMembershipAdapter {
  constructor(data = {}) {
    Object.assign(this, data);
    this._isNew = true;
  }

  async save() {
    if (this._isNew) {
      const result = await prisma.communityMembership.create({ data: this._getData() });
      Object.assign(this, result);
      this._isNew = false;
      return this;
    } else {
      const result = await prisma.communityMembership.update({
        where: { id: this.id },
        data: this._getData(),
      });
      Object.assign(this, result);
      return this;
    }
  }

  _getData() {
    const { _isNew, id, createdAt, user, group, ...data } = this;
    return data;
  }

  static async find(query = {}) {
    const results = await prisma.communityMembership.findMany({ 
      where: convertMongoToPrisma(query), 
      include: { user: true, group: true },
      orderBy: { createdAt: 'desc' } 
    });
    return results.map(r => Object.assign(new CommunityMembershipAdapter(r), { _isNew: false }));
  }

  static async findOne(query) {
    const result = await prisma.communityMembership.findFirst({ where: convertMongoToPrisma(query) });
    return result ? Object.assign(new CommunityMembershipAdapter(result), { _isNew: false }) : null;
  }

  static async create(data) {
    const instance = new CommunityMembershipAdapter(data);
    return instance.save();
  }

  static async findByIdAndDelete(id) {
    return prisma.communityMembership.delete({ where: { id } });
  }

  static async countDocuments(query = {}) {
    return prisma.communityMembership.count({ where: convertMongoToPrisma(query) });
  }
}

class CommunityEventAdapter {
  constructor(data = {}) {
    Object.assign(this, data);
    this._isNew = true;
  }

  async save() {
    if (this._isNew) {
      const result = await prisma.communityEvent.create({ data: this._getData() });
      Object.assign(this, result);
      this._isNew = false;
      return this;
    } else {
      const result = await prisma.communityEvent.update({
        where: { id: this.id },
        data: this._getData(),
      });
      Object.assign(this, result);
      return this;
    }
  }

  _getData() {
    const { _isNew, id, createdAt, updatedAt, ...data } = this;
    return data;
  }

  static async find(query = {}) {
    const results = await prisma.communityEvent.findMany({ 
      where: convertMongoToPrisma(query), 
      orderBy: { startTime: 'asc' } 
    });
    return results.map(r => Object.assign(new CommunityEventAdapter(r), { _isNew: false }));
  }

  static async findById(id) {
    const result = await prisma.communityEvent.findUnique({ where: { id } });
    return result ? Object.assign(new CommunityEventAdapter(result), { _isNew: false }) : null;
  }

  static async findOne(query) {
    const result = await prisma.communityEvent.findFirst({ where: convertMongoToPrisma(query) });
    return result ? Object.assign(new CommunityEventAdapter(result), { _isNew: false }) : null;
  }

  static async create(data) {
    const instance = new CommunityEventAdapter(data);
    return instance.save();
  }

  static async findByIdAndUpdate(id, update) {
    const result = await prisma.communityEvent.update({ where: { id }, data: update.$set || update });
    return Object.assign(new CommunityEventAdapter(result), { _isNew: false });
  }

  static async findByIdAndDelete(id) {
    return prisma.communityEvent.delete({ where: { id } });
  }

  static async countDocuments(query = {}) {
    return prisma.communityEvent.count({ where: convertMongoToPrisma(query) });
  }
}

class CommunityModerationAdapter {
  constructor(data = {}) {
    Object.assign(this, data);
    this._isNew = true;
  }

  async save() {
    if (this._isNew) {
      const result = await prisma.communityModeration.create({ data: this._getData() });
      Object.assign(this, result);
      this._isNew = false;
      return this;
    } else {
      const result = await prisma.communityModeration.update({
        where: { id: this.id },
        data: this._getData(),
      });
      Object.assign(this, result);
      return this;
    }
  }

  _getData() {
    const { _isNew, id, createdAt, updatedAt, ...data } = this;
    return data;
  }

  static async find(query = {}) {
    const results = await prisma.communityModeration.findMany({ 
      where: convertMongoToPrisma(query), 
      orderBy: { createdAt: 'desc' } 
    });
    return results.map(r => Object.assign(new CommunityModerationAdapter(r), { _isNew: false }));
  }

  static async findById(id) {
    const result = await prisma.communityModeration.findUnique({ where: { id } });
    return result ? Object.assign(new CommunityModerationAdapter(result), { _isNew: false }) : null;
  }

  static async findOne(query) {
    const result = await prisma.communityModeration.findFirst({ where: convertMongoToPrisma(query) });
    return result ? Object.assign(new CommunityModerationAdapter(result), { _isNew: false }) : null;
  }

  static async create(data) {
    const instance = new CommunityModerationAdapter(data);
    return instance.save();
  }

  static async findByIdAndUpdate(id, update) {
    const result = await prisma.communityModeration.update({ where: { id }, data: update.$set || update });
    return Object.assign(new CommunityModerationAdapter(result), { _isNew: false });
  }

  static async countDocuments(query = {}) {
    return prisma.communityModeration.count({ where: convertMongoToPrisma(query) });
  }
}

class CommunityMetricsAdapter {
  constructor(data = {}) {
    Object.assign(this, data);
    this._isNew = true;
  }

  async save() {
    if (this._isNew) {
      const result = await prisma.communityMetrics.create({ data: this._getData() });
      Object.assign(this, result);
      this._isNew = false;
      return this;
    } else {
      const result = await prisma.communityMetrics.update({
        where: { id: this.id },
        data: this._getData(),
      });
      Object.assign(this, result);
      return this;
    }
  }

  _getData() {
    const { _isNew, id, createdAt, ...data } = this;
    return data;
  }

  static async find(query = {}) {
    const results = await prisma.communityMetrics.findMany({ 
      where: convertMongoToPrisma(query), 
      orderBy: { createdAt: 'desc' } 
    });
    return results.map(r => Object.assign(new CommunityMetricsAdapter(r), { _isNew: false }));
  }

  static async findOne(query) {
    const result = await prisma.communityMetrics.findFirst({ where: convertMongoToPrisma(query) });
    return result ? Object.assign(new CommunityMetricsAdapter(result), { _isNew: false }) : null;
  }

  static async create(data) {
    const instance = new CommunityMetricsAdapter(data);
    return instance.save();
  }

  static async findByIdAndUpdate(id, update) {
    const result = await prisma.communityMetrics.update({ where: { id }, data: update.$set || update });
    return Object.assign(new CommunityMetricsAdapter(result), { _isNew: false });
  }

  static async countDocuments(query = {}) {
    return prisma.communityMetrics.count({ where: convertMongoToPrisma(query) });
  }
}

// ============================================
// EXPORTS - PRISMA MODEL INTERFACE
// ============================================

export const User = UserAdapter;
export const Agent = AgentAdapter;
export const ChatSession = ChatSessionAdapter;
export const ChatSettings = ChatSettingsAdapter;
export const ChatFeedback = ChatFeedbackAdapter;
export const ChatQuickAction = ChatQuickActionAdapter;
export const ChatCanvasProject = ChatCanvasProjectAdapter;
export const ChatCanvasFile = ChatCanvasFileAdapter;
export const ChatCanvasHistory = ChatCanvasHistoryAdapter;
export const ChatInteraction = ChatInteractionAdapter;

// Analytics
export const Visitor = VisitorAdapter;
export const Session = SessionAdapter;
export const PageView = PageViewAdapter;
export const UserEvent = UserEventAdapter;
export const ApiUsage = ApiUsageAdapter;
export const ToolUsage = ToolUsageAdapter;

// Support
export const SupportTicket = SupportTicketAdapter;
export const ContactMessage = ContactMessageAdapter;
export const Consultation = ConsultationAdapter;

// Community  
export const CommunityPost = CommunityPostAdapter;
export const CommunityComment = CommunityCommentAdapter;
export const CommunityLike = CommunityLikeAdapter;
export const CommunityGroup = CommunityGroupAdapter;
export const CommunityMembership = CommunityMembershipAdapter;
export const CommunityEvent = CommunityEventAdapter;
export const CommunityModeration = CommunityModerationAdapter;
export const CommunityMetrics = CommunityMetricsAdapter;

// Lab
export const LabExperiment = LabExperimentAdapter;

// Other
export const JobApplication = JobApplicationAdapter;
export const WebinarRegistration = WebinarRegistrationAdapter;
export const UserFavorites = UserFavoritesAdapter;
export const Transaction = TransactionAdapter;
export const AgentMemory = AgentMemoryAdapter;
export const AgentFile = AgentFileAdapter;
export const CommunitySuggestion = CommunitySuggestionAdapter;

// Default export for index.js imports
export default {
  User,
  Agent,
  ChatSession,
  ChatSettings,
  ChatFeedback,
  ChatQuickAction,
  ChatCanvasProject,
  ChatCanvasFile,
  ChatCanvasHistory,
  ChatInteraction,
  Visitor,
  Session,
  PageView,
  UserEvent,
  ApiUsage,
  ToolUsage,
  SupportTicket,
  ContactMessage,
  Consultation,
  CommunityPost,
  CommunityComment,
  CommunityLike,
  CommunityGroup,
  CommunityMembership,
  CommunityEvent,
  CommunityModeration,
  CommunityMetrics,
  LabExperiment,
  JobApplication,
  WebinarRegistration,
  UserFavorites,
  Transaction,
  AgentMemory,
  AgentFile,
  CommunitySuggestion,
};
