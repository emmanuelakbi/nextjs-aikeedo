import { z } from 'zod';

/**
 * GetConversationCommand
 *
 * Command for retrieving a conversation with its messages.
 * Requirements: 3.3
 */

export const GetConversationCommandSchema = z.object({
  conversationId: z.string().uuid('Invalid conversation ID'),
  userId: z.string().uuid('Invalid user ID'),
});

export type GetConversationCommand = z.infer<
  typeof GetConversationCommandSchema
>;
