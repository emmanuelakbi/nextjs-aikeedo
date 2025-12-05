import { z } from 'zod';

/**
 * UpdateProfileCommand
 *
 * Command for updating user profile information.
 * Requirements: 7.1, 7.2
 */

export const UpdateProfileCommandSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  firstName: z.string().min(1, 'First name is required').trim().optional(),
  lastName: z.string().min(1, 'Last name is required').trim().optional(),
  phoneNumber: z.string().nullable().optional(),
  language: z.string().optional(),
});

export type UpdateProfileCommand = z.infer<typeof UpdateProfileCommandSchema>;
