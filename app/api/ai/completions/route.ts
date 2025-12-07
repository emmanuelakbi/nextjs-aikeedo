/**
 * POST /api/ai/completions
 *
 * Generates text completions from a prompt.
 * Requirements: 2.1, 2.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { GenerateCompletionUseCase } from '@/application/use-cases/ai/GenerateCompletionUseCase';
import { GenerateCompletionCommandSchema } from '@/application/commands/ai/GenerateCompletionCommand';
import { InsufficientCreditsError } from '@/infrastructure/services/CreditDeductionService';
import { withAIRateLimit } from '@/lib/middleware/rate-limit';
import { ZodError } from 'zod';
export const dynamic = 'force-dynamic';



/**
 * POST /api/ai/completions
 * Generate text completion from a prompt
 * Requirements: 2.1, 2.3
 */
export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await withAIRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    // Require authentication
    const currentUser = await getCurrentUser();

    // Parse request body
    const body = await request.json();

    // Get workspace ID from header or body
    const workspaceId =
      request.headers.get('x-workspace-id') || body.workspaceId;

    if (!workspaceId) {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_WORKSPACE',
            message: 'Workspace ID is required',
          },
        },
        { status: 400 }
      );
    }

    // Validate input
    const command = GenerateCompletionCommandSchema.parse({
      userId: currentUser.id,
      workspaceId,
      ...body,
    });

    // Execute use case
    const useCase = new GenerateCompletionUseCase();
    const result = await useCase.execute(command);

    // Return result
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    // Handle validation errors
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string[]> = {};

      error.issues.forEach((issue) => {
        const field = issue.path.join('.');
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(issue.message);
      });

      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            fields: fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    // Handle insufficient credits
    if (error instanceof InsufficientCreditsError) {
      return NextResponse.json(
        {
          error: {
            code: 'INSUFFICIENT_CREDITS',
            message: error.message,
            details: {
              required: error.required,
              available: error.available,
            },
          },
        },
        { status: 402 }
      );
    }

    // Handle authentication errors
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    // Handle provider errors
    if (error instanceof Error && error.message.includes('not available')) {
      return NextResponse.json(
        {
          error: {
            code: 'PROVIDER_UNAVAILABLE',
            message: error.message,
          },
        },
        { status: 503 }
      );
    }

    // Handle other errors
    console.error('Generate completion error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while generating completion',
        },
      },
      { status: 500 }
    );
  }
}
