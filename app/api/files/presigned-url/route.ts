/**
 * POST /api/files/presigned-url
 *
 * Generates a presigned URL for direct file upload to storage.
 * Requirements: Content Management 1.1, 1.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { GetPresignedUploadUrlUseCase } from '@/application/use-cases/file/GetPresignedUploadUrlUseCase';
import { getFileStorage } from '@/lib/storage';
import { GetPresignedUploadUrlCommandSchema } from '@/application/commands/file/GetPresignedUploadUrlCommand';
import { ZodError } from 'zod';
export const dynamic = 'force-dynamic';



/**
 * POST /api/files/presigned-url
 * Generate a presigned URL for file upload
 * Requirements: Content Management 1.1, 1.3
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const currentUser = await getCurrentUser();

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

    // Parse request body
    const body = await request.json();

    // Validate input
    const command = GetPresignedUploadUrlCommandSchema.parse({
      workspaceId,
      userId: currentUser.id,
      fileName: body.fileName,
      fileType: body.fileType,
      fileSize: body.fileSize,
    });

    // Execute use case
    const storage = getFileStorage();
    const useCase = new GetPresignedUploadUrlUseCase(storage);
    const result = await useCase.execute(command);

    // Return presigned URL
    return NextResponse.json({
      success: true,
      data: {
        uploadUrl: result.uploadUrl,
        fileId: result.fileId,
        storageKey: result.storageKey,
        expiresIn: result.expiresIn,
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

    // Handle file type/size errors
    if (
      error instanceof Error &&
      (error.message.includes('not allowed') ||
        error.message.includes('exceeds maximum'))
    ) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_FILE',
            message: error.message,
          },
        },
        { status: 400 }
      );
    }

    // Handle other errors
    console.error('Generate presigned URL error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while generating presigned URL',
        },
      },
      { status: 500 }
    );
  }
}
