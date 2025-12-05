import { z } from 'zod';

/**
 * VerifyEmailCommand
 *
 * Command for verifying a user's email address.
 * Requirements: 4.1, 4.2
 */

export const VerifyEmailCommandSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export type VerifyEmailCommand = z.infer<typeof VerifyEmailCommandSchema>;
