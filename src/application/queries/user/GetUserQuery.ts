import { z } from 'zod';

/**
 * GetUserQuery
 *
 * Query for retrieving user information.
 * Requirements: 7.1
 */

export const GetUserQuerySchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

export type GetUserQuery = z.infer<typeof GetUserQuerySchema>;
