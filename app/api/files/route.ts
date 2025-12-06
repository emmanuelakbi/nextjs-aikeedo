/**
 * GET /api/files
 * POST /api/files
 *
 * Handles listing and uploading files.
 * Requirements: Content Management 1.1, 1.2, 1.3, 1.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { UploadFileUseCase } from '@/application/use-cases/file/UploadFileUseCase';
import { ListFilesUseCase } from '@/application/use-cases/file/ListFilesUseCase';
import { FileRepository } from '@/infrastructure/repositories/FileRepository';
import { getFileStorage } from '@/lib/storage';
import { UploadFileCommandSchema } from '@/application/commands/file/UploadFileCommand';
import { ListFilesCommandSchema } from '@/application/commands/file/ListFilesCommand';
import { ZodError } from 'zod';

/**
 * GET /api/files
 * List files with optional filters
 * Requirements: Content Management 1.1
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const currentUser = await getCurrentUser();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const workspaceId =
      searchParams.get('workspaceId') || request.headers.get('x-workspace-id');
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

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
    const command = ListFilesCommandSchema.parse({
      workspaceId,
      userId: userId || undefined,
      type: type || undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    // Execute use case
    const fileRepository = new FileRepository();
    const useCase = new ListFilesUseCase(fileRepository);
    const result = await useCase.execute(command);

    // Return files
    return NextResponse.json({
      success: true,
      data: {
        files: result.files.map((file) => ({
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
        })),
        total: result.total,
        limit: result.limit,
        offset: result.offset,
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

    // Handle other errors
    console.error('List files error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while listing files',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/files
 * Upload a new file
 * Requirements: Content Management 1.1, 1.2, 1.3, 1.4
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

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const metadataStr = formData.get('metadata') as string | null;

    if (!file) {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_FILE',
            message: 'File is required',
          },
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse metadata if provided
    let metadata: Record<string, unknown> = {};
    if (metadataStr) {
      try {
        metadata = JSON.parse(metadataStr);
      } catch {
        return NextResponse.json(
          {
            error: {
              code: 'INVALID_METADATA',
              message: 'Invalid metadata JSON',
            },
          },
          { status: 400 }
        );
      }
    }

    // Validate input
    const command = UploadFileCommandSchema.parse({
      workspaceId,
      userId: currentUser.id,
      file: {
        name: file.name,
        type: file.type,
        size: file.size,
        buffer,
      },
      metadata,
    });

    // Execute use case
    const fileRepository = new FileRepository();
    const storage = getFileStorage();
    const useCase = new UploadFileUseCase(fileRepository, storage);
    const uploadedFile = await useCase.execute(command);

    // Return uploaded file
    return NextResponse.json(
      {
        success: true,
        message: 'File uploaded successfully',
        data: {
          id: uploadedFile.getId(),
          workspaceId: uploadedFile.getWorkspaceId(),
          userId: uploadedFile.getUserId(),
          name: uploadedFile.getName(),
          type: uploadedFile.getType(),
          size: uploadedFile.getSize(),
          url: uploadedFile.getUrl(),
          storageKey: uploadedFile.getStorageKey(),
          metadata: uploadedFile.getMetadata(),
          createdAt: uploadedFile.getCreatedAt(),
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
    console.error('Upload file error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while uploading file',
        },
      },
      { status: 500 }
    );
  }
}
