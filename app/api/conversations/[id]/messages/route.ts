/**
 * GET /api/conversations/:id/messages
 * POST /api/conversations/:id/messages
 *
 * Handles fetching and adding messages to a conversation.
 * Requirements: 3.2, 3.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { AddMessageUseCase } from '@/application/use-cases/conversation/AddMessageUseCase';
import { MessageRepository } from '@/infrastructure/repositories/MessageRepository';
import { ConversationRepository } from '@/infrastructure/repositories/ConversationRepository';
import { AddMessageCommandSchema } from '@/application/commands/conversation/AddMessageCommand';
import { ZodError } from 'zod';
export const dynamic = 'force-dynamic';



/**
 * GET /api/conversations/:id/messages
 * Get all messages for a conversation
 * Requirements: 3.3
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const currentUser = await getCurrentUser();

    // Fetch messages
    const messageRepository = new MessageRepository();
    const messages = await messageRepository.findByConversationId(params.id);

    // Return messages
    return NextResponse.json({
      success: true,
      data: messages.map((message) => ({
        id: message.getId().getValue(),
        conversationId: message.getConversationId(),
        role: message.getRole(),
        content: message.getContent(),
        tokens: message.getTokens(),
        credits: message.getCredits(),
        createdAt: message.getCreatedAt(),
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
    console.error('Get messages error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching messages',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/conversations/:id/messages
 * Add a message to a conversation
 * Requirements: 3.2
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const currentUser = await getCurrentUser();

    // Parse request body
    const body = await request.json();

    // Validate input
    const command = AddMessageCommandSchema.parse({
      conversationId: params.id,
      ...body,
    });

    // Execute use case
    const messageRepository = new MessageRepository();
    const conversationRepository = new ConversationRepository();
    const useCase = new AddMessageUseCase(
      messageRepository,
      conversationRepository
    );
    const message = await useCase.execute(command);

    // Return created message
    return NextResponse.json(
      {
        success: true,
        message: 'Message added successfully',
        data: {
          id: message.getId().getValue(),
          conversationId: message.getConversationId(),
          role: message.getRole(),
          content: message.getContent(),
          tokens: message.getTokens(),
          credits: message.getCredits(),
          createdAt: message.getCreatedAt(),
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
    console.error('Add message error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while adding message',
        },
      },
      { status: 500 }
    );
  }
}
