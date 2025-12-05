import { z } from 'zod';

/**
 * ResetPasswordCommand
 *
 * Command for resetting a user's password.
 * Requirements: 5.2, 5.3
 */

export const ResetPasswordCommandSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(72, 'Password must not exceed 72 characters'),
});

export type ResetPasswordCommand = z.infer<typeof ResetPasswordCommandSchema>;
