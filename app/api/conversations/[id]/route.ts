/**
 * GET /api/conversations/:id
 * DELETE /api/conversations/:id
 *
 * Handles retrieving and deleting individual conversations.
 * Requirements: 3.3, 3.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { GetConversationUseCase } from '@/application/use-cases/conversation/GetConversationUseCase';
import { DeleteConversationUseCase } from '@/application/use-cases/conversation/DeleteConversationUseCase';
import { ConversationRepository } from '@/infrastructure/repositories/ConversationRepository';
import { MessageRepository } from '@/infrastructure/repositories/MessageRepository';
import { GetConversationCommandSchema } from '@/application/commands/conversation/GetConversationCommand';
import { DeleteConversationCommandSchema } from '@/application/commands/conversation/DeleteConversationCommand';
import { ZodError } from 'zod';

/**
 * GET /api/conversations/:id
 * Retrieve a conversation with its messages
 * Requirements: 3.3
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const _currentUser = await getCurrentUser();

    // Validate input
    const command = GetConversationCommandSchema.parse({
      conversationId: params.id,
      userId: currentUser.id,
    });

    // Execute use case
    const conversationRepository = new ConversationRepository();
    const messageRepository = new MessageRepository();
    const useCase = new GetConversationUseCase(
      conversationRepository,
      messageRepository
    );
    const result = await useCase.execute(command);

    // Return conversation with messages
    return NextResponse.json({
      success: true,
      data: {
        conversation: {
          id: result.conversation.getId().getValue(),
          workspaceId: result.conversation.getWorkspaceId(),
          userId: result.conversation.getUserId(),
          title: result.conversation.getTitle(),
          model: result.conversation.getModel(),
          provider: result.conversation.getProvider(),
          createdAt: result.conversation.getCreatedAt(),
          updatedAt: result.conversation.getUpdatedAt(),
        },
        messages: result.messages.map((message) => ({
          id: message.getId().getValue(),
          conversationId: message.getConversationId(),
          role: message.getRole(),
          content: message.getContent(),
          tokens: message.getTokens(),
          credits: message.getCredits(),
          createdAt: message.getCreatedAt(),
        })),
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
            message: error.message,
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
    console.error('Get conversation error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while retrieving conversation',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/conversations/:id
 * Delete a conversation and all its messages
 * Requirements: 3.5
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const _currentUser = await getCurrentUser();

    // Validate input
    const command = DeleteConversationCommandSchema.parse({
      conversationId: params.id,
      userId: currentUser.id,
    });

    // Execute use case
    const conversationRepository = new ConversationRepository();
    const messageRepository = new MessageRepository();
    const useCase = new DeleteConversationUseCase(
      conversationRepository,
      messageRepository
    );
    await useCase.execute(command);

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Conversation deleted successfully',
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
            message: error.message,
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
    console.error('Delete conversation error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while deleting conversation',
        },
      },
      { status: 500 }
    );
  }
}
