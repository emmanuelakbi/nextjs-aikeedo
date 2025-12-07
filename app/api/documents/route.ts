/**
 * GET /api/documents
 * POST /api/documents
 *
 * Handles listing and creating documents.
 * Requirements: Content Management 2.1, 2.2, 2.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { CreateDocumentUseCase } from '@/application/use-cases/document/CreateDocumentUseCase';
import { ListDocumentsUseCase } from '@/application/use-cases/document/ListDocumentsUseCase';
import { SearchDocumentsUseCase } from '@/application/use-cases/document/SearchDocumentsUseCase';
import { DocumentRepository } from '@/infrastructure/repositories/DocumentRepository';
import { z, ZodError } from 'zod';
export const dynamic = 'force-dynamic';



const CreateDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string(),
  type: z.enum(['TEXT', 'IMAGE', 'AUDIO']),
  fileId: z.string().uuid().optional(),
  generationId: z.string().uuid().optional(),
});

const ListDocumentsSchema = z.object({
  workspaceId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  type: z.enum(['TEXT', 'IMAGE', 'AUDIO']).optional(),
  search: z.string().optional(),
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
});

/**
 * GET /api/documents
 * List or search documents
 * Requirements: Content Management 2.2, 2.3
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    await getCurrentUser();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const workspaceId =
      searchParams.get('workspaceId') || request.headers.get('x-workspace-id');
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
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
    const query = ListDocumentsSchema.parse({
      workspaceId,
      userId: userId || undefined,
      type: type || undefined,
      search: search || undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    // Execute use case
    const documentRepository = new DocumentRepository();

    let result;
    if (query.search) {
      const searchUseCase = new SearchDocumentsUseCase(documentRepository);
      result = await searchUseCase.execute({
        workspaceId: query.workspaceId,
        query: query.search,
        userId: query.userId,
        type: query.type,
        limit: query.limit,
        offset: query.offset,
      });
    } else {
      const listUseCase = new ListDocumentsUseCase(documentRepository);
      result = await listUseCase.execute(query);
    }

    // Return documents
    return NextResponse.json({
      success: true,
      data: {
        documents: result.documents.map((doc) => ({
          id: doc.getId(),
          workspaceId: doc.getWorkspaceId(),
          userId: doc.getUserId(),
          title: doc.getTitle(),
          content: doc.getContent(),
          type: doc.getType(),
          fileId: doc.getFileId(),
          generationId: doc.getGenerationId(),
          createdAt: doc.getCreatedAt(),
          updatedAt: doc.getUpdatedAt(),
        })),
        total: result.total,
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
    console.error('List documents error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while listing documents',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/documents
 * Create a new document
 * Requirements: Content Management 2.1
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
    const data = CreateDocumentSchema.parse(body);

    // Execute use case
    const documentRepository = new DocumentRepository();
    const useCase = new CreateDocumentUseCase(documentRepository);
    const document = await useCase.execute({
      workspaceId,
      userId: currentUser.id,
      title: data.title,
      content: data.content,
      type: data.type,
      fileId: data.fileId,
      generationId: data.generationId,
    });

    // Return created document
    return NextResponse.json(
      {
        success: true,
        message: 'Document created successfully',
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

    // Handle other errors
    console.error('Create document error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while creating document',
        },
      },
      { status: 500 }
    );
  }
}
