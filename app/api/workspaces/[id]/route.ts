/**
 * PATCH /api/workspaces/:id
 *
 * Handles updating a workspace.
 * Requirements: 8.2, 8.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { UpdateWorkspaceUseCase } from '@/application/use-cases/workspace/UpdateWorkspaceUseCase';
import { WorkspaceRepository } from '@/infrastructure/repositories/WorkspaceRepository';
import { UpdateWorkspaceCommandSchema } from '@/application/commands/workspace/UpdateWorkspaceCommand';
import { ZodError } from 'zod';
export const dynamic = 'force-dynamic';



/**
 * PATCH /api/workspaces/:id
 * Updates a workspace
 * Requirements: 8.2, 8.4
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const currentUser = await getCurrentUser();

    // Parse request body
    const body = await request.json();

    // Validate input
    const command = UpdateWorkspaceCommandSchema.parse({
      workspaceId: params.id,
      userId: currentUser.id,
      ...body,
    });

    // Execute use case
    const workspaceRepository = new WorkspaceRepository();
    const useCase = new UpdateWorkspaceUseCase(workspaceRepository);
    const workspace = await useCase.execute(command);

    // Return updated workspace data
    return NextResponse.json({
      success: true,
      message: 'Workspace updated successfully',
      data: {
        id: workspace.getId().getValue(),
        name: workspace.getName(),
        ownerId: workspace.getOwnerId(),
        creditCount: workspace.getCreditCount(),
        allocatedCredits: workspace.getAllocatedCredits(),
        isTrialed: workspace.getIsTrialed(),
        createdAt: workspace.getCreatedAt(),
        updatedAt: workspace.getUpdatedAt(),
        creditsAdjustedAt: workspace.getCreditsAdjustedAt(),
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

    // Handle authorization errors
    if (error instanceof Error && error.message.includes('owner')) {
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
    console.error('Update workspace error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while updating workspace',
        },
      },
      { status: 500 }
    );
  }
}
