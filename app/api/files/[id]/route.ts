/**
 * GET /api/files/[id]
 * DELETE /api/files/[id]
 *
 * Handles individual file operations.
 * Requirements: Content Management 1.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { DeleteFileUseCase } from '@/application/use-cases/file/DeleteFileUseCase';
import { FileRepository } from '@/infrastructure/repositories/FileRepository';
import { getFileStorage } from '@/lib/storage';
import { DeleteFileCommandSchema } from '@/application/commands/file/DeleteFileCommand';
import { ZodError } from 'zod';

/**
 * GET /api/files/[id]
 * Get a single file by ID
 * Requirements: Content Management 1.1
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const currentUser = await getCurrentUser();

    const fileId = params.id;

    // Get workspace ID from header
    const workspaceId = request.headers.get('x-workspace-id');

    if (!workspaceId) {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_WORKSPACE',
            message: 'Workspace ID is required',
          },
        },
        { status: 400 }
      );
    }

    // Find the file
    const fileRepository = new FileRepository();
    const file = await fileRepository.findById(fileId);

    if (!file) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'File not found',
          },
        },
        { status: 404 }
      );
    }

    // Verify workspace access
    if (!file.belongsToWorkspace(workspaceId)) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied to this file',
          },
        },
        { status: 403 }
      );
    }

    // Return file
    return NextResponse.json({
      success: true,
      data: {
        id: file.getId(),
        workspaceId: file.getWorkspaceId(),
        userId: file.getUserId(),
        name: file.getName(),
        type: file.getType(),
        size: file.getSize(),
        url: file.getUrl(),
        storageKey: file.getStorageKey(),
        metadata: file.getMetadata(),
        createdAt: file.getCreatedAt(),
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

    // Handle other errors
    console.error('Get file error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while retrieving file',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/files/[id]
 * Delete a file
 * Requirements: Content Management 1.1
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const currentUser = await getCurrentUser();

    const fileId = params.id;

    // Get workspace ID from header
    const workspaceId = request.headers.get('x-workspace-id');

    if (!workspaceId) {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_WORKSPACE',
            message: 'Workspace ID is required',
          },
        },
        { status: 400 }
      );
    }

    // Validate input
    const command = DeleteFileCommandSchema.parse({
      fileId,
      userId: currentUser.id,
      workspaceId,
    });

    // Execute use case
    const fileRepository = new FileRepository();
    const storage = getFileStorage();
    const useCase = new DeleteFileUseCase(fileRepository, storage);
    await useCase.execute(command);

    // Return success
    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
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
            message: error.message,
          },
        },
        { status: 404 }
      );
    }

    // Handle other errors
    console.error('Delete file error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while deleting file',
        },
      },
      { status: 500 }
    );
  }
}
