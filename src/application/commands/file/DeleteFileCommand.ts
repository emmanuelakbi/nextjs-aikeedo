/**
 * Delete File Command
 * Requirements: Content Management 1.1
 */

import { z } from 'zod';

export const DeleteFileCommandSchema = z.object({
  fileId: z.string().uuid(),
  userId: z.string().uuid(),
  workspaceId: z.string().uuid(),
});

export type DeleteFileCommand = z.infer<typeof DeleteFileCommandSchema>;
