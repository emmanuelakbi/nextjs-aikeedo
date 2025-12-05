import { z } from 'zod';

/**
 * UpdateEmailCommand
 *
 * Command for updating user email address.
 * Requirements: 7.3
 */

export const UpdateEmailCommandSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  newEmail: z.string().email('Invalid email format').toLowerCase(),
});

export type UpdateEmailCommand = z.infer<typeof UpdateEmailCommandSchema>;
