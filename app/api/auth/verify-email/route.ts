/**
 * POST /api/auth/verify-email
 *
 * Handles email verification using a verification token.
 * Requirements: 4.1, 4.2, 4.3, 9.1, 9.2, 9.3, 9.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { VerifyEmailCommandSchema } from '@/application/commands/auth/VerifyEmailCommand';
import { VerifyEmailUseCase } from '@/application/use-cases/auth/VerifyEmailUseCase';
import { UserRepository } from '@/infrastructure/repositories/UserRepository';
import { VerificationTokenRepository } from '@/infrastructure/repositories/VerificationTokenRepository';
import { rateLimit, RATE_LIMITS } from '@/lib/middleware/rate-limit';
import { ZodError } from 'zod';
export const dynamic = 'force-dynamic';


async function handler(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const command = VerifyEmailCommandSchema.parse(body);

    // Execute use case
    const userRepository = new UserRepository();
    const verificationTokenRepository = new VerificationTokenRepository();

    const useCase = new VerifyEmailUseCase(
      userRepository,
      verificationTokenRepository
    );

    await useCase.execute(command);

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Email verified successfully. You can now log in.',
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
    console.error('Email verification error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message:
            'An error occurred during email verification. Please try again later.',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await rateLimit(request, RATE_LIMITS.verification);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  return handler(request);
}
