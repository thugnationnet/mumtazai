/**
 * TOOLS BACKEND - DATABASE UTILITIES (PRISMA/POSTGRESQL)
 * Standalone PrismaClient for mumtazai database
 */

import { PrismaClient } from '@prisma/client';

// Prevent multiple PrismaClient instances in development (hot reload)
const globalForPrisma = globalThis;
const prisma = globalForPrisma.__tools_prisma ?? new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});
if (process.env.NODE_ENV !== 'production') globalForPrisma.__tools_prisma = prisma;

export { prisma };

async function connectDatabase() {
  await prisma.$connect();
  console.log('✅ Tools DB connected (PostgreSQL/Prisma)');
}

async function disconnectDatabase() {
  await prisma.$disconnect();
  console.log('🔌 Tools DB disconnected');
}

export { connectDatabase, disconnectDatabase };

