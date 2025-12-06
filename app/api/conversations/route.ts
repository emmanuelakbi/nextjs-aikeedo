/**
 * GET /api/conversations
 * POST /api/conversations
 *
 * Handles listing and creating conversations.
 * Requirements: 3.1, 3.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { CreateConversationUseCase } from '@/application/use-cases/conversation/CreateConversationUseCase';
import { ListConversationsUseCase } from '@/application/use-cases/conversation/ListConversationsUseCase';
import { ConversationRepository } from '@/infrastructure/repositories/ConversationRepository';
import { WorkspaceRepository } from '@/infrastructure/repositories/WorkspaceRepository';
import { UserRepository } from '@/infrastructure/repositories/UserRepository';
import { CreateConversationCommandSchema } from '@/application/commands/conversation/CreateConversationCommand';
import { ListConversationsCommandSchema } from '@/application/commands/conversation/ListConversationsCommand';
import { ZodError } from 'zod';

/**
 * GET /api/conversations
 * List conversations with optional filters
 * Requirements: 3.4
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const _currentUser = await getCurrentUser();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const workspaceId =
      searchParams.get('workspaceId') || request.headers.get('x-workspace-id');
    const userId = searchParams.get('userId');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    // Validate input
    const command = ListConversationsCommandSchema.parse({
      workspaceId: workspaceId || undefined,
      userId: userId || undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    // Execute use case with pagination support
    const conversationRepository = new ConversationRepository();

    // Check if pagination is requested
    if (limit || offset) {
      const result = await conversationRepository.listWithPagination({
        workspaceId: command.workspaceId,
        userId: command.userId,
        limit: command.limit,
        offset: command.offset,
      });

      return NextResponse.json({
        success: true,
        data: result.conversations.map((conversation) => ({
          id: conversation.getId().getValue(),
          workspaceId: conversation.getWorkspaceId(),
          userId: conversation.getUserId(),
          title: conversation.getTitle(),
          model: conversation.getModel(),
          provider: conversation.getProvider(),
          createdAt: conversation.getCreatedAt(),
          updatedAt: conversation.getUpdatedAt(),
        })),
        pagination: {
          total: result.total,
          limit: command.limit || 20,
          offset: command.offset || 0,
          hasMore: result.hasMore,
        },
      });
    }

    // Legacy support: return all conversations without pagination
    const useCase = new ListConversationsUseCase(conversationRepository);
    const conversations = await useCase.execute(command);

    // Return conversations
    return NextResponse.json({
      success: true,
      data: conversations.map((conversation) => ({
        id: conversation.getId().getValue(),
        workspaceId: conversation.getWorkspaceId(),
        userId: conversation.getUserId(),
        title: conversation.getTitle(),
        model: conversation.getModel(),
        provider: conversation.getProvider(),
        createdAt: conversation.getCreatedAt(),
        updatedAt: conversation.getUpdatedAt(),
      })),
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
    console.error('List conversations error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while listing conversations',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/conversations
 * Create a new conversation
 * Requirements: 3.1
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const _currentUser = await getCurrentUser();

    // Parse request body
    const body = await request.json();

    // Get workspace ID from header or body
    const workspaceId =
      request.headers.get('x-workspace-id') || body.workspaceId;

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
    const command = CreateConversationCommandSchema.parse({
      userId: currentUser.id,
      workspaceId,
      ...body,
    });

    // Execute use case
    const conversationRepository = new ConversationRepository();
    const workspaceRepository = new WorkspaceRepository();
    const userRepository = new UserRepository();
    const useCase = new CreateConversationUseCase(
      conversationRepository,
      workspaceRepository,
      userRepository
    );
    const conversation = await useCase.execute(command);

    // Return created conversation
    return NextResponse.json(
      {
        success: true,
        message: 'Conversation created successfully',
        data: {
          id: conversation.getId().getValue(),
          workspaceId: conversation.getWorkspaceId(),
          userId: conversation.getUserId(),
          title: conversation.getTitle(),
          model: conversation.getModel(),
          provider: conversation.getProvider(),
          createdAt: conversation.getCreatedAt(),
          updatedAt: conversation.getUpdatedAt(),
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
    console.error('Create conversation error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while creating conversation',
        },
      },
      { status: 500 }
    );
  }
}
