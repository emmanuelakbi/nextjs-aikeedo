/**
 * GET /api/workspaces
 * POST /api/workspaces
 *
 * Handles listing and creating workspaces.
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { ListWorkspacesUseCase } from '@/application/use-cases/workspace/ListWorkspacesUseCase';
import { CreateWorkspaceUseCase } from '@/application/use-cases/workspace/CreateWorkspaceUseCase';
import { WorkspaceRepository } from '@/infrastructure/repositories/WorkspaceRepository';
import { UserRepository } from '@/infrastructure/repositories/UserRepository';
import { ListWorkspacesQuerySchema } from '@/application/queries/workspace/ListWorkspacesQuery';
import { CreateWorkspaceCommandSchema } from '@/application/commands/workspace/CreateWorkspaceCommand';
import { ZodError } from 'zod';

/**
 * GET /api/workspaces
 * Retrieves all workspaces for the current user (owned and member)
 * Requirements: 8.3, 8.4
 */
export async function GET() {
  try {
    // Require authentication
    const currentUser = await getCurrentUser();

    // Validate query
    const query = ListWorkspacesQuerySchema.parse({
      userId: currentUser.id,
    });

    // Execute use case
    const workspaceRepository = new WorkspaceRepository();
    const useCase = new ListWorkspacesUseCase(workspaceRepository);
    const workspaces = await useCase.execute(query);

    // Return workspace data
    return NextResponse.json({
      success: true,
      data: workspaces.map((workspace) => ({
        id: workspace.getId().getValue(),
        name: workspace.getName(),
        ownerId: workspace.getOwnerId(),
        creditCount: workspace.getCreditCount(),
        allocatedCredits: workspace.getAllocatedCredits(),
        isTrialed: workspace.getIsTrialed(),
        createdAt: workspace.getCreatedAt(),
        updatedAt: workspace.getUpdatedAt(),
        creditsAdjustedAt: workspace.getCreditsAdjustedAt(),
      })),
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

    // Handle other errors
    console.error('List workspaces error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while retrieving workspaces',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspaces
 * Creates a new workspace
 * Requirements: 8.1, 8.2
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const currentUser = await getCurrentUser();

    // Parse request body
    const body = await request.json();

    // Validate input
    const command = CreateWorkspaceCommandSchema.parse({
      userId: currentUser.id,
      ...body,
    });

    // Execute use case
    const workspaceRepository = new WorkspaceRepository();
    const userRepository = new UserRepository();
    const useCase = new CreateWorkspaceUseCase(
      workspaceRepository,
      userRepository
    );
    const workspace = await useCase.execute(command);

    // Return created workspace data
    return NextResponse.json(
      {
        success: true,
        message: 'Workspace created successfully',
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
            message: error.message,
          },
        },
        { status: 404 }
      );
    }

    // Handle other errors
    console.error('Create workspace error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while creating workspace',
        },
      },
      { status: 500 }
    );
  }
}
