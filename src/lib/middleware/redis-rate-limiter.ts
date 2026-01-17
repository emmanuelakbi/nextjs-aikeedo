/**
 * Redis-based Rate Limiter
 *
 * Implements distributed rate limiting using Redis with sliding window algorithm.
 * Supports per-user, per-workspace, and per-IP rate limiting.
 *
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

import { createClient, RedisClientType } from 'redis';
import { env } from '@/lib/env';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface RateLimitIdentifiers {
  userId?: string;
  workspaceId?: string;
  ip?: string;
}

/**
 * Redis-based rate limiter using sliding window algorithm
 */
export class RedisRateLimiter {
  private client: RedisClientType | null = null;
  private connecting: Promise<void> | null = null;
  private isConnected = false;

  constructor(private redisUrl?: string) {
    this.redisUrl = redisUrl || env.RATE_LIMIT_REDIS_URL;
  }

  /**
   * Initialize Redis connection
   */
  private async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    if (this.connecting) {
      return this.connecting;
    }

    if (!this.redisUrl) {
      throw new Error('Redis URL not configured for rate limiting');
    }

    this.connecting = (async () => {
      try {
        this.client = createClient({
          url: this.redisUrl,
        }) as RedisClientType;

        this.client.on('error', (err) => {
          console.error('[RedisRateLimiter] Redis error:', err);
          this.isConnected = false;
        });

        this.client.on('connect', () => {
          console.log('[RedisRateLimiter] Connected to Redis');
          this.isConnected = true;
        });

        this.client.on('disconnect', () => {
          console.log('[RedisRateLimiter] Disconnected from Redis');
          this.isConnected = false;
        });

        await this.client.connect();
      } catch (error) {
        console.error('[RedisRateLimiter] Failed to connect to Redis:', error);
        this.connecting = null;
        throw error;
      }
    })();

    return this.connecting;
  }

  /**
   * Ensure Redis client is connected
   */
  private async ensureConnected(): Promise<RedisClientType> {
    if (!this.isConnected || !this.client) {
      await this.connect();
    }

    if (!this.client) {
      throw new Error('Redis client not initialized');
    }

    return this.client;
  }

  /**
   * Check rate limit using sliding window algorithm
   *
   * @param key Unique identifier for the rate limit bucket
   * @param config Rate limit configuration
   * @returns Rate limit result
   */
  async checkLimit(
    key: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    try {
      const client = await this.ensureConnected();
      const now = Date.now();
      const windowStart = now - config.windowMs;

      // Use Redis sorted set for sliding window
      // Score is timestamp, member is unique request ID
      const requestId = `${now}:${Math.random()}`;

      // Remove old entries outside the window first
      await client.zRemRangeByScore(key, 0, windowStart);

      // Count current requests in window BEFORE adding new one
      const currentCount = await client.zCard(key);

      if (currentCount >= config.maxRequests) {
        // Rate limit exceeded - don't add the request
        // Get oldest entry to calculate reset time
        const oldestEntries = await client.zRangeWithScores(key, 0, 0);

        let resetTime = now + config.windowMs;
        if (oldestEntries.length > 0) {
          resetTime = oldestEntries[0].score + config.windowMs;
        }

        const retryAfter = Math.max(1, Math.ceil((resetTime - now) / 1000));

        return {
          allowed: false,
          limit: config.maxRequests,
          remaining: 0,
          resetTime,
          retryAfter,
        };
      }

      // Add current request
      await client.zAdd(key, {
        score: now,
        value: requestId,
      });

      // Set expiration on the key (add buffer for safety)
      await client.expire(key, Math.ceil(config.windowMs / 1000) + 1);

      const remaining = config.maxRequests - currentCount - 1;

      return {
        allowed: true,
        limit: config.maxRequests,
        remaining,
        resetTime: now + config.windowMs,
      };
    } catch (error) {
      console.error('[RedisRateLimiter] Error checking rate limit:', error);
      // Fail open - allow request if Redis is unavailable
      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests,
        resetTime: Date.now() + config.windowMs,
      };
    }
  }

  /**
   * Check rate limit for multiple identifiers (user, workspace, IP)
   * Returns the most restrictive result
   */
  async checkMultipleLimit(
    identifiers: RateLimitIdentifiers,
    configs: {
      user?: RateLimitConfig;
      workspace?: RateLimitConfig;
      ip?: RateLimitConfig;
    },
    endpoint: string
  ): Promise<RateLimitResult> {
    const checks: Promise<RateLimitResult>[] = [];

    if (identifiers.userId && configs.user) {
      const key = `ratelimit:user:${identifiers.userId}:${endpoint}`;
      checks.push(this.checkLimit(key, configs.user));
    }

    if (identifiers.workspaceId && configs.workspace) {
      const key = `ratelimit:workspace:${identifiers.workspaceId}:${endpoint}`;
      checks.push(this.checkLimit(key, configs.workspace));
    }

    if (identifiers.ip && configs.ip) {
      const key = `ratelimit:ip:${identifiers.ip}:${endpoint}`;
      checks.push(this.checkLimit(key, configs.ip));
    }

    if (checks.length === 0) {
      // No rate limits configured
      return {
        allowed: true,
        limit: Infinity,
        remaining: Infinity,
        resetTime: Date.now(),
      };
    }

    const results = await Promise.all(checks);

    // Return the most restrictive result (first one that's not allowed)
    const blocked = results.find((r) => !r.allowed);
    if (blocked) {
      return blocked;
    }

    // All allowed - return the one with least remaining
    return results.reduce((min, current) =>
      current.remaining < min.remaining ? current : min
    );
  }

  /**
   * Reset rate limit for a specific key
   */
  async resetLimit(key: string): Promise<void> {
    try {
      const client = await this.ensureConnected();
      await client.del(key);
    } catch (error) {
      console.error('[RedisRateLimiter] Error resetting rate limit:', error);
    }
  }

  /**
   * Get current rate limit status without incrementing
   */
  async getStatus(
    key: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    try {
      const client = await this.ensureConnected();
      const now = Date.now();
      const windowStart = now - config.windowMs;

      // Remove old entries
      await client.zRemRangeByScore(key, 0, windowStart);

      // Count current requests
      const currentCount = await client.zCard(key);

      const remaining = Math.max(0, config.maxRequests - currentCount);
      const allowed = currentCount < config.maxRequests;

      return {
        allowed,
        limit: config.maxRequests,
        remaining,
        resetTime: now + config.windowMs,
      };
    } catch (error) {
      console.error('[RedisRateLimiter] Error getting status:', error);
      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests,
        resetTime: Date.now() + config.windowMs,
      };
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      this.connecting = null;
    }
  }

  /**
   * Check if Redis is available
   */
  isAvailable(): boolean {
    return this.isConnected && this.client !== null;
  }
}

/**
 * Singleton instance
 */
let rateLimiterInstance: RedisRateLimiter | null = null;

/**
 * Get or create Redis rate limiter instance
 */
export function getRedisRateLimiter(): RedisRateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RedisRateLimiter();
  }
  return rateLimiterInstance;
}

/**
 * Default rate limit configurations for AI services
 */
export const AI_RATE_LIMITS = {
  // Per-user limits (per minute)
  USER: { windowMs: 60 * 1000, maxRequests: 60 },

  // Per-workspace limits (per hour)
  WORKSPACE: { windowMs: 60 * 60 * 1000, maxRequests: 1000 },

  // Per-IP limits (per minute)
  IP: { windowMs: 60 * 1000, maxRequests: 100 },
} as const;
