import { z } from 'zod';

/**
 * CreateWorkspaceCommand
 *
 * Command for creating a new workspace.
 * Requirements: 8.1, 8.2
 */

export const CreateWorkspaceCommandSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  name: z.string().min(1, 'Workspace name is required').trim(),
  creditCount: z.number().int().min(0).optional().default(0),
  isTrialed: z.boolean().optional().default(false),
});

export type CreateWorkspaceCommand = z.infer<
  typeof CreateWorkspaceCommandSchema
>;
