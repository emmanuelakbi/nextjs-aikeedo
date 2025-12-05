import { z } from 'zod';

/**
 * DeleteConversationCommand
 *
 * Command for deleting a conversation.
 * Requirements: 3.5
 */

export const DeleteConversationCommandSchema = z.object({
  conversationId: z.string().uuid('Invalid conversation ID'),
  userId: z.string().uuid('Invalid user ID'),
});

export type DeleteConversationCommand = z.infer<
  typeof DeleteConversationCommandSchema
>;
