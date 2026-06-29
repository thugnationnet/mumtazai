/**
 * PRISMA CLIENT FOR FRONTEND API ROUTES
 * Re-exports from @mumtazai/database (single source of truth)
 *
 * All 56 models available — frontend routes use whichever they need.
 * Schema lives in: packages/database/prisma/schema.prisma
 */

// @ts-expect-error — JS package, types come from generated @prisma/client
export { prisma, connectDatabase, disconnectDatabase } from '@mumtazai/database';
// @ts-expect-error — JS package
import prismaDefault from '@mumtazai/database';
export default prismaDefault;
