import { z } from 'zod';

/**
 * RequestPasswordResetCommand
 *
 * Command for requesting a password reset.
 * Requirements: 5.1, 5.2
 */

export const RequestPasswordResetCommandSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase(),
});

export type RequestPasswordResetCommand = z.infer<
  typeof RequestPasswordResetCommandSchema
>;
