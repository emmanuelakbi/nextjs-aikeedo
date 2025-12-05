/**
 * List Files Command
 * Requirements: Content Management 1.1
 */

import { z } from 'zod';

export const ListFilesCommandSchema = z.object({
  workspaceId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  type: z.string().optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});

export type ListFilesCommand = z.infer<typeof ListFilesCommandSchema>;
