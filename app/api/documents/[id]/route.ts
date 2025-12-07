/**
 * GET /api/documents/[id]
 * PATCH /api/documents/[id]
 * DELETE /api/documents/[id]
 *
 * Handles getting, updating, and deleting individual documents.
 * Requirements: Content Management 2.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { GetDocumentUseCase } from '@/application/use-cases/document/GetDocumentUseCase';
import { UpdateDocumentUseCase } from '@/application/use-cases/document/UpdateDocumentUseCase';
import { DeleteDocumentUseCase } from '@/application/use-cases/document/DeleteDocumentUseCase';
import { DocumentRepository } from '@/infrastructure/repositories/DocumentRepository';
import { z, ZodError } from 'zod';
export const dynamic = 'force-dynamic';



const UpdateDocumentSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
});

/**
 * GET /api/documents/[id]
 * Get a single document
 * Requirements: Content Management 2.2
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    await getCurrentUser();

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

    // Execute use case
    const documentRepository = new DocumentRepository();
    const useCase = new GetDocumentUseCase(documentRepository);
    const document = await useCase.execute({
      documentId: params.id,
      workspaceId,
    });

    if (!document) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Document not found',
          },
        },
        { status: 404 }
      );
    }

    // Return document
    return NextResponse.json({
      success: true,
      data: {
        id: document.getId(),
        workspaceId: document.getWorkspaceId(),
        userId: document.getUserId(),
        title: document.getTitle(),
        content: document.getContent(),
        type: document.getType(),
        fileId: document.getFileId(),
        generationId: document.getGenerationId(),
        createdAt: document.getCreatedAt(),
        updatedAt: document.getUpdatedAt(),
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

    // Handle workspace mismatch
    if (
      error instanceof Error &&
      error.message.includes('does not belong to workspace')
    ) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied',
          },
        },
        { status: 403 }
      );
    }

    // Handle other errors
    console.error('Get document error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while retrieving document',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/documents/[id]
 * Update a document
 * Requirements: Content Management 2.2
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    await getCurrentUser();

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
    const data = UpdateDocumentSchema.parse(body);

    // Execute use case
    const documentRepository = new DocumentRepository();
    const useCase = new UpdateDocumentUseCase(documentRepository);
    const document = await useCase.execute({
      documentId: params.id,
      workspaceId,
      title: data.title,
      content: data.content,
    });

    // Return updated document
    return NextResponse.json({
      success: true,
      message: 'Document updated successfully',
      data: {
        id: document.getId(),
        workspaceId: document.getWorkspaceId(),
        userId: document.getUserId(),
        title: document.getTitle(),
        content: document.getContent(),
        type: document.getType(),
        fileId: document.getFileId(),
        generationId: document.getGenerationId(),
        createdAt: document.getCreatedAt(),
        updatedAt: document.getUpdatedAt(),
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

    // Handle not found
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Document not found',
          },
        },
        { status: 404 }
      );
    }

    // Handle workspace mismatch
    if (
      error instanceof Error &&
      error.message.includes('does not belong to workspace')
    ) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied',
          },
        },
        { status: 403 }
      );
    }

    // Handle other errors
    console.error('Update document error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while updating document',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/documents/[id]
 * Delete a document
 * Requirements: Content Management 2.2
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    await getCurrentUser();

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

    // Execute use case
    const documentRepository = new DocumentRepository();
    const useCase = new DeleteDocumentUseCase(documentRepository);
    await useCase.execute({
      documentId: params.id,
      workspaceId,
    });

    // Return success
    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
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

    // Handle not found
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Document not found',
          },
        },
        { status: 404 }
      );
    }

    // Handle workspace mismatch
    if (
      error instanceof Error &&
      error.message.includes('does not belong to workspace')
    ) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied',
          },
        },
        { status: 403 }
      );
    }

    // Handle other errors
    console.error('Delete document error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while deleting document',
        },
      },
      { status: 500 }
    );
  }
}
