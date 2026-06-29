/**
 * DATABASE UTILITIES - PRISMA/POSTGRESQL
 * AI Studio Demo Backend — Standalone
 * Uses AI_STUDIO_DEMO_DATABASE_URL for database isolation
 * Note: Env vars must be loaded before this module is imported (use preload.js)
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;
const dbUrl = process.env.AI_STUDIO_DEMO_DATABASE_URL || process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('⚠️ WARNING: No database URL found (AI_STUDIO_DEMO_DATABASE_URL or DATABASE_URL)');
}
const prisma = globalForPrisma.__ai_studio_demo_prisma ?? new PrismaClient({
  datasources: { db: { url: dbUrl } },
  log: process.env.NODE_ENV === 'development' ? ['query','error','warn'] : ['error'],
});
if (process.env.NODE_ENV !== 'production') globalForPrisma.__ai_studio_demo_prisma = prisma;

async function connectDatabase() {
  await prisma.$connect();
  console.log('✅ AI Studio Demo DB connected');
}
async function disconnectDatabase() {
  await prisma.$disconnect();
  console.log('📴 AI Studio Demo DB disconnected');
}

export { prisma, connectDatabase, disconnectDatabase };

// ============================================
// HEALTH CHECK
// ============================================

export const healthCheck = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'healthy',
      database: 'postgresql',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      database: 'postgresql',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

// ============================================
// QUERY HELPERS
// ============================================

export const queryOptimizer = {
  // Pagination helper
  paginate: (page = 1, limit = 20) => ({
    skip: (page - 1) * limit,
    take: limit,
  }),

  // Count with pagination metadata
  withPagination: async (model, { page = 1, limit = 20, where = {}, orderBy = { createdAt: 'desc' }, include = {} }) => {
    const [items, total] = await Promise.all([
      prisma[model].findMany({
        where,
        orderBy,
        include,
        ...queryOptimizer.paginate(page, limit),
      }),
      prisma[model].count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  },

  // Soft delete helper
  softDelete: async (model, id) => {
    return prisma[model].update({
      where: { id },
      data: { 
        isActive: false,
        updatedAt: new Date(),
      },
    });
  },
};

// ============================================
// TRANSACTION HELPERS
// ============================================

export const withTransaction = async (fn) => {
  return prisma.$transaction(fn);
};

// ============================================
// ERROR HANDLING
// ============================================

export const handlePrismaError = (error) => {
  // Prisma error codes: https://www.prisma.io/docs/reference/api-reference/error-reference
  
  switch (error.code) {
  case 'P2002':
    // Unique constraint violation
    return {
      status: 409,
      message: 'A record with this value already exists',
      field: error.meta?.target?.[0],
    };
    
  case 'P2025':
    // Record not found
    return {
      status: 404,
      message: 'Record not found',
    };
    
  case 'P2003':
    // Foreign key constraint violation
    return {
      status: 400,
      message: 'Referenced record does not exist',
    };
    
  case 'P2014':
    // Relation violation
    return {
      status: 400,
      message: 'Invalid relation',
    };
    
  default:
    return {
      status: 500,
      message: 'Database error',
      error: error.message,
    };
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Generate a unique session ID
export const generateSessionId = () => {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

// Generate a unique transaction ID
export const generateTransactionId = () => {
  return `txn_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

// Generate a unique visitor ID
export const generateVisitorId = () => {
  return `vis_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

// ============================================
// BACKWARDS COMPATIBILITY EXPORTS
// ============================================

// For existing code that imports connectionConfig
export const connectionConfig = {
  options: {},
  monitorConnection: () => {
    console.log('✅ Using Prisma - connection monitoring handled automatically');
  },
};

// For existing code that imports indexManager
export const indexManager = {
  ensureIndexes: async () => {
    console.log('✅ Using Prisma - indexes managed via schema.prisma');
  },
  getRecommendedIndexes: () => [],
};

// Default export
export default {
  prisma,
  connectDatabase,
  disconnectDatabase,
  healthCheck,
  queryOptimizer,
  withTransaction,
  handlePrismaError,
  generateSessionId,
  generateTransactionId,
  generateVisitorId,
  connectionConfig,
  indexManager,
};
