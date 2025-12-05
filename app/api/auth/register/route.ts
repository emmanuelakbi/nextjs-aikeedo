/**
 * POST /api/auth/register
 *
 * Handles user registration with email verification.
 * Requirements: 3.1, 4.1, 4.2, 9.1, 9.2, 9.3, 9.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { RegisterUserCommandSchema } from '@/application/commands/auth/RegisterUserCommand';
import { RegisterUserUseCase } from '@/application/use-cases/auth/RegisterUserUseCase';
import { UserRepository } from '@/infrastructure/repositories/UserRepository';
import { WorkspaceRepository } from '@/infrastructure/repositories/WorkspaceRepository';
import { VerificationTokenRepository } from '@/infrastructure/repositories/VerificationTokenRepository';
import { sendEmail } from '@/lib/email/service';
import { renderVerificationEmail } from '@/lib/email/templates';
import { appConfig } from '@/lib/config';
import { rateLimit, RATE_LIMITS } from '@/lib/middleware/rate-limit';
import { ZodError } from 'zod';

async function handler(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const command = RegisterUserCommandSchema.parse(body);

    // Execute use case
    const userRepository = new UserRepository();
    const workspaceRepository = new WorkspaceRepository();
    const verificationTokenRepository = new VerificationTokenRepository();

    const useCase = new RegisterUserUseCase(
      userRepository,
      workspaceRepository,
      verificationTokenRepository
    );

    const result = await useCase.execute(command);

    // Send verification email
    const verificationUrl = `${appConfig.url()}/auth/verify-email?token=${result.verificationToken}`;

    await sendEmail({
      to: command.email,
      subject: 'Verify your email address',
      html: renderVerificationEmail({
        firstName: command.firstName,
        verificationUrl,
      }),
    });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message:
          'Registration successful. Please check your email to verify your account.',
        data: {
          userId: result.user.getId().getValue(),
          email: result.user.getEmail().getValue(),
          workspaceId: result.workspace.getId().getValue(),
        },
      },
      { status: 201 }
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

    // Handle duplicate email error
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        {
          error: {
            code: 'CONFLICT',
            message: error.message,
            fields: {
              email: ['A user with this email already exists'],
            },
          },
        },
        { status: 409 }
      );
    }

    // Handle other errors
    console.error('Registration error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message:
            'An error occurred during registration. Please try again later.',
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
