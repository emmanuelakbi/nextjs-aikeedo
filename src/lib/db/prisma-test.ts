import { PrismaClient } from '@prisma/client';

/**
 * Test Prisma Client
 *
 * Simplified Prisma client for testing without Neon adapter
 */

let prismaInstance: PrismaClient | null = null;

const prismaClientSingleton = () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  return new PrismaClient({
    log: ['error', 'warn'],
  });
};

declare global {
  // eslint-disable-next-line no-var
  var prismaTestGlobal: undefined | PrismaClient;
}

// Lazy initialization - create client on first access
const getPrismaClient = () => {
  if (globalThis.prismaTestGlobal) {
    return globalThis.prismaTestGlobal;
  }

  if (!prismaInstance) {
    prismaInstance = prismaClientSingleton();
    globalThis.prismaTestGlobal = prismaInstance;
  }

  return prismaInstance;
};

// Export a Proxy that lazily initializes the client
const prismaTest = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    return client[prop as keyof PrismaClient];
  },
});

export default prismaTest;
