/**
 * PATCH /api/users/me/email
 *
 * Handles updating the current user's email address.
 * Requirements: 7.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { container } from '@/infrastructure/di/container';
import { UpdateEmailCommandSchema } from '@/application/commands/user/UpdateEmailCommand';
import { sendEmail } from '@/lib/email/service';
import { renderVerificationEmail } from '@/lib/email/templates';
import { appConfig } from '@/lib/config';
import { ZodError } from 'zod';
export const dynamic = 'force-dynamic';


/**
 * PATCH /api/users/me/email
 * Updates the current user's email address
 * Requirements: 7.3
 */
export async function PATCH(request: NextRequest) {
  try {
    // Require authentication
    // Requirements: 7.3 - Email update requires authentication
    const currentUser = await getCurrentUser();

    // Parse request body
    const body = await request.json();

    // Validate input
    const command = UpdateEmailCommandSchema.parse({
      userId: currentUser.id,
      newEmail: body.newEmail,
    });

    // Execute use case
    const useCase = container.createUpdateEmailUseCase();
    const result = await useCase.execute(command);

    // Send verification email to new address
    // Requirements: 7.3 - Email change triggers re-verification
    const verificationUrl = `${appConfig.url()}/auth/verify-email?token=${result.verificationToken}`;

    await sendEmail({
      to: command.newEmail,
      subject: 'Verify your new email address',
      html: renderVerificationEmail({
        firstName: result.user.getFirstName(),
        verificationUrl,
      }),
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message:
        'Email updated successfully. Please check your new email address to verify it.',
      data: {
        email: result.user.getEmail().getValue(),
        emailVerified: result.user.getEmailVerified(),
      },
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

    // Handle duplicate email error
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        {
          error: {
            code: 'CONFLICT',
            message: error.message,
            fields: {
              newEmail: ['A user with this email already exists'],
            },
          },
        },
        { status: 409 }
      );
    }

    // Handle not found errors
    if (error instanceof Error && error.message.includes('not found')) {
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

    // Handle other errors
    console.error('Update email error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while updating email',
        },
      },
      { status: 500 }
    );
  }
}
