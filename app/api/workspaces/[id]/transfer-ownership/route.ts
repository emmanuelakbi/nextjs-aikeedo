/**
 * POST /api/workspaces/:id/transfer-ownership
 *
 * Handles transferring workspace ownership to another user.
 * Requirements: 8.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/session';
import { TransferWorkspaceOwnershipUseCase } from '@/application/use-cases/workspace/TransferWorkspaceOwnershipUseCase';
import { WorkspaceRepository } from '@/infrastructure/repositories/WorkspaceRepository';
import { UserRepository } from '@/infrastructure/repositories/UserRepository';
import { TransferWorkspaceOwnershipCommand } from '@/application/commands/workspace/TransferWorkspaceOwnershipCommand';
export const dynamic = 'force-dynamic';


const TransferOwnershipSchema = z.object({
  newOwnerId: z.string().uuid('New owner ID must be a valid UUID'),
});

/**
 * POST /api/workspaces/:id/transfer-ownership
 * Transfers workspace ownership to another user
 * Requirements: 8.2
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const currentUser = await getCurrentUser();

    // Parse and validate request body
    const body = await request.json();
    const { newOwnerId } = TransferOwnershipSchema.parse(body);

    // Create command
    const command: TransferWorkspaceOwnershipCommand = {
      workspaceId: params.id,
      currentOwnerId: currentUser.id,
      newOwnerId,
    };

    // Execute use case
    const workspaceRepository = new WorkspaceRepository();
    const userRepository = new UserRepository();
    const useCase = new TransferWorkspaceOwnershipUseCase(
      workspaceRepository,
      userRepository
    );
    const workspace = await useCase.execute(command);

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Workspace ownership transferred successfully',
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
    if (error instanceof z.ZodError) {
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
    console.error('Transfer workspace ownership error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while transferring workspace ownership',
        },
      },
      { status: 500 }
    );
  }
}
