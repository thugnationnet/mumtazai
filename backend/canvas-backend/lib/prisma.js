// Prisma client singleton — Canvas Build Backend
import { PrismaClient } from '../node_modules/.prisma/canvas-client/index.js';

const globalForPrisma = global;

export const prisma = globalForPrisma.__canvasPrisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__canvasPrisma = prisma;
}

export default prisma;
