/**
 * Session Caching Layer
 *
 * Provides caching for user sessions to reduce database load.
 * Falls back to database-only if Redis is not configured.
 *
 * Requirements: Performance considerations
 */

import { Session } from '@prisma/client';
import { servicesConfig } from '../config';

/**
 * Cache interface for session storage
 */
interface SessionCache {
  get(key: string): Promise<Session | null>;
  set(key: string, value: Session, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  deletePattern(pattern: string): Promise<void>;
}

/**
 * In-memory cache implementation (fallback)
 * Used when Redis is not available
 */
class MemoryCache implements SessionCache {
  private cache = new Map<string, { value: Session; expires: number }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000
    );
  }

  async get(key: string): Promise<Session | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(
    key: string,
    value: Session,
    ttlSeconds: number = 300
  ): Promise<void> {
    const expires = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expires });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async deletePattern(pattern: string): Promise<void> {
    // Simple pattern matching for memory cache
    const regex = new RegExp(pattern.replace('*', '.*'));

    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.cache.delete(key));
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
 * Redis cache implementation
 * Used when Redis is configured
 */
class RedisCache implements SessionCache {
  private client: any = null;
  private connecting: Promise<void> | null = null;

  private async getClient() {
    if (this.client) {
      return this.client;
    }

    if (this.connecting) {
      await this.connecting;
      return this.client;
    }

    this.connecting = this.connect();
    await this.connecting;
    return this.client;
  }

  private async connect(): Promise<void> {
    try {
      // Dynamically import Redis only if needed
      // Note: Redis client is optional and requires 'redis' package to be installed
      const redisModule = await import('redis').catch(() => null);

      if (!redisModule) {
        throw new Error('Redis package not installed');
      }

      const { createClient } = redisModule;

      const redisUrl = servicesConfig.redis.url();
      if (!redisUrl) {
        throw new Error('Redis URL not configured');
      }

      this.client = createClient({ url: redisUrl });

      this.client.on('error', (err: Error) => {
        console.error('Redis Client Error:', err);
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async get(key: string): Promise<Session | null> {
    try {
      const client = await this.getClient();
      const data = await client.get(key);

      if (!data) {
        return null;
      }

      return JSON.parse(data);
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(
    key: string,
    value: Session,
    ttlSeconds: number = 300
  ): Promise<void> {
    try {
      const client = await this.getClient();
      await client.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const client = await this.getClient();
      await client.del(key);
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    try {
      const client = await this.getClient();
      const keys = await client.keys(pattern);

      if (keys.length > 0) {
        await client.del(keys);
      }
    } catch (error) {
      console.error('Redis deletePattern error:', error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }
}

/**
 * Session cache instance
 * Automatically uses Redis if available, otherwise falls back to memory cache
 */
let cacheInstance: SessionCache | null = null;

function getCache(): SessionCache {
  if (cacheInstance) {
    return cacheInstance;
  }

  // Check if Redis is configured
  if (servicesConfig.redis.isEnabled()) {
    try {
      cacheInstance = new RedisCache();
      console.log('Session cache: Using Redis');
    } catch (error) {
      console.warn(
        'Failed to initialize Redis cache, falling back to memory cache:',
        error
      );
      cacheInstance = new MemoryCache();
      console.log('Session cache: Using in-memory cache');
    }
  } else {
    cacheInstance = new MemoryCache();
    console.log('Session cache: Using in-memory cache');
  }

  return cacheInstance;
}

/**
 * Cache key generators
 */
const CacheKeys = {
  session: (token: string) => `session:${token}`,
  userSessions: (userId: string) => `user:${userId}:sessions:*`,
} as const;

/**
 * Session cache service
 * Provides high-level caching operations for sessions
 */
export const SessionCacheService = {
  /**
   * Get a session from cache
   */
  async getSession(sessionToken: string): Promise<Session | null> {
    const cache = getCache();
    return cache.get(CacheKeys.session(sessionToken));
  },

  /**
   * Cache a session
   * TTL defaults to 5 minutes
   */
  async setSession(session: Session, ttlSeconds: number = 300): Promise<void> {
    const cache = getCache();
    await cache.set(
      CacheKeys.session(session.sessionToken),
      session,
      ttlSeconds
    );
  },

  /**
   * Remove a session from cache
   */
  async deleteSession(sessionToken: string): Promise<void> {
    const cache = getCache();
    await cache.delete(CacheKeys.session(sessionToken));
  },

  /**
   * Remove all sessions for a user from cache
   * Used when user logs out or password is reset
   */
  async deleteUserSessions(userId: string): Promise<void> {
    const cache = getCache();
    await cache.deletePattern(CacheKeys.userSessions(userId));
  },

  /**
   * Check if Redis is being used
   */
  isUsingRedis(): boolean {
    return servicesConfig.redis.isEnabled();
  },
} as const;
