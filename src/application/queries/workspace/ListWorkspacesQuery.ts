import { z } from 'zod';

/**
 * ListWorkspacesQuery
 *
 * Query for retrieving all workspaces for a user.
 * Requirements: 8.3, 8.4
 */

export const ListWorkspacesQuerySchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

export type ListWorkspacesQuery = z.infer<typeof ListWorkspacesQuerySchema>;
