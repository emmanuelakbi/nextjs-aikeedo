import { z } from 'zod';

/**
 * RegisterUserCommand
 *
 * Command for registering a new user.
 * Requirements: 3.1, 3.2, 3.4
 */

export const RegisterUserCommandSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(72, 'Password must not exceed 72 characters'),
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  phoneNumber: z.string().optional().nullable(),
  language: z.string().optional().default('en-US'),
});

export type RegisterUserCommand = z.infer<typeof RegisterUserCommandSchema>;
