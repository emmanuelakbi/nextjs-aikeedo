/**
 * PATCH /api/users/me/password
 *
 * Handles updating the current user's password.
 * Requirements: 7.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { container } from '@/infrastructure/di/container';
import { UpdatePasswordCommandSchema } from '@/application/commands/user/UpdatePasswordCommand';
import { ZodError } from 'zod';

/**
 * PATCH /api/users/me/password
 * Updates the current user's password
 * Requirements: 7.4
 */
export async function PATCH(request: NextRequest) {
  try {
    // Require authentication
    // Requirements: 7.4 - Password update requires authentication
    const currentUser = await getCurrentUser();

    // Parse request body
    const body = await request.json();

    // Validate input
    const command = UpdatePasswordCommandSchema.parse({
      userId: currentUser.id,
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
    });

    // Execute use case
    const useCase = container.createUpdatePasswordUseCase();
    await useCase.execute(command);

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
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

    // Handle incorrect current password
    if (
      error instanceof Error &&
      error.message.includes('Current password is incorrect')
    ) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_PASSWORD',
            message: 'Current password is incorrect',
            fields: {
              currentPassword: ['Current password is incorrect'],
            },
          },
        },
        { status: 400 }
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
    console.error('Update password error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while updating password',
        },
      },
      { status: 500 }
    );
  }
}
