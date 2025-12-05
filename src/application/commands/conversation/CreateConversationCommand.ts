import { z } from 'zod';

/**
 * CreateConversationCommand
 *
 * Command for creating a new conversation.
 * Requirements: 3.1
 */

export const CreateConversationCommandSchema = z.object({
  workspaceId: z.string().uuid('Invalid workspace ID'),
  userId: z.string().uuid('Invalid user ID'),
  title: z.string().min(1, 'Conversation title is required').trim(),
  model: z.string().min(1, 'Model is required'),
  provider: z.string().min(1, 'Provider is required'),
});

export type CreateConversationCommand = z.infer<
  typeof CreateConversationCommandSchema
>;
