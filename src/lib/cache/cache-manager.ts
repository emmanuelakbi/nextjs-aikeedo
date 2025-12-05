/**
 * Cache Manager
 *
 * Unified caching interface for both server and client-side caching.
 * Supports multiple cache backends and strategies.
 *
 * Requirements: Performance considerations
 */

/**
 * Cache entry with metadata
 */
interface CacheEntry<T> {
  value: T;
  expires: number;
  createdAt: number;
}

/**
 * Cache options
 */
export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Tags for cache invalidation
}

/**
 * Generic cache interface
 */
export interface Cache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
}

/**
 * In-memory cache implementation
 * Fast but limited to single process
 */
export class MemoryCacheManager implements Cache {
  private cache = new Map<string, CacheEntry<any>>();
  private tags = new Map<string, Set<string>>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(private defaultTTL: number = 300) {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const ttl = options?.ttl ?? this.defaultTTL;
    const expires = Date.now() + ttl * 1000;

    this.cache.set(key, {
      value,
      expires,
      createdAt: Date.now(),
    });

    // Store tags
    if (options?.tags) {
      options.tags.forEach((tag) => {
        if (!this.tags.has(tag)) {
          this.tags.set(tag, new Set());
        }
        this.tags.get(tag)!.add(key);
      });
    }
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);

    // Remove from tags
    this.tags.forEach((keys) => {
      keys.delete(key);
    });
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.tags.clear();
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    // Check if expired
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Invalidate all cache entries with a specific tag
   */
  async invalidateTag(tag: string): Promise<void> {
    const keys = this.tags.get(tag);
    if (!keys) {
      return;
    }

    keys.forEach((key) => {
      this.cache.delete(key);
    });

    this.tags.delete(tag);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      tags: this.tags.size,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now > entry.expires) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => {
      this.cache.delete(key);
    });

    if (keysToDelete.length > 0 && process.env.NODE_ENV === 'development') {
      console.log(`[Cache] Cleaned up ${keysToDelete.length} expired entries`);
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
    this.tags.clear();
  }
}

/**
 * Cache wrapper with automatic serialization
 */
export class CacheWrapper {
  constructor(private cache: Cache) {}

  /**
   * Get or compute a value
   * If the value is not in cache, compute it and store it
   */
  async getOrCompute<T>(
    key: string,
    computeFn: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.cache.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Compute value
    const value = await computeFn();

    // Store in cache
    await this.cache.set(key, value, options);

    return value;
  }

  /**
   * Memoize a function with caching
   */
  memoize<Args extends any[], Result>(
    fn: (...args: Args) => Promise<Result>,
    keyGenerator: (...args: Args) => string,
    options?: CacheOptions
  ) {
    return async (...args: Args): Promise<Result> => {
      const key = keyGenerator(...args);
      return this.getOrCompute(key, () => fn(...args), options);
    };
  }

  /**
   * Cache a function result for a specific time
   */
  cached<Args extends any[], Result>(
    fn: (...args: Args) => Promise<Result>,
    ttl: number = 300
  ) {
    return this.memoize(
      fn,
      (...args) => `fn:${fn.name}:${JSON.stringify(args)}`,
      { ttl }
    );
  }

  /**
   * Get the underlying cache instance
   */
  getCache(): Cache {
    return this.cache;
  }
}

/**
 * Global cache instance
 */
let cacheInstance: Cache | null = null;

export function getCache(): Cache {
  if (!cacheInstance) {
    cacheInstance = new MemoryCacheManager();
  }
  return cacheInstance;
}

export function getCacheWrapper(): CacheWrapper {
  return new CacheWrapper(getCache());
}

/**
 * Cache key generators
 */
export const CacheKeys = {
  user: (id: string) => `user:${id}`,
  userProfile: (id: string) => `user:${id}:profile`,
  workspace: (id: string) => `workspace:${id}`,
  workspacesByUser: (userId: string) => `user:${userId}:workspaces`,
  session: (token: string) => `session:${token}`,
} as const;

/**
 * Cache tags for invalidation
 */
export const CacheTags = {
  user: (id: string) => `user:${id}`,
  workspace: (id: string) => `workspace:${id}`,
  users: 'users',
  workspaces: 'workspaces',
} as const;
