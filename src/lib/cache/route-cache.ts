/**
 * Route-level Caching Utilities
 *
 * Provides caching for API routes and server components:
 * - Response caching with revalidation
 * - Conditional caching based on user/workspace
 * - Cache invalidation strategies
 *
 * Requirements: Performance considerations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCache, CacheOptions } from './cache-manager';

/**
 * Cache configuration for routes
 */
export interface RouteCacheConfig {
  /**
   * Cache key generator function
   */
  keyGenerator: (req: NextRequest) => string;

  /**
   * Time to live in seconds
   */
  ttl?: number;

  /**
   * Cache tags for invalidation
   */
  tags?: string[];

  /**
   * Whether to cache based on user
   */
  perUser?: boolean;

  /**
   * Whether to cache based on workspace
   */
  perWorkspace?: boolean;

  /**
   * Condition to determine if response should be cached
   */
  shouldCache?: (response: NextResponse) => boolean;
}

/**
 * Wrap an API route handler with caching
 */
export function withRouteCache(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: RouteCacheConfig
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const cache = getCache();

    // Generate cache key
    const cacheKey = config.keyGenerator(req);

    // Try to get from cache
    const cached = await cache.get<{
      status: number;
      headers: Record<string, string>;
      body: any;
    }>(cacheKey);

    if (cached) {
      // Return cached response
      return new NextResponse(JSON.stringify(cached.body), {
        status: cached.status,
        headers: {
          ...cached.headers,
          'X-Cache': 'HIT',
        },
      });
    }

    // Execute handler
    const response = await handler(req);

    // Check if we should cache this response
    const shouldCache = config.shouldCache
      ? config.shouldCache(response)
      : response.status === 200;

    if (shouldCache) {
      // Extract response data
      const body = await response.json();
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      // Cache the response
      await cache.set(
        cacheKey,
        {
          status: response.status,
          headers,
          body,
        },
        {
          ttl: config.ttl,
          tags: config.tags,
        }
      );

      // Return response with cache miss header
      return new NextResponse(JSON.stringify(body), {
        status: response.status,
        headers: {
          ...headers,
          'X-Cache': 'MISS',
        },
      });
    }

    return response;
  };
}

/**
 * Generate cache key for user-specific routes
 */
export function userCacheKey(userId: string, path: string): string {
  return `route:user:${userId}:${path}`;
}

/**
 * Generate cache key for workspace-specific routes
 */
export function workspaceCacheKey(workspaceId: string, path: string): string {
  return `route:workspace:${workspaceId}:${path}`;
}

/**
 * Generate cache key for public routes
 */
export function publicCacheKey(
  path: string,
  query?: Record<string, string>
): string {
  const queryString = query ? `:${JSON.stringify(query)}` : '';
  return `route:public:${path}${queryString}`;
}

/**
 * Invalidate cache for a specific user
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  const cache = getCache();

  // This is a simple implementation
  // In production, you'd want to use cache tags or a more sophisticated approach
  if ('invalidateTag' in cache && typeof cache.invalidateTag === 'function') {
    await cache.invalidateTag(`user:${userId}`);
  }
}

/**
 * Invalidate cache for a specific workspace
 */
export async function invalidateWorkspaceCache(
  workspaceId: string
): Promise<void> {
  const cache = getCache();

  if ('invalidateTag' in cache && typeof cache.invalidateTag === 'function') {
    await cache.invalidateTag(`workspace:${workspaceId}`);
  }
}

/**
 * Cache decorator for server component data fetching
 */
export function cachedFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options?: CacheOptions
): Promise<T> {
  const cache = getCache();

  return cache.get<T>(key).then(async (cached) => {
    if (cached !== null) {
      return cached;
    }

    const data = await fetchFn();
    await cache.set(key, data, options);

    return data;
  });
}

/**
 * Revalidate cache after a specific time
 * Useful for stale-while-revalidate pattern
 */
export async function revalidateAfter<T>(
  key: string,
  fetchFn: () => Promise<T>,
  revalidateSeconds: number
): Promise<T> {
  const cache = getCache();

  // Get cached value
  const cached = await cache.get<T>(key);

  if (cached !== null) {
    // Return cached value immediately
    // Revalidate in background
    setTimeout(async () => {
      try {
        const fresh = await fetchFn();
        await cache.set(key, fresh, { ttl: revalidateSeconds });
      } catch (error) {
        console.error('Background revalidation failed:', error);
      }
    }, 0);

    return cached;
  }

  // No cache, fetch and cache
  const data = await fetchFn();
  await cache.set(key, data, { ttl: revalidateSeconds });

  return data;
}

/**
 * Cache with automatic invalidation on mutation
 */
export class MutationAwareCache<T> {
  constructor(
    private cacheKey: string,
    private fetchFn: () => Promise<T>,
    private ttl: number = 300
  ) {}

  async get(): Promise<T> {
    return cachedFetch(this.cacheKey, this.fetchFn, { ttl: this.ttl });
  }

  async invalidate(): Promise<void> {
    const cache = getCache();
    await cache.delete(this.cacheKey);
  }

  async refresh(): Promise<T> {
    await this.invalidate();
    return this.get();
  }
}
