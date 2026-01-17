/**
 * POST /api/ai/chat
 *
 * Generates chat completions with streaming support.
 * Requirements: 2.1, 2.2, 2.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { GenerateChatCompletionUseCase } from '@/application/use-cases/ai/GenerateChatCompletionUseCase';
import { GenerateChatCompletionCommandSchema } from '@/application/commands/ai/GenerateChatCompletionCommand';
import { InsufficientCreditsError } from '@/infrastructure/services/CreditDeductionService';
import { withAIRateLimit } from '@/lib/middleware/rate-limit';
import { toReadableStream } from '@/lib/ai/streaming-handler';
import { ZodError } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/ai/chat
 * Returns API info (prevents 405 errors)
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/ai/chat',
    method: 'POST',
    description: 'Generate chat completions with optional streaming',
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}


/**
 * POST /api/ai/chat
 * Generate chat completion with optional streaming
 * Requirements: 2.1, 2.2, 2.3
 */
export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await withAIRateLimit(
    request,
    request.headers.get('x-user-id') || undefined
  );
  if (rateLimitResponse) {
    return rateLimitResponse;
  }
  try {
    // Require authentication
    let currentUser;
    try {
      currentUser = await getCurrentUser();
    } catch (authError) {
      console.error('Auth error:', authError);
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

    if (!currentUser) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not found',
          },
        },
        { status: 401 }
      );
    }

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

    // Validate input - strip unknown fields like conversationId
    let command;
    try {
      const { conversationId, ...chatParams } = body; // Remove conversationId as it's not part of the AI request
      command = GenerateChatCompletionCommandSchema.parse({
        userId: currentUser.id,
        workspaceId,
        ...chatParams,
      });
    } catch (validationError) {
      if (validationError instanceof ZodError) {
        console.error('Validation error details:', JSON.stringify(validationError.issues, null, 2));
        console.error('Request body:', JSON.stringify(body, null, 2));
        
        const fieldErrors: Record<string, string[]> = {};
        validationError.issues.forEach((issue) => {
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
      throw validationError;
    }

    // Execute use case
    const useCase = new GenerateChatCompletionUseCase();

    // Check if streaming is requested
    if (command.stream) {
      // Return streaming response
      const stream = useCase.executeStream(command);
      const readableStream = toReadableStream(stream);

      return new NextResponse(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // Non-streaming response
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
    console.error('Generate chat completion error:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An error occurred while generating chat completion',
        },
      },
      { status: 500 }
    );
  }
}
