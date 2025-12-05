/**
 * GET /api/users/me
 * PATCH /api/users/me
 *
 * Handles retrieving and updating the current user's profile.
 * Requirements: 7.1, 7.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { GetUserUseCase } from '@/application/use-cases/user/GetUserUseCase';
import { UpdateProfileUseCase } from '@/application/use-cases/user/UpdateProfileUseCase';
import { UserRepository } from '@/infrastructure/repositories/UserRepository';
import { GetUserQuerySchema } from '@/application/queries/user/GetUserQuery';
import { UpdateProfileCommandSchema } from '@/application/commands/user/UpdateProfileCommand';
import { ZodError } from 'zod';

/**
 * GET /api/users/me
 * Retrieves the current user's profile
 * Requirements: 7.1
 */
export async function GET() {
  try {
    // Require authentication
    // Requirements: 7.1, 7.2 - Profile access requires authentication
    const currentUser = await getCurrentUser();

    // Validate query
    const query = GetUserQuerySchema.parse({
      userId: currentUser.id,
    });

    // Execute use case
    const userRepository = new UserRepository();
    const useCase = new GetUserUseCase(userRepository);
    const user = await useCase.execute(query);

    // Return user data (excluding sensitive fields)
    return NextResponse.json({
      success: true,
      data: {
        id: user.getId().getValue(),
        email: user.getEmail().getValue(),
        emailVerified: user.getEmailVerified(),
        firstName: user.getFirstName(),
        lastName: user.getLastName(),
        phoneNumber: user.getPhoneNumber(),
        language: user.getLanguage(),
        role: user.getRole(),
        status: user.getStatus(),
        currentWorkspaceId: user.getCurrentWorkspaceId(),
        lastSeenAt: user.getLastSeenAt(),
        createdAt: user.getCreatedAt(),
        updatedAt: user.getUpdatedAt(),
      },
    });
  } catch (error) {
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
    console.error('Get user error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while retrieving user data',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/me
 * Updates the current user's profile
 * Requirements: 7.2
 */
export async function PATCH(request: NextRequest) {
  try {
    // Require authentication
    // Requirements: 7.2 - Profile update requires authentication
    const currentUser = await getCurrentUser();

    // Parse request body
    const body = await request.json();

    // Validate input
    const command = UpdateProfileCommandSchema.parse({
      userId: currentUser.id,
      ...body,
    });

    // Execute use case
    const userRepository = new UserRepository();
    const useCase = new UpdateProfileUseCase(userRepository);
    const user = await useCase.execute(command);

    // Return updated user data
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user.getId().getValue(),
        email: user.getEmail().getValue(),
        emailVerified: user.getEmailVerified(),
        firstName: user.getFirstName(),
        lastName: user.getLastName(),
        phoneNumber: user.getPhoneNumber(),
        language: user.getLanguage(),
        role: user.getRole(),
        status: user.getStatus(),
        currentWorkspaceId: user.getCurrentWorkspaceId(),
        lastSeenAt: user.getLastSeenAt(),
        createdAt: user.getCreatedAt(),
        updatedAt: user.getUpdatedAt(),
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
    console.error('Update profile error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while updating profile',
        },
      },
      { status: 500 }
    );
  }
}
