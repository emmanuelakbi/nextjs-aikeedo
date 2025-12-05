import { z } from 'zod';

/**
 * LoginUserCommand
 *
 * Command for logging in a user.
 * Requirements: 3.2, 3.3
 */

export const LoginUserCommandSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export type LoginUserCommand = z.infer<typeof LoginUserCommandSchema>;
