/**
 * AgentFile — Prisma-based file model for canvas-studio-backend
 *
 * Wraps prisma.agentFile with convenient static methods
 * (findOne, find, create, etc.) and an instance save() pattern
 * so existing service code can remain unchanged.
 *
 * NO Mongoose dependency — pure Prisma under the hood.
 */

import { prisma } from '../lib/prisma.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Translate Mongo-style query object → Prisma `where` clause */
function buildWhere(query) {
  const where = {};
  for (const [key, value] of Object.entries(query)) {
    if (key === '$or' && Array.isArray(value)) {
      where.OR = value.map(c => buildWhere(c));
      continue;
    }
    if (key === '$and' && Array.isArray(value)) {
      where.AND = value.map(c => buildWhere(c));
      continue;
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const op = {};
      if (value.$gte) op.gte = value.$gte;
      if (value.$lte) op.lte = value.$lte;
      if (value.$gt) op.gt = value.$gt;
      if (value.$lt) op.lt = value.$lt;
      if (value.$ne) op.not = value.$ne;
      if (value.$in) op.in = value.$in;
      if (value.$regex) {
        const pattern = value.$regex.toString();
        if (pattern.startsWith('^')) op.startsWith = pattern.slice(1);
        else if (pattern.endsWith('$')) op.endsWith = pattern.slice(0, -1);
        else op.contains = pattern;
      }
      if (value.$exists !== undefined) continue; // skip — different paradigm
      if (Object.keys(op).length > 0) {
        where[key] = op;
      } else {
        where[key] = value;
      }
    } else {
      where[key] = value;
    }
  }
  return where;
}

/** Chainable query builder for .sort()/.limit()/.skip()/.lean() */
class QueryBuilder {
  constructor(promise) {
    this._promise = promise;
    this._sort = null;
    this._limit = null;
    this._skip = null;
  }
  sort(opts) { this._sort = opts; return this; }
  limit(n) { this._limit = parseInt(n); return this; }
  skip(n) { this._skip = parseInt(n); return this; }
  lean() { return this; }
  select() { return this; }
  populate() { return this; }

  async then(resolve, reject) {
    try {
      let rows = await this._promise;
      if (this._sort) {
        rows = [...rows].sort((a, b) => {
          for (const [field, dir] of Object.entries(this._sort)) {
            const d = dir === -1 || dir === 'desc' ? -1 : 1;
            if (a[field] < b[field]) return -1 * d;
            if (a[field] > b[field]) return 1 * d;
          }
          return 0;
        });
      }
      if (this._skip) rows = rows.slice(this._skip);
      if (this._limit) rows = rows.slice(0, this._limit);
      resolve(rows);
    } catch (err) { reject(err); }
  }
}

// ---------------------------------------------------------------------------
// AgentFile class — Prisma wrapper
// ---------------------------------------------------------------------------

class AgentFile {
  constructor(data = {}) {
    Object.assign(this, data);
    this._isNew = true;
  }

  /** Persist (create or update) */
  async save() {
    const data = this._toData();
    if (this._isNew) {
      const row = await prisma.agentFile.create({ data });
      Object.assign(this, row);
      this._isNew = false;
    } else {
      const row = await prisma.agentFile.update({ where: { id: this.id }, data });
      Object.assign(this, row);
    }
    return this;
  }

  /** Strip internal / auto-managed fields before write */
  _toData() {
    const { _isNew, id, createdAt, updatedAt, agent, type, ...rest } = this;
    return rest;
  }

  toObject() {
    const { _isNew, ...data } = this;
    return data;
  }

  // --- Static query methods ------------------------------------------------

  static find(query = {}) {
    const where = buildWhere(query);
    const promise = prisma.agentFile.findMany({ where });
    return new QueryBuilder(promise);
  }

  static async findById(id) {
    return prisma.agentFile.findUnique({ where: { id } });
  }

  static async findOne(query) {
    const where = buildWhere(query);
    return prisma.agentFile.findFirst({ where });
  }

  static async create(data) {
    const instance = new AgentFile(data);
    return instance.save();
  }

  static async findByIdAndDelete(id) {
    return prisma.agentFile.delete({ where: { id } });
  }

  static async countDocuments(query = {}) {
    return prisma.agentFile.count({ where: buildWhere(query) });
  }
}

export default AgentFile;
export { AgentFile };
