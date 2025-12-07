/**
 * POST /api/workspaces/:id/switch
 *
 * Handles switching the user's current workspace.
 * Requirements: 8.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { SwitchWorkspaceUseCase } from '@/application/use-cases/workspace/SwitchWorkspaceUseCase';
import { WorkspaceRepository } from '@/infrastructure/repositories/WorkspaceRepository';
import { UserRepository } from '@/infrastructure/repositories/UserRepository';
import { SwitchWorkspaceCommandSchema } from '@/application/commands/workspace/SwitchWorkspaceCommand';
import { ZodError } from 'zod';
export const dynamic = 'force-dynamic';


/**
 * POST /api/workspaces/:id/switch
 * Switches the user's current workspace
 * Requirements: 8.3
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const currentUser = await getCurrentUser();

    // Validate input
    const command = SwitchWorkspaceCommandSchema.parse({
      userId: currentUser.id,
      workspaceId: params.id,
    });

    // Execute use case
    const userRepository = new UserRepository();
    const workspaceRepository = new WorkspaceRepository();
    const useCase = new SwitchWorkspaceUseCase(
      userRepository,
      workspaceRepository
    );
    const user = await useCase.execute(command);

    // Return updated user data
    return NextResponse.json({
      success: true,
      message: 'Workspace switched successfully',
      data: {
        currentWorkspaceId: user.getCurrentWorkspaceId(),
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

    // Handle authorization errors (no access to workspace)
    if (
      error instanceof Error &&
      error.message.includes('does not have access')
    ) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: error.message,
          },
        },
        { status: 403 }
      );
    }

    // Handle not found errors
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: error.message,
          },
        },
        { status: 404 }
      );
    }

    // Handle other errors
    console.error('Switch workspace error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while switching workspace',
        },
      },
      { status: 500 }
    );
  }
}
