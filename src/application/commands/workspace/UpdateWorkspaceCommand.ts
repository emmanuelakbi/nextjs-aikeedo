import { z } from 'zod';

/**
 * UpdateWorkspaceCommand
 *
 * Command for updating workspace information.
 * Requirements: 8.4
 */

export const UpdateWorkspaceCommandSchema = z.object({
  workspaceId: z.string().uuid('Invalid workspace ID'),
  userId: z.string().uuid('Invalid user ID'), // For authorization check
  name: z.string().min(1, 'Workspace name is required').trim().optional(),
});

export type UpdateWorkspaceCommand = z.infer<
  typeof UpdateWorkspaceCommandSchema
>;
