/**
 * Database Query Optimization Utilities
 *
 * Provides utilities for optimizing Prisma queries including:
 * - Field selection optimization
 * - Query batching
 * - Connection pooling helpers
 *
 * Requirements: Performance considerations
 */

import { Prisma } from '@prisma/client';

/**
 * Common field selections for User queries
 * Use these to avoid fetching unnecessary fields
 */
export const UserSelect = {
  // Minimal user data for lists
  minimal: {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
  } satisfies Prisma.UserSelect,

  // Basic user profile
  profile: {
    id: true,
    email: true,
    emailVerified: true,
    firstName: true,
    lastName: true,
    phoneNumber: true,
    language: true,
    role: true,
    status: true,
    currentWorkspaceId: true,
    lastSeenAt: true,
    createdAt: true,
    updatedAt: true,
  } satisfies Prisma.UserSelect,

  // User with current workspace
  withWorkspace: {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    currentWorkspaceId: true,
    currentWorkspace: {
      select: {
        id: true,
        name: true,
        creditCount: true,
      },
    },
  } satisfies Prisma.UserSelect,
} as const;

/**
 * Common field selections for Workspace queries
 */
export const WorkspaceSelect = {
  // Minimal workspace data
  minimal: {
    id: true,
    name: true,
    ownerId: true,
  } satisfies Prisma.WorkspaceSelect,

  // Workspace with credit info
  withCredits: {
    id: true,
    name: true,
    ownerId: true,
    creditCount: true,
    allocatedCredits: true,
    isTrialed: true,
  } satisfies Prisma.WorkspaceSelect,

  // Workspace with owner info
  withOwner: {
    id: true,
    name: true,
    ownerId: true,
    creditCount: true,
    owner: {
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    },
  } satisfies Prisma.WorkspaceSelect,
} as const;

/**
 * Common field selections for Session queries
 */
export const SessionSelect = {
  // Minimal session data
  minimal: {
    id: true,
    sessionToken: true,
    userId: true,
    expires: true,
  } satisfies Prisma.SessionSelect,

  // Session with user info
  withUser: {
    id: true,
    sessionToken: true,
    userId: true,
    expires: true,
    user: {
      select: UserSelect.profile,
    },
  } satisfies Prisma.SessionSelect,
} as const;

/**
 * Query batching utility
 * Batches multiple queries to execute in parallel
 */
export class QueryBatcher {
  private queries: Array<() => Promise<any>> = [];

  /**
   * Add a query to the batch
   */
  add<T>(query: () => Promise<T>): this {
    this.queries.push(query);
    return this;
  }

  /**
   * Execute all queries in parallel
   */
  async execute<T extends any[]>(): Promise<T> {
    const results = await Promise.all(this.queries.map((q) => q()));
    this.queries = []; // Clear batch after execution
    return results as T;
  }

  /**
   * Execute all queries in parallel with error handling
   * Returns results with errors as null
   */
  async executeSettled<T extends any[]>(): Promise<Array<T[number] | null>> {
    const results = await Promise.allSettled(this.queries.map((q) => q()));
    this.queries = []; // Clear batch after execution

    return results.map((result) =>
      result.status === 'fulfilled' ? (result.value as T[number]) : null
    );
  }
}

/**
 * Create a new query batcher
 */
export function createBatcher(): QueryBatcher {
  return new QueryBatcher();
}

/**
 * Pagination helper
 * Calculates skip and take values for pagination
 */
export function getPaginationParams(page: number, pageSize: number = 20) {
  const normalizedPage = Math.max(1, page);
  const normalizedPageSize = Math.min(100, Math.max(1, pageSize)); // Max 100 items per page

  return {
    skip: (normalizedPage - 1) * normalizedPageSize,
    take: normalizedPageSize,
  };
}

/**
 * Cursor-based pagination helper
 * More efficient for large datasets
 */
export function getCursorPaginationParams(
  cursor: string | null,
  pageSize: number = 20
) {
  const normalizedPageSize = Math.min(100, Math.max(1, pageSize));

  return {
    take: normalizedPageSize,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  };
}

/**
 * Query optimization middleware
 * Wraps Prisma queries with performance monitoring and optimization
 */
export function withQueryOptimization<T>(
  queryName: string,
  query: () => Promise<T>,
  options?: {
    cache?: boolean;
    cacheTTL?: number;
    logSlowQueries?: boolean;
    slowQueryThreshold?: number;
  }
): Promise<T> {
  const {
    logSlowQueries = true,
    slowQueryThreshold = 1000, // 1 second
  } = options || {};

  return new Promise(async (resolve, reject) => {
    const startTime = performance.now();

    try {
      const result = await query();
      const duration = performance.now() - startTime;

      // Log slow queries in development
      if (logSlowQueries && duration > slowQueryThreshold) {
        console.warn(
          `[Slow Query] ${queryName} took ${duration.toFixed(2)}ms (threshold: ${slowQueryThreshold}ms)`
        );
      }

      // Log all queries in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Query] ${queryName}: ${duration.toFixed(2)}ms`);
      }

      resolve(result);
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(
        `[Query Error] ${queryName} failed after ${duration.toFixed(2)}ms:`,
        error
      );
      reject(error);
    }
  });
}

/**
 * Batch load utility for N+1 query prevention
 * Groups multiple queries into a single database call
 */
export class DataLoader<K, V> {
  private cache = new Map<K, Promise<V>>();
  private queue: K[] = [];
  private batchScheduled = false;

  constructor(
    private batchLoadFn: (keys: K[]) => Promise<V[]>,
    private options?: {
      cache?: boolean;
      maxBatchSize?: number;
      batchScheduleFn?: (callback: () => void) => void;
    }
  ) {}

  async load(key: K): Promise<V> {
    // Check cache first
    if (this.options?.cache !== false) {
      const cached = this.cache.get(key);
      if (cached) {
        return cached;
      }
    }

    // Create promise for this key
    const promise = new Promise<V>((_resolve, reject) => {
      this.queue.push(key);

      // Schedule batch if not already scheduled
      if (!this.batchScheduled) {
        this.batchScheduled = true;
        const scheduleFn = this.options?.batchScheduleFn || setImmediate;
        scheduleFn(() => this.dispatchBatch().catch(reject));
      }
    });

    // Cache the promise
    if (this.options?.cache !== false) {
      this.cache.set(key, promise);
    }

    return promise;
  }

  private async dispatchBatch(): Promise<void> {
    this.batchScheduled = false;
    const keys = this.queue.splice(0);

    if (keys.length === 0) {
      return;
    }

    try {
      const values = await this.batchLoadFn(keys);

      // Resolve all promises
      keys.forEach((key, index) => {
        const promise = this.cache.get(key);
        if (promise) {
          // Resolve the promise with the value
          const value = values[index];
          if (value !== undefined) {
            // Update cache with resolved value
            this.cache.set(key, Promise.resolve(value));
          }
        }
      });
    } catch (error) {
      // Reject all promises
      keys.forEach((key) => {
        this.cache.delete(key);
      });
      throw error;
    }
  }

  clear(key?: K): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

/**
 * Create a data loader for batch loading
 */
export function createDataLoader<K, V>(
  batchLoadFn: (keys: K[]) => Promise<V[]>,
  options?: {
    cache?: boolean;
    maxBatchSize?: number;
  }
): DataLoader<K, V> {
  return new DataLoader(batchLoadFn, options);
}

/**
 * Query result cache for frequently accessed data
 * Reduces database load for hot queries
 */
export class QueryCache {
  private cache = new Map<string, { value: any; expires: number }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(private defaultTTL: number = 60) {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  /**
   * Get cached query result
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Cache query result
   */
  set<T>(key: string, value: T, ttlSeconds?: number): void {
    const ttl = ttlSeconds ?? this.defaultTTL;
    const expires = Date.now() + ttl * 1000;

    this.cache.set(key, { value, expires });
  }

  /**
   * Execute query with caching
   */
  async cached<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttlSeconds?: number
  ): Promise<T> {
    // Check cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Execute query
    const result = await queryFn();

    // Cache result
    this.set(key, result, ttlSeconds);

    return result;
  }

  /**
   * Invalidate cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern.replace('*', '.*'));

    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now > entry.expires) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

/**
 * Global query cache instance
 */
let queryCacheInstance: QueryCache | null = null;

export function getQueryCache(): QueryCache {
  if (!queryCacheInstance) {
    queryCacheInstance = new QueryCache();
  }
  return queryCacheInstance;
}

/**
 * Optimized query execution with automatic caching
 */
export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttlSeconds: number = 60
): Promise<T> {
  const cache = getQueryCache();
  return cache.cached(key, queryFn, ttlSeconds);
}
