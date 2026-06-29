/**
 * CANVAS APP BACKEND — Prisma Client (Standalone)
 * 
 * Separate database for the canvas-app product.
 * Uses CANVAS_APP_DATABASE_URL from .env.
 * 
 * Usage:
 *   import { prisma, connectDatabase, disconnectDatabase } from './prisma.js';
 */

import { PrismaClient } from '@prisma/client';

// Prevent multiple PrismaClient instances in development (hot-reload safe)
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__canvas_app_prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['error', 'warn']
      : ['error'],
    errorFormat: 'pretty',
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__canvas_app_prisma = prisma;
}

// Re-export PrismaClient class for type usage
export { PrismaClient };

// Connection helpers
export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Canvas-App PostgreSQL connected via Prisma');
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
