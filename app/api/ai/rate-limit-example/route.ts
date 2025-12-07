/**
 * Example API route demonstrating rate limiting
 *
 * This route shows how to use the AI rate limiting middleware
 * with per-user, per-workspace, and per-IP limits.
 *
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAIRateLimit } from '@/lib/middleware/rate-limit';
export const dynamic = 'force-dynamic';


/**
 * Example AI endpoint with rate limiting
 *
 * Rate limits:
 * - 60 requests per minute per user
 * - 1000 requests per hour per workspace
 * - 100 requests per minute per IP
 *
 * The most restrictive limit is enforced.
 */
export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await withAIRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json();

    // Simulate AI processing
    const result = {
      success: true,
      message: 'Request processed successfully',
      timestamp: new Date().toISOString(),
      input: body,
    };

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to process request',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check rate limit status
 * This endpoint is not rate limited itself
 */
export async function GET(_request: NextRequest) {
  return NextResponse.json({
    message: 'Rate limit example endpoint',
    documentation: '/src/lib/middleware/RATE_LIMITING.md',
    limits: {
      user: '60 requests per minute',
      workspace: '1000 requests per hour',
      ip: '100 requests per minute',
    },
  });
}
