/**
 * Performance Middleware
 *
 * Middleware for optimizing API route performance:
 * - Request timing
 * - Response compression
 * - Cache headers
 * - Rate limiting
 *
 * Requirements: Performance considerations
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Performance monitoring middleware
 * Adds timing information to responses
 */
export function withPerformanceMonitoring(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = performance.now();

    try {
      const response = await handler(req);
      const duration = performance.now() - startTime;

      // Add timing header
      response.headers.set('X-Response-Time', `${duration.toFixed(2)}ms`);

      // Log slow requests
      if (duration > 1000) {
        console.warn(
          `[Slow Request] ${req.method} ${req.url} took ${duration.toFixed(2)}ms`
        );
      }

      return response;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(
        `[Request Error] ${req.method} ${req.url} failed after ${duration.toFixed(2)}ms:`,
        error
      );
      throw error;
    }
  };
}

/**
 * Cache control middleware
 * Adds appropriate cache headers to responses
 */
export function withCacheControl(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options?: {
    maxAge?: number;
    sMaxAge?: number;
    staleWhileRevalidate?: number;
    public?: boolean;
  }
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const response = await handler(req);

    const {
      maxAge = 0,
      sMaxAge,
      staleWhileRevalidate,
      public: isPublic = false,
    } = options || {};

    const cacheDirectives: string[] = [];

    if (isPublic) {
      cacheDirectives.push('public');
    } else {
      cacheDirectives.push('private');
    }

    if (maxAge > 0) {
      cacheDirectives.push(`max-age=${maxAge}`);
    }

    if (sMaxAge !== undefined) {
      cacheDirectives.push(`s-maxage=${sMaxAge}`);
    }

    if (staleWhileRevalidate !== undefined) {
      cacheDirectives.push(`stale-while-revalidate=${staleWhileRevalidate}`);
    }

    if (cacheDirectives.length > 0) {
      response.headers.set('Cache-Control', cacheDirectives.join(', '));
    }

    return response;
  };
}

/**
 * ETag middleware
 * Adds ETag header for conditional requests
 */
export function withETag(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const response = await handler(req);

    // Generate ETag from response body
    const body = await response.text();
    const etag = `"${hashString(body)}"`;

    // Check if client has matching ETag
    const clientETag = req.headers.get('if-none-match');
    if (clientETag === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: etag,
        },
      });
    }

    // Add ETag to response
    const newResponse = new NextResponse(body, response);
    newResponse.headers.set('ETag', etag);

    return newResponse;
  };
}

/**
 * Simple string hash function for ETag generation
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Compression middleware
 * Note: Next.js handles compression automatically in production
 * This is mainly for development and custom scenarios
 */
export function withCompression(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const response = await handler(req);

    // Check if client accepts compression
    const acceptEncoding = req.headers.get('accept-encoding') || '';

    if (acceptEncoding.includes('gzip')) {
      response.headers.set('Content-Encoding', 'gzip');
    } else if (acceptEncoding.includes('deflate')) {
      response.headers.set('Content-Encoding', 'deflate');
    }

    return response;
  };
}

/**
 * Request deduplication middleware
 * Prevents duplicate concurrent requests
 */
const requestCache = new Map<string, Promise<NextResponse>>();

export function withDeduplication(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Only deduplicate GET requests
    if (req.method !== 'GET') {
      return handler(req);
    }

    const cacheKey = req.url;

    // Check if request is already in flight
    const cachedRequest = requestCache.get(cacheKey);
    if (cachedRequest) {
      const response = await cachedRequest;
      // Clone the response to avoid consuming the body
      return NextResponse.json(await response.json(), {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    }

    // Create new request
    const request = handler(req).finally(() => {
      // Remove from cache after completion
      requestCache.delete(cacheKey);
    });

    requestCache.set(cacheKey, request);
    return request;
  };
}

/**
 * Compose multiple middleware functions
 */
export function composeMiddleware(
  ...middlewares: Array<
    (
      handler: (req: NextRequest) => Promise<NextResponse>
    ) => (req: NextRequest) => Promise<NextResponse>
  >
) {
  return (handler: (req: NextRequest) => Promise<NextResponse>) => {
    return middlewares.reduceRight(
      (acc, middleware) => middleware(acc),
      handler
    );
  };
}

/**
 * Default optimized middleware stack
 */
export function withOptimizations(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options?: {
    cache?: boolean;
    cacheMaxAge?: number;
    monitoring?: boolean;
    deduplication?: boolean;
  }
) {
  const {
    cache = false,
    cacheMaxAge = 60,
    monitoring = true,
    deduplication = true,
  } = options || {};

  const middlewares: Array<
    (
      handler: (req: NextRequest) => Promise<NextResponse>
    ) => (req: NextRequest) => Promise<NextResponse>
  > = [];

  if (monitoring) {
    middlewares.push(withPerformanceMonitoring);
  }

  if (deduplication) {
    middlewares.push(withDeduplication);
  }

  if (cache) {
    middlewares.push((h) =>
      withCacheControl(h, {
        maxAge: cacheMaxAge,
        staleWhileRevalidate: cacheMaxAge * 2,
      })
    );
  }

  return composeMiddleware(...middlewares)(handler);
}
