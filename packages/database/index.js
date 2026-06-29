/**
 * @mumtazai/database — Shared Prisma Client
 * 
 * Single source of truth for database access.
 * Both frontend (Next.js) and backend (Express) import from here.
 * 
 * Usage:
 *   import { prisma, PrismaClient } from '@mumtazai/database';
 */

import { PrismaClient } from '@prisma/client';

// Prevent multiple PrismaClient instances in development (hot-reload safe)
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__mumtazai_prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['error', 'warn']
      : ['error'],
    errorFormat: 'pretty',
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__mumtazai_prisma = prisma;
}

// Re-export PrismaClient class for type usage
export { PrismaClient };

// Connection helpers
export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL connected via Prisma (@mumtazai/database)');
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection error:', error);
    throw error;
  }
};

export const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect();
    console.log('✅ PostgreSQL disconnected');
  } catch (error) {
    console.error('❌ Error disconnecting from PostgreSQL:', error);
  }
};

export default prisma;
