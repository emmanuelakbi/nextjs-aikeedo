/**
 * POST /api/auth/reset-password
 *
 * Handles password reset using a reset token.
 * Requirements: 5.2, 5.3, 5.5, 9.1, 9.2, 9.3, 9.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { ResetPasswordCommandSchema } from '@/application/commands/auth/ResetPasswordCommand';
import { ResetPasswordUseCase } from '@/application/use-cases/auth/ResetPasswordUseCase';
import { UserRepository } from '@/infrastructure/repositories/UserRepository';
import { VerificationTokenRepository } from '@/infrastructure/repositories/VerificationTokenRepository';
import { SessionRepository } from '@/infrastructure/repositories/SessionRepository';
import { rateLimit, RATE_LIMITS } from '@/lib/middleware/rate-limit';
import { ZodError } from 'zod';

async function handler(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const command = ResetPasswordCommandSchema.parse(body);

    // Execute use case
    const userRepository = new UserRepository();
    const verificationTokenRepository = new VerificationTokenRepository();
    const sessionRepository = new SessionRepository();

    const useCase = new ResetPasswordUseCase(
      userRepository,
      verificationTokenRepository,
      sessionRepository
    );

    await useCase.execute(command);

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message:
          'Password reset successfully. You can now log in with your new password.',
      },
      { status: 200 }
    );
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

    // Handle token errors
    if (error instanceof Error) {
      if (
        error.message.includes('Invalid') ||
        error.message.includes('expired')
      ) {
        return NextResponse.json(
          {
            error: {
              code: 'INVALID_TOKEN',
              message: error.message,
            },
          },
          { status: 400 }
        );
      }

      if (error.message.includes('not found')) {
        return NextResponse.json(
          {
            error: {
              code: 'NOT_FOUND',
              message: 'User not found',
            },
          },
          { status: 404 }
        );
      }
    }

    // Handle other errors
    console.error('Password reset error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message:
            'An error occurred during password reset. Please try again later.',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await rateLimit(request, RATE_LIMITS.auth);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  return handler(request);
}
