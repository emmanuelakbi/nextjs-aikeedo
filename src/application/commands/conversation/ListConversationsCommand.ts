import { z } from 'zod';

/**
 * ListConversationsCommand
 *
 * Command for listing conversations.
 * Requirements: 3.4
 */

export const ListConversationsCommandSchema = z.object({
  workspaceId: z.string().uuid('Invalid workspace ID').optional(),
  userId: z.string().uuid('Invalid user ID').optional(),
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
});

export type ListConversationsCommand = z.infer<
  typeof ListConversationsCommandSchema
>;
