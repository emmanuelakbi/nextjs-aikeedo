import { NextRequest, NextResponse } from 'next/server';

/**
 * Rate Limiting Middleware
 * Implements sliding window rate limiting using in-memory storage
 * For production, consider using Redis for distributed rate limiting
 */

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
  keyPrefix?: string;  // Key prefix for identification
}

interface RateLimitEntry {
  timestamps: number[];
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

export class RateLimiter {
  constructor(private config: RateLimitConfig) {}

  async checkLimit(identifier: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: Date;
  }> {
    const key = `${this.config.keyPrefix || 'ratelimit'}:${identifier}`;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get or create entry
    let entry = rateLimitStore.get(key);
    if (!entry) {
      entry = { timestamps: [] };
      rateLimitStore.set(key, entry);
    }

    // Remove old timestamps outside the window
    entry.timestamps = entry.timestamps.filter(ts => ts > windowStart);

    // Check if limit exceeded
    const count = entry.timestamps.length;
    const allowed = count < this.config.maxRequests;
    const remaining = Math.max(0, this.config.maxRequests - count - 1);
    const resetAt = new Date(now + this.config.windowMs);

    // Add current timestamp if allowed
    if (allowed) {
      entry.timestamps.push(now);
    }

    return { allowed, remaining, resetAt };
  }

  // Clean up old entries periodically
  static cleanup() {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.timestamps.length === 0 || entry.timestamps[entry.timestamps.length - 1] < now - 3600000) {
        rateLimitStore.delete(key);
      }
    }
  }
}

// Cleanup every 5 minutes
setInterval(() => RateLimiter.cleanup(), 5 * 60 * 1000);

// Predefined rate limiters
export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
  keyPrefix: 'auth',
});

export const apiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute
  keyPrefix: 'api',
});

export const checkoutRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10, // 10 checkout attempts per hour
  keyPrefix: 'checkout',
});

export const verificationRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5, // 5 verification attempts per hour
  keyPrefix: 'verify',
});

export const aiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 AI requests per minute
  keyPrefix: 'ai',
});

// Middleware helper
export async function withRateLimit(
  request: NextRequest,
  rateLimiter: RateLimiter,
  identifier?: string
): Promise<NextResponse | null> {
  // Get identifier (IP or user ID)
  const id = identifier || 
    request.headers.get('x-forwarded-for') || 
    request.headers.get('x-real-ip') || 
    'unknown';

  const result = await rateLimiter.checkLimit(id);

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        retryAfter: result.resetAt.toISOString(),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimiter['config'].maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.resetAt.getTime().toString(),
          'Retry-After': Math.ceil((result.resetAt.getTime() - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  return null; // Allow request
}

// AI-specific rate limiting helper
export async function withAIRateLimit(
  request: NextRequest,
  identifier?: string
): Promise<NextResponse | null> {
  return withRateLimit(request, aiRateLimiter, identifier);
}
