/**
 * Test Database Utilities
 *
 * Provides utilities for managing test database connections and transactions
 */

import { PrismaClient } from '@prisma/client';

let prismaInstance: PrismaClient | null = null;

/**
 * Get or create a Prisma client instance for testing
 */
export function getTestPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
  }
  return prismaInstance;
}

/**
 * Close the test Prisma client connection
 */
export async function closeTestPrismaClient(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
}

/**
 * Reset the test database by truncating all tables
 * This is faster than deleting all records individually
 */
export async function resetTestDatabase(prisma: PrismaClient): Promise<void> {
  // Get all table names
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  `;

  // Truncate all tables except _prisma_migrations
  for (const { tablename } of tables) {
    if (tablename !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(
          `TRUNCATE TABLE "${tablename}" CASCADE;`
        );
      } catch (error) {
        console.warn(`Failed to truncate table ${tablename}:`, error);
      }
    }
  }
}

/**
 * Execute a function within a database transaction that will be rolled back
 * Useful for isolated test cases
 */
export async function withTransaction<T>(
  prisma: PrismaClient,
  fn: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    return await fn(tx as PrismaClient);
  });
}
