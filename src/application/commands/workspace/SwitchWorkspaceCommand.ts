import { z } from 'zod';

/**
 * SwitchWorkspaceCommand
 *
 * Command for switching the user's current workspace.
 * Requirements: 8.3
 */

export const SwitchWorkspaceCommandSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  workspaceId: z.string().uuid('Invalid workspace ID'),
});

export type SwitchWorkspaceCommand = z.infer<
  typeof SwitchWorkspaceCommandSchema
>;
