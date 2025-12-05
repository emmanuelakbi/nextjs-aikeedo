import { z } from 'zod';

/**
 * AddMessageCommand
 *
 * Command for adding a message to a conversation.
 * Requirements: 3.2
 */

export const AddMessageCommandSchema = z.object({
  conversationId: z.string().uuid('Invalid conversation ID'),
  role: z.enum(['user', 'assistant', 'system'], {
    errorMap: () => ({ message: 'Role must be user, assistant, or system' }),
  }),
  content: z.string().min(1, 'Message content is required').trim(),
  tokens: z.number().int().min(0).optional().default(0),
  credits: z.number().int().min(0).optional().default(0),
});

export type AddMessageCommand = z.infer<typeof AddMessageCommandSchema>;
