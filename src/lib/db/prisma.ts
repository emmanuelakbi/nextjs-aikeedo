import { PrismaClient } from '@prisma/client';
import { Pool } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool as PgPool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

let prismaInstance: PrismaClient | null = null;

const prismaClientSingleton = () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Use Neon adapter only for Neon databases
  const isNeonDatabase = databaseUrl.includes('neon.tech');

  if (isNeonDatabase) {
    // Create connection pool for Neon
    const pool = new Pool({ connectionString: databaseUrl });
    const adapter = new PrismaNeon(pool as any) as any;

    return new PrismaClient({
      adapter,
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'error', 'warn']
          : ['error', 'warn'],
    });
  }

  // Use pg adapter for local PostgreSQL
  const pool = new PgPool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool) as any;

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error', 'warn'],
  });
};

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: undefined | PrismaClient;
}

// Lazy initialization - create client on first access
const getPrismaClient = () => {
  if (globalThis.prismaGlobal) {
    return globalThis.prismaGlobal;
  }

  if (!prismaInstance) {
    prismaInstance = prismaClientSingleton();
    if (process.env.NODE_ENV !== 'production') {
      globalThis.prismaGlobal = prismaInstance;
    }
  }

  return prismaInstance;
};

// Export a Proxy that lazily initializes the client
const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    return client[prop as keyof PrismaClient];
  },
});

export default prisma;
export { prisma };
