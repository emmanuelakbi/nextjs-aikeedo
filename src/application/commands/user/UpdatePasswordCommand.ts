import { z } from 'zod';

/**
 * UpdatePasswordCommand
 *
 * Command for updating user password.
 * Requirements: 7.4
 */

export const UpdatePasswordCommandSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(72, 'Password must not exceed 72 characters'),
});

export type UpdatePasswordCommand = z.infer<typeof UpdatePasswordCommandSchema>;
