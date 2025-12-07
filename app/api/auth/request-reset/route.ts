/**
 * POST /api/auth/request-reset
 *
 * Handles password reset requests by generating a reset token.
 * Requirements: 5.1, 5.2, 9.1, 9.2, 9.3, 9.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { RequestPasswordResetCommandSchema } from '@/application/commands/auth/RequestPasswordResetCommand';
import { RequestPasswordResetUseCase } from '@/application/use-cases/auth/RequestPasswordResetUseCase';
import { UserRepository } from '@/infrastructure/repositories/UserRepository';
import { VerificationTokenRepository } from '@/infrastructure/repositories/VerificationTokenRepository';
import { Email } from '@/domain/user/value-objects/Email';
import { sendEmail } from '@/lib/email/service';
import { renderPasswordResetEmail } from '@/lib/email/templates';
import { appConfig } from '@/lib/config';
import { rateLimit, RATE_LIMITS } from '@/lib/middleware/rate-limit';
import { ZodError } from 'zod';
export const dynamic = 'force-dynamic';



async function handler(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const command = RequestPasswordResetCommandSchema.parse(body);

    // Execute use case
    const userRepository = new UserRepository();
    const verificationTokenRepository = new VerificationTokenRepository();

    const useCase = new RequestPasswordResetUseCase(
      userRepository,
      verificationTokenRepository
    );

    const result = await useCase.execute(command);

    // Send password reset email only if token was generated
    // (token will be empty string if user doesn't exist - security measure)
    if (result.resetToken) {
      const resetUrl = `${appConfig.url()}/auth/reset-password?token=${result.resetToken}`;

      // Get user to include first name in email
      const userRepository = new UserRepository();
      const emailVO = Email.create(result.email);
      const user = await userRepository.findByEmail(emailVO);

      await sendEmail({
        to: result.email,
        subject: 'Reset your password',
        html: renderPasswordResetEmail({
          firstName: user?.getFirstName() || 'User',
          resetUrl,
        }),
      });
    }

    // Always return success to prevent email enumeration
    return NextResponse.json(
      {
        success: true,
        message:
          'If an account exists with this email, a password reset link has been sent.',
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

    // Handle other errors
    console.error('Password reset request error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message:
            'An error occurred while processing your request. Please try again later.',
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
