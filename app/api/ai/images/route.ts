/**
 * POST /api/ai/images
 *
 * Generates images from text prompts.
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { GenerateImageUseCase } from '@/application/use-cases/ai/GenerateImageUseCase';
import { GenerateImageCommandSchema } from '@/application/commands/ai/GenerateImageCommand';
import { InsufficientCreditsError } from '@/infrastructure/services/CreditDeductionService';
import { withAIRateLimit } from '@/lib/middleware/rate-limit';
import { ZodError } from 'zod';

/**
 * POST /api/ai/images
 * Generate image from text prompt
 * Requirements: 4.1, 4.2, 4.3, 4.4
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
    const command = GenerateImageCommandSchema.parse({
      userId: currentUser.id,
      workspaceId,
      ...body,
    });

    // Execute use case
    const useCase = new GenerateImageUseCase();

    // Check if multiple images requested
    if (command.n && command.n > 1) {
      const results = await useCase.executeMultiple(command);

      return NextResponse.json({
        success: true,
        data: {
          images: results,
          count: results.length,
          totalCredits: results.reduce((sum: number, r: any) => sum + r.credits, 0),
        },
      });
    }

    // Single image generation
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

    // Handle size validation errors
    if (error instanceof Error && error.message.includes('size')) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_SIZE',
            message: error.message,
          },
        },
        { status: 400 }
      );
    }

    // Handle other errors
    console.error('Generate image error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while generating image',
        },
      },
      { status: 500 }
    );
  }
}
